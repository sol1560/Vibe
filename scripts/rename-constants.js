#!/usr/bin/env node
/**
 * 常量变量名还原脚本
 *
 * 策略 5: 字符串推断 — 根据常量的字符串/数字值推断可读变量名
 *
 * 目标模式：
 *   (gJl = 'New Chat')           → NEW_CHAT
 *   (Aet = 'composer.startComposerPrompt2') → COMMAND_START_COMPOSER_PROMPT_2
 *   (Fdg = 10)                    → 跳过（纯数字，通常是 magic number）
 *
 * 用法:
 *   node scripts/rename-constants.js [--dry-run]    # 预览，不修改文件
 *   node scripts/rename-constants.js --apply        # 实际执行
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'scripts', 'data');
const MODULE_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

const isDryRun = !process.argv.includes('--apply');

// ============================================================
// Utility functions
// ============================================================

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Walk directory, yield .js file paths
 */
function* walkJS(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkJS(full);
		} else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
			yield full;
		}
	}
}

// ============================================================
// Name derivation from string values
// ============================================================

/**
 * Check if a string looks like a command ID (contains dots, no spaces, not a URL)
 * e.g. 'composer.startComposerPrompt2' → true
 */
function isCommandId(str) {
	return (
		/^[\w]+(\.[\w]+)+$/.test(str) &&
		!str.startsWith('http') &&
		!str.startsWith('//') &&
		str.length < 120
	);
}

/**
 * Check if a string looks like a settings key
 * e.g. 'editor.fontSize', 'cursor.composer.subagentModel'
 */
function isSettingKey(str) {
	return /^[a-z][\w]+(\.[\w]+)+$/.test(str) && !str.includes('://') && str.length < 100;
}

/**
 * Convert camelCase or dot.notation string to UPPER_SNAKE_CASE
 * e.g. 'startComposerPrompt2' → 'START_COMPOSER_PROMPT_2'
 * e.g. 'composer.startComposerPrompt2' → last segment
 */
function toUpperSnake(str) {
	// Strip common prefixes/segments
	let name = str;

	// For dot-notation: take last segment
	if (name.includes('.')) {
		const parts = name.split('.');
		name = parts[parts.length - 1];
	}

	// Insert _ before uppercase letters (camelCase → snake)
	name = name
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.toUpperCase();

	// Insert _ before digits following letters
	name = name.replace(/([A-Z])(\d)/g, '$1_$2');

	// Collapse consecutive underscores
	name = name.replace(/_+/g, '_').replace(/^_|_$/g, '');

	return name;
}

/**
 * Derive a readable constant name from the string value.
 * Returns null if we can't derive a good name.
 */
