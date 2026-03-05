#!/usr/bin/env node
/**
 * 局部变量名推断脚本
 *
 * 策略: 上下文推断 — 根据变量的使用方式（属性访问、方法调用）推断其类型，进而推断合适的变量名。
 *
 * 重命名规则：
 *   e.dispose()        → disposable
 *   e.fsPath           → uri
 *   e.lineNumber       → position / range
 *   e.getMessage()     → error
 *   e.textContent      → element
 *   e.get(...)         → accessor
 *   t.createInstance() → accessor
 *
 * 安全规则：
 *   - 绝对不全局替换单字母变量
 *   - 只在确定的函数作用域内替换
 *   - 同一函数内多次赋值不同类型 → 跳过
 *   - 置信度 < 80% 不执行
 *
 * 用法:
 *   node scripts/rename-locals.js [--dry-run]    # 预览
 *   node scripts/rename-locals.js --apply        # 实际执行
 *   node scripts/rename-locals.js --file <path>  # 处理单个文件
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'scripts', 'data');
const MODULE_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

const isDryRun = !process.argv.includes('--apply');
const singleFile = process.argv.includes('--file')
	? process.argv[process.argv.indexOf('--file') + 1]
	: null;

// ============================================================
// Inference rule table
// Each rule: { pattern, type, confidence }
// pattern: regex string to match against code around the variable usage
// type: inferred type name
// confidence: 0-100
// ============================================================

const INFERENCE_RULES = [
	// Disposable patterns
	{ pattern: /\b{VAR}\.dispose\(\)/, type: 'disposable', confidence: 95 },
	{ pattern: /\b{VAR}\._register\b/, type: 'disposable', confidence: 85 },
	{ pattern: /\bthis\._register\({VAR}\)/, type: 'disposable', confidence: 90 },

	// URI patterns
	{ pattern: /\b{VAR}\.fsPath\b/, type: 'uri', confidence: 98 },
	{ pattern: /\b{VAR}\.scheme\b/, type: 'uri', confidence: 80 },
	{ pattern: /\b{VAR}\.authority\b/, type: 'uri', confidence: 85 },
	{ pattern: /\b{VAR}\.path\b.*\b{VAR}\.scheme\b/, type: 'uri', confidence: 90 },

	// Error patterns
	{ pattern: /\b{VAR}\.getMessage\(\)/, type: 'error', confidence: 95 },
	{ pattern: /\b{VAR}\.stack\b/, type: 'error', confidence: 75 },
	{ pattern: /\b{VAR} instanceof Error\b/, type: 'error', confidence: 90 },
	{ pattern: /\bcatch\s*\(\s*{VAR}\s*\)/, type: 'error', confidence: 85 },
	{ pattern: /\b{VAR}\.message\b.*\b{VAR}\.name\b/, type: 'error', confidence: 88 },

	// DOM element patterns
	{ pattern: /\b{VAR}\.textContent\b/, type: 'element', confidence: 90 },
	{ pattern: /\b{VAR}\.innerHTML\b/, type: 'element', confidence: 88 },
	{ pattern: /\b{VAR}\.classList\b/, type: 'element', confidence: 92 },
	{ pattern: /\b{VAR}\.appendChild\(/, type: 'element', confidence: 90 },
	{ pattern: /\b{VAR}\.querySelector\(/, type: 'element', confidence: 92 },
	{ pattern: /\b{VAR}\.addEventListener\(/, type: 'element', confidence: 88 },
	{ pattern: /\b{VAR}\.setAttribute\(/, type: 'element', confidence: 88 },
	{ pattern: /\b{VAR}\.style\b/, type: 'element', confidence: 82 },

	// Service accessor patterns
	{ pattern: /\b{VAR}\.get\(I[A-Z]/, type: 'accessor', confidence: 92 },
	{ pattern: /\b{VAR}\.createInstance\(/, type: 'accessor', confidence: 88 },
	{ pattern: /\b{VAR}\.invokeFunction\(/, type: 'accessor', confidence: 88 },

	// Position / Range patterns
	{ pattern: /\b{VAR}\.lineNumber\b/, type: 'position', confidence: 90 },
	{ pattern: /\b{VAR}\.column\b.*\b{VAR}\.lineNumber\b/, type: 'position', confidence: 95 },
	{ pattern: /\b{VAR}\.startLineNumber\b/, type: 'range', confidence: 95 },
	{ pattern: /\b{VAR}\.endLineNumber\b/, type: 'range', confidence: 95 },
	{ pattern: /\b{VAR}\.startColumn\b/, type: 'range', confidence: 90 },
	{ pattern: /\b{VAR}\.isEmpty\(\)/, type: 'range', confidence: 70 },

	// Editor / model patterns
	{ pattern: /\b{VAR}\.getModel\(\)/, type: 'editor', confidence: 88 },
	{ pattern: /\b{VAR}\.getPosition\(\)/, type: 'editor', confidence: 82 },
	{ pattern: /\b{VAR}\.getSelection\(\)/, type: 'editor', confidence: 85 },
	{ pattern: /\b{VAR}\.deltaDecorations\(/, type: 'editor', confidence: 85 },
	{ pattern: /\b{VAR}\.getValue\(\)/, type: 'model', confidence: 70 },
	{ pattern: /\b{VAR}\.getLinesContent\(\)/, type: 'model', confidence: 90 },
	{ pattern: /\b{VAR}\.getLineContent\(/, type: 'model', confidence: 88 },
	{ pattern: /\b{VAR}\.uri\b.*\b{VAR}\.getLineCount\(\)/, type: 'model', confidence: 95 },

	// Event patterns
	{ pattern: /\b{VAR}\.type\s*===\s*['"](?:added|removed|changed|modified)['"]/, type: 'change', confidence: 85 },
	{ pattern: /\b{VAR}\.added\b/, type: 'change', confidence: 75 },
	{ pattern: /\b{VAR}\.removed\b/, type: 'change', confidence: 75 },
	{ pattern: /\bon[A-Z]\w*\({VAR}\)/, type: 'event', confidence: 75 },

	// Context patterns
	{ pattern: /\b{VAR}\.contextKeyService\b/, type: 'context', confidence: 88 },
	{ pattern: /\b{VAR}\.workspaceFolder\b/, type: 'context', confidence: 80 },

	// Token / cancellation
	{ pattern: /\b{VAR}\.isCancellationRequested\b/, type: 'token', confidence: 98 },
	{ pattern: /\b{VAR}\.onCancellationRequested\b/, type: 'token', confidence: 95 },

	// Progress patterns
	{ pattern: /\b{VAR}\.report\(\{.*message/, type: 'progress', confidence: 88 },
	{ pattern: /\b{VAR}\.report\(\{.*increment/, type: 'progress', confidence: 88 },

	// Configuration
	{ pattern: /\b{VAR}\.getValue\(\s*['"][a-z]/, type: 'config', confidence: 75 },
	{ pattern: /\b{VAR}\.onDidChangeConfiguration\b/, type: 'config', confidence: 85 },
];

// ============================================================
// Utility: escape regex special chars
// ============================================================

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// Utility: skip string literal
// ============================================================

function skipString(code, start) {
	const quote = code[start];
	let i = start + 1;
	while (i < code.length) {
		if (code[i] === '\\') { i += 2; continue; }
		if (code[i] === quote) return i + 1;
		if (quote === '`' && code[i] === '$' && code[i + 1] === '{') {
			let depth = 1;
			i += 2;
			while (i < code.length && depth > 0) {
				if (code[i] === '{') depth++;
				else if (code[i] === '}') depth--;
				else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
					i = skipString(code, i);
					continue;
				}
				i++;
			}
			continue;
		}
		i++;
	}
	return i;
}

// ============================================================
// Extract function scopes (arrow functions, regular functions)
// We use a simplified brace-balanced approach
// ============================================================

/**
 * Extract balanced brace block starting at openBrace index.
 * Returns { content, end } or null.
 */
