/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/webSearch/webSearchQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Zzl(), Pd(), Ov(), Jg();

// --- WebSearchQueryHandler ---
// Handles the server-initiated web_search query (InteractionQuery).
// Manages auto-approve via user settings and pending decision approval.
const WebSearchQueryHandler = class { // FSf
  constructor(context) {
    this.context = context;
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  async handleWebSearchRequest(request) {
    const toolFormer = this.getToolFormer();
    const reactiveStorageService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(xu) // IReactiveStorageService
    );

    const searchTerm = request.args?.searchTerm ?? "";
    const toolCallId = request.args?.toolCallId;

    if (!toolCallId) {
      return new $Ct({ // WebSearchRequestResponse
        result: {
          case: "rejected",
          value: new yfi({ reason: "Missing toolCallId" }), // WebSearchRejected
        },
      });
    }

    const params = new $bt({ searchTerm }); // WebSearchParams
    const rawArgs = JSON.stringify({ searchTerm });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId,
      toolIndex: 0,
      modelCallId: toolCallId,
      toolCallType: on.WEB_SEARCH, // ToolType.WEB_SEARCH
      params: { case: "webSearchParams", value: params },
      rawArgs,
      name: "web_search",
    });

    toolFormer.setBubbleData(bubbleId, {
      tool: on.WEB_SEARCH,
      toolCallId,
      name: "web_search",
      rawArgs,
      params,
    });

    // Auto-approve: "run everything" mode or user has enabled autoAcceptWebSearchTool
    if (
      toolFormer.shouldAutoRun_runEverythingMode() ||
      reactiveStorageService.applicationUserPersistentStorage
        ?.composerState?.autoAcceptWebSearchTool === true
    ) {
      toolFormer.acceptToolCall(toolCallId);
      return new $Ct({
        result: { case: "approved", value: new Afi }, // WebSearchApproved
      });
    }

    // Needs user approval — track trajectory stopped
    this.context.trackTrajectoryStopped?.({
      composerId: this.context.composerDataHandle.data.composerId,
      invocationID: this.context.generationUUID,
      toolCallId,
      stop_category: "needs_user_approval",
      stop_source: "other",
      reason_code: "web_search.needs_approval",
    });

    // Wait for user decision
    return new Promise(resolve => {
      const disposer = toolFormer.addPendingDecision(
        bubbleId,
        on.WEB_SEARCH,
        toolCallId,
        (accepted) => {
          disposer();
          resolve(new $Ct({
            result: accepted
              ? { case: "approved", value: new Afi }
              : { case: "rejected", value: new yfi({ reason: "User chose to skip" }) },
          }));
        },
        true // requiresApproval
      );
    });
  }
};

// --- Symbol Map ---
// FSf  -> WebSearchQueryHandler
// $Ct  -> WebSearchRequestResponse
// $bt  -> WebSearchParams
// Afi  -> WebSearchApproved
// yfi  -> WebSearchRejected
// xu   -> IReactiveStorageService
// on.WEB_SEARCH -> ToolType.WEB_SEARCH
// ko.TOOL_FORMER -> CapabilityType.TOOL_FORMER
