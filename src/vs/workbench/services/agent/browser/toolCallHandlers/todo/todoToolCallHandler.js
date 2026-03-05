/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/todo/todoToolCallHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Jg(), Ov(), UJ();

// --- TodoToolCallHandler ---
// Handles todo/task list tool calls from the agent.
// Manages creation and updates of todo items in the composer.
const TodoToolCallHandler = class { // oSf
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

  convertTodoStatus(protoStatus) {
    switch (protoStatus) {
      case 1: return "pending";
      case 2: return "in_progress";
      case 3: return "completed";
      case 4: return "cancelled";
      default: return "pending";
    }
  }

  async handlePartialToolCall(toolCall, callId) {
    await this.handleToolCallStarted(toolCall, callId);
  }

  async handleToolCallDelta(responseStream, deltaValue, callId) {
    // No streaming deltas for todo tool calls
  }

  async handleToolCallStarted(toolCall, callId) {
    const todoCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const rawTodos = todoCall.args?.todos || [];
    const isMerge = todoCall.args?.merge ?? true;
    const existingTodos = this.context.composerDataHandle.data.todos || [];

    const todos = rawTodos.map(todo => {
      const existing = existingTodos.find(t => t.id === todo.id);
      return new QB({ // TodoItem
        id: todo.id,
        content: todo.content || existing?.content || "",
        status: this.convertTodoStatus(todo.status),
        dependencies: todo.dependencies
      });
    });

    const params = new Jbt({ // TodoWriteParams
      todos,
      merge: isMerge
    });

    let bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) {
      bubbleId = toolFormer.getOrCreateBubbleId({
        toolCallId: callId,
        toolIndex: 0,
        modelCallId: "",
        toolCallType: on.TODO_WRITE, // ToolType.TODO_WRITE
        name: "todo_write",
        params: { case: "todoWriteParams", value: params },
        toolCall
      });
    }

    if (todos.length > 0) {
      const existingFinalTodos = toolFormer.getBubbleData(bubbleId)?.result?.finalTodos || [];
      const mergedTodos = isMerge ? [...existingFinalTodos, ...todos] : todos;

      toolFormer.handleToolResult(
        new QR({ // ToolResult
          tool: on.TODO_WRITE,
          toolCallId: callId,
          result: {
            case: "todoWriteResult",
            value: new jKe({ // TodoWriteResult
              success: true,
              finalTodos: mergedTodos,
              readyTaskIds: [],
              needsInProgressTodos: false,
              wasMerge: isMerge
            })
          }
        }),
        callId,
        false // not final
      );
    }
  }

  async handleToolCallCompleted(toolCall, callId) {
    const todoCall = toolCall.tool.value;
    const toolFormer = this.getToolFormer();
    const todoFileService = this.context.instantiationService.invokeFunction(
      accessor => accessor.get(CV) // ITodoFileService
    );

    const bubbleId = toolFormer.getBubbleIdByToolCallId(callId);
    if (!bubbleId) return;

    const result = todoCall.result?.result;
    if (result?.case === "success") {
      const successResult = result.value;
      const isMerge = todoCall.args?.merge ?? true;
      const existingTodos = this.context.composerDataHandle.data.todos || [];

      const finalTodos = successResult.todos?.map(todo => {
        const existing = existingTodos.find(t => t.id === todo.id);
        return new QB({
          id: todo.id,
          content: todo.content || existing?.content || "",
          status: this.convertTodoStatus(todo.status),
          dependencies: todo.dependencies
        });
      }) || [];

      // Sync todo status updates to file
      const composerId = this.context.composerDataHandle.data.composerId;
      const statusMap = new Map();
      for (const todo of finalTodos) {
        statusMap.set(todo.id, todo.status);
      }
      await todoFileService.syncTodoUpdatesToFile(composerId, statusMap);

      const todoResult = new jKe({
        success: true,
        finalTodos,
        readyTaskIds: [],
        needsInProgressTodos: false,
        wasMerge: isMerge
      });

      toolFormer.handleToolResult(
        new QR({
          tool: on.TODO_WRITE,
          toolCallId: callId,
          result: { case: "todoWriteResult", value: todoResult }
        }),
        callId,
        true // final
      );
    } else if (result?.case === "error") {
      const errorValue = result.value;
      toolFormer.handleToolResult(
        new QR({
          tool: on.TODO_WRITE,
          toolCallId: callId,
          error: {
            clientVisibleErrorMessage: "Todo update failed",
            modelVisibleErrorMessage: `Todo update failed: ${errorValue.error}`,
            actualErrorMessageOnlySendFromClientToServerNeverTheOtherWayAroundBecauseThatMayBeASecurityRisk: errorValue.error
          }
        }),
        callId,
        true
      );
    }
  }
};

// --- Symbol Map ---
// oSf  → TodoToolCallHandler
// QB   → TodoItem
// Jbt  → TodoWriteParams
// jKe  → TodoWriteResult
// QR   → ToolResult
// on.TODO_WRITE → ToolType.TODO_WRITE
// CV   → ITodoFileService
