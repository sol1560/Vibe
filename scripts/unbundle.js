#!/usr/bin/env node
/**
 * Cursor workbench.desktop.main.js 自动拆包脚本 v3
 *
 * 策略：先找到所有 marker 位置，然后用带边界的括号匹配提取每个模块体。
 * 括号匹配包含正则表达式字面量处理以避免深度计数错误。
 *
 * 用法: node scripts/unbundle.js [input] [output-dir]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'extracted/cursor-app/out/vs/workbench/workbench.desktop.main.js');
const DEFAULT_OUTPUT = join(PROJECT_ROOT, 'extracted/cursor-unbundled');

const inputFile = process.argv[2] || DEFAULT_INPUT;
const outputDir = process.argv[3] || DEFAULT_OUTPUT;

console.log(`[unbundle] 读取 ${inputFile}...`);
const src = readFileSync(inputFile, 'utf-8');
console.log(`[unbundle] 文件大小: ${(src.length / 1024 / 1024).toFixed(1)} MB`);

// ============================================================
// Phase 1: Find ALL marker positions
// ============================================================

console.log('[unbundle] 定位所有模块 markers...');

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

	// Extract variable name
	let ne = pos, ns = ne - 1;
	while (ns >= 0 && /[\w$]/.test(src[ns])) ns--;
	ns++;
	const varName = src.substring(ns, ne);

	// Extract path
	const pq = pos + mLen - 1;
	let pe = pq + 1;
	while (pe < src.length && src[pe] !== '"') { if (src[pe] === '\\') pe++; pe++; }
	const path = src.substring(pq + 1, pe);

	// Find body brace
	let bb = -1;
	for (let j = pe + 1; j < src.length && j < pe + 40; j++) {
		if (src[j] === '{') { bb = j; break; }
	}

	markers.push({ pos, type, varName, path, bodyBrace: bb });
	sp = pos + mLen;
}

console.log(`[unbundle] 发现 ${markers.length} 个 markers`);

// ============================================================
// Phase 2: Runtime preamble
// ============================================================

let cutPoint = markers[0].pos;
for (let i = cutPoint - 1; i >= 0; i--) {
	if (',;\n'.includes(src[i])) { cutPoint = i + 1; break; }
}
const runtimeCode = src.substring(0, cutPoint);
console.log(`[unbundle] 运行时代码: ${(runtimeCode.length / 1024).toFixed(1)} KB`);

// ============================================================
// Phase 3: Extract module bodies with bounded brace matching
// ============================================================

console.log('[unbundle] 提取模块体...');

const modules = [];
const moduleMap = new Map();
const exportMap = new Map();
let fallbackCount = 0;

for (let mi = 0; mi < markers.length; mi++) {
	const m = markers[mi];
	if (m.bodyBrace === -1) continue;

	// Boundary: don't scan past the next marker's = sign
	const boundary = mi + 1 < markers.length ? markers[mi + 1].pos : src.length;

	// Bounded brace counting with string/template/comment/regex handling
	let depth = 1;
	let i = m.bodyBrace + 1;
	let closingBrace = -1;

	while (i < boundary) {
		const ch = src[i];

		// Fast skip for common chars
		if (ch !== '{' && ch !== '}' && ch !== '"' && ch !== "'" && ch !== '`' && ch !== '/') {
			i++; continue;
		}

		// String literals
		if (ch === '"' || ch === "'") {
			i++;
			while (i < boundary) {
				if (src[i] === '\\') { i += 2; continue; }
				if (src[i] === ch) { i++; break; }
				i++;
			}
			continue;
		}

		// Template literals
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

		// Comments and regex
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
			// Regex heuristic
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

	// Fallback: search backward from boundary for }})
	if (closingBrace === -1) {
		fallbackCount++;
		for (let j = boundary - 1; j > m.bodyBrace; j--) {
			if (j >= 2 && src[j] === ')' && src[j - 1] === '}' && src[j - 2] === '}') {
				closingBrace = j - 2;
				break;
			}
		}
	}

	if (closingBrace === -1) continue;

	const body = src.substring(m.bodyBrace + 1, closingBrace);
	modules.push({
		varName: m.varName, path: m.path, type: m.type,
		markerPos: m.pos, bodyStart: m.bodyBrace + 1, bodyEnd: closingBrace,
		body, deps: [], exports: {}
	});
	moduleMap.set(m.varName, m.path);

	if ((mi + 1) % 500 === 0) console.log(`[unbundle]   已提取 ${mi + 1}/${markers.length}...`);
}

console.log(`[unbundle] 提取完成: ${modules.length} 个模块 (${fallbackCount} fallback)`);

// ============================================================
// Phase 4: GN() export mappings
// ============================================================

console.log('[unbundle] 提取 GN() 导出映射...');
let gnCount = 0;
let gnSp = 0;
while (true) {
	const gnIdx = src.indexOf('GN(', gnSp);
	if (gnIdx === -1) break;
	let as = gnIdx + 3, ae = as;
	while (ae < src.length && /[\w$]/.test(src[ae])) ae++;
	const exportsVar = src.substring(as, ae);
	if (src[ae] !== ',') { gnSp = ae; continue; }
	let os = ae + 1;
	while (os < src.length && src[os] !== '{') os++;
	if (os >= src.length) break;
	let od = 1, oe = os + 1;
	while (oe < src.length && od > 0) {
		if (src[oe] === '{') od++;
		else if (src[oe] === '}') od--;
		else if (src[oe] === '"' || src[oe] === "'") {
			const q = src[oe]; oe++;
			while (oe < src.length && src[oe] !== q) { if (src[oe] === '\\') oe++; oe++; }
		}
		oe++;
	}
	const objContent = src.substring(os + 1, oe - 1);
	const mappings = {};
	const pp = /(\w+):\(\)=>(\w+)/g;
	let pm;
	while ((pm = pp.exec(objContent)) !== null) mappings[pm[1]] = pm[2];
	if (Object.keys(mappings).length > 0) {
		const mv = exportsVar.replace(/_exports$/, '');
		const mp = moduleMap.get(mv);
		if (mp) {
			exportMap.set(mp, mappings);
			const mod = modules.find(m => m.varName === mv);
			if (mod) mod.exports = mappings;
		} else {
			exportMap.set(exportsVar, mappings);
		}
		gnCount++;
	}
	gnSp = oe;
}
console.log(`[unbundle] 发现 ${gnCount} 个 GN() 导出映射`);

// ============================================================
// Phase 5: Dependency graph
// ============================================================

console.log('[unbundle] 构建依赖关系图...');
const allVarNames = new Set(moduleMap.keys());
const dependencyGraph = {};
for (const mod of modules) {
	const deps = new Set();
	const cp = /\b(\w{2,})\(\)/g;
	let cm;
	while ((cm = cp.exec(mod.body)) !== null) {
		if (allVarNames.has(cm[1]) && cm[1] !== mod.varName) deps.add(cm[1]);
	}
	mod.deps = Array.from(deps);
	dependencyGraph[mod.path] = mod.deps.map(d => moduleMap.get(d) || d);
}
const totalDeps = Object.values(dependencyGraph).reduce((s, d) => s + d.length, 0);
console.log(`[unbundle] 依赖关系: ${totalDeps} 条边`);

// ============================================================
// Phase 6: Entry code
// ============================================================

const lastMod = modules[modules.length - 1];
let entryStart = lastMod.bodyEnd;
const ci = src.indexOf('}})', entryStart);
entryStart = ci !== -1 ? ci + 3 : entryStart + 1;
const entryCode = src.substring(entryStart);
console.log(`[unbundle] 入口代码: ${(entryCode.length / 1024).toFixed(1)} KB`);

// ============================================================
// Phase 7: Write output
// ============================================================

console.log(`[unbundle] 写入文件到 ${outputDir}...`);
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, '_runtime.js'), runtimeCode);
writeFileSync(join(outputDir, '_entry.js'), entryCode);

let writtenCount = 0;
let totalBodySize = 0;
const pathCollisions = new Map();

for (const mod of modules) {
	let fp = mod.path.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
	if (!fp.endsWith('.js') && !fp.endsWith('.ts')) fp += '.js';
	if (fp.endsWith('.ts')) fp = fp.replace(/\.ts$/, '.js');
	fp = fp.replace(/^out-build\//, '');

	const cnt = (pathCollisions.get(fp) || 0) + 1;
	pathCollisions.set(fp, cnt);
	const ap = cnt > 1 ? fp.replace(/\.js$/, `.${cnt}.js`) : fp;

	const fullPath = join(outputDir, 'modules', ap);
	mkdirSync(dirname(fullPath), { recursive: true });

	const hdr = [
		`// Module: ${mod.path}`,
		`// Variable: ${mod.varName}`,
		`// Type: ${mod.type}`,
		mod.deps.length > 0 ? `// Dependencies: ${mod.deps.map(d => moduleMap.get(d) || d).join(', ')}` : null,
		Object.keys(mod.exports).length > 0 ? `// Exports: ${Object.keys(mod.exports).join(', ')}` : null,
		'',
	].filter(Boolean).join('\n');

	writeFileSync(fullPath, hdr + '\n' + mod.body);
	totalBodySize += mod.body.length;
	writtenCount++;
	if (writtenCount % 500 === 0) console.log(`[unbundle]   已写入 ${writtenCount}...`);
}

console.log(`[unbundle] 写入 ${writtenCount} 个模块文件`);

// JSON outputs
const mmObj = {}; for (const [v, p] of moduleMap) mmObj[v] = p;
writeFileSync(join(outputDir, 'module-map.json'), JSON.stringify(mmObj, null, 2));
writeFileSync(join(outputDir, 'dependency-graph.json'), JSON.stringify(dependencyGraph, null, 2));
const emObj = {}; for (const [p, m] of exportMap) emObj[p] = m;
writeFileSync(join(outputDir, 'export-map.json'), JSON.stringify(emObj, null, 2));

const biP = /Bi\("([^"]+)"\)/g;
const svcIds = []; let bm;
while ((bm = biP.exec(src)) !== null) svcIds.push(bm[1]);
const uniqSvcIds = [...new Set(svcIds)];

const stats = {
	inputFile, inputSize: src.length,
	totalModules: modules.length,
	aeModules: modules.filter(m => m.type === 'Ae').length,
	n0Modules: modules.filter(m => m.type === 'N0').length,
	fallbackCount,
	runtimeSize: runtimeCode.length,
	entrySize: entryCode.length,
	totalBodySize,
	totalDependencyEdges: totalDeps,
	gnExportMappings: gnCount,
	serviceIdCount: uniqSvcIds.length,
	modulesByPrefix: (() => {
		const p = {};
		for (const mod of modules) { const k = mod.path.split('/').slice(0, 2).join('/'); p[k] = (p[k]||0)+1; }
		return Object.fromEntries(Object.entries(p).sort((a,b) => b[1]-a[1]));
	})(),
	timestamp: new Date().toISOString()
};
writeFileSync(join(outputDir, 'stats.json'), JSON.stringify(stats, null, 2));

// ============================================================
// Verification
// ============================================================

console.log('\n[unbundle] === 验证 ===');
console.log(`  输入大小: ${(src.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`  运行时: ${(runtimeCode.length / 1024).toFixed(1)} KB`);
console.log(`  入口代码: ${(entryCode.length / 1024).toFixed(1)} KB`);
console.log(`  模块体总大小: ${(totalBodySize / 1024 / 1024).toFixed(1)} MB`);
const overhead = src.length - runtimeCode.length - entryCode.length - totalBodySize;
console.log(`  模块间开销: ${(overhead / 1024).toFixed(1)} KB (${(overhead / src.length * 100).toFixed(1)}%)`);
console.log(`  模块总数: ${modules.length} (Ae: ${stats.aeModules}, N0: ${stats.n0Modules})`);
console.log(`  Fallback: ${fallbackCount}`);
console.log(`  依赖边数: ${totalDeps}`);
console.log(`  GN 导出: ${gnCount}`);
console.log(`  服务 ID: ${uniqSvcIds.length}`);
console.log(`  文件已写入: ${writtenCount}`);

// Large modules check
const large = modules.filter(m => m.body.length > 500000).sort((a,b) => b.body.length - a.body.length);
if (large.length > 0) {
	console.log(`\n  大模块 (>500KB):`);
	for (const m of large.slice(0, 10))
		console.log(`    ${(m.body.length/1024).toFixed(0)} KB  ${m.varName} → ${m.path}`);
}

// Coverage sanity check
const coverage = runtimeCode.length + entryCode.length + totalBodySize;
const ratio = coverage / src.length * 100;
if (ratio > 110 || ratio < 80) {
	console.warn(`\n  ⚠ 覆盖率 ${ratio.toFixed(1)}% 异常 (期望 85-105%)`);
}

if (modules.length < 2700) {
	console.warn(`\n  ⚠ 模块数 ${modules.length} 低于预期 2763`);
}

console.log('\n[unbundle] 完成!');
