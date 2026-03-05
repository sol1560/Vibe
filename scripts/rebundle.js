#!/usr/bin/env node
/**
 * rebundle.js — 将逆向修改后的模块重新打包为 workbench.desktop.main.js
 *
 * 策略：以原始 bundle 为骨架，仅替换被修改过的模块体。
 * 保留所有 inter-module 代码（独立函数、GN 导出映射、变量声明等）。
 *
 * 用法: node scripts/rebundle.js [original-bundle] [modules-dir] [output]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_ORIGINAL = join(PROJECT_ROOT, 'extracted/cursor-app/out/vs/workbench/workbench.desktop.main.js');
const DEFAULT_MODULES_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');
const DEFAULT_MODULE_MAP = join(PROJECT_ROOT, 'extracted/cursor-unbundled/module-map.json');
const DEFAULT_OUTPUT = join(PROJECT_ROOT, 'build/workbench.desktop.main.js');

const originalFile = process.argv[2] || DEFAULT_ORIGINAL;
const modulesDir = process.argv[3] || DEFAULT_MODULES_DIR;
const outputFile = process.argv[4] || DEFAULT_OUTPUT;

// ============================================================
// Phase 1: 读取原始 bundle
// ============================================================

console.log(`[rebundle] 读取原始 bundle: ${originalFile}`);
const src = readFileSync(originalFile, 'utf-8');
console.log(`[rebundle] 原始文件大小: ${(src.length / 1024 / 1024).toFixed(1)} MB`);

// ============================================================
// Phase 2: 读取模块映射（变量名 → 路径）
// ============================================================

console.log(`[rebundle] 读取模块映射...`);
const moduleMap = JSON.parse(readFileSync(DEFAULT_MODULE_MAP, 'utf-8'));
const pathToVar = {};
for (const [varName, modulePath] of Object.entries(moduleMap)) {
	pathToVar[modulePath] = varName;
}
console.log(`[rebundle] 模块映射: ${Object.keys(moduleMap).length} 个条目`);

// ============================================================
// Phase 3: 定位原始 bundle 中所有模块的位置
// ============================================================

console.log('[rebundle] 定位原始 bundle 中的模块边界...');

const AE_MARKER = '=Ae({"';
const N0_MARKER = '=N0({"';

const markers = [];
let sp = 0;
while (true) {
	const aeIdx = src.indexOf(AE_MARKER, sp);
	const n0Idx = src.indexOf(N0_MARKER, sp);
	if (aeIdx === -1 && n0Idx === -1) break;

	let pos, type, mLen;
	if (aeIdx === -1) { pos = n0Idx; type = 'N0'; mLen = N0_MARKER.length; }
	else if (n0Idx === -1) { pos = aeIdx; type = 'Ae'; mLen = AE_MARKER.length; }
	else if (aeIdx < n0Idx) { pos = aeIdx; type = 'Ae'; mLen = AE_MARKER.length; }
	else { pos = n0Idx; type = 'N0'; mLen = N0_MARKER.length; }

	// 提取变量名
	let ne = pos, ns = ne - 1;
	while (ns >= 0 && /[\w$]/.test(src[ns])) ns--;
	ns++;
	const varName = src.substring(ns, ne);

	// 提取路径
	const pq = pos + mLen - 1;
	let pe = pq + 1;
	while (pe < src.length && src[pe] !== '"') { if (src[pe] === '\\') pe++; pe++; }
	const path = src.substring(pq + 1, pe);

	// 找到 body 开始的大括号
	let bb = -1;
	for (let j = pe + 1; j < src.length && j < pe + 40; j++) {
		if (src[j] === '{') { bb = j; break; }
	}

	markers.push({ pos, type, varName, path, bodyBrace: bb });
	sp = pos + mLen;
}

console.log(`[rebundle] 发现 ${markers.length} 个模块 markers`);

// ============================================================
// Phase 4: 精确提取每个模块的 body 边界
// ============================================================

console.log('[rebundle] 精确计算每个模块 body 边界...');

for (let mi = 0; mi < markers.length; mi++) {
	const m = markers[mi];
	if (m.bodyBrace === -1) {
		m.bodyStart = -1;
		m.bodyEnd = -1;
		continue;
	}

	const boundary = mi + 1 < markers.length ? markers[mi + 1].pos : src.length;

	// 带边界的括号匹配（处理字符串、模板、注释、正则）
	let depth = 1;
	let i = m.bodyBrace + 1;
	let closingBrace = -1;

	while (i < boundary) {
		const ch = src[i];

		if (ch !== '{' && ch !== '}' && ch !== '"' && ch !== "'" && ch !== '`' && ch !== '/') {
			i++; continue;
		}

		// 字符串字面量
		if (ch === '"' || ch === "'") {
			i++;
			while (i < boundary) {
				if (src[i] === '\\') { i += 2; continue; }
				if (src[i] === ch) { i++; break; }
				i++;
			}
			continue;
		}

		// 模板字面量
		if (ch === '`') {
			i++;
			let td = 0;
			while (i < boundary) {
				const tc = src[i];
				if (tc === '\\') { i += 2; continue; }
				if (td === 0 && tc === '`') { i++; break; }
				if (tc === '$' && i + 1 < boundary && src[i + 1] === '{') { td++; i += 2; continue; }
				if (td > 0 && tc === '{') td++;
				if (td > 0 && tc === '}') td--;
				i++;
			}
			continue;
		}

		// 注释和正则
		if (ch === '/' && i + 1 < boundary) {
			if (src[i + 1] === '/') {
				i += 2;
				while (i < boundary && src[i] !== '\n') i++;
				continue;
			}
			if (src[i + 1] === '*') {
				i += 2;
				while (i < boundary - 1 && !(src[i] === '*' && src[i + 1] === '/')) i++;
				i += 2;
				continue;
			}
			// 正则启发式
			if (i > 0 && '(,=[!&|?:;{}~^%>+-'.includes(src[i - 1])) {
				i++;
				let inCC = false;
				while (i < boundary) {
					const rc = src[i];
					if (rc === '\\') { i += 2; continue; }
					if (rc === '[') { inCC = true; i++; continue; }
					if (rc === ']') { inCC = false; i++; continue; }
					if (rc === '/' && !inCC) { i++; break; }
					i++;
				}
				while (i < boundary && /[gimsuy]/.test(src[i])) i++;
				continue;
			}
		}

		if (ch === '{') { depth++; i++; continue; }
		if (ch === '}') {
			depth--;
			if (depth === 0) { closingBrace = i; break; }
			i++; continue;
		}
		i++;
	}

	// Fallback: 从边界往回搜索 }})
	if (closingBrace === -1) {
		for (let j = boundary - 1; j > m.bodyBrace; j--) {
			if (j >= 2 && src[j] === ')' && src[j - 1] === '}' && src[j - 2] === '}') {
				closingBrace = j - 2;
				break;
			}
		}
	}

	m.bodyStart = m.bodyBrace + 1;
	m.bodyEnd = closingBrace;
}

const validMarkers = markers.filter(m => m.bodyStart !== -1 && m.bodyEnd !== -1);
console.log(`[rebundle] 有效模块边界: ${validMarkers.length}/${markers.length}`);

// ============================================================
// Phase 5: 读取修改后的模块文件
// ============================================================

console.log('[rebundle] 读取修改后的模块文件...');

/**
 * 将模块路径转换为文件系统路径
 * out-build/vs/xxx → modules/vs/xxx
 * node_modules/xxx → modules/node_modules/xxx
 */
