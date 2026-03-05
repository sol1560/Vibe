#!/usr/bin/env node
/**
 * fix-syntax-errors-4.js
 * Fix remaining 8 syntax error modules (after fix-syntax-errors-3.js fixed lightBulbWidget.ts).
 * Uses the ACTUAL rebundle.js stripTypeAnnotations function.
 * Agent: syntax-fixer
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'extracted', 'cursor-unbundled', 'modules');

// ─── ACTUAL rebundle.js stripTypeAnnotations (copied from scripts/rebundle.js) ──

function stripTypeAnnotations(code) {
	let result = code;
	// 0. 删除 convert-to-ts 注入的 class field 声明
	result = result.replace(/(public|private|protected)\s+(readonly\s+)?[A-Za-z_$][\w$]*\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?\s*;/g, '');
	// 1. 去除参数装饰器: @IServiceName paramName → paramName
	result = result.replace(/@I[A-Z][\w]*\s+(\w+)/g, '$1');
	// 2. 去除 public/private/protected 访问修饰符
	result = result.replace(/\b(public|private|protected)\s+(readonly\s+)?(?=[\w$])/g, '');
	// 3. 去除 `: TypeName` 类型注解（只处理 I 开头的接口名）
	result = result.replace(/(\w+)\s*:\s*I[A-Z][\w.]*(?:<[^>]+>)?/g, '$1');
	// 4. 去除 'as Type' 强制转换
	result = result.replace(/\bas\s+([A-Z][\w.]*(?:<[^>]+>)?)/g, '');
	return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function removeAllNamedImports(content) {
	// Remove: import { x, y, z } from '...'
	// Also handles multi-line named imports
	return content.replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"][;]?\s*$/gm, '');
}

function removeAllExports(content) {
	// Remove: export { x, y };
	return content.replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
}

function testBody(content) {
	let fixed = removeAllExports(removeAllNamedImports(content));
	const body = extractModuleBody(fixed);
	const strippedBody = stripTypeAnnotations(body);
	try {
		new Function(strippedBody);
		return { ok: true };
	} catch (e) {
		return { ok: false, error: e.message };
	}
}

function writeAndVerify(filePath, content, label) {
	const result = testBody(content);
	if (result.ok) {
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`[fix4] [OK] ${label}`);
		return true;
	} else {
		console.log(`[fix4] [FAIL] ${label}: ${result.error}`);
		return false;
	}
}

// ─── Fix Functions ────────────────────────────────────────────────────────────

/**
 * Fix named import + export files.
 * Simply remove all named imports (from header) and all exports (at end).
 */
function fixNamedImportExportFile(relPath) {
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	const content = fs.readFileSync(filePath, 'utf8');
	let fixed = removeAllNamedImports(content);
	fixed = removeAllExports(fixed);
	return writeAndVerify(filePath, fixed, relPath);
}

/**
 * Fix composerPlanService.ts:
 * 1. Remove named imports
 * 2. Remove exports
 * 3. Rename 'IT' → '_IT' (IT is used as enum object; its name triggers false-positive
 *    type annotation stripping: 'value:IT.COMPLETE' → 'value:' after strip)
 */
function fixComposerPlanService() {
	const relPath = 'vs/workbench/contrib/composer/browser/services/composerPlanService.ts';
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	let content = fs.readFileSync(filePath, 'utf8');
	content = removeAllNamedImports(content);
	content = removeAllExports(content);
	// Rename standalone 'IT' → '_IT' to avoid rebundle.js stripTypeAnnotations false positives
	// 'value:IT.COMPLETE' would be incorrectly treated as ':ITypeName' and stripped
	content = content.replace(/\bIT\b/g, '_IT');
	return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix snippetParser.js:
 * 1. Remove exports at end
 * 2. Fix broken regex literal: prettier inserted a real newline inside /\${...CLIPBOARD/
 *    Line 227: return/\${
 *    Line 228: ?CLIPBOARD/.test(e)}
 *    Fix: join into /\${\n?CLIPBOARD/
 */
function fixSnippetParser() {
	const relPath = 'vs/editor/contrib/snippet/browser/snippetParser.js';
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	let content = fs.readFileSync(filePath, 'utf8');

	// Remove exports
	content = removeAllExports(content);

	// Fix broken regex: /\${ followed by actual newline then ?CLIPBOARD/
	// Use direct string replacement (regex approach fails due to escaping complexity)
	// The file literally contains: /\${\n?CLIPBOARD/ where \n is an actual newline char
	const BROKEN_REGEX = '/\\${\n?CLIPBOARD/';     // literal \, $, {, newline, ?CLIPBOARD/
	const FIXED_REGEX  = '/\\${\\n?CLIPBOARD/';    // literal \, $, {, \, n, ?CLIPBOARD/
	const before = content;
	content = content.replace(BROKEN_REGEX, FIXED_REGEX);

	if (content === before) {
		console.log(`[fix4] [WARN] snippetParser.js: broken regex pattern not found`);
	}

	return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix StorageProvider.js:
 * 1. Remove named import: import { pSt } from './SafeJs'
 * 2. Remove export at end
 * 3. Fix extra ): (btu = null)); → (btu = null);
 */
function fixStorageProvider() {
	const relPath = 'external/statsig/client-core/StorageProvider.js';
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	let content = fs.readFileSync(filePath, 'utf8');

	// Remove named import
	content = removeAllNamedImports(content);
	// Remove exports
	content = removeAllExports(content);

	// Fix extra ): (btu = null)); → (btu = null);
	// The outer comma-expression starts with (Mhn = {}), (xpa = {...}), (btu = null))
	// The extra ) is the closing of an outer paren wrapping the whole chain.
	// After removing, this becomes a series of comma-separated assignment expressions.
	const before = content;
	content = content.replace(/\(btu\s*=\s*null\)\);/g, '(btu = null);');

	if (content === before) {
		// Try without spacing
		content = before.replace(/\(btu=null\)\);/g, '(btu=null);');
	}

	return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix fileActions.contribution.ts:
 * 1. Remove named imports
 * 2. Remove exports
 * 3. Fix all })); → }); (extra ) from prettier wrapping comma chains)
 *
 * Also: look for IT-like false positives (Cs, Jo, etc.) and check if they cause issues.
 */
