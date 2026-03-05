#!/usr/bin/env node
/**
 * Fix formatting for files that js-beautify failed or produced poor results on.
 * Handles TypeScript decorator syntax (@Param) in constructor arguments.
 */

const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').js;

const BASE = '/Users/sollin/Claude-Editor/extracted/cursor-unbundled/modules';

// Files that still need work after first pass
const TARGET_FILES = [
  'vs/workbench/contrib/composer/browser/naiveComposerAgentProvider.ts',
  'vs/editor/contrib/inlineCompletions/browser/view/inlineCompletionsView.ts',
];

const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  indent_char: ' ',
  max_preserve_newlines: 2,
  preserve_newlines: true,
  brace_style: 'end-expand',
  space_before_conditional: true,
  unescape_strings: false,
  jslint_happy: false,
  end_with_newline: true,
  wrap_line_length: 0,
  e4x: false,
  comma_first: false,
  operator_position: 'before-newline',
};

function splitHeaderAndCode(content) {
  const lines = content.split('\n');
  let headerEnd = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      headerEnd = i + 1;
      continue;
    }
    if (line.startsWith('//') || line.startsWith('import ') || line.startsWith("'use strict'")) {
      headerEnd = i + 1;
    } else {
      break;
    }
  }

  const header = lines.slice(0, headerEnd).join('\n');
  const code = lines.slice(headerEnd).join('\n').trim();
  return { header, code };
}

function preprocessCode(code) {
  // Replace TypeScript decorator syntax @ClassName in function params
  // @IInstantiationService paramName → /*@IInstantiationService*/ paramName
  return code.replace(/@([A-Za-z][A-Za-z0-9_]*)/g, '/*@$1*/');
}

function postprocessCode(code) {
  // Restore decorator comments to proper TypeScript form
  return code.replace(/\/\*@([A-Za-z][A-Za-z0-9_]*)\*\//g, '@$1');
}

function formatFile(relPath) {
  const fullPath = path.join(BASE, relPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  SKIP (not found): ${relPath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const originalLines = content.split('\n').length;

  const { header, code } = splitHeaderAndCode(content);

  if (!code || code.length < 10) {
    console.log(`  SKIP (no code body): ${relPath}`);
    return;
  }

  // Preprocess to handle TS syntax that confuses JS beautifier
  const processedCode = preprocessCode(code);

  let formatted;
  try {
    formatted = beautify(processedCode, BEAUTIFY_OPTIONS);
  } catch (err) {
    console.error(`  ERROR beautifying ${relPath}: ${err.message}`);
    return;
  }

  // Restore TS-specific syntax
  formatted = postprocessCode(formatted);

  const formattedLines = formatted.split('\n').length;

  // Rebuild file
  const result = header.trimEnd() + '\n\n' + formatted.trimStart();
  fs.writeFileSync(fullPath, result, 'utf8');

  console.log(`  OK  ${originalLines} → ${formattedLines} lines: ${relPath}`);
}

console.log('=== Fix Hard Format Failures (Round 2) ===\n');

for (const f of TARGET_FILES) {
  formatFile(f);
}

console.log('\nDone.');
