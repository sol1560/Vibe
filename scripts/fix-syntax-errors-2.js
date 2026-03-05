#!/usr/bin/env node
/**
 * fix-syntax-errors-2.js — 修复第二批语法错误文件
 * 针对第一次修复脚本未能修复的 10 个文件
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/Users/sollin/Claude-Editor';
const MODULES = join(ROOT, 'extracted/cursor-unbundled/modules');

let fixedCount = 0;
const errors = [];

function read(relPath) {
  return readFileSync(join(MODULES, relPath), 'utf-8');
}

function write(relPath, content) {
  writeFileSync(join(MODULES, relPath), content);
  fixedCount++;
  console.log(`[fix2] 已修复: ${relPath}`);
}

/**
 * 提取模块 body（跳过所有 import 语句）
 */
function extractBody(content) {
  const lines = content.split('\n');
  let bodyStart = 0;
  // Skip // comment header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  // Skip blank lines
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  // Skip ALL import statements (both side-effect 'import ...' and named 'import { } from ...')
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith('import ')) { bodyStart++; continue; }
    if (line === '') { bodyStart++; continue; }
    break;
  }
  return bodyStart;
}

function stripTypeAnnotations(code) {
  let result = code;
  result = result.replace(/(public|private|protected)\s+(readonly\s+)?[A-Za-z_$][\w$]*\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?\s*;/g, '');
  result = result.replace(/@I[A-Z][\w]*\s+(\w+)/g, '$1');
  result = result.replace(/\b(public|private|protected)\s+(readonly\s+)?(?=[\w$])/g, '');
  result = result.replace(/(\w+)\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?/g, '$1');
  result = result.replace(/\bas\s+([A-Z][\w.]*(?:<[^>]+>)?)/g, '');
  return result;
}

function testBody(body) {
  try { new Function(body); return true; } catch(e) { return false; }
}

function getError(body) {
  try { new Function(body); return null; } catch(e) { return e.message; }
}

// ============================================================
// Fix: TS 文件中的 named imports 残留
// The real fix: use extractBody that skips ALL imports
// The rebundle.js uses its own extractModuleBody which only skips 'import ...'
// We need to also update rebundle.js OR fix these files to remove the named imports
// BEST: remove named imports from the file header (keep side-effect imports)
// so that rebundle's extractModuleBody works correctly
// ============================================================

function removeNamedImports(content) {
  // Remove named imports: import { ... } from '...'
  return content.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"].*$/gm, '');
}

const namedImportFiles = [
  'vs/editor/browser/services/inlineDiffService.ts',
  'vs/workbench/contrib/composer/browser/composerUtilsService.ts',
  'vs/workbench/contrib/composer/browser/services/composerPlanService.ts',
  'vs/workbench/services/ai/browser/githubPRService.ts',
];

