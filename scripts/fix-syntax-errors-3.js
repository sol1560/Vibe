#!/usr/bin/env node
/**
 * fix-syntax-errors-3.js
 * Fix remaining 9 syntax error modules in the decompile pipeline.
 * Agent: syntax-fixer
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'extracted', 'cursor-unbundled', 'modules');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Replicate what rebundle.js does: strip header comments/imports,
 * return the body.
 */
function extractModuleBody(source) {
  const lines = source.split('\n');
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.endsWith('*/')) {
      bodyStart = i + 1;
      continue;
    }
    // Only skip import '...' or import "..." side-effect imports
    if (/^import ['"]/.test(line)) {
      bodyStart = i + 1;
      continue;
    }
    break;
  }
  return lines.slice(bodyStart).join('\n');
}

/**
 * Replicate what rebundle.js does with TypeScript annotations.
 */
function stripTypeAnnotations(code) {
  // Remove TypeScript decorators @ITypeName (with possible parens)
  code = code.replace(/@[A-Z][a-zA-Z]*(\([^)]*\))?\s+/g, '');
  // Remove : ITypeName type annotations
  code = code.replace(/:\s*[A-Z][a-zA-Z]*(\[\])?(?=[,);\s])/g, '');
  return code;
}

/**
 * Remove ALL named imports (import { x, y } from '...') from a file's header area.
 * These are not valid in the non-module context that rebundle uses.
 */
function removeAllNamedImports(content) {
  // Match multi-line named imports too: import {\n  x,\n  y\n} from '...'
  return content.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"][;]?\s*$/gm, '');
}

/**
 * Test if a module body is valid JavaScript.
 */
function testBody(filePath, content) {
  let fixed = content;
  // Remove named imports
  fixed = removeAllNamedImports(fixed);
  // Extract body
  const body = extractModuleBody(fixed);
  // Strip TS annotations
  const strippedBody = stripTypeAnnotations(body);
  try {
    new Function(strippedBody);
    return { ok: true, body: strippedBody, fixed };
  } catch (e) {
    return { ok: false, error: e.message, body: strippedBody, fixed };
  }
}

/**
 * Write file and verify.
 */
