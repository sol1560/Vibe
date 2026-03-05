/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/askQuestion/askQuestionToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Ov(), Jg();

// --- AskQuestionToolCallHandler ---
// Handles the ask_question tool call from the agent.
// Manages interactive questionnaires presented to the user.
const AskQuestionToolCallHandler = class { // Ghu
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

  async handlePartialToolCall(toolCall, callId) {
    const askQuestionCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();

    if (askQuestionCall.args) {
      const args = askQuestionCall.args;
      const title = args?.title || "";
      const questions = args?.questions || [];

      // Get or create bubble
      let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      if (!bubbleId) {
        bubbleId = toolFormer.getOrCreateBubbleId({
          toolCallId: callId,
          toolIndex: 0,
          modelCallId: "",
          toolCallType: on.ASK_QUESTION, // ToolType.ASK_QUESTION
          name: "ask_question",
          params: void 0,
          toolCall,
        });
      }

      // Stream questions incrementally
      const bubbleData = toolFormer.getBubbleData(bubbleId);
      const existingQuestionCount = bubbleData?.params?.questions?.length ?? 0;
      const startIndex = Math.max(0, Math.min(existingQuestionCount, questions.length));

      for (let i = startIndex; i < questions.length; i++) {
        const partialQuestions = questions.slice(0, i + 1);
        const params = new ske({ // AskQuestionParams
          title,
          questions: partialQuestions.map(q => ({
            id: q.id,
            prompt: q.prompt,
            allowMultiple: q.allowMultiple ?? false,
            options: q.options.map(opt => ({
              id: opt.id,
              label: opt.label,
            })),
          })),
        });
        toolFormer.setBubbleData(bubbleId, { params });
      }

      // Update with runAsync flag
      const isRunAsync = args?.runAsync ?? false;
      const wasRunAsync = bubbleData?.params?.runAsync ?? false;
      const runAsync = isRunAsync || wasRunAsync;

      const finalParams = new ske({
        title,
        questions: questions.map(q => ({
          id: q.id,
          prompt: q.prompt,
          allowMultiple: q.allowMultiple ?? false,
          options: q.options.map(opt => ({
            id: opt.id,
            label: opt.label,
          })),
        })),
        runAsync,
      });
      toolFormer.setBubbleData(bubbleId, { params: finalParams });

    } else {
      // No args yet — just create the bubble placeholder
      toolFormer.getOrCreateBubbleId({
        toolCallId: callId,
        toolIndex: 0,
        modelCallId: "",
        toolCallType: on.ASK_QUESTION,
        name: "ask_question",
        params: void 0,
        toolCall,
      });
    }
  }

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    // No streaming deltas for ask_question
  }

  async handleToolCallStarted(toolCall, callId) {
    const askQuestionCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const args = askQuestionCall.args;
    const title = args?.title || "";
    const questions = args?.questions || [];
    const runAsync = args?.runAsync ?? false;
    const asyncOriginalToolCallId = args?.asyncOriginalToolCallId;

    const params = new ske({
      title,
      questions: questions.map(q => ({
        id: q.id,
        prompt: q.prompt,
        allowMultiple: q.allowMultiple ?? false,
        options: q.options.map(opt => ({
          id: opt.id,
          label: opt.label,
        })),
      })),
      runAsync,
    });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId: callId,
      toolIndex: 0,
      modelCallId: "",
      toolCallType: on.ASK_QUESTION,
      name: "ask_question",
      params: { case: "askQuestionParams", value: params },
      toolCall,
    });

    // If result is already available (not async)
    if (askQuestionCall.result &&
        askQuestionCall.result.result.case !== undefined &&
        askQuestionCall.result.result.case !== "async" &&
        askQuestionCall.result) {

      const { AskQuestionResult, AskQuestionResult_Answer } = await Promise.resolve().then(
        () => (Jg(), JRc) // askQuestion protobuf module
      );

      let result;
      if (askQuestionCall.result.result.case === "success") {
        result = new AskQuestionResult({
          answers: askQuestionCall.result.result.value.answers.map(
            answer => new AskQuestionResult_Answer({
              questionId: answer.questionId,
              selectedOptionIds: answer.selectedOptionIds,
              freeformText: answer.freeformText,
            })
          ),
        });
      }

      toolFormer.setBubbleData(bubbleId, {
        params,
        result,
        additionalData: { status: "submitted" },
      });

      // Link async answer bubble to original
      if (asyncOriginalToolCallId) {
        const originalBubbleId = toolFormer.getBubbleIdByToolCallId(asyncOriginalToolCallId);
        if (originalBubbleId) {
          const originalData = toolFormer.getBubbleData(originalBubbleId);
          toolFormer.setBubbleData(originalBubbleId, {
            additionalData: {
              ...originalData?.additionalData,
              answerBubbleId: bubbleId,
            },
          });
        }
      }

      return;
    }

    // Set bubble data (waiting for user interaction)
    toolFormer.setBubbleData(bubbleId, { params });
  }

  async handleToolCallCompleted(toolCall, callId) {
    const askQuestionCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const bubbleId = toolFormer.getBubbleIdByToolCallId(callId);

    if (!bubbleId) return;

    const resultCase = askQuestionCall.result?.result;
    if (resultCase?.case === undefined) return;

    let result;
    let status = "submitted";

    switch (resultCase.case) {
      case "success": {
        result = new jY({ // AskQuestionResult
          answers: resultCase.value.answers.map(answer => ({
            questionId: answer.questionId,
            selectedOptionIds: answer.selectedOptionIds,
            freeformText: answer.freeformText,
          })),
        });
        break;
      }
      case "async": {
        result = new jY({ isAsync: true });
        status = "pending";
        break;
      }
      case "rejected": {
        result = new jY({ answers: [] });
        status = "cancelled";
        break;
      }
      case "error": {
        toolFormer.setBubbleData(bubbleId, {
          status: "error",
          additionalData: { status: "error" },
        });
        return;
      }
      default:
        return resultCase;
    }

    toolFormer.setBubbleData(bubbleId, {
      status: "completed",
      result,
      additionalData: { status },
    });
  }
};

// --- Symbol Map ---
// Ghu  → AskQuestionToolCallHandler
// ske  → AskQuestionParams
// jY   → AskQuestionResult
// JRc  → askQuestion protobuf module
// on.ASK_QUESTION → ToolType.ASK_QUESTION
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