for (const relPath of namedImportFiles) {
  const content = read(relPath);
  let fixed = removeNamedImports(content);

  // Verify with rebundle's extractModuleBody logic (skips only 'import ...' side-effect)
  const lines = fixed.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { bodyStart++; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);

  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = getError(body);
    errors.push({ file: relPath, error: err });
    console.log(`[fix2] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix: aiCodeEventTracking.ts — const enum r inside function body
// The const enum r { linesAdded=0, ... } is used as accumulator object
// Replace with: r = { linesAdded: 0, linesRemoved: 0, filesProcessed: 0 }
// ============================================================
{
  const relPath = 'vs/workbench/contrib/analytics/browser/aiCodeEventTracking.ts';
  const content = read(relPath);

  // Fix: const enum r { ... } used as object → replace with object literal
  // The pattern in code: "const enum r {\n  linesAdded = 0,\n  linesRemoved = 0,\n  filesProcessed = 0\n},"
  // This is part of: const i = ..., const enum r { ... }, s;
  // We need to change const enum to a regular assignment
  // But the tricky part is this is inside "const i = ...,\n  const enum r {...},\n  s;"
  // That's actually NOT valid JS anyway - const declarations can't be chained with ,
  // The original code likely had: let r = { linesAdded: 0, ... }, s;

  let fixed = content;
  // Remove 'const enum' blocks and replace with object literal initializer
  // Pattern: const enum r {\n  linesAdded = 0,\n  linesRemoved = 0,\n  filesProcessed = 0\n},
  // Replace with: r = { linesAdded: 0, linesRemoved: 0, filesProcessed: 0 },
  fixed = fixed.replace(
    /const enum (\w+) \{[^}]+\},\s*\n(\s*)(\w+);/g,
    (match, enumName, ws, nextVar) => {
      // Parse the enum members
      const membersMatch = match.match(/\{([^}]+)\}/);
      const members = membersMatch ? membersMatch[1].trim().split(',').map(m => {
        const [name, val] = m.trim().split('=').map(s => s.trim());
        return `${name}: ${val || 0}`;
      }).join(', ') : '';
      return `${enumName} = { ${members} },\n${ws}${nextVar};`;
    }
  );

  // Also fix other const enum patterns (single-line)
  fixed = fixed.replace(
    /\bconst\s+enum\s+(\w+)\s*\{([^}]*)\}\s*;?/g,
    (match, enumName, body) => {
      // These are used as types, not values - just remove them
      return '';
    }
  );

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);

  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = getError(body);
    errors.push({ file: relPath, error: err });
    console.log(`[fix2] [错误] ${relPath}: ${err}`);
    // Debug
    console.log('  Remaining const enum:', fixed.includes('const enum'));
  }
}

// ============================================================
// Fix: packages/ui/dist/bundle.ts — large bundle with imports
// This is a 18MB file. The issue is ESM imports inside what should be CJS module body.
// The file probably has 'export' statements too.
// Since this is a huge file with ESM syntax, remove all import/export statements
// ============================================================
{
  const relPath = 'packages/ui/dist/bundle.ts';
  const content = read(relPath);

  // Remove all import and export statements
  let fixed = content;
  fixed = removeNamedImports(fixed);
  // Remove: export { ... } from '...' and export { ... }
  fixed = fixed.replace(/^export\s*\{[^}]+\}\s*(from\s*['"][^'"]+['"])?;?\s*$/gm, '');
  // Remove: export * from '...'
  fixed = fixed.replace(/^export\s*\*\s*(from\s*['"][^'"]+['"])?;?\s*$/gm, '');
  // Remove: export default ...
  fixed = fixed.replace(/^export\s+default\s+/gm, '');
  // Remove: export const/let/var/function/class
  fixed = fixed.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);

  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = getError(body);
    errors.push({ file: relPath, error: `bundle.ts: ${err}` });
    console.log(`[fix2] [错误] bundle.ts: ${err}`);
  }
}

// ============================================================
// Fix: snippetParser.js — regex split across lines
// The regex /\${\n?CLIPBOARD/ was formatted by prettier to span two lines
// Fix: merge the newline inside the regex
// ============================================================
{
  const relPath = 'vs/editor/contrib/snippet/browser/snippetParser.js';
  const content = read(relPath);

  // The actual text in the file:
  // return/\${
  // ?CLIPBOARD/.test(e)}
  // This is: /\${\n?CLIPBOARD/ but with an actual newline in the middle of the regex
  // Fix: replace the newline + optional whitespace between /\${ and ?CLIPBOARD/
  let fixed = content.replace(/\/\\\$\{\s*\n\s*\?CLIPBOARD\//g, '/\\${\\n?CLIPBOARD/');

  // Verify
  const lines = fixed.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { bodyStart++; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  const body = lines.slice(bodyStart).join('\n');

  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = getError(body);
    // Try harder: find all multi-line regex patterns
    console.log(`[fix2] [错误] ${relPath}: ${err}`);
    // Show the exact pattern in the file
    const cIdx = fixed.indexOf('CLIPBOARD');
    console.log('  CLIPBOARD context:', JSON.stringify(fixed.substring(Math.max(0, cIdx - 50), cIdx + 50)));
    errors.push({ file: relPath, error: err });
  }
}

// ============================================================
// Fix: lightBulbWidget.ts — brace count mismatch
// Need to analyze carefully what's missing
// ============================================================
{
  const relPath = 'vs/editor/contrib/codeAction/browser/lightBulbWidget.ts';
  const content = read(relPath);

  const lines = content.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { bodyStart++; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);

  // Count brace depth to find the imbalance
  let depth = 0;
  let firstNegativeAt = -1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '{') depth++;
    if (body[i] === '}') {
      depth--;
      if (depth < 0 && firstNegativeAt === -1) {
        firstNegativeAt = i;
      }
    }
  }
  console.log(`[fix2] lightBulbWidget: final depth=${depth}, first negative at=${firstNegativeAt}`);
  console.log('  Context at negative:', JSON.stringify(body.substring(Math.max(0, firstNegativeAt - 60), firstNegativeAt + 30)));

  // If depth > 0: missing closing }, need to add
  // If depth < 0: extra closing }, need to remove
  // From previous analysis: the IIFE (function(n){...}) is missing its opening {
  // But the IIFE is started at line 22 with (function(n){...
  // The missing } means: the (function(n){...}) IIFE body was not properly closed

  let fixed;
  if (depth < 0) {
    // Remove the last } on the last content line
    // The issue is at the very end: the } after __decorate is extra
    // Try removing the final } from the body
    // Find and remove the last standalone }
    const lastBraceIdx = body.lastIndexOf('\n}');
    if (lastBraceIdx >= 0) {
      console.log(`  Removing last } at body offset ${lastBraceIdx}`);
      // Rebuild fixed content
      fixed = content;
    }
    // Actually try removing the } at the end of the __decorate line
    fixed = content.replace(
      /,q9t=\$9t=__decorate\(\[__param\(1,po\)\],q9t\)\}\s*$/,
      ',q9t=$9t=__decorate([__param(1,po)],q9t)'
    );
  } else {
    // depth > 0: need to add } at the end
    fixed = content.trimEnd() + '\n}';
  }

  const flines = fixed.split('\n');
  let fbodyStart = 0;
  for (let i = 0; i < flines.length; i++) {
    const line = flines[i].trim();
    if (line.startsWith('//')) { fbodyStart = i + 1; continue; }
    break;
  }
  while (fbodyStart < flines.length && flines[fbodyStart].trim() === '') fbodyStart++;
  while (fbodyStart < flines.length) {
    const line = flines[fbodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { fbodyStart++; continue; }
    break;
  }
  while (fbodyStart < flines.length && flines[fbodyStart].trim() === '') fbodyStart++;
  let fbody = flines.slice(fbodyStart).join('\n');
  fbody = stripTypeAnnotations(fbody);

  if (testBody(fbody)) {
    write(relPath, fixed);
  } else {
    const err = getError(fbody);
    errors.push({ file: relPath, error: err });
    console.log(`[fix2] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix: StorageProvider.js — extra ) at end of first expression
