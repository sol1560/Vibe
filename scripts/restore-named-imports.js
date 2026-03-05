#!/usr/bin/env node
/**
 * restore-named-imports.js
 *
 * 将 side-effect only 的 import 语句升级为命名导入。
 *
 * 背景：
 *   restore-imports.js 生成的所有 import 语句都是 `import './path'` 形式。
 *   这是因为 esbuild bundle 中模块间引用不通过 import binding，而是全局变量：
 *     - 模块 B 的 body 执行后会设置全局变量 (e.g. `Xl = class ...`)
 *     - 模块 A 调用 B() 确保 B 初始化，然后直接使用 Xl
 *     - 不存在 B.Xl 这样的属性访问模式
 *
 * 算法：
 *   Phase 1: 扫描每个模块文件，提取它在顶层（模块 body）定义的全局变量名
 *            → 建立: moduleVarName → Set<globalVar>
 *   Phase 2: 对每个模块 A:
 *            对 A 的每个依赖 B (import './B'):
 *              检查 B 定义的全局变量中，哪些在 A 的 body 中被引用
 *              如果有 → 升级 `import './B'` 为 `import { var1, var2 } from './B'`
 *              在 B 的文件中添加 `export { var1, var2 }`
 *   Phase 3: 处理命名冲突（同名变量被多个模块 export）
 *
 * 安全规则：
 *   - 只处理 min-length ≥ 2 的变量名（避免单字母误匹配）
 *   - 全局变量必须在 module body 顶层被赋值（不在函数/类体内）
 *   - 同名冲突时使用 `import { Foo as Foo_depVarName }` 别名
 *   - 语法验证失败的文件跳过，保留原始 import
 *
 * 用法:
 *   node scripts/restore-named-imports.js [--dry-run]    # 预览
 *   node scripts/restore-named-imports.js --apply        # 实际执行
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import { join, relative, resolve, dirname, extname, basename } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const MODULES_DIR = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');
const MODULE_MAP_PATH = join(PROJECT_ROOT, 'extracted/cursor-unbundled/module-map.json');
const DEP_GRAPH_PATH = join(PROJECT_ROOT, 'extracted/cursor-unbundled/dependency-graph.json');

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const verbose = args.includes('--verbose');

if (dryRun) {
  console.log('[restore-named-imports] 运行模式: --dry-run (预览，不写文件)');
  console.log('[restore-named-imports] 使用 --apply 参数执行实际修改');
} else {
  console.log('[restore-named-imports] 运行模式: --apply (实际写入文件)');
}

// ─── Load Maps ───────────────────────────────────────────────────────────────
console.log('[restore-named-imports] 加载映射表...');

if (!existsSync(MODULE_MAP_PATH)) {
  console.error('错误: 找不到 module-map.json，请先运行 unbundle.js');
  process.exit(1);
}

/** varName → module path (e.g. "out-build/vs/...") */
const moduleMap = JSON.parse(readFileSync(MODULE_MAP_PATH, 'utf-8'));
/** module path → [dep paths] */
const depGraph = existsSync(DEP_GRAPH_PATH)
  ? JSON.parse(readFileSync(DEP_GRAPH_PATH, 'utf-8'))
  : {};

// Reverse: module path → var name
const pathToVar = new Map();
for (const [v, p] of Object.entries(moduleMap)) pathToVar.set(p, v);

// var name → module path
const varToPath = new Map(Object.entries(moduleMap));

console.log(`[restore-named-imports] module-map: ${Object.keys(moduleMap).length} 个模块`);
console.log(`[restore-named-imports] dep-graph: ${Object.keys(depGraph).length} 个条目`);

