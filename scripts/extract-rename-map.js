#!/usr/bin/env node
/**
 * 提取全局重命名映射表
 *
 * 从 deobfuscate.js 的符号表和 convert-to-ts.js 的转换逻辑中，
 * 提取所有在处理流水线中被重命名的标识符。
 *
 * 输出:
 *   scripts/data/global-rename-map.json — { "可读名": "混淆名", ... }
 *   scripts/data/convert-ts-renames.json — convert-to-ts.js 引入的类名替换
 *
 * 用法: node scripts/extract-rename-map.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'scripts', 'data');
const MODULES_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

// ============================================================
// Part 1: Extract deobfuscate.js global renames
// ============================================================

function extractDeobfuscateRenames() {
	console.log('[extract] === Part 1: deobfuscate.js 全局重命名 ===');

	const serviceMapPath = join(DATA_DIR, 'service-map.json');
	const singletonMapPath = join(DATA_DIR, 'singleton-map.json');

	if (!existsSync(serviceMapPath) || !existsSync(singletonMapPath)) {
		console.error('[extract] 符号表不存在，请先运行 deobfuscate.js build-symbols');
		process.exit(1);
	}

	const serviceMap = JSON.parse(readFileSync(serviceMapPath, 'utf-8'));
	const singletonMap = JSON.parse(readFileSync(singletonMapPath, 'utf-8'));

	const globalRenames = {};
	const skippedShort = {};

	// Strategy 1: DI service identifiers (Bi() mappings)
	// Rule from deobfuscate.js line 307: shortVar.length > 2 → global rename
	// Rule from line 310-318: shortVar.length <= 2 → only rename at Bi() definition site
	let strategy1Long = 0;
	let strategy1Short = 0;

	for (const [shortVar, info] of Object.entries(serviceMap)) {
		if (shortVar.length > 2) {
			// Safe to rename globally
			globalRenames[info.interfaceName] = shortVar;
			strategy1Long++;
		} else {
			// Short name — only renamed at Bi() definition site
			skippedShort[shortVar] = {
				interfaceName: info.interfaceName,
				reason: 'length <= 2, only renamed at Bi() def site',
			};
			strategy1Short++;
		}
	}

	console.log(`  Strategy 1 (DI services): ${strategy1Long} global + ${strategy1Short} def-site-only`);

	// Strategy 4: Ki() singleton class names
	// Rule from deobfuscate.js line 364: implVar.length <= 2 → skip
	let strategy4Count = 0;
	let strategy4Skipped = 0;

	for (const [implVar, info] of Object.entries(singletonMap)) {
		if (!info.implClassName) continue;
		if (implVar.length <= 2) {
			strategy4Skipped++;
			if (!skippedShort[implVar]) {
				skippedShort[implVar] = {
					implClassName: info.implClassName,
					reason: 'length <= 2, skipped by Ki() strategy',
				};
			}
			continue;
		}
		// Only add if not already present (DI rename takes priority)
		if (!Object.values(globalRenames).includes(implVar)) {
			globalRenames[info.implClassName] = implVar;
			strategy4Count++;
		}
	}

	console.log(`  Strategy 4 (Ki singletons): ${strategy4Count} global + ${strategy4Skipped} skipped-short`);

	// Summary
	console.log(`  Total global renames: ${Object.keys(globalRenames).length}`);
	console.log(`  Skipped short vars: ${Object.keys(skippedShort).length}`);

	return { globalRenames, skippedShort };
}

// ============================================================
// Part 2: Extract convert-to-ts.js class name replacements
// ============================================================

function extractConvertTsRenames() {
	console.log('\n[extract] === Part 2: convert-to-ts.js 引入的替换 ===');

	// convert-to-ts.js introduces these changes:
	// 1. addDisposableType: adds "extends Disposable" to classes with super.dispose() / this._register()
	// 2. addConstructorTypes: adds @IXxxService type annotations to constructor params
	// 3. addFieldTypes: adds field type declarations
	// 4. convertEnumPatterns: converts object literals to const enum

	// The CRITICAL one is addDisposableType which introduces "Disposable" identifier
	// that doesn't exist in the bundle scope (it's `at`)

	const convertTsRenames = {
		'Disposable': {
			bundleName: 'at',
			source: 'convert-to-ts.js:addDisposableType()',
			description: 'Added "extends Disposable" to classes with super.dispose() or this._register()',
			bug: 'File-level check instead of class-level; only transforms first class without extends; introduces identifier not in bundle scope',
			occurrencesInBuild: 38,
			occurrencesInOriginal: 0,
		},
	};

	// Scan the modules directory to find all files that got "extends Disposable" added
	const affectedFiles = [];

	if (existsSync(MODULES_DIR)) {
		function walkFiles(dir) {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				const full = join(dir, entry.name);
				if (entry.isDirectory()) {
					walkFiles(full);
				} else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
					try {
						const content = readFileSync(full, 'utf-8');
						if (content.includes('extends Disposable')) {
							const relPath = relative(MODULES_DIR, full);
							// Count occurrences
							const count = (content.match(/extends Disposable/g) || []).length;
							affectedFiles.push({ file: relPath, count });
						}
					} catch { /* skip */ }
				}
			}
		}

		walkFiles(MODULES_DIR);
	}

	convertTsRenames['Disposable'].affectedFiles = affectedFiles;
	console.log(`  "extends Disposable" found in ${affectedFiles.length} module files`);

	// Also check for DisposableStore, MutableDisposable etc that might have been introduced
	const additionalChecks = ['DisposableStore', 'MutableDisposable', 'Emitter'];
	for (const name of additionalChecks) {
		let filesWithName = 0;
		if (existsSync(MODULES_DIR)) {
			function walkCheck(dir) {
				for (const entry of readdirSync(dir, { withFileTypes: true })) {
					const full = join(dir, entry.name);
					if (entry.isDirectory()) {
						walkCheck(full);
					} else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
						try {
							const content = readFileSync(full, 'utf-8');
							// Only check as identifier, not in strings
							const regex = new RegExp(`\\b${name}\\b`);
							if (regex.test(content)) filesWithName++;
						} catch { /* skip */ }
					}
				}
			}
			walkCheck(MODULES_DIR);
		}
		if (filesWithName > 0) {
			console.log(`  "${name}" found in ${filesWithName} module files`);
		}
	}

	return convertTsRenames;
}

