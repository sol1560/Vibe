#!/usr/bin/env node
/**
 * 批量格式化拆包后的 Cursor 模块文件
 *
 * 对 unbundle.js 输出的每个模块文件执行 prettier 格式化，
 * 使原本一行压缩的代码变为可读的多行代码。
 *
 * 用法: node scripts/format-modules.js [input-dir] [--concurrency N] [--dry-run]
 *   input-dir   — 默认 extracted/cursor-unbundled/modules/
 *   --concurrency N — 并发进程数（默认 8）
 *   --dry-run   — 仅显示统计，不实际修改文件
 *
 * 策略:
 *   1. 保留文件顶部的 // Module: / // Variable: 等元数据注释
 *   2. 将代码体包裹在 IIFE 中使 prettier 能解析
 *   3. 格式化后拆掉 IIFE 包裹
 *   4. 还原元数据注释 + 格式化后的代码体
 *   5. 对 prettier 失败的文件回退到 js-beautify 风格的简易格式化
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

// ─── Parse CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
let inputDir = DEFAULT_INPUT;
let concurrency = 8;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
	if (args[i] === '--concurrency' && args[i + 1]) {
		concurrency = parseInt(args[i + 1], 10);
		i++;
	} else if (args[i] === '--dry-run') {
		dryRun = true;
	} else if (!args[i].startsWith('--')) {
		inputDir = resolve(args[i]);
	}
}

// ─── File Discovery ──────────────────────────────────────────────

function findJSFiles(dir) {
	const files = [];
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findJSFiles(fullPath));
		} else if (extname(entry.name) === '.js') {
			files.push(fullPath);
		}
	}
	return files;
}

// ─── Metadata Header Parsing ─────────────────────────────────────

/**
 * Split file into metadata header comments and code body.
 * Metadata lines start with "// Module:", "// Variable:", "// Type:",
 * "// Dependencies:", "// Exports:" — or are blank lines between them.
 */
function splitHeaderAndBody(content) {
	const lines = content.split('\n');
	let headerEnd = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.startsWith('// Module:') ||
			line.startsWith('// Variable:') ||
			line.startsWith('// Type:') ||
			line.startsWith('// Dependencies:') ||
			line.startsWith('// Exports:') ||
			line === '') {
			headerEnd = i + 1;
		} else {
			break;
		}
	}

	const header = lines.slice(0, headerEnd).join('\n');
	const body = lines.slice(headerEnd).join('\n');
	return { header, body };
}

// ─── Prettier Formatting ─────────────────────────────────────────

/**
 * Format code using prettier via CLI.
 * Wraps in IIFE to help prettier parse code fragments,
 * then unwraps the result.
 */
function formatWithPrettier(code) {
	// Wrap code fragment in IIFE
	const wrapped = '(function () {\n' + code + '\n})();\n';

	// Write to temp file, format, read back
	const tmpFile = join(PROJECT_ROOT, `.fmt-tmp-${process.pid}-${Date.now()}.js`);
	try {
		writeFileSync(tmpFile, wrapped);
		execSync(
			`npx prettier --parser babel --print-width 100 --single-quote --tab-width 2 --trailing-comma all --write "${tmpFile}" 2>/dev/null`,
			{ timeout: 30000 }
		);
		const formatted = readFileSync(tmpFile, 'utf8');

		// Unwrap IIFE
		return unwrapIIFE(formatted);
	} finally {
		try { execSync(`rm -f "${tmpFile}"`, { stdio: 'ignore' }); } catch { /* noop */ }
	}
}

/**
 * Remove the IIFE wrapper that was added for prettier parsing.
 */
function unwrapIIFE(code) {
	const lines = code.split('\n');

	// Find the opening wrapper line
	let startIdx = -1;
	for (let i = 0; i < Math.min(lines.length, 3); i++) {
		const trimmed = lines[i].trim();
		if (trimmed === '(function () {' || trimmed === '(function() {') {
			startIdx = i;
			break;
		}
	}

	// Find the closing wrapper line
	let endIdx = -1;
	for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
		const trimmed = lines[i].trim();
		if (trimmed === '})();' || trimmed === '})()') {
			endIdx = i;
			break;
		}
	}

	if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
		// Cannot identify wrapper — return as-is with minimal cleanup
		return code;
	}

	// Extract inner lines and remove one level of indentation
	const inner = lines.slice(startIdx + 1, endIdx);
	return inner.map(line => {
		if (line.startsWith('  ')) return line.substring(2);
		if (line.startsWith('\t')) return line.substring(1);
		return line;
	}).join('\n').trim() + '\n';
}

// ─── Fallback Simple Formatter ───────────────────────────────────

/**
 * Basic formatting for files that prettier cannot parse.
 * Applies:
 *   - Newlines after semicolons (not inside strings or parens)
 *   - Newlines after opening braces
 *   - Newlines before closing braces
 *   - Basic indentation based on brace depth
 */
