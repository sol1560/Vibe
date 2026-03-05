/*---------------------------------------------------------------------------------------------
 *  Ask Question Query Handler — TypeScript conversion from Cursor IDE bundle.
 *
 *  Handles the server-initiated ask_question query (InteractionQuery).
 *  Manages pending user decisions, analytics, and generating state.
 *
 *  Original class: Qhu (AskQuestionQueryHandler)
 *--------------------------------------------------------------------------------------------*/

import {
	BubbleType,
	CapabilityType,
	IAskQuestionAnswer,
	IAskQuestionParams,
	IAskQuestionRequestResponse,
	IAskQuestionRequestResult,
	IAskQuestionRequest,
	IAskQuestionResult,
	IAskQuestionSuccess,
	IAnalyticsService,
	IComposerData,
	IComposerDataHandle,
	IComposerDataService,
	IToolCallHandlerContext,
	IToolFormer,
	ToolType,
} from '../toolHandlerTypes.js';

// ============================================================================
// ToolCallRejectedError
// ============================================================================

export class ToolCallRejectedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ToolCallRejectedError';
	}
}

// Shared result cache for ask_question answers across handler/query paths
const askQuestionResultCache = new Map<string, IAskQuestionResult>();

// ============================================================================
// AskQuestionQueryHandler
// ============================================================================