function fixFileActionsContribution() {
	const relPath = 'vs/workbench/contrib/files/browser/fileActions.contribution.ts';
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	let content = fs.readFileSync(filePath, 'utf8');

	// Remove named imports
	content = removeAllNamedImports(content);
	// Remove exports
	content = removeAllExports(content);

	// Fix })); → });
	content = content.replace(/\}\)\);/g, '});');

	// Now test and if fails, look for more issues
	const result = testBody(content);
	if (result.ok) {
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`[fix4] [OK] ${relPath}`);
		return true;
	}

	// If still failing, find what else is wrong
	console.log(`[fix4] [DEBUG] fileActions after initial fix: ${result.error}`);

	// Check for remaining );); or }); issues
	// Try replacing }); → }) (might be over-fix from double nesting)

	return writeAndVerify(filePath, content, relPath);
}

/**
 * Fix packages/ui/dist/bundle.ts: large ESM bundle with import/export statements.
 * Remove all named imports and exports from header/footer.
 * Also remove any remaining import statements that appear in body (ESM-style).
 */
function fixBundle() {
	const relPath = 'packages/ui/dist/bundle.ts';
	const filePath = path.join(MODULES_DIR, relPath);
	if (!fs.existsSync(filePath)) {
		console.log(`[fix4] [SKIP] Not found: ${relPath}`);
		return false;
	}
	let content = fs.readFileSync(filePath, 'utf8');

	// Remove named imports
	content = removeAllNamedImports(content);
	// Remove exports
	content = removeAllExports(content);
	// Remove side-effect imports that might appear in body
	content = content.replace(/^\s*import\s+['"][^'"]+['"][;]?\s*$/gm, '');
	// Remove import * as X from '...' (star imports)
	content = content.replace(/^\s*import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"][;]?\s*$/gm, '');

	return writeAndVerify(filePath, content, relPath);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const results = { ok: [], fail: [] };

function run(label, fn) {
	try {
		const success = fn();
		if (success) results.ok.push(label);
		else results.fail.push(label);
	} catch (e) {
		console.log(`[fix4] [ERROR] ${label}: ${e.message}`);
		console.log(e.stack);
		results.fail.push(label);
	}
}

console.log('=== fix-syntax-errors-4.js ===\n');

// Named import + export files
run('inlineDiffService.ts', () => fixNamedImportExportFile('vs/editor/browser/services/inlineDiffService.ts'));
run('composerUtilsService.ts', () => fixNamedImportExportFile('vs/workbench/contrib/composer/browser/composerUtilsService.ts'));
run('composerPlanService.ts', () => fixComposerPlanService());
run('githubPRService.ts', () => fixNamedImportExportFile('vs/workbench/services/ai/browser/githubPRService.ts'));

// Regex fix + export
run('snippetParser.js', () => fixSnippetParser());

// Paren fix + import/export
run('StorageProvider.js', () => fixStorageProvider());
run('fileActions.contribution.ts', () => fixFileActionsContribution());

// Large bundle
run('bundle.ts', () => fixBundle());

console.log(`\n=== Results: ${results.ok.length} OK, ${results.fail.length} FAIL ===`);
if (results.ok.length > 0) console.log('OK:', results.ok.join(', '));
if (results.fail.length > 0) console.log('FAIL:', results.fail.join(', '));
