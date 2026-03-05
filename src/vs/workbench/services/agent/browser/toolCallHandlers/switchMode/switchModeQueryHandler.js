/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/switchMode/switchModeQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
rVl(), Ov(), Jg(), Pd(), dp(), fN(), $d();

// --- SwitchModeQueryHandler ---
// Handles the server-initiated switch_mode query (InteractionQuery).
// Manages mode transitions (e.g. agent -> plan) with auto-approved/auto-rejected lists.
const SwitchModeQueryHandler = class { // MSf
  constructor(context) {
    this.context = context;
    this.handledToolCalls = new Set;
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  getComposerDataService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
  }

  getComposerModesService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(DT) // IComposerModesService
    );
  }

  getReactiveStorageService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(xu) // IReactiveStorageService
    );
  }

  getAnalyticsService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(mh) // IAnalyticsService
    );
  }

  async handleSwitchModeRequest(request) {
    const toolFormer = this.getToolFormer();
    const composerModesService = this.getComposerModesService();
    const reactiveStorageService = this.getReactiveStorageService();
    const analyticsService = this.getAnalyticsService();
    const composerDataService = this.getComposerDataService();
    const composerId = this.context.composerDataHandle.data.composerId;
    const toolCallId = request.args?.toolCallId;

    if (!toolCallId) {
      return new nEe({ // SwitchModeRequestResponse
        result: {
          case: "rejected",
          value: new ptt({ reason: "Missing toolCallId" }), // SwitchModeRejected
        },
      });
    }

    const targetModeId = request.args?.targetModeId ?? "";
    const currentModeId = composerModesService.getComposerUnifiedMode(composerId) || "agent";
    const explanation = request.args?.explanation;

    const params = new VKe({ // SwitchModeParams
      fromModeId: currentModeId,
      toModeId: targetModeId,
      explanation,
    });
    const rawArgs = JSON.stringify({
      fromModeId: currentModeId,
      toModeId: targetModeId,
      explanation,
    });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId,
      toolIndex: 0,
      modelCallId: toolCallId,
      toolCallType: on.SWITCH_MODE, // ToolType.SWITCH_MODE
      params: { case: "switchModeParams", value: params },
      rawArgs,
      name: "switch_mode",
    });

    toolFormer.setBubbleData(bubbleId, {
      tool: on.SWITCH_MODE,
      toolCallId,
      name: "switch_mode",
      rawArgs,
      params,
    });

    // Check if user already made a decision (e.g. on retry)
    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData?.userDecision !== undefined) {
      return bubbleData.userDecision === "accepted"
        ? this.performModeSwitch(composerId, currentModeId, targetModeId, true, false)
        : new nEe({
            result: {
              case: "rejected",
              value: new ptt({ reason: "User rejected the mode switch" }),
            },
          });
    }

    // No-op if switching to same mode
    if (currentModeId === targetModeId) {
      toolFormer.setBubbleData(bubbleId, { userDecision: "accepted" });
      return new nEe({
        result: { case: "approved", value: new wfi }, // SwitchModeApproved
      });
    }

    // Prevent duplicate handling
    if (this.handledToolCalls.has(toolCallId)) {
      return new nEe({
        result: {
          case: "rejected",
          value: new ptt({ reason: "Mode switch already handled" }),
        },
      });
    }
    this.handledToolCalls.add(toolCallId);

    const transitionKey = `${currentModeId}->${targetModeId}`;

    // Check auto-rejected transitions
    const autoRejected =
      reactiveStorageService.applicationUserPersistentStorage
        ?.composerState?.autoRejectedModeTransitions || [];

    if (autoRejected.includes(transitionKey)) {
      if (bubbleId) {
        toolFormer.setBubbleData(bubbleId, { userDecision: "rejected" });
      }
      const composerData = composerDataService.getComposerData(this.context.composerDataHandle);
      analyticsService.trackEvent("switch_mode_invoked", {
        fromModeId: currentModeId,
        toModeId: targetModeId,
        accepted: false,
        model: composerData?.modelConfig?.modelName,
      });
      this.handledToolCalls.delete(toolCallId);
      return new nEe({
        result: {
          case: "rejected",
          value: new ptt({
            reason: `Mode switch from ${currentModeId} to ${targetModeId} is disabled by user preference`,
          }),
        },
      });
    }

    // Check auto-approved transitions
    const autoApproved =
      reactiveStorageService.applicationUserPersistentStorage
        ?.composerState?.autoApprovedModeTransitions || [];

    if (autoApproved.includes(transitionKey)) {
      if (bubbleId) {
        toolFormer.setBubbleData(bubbleId, { userDecision: "accepted" });
      }
      this.handledToolCalls.delete(toolCallId);
      return this.performModeSwitch(composerId, currentModeId, targetModeId, true, true);
    }

    // Needs user approval — track trajectory stopped
    this.context.trackTrajectoryStopped?.({
      composerId,
      invocationID: this.context.generationUUID,
      toolCallId,
      stop_category: "needs_user_approval",
      stop_source: "other",
      reason_code: "switch_mode.needs_approval",
    });

    // Wait for user decision
    return new Promise(resolve => {
      const disposer = toolFormer.addPendingDecision(
        bubbleId,
        on.SWITCH_MODE,
        toolCallId,
        (accepted) => {
          disposer();
          this.handledToolCalls.delete(toolCallId);

          if (accepted) {
            resolve(this.performModeSwitch(composerId, currentModeId, targetModeId, true, false));
          } else {
            const composerData = composerDataService.getComposerData(
              this.context.composerDataHandle
            );
            analyticsService.trackEvent("switch_mode_invoked", {
              fromModeId: currentModeId,
              toModeId: targetModeId,
              accepted: false,
              model: composerData?.modelConfig?.modelName,
            });
            resolve(new nEe({
              result: {
                case: "rejected",
                value: new ptt({ reason: "User rejected the mode switch" }),
              },
            }));
          }
        },
        true // requiresApproval
      );
    });
  }

  performModeSwitch(composerId, fromModeId, toModeId, accepted, isAutoApproved) {
    const composerModesService = this.getComposerModesService();
    const composerDataService = this.getComposerDataService();
    const analyticsService = this.getAnalyticsService();

    const composerData = composerDataService.getComposerData(this.context.composerDataHandle);
    analyticsService.trackEvent("switch_mode_invoked", {
      fromModeId,
      toModeId,
      accepted: true,
      model: composerData?.modelConfig?.modelName,
    });

    // Track plan mode entry point if switching to plan
    if (toModeId === "plan") {
      analyticsService.trackEvent("composer.plan_mode.entry_point", {
        entrypoint: "switch_mode_tool",
        model: composerData?.modelConfig?.modelName || "unknown",
      });
    }

    composerModesService.setComposerUnifiedMode(this.context.composerDataHandle, toModeId);

    return new nEe({
      result: { case: "approved", value: new wfi }, // SwitchModeApproved
    });
  }
};

// --- Symbol Map ---
// MSf  -> SwitchModeQueryHandler
// nEe  -> SwitchModeRequestResponse
// VKe  -> SwitchModeParams
// wfi  -> SwitchModeApproved
// ptt  -> SwitchModeRejected
// Fa   -> IComposerDataService
// DT   -> IComposerModesService
// xu   -> IReactiveStorageService
// mh   -> IAnalyticsService
// on.SWITCH_MODE -> ToolType.SWITCH_MODE
// ko.TOOL_FORMER -> CapabilityType.TOOL_FORMER
