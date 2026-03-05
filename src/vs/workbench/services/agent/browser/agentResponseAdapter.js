/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/agentResponseAdapter.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *  Brand references: cursor- → claude-
 *--------------------------------------------------------------------------------------------*/

// Module dependencies (runtime imports)
skt(), V9(), fVl(), IC(), Di(), Gk(), ov(), Jp(), Ov(), vr(), Tye(), Nc(), Mc(), Xn(), oy(),
Jhn(), RNe(), Iie(), zk(), dp(), kQ(), nP(), J_a(), $d(), Fce(), gCf(), Bty(), xhu();

// --- Constants ---
const STREAM_CHUNK_DELAY = 200;   // $Sf — ms between streaming word chunks
const CHUNK_SIZE = 16;            // qSf — number of characters per chunk

// --- ThinkingWordStreamer ---
// Buffers thinking text and streams it word-by-word with timing animation
const ThinkingWordStreamer = class {
  constructor(onChunk) {
    this.onChunk = onChunk;
    this.timer = new boe;        // IntervalTimer
    this.queue = [];
    this.currentChunks = [];
    this.currentChunkIndex = 0;
    this.isDisposed = false;
  }

  enqueue(text) {
    if (this.isDisposed) return;
    // If still streaming previous chunks, flush them first
    if (this.currentChunks.length > 0 && this.currentChunkIndex < this.currentChunks.length) {
      this.flushCurrentChunks();
    }
    this.queue.push(text);
    if (this.currentChunks.length === 0 || this.currentChunkIndex >= this.currentChunks.length) {
      this.startNextSummary();
    }
  }

  flush() {
    this.timer.cancel();
    this.flushCurrentChunks();
    while (this.queue.length > 0) {
      const text = this.queue.shift();
      this.onChunk(text);
    }
  }

  flushCurrentChunks() {
    while (this.currentChunkIndex < this.currentChunks.length) {
      this.onChunk(this.currentChunks[this.currentChunkIndex]);
      this.currentChunkIndex++;
    }
    this.currentChunks = [];
    this.currentChunkIndex = 0;
  }

  startNextSummary() {
    if (this.queue.length === 0) {
      this.timer.cancel();
      this.currentChunks = [];
      this.currentChunkIndex = 0;
      return;
    }

    const text = this.queue.shift();
    this.currentChunks = Rty(text, CHUNK_SIZE); // splitIntoChunks(text, chunkSize)
    this.currentChunkIndex = 0;

    if (this.currentChunks.length === 0) {
      this.startNextSummary();
      return;
    }

    const interval = STREAM_CHUNK_DELAY / Math.max(this.currentChunks.length, 1);
    this.timer.cancelAndSet(() => {
      if (this.isDisposed) return;

      if (this.currentChunkIndex < this.currentChunks.length) {
        this.onChunk(this.currentChunks[this.currentChunkIndex]);
        this.currentChunkIndex++;
        // If there are queued items and we haven't finished current, flush and move on
        if (this.queue.length > 0 && this.currentChunkIndex < this.currentChunks.length) {
          this.flushCurrentChunks();
          this.startNextSummary();
          return;
        }
      }
      if (this.currentChunkIndex >= this.currentChunks.length) {
        this.startNextSummary();
      }
    }, interval);
  }

  dispose() {
    this.isDisposed = true;
    this.timer.dispose();
    this.queue.length = 0;
    this.currentChunks = [];
    this.currentChunkIndex = 0;
  }
};

