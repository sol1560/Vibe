#!/usr/bin/env node
/**
 * Cursor 代码反混淆流水线
 *
 * 将拆包后的 minified 模块还原为可读代码。
 *
 * 用法:
 *   node scripts/deobfuscate.js build-symbols <bundle>     — Phase 1: 从 bundle 构建全局符号表
 *   node scripts/deobfuscate.js restore <module-dir>       — Phase 2: 对拆包后的模块执行还原
 *   node scripts/deobfuscate.js restore-single <file>      — 还原单个文件
 *   node scripts/deobfuscate.js validate <module-dir>      — Phase 3: 验证还原结果
 *   node scripts/deobfuscate.js stats                      — 显示符号表统计
 *
 * 输入:
 *   bundle     — workbench.desktop.main.js 原始 bundle
 *   module-dir — unbundle.js 输出的模块目录
 *
 * 输出:
 *   data/service-map.json    — Bi() 服务标识符映射
 *   data/singleton-map.json  — Ki() 注册映射
 *   data/param-map.json      — __param() 装饰器映射
 *   data/nls-map.json        — NLS 索引 → 模块路径
 *   data/restore-stats.json  — 还原统计
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, basename, extname } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'scripts', 'data');
const DEFAULT_BUNDLE = join(PROJECT_ROOT, 'extracted/cursor-app/out/vs/workbench/workbench.desktop.main.js');
const DEFAULT_MODULE_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled');
const NLS_KEYS_PATH = join(PROJECT_ROOT, 'extracted/cursor-app/out/nls.keys.json');
const NLS_MESSAGES_PATH = join(PROJECT_ROOT, 'extracted/cursor-app/out/nls.messages.json');

// ============================================================
// Utility functions
// ============================================================

function ensureDir(dir) {
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Walk a directory tree, yielding JS file paths.
 */
function* walkJS(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkJS(full);
		} else if (entry.name.endsWith('.js')) {
			yield full;
		}
	}
}

/**
 * Skip a string literal starting at `start` (handles ", ', `).
 * Returns the index AFTER the closing quote.
 */
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

/**
 * Extract a brace-balanced block starting at `openBraceIndex`.
 */
function extractBraceBlock(code, openBraceIndex) {
	if (code[openBraceIndex] !== '{') return null;
	let depth = 1;
	let i = openBraceIndex + 1;
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
	return code.substring(openBraceIndex, i);
}

// ============================================================
// Phase 1: Build global symbol table from bundle
// ============================================================

