const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const code = fs.readFileSync(BUNDLE_PATH, 'utf8');

console.log('Bundle size:', (code.length / 1024 / 1024).toFixed(1), 'MB');

// Find ALL module paths using the Ae({"out-build/..." pattern
const moduleRegex = /"out-build\/vs\/workbench\/[^"]+\.js"/g;
let match;
const allModules = [];
while ((match = moduleRegex.exec(code)) != null) {
  allModules.push({
    path: match[0].replace(/"/g, ''),
    offset: match.index
  });
}

console.log('\nTotal VS Code workbench modules in bundle:', allModules.length);

// Filter composer-related modules
const composerModules = allModules.filter(m => m.path.includes('/composer/'));
console.log('\nComposer modules (' + composerModules.length + '):');
composerModules.forEach(m => {
  console.log('  ' + m.path + '  [offset: ' + m.offset + ']');
});

// Filter AI-related modules
const aiModules = allModules.filter(m => m.path.includes('/ai/') || m.path.includes('/agent'));
console.log('\nAI/Agent modules (' + aiModules.length + '):');
aiModules.forEach(m => {
  console.log('  ' + m.path + '  [offset: ' + m.offset + ']');
});

// Filter service modules that are Cursor-specific
const serviceModules = allModules.filter(m => m.path.includes('/services/'));
const cursorServices = serviceModules.filter(m =>
  m.path.includes('cursor') || m.path.includes('ai/') ||
  m.path.includes('agent') || m.path.includes('composer') ||
  m.path.includes('mcp') || m.path.includes('prediction') ||
  m.path.includes('cpp') || m.path.includes('inline')
);
console.log('\nCursor-specific service modules (' + cursorServices.length + '):');
cursorServices.forEach(m => {
  console.log('  ' + m.path + '  [offset: ' + m.offset + ']');
});

// Other Cursor contrib modules
const contribModules = allModules.filter(m =>
  m.path.includes('/contrib/') && !m.path.includes('/composer/')
);
const cursorContrib = contribModules.filter(m =>
  m.path.includes('onboarding') || m.path.includes('inline') ||
  m.path.includes('diff') || m.path.includes('cpp') ||
  m.path.includes('cursor') || m.path.includes('agent')
);
console.log('\nOther Cursor contrib modules (' + cursorContrib.length + '):');
cursorContrib.forEach(m => {
  console.log('  ' + m.path + '  [offset: ' + m.offset + ']');
});

// Summary
console.log('\n=== SUMMARY ===');
console.log('Total workbench modules:', allModules.length);
console.log('Composer modules:', composerModules.length);
console.log('AI/Agent modules:', aiModules.length);
console.log('Cursor services:', cursorServices.length);
console.log('Cursor contrib:', cursorContrib.length);
