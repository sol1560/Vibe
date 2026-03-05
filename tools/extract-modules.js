/**
 * Cursor Module Extractor
 *
 * Extracts individual modules from Cursor's bundled workbench.desktop.main.js
 * by finding module boundaries using the Ae({"out-build/..." pattern.
 *
 * Usage:
 *   node extract-modules.js <category> [--format] [--output <dir>]
 *
 * Categories: composer, ai, agent, services, all-cursor
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const CSS_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.css');

function loadBundle() {
  return fs.readFileSync(BUNDLE_PATH, 'utf8');
}

/**
 * Find all module definitions in the bundle.
 * Modules are wrapped in Ae({"out-build/..." : ()=>{ ... }}) pattern.
 */
function findModules(code) {
  // Find all module path strings
  const moduleRegex = /"out-build\/(vs\/workbench\/[^"]+\.js)"/g;
  let match;
  const modules = [];

  while ((match = moduleRegex.exec(code)) != null) {
    modules.push({
      fullPath: match[0].replace(/"/g, ''),
      relativePath: match[1],
      offset: match.index
    });
  }

  return modules;
}

/**
 * Extract a module's code given its offset.
 * The module pattern is: Ae({"out-build/path.js"(){ "use strict"; <code> }})
 * We need to find the matching closing brace.
 */
function extractModuleCode(code, moduleOffset, nextModuleOffset) {
  // Find the opening of the module function body
  // Pattern: "out-build/path.js"(){ "use strict"; ...
  let funcStart = code.indexOf('(){', moduleOffset);
  if (funcStart == -1 || funcStart > moduleOffset + 500) {
    // Try alternative pattern: "out-build/path.js"() {
    funcStart = code.indexOf('() {', moduleOffset);
  }
  if (funcStart == -1 || funcStart > moduleOffset + 500) {
    return null;
  }

  // Find the opening brace of the function body
  let braceStart = code.indexOf('{', funcStart);
  if (braceStart == -1) return null;

  // The code between this module's function body and the next module registration
  // We use a simple approach: extract everything up to the next module boundary
  // minus some safety margin for the wrapper

  // More robust: find matching closing brace
  let depth = 1;
  let i = braceStart + 1;
  let end = -1;

  // Use the next module offset as a boundary to avoid scanning too far
  const scanLimit = nextModuleOffset ? nextModuleOffset : Math.min(code.length, moduleOffset + 5000000);

  while (i < scanLimit && depth > 0) {
    const ch = code[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    // Skip string literals to avoid counting braces inside strings
    else if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < scanLimit) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === quote) break;
        if (quote === '`' && code[i] === '$' && code[i+1] === '{') {
          // Template literal expression - skip it
          depth++;
          i++;
          break;
        }
        i++;
      }
    }
    // Skip regex literals
    else if (ch === '/' && i > 0 && code[i-1] !== '*') {
      const prev = code[i-1];
      if (prev === '=' || prev === '(' || prev === ',' || prev === ':' || prev === '[' || prev === '!' || prev === '&' || prev === '|' || prev === ';' || prev === '{' || prev === '}' || prev === ' ') {
        i++;
        while (i < scanLimit) {
          if (code[i] === '\\') { i += 2; continue; }
          if (code[i] === '/') break;
          i++;
        }
      }
    }
    i++;
  }

  if (end == -1) {
    // Fallback: use the region up to the next module
    if (nextModuleOffset) {
      // Find a reasonable cutoff before the next module
      end = nextModuleOffset - 10;
    } else {
      return null;
    }
  }

  // Extract the function body (without the outer braces)
  const body = code.substring(braceStart + 1, end);

  // Clean up: remove "use strict" prefix and initial import calls
  let cleanBody = body;
  if (cleanBody.startsWith('"use strict";')) {
    cleanBody = cleanBody.substring('"use strict";'.length);
  }

  return {
    code: cleanBody,
    startOffset: braceStart + 1,
    endOffset: end,
    rawLength: end - braceStart - 1
  };
}

/**
 * Apply basic formatting to extracted code.
 */
function basicFormat(code) {
  // Add newlines after semicolons that aren't inside strings/parens
  // This is a very basic formatter - prettier would be better
  let result = code;

  // Add newlines around var/let/const/class/function declarations
  result = result.replace(/;(var |let |const |class |function )/g, ';\n$1');

  // Add newlines after closing braces followed by keywords
  result = result.replace(/}(else|catch|finally|class|function)/g, '}\n$1');

  return result;
}

/**
 * Replace cursor-* CSS variable prefixes with claude-*
 */
function replaceBranding(code) {
  let result = code;
  result = result.replace(/--cursor-/g, '--claude-');
  result = result.replace(/cursor-/g, 'claude-');
  result = result.replace(/"Cursor"/g, '"Claude Editor"');
  // Be careful not to replace cursor as a CSS property name
  result = result.replace(/claude-pointer/g, 'cursor-pointer');
  result = result.replace(/claude-text/g, 'cursor-text');
  result = result.replace(/claude-move/g, 'cursor-move');
  result = result.replace(/claude-default/g, 'cursor-default');
  result = result.replace(/claude-grab/g, 'cursor-grab');
  result = result.replace(/claude-not-allowed/g, 'cursor-not-allowed');
  result = result.replace(/claude-wait/g, 'cursor-wait');
  result = result.replace(/claude-help/g, 'cursor-help');
  result = result.replace(/claude-col-resize/g, 'cursor-col-resize');
  result = result.replace(/claude-row-resize/g, 'cursor-row-resize');
  result = result.replace(/claude-nesw-resize/g, 'cursor-nesw-resize');
  result = result.replace(/claude-nwse-resize/g, 'cursor-nwse-resize');
  result = result.replace(/claude-crosshair/g, 'cursor-crosshair');
  return result;
}

