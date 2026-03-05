/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/shell/shellToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Jg(), Ov(), $d(), st();

// --- Constants ---
const SHELL_OUTPUT_BUFFER_FLUSH_INTERVAL_MS = 50; // iSf

// --- ShellToolCallHandler ---
// Handles shell/terminal command tool calls from the agent.
// Buffers stdout/stderr output and flushes periodically to avoid UI jank.
const ShellToolCallHandler = class { // rSf
  constructor(context) {
    this.context = context;
    this.bufferedOutputByCallId = new Map();
    this._isDisposed = false;
    egt(this); // registerShellHandler — registers this handler globally
  }

  dispose() {
    if (this._isDisposed) return;
    this._isDisposed = true;
    tgt(this); // unregisterShellHandler

    for (const buffer of this.bufferedOutputByCallId.values()) {
      if (buffer.flushTimeout !== null) {
        clearTimeout(buffer.flushTimeout);
        buffer.flushTimeout = null;
      }
    }
    this.bufferedOutputByCallId.clear();
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

  // --- Streaming Output Delta ---

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    const toolFormer = this.getToolFormer();
    const bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) return;

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (!bubbleData) return;

    let stdout = "";
    let stderr = "";
    if (deltaValue.delta.case === "stdout") {
      stdout = deltaValue.delta.value.content;
    } else if (deltaValue.delta.case === "stderr") {
      stderr = deltaValue.delta.value.content;
    }

    // Mark as running unless already cancelled
    if (bubbleData.additionalData?.status !== "cancelled") {
      toolFormer.setBubbleData(bubbleId, {
        additionalData: { status: "running" }
      });
    }

    this.handleToolCallDeltaBuffered(callId, stdout, stderr);
  }

  handleToolCallDeltaBuffered(callId, stdout, stderr) {
    let buffer = this.bufferedOutputByCallId.get(callId);
    if (!buffer) {
      buffer = {
        stdout: "",
        stderr: "",
        pendingStdout: "",
        pendingStderr: "",
        flushTimeout: null
      };
      this.bufferedOutputByCallId.set(callId, buffer);
    }

    buffer.pendingStdout += stdout;
    buffer.pendingStderr += stderr;

    if (buffer.flushTimeout === null) {
      buffer.flushTimeout = setTimeout(() => {
        this.flushBufferedOutput(callId);
      }, SHELL_OUTPUT_BUFFER_FLUSH_INTERVAL_MS);
    }
  }

  flushBufferedOutput(callId) {
    if (this._isDisposed) return;
    const buffer = this.bufferedOutputByCallId.get(callId);
    if (!buffer) return;

    if (buffer.flushTimeout !== null) {
      clearTimeout(buffer.flushTimeout);
      buffer.flushTimeout = null;
    }

    if (buffer.pendingStdout === "" && buffer.pendingStderr === "") return;

    buffer.stdout += buffer.pendingStdout;
    buffer.stderr += buffer.pendingStderr;
    buffer.pendingStdout = "";
    buffer.pendingStderr = "";

    this.updateToolResult(callId, buffer.stdout + buffer.stderr);
  }

  cleanupBufferedOutput(callId) {
    const buffer = this.bufferedOutputByCallId.get(callId);
    if (buffer) {
      if (buffer.flushTimeout !== null) clearTimeout(buffer.flushTimeout);
      this.bufferedOutputByCallId.delete(callId);
    }
  }

  updateToolResult(callId, output) {
    this.getToolFormer().handleToolResult(
      new QR({ // ToolResult
        tool: on.RUN_TERMINAL_COMMAND_V2, // ToolType.RUN_TERMINAL_COMMAND_V2
        toolCallId: callId,
        result: {
          case: "runTerminalCommandV2Result",
          value: new ahe({ // RunTerminalCommandV2Result
            output,
            exitCode: 0,
            rejected: false
          })
        }
      }),
      callId,
      false // isFinal
    );
  }

  // --- Tool Call Started ---

  async handleToolCallStarted(toolCall, callId, isRetry = false) {
    const shellCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const args = shellCall.args;
    const isBackground = args?.isBackground ?? false;
    const command = args?.command ?? "";

    // Notify AI code tracking service
    if (!isRetry) {
      try {
        const composerId = this.context.composerDataHandle.data.composerId;
        this.context.instantiationService.invokeFunction(
          accessor => accessor.get(jz) // IAiDeletedFileService / IAiCodeTrackingService
        ).onShellToolCallStarted(callId, command, composerId).catch(err => {
          console.error(
            "[ShellToolCallHandler] Error notifying AI code tracking service:", err
          );
        });
      } catch (err) {
        console.error(
          "[ShellToolCallHandler] Error notifying AI code tracking service:", err
        );
      }
    }

    const params = args !== undefined
      ? new GKe({ // RunTerminalCommandV2Params
          command: args.command,
          cwd: args.workingDirectory,
          isBackground,
          requireUserApproval: false,
          options: args.timeout
            ? new b9n({ timeout: args.timeout }) // CommandOptions
            : undefined,
          parsingResult: args.parsingResult,
          requestedSandboxPolicy: args.requestedSandboxPolicy,
          commandDescription: args?.description ?? shellCall?.description,
          classifierResult: args.classifierResult
        })
      : undefined;

    // Get or create bubble
    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) {
      bubbleId = toolFormer.getOrCreateBubbleId({
        toolCallId: callId,
        toolIndex: 0,
        modelCallId: "",
        toolCallType: on.RUN_TERMINAL_COMMAND_V2,
        name: "run_terminal_command_v2",
        params: params !== undefined
          ? { case: "runTerminalCommandV2Params", value: params }
          : undefined,
        rawArgs: "",
        toolCall
      });
    }

    const isPending = toolFormer.getBubbleData(bubbleId)?.additionalData?.status === "pending";
    const status = args !== undefined ? "running" : "loading";

    toolFormer.setBubbleData(bubbleId, {
      params,
      ...(isPending ? {} : { additionalData: { status } })
    });
  }

  // --- Tool Call Completed ---

  async handleToolCallCompleted(toolCall, callId) {
    const shellCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();

    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) {
      await this.handleToolCallStarted(toolCall, callId, true);
      bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
      if (!bubbleId) return;
    }

    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (!bubbleData) return;

    // Flush any remaining buffered output
    this.flushBufferedOutput(callId);
    this.cleanupBufferedOutput(callId);

    const command = shellCall.args?.command ?? "";
    let exitCode;

    if (shellCall.result?.result?.case === "success" ||
        shellCall.result?.result?.case === "failure") {
      const resultValue = shellCall.result.result.value;
      const output = (resultValue.stdout || "") + (resultValue.stderr || "");
      const isSuccess = shellCall.result.result.case === "success" &&
        resultValue.exitCode === 0;
      exitCode = resultValue.exitCode;

      const backgroundShellId = shellCall.result.result.case === "success"
        ? shellCall.result.result.value.shellId
        : undefined;

      const result = new ahe({ // RunTerminalCommandV2Result
        output,
        exitCode: resultValue.exitCode,
        rejected: false,
        backgroundShellId
      });

      if (bubbleData.additionalData?.status !== "cancelled") {
        toolFormer.setBubbleData(bubbleId, {
          additionalData: { status: isSuccess ? "success" : "error" }
        });
      }

      toolFormer.handleToolResult(
        new QR({
          tool: on.RUN_TERMINAL_COMMAND_V2,
          toolCallId: callId,
          result: {
            case: "runTerminalCommandV2Result",
            value: result
          }
        }),
        callId,
        true // isFinal
      );
    } else if (shellCall.result?.result?.case === "spawnError") {
      const spawnError = shellCall.result.result.value;
      toolFormer.setBubbleData(bubbleId, {
        additionalData: { status: "error" }
      });
      toolFormer.handleToolResult(
        new QR({
          tool: on.RUN_TERMINAL_COMMAND_V2,
          toolCallId: callId,
          error: {
            clientVisibleErrorMessage: "Command failed to execute",
            modelVisibleErrorMessage: `Command failed: ${spawnError.error}`,
            actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: spawnError.error
          }
        }),
        callId,
        true
      );
    } else if (shellCall.result?.result?.case === "timeout") {
      toolFormer.setBubbleData(bubbleId, {
        additionalData: { status: "error" }
      });
      toolFormer.handleToolResult(
        new QR({
          tool: on.RUN_TERMINAL_COMMAND_V2,
          toolCallId: callId,
          error: {
            clientVisibleErrorMessage: "Command timed out",
            modelVisibleErrorMessage: "Command execution timed out",
            actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: "Command execution timed out"
          }
        }),
        callId,
        true
      );
    } else if (shellCall.result?.result?.case === "rejected") {
      const rejection = shellCall.result.result.value;
      toolFormer.setBubbleData(bubbleId, {
        additionalData: { status: "rejected" }
      });
      toolFormer.handleToolResult(
        new QR({
          tool: on.RUN_TERMINAL_COMMAND_V2,
          toolCallId: callId,
          result: {
            case: "runTerminalCommandV2Result",
            value: new ahe({
              output: `Rejected: ${rejection.reason}`,
              exitCode: 1,
              rejected: true
            })
          }
        }),
        callId,
        true
      );
    } else if (shellCall.result?.result?.case === "permissionDenied") {
      const errorMsg = shellCall.result.result.value.error || "Permission denied";
      const fullMsg = `Permission denied: ${errorMsg}`;
      toolFormer.setBubbleData(bubbleId, {
        additionalData: { status: "error" }
      });
      toolFormer.handleToolResult(
        new QR({
          tool: on.RUN_TERMINAL_COMMAND_V2,
          toolCallId: callId,
          error: {
            clientVisibleErrorMessage: fullMsg,
            modelVisibleErrorMessage: fullMsg,
            actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: errorMsg
          }
        }),
        callId,
        true
      );
    }

    // Notify tracking service of completion
    try {
      const composerId = this.context.composerDataHandle.data.composerId;
      this.context.instantiationService.invokeFunction(
        accessor => accessor.get(jz)
      ).onShellToolCallCompleted(callId, command, exitCode, composerId).catch(err => {
        console.error(
          "[ShellToolCallHandler] Error notifying AI code tracking service:", err
        );
      });
    } catch (err) {
      console.error(
        "[ShellToolCallHandler] Error notifying AI code tracking service:", err
      );
    }
  }
};

// --- Symbol Map ---
// iSf  → SHELL_OUTPUT_BUFFER_FLUSH_INTERVAL_MS (50)
// rSf  → ShellToolCallHandler
// egt  → registerShellHandler
// tgt  → unregisterShellHandler
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// QR   → ToolResult
// on.RUN_TERMINAL_COMMAND_V2 → ToolType.RUN_TERMINAL_COMMAND_V2
// ahe  → RunTerminalCommandV2Result
// GKe  → RunTerminalCommandV2Params
// b9n  → CommandOptions
// jz   → IAiCodeTrackingService
