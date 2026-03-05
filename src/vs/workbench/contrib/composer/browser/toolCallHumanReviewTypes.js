// Source: out-build/vs/workbench/contrib/composer/browser/toolCallHumanReviewTypes.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file defines the human review flow for tool calls (terminal, edit, MCP, etc.)

// === Review Status ===
var ReviewStatus;
(function (status) {
  status.NONE = "None";
  status.REQUESTED = "Requested";
  status.DONE = "Done";
})(ReviewStatus || (ReviewStatus = {}));

// === Review Type (what kind of tool needs review) ===
var ReviewType;
(function (type) {
  type.EDIT = "edit";
  type.TERMINAL = "terminal";
  type.MCP = "mcp";
  type.PLAN = "plan";
  type.WEB_FETCH = "web_fetch";
})(ReviewType || (ReviewType = {}));

// === Approval Type (how the action was approved) ===
var ApprovalType;
(function (approval) {
  approval.USER = "user";
  approval.ALLOWLIST = "allowlist";
  approval.FULL_AUTO = "full_auto";
  approval.NONE = "none";
})(ApprovalType || (ApprovalType = {}));

// === Terminal Review Options ===
var TerminalReviewOption;
(function (option) {
  option.RUN = "run";
  option.SKIP = "skip";
  option.ALLOWLIST_COMMANDS = "allowlistCommands";
  option.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
})(TerminalReviewOption || (TerminalReviewOption = {}));

// === MCP Review Options ===
var McpReviewOption;
(function (option) {
  option.RUN = "run";
  option.SKIP = "skip";
  option.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  option.ALLOWLIST_TOOL = "allowlistTool";
})(McpReviewOption || (McpReviewOption = {}));

// === Edit Review Options ===
var EditReviewOption;
(function (option) {
  option.ACCEPT = "accept";
  option.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  option.SKIP = "skip";
  option.SWITCH_TO_DEFAULT_AGENT_MODE = "switchToDefaultAgentMode";
  option.ACCEPT_AND_ALLOW_FOLDER = "acceptAndAllowFolder";
})(EditReviewOption || (EditReviewOption = {}));

// === Plan Review Options ===
var PlanReviewOption;
(function (option) {
  option.NONE = "none";
  option.APPROVE = "approve";
  option.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  option.EDIT = "edit";
})(PlanReviewOption || (PlanReviewOption = {}));

// === Edit Approval Type ===
var EditApprovalType;
(function (approval) {
  approval.USER = "user";
  approval.ALLOWLIST = "allowlist";
  approval.FULL_AUTO = "full_auto";
  approval.NONE = "none";
})(EditApprovalType || (EditApprovalType = {}));

// === Web Fetch Review Options ===
var WebFetchReviewOption;
(function (option) {
  option.RUN = "run";
  option.SKIP = "skip";
  option.ALLOWLIST_DOMAIN = "allowlistDomain";
})(WebFetchReviewOption || (WebFetchReviewOption = {}));

// === Tool call data helper: identity passthrough ===
function createToolCallData(data) {
  return data;
}

// === Code block compression helpers ===
// Strip full contents from code blocks, keeping only detailed lines (for storage efficiency)
function compressCodeBlock(codeBlock) {
  return codeBlock && codeBlock.detailedLines.length > 0
    ? new WB({ ...codeBlock, contents: "" })
    : codeBlock;
}

// Restore full contents from detailed lines if contents was stripped
function decompressCodeBlock(codeBlock) {
  return codeBlock && !codeBlock.contents && codeBlock.detailedLines.length > 0
    ? new WB({
        ...codeBlock,
        contents: codeBlock.detailedLines.map((line) => line.text).join("\n"),
      })
    : codeBlock;
}

// Compress code results (strip full contents)
function compressCodeResults(results) {
  return results.map(
    (result) => new WR({ ...result, codeBlock: compressCodeBlock(result.codeBlock) })
  );
}

// Decompress code results (restore full contents)
function decompressCodeResults(results) {
  return results.map(
    (result) => new WR({ ...result, codeBlock: decompressCodeBlock(result.codeBlock) })
  );
}

/**
 * parseToolFormerData
 *
 * Deserializes a toolFormerData blob from storage into typed protobuf objects.
 * Handles all 40+ tool types defined in the agent protocol.
 * This is a massive switch statement covering every tool the agent can use.
 */
