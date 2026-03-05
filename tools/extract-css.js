/**
 * Extract Cursor-specific CSS from the main CSS bundle.
 * Finds all CSS rules that use --cursor-* variables or cursor-specific class names.
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.css');
const css = fs.readFileSync(CSS_PATH, 'utf8');

console.log('CSS size:', (css.length / 1024).toFixed(0), 'KB');

// Parse CSS into individual rules
function parseRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    // Check for @media, @keyframes, etc.
    if (css[i] === '@') {
      const atRuleStart = i;
      // Find the opening brace
      while (i < css.length && css[i] !== '{') i++;
      if (i >= css.length) break;

      // Find matching closing brace (nested)
      let depth = 1;
      i++;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') depth--;
        i++;
      }
      rules.push(css.substring(atRuleStart, i));
      continue;
    }

    // Regular rule
    const ruleStart = i;
    // Find opening brace
    while (i < css.length && css[i] !== '{') i++;
    if (i >= css.length) break;

    // Find closing brace
    let depth = 1;
    i++;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    rules.push(css.substring(ruleStart, i));
  }
  return rules;
}

const rules = parseRules(css);
console.log('Total CSS rules:', rules.length);

// Filter Cursor-specific rules
const cursorPatterns = [
  '--cursor-',
  '--composer-',
  '.composer-',
  '.cursor-',
  '.agent-',
  'cursor-glass',
  'cursor-mode',
  'composer-mode',
  'agent-layout',
  'quick-agent',
  'inline-chat',
  'inline-diff',
  'bc-peek',    // Background Composer peek
  'sub-composer',
  'composerInput',
  'composerOutput',
  'composerMessage',
  'composerTab',
  'ai-chat',
];

const cursorRules = rules.filter(rule => {
  return cursorPatterns.some(p => rule.includes(p));
});

console.log('Cursor-specific CSS rules:', cursorRules.length);

// Also find :root CSS variable definitions
const rootRules = rules.filter(rule => rule.includes(':root') || rule.includes(':host'));
const cursorVarRules = rootRules.filter(rule =>
  rule.includes('--cursor-') || rule.includes('--composer-')
);

console.log('Root variable rules with cursor/composer vars:', cursorVarRules.length);

// Combine and deduplicate
const allCursorCSS = [...cursorVarRules, ...cursorRules];
const uniqueCSS = [...new Set(allCursorCSS)];

// Output
const outputDir = process.argv[2] || path.join(__dirname, '..', 'staging', 'phase-2e-theme');
fs.mkdirSync(outputDir, { recursive: true });

// Write original Cursor CSS
const originalPath = path.join(outputDir, 'cursor-ai-styles.css');
fs.writeFileSync(originalPath, uniqueCSS.join('\n\n'));
console.log('\nWrote original Cursor CSS to:', originalPath);
console.log('Size:', (fs.statSync(originalPath).size / 1024).toFixed(0), 'KB');

// Write Claude-branded version
let claudeCSS = uniqueCSS.join('\n\n');
claudeCSS = claudeCSS.replace(/--cursor-/g, '--claude-');
claudeCSS = claudeCSS.replace(/\.cursor-/g, '.claude-');
// Don't replace cursor CSS property values
claudeCSS = claudeCSS.replace(/cursor:\s*claude-/g, 'cursor: cursor-');

const claudePath = path.join(outputDir, 'claude-ai-styles.css');
fs.writeFileSync(claudePath, claudeCSS);
console.log('Wrote Claude-branded CSS to:', claudePath);
console.log('Size:', (fs.statSync(claudePath).size / 1024).toFixed(0), 'KB');

// Extract just the variable definitions
const varDefs = [];
for (const rule of uniqueCSS) {
  const matches = rule.match(/--(?:cursor|composer)-[a-zA-Z0-9-]+\s*:[^;]+;/g);
  if (matches) {
    varDefs.push(...matches);
  }
}

const uniqueVars = [...new Set(varDefs)].sort();
const varsPath = path.join(outputDir, 'cursor-variables-complete.css');
fs.writeFileSync(varsPath, ':root {\n  ' + uniqueVars.join('\n  ') + '\n}\n');
console.log('Wrote variable definitions to:', varsPath);
console.log('Total unique CSS variables:', uniqueVars.length);
