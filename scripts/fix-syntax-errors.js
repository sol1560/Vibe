#!/usr/bin/env node
/**
 * fix-syntax-errors.js — 修复 19 个语法错误模块
 *
 * 问题类型：
 * 1. 'const enum' TS 语法 — 替换为 JS 常量赋值（const enum 值会被内联为数字0）
 * 2. 'import { x } from ...' 具名导入残留 — 删除（rebundle 不支持 ESM import 在 body 内）
 * 3. constructor(default) 保留字参数 — 改为 _default
 * 4. snippetParser 正则跨行 — 合并为单行
 * 5. lightBulbWidget 缺少 } — 补充缺失的 }
 * 6. StorageProvider 多余 ) — 删除多余括号
 * 7. fileActions.contribution 多余 ) — 删除多余括号
 * 8. lifecycle.ts 缺少 if( — 补充 if 语句结构
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
  console.log(`[fix] 已修复: ${relPath}`);
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

function extractBody(content) {
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
  return bodyStart;
}

function testBody(body) {
  try { new Function(body); return true; } catch(e) { return false; }
}

// ============================================================
// Fix 1: const enum 问题 (5 个 TS 文件)
// const enum X { a=0, b=0 } → 替换为空（因为 const enum 值是常量 0，
// 这些变量已经被内联了，class body 里用的是数字字面量）
// ============================================================

function fixConstEnum(content) {
  // Remove const enum declarations entirely
  // Pattern: const enum Name { member = value, ... };
  return content.replace(/\bconst\s+enum\s+\w+\s*\{[^}]*\}\s*;?/g, '');
}

const constEnumFiles = [
  'vs/base/browser/performance.ts',
  'vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase.ts',
  'vs/editor/contrib/inlayHints/browser/inlayHintsController.ts',
  'node_modules/zod/v4/core/schemas.ts',
  'vs/workbench/contrib/analytics/browser/aiCodeEventTracking.ts',
];

for (const relPath of constEnumFiles) {
  const content = read(relPath);
  const fixed = fixConstEnum(content);
  // Verify fix
  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `const enum fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix 2: 具名 import 残留 (6 个 TS 文件)
// 删除 'import { x } from ...' 和 'import { x, y } from ...' 行
// ============================================================

function fixNamedImports(content) {
  // Remove named import lines: import { ... } from '...'
  return content.replace(/^import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
}

const namedImportFiles = [
  'vs/editor/browser/services/inlineDiffService.ts',
  'vs/workbench/contrib/composer/browser/services/planStorageService.ts',
  'vs/workbench/contrib/composer/browser/composerCheckpointService.ts',
  'vs/workbench/contrib/composer/browser/composerUtilsService.ts',
  'vs/workbench/contrib/composer/browser/services/composerPlanService.ts',
  'vs/workbench/services/ai/browser/githubPRService.ts',
];

for (const relPath of namedImportFiles) {
  const content = read(relPath);
  const fixed = fixNamedImports(content);
  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `named import fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix 3: packages/ui/dist/bundle.ts — import statement in module body
// This file uses 'import' inside its body — needs special handling
// Since it's a huge 18MB file, just remove all top-level import statements
// ============================================================
{
  const relPath = 'packages/ui/dist/bundle.ts';
  const content = read(relPath);
  // Remove ALL import/export statements from body
  let fixed = content;
  // Remove named imports
  fixed = fixNamedImports(fixed);
  // Also remove: export { ... } from '...' and export * from '...'
  fixed = fixed.replace(/^export\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  fixed = fixed.replace(/^export\s*\*\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  // Remove standalone 'export { ... }'
  fixed = fixed.replace(/^export\s*\{[^}]+\};?\s*$/gm, '');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `bundle.ts fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix 4: constructor(default) → constructor(_default)
// Affects: lifecycle.ts (xHh class), languageFeatureDebounce.js (xHh class), fixedArray.js
// ============================================================

// lifecycle.ts — xHh constructor has: constructor(default) { this._default = default
// This was deobfuscated from constructor(n) { this._default = n
// Fix: rename the param from 'default' back to 'n' (or _default)
{
  const relPath = 'vs/base/common/lifecycle.ts';
  // The lifecycle.ts also has the bigger issue of missing if( — fix both
  // First fix the constructor(default) issue by replacing: constructor(default) with constructor(_defaultVal)
  // And all references to that param
  const content = read(relPath);

  // The lifecycle.ts also has the if( missing issue:
  // Original body starts with: "use strict";if(dep1(),dep2(),...,anh=!1,...,lnh=class{...},anh){...}
  // After restore-imports, dep calls are removed, leaving: ...,anh=!1,...,lnh=class{...},anh){...}
  // But the file starts with U_c=!1,... (after our header stripping)
  // The ',anh){' pattern remains unpaired as the 'if(' was part of the dep preamble

  // However, rebundle extracts the dep preamble from the original and prepends it:
  // original preamble = "use strict";zs(),_te(),au(),AH(),wf(),
  // But this doesn't include the 'if(' that wraps everything!
  // The 'if(' in the original is: "use strict";if(zs(),_te(),...
  // rebundle's extractDepPreamble extracts: "use strict";zs(),_te(),...
  // So rebundle DOES extract the deps but WITHOUT the 'if(' wrapper!
  // The resulting merged body would be: "use strict";zs(),_te(),...[our module content starting with U_c=!1...]
  // But our module content has '...anh){...}' which is unmatched

  // The fix: in the lifecycle.ts body, we need to wrap the anh block properly.
  // Change: `...},anh){const n=...}Ht=` to `...};if(anh){const n=...}Ht=`
  // This makes the if block explicit and doesn't rely on the outer paren

  let fixed = content;

  // Fix constructor(default) — the param 'default' is a reserved word
  // In xHh class: constructor(default) { ((this._default = default), ...) }
  // Change 'default' param to '_default'
  fixed = fixed.replace(/\bconstructor\(default\)/g, 'constructor(_default)');
  fixed = fixed.replace(/this\._default = default\b/g, 'this._default = _default');
  // In lifecycle.ts xHh: constructor(n) is the original, deobfuscate changed it to default
  // Check if there are more references
  // The pattern in lifecycle.ts: constructor(n){this._default=n}
  // After deobfuscate: constructor(default){this._default=default}
  // Fix: replace standalone 'default' after = and before ) or ,
  // More targeted: in the class body around 'constructor(default)'

  // Fix the anh){...} issue: change to if(anh){...}
  // The pattern is: '  }),\n  (anh)' or similar formatted version
  // Look for the pattern in the formatted file
  // After prettier format: '...}},\n  anh\n) {\n  const n = ...'
  // Or it could be: '},anh){\n  const n=...'
  // Let's handle both cases: find '}},anh)' or the formatted version

  // In our file (lifecycle.ts), the pattern is:
  // line 30: '...},anh){const n="__is_disposable_tracked__";N2n(new class{...})}Ht='
  // The fix: change ',anh){' to ';if(anh){'
  fixed = fixed.replace(/},anh\)\{/g, '};if(anh){');
  // Also fix: '  }),\n  anh\n) {\n' pattern (formatted version)
  fixed = fixed.replace(/\}\),\s*\n\s*anh\s*\n\s*\)\s*\{/g, '});\nif(anh) {');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `lifecycle.ts fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
    // Debug
    const errLines = body.split('\n');
    console.log('Body around issue:');
    const anhBodyIdx = body.indexOf(',anh)');
    if (anhBodyIdx >= 0) console.log('Still has ,anh):', body.substring(Math.max(0, anhBodyIdx - 30), anhBodyIdx + 50));
  }
}

// languageFeatureDebounce.js — xHh class has constructor(default)
{
  const relPath = 'vs/editor/common/services/languageFeatureDebounce.js';
  const content = read(relPath);
  let fixed = content;
  fixed = fixed.replace(/\bconstructor\(default\)/g, 'constructor(_default)');
  fixed = fixed.replace(/this\._default = default\b/g, 'this._default = _default');
  fixed = fixed.replace(/return this\._default\b/g, 'return this._default');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  const body = lines.slice(bodyStart).join('\n');
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `languageFeatureDebounce fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// fixedArray.js — FixedArray class has constructor(default)
{
  const relPath = 'vs/editor/common/model/fixedArray.js';
  const content = read(relPath);
  let fixed = content;
  fixed = fixed.replace(/\bconstructor\(default\)/g, 'constructor(_default)');
  fixed = fixed.replace(/this\._default = default\b/g, 'this._default = _default');
  // Also: 'moA(t, this._default)' stays as is — only the constructor param
  // Also check for uses of 'default' as a standalone var (not this._default)
  // In fixedArray: constructor(default) { this._default = default, this._store = [] }
  // get(n) { return n < ... ? ... : this._default }  ← 'this._default' is fine
  // The 'default' standalone param usage in constructor body

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  const body = lines.slice(bodyStart).join('\n');
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `fixedArray fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix 5: snippetParser.js — regex split across lines
// /\${
// ?CLIPBOARD/ → /\${\n?CLIPBOARD/
// ============================================================
{
  const relPath = 'vs/editor/contrib/snippet/browser/snippetParser.js';
  const content = read(relPath);
  // The regex /\${
  // ?CLIPBOARD/ is split across two lines by prettier
  // Fix: join it back into /\${\n?CLIPBOARD/
  // The pattern in the file is: /\${\n?CLIPBOARD/
  // But as actual text in file: the regex spans two actual lines
  let fixed = content.replace(/\/\\\$\{\s*\n\s*\?CLIPBOARD\//g, '/\\${\\n?CLIPBOARD/');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  const body = lines.slice(bodyStart).join('\n');
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `snippetParser fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
    // Show the area
    const idx = content.indexOf('CLIPBOARD');
    console.log('CLIPBOARD area:', JSON.stringify(content.substring(Math.max(0, idx - 30), idx + 30)));
  }
}

// ============================================================
// Fix 6: lightBulbWidget.ts — missing closing }
// Last line: ',q9t=$9t=__decorate([__param(1,po)],q9t)}'
// should be: ',q9t=$9t=__decorate([__param(1,po)],q9t))}'
// i.e., one more } to close the outer IIFE (function(n){...})
// ============================================================
{
  const relPath = 'vs/editor/contrib/codeAction/browser/lightBulbWidget.ts';
  const content = read(relPath);
  // Add the missing } before the end
  // The file ends with: ',q9t=$9t=__decorate([__param(1,po)],q9t)}\n'
  // Should be: '}\n,q9t=$9t=__decorate([__param(1,po)],q9t)}\n'
  // Actually the class } is already there (line 113: '}')
  // The missing } is the one that closes the (function(n){...})(hke||(hke={})) IIFE body
  // Line 114: ',q9t=$9t=__decorate([__param(1,po)],q9t)}'
  // Should be: ',q9t=$9t=__decorate([__param(1,po)],q9t))}'  — No that's wrong
  //
  // Original ends with: ...],q9t)}}),H9t,EHh
  // Our module body corresponds to: ...],q9t)}}
  // So we have one } missing — the outer IIFE body closer
  //
  // In our file, after the class }, line 114 is: ,q9t=__decorate(...)q9t)}
  // The } at the end of line 114 should be the IIFE closer.
  // But we need TWO }: one for class end (line 113: }) and one for IIFE (line 114: })
  // Counting our braces: we need final } after the __decorate line
  // Actually looking at the negative depth analysis: depth goes to -1 at the `}`
  // after `title=e}` on line 112-113.
  // That means line 113's `}` is one too many OR line 114's `}` has no matching `{`
  //
  // The real fix: add '}' at the very end (after the __decorate line)
  // because the IIFE (function(n){...}) needs its closing }

  let fixed = content.trimEnd();
  // The last meaningful line ends with: },q9t=$9t=__decorate([__param(1,po)],q9t)}
  // We need it to be: },q9t=$9t=__decorate([__param(1,po)],q9t)}\n}
  // Wait, let me count what's needed

  // From negative depth analysis: at offset 8373 (in stripped body),
  // context: "itle=e}\n}\n,q9t=$9t=__decorate([__param(1,po)],q9t)}\n"
  // The } that causes negative depth comes AFTER the `}` that closes the class
  // So the structure is:
  //   set title(e) { this._domNode.title = e }  ← the } here is OK
  //   }   ← this closes q9t class
  //   ,q9t=$9t=__decorate(...)   ← this is the comma expression
  //   }   ← THIS } has no match (causes negative depth)
  //
  // Hmm, but in original the ending is: ...],q9t)}} which has TWO }
  // So we need one } before the class-ending } AND the __decorate line's }
  //
  // Actually looking at line 113: just `}` which closes the class
  // And line 114: `,q9t=$9t=__decorate([__param(1,po)],q9t)}`
  // The } at end of line 114 is the outer IIFE closer
  //
  // But our brace count shows the outer IIFE was already opened somewhere...
  // The IIFE `(function(n){...})` starts with `(function(n){`
  // In our file at line 22: `...(function(n){let e;(function(i){...`
  // That function body has been closed but let's check if the OUTER (function(n){
  // is actually already in the code or not

  // Let me just add one more } to the end and test
  fixed = fixed + '\n}';

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    // Try removing instead
    console.log(`[fix] Adding } failed for ${relPath}: ${err}, trying to remove extra }`);

    // Try removing the last } on line 114
    let fixed2 = content.replace(/,q9t=\$9t=__decorate\(\[__param\(1,po\)\],q9t\)\}\s*$/, ',q9t=$9t=__decorate([__param(1,po)],q9t)');
    const lines2 = fixed2.split('\n');
    const bodyStart2 = extractBody(fixed2);
    let body2 = lines2.slice(bodyStart2).join('\n');
    body2 = stripTypeAnnotations(body2);
    if (testBody(body2)) {
      write(relPath, fixed2);
    } else {
      const err2 = (() => { try { new Function(body2); } catch(e) { return e.message; } })();
      errors.push({ file: relPath, error: `lightBulbWidget fix failed: ${err2}` });
      console.log(`[fix] [错误] ${relPath}: ${err2}`);
    }
  }
}

// ============================================================
// Fix 7: StorageProvider.js — extra ) at end of first expression
// Line 23: '  (btu = null));' → '(btu = null));' has unmatched )
//
// The issue: prettier wrapped the comma chain in ()
// Original: Mhn={},xpa={...},btu=null;
// Formatted: (Mhn={}),\n  (xpa={...}),\n  (btu = null));  ← extra )
// Fix: Remove the trailing extra ) before ;
// ============================================================
{
  const relPath = 'external/statsig/client-core/StorageProvider.js';
  const content = read(relPath);
  // Find and fix: (btu = null));  → (btu = null);
  let fixed = content.replace(/\(btu = null\)\);/g, '(btu = null);');

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  const body = lines.slice(bodyStart).join('\n');
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `StorageProvider fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Fix 8: fileActions.contribution.ts — extra ) at line 408
// Line 408: '  }));' → '  });'
// ============================================================
{
  const relPath = 'vs/workbench/contrib/files/browser/fileActions.contribution.ts';
  const content = read(relPath);
  // Fix: Change '  }));' that comes after the appendMenuItem chain
  // Find the specific line: when: ke.and(fX.toNegated(), Rgn.toNegated()),
  //   }));
  // → });
  let fixed = content.replace(
    /when: ke\.and\(fX\.toNegated\(\), Rgn\.toNegated\(\)\),\n  \}\)\);/,
    "when: ke.and(fX.toNegated(), Rgn.toNegated()),\n  });"
  );

  const lines = fixed.split('\n');
  const bodyStart = extractBody(fixed);
  let body = lines.slice(bodyStart).join('\n');
  body = stripTypeAnnotations(body);
  if (testBody(body)) {
    write(relPath, fixed);
  } else {
    const err = (() => { try { new Function(body); } catch(e) { return e.message; } })();
    errors.push({ file: relPath, error: `fileActions fix failed: ${err}` });
    console.log(`[fix] [错误] ${relPath}: ${err}`);
  }
}

// ============================================================
// Summary
// ============================================================

console.log(`\n[fix] === 完成 ===`);
console.log(`[fix] 成功修复: ${fixedCount} 个文件`);
if (errors.length > 0) {
  console.log(`[fix] 失败: ${errors.length} 个`);
  for (const e of errors) {
    console.log(`  - ${e.file}: ${e.error}`);
  }
} else {
  console.log(`[fix] 所有文件修复成功！`);
}
