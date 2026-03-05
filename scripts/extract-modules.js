#!/usr/bin/env node
/**
 * extract-modules.js
 *
 * 从 Cursor 的 workbench.desktop.main.js bundle 中提取各个模块。
 *
 * Bundle 使用 AMD 风格的模块系统，每个模块由如下模式定义：
 *   Ae({"out-build/vs/workbench/contrib/composer/browser/constants.js"(){ ... }})
 *
 * 本脚本通过正则匹配模块边界，提取每个模块的代码，
 * 并将其保存到对应的目录结构中。
 *
 * 用法: node scripts/extract-modules.js [filter]
 *   filter: 可选，模块路径过滤（如 "composer" 只提取 composer 相关模块）
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '../extracted/cursor-app/out/vs/workbench/workbench.desktop.main.js');
const OUTPUT_DIR = path.join(__dirname, '../extracted/cursor-modules');
const FILTER = process.argv[2] || null;

console.log('Reading bundle file...');
const code = fs.readFileSync(BUNDLE_PATH, 'utf-8');
console.log(`Bundle size: ${(code.length / 1024 / 1024).toFixed(1)} MB, ${code.split('\n').length} lines`);

// 策略: 找到所有 "out-build/vs/..." 模块路径及其在代码中的位置
// 模块边界模式: Ae({"out-build/vs/path/to/module.js"(){
const MODULE_PATTERN = /Ae\(\{"(out-build\/vs\/[^"]+\.(?:js|css))"\(\)\{/g;

const modules = [];
let match;
while ((match = MODULE_PATTERN.exec(code)) !== null) {
  const modulePath = match[1];
  const startIndex = match.index;
  // 模块代码从 "use strict"; 或立即开始
  const codeStartIndex = match.index + match[0].length;

  modules.push({
    path: modulePath,
    startIndex,
    codeStartIndex,
  });
}

console.log(`Found ${modules.length} modules total`);

// 对模块按位置排序
modules.sort((a, b) => a.startIndex - b.startIndex);

// 计算每个模块的结束位置（下一个模块的开始位置之前的 `}})` 就是结束）
for (let i = 0; i < modules.length; i++) {
  if (i < modules.length - 1) {
    // 找下一个模块开始前的最后一个 "}}" 或 "}})"
    const searchEnd = modules[i + 1].startIndex;
    const searchStart = modules[i].codeStartIndex;
    const segment = code.substring(searchStart, searchEnd);

    // 向后查找匹配的闭合 — 模块以 `}})` 结尾
    // 我们需要找到正确的闭合位置
    // 简化方案：取下一个 Ae({ 之前的内容，然后向前截断到 }})
    const lastClose = segment.lastIndexOf('}})');
    if (lastClose !== -1) {
      modules[i].endIndex = searchStart + lastClose;
    } else {
      // 退回：用下一模块的 startIndex
      modules[i].endIndex = searchEnd;
    }
  } else {
    // 最后一个模块：找文件末尾前的 }})
    const segment = code.substring(modules[i].codeStartIndex);
    const lastClose = segment.lastIndexOf('}})');
    modules[i].endIndex = lastClose !== -1
      ? modules[i].codeStartIndex + lastClose
      : code.length;
  }
}

// 过滤
const filtered = FILTER
  ? modules.filter(m => m.path.includes(FILTER))
  : modules;

console.log(`Extracting ${filtered.length} modules${FILTER ? ` (filter: "${FILTER}")` : ''}...`);

let extracted = 0;
let skipped = 0;

for (const mod of filtered) {
  const moduleCode = code.substring(mod.codeStartIndex, mod.endIndex);

  // 转换路径: out-build/vs/workbench/... → vs/workbench/...
  const relativePath = mod.path.replace('out-build/', '');
  const outputPath = path.join(OUTPUT_DIR, relativePath);

  // 创建目录
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  // 生成文件头注释
  const header = [
    `// Source: ${mod.path}`,
    `// Extracted from Cursor IDE workbench.desktop.main.js`,
    `// Bundle position: chars ${mod.codeStartIndex}-${mod.endIndex}`,
    `// NOTE: Variable names are minified. Restore meaningful names based on context.`,
    '',
  ].join('\n');

  // 清理代码
  let cleanCode = moduleCode;
  // 移除开头的 "use strict";
  cleanCode = cleanCode.replace(/^"use strict";\s*/, '');

  fs.writeFileSync(outputPath, header + cleanCode, 'utf-8');
  extracted++;
}

console.log(`\nDone! Extracted ${extracted} modules to ${OUTPUT_DIR}`);
console.log(`Skipped ${skipped} modules`);

// 生成模块索引
const index = filtered.map(m => {
  const relativePath = m.path.replace('out-build/', '');
  const size = m.endIndex - m.codeStartIndex;
  return `${relativePath} (${(size / 1024).toFixed(1)} KB)`;
}).join('\n');

const indexPath = path.join(OUTPUT_DIR, 'MODULE_INDEX.txt');
fs.writeFileSync(indexPath, `# Extracted Cursor Modules\n# Filter: ${FILTER || 'none'}\n# Total: ${filtered.length}\n\n${index}\n`);
console.log(`Module index: ${indexPath}`);