function writeAndVerify(filePath, content, label) {
  const result = testBody(filePath, content);
  if (result.ok) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[fix3] [OK] ${label}`);
    return true;
  } else {
    console.log(`[fix3] [FAIL] ${label}: ${result.error}`);
    return false;
  }
}

// ─── Fix Functions ────────────────────────────────────────────────────────────

/**
 * Fix named import files: remove all named imports from header.
 *
 * Affected files:
 * - inlineDiffService.ts
 * - composerUtilsService.ts
 * - composerPlanService.ts (also has `,` syntax issue in body)
 * - githubPRService.ts
 */
function fixNamedImportFile(relPath) {
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = removeAllNamedImports(content);
  return writeAndVerify(filePath, fixed, relPath);
}

/**
 * Fix snippetParser.js: multiline regex literal was broken by prettier.
 * Line 227: /\${
 * Line 228: ?CLIPBOARD/.test(e)
 * Fix: join those two lines so regex becomes /\${\n?CLIPBOARD/
 * Also note: the regex /\${\n?CLIPBOARD/ itself has a { which needs to not be in a string context issue.
 *
 * Actually, the prettier broke `/\${\n?CLIPBOARD/` into:
 * `/\${`  (newline)
 * `?CLIPBOARD/.test(e)}`
 * We need to put it back: `/\${\n?CLIPBOARD/`
 */
function fixSnippetParser() {
  const relPath = 'vs/editor/contrib/snippet/browser/snippetParser.js';
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // The broken regex looks like (with actual newline between /\${ and ?CLIPBOARD/):
  //   return/\${
  //   ?CLIPBOARD/.test(e)
  // We need to replace this with:
  //   return/\${\n?CLIPBOARD/.test(e)

  // Match: /\${ followed by optional whitespace+newline followed by ?CLIPBOARD/
  const before = content;
  content = content.replace(/\/\\\$\{\s*\n\s*\?CLIPBOARD\//g, '/\\${\\n?CLIPBOARD/');

  if (content === before) {
    console.log(`[fix3] [WARN] snippetParser.js: regex replacement had no match, trying alternate pattern`);
    // Try with explicit newline
    content = before.replace(/\/\\\$\{[\r\n]+\s*\?CLIPBOARD\//g, '/\\${\\n?CLIPBOARD/');
  }

  return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix lightBulbWidget.ts: extra } at end of file.
 *
 * The file ends with:
 *   }
 *   ,LightBulbWidget=$9t=__decorate([__param(1,po)],LightBulbWidget)}
 *
 * The brace analysis shows depth goes to -1 at the __decorate line.
 * The closing } at the end of the __decorate line is extra.
 * Remove it: change `],LightBulbWidget)}` to `],LightBulbWidget)`
 *
 * Also: the file has `import { UBe } from '...'` at line 6, which is a named import
 * that will be left in body. Remove it too.
 */
function fixLightBulbWidget() {
  const relPath = 'vs/editor/contrib/codeAction/browser/lightBulbWidget.ts';
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove named imports
  content = removeAllNamedImports(content);

  // Fix extra } at the end of __decorate line
  // The line is: ,LightBulbWidget=$9t=__decorate([__param(1,po)],LightBulbWidget)}
  // Should be:   ,LightBulbWidget=$9t=__decorate([__param(1,po)],LightBulbWidget)
  const before = content;
  content = content.replace(
    /,LightBulbWidget=\$9t=__decorate\(\[__param\(1,po\)\],LightBulbWidget\)\}/g,
    ',LightBulbWidget=$9t=__decorate([__param(1,po)],LightBulbWidget)'
  );

  if (content === before) {
    console.log(`[fix3] [WARN] lightBulbWidget.ts: __decorate pattern not matched`);
  }

  return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix StorageProvider.js: extra ) in comma-expression chain.
 *
 * Line 22: `  (btu = null));`
 * Should be: `  (btu = null));` but with one less )
 * i.e.: `  (btu = null);`
 *
 * The structure is: (Mhn = {}),(xpa = {...}),(btu = null));
 * The outer ( wraps everything; the extra ) is after `(btu = null)`.
 *
 * It also has `import { pSt } from './SafeJs'` which is a named import.
 *
 * The full content ending needs:
 *   (btu = null));   -->  (btu = null);
 *
 * But the full chain is (Mhn = {}), (xpa = {...}), (btu = null)); try { ... }
 * It seems the paren wraps the whole chain: (Mhn={}, xpa={...}, btu=null)
 *
 * Actually looking at original: the comma-chain inside parens is:
 *   (Mhn={}),...,(btu=null))  <-- extra )
 *
 * Fix: (btu = null)); → (btu = null);
 */
function fixStorageProvider() {
  const relPath = 'external/statsig/client-core/StorageProvider.js';
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove named imports
  content = removeAllNamedImports(content);

  // Fix: (btu = null)); → (btu = null);
  // This pattern: closing ) after `(btu = null)` and then another ) from outer wrap
  const before = content;
  content = content.replace(/\(btu = null\)\);/g, '(btu = null);');

  if (content === before) {
    console.log(`[fix3] [WARN] StorageProvider.js: (btu = null)); pattern not matched, trying raw`);
    // Try with different spacing
    content = before.replace(/\(btu\s*=\s*null\)\);/g, '(btu = null);');
  }

  return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix fileActions.contribution.ts: extra ) in comma-expression chains.
 *
 * Multiple locations:
 *   Line 408:  }));  → });  (inside large ir.appendMenuItem chain)
 *   Line 419:  }));  → });  (inside for-loop)
 *   Line 491:  }));  → });  (inside another chain)
 *
 * BUT: we need to be careful. These patterns are inside different structures.
 *
 * Approach: Find ALL `}));` patterns and change to `});`
 * But this might be too aggressive. Let's analyze what the body needs.
 *
 * From analysis: the body starts at the named import on line 7.
 * After removing all named imports, body starts at:
 *   It(uDf), ... (the first non-import statement)
 *
 * The `}));` at line 408 is inside the first big comma chain.
 * The chain wraps multiple ir.appendMenuItem calls in ().
 *
 * Let's replace ALL `}));` with `});` - this is the pattern from prettier
 * wrapping comma-separated call chains in extra parens.
 *
 * Then test and see if it passes.
 */
function fixFileActionsContribution() {
  const relPath = 'vs/workbench/contrib/files/browser/fileActions.contribution.ts';
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove named imports
  content = removeAllNamedImports(content);

  // Fix all })); → });
  content = content.replace(/\}\)\);/g, '});');

  return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix packages/ui/dist/bundle.ts: this is a large ESM bundle.
 * It uses `import` statements which are ESM-only.
 *
 * The module is type Ae (side-effect module), it has NO export.
 * rebundle.js uses extractModuleBody which strips the header.
 *
 * The problem: this file likely has import statements INSIDE the body
 * (not just at the top), making it invalid as a non-module script.
 *
 * Let's check the structure first with a targeted analysis.
 */
function fixBundle() {
  const relPath = 'packages/ui/dist/bundle.ts';
  const filePath = path.join(MODULES_DIR, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`[fix3] [SKIP] Not found: ${relPath}`);
    return false;
  }

  // Read just the first few hundred lines to understand structure
  const fullContent = fs.readFileSync(filePath, 'utf8');
  const lines = fullContent.split('\n');

  // Find where the module header ends and body starts
  let headerEnd = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.endsWith('*/')) {
      headerEnd = i;
      continue;
    }
    if (/^import ['"]/.test(line) || /^import\s*\{[^}]*\}\s*from\s*/.test(line)) {
      headerEnd = i;
      continue;
    }
    break;
  }

  // Check if there are any import statements in the body
  let bodyHasImports = false;
  let firstBodyImportLine = -1;
  for (let i = headerEnd + 1; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) {
      bodyHasImports = true;
      firstBodyImportLine = i;
      break;
    }
  }

  if (bodyHasImports) {
    console.log(`[fix3] [INFO] bundle.ts: body has import at line ${firstBodyImportLine + 1}: ${JSON.stringify(lines[firstBodyImportLine].substring(0, 80))}`);
    // This file fundamentally uses ESM syntax. We can't fix it without rewriting.
    // The best approach: strip all import/export statements from the body.
    let content = removeAllNamedImports(fullContent);
    // Remove remaining import lines that appear in body
    content = content.replace(/^\s*import\s+['"][^'"]+['"][;]?\s*$/gm, '');
    content = content.replace(/^\s*import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"][;]?\s*$/gm, '');

    return writeAndVerify(filePath, content, relPath);
  } else {
    // Try removing named imports from header only
    const content = removeAllNamedImports(fullContent);
    return writeAndVerify(filePath, content, relPath);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = { ok: [], fail: [] };

function run(label, fn) {
  try {
    const success = fn();
    if (success) results.ok.push(label);
    else results.fail.push(label);
  } catch (e) {
    console.log(`[fix3] [ERROR] ${label}: ${e.message}`);
    results.fail.push(label);
  }
}

console.log('=== fix-syntax-errors-3.js ===\n');

// Named import files
run('inlineDiffService.ts', () => fixNamedImportFile('vs/editor/browser/services/inlineDiffService.ts'));
run('composerUtilsService.ts', () => fixNamedImportFile('vs/workbench/contrib/composer/browser/composerUtilsService.ts'));
run('composerPlanService.ts', () => fixNamedImportFile('vs/workbench/contrib/composer/browser/services/composerPlanService.ts'));
run('githubPRService.ts', () => fixNamedImportFile('vs/workbench/services/ai/browser/githubPRService.ts'));

// Regex fix
run('snippetParser.js', () => fixSnippetParser());

// Brace/paren fixes
run('lightBulbWidget.ts', () => fixLightBulbWidget());
run('StorageProvider.js', () => fixStorageProvider());
run('fileActions.contribution.ts', () => fixFileActionsContribution());

// Large ESM bundle
run('bundle.ts', () => fixBundle());

console.log(`\n=== Results: ${results.ok.length} OK, ${results.fail.length} FAIL ===`);
if (results.ok.length > 0) console.log('OK:', results.ok.join(', '));
if (results.fail.length > 0) console.log('FAIL:', results.fail.join(', '));