function modulePathToFilePath(modulePath) {
	let fp = modulePath.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
	// out-build/ 前缀去掉
	fp = fp.replace(/^out-build\//, '');
	return fp;
}

/**
 * 从模块文件中提取纯模块体（去掉头部注释和 import 语句）
 */
function extractModuleBody(fileContent) {
	const lines = fileContent.split('\n');
	let bodyStart = 0;

	// 跳过头部注释（所有 // 开头的行，包括 [Claude Editor] 注释）
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.startsWith('//')) {
			bodyStart = i + 1;
			continue;
		}
		break;
	}

	// 跳过空行
	while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
		bodyStart++;
	}

	// 跳过 import 语句
	while (bodyStart < lines.length) {
		const line = lines[bodyStart].trim();
		if (line.startsWith("import '") || line.startsWith('import "') || line.startsWith('import \'')) {
			bodyStart++;
			continue;
		}
		break;
	}

	// 跳过 import 后的空行
	while (bodyStart < lines.length && lines[bodyStart].trim() === '') {
		bodyStart++;
	}

	return lines.slice(bodyStart).join('\n');
}

/**
 * 去除 TypeScript 类型注解和参数装饰器
 *
 * 反混淆阶段添加了 @IServiceName 参数装饰器用于可读性，
 * 但原始 bundle 中使用的是 __param(idx, serviceId) 调用（已经在代码别处），
 * 所以这里需要把 @IServiceName paramName 还原为 paramName。
 *
 * 同时去除 `: TypeName` 类型注解和 `as Type` 断言。
 */
