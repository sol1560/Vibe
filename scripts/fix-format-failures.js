#!/usr/bin/env node
/**
 * Fix formatting for files that prettier failed to format.
 * Uses js-beautify as fallback formatter.
 */

const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').js;

const BASE = '/Users/sollin/Claude-Editor/extracted/cursor-unbundled/modules';

const TARGET_FILES = [
  'vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase.ts',
  'vs/workbench/contrib/composer/browser/naiveComposerAgentProvider.ts',
  'vs/workbench/contrib/reviewChanges/browser/diffCommentViewZoneManager.js',
  'vs/editor/common/cursor/cursorMoveCommands.js',
  'vs/editor/contrib/suggest/browser/suggestWidgetDetails.js',
  'vs/editor/common/core/range.js',
  'vs/editor/common/core/textEdit.js',
  'vs/editor/contrib/inlineCompletions/browser/view/inlineCompletionsView.ts',
  'vs/workbench/contrib/files/common/explorerFileNestingTrie.js',
  'vs/base/common/range.js',
];

const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  indent_char: ' ',
  max_preserve_newlines: 2,
  preserve_newlines: true,
  brace_style: 'collapse,preserve-inline',
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
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      // Empty line could still be part of header gap
      if (inHeader) {
        headerEnd = i + 1;
      }
      continue;
    }
    if (line.startsWith('//') || line.startsWith('import ')) {
      inHeader = true;
      headerEnd = i + 1;
    } else {
      // First non-comment, non-import, non-empty line = code starts
      inHeader = false;
      break;
    }
  }

  const headerLines = lines.slice(0, headerEnd);
  const codeLines = lines.slice(headerEnd);

  return {
    header: headerLines.join('\n'),
    code: codeLines.join('\n').trim(),
  };
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

  let formatted;
  try {
    formatted = beautify(code, BEAUTIFY_OPTIONS);
  } catch (err) {
    console.error(`  ERROR beautifying ${relPath}: ${err.message}`);
    return;
  }

  const formattedLines = formatted.split('\n').length;

  if (formattedLines <= originalLines) {
    console.log(`  WARN line count did not increase (${originalLines} → ${formattedLines}): ${relPath}`);
  }

  // Rebuild file: header + blank line + formatted code
  const result = header.trimEnd() + '\n\n' + formatted.trimStart();
  fs.writeFileSync(fullPath, result, 'utf8');

  console.log(`  OK  ${originalLines} → ${formattedLines} lines: ${relPath}`);
}

console.log('=== Fix Format Failures ===');
console.log(`Formatting ${TARGET_FILES.length} files with js-beautify...\n`);

for (const f of TARGET_FILES) {
  formatFile(f);
}

console.log('\nDone.');
