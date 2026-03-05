/**
 * Format extracted Cursor modules using prettier.
 * Wraps code fragments so prettier can parse them, then unwraps.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = process.argv[2];
if (!targetDir) {
  console.log('Usage: node format-extracted.js <directory>');
  process.exit(1);
}

function formatFile(filePath) {
  try {
    let code = fs.readFileSync(filePath, 'utf8');

    // Wrap the code fragment in a function body to make it valid JS
    const wrapped = '(function() {\n' + code + '\n})();';

    // Write temp file
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, wrapped);

    // Format with prettier
    try {
      execSync(`npx prettier --parser babel --print-width 100 --single-quote --tab-width 2 --write "${tempPath}" 2>/dev/null`, {
        timeout: 30000
      });
    } catch (e) {
      // Prettier may fail on some fragments - that's OK
      fs.unlinkSync(tempPath);
      return false;
    }

    // Read formatted code and unwrap
    let formatted = fs.readFileSync(tempPath, 'utf8');

    // Remove the wrapper
    if (formatted.startsWith('(function () {\n') || formatted.startsWith('(function() {\n')) {
      const lines = formatted.split('\n');
      // Remove first line (function wrapper) and last line })();
      const inner = lines.slice(1, -2);
      // Remove one level of indentation
      formatted = inner.map(line => {
        if (line.startsWith('  ')) return line.substring(2);
        return line;
      }).join('\n');
    }

    // Write formatted code back
    fs.writeFileSync(filePath, formatted);
    fs.unlinkSync(tempPath);
    return true;
  } catch (e) {
    return false;
  }
}

// Find all JS files
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

const files = findJSFiles(targetDir);
console.log('Found', files.length, 'JS files in', targetDir);

let formatted = 0;
let failed = 0;

for (const file of files) {
  const relPath = path.relative(targetDir, file);
  if (formatFile(file)) {
    formatted++;
    process.stdout.write('.');
  } else {
    failed++;
    process.stdout.write('x');
  }
}

console.log('\n\nFormatted:', formatted);
console.log('Failed:', failed);