function stripTypeAnnotations(code) {
	let result = code;

	// 0. 删除 convert-to-ts 注入的 class field 声明
	//    这些是 convert-to-ts 脚本添加的 TS 类属性声明，在原始 JS 中不存在
	//    模式: `public FieldName: ITypeName;` — 可能在行首也可能内联
	//    必须完整删除（包括 public 关键字、字段名、类型注解和分号）
	result = result.replace(/(public|private|protected)\s+(readonly\s+)?[A-Za-z_$][\w$]*\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?\s*;/g, '');

	// 1. 去除参数装饰器: @IServiceName paramName → paramName
	//    匹配: @ICapitalized word (在函数参数上下文中)
	result = result.replace(/@I[A-Z][\w]*\s+(\w+)/g, '$1');

	// 2. 去除 public/private/protected [readonly] 访问修饰符（内联，非整行声明）
	//    如构造函数参数: constructor(public name: string) → constructor(name: string)
	result = result.replace(/\b(public|private|protected)\s+(readonly\s+)?(?=[\w$])/g, '');

	// 3. 去除 `: TypeName` 类型注解（参数和变量声明）
	//    匹配: paramName: ITypeName 或 paramName: TypeName<Generic>
	result = result.replace(/(\w+)\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?/g, '$1');

	// 4. 去除 'as Type' 强制转换
	//    匹配: expr as TypeName (后面跟着 , ) ; } 等)
	result = result.replace(/\bas\s+([A-Z][\w.]*(?:<[^>]+>)?)/g, '');

	return result;
}

/**
 * 从原始 bundle 的模块体中提取依赖调用前缀。
 * 原始模块体格式: "use strict";dep1(),dep2(),dep3(),...ACTUAL_CODE
 * 依赖调用是一系列 identifier() 调用，用逗号分隔。
 * 返回前缀字符串（包括 "use strict"; 和所有 dep() 调用及它们后面的逗号）。
 */
function extractDepPreamble(originalBody) {
	let i = 0;
	// 跳过 "use strict";
	if (originalBody.startsWith('"use strict";')) {
		i = '"use strict";'.length;
	} else if (originalBody.startsWith("'use strict';")) {
		i = "'use strict';".length;
	}
	// 匹配连续的 identifier() 调用（简单标识符后紧跟 ()）
	// 每个调用后跟 , 或不跟（最后一个）
	const depCallRe = /^([a-zA-Z_$][\w$]*)\(\)/;
	let preambleEnd = i;
	while (i < originalBody.length) {
		// 跳过空白
		while (i < originalBody.length && /[\s]/.test(originalBody[i])) i++;
		const slice = originalBody.substring(i);
		const m = slice.match(depCallRe);
		if (!m) break;
		i += m[0].length; // 跳过 "identifier()"
		preambleEnd = i;
		// 跳过逗号
		if (i < originalBody.length && originalBody[i] === ',') {
			i++;
			preambleEnd = i;
		} else {
			break; // 没有逗号说明后面是实际代码
		}
	}
	return originalBody.substring(0, preambleEnd);
}

// 构建变量名到修改后模块体的映射
const modifiedBodies = new Map();
let readCount = 0;
let modifiedCount = 0;
let tsCount = 0;
let syntaxErrors = 0;

for (const [varName, modulePath] of Object.entries(moduleMap)) {
	const relPath = modulePathToFilePath(modulePath);

	// 检查 .js 和 .ts 两种扩展名
	let filePath = join(modulesDir, relPath);
	let isTS = false;

	if (!existsSync(filePath)) {
		// 尝试 .ts
		const tsPath = filePath.replace(/\.js$/, '.ts');
		if (existsSync(tsPath)) {
			filePath = tsPath;
			isTS = true;
		} else {
			continue;
		}
	}

	const content = readFileSync(filePath, 'utf-8');
	let body = extractModuleBody(content);

	// TS 文件需要去除类型注解
	if (isTS) {
		body = stripTypeAnnotations(body);
		tsCount++;
	}

	// JS 文件中也可能有 @IService 装饰器（如手写的新模块）
	if (!isTS && body.includes('@I')) {
		body = stripTypeAnnotations(body);
	}

	// 空 body 检查：barrel/index 模块提取后只有 imports 没有实际代码
	// 跳过这些模块，使用原始 bundle 代码（原始代码中有正确的依赖调用）
	if (!body.trim()) {
		continue;
	}

	// 语法验证：用 Function 构造器快速检查 JS 语法
	// 如果模块体有语法错误，跳过该模块（使用原始 bundle 中的代码）
	try {
		new Function(body);
	} catch (syntaxErr) {
		syntaxErrors++;
		if (syntaxErrors <= 10) {
			console.log(`[rebundle] 语法错误，跳过 ${modulePath}: ${syntaxErr.message.substring(0, 80)}`);
		}
		continue;  // 不加入 modifiedBodies，rebundle 会使用原始代码
	}

	modifiedBodies.set(varName, body);
	readCount++;

	if (readCount % 500 === 0) {
		console.log(`[rebundle]   已读取 ${readCount} 个模块...`);
	}
}

