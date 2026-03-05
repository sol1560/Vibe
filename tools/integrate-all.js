#!/usr/bin/env node
/**
 * Integrate all staging code into the Code OSS fork.
 *
 * Copies files from staging/ into src/vscode/src/vs/workbench/
 * maintaining the directory structure.
 *
 * Handles:
 * - phase-2a-composer: contrib/composer/ + services/composer/
 * - phase-2b-layout: contrib/* (agents, aiCpp, appLayout, etc.)
 * - phase-2d-services: services/ai/ + services/agent/ + contrib/agents/
 * - phase-2e-theme: theme files
 * - phase-3-cowork: extensions/claude-cowork-editors/
 * - cowork-core: contrib/cowork/
 * - extensions: extensions/*
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STAGING = path.join(ROOT, 'staging');
const FORK_WB = path.join(ROOT, 'src/vscode/src/vs/workbench');
const FORK_EXT = path.join(ROOT, 'src/vscode/extensions');

let totalCopied = 0;
let totalSkipped = 0;
const results = {};

/**
 * Recursively copy files from src to dest, creating directories as needed.
 * Returns count of files copied.
 */
function copyRecursive(srcDir, destDir, label) {
	if (!fs.existsSync(srcDir)) return 0;

	let count = 0;
	const entries = fs.readdirSync(srcDir, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);

		if (entry.isDirectory()) {
			count += copyRecursive(srcPath, destPath, label);
		} else if (entry.isFile()) {
			// Skip non-code files that are analysis/docs
			if (entry.name === 'ANALYSIS.md' || entry.name === 'README.md') continue;
			// Skip shell scripts
			if (entry.name.endsWith('.sh')) continue;

			// Create dest directory
			fs.mkdirSync(path.dirname(destPath), { recursive: true });

			// Only copy if dest doesn't exist or src is newer
			if (fs.existsSync(destPath)) {
				totalSkipped++;
				continue;
			}

			fs.copyFileSync(srcPath, destPath);
			count++;
		}
	}

	return count;
}

// ============================================================================
// Phase 2A: Composer (190 JS files)
// staging/phase-2a-composer/contrib/ → workbench/contrib/
// staging/phase-2a-composer/services/ → workbench/services/
// ============================================================================
console.log('\n=== Phase 2A: Composer ===');

const p2a = path.join(STAGING, 'phase-2a-composer');
let p2aCount = 0;

// contrib/composer/ → workbench/contrib/composer/
if (fs.existsSync(path.join(p2a, 'contrib'))) {
	p2aCount += copyRecursive(
		path.join(p2a, 'contrib'),
		path.join(FORK_WB, 'contrib'),
		'phase-2a-contrib'
	);
}

// services/composer/ → workbench/services/composer/
if (fs.existsSync(path.join(p2a, 'services'))) {
	p2aCount += copyRecursive(
		path.join(p2a, 'services'),
		path.join(FORK_WB, 'services'),
		'phase-2a-services'
	);
}

results['phase-2a-composer'] = p2aCount;
totalCopied += p2aCount;
console.log(`  Copied ${p2aCount} files`);

// ============================================================================
// Phase 2B: Layout (46 JS files)
// staging/phase-2b-layout/contrib/ → workbench/contrib/
// ============================================================================
console.log('\n=== Phase 2B: Layout ===');

const p2b = path.join(STAGING, 'phase-2b-layout');
let p2bCount = 0;

if (fs.existsSync(path.join(p2b, 'contrib'))) {
	p2bCount += copyRecursive(
		path.join(p2b, 'contrib'),
		path.join(FORK_WB, 'contrib'),
		'phase-2b-layout'
	);
}

results['phase-2b-layout'] = p2bCount;
totalCopied += p2bCount;
console.log(`  Copied ${p2bCount} files`);

// ============================================================================
// Phase 2D: Services (145 files)
// Has multiple sub-structures:
// - agent/contrib/ → workbench/contrib/
// - agent/services/ → workbench/services/
// - ai/services/ → workbench/services/
// - extracted/vs/workbench/services/ → workbench/services/
// - ai-service/ → workbench/services/ai/ (TS files)
// - agent-protocol/ → workbench/services/agent/common/ (TS files)
// - agent-extension/ → workbench/services/agent/node/ (TS files)
// - background-agent/ → workbench/contrib/aiBackgroundComposer/ (TS/JS files)
// ============================================================================
console.log('\n=== Phase 2D: Services ===');

const p2d = path.join(STAGING, 'phase-2d-services');
let p2dCount = 0;

// agent/contrib/ → workbench/contrib/
if (fs.existsSync(path.join(p2d, 'agent', 'contrib'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'agent', 'contrib'),
		path.join(FORK_WB, 'contrib'),
		'phase-2d-agent-contrib'
	);
}