// Main
const args = process.argv.slice(2);
const category = args[0] || 'help';
const doFormat = args.includes('--format');
const outputIdx = args.indexOf('--output');
const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : null;

if (category === 'help') {
  console.log(`Usage: node extract-modules.js <category> [--format] [--output <dir>]

Categories:
  composer    - Extract all Composer modules (106 modules)
  ai          - Extract AI service modules
  agent       - Extract Agent service modules
  services    - Extract all Cursor-specific services
  contrib     - Extract other Cursor contrib modules
  all-cursor  - Extract all Cursor-specific code
  list        - Just list modules without extracting
  single <path> - Extract a single module by path
`);
  process.exit(0);
}

console.log('Loading bundle...');
const code = loadBundle();
console.log('Bundle size:', (code.length / 1024 / 1024).toFixed(1), 'MB');

console.log('Finding modules...');
const allModules = findModules(code);
console.log('Total modules found:', allModules.length);

// Filter by category
let targetModules;
switch (category) {
  case 'composer':
    targetModules = allModules.filter(m => m.relativePath.includes('/composer/'));
    break;
  case 'ai':
    targetModules = allModules.filter(m => m.relativePath.includes('/services/ai/'));
    break;
  case 'agent':
    targetModules = allModules.filter(m => m.relativePath.includes('/services/agent/') || m.relativePath.includes('/contrib/agents/'));
    break;
  case 'services':
    targetModules = allModules.filter(m =>
      m.relativePath.includes('/services/') &&
      (m.relativePath.includes('cursor') || m.relativePath.includes('ai/') ||
       m.relativePath.includes('agent') || m.relativePath.includes('composer') ||
       m.relativePath.includes('inlineDiff'))
    );
    break;
  case 'contrib':
    targetModules = allModules.filter(m =>
      m.relativePath.includes('/contrib/') && !m.relativePath.includes('/composer/') &&
      (m.relativePath.includes('inline') || m.relativePath.includes('agent') ||
       m.relativePath.includes('aiCpp') || m.relativePath.includes('cursor') ||
       m.relativePath.includes('appLayout') || m.relativePath.includes('onboarding') ||
       m.relativePath.includes('reviewChanges'))
    );
    break;
  case 'all-cursor':
    targetModules = allModules.filter(m =>
      m.relativePath.includes('/composer/') ||
      m.relativePath.includes('cursor') ||
      m.relativePath.includes('/services/ai/') ||
      m.relativePath.includes('/services/agent') ||
      m.relativePath.includes('/contrib/agents/') ||
      m.relativePath.includes('/contrib/aiCpp/') ||
      m.relativePath.includes('/contrib/appLayout/') ||
      m.relativePath.includes('/contrib/inlineChat/') ||
      m.relativePath.includes('/contrib/reviewChanges/') ||
      m.relativePath.includes('inlineDiff')
    );
    break;
  case 'list':
    targetModules = allModules.filter(m =>
      m.relativePath.includes('/composer/') ||
      m.relativePath.includes('cursor') ||
      m.relativePath.includes('/services/ai/') ||
      m.relativePath.includes('/services/agent') ||
      m.relativePath.includes('/contrib/agents/')
    );
    console.log('\nAll Cursor-specific modules (' + targetModules.length + '):');
    targetModules.forEach(m => console.log('  ' + m.relativePath));
    process.exit(0);
    break;
  case 'single':
    const searchPath = args[1];
    targetModules = allModules.filter(m => m.relativePath.includes(searchPath));
    break;
  default:
    console.error('Unknown category:', category);
    process.exit(1);
}

console.log('\nTarget modules:', targetModules.length);

if (!outputDir) {
  console.log('\nModules to extract:');
  targetModules.forEach(m => console.log('  ' + m.relativePath + ' [offset: ' + m.offset + ']'));
  console.log('\nAdd --output <dir> to extract to disk');
  process.exit(0);
}

// Sort modules by offset for sequential extraction
const sortedAll = [...allModules].sort((a, b) => a.offset - b.offset);
const targetSet = new Set(targetModules.map(m => m.relativePath));

// Create output directory
fs.mkdirSync(outputDir, { recursive: true });

let extracted = 0;
let failed = 0;
let totalSize = 0;

for (const mod of targetModules) {
  // Find next module's offset for boundary detection
  const modIdx = sortedAll.findIndex(m => m.offset === mod.offset);
  const nextModule = modIdx < sortedAll.length - 1 ? sortedAll[modIdx + 1] : null;

  const result = extractModuleCode(code, mod.offset, nextModule ? nextModule.offset : null);

  if (!result) {
    console.error('  FAILED: ' + mod.relativePath);
    failed++;
    continue;
  }

  let moduleCode = result.code;

  // Apply branding replacement
  moduleCode = replaceBranding(moduleCode);

  if (doFormat) {
    moduleCode = basicFormat(moduleCode);
  }

  // Convert path: vs/workbench/contrib/composer/browser/foo.js -> composer/browser/foo.js
  const shortPath = mod.relativePath.replace('vs/workbench/', '');
  const outPath = path.join(outputDir, shortPath);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, moduleCode);

  totalSize += moduleCode.length;
  extracted++;
}

console.log('\n=== Extraction Complete ===');
console.log('Extracted:', extracted);
console.log('Failed:', failed);
console.log('Total size:', (totalSize / 1024).toFixed(0), 'KB');
console.log('Output directory:', outputDir);