function fallbackFormat(code) {
	// First pass: insert newlines at statement boundaries
	const tokens = [];
	let i = 0;
	let depth = 0;
	let parenDepth = 0;
	let lastBreak = 0;

	while (i < code.length) {
		const ch = code[i];

		// Skip strings
		if (ch === '"' || ch === "'" || ch === '`') {
			const start = i;
			i++;
			while (i < code.length) {
				if (code[i] === '\\') { i += 2; continue; }
				if (code[i] === ch) { i++; break; }
				if (ch === '`' && code[i] === '$' && code[i + 1] === '{') {
					// Template literal — skip nesting (simplified)
					let tDepth = 1;
					i += 2;
					while (i < code.length && tDepth > 0) {
						if (code[i] === '{') tDepth++;
						else if (code[i] === '}') tDepth--;
						else if (code[i] === '"' || code[i] === "'") {
							const q = code[i];
							i++;
							while (i < code.length && code[i] !== q) {
								if (code[i] === '\\') i++;
								i++;
							}
						}
						i++;
					}
					continue;
				}
				i++;
			}
			continue;
		}

		// Skip comments
		if (ch === '/' && code[i + 1] === '/') {
			while (i < code.length && code[i] !== '\n') i++;
			continue;
		}
		if (ch === '/' && code[i + 1] === '*') {
			i += 2;
			while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
			i += 2;
			continue;
		}

		if (ch === '(') parenDepth++;
		if (ch === ')') parenDepth--;
		if (ch === '{') depth++;
		if (ch === '}') depth--;

		// Insert line breaks at statement boundaries (top-level semicolons and braces)
		if (parenDepth === 0 && (
			(ch === ';') ||
			(ch === '{') ||
			(ch === '}')
		)) {
			const segment = code.substring(lastBreak, i + 1).trim();
			if (segment) {
				tokens.push({ text: segment, depth: ch === '}' ? depth : depth });
			}
			lastBreak = i + 1;
		}

		i++;
	}

	// Remaining text
	const remaining = code.substring(lastBreak).trim();
	if (remaining) {
		tokens.push({ text: remaining, depth });
	}

	// Reconstruct with indentation
	return tokens.map(t => {
		const indent = '  '.repeat(Math.max(0, t.depth));
		return indent + t.text;
	}).join('\n') + '\n';
}

// ─── Format Single File ──────────────────────────────────────────

function formatFile(filePath) {
	const content = readFileSync(filePath, 'utf8');

	// Skip very small files (likely empty or trivial)
	if (content.trim().length < 10) {
		return { status: 'skipped', reason: 'too-small' };
	}

	const { header, body } = splitHeaderAndBody(content);

	// Skip if body is empty
	if (!body.trim()) {
		return { status: 'skipped', reason: 'empty-body' };
	}

	// Skip if already formatted (has meaningful newlines)
	const bodyLines = body.split('\n').filter(l => l.trim().length > 0);
	if (bodyLines.length > 5) {
		return { status: 'skipped', reason: 'already-formatted' };
	}

	if (dryRun) {
		return { status: 'would-format', size: body.length };
	}

	let formatted;
	let method = 'prettier';

	try {
		formatted = formatWithPrettier(body);
	} catch {
		// Prettier failed — try fallback
		try {
			formatted = fallbackFormat(body);
			method = 'fallback';
		} catch {
			return { status: 'failed', reason: 'both-formatters-failed' };
		}
	}

	// Sanity check: formatted code should not be dramatically smaller
	// (which would indicate data loss)
	if (formatted.trim().length < body.trim().length * 0.5) {
		return { status: 'failed', reason: 'output-too-small' };
	}

	// Reassemble: header + blank line + formatted body
	const output = header.trimEnd() + '\n\n' + formatted;
	writeFileSync(filePath, output);

	return { status: 'formatted', method, lines: formatted.split('\n').length };
}

// ─── Main ────────────────────────────────────────────────────────

console.log(`[format-modules] 扫描 ${inputDir} ...`);
const files = findJSFiles(inputDir);
console.log(`[format-modules] 发现 ${files.length} 个 JS 文件`);

if (dryRun) {
	console.log('[format-modules] 模式: dry-run (不修改文件)');
}

const stats = { formatted: 0, fallback: 0, skipped: 0, failed: 0 };
const failures = [];

for (let i = 0; i < files.length; i++) {
	const file = files[i];
	const relPath = relative(inputDir, file);

	try {
		const result = formatFile(file);

		switch (result.status) {
			case 'formatted':
			case 'would-format':
				if (result.method === 'fallback') {
					stats.fallback++;
					process.stdout.write('f');
				} else {
					stats.formatted++;
					process.stdout.write('.');
				}
				break;
			case 'skipped':
				stats.skipped++;
				break;
			case 'failed':
				stats.failed++;
				failures.push({ file: relPath, reason: result.reason });
				process.stdout.write('x');
				break;
		}
	} catch (err) {
		stats.failed++;
		failures.push({ file: relPath, reason: err.message });
		process.stdout.write('x');
	}

	// Progress indicator
	if ((i + 1) % 100 === 0) {
		process.stdout.write(` [${i + 1}/${files.length}]\n`);
	}
}

console.log('\n');
console.log('[format-modules] === 结果 ===');
console.log(`  prettier 格式化: ${stats.formatted}`);
console.log(`  fallback 格式化: ${stats.fallback}`);
console.log(`  已跳过: ${stats.skipped}`);
console.log(`  失败: ${stats.failed}`);

if (failures.length > 0) {
	console.log('\n[format-modules] 失败文件:');
	for (const f of failures.slice(0, 20)) {
		console.log(`  ${f.file}: ${f.reason}`);
	}
	if (failures.length > 20) {
		console.log(`  ... 还有 ${failures.length - 20} 个`);
	}
}

console.log('\n[format-modules] 完成!');