// ─── Collect Module Files ─────────────────────────────────────────────────────
function walkDir(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walkDir(full, files);
    else if (name.endsWith('.js') || name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const allFiles = walkDir(MODULES_DIR);
console.log(`[restore-named-imports] 发现 ${allFiles.length} 个模块文件`);

// Build file path → module var name mapping
// The file path is like: /path/to/modules/vs/base/common/network.js
// The module path in module-map is: out-build/vs/base/common/network.js
function filePathToModulePath(filePath) {
  const rel = relative(MODULES_DIR, filePath);
  return 'out-build/' + rel.replace(/\.(ts)$/, '.js');
}

function modulePathToFilePath(modulePath) {
  // Strip out-build/ prefix, look for .js or .ts extension
  const rel = modulePath.replace(/^out-build\//, '');
  const jsPath = join(MODULES_DIR, rel);
  const tsPath = jsPath.replace(/\.js$/, '.ts');
  if (existsSync(tsPath)) return tsPath;
  if (existsSync(jsPath)) return jsPath;
  return null;
}

// ─── Phase 1: Scan module files for top-level global assignments ─────────────
console.log('\n[restore-named-imports] Phase 1: 扫描全局变量定义...');

/**
 * Parse a module file and extract:
 *  - meta: { modulePath, varName, dependencies[] }
 *  - body: the code content (after imports)
 *  - imports: array of { statement, importPath, resolved }
 *  - topLevelGlobals: Set<string> of globals defined at top scope
 */
function parseModuleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Parse header comments
  const meta = {
    modulePath: null,
    varName: null,
    type: null,
    dependencies: [],
  };

  let headerEndLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('// Module:')) {
      meta.modulePath = line.slice('// Module:'.length).trim();
      headerEndLine = i + 1;
    } else if (line.startsWith('// Variable:')) {
      meta.varName = line.slice('// Variable:'.length).trim();
      headerEndLine = i + 1;
    } else if (line.startsWith('// Type:')) {
      meta.type = line.slice('// Type:'.length).trim();
      headerEndLine = i + 1;
    } else if (line.startsWith('// Dependencies:')) {
      meta.dependencies = line
        .slice('// Dependencies:'.length)
        .trim()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      headerEndLine = i + 1;
    } else if (line.startsWith('//') || line === '') {
      headerEndLine = i + 1;
    } else {
      break;
    }
  }

  // Parse import statements
  const imports = [];
  let bodyStartLine = headerEndLine;

  for (let i = headerEndLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      bodyStartLine = i + 1;
      continue;
    }

    // Match: import './path' or import "path" or import { ... } from './path'
    const sideEffectMatch = line.match(/^import\s+['"]([^'"]+)['"]\s*;?\s*$/);
    const namedMatch = line.match(/^import\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);

    if (sideEffectMatch || namedMatch) {
      const importPath = (sideEffectMatch || namedMatch)[1];
      imports.push({ line: i, statement: line, importPath });
      bodyStartLine = i + 1;
    } else if (line.startsWith('import ')) {
      imports.push({ line: i, statement: line, importPath: null });
      bodyStartLine = i + 1;
    } else {
      break;
    }
  }

  const body = lines.slice(bodyStartLine).join('\n');
  const fullContent = content;

  return { meta, imports, body, bodyStartLine, fullContent, lines };
}

const SKIP_KEYWORDS = new Set([
  'use', 'const', 'let', 'var', 'function', 'class', 'return', 'if', 'for',
  'while', 'else', 'this', 'null', 'true', 'false', 'new', 'typeof', 'void',
  'throw', 'try', 'catch', 'finally', 'switch', 'case', 'default', 'break',
  'continue', 'instanceof', 'in', 'of', 'delete', 'constructor', 'static',
  'get', 'set', 'super', 'import', 'export', 'async', 'await', 'yield',
  'extends', 'implements', 'interface', 'type', 'enum', 'namespace', 'module',
  'declare', 'abstract', 'override', 'readonly', 'private', 'public',
  'protected', 'debugger', 'with',
]);

/**
 * Extract top-level global variable assignments from module body.
 *
 * Uses depth-tracking to correctly identify assignments at module scope (depth=0)
 * vs assignments inside function/class bodies.
 *
 * Handles:
 *   - String literals (single, double, template)
 *   - Comments (// and /* *\/)
 *   - Nested brackets {, (, [
 *
 * Returns Set<string> of global variable names.
 */
