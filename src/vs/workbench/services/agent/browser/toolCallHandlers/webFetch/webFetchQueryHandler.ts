/*---------------------------------------------------------------------------------------------
 *  Web Fetch Query Handler — TypeScript conversion from Cursor IDE bundle.
 *
 *  Handles the server-initiated web_fetch query (InteractionQuery).
 *  Manages auto-approve via domain allowlist with wildcard support.
 *
 *  Original class: OSf (WebFetchQueryHandler)
 *--------------------------------------------------------------------------------------------*/

import {
	CapabilityType,
	IReactiveStorageService,
	IToolCallHandlerContext,
	IToolFormer,
	IWebFetchParams,
	IWebFetchRequest,
	IWebFetchRequestResponse,
	ReviewOption,
	ReviewStatus,
	ToolType,
} from '../toolHandlerTypes.js';

// ============================================================================
// WebFetchQueryHandler
// ============================================================================

export class WebFetchQueryHandler {

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

	async handleWebFetchRequest(request: IWebFetchRequest): Promise<IWebFetchRequestResponse> {
		const toolFormer = this.getToolFormer();
		const reactiveStorageService = this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get<IReactiveStorageService>(undefined as never)
		);

		const url = request.args?.url ?? '';
		const toolCallId = request.args?.toolCallId;

		if (!toolCallId) {
			return {
				result: { case: 'rejected', value: { reason: 'Missing toolCallId' } },
			};
		}

		const params: IWebFetchParams = { url };
		const rawArgs = JSON.stringify({ url });

		const bubbleId = toolFormer.getOrCreateBubbleId({
			toolCallId,
			toolIndex: 0,
			modelCallId: toolCallId,
			toolCallType: ToolType.WEB_FETCH,
			params: { case: 'webFetchParams', value: params },
			rawArgs,
			name: 'web_fetch',
		});

		toolFormer.setBubbleData(bubbleId, {
			tool: ToolType.WEB_FETCH,
			toolCallId,
			name: 'web_fetch',
			rawArgs,
			params,
		});

		// Skip approval if explicitly flagged
		if (request.skipApproval) {
			toolFormer.acceptToolCall(toolCallId);
			return {
				result: { case: 'approved', value: {} },
			};
		}

		// Auto-approve via domain allowlist or "run everything" mode
		if (this.shouldAutoApproveWebFetch(url, reactiveStorageService, toolFormer)) {
			toolFormer.acceptToolCall(toolCallId);
			return {
				result: { case: 'approved', value: {} },
			};
		}

		// Needs user approval — set review data on bubble
		toolFormer.setBubbleData(bubbleId, {
			additionalData: {
				reviewData: {
					status: ReviewStatus.REQUESTED,
					selectedOption: ReviewOption.RUN,
					isShowingInput: false,
					highlightedOption: undefined,
				},
			},
		});

		// Track trajectory stopped
		this.context.trackTrajectoryStopped?.({
			composerId: this.context.composerDataHandle.data.composerId,
			invocationID: this.context.generationUUID,
			toolCallId,
			stop_category: 'needs_user_approval',
			stop_source: 'other',
			reason_code: 'web_fetch.needs_approval',
		});

		// Wait for user decision
		return new Promise<IWebFetchRequestResponse>(resolve => {
			const disposer = toolFormer.addPendingDecision(
				bubbleId,
				ToolType.WEB_FETCH,
				toolCallId,
				(accepted: boolean) => {
					disposer();
					resolve({
						result: accepted
							? { case: 'approved', value: {} }
							: { case: 'rejected', value: { reason: 'User chose to skip' } },
					});
				},
				true
			);
		});
	}

	/**
	 * Determines if web fetch should be auto-approved based on domain allowlist.
	 * Supports wildcard patterns:
	 *   - "*" matches all domains
	 *   - "*.example.com" matches example.com and all subdomains
	 *   - "example.com" matches exact domain
	 */
	private shouldAutoApproveWebFetch(
		url: string,
		reactiveStorageService: IReactiveStorageService,
		toolFormer: IToolFormer
	): boolean {
		if (toolFormer.shouldAutoRun_runEverythingMode()) {
			return true;
		}

		if (toolFormer.shouldAutoRun_eitherUseAllowlistOrRunEverythingMode()) {
			const allowlist =
				reactiveStorageService.applicationUserPersistentStorage
					?.composerState?.webFetchDomainAllowlist ?? [];

			if (allowlist.length === 0) {
				return false;
			}

			let hostname: string;
			try {
				hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
			} catch {
				return false;
			}

			return allowlist.some(pattern => {
				if (pattern === '*') {
					return true;
				}
				if (pattern.startsWith('*.')) {
					const domain = pattern.slice(2);
					return hostname === domain || hostname.endsWith('.' + domain);
				}
				return pattern === hostname;
			});
		}

		return false;
	}
}