function buildSymbolTable(bundlePath) {
	console.log(`[symbols] 读取 bundle: ${bundlePath}`);
	const src = readFileSync(bundlePath, 'utf-8');
	console.log(`[symbols] 大小: ${(src.length / 1024 / 1024).toFixed(1)} MB`);

	ensureDir(DATA_DIR);

	// ── 1a. DI Service identifiers: varName = Bi("serviceName") ──
	console.log('[symbols] 提取 Bi() 服务标识符...');
	const serviceMap = {};
	const biRegex = /(\w+)\s*=\s*Bi\("(\w+)"\)/g;
	let m;
	while ((m = biRegex.exec(src)) !== null) {
		const [, varName, serviceName] = m;
		// Convert to interface name: "configurationService" → "IConfigurationService"
		let interfaceName;
		if (serviceName.startsWith('I') && serviceName[1] === serviceName[1].toUpperCase()) {
			interfaceName = serviceName; // Already has I prefix
		} else {
			interfaceName = 'I' + serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
		}
		serviceMap[varName] = {
			serviceName,
			interfaceName,
		};
	}
	console.log(`[symbols]   → ${Object.keys(serviceMap).length} 个服务标识符`);

	// ── 1b. Ki() singleton registrations: Ki(interfaceVar, implVar, type) ──
	console.log('[symbols] 提取 Ki() 单例注册...');
	const singletonMap = {};
	const kiRegex = /Ki\((\w+),\s*(\w+),\s*(\d+)\)/g;
	while ((m = kiRegex.exec(src)) !== null) {
		const [, interfaceVar, implVar, instType] = m;
		const serviceInfo = serviceMap[interfaceVar];
		const implClassName = serviceInfo
			? serviceInfo.serviceName.replace(/^I/, '').replace(/^./, c => c.toUpperCase())
			: null;
		singletonMap[implVar] = {
			interfaceVar,
			interfaceName: serviceInfo?.interfaceName || interfaceVar,
			implClassName,
			instantiationType: parseInt(instType, 10), // 0=Eager, 1=Delayed, 2=Deferred
		};
	}
	console.log(`[symbols]   → ${Object.keys(singletonMap).length} 个单例注册`);

	// ── 1c. __param() DI decorators ──
	console.log('[symbols] 提取 __param() 装饰器...');
	const paramMap = {};
	// Find __decorate blocks with __param sequences
	// Pattern: SomeClass = __decorate([__param(0, X), __param(1, Y), ...], SomeClass);
	const decorateRegex = /(\w+)\s*=\s*__decorate\(\[([^\]]+)\],\s*\1\)/g;
	while ((m = decorateRegex.exec(src)) !== null) {
		const [, className, decoratorList] = m;
		const params = {};
		const paramRegex = /__param\((\d+),\s*(\w+)\)/g;
		let pm;
		while ((pm = paramRegex.exec(decoratorList)) !== null) {
			const [, index, serviceVar] = pm;
			const serviceInfo = serviceMap[serviceVar];
			params[parseInt(index, 10)] = {
				serviceVar,
				serviceName: serviceInfo?.serviceName || serviceVar,
				interfaceName: serviceInfo?.interfaceName || serviceVar,
			};
		}
		if (Object.keys(params).length > 0) {
			paramMap[className] = params;
		}
	}
	console.log(`[symbols]   → ${Object.keys(paramMap).length} 个类的 DI 参数映射`);

	// ── 1d. NLS module map ──
	let nlsMap = {};
	if (existsSync(NLS_KEYS_PATH)) {
		console.log('[symbols] 构建 NLS 模块映射...');
		const nlsKeys = JSON.parse(readFileSync(NLS_KEYS_PATH, 'utf-8'));
		let messageIndex = 0;
		for (const entry of nlsKeys) {
			const [modulePath, keys] = entry;
			for (let i = 0; i < keys.length; i++) {
				nlsMap[messageIndex] = {
					module: modulePath,
					key: keys[i],
				};
				messageIndex++;
			}
		}
		console.log(`[symbols]   → ${Object.keys(nlsMap).length} 个 NLS 索引映射 (${nlsKeys.length} 个模块)`);
	} else {
		console.log('[symbols]   ⚠ nls.keys.json 未找到，跳过 NLS 映射');
	}

	// ── 1e. Module path → variable name mapping ──
	console.log('[symbols] 提取模块路径映射...');
	const moduleVarMap = {};
	// Pattern: varName=Ae({"out-build/vs/..."(){...}})
	// More precisely, the bundle uses: varName=Ae({"out-build/vs/path"(){...}})
	// But after unbundling, we have the module-map.json from unbundle.js
	const moduleMapPath = join(DEFAULT_MODULE_DIR, 'module-map.json');
	if (existsSync(moduleMapPath)) {
		const moduleMap = JSON.parse(readFileSync(moduleMapPath, 'utf-8'));
		// moduleMap: { varName: "out-build/vs/path" }
		for (const [varName, modPath] of Object.entries(moduleMap)) {
			moduleVarMap[varName] = modPath;
		}
		console.log(`[symbols]   → ${Object.keys(moduleVarMap).length} 个模块变量映射（从 module-map.json）`);
	} else {
		// Extract from bundle directly
		const modRegex = /(\w+)\s*=\s*Ae\(\{"(out-build\/vs\/[^"]+)"/g;
		while ((m = modRegex.exec(src)) !== null) {
			moduleVarMap[m[1]] = m[2];
		}
		console.log(`[symbols]   → ${Object.keys(moduleVarMap).length} 个模块变量映射（从 bundle 提取）`);
	}

	// ── Write all maps ──
	const files = {
		'service-map.json': serviceMap,
		'singleton-map.json': singletonMap,
		'param-map.json': paramMap,
		'nls-map.json': nlsMap,
		'module-var-map.json': moduleVarMap,
	};

	for (const [name, data] of Object.entries(files)) {
		const outPath = join(DATA_DIR, name);
		writeFileSync(outPath, JSON.stringify(data, null, 2));
		console.log(`[symbols] 写入 ${outPath}`);
	}

	console.log('\n[symbols] 完成！符号表统计:');
	console.log(`  DI 服务标识符: ${Object.keys(serviceMap).length}`);
	console.log(`  单例注册:      ${Object.keys(singletonMap).length}`);
	console.log(`  DI 参数映射:   ${Object.keys(paramMap).length} 个类`);
	console.log(`  NLS 索引映射:  ${Object.keys(nlsMap).length}`);
	console.log(`  模块变量映射:  ${Object.keys(moduleVarMap).length}`);
}

