/*---------------------------------------------------------------------------------------------
 *  MCP Auth Query Handler — TypeScript conversion from Cursor IDE bundle.
 *
 *  Handles the server-initiated mcp_auth query (InteractionQuery).
 *  Manages MCP server authentication flows with user approval and browser-based OAuth.
 *
 *  Original class: USf (McpAuthQueryHandler)
 *--------------------------------------------------------------------------------------------*/

import {
	CapabilityType,
	IMcpAuthFlowClient,
	IMcpAuthRequest,
	IMcpAuthRequestResponse,
	IMcpAuthParams,
	IMcpService,
	IToolCallHandlerContext,
	IToolFormer,
	PerformMcpAuthFlow,
	ToolType,
} from '../toolHandlerTypes.js';

/** Minimal URI shim — parses a URL string into components. */
class URI {
	static parse(value: string): URI { return new URI(value); }
	private constructor(private readonly _value: string) {}
	toString(): string { return this._value; }
}

// ============================================================================
// McpAuthQueryHandler
// ============================================================================

/**
 * Placeholder for the shared MCP auth flow runner.
 * In the real Cursor bundle, this is `K4A` — an imported utility that orchestrates
 * the full auth flow (status polling, browser redirect, reconnection).
 * This must be wired at integration time.
 */
let performMcpAuthFlow: PerformMcpAuthFlow | undefined;

/** Set the auth flow runner (call during service registration). */
export function setPerformMcpAuthFlow(fn: PerformMcpAuthFlow): void {
	performMcpAuthFlow = fn;
}

export class McpAuthQueryHandler {
	private readonly handledToolCalls = new Set<string>();

	constructor(private readonly context: IToolCallHandlerContext) {}

	private getToolFormer(): IToolFormer {
		const toolFormer = this.context.composerDataHandle.data.capabilities.find(
			cap => cap.type === CapabilityType.TOOL_FORMER
		);
		if (!toolFormer) {
			throw new Error('ToolFormer not found');
		}
		return toolFormer as unknown as IToolFormer;
	}

	private getMcpService(): IMcpService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as IMcpService;
	}

	private getOpenerService(): { open(uri: URI): Promise<void> } {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as { open(uri: URI): Promise<void> };
	}

	async handleMcpAuthRequest(request: IMcpAuthRequest): Promise<IMcpAuthRequestResponse> {
		const mcpService = this.getMcpService();
		const serverIdentifier = request.args?.serverIdentifier;
		const toolCallId = request.args?.toolCallId;

		if (!serverIdentifier || !toolCallId) {
			return {
				result: { case: 'rejected', value: { reason: 'Missing serverIdentifier or toolCallId' } },
			};
		}

		const toolFormer = this.getToolFormer();

		// Check if server exists in MCP status cache
		const serverStatus = mcpService.statusCache()[serverIdentifier];
		if (!serverStatus) {
			return {
				result: { case: 'rejected', value: { reason: `MCP server '${serverIdentifier}' not found` } },
			};
		}

		// Prevent duplicate handling
		if (this.handledToolCalls.has(toolCallId)) {
			return {
				result: { case: 'rejected', value: { reason: 'MCP auth already handled' } },
			};
		}
		this.handledToolCalls.add(toolCallId);

		const params: IMcpAuthParams = { serverIdentifier };
		const rawArgs = JSON.stringify({ serverIdentifier });

		const bubbleId = toolFormer.getOrCreateBubbleId({
			toolCallId,
			toolIndex: 0,
			modelCallId: toolCallId,
			toolCallType: ToolType.MCP_AUTH,
			params: { case: 'mcpAuthParams', value: params },
			rawArgs,
			name: 'mcp_auth',
		});

		toolFormer.setBubbleData(bubbleId, {
			tool: ToolType.MCP_AUTH,
			toolCallId,
			name: 'mcp_auth',
			rawArgs,
			params,
			additionalData: { alreadyAuthenticated: false },
		});

		// If server is already connected, no auth needed
		if (serverStatus.type === 'connected') {
			toolFormer.setBubbleData(bubbleId, {
				userDecision: 'accepted',
				status: 'completed',
				additionalData: { alreadyAuthenticated: true },
			});
			this.handledToolCalls.delete(toolCallId);
			return { result: { case: 'approved', value: {} } };
		}

		// Check if user already made a decision (e.g. on retry)
		const bubbleData = toolFormer.getBubbleData(bubbleId);
		if (bubbleData?.userDecision !== undefined) {
			this.handledToolCalls.delete(toolCallId);
			return bubbleData.userDecision === 'accepted'
				? this.performAuth(serverIdentifier, bubbleId, toolFormer)
				: { result: { case: 'rejected', value: { reason: 'User rejected MCP authentication' } } };
		}

		// Needs user approval — track trajectory stopped
		const composerId = this.context.composerDataHandle.data.composerId;
		this.context.trackTrajectoryStopped?.({
			composerId,
			invocationID: this.context.generationUUID,
			toolCallId,
			stop_category: 'needs_user_approval',
			stop_source: 'other',
			reason_code: 'mcp.needs_approval',
		});

		// Wait for user decision
		return new Promise<IMcpAuthRequestResponse>(resolve => {
			const disposer = toolFormer.addPendingDecision(
				bubbleId,
				ToolType.MCP_AUTH,
				toolCallId,
				(accepted: boolean) => {
					disposer();
					this.handledToolCalls.delete(toolCallId);

					if (accepted) {
						resolve(this.performAuth(serverIdentifier, bubbleId, toolFormer));
					} else {
						const skipReason =
							(toolFormer.getBubbleData(bubbleId)?.additionalData?.skipReason as string) === 'timeout'
								? 'User skipped MCP authentication (timeout)'
								: 'User skipped MCP authentication';

						resolve({
							result: { case: 'rejected', value: { reason: skipReason } },
						});
					}
				},
				true
			);
		});
	}

	private async performAuth(
		serverIdentifier: string,
		bubbleId: string,
		toolFormer: IToolFormer
	): Promise<IMcpAuthRequestResponse> {
		if (!performMcpAuthFlow) {
			return {
				result: { case: 'rejected', value: { reason: 'MCP auth flow runner not configured' } },
			};
		}

		const mcpService = this.getMcpService();
		const authFlowClient = this.createAuthFlowClient(bubbleId, mcpService, toolFormer);

		return performMcpAuthFlow({
			serverIdentifier,
			client: authFlowClient,
			abortSignal: this.context.conversationActionManager.signal,
		});
	}

	private createAuthFlowClient(
		bubbleId: string,
		mcpService: IMcpService,
		toolFormer: IToolFormer
	): IMcpAuthFlowClient {
		return {
			getStatus: (identifier: string) => mcpService.statusCache()[identifier],

			reloadClient: async (identifier: string) => {
				await mcpService.reloadClient(identifier);
			},

			onDidChangeServerStatus: (callback) =>
				mcpService.onDidChangeServerStatus(({ identifier, status }) => {
					callback({ identifier, status });
				}),

			openAuthorizationUrl: async (url: string) => {
				await this.getOpenerService().open(URI.parse(url));
			},

			hasUserRejectedAuth: () =>
				toolFormer.getBubbleData(bubbleId)?.userDecision === 'rejected',
		};
	}
}
