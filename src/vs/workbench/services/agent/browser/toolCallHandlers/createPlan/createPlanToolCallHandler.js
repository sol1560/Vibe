/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/createPlan/createPlanToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Jg(), Ov(), UJ(), nP(), $J(), Yu();

// --- CreatePlanToolCallHandler ---
// Handles the create_plan tool call from the agent.
// Creates/updates plan files and manages plan editor UI.
const CreatePlanToolCallHandler = class { // ISf
  constructor(context) {
    this.context = context;
    this.pendingQueue = new Map;
  }

  isMultiPlanEnabled() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Rl) // IExperimentService
    ).checkFeatureGate("file_based_plan_edits") === true;
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  convertTodoStatus(protoStatus) {
    switch (protoStatus) {
      case 1: return "pending";
      case 2: return "in_progress";
      case 3: return "completed";
      case 4: return "cancelled";
      default: return "pending";
    }
  }

  shouldAutoOpenPlanEditor(composerId) {
    const composerFocusService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(sw) // IComposerFocusService
    );
    return composerFocusService.isFocused(composerId) ||
      composerFocusService.isPrevBubbleFocused(composerId);
  }

  async handlePartialToolCall(toolCall, callId) {
    const queued = (this.pendingQueue.get(callId) ?? Promise.resolve())
      .then(() => this.handleToolCallStarted(toolCall, callId));
    this.pendingQueue.set(callId, queued);
    try {
      await queued;
    } finally {
      if (this.pendingQueue.get(callId) === queued) {
        this.pendingQueue.delete(callId);
      }
    }
  }

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    // No streaming deltas for create plan
  }

  async handleToolCallStarted(toolCall, callId) {
    const createPlanCall = toolCall.tool.value;
    const todoFileService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(CV) // ITodoFileService / IPlanFileService
    );
    const toolFormer = this.getToolFormer();
    const args = createPlanCall.args;

    const planParams = new zKe({ // CreatePlanParams
      plan: args?.plan,
      overview: args?.overview,
      todos: args?.todos?.map(todo => new QB({ // TodoItem
        id: todo.id,
        content: todo.content,
        status: this.convertTodoStatus(todo.status),
        dependencies: todo.dependencies,
      })),
      name: args?.name,
      isProject: args?.isProject,
      phases: args?.phases?.map(phase => ({
        name: phase.name,
        todos: phase.todos?.map(todo => new QB({
          id: todo.id,
          content: todo.content,
          status: this.convertTodoStatus(todo.status),
          dependencies: todo.dependencies,
        })) || [],
      })),
    });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId: callId,
      toolIndex: 0,
      modelCallId: "",
      toolCallType: on.CREATE_PLAN, // ToolType.CREATE_PLAN
      name: "create_plan",
      params: { case: "createPlanParams", value: planParams },
      toolCall,
    });

    const composerId = this.context.composerDataHandle.data.composerId;
    const bubbleData = toolFormer.getBubbleData(bubbleId)?.additionalData;
    const hasOpenedEditor = bubbleData?.hasOpenedEditor === true;
    const planUri = bubbleData?.planUri;

    const planName = args?.name;
    const planText = args?.plan || "";
    const overview = args?.overview || "";
    const todos = args?.todos?.map(todo => ({
      id: todo.id || "",
      content: todo.content,
      status: "pending",
      dependencies: todo.dependencies || [],
    })) || [];

    try {
      const isMultiPlan = this.isMultiPlanEnabled();

      if (planUri) {
        // Update existing plan
        if (planText) {
          const { parsePlanUriString } = await Promise.resolve().then(() => (qF(), opa));
          const parsedUri = parsePlanUriString(planUri);
          const phases = args?.phases?.map(phase => ({
            name: phase.name,
            todos: phase.todos?.map(todo => ({
              id: todo.id || "",
              content: todo.content,
              status: "pending",
              dependencies: todo.dependencies || [],
            })) || [],
          }));
          await todoFileService.updatePlanByUriDirty(
            parsedUri, planName, overview, todos, planText, composerId, args?.isProject, phases
          );
        }
      } else if (planName && planText) {
        // Create new plan
        let fileUri;
        const phases = args?.phases?.map(phase => ({
          name: phase.name,
          todos: phase.todos?.map(todo => ({
            id: todo.id || "",
            content: todo.content,
            status: "pending",
            dependencies: todo.dependencies || [],
          })) || [],
        }));

        if (isMultiPlan) {
          fileUri = await todoFileService.createPlanFile(
            composerId, planName, overview, todos, planText, args?.isProject, phases
          );
        } else {
          fileUri = await todoFileService.getOrCreatePlanFile(
            composerId, planName, overview, todos, planText, args?.isProject, phases
          );
        }

        if (!hasOpenedEditor && this.shouldAutoOpenPlanEditor(composerId)) {
          await todoFileService.openPlanInEditor(fileUri, {
            stealFocus: false,
            composerId,
          });
        }

        toolFormer.setBubbleData(bubbleId, {
          params: planParams,
          additionalData: { planUri: fileUri.toString(), hasOpenedEditor: true },
        });
      }
    } catch (error) {
      console.error("[CreatePlanToolCallHandler] Failed to create/update plan file during streaming:", error);
    }
  }

  async handleToolCallCompleted(toolCall, callId) {
    const createPlanCall = toolCall.tool.value;
    const todoFileService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(CV) // IPlanFileService
    );
    const analyticsModule = await Promise.resolve().then(() => ($d(), Whg));
    const analyticsService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(analyticsModule.IAnalyticsService)
    );
    const planReviewService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(JEe) // IPlanReviewService
    );
    const toolFormer = this.getToolFormer();
    const bubbleId = toolFormer.getBubbleIdByToolCallId(callId);

    if (!bubbleId) {
      throw new Error(`Bubble not found for tool call id ${callId}`);
    }

    const composerHandle = this.context.composerDataHandle;
    const composerId = composerHandle.data.composerId;
    const composerData = composerHandle.data;

    if (!composerData) {
      throw new Error(`Composer not found for composer id ${composerId}`);
    }

    const args = createPlanCall.args;
    if (!args || !args.plan) {
      throw new Error(`Plan args not found for tool call id ${callId}`);
    }

    const planParams = new zKe({
      plan: args?.plan,
      overview: args?.overview,
      todos: args?.todos?.map(todo => new QB({
        id: todo.id,
        content: todo.content,
        status: this.convertTodoStatus(todo.status),
        dependencies: todo.dependencies,
      })),
      name: args?.name,
      isProject: args?.isProject,
      phases: args?.phases?.map(phase => ({
        name: phase.name,
        todos: phase.todos?.map(todo => new QB({
          id: todo.id,
          content: todo.content,
          status: this.convertTodoStatus(todo.status),
          dependencies: todo.dependencies,
        })) || [],
      })),
    });

    if (createPlanCall.result?.result?.case === "success") {
      const existingBubbleData = toolFormer.getBubbleData(bubbleId)?.additionalData;
      const hasOpenedEditor = existingBubbleData?.hasOpenedEditor === true;
      const existingPlanUri = existingBubbleData?.planUri;
      let finalPlanUri = existingPlanUri ?? createPlanCall.result?.planUri;

      if (existingPlanUri) {
        // Update existing plan file
        const name = args.name || undefined;
        const overview = args.overview || "";
        const todos = args.todos?.map(todo => ({
          id: todo.id || "",
          content: todo.content,
          status: "pending",
          dependencies: todo.dependencies || [],
        })) || [];
        const phases = args?.phases?.map(phase => ({
          name: phase.name,
          todos: phase.todos?.map(todo => ({
            id: todo.id || "",
            content: todo.content,
            status: "pending",
            dependencies: todo.dependencies || [],
          })) || [],
        }));

        try {
          const { parsePlanUriString } = await Promise.resolve().then(() => (qF(), opa));
          const parsedUri = parsePlanUriString(existingPlanUri);
          await todoFileService.updatePlanByUriDirty(
            parsedUri, name, overview, todos, args.plan, composerId, args?.isProject, phases
          );
          await todoFileService.savePlanModel(parsedUri);
        } catch (error) {
          console.error("[CreatePlanToolCallHandler] Failed to update plan file:", error);
        }
      } else {
        // Create new plan file
        const name = args.name || undefined;
        const overview = args.overview || "";
        const todos = args.todos?.map(todo => ({
          id: todo.id || "",
          content: todo.content,
          status: "pending",
          dependencies: todo.dependencies || [],
        })) || [];

        try {
          const isMultiPlan = this.isMultiPlanEnabled();
          let fileUri;
          const phases = args?.phases?.map(phase => ({
            name: phase.name,
            todos: phase.todos?.map(todo => ({
              id: todo.id || "",
              content: todo.content,
              status: "pending",
              dependencies: todo.dependencies || [],
            })) || [],
          }));

          if (isMultiPlan) {
            fileUri = await todoFileService.createPlanFile(
              composerId, name || todoFileService.getPlanTitle(args.plan), overview, todos, args.plan, args?.isProject, phases
            );
          } else {
            fileUri = await todoFileService.getOrCreatePlanFile(
              composerId, name, overview, todos, args.plan, args?.isProject, phases
            );
          }

          finalPlanUri = fileUri.toString();

          if (!hasOpenedEditor && this.shouldAutoOpenPlanEditor(composerId)) {
            await todoFileService.openPlanInEditor(fileUri, {
              stealFocus: false,
              composerId,
            });
          }
        } catch (error) {
          console.error("[CreatePlanToolCallHandler] Failed to create plan file:", error);
        }
      }

      toolFormer.setBubbleData(bubbleId, {
        params: planParams,
        additionalData: { planUri: finalPlanUri, hasOpenedEditor: true },
      });

      // Track analytics
      analyticsService.trackEvent("composer.plan_mode.plan_created", {
        iteration_number: 1,
        model: composerData.modelConfig?.modelName || "unknown",
        composerId,
        invocationID: composerData?.latestChatGenerationUUID,
      });

      // Check plan review model
      const reviewModel = planReviewService.getPlanReviewModelForBubble(composerHandle, bubbleId);
      if (reviewModel) {
        try {
          analyticsService.trackEvent("composer.agent_trajectory_stopped", {
            composerId,
            invocationID: composerData?.latestChatGenerationUUID,
            toolCallId: callId,
            stop_category: "needs_user_approval",
            stop_source: "other",
            reason_code: "plan.needs_approval",
          });
        } catch { /* ignore tracking errors */ }

        reviewModel.setStatus(BA.REQUESTED); // ReviewStatus.REQUESTED
      }

      // Return rejected result (plan needs user review/approval)
      const planResult = new Wbt({ // CreatePlanResult
        result: { case: "rejected", value: {} },
      });

      toolFormer.handleToolResult(
        new QR({ // ToolResult
          tool: on.CREATE_PLAN,
          toolCallId: callId,
          result: { case: "createPlanResult", value: planResult },
        }),
        callId,
        true // final
      );

    } else if (createPlanCall.result?.result?.case === "error") {
      const errorValue = createPlanCall.result.result.value;

      // Discard any streamed plan model on error
      const existingPlanUri = toolFormer.getBubbleData(bubbleId)?.additionalData?.planUri;
      if (existingPlanUri) {
        try {
          const { parsePlanUriString } = await Promise.resolve().then(() => (qF(), opa));
          const parsedUri = parsePlanUriString(existingPlanUri);
          todoFileService.discardPlanModel(parsedUri);
        } catch (error) {
          console.error("[CreatePlanToolCallHandler] Failed to discard streamed plan model after error:", error);
        }
      }

      toolFormer.setBubbleData(bubbleId, {
        status: "error",
        additionalData: { status: "error" },
      });

      toolFormer.handleToolResult(
        new QR({
          tool: on.CREATE_PLAN,
          toolCallId: callId,
          error: {
            clientVisibleErrorMessage: "Plan creation failed",
            modelVisibleErrorMessage: `Plan creation failed: ${errorValue.error}`,
            actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: errorValue.error,
          },
        }),
        callId,
        true
      );
    }
  }
};

// --- Symbol Map ---
// ISf  → CreatePlanToolCallHandler
// zKe  → CreatePlanParams
// QB   → TodoItem
// Wbt  → CreatePlanResult
// QR   → ToolResult
// on.CREATE_PLAN → ToolType.CREATE_PLAN
// CV   → IPlanFileService / ITodoFileService
// sw   → IComposerFocusService
// Rl   → IExperimentService
// JEe  → IPlanReviewService
// BA.REQUESTED → ReviewStatus.REQUESTED
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// opa  → planUriUtils module
// qF   → planUriUtils loader
