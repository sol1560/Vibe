/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/toolCallHandlers/mcpAuth/mcpAuthQueryHandler.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
skt(), mha(), Ov(), Jg(), xie(), Mc(), Xn();

// --- McpAuthQueryHandler ---
// Handles the server-initiated mcp_auth query (InteractionQuery).
// Manages MCP server authentication flows with user approval and browser-based OAuth.
const McpAuthQueryHandler = class { // USf
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

  getMcpService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(DU) // IMcpService
    );
  }

  getOpenerService() {
    return this.context.instantiationService.invokeFunction(
      accessor => accessor.get(qa) // IOpenerService
    );
  }

  async handleMcpAuthRequest(request) {
    const mcpService = this.getMcpService();
    const serverIdentifier = request.args?.serverIdentifier;
    const toolCallId = request.args?.toolCallId;

    if (!serverIdentifier || !toolCallId) {
      return new oye({ // McpAuthRequestResponse
        result: {
          case: "rejected",
          value: new u$e({ // McpAuthRejected
            reason: "Missing serverIdentifier or toolCallId",
          }),
        },
      });
    }

    const toolFormer = this.getToolFormer();

    // Check if server exists in MCP status cache
    const serverStatus = mcpService.statusCache()[serverIdentifier];
    if (!serverStatus) {
      return new oye({
        result: {
          case: "rejected",
          value: new u$e({
            reason: `MCP server '${serverIdentifier}' not found`,
          }),
        },
      });
    }

    // Prevent duplicate handling
    if (this.handledToolCalls.has(toolCallId)) {
      return new oye({
        result: {
          case: "rejected",
          value: new u$e({ reason: "MCP auth already handled" }),
        },
      });
    }
    this.handledToolCalls.add(toolCallId);

    const params = new jbt({ serverIdentifier }); // McpAuthParams
    const rawArgs = JSON.stringify({ serverIdentifier });

    const bubbleId = toolFormer.getOrCreateBubbleId({
      toolCallId,
      toolIndex: 0,
      modelCallId: toolCallId,
      toolCallType: on.MCP_AUTH, // ToolType.MCP_AUTH
      params: { case: "mcpAuthParams", value: params },
      rawArgs,
      name: "mcp_auth",
    });

    toolFormer.setBubbleData(bubbleId, {
      tool: on.MCP_AUTH,
      toolCallId,
      name: "mcp_auth",
      rawArgs,
      params,
      additionalData: { alreadyAuthenticated: false },
    });

    // If server is already connected, no auth needed
    if (serverStatus.type === "connected") {
      toolFormer.setBubbleData(bubbleId, {
        userDecision: "accepted",
        status: "completed",
        additionalData: { alreadyAuthenticated: true },
      });
      this.handledToolCalls.delete(toolCallId);
      return new oye({
        result: { case: "approved", value: new Sfi }, // McpAuthApproved
      });
    }

    // Check if user already made a decision (e.g. on retry)
    const bubbleData = toolFormer.getBubbleData(bubbleId);
    if (bubbleData?.userDecision !== undefined) {
      this.handledToolCalls.delete(toolCallId);
      return bubbleData.userDecision === "accepted"
        ? this.performAuth(serverIdentifier, bubbleId, toolFormer)
        : new oye({
            result: {
              case: "rejected",
              value: new u$e({ reason: "User rejected MCP authentication" }),
            },
          });
    }

    // Needs user approval — track trajectory stopped
    const composerId = this.context.composerDataHandle.data.composerId;
    this.context.trackTrajectoryStopped?.({
      composerId,
      invocationID: this.context.generationUUID,
      toolCallId,
      stop_category: "needs_user_approval",
      stop_source: "other",
      reason_code: "mcp.needs_approval",
    });

    // Wait for user decision
    return new Promise(resolve => {
      const disposer = toolFormer.addPendingDecision(
        bubbleId,
        on.MCP_AUTH,
        toolCallId,
        (accepted) => {
          disposer();
          this.handledToolCalls.delete(toolCallId);

          if (accepted) {
            resolve(this.performAuth(serverIdentifier, bubbleId, toolFormer));
          } else {
            // Check for timeout-specific skip reason
            const skipReason =
              toolFormer.getBubbleData(bubbleId)?.additionalData?.skipReason === "timeout"
                ? "User skipped MCP authentication (timeout)"
                : "User skipped MCP authentication";

            resolve(new oye({
              result: {
                case: "rejected",
                value: new u$e({ reason: skipReason }),
              },
            }));
          }
        },
        true // requiresApproval
      );
    });
  }

  /**
   * Perform the actual MCP authentication flow.
   * Delegates to the shared auth flow utility (K4A) with a client adapter.
   */
  async performAuth(serverIdentifier, bubbleId, toolFormer) {
    const mcpService = this.getMcpService();
    const authFlowClient = this.createAuthFlowClient(bubbleId, mcpService, toolFormer);

    return K4A({ // performMcpAuthFlow
      serverIdentifier,
      client: authFlowClient,
      abortSignal: this.context.conversationActionManager.signal,
    });
  }

  /**
   * Creates an auth flow client adapter that bridges the MCP service
   * with the auth flow utility, providing status polling and browser OAuth.
   */
  createAuthFlowClient(bubbleId, mcpService, toolFormer) {
    return {
      getStatus: (identifier) => mcpService.statusCache()[identifier],

      reloadClient: async (identifier) => {
        await mcpService.reloadClient(identifier);
      },

      onDidChangeServerStatus: (callback) =>
        mcpService.onDidChangeServerStatus(({ identifier, status }) => {
          callback({ identifier, status });
        }),

      openAuthorizationUrl: async (url) => {
        await this.getOpenerService().open(je.parse(url)); // URI.parse
      },

      hasUserRejectedAuth: () =>
        toolFormer.getBubbleData(bubbleId)?.userDecision === "rejected",
    };
  }
};

// --- Symbol Map ---
// USf  -> McpAuthQueryHandler
// oye  -> McpAuthRequestResponse
// jbt  -> McpAuthParams
// Sfi  -> McpAuthApproved
// u$e  -> McpAuthRejected
// K4A  -> performMcpAuthFlow (shared auth flow utility)
// DU   -> IMcpService
// qa   -> IOpenerService
// je   -> URI
// on.MCP_AUTH -> ToolType.MCP_AUTH
// ko.TOOL_FORMER -> CapabilityType.TOOL_FORMER
