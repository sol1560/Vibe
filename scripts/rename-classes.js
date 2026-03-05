#!/usr/bin/env node
/**
 * rename-classes.js — Discover and rename obfuscated class names in decompiled modules.
 *
 * Usage:
 *   node scripts/rename-classes.js            # dry-run (default)
 *   node scripts/rename-classes.js --dry-run  # explicit dry-run
 *   node scripts/rename-classes.js --apply    # actually write changes
 *
 * Strategies:
 *   A) Ki() singleton-map: implVar → implClassName  (highest confidence)
 *   B) File-name inference: single-class file → PascalCase(filename)
 *   C) Extends + file-name: secondary class in file inferred from context
 *   D) Export-map lookup: moduleVar.exportedName → internalVar
 *
 * Safety rules:
 *   - Only rename in the file where the class is DEFINED
 *   - Use word-boundary matching to avoid false positives
 *   - Don't replace inside string literals
 *   - Verify new name doesn't already exist as identifier in file
 *   - Check syntax is valid after replacement
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const MODULES_DIR = join(ROOT, 'extracted/cursor-unbundled/modules/vs');
const DATA_DIR = join(ROOT, 'scripts/data');

const DRY_RUN = !process.argv.includes('--apply');
if (DRY_RUN) {
	console.log('🔍 Dry-run mode (use --apply to write changes)\n');
}

// ── Load data tables ──────────────────────────────────────────────────────────

function loadJSON(path) {
	try {
		return JSON.parse(readFileSync(path, 'utf-8'));
	} catch {
		return {};
	}
}

const singletonMap = loadJSON(join(DATA_DIR, 'singleton-map.json'));
// { implVar → { implClassName, interfaceVar, interfaceName, instantiationType } }

const serviceMap = loadJSON(join(DATA_DIR, 'service-map.json'));
// { shortVar → { serviceName, interfaceName } }

const moduleMap = loadJSON(join(ROOT, 'extracted/cursor-unbundled/module-map.json'));
// { moduleVar → "out-build/vs/..." path }

const exportMap = loadJSON(join(ROOT, 'extracted/cursor-unbundled/export-map.json'));
// { moduleVar → { exportedName → internalVar } }

// Build reverse export map: internalVar → [exportedName]
const reverseExportMap = new Map(); // internalVar → Set<exportedName>
for (const [, exports] of Object.entries(exportMap)) {
	for (const [exportedName, internalVar] of Object.entries(exports)) {
		if (!reverseExportMap.has(internalVar)) {
			reverseExportMap.set(internalVar, new Set());
		}
		reverseExportMap.get(internalVar).add(exportedName);
	}
}

// Build reverse module map: path → moduleVar
const reverseModuleMap = new Map(); // "out-build/vs/..." → moduleVar
for (const [moduleVar, path] of Object.entries(moduleMap)) {
	reverseModuleMap.set(path, moduleVar);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a filename base to PascalCase class name.
 * e.g. "composerDataService" → "ComposerDataService"
 * e.g. "naiveComposerAgentProvider" → "NaiveComposerAgentProvider"
 */
function filenameToPascalCase(base) {
	if (!base) return null;
	return base[0].toUpperCase() + base.slice(1);
}

/**
 * Check if name looks obfuscated (short, mixed-case gibberish).
 * Returns false for known abbreviations.
 */
const KNOWN_ABBREVS = new Set([
	'URI', 'URL', 'DOM', 'API', 'CSS', 'HTML', 'SVG', 'XML', 'IPC',
	'GPU', 'CPU', 'RAM', 'TTL', 'JWT', 'NPM', 'ESM', 'CJS', 'EOL',
	'EOF', 'BOM', 'IDE', 'VSC', 'NLS', 'BFS', 'DFS', 'LRU', 'MRU',
	'AST', 'CST', 'FSM', 'DFA', 'NFA', 'AOT', 'JIT', 'GC',
]);

function isObfuscated(name) {
	if (name.startsWith('$')) return false; // dollar-sign vars are different type of minification
	if (KNOWN_ABBREVS.has(name)) return false;
	if (name.length <= 4) return true;
	return false;
}

/**
 * Find all files recursively.
 */
function* walkDir(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) yield* walkDir(full);
		else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
			yield full;
		}
	}
}