// --- AgentResponseAdapter ---
// Main class: handles all streaming response types from the agent backend,
// converts them into UI bubble updates in the composer conversation.
const AgentResponseAdapter = class {
  constructor(
    instantiationService,      // IInstantiationService
    composerDataHandle,        // IComposerDataHandle
    conversationActionManager, // IConversationActionManager
    generationUUID,            // string | undefined
    hooks                      // optional callback hooks
  ) {
    this.instantiationService = instantiationService;
    this.composerDataHandle = composerDataHandle;
    this.conversationActionManager = conversationActionManager;
    this.generationUUID = generationUUID;
    this.hasReceivedFirstToken = false;
    this.toolCallIdToBubbleId = new Map();
    this.unfinishedToolCallIds = new Set();
    this.postTurnEndedWorkQueue = [];

    this.hooks = hooks ?? {};
    this.asyncOperationRegistry = instantiationService.invokeFunction(
      accessor => accessor.get(Wtt) // IAsyncOperationRegistry
    );

    // Initialize tool call handler context
    const handlerContext = {
      instantiationService,
      composerDataHandle,
      conversationActionManager
    };

    // Tool call handlers — each handles a specific tool type
    this.shellToolCallHandler = new ShellToolCallHandler(handlerContext);         // rSf
    this.editToolCallHandler = new EditToolCallHandler(handlerContext);           // sSf
    this.todoToolCallHandler = new TodoToolCallHandler(handlerContext);           // oSf
    this.taskToolCallHandler = new TaskToolCallHandler(handlerContext);           // TSf
    this.createPlanToolCallHandler = new CreatePlanToolCallHandler(handlerContext); // ISf
    this.askQuestionToolCallHandler = new AskQuestionToolCallHandler(handlerContext); // Ghu

    // Query handlers — handle interactive queries from the agent
    this.askQuestionQueryHandler = new AskQuestionQueryHandler({
      instantiationService,
      composerDataHandle,
      conversationActionManager,
      generationUUID,
      trackTrajectoryStopped: reason => this.trackTrajectoryStopped(reason)
    }); // Qhu

    this.switchModeQueryHandler = new SwitchModeQueryHandler({
      instantiationService,
      composerDataHandle,
      conversationActionManager,
      generationUUID,
      trackTrajectoryStopped: reason => this.trackTrajectoryStopped(reason)
    }); // MSf

    this.mcpAuthQueryHandler = new McpAuthQueryHandler({
      instantiationService,
      composerDataHandle,
      conversationActionManager,
      generationUUID,
      trackTrajectoryStopped: reason => this.trackTrajectoryStopped(reason)
    }); // USf

    this.webSearchQueryHandler = new WebSearchQueryHandler({
      instantiationService,
      composerDataHandle,
      generationUUID,
      trackTrajectoryStopped: reason => this.trackTrajectoryStopped(reason)
    }); // FSf

    this.webFetchQueryHandler = new WebFetchQueryHandler({
      instantiationService,
      composerDataHandle,
      generationUUID,
      trackTrajectoryStopped: reason => this.trackTrajectoryStopped(reason)
    }); // OSf

    this.createPlanQueryHandler = new CreatePlanQueryHandler({
      instantiationService,
      composerDataHandle
    }); // DSf

    // Map of special tool names to their handlers
    this.specialToolHandlers = new Map();
    this.specialToolHandlers.set("editToolCall", this.editToolCallHandler);
    this.specialToolHandlers.set("updateTodosToolCall", this.todoToolCallHandler);
    this.specialToolHandlers.set("shellToolCall", this.shellToolCallHandler);
    this.specialToolHandlers.set("createPlanToolCall", this.createPlanToolCallHandler);
    this.specialToolHandlers.set("taskToolCall", this.taskToolCallHandler);
    this.specialToolHandlers.set("askQuestionToolCall", this.askQuestionToolCallHandler);
  }

  // --- Capability Access ---

  getToolFormer() {
    const toolFormer = this.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER // CapabilityType.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  // --- Telemetry ---

  trackTrajectoryStopped(reason) {
    try {
      this.instantiationService.invokeFunction(
        accessor => accessor.get(mh) // ITelemetryService
      ).trackEvent("composer.agent_trajectory_stopped", reason);
    } catch { }
  }

  // --- Hook Notifications ---

  notifyFirstTokenIfNeeded() {
    if (!this.hasReceivedFirstToken) {
      this.hasReceivedFirstToken = true;
      this.hooks.onFirstToken?.();
    }
  }

  notifyBeforeUpdate() {
    if (this.hasReceivedFirstToken) {
      this.hooks.onBeforeNextUpdate?.();
    }
  }

  notifyAfterUpdate() {
    this.hooks.onAfterUpdate?.();
  }

  // --- Tool Call Bubble Management ---

  getExistingToolFormerBubbleId(toolCallId) {
    const cachedId = this.toolCallIdToBubbleId.get(toolCallId);
    if (cachedId !== undefined) return cachedId;

    const conversation = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    ).getLoadedConversation(this.composerDataHandle);

    for (const bubble of conversation) {
      if (bubble.toolFormerData?.toolCallId === toolCallId) {
        this.toolCallIdToBubbleId.set(toolCallId, bubble.bubbleId);
        return bubble.bubbleId;
      }
    }
  }

  upsertToolFormerBubbleData(bubbleId, toolFormerData) {
    this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    ).updateComposerBubbleSetStore(this.composerDataHandle, bubbleId, setter => {
      setter("toolFormerData", existing => {
        const additionalData = toolFormerData.additionalData ?? existing?.additionalData;
        const attachments = toolFormerData.attachments ?? existing?.attachments;
        const params = toolFormerData.params ?? existing?.params;
        const result = toolFormerData.result ?? existing?.result;
        const userDecision = toolFormerData.userDecision ?? existing?.userDecision;
        return {
          ...toolFormerData,
          params,
          result,
          additionalData,
          attachments,
          userDecision
        };
      });
    });
    this.toolCallIdToBubbleId.set(toolFormerData.toolCallId, bubbleId);
  }

  getOrCreateToolFormerBubbleId(toolFormerData) {
    const existingId = this.getExistingToolFormerBubbleId(toolFormerData.toolCallId);
    if (existingId !== undefined) return existingId;

    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );

    const newBubble = {
      ...d_(),               // createBubble() — generates bubbleId etc.
      codeBlocks: [],
      type: ul.AI,           // BubbleType.AI
      text: "",
      capabilityType: ko.TOOL_FORMER, // CapabilityType.TOOL_FORMER
      toolFormerData
    };
    const bubbleId = newBubble.bubbleId;

    Hw(() => { // runInAction / batch
      composerDataService.appendComposerBubbles(this.composerDataHandle, [newBubble]);
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("generatingBubbleIds", [])
      );
    });

    this.instantiationService.invokeFunction(accessor => {
      accessor.get(Ypn) // IToolFormerSignalService
        .signalBubbleCreated(this.composerDataHandle.data.composerId, toolFormerData.toolCallId);
    });

    this.toolCallIdToBubbleId.set(toolFormerData.toolCallId, bubbleId);
    return bubbleId;
  }

  // --- Tool Call Lifecycle ---

  markToolCallAsUnfinished(callId) {
    this.unfinishedToolCallIds.add(callId);
  }

  markToolCallAsFinished(callId) {
    this.unfinishedToolCallIds.delete(callId);
  }

  addToolCallSizeBreadcrumbData(breadcrumbData, toolCall) {
    switch (toolCall.tool.case) {
      case "readToolCall": {
        const readResult = toolCall.tool.value.result?.result;
        if (readResult?.case === "success") {
          const output = readResult.value.output;
          if (output?.case === "content") {
            breadcrumbData.charsRead = output.value.length;
          }
          if (readResult.value.fileSize !== undefined) {
            breadcrumbData.fileSize = Number(readResult.value.fileSize);
          }
          breadcrumbData.totalLines = readResult.value.totalLines;
        }
        break;
      }
      case "editToolCall": {
        const editResult = toolCall.tool.value.result?.result;
        if (editResult?.case === "success") {
          if (editResult.value.beforeFullFileContent !== undefined) {
            breadcrumbData.beforeChars = editResult.value.beforeFullFileContent.length;
          }
          if (editResult.value.afterFullFileContent !== undefined) {
            breadcrumbData.afterChars = editResult.value.afterFullFileContent.length;
          }
        }
        break;
      }
      default:
        break;
    }
  }

  cancelUnfinishedToolCalls() {
    if (this.unfinishedToolCallIds.size === 0) return;
    const toolFormer = this.getToolFormer();

    for (const callId of Array.from(this.unfinishedToolCallIds)) {
      const bubbleId = this.getExistingToolFormerBubbleId(callId);
      if (!bubbleId) {
        this.unfinishedToolCallIds.delete(callId);
        continue;
      }
      const bubbleData = toolFormer.getBubbleData(bubbleId);
      if (!bubbleData) {
        this.unfinishedToolCallIds.delete(callId);
        continue;
      }
      if (bubbleData.status !== "loading") {
        this.unfinishedToolCallIds.delete(callId);
        continue;
      }

      const additionalData = bubbleData.additionalData;
      let cancelledData;
      if (additionalData && typeof additionalData === "object" && "status" in additionalData) {
        cancelledData = { ...additionalData, status: "cancelled" };
      }
      toolFormer.setBubbleData(bubbleId, {
        status: "cancelled",
        ...(cancelledData ? { additionalData: cancelledData } : {})
      });
      this.unfinishedToolCallIds.delete(callId);
    }
  }

  dispose() {
    this.cancelUnfinishedToolCalls();
    if (this.thinkingWordStreamer) {
      this.thinkingWordStreamer.flush();
      this.thinkingWordStreamer.dispose();
      this.thinkingWordStreamer = undefined;
    }
    this.shellToolCallHandler.dispose();
  }

  // --- Tool Call Delta Handler ---

  async handleToolCallDelta(responseStream, update) {
    const message = update.message;
    if (message.case !== "toolCallDelta") return;

    this.notifyFirstTokenIfNeeded();
    const composerId = this.composerDataHandle.data.composerId;
    const callId = message.value.callId;
    const deltaCase = message.value.toolCallDelta?.delta.case;
    const deltaValue = message.value.toolCallDelta?.delta.value;

    if (deltaCase && deltaValue) {
      const toolName = deltaCase.replace(/Delta$/, '');
      const handler = this.specialToolHandlers.get(toolName);
      if (handler) {
        await asyncOperationHelper(
          this.asyncOperationRegistry,
          composerId,
          "process_tool_call_delta",
          () => handler.handleToolCallDelta(responseStream, deltaValue, callId),
          { lastToolCallId: callId, lastToolName: toolName }
        );
      }
    }
  }

  // --- Partial Tool Call Handler ---

  async handlePartialToolCall(update) {
    const message = update.message;
    if (message.case !== "partialToolCall") return;

    this.notifyFirstTokenIfNeeded();
    const toolCall = message.value.toolCall;
    if (!toolCall) return;

    const toolName = toolCall.tool.case;
    const callId = message.value.callId;
    this.markToolCallAsUnfinished(callId);

    if (!toolName) return;

    const handler = this.specialToolHandlers.get(toolName);
    if (handler) {
      await handler.handlePartialToolCall(toolCall, callId);
      return;
    }

    try {
      const toolFormerData = await createToolFormerData(toolCall, callId, this.instantiationService);
      const bubbleId = this.getOrCreateToolFormerBubbleId(toolFormerData);
      if (bubbleId !== undefined) {
        this.upsertToolFormerBubbleData(bubbleId, toolFormerData);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unsupported tool type")) {
        this.handleTextDelta(`[Tool: ${toolName}]\n`);
        return;
      }
      throw error;
    }
  }

  // --- Tool Call Started Handler ---

  async handleToolCallStarted(update) {
    const message = update.message;
    if (message.case !== "toolCallStarted") return;

    this.notifyFirstTokenIfNeeded();
    const composerId = this.composerDataHandle.data.composerId;
    const toolCall = message.value.toolCall;
    if (!toolCall) return;

    const toolName = toolCall.tool.case;
    const callId = message.value.callId;
    this.markToolCallAsUnfinished(callId);

    if (toolName) {
      await asyncOperationHelper(
        this.asyncOperationRegistry,
        composerId,
        "process_tool_call_started",
        async () => {
          const handler = this.specialToolHandlers.get(toolName);
          if (handler) {
            await handler.handleToolCallStarted(toolCall, callId);
            return;
          }
          try {
            const toolFormerData = await createToolFormerData(toolCall, callId, this.instantiationService);
            const bubbleId = this.getOrCreateToolFormerBubbleId(toolFormerData);
            if (bubbleId !== undefined) {
              this.upsertToolFormerBubbleData(bubbleId, toolFormerData);
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes("Unsupported tool type")) {
              this.handleTextDelta(`[Tool: ${toolName}]\n`);
            } else {
              throw error;
            }
          }
        },
        { lastToolCallId: callId, lastToolName: toolName }
      );
    }
  }

  // --- Tool Call Completed Handler ---

  async handleToolCallCompleted(update) {
    const message = update.message;
    if (message.case !== "toolCallCompleted") return;

    const composerId = this.composerDataHandle.data.composerId;
    const callId = message.value.callId;
    const toolCall = message.value.toolCall;
    if (!toolCall) return;

    const toolName = toolCall.tool.case;
    this.markToolCallAsFinished(callId);

    // Track file deletions
    if (toolName === "deleteToolCall") {
      const deleteCall = toolCall.tool.value;
      const filePath = deleteCall.args?.path;
      const isSuccess = deleteCall.result?.result?.case === "success";
      if (filePath && isSuccess) {
        this.instantiationService.invokeFunction(accessor => {
          const aiDeletedFileService = accessor.get(jz); // IAiDeletedFileService
          const modelName = accessor.get(Fa) // IComposerDataService
            .getComposerData(this.composerDataHandle)?.modelConfig?.modelName;
          aiDeletedFileService.recordAiDeletedFile(filePath, {
            composerId,
            model: modelName
          }).catch(err => {
            console.error("[AgentResponseAdapter] Error recording AI deleted file:", err);
          });
        });
      }
    }

    await asyncOperationHelper(
      this.asyncOperationRegistry,
      composerId,
      "process_tool_call_completed",
      async () => {
        if (toolName) {
          const handler = this.specialToolHandlers.get(toolName);
          if (handler) {
            const executionLocation = this.getToolExecutionLocation(toolName);
            await asyncOperationHelper(
              this.asyncOperationRegistry,
              composerId,
              executionLocation,
              () => handler.handleToolCallCompleted(toolCall, callId),
              { lastToolCallId: callId, lastToolName: toolName }
            );

            // Update the raw tool call data on the bubble
            const toolFormer = this.getToolFormer();
            const bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
            if (bubbleId) {
              toolFormer.setBubbleData(bubbleId, { toolCall });
            }
            return;
          }

          try {
            const toolFormerData = await createToolFormerData(toolCall, callId, this.instantiationService);
            const bubbleId = this.getOrCreateToolFormerBubbleId(toolFormerData);
            if (bubbleId !== undefined) {
              this.upsertToolFormerBubbleData(bubbleId, toolFormerData);
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes("Unsupported tool type")) {
              this.handleTextDelta(`[Tool: ${toolName}]\n`);
              return;
            }
            throw error;
          }
        }
      },
      { lastToolCallId: callId, lastToolName: toolName }
    );
  }

  getToolExecutionLocation(toolName) {
    switch (toolName) {
      case "shellToolCall": return "tool_execution_shell";
      case "editToolCall": return "tool_execution_edit";
      case "taskToolCall": return "tool_execution_task";
      default: return "tool_execution_other";
    }
  }

  // --- Text Delta Handler ---

  handleTextDelta(text) {
    if (text.length === 0) return;
    this.cancelUnfinishedToolCalls();
    this.notifyFirstTokenIfNeeded();

    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const composerData = composerDataService.getComposerData(this.composerDataHandle);
    if (!composerData) return;

    const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
    const isGenerating = lastBubble &&
      composerData.generatingBubbleIds?.includes(lastBubble.bubbleId);

    // Create a new AI bubble if needed
    if (lastBubble?.type !== ul.AI || lastBubble.capabilityType !== undefined || !isGenerating) {
      const newBubble = {
        ...d_(),             // createBubble()
        codeBlocks: [],
        type: ul.AI,         // BubbleType.AI
        text: ""
      };
      Hw(() => { // batch
        composerDataService.appendComposerBubbles(this.composerDataHandle, [newBubble]);
        composerDataService.updateComposerDataSetStore(
          this.composerDataHandle,
          setter => setter("generatingBubbleIds", [newBubble.bubbleId])
        );
      });
    }

    const lastAiBubble = composerDataService.getLastAiBubble(this.composerDataHandle);
    if (!lastAiBubble) return;

    const updatedText = lastAiBubble.text + text;
    composerDataService.updateComposerDataSetStore(
      this.composerDataHandle,
      setter => setter("conversationMap", lastAiBubble.bubbleId, "text", updatedText)
    );
  }

  // --- Thinking Delta Handler ---

  appendThinkingText(text) {
    const thinkingBubbleId = this.currentThinkingBubbleId;
    if (!thinkingBubbleId) return;

    this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    ).updateComposerDataSetStore(
      this.composerDataHandle,
      setter => setter("conversationMap", thinkingBubbleId, "thinking", existing => ({
        text: (existing?.text ?? "") + text,
        signature: existing?.signature ?? ""
      }))
    );
  }

  handleThinkingDelta(text, thinkingStyle) {
    const isEmpty = text.length === 0;
    this.cancelUnfinishedToolCalls();
    this.notifyFirstTokenIfNeeded();

    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    if (!composerDataService.getComposerData(this.composerDataHandle)) return;

    const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
    const isThinkingBubble = lastBubble?.capabilityType === ko.THINKING; // CapabilityType.THINKING

    let thinkingBubbleId;
    if (isThinkingBubble) {
      thinkingBubbleId = lastBubble.bubbleId;
    } else {
      // Flush any existing thinking streamer before creating a new bubble
      if (this.thinkingWordStreamer) {
        this.thinkingWordStreamer.flush();
      }
      const newBubble = {
        ...d_(),                          // createBubble()
        type: ul.AI,                      // BubbleType.AI
        text: "",
        capabilityType: ko.THINKING       // CapabilityType.THINKING
      };
      thinkingBubbleId = newBubble.bubbleId;
      Hw(() => { // batch
        composerDataService.appendComposerBubbles(this.composerDataHandle, [newBubble]);
        composerDataService.updateComposerDataSetStore(
          this.composerDataHandle,
          setter => setter("generatingBubbleIds", [newBubble.bubbleId])
        );
      });
    }

    this.currentThinkingBubbleId = thinkingBubbleId;

    const convertedStyle = this.convertAgentThinkingStyleToConversationThinkingStyle(thinkingStyle);
    composerDataService.updateComposerDataSetStore(
      this.composerDataHandle,
      setter => setter("conversationMap", thinkingBubbleId, "thinkingStyle", existing => existing ?? convertedStyle)
    );

    if (isEmpty) {
      // Empty text just ensures the bubble exists with proper style
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("conversationMap", thinkingBubbleId, "thinking", existing => ({
          text: existing?.text ?? "",
          signature: existing?.signature ?? ""
        }))
      );
    } else {
      // Stream thinking text word by word
      if (!this.thinkingWordStreamer) {
        this.thinkingWordStreamer = new ThinkingWordStreamer(
          chunk => this.appendThinkingText(chunk)
        );
      }
      this.thinkingWordStreamer.enqueue(text);
    }
  }

  convertAgentThinkingStyleToConversationThinkingStyle(agentStyle) {
    switch (agentStyle) {
      case 2: return lke.CODEX;    // ThinkingStyle.CODEX
      case 3: return lke.GPT5;     // ThinkingStyle.GPT5
      case 1:
      case 0:
      case undefined:
      default: return lke.DEFAULT; // ThinkingStyle.DEFAULT
    }
  }

  // --- After Model Thought Hook ---

  emitAfterModelThought(bubbleId, durationMs) {
    const hooksService = this.instantiationService.invokeFunction(
      accessor => accessor.get(uX) // IHooksService
    );
    if (!hooksService.hasHookForStep(mf.afterAgentThought)) return;

    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const composerData = composerDataService.getComposerData(this.composerDataHandle);
    const generationId = composerData?.latestChatGenerationUUID ??
      composerData?.chatGenerationUUID ?? "";
    const bubble = composerDataService.getComposerBubble(this.composerDataHandle, bubbleId);
    const thinkingText = bubble?.thinking?.text ?? "";

    if (bubble?.thinkingDurationMs === undefined) {
      hooksService.executeHookForStep(mf.afterAgentThought, {
        conversation_id: this.composerDataHandle.data.composerId,
        generation_id: generationId,
        text: thinkingText,
        duration_ms: durationMs,
        model: composerData?.modelConfig?.modelName ?? ""
      }).catch(err => {
        console.error("[composer] error executing afterAgentThought hook", err);
      });
    }
  }

  // --- Thinking Completed Handler ---

  handleThinkingCompleted(update) {
    const message = update.message;
    if (message.case !== "thinkingCompleted") return;

    if (this.thinkingWordStreamer) {
      this.thinkingWordStreamer.flush();
    }

    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
    if (lastBubble?.capabilityType !== ko.THINKING) return;

    const thinkingBubbleId = lastBubble.bubbleId;
    const thinkingDurationMs = message.value.thinkingDurationMs;

    this.emitAfterModelThought(thinkingBubbleId, thinkingDurationMs);

    Hw(() => { // batch
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("conversationMap", thinkingBubbleId, "thinkingDurationMs", thinkingDurationMs)
      );
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("generatingBubbleIds", [])
      );
    });
  }

  // --- Summary Handlers ---

  handleSummaryStarted() {
    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    if (!composerDataService.getComposerData(this.composerDataHandle)) return;

    const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
    if (lastBubble?.capabilityType === ko.SUMMARIZATION) {
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("generatingBubbleIds", [lastBubble.bubbleId])
      );
      return;
    }

    const newBubble = {
      ...d_(),                              // createBubble()
      type: ul.AI,                          // BubbleType.AI
      text: "",
      capabilityType: ko.SUMMARIZATION      // CapabilityType.SUMMARIZATION
    };
    Hw(() => { // batch
      composerDataService.appendComposerBubbles(this.composerDataHandle, [newBubble]);
      composerDataService.updateComposerDataSetStore(
        this.composerDataHandle,
        setter => setter("generatingBubbleIds", [newBubble.bubbleId])
      );
    });
  }

  handleSummaryCompleted(summaryText) {
    const composerDataService = this.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
    if (lastBubble?.capabilityType !== ko.SUMMARIZATION) return;

    if (summaryText) {
      composerDataService.updateComposerBubble(
        this.composerDataHandle,
        lastBubble.bubbleId,
        { text: summaryText }
      );
    }
    composerDataService.updateComposerDataSetStore(
      this.composerDataHandle,
      setter => setter("generatingBubbleIds", [])
    );
  }

  // --- Post-Turn Work Queue ---

  enqueuePostTurnEndedWork(work) {
    this.postTurnEndedWorkQueue.push(work);
  }

  async flushPostTurnEndedWork(context) {
    const queue = this.postTurnEndedWorkQueue;
    this.postTurnEndedWorkQueue = [];
    for (const work of queue) {
      try {
        await work();
      } catch (error) {
        console.error("Error executing post-turn-ended work:", error);
      }
    }
  }

  // --- Main sendUpdate Dispatcher ---
  // Routes each InteractionUpdate type to the appropriate handler

  async sendUpdate(responseStream, update) {
    const messageCase = update.message.case;

    // Skip generation UUID check for suggestions and prompts
    if (!(messageCase === "promptSuggestion" || messageCase === "postRequestPrompt")) {
      if (this.generationUUID !== undefined &&
          this.composerDataHandle.data.chatGenerationUUID !== this.generationUUID) {
        return; // Stale generation, ignore
      }
    }

    this.hooks.onInteractionUpdate?.(update);
    const composerId = this.composerDataHandle.data.composerId;
    this.asyncOperationRegistry.enter(composerId, "capability_process_stream");

    // Add breadcrumb for non-streaming events
    if (messageCase !== undefined &&
        !["textDelta", "thinkingDelta", "tokenDelta", "toolCallDelta",
          "heartbeat", "shellOutputDelta", "partialToolCall"].includes(messageCase)) {
      const breadcrumb = {
        composerId: this.composerDataHandle.data.composerId,
        generationUUID: this.generationUUID
      };
      if (messageCase === "toolCallStarted" || messageCase === "toolCallCompleted" ||
          messageCase === "toolCallDelta" || messageCase === "partialToolCall") {
        const callId = update.message.value.callId;
        breadcrumb.toolCallId = callId;
        if (messageCase !== "toolCallDelta") {
          const toolCall = update.message.value.toolCall;
          const toolName = toolCall?.tool?.case;
          if (toolName) breadcrumb.toolName = toolName;
          if (messageCase === "toolCallCompleted" && toolCall) {
            this.addToolCallSizeBreadcrumbData(breadcrumb, toolCall);
          }
        }
      }
      B5e({ // addBreadcrumb
        category: "agent.update",
        message: messageCase,
        level: "info",
        data: breadcrumb
      });
    }

    this.notifyBeforeUpdate();

    try {
      switch (update.message.case) {
        case "textDelta": {
          this.handleTextDelta(update.message.value.text);
          break;
        }
        case "thinkingDelta": {
          this.handleThinkingDelta(
            update.message.value.text,
            update.message.value.thinkingStyle
          );
          break;
        }
        case "thinkingCompleted": {
          this.handleThinkingCompleted(update);
          break;
        }
        case "toolCallStarted":
          await this.handleToolCallStarted(update);
          break;
        case "toolCallCompleted":
          await this.handleToolCallCompleted(update);
          break;
        case "partialToolCall":
          await this.handlePartialToolCall(update);
          break;
        case "toolCallDelta":
          await this.handleToolCallDelta(responseStream, update);
          break;

        case "userMessageAppended": {
          const userMessage = update.message.value.userMessage;
          const messageId = userMessage?.messageId;
          if (this.conversationActionManager && messageId) {
            this.conversationActionManager.markMessageAsProcessed(userMessage);
          }
          if (messageId) {
            const composerDataService = this.instantiationService.invokeFunction(
              accessor => accessor.get(Fa)
            );
            const conversationState = this.composerDataHandle.data.conversationState;
            composerDataService.updateComposerBubbleSetStore(
              this.composerDataHandle,
              messageId,
              setter => { setter("conversationState", conversationState); }
            );
          }
          break;
        }
        case "tokenDelta":
          break; // Token counting delta - no UI update needed
        case "summary":
          break; // Raw summary text - handled by summaryStarted/Completed
        case "summaryStarted": {
          this.handleSummaryStarted();
          break;
        }
        case "summaryCompleted": {
          this.handleSummaryCompleted(update.message.value.hookMessage);
          break;
        }
        case "heartbeat":
          break; // Keep-alive signal
        case "shellOutputDelta":
          break; // Shell output streaming (handled by shell tool handler)

        case "turnEnded": {
          const composerDataService = this.instantiationService.invokeFunction(
            accessor => accessor.get(Fa) // IComposerDataService
          );
          const composerService = this.instantiationService.invokeFunction(
            accessor => accessor.get(bM) // IComposerService
          );
          const agentStreamService = this.instantiationService.invokeFunction(
            accessor => accessor.get(gEe) // IAgentStreamService
          );
          const currentComposerId = this.composerDataHandle.data.composerId;

          // Check if there's a queued message to process
          const queuingCapability = composerDataService.getComposerCapability(
            this.composerDataHandle, ko.QUEUING // CapabilityType.QUEUING
          );
          const nextQueueItem = (queuingCapability?.getQueueItemsReactive() ?? [])[0];
          const isEditingQueueItem = nextQueueItem &&
            this.composerDataHandle.data.editingQueueItemId === nextQueueItem.id;

          if (nextQueueItem && !isEditingQueueItem) {
            // Process the next queued message
            const contextOverride = nextQueueItem.extras?.contextOverride;
            const newBubbleId = Gr(); // generateId
            queuingCapability?.removeFromQueue(nextQueueItem.id);

            await composerService.appendQueuedHumanMessage(
              this.composerDataHandle,
              nextQueueItem.query,
              {
                richText: nextQueueItem.extras.richText,
                contextOverride,
                bubbleId: newBubbleId
              }
            );

            const selectedContext = await agentStreamService.buildComposerSelectedContext(
              Kk(), // getCancellationToken
              this.composerDataHandle
            );

            composerDataService.updateComposerDataSetStore(
              this.composerDataHandle,
              setter => { setter("generatingBubbleIds", []); }
            );

            this.conversationActionManager.submitConversationAction(
              new kF({ // ConversationAction
                action: {
                  case: "userMessageAction",
                  value: new ORe({ // UserMessageAction
                    userMessage: new jR({ // UserMessage
                      text: nextQueueItem.query,
                      richText: nextQueueItem.extras.richText,
                      messageId: newBubbleId,
                      selectedContext
                    })
                  })
                }
              })
            );
            break;
          }

          // Turn ended without queued messages — mark as completed
          composerDataService.updateComposerDataSetStore(
            this.composerDataHandle,
            setter => {
              setter("status", "completed");
              setter("generatingBubbleIds", []);
              setter("chatGenerationUUID", undefined);
            }
          );

          // Enable prompt suggestions
          const inputService = this.instantiationService.invokeFunction(
            accessor => accessor.get(sw) // IComposerInputService
          );
          {
            const inputDelegate = inputService.getInputDelegate(currentComposerId);
            inputDelegate.setPendingSuggestionReqId(this.generationUUID);
            inputDelegate.enablePendingSuggestion();
          }

          // Run post-stream capabilities
          const capabilitiesService = this.instantiationService.invokeFunction(
            accessor => accessor.get(kM) // ICapabilitiesService
          );
          const lastHumanBubbleId = composerDataService.getLastHumanBubbleId(this.composerDataHandle);
          const lastAiBubbleId = composerDataService.getLastAiBubbleId(this.composerDataHandle);

          if (lastHumanBubbleId && lastAiBubbleId) {
            await capabilitiesService.runCapabilitiesForProcess(
              this.composerDataHandle,
              "chat-stream-finished",
              {
                composerId: currentComposerId,
                humanBubbleId: lastHumanBubbleId,
                aiBubbleId: lastAiBubbleId,
                startTime: undefined,
                parentSpanCtx: R5e // rootSpanContext
              }
            ).catch(err => {
              console.error(
                "[AgentResponseAdapter] error running capabilities for chat-stream-finished", err
              );
            });
          }

          // Refetch relevant data
          this.instantiationService.invokeFunction(
            accessor => accessor.get(_wi) // IRefetchService
          ).refetch(true);
          break;
        }

        case "stepStarted":
          break; // Step lifecycle events — no direct UI update

        case "stepCompleted": {
          const stepData = update.message.case === "stepCompleted"
            ? update.message.value
            : undefined;
          if (stepData) {
            const composerDataService = this.instantiationService.invokeFunction(
              accessor => accessor.get(Fa)
            );
            const lastAiBubble = composerDataService.getLastAiBubble(this.composerDataHandle);
            if (lastAiBubble) {
              composerDataService.updateComposerBubbleSetStore(
                this.composerDataHandle,
                lastAiBubble.bubbleId,
                setter => {
                  setter("turnDurationMs", Number(stepData.stepDurationMs));
                }
              );
            }
          }
          break;
        }

        case "promptSuggestion": {
          const inputService = this.instantiationService.invokeFunction(
            accessor => accessor.get(sw) // IComposerInputService
          );
          const currentComposerId = this.composerDataHandle.data.composerId;
          inputService.getInputDelegate(currentComposerId).setSuggestionText(
            update.message.value.suggestion,
            this.generationUUID
          );
          break;
        }

        case "postRequestPrompt": {
          const composerDataService = this.instantiationService.invokeFunction(
            accessor => accessor.get(Fa) // IComposerDataService
          );
          const openerService = this.instantiationService.invokeFunction(
            accessor => accessor.get(qa) // IOpenerService
          );
          const lastBubble = composerDataService.getLastBubble(this.composerDataHandle);
          if (lastBubble) {
            const promptData = update.message.value;
            composerDataService.updateComposerDataSetStore(
              this.composerDataHandle,
              setter => setter("conversationMap", lastBubble.bubbleId, "errorDetails", {
                title: promptData.title,
                message: promptData.message,
                requestId: "",
                error: new rN({ // ResponseError
                  error: Ha.CUSTOM_MESSAGE, // ErrorCode.CUSTOM_MESSAGE
                  details: new Dbt({ // ErrorDetails
                    title: promptData.title,
                    detail: promptData.message,
                    showRequestId: false,
                    additionalInfo: {
                      hideIcon: "true",
                      hideKeybindings: "true"
                    }
                  })
                }),
                extraButtons: [{
                  label: promptData.buttonLabel,
                  variant: "primary",
                  callback: () => {
                    openerService.open(je.parse(promptData.buttonUrl)); // URI.parse
                  }
                }]
              })
            );
          }
          break;
        }

        case undefined:
          break;
        default: {
          const _exhaustive = update.message;
          break;
        }
      }
    } catch (error) {
      console.error("[AgentResponseStateMachine] Error processing update:", error);
    } finally {
      this.notifyAfterUpdate();
      this.asyncOperationRegistry.exit(composerId, "capability_process_stream");
    }
  }

  // --- Query Dispatcher ---
  // Routes interactive queries from the agent to appropriate handlers

  async query(responseStream, interactionQuery) {
    switch (interactionQuery.query.case) {
      case "webSearchRequestQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing web search query payload");
        const result = await this.handleWebSearchRequest(payload);
        return result.result.case === "approved"
          ? InteractionQueryResponse.webSearchApproved(interactionQuery.id) // Rme
          : InteractionQueryResponse.webSearchRejected(
              interactionQuery.id,
              result.result.value?.reason
            );
      }
      case "webFetchRequestQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing web fetch query payload");
        const result = await this.handleWebFetchRequest(payload);
        return result.result.case === "approved"
          ? InteractionQueryResponse.webFetchApproved(interactionQuery.id)
          : InteractionQueryResponse.webFetchRejected(
              interactionQuery.id,
              result.result.value?.reason
            );
      }
      case "askQuestionInteractionQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing ask question query payload");
        const result = await this.handleAskQuestionRequest(payload);
        return InteractionQueryResponse.askQuestion(interactionQuery.id, result.result);
      }
      case "switchModeRequestQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing switch mode query payload");
        const result = await this.handleSwitchModeRequest(payload);
        return result.result.case === "approved"
          ? InteractionQueryResponse.switchModeApproved(interactionQuery.id)
          : InteractionQueryResponse.switchModeRejected(
              interactionQuery.id,
              result.result.value?.reason
            );
      }
      case "createPlanRequestQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing create plan query payload");
        const result = await this.handleCreatePlanRequest(payload);
        return InteractionQueryResponse.createPlan(interactionQuery.id, result.result);
      }
      case "mcpAuthRequestQuery": {
        const payload = interactionQuery.query.value;
        if (!payload) throw new Error("Missing MCP auth query payload");
        const result = await this.handleMcpAuthRequest(payload);
        return result.result.case === "approved"
          ? InteractionQueryResponse.mcpAuthApproved(interactionQuery.id)
          : InteractionQueryResponse.mcpAuthRejected(
              interactionQuery.id,
              result.result.value?.reason
            );
      }
      case "setupVmEnvironmentArgs":
        return InteractionQueryResponse.setupVmEnvironment(
          interactionQuery.id,
          new lha({ result: { case: "success", value: new gVl({}) } })
        );
      case "prManagementRequestQuery":
        return InteractionQueryResponse.prManagement(interactionQuery.id, j4A());
      default: {
        if (interactionQuery.query.case !== undefined) {
          const _exhaustive = interactionQuery.query;
        }
        throw new Error("Unhandled interaction query type");
      }
    }
  }

  // --- Query Handler Delegates ---

  async handleAskQuestionRequest(payload) {
    return this.askQuestionQueryHandler.handleAskQuestionRequest(payload);
  }

  async handleSwitchModeRequest(payload) {
    return this.switchModeQueryHandler.handleSwitchModeRequest(payload);
  }

  async handleCreatePlanRequest(payload) {
    return this.createPlanQueryHandler.handleCreatePlanRequest(payload);
  }

  async handleWebSearchRequest(payload) {
    return this.webSearchQueryHandler.handleWebSearchRequest(payload);
  }

  async handleWebFetchRequest(payload) {
    return this.webFetchQueryHandler.handleWebFetchRequest(payload);
  }

  async handleMcpAuthRequest(payload) {
    return this.mcpAuthQueryHandler.handleMcpAuthRequest(payload);
  }
};