// ============================================================
// Phase 2: Restore variable names in modules
// ============================================================

function loadSymbolTables() {
	const tables = {};
	const files = ['service-map.json', 'singleton-map.json', 'param-map.json', 'nls-map.json', 'module-var-map.json'];
	for (const name of files) {
		const p = join(DATA_DIR, name);
		if (existsSync(p)) {
			tables[name.replace('.json', '').replace(/-/g, '_')] = JSON.parse(readFileSync(p, 'utf-8'));
		} else {
			console.warn(`[restore] ⚠ 符号表不存在: ${p} (先运行 build-symbols)`);
			tables[name.replace('.json', '').replace(/-/g, '_')] = {};
		}
	}
	return tables;
}

/**
 * Build rename maps for a file.
 *
 * Returns:
 *   globalRenames  — Map<short, long> safe to replace across the entire file
 *   ctorParamRenames — Map<short, long> only applied to the constructor signature
 *
 * Safety rules:
 *  - Short variable names (<=2 chars) from the service map are NEVER renamed globally,
 *    because single-letter names collide with constructor params, loop vars, callbacks.
 *  - Short names that appear as Bi() definition sites ARE renamed globally (unambiguous).
 *  - Constructor param renames (Strategy 2) only apply to the constructor() signature
 *    and the `this._xxx = param` assignments — NOT to the rest of the file, since the
 *    same short name is reused in every method as a different local variable.
 */
function buildRenameMap(code, tables) {
	const globalRenames = new Map();
	const ctorParamRenames = new Map();
	const { service_map, singleton_map, param_map } = tables;

	// ── Strategy 1: DI service identifiers (global scope) ──
	for (const [shortVar, info] of Object.entries(service_map)) {
		const regex = new RegExp(`(?<![\\w$])${escapeRegex(shortVar)}(?![\\w$])`);
		if (!regex.test(code)) continue;

		if (shortVar.length > 2) {
			// Safe to rename globally — long enough to be unambiguous
			globalRenames.set(shortVar, info.interfaceName);
		} else {
			// Short name — ONLY rename if it appears as a Bi() definition site
			const biDefRegex = new RegExp(
				`(?<![\\w$])${escapeRegex(shortVar)}\\s*=\\s*Bi\\(`,
			);
			if (biDefRegex.test(code)) {
				globalRenames.set(shortVar, info.interfaceName);
			}
		}
	}

	// ── Strategy 2: Constructor parameter renaming via this._xxx = param ──
	// These renames are SCOPED to the constructor signature and body only.
	const ctorMatch = code.match(/constructor\(([^)]*)\)\s*\{/);
	if (ctorMatch) {
		const params = ctorMatch[1].split(',').map(p => p.trim()).filter(Boolean);
		const ctorStart = code.indexOf(ctorMatch[0]);
		const braceIdx = code.indexOf('{', ctorStart + 'constructor('.length);
		const ctorBody = extractBraceBlock(code, braceIdx);

		if (ctorBody) {
			const usedNames = new Set();
			for (const [, name] of globalRenames) usedNames.add(name);

			for (const param of params) {
				if (param.length > 3) continue; // Only rename short params
				if (globalRenames.has(param)) continue; // Already handled globally

				const assignRegex = new RegExp(
					`this\\.(\\w+)\\s*=\\s*${escapeRegex(param)}\\b(?![\\w$])`,
				);
				const assignMatch = assignRegex.exec(ctorBody);
				if (assignMatch) {
					const propName = assignMatch[1];
					let varName = propName.startsWith('_') ? propName.slice(1) : propName;

					if (!usedNames.has(varName)) {
						ctorParamRenames.set(param, varName);
						usedNames.add(varName);
					} else {
						let suffix = 2;
						while (usedNames.has(`${varName}${suffix}`)) suffix++;
						const dedupName = `${varName}${suffix}`;
						ctorParamRenames.set(param, dedupName);
						usedNames.add(dedupName);
					}
				}
			}
		}
	}

	// ── Strategy 4: Ki() implementation class names ──
	for (const [implVar, info] of Object.entries(singleton_map)) {
		if (!info.implClassName) continue;
		if (implVar.length <= 2) continue;
		if (code.includes(implVar)) {
			if (!globalRenames.has(implVar)) {
				globalRenames.set(implVar, info.implClassName);
			}
		}
	}

	return { globalRenames, ctorParamRenames };
}