console.log(`[rebundle] 读取了 ${readCount} 个模块文件 (${tsCount} 个 TypeScript, ${syntaxErrors} 个语法错误已跳过)`);

// ============================================================
// Phase 5a: 反混淆逆转（Re-obfuscation）
// ============================================================
// deobfuscate.js 将 shortVar → longName（如 On → IConfigurationService）
// 这里需要逆转：longName → shortVar，让模块体中的名称恢复为 bundle 中的原始名称
// 只逆转 global renames（Strategy 1 + Strategy 4），不处理 constructor param renames
// （ctor param renames 只改构造函数签名内部的局部名称，不影响跨模块引用）

console.log('[rebundle] 构建 re-obfuscation 逆转映射...');

const SERVICE_MAP_PATH = join(PROJECT_ROOT, 'scripts/data/service-map.json');
const SINGLETON_MAP_PATH = join(PROJECT_ROOT, 'scripts/data/singleton-map.json');

const serviceMap = JSON.parse(readFileSync(SERVICE_MAP_PATH, 'utf-8'));
const singletonMap = JSON.parse(readFileSync(SINGLETON_MAP_PATH, 'utf-8'));

// 构建逆转映射: longName → shortVar
// 注意：deobfuscate.js 只有在当前模块中有定义时才重命名，
// 但逆转时我们可以安全地全局替换，因为这些 longName 都是唯一的接口/类名
const reverseMap = new Map();

// Strategy 1 逆转: interfaceName → shortVar (来自 service-map.json)
for (const [shortVar, info] of Object.entries(serviceMap)) {
	if (info.interfaceName && shortVar !== info.interfaceName) {
		// 检查是否有冲突（多个 shortVar 映射到同一个 interfaceName）
		if (reverseMap.has(info.interfaceName)) {
			// 冲突！跳过，保留第一个映射
			console.log(`[rebundle] [警告] 逆转映射冲突: ${info.interfaceName} → ${reverseMap.get(info.interfaceName)} 和 ${shortVar}`);
		} else {
			reverseMap.set(info.interfaceName, shortVar);
		}
	}
}

// Strategy 4 逆转: implClassName → implVar (来自 singleton-map.json)
for (const [implVar, info] of Object.entries(singletonMap)) {
	if (!info.implClassName) continue;
	if (implVar.length <= 2) continue; // deobfuscate.js 跳过 <=2 字符的
	if (implVar === info.implClassName) continue;

	if (reverseMap.has(info.implClassName)) {
		console.log(`[rebundle] [警告] 逆转映射冲突: ${info.implClassName} → ${reverseMap.get(info.implClassName)} 和 ${implVar}`);
	} else {
		reverseMap.set(info.implClassName, implVar);
	}
}

console.log(`[rebundle] 逆转映射: ${reverseMap.size} 个条目 (${Object.keys(serviceMap).length} service + ${Object.keys(singletonMap).length} singleton)`);

// 按 longName 长度降序排列，避免短名匹配干扰长名
const sortedReverseEntries = [...reverseMap.entries()].sort((a, b) => b[0].length - a[0].length);

