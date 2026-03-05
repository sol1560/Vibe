/*---------------------------------------------------------------------------------------------
 *  Web Search Query Handler — TypeScript conversion from Cursor IDE bundle.
 *
 *  Handles the server-initiated web_search query (InteractionQuery).
 *  Manages auto-approve via user settings and pending decision approval.
 *
 *  Original class: FSf (WebSearchQueryHandler)
 *--------------------------------------------------------------------------------------------*/

import {
	CapabilityType,
	IReactiveStorageService,
	IToolCallHandlerContext,
	IToolFormer,
	IWebSearchParams,
	IWebSearchRequest,
	IWebSearchRequestResponse,
	ToolType,
} from '../toolHandlerTypes.js';

// ============================================================================
// WebSearchQueryHandler
// ============================================================================

export class WebSearchQueryHandler {

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

	async handleWebSearchRequest(request: IWebSearchRequest): Promise<IWebSearchRequestResponse> {
		const toolFormer = this.getToolFormer();
		const reactiveStorageService = this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get<IReactiveStorageService>(undefined as never)
		);

		const searchTerm = request.args?.searchTerm ?? '';
		const toolCallId = request.args?.toolCallId;

		if (!toolCallId) {
			return {
				result: { case: 'rejected', value: { reason: 'Missing toolCallId' } },
			};
		}

		const params: IWebSearchParams = { searchTerm };
		const rawArgs = JSON.stringify({ searchTerm });

		const bubbleId = toolFormer.getOrCreateBubbleId({
			toolCallId,
			toolIndex: 0,
			modelCallId: toolCallId,
			toolCallType: ToolType.WEB_SEARCH,
			params: { case: 'webSearchParams', value: params },
			rawArgs,
			name: 'web_search',
		});

		toolFormer.setBubbleData(bubbleId, {
			tool: ToolType.WEB_SEARCH,
			toolCallId,
			name: 'web_search',
			rawArgs,
			params,
		});

		// Auto-approve: "run everything" mode or user has enabled autoAcceptWebSearchTool
		if (
			toolFormer.shouldAutoRun_runEverythingMode() ||
			reactiveStorageService.applicationUserPersistentStorage
				?.composerState?.autoAcceptWebSearchTool === true
		) {
			toolFormer.acceptToolCall(toolCallId);
			return {
				result: { case: 'approved', value: {} },
			};
		}

		// Needs user approval — track trajectory stopped
		this.context.trackTrajectoryStopped?.({
			composerId: this.context.composerDataHandle.data.composerId,
			invocationID: this.context.generationUUID,
			toolCallId,
			stop_category: 'needs_user_approval',
			stop_source: 'other',
			reason_code: 'web_search.needs_approval',
		});

		// Wait for user decision
		return new Promise<IWebSearchRequestResponse>(resolve => {
			const disposer = toolFormer.addPendingDecision(
				bubbleId,
				ToolType.WEB_SEARCH,
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
}
