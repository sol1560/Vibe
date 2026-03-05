#!/usr/bin/env node
/**
 * 将 esbuild 运行时模式还原为标准 ES module 语法
 *
 * 拆包后的模块使用 esbuild 运行时函数：
 *   - 模块依赖调用：Qt(), Od(), $ye() 等 → import 语句
 *   - Bi("serviceId") → createDecorator() 调用（VS Code DI 服务注册）
 *   - export-map.json 中的 GN() 导出 → export 语句
 *
 * 本脚本利用 unbundle.js 输出的 module-map.json、export-map.json 和
 * dependency-graph.json 完成精确还原。
 *
 * 实际代码模式（逆向确认）：
 *   aiService.js:     "use strict";Qt(),(function(n){...})(wHg||(wHg={})),IAiService=Bi("aiService")
 *   constants.js:     "use strict";Od(),Ov(),Jg(),Hi(),bl(),gJl="New Chat",...
 *   mcpServiceTypes.js: "use strict";Qt(),$ye(),DU=Bi("mcpService")
 *
 * 其中 Qt, Od, $ye 等是 module-map 中的模块变量名，Qt() 表示执行该依赖模块。
 *
 * 用法: node scripts/restore-imports.js [input-dir] [--dry-run]
 *   input-dir — 默认 extracted/cursor-unbundled/
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname, extname } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'extracted/cursor-unbundled');

// ─── Parse CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
let inputDir = DEFAULT_INPUT;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
	if (args[i] === '--dry-run') {
		dryRun = true;
	} else if (!args[i].startsWith('--')) {
		inputDir = resolve(args[i]);
	}
}

// ─── Load Mapping Tables ─────────────────────────────────────────

const moduleMapPath = join(inputDir, 'module-map.json');
const exportMapPath = join(inputDir, 'export-map.json');
const depGraphPath = join(inputDir, 'dependency-graph.json');

if (!existsSync(moduleMapPath)) {
	console.error(`[restore-imports] 错误: 找不到 ${moduleMapPath}`);
	console.error('请先运行 unbundle.js 生成映射表');
	process.exit(1);
}

/** @type {Record<string, string>} varName → module path */
const moduleMap = JSON.parse(readFileSync(moduleMapPath, 'utf8'));

/** @type {Record<string, Record<string, string>>} exportVar → {exportName: localName} */
const exportMap = existsSync(exportMapPath)
	? JSON.parse(readFileSync(exportMapPath, 'utf8'))
	: {};

/** @type {Record<string, string[]>} module path → [dependency paths] */
const depGraph = existsSync(depGraphPath)
	? JSON.parse(readFileSync(depGraphPath, 'utf8'))
	: {};

// Build reverse map: path → varName
const pathToVar = new Map();
for (const [varName, modPath] of Object.entries(moduleMap)) {
	pathToVar.set(modPath, varName);
}

// Build set of all module variable names for fast lookup
const moduleVarSet = new Set(Object.keys(moduleMap));

// Build module path → export-map lookup
// The export-map keys are export container variables (e.g., Ghg), not module vars.
// We need to match them to modules. The unbundle dep-graph has the module paths,
// and we can try to match based on which module's code references the exports.
// For now, we'll match exports to modules by checking the dep-graph and var references.
// Actually, let's also load the scripts/data/service-map.json if available for Bi→service mappings.

console.log(`[restore-imports] 加载映射表:`);
console.log(`  module-map: ${Object.keys(moduleMap).length} 个模块变量`);
console.log(`  export-map: ${Object.keys(exportMap).length} 个导出组`);
console.log(`  dep-graph:  ${Object.keys(depGraph).length} 个模块`);

// ─── Header Parsing ──────────────────────────────────────────────

/**
 * Split file content into metadata header and code body.
 * Also extract structured metadata from header comments.
 */
function parseFile(content) {
	const lines = content.split('\n');
	let headerEnd = 0;
	const meta = {
		modulePath: null,
		varName: null,
		type: null,
		dependencies: [],
		exports: []
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.startsWith('// Module:')) {
			meta.modulePath = line.replace('// Module:', '').trim();
			headerEnd = i + 1;
		} else if (line.startsWith('// Variable:')) {
			meta.varName = line.replace('// Variable:', '').trim();
			headerEnd = i + 1;
		} else if (line.startsWith('// Type:')) {
			meta.type = line.replace('// Type:', '').trim();
			headerEnd = i + 1;
		} else if (line.startsWith('// Dependencies:')) {
			meta.dependencies = line.replace('// Dependencies:', '').trim()
				.split(',').map(s => s.trim()).filter(Boolean);
			headerEnd = i + 1;
		} else if (line.startsWith('// Exports:')) {
			meta.exports = line.replace('// Exports:', '').trim()
				.split(',').map(s => s.trim()).filter(Boolean);
			headerEnd = i + 1;
		} else if (line === '') {
			headerEnd = i + 1;
		} else {
			break;
		}
	}

	const header = lines.slice(0, headerEnd).join('\n');
	const body = lines.slice(headerEnd).join('\n');
	return { header, body, meta };
}

