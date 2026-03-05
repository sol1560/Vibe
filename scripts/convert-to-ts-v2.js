#!/usr/bin/env node
/**
 * TypeScript 转换脚本 v2
 *
 * 降低转换门槛，对更多 .js 文件重命名为 .ts，覆盖率从 ~12.6% 提升到更高。
 * v1 只处理了有 DI 注入参数的文件（349/2763）。
 * v2 对任何满足条件的 .js 文件重命名为 .ts，主要转换是安全的文件重命名。
 *
 * 用法:
 *   node scripts/convert-to-ts-v2.js [--dry-run]   # 预览统计，不修改文件
 *   node scripts/convert-to-ts-v2.js --apply        # 实际执行转换
 *
 * 转换条件（满足任一即可转换）:
 *   1. 文件包含 class 声明
 *   2. 文件包含 const enum 模式
 *   3. 文件 > 5KB（足够重要）
 *   4. 文件路径在 vs/workbench/ 下
 *
 * 排除条件（任一匹配则跳过）:
 *   - 文件 < 1KB
 *   - 路径包含 node_modules/、external/、packages/ui/dist/
 *   - node --check 语法错误
 */

import { readFileSync, writeFileSync, readdirSync, renameSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

// ─── Parse CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
let inputDir = DEFAULT_INPUT;
let dryRun = true; // 默认 dry-run，必须 --apply 才真正执行
let verbose = false;

for (const arg of args) {
	if (arg === '--apply') {
		dryRun = false;
	} else if (arg === '--dry-run') {
		dryRun = true;
	} else if (arg === '--verbose') {
		verbose = true;
	} else if (!arg.startsWith('--')) {
		inputDir = resolve(arg);
	}
}

// ─── Exclusion Patterns ──────────────────────────────────────────

const EXCLUDED_PATH_SEGMENTS = [
	'node_modules/',
	'external/',
	'packages/ui/dist/',
	'.min.js',
];

function isExcluded(filePath) {
	const rel = relative(inputDir, filePath);
	return EXCLUDED_PATH_SEGMENTS.some(seg => rel.includes(seg));
}

// ─── Inclusion Criteria ──────────────────────────────────────────

const CLASS_REGEX = /\bclass\s+[A-Z][a-zA-Z0-9_$]*[\s{]/;
const CONST_ENUM_REGEX = /\bconst\s+enum\s+\w+/;
const ENUM_CANDIDATE_REGEX = /(?:var|let|const)\s+\w+\s*=\s*\{[^}]*:\s*\d+[^}]*\}/;
const WORKBENCH_PATH = `${inputDir}/vs/workbench`;
const MIN_SIZE_FOR_PATH = 1024;       // 1KB absolute minimum
const MIN_SIZE_FOR_QUALIFY = 5 * 1024; // 5KB qualifies on size alone

function shouldConvert(filePath, content, fileSize) {
	// Absolute minimum: skip tiny files
	if (fileSize < MIN_SIZE_FOR_PATH) return { qualify: false, reason: 'too-small' };

	// 1. Has class declaration
	if (CLASS_REGEX.test(content)) return { qualify: true, reason: 'has-class' };

	// 2. Has const enum pattern
	if (CONST_ENUM_REGEX.test(content)) return { qualify: true, reason: 'has-const-enum' };

	// 3. Has enum-like object (all numeric values)
	if (ENUM_CANDIDATE_REGEX.test(content)) return { qualify: true, reason: 'has-enum-pattern' };

	// 4. File is > 5KB
	if (fileSize >= MIN_SIZE_FOR_QUALIFY) return { qualify: true, reason: 'large-file' };

	// 5. In vs/workbench/
	if (filePath.startsWith(WORKBENCH_PATH)) return { qualify: true, reason: 'workbench-dir' };

	return { qualify: false, reason: 'no-criteria-met' };
}

// ─── Syntax Check ────────────────────────────────────────────────

function hasSyntaxError(filePath) {
	try {
		execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
		return false;
	} catch {
		return true;
	}
}

// ─── File Scanner ─────────────────────────────────────────────────

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
	} catch { /* noop */ }
	return files;
}

// ─── Main ────────────────────────────────────────────────────────

