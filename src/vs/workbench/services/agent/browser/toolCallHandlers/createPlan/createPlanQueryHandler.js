/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/createPlan/createPlanQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
UJ(), nP(), qF(), Ov(), Xda(), Yu();

// --- CreatePlanQueryHandler ---
// Handles the server-initiated create_plan query (InteractionQuery).
// Creates plan files as fallback when the tool call path doesn't handle it.
const CreatePlanQueryHandler = class { // DSf
  constructor(context) {
    this.context = context;
  }

  shouldAutoOpenPlanEditor(composerId) {
    const composerFocusService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(sw) // IComposerFocusService
    );
    return composerFocusService.isFocused(composerId) ||
      composerFocusService.isPrevBubbleFocused(composerId);
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  isMultiPlanEnabled() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Rl) // IExperimentService
    ).checkFeatureGate("file_based_plan_edits") === true;
  }

  async handleCreatePlanRequest(request) {
    const planFileService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(CV) // IPlanFileService
    );
    const composerId = this.context.composerDataHandle.data.composerId;
    const toolCallId = request.toolCallId;
    const args = request.args;
    const isMultiPlan = this.isMultiPlanEnabled();
    const toolFormer = this.getToolFormer();

    const bubbleId = toolFormer.getBubbleIdByToolCallId(toolCallId);
    const bubbleData = bubbleId ? toolFormer.getBubbleData(bubbleId) : undefined;
    const existingPlanUri = bubbleData?.additionalData?.planUri;

    let planFilePath;

    if (existingPlanUri) {
      // Plan URI already exists — use it
      planFilePath = lEe(existingPlanUri).fsPath; // URI.parse
    } else {
      try {
        const planName = args?.name || undefined;
        const overview = args?.overview || "";
        const todos = args?.todos?.map(todo => ({
          id: todo.id || "",
          content: todo.content,
          status: "pending",
          dependencies: [],
        })) || [];

        let fileUri;
        if (isMultiPlan) {
          const title = planName ?? planFileService.getPlanTitle(args?.plan ?? "");
          fileUri = await planFileService.createPlanFile(
            composerId, title, overview, todos, args?.plan ?? ""
          );
        } else {
          fileUri = await planFileService.getOrCreatePlanFile(
            composerId, planName, overview, todos, args?.plan ?? ""
          );
        }

        planFilePath = fileUri.fsPath;

        // Auto-open plan editor if focused
        if (this.shouldAutoOpenPlanEditor(composerId)) {
          await planFileService.openPlanInEditor(fileUri, {
            stealFocus: false,
            composerId,
          });
        }

        // Update bubble data with plan URI
        if (bubbleId) {
          toolFormer.setBubbleData(bubbleId, {
            additionalData: {
              ...bubbleData?.additionalData,
              planUri: fileUri.toString(),
              hasOpenedEditor: true,
            },
          });
        }
      } catch (error) {
        console.error("[CreatePlanQueryHandler] Failed to create plan file in fallback path:", error);
      }
    }

    return new Zda({ // CreatePlanRequestResponse
      result: new Yda({ // CreatePlanRequestResult
        result: { case: "success", value: new Kzl }, // CreatePlanSuccess
        planUri: planFilePath ?? "",
      }),
    });
  }
};

// --- Symbol Map ---
// DSf  → CreatePlanQueryHandler
// Zda  → CreatePlanRequestResponse
// Yda  → CreatePlanRequestResult
// Kzl  → CreatePlanSuccess
// CV   → IPlanFileService
// sw   → IComposerFocusService
// Rl   → IExperimentService
// lEe  → URI.parse
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