/**
 * Apply global renames to code using word-boundary matching.
 */
function applyGlobalRenames(code, renames) {
	if (renames.size === 0) return { code, count: 0 };

	let count = 0;
	let result = code;

	// Sort by length descending to avoid shorter matches interfering with longer ones
	const sorted = [...renames.entries()].sort((a, b) => b[0].length - a[0].length);

	for (const [short, long] of sorted) {
		if (short === long) continue;
		const regex = new RegExp(`(?<![\\w$])${escapeRegex(short)}(?![\\w$])`, 'g');
		const before = result;
		result = result.replace(regex, long);
		if (result !== before) {
			const matches = before.match(regex);
			count += matches ? matches.length : 0;
		}
	}

	return { code: result, count };
}

/**
 * Apply constructor-scoped renames — only within the constructor signature
 * and the `super(),...this._xxx=param` assignment block.
 *
 * This avoids polluting method params/loop vars elsewhere in the file
 * that happen to share the same single-letter names.
 */
function applyCtorParamRenames(code, ctorRenames) {
	if (ctorRenames.size === 0) return { code, count: 0 };

	const ctorMatch = code.match(/constructor\(([^)]*)\)\s*\{/);
	if (!ctorMatch) return { code, count: 0 };

	const ctorStart = code.indexOf(ctorMatch[0]);
	const sigStart = ctorStart + 'constructor('.length;
	const sigEnd = code.indexOf(')', sigStart);

	// Find the constructor body brace block
	const braceIdx = code.indexOf('{', sigEnd);
	const ctorBody = extractBraceBlock(code, braceIdx);
	if (!ctorBody) return { code, count: 0 };

	const ctorEnd = braceIdx + ctorBody.length;
	let count = 0;

	// Rename in the constructor signature
	let signature = code.substring(sigStart, sigEnd);
	for (const [short, long] of ctorRenames) {
		const regex = new RegExp(`(?<![\\w$])${escapeRegex(short)}(?![\\w$])`, 'g');
		const before = signature;
		signature = signature.replace(regex, long);
		if (signature !== before) {
			const matches = before.match(regex);
			count += matches ? matches.length : 0;
		}
	}

	// Rename in the constructor body (super() call + this._xxx assignments)
	let body = code.substring(braceIdx, ctorEnd);
	for (const [short, long] of ctorRenames) {
		const regex = new RegExp(`(?<![\\w$])${escapeRegex(short)}(?![\\w$])`, 'g');
		const before = body;
		body = body.replace(regex, long);
		if (body !== before) {
			const matches = before.match(regex);
			count += matches ? matches.length : 0;
		}
	}

	// Reconstruct the file
	const result = code.substring(0, sigStart) + signature + code.substring(sigEnd, braceIdx) + body + code.substring(ctorEnd);

	return { code: result, count };
}