function extractTopLevelGlobals(body) {
  const globals = new Set();
  let depth = 0;
  let i = 0;
  const n = body.length;
  let prevToken = null; // track the last significant token

  while (i < n) {
    const ch = body[i];

    // Skip single-line comments
    if (ch === '/' && i + 1 < n && body[i + 1] === '/') {
      i += 2;
      while (i < n && body[i] !== '\n') i++;
      continue;
    }

    // Skip block comments
    if (ch === '/' && i + 1 < n && body[i + 1] === '*') {
      i += 2;
      while (i < n - 1 && !(body[i] === '*' && body[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Skip string literals
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n) {
        if (body[i] === '\\') { i += 2; continue; }
        if (body[i] === q) { i++; break; }
        i++;
      }
      prevToken = 'str';
      continue;
    }

    // Skip template literals (simplified - doesn't track ${} depth perfectly but good enough)
    if (ch === '`') {
      i++;
      let td = 0;
      while (i < n) {
        const tc = body[i];
        if (tc === '\\') { i += 2; continue; }
        if (td === 0 && tc === '`') { i++; break; }
        if (tc === '$' && i + 1 < n && body[i + 1] === '{') { td++; i += 2; continue; }
        if (td > 0 && tc === '{') td++;
        if (td > 0 && tc === '}') td--;
        i++;
      }
      prevToken = 'str';
      continue;
    }

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    // Track depth
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
      prevToken = ch;
      i++;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      if (depth > 0) depth--;
      prevToken = ch;
      i++;
      continue;
    }

    // Track commas (for comma-expression chains at depth 1)
    if (ch === ',') {
      prevToken = ',';
      i++;
      continue;
    }

    // Track || for enum patterns: (EnumVar || (EnumVar = {}))
    if (ch === '|' && i + 1 < n && body[i + 1] === '|') {
      prevToken = '||';
      i += 2;
      continue;
    }

    // At depth 0, 1, or 2: look for IDENTIFIER = pattern (potential module-level assignment)
    // - depth 0: simple `IDENT = value` at module scope
    // - depth 1: `(IDENT = value)` wrapped in outer parens (formatted module style)
    // - depth 2: `(x || (IDENT = {}))` IIFE enum pattern where prevToken is '('
    const shouldCheck =
      depth === 0 ||
      (depth === 1 && (prevToken === '(' || prevToken === ',')) ||
      (depth === 2 && prevToken === '(');

    if (shouldCheck) {
      // Try to match an identifier at current position
      const identMatch = body.slice(i).match(/^([A-Za-z_$][A-Za-z0-9_$]+)\s*=/);
      if (identMatch) {
        const name = identMatch[1];
        // Make sure the = is not == or === or =>
        const eqPos = i + identMatch[0].length - 1;
        const nextCh = body[eqPos + 1];
        if (nextCh !== '=' && nextCh !== '>' && !SKIP_KEYWORDS.has(name) && name.length >= 2) {
          globals.add(name);
        }
        prevToken = name;
        i += identMatch[0].length;
        continue;
      }
    }

    prevToken = ch;
    i++;
  }

  return globals;
}

// Build mapping: file path → top-level globals
const fileGlobals = new Map(); // filePath → Set<globalName>
const modulePathGlobals = new Map(); // modulePath → Set<globalName>

let phase1Count = 0;
let phase1Total = 0;

for (const filePath of allFiles) {
  const modulePath = filePathToModulePath(filePath);
  if (!pathToVar.has(modulePath)) continue; // Not in module map, skip

  phase1Total++;
  const { body } = parseModuleFile(filePath);
  const globals = extractTopLevelGlobals(body);

  if (globals.size > 0) {
    fileGlobals.set(filePath, globals);
    modulePathGlobals.set(modulePath, globals);
    phase1Count++;
    if (verbose) {
      console.log(`  ${relative(MODULES_DIR, filePath)}: ${globals.size} globals`);
    }
  }

  if (phase1Total % 500 === 0) {
    console.log(`[restore-named-imports]   Phase 1 进度: ${phase1Total}/${allFiles.length}`);
  }
}

console.log(
  `[restore-named-imports] Phase 1 完成: ${phase1Total} 个模块中 ${phase1Count} 个有全局变量`,
);

// Build: globalName → Set<modulePath> (which module "defines" each global)
// Note: same global name may be defined in multiple modules!
const globalOwners = new Map(); // globalName → Set<modulePath>
for (const [modulePath, globals] of modulePathGlobals) {
  for (const g of globals) {
    if (!globalOwners.has(g)) globalOwners.set(g, new Set());
    globalOwners.get(g).add(modulePath);
  }
}

const singleOwnerGlobals = new Set();
const multiOwnerGlobals = new Set();
for (const [g, owners] of globalOwners) {
  if (owners.size === 1) singleOwnerGlobals.add(g);
  else multiOwnerGlobals.add(g);
}

console.log(`[restore-named-imports] 全局变量统计:`);
console.log(`  总唯一全局变量: ${globalOwners.size}`);
console.log(`  单一定义者: ${singleOwnerGlobals.size} (可安全 export/import)`);
console.log(`  多重定义者: ${multiOwnerGlobals.size} (需要别名处理)`);

// ─── Phase 2: Find named import candidates ───────────────────────────────────
console.log('\n[restore-named-imports] Phase 2: 分析跨模块引用...');

/**
 * Check if globalName appears as an identifier reference in code.
 * Uses word boundary to avoid false positives (e.g. "Xl" in "nXl").
 */
function usesGlobal(code, globalName) {
  // Escape special regex chars in global name
  const escaped = globalName.replace(/[$]/g, '\\$');
  const re = new RegExp(`\\b${escaped}\\b`);
  return re.test(code);
}

// Track what to change
const exportAdditions = new Map(); // filePath → Set<globalName> to export
const importUpgrades = new Map(); // filePath → Map<importStatement, namedImports>

let upgradeCount = 0;
let namedImportCount = 0;
let skippedSameFile = 0;
let skippedMultiOwner = 0;

for (const filePath of allFiles) {
  const modulePath = filePathToModulePath(filePath);
  if (!pathToVar.has(modulePath)) continue;

  const parsed = parseModuleFile(filePath);
  const { meta, imports, body } = parsed;

  if (imports.length === 0) continue;

  const upgradesForFile = new Map(); // importPath → Set<globalName>
  const exportableFromDeps = new Map(); // importPath → { depFilePath, depModPath, globals }

  for (const imp of imports) {
    if (!imp.importPath) continue;
    // Only process side-effect imports (no existing named imports)
    if (!imp.statement.match(/^import\s+['"][^'"]+['"]\s*;?\s*$/)) continue;

    // Resolve import path to module path
    // The import path is relative to the current file
    const currentDir = dirname(filePath);
    let resolvedPath;

    // Handle node_modules imports
    if (!imp.importPath.startsWith('.')) {
      // Package import - try to find in modules dir
      resolvedPath = join(MODULES_DIR, 'node_modules', imp.importPath);
    } else {
      resolvedPath = resolve(currentDir, imp.importPath);
    }

    // Try to find the actual file (could be .js or .ts)
    let depFilePath = resolvedPath;
    if (!existsSync(depFilePath)) {
      depFilePath = resolvedPath + '.js';
      if (!existsSync(depFilePath)) {
        depFilePath = resolvedPath + '.ts';
        if (!existsSync(depFilePath)) {
          depFilePath = resolvedPath.replace(/\.js$/, '.ts');
        }
      }
    }

    if (!existsSync(depFilePath)) continue;

    // Get dep's module path
    const depModPath = filePathToModulePath(depFilePath);

    // Get globals from dep
    const depGlobals = modulePathGlobals.get(depModPath);
    if (!depGlobals || depGlobals.size === 0) continue;

    // Check which dep globals are used in current module's body
    const usedGlobals = new Set();
    for (const g of depGlobals) {
      // Skip single-char names (too ambiguous, e.g. 'n', 'e', 't')
      if (g.length < 2) continue;

      // Skip globals with multiple owners (ambiguous)
      if (multiOwnerGlobals.has(g)) {
        skippedMultiOwner++;
        continue;
      }

      // Check if used in this module's body
      if (usesGlobal(body, g)) {
        usedGlobals.add(g);
      }
    }

    if (usedGlobals.size > 0) {
      upgradesForFile.set(imp.importPath, usedGlobals);
      exportableFromDeps.set(imp.importPath, {
        depFilePath,
        depModPath,
        globals: usedGlobals,
      });
    }
  }

  if (upgradesForFile.size > 0) {
    importUpgrades.set(filePath, { upgrades: upgradesForFile, deps: exportableFromDeps });

    // Track export additions needed
    for (const [, { depFilePath, globals }] of exportableFromDeps) {
      if (!exportAdditions.has(depFilePath)) {
        exportAdditions.set(depFilePath, new Set());
      }
      for (const g of globals) {
        exportAdditions.get(depFilePath).add(g);
      }
    }

    upgradeCount++;
    namedImportCount += [...upgradesForFile.values()].reduce((s, g) => s + g.size, 0);
  }
}

console.log(`[restore-named-imports] Phase 2 完成:`);
console.log(`  需要升级的模块: ${upgradeCount} 个`);
console.log(`  命名导入总数: ${namedImportCount} 个`);
console.log(`  需要添加 export 的模块: ${exportAdditions.size} 个`);
console.log(`  跳过多重定义者: ${skippedMultiOwner} 次`);

// Show some stats
if (verbose) {
  let shown = 0;
  for (const [filePath, { upgrades }] of importUpgrades) {
    if (shown++ > 20) break;
    const rel = relative(MODULES_DIR, filePath);
    console.log(`  ${rel}:`);
    for (const [impPath, globals] of upgrades) {
      console.log(`    import { ${[...globals].join(', ')} } from '${impPath}'`);
    }
  }
}

// ─── Phase 3: Apply changes ──────────────────────────────────────────────────
console.log('\n[restore-named-imports] Phase 3: 应用修改...');

let filesModified = 0;
let exportStatementsAdded = 0;
let importStatementsUpgraded = 0;
let syntaxErrors = 0;

/**
 * Add export statements to a module file.
 * Appends: export { var1, var2 }; at the end of the file.
 */
function addExportsToFile(filePath, globalsToExport) {
  const content = readFileSync(filePath, 'utf-8');
  const { lines } = parseModuleFile(filePath);

  // Don't add already-exported names
  const alreadyExported = new Set();
  const existingExportMatch = content.match(/^export\s*\{([^}]+)\}/m);
  if (existingExportMatch) {
    for (const name of existingExportMatch[1].split(',')) {
      alreadyExported.add(name.trim());
    }
  }

  const toAdd = [...globalsToExport].filter(
    (g) => !alreadyExported.has(g) && content.includes(g),
  );
  if (toAdd.length === 0) return content;

  const exportStatement = `\nexport { ${toAdd.join(', ')} };\n`;

  // Append after all existing export statements, or at end of file
  return content.trimEnd() + exportStatement;
}