function parseToolFormerData(data) {
  const tool = data.tool;
  const { params, result } = (() => {
    switch (tool) {
      case on.RUN_TERMINAL_COMMAND_V2:
        return {
          params: data.params ? GKe.fromJsonString(data.params) : undefined,
          result: data.result ? ahe.fromJsonString(data.result) : undefined,
        };
      case on.READ_SEMSEARCH_FILES: {
        const parsedResult = data.result
          ? E5t.fromJsonString(data.result)
          : undefined;
        if (parsedResult) {
          parsedResult.codeResults = decompressCodeResults(parsedResult.codeResults);
        }
        return {
          params: data.params ? S5t.fromJsonString(data.params) : undefined,
          result: parsedResult,
        };
      }
      case on.FILE_SEARCH:
        return {
          params: data.params ? l9n.fromJsonString(data.params) : undefined,
          result: data.result ? V9o.fromJsonString(data.result) : undefined,
        };
      case on.EDIT_FILE:
        return {
          params: data.params ? b5t.fromJsonString(data.params) : undefined,
          result: data.result ? a9n.fromJsonString(data.result) : undefined,
        };
      case on.EDIT_FILE_V2:
        return {
          params: data.params ? ohe.fromJsonString(data.params) : undefined,
          result: data.result ? MRe.fromJsonString(data.result) : undefined,
        };
      // ... (40+ more tool types follow the same pattern)
      // Full list includes: LIST_DIR, READ_FILE, RIPGREP_SEARCH, DELETE_FILE, REAPPLY,
      // FETCH_RULES, WEB_SEARCH, WEB_FETCH, MCP, SEARCH_SYMBOLS, BACKGROUND_COMPOSER_FOLLOWUP,
      // KNOWLEDGE_BASE, FETCH_PULL_REQUEST, DEEP_SEARCH, FIX_LINTS, READ_LINTS,
      // CREATE_DIAGRAM, GO_TO_DEFINITION, TASK, TODO_READ, TODO_WRITE, LIST_DIR_V2,
      // READ_FILE_V2, GLOB_FILE_SEARCH, LIST_MCP_RESOURCES, READ_MCP_RESOURCE,
      // CREATE_PLAN, READ_PROJECT, UPDATE_PROJECT, TASK_V2, CALL_MCP_TOOL,
      // APPLY_AGENT_DIFF, ASK_QUESTION, SWITCH_MODE, GENERATE_IMAGE, COMPUTER_USE,
      // WRITE_SHELL_STDIN, RECORD_SCREEN, REPORT_BUGFIX_RESULTS, AI_ATTRIBUTION,
      // MCP_AUTH, AWAIT, REFLECT
      default:
        throw new Error(`Parsing unknown tool: ${tool}`);
    }
  })();

  // Deserialize binary toolCall if present
  let toolCall;
  if (data.toolCallBinary) {
    try {
      const bytes = Uint8Array.from(atob(data.toolCallBinary), (c) =>
        c.charCodeAt(0)
      );
      toolCall = sN.fromBinary(bytes);
    } catch (err) {
      console.warn("Failed to deserialize toolCall from binary:", err);
    }
  }

  const { toolCallBinary: _binary, ...rest } = data;
  const parsed = {
    ...rest,
    params: params,
    result: result,
    error: data.error ? rke.fromJsonString(data.error) : undefined,
    toolCall: toolCall,
  };

  // Special handling for TASK_V2: deserialize nested composer data
  if (tool === on.TASK_V2 && parsed.additionalData) {
    const additionalData = parsed.additionalData;
    if (additionalData.composerData && typeof additionalData.composerData === "string") {
      const rawData = JSON.parse(additionalData.composerData);
      const deserialized = lNg(additionalData.composerData);
      if (rawData.conversationMap) {
        const conversationMap = {};
        for (const [bubbleId, msgJson] of Object.entries(rawData.conversationMap)) {
          const msg = JSON.parse(msgJson);
          conversationMap[bubbleId] = cpa(msg);
        }
        deserialized.conversationMap = conversationMap;
      }
      parsed.additionalData.composerData = deserialized;
    }
  }

  return parsed;
}

// NOTE: The remaining ~400 lines of this module contain:
// - RLg(): normalizeToolFormerData — resets "loading" status to "cancelled", processes for display
// - PLg(): prepareToolFormerForStorage — strips large fields, compresses code blocks
// - Tool-specific serialization/deserialization for each of the 40+ tools
// These follow the same pattern: switch on tool type, serialize/deserialize protobuf params & results
// The full code is in extracted/cursor-modules/vs/workbench/contrib/composer/browser/toolCallHumanReviewTypes.js
