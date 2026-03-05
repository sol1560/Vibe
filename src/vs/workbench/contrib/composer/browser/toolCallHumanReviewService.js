// Source: out-build/vs/workbench/contrib/composer/browser/toolCallHumanReviewService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ToolCallHumanReviewService and all review model classes
// for edit, terminal, MCP, plan, and web fetch tool calls.

Di(), Jg(), st(), Xn(), Nc(), Er(), Qt(), $d(), H9(), J0(), zk(), dp(), UJ(), nP(), KS(), qF(), bhn();

// ============================================================
// ToolCallHumanReviewService
// ============================================================

/**
 * ToolCallHumanReviewService
 *
 * Manages review models for tool calls that require human approval.
 * Each tool type (edit, terminal, MCP, plan, web fetch) gets its own
 * ReviewModel subclass that handles UI state and user decisions.
 */
let ToolCallHumanReviewService = class extends at {
  constructor(
    composerDataService,
    composerService,
    analyticsService,
    composerPlanService,
    composerViewsService
  ) {
    super();
    this.composerDataService = composerDataService;
    this.composerService = composerService;
    this.analyticsService = analyticsService;
    this.composerPlanService = composerPlanService;
    this.composerViewsService = composerViewsService;

    /** @type {Map<string, BaseReviewModel>} Cache of review models by bubble ID */
    this._reviewModelCache = new Map();
  }

  // --- Get review model for the last bubble under review ---

  getReviewModelForLastBubbleUnderReview(composerHandle) {
    if (!this.composerDataService.getToolFormer(composerHandle)) return;

    let lastBubble;
    try {
      lastBubble = this.getLastBubbleWithReviewStatusFromLast2Bubbles(composerHandle);
    } catch {
      return;
    }

    return this.getReviewModelForBubbleWithReview(composerHandle, lastBubble);
  }

  getReviewModelForLastBubbleUnderReviewUntracked(composerHandle) {
    return rc(() => this.getReviewModelForLastBubbleUnderReview(composerHandle));
  }

  // --- Get review model for a specific bubble ---

  getReviewModelForBubbleWithReview(composerHandle, bubbleInfo) {
    if (bubbleInfo === void 0) return;

    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleInfo.bubbleId);
    if (cached !== void 0) return cached;

    if (bubbleInfo.bubbleTool === on.EDIT_FILE || bubbleInfo.bubbleTool === on.EDIT_FILE_V2) {
      if (!this.isToolformerCurrentlyWaitingForEditReview(composerHandle)) return;
      const model = new EditReviewModel(toolFormer, bubbleInfo.bubbleId, this.composerService);
      this._reviewModelCache.set(bubbleInfo.bubbleId, model);
      return model;
    }

    if (bubbleInfo.bubbleTool === on.RUN_TERMINAL_COMMAND_V2) {
      if (!this.isToolformerCurrentlyWaitingForTerminalReview(composerHandle)) return;
      const model = new TerminalReviewModel(
        toolFormer,
        bubbleInfo.bubbleId,
        this.composerService,
        this.analyticsService
      );
      this._reviewModelCache.set(bubbleInfo.bubbleId, model);
      return model;
    }

    if (bubbleInfo.bubbleTool === on.MCP) {
      if (!this.isToolformerCurrentlyWaitingForMCPReview(composerHandle)) return;
      const model = new McpReviewModel(toolFormer, bubbleInfo.bubbleId);
      this._reviewModelCache.set(bubbleInfo.bubbleId, model);
      return model;
    }

    if (bubbleInfo.bubbleTool === on.WEB_FETCH) {
      if (!this.isToolformerCurrentlyWaitingForWebFetchReview(composerHandle)) return;
      const model = new WebFetchReviewModel(toolFormer, bubbleInfo.bubbleId);
      this._reviewModelCache.set(bubbleInfo.bubbleId, model);
      return model;
    }

    if (bubbleInfo.bubbleTool === on.CREATE_PLAN) {
      const bubbleData = toolFormer.getBubbleData(bubbleInfo.bubbleId)?.additionalData?.planUri;
      if (bubbleData) {
        try {
          const planUri = lEe(bubbleData);
          if (!this.composerPlanService.isPlanPendingByUri(planUri)) return;
        } catch {
          return;
        }
      }
      const model = new PlanReviewModel(
        toolFormer,
        bubbleInfo.bubbleId,
        this.composerDataService,
        composerHandle,
        this.composerPlanService,
        this.composerViewsService
      );
      this._reviewModelCache.set(bubbleInfo.bubbleId, model);
      return model;
    }
  }

  // --- Get review model by bubble ID (generic) ---

  getReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData) {
      if (bubbleData.tool === on.EDIT_FILE || bubbleData.tool === on.EDIT_FILE_V2) {
        const model = new EditReviewModel(toolFormer, bubbleId, this.composerService);
        this._reviewModelCache.set(bubbleId, model);
        return model;
      }
      if (bubbleData.tool === on.RUN_TERMINAL_COMMAND_V2) {
        const model = new TerminalReviewModel(
          toolFormer,
          bubbleId,
          this.composerService,
          this.analyticsService
        );
        this._reviewModelCache.set(bubbleId, model);
        return model;
      }
      if (bubbleData.tool === on.MCP || bubbleData.tool === on.CALL_MCP_TOOL) {
        const model = new McpReviewModel(toolFormer, bubbleId);
        this._reviewModelCache.set(bubbleId, model);
        return model;
      }
      if (bubbleData.tool === on.WEB_FETCH) {
        const model = new WebFetchReviewModel(toolFormer, bubbleId);
        this._reviewModelCache.set(bubbleId, model);
        return model;
      }
      if (bubbleData.tool === on.CREATE_PLAN) {
        const model = new PlanReviewModel(
          toolFormer,
          bubbleId,
          this.composerDataService,
          composerHandle,
          this.composerPlanService,
          this.composerViewsService
        );
        this._reviewModelCache.set(bubbleId, model);
        return model;
      }
    }
  }

  // --- Tool-specific getters ---

  getEditReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData && (bubbleData.tool === on.EDIT_FILE || bubbleData.tool === on.EDIT_FILE_V2)) {
      const model = new EditReviewModel(toolFormer, bubbleId, this.composerService);
      this._reviewModelCache.set(bubbleId, model);
      return model;
    }
  }

  getTerminalReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData && bubbleData.tool === on.RUN_TERMINAL_COMMAND_V2) {
      const model = new TerminalReviewModel(
        toolFormer,
        bubbleId,
        this.composerService,
        this.analyticsService
      );
      this._reviewModelCache.set(bubbleId, model);
      return model;
    }
  }

  getMCPReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0 && cached instanceof McpReviewModel) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData && (bubbleData.tool === on.MCP || bubbleData.tool === on.CALL_MCP_TOOL)) {
      const model = new McpReviewModel(toolFormer, bubbleId);
      this._reviewModelCache.set(bubbleId, model);
      return model;
    }
  }

  getPlanReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0 && cached instanceof PlanReviewModel) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData && bubbleData.tool === on.CREATE_PLAN) {
      const model = new PlanReviewModel(
        toolFormer,
        bubbleId,
        this.composerDataService,
        composerHandle,
        this.composerPlanService,
        this.composerViewsService
      );
      this._reviewModelCache.set(bubbleId, model);
      return model;
    }
  }

  getWebFetchReviewModelForBubble(composerHandle, bubbleId) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return;

    const cached = this._reviewModelCache.get(bubbleId);
    if (cached !== void 0 && cached instanceof WebFetchReviewModel) return cached;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData && bubbleData.tool === on.WEB_FETCH) {
      const model = new WebFetchReviewModel(toolFormer, bubbleId);
      this._reviewModelCache.set(bubbleId, model);
      return model;
    }
  }

  // --- Cleanup ---

  cleanUpReviewModels(composerHandle) {
    const conversation = this.composerDataService.getLoadedConversationById(composerHandle);
    for (const message of conversation) {
      const model = this._reviewModelCache.get(message.bubbleId);
      if (model && !(model instanceof PlanReviewModel)) {
        model.reset();
      }
    }
    this._reviewModelCache.clear();
  }

  // --- Status checks ---

  isToolformerCurrentlyWaitingForReview(composerHandle) {
    return this.isToolformerCurrentlyWaitingForEditReview(composerHandle);
  }

  isToolformerCurrentlyWaitingForEditReview(composerHandle) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return false;
    return toolFormer.pendingDecisions().userInteractionBubbleIds.some((bubbleId) => {
      const bubble = toolFormer.getBubbleData(bubbleId);
      return (
        bubble &&
        (bubble.tool === on.EDIT_FILE || bubble.tool === on.EDIT_FILE_V2) &&
        bubble?.additionalData?.reviewData?.status === BA.REQUESTED
      );
    });
  }

  isToolformerCurrentlyWaitingForTerminalReview(composerHandle) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return false;
    return toolFormer.pendingDecisions().userInteractionBubbleIds.some((bubbleId) => {
      const bubble = rc(() => toolFormer.getBubbleData(bubbleId));
      return (
        bubble &&
        bubble.tool === on.RUN_TERMINAL_COMMAND_V2 &&
        bubble?.additionalData?.reviewData?.status === BA.REQUESTED
      );
    });
  }

  isToolformerCurrentlyWaitingForMCPReview(composerHandle) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return false;
    return toolFormer.pendingDecisions().userInteractionBubbleIds.some((bubbleId) => {
      const bubble = rc(() => toolFormer.getBubbleData(bubbleId));
      return (
        bubble &&
        (bubble.tool === on.MCP || bubble.tool === on.CALL_MCP_TOOL) &&
        bubble?.additionalData?.reviewData?.status === BA.REQUESTED
      );
    });
  }

  isToolformerCurrentlyWaitingForPlanReview(composerHandle) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return false;
    return toolFormer.pendingDecisions().userInteractionBubbleIds.some((bubbleId) => {
      const bubble = rc(() => toolFormer.getBubbleData(bubbleId));
      return (
        bubble &&
        bubble.tool === on.CREATE_PLAN &&
        bubble?.additionalData?.reviewData?.status === BA.REQUESTED
      );
    });
  }

  isToolformerCurrentlyWaitingForWebFetchReview(composerHandle) {
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);
    if (!toolFormer) return false;
    return toolFormer.pendingDecisions().userInteractionBubbleIds.some((bubbleId) => {
      const bubble = rc(() => toolFormer.getBubbleData(bubbleId));
      return (
        bubble &&
        bubble.tool === on.WEB_FETCH &&
        bubble?.additionalData?.reviewData?.status === BA.REQUESTED
      );
    });
  }

  // --- Find last bubble with review status ---

  getLastBubbleWithReviewStatusFromLast2Bubbles(composerHandle) {
    const composerData = this.composerDataService.getComposerData(composerHandle);
    const toolFormer = this.composerDataService.getToolFormer(composerHandle);

    if (composerData?.fullConversationHeadersOnly.length === 0) return;

    const lastTwoBubbleIds = rc(() =>
      composerData?.fullConversationHeadersOnly.slice(-2).map((msg) => msg.bubbleId)
    );

    if (composerData === void 0 || toolFormer === void 0 || lastTwoBubbleIds === void 0) return;

    const isReviewableBubble = (message) => {
      if (message.capabilityType !== toolFormer.type) return false;

      const toolData = message.toolFormerData;
      if (
        !toolData ||
        (toolData.tool !== on.EDIT_FILE &&
          toolData.tool !== on.EDIT_FILE_V2 &&
          toolData.tool !== on.RUN_TERMINAL_COMMAND_V2 &&
          toolData.tool !== on.MCP &&
          toolData.tool !== on.CALL_MCP_TOOL &&
          toolData.tool !== on.CREATE_PLAN &&
          toolData.tool !== on.WEB_FETCH)
      )
        return false;

      const reviewData = message?.toolFormerData?.additionalData?.reviewData;
      return !(!reviewData || reviewData.status !== BA.REQUESTED);
    };

    for (const bubbleId of lastTwoBubbleIds.slice().reverse()) {
      const message = composerData.conversationMap[bubbleId];
      if (message !== void 0 && isReviewableBubble(message)) {
        return { bubbleId: message.bubbleId, bubbleTool: message.toolFormerData.tool };
      }
    }
  }
};