// 正则转义辅助函数
function escapeRegexRebundle(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 对模块体应用 re-obfuscation: 将人类可读名称替换回原始短变量名
 * 使用 word-boundary 匹配，与 deobfuscate.js 的 applyGlobalRenames 完全对称
 */
function reobfuscateModuleBody(body, reverseEntries) {
	let result = body;
	let totalCount = 0;

	for (const [longName, shortVar] of reverseEntries) {
		if (longName === shortVar) continue;
		// Word-boundary: 不匹配 longName 前后紧邻字母/数字/$/_ 的情况
		const regex = new RegExp(`(?<![\\w$])${escapeRegexRebundle(longName)}(?![\\w$])`, 'g');
		const before = result;
		result = result.replace(regex, shortVar);
		if (result !== before) {
			const matches = before.match(regex);
			totalCount += matches ? matches.length : 0;
		}
	}

	return { body: result, count: totalCount };
}

// 对每个 modifiedBody 应用 re-obfuscation
let reobfuscatedCount = 0;
let reobfuscatedRenames = 0;

for (const [varName, body] of modifiedBodies) {
	const { body: newBody, count } = reobfuscateModuleBody(body, sortedReverseEntries);
	if (count > 0) {
		modifiedBodies.set(varName, newBody);
		reobfuscatedCount++;
		reobfuscatedRenames += count;
	}
}

console.log(`[rebundle] Re-obfuscation: ${reobfuscatedCount} 个模块被逆转, 共 ${reobfuscatedRenames} 处替换`);

// 验证: 检查是否还有残留的 extends Disposable（应为 extends at）
{
	let disposableCount = 0;
	for (const [varName, body] of modifiedBodies) {
		const matches = body.match(/\bextends\s+Disposable\b/g);
		if (matches) {
			disposableCount += matches.length;
			if (disposableCount <= 5) {
				console.log(`[rebundle] [警告] 残留 extends Disposable 在模块 ${varName} (${matches.length} 处)`);
			}
		}
	}
	if (disposableCount > 0) {
		console.log(`[rebundle] [警告] 共有 ${disposableCount} 处 extends Disposable 残留！`);
	} else {
		console.log('[rebundle] [验证通过] 无 extends Disposable 残留');
	}
}

// ============================================================
// Phase 5b: 发现并注册新模块（不在原始 module-map.json 中）
// ============================================================

console.log('[rebundle] 扫描新增模块...');

/**
 * 新模块配置
 * 每个新模块需要：
 *   - modulePath: 模块路径（bundle 中显示的路径）
 *   - filePath: 文件系统中的路径（相对于 modulesDir）
 *   - varName: 分配的变量名
 *   - type: 'Ae' 或 'N0'
 *   - insertAfter: 插入在哪个模块变量名之后
 */
const NEW_MODULES_CONFIG = join(PROJECT_ROOT, 'extracted/cursor-unbundled/new-modules.json');
let newModules = [];

// 自动发现新模块：扫描模块目录中不在 module-map 中的文件
const knownPaths = new Set(Object.values(moduleMap));

function scanForNewModules(dir, prefix) {
	const { readdirSync, statSync } = await_import_fs();
	// 使用递归扫描是不现实的（太慢），改为检查已知的新模块位置
}

// 方法：从文件头部注释读取新模块元数据
function readNewModuleMetadata(filePath) {
	const content = readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');
	const meta = {};
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed.startsWith('//')) break;
		const m = trimmed.match(/^\/\/\s*Module:\s*(.+)/);
		if (m) meta.modulePath = m[1].trim();
		const v = trimmed.match(/^\/\/\s*Variable:\s*(.+)/);
		if (v) meta.varName = v[1].trim();
		const t = trimmed.match(/^\/\/\s*Type:\s*(\w+)/);
		if (t) meta.type = t[1].replace(/\s*\(.+\)/, '').trim();
	}
	meta.body = extractModuleBody(content);
	return meta;
}

