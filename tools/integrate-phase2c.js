/**
 * Integrate Phase 2C files into Code OSS fork.
 * Converts flat filenames like vs_editor_contrib_xxx.js back to directory paths.
 */

const fs = require('fs');
const path = require('path');

const STAGING_DIR = path.join(__dirname, '..', 'staging', 'phase-2c-inline-edit');
const TARGET_BASE = path.join(__dirname, '..', 'src', 'vscode', 'src');

const subdirs = ['inline-chat', 'inline-diff', 'tab-completion'];

let copied = 0;
let skipped = 0;
const created_dirs = new Set();

for (const subdir of subdirs) {
  const srcDir = path.join(STAGING_DIR, subdir);
  if (!fs.existsSync(srcDir)) {
    console.log(`  Skipping ${subdir} (not found)`);
    continue;
  }

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);

    // CSS files go to a media/ directory alongside their module
    if (file.endsWith('.css')) {
      // Determine where to put CSS based on subdirectory
      let cssTarget;
      if (subdir === 'inline-chat') {
        cssTarget = path.join(TARGET_BASE, 'vs', 'workbench', 'contrib', 'inlineChat', 'browser', 'media', file);
      } else if (subdir === 'inline-diff') {
        cssTarget = path.join(TARGET_BASE, 'vs', 'editor', 'contrib', 'inlineDiffs', 'browser', 'media', file);
      } else if (subdir === 'tab-completion') {
        cssTarget = path.join(TARGET_BASE, 'vs', 'editor', 'contrib', 'inlineCompletions', 'browser', 'media', file);
      }
      if (cssTarget) {
        const dir = path.dirname(cssTarget);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          created_dirs.add(dir);
        }
        fs.copyFileSync(srcPath, cssTarget);
        copied++;
        console.log(`  CSS: ${file} → ${path.relative(TARGET_BASE, cssTarget)}`);
      }
      continue;
    }

    // JS files: convert filename to path
    // vs_editor_contrib_xxx_browser_yyy.js → vs/editor/contrib/xxx/browser/yyy.js
    if (!file.startsWith('vs_')) {
      skipped++;
      continue;
    }

    const parts = file.replace('.js', '').split('_');
    const filePath = parts.join('/') + '.js';
    const targetPath = path.join(TARGET_BASE, filePath);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      created_dirs.add(targetDir);
    }

    fs.copyFileSync(srcPath, targetPath);
    copied++;
    console.log(`  ${file} → ${filePath}`);
  }
}

console.log(`\nDone: ${copied} files copied, ${skipped} skipped`);
console.log(`Created ${created_dirs.size} new directories`);