ToolCallHumanReviewService = __decorate(
  [
    __param(0, Fa),  // IComposerDataService
    __param(1, og),  // IComposerService
    __param(2, mh),  // IAnalyticsService
    __param(3, CV),  // IComposerPlanService
    __param(4, sw),  // IComposerViewsService
  ],
  ToolCallHumanReviewService
);

const IToolCallHumanReviewService = Bi("toolCallHumanReviewService");
Ki(IToolCallHumanReviewService, ToolCallHumanReviewService, 1);

// ============================================================
// Edit Review Option enum (duplicated locally for the service)
// ============================================================
(function (editOption) {
  editOption.ACCEPT = "accept";
  editOption.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  editOption.SKIP = "skip";
  editOption.NONE = "none";
  editOption.ACCEPT_AND_ALLOW_FOLDER = "acceptAndAllowFolder";
})(hX || (hX = {}));

// Terminal Review Option enum
(function (terminalOption) {
  terminalOption.RUN = "run";
  terminalOption.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  terminalOption.ALLOWLIST_COMMANDS = "allowlistCommands";
  terminalOption.SKIP = "skip";
  terminalOption.NONE = "none";
})(SV || (SV = {}));

// MCP Review Option enum
(function (mcpOption) {
  mcpOption.RUN = "run";
  mcpOption.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY = "rejectAndTellWhatToDoDifferently";
  mcpOption.ALLOWLIST_TOOL = "allowlistTool";
  mcpOption.SKIP = "skip";
  mcpOption.NONE = "none";
})(EQ || (EQ = {}));