// --- Exported Symbols ---
// Original minified names → restored names mapping:
// $Sf → STREAM_CHUNK_DELAY
// qSf → CHUNK_SIZE
// HSf → ThinkingWordStreamer
// rit → AgentResponseAdapter
// rSf → ShellToolCallHandler (imported)
// sSf → EditToolCallHandler (imported)
// oSf → TodoToolCallHandler (imported)
// TSf → TaskToolCallHandler (imported)
// ISf → CreatePlanToolCallHandler (imported)
// Ghu → AskQuestionToolCallHandler (imported)
// Qhu → AskQuestionQueryHandler (imported)
// MSf → SwitchModeQueryHandler (imported)
// USf → McpAuthQueryHandler (imported)
// FSf → WebSearchQueryHandler (imported)
// OSf → WebFetchQueryHandler (imported)
// DSf → CreatePlanQueryHandler (imported)
// N_a → createToolFormerData (imported helper)
// _ga → asyncOperationHelper (imported helper)
// Rme → InteractionQueryResponse (imported builder)
// d_  → createBubble (imported helper)
// ul.AI → BubbleType.AI
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// ko.THINKING → CapabilityType.THINKING
// ko.SUMMARIZATION → CapabilityType.SUMMARIZATION
// ko.QUEUING → CapabilityType.QUEUING
// Fa  → IComposerDataService
// Hw  → runInAction / batch
// B5e → addBreadcrumb
// Wtt → IAsyncOperationRegistry
// Ypn → IToolFormerSignalService
// mh  → ITelemetryService
// uX  → IHooksService
// mf.afterAgentThought → HookStep.afterAgentThought
// bM  → IComposerService
// gEe → IAgentStreamService
// sw  → IComposerInputService
// kM  → ICapabilitiesService
// jz  → IAiDeletedFileService
// qa  → IOpenerService
// _wi → IRefetchService
// lke → ThinkingStyle enum
// Rty → splitIntoChunks
// Gr  → generateId
// Kk  → getCancellationToken
// kF  → ConversationAction
// ORe → UserMessageAction
// jR  → UserMessage
// rN  → ResponseError
// Ha  → ErrorCode
// Dbt → ErrorDetails
// je  → URI
// boe → IntervalTimer
