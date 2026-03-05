/*---------------------------------------------------------------------------------------------
 *  Switch Mode Query Handler — TypeScript conversion from Cursor IDE bundle.
 *
 *  Handles the server-initiated switch_mode query (InteractionQuery).
 *  Manages mode transitions (e.g. agent -> plan) with auto-approved/auto-rejected lists.
 *
 *  Original class: MSf (SwitchModeQueryHandler)
 *--------------------------------------------------------------------------------------------*/

import {
	CapabilityType,
	IAnalyticsService,
	IComposerDataService,
	IComposerModesService,
	IReactiveStorageService,
	ISwitchModeParams,
	ISwitchModeRequest,
	ISwitchModeRequestResponse,
	IToolCallHandlerContext,
	IToolFormer,
	ToolType,
} from '../toolHandlerTypes.js';

// ============================================================================
// SwitchModeQueryHandler
// ============================================================================

export class SwitchModeQueryHandler {
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

	private getComposerDataService(): IComposerDataService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as IComposerDataService;
	}

	private getComposerModesService(): IComposerModesService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as IComposerModesService;
	}

	private getReactiveStorageService(): IReactiveStorageService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as IReactiveStorageService;
	}

	private getAnalyticsService(): IAnalyticsService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get(undefined as never)
		) as unknown as IAnalyticsService;
	}

	async handleSwitchModeRequest(request: ISwitchModeRequest): Promise<ISwitchModeRequestResponse> {
		const toolFormer = this.getToolFormer();
		const composerModesService = this.getComposerModesService();
		const reactiveStorageService = this.getReactiveStorageService();
		const analyticsService = this.getAnalyticsService();
		const composerDataService = this.getComposerDataService();
		const composerId = this.context.composerDataHandle.data.composerId;
		const toolCallId = request.args?.toolCallId;

		if (!toolCallId) {
			return {
				result: { case: 'rejected', value: { reason: 'Missing toolCallId' } },
			};
		}

		const targetModeId = request.args?.targetModeId ?? '';
		const currentModeId = composerModesService.getComposerUnifiedMode(composerId) || 'agent';
		const explanation = request.args?.explanation;

		const params: ISwitchModeParams = {
			fromModeId: currentModeId,
			toModeId: targetModeId,
			explanation,
		};
		const rawArgs = JSON.stringify({
			fromModeId: currentModeId,
			toModeId: targetModeId,
			explanation,
		});

		const bubbleId = toolFormer.getOrCreateBubbleId({
			toolCallId,
			toolIndex: 0,
			modelCallId: toolCallId,
			toolCallType: ToolType.SWITCH_MODE,
			params: { case: 'switchModeParams', value: params },
			rawArgs,
			name: 'switch_mode',
		});

		toolFormer.setBubbleData(bubbleId, {
			tool: ToolType.SWITCH_MODE,
			toolCallId,
			name: 'switch_mode',
			rawArgs,
			params,
		});

		// Check if user already made a decision (e.g. on retry)
		const bubbleData = toolFormer.getBubbleData(bubbleId);
		if (bubbleData?.userDecision !== undefined) {
			return bubbleData.userDecision === 'accepted'
				? this.performModeSwitch(composerId, currentModeId, targetModeId)
				: { result: { case: 'rejected', value: { reason: 'User rejected the mode switch' } } };
		}

		// No-op if switching to same mode
		if (currentModeId === targetModeId) {
			toolFormer.setBubbleData(bubbleId, { userDecision: 'accepted' });
			return { result: { case: 'approved', value: {} } };
		}

		// Prevent duplicate handling
		if (this.handledToolCalls.has(toolCallId)) {
			return {
				result: { case: 'rejected', value: { reason: 'Mode switch already handled' } },
			};
		}
		this.handledToolCalls.add(toolCallId);

		const transitionKey = `${currentModeId}->${targetModeId}`;

		// Check auto-rejected transitions
		const autoRejected =
			reactiveStorageService.applicationUserPersistentStorage
				?.composerState?.autoRejectedModeTransitions || [];

		if (autoRejected.includes(transitionKey)) {
			toolFormer.setBubbleData(bubbleId, { userDecision: 'rejected' });
			const composerData = composerDataService.getComposerData(this.context.composerDataHandle);
			analyticsService.trackEvent('switch_mode_invoked', {
				fromModeId: currentModeId,
				toModeId: targetModeId,
				accepted: false,
				model: composerData?.modelConfig?.modelName,
			});
			this.handledToolCalls.delete(toolCallId);
			return {
				result: {
					case: 'rejected',
					value: { reason: `Mode switch from ${currentModeId} to ${targetModeId} is disabled by user preference` },
				},
			};
		}

		// Check auto-approved transitions
		const autoApproved =
			reactiveStorageService.applicationUserPersistentStorage
				?.composerState?.autoApprovedModeTransitions || [];

		if (autoApproved.includes(transitionKey)) {
			toolFormer.setBubbleData(bubbleId, { userDecision: 'accepted' });
			this.handledToolCalls.delete(toolCallId);
			return this.performModeSwitch(composerId, currentModeId, targetModeId);
		}

		// Needs user approval — track trajectory stopped
		this.context.trackTrajectoryStopped?.({
			composerId,
			invocationID: this.context.generationUUID,
			toolCallId,
			stop_category: 'needs_user_approval',
			stop_source: 'other',
			reason_code: 'switch_mode.needs_approval',
		});

		// Wait for user decision
		return new Promise<ISwitchModeRequestResponse>(resolve => {
			const disposer = toolFormer.addPendingDecision(
				bubbleId,
				ToolType.SWITCH_MODE,
				toolCallId,
				(accepted: boolean) => {
					disposer();
					this.handledToolCalls.delete(toolCallId);

					if (accepted) {
						resolve(this.performModeSwitch(composerId, currentModeId, targetModeId));
					} else {
						const composerData = composerDataService.getComposerData(
							this.context.composerDataHandle
						);
						analyticsService.trackEvent('switch_mode_invoked', {
							fromModeId: currentModeId,
							toModeId: targetModeId,
							accepted: false,
							model: composerData?.modelConfig?.modelName,
						});
						resolve({
							result: { case: 'rejected', value: { reason: 'User rejected the mode switch' } },
						});
					}
				},
				true
			);
		});
	}

	private performModeSwitch(
		composerId: string,
		fromModeId: string,
		toModeId: string,
	): ISwitchModeRequestResponse {
		const composerModesService = this.getComposerModesService();
		const composerDataService = this.getComposerDataService();
		const analyticsService = this.getAnalyticsService();

		const composerData = composerDataService.getComposerData(this.context.composerDataHandle);
		analyticsService.trackEvent('switch_mode_invoked', {
			fromModeId,
			toModeId,
			accepted: true,
			model: composerData?.modelConfig?.modelName,
		});

		if (toModeId === 'plan') {
			analyticsService.trackEvent('composer.plan_mode.entry_point', {
				entrypoint: 'switch_mode_tool',
				model: composerData?.modelConfig?.modelName || 'unknown',
			});
		}

		composerModesService.setComposerUnifiedMode(this.context.composerDataHandle, toModeId);

		return { result: { case: 'approved', value: {} } };
	}
}