// ============================================================
// BaseReviewModel — abstract base class for all review models
// ============================================================

/**
 * BaseReviewModel
 *
 * Provides shared UI state management for human review:
 * - Input box visibility (for feedback/rejection text)
 * - Option highlighting and keyboard navigation
 * - Status management
 */
const BaseReviewModel = class {
  getIsShowingInput() {
    const reviewData = this.getHumanReviewData();
    return reviewData ? reviewData.isShowingInput : false;
  }

  setIsShowingInput(value) {
    this.updateReviewData({ isShowingInput: value });
  }

  submitFeedbackText(text, bubbleId) {
    this.updateReviewData({
      status: BA.DONE,
      finalFeedbackText: text,
      finalFeedbackBubbleId: bubbleId,
    });
  }

  closeInputBox() {
    this.updateReviewData({ isShowingInput: false });
  }

  getHighlightedOption() {
    const reviewData = this.getHumanReviewData();
    if (reviewData) return reviewData.highlightedOption;
  }

  setHighlightedOption(option) {
    this.updateReviewData({ highlightedOption: option });
  }

  selectHighlightedOption() {
    const highlighted = this.getHighlightedOption();
    if (highlighted !== void 0) this.setSelectedOption(highlighted);
  }

  setStatus(status) {
    this.updateReviewData({ status: status });
  }

  getOrCreateInputBoxBubble(composerDataHandle) {
    const reviewData = this.getHumanReviewData();
    if (!reviewData) return;

    if (reviewData.inputBoxBubbleId) return reviewData.inputBoxBubbleId;

    const newBubbleId = Gr();
    const inputBubble = {
      ...d_(),
      text: "",
      bubbleId: newBubbleId,
      context: sR(),
      isReviewEditsFollowup: true,
    };
    composerDataHandle.setData("conversationMap", newBubbleId, inputBubble);
    this.updateReviewData({ inputBoxBubbleId: newBubbleId });
    return newBubbleId;
  }

  highlightOptionAbove() {
    const current = this.getHighlightedOption();
    if (current === void 0) return false;
    const options = this.getCurrentlyDisplayedOptions();
    const currentIndex = options.indexOf(current);
    const newIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
    this.setHighlightedOption(options[newIndex]);
    return true;
  }

  highlightOptionBelow() {
    const current = this.getHighlightedOption();
    if (current === void 0) return false;
    const options = this.getCurrentlyDisplayedOptions();
    const currentIndex = options.indexOf(current);
    const newIndex = currentIndex === options.length - 1 ? 0 : currentIndex + 1;
    this.setHighlightedOption(options[newIndex]);
    return true;
  }

  reset() {
    this.updateReviewData(this.getDefaultReviewData());
  }

  getKeyboardShortcut(option, isDefault) {
    return isDefault ? "\u23CE" : "";
  }

  handleComposerShortcut(shortcutId, composerHandle) {
    return false;
  }
};