// ============================================================
{
  const relPath = 'external/statsig/client-core/StorageProvider.js';
  const content = read(relPath);

  const lines = content.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { bodyStart++; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  const body = lines.slice(bodyStart).join('\n');

  // Find where paren goes negative
  let depth = 0;
  let firstNegative = -1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(') depth++;
    if (body[i] === ')') {
      depth--;
      if (depth < 0 && firstNegative === -1) firstNegative = i;
    }
  }
  console.log(`[fix2] StorageProvider: firstNegative=${firstNegative}`);
  console.log('  Context:', JSON.stringify(body.substring(Math.max(0, firstNegative - 60), firstNegative + 30)));

  // Fix: the extra ) is at the end of the "(btu = null));" line
  // The entire first expression is wrapped in an extra ()
  // Original had: Mhn={},xpa={...},btu=null;
  // Formatted: (Mhn = {}),\n  (xpa = {...}),\n  (btu = null));
  // The outer ( at start of body needs its ) removed
  // Change: '(btu = null));' → '(btu = null);'
  let fixed = content;

  // Try different patterns
  fixed = content.replace(/\(btu = null\)\);/g, '(btu = null);');

  if (fixed === content) {
    // Try another pattern - look at the actual line
    const spIdx = content.indexOf('btu = null)');
    console.log('  btu context:', JSON.stringify(content.substring(Math.max(0, spIdx - 5), spIdx + 20)));
    // Maybe it's: btu = null));
    fixed = content.replace(/\bbtu = null\)\);/g, 'btu = null);');
  }

  const flines = fixed.split('\n');
  const fbodyStart = bodyStart; // same
  const fbody = flines.slice(fbodyStart).join('\n');

  if (testBody(fbody)) {
    write(relPath, fixed);
  } else {
    const err = getError(fbody);
    errors.push({ file: relPath, error: err });
    console.log(`[fix2] [错误] ${relPath}: ${err}`);

    // Manual inspection
    const lines2 = content.split('\n');
    console.log('  Line 21-25:');
    lines2.slice(20, 25).forEach((l, i) => console.log(`    ${i+21}: ${l}`));
  }
}

// ============================================================
// Fix: fileActions.contribution.ts — extra ) at line 408
// ============================================================
{
  const relPath = 'vs/workbench/contrib/files/browser/fileActions.contribution.ts';
  const content = read(relPath);

  const lines = content.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//')) { bodyStart = i + 1; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  while (bodyStart < lines.length) {
    const line = lines[bodyStart].trim();
    if (line.startsWith("import '") || line.startsWith('import "')) { bodyStart++; continue; }
    break;
  }
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);

  // Find line 408 in the file (0-indexed: 407)
  const targetLine = lines[407];
  console.log(`[fix2] fileActions line 408: "${targetLine}"`);

  // Fix: change '}));' at line 408 to '});'
  // We need to be specific to avoid wrong replacements
  let fixed = content;
  const fixedLines = fixed.split('\n');
  if (fixedLines[407] && fixedLines[407].trim() === '}));') {
    fixedLines[407] = fixedLines[407].replace('}));', '});');
    fixed = fixedLines.join('\n');
  }

  const flines = fixed.split('\n');
  let fbodyStart = bodyStart;
  let fbody = flines.slice(fbodyStart).join('\n');
  fbody = stripTypeAnnotations(fbody);

  if (testBody(fbody)) {
    write(relPath, fixed);
  } else {
    const err = getError(fbody);
    errors.push({ file: relPath, error: err });
    console.log(`[fix2] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Summary
// ============================================================
console.log(`\n[fix2] === 完成 ===`);
console.log(`[fix2] 成功修复: ${fixedCount} 个文件`);
if (errors.length > 0) {
  console.log(`[fix2] 失败: ${errors.length} 个`);
  for (const e of errors) console.log(`  - ${e.file}: ${e.error}`);
} else {
  console.log(`[fix2] 所有文件修复成功！`);
}
