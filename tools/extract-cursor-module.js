#!/usr/bin/env node
/**
 * Cursor Bundle Code Extractor
 *
 * 从 Cursor 的 minified bundle 中提取特定功能模块的代码段。
 * 策略：基于已知的字符串标识符和注册模式定位代码块。
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const CSS_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.css');

function loadBundle() {
  console.log('Loading bundle...');
  const code = fs.readFileSync(BUNDLE_PATH, 'utf8');
  console.log(`Bundle loaded: ${(code.length / 1024 / 1024).toFixed(1)} MB`);
  return code;
}

function loadCSS() {
  console.log('Loading CSS...');
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  console.log(`CSS loaded: ${(css.length / 1024).toFixed(1)} KB`);
  return css;
}

/**
 * 提取包含给定字符串的代码块（找到最近的顶级函数/类边界）
 */
function extractCodeAroundString(code, searchStr, contextChars = 5000) {
  const idx = code.indexOf(searchStr);
  if (idx === -1) return null;

  // 向前找到函数/类的开始
  let start = idx;
  let braceDepth = 0;
  for (let i = idx; i >= Math.max(0, idx - contextChars); i--) {
    if (code[i] === '}') braceDepth++;
    if (code[i] === '{') {
      braceDepth--;
      if (braceDepth < 0) {
        // We've gone past our enclosing block, back up to find the start
        // Look for class/function keyword
        const before = code.substring(Math.max(0, i - 200), i);
        const classMatch = before.match(/(class\s+\w+[^{]*$)/);
        const funcMatch = before.match(/((?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:function|\(|\w+=>\w+))[^{]*$)/);
        if (classMatch) {
          start = i - classMatch[0].length;
        } else if (funcMatch) {
          start = i - funcMatch[0].length;
        } else {
          start = i;
        }
        break;
      }
    }
  }

  // 向后找到匹配的闭合大括号
  let end = idx;
  braceDepth = 0;
  for (let i = start; i < Math.min(code.length, idx + contextChars); i++) {
    if (code[i] === '{') braceDepth++;
    if (code[i] === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  return {
    code: code.substring(start, end),
    startIdx: start,
    endIdx: end
  };
}

/**
 * 提取 CSS 中匹配特定选择器模式的所有规则
 */
function extractCSSRules(css, pattern) {
  const regex = new RegExp(`[^}]*${pattern}[^{]*\\{[^}]*\\}`, 'g');
  const matches = css.match(regex);
  return matches || [];
}

/**
 * 查找变量赋值：找到 varName="stringValue" 模式
 */
function findVariableAssignments(code, stringValues) {
  const result = {};
  for (const str of stringValues) {
    const idx = code.indexOf(`"${str}"`);
    if (idx === -1) continue;

    // Look backwards for variable assignment
    const before = code.substring(Math.max(0, idx - 100), idx);
    const varMatch = before.match(/(\w+)\s*=\s*$/);
    if (varMatch) {
      result[str] = varMatch[1];
    }
  }
  return result;
}

/**
 * 提取特定注册模式周围的代码
 */
function extractRegistrations(code, registrationFunc) {
  const results = [];
  let searchIdx = 0;

  while (true) {
    const idx = code.indexOf(registrationFunc, searchIdx);
    if (idx === -1) break;

    // Find the opening paren
    let parenIdx = code.indexOf('(', idx);
    if (parenIdx === -1) break;

    // Find matching closing paren
    let depth = 1;
    let end = parenIdx + 1;
    while (end < code.length && depth > 0) {
      if (code[end] === '(') depth++;
      if (code[end] === ')') depth--;
      end++;
    }

    results.push({
      code: code.substring(idx, end),
      startIdx: idx,
      endIdx: end
    });

    searchIdx = end;
  }

  return results;
}

// Main command
const command = process.argv[2];

if (command === 'find-vars') {
  // Find variable names for known strings
  const code = loadBundle();
  const strings = process.argv.slice(3);
  const vars = findVariableAssignments(code, strings);
  console.log('\nVariable assignments:');
  for (const [str, varName] of Object.entries(vars)) {
    console.log(`  "${str}" -> ${varName}`);
  }
} else if (command === 'extract-around') {
  // Extract code around a string
  const code = loadBundle();
  const searchStr = process.argv[3];
  const contextSize = parseInt(process.argv[4] || '5000');
  const result = extractCodeAroundString(code, searchStr, contextSize);
  if (result) {
    console.log(`\nExtracted ${result.code.length} chars from offset ${result.startIdx}-${result.endIdx}`);
    console.log('\n--- CODE ---\n');
    console.log(result.code);
  } else {
    console.log(`String "${searchStr}" not found`);
  }
} else if (command === 'extract-range') {
  // Extract a byte range from the bundle
  const code = loadBundle();
  const start = parseInt(process.argv[3]);
  const end = parseInt(process.argv[4]);
  const outFile = process.argv[5];
  const extracted = code.substring(start, end);
  if (outFile) {
    fs.writeFileSync(outFile, extracted);
    console.log(`Written ${extracted.length} chars to ${outFile}`);
  } else {
    console.log(extracted);
  }
} else if (command === 'extract-css') {
  // Extract CSS rules matching a pattern
  const css = loadCSS();
  const pattern = process.argv[3];
  const rules = extractCSSRules(css, pattern);
  console.log(`Found ${rules.length} CSS rules matching "${pattern}":`);
  rules.forEach(r => console.log(r));
} else if (command === 'scan-classes') {
  // Scan for class definitions containing specific methods/properties
  const code = loadBundle();
  const keyword = process.argv[3];

  // Find all occurrences of the keyword
  const occurrences = [];
  let searchIdx = 0;
  while (true) {
    const idx = code.indexOf(keyword, searchIdx);
    if (idx === -1) break;
    occurrences.push(idx);
    searchIdx = idx + 1;
  }

  console.log(`Found ${occurrences.length} occurrences of "${keyword}"`);

  // Show surrounding context for first 5
  for (let i = 0; i < Math.min(5, occurrences.length); i++) {
    const pos = occurrences[i];
    console.log(`\n--- Occurrence ${i + 1} at offset ${pos} ---`);
    console.log(code.substring(Math.max(0, pos - 100), Math.min(code.length, pos + 200)));
    console.log('...');
  }
} else if (command === 'map-composer') {
  // Map the entire Composer module structure
  const code = loadBundle();

  console.log('=== Mapping Composer Module ===\n');

  // Key identifiers
  const composerStrings = [
    'workbench.panel.composerChatViewPane',
    'composer.submitChat', 'composer.send', 'composer.createNew',
    'composer.focusComposer', 'composer.cancel', 'composer.accept',
    'composer.agent', 'composer.plan', 'composer.diff',
    'composer.selectSubComposerTab',
    'composerState', 'allComposers', 'backgroundComposers',
    'composerFocused', 'selectedComposerIds',
  ];

  const vars = findVariableAssignments(code, composerStrings);
  console.log('Variable Assignments:');
  for (const [str, varName] of Object.entries(vars)) {
    console.log(`  ${varName} = "${str}"`);
  }

  // Find the view container registration for composer
  console.log('\n--- Searching for Composer View Container Registration ---');
  const panelVar = vars['workbench.panel.composerChatViewPane'];
  if (panelVar) {
    // Find where this variable is used in a registration-like context
    let searchIdx = 0;
    let found = 0;
    while (found < 10) {
      const idx = code.indexOf(panelVar, searchIdx);
      if (idx === -1) break;
      const context = code.substring(Math.max(0, idx - 30), Math.min(code.length, idx + 100));
      if (context.includes('register') || context.includes('Registry') || context.includes('id:') || context.includes('ViewContainer')) {
        console.log(`  [${idx}]: ...${context.trim()}...`);
        found++;
      }
      searchIdx = idx + 1;
    }
  }

} else {
  console.log(`Usage:
  node extract-cursor-module.js find-vars <string1> <string2> ...
  node extract-cursor-module.js extract-around <searchString> [contextChars]
  node extract-cursor-module.js extract-range <start> <end> [outFile]
  node extract-cursor-module.js extract-css <pattern>
  node extract-cursor-module.js scan-classes <keyword>
  node extract-cursor-module.js map-composer
  `);
}