// ============================================================
// EditReviewModel — Review model for file edit tool calls
// ============================================================

const EditReviewModel = class extends BaseReviewModel {
  constructor(toolFormer, bubbleId, composerService) {
    super();
    this.toolFormer = toolFormer;
    this.editFileBubbleId = bubbleId;
    this.composerService = composerService;
    this.bubbleId = bubbleId;
  }

  getHumanReviewData() {
    const bubble = this.toolFormer.getBubbleData(this.editFileBubbleId);
    if (!bubble || (bubble.tool !== on.EDIT_FILE && bubble.tool !== on.EDIT_FILE_V2)) return;
    return bubble.additionalData?.reviewData;
  }

  updateReviewData(data) {
    const bubble = this.toolFormer.getBubbleData(this.editFileBubbleId);
    if (!bubble || (bubble.tool !== on.EDIT_FILE && bubble.tool !== on.EDIT_FILE_V2)) return;
    const existing = bubble.additionalData?.reviewData;
    this.toolFormer.setBubbleData(this.editFileBubbleId, {
      additionalData: {
        reviewData: { ...this.getDefaultReviewData(), ...existing, ...data },
      },
    });
  }

  setSelectedOption(option) {
    this.updateReviewData({ selectedOption: option });
    if (
      option === Z9.ACCEPT ||
      option === Z9.ACCEPT_AND_ALLOW_FOLDER ||
      option === Z9.SWITCH_TO_DEFAULT_AGENT_MODE ||
      option === Z9.SKIP
    ) {
      this.setStatus(BA.DONE);
    }
    if (option === Z9.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY) {
      this.setStatus(BA.DONE);
      this.setIsShowingInput(true);
      this.composerService.cancelCurrentStep(this.toolFormer.composerId, {
        focusBottomInput: true,
      });
    }
  }

  completeWithRunAction() {
    if (this.getHumanReviewData()?.status === BA.REQUESTED) {
      this.setSelectedOption(Z9.ACCEPT);
    }
  }

  getSelectedOption() {
    const reviewData = this.getHumanReviewData();
    return reviewData ? reviewData.selectedOption : Z9.ACCEPT;
  }

  toggleRejectInputBox() {
    if (this.getIsShowingInput()) {
      this.closeInputBox();
    } else {
      this.setSelectedOption(Z9.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY);
    }
  }

  getCurrentlyDisplayedOptions() {
    return [Z9.ACCEPT, Z9.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY, Z9.SWITCH_TO_DEFAULT_AGENT_MODE];
  }

  getDefaultReviewData() {
    return {
      status: BA.NONE,
      selectedOption: Z9.ACCEPT,
      isShowingInput: false,
      highlightedOption: void 0,
      firstTimeReviewMode: false,
    };
  }

  getIsFirstTimeReviewMode() {
    const reviewData = this.getHumanReviewData();
    return reviewData ? reviewData.firstTimeReviewMode : false;
  }

  setIsFirstTimeReviewMode(value) {
    this.updateReviewData({ firstTimeReviewMode: value });
  }

  getHeaderText() {
    return "Keep this edit?";
  }

  getKind() {
    return iV.EDIT;
  }

  isExecutionBlocking() {
    return true;
  }
};

