/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/askQuestionQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
V9(), Z8o(), Gk(), Z8o(), Ov(), Jg(), dp(), ov(), $d(), RSf();

// --- ToolCallRejectedError ---
LSf = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ToolCallRejectedError";
  }
};

// Shared result cache for ask_question answers across handler/query paths
const askQuestionResultCache = new Map; // Cqe

// --- AskQuestionQueryHandler ---
// Handles the server-initiated ask_question query (InteractionQuery).
// Manages pending user decisions, analytics, and generating state.
const AskQuestionQueryHandler = class { // Qhu
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

  getAnalyticsService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(mh) // IAnalyticsService
    );
  }

  async handleAskQuestionRequest(request) {
    const toolFormer = this.getToolFormer();
    const composerId = this.context.composerDataHandle.data.composerId;
    const args = request.args;
    const toolCallId = request.toolCallId;
    const isRunAsync = args?.runAsync ?? false;

    const params = new ske({ // AskQuestionParams
      title: args?.title ?? "",
      questions: (args?.questions ?? []).map(q => ({
        id: q.id,
        prompt: q.prompt,
        allowMultiple: q.allowMultiple ?? false,
        options: q.options.map(opt => ({
          id: opt.id,
          label: opt.label,
        })),
      })),
      runAsync: isRunAsync,
    });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId: toolCallId,
      toolIndex: 0,
      modelCallId: "",
      toolCallType: on.ASK_QUESTION, // ToolType.ASK_QUESTION
      name: "ask_question",
      params: { case: "askQuestionParams", value: params },
    });

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    const existingStatus = bubbleData?.additionalData && "status" in bubbleData.additionalData
      ? bubbleData.additionalData.status
      : undefined;

    // Set bubble to loading state
    if (existingStatus !== "submitted") {
      toolFormer.setBubbleData(bubbleId, {
        params,
        status: "loading",
        additionalData: { status: "pending" },
      });
    } else {
      toolFormer.setBubbleData(bubbleId, {
        params,
        status: "loading",
      });
    }

    // If async mode, return immediately
    if (isRunAsync) {
      return new ftt({ // AskQuestionRequestResponse
        result: new ake({ // AskQuestionRequestResult
          result: { case: "async", value: new MMc }, // AskQuestionAsync
        }),
      });
    }

    // Track trajectory stopped for user approval
    this.context.trackTrajectoryStopped?.({
      composerId,
      invocationID: this.context.generationUUID,
      toolCallId: toolCallId,
      stop_category: "needs_user_approval",
      stop_source: "other",
      reason_code: "questionnaire.needs_input",
    });

    // If already handled this tool call, return cached result
    if (this.handledToolCalls.has(toolCallId)) {
      const cachedResult = askQuestionResultCache.get(toolCallId);
      return this.convertToAgentResult(cachedResult);
    }

    // If already submitted, return cached result
    if (existingStatus === "submitted") {
      const cachedResult = askQuestionResultCache.get(toolCallId);
      if (cachedResult) {
        this.handledToolCalls.add(toolCallId);
        return this.convertToAgentResult(cachedResult);
      }
      console.warn("[AskQuestionQueryHandler] Status is submitted but result was lost, returning empty result");
      this.handledToolCalls.add(toolCallId);
      return this.convertToAgentResult(new jY({ answers: [] })); // AskQuestionResult
    }

    // If cancelled, return rejected
    if (existingStatus === "cancelled") {
      this.handledToolCalls.add(toolCallId);
      return new ftt({
        result: new ake({
          result: {
            case: "rejected",
            value: new Y8o({ reason: "User cancelled questionnaire" }), // AskQuestionRejected
          },
        }),
      });
    }

    // Wait for user interaction via pending decision
    this.handledToolCalls.add(toolCallId);
    toolFormer.setBubbleData(bubbleId, {
      params,
      status: "completed",
      additionalData: { status: "pending" },
    });

    this.setGeneratingState(composerId, false);

    return new Promise((resolve, reject) => {
      let resolved = false;

      const rejectWithReason = (reason) => {
        if (resolved) return;
        resolved = true;
        this.trackAnalytics(composerId, params, false, false);
        this.setGeneratingState(composerId, true);
        resolve(new ftt({
          result: new ake({
            result: {
              case: "rejected",
              value: new Y8o({ reason }),
            },
          }),
        }));
      };

      toolFormer.addPendingDecision(
        bubbleId,
        on.ASK_QUESTION,
        toolCallId,
        (accepted) => {
          if (resolved) return;

          if (!accepted) {
            // User cancelled
            rejectWithReason("User cancelled questionnaire");
            toolFormer.setBubbleData(bubbleId, {
              additionalData: { status: "cancelled" },
            });
            this.handledToolCalls.delete(toolCallId);
            askQuestionResultCache.delete(toolCallId);
            return;
          }

          // User accepted — retrieve cached result
          const result = askQuestionResultCache.get(toolCallId);
          if (!result) {
            console.error("[AskQuestionQueryHandler] Accepted but no result was stored");
            rejectWithReason("Questionnaire was accepted but no result was available");
            toolFormer.setBubbleData(bubbleId, { status: "error" });
            this.handledToolCalls.delete(toolCallId);
            return;
          }

          // Check if all questions were answered
          const allAnswered = params.questions?.every(q =>
            (result.answers?.find(a => a.questionId === q.id)?.selectedOptionIds?.length ?? 0) > 0
          ) ?? false;

          resolved = true;
          this.trackAnalytics(composerId, params, true, allAnswered);
          this.setGeneratingState(composerId, true);
          this.handledToolCalls.delete(toolCallId);
          askQuestionResultCache.delete(toolCallId);
          resolve(this.convertToAgentResult(result));
        },
        true // requiresApproval
      );
    });
  }

  convertToAgentResult(result) {
    if (!result || result.answers.length === 0) {
      return new ftt({
        result: new ake({
          result: {
            case: "success",
            value: new n8n({ answers: [] }), // AskQuestionSuccess
          },
        }),
      });
    }

    return new ftt({
      result: new ake({
        result: {
          case: "success",
          value: new n8n({
            answers: result.answers.map(answer =>
              new K8o({ // AskQuestionSuccess_Answer
                questionId: answer.questionId,
                selectedOptionIds: answer.selectedOptionIds,
                freeformText: answer.freeformText,
              })
            ),
          }),
        },
      }),
    });
  }

  trackAnalytics(composerId, params, submitted, allQuestionsAnswered) {
    try {
      const composerData = this.getComposerDataService().getComposerData(
        this.context.composerDataHandle
      );
      this.getAnalyticsService().trackEvent("ask_question_invoked", {
        number_of_questions: params?.questions?.length ?? 0,
        submitted,
        all_questions_answered: allQuestionsAnswered,
        model: composerData?.modelConfig?.modelName,
      });
    } catch { /* ignore tracking errors */ }
  }

  getLastAiBubbleId(composerId) {
    const composerData = this.getComposerDataService().getComposerData(
      this.context.composerDataHandle
    );
    if (composerData) {
      return [...composerData.fullConversationHeadersOnly ?? []]
        .reverse()
        .find(header => header.type === ul.AI)?.bubbleId; // BubbleType.AI
    }
  }

  setGeneratingState(composerId, isGenerating) {
    const lastAiBubbleId = this.getLastAiBubbleId(composerId);
    if (!lastAiBubbleId) return;

    const composerDataService = this.getComposerDataService();
    const generatingBubbleIds =
      composerDataService.getComposerData(this.context.composerDataHandle)
        ?.generatingBubbleIds ?? [];
    const isAlreadyGenerating = generatingBubbleIds.includes(lastAiBubbleId);

    if (isGenerating && !isAlreadyGenerating) {
      composerDataService.updateComposerData(this.context.composerDataHandle, {
        generatingBubbleIds: [...generatingBubbleIds, lastAiBubbleId],
      });
    } else if (!isGenerating && isAlreadyGenerating) {
      composerDataService.updateComposerData(this.context.composerDataHandle, {
        generatingBubbleIds: generatingBubbleIds.filter(id => id !== lastAiBubbleId),
      });
    }

    composerDataService.updateComposerDataSetStore(
      this.context.composerDataHandle,
      setter => setter("status", isGenerating ? "generating" : "completed")
    );
  }
};

// --- Symbol Map ---
// Qhu  -> AskQuestionQueryHandler
// LSf  -> ToolCallRejectedError
// Cqe  -> askQuestionResultCache (shared Map)
// ftt  -> AskQuestionRequestResponse
// ake  -> AskQuestionRequestResult
// n8n  -> AskQuestionSuccess
// K8o  -> AskQuestionSuccess_Answer
// Y8o  -> AskQuestionRejected
// MMc  -> AskQuestionAsync
// ske  -> AskQuestionParams
// jY   -> AskQuestionResult
// Fa   -> IComposerDataService
// mh   -> IAnalyticsService
// ul.AI -> BubbleType.AI
// on.ASK_QUESTION -> ToolType.ASK_QUESTION
// ko.TOOL_FORMER -> CapabilityType.TOOL_FORMER