// 检测新模块文件（通过 new-modules.json 配置或自动发现）
if (existsSync(NEW_MODULES_CONFIG)) {
	newModules = JSON.parse(readFileSync(NEW_MODULES_CONFIG, 'utf-8'));
	console.log(`[rebundle] 从 new-modules.json 读取 ${newModules.length} 个新模块配置`);
} else {
	// 自动发现：递归扫描所有模块文件，检查 // Module: 路径是否在 knownPaths 中
	// 不在 knownPaths 中的 → 新模块
	let newModuleCounter = 0;

	function findNewModulesInDir(dir) {
		let found = [];
		let entries;
		try { entries = readdirSync(dir); } catch { return found; }
		for (const entry of entries) {
			const fullPath = join(dir, entry);
			let stat;
			try { stat = statSync(fullPath); } catch { continue; }
			if (stat.isDirectory()) {
				found = found.concat(findNewModulesInDir(fullPath));
			} else if (entry.endsWith('.js') || entry.endsWith('.ts')) {
				// 快速读文件头部，提取 // Module: 行
				const fd = openSync(fullPath, 'r');
				const buf = Buffer.alloc(1024);
				const bytesRead = readSync(fd, buf, 0, 1024, 0);
				closeSync(fd);
				const header = buf.toString('utf-8', 0, bytesRead);

				const moduleMatch = header.match(/^\/\/\s*Module:\s*(.+)/m);
				if (!moduleMatch) continue;

				const modulePath = moduleMatch[1].trim();
				// 已知模块跳过
				if (knownPaths.has(modulePath)) continue;

				// 只有标记了 [Claude Editor] 的文件才是真正的新模块
				// 其他情况可能是反混淆改了 Module 头注释导致路径不匹配
				if (!header.includes('[Claude Editor]')) continue;

				// 这是一个新模块
				const meta = readNewModuleMetadata(fullPath);
				if (!meta.modulePath) continue;

				// 如果没有 Variable 头，自动生成一个
				if (!meta.varName) {
					newModuleCounter++;
					const basename = meta.modulePath.split('/').pop().replace(/\.\w+$/, '');
					meta.varName = `_claude_${basename}_${newModuleCounter}`;
				}

				// 自动检测 CJS vs ESM：如果 body 包含 require() 或 module.exports → N0
				if (!meta.type) {
					const bodyPreview = meta.body || '';
					if (bodyPreview.includes('require(') || bodyPreview.includes('module.exports')) {
						meta.type = 'N0';
					} else {
						meta.type = 'Ae';
					}
				}

				found.push({
					modulePath: meta.modulePath,
					varName: meta.varName,
					type: meta.type,
					filePath: fullPath,
					body: meta.body
				});
			}
		}
		return found;
	}

	const { readdirSync, statSync, openSync, readSync, closeSync } = await import('node:fs');
	newModules = findNewModulesInDir(modulesDir);
	if (newModules.length > 0) {
		console.log(`[rebundle] 自动发现 ${newModules.length} 个新模块:`);
		for (const nm of newModules) {
			console.log(`  - ${nm.varName}: ${nm.modulePath}`);
		}
	} else {
		console.log('[rebundle] 没有发现新模块');
	}
}

// 为新模块读取 body（如果还没读取的话），并统一去除 TS/装饰器注解
for (const nm of newModules) {
	if (!nm.body) {
		const fp = nm.filePath || join(modulesDir, modulePathToFilePath(nm.modulePath));
		if (existsSync(fp)) {
			nm.body = extractModuleBody(readFileSync(fp, 'utf-8'));
		} else {
			const tsPath = fp.replace(/\.js$/, '.ts');
			if (existsSync(tsPath)) {
				nm.body = extractModuleBody(readFileSync(tsPath, 'utf-8'));
			} else {
				console.log(`[rebundle] [警告] 新模块文件未找到: ${fp}`);
			}
		}
	}
	// 新模块总是需要去除可能的类型注解和装饰器
	if (nm.body) {
		nm.body = stripTypeAnnotations(nm.body);
		// 新模块也需要 re-obfuscation（如果开发时使用了人类可读名称）
		const { body: reobBody, count: reobCount } = reobfuscateModuleBody(nm.body, sortedReverseEntries);
		if (reobCount > 0) {
			nm.body = reobBody;
			console.log(`[rebundle] 新模块 ${nm.varName} re-obfuscation: ${reobCount} 处替换`);
		}
	}
}

// 确定新模块的插入位置：找到它们应该插入在哪个原始模块之后
for (const nm of newModules) {
	if (!nm.insertAfter) {
		// 默认：根据模块路径推断，放在同目录的模块之后
		const dir = nm.modulePath.substring(0, nm.modulePath.lastIndexOf('/'));
		let bestMarkerIdx = -1;
		for (let i = 0; i < validMarkers.length; i++) {
			if (validMarkers[i].path.startsWith(dir)) {
				bestMarkerIdx = i;
			}
		}
		if (bestMarkerIdx >= 0) {
			nm.insertAfterVar = validMarkers[bestMarkerIdx].varName;
			nm.insertAfterIdx = bestMarkerIdx;
		} else {
			// 放在最后一个模块之后
			nm.insertAfterIdx = validMarkers.length - 1;
			nm.insertAfterVar = validMarkers[validMarkers.length - 1].varName;
		}
	} else {
		nm.insertAfterVar = nm.insertAfter;
		nm.insertAfterIdx = validMarkers.findIndex(m => m.varName === nm.insertAfter);
	}
	console.log(`[rebundle] 新模块 ${nm.varName} 将插入在 ${nm.insertAfterVar} 之后`);
}