// ============================================================
// TerminalReviewModel — Review model for terminal command execution
// ============================================================

const TerminalReviewModel = class extends BaseReviewModel {
  constructor(toolFormer, bubbleId, composerService, analyticsService) {
    super();
    this.toolFormer = toolFormer;
    this.terminalToolBubbleId = bubbleId;
    this.composerService = composerService;
    this.analyticsService = analyticsService;
    this.bubbleId = bubbleId;
  }

  getHumanReviewData() {
    const bubble = this.toolFormer.getBubbleData(this.terminalToolBubbleId);
    if (!bubble || bubble.tool !== on.RUN_TERMINAL_COMMAND_V2) return;
    return bubble.additionalData?.reviewData;
  }

  updateReviewData(data) {
    const bubble = this.toolFormer.getBubbleData(this.terminalToolBubbleId);
    if (!bubble || bubble.tool !== on.RUN_TERMINAL_COMMAND_V2) return;
    const existing = bubble.additionalData?.reviewData;
    this.toolFormer.setBubbleData(this.terminalToolBubbleId, {
      additionalData: {
        reviewData: { ...this.getDefaultReviewData(), ...existing, ...data },
      },
    });
  }

  setSelectedOption(option) {
    const existingApproval = this.getHumanReviewData()?.approvalType;
    const approvalType =
      existingApproval && existingApproval !== fhn.NONE ? existingApproval : fhn.USER;
    this.updateReviewData({ selectedOption: option, approvalType: approvalType });

    if (option === dD.RUN || option === dD.ALLOWLIST_COMMANDS || option === dD.SKIP) {
      this.setStatus(BA.DONE);
    }
    if (option === dD.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY) {
      this.setStatus(BA.DONE);
      this.setIsShowingInput(false);
      this.composerService.cancelCurrentStep(this.toolFormer.composerId, {
        focusBottomInput: true,
      });
      this.analyticsService.trackEvent("composer.cancel_chat", {
        composerId: this.toolFormer.composerId,
        source: "composer_cancel_button",
      });
    }
  }

  completeWithRunAction() {
    if (this.getHumanReviewData()?.status === BA.REQUESTED) {
      this.setSelectedOption(dD.RUN);
    }
  }

  getSelectedOption() {
    const reviewData = this.getHumanReviewData();
    return reviewData ? reviewData.selectedOption : dD.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY;
  }

  toggleRejectInputBox() {
    this.setSelectedOption(dD.SKIP);
  }

  getCurrentlyDisplayedOptions() {
    const reviewData = this.getHumanReviewData();
    if (reviewData?.candidatesForAllowlist && reviewData.candidatesForAllowlist.length > 0) {
      return [
        dD.RUN,
        dD.SKIP,
        dD.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY,
        dD.ALLOWLIST_COMMANDS,
      ];
    }
    return [dD.RUN, dD.SKIP, dD.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY];
  }

  getDefaultReviewData() {
    return {
      status: BA.NONE,
      selectedOption: dD.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY,
      isShowingInput: false,
      highlightedOption: void 0,
    };
  }

  getIsFirstTimeReviewMode() {
    return false;
  }

  setIsFirstTimeReviewMode() {}

  getHeaderText() {
    const reviewData = this.getHumanReviewData();
    if (reviewData?.isRetry === true) return "Rerun command?";
    const candidates = reviewData?.candidatesForAllowlist;
    if (Array.isArray(candidates) && candidates.length > 0) {
      return `Run '${candidates.join(", ")}'?`;
    }
    return "Run command?";
  }

  getKind() {
    return iV.TERMINAL;
  }

  isExecutionBlocking() {
    return true;
  }
};

