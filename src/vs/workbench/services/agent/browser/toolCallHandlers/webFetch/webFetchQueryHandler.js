/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/webFetch/webFetchQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
vVl(), Pd(), bhn(), Ov(), Jg();

// --- WebFetchQueryHandler ---
// Handles the server-initiated web_fetch query (InteractionQuery).
// Manages auto-approve via domain allowlist with wildcard support.
const WebFetchQueryHandler = class { // OSf
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

  async handleWebFetchRequest(request) {
    const toolFormer = this.getToolFormer();
    const reactiveStorageService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(xu) // IReactiveStorageService
    );

    const url = request.args?.url ?? "";
    const toolCallId = request.args?.toolCallId;

    if (!toolCallId) {
      return new gtt({ // WebFetchRequestResponse
        result: {
          case: "rejected",
          value: new Cfi({ reason: "Missing toolCallId" }), // WebFetchRejected
        },
      });
    }

    const params = new KKe({ url }); // WebFetchParams
    const rawArgs = JSON.stringify({ url });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId,
      toolIndex: 0,
      modelCallId: toolCallId,
      toolCallType: on.WEB_FETCH, // ToolType.WEB_FETCH
      params: { case: "webFetchParams", value: params },
      rawArgs,
      name: "web_fetch",
    });

    toolFormer.setBubbleData(bubbleId, {
      tool: on.WEB_FETCH,
      toolCallId,
      name: "web_fetch",
      rawArgs,
      params,
    });

    // Skip approval if explicitly flagged
    if (request.skipApproval) {
      toolFormer.acceptToolCall(toolCallId);
      return new gtt({
        result: { case: "approved", value: new Gdn }, // WebFetchApproved
      });
    }

    // Auto-approve via domain allowlist or "run everything" mode
    if (this.shouldAutoApproveWebFetch(url, reactiveStorageService, toolFormer)) {
      toolFormer.acceptToolCall(toolCallId);
      return new gtt({
        result: { case: "approved", value: new Gdn },
      });
    }

    // Needs user approval — set review data on bubble
    toolFormer.setBubbleData(bubbleId, {
      additionalData: {
        reviewData: {
          status: BA.REQUESTED, // ReviewStatus.REQUESTED
          selectedOption: rV.RUN, // ReviewOption.RUN
          isShowingInput: false,
          highlightedOption: undefined,
        },
      },
    });

    // Track trajectory stopped
    this.context.trackTrajectoryStopped?.({
      composerId: this.context.composerDataHandle.data.composerId,
      invocationID: this.context.generationUUID,
      toolCallId,
      stop_category: "needs_user_approval",
      stop_source: "other",
      reason_code: "web_fetch.needs_approval",
    });

    // Wait for user decision
    return new Promise(resolve => {
      const disposer = toolFormer.addPendingDecision(
        bubbleId,
        on.WEB_FETCH,
        toolCallId,
        (accepted) => {
          disposer();
          resolve(new gtt({
            result: accepted
              ? { case: "approved", value: new Gdn }
              : { case: "rejected", value: new Cfi({ reason: "User chose to skip" }) },
          }));
        },
        true // requiresApproval
      );
    });
  }

  /**
   * Determines if web fetch should be auto-approved based on domain allowlist.
   * Supports wildcard patterns:
   *   - "*" matches all domains
   *   - "*.example.com" matches example.com and all subdomains
   *   - "example.com" matches exact domain
   */
  shouldAutoApproveWebFetch(url, reactiveStorageService, toolFormer) {
    // "Run everything" mode auto-approves all
    if (toolFormer.shouldAutoRun_runEverythingMode()) {
      return true;
    }

    // Check allowlist mode
    if (toolFormer.shouldAutoRun_eitherUseAllowlistOrRunEverythingMode()) {
      const allowlist =
        reactiveStorageService.applicationUserPersistentStorage
          ?.composerState?.webFetchDomainAllowlist ?? [];

      if (allowlist.length === 0) return false;

      // Parse hostname from URL
      let hostname;
      try {
        hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      } catch {
        return false;
      }

      // Match against allowlist entries
      return allowlist.some(pattern => {
        if (pattern === "*") return true;
        if (pattern.startsWith("*.")) {
          const domain = pattern.slice(2);
          return hostname === domain || hostname.endsWith("." + domain);
        }
        return pattern === hostname;
      });
    }

    return false;
  }
};

// --- Symbol Map ---
// OSf  -> WebFetchQueryHandler
// gtt  -> WebFetchRequestResponse
// KKe  -> WebFetchParams
// Gdn  -> WebFetchApproved
// Cfi  -> WebFetchRejected
// xu   -> IReactiveStorageService
// BA.REQUESTED -> ReviewStatus.REQUESTED
// rV.RUN -> ReviewOption.RUN
// on.WEB_FETCH -> ToolType.WEB_FETCH
// ko.TOOL_FORMER -> CapabilityType.TOOL_FORMER
