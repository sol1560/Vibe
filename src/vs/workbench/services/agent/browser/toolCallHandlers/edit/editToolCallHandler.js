/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/edit/editToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Y9(), Jg(), Ov(), ls(), dp(), Aye(), J0(), Sr();

// --- EditToolCallHandler ---
// Handles file edit tool calls from the agent.
// Manages edit bubble creation, streaming content deltas,
// and final result processing with before/after content storage.
const EditToolCallHandler = class { // sSf
  constructor(context) {
    this.context = context;
  }

  getToolFormer() {
    const toolFormer = this.context.composerDataHandle.data.capabilities.find(
      cap => cap.type === ko.TOOL_FORMER // CapabilityType.TOOL_FORMER
    );
    if (!toolFormer) throw new Error("ToolFormer not found");
    return toolFormer;
  }

  async handlePartialToolCall(toolCall, callId) {
    await this.handleToolCallStarted(toolCall, callId);
  }

  // --- Streaming Edit Delta ---

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    const streamContentDelta = deltaValue.streamContentDelta;
    if (!streamContentDelta) return;

    const toolFormer = this.getToolFormer();
    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);

    if (!bubbleId) {
      const isCloudAgent = !!this.context.composerDataHandle.data
        .createdFromBackgroundAgent?.bcId;
      bubbleId = toolFormer.getOrCreateBubbleId({
        toolCallId: callId,
        toolIndex: 0,
        modelCallId: "",
        toolCallType: on.EDIT_FILE_V2, // ToolType.EDIT_FILE_V2
        name: "edit_file_v2",
        params: {
          case: "editFileV2Params",
          value: new ohe({ // EditFileV2Params
            relativeWorkspacePath: undefined,
            noCodeblock: true,
            streamingContent: streamContentDelta,
            cloudAgentEdit: isCloudAgent
          })
        }
      });
      return;
    }

    // Append streaming content to existing bubble
    const existingData = toolFormer.getBubbleData(bubbleId);
    const existingContent = existingData?.params?.streamingContent ?? "";
    toolFormer.setBubbleData(bubbleId, {
      params: new ohe({
        ...existingData?.params,
        streamingContent: existingContent + streamContentDelta
      })
    });
  }

  // --- Tool Call Started ---

  async handleToolCallStarted(toolCall, callId) {
    const editCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const existingBubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    const filePath = editCall.args?.path;

    if (existingBubbleId) {
      // Update existing bubble with file path if we now have it
      if (filePath) {
        const existingData = toolFormer.getBubbleData(existingBubbleId);
        toolFormer.setBubbleData(existingBubbleId, {
          params: new ohe({
            ...existingData?.params,
            relativeWorkspacePath: filePath
          })
        });
      }
      return;
    }

    if (!filePath) return;

    const isCloudAgent = !!this.context.composerDataHandle.data
      .createdFromBackgroundAgent?.bcId;

    toolFormer.getOrCreateBubbleId({
      toolCallId: callId,
      toolIndex: 0,
      modelCallId: "",
      toolCallType: on.EDIT_FILE_V2, // ToolType.EDIT_FILE_V2
      name: "edit_file_v2",
      params: {
        case: "editFileV2Params",
        value: new ohe({ // EditFileV2Params
          relativeWorkspacePath: filePath,
          noCodeblock: true,
          streamingContent: editCall.args?.streamContent,
          cloudAgentEdit: isCloudAgent
        })
      },
      toolCall
    });
  }

  // --- Tool Call Completed ---

  async handleToolCallCompleted(toolCall, callId) {
    const editCall = toolCall.tool.value;
    const workspaceContextService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Rr) // IWorkspaceContextService
    );
    const toolFormer = this.getToolFormer();
    const composerDataService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(Fa) // IComposerDataService
    );

    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) {
      await this.handleToolCallStarted(toolCall, callId);
      bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      if (!bubbleId) return;
    }

    // Resolve the file URI from the relative path
    const fileUri = x$e( // resolveWorkspaceFileUri
      editCall.args?.path || "",
      workspaceContextService,
      this.context.composerDataHandle.data
    );
    if (!fileUri) return;

    let beforeContent;
    let afterContent;
    const resultCase = editCall.result?.result?.case;

    if (resultCase === "success") {
      const successResult = editCall.result.result.value;
      const before = successResult.beforeFullFileContent;
      const after = successResult.afterFullFileContent;
      beforeContent = before;
      afterContent = after;

      const fileUriString = fileUri.toString();
      const storageService = this.context.instantiationService.invokeFunction(
        accessor => accessor.get(Ji) // IStorageService
      );

      // Store before content in disk KV
      let beforeContentId;
      if (before !== undefined) {
        const serialized = Zae.serialize(before); // TextEncoder
        beforeContentId = `composer.content.${sQ(await dye(serialized))}`; // hash
        if (await storageService.cursorDiskKVGet(beforeContentId) === undefined) {
          await storageService.cursorDiskKVSet(beforeContentId, before);
        }
      }

      // Store after content in disk KV
      let afterContentId;
      if (after !== undefined) {
        const serialized = Zae.serialize(after);
        afterContentId = `composer.content.${sQ(await dye(serialized))}`;
        if (await storageService.cursorDiskKVGet(afterContentId) === undefined) {
          await storageService.cursorDiskKVSet(afterContentId, after);
        }
      }

      // Track newly created files (no before content = new file)
      if (before === undefined) {
        composerDataService.updateComposerDataSetStore(
          this.context.composerDataHandle,
          setter => setter("newlyCreatedFiles", existing => [
            ...existing.filter(f => f.uri.toString() !== fileUriString),
            { uri: fileUri }
          ])
        );
      }

      toolFormer.setBubbleData(bubbleId, {
        status: "completed",
        result: new MRe({ // EditFileV2Result
          beforeContentId,
          afterContentId
        })
      });
    } else {
      // Handle error cases
      let errorMessage;
      let status = "error";

      switch (resultCase) {
        case "fileNotFound":
          errorMessage = `File not found: ${editCall.result.result.value.path}`;
          break;
        case "readPermissionDenied":
          errorMessage = `Read permission denied: ${editCall.result.result.value.path}`;
          break;
        case "writePermissionDenied":
          errorMessage = `Write permission denied: ${editCall.result.result.value.path}`;
          break;
        case "rejected":
          errorMessage = `Edit rejected: ${editCall.result.result.value.reason}`;
          status = "cancelled";
          break;
        case "error":
          errorMessage = editCall.result.result.value.error || "Unknown error";
          break;
      }

      if (errorMessage) {
        toolFormer.setBubbleData(bubbleId, {
          status,
          error: new rke({ // ToolError
            clientVisibleErrorMessage: errorMessage,
            modelVisibleErrorMessage: errorMessage
          })
        });
      }
    }

    // Notify edit tracking service
    const editTrackingService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(og) // IEditTrackingService
    );
    const humanBubbleId = composerDataService.getLastHumanBubbleId(
      this.context.composerDataHandle
    ) ?? "";

    editTrackingService.handleAiEditToolCallFinished({
      composerId: this.context.composerDataHandle.data.composerId,
      humanBubbleId,
      uri: fileUri,
      beforeContent,
      afterContent
    });
  }
};

// --- Symbol Map ---
// sSf  → EditToolCallHandler
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// on.EDIT_FILE_V2 → ToolType.EDIT_FILE_V2
// ohe  → EditFileV2Params
// MRe  → EditFileV2Result
// rke  → ToolError
// x$e  → resolveWorkspaceFileUri
// Zae  → TextEncoder (serializer)
// sQ   → toHexString
// dye  → computeHash
// Rr   → IWorkspaceContextService
// Fa   → IComposerDataService
// Ji   → IStorageService
// og   → IEditTrackingService