// ============================================================
// McpReviewModel — Review model for MCP tool calls
// ============================================================

const McpReviewModel = class extends BaseReviewModel {
  constructor(toolFormer, bubbleId) {
    super();
    this.toolFormer = toolFormer;
    this.bubbleId = bubbleId;
  }

  getHumanReviewData() {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || (bubble.tool !== on.MCP && bubble.tool !== on.CALL_MCP_TOOL)) return;
    return bubble.additionalData?.reviewData;
  }

  updateReviewData(data) {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || (bubble.tool !== on.MCP && bubble.tool !== on.CALL_MCP_TOOL)) return;
    const existing = bubble.additionalData?.reviewData;
    this.toolFormer.setBubbleData(this.bubbleId, {
      additionalData: {
        reviewData: { ...this.getDefaultReviewData(), ...existing, ...data },
      },
    });
  }

  setSelectedOption(option) {
    this.updateReviewData({ selectedOption: option });
    if (option === AI.RUN || option === AI.ALLOWLIST_TOOL || option === AI.SKIP) {
      this.setStatus(BA.DONE);
    }
    if (option === AI.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY) {
      this.setStatus(BA.DONE);
      this.setIsShowingInput(false);
    }
  }

  completeWithRunAction() {
    if (this.getHumanReviewData()?.status === BA.REQUESTED) {
      this.setSelectedOption(AI.RUN);
    }
  }

  getSelectedOption() {
    return this.getHumanReviewData()?.selectedOption ?? AI.RUN;
  }

  getCurrentlyDisplayedOptions() {
    const options = [AI.RUN, AI.SKIP, AI.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY];

    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if ((bubble?.tool === on.MCP || bubble?.tool === on.CALL_MCP_TOOL) && bubble.params) {
      let toolName;
      if (bubble.tool === on.MCP) {
        toolName = bubble.params.tools?.[0]?.name;
      } else {
        toolName = bubble.params.toolName;
      }
      if (toolName) options.push(AI.ALLOWLIST_TOOL);
    }
    return options;
  }

  getDefaultReviewData() {
    return {
      status: BA.NONE,
      selectedOption: AI.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY,
      isShowingInput: false,
      highlightedOption: void 0,
    };
  }

  getIsFirstTimeReviewMode() {
    return false;
  }

  setIsFirstTimeReviewMode() {}

  toggleRejectInputBox() {
    if (this.getIsShowingInput()) {
      this.closeInputBox();
    } else {
      this.setSelectedOption(AI.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY);
    }
  }

  getHeaderText() {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if ((bubble?.tool === on.MCP || bubble?.tool === on.CALL_MCP_TOOL) && bubble.params) {
      let toolName, serverName;
      if (bubble.tool === on.MCP) {
        toolName = bubble.params.tools?.[0]?.name;
        serverName = bubble.params.tools?.[0]?.serverName;
      } else {
        toolName = bubble.params.toolName;
        serverName = bubble.params.server;
      }
      if (toolName) {
        const serverSuffix = serverName ? ` on ${serverName}` : "";
        return `Run ${toolName}${serverSuffix}?`;
      }
    }
    return "Run MCP tool?";
  }

  getKind() {
    return iV.MCP;
  }

  isExecutionBlocking() {
    return true;
  }
};