/**
 * Restore a single module file.
 */
function restoreFile(filePath, tables) {
	let code = readFileSync(filePath, 'utf-8');

	const { globalRenames, ctorParamRenames } = buildRenameMap(code, tables);

	// Pass 1: Apply global renames (DI service interfaces, class names)
	const { code: afterGlobal, count: globalCount } = applyGlobalRenames(code, globalRenames);

	// Pass 2: Apply constructor-scoped renames (short param names)
	const { code: afterCtor, count: ctorCount } = applyCtorParamRenames(afterGlobal, ctorParamRenames);

	const totalCount = globalCount + ctorCount;

	if (totalCount > 0) {
		writeFileSync(filePath, afterCtor);
	}

	const allRenames = new Map([...globalRenames, ...ctorParamRenames]);
	return {
		file: filePath,
		renames: allRenames.size,
		replacements: totalCount,
		strategies: {
			di: [...globalRenames.entries()].filter(([_, v]) => v.startsWith('I') && v.length > 3).length,
			constructor: ctorParamRenames.size,
			classNames: [...globalRenames.entries()].filter(([_, v]) => !v.startsWith('I')).length,
		},
	};
}

/**
 * Restore all modules in a directory.
 */
function restoreAll(moduleDir, tables) {
	console.log(`[restore] 处理目录: ${moduleDir}`);

	const stats = {
		totalFiles: 0,
		modifiedFiles: 0,
		skippedFiles: 0,
		totalRenames: 0,
		totalReplacements: 0,
		byStrategy: { di: 0, constructor: 0, classNames: 0 },
	};

	for (const filePath of walkJS(moduleDir)) {
		const relPath = relative(moduleDir, filePath);

		// Skip runtime and entry files
		if (basename(filePath).startsWith('_')) continue;

		stats.totalFiles++;
		const result = restoreFile(filePath, tables);

		if (result.replacements > 0) {
			stats.modifiedFiles++;
			stats.totalRenames += result.renames;
			stats.totalReplacements += result.replacements;
			stats.byStrategy.di += result.strategies.di;
			stats.byStrategy.constructor += result.strategies.constructor;
			stats.byStrategy.classNames += result.strategies.classNames;

			if (result.replacements > 20) {
				console.log(`  ✓ ${relPath}: ${result.renames} 个变量, ${result.replacements} 处替换`);
			}
		} else {
			stats.skippedFiles++;
		}
	}

	// Write stats
	const statsPath = join(DATA_DIR, 'restore-stats.json');
	writeFileSync(statsPath, JSON.stringify(stats, null, 2));

	console.log('\n[restore] 完成！');
	console.log(`  处理文件: ${stats.totalFiles}`);
	console.log(`  修改文件: ${stats.modifiedFiles}`);
	console.log(`  跳过文件: ${stats.skippedFiles}`);
	console.log(`  总变量还原: ${stats.totalRenames}`);
	console.log(`  总替换次数: ${stats.totalReplacements}`);
	console.log(`  按策略:  DI=${stats.byStrategy.di}  构造函数=${stats.byStrategy.constructor}  类名=${stats.byStrategy.classNames}`);

	return stats;
}

// ============================================================
// Phase 3: Validate restored modules
// ============================================================