// ─── Dependency Call Detection ───────────────────────────────────

/**
 * Extract leading dependency calls from code body.
 *
 * Minified form: "use strict";Qt(),Od(),Jg(),Hi(),bl(),<actual code>
 * Formatted form:
 *   'use strict';
 *   (Qt(),
 *     Od(),
 *     Jg(),
 *     Hi(),
 *     bl(),
 *     <actual code>);
 *
 * Returns { depVarNames: string[], cleanedBody: string }
 */
function extractLeadingDependencyCalls(body) {
	let code = body;
	const depVarNames = [];

	// Step 1: Remove "use strict" prefix
	code = code.replace(/^["']use strict["']\s*;?\s*/, '');

	// Step 2: Extract leading dependency call chain
	// Minified pattern: VarName(),VarName2(),VarName3(),...
	// Each call is: identifier followed by ()
	// The chain ends when we encounter something that's not a call+comma

	// Handle formatted form first: starts with ( and contains call chain
	const formattedMatch = code.match(/^\(\s*/);
	let inFormattedWrapper = false;

	if (formattedMatch) {
		// Check if this is a formatted dependency chain: (Qt(),\n  Od(),\n ...
		const afterParen = code.substring(formattedMatch[0].length);
		const firstCallMatch = afterParen.match(/^(\w+)\(\)\s*,/);
		if (firstCallMatch && moduleVarSet.has(firstCallMatch[1])) {
			inFormattedWrapper = true;
			code = afterParen;
		}
	}

	// Now extract the call chain
	let pos = 0;
	while (pos < code.length) {
		// Skip whitespace
		while (pos < code.length && /\s/.test(code[pos])) pos++;

		// Try to match: identifier()
		const callMatch = code.substring(pos).match(/^(\$?\w+)\(\)\s*/);
		if (!callMatch) break;

		const varName = callMatch[1];

		// Is this a known module variable?
		if (!moduleVarSet.has(varName)) break;

		depVarNames.push(varName);
		pos += callMatch[0].length;

		// Check for comma (chain continues) or end
		if (pos < code.length && code[pos] === ',') {
			pos++; // skip comma
			// Skip whitespace/newlines after comma
			while (pos < code.length && /\s/.test(code[pos])) pos++;
		} else {
			break;
		}
	}

	// What's left after the dependency calls is the actual code
	let cleanedBody = code.substring(pos);

	// If we were in a formatted wrapper, the code may end with );
	// Check if cleanedBody is wrapped: starts with real code and ends with );
	if (inFormattedWrapper) {
		cleanedBody = cleanedBody.trimEnd();
		if (cleanedBody.endsWith(');')) {
			// Remove trailing ); — but only the outer wrapper, not inner code
			// We need to check if it's the wrapper's closing
			// Simple heuristic: if the last ); has no matching ( in the remaining code
			// at the same depth, it's the wrapper
			cleanedBody = cleanedBody.slice(0, -2).trimEnd();
		}
	}

	return { depVarNames, cleanedBody };
}

// ─── Bi() Replacement ────────────────────────────────────────────

/**
 * Find and replace all Bi("serviceId") calls with createDecorator('serviceId').
 * Returns { code, count, needsImport }
 */
function replaceBiCalls(code) {
	let count = 0;
	const replaced = code.replace(/\bBi\s*\(\s*"([^"]+)"\s*\)/g, (match, serviceId) => {
		count++;
		return `createDecorator('${serviceId}')`;
	});
	return { code: replaced, count, needsImport: count > 0 };
}

// ─── Import Path Normalization ───────────────────────────────────

/**
 * Convert an absolute module path to a relative import path.
 */
function normalizeImportPath(targetPath, currentPath) {
	if (!currentPath || !targetPath) return targetPath;

	// Strip common prefixes
	let target = targetPath.replace(/^out-build\//, '');
	let current = currentPath.replace(/^out-build\//, '');

	// Remove .js extensions for cleaner imports
	target = target.replace(/\.js$/, '');

	// For node_modules paths, use package names
	if (targetPath.startsWith('node_modules/')) {
		return targetPath.replace(/^node_modules\//, '').replace(/\.js$/, '');
	}

	// For paths outside out-build (src/, packages/, etc.), keep as-is
	if (!targetPath.startsWith('out-build/')) {
		return targetPath.replace(/\.js$/, '');
	}

	// Compute relative path
	const currentDir = dirname(current);
	const targetParts = target.split('/');
	const currentParts = currentDir.split('/');

	// Find common prefix length
	let commonLen = 0;
	while (commonLen < targetParts.length &&
		commonLen < currentParts.length &&
		targetParts[commonLen] === currentParts[commonLen]) {
		commonLen++;
	}

	// Build relative path
	const upCount = currentParts.length - commonLen;
	const remaining = targetParts.slice(commonLen).join('/');

	if (upCount === 0) {
		return './' + remaining;
	}
	return '../'.repeat(upCount) + remaining;
}

// ─── Module Variable References (Deeper Scan) ────────────────────

/**
 * Scan code for references to module variables BEYOND the leading call chain.
 * These are property accesses like `hf.SOME_CONSTANT` where hf is a module var.
 * We only check vars that appear in this module's dependency list to avoid O(n^2).
 */
function findModuleVarReferences(code, depPaths) {
	const refs = new Map(); // varName → Set<property>

	for (const depPath of depPaths) {
		const varName = pathToVar.get(depPath);
		if (!varName || varName.length < 2) continue;

		// Check if this var appears with property access in the code
		const regex = new RegExp(`\\b${escapeRegex(varName)}\\.(\\w+)`, 'g');
		let match;
		while ((match = regex.exec(code)) !== null) {
			if (!refs.has(varName)) refs.set(varName, new Set());
			refs.get(varName).add(match[1]);
		}
	}

	return refs;
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Export Resolution ───────────────────────────────────────────

/**
 * Try to find exports for a module.
 * The export-map keys are export container variables (not module vars),
 * so we need to try matching by module variable name from the header.
 */
function findModuleExports(modulePath, moduleVarName) {
	// Direct path match
	if (exportMap[modulePath]) return exportMap[modulePath];

	// Try matching by variable name
	if (moduleVarName && exportMap[moduleVarName]) return exportMap[moduleVarName];

	// Try the dep-graph to see if the export-map var corresponds to this module
	// This is expensive — skip for now and rely on the header exports list
	return null;
}

// ─── Main Transform ─────────────────────────────────────────────

function transformModule(filePath, content) {
	const { header, body, meta } = parseFile(content);

	if (!body.trim()) return null;

	// Step 1: Extract leading dependency calls and clean the body
	const { depVarNames, cleanedBody } = extractLeadingDependencyCalls(body);

	// Step 2: Replace Bi() calls
	const biResult = replaceBiCalls(cleanedBody);
	let transformedBody = biResult.code;

	// Step 3: Build import list from dependency calls
	const importLines = [];
	const importedPaths = new Set();

	// Track if instantiation module is used by Bi→createDecorator
	const instantiationPath = 'out-build/vs/platform/instantiation/common/instantiation.js';
	const biNeedsInstantiation = biResult.needsImport;

	// Convert dependency calls to side-effect imports
	for (const varName of depVarNames) {
		const depPath = moduleMap[varName];
		if (depPath && !importedPaths.has(depPath)) {
			importedPaths.add(depPath);
			const importPath = normalizeImportPath(depPath, meta.modulePath);

			// If this is the instantiation module and we need createDecorator,
			// use a named import instead of side-effect
			if (biNeedsInstantiation && depPath === instantiationPath) {
				importLines.push(
					`import { createDecorator } from '${importPath}';`
				);
			} else {
				importLines.push(`import '${importPath}';`);
			}
		}
	}

	// If Bi() was found but instantiation wasn't a dependency call,
	// add the import separately
	if (biNeedsInstantiation && !importedPaths.has(instantiationPath)) {
		importLines.push(
			"import { createDecorator } from 'vs/platform/instantiation/common/instantiation';"
		);
		importedPaths.add(instantiationPath);
	}

	// Step 4: Find property-access references to module vars in the remaining code
	// Use the Dependencies header for the candidate set
	if (meta.dependencies.length > 0) {
		const varRefs = findModuleVarReferences(transformedBody, meta.dependencies);
		for (const [varName, properties] of varRefs) {
			const depPath = moduleMap[varName];
			if (depPath && !importedPaths.has(depPath)) {
				importedPaths.add(depPath);
				const importPath = normalizeImportPath(depPath, meta.modulePath);
				// Namespace import since we access properties
				importLines.push(`import * as ${varName} from '${importPath}';`);
			} else if (depPath && importedPaths.has(depPath)) {
				// Already imported as side-effect — upgrade to namespace import
				const importPath = normalizeImportPath(depPath, meta.modulePath);
				const sideEffectLine = `import '${importPath}';`;
				const idx = importLines.indexOf(sideEffectLine);
				if (idx !== -1) {
					importLines[idx] = `import * as ${varName} from '${importPath}';`;
				}
			}
		}
	}

	// Step 5: Build export list
	const exportLines = [];
	if (meta.exports.length > 0) {
		exportLines.push(`export { ${meta.exports.join(', ')} };`);
	} else {
		// Try to find exports from export-map
		const modExports = findModuleExports(meta.modulePath, meta.varName);
		if (modExports && Object.keys(modExports).length > 0) {
			const namedExports = Object.entries(modExports)
				.map(([exportName, localName]) =>
					exportName === localName ? exportName : `${localName} as ${exportName}`)
				.join(', ');
			exportLines.push(`export { ${namedExports} };`);
		}
	}

	// Check if anything changed
	if (importLines.length === 0 && exportLines.length === 0 &&
		biResult.count === 0 && depVarNames.length === 0) {
		return null;
	}

	// Step 6: Assemble output
	const sections = [];

	if (header.trim()) {
		sections.push(header.trimEnd());
	}

	if (importLines.length > 0) {
		sections.push(importLines.join('\n'));
	}

	if (transformedBody.trim()) {
		sections.push(transformedBody.trim());
	}

	if (exportLines.length > 0) {
		sections.push(exportLines.join('\n'));
	}

	return {
		content: sections.join('\n\n') + '\n',
		importCount: importLines.length,
		exportCount: exportLines.length,
		biCount: biResult.count,
		depCallCount: depVarNames.length
	};
}

// ─── File Discovery ──────────────────────────────────────────────

function findJSFiles(dir) {
	const files = [];
	try {
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				files.push(...findJSFiles(fullPath));
			} else if (extname(entry.name) === '.js') {
				files.push(fullPath);
			}
		}
	} catch { /* directory doesn't exist */ }
	return files;
}

// ─── Main ────────────────────────────────────────────────────────

const modulesDir = join(inputDir, 'modules');
console.log(`\n[restore-imports] 扫描 ${modulesDir} ...`);
const files = findJSFiles(modulesDir);
console.log(`[restore-imports] 发现 ${files.length} 个 JS 文件`);

if (dryRun) {
	console.log('[restore-imports] 模式: dry-run (不修改文件)');
}

const stats = {
	transformed: 0,
	skipped: 0,
	failed: 0,
	totalImports: 0,
	totalExports: 0,
	totalBiCalls: 0,
	totalDepCalls: 0
};
const failures = [];

for (let i = 0; i < files.length; i++) {
	const file = files[i];
	const relPath = relative(modulesDir, file);

	try {
		const content = readFileSync(file, 'utf8');
		const result = transformModule(file, content);

		if (result === null) {
			stats.skipped++;
			continue;
		}

		stats.totalImports += result.importCount;
		stats.totalExports += result.exportCount;
		stats.totalBiCalls += result.biCount;
		stats.totalDepCalls += result.depCallCount;

		if (!dryRun) {
			writeFileSync(file, result.content);
		}

		stats.transformed++;
		process.stdout.write('.');

	} catch (err) {
		stats.failed++;
		failures.push({ file: relPath, reason: err.message });
		process.stdout.write('x');
	}

	if ((i + 1) % 200 === 0) {
		process.stdout.write(` [${i + 1}/${files.length}]\n`);
	}
}

console.log('\n');
console.log('[restore-imports] === 结果 ===');
console.log(`  转换成功: ${stats.transformed}`);
console.log(`  已跳过 (无需更改): ${stats.skipped}`);
console.log(`  失败: ${stats.failed}`);
console.log(`  依赖调用→import: ${stats.totalDepCalls}`);
console.log(`  生成 import 语句: ${stats.totalImports}`);
console.log(`  生成 export 语句: ${stats.totalExports}`);
console.log(`  Bi→createDecorator: ${stats.totalBiCalls}`);

if (failures.length > 0) {
	console.log('\n[restore-imports] 失败文件:');
	for (const f of failures.slice(0, 20)) {
		console.log(`  ${f.file}: ${f.reason}`);
	}
	if (failures.length > 20) {
		console.log(`  ... 还有 ${failures.length - 20} 个`);
	}
}

console.log('\n[restore-imports] 完成!');