// ============================================================
// WebFetchReviewModel — Review model for web fetch tool calls
// ============================================================

const WebFetchReviewModel = class extends BaseReviewModel {
  constructor(toolFormer, bubbleId) {
    super();
    this.toolFormer = toolFormer;
    this.bubbleId = bubbleId;
  }

  getHumanReviewData() {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || bubble.tool !== on.WEB_FETCH) return;
    return bubble.additionalData?.reviewData;
  }

  updateReviewData(data) {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || bubble.tool !== on.WEB_FETCH) return;
    const existing = bubble.additionalData?.reviewData;
    this.toolFormer.setBubbleData(this.bubbleId, {
      additionalData: {
        reviewData: { ...this.getDefaultReviewData(), ...existing, ...data },
      },
    });
  }

  setSelectedOption(option) {
    this.updateReviewData({ selectedOption: option });
    if (option === rV.RUN || option === rV.ALLOWLIST_DOMAIN || option === rV.SKIP) {
      this.setStatus(BA.DONE);
    }
  }

  completeWithRunAction() {
    if (this.getHumanReviewData()?.status === BA.REQUESTED) {
      this.setSelectedOption(rV.RUN);
    }
  }

  getSelectedOption() {
    return this.getHumanReviewData()?.selectedOption ?? rV.RUN;
  }

  getCurrentlyDisplayedOptions() {
    return [rV.RUN, rV.SKIP, rV.ALLOWLIST_DOMAIN];
  }

  getDefaultReviewData() {
    return {
      status: BA.NONE,
      selectedOption: rV.RUN,
      isShowingInput: false,
      highlightedOption: void 0,
    };
  }

  getIsFirstTimeReviewMode() {
    return false;
  }

  setIsFirstTimeReviewMode() {}

  toggleRejectInputBox() {
    this.setSelectedOption(rV.SKIP);
  }

  getHeaderText() {
    return "Fetch URL?";
  }

  getKind() {
    return iV.WEB_FETCH;
  }

  isExecutionBlocking() {
    return true;
  }
};

// ============================================================
// PlanReviewModel — Review model for plan creation tool calls
// ============================================================