function validateAll(moduleDir) {
	console.log(`[validate] 验证目录: ${moduleDir}`);

	let total = 0;
	let valid = 0;
	let syntaxErrors = 0;
	const errors = [];

	for (const filePath of walkJS(moduleDir)) {
		if (basename(filePath).startsWith('_')) continue;

		total++;
		const code = readFileSync(filePath, 'utf-8');

		// Basic syntax validation: try to parse as a function body
		try {
			// Use Function constructor for loose parsing
			new Function(code);
			valid++;
		} catch (e) {
			syntaxErrors++;
			errors.push({
				file: relative(moduleDir, filePath),
				error: e.message,
			});
		}
	}

	console.log(`[validate] 验证完成:`);
	console.log(`  总文件: ${total}`);
	console.log(`  有效:   ${valid}`);
	console.log(`  语法错误: ${syntaxErrors}`);

	if (errors.length > 0 && errors.length <= 20) {
		console.log('\n语法错误详情:');
		for (const { file, error } of errors) {
			console.log(`  ✗ ${file}: ${error}`);
		}
	} else if (errors.length > 20) {
		console.log(`\n前 20 个语法错误:`);
		for (const { file, error } of errors.slice(0, 20)) {
			console.log(`  ✗ ${file}: ${error}`);
		}
		console.log(`  ...还有 ${errors.length - 20} 个`);
	}

	return { total, valid, syntaxErrors, errors };
}

// ============================================================
// Stats command
// ============================================================

function showStats() {
	const files = ['service-map.json', 'singleton-map.json', 'param-map.json', 'nls-map.json', 'module-var-map.json', 'restore-stats.json'];

	console.log('[stats] 符号表统计:\n');

	for (const name of files) {
		const p = join(DATA_DIR, name);
		if (existsSync(p)) {
			const data = JSON.parse(readFileSync(p, 'utf-8'));
			const count = typeof data === 'object' ? Object.keys(data).length : 0;
			console.log(`  ${name}: ${count} 条记录`);

			if (name === 'restore-stats.json') {
				console.log(`    修改文件: ${data.modifiedFiles}/${data.totalFiles}`);
				console.log(`    总替换:   ${data.totalReplacements}`);
				console.log(`    DI: ${data.byStrategy?.di}  构造函数: ${data.byStrategy?.constructor}  类名: ${data.byStrategy?.classNames}`);
			}
		} else {
			console.log(`  ${name}: (未生成)`);
		}
	}
}

// ============================================================
// CLI Entry
// ============================================================

const command = process.argv[2];

switch (command) {
	case 'build-symbols': {
		const bundlePath = process.argv[3] || DEFAULT_BUNDLE;
		buildSymbolTable(bundlePath);
		break;
	}

	case 'restore': {
		const moduleDir = process.argv[3] || DEFAULT_MODULE_DIR;
		const tables = loadSymbolTables();
		restoreAll(moduleDir, tables);
		break;
	}

	case 'restore-single': {
		const filePath = process.argv[3];
		if (!filePath) {
			console.error('用法: node scripts/deobfuscate.js restore-single <file>');
			process.exit(1);
		}
		const tables = loadSymbolTables();
		const result = restoreFile(filePath, tables);
		console.log(`[restore] ${result.file}: ${result.renames} 个变量, ${result.replacements} 处替换`);
		break;
	}

	case 'validate': {
		const moduleDir = process.argv[3] || DEFAULT_MODULE_DIR;
		validateAll(moduleDir);
		break;
	}

	case 'stats': {
		showStats();
		break;
	}

	default:
		console.log(`Cursor 代码反混淆流水线

用法:
  node scripts/deobfuscate.js build-symbols [bundle]   — 从 bundle 构建全局符号表
  node scripts/deobfuscate.js restore [module-dir]     — 对拆包后的模块执行变量名还原
  node scripts/deobfuscate.js restore-single <file>    — 还原单个文件
  node scripts/deobfuscate.js validate [module-dir]    — 验证还原结果的语法正确性
  node scripts/deobfuscate.js stats                    — 显示符号表统计

默认路径:
  bundle:     ${DEFAULT_BUNDLE}
  module-dir: ${DEFAULT_MODULE_DIR}
  符号表:     ${DATA_DIR}/

还原策略:
  1. DI 服务标识符 (570 个 Bi() 映射)     — 100% 置信度
  2. 构造函数参数 (this._xxx = param)     — 95% 置信度
  3. VS Code 源码对照 (计划中)            — 90% 置信度
  4. 类名/导出名 (433 个 Ki() 映射)       — 85% 置信度
  5. 字符串推断 (计划中)                  — 60% 置信度
`);
		break;
}