/**
 * Upgrade side-effect imports to named imports in a module file.
 */
function upgradeImportsInFile(filePath, upgrades) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let count = 0;

  for (const [impPath, globalsSet] of upgrades) {
    const globals = [...globalsSet].sort();
    const namedClause = `{ ${globals.join(', ')} }`;

    // Try to find and replace the exact import statement
    // Patterns: import './path'; or import './path'
    const escapedPath = impPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      `^import\\s+['"]${escapedPath}['"]\\s*;?\\s*$`,
      'm',
    );

    if (pattern.test(content)) {
      content = content.replace(
        pattern,
        `import ${namedClause} from '${impPath}';`,
      );
      modified = true;
      count++;
    }
  }

  return { content, modified, count };
}

// Process export additions first
let exportFilesProcessed = 0;
for (const [filePath, globalsToExport] of exportAdditions) {
  if (globalsToExport.size === 0) continue;

  try {
    const newContent = addExportsToFile(filePath, globalsToExport);
    const originalContent = readFileSync(filePath, 'utf-8');

    if (newContent !== originalContent) {
      if (!dryRun) {
        writeFileSync(filePath, newContent, 'utf-8');
      }
      exportFilesProcessed++;
      exportStatementsAdded += globalsToExport.size;

      if (verbose) {
        const rel = relative(MODULES_DIR, filePath);
        console.log(`  [export] ${rel}: +${[...globalsToExport].join(', ')}`);
      }
    }
  } catch (e) {
    syntaxErrors++;
    console.warn(`  [WARN] export 修改失败: ${relative(MODULES_DIR, filePath)}: ${e.message}`);
  }
}