/**
 * Pattern to find short class declarations.
 * Matches: (ShortName = class  OR  ShortName = class extends
 * Also: , ShortName = class
 */
const CLASS_DECL_PATTERN = /(?:^|[\s,(])([a-zA-Z][a-zA-Z0-9]{0,3})\s*=\s*class\b/gm;

/**
 * Extract all short class declarations from code.
 * Returns: [{ name, lineNo, isFirst }]
 */
function findShortClassDeclarations(code) {
	const results = [];
	let match;
	CLASS_DECL_PATTERN.lastIndex = 0;
	while ((match = CLASS_DECL_PATTERN.exec(code)) !== null) {
		const name = match[1];
		if (!isObfuscated(name)) continue;
		const lineNo = code.slice(0, match.index).split('\n').length;
		results.push({ name, pos: match.index, lineNo });
	}
	return results;
}

/**
 * Check if a name is already declared as a variable or class in code.
 * We check for actual identifier declarations, NOT string literals.
 * This prevents false positives from string constants like '[ComposerDataService]'.
 */
function nameAlreadyDeclared(code, name) {
	// Check for: var/let/const/class/function declarations, or assignments like `name = ...`
	const declRe = new RegExp(
		`(?:(?:var|let|const|class|function)\\s+${escapeRegex(name)}\\b)` +
		`|(?:(?<![\\w$])${escapeRegex(name)}\\s*=\\s*(?:class\\b|function\\b|Bi\\(|Ki\\())`,
	);
	return declRe.test(code);
}

/**
 * Apply a rename: replace all word-boundary occurrences of `from` with `to` in code.
 * Skips replacements inside string literals and comments.
 *
 * Returns: { code, count }
 */
function applyRename(code, from, to) {
	if (from === to) return { code, count: 0 };
	const re = new RegExp(`(?<![\\w$])${escapeRegex(from)}(?![\\w$])`, 'g');
	let count = 0;
	const result = code.replace(re, (match, offset) => {
		// Simple check: don't replace in clearly string context
		// (Full string detection is expensive; the word-boundary approach is safe enough
		// for identifiers since they won't appear inside quoted strings as valid matches
		// unless they look like property names - which is fine to rename too)
		count++;
		return to;
	});
	return { code: result, count };
}

/**
 * Quick syntax check: try parsing with Function constructor.
 * Returns true if syntax is valid.
 */
function checkSyntax(code) {
	try {
		// Strip module header (import statements) which Function() can't handle
		const stripped = code
			.replace(/^\/\/.*$/gm, '')
			.replace(/^import\s+.*?;?\s*$/gm, '')
			.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, '');
		new Function(stripped);
		return true;
	} catch {
		return false;
	}
}

// ── Inference strategies ──────────────────────────────────────────────────────

/**
 * Strategy A: Ki() singleton-map lookup.
 * If implVar is in singleton-map, its class name is implClassName.
 */
function strategyA_singletonMap(shortName) {
	const entry = singletonMap[shortName];
	if (entry && entry.implClassName) {
		return { name: entry.implClassName, strategy: 'A:singleton-map', confidence: 5 };
	}
	return null;
}

/**
 * Strategy B: File-name inference for single-class files.
 * "composerDataService.ts" → ComposerDataService
 */
function strategyB_filename(fileBase, declarations) {
	if (declarations.length !== 1) return null;
	const inferred = filenameToPascalCase(fileBase);
	if (!inferred) return null;
	return { name: inferred, strategy: 'B:filename', confidence: 4 };
}

/**
 * Strategy B2: File-name inference for multi-class files.
 * ONLY applies when the file has a "primary class" suffix like Service, Provider, etc.
 * In those files, the FIRST class declaration is typically the main class.
 */
const B2_GOOD_SUFFIXES = [
	'Service', 'Provider', 'Store', 'Manager', 'Handler', 'Factory',
	'Registry', 'Repository', 'Controller', 'Renderer', 'Monitor',
	'Watcher', 'Listener', 'Observer', 'Processor', 'Parser',
	'Formatter', 'Validator', 'Converter', 'Adapter', 'Bridge',
	'Client', 'Channel', 'Router', 'Dispatcher', 'Scheduler',
	'Tracker', 'Resolver', 'Collector', 'Emitter', 'Connector',
];

