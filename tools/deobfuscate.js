/**
 * Deobfuscate extracted Cursor modules by restoring meaningful variable names.
 *
 * Strategy:
 * 1. Parse constructor to build param → this._xxxService mappings
 * 2. For each method, find local destructured / aliased variables
 * 3. Rename single-letter vars to meaningful names within their scope
 *
 * This is a best-effort heuristic tool. It won't produce perfect results
 * but should make code significantly more readable.
 */

const fs = require('fs');
const path = require('path');

// ─── Constructor Parameter Renaming ────────────────────────────────
// In minified code, constructor(e,t,i,r,...) maps to this._someService=e
// We can extract these mappings and rename the params.

function extractConstructorMappings(code) {
  // Find constructor parameters
  const ctorMatch = code.match(/constructor\(([^)]+)\)\s*\{/);
  if (!ctorMatch) return null;

  const params = ctorMatch[1].split(',').map(p => p.trim());
  const mappings = new Map(); // shortName → meaningful name

  // Find assignments like this._composerDataService=e
  // or this._composerDataService = e
  for (const param of params) {
    // Look for this._xxxService = param or this._xxx = param
    const assignRegex = new RegExp(
      `this\\.(\\w+)\\s*=\\s*${escapeRegex(param)}\\b(?![\\w$])`,
      'g'
    );
    let match;
    // Find the FIRST assignment (in the constructor body)
    const ctorStart = code.indexOf(ctorMatch[0]);
    const ctorBody = extractBraceBlock(code, ctorStart + ctorMatch[0].length - 1);
    if (!ctorBody) continue;

    match = assignRegex.exec(ctorBody);
    if (match) {
      const propName = match[1];
      // Convert _composerDataService → composerDataService
      // Or _storageService → storageService
      let varName = propName.startsWith('_') ? propName.slice(1) : propName;
      mappings.set(param, varName);
    }
  }

  return { params, mappings, ctorMatch };
}