export class AskQuestionQueryHandler {
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
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get<IComposerDataService>(undefined as never)
		);
	}

	private getAnalyticsService(): IAnalyticsService {
		return this.context.instantiationService.invokeFunction(
			(accessor: import('../toolHandlerTypes.js').IServiceAccessor) => accessor.get<IAnalyticsService>(undefined as never)
		);
	}

	async handleAskQuestionRequest(request: IAskQuestionRequest): Promise<IAskQuestionRequestResponse> {
		const toolFormer = this.getToolFormer();
		const composerId = this.context.composerDataHandle.data.composerId;
		const args = request.args;
		const toolCallId = request.toolCallId;
		const isRunAsync = args?.runAsync ?? false;

		const params: IAskQuestionParams = {
			title: args?.title ?? '',
			questions: (args?.questions ?? []).map(q => ({
				id: q.id,
				prompt: q.prompt,
				allowMultiple: q.allowMultiple ?? false,
				options: q.options.map(opt => ({
					id: opt.id,
					label: opt.label,
				})),
			})),
			runAsync: isRunAsync,
		};

		const bubbleId = toolFormer.getOrCreateBubbleId({
			toolCallId,
			toolIndex: 0,
			modelCallId: '',
			toolCallType: ToolType.ASK_QUESTION,
			name: 'ask_question',
			params: { case: 'askQuestionParams', value: params },
		});

		const bubbleData = toolFormer.getBubbleData(bubbleId);
		const existingStatus = bubbleData?.additionalData && 'status' in bubbleData.additionalData
			? bubbleData.additionalData.status as string
			: undefined;

		// Set bubble to loading state
		if (existingStatus !== 'submitted') {
			toolFormer.setBubbleData(bubbleId, {
				params,
				status: 'loading',
				additionalData: { status: 'pending' },
			});
		} else {
			toolFormer.setBubbleData(bubbleId, {
				params,
				status: 'loading',
			});
		}

		// If async mode, return immediately
		if (isRunAsync) {
			return {
				result: {
					result: { case: 'async', value: {} },
				},
			};
		}

		// Track trajectory stopped for user approval
		this.context.trackTrajectoryStopped?.({
			composerId,
			invocationID: this.context.generationUUID,
			toolCallId,
			stop_category: 'needs_user_approval',
			stop_source: 'other',
			reason_code: 'questionnaire.needs_input',
		});

		// If already handled this tool call, return cached result
		if (this.handledToolCalls.has(toolCallId)) {
			const cachedResult = askQuestionResultCache.get(toolCallId);
			return this.convertToAgentResult(cachedResult);
		}

		// If already submitted, return cached result
		if (existingStatus === 'submitted') {
			const cachedResult = askQuestionResultCache.get(toolCallId);
			if (cachedResult) {
				this.handledToolCalls.add(toolCallId);
				return this.convertToAgentResult(cachedResult);
			}
			console.warn('[AskQuestionQueryHandler] Status is submitted but result was lost, returning empty result');
			this.handledToolCalls.add(toolCallId);
			return this.convertToAgentResult({ answers: [] });
		}

		// If cancelled, return rejected
		if (existingStatus === 'cancelled') {
			this.handledToolCalls.add(toolCallId);
			return {
				result: {
					result: { case: 'rejected', value: { reason: 'User cancelled questionnaire' } },
				},
			};
		}

		// Wait for user interaction via pending decision
		this.handledToolCalls.add(toolCallId);
		toolFormer.setBubbleData(bubbleId, {
			params,
			status: 'completed',
			additionalData: { status: 'pending' },
		});

		this.setGeneratingState(composerId, false);

		return new Promise<IAskQuestionRequestResponse>((resolve) => {
			let resolved = false;

			const rejectWithReason = (reason: string): void => {
				if (resolved) {
					return;
				}
				resolved = true;
				this.trackAnalytics(composerId, params, false, false);
				this.setGeneratingState(composerId, true);
				resolve({
					result: {
						result: { case: 'rejected', value: { reason } },
					},
				});
			};

			toolFormer.addPendingDecision(
				bubbleId,
				ToolType.ASK_QUESTION,
				toolCallId,
				(accepted: boolean) => {
					if (resolved) {
						return;
					}

					if (!accepted) {
						rejectWithReason('User cancelled questionnaire');
						toolFormer.setBubbleData(bubbleId, {
							additionalData: { status: 'cancelled' },
						});
						this.handledToolCalls.delete(toolCallId);
						askQuestionResultCache.delete(toolCallId);
						return;
					}

					const result = askQuestionResultCache.get(toolCallId);
					if (!result) {
						console.error('[AskQuestionQueryHandler] Accepted but no result was stored');
						rejectWithReason('Questionnaire was accepted but no result was available');
						toolFormer.setBubbleData(bubbleId, { status: 'error' });
						this.handledToolCalls.delete(toolCallId);
						return;
					}

					const allAnswered = params.questions?.every(q =>
						(result.answers?.find(a => a.questionId === q.id)?.selectedOptionIds?.length ?? 0) > 0
					) ?? false;

					resolved = true;
					this.trackAnalytics(composerId, params, true, allAnswered);
					this.setGeneratingState(composerId, true);
					this.handledToolCalls.delete(toolCallId);
					askQuestionResultCache.delete(toolCallId);
					resolve(this.convertToAgentResult(result));
				},
				true
			);
		});
	}

	private convertToAgentResult(result: IAskQuestionResult | undefined): IAskQuestionRequestResponse {
		if (!result || result.answers.length === 0) {
			return {
				result: {
					result: { case: 'success', value: { answers: [] } },
				},
			};
		}

		return {
			result: {
				result: {
					case: 'success',
					value: {
						answers: result.answers.map(answer => ({
							questionId: answer.questionId,
							selectedOptionIds: answer.selectedOptionIds,
							freeformText: answer.freeformText,
						})),
					},
				},
			},
		};
	}

	private trackAnalytics(composerId: string, params: IAskQuestionParams, submitted: boolean, allQuestionsAnswered: boolean): void {
		try {
			const composerData = this.getComposerDataService().getComposerData(
				this.context.composerDataHandle
			);
			this.getAnalyticsService().trackEvent('ask_question_invoked', {
				number_of_questions: params?.questions?.length ?? 0,
				submitted,
				all_questions_answered: allQuestionsAnswered,
				model: composerData?.modelConfig?.modelName,
			});
		} catch { /* ignore tracking errors */ }
	}

	private getLastAiBubbleId(_composerId: string): string | undefined {
		const composerData = this.getComposerDataService().getComposerData(
			this.context.composerDataHandle
		);
		if (composerData) {
			return [...(composerData.fullConversationHeadersOnly ?? [])]
				.reverse()
				.find(header => header.type === BubbleType.AI)?.bubbleId;
		}
		return undefined;
	}

	private setGeneratingState(composerId: string, isGenerating: boolean): void {
		const lastAiBubbleId = this.getLastAiBubbleId(composerId);
		if (!lastAiBubbleId) {
			return;
		}

		const composerDataService = this.getComposerDataService();
		const generatingBubbleIds =
			composerDataService.getComposerData(this.context.composerDataHandle)
				?.generatingBubbleIds ?? [];
		const isAlreadyGenerating = generatingBubbleIds.includes(lastAiBubbleId);

		if (isGenerating && !isAlreadyGenerating) {
			composerDataService.updateComposerData(this.context.composerDataHandle, {
				generatingBubbleIds: [...generatingBubbleIds, lastAiBubbleId],
			});
		} else if (!isGenerating && isAlreadyGenerating) {
			composerDataService.updateComposerData(this.context.composerDataHandle, {
				generatingBubbleIds: generatingBubbleIds.filter(id => id !== lastAiBubbleId),
			});
		}

		composerDataService.updateComposerDataSetStore(
			this.context.composerDataHandle,
			(key: string, value: unknown) => { /* setter callback */ }
		);
	}
}
