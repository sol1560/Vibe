#!/usr/bin/env node
/**
 * Find all AI/Agent service module paths in the Cursor bundle.
 */
const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const code = fs.readFileSync(BUNDLE_PATH, 'utf8');

const moduleRegex = /"out-build\/(vs\/workbench\/[^"]+\.js)"/g;
let match;
const aiModules = [];
while ((match = moduleRegex.exec(code)) !== null) {
  const p = match[1];
  if (p.includes('services/ai/') || p.includes('services/agent/') || p.includes('contrib/agents/')) {
    aiModules.push({ path: p, offset: match.index });
  }
}
aiModules.sort((a, b) => a.path.localeCompare(b.path));
for (const m of aiModules) {
  console.log(`${m.path}  (offset: ${m.offset})`);
}
console.log(`\nTotal: ${aiModules.length} modules`);