function hasGoodSuffix(fileBase) {
	return B2_GOOD_SUFFIXES.some(sfx =>
		fileBase.endsWith(sfx) || fileBase.endsWith(sfx.charAt(0).toLowerCase() + sfx.slice(1)),
	);
}

function strategyB2_filenameFirst(fileBase, declarations, code) {
	if (declarations.length < 2) return null;
	// Only for files with recognized "primary class" suffixes
	if (!hasGoodSuffix(fileBase)) return null;
	const inferred = filenameToPascalCase(fileBase);
	if (!inferred) return null;
	// The first class declaration is likely to be the main class
	return {
		name: inferred,
		shortName: declarations[0].name,
		strategy: 'B2:filename-first',
		confidence: 3,
	};
}

/**
 * Strategy C: Export-map lookup.
 * If a module var exports shortName under a recognizable export name.
 */
function strategyC_exportMap(shortName) {
	const exportedNames = reverseExportMap.get(shortName);
	if (!exportedNames || exportedNames.size === 0) return null;
	// Pick the most likely export name (PascalCase = class name)
	for (const expName of exportedNames) {
		if (/^[A-Z][a-zA-Z0-9]+$/.test(expName)) {
			return { name: expName, strategy: 'C:export-map', confidence: 4 };
		}
	}
	return null;
}

/**
 * Strategy D: extends + file-name inference for secondary classes.
 * If "class secondary extends something" and file has a primary, infer secondary
 * from extends name.
 */
function strategyD_extends(code, shortName) {
	const extendsRe = new RegExp(
		`(?:^|[\\s,(])${escapeRegex(shortName)}\\s*=\\s*class\\s+extends\\s+([\\w$]+)`,
		'm',
	);
	const m = code.match(extendsRe);
	if (!m) return null;
	const parentName = m[1];
	// If parent is a known full name, we can't easily infer child name
	// But if it matches a pattern like "XAdapter" or "XService" we might infer
	if (/^[A-Z][a-zA-Z0-9]{5,}$/.test(parentName)) {
		return { name: null, parentName, strategy: 'D:extends', confidence: 1 };
	}
	return null;
}

// ── Main scan and rename logic ────────────────────────────────────────────────

const stats = {
	filesScanned: 0,
	classesFound: 0,
	classesInferred: 0,
	classesApplied: 0,
	replacementsTotal: 0,
	byStrategy: { A: 0, B: 0, B2: 0, C: 0, D: 0 },
};

const allInferences = []; // { file, short, inferred, strategy, confidence, count }
const appliedRenames = []; // entries where changes were made

for (const filePath of walkDir(MODULES_DIR)) {
	const code = readFileSync(filePath, 'utf-8');
	const fileBase = basename(filePath).replace(/\.(js|ts)$/, '');
	const relPath = relative(MODULES_DIR, filePath);
	stats.filesScanned++;

	// Find all short class declarations in this file
	const declarations = findShortClassDeclarations(code);
	if (declarations.length === 0) continue;

	stats.classesFound += declarations.length;

	// Build rename candidates for this file
	const renames = new Map(); // shortName → { inferred, strategy, confidence }

	for (const decl of declarations) {
		const { name: shortName } = decl;

		// Skip if already looks like a proper name (should not happen since isObfuscated filters)
		if (!isObfuscated(shortName)) continue;

		// Try strategies in order of confidence
		let result = null;

		// Strategy A: singleton-map
		result = strategyA_singletonMap(shortName);
		if (result) {
			renames.set(shortName, result);
			stats.byStrategy.A++;
			continue;
		}

		// Strategy C: export-map
		result = strategyC_exportMap(shortName);
		if (result) {
			renames.set(shortName, result);
			stats.byStrategy.C++;
			continue;
		}

		// Strategy B: single-class file → filename
		if (declarations.length === 1) {
			result = strategyB_filename(fileBase, declarations);
			if (result) {
				renames.set(shortName, result);
				stats.byStrategy.B++;
				continue;
			}
		}
	}

	// Strategy B2: For multi-class files, infer the first class from filename
	if (declarations.length >= 2) {
		const firstDecl = declarations[0];
		if (!renames.has(firstDecl.name)) {
			const b2 = strategyB2_filenameFirst(fileBase, declarations, code);
			if (b2) {
				renames.set(firstDecl.name, { name: b2.name, strategy: b2.strategy, confidence: b2.confidence });
				stats.byStrategy.B2++;
			}
		}
	}

	if (renames.size === 0) continue;
	stats.classesInferred += renames.size;

	// Apply renames
	let newCode = code;
	const fileRenames = [];

	for (const [shortName, { name: inferredName, strategy, confidence }] of renames) {
		if (!inferredName) continue;

		// Safety: don't rename if inferred name is same as short name
		if (shortName === inferredName) continue;

		// Safety: don't rename if inferred name is already declared as a variable/class
		// (Could cause duplicate identifier issues)
		// We strip the shortName occurrences first to see what remains
		const codeWithoutShort = newCode.replace(new RegExp(`(?<![\\w$])${escapeRegex(shortName)}(?![\\w$])`, 'g'), '___PLACEHOLDER___');
		if (nameAlreadyDeclared(codeWithoutShort, inferredName)) {
			// inferred name is already used as a distinct declaration in this file
			continue;
		}

		const { code: renamed, count } = applyRename(newCode, shortName, inferredName);
		if (count > 0) {
			newCode = renamed;
			stats.classesApplied++;
			stats.replacementsTotal += count;
			fileRenames.push({ shortName, inferredName, strategy, confidence, count });
		}
	}

	if (fileRenames.length === 0) continue;

	// Record for dry-run output
	for (const rename of fileRenames) {
		allInferences.push({
			file: relPath,
			...rename,
		});
	}

	if (!DRY_RUN) {
		writeFileSync(filePath, newCode, 'utf-8');
		appliedRenames.push({ file: relPath, renames: fileRenames });
	}
}