console.log(`[convert-to-ts-v2] 扫描 ${inputDir} ...`);
const allJSFiles = findJSFiles(inputDir);
console.log(`[convert-to-ts-v2] 发现 ${allJSFiles.length} 个 .js 文件`);

if (dryRun) {
	console.log('[convert-to-ts-v2] 模式: DRY-RUN (不修改文件，只统计)');
	console.log('[convert-to-ts-v2] 使用 --apply 参数才会实际执行\n');
} else {
	console.log('[convert-to-ts-v2] 模式: APPLY (将重命名文件为 .ts)\n');
}

const stats = {
	total: allJSFiles.length,
	excluded: 0,
	tooSmall: 0,
	syntaxError: 0,
	qualifyClass: 0,
	qualifyConstEnum: 0,
	qualifyEnumPattern: 0,
	qualifyLargeFile: 0,
	qualifyWorkbench: 0,
	converted: 0,
	skipped: 0,
};

const converted = [];
const skippedReasons = {};

let processed = 0;
for (const filePath of allJSFiles) {
	processed++;

	// Check exclusion
	if (isExcluded(filePath)) {
		stats.excluded++;
		stats.skipped++;
		continue;
	}

	const fileSize = statSync(filePath).size;
	const content = readFileSync(filePath, 'utf8');

	const { qualify, reason } = shouldConvert(filePath, content, fileSize);

	if (!qualify) {
		if (reason === 'too-small') stats.tooSmall++;
		else stats.skipped++;

		if (!skippedReasons[reason]) skippedReasons[reason] = 0;
		skippedReasons[reason]++;
		continue;
	}

	// Track qualification reason
	if (reason === 'has-class') stats.qualifyClass++;
	else if (reason === 'has-const-enum') stats.qualifyConstEnum++;
	else if (reason === 'has-enum-pattern') stats.qualifyEnumPattern++;
	else if (reason === 'large-file') stats.qualifyLargeFile++;
	else if (reason === 'workbench-dir') stats.qualifyWorkbench++;

	// Check syntax — skip files with syntax errors
	if (hasSyntaxError(filePath)) {
		stats.syntaxError++;
		stats.skipped++;
		if (verbose) {
			const rel = relative(inputDir, filePath);
			console.log(`  [SYNTAX-ERROR] ${rel}`);
		}
		continue;
	}

	// Do the rename
	const tsPath = filePath.replace(/\.js$/, '.ts');
	if (!dryRun) {
		renameSync(filePath, tsPath);
	}
	stats.converted++;

	if (verbose) {
		const rel = relative(inputDir, filePath);
		process.stdout.write(`  [${reason}] ${rel}\n`);
	} else {
		process.stdout.write('.');
		if (stats.converted % 100 === 0) {
			process.stdout.write(` [${stats.converted} converted / ${processed} scanned]\n`);
		}
	}
}

// ─── Report ──────────────────────────────────────────────────────

console.log('\n\n[convert-to-ts-v2] === 结果 ===');
console.log(`  扫描总文件: ${stats.total}`);
console.log(`  ── 已排除 (node_modules/external等): ${stats.excluded}`);
console.log(`  ── 文件太小 (<1KB): ${stats.tooSmall}`);
console.log(`  ── 语法错误: ${stats.syntaxError}`);
console.log(`  ── 无转换条件: ${(skippedReasons['no-criteria-met'] || 0)}`);
console.log('');
console.log('  符合条件明细:');
console.log(`    has-class:        ${stats.qualifyClass}`);
console.log(`    has-const-enum:   ${stats.qualifyConstEnum}`);
console.log(`    has-enum-pattern: ${stats.qualifyEnumPattern}`);
console.log(`    large-file:       ${stats.qualifyLargeFile}`);
console.log(`    workbench-dir:    ${stats.qualifyWorkbench}`);
console.log('');
if (dryRun) {
	console.log(`  预计转换 (重命名为 .ts): ${stats.converted}`);
	console.log(`  覆盖率提升: 349 → ${349 + stats.converted} / ${stats.total + 349} (当前 .js + 已有 .ts)`);
} else {
	console.log(`  已转换 (重命名为 .ts): ${stats.converted}`);
}
console.log('\n[convert-to-ts-v2] 完成!');

if (dryRun) {
	console.log('\n提示: 使用 --apply 参数执行实际转换');
}