// 生成新模块的 bundle 代码
function wrapNewModule(nm) {
	const path = nm.modulePath;
	const varName = nm.varName;
	const type = nm.type || 'Ae';
	let body = nm.body || '';

	if (nm._isInCommaChain) {
		// 在逗号链中：不用 var 关键字，用逗号分隔
		if (type === 'N0') {
			return `,${varName}=N0({"${path}"(n){var module={exports:n};${body};Object.assign(n,module.exports)}})`;
		}
		return `,${varName}=Ae({"${path}"(){${body}}})`;
	}

	// 不在逗号链中：用独立 var 语句，前面加分号确保分隔
	if (type === 'N0') {
		return `;var ${varName}=N0({"${path}"(n){var module={exports:n};${body};Object.assign(n,module.exports)}});`;
	}
	return `;var ${varName}=Ae({"${path}"(){${body}}});`;
}

// ============================================================
// Phase 6: 替换模块体，生成新 bundle
// ============================================================

console.log('[rebundle] 开始替换模块体...');

// 策略：从后向前替换，这样不会影响前面的偏移量
// 收集所有需要替换的区间 [bodyStart, bodyEnd] → newBody
const replacements = [];

for (const m of validMarkers) {
	const newBody = modifiedBodies.get(m.varName);
	if (newBody !== undefined) {
		replacements.push({
			start: m.bodyStart,
			end: m.bodyEnd,
			newBody: newBody,
			varName: m.varName,
			path: m.path
		});
	}
}

console.log(`[rebundle] 需要替换 ${replacements.length} 个模块体`);

// 按 start 偏移量降序排列（从后向前替换）
replacements.sort((a, b) => b.start - a.start);

// 使用 Buffer 拼接的方式高效构建结果
// 先找出所有不替换的区间和替换区间
// 为了效率，用数组收集片段

// 构建替换 map: start → {end, newBody}
const replaceMap = new Map();
for (const r of replacements) {
	replaceMap.set(r.start, r);
}

// 构建新模块插入位置索引: markerIndex → [newModule, ...]
const newModuleInsertions = new Map();
for (const nm of newModules) {
	const idx = nm.insertAfterIdx;
	if (idx >= 0 && nm.body) {
		if (!newModuleInsertions.has(idx)) newModuleInsertions.set(idx, []);
		newModuleInsertions.get(idx).push(nm);
	}
}

// 按照原始顺序遍历，构建输出片段
console.log('[rebundle] 构建输出...');

const pieces = [];
let cursor = 0;
let replacedCount = 0;
let unchangedCount = 0;
let sizeChange = 0;
let newModulesInserted = 0;

for (let mi = 0; mi < validMarkers.length; mi++) {
	const m = validMarkers[mi];
	const replacement = replaceMap.get(m.bodyStart);

	if (replacement) {
		// 保留 bodyStart 之前的所有内容（包括 inter-module code、module header）
		pieces.push(src.substring(cursor, m.bodyStart));

		// 从原始 body 中提取依赖调用前缀（"use strict";dep1(),dep2(),...）
		// 这些依赖调用确保模块的 lazy 依赖在执行前已初始化
		const originalBody = src.substring(m.bodyStart, m.bodyEnd);
		let depPreamble = extractDepPreamble(originalBody);

		// 如果 preamble 以逗号结尾但新 body 以声明关键字开头，
		// 将逗号改为分号（声明不能跟在逗号表达式后面）
		if (depPreamble.endsWith(',')) {
			const bodyTrimmed = replacement.newBody.trimStart();
			// 检查是否以注释开头，如果是，跳过注释查看第一个实际代码
			let firstCode = bodyTrimmed;
			if (firstCode.startsWith('//')) {
				const nlIdx = firstCode.indexOf('\n');
				if (nlIdx >= 0) firstCode = firstCode.substring(nlIdx + 1).trimStart();
			}
			if (/^(const |let |var |class |function |import |export )/.test(firstCode)) {
				depPreamble = depPreamble.slice(0, -1) + ';';
			}
		}

		// 组合: 原始依赖前缀 + 修改后的模块代码
		const combinedBody = depPreamble + replacement.newBody;
		pieces.push(combinedBody);
		sizeChange += combinedBody.length - originalBody.length;

		cursor = m.bodyEnd;
		replacedCount++;
	}
	// 不替换的模块保持原样（不需要特别处理，原文会被包含在下一段的 substring 中）

	// 在此模块之后插入新模块
	if (newModuleInsertions.has(mi)) {
		// 确保 cursor 走到了 bodyEnd 之后的 }}) 结束位置
		if (cursor <= m.bodyEnd) {
			let closePos = m.bodyEnd;
			// bodyEnd 是内层 } 的位置, 之后应该是 }})
			while (closePos < src.length && src[closePos] !== ')') closePos++;
			closePos++; // 跳过 )

			pieces.push(src.substring(cursor, closePos));
			cursor = closePos;
		}

		// 检测当前位置是逗号链中还是分号/语句结束
		const nextChar = cursor < src.length ? src[cursor] : '';
		const isInCommaChain = (nextChar === ',' || nextChar === ')');

		for (const nm of newModuleInsertions.get(mi)) {
			nm._isInCommaChain = isInCommaChain;
			const wrappedCode = wrapNewModule(nm);
			pieces.push(wrappedCode);
			newModulesInserted++;
			const fmt = isInCommaChain ? '逗号链' : '独立语句';
			console.log(`[rebundle] 注入新模块: ${nm.varName} (${nm.modulePath}) [${fmt}]`);
		}
	}
}