function extractBraceBlock(code, openBraceIndex) {
  if (code[openBraceIndex] !== '{') return null;
  let depth = 1;
  let i = openBraceIndex + 1;
  while (i < code.length && depth > 0) {
    const ch = code[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(code, i);
      continue;
    } else if (ch === '/' && code[i + 1] === '/') {
      // line comment
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    } else if (ch === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    i++;
  }
  return code.substring(openBraceIndex, i);
}

function skipString(code, start) {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === '\\') { i += 2; continue; }
    if (code[i] === quote) return i + 1;
    if (quote === '`' && code[i] === '$' && code[i + 1] === '{') {
      // template literal expression - skip nested
      let depth = 1;
      i += 2;
      while (i < code.length && depth > 0) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') depth--;
        else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
          i = skipString(code, i);
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Scope-aware Variable Renaming ─────────────────────────────────
// For local variables in method bodies, try to infer names from usage.

function inferLocalVarNames(code) {
  const renames = [];

  // Pattern 1: const x = this._someService.someMethod(...)
  // x should be named based on someMethod
  const localAssignRegex = /(?:const|let|var)\s+(\w{1,2})\s*=\s*this\.(\w+)\.(\w+)\(/g;
  let match;
  while ((match = localAssignRegex.exec(code)) !== null) {
    const [, varName, service, method] = match;
    if (varName.length <= 2) {
      // e.g. this._storageService.get → storageResult
      renames.push({
        original: varName,
        suggested: method + 'Result',
        offset: match.index,
        confidence: 0.3
      });
    }
  }

  // Pattern 2: const { x, y } = someObj → keep destructured names
  // These are already meaningful, skip

  // Pattern 3: for (const x of items) → x = item
  const forOfRegex = /for\s*\(\s*(?:const|let|var)\s+(\w{1,2})\s+of\s+(\w+)\)/g;
  while ((match = forOfRegex.exec(code)) !== null) {
    const [, varName, collectionName] = match;
    if (varName.length <= 2 && collectionName.length > 2) {
      // Singularize the collection name
      let singular = collectionName;
      if (singular.endsWith('ies')) singular = singular.slice(0, -3) + 'y';
      else if (singular.endsWith('es')) singular = singular.slice(0, -2);
      else if (singular.endsWith('s')) singular = singular.slice(0, -1);
      renames.push({
        original: varName,
        suggested: singular,
        offset: match.index,
        confidence: 0.5
      });
    }
  }

  return renames;
}

// ─── Safe Rename in Scope ──────────────────────────────────────────
// Only rename a variable within its scope to avoid collisions.

function renameConstructorParams(code, mappings, ctorMatch) {
  // Replace constructor parameter names with meaningful names
  // Only within the constructor signature (the parameter list)

  const ctorParamStr = ctorMatch[1];
  const params = ctorParamStr.split(',').map(p => p.trim());

  let newParams = params.map(p => {
    if (mappings.has(p)) {
      return mappings.get(p);
    }
    return p;
  });

  // Also replace in the constructor body: this._xxx = e → this._xxx = composerDataService
  let newCode = code.replace(
    `constructor(${ctorMatch[1]})`,
    `constructor(${newParams.join(', ')})`
  );

  // Replace assignments in constructor body
  for (const [shortName, longName] of mappings) {
    // Replace: this._xxx = e → this._xxx = composerDataService (in constructor only)
    // We need to be careful to only replace in the constructor scope
    // For now, replace the simple assignment pattern
    const assignPattern = new RegExp(
      `(this\\.\\w+\\s*=\\s*)${escapeRegex(shortName)}\\b(?=[,;\\s\\)])`,
      'g'
    );
    // Only apply to first occurrence of each (in constructor)
    newCode = newCode.replace(assignPattern, (match, prefix) => {
      return `${prefix}${longName}`;
    });
  }

  return newCode;
}

// ─── Common Minified Patterns ──────────────────────────────────────

// Rename common minified utility variable patterns
function renameCommonPatterns(code) {
  // Pattern: at → Disposable (if class extends at)
  // This is VS Code specific: at = Disposable base class

  // Pattern: st → ConfigurationTarget, Qr → Registry, etc.
  // These are too risky to rename without full context

  return code;
}

// ─── Main Processing ───────────────────────────────────────────────

function deobfuscateFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const originalSize = code.length;
  let changes = 0;

  // Step 1: Extract and rename constructor params
  const ctorInfo = extractConstructorMappings(code);
  if (ctorInfo && ctorInfo.mappings.size > 0) {
    code = renameConstructorParams(code, ctorInfo.mappings, ctorInfo.ctorMatch);
    changes += ctorInfo.mappings.size;
  }

  // Step 2: Find class-level field declarations that map single-letter to meaningful
  // e.g., _composerDataService = e → we already got this from constructor

  // Step 3: Infer local variable names (low confidence, skip for now)
  // const localRenames = inferLocalVarNames(code);

  if (changes > 0) {
    fs.writeFileSync(filePath, code);
  }

  return { changes, mappings: ctorInfo?.mappings?.size || 0 };
}

// ─── CLI ───────────────────────────────────────────────────────────

const target = process.argv[2];
if (!target) {
  console.log('Usage: node deobfuscate.js <file-or-directory>');
  console.log('');
  console.log('Restores meaningful variable names in extracted Cursor modules.');
  console.log('Currently handles:');
  console.log('  - Constructor parameter renaming (e,t,i → composerDataService, composerUtilsService, ...)');
  process.exit(1);
}

function findJSFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJSFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const stat = fs.statSync(target);
const files = stat.isDirectory() ? findJSFiles(target) : [target];

console.log(`Processing ${files.length} file(s)...`);

let totalChanges = 0;
let filesModified = 0;
let filesSkipped = 0;

for (const file of files) {
  const relPath = path.relative(process.cwd(), file);
  const result = deobfuscateFile(file);
  if (result.changes > 0) {
    filesModified++;
    totalChanges += result.changes;
    console.log(`  ✓ ${relPath}: ${result.mappings} constructor params renamed`);
  } else {
    filesSkipped++;
  }
}

console.log(`\nDone: ${filesModified} files modified, ${filesSkipped} skipped`);
console.log(`Total variable renames: ${totalChanges}`);