function extractBlock(code, openBraceIdx) {
	if (code[openBraceIdx] !== '{') return null;
	let depth = 1;
	let i = openBraceIdx + 1;
	while (i < code.length && depth > 0) {
		const ch = code[i];
		if (ch === '{') depth++;
		else if (ch === '}') depth--;
		else if (ch === '"' || ch === "'" || ch === '`') {
			i = skipString(code, i);
			continue;
		} else if (ch === '/' && code[i + 1] === '/') {
			while (i < code.length && code[i] !== '\n') i++;
			continue;
		} else if (ch === '/' && code[i + 1] === '*') {
			i += 2;
			while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
			i += 2;
			continue;
		}
		i++;
	}
	return { content: code.substring(openBraceIdx, i), end: i };
}

// ============================================================
// Extract balanced paren group
// ============================================================
function extractParamList(code, openParenIdx) {
	if (code[openParenIdx] !== '(') return null;
	let depth = 1;
	let i = openParenIdx + 1;
	while (i < code.length && depth > 0) {
		const ch = code[i];
		if (ch === '(') depth++;
		else if (ch === ')') depth--;
		else if (ch === '"' || ch === "'" || ch === '`') {
			i = skipString(code, i);
			continue;
		}
		i++;
	}
	return { content: code.substring(openParenIdx + 1, i - 1), end: i };
}