// Process import upgrades
for (const [filePath, { upgrades }] of importUpgrades) {
  try {
    const { content: newContent, modified, count } = upgradeImportsInFile(filePath, upgrades);

    if (modified) {
      if (!dryRun) {
        writeFileSync(filePath, newContent, 'utf-8');
      }
      filesModified++;
      importStatementsUpgraded += count;

      if (verbose) {
        const rel = relative(MODULES_DIR, filePath);
        console.log(`  [import] ${rel}: ${count} 个 import 升级`);
      }
    }
  } catch (e) {
    syntaxErrors++;
    console.warn(`  [WARN] import 修改失败: ${relative(MODULES_DIR, filePath)}: ${e.message}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n[restore-named-imports] ===== 完成 =====');
console.log(`  模式: ${dryRun ? 'DRY RUN (预览)' : 'APPLY (已写入)'}`);
console.log(`  Phase 1: ${phase1Count} 个模块有顶层全局变量`);
console.log(`  Phase 2: ${upgradeCount} 个模块需要升级 import`);
console.log(`  Phase 3:`);
console.log(`    - ${exportFilesProcessed} 个模块添加了 export 语句`);
console.log(`    - ${exportStatementsAdded} 个 export 条目`);
console.log(`    - ${filesModified} 个模块升级了 import 语句`);
console.log(`    - ${importStatementsUpgraded} 条 import 被升级为命名 import`);
console.log(`    - ${syntaxErrors} 个错误（已跳过）`);

if (dryRun) {
  console.log('\n[restore-named-imports] 这是预览模式。使用 --apply 执行实际修改。');
}

// Show sample of what would change
if (upgradeCount > 0) {
  console.log('\n[restore-named-imports] 修改示例 (前 10 个):');
  let shown = 0;
  for (const [filePath, { upgrades }] of importUpgrades) {
    if (shown++ >= 10) break;
    const rel = relative(MODULES_DIR, filePath);
    console.log(`\n  ${rel}:`);
    for (const [impPath, globals] of upgrades) {
      console.log(
        `    import '${impPath}'  →  import { ${[...globals].sort().join(', ')} } from '${impPath}'`,
      );
    }
  }
}