// ============================================================
// Part 3: Construct the complete reverse mapping
// ============================================================

function buildCompleteMap(deobRenames, convertTsRenames) {
	console.log('\n[extract] === Part 3: 完整映射表 ===');

	// Merge all: readable name → minified name
	const completeMap = {};

	// From deobfuscate.js
	for (const [readable, minified] of Object.entries(deobRenames)) {
		completeMap[readable] = minified;
	}

	// From convert-to-ts.js
	for (const [readable, info] of Object.entries(convertTsRenames)) {
		if (info.bundleName) {
			completeMap[readable] = info.bundleName;
		}
	}

	console.log(`  Total mappings: ${Object.keys(completeMap).length}`);

	// Count by type
	const diServices = Object.keys(completeMap).filter(k => k.startsWith('I') && k.endsWith('Service')).length;
	const classNames = Object.keys(completeMap).filter(k => !k.startsWith('I') || !k.endsWith('Service')).length;
	console.log(`  DI service interfaces: ${diServices}`);
	console.log(`  Class/other names: ${classNames}`);

	return completeMap;
}

// ============================================================
// Main
// ============================================================

const { globalRenames, skippedShort } = extractDeobfuscateRenames();
const convertTsRenames = extractConvertTsRenames();
const completeMap = buildCompleteMap(globalRenames, convertTsRenames);

// Write outputs
const outputPath = join(DATA_DIR, 'global-rename-map.json');
writeFileSync(outputPath, JSON.stringify(completeMap, null, 2));
console.log(`\n[extract] 写入 ${outputPath} (${Object.keys(completeMap).length} 条映射)`);

const convertTsPath = join(DATA_DIR, 'convert-ts-renames.json');
writeFileSync(convertTsPath, JSON.stringify(convertTsRenames, null, 2));
console.log(`[extract] 写入 ${convertTsPath}`);

const skippedPath = join(DATA_DIR, 'skipped-short-vars.json');
writeFileSync(skippedPath, JSON.stringify(skippedShort, null, 2));
console.log(`[extract] 写入 ${skippedPath} (${Object.keys(skippedShort).length} 个短变量)`);

// Print sample entries
console.log('\n[extract] === 示例映射 (前 20 条) ===');
const entries = Object.entries(completeMap);
for (const [readable, minified] of entries.slice(0, 20)) {
	console.log(`  ${readable.padEnd(50)} → ${minified}`);
}

console.log('\n[extract] === 被跳过的短变量 (前 10 条) ===');
for (const [shortVar, info] of Object.entries(skippedShort).slice(0, 10)) {
	console.log(`  ${shortVar.padEnd(6)} → ${info.interfaceName || info.implClassName} (${info.reason})`);
}

console.log('\n[extract] 完成!');
