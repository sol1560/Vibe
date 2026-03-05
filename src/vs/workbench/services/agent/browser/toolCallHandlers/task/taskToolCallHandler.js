/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/task/taskToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
ov(), Ov(), Jg(), Tye(), dp(), ySt(), Fce(), Jhu(), t1t();

// --- SubagentBlockedByHookError ---
const SubagentBlockedByHookError = class extends Error { // e0a
  constructor(message) {
    super(message);
    this.name = "SubagentBlockedByHookError";
  }
};

// --- TaskToolCallHandler ---
// Handles task/subagent tool calls from the agent.
// Manages subagent lifecycle including creation, streaming updates,
// completion tracking, and hook integration.
const TaskToolCallHandler = class { // TSf
  constructor(context) {
    this.context = context;
    this.taskComposerHandles = new Map();
    this.subagentMetadata = new Map();
    this.deniedToolCallIds = new Set();
    this.clientSideSubagentIds = new Set();
  }

  findClientSideSubagentComposerId(toolCallId) {
    const composerDataService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const composerIds = composerDataService.getLoadedComposers();
    for (const id of composerIds) {
      const handle = composerDataService.getHandleIfLoaded(id);
      if (handle && composerDataService.getComposerData(handle)?.subagentInfo?.toolCallId === toolCallId) {
        return id;
      }
    }
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER // CapabilityType.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  getSubagentTerminationReason(composerId) {
    if (!composerId) return undefined;
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Fwi) // ISubagentComposerService
    ).getLastTerminationReason(composerId);
  }

  async handlePartialToolCall(toolCall, callId) {
    if (!this.subagentMetadata.has(callId) && !this.deniedToolCallIds.has(callId)) {
      await this.handleToolCallStarted(toolCall, callId);
    }
  }

  // --- Tool Call Delta (streaming subagent updates) ---

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    if (this.deniedToolCallIds.has(callId) || this.clientSideSubagentIds.has(callId)) return;

    // Check if this is a client-side subagent
    if (this.findClientSideSubagentComposerId(callId)) {
      this.clientSideSubagentIds.add(callId);
      return;
    }

    let composerHandle = this.taskComposerHandles.get(callId);

    if (!composerHandle) {
      const toolFormer = this.getToolFormer();
      const composerDataService = this.context.instantiationService.invokeFunction(
        accessor => accessor.get(Fa) // IComposerDataService
      );

      let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      if (!bubbleId) {
        const existingData = toolFormer.getBubbleDataByToolCallId(callId);
        let params;
        if (existingData?.params) {
          params = existingData.params;
        } else {
          params = new WKe({ // TaskV2Params
            description: "",
            prompt: "",
            subagentType: "",
            name: "general-purpose"
          });
        }
        bubbleId = toolFormer.getOrCreateBubbleId({
          toolCallId: callId,
          toolIndex: 0,
          modelCallId: "",
          toolCallType: on.TASK_V2, // ToolType.TASK_V2
          name: "task_v2",
          params: { case: "taskV2Params", value: params }
        });
      }

      // Create a nested composer handle for the subagent
      composerHandle = Pty({ // createTaskComposerHandle
        instantiationService: this.context.instantiationService,
        composerDataService,
        parentHandle: this.context.composerDataHandle,
        bubbleId,
        toolCallId: callId,
        conversationActionManager: this.context.conversationActionManager,
        toolFormer
      });

      // Copy task description to composer name
      const bubbleData = toolFormer.getBubbleData(bubbleId);
      const description = bubbleData?.params?.description;
      if (description) {
        composerHandle.handle.data.name = description;
        const additionalData = bubbleData?.additionalData;
        if (additionalData && "composerData" in additionalData && additionalData.composerData) {
          toolFormer.setBubbleData(bubbleId, {
            additionalData: {
              ...additionalData,
              composerData: { ...additionalData.composerData, name: description }
            }
          });
        }
      }

      this.taskComposerHandles.set(callId, composerHandle);
    }

    // Forward the interaction update to the nested adapter
    const interactionUpdate = deltaValue.interactionUpdate;
    if (interactionUpdate) {
      await composerHandle.adapter.sendUpdate(responseStream, interactionUpdate);
    }
  }

  // --- Tool Call Started ---

  async handleToolCallStarted(toolCall, callId, isRetry = false) {
    const taskCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const args = taskCall.args;

    const description = args?.description || "";
    const prompt = args?.prompt || "";
    const subagentTypeProto = args?.subagentType;
    const subagentTypeCase = subagentTypeProto?.type.case ?? "unspecified";
    const model = args?.model;

    // Resolve subagent type name
    let subagentTypeName;
    if (subagentTypeProto?.type.case === "custom") {
      subagentTypeName = subagentTypeProto.type.value.name;
    } else if (subagentTypeProto?.type.case === "unspecified" || !subagentTypeProto) {
      subagentTypeName = "general-purpose";
    } else {
      subagentTypeName = subagentTypeProto.type.case ?? "unknown";
    }

    const params = new WKe({ // TaskV2Params
      description,
      prompt,
      subagentType: subagentTypeCase,
      model,
      name: subagentTypeName
    });

    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (bubbleId) {
      toolFormer.setBubbleData(bubbleId, {
        status: "loading",
        params,
        additionalData: { status: "loading" }
      });
    } else {
      bubbleId = toolFormer.getOrCreateBubbleId({
        toolCallId: callId,
        toolIndex: 0,
        modelCallId: "",
        toolCallType: on.TASK_V2,
        name: "task_v2",
        params: { case: "taskV2Params", value: params },
        toolCall
      });
      toolFormer.setBubbleData(bubbleId, {
        status: "loading",
        additionalData: { status: "loading" }
      });
    }

    // Store metadata (only once)
    const alreadyTracked = this.subagentMetadata.has(callId);
    if (!alreadyTracked) {
      this.subagentMetadata.set(callId, {
        startTime: Date.now(),
        subagentType: subagentTypeName,
        taskDescription: description,
        taskPrompt: prompt,
        model
      });
    }

    // Execute subagentStart hook
    if (!isRetry && !alreadyTracked) {
      try {
        const hooksService = this.context.instantiationService.invokeFunction(
          accessor => accessor.get(uX) // IHooksService
        );

        if (hooksService.hasHookForStep(mf.subagentStart)) { // HookStep.subagentStart
          const composerData = this.context.composerDataHandle.data;
          const composerId = composerData.composerId;

          const hookResult = await hooksService.executeHookForStep(mf.subagentStart, {
            conversation_id: composerId,
            generation_id: composerId,
            model: model || composerData.modelConfig?.modelName || "unknown",
            subagent_id: callId,
            subagent_type: subagentTypeName,
            task: prompt,
            parent_conversation_id: composerId,
            tool_call_id: callId,
            subagent_model: model,
            is_parallel_worker: false,
            git_branch: composerData.gitWorktree?.branchName
          });

          if (hookResult?.permission === "deny") {
            const msg = hookResult.user_message
              ? `Subagent creation blocked by hook: ${hookResult.user_message}`
              : "Subagent creation blocked by hook";
            console.warn(
              "[TaskToolCallHandler] subagentStart hook denied subagent creation:", msg
            );
            throw new SubagentBlockedByHookError(msg);
          }

          if (hookResult?.permission === "ask") {
            const msg = "The 'ask' permission for subagentStart hooks is not yet implemented. " +
              "Use 'allow' or 'deny' instead.";
            console.warn(
              '[TaskToolCallHandler] subagentStart hook returned unsupported permission "ask"'
            );
            throw new SubagentBlockedByHookError(msg);
          }
        }
      } catch (error) {
        if (error instanceof SubagentBlockedByHookError) {
          this.deniedToolCallIds.add(callId);
          this.subagentMetadata.delete(callId);
          if (bubbleId) {
            toolFormer.setBubbleData(bubbleId, {
              status: "error",
              additionalData: { status: "error" }
            });
          }
          throw error;
        }
        console.error("[TaskToolCallHandler] Error executing subagentStart hook:", error);
      }
    }
  }

  // --- Tool Call Completed ---

  async handleToolCallCompleted(toolCall, callId) {
    const taskCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();

    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);

    // Check if this is a client-side subagent
    const clientSubagentId = this.findClientSideSubagentComposerId(callId);
    if (clientSubagentId) {
      if (!bubbleId) {
        await this.handleToolCallStarted(toolCall, callId, true);
        bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      }
      if (bubbleId) {
        const composerDataService = this.context.instantiationService.invokeFunction(
          accessor => accessor.get(Fa)
        );
        const subHandle = composerDataService.getHandleIfLoaded(clientSubagentId);
        const subComposerData = subHandle
          ? composerDataService.getComposerData(subHandle)
          : undefined;

        const isSuccess = taskCall.result?.result?.case === "success";
        const isError = taskCall.result?.result?.case === "error";
        const terminationReason = this.getSubagentTerminationReason(clientSubagentId);

        const resolvedTermination = isSuccess
          ? "completed"
          : isError
            ? (terminationReason === "aborted" ? "aborted" : "error")
            : (terminationReason ?? "error");

        const bubbleStatus = resolvedTermination === "completed"
          ? "completed"
          : resolvedTermination === "aborted"
            ? "cancelled"
            : "error";
        const additionalStatus = resolvedTermination === "completed"
          ? "success"
          : resolvedTermination === "aborted"
            ? "cancelled"
            : "error";

        toolFormer.setBubbleData(bubbleId, {
          status: bubbleStatus,
          additionalData: {
            status: additionalStatus,
            terminationReason: resolvedTermination,
            composerData: subComposerData,
            subagentComposerId: clientSubagentId
          }
        });

        if (isSuccess) {
          const agentId = taskCall.result.result.value.agentId;
          const result = new QKe({ agentId: agentId || clientSubagentId }); // TaskV2Result
          toolFormer.handleToolResult(
            new QR({
              tool: on.TASK_V2,
              toolCallId: callId,
              result: { case: "taskV2Result", value: result }
            }),
            callId,
            true
          );
        }

        // Execute stop hook
        const metadata = this.subagentMetadata.get(callId);
        if (metadata) {
          await this.executeSubagentStopHook(callId, metadata, resolvedTermination);
          this.subagentMetadata.delete(callId);
        }
        this.clientSideSubagentIds.delete(callId);
      }
      return;
    }

    // Handle server-side subagent completion
    const composerHandle = this.taskComposerHandles.get(callId);
    let composerData;
    if (composerHandle) {
      composerData = composerHandle.handle.data;
    }

    // Resolve start time from conversation if available
    let startTime;
    if (!bubbleId && composerData) {
      const firstBubbleHeader = composerData.fullConversationHeadersOnly?.[0];
      if (firstBubbleHeader) {
        const firstBubble = composerData.conversationMap?.[firstBubbleHeader.bubbleId];
        if (firstBubble?.createdAt) {
          startTime = new Date(firstBubble.createdAt).getTime();
        }
      }
    }

    if (!bubbleId) {
      await this.handleToolCallStarted(toolCall, callId, true);
      bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      if (!bubbleId) {
        throw new Error(`Bubble not found for tool call id ${callId}`);
      }
      if (startTime !== undefined) {
        const meta = this.subagentMetadata.get(callId);
        if (meta) meta.startTime = startTime;
      }
    }

    const composerDataService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );
    const transcriptService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get($tt) // ITranscriptService
    );

    const bubble = composerDataService.getComposerBubble(
      this.context.composerDataHandle,
      bubbleId
    );
    if (!bubble) {
      throw new Error(`Bubble data not found for bubble id ${bubbleId}`);
    }

    // Store the message in transcript
    await transcriptService.storeMessage(
      this.context.composerDataHandle.data.composerId,
      bubble
    );

    // Clean up composer handle
    if (composerHandle) {
      composerHandle.handle.dispose();
      composerHandle.adapter.dispose();
      this.taskComposerHandles.delete(callId);
    }

    // Determine final status
    let terminationStatus = "completed";
    let errorMessage;
    let finalSummary;

    const existingAdditional = toolFormer.getBubbleData(bubbleId)?.additionalData;
    if (existingAdditional?.terminationReason === "aborted" ||
        existingAdditional?.status === "cancelled") {
      terminationStatus = "aborted";
    } else if (taskCall.result?.result?.case === "success") {
      const agentId = taskCall.result.result.value.agentId;
      const result = new QKe({ agentId }); // TaskV2Result
      toolFormer.setBubbleData(bubbleId, {
        status: "completed",
        additionalData: { status: "success", terminationReason: "completed" }
      });
      toolFormer.handleToolResult(
        new QR({
          tool: on.TASK_V2,
          toolCallId: callId,
          result: { case: "taskV2Result", value: result }
        }),
        callId,
        true
      );
      terminationStatus = "completed";
    } else if (taskCall.result?.result?.case === "error") {
      const errorResult = taskCall.result.result.value;
      const subComposerId = existingAdditional?.subagentComposerId;

      const resolvedReason =
        (this.getSubagentTerminationReason(subComposerId) === "aborted" ||
         existingAdditional?.terminationReason === "aborted")
          ? "aborted"
          : "error";

      if (resolvedReason === "aborted") {
        toolFormer.setBubbleData(bubbleId, {
          status: "cancelled",
          additionalData: {
            ...existingAdditional,
            status: "cancelled",
            terminationReason: "aborted"
          }
        });
        terminationStatus = "aborted";
      } else {
        toolFormer.setBubbleData(bubbleId, {
          status: "error",
          additionalData: {
            ...existingAdditional,
            status: "error",
            terminationReason: "error"
          }
        });
        toolFormer.handleToolResult(
          new QR({
            tool: on.TASK_V2,
            toolCallId: callId,
            error: {
              clientVisibleErrorMessage: "Task failed",
              modelVisibleErrorMessage: `Task failed: ${errorResult.error}`,
              actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: errorResult.error
            }
          }),
          callId,
          true
        );
        terminationStatus = "error";
        errorMessage = errorResult.error;
      }
    }

    // Execute subagentStop hook
    try {
      const hooksService = this.context.instantiationService.invokeFunction(
        accessor => accessor.get(uX) // IHooksService
      );

      if (this.deniedToolCallIds.has(callId)) {
        console.log(
          `[TaskToolCallHandler] Skipping subagentStop hook for denied tool call ${callId}`
        );
      } else if (hooksService.hasHookForStep(mf.subagentStop)) {
        const metadata = this.subagentMetadata.get(callId);
        const composerDataForHook = this.context.composerDataHandle.data;
        const composerId = composerDataForHook.composerId;
        const durationMs = metadata ? Date.now() - metadata.startTime : 0;

        let messageCount = 0;
        let toolCallCount = 0;
        const modifiedFiles = [];

        if (composerData) {
          messageCount = composerData.fullConversationHeadersOnly?.length ?? 0;
          toolCallCount = Object.keys(
            composerData.codeBlockData?.codeblockMap ?? {}
          ).length;

          // Get last AI message as summary
          const lastAiBubbleHeader = [...(composerData.fullConversationHeadersOnly ?? [])]
            .reverse()
            .find(h => h.type === ul.AI); // BubbleType.AI
          if (lastAiBubbleHeader) {
            const lastAiBubble = composerData.conversationMap?.[lastAiBubbleHeader.bubbleId];
            if (lastAiBubble?.text) {
              finalSummary = lastAiBubble.text;
            }
          }
        }

        await hooksService.executeHookForStep(mf.subagentStop, {
          conversation_id: composerId,
          generation_id: composerId,
          model: metadata?.model || composerDataForHook.modelConfig?.modelName || "unknown",
          subagent_id: callId,
          subagent_type: metadata?.subagentType ?? "unknown",
          status: terminationStatus,
          duration_ms: durationMs,
          summary: finalSummary,
          parent_conversation_id: composerId,
          message_count: messageCount,
          tool_call_count: toolCallCount,
          error_message: errorMessage,
          modified_files: modifiedFiles.length > 0 ? modifiedFiles : undefined,
          git_branch: composerDataForHook.gitWorktree?.branchName,
          loop_count: 0,
          task: metadata?.taskPrompt,
          description: metadata?.taskDescription
        });
      }
    } catch (error) {
      console.error("[TaskToolCallHandler] Error executing subagentStop hook:", error);
    }

    this.subagentMetadata.delete(callId);
    this.deniedToolCallIds.delete(callId);
  }

  // --- Subagent Stop Hook Helper ---

  async executeSubagentStopHook(callId, metadata, status, extra) {
    try {
      const hooksService = this.context.instantiationService.invokeFunction(
        accessor => accessor.get(uX)
      );
      if (hooksService.hasHookForStep(mf.subagentStop)) {
        const composerData = this.context.composerDataHandle.data;
        const composerId = composerData.composerId;
        const durationMs = Date.now() - metadata.startTime;

        await hooksService.executeHookForStep(mf.subagentStop, {
          conversation_id: composerId,
          generation_id: composerId,
          model: metadata.model || composerData.modelConfig?.modelName || "unknown",
          subagent_id: callId,
          subagent_type: metadata.subagentType,
          status,
          duration_ms: durationMs,
          summary: extra?.summary,
          parent_conversation_id: composerId,
          message_count: extra?.messageCount ?? 0,
          tool_call_count: extra?.toolCallCount ?? 0,
          error_message: extra?.errorMessage,
          modified_files: undefined,
          git_branch: composerData.gitWorktree?.branchName,
          loop_count: 0,
          task: metadata.taskPrompt,
          description: metadata.taskDescription
        });
      }
    } catch (error) {
      console.error("[TaskToolCallHandler] Error executing subagentStop hook:", error);
    }
  }
};

// --- Symbol Map ---
// e0a  → SubagentBlockedByHookError
// TSf  → TaskToolCallHandler
// WKe  → TaskV2Params
// QKe  → TaskV2Result
// QR   → ToolResult
// on.TASK_V2 → ToolType.TASK_V2
// Pty  → createTaskComposerHandle
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// Fa   → IComposerDataService
// Fwi  → ISubagentComposerService
// $tt  → ITranscriptService
// uX   → IHooksService
// mf   → HookStep (subagentStart, subagentStop)
// ul.AI → BubbleType.AI
// rke  → ToolError