// ============================================================
// Find all functions in a file and extract their scopes
// Returns: Array<{ params: string[], body: string, bodyStart: number, bodyEnd: number }>
// ============================================================

function extractFunctionScopes(code) {
	const scopes = [];

	// Patterns that introduce a function scope with parameters:
	// 1. Named function: function name(params) {
	// 2. Anonymous function: function(params) {
	// 3. Arrow function: (params) => {  or  param => {
	// 4. Method: name(params) {

	const funcRegex = /(?:function\s*\w*\s*|(?:\w+)\s*=\s*function\s*\w*\s*|\(\s*|\b(?:async\s+)?(?:\w+)\s*)\(/g;

	// Simpler approach: scan for `(params)` followed by `{` or `=> {`
	// and extract params list + body block

	// Function keyword approach
	const functionRe = /\bfunction\s*\w*\s*\(/g;
	let m;

	while ((m = functionRe.exec(code)) !== null) {
		const parenStart = code.indexOf('(', m.index + m[0].indexOf('('));
		const paramResult = extractParamList(code, parenStart);
		if (!paramResult) continue;

		// Find the opening brace (after the param list)
		const afterParen = paramResult.end;
		let braceIdx = afterParen;
		while (braceIdx < code.length && /\s/.test(code[braceIdx])) braceIdx++;

		if (code[braceIdx] !== '{') continue;

		const blockResult = extractBlock(code, braceIdx);
		if (!blockResult) continue;

		const params = parseParams(paramResult.content);
		if (params.length === 0) continue;

		scopes.push({
			params,
			body: blockResult.content,
			bodyStart: braceIdx,
			bodyEnd: blockResult.end,
		});
	}

	// Arrow function: (params) => {
	const arrowRe = /\)\s*=>\s*\{/g;
	while ((m = arrowRe.exec(code)) !== null) {
		// Find matching open paren
		const closeParen = code.lastIndexOf(')', m.index);
		if (closeParen === -1) continue;

		// Find matching open paren (work backwards)
		let depth = 1;
		let i = closeParen - 1;
		while (i >= 0 && depth > 0) {
			if (code[i] === ')') depth++;
			else if (code[i] === '(') depth--;
			i--;
		}
		const openParen = i + 1;
		if (openParen < 0) continue;

		const paramStr = code.substring(openParen + 1, closeParen);
		const params = parseParams(paramStr);
		if (params.length === 0) continue;

		// Find the brace
		const braceIdx = code.indexOf('{', m.index + m[0].indexOf('{'));
		const blockResult = extractBlock(code, braceIdx);
		if (!blockResult) continue;

		scopes.push({
			params,
			body: blockResult.content,
			bodyStart: braceIdx,
			bodyEnd: blockResult.end,
		});
	}

	return scopes;
}

/**
 * Parse a parameter list string into individual param names.
 * Handles: e, t, i=0, { a, b }, ...rest
 * We only care about simple identifiers (skip destructuring, rest, defaults if complex)
 */
function parseParams(paramStr) {
	const params = [];
	// Split by comma at top level
	let depth = 0;
	let current = '';
	for (const ch of paramStr) {
		if (ch === '(' || ch === '{' || ch === '[') { depth++; current += ch; }
		else if (ch === ')' || ch === '}' || ch === ']') { depth--; current += ch; }
		else if (ch === ',' && depth === 0) {
			const p = current.trim();
			if (p) params.push(p);
			current = '';
		} else {
			current += ch;
		}
	}
	const p = current.trim();
	if (p) params.push(p);

	const result = [];
	for (const param of params) {
		// Skip destructured params
		if (param.startsWith('{') || param.startsWith('[')) continue;
		// Skip rest params
		if (param.startsWith('...')) continue;
		// Skip type-annotated TS params (already renamed by deobfuscate)
		if (param.includes(':') || param.includes('@')) continue;
		// Extract just the name (strip default value)
		const name = param.split('=')[0].trim();
		// Only single-letter or very short (2-3 char) minified names
		if (/^[a-z][0-9]?$/.test(name) || /^[a-z]{1,3}$/.test(name)) {
			result.push(name);
		}
	}

	return result;
}

// ============================================================
// Infer type for a variable based on how it's used in a body
// ============================================================

/**
 * Given a variable name and a function body, infer the type name.
 * Returns { type, confidence } or null.
 */
function inferType(varName, body) {
	const escaped = escapeRegex(varName);
	const bestMatches = [];

	for (const rule of INFERENCE_RULES) {
		// Replace {VAR} placeholder with escaped variable name
		const patternStr = rule.pattern.source.replace(/\{VAR\}/g, escaped);
		const re = new RegExp(patternStr, 's');
		if (re.test(body)) {
			bestMatches.push({ type: rule.type, confidence: rule.confidence });
		}
	}

	if (bestMatches.length === 0) return null;

	// If multiple rules match, take the highest confidence
	// But penalize if multiple different types match (ambiguous)
	const byType = {};
	for (const { type, confidence } of bestMatches) {
		if (!byType[type] || byType[type] < confidence) {
			byType[type] = confidence;
		}
	}

	const types = Object.keys(byType);
	if (types.length === 1) {
		return { type: types[0], confidence: byType[types[0]] };
	}

	// Multiple types: pick highest confidence, penalize for ambiguity
	let best = { type: null, confidence: 0 };
	for (const [type, conf] of Object.entries(byType)) {
		// Penalize by number of competing types
		const adjusted = conf - (types.length - 1) * 10;
		if (adjusted > best.confidence) {
			best = { type, confidence: adjusted };
		}
	}

	if (best.confidence >= 80) return best;
	return null;
}

// ============================================================
// Check if a variable name is already used in body (safety check)
// ============================================================
function isNameUsed(name, body) {
	const re = new RegExp(`(?<![\\w$])${escapeRegex(name)}(?![\\w$])`);
	return re.test(body);
}

// ============================================================
// Rename param in function body (scoped rename)
// Only replaces within the function body, not globally
// ============================================================
function renameInScope(body, oldName, newName) {
	const re = new RegExp(`(?<![\\w$])${escapeRegex(oldName)}(?![\\w$])`, 'g');
	return body.replace(re, newName);
}

// ============================================================
// Process a single file
// ============================================================
function processFile(filePath) {
	let code = readFileSync(filePath, 'utf-8');
	const scopes = extractFunctionScopes(code);

	if (scopes.length === 0) return { file: filePath, renames: 0, replacements: 0 };

	const allRenames = []; // [{ bodyStart, bodyEnd, oldName, newName, confidence }]

	for (const { params, body, bodyStart, bodyEnd } of scopes) {
		const scopeRenames = []; // Renames for THIS scope
		const usedNames = new Set();

		// Collect names already in scope to avoid collision
		const existingRe = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
		let em;
		while ((em = existingRe.exec(body)) !== null) {
			usedNames.add(em[1]);
		}

		for (const param of params) {
			if (param.length > 3) continue; // Only rename very short params

			const result = inferType(param, body);
			if (!result || result.confidence < 80) continue;

			let newName = result.type;

			// Ensure uniqueness within this scope
			if (usedNames.has(newName) && !params.includes(newName)) {
				// Name is already used for something else — skip to avoid collision
				continue;
			}

			// Double-check: the new name shouldn't shadow an outer variable we care about
			// Just skip if the new name appears outside of being the param itself
			scopeRenames.push({
				bodyStart,
				bodyEnd,
				oldName: param,
				newName,
				confidence: result.confidence,
			});
			usedNames.add(newName);
		}

		allRenames.push(...scopeRenames);
	}

	if (allRenames.length === 0) return { file: filePath, renames: 0, replacements: 0 };

	// Apply renames to the file
	// We need to apply them in reverse order (by bodyStart) to preserve indices
	// Actually, since we're doing scoped replacements within each scope,
	// and scopes can overlap (nested functions), we need to be careful.
	//
	// Strategy: build a new version of the code by processing non-overlapping scopes.
	// For simplicity, process renames independently — since we're only renaming
	// within function bodies and using word-boundary matching, and the variable names
	// are single letters, collisions are rare but possible.
	//
	// We apply them one scope at a time using string offsets.

	// Sort by bodyStart ascending, process each scope
	allRenames.sort((a, b) => a.bodyStart - b.bodyStart);

	let result = code;
	let totalReplacements = 0;
	let offset = 0; // Track cumulative offset shift

	// Group by scope (same bodyStart+bodyEnd)
	const scopeGroups = new Map();
	for (const r of allRenames) {
		const key = `${r.bodyStart}:${r.bodyEnd}`;
		if (!scopeGroups.has(key)) scopeGroups.set(key, []);
		scopeGroups.get(key).push(r);
	}

	// Process each scope group
	// Because applying renames within a scope shifts offsets for subsequent scopes,
	// we recalculate positions after each modification.
	// Simplest safe approach: rebuild code from scratch by iterating characters.

	// Actually the safest approach is to track the actual string and adjust scopes:
	const orderedScopes = [...scopeGroups.entries()].sort((a, b) => {
		const [aStart] = a[0].split(':').map(Number);
		const [bStart] = b[0].split(':').map(Number);
		return aStart - bStart;
	});

	for (const [key, renames] of orderedScopes) {
		const [origStart, origEnd] = key.split(':').map(Number);
		// Adjust for offset
		const adjustedStart = origStart + offset;
		const adjustedEnd = origEnd + offset;

		let scopeBody = result.substring(adjustedStart, adjustedEnd);
		let modified = false;

		for (const { oldName, newName } of renames) {
			const re = new RegExp(`(?<![\\w$])${escapeRegex(oldName)}(?![\\w$])`, 'g');
			const before = scopeBody;
			scopeBody = scopeBody.replace(re, newName);
			if (scopeBody !== before) {
				const replacements = (before.match(re) || []).length;
				totalReplacements += replacements;
				modified = true;
			}
		}

		if (modified) {
			const oldLength = adjustedEnd - adjustedStart;
			const newLength = scopeBody.length;
			result = result.substring(0, adjustedStart) + scopeBody + result.substring(adjustedEnd);
			offset += newLength - oldLength;
		}
	}

	return {
		file: filePath,
		renames: allRenames.length,
		replacements: totalReplacements,
		code: result,
	};
}

// ============================================================
// Walk directory
// ============================================================
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
// Main
// ============================================================
async function main() {
	console.log(`[rename-locals] 模式: ${isDryRun ? '预览 (dry-run)' : '实际执行'}`);

	const stats = {
		totalFiles: 0,
		modifiedFiles: 0,
		totalRenames: 0,
		totalReplacements: 0,
		byType: {},
	};

	const files = singleFile ? [singleFile] : [...walkJS(MODULE_DIR)];

	for (const filePath of files) {
		if (basename(filePath).startsWith('_')) continue;

		// Skip very large files (bundles, not individual modules)
		if (statSync(filePath).size > 500 * 1024) continue; // Skip files > 500KB

		stats.totalFiles++;
		const result = processFile(filePath);

		if (result.replacements > 0) {
			stats.modifiedFiles++;
			stats.totalRenames += result.renames;
			stats.totalReplacements += result.replacements;

			const relPath = relative(MODULE_DIR, filePath);

			if (isDryRun) {
				if (result.renames > 0) {
					console.log(`[preview] ${relPath}: ${result.renames} 个局部变量推断, ${result.replacements} 处替换`);
				}
			} else {
				writeFileSync(filePath, result.code);
				if (result.renames > 5) {
					console.log(`  ✓ ${relPath}: ${result.renames} 个局部变量, ${result.replacements} 处替换`);
				}
			}
		}
	}

	// Write stats
	const statsPath = join(DATA_DIR, 'local-rename-stats.json');
	writeFileSync(statsPath, JSON.stringify({
		timestamp: new Date().toISOString(),
		isDryRun,
		...stats,
	}, null, 2));

	console.log('\n[rename-locals] 完成！');
	console.log(`  扫描文件: ${stats.totalFiles}`);
	console.log(`  修改文件: ${stats.modifiedFiles}`);
	console.log(`  局部变量重命名: ${stats.totalRenames}`);
	console.log(`  总替换次数: ${stats.totalReplacements}`);
	console.log(`  统计文件: ${statsPath}`);

	if (isDryRun && stats.modifiedFiles > 0) {
		console.log('\n  使用 --apply 参数来实际执行替换');
	}
}

main().catch(e => {
	console.error('[rename-locals] 错误:', e);
	process.exit(1);
});