function deriveNameFromString(value) {
	if (typeof value !== 'string') return null;
	if (value.length === 0) return null;

	// Skip very long strings (multi-sentence descriptions)
	if (value.length > 80) return null;

	// Skip URL-like strings
	if (value.startsWith('http://') || value.startsWith('https://')) {
		// But allow short URL strings
		if (value.length > 50) return null;
		return 'URL_' + toUpperSnake(value.replace(/https?:\/\/[^/]+\//, '').replace(/[^a-z0-9]/gi, '_'));
	}

	// Command IDs like 'composer.startComposerPrompt2'
	if (isCommandId(value)) {
		const parts = value.split('.');
		const prefix = parts.slice(0, -1).join('_').toUpperCase();
		const last = toUpperSnake(parts[parts.length - 1]);
		// Use full path if it's short enough, or just last segment with context
		if (value.length <= 40) {
			return 'CMD_' + toUpperSnake(value.replace(/\./g, '_'));
		}
		return 'CMD_' + last;
	}

	// Settings keys like 'cursor.composer.subagentModel'
	if (isSettingKey(value)) {
		if (value.length <= 50) {
			return 'SETTING_' + toUpperSnake(value.replace(/\./g, '_'));
		}
		const parts = value.split('.');
		return 'SETTING_' + toUpperSnake(parts[parts.length - 1]);
	}

	// Plain strings: words separated by spaces, or camelCase
	// Skip strings with special chars that make naming hard
	if (/[<>{}[\]()=]/.test(value)) return null;

	// Skip version-like strings
	if (/^\d+\.\d+/.test(value)) return null;

	// Short display strings like 'New Chat', 'Show Chat History'
	if (/^[A-Za-z][A-Za-z0-9 _-]*$/.test(value) && value.length <= 40) {
		const snake = value
			.replace(/[-\s]+/g, '_')
			.replace(/[^A-Za-z0-9_]/g, '')
			.toUpperCase();
		if (snake.length >= 3) {
			return snake;
		}
	}

	// camelCase identifiers used as string keys
	if (/^[a-z][a-zA-Z0-9]+$/.test(value) && value.length <= 40) {
		return toUpperSnake(value);
	}

	// hyphenated-ids like 'aichat-container', 'marker-decoration'
	if (/^[a-z][a-z0-9-]+$/.test(value) && value.length <= 50) {
		return value.replace(/-/g, '_').toUpperCase();
	}

	return null;
}

// ============================================================
// Scan file for constant assignments
// ============================================================

/**
 * Pattern: parenthesized assignment list at top level
 *   (VAR = VALUE), (VAR = VALUE), ...
 * Also handles: VAR = VALUE, VAR = VALUE (without parens)
 *
 * We only handle simple scalar values:
 *   string literals, numbers, booleans
 *   NOT object literals, arrays, function calls, etc.
 */
const CONSTANT_ASSIGNMENT_RE = /\(\s*([$\w]+)\s*=\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?|!0|!1|true|false)\s*\)/g;

function extractConstantAssignments(code) {
	const assignments = [];
	let m;

	CONSTANT_ASSIGNMENT_RE.lastIndex = 0;
	while ((m = CONSTANT_ASSIGNMENT_RE.exec(code)) !== null) {
		const varName = m[1];
		const rawValue = m[2];

		// Parse the value
		let value;
		if (rawValue === '!0' || rawValue === 'true') value = true;
		else if (rawValue === '!1' || rawValue === 'false') value = false;
		else if (rawValue.startsWith("'") || rawValue.startsWith('"') || rawValue.startsWith('`')) {
			try {
				// Safe eval of string literal (no dynamic content)
				if (!rawValue.includes('${')) {
					value = rawValue.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
				} else {
					continue; // Template literal with expression
				}
			} catch {
				continue;
			}
		} else {
			value = parseFloat(rawValue);
			if (isNaN(value)) continue;
		}

		assignments.push({ varName, value, rawValue, offset: m.index });
	}

	return assignments;
}

// ============================================================
// Check if variable is safe to rename (no short collision risk)
// ============================================================

/**
 * Only rename variables that are clearly "module-level constants":
 * - appear in the module top-level assignment list
 * - not a short 1-2 char variable (high collision risk)
 * - the value is a non-trivial string
 */
function isSafeToRename(varName, value) {
	// Skip very short names — high collision risk
	if (varName.length <= 2) return false;

	// Skip booleans and numbers — context too ambiguous
	if (typeof value === 'boolean') return false;
	if (typeof value === 'number') return false;

	// Only rename string constants
	if (typeof value !== 'string') return false;

	// Skip empty strings
	if (value.length === 0) return false;

	// Skip strings that are likely CSS variable names or colors
	if (value.startsWith('--') || /^#[0-9a-f]{3,8}$/i.test(value)) return false;

	// Skip template-like strings with % or {{ }}
	if (value.includes('%{') || value.includes('{{')) return false;

	return true;
}

// ============================================================
// Check for name conflicts within the file
// ============================================================

/**
 * Get all existing identifiers used in the file to avoid collisions
 */
function getExistingIdentifiers(code) {
	const identifiers = new Set();
	const re = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
	let m;
	while ((m = re.exec(code)) !== null) {
		identifiers.add(m[1]);
	}
	return identifiers;
}

// ============================================================
// Build rename map for a file
// ============================================================

function buildConstantRenameMap(code, filePath) {
	const assignments = extractConstantAssignments(code);
	if (assignments.length === 0) return new Map();

	// Only process files that look like constant files (many assignments at top level)
	// OR files where constants are a significant portion
	const topLevelAssignments = assignments.filter(a => a.offset < code.length * 0.8);
	if (topLevelAssignments.length < 3) return new Map();

	const existingIds = getExistingIdentifiers(code);
	const renameMap = new Map(); // shortVar → newName
	const usedNewNames = new Set(existingIds); // track to avoid duplicates

	for (const { varName, value } of topLevelAssignments) {
		if (!isSafeToRename(varName, value)) continue;

		// Skip if varName is already descriptive (length > 6 and not all uppercase short code)
		if (varName.length > 8 && /[A-Z][a-z]/.test(varName)) continue;

		const derivedName = deriveNameFromString(value);
		if (!derivedName) continue;

		// Ensure uniqueness
		let finalName = derivedName;
		let suffix = 2;
		while (usedNewNames.has(finalName) && finalName !== varName) {
			finalName = `${derivedName}_${suffix++}`;
		}

		if (finalName !== varName && !renameMap.has(varName)) {
			renameMap.set(varName, finalName);
			usedNewNames.add(finalName);
		}
	}

	return renameMap;
}

// ============================================================
// Apply renames using word-boundary safe replacement
// ============================================================

function applyRenames(code, renameMap) {
	if (renameMap.size === 0) return { code, count: 0 };

	let result = code;
	let count = 0;

	// Sort by length descending (longer names first to avoid partial matches)
	const sorted = [...renameMap.entries()].sort((a, b) => b[0].length - a[0].length);

	for (const [short, long] of sorted) {
		if (short === long) continue;
		const regex = new RegExp(`(?<![\\w$])${escapeRegex(short)}(?![\\w$])`, 'g');
		const before = result;
		result = result.replace(regex, long);
		if (result !== before) {
			const matches = (before.match(regex) || []).length;
			count += matches;
		}
	}

	return { code: result, count };
}

// ============================================================
// Main processing
// ============================================================

async function main() {
	console.log(`[rename-constants] 模式: ${isDryRun ? '预览 (dry-run)' : '实际执行'}`);
	console.log(`[rename-constants] 扫描目录: ${MODULE_DIR}`);

	const globalRenameMap = {}; // { varName: { newName, value, file } }
	const fileRenames = []; // [{ file, renames: Map, replacements }]

	let totalFiles = 0;
	let modifiedFiles = 0;
	let totalRenames = 0;
	let totalReplacements = 0;

	for (const filePath of walkJS(MODULE_DIR)) {
		// Skip non-module files
		if (basename(filePath).startsWith('_')) continue;

		totalFiles++;
		const code = readFileSync(filePath, 'utf-8');
		const renameMap = buildConstantRenameMap(code, filePath);

		if (renameMap.size === 0) continue;

		const { code: newCode, count } = applyRenames(code, renameMap);

		if (count > 0) {
			modifiedFiles++;
			totalRenames += renameMap.size;
			totalReplacements += count;

			const relPath = relative(MODULE_DIR, filePath);

			if (isDryRun) {
				console.log(`\n[preview] ${relPath}`);
				for (const [short, long] of renameMap) {
					console.log(`  ${short} → ${long}`);
				}
			} else {
				writeFileSync(filePath, newCode);
				if (renameMap.size > 5) {
					console.log(`  ✓ ${relPath}: ${renameMap.size} 个变量, ${count} 处替换`);
				}
			}

			// Build global rename map for output
			for (const [short, long] of renameMap) {
				const assignments = extractConstantAssignments(code);
				const assign = assignments.find(a => a.varName === short);
				globalRenameMap[short] = {
					newName: long,
					value: assign?.value ?? '',
					file: relative(MODULE_DIR, filePath),
				};
			}

			fileRenames.push({ file: filePath, renames: renameMap, replacements: count });
		}
	}

	// Write output data
	const outputPath = join(DATA_DIR, 'constant-rename-map.json');
	writeFileSync(outputPath, JSON.stringify(globalRenameMap, null, 2));

	console.log('\n[rename-constants] 完成！');
	console.log(`  扫描文件: ${totalFiles}`);
	console.log(`  修改文件: ${modifiedFiles}`);
	console.log(`  常量重命名: ${totalRenames}`);
	console.log(`  总替换次数: ${totalReplacements}`);
	console.log(`  映射文件: ${outputPath}`);

	if (isDryRun && modifiedFiles > 0) {
		console.log('\n  使用 --apply 参数来实际执行替换');
	}
}

main().catch(e => {
	console.error('[rename-constants] 错误:', e);
	process.exit(1);
});
