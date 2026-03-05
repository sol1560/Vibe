#!/usr/bin/env node
/**
 * Extract AI/Agent service modules from Cursor's bundle.
 * Re-extracts all modules that came out empty or too small.
 * Outputs to staging/phase-2d-services/extracted/
 */
const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = path.join(__dirname, '..', 'extracted', 'cursor-app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
const OUTPUT_DIR = path.join(__dirname, '..', 'staging', 'phase-2d-services', 'extracted');

// Priority modules to extract
const PRIORITY_MODULES = [
  // Core AI Services
  'vs/workbench/services/ai/browser/aiService.js',
  'vs/workbench/services/ai/browser/aiClientService.js',
  'vs/workbench/services/ai/browser/backendClient.js',
  'vs/workbench/services/ai/browser/aiMiscServices.js',
  'vs/workbench/services/ai/browser/aiFileInfoServiceTypes.js',
  // MCP Services
  'vs/workbench/services/ai/browser/mcpService.js',
  'vs/workbench/services/ai/browser/mcpServiceTypes.js',
  'vs/workbench/services/ai/browser/mcpProviderService.js',
  'vs/workbench/services/ai/browser/mcpSchema.js',
  'vs/workbench/services/ai/browser/mcpLog.js',
  'vs/workbench/services/ai/browser/mcpEnvExpansion.js',
  'vs/workbench/services/ai/browser/mcpSnapshotMapping.js',
  'vs/workbench/services/ai/browser/mcpInstallationService.js',
  'vs/workbench/services/ai/browser/mcpWellKnownDetection.js',
  'vs/workbench/services/ai/browser/common/mcpConstants.js',
  'vs/workbench/services/ai/common/mcpUtils.js',
  // Agent Services
  'vs/workbench/services/agent/browser/agentProviderService.js',
  'vs/workbench/services/agent/browser/agentResponseAdapter.js',
  'vs/workbench/services/agent/browser/agentTranslationUtils.js',
  'vs/workbench/services/agent/browser/agentPrewarmService.js',
  'vs/workbench/services/agent/browser/subagentComposerService.js',
  'vs/workbench/services/agent/browser/backgroundWorkRegistry.js',
  'vs/workbench/services/agent/browser/cloudAgentStorageService.js',
  'vs/workbench/services/agent/browser/contextSetup.js',
  'vs/workbench/services/agent/browser/conversationActionManager.js',
  'vs/workbench/services/agent/browser/populateConversationFromState.js',
  'vs/workbench/services/agent/browser/transcriptPaths.js',
  // Other AI helpers
  'vs/workbench/services/ai/browser/subagentsService.js',
  'vs/workbench/services/ai/browser/connectRequestService.js',
  'vs/workbench/services/ai/browser/cursorCredsService.js',
  'vs/workbench/services/ai/browser/repositoryService.js',
  'vs/workbench/services/ai/browser/diffingService.js',
  'vs/workbench/services/ai/browser/utils.js',
  'vs/workbench/services/ai/common/retrievalUtils.js',
  // Tool call handlers (all)
  'vs/workbench/services/agent/browser/toolCallHandlers/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/shell/shellToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/shell/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/edit/editToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/edit/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/task/taskToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/task/nestedTaskUtils.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/task/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/todo/todoToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/todo/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/createPlan/createPlanToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/createPlan/createPlanQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/createPlan/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/askQuestionToolCallHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/askQuestionQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/questionnaireUtils.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/webSearch/webSearchQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/webSearch/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/webFetch/webFetchQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/webFetch/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/switchMode/switchModeQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/switchMode/index.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/mcpAuth/mcpAuthQueryHandler.js',
  'vs/workbench/services/agent/browser/toolCallHandlers/mcpAuth/index.js',
];

function loadBundle() {
  console.log('Loading bundle...');
  const code = fs.readFileSync(BUNDLE_PATH, 'utf8');
  console.log(`Bundle loaded: ${(code.length / 1024 / 1024).toFixed(1)} MB`);
  return code;
}

/**
 * Find all module definitions and their offsets.
 */
function findAllModules(code) {
  const moduleRegex = /"out-build\/(vs\/workbench\/[^"]+\.js)"/g;
  let match;
  const modules = new Map();
  while ((match = moduleRegex.exec(code)) !== null) {
    modules.set(match[1], match.index);
  }
  return modules;
}