// agent/services/ → workbench/services/
if (fs.existsSync(path.join(p2d, 'agent', 'services'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'agent', 'services'),
		path.join(FORK_WB, 'services'),
		'phase-2d-agent-services'
	);
}

// ai/services/ → workbench/services/
if (fs.existsSync(path.join(p2d, 'ai', 'services'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'ai', 'services'),
		path.join(FORK_WB, 'services'),
		'phase-2d-ai-services'
	);
}

// extracted/vs/workbench/services/ → workbench/services/
if (fs.existsSync(path.join(p2d, 'extracted', 'vs', 'workbench', 'services'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'extracted', 'vs', 'workbench', 'services'),
		path.join(FORK_WB, 'services'),
		'phase-2d-extracted-services'
	);
}

// ai-service/ → workbench/services/ai/common/
if (fs.existsSync(path.join(p2d, 'ai-service'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'ai-service'),
		path.join(FORK_WB, 'services', 'ai', 'common'),
		'phase-2d-ai-service'
	);
}

// agent-protocol/ → workbench/services/agent/common/
if (fs.existsSync(path.join(p2d, 'agent-protocol'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'agent-protocol'),
		path.join(FORK_WB, 'services', 'agent', 'common'),
		'phase-2d-agent-protocol'
	);
}

// agent-extension/ → workbench/services/agent/node/
if (fs.existsSync(path.join(p2d, 'agent-extension'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'agent-extension'),
		path.join(FORK_WB, 'services', 'agent', 'node'),
		'phase-2d-agent-extension'
	);
}

// background-agent/ → workbench/contrib/aiBackgroundComposer/browser/
if (fs.existsSync(path.join(p2d, 'background-agent'))) {
	p2dCount += copyRecursive(
		path.join(p2d, 'background-agent'),
		path.join(FORK_WB, 'contrib', 'aiBackgroundComposer', 'browser'),
		'phase-2d-background-agent'
	);
}

results['phase-2d-services'] = p2dCount;
totalCopied += p2dCount;
console.log(`  Copied ${p2dCount} files`);

// ============================================================================
// Phase 2E: Theme (9 files)
// → src/vscode/src/vs/workbench/contrib/claude/browser/theme/
// ============================================================================
console.log('\n=== Phase 2E: Theme ===');

const p2e = path.join(STAGING, 'phase-2e-theme');
let p2eCount = 0;

if (fs.existsSync(p2e)) {
	p2eCount += copyRecursive(
		p2e,
		path.join(FORK_WB, 'contrib', 'claude', 'browser', 'theme'),
		'phase-2e-theme'
	);
}

results['phase-2e-theme'] = p2eCount;
totalCopied += p2eCount;
console.log(`  Copied ${p2eCount} files`);

// ============================================================================
// Phase 3: Cowork Editors Extension (19 TS files)
// → extensions/claude-cowork-editors/
// ============================================================================
console.log('\n=== Phase 3: Cowork Editors ===');

const p3 = path.join(STAGING, 'phase-3-cowork', 'claude-cowork-editors');
let p3Count = 0;

if (fs.existsSync(p3)) {
	p3Count += copyRecursive(
		p3,
		path.join(FORK_EXT, 'claude-cowork-editors'),
		'phase-3-cowork'
	);
}

results['phase-3-cowork'] = p3Count;
totalCopied += p3Count;
console.log(`  Copied ${p3Count} files`);

// ============================================================================
// Cowork Core (5 TS files)
// → workbench/contrib/cowork/ (need to map properly)
// ============================================================================
console.log('\n=== Cowork Core ===');

const cwCore = path.join(STAGING, 'cowork-core');
let cwCount = 0;

if (fs.existsSync(cwCore)) {
	// These are contribution files — put in browser/ subdirectory
	cwCount += copyRecursive(
		cwCore,
		path.join(FORK_WB, 'contrib', 'cowork', 'browser'),
		'cowork-core'
	);
}

results['cowork-core'] = cwCount;
totalCopied += cwCount;
console.log(`  Copied ${cwCount} files`);

// ============================================================================
// Extensions (21 files)
// → extensions/
// ============================================================================
console.log('\n=== Extensions ===');

const extStaging = path.join(STAGING, 'extensions');
let extCount = 0;

if (fs.existsSync(extStaging)) {
	extCount += copyRecursive(
		extStaging,
		FORK_EXT,
		'extensions'
	);
}

results['extensions'] = extCount;
totalCopied += extCount;
console.log(`  Copied ${extCount} files`);

// ============================================================================
// Summary
// ============================================================================
console.log('\n========================================');
console.log(`Total files copied: ${totalCopied}`);
console.log(`Total files skipped (already exist): ${totalSkipped}`);
console.log('Per-phase breakdown:');
for (const [phase, count] of Object.entries(results)) {
	console.log(`  ${phase}: ${count} files`);
}
console.log('========================================\n');