const PlanReviewModel = class extends BaseReviewModel {
  constructor(
    toolFormer,
    bubbleId,
    composerDataService,
    composerHandle,
    composerPlanService,
    composerViewsService
  ) {
    super();
    this.toolFormer = toolFormer;
    this.bubbleId = bubbleId;
    this.composerDataService = composerDataService;
    this.composerPlanService = composerPlanService;
    this.composerViewsService = composerViewsService;
    this.composerId = composerHandle.data.composerId;
  }

  getFreshHandle() {
    return this.composerDataService.getHandleIfLoaded(this.composerId);
  }

  getHumanReviewData() {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || bubble.tool !== on.CREATE_PLAN) return;
    return bubble.additionalData?.reviewData;
  }

  updateReviewData(data) {
    const bubble = this.toolFormer.getBubbleData(this.bubbleId);
    if (!bubble || bubble.tool !== on.CREATE_PLAN) return;
    const existing = bubble.additionalData?.reviewData;
    this.toolFormer.setBubbleData(this.bubbleId, {
      additionalData: {
        reviewData: { ...this.getDefaultReviewData(), ...existing, ...data },
      },
    });
  }

  setSelectedOption(option, preferredUnifiedMode) {
    this.updateReviewData({ selectedOption: option });
    const handle = this.getFreshHandle();

    if (option === cQ.APPROVE) {
      if (!handle) {
        console.warn(
          "[PlanReviewModel] Cannot approve plan: composer handle not available for",
          this.composerId
        );
        return;
      }
      const planUriStr =
        this.toolFormer.getBubbleData(this.bubbleId)?.additionalData?.planUri;
      if (!planUriStr) {
        console.warn("[PlanReviewModel] No plan URI in bubble data for", this.bubbleId);
        return;
      }
      const planUri = je.parse(planUriStr);
      this.setStatus(BA.DONE);
      this.composerPlanService.acceptPlan(handle, planUri, this.bubbleId, "manual", {
        unifiedMode: preferredUnifiedMode,
      });
    }

    if (option === cQ.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY) {
      this.setIsShowingInput(true);
      this.composerViewsService.focus(this.composerId, true);
    }

    if (option === cQ.EDIT) {
      this.setStatus(BA.DONE);
      const bubbleData = this.toolFormer.getBubbleData(this.bubbleId);
      if (bubbleData?.tool === on.CREATE_PLAN) {
        const planUriStr = bubbleData.additionalData?.planUri;
        if (planUriStr) {
          const planUri = lEe(planUriStr);
          this.composerPlanService.openPlanInEditor(planUri, {
            stealFocus: true,
            composerId: this.composerId,
          });
        }
      }
    }
  }

  completeWithRunAction() {
    const reviewData = this.getHumanReviewData();
    if (reviewData?.status === BA.REQUESTED) {
      this.setSelectedOption(cQ.APPROVE, reviewData.preferredUnifiedMode);
    }
  }

  getSelectedOption() {
    return this.getHumanReviewData()?.selectedOption ?? cQ.NONE;
  }

  getCurrentlyDisplayedOptions() {
    return [cQ.APPROVE, cQ.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY, cQ.EDIT];
  }

  getDefaultReviewData() {
    return {
      status: BA.NONE,
      selectedOption: cQ.NONE,
      isShowingInput: false,
      highlightedOption: void 0,
    };
  }

  getIsFirstTimeReviewMode() {
    return false;
  }

  setIsFirstTimeReviewMode() {}

  toggleRejectInputBox() {
    if (this.getIsShowingInput()) {
      this.closeInputBox();
      this.setSelectedOption(cQ.NONE);
    }
  }

  getHeaderText() {
    return "Approve this plan?";
  }

  getKind() {
    return iV.PLAN;
  }

  isExecutionBlocking() {
    return false;
  }

  getKeyboardShortcut(option, isDefault) {
    switch (option) {
      case cQ.APPROVE:
        return Xae("\u23CE"); // Cmd+Enter / Ctrl+Enter
      case cQ.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY:
        return "Esc";
      default:
        return isDefault ? Xae("\u23CE") : "";
    }
  }
};