/**
 * Extract a module's code given its offset.
 * Module pattern: Ae({"out-build/path.js"(){ "use strict"; <code> }})
 * or sometimes: Ae({"out-build/path.js"(){<code>}})
 */
function extractModuleCode(code, moduleOffset, allOffsets) {
  // Find the start of the function body
  let searchFrom = moduleOffset;
  let funcBodyStart = -1;

  // Look for the opening brace of the module function
  // Pattern: "out-build/path.js"(){ or "out-build/path.js"() {
  for (let i = searchFrom; i < Math.min(searchFrom + 500, code.length); i++) {
    if (code[i] === '{') {
      funcBodyStart = i + 1;
      break;
    }
  }

  if (funcBodyStart === -1) return null;

  // Skip "use strict"; if present
  const strictMatch = code.substring(funcBodyStart, funcBodyStart + 30).match(/^\s*"use strict";\s*/);
  if (strictMatch) {
    funcBodyStart += strictMatch[0].length;
  }

  // Find the matching closing brace by tracking brace depth
  let depth = 1;
  let i = funcBodyStart;

  // Use a reasonable limit - next module or 2MB, whichever is smaller
  const sortedOffsets = Array.from(allOffsets).sort((a, b) => a - b);
  const currentIdx = sortedOffsets.indexOf(moduleOffset);
  const nextOffset = currentIdx >= 0 && currentIdx < sortedOffsets.length - 1
    ? sortedOffsets[currentIdx + 1]
    : moduleOffset + 2 * 1024 * 1024;

  const limit = Math.min(nextOffset, moduleOffset + 2 * 1024 * 1024);

  let inString = false;
  let stringChar = '';

  while (i < limit && depth > 0) {
    const ch = code[i];

    if (inString) {
      if (ch === '\\') {
        i++; // skip escaped char
      } else if (ch === stringChar) {
        inString = false;
      }
    } else {
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = true;
        stringChar = ch;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
      }
    }
    i++;
  }

  if (depth !== 0) {
    console.warn(`  Warning: Could not find matching brace (depth=${depth})`);
    return null;
  }

  // i is now past the closing brace
  const moduleCode = code.substring(funcBodyStart, i - 1);
  return moduleCode;
}

function main() {
  const code = loadBundle();
  const moduleMap = findAllModules(code);
  const allOffsets = Array.from(moduleMap.values());

  console.log(`Found ${moduleMap.size} total modules`);
  console.log(`Extracting ${PRIORITY_MODULES.length} priority AI/Agent modules...\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let extracted = 0;
  let failed = 0;
  let empty = 0;

  for (const modulePath of PRIORITY_MODULES) {
    const offset = moduleMap.get(modulePath);
    if (offset === undefined) {
      console.log(`  SKIP: ${modulePath} (not found in bundle)`);
      failed++;
      continue;
    }

    const moduleCode = extractModuleCode(code, offset, allOffsets);
    if (!moduleCode || moduleCode.trim().length === 0) {
      console.log(`  EMPTY: ${modulePath}`);
      empty++;
      continue;
    }

    // Write to output file
    const outPath = path.join(OUTPUT_DIR, modulePath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, moduleCode);

    const lines = moduleCode.split('\n').length;
    const sizeKB = (moduleCode.length / 1024).toFixed(1);
    console.log(`  OK: ${modulePath} (${lines} lines, ${sizeKB} KB)`);
    extracted++;
  }

  console.log(`\nDone: ${extracted} extracted, ${empty} empty, ${failed} not found`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main();