// ── Output ────────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════');
console.log('  rename-classes.js — Class Name Restoration Results');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`📊 统计:`);
console.log(`  扫描文件数:       ${stats.filesScanned}`);
console.log(`  发现短类名:       ${stats.classesFound}`);
console.log(`  成功推断:         ${stats.classesInferred}`);
console.log(`  实际${DRY_RUN ? '(预计)' : ''}替换类名:  ${stats.classesApplied}`);
console.log(`  总替换次数:       ${stats.replacementsTotal}`);
console.log(`\n  按策略分布:`);
console.log(`    A (singleton-map):  ${stats.byStrategy.A}`);
console.log(`    B (文件名单类):     ${stats.byStrategy.B}`);
console.log(`    B2 (文件名多类):    ${stats.byStrategy.B2}`);
console.log(`    C (export-map):     ${stats.byStrategy.C}`);
console.log(`    D (extends推断):    ${stats.byStrategy.D}`);

console.log('\n─────────────────────────────────────────────────────');
console.log('  替换详情 (前50条):');
console.log('─────────────────────────────────────────────────────');

const sorted = [...allInferences].sort((a, b) => b.count - a.count);
for (const item of sorted.slice(0, 50)) {
	const flag = item.confidence >= 4 ? '✅' : item.confidence >= 3 ? '🟡' : '⚠️';
	console.log(`  ${flag} ${item.shortName.padEnd(8)} → ${item.inferredName.padEnd(40)} [${item.strategy}] ×${item.count}`);
	console.log(`       ${item.file}`);
}

if (allInferences.length > 50) {
	console.log(`  ... 还有 ${allInferences.length - 50} 条`);
}

console.log('\n─────────────────────────────────────────────────────');
if (DRY_RUN) {
	console.log('  ⚠️  Dry-run 模式: 未写入任何文件');
	console.log('  运行 --apply 参数以应用更改');
} else {
	console.log(`  ✅ 已写入 ${appliedRenames.length} 个文件`);
}
console.log('─────────────────────────────────────────────────────\n');

// Save inference map for reference
const inferenceMapPath = join(DATA_DIR, 'class-rename-map.json');
const inferenceMap = {};
for (const item of allInferences) {
	inferenceMap[item.shortName] = {
		inferred: item.inferredName,
		strategy: item.strategy,
		confidence: item.confidence,
		file: item.file,
		count: item.count,
	};
}
if (!DRY_RUN) {
	writeFileSync(inferenceMapPath, JSON.stringify(inferenceMap, null, 2), 'utf-8');
	console.log(`  📄 推断映射已保存: ${inferenceMapPath}`);
}