// 追加最后剩余的内容（最后一个模块之后的 entry 代码）
pieces.push(src.substring(cursor));

let output = pieces.join('');

// Phase 6b: 全局 TS 语法清理
// convert-to-ts 可能在模块和 entry code 中都注入了 TS class field 声明
// 只删除完整的 "public/private/protected FieldName: ITypeName;" 行
{
	const tsBefore = output.length;
	// 删除 convert-to-ts 注入的 class field 声明（内联和独立行都匹配）
	output = output.replace(/(public|private|protected)\s+(readonly\s+)?[A-Za-z_$][\w$]*\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?\s*;/g, '');
	// 也删除已被部分 strip 后残留的孤立标识符（如 "ConfigurationResolverService;"）
	output = output.replace(/(?<=[\{\n])[ \t]*[A-Z][A-Za-z]*Service\s*;/g, '');
	const tsRemoved = tsBefore - output.length;
	if (tsRemoved > 0) {
		console.log(`[rebundle] 全局 TS 清理: 移除了 ${tsRemoved} 字节的类型注解`);
	}
}

console.log(`[rebundle] 替换了 ${replacedCount} 个模块体`);
console.log(`[rebundle] 注入了 ${newModulesInserted} 个新模块`);
console.log(`[rebundle] 大小变化: ${sizeChange > 0 ? '+' : ''}${(sizeChange / 1024).toFixed(1)} KB`);

// ============================================================
// Phase 7: 写入输出文件
// ============================================================

const outputDir = dirname(outputFile);
mkdirSync(outputDir, { recursive: true });

console.log(`[rebundle] 写入: ${outputFile}`);
writeFileSync(outputFile, output);

// ============================================================
// Phase 8: 验证
// ============================================================

console.log('\n[rebundle] === 验证 ===');
console.log(`  原始大小: ${(src.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`  输出大小: ${(output.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`  大小比: ${(output.length / src.length * 100).toFixed(1)}%`);
console.log(`  已替换模块: ${replacedCount}`);
console.log(`  新增模块: ${newModulesInserted}`);
console.log(`  未修改模块（使用原始）: ${validMarkers.length - replacedCount}`);
console.log(`  TS 模块（类型已去除）: ${tsCount}`);

// 验证所有模块路径字符串存在
let pathsFound = 0;
let pathsMissing = 0;
for (const [varName, modulePath] of Object.entries(moduleMap)) {
	if (output.includes(`"${modulePath}"`)) {
		pathsFound++;
	} else {
		pathsMissing++;
		if (pathsMissing <= 5) {
			console.log(`  [警告] 模块路径未找到: ${modulePath} (var: ${varName})`);
		}
	}
}
console.log(`  模块路径验证: ${pathsFound} 找到, ${pathsMissing} 缺失`);

// 验证新模块路径
for (const nm of newModules) {
	if (nm.body) {
		const found = output.includes(`"${nm.modulePath}"`);
		console.log(`  新模块 ${nm.varName}: ${found ? '已注入' : '注入失败!'}`);
	}
}

// 验证 GN 导出映射完整
const gnMatches = output.match(/GN\(/g);
console.log(`  GN() 调用: ${gnMatches ? gnMatches.length : 0}`);

// 验证 Ae/N0 函数引用
const aeCount = (output.match(/=Ae\(/g) || []).length;
const n0Count = (output.match(/=N0\(/g) || []).length;
console.log(`  Ae 模块: ${aeCount}, N0 模块: ${n0Count}`);

console.log(`\n[rebundle] 完成！输出文件: ${outputFile}`);
