/*---------------------------------------------------------------------------------------------
 *  Tool Handler Types — Shared type definitions for agent tool call handlers.
 *
 *  These interfaces model the Cursor IDE agent system's internal types,
 *  extracted and typed from the deobfuscated bundle.
 *  Original symbol names are noted in comments for traceability.
 *--------------------------------------------------------------------------------------------*/

// IInstantiationService interface — standalone definition to avoid VS Code framework dependency
export interface IServiceAccessor {
	get<T>(id: unknown): T;
}

export interface IInstantiationService {
	invokeFunction<R>(fn: (accessor: IServiceAccessor) => R): R;
	createInstance<T>(ctor: unknown, ...args: unknown[]): T;
}

// ============================================================================
// Enums
// ============================================================================

/** Tool type identifiers used in the agent protocol. (Original: `on`) */
export const enum ToolType {
	ASK_QUESTION = 'ask_question',
	CREATE_PLAN = 'create_plan',
	WEB_SEARCH = 'web_search',
	WEB_FETCH = 'web_fetch',
	SWITCH_MODE = 'switch_mode',
	MCP_AUTH = 'mcp_auth',
	SHELL = 'shell',
	EDIT = 'edit',
	READ = 'read',
	TASK = 'task',
	TODO = 'todo',
}

/** Capability types for ComposerData. (Original: `ko`) */
export const enum CapabilityType {
	TOOL_FORMER = 'tool_former',
}

/** Review status for tool call bubbles. (Original: `BA`) */
export const enum ReviewStatus {
	REQUESTED = 'requested',
	APPROVED = 'approved',
	REJECTED = 'rejected',
}

/** Review option for tool call review UI. (Original: `rV`) */
export const enum ReviewOption {
	RUN = 'run',
	SKIP = 'skip',
	EDIT = 'edit',
}

/** Bubble type in conversation. (Original: `ul`) */
export const enum BubbleType {
	AI = 'ai',
	USER = 'user',
	SYSTEM = 'system',
}

// ============================================================================
// Trajectory Tracking
// ============================================================================

export interface TrajectoryStoppedInfo {
	composerId: string;
	invocationID: string | undefined;
	toolCallId: string;
	stop_category: string;
	stop_source: string;
	reason_code: string;
}

// ============================================================================
// ToolFormer — Central orchestrator for tool call bubbles
// ============================================================================

export interface IBubbleCreateOptions {
	toolCallId: string;
	toolIndex: number;
	modelCallId: string;
	toolCallType: ToolType;
	name: string;
	params?: unknown;
	rawArgs?: string;
	toolCall?: unknown;
}

export interface IBubbleData {
	tool?: ToolType;
	toolCallId?: string;
	name?: string;
	rawArgs?: string;
	params?: unknown;
	result?: unknown;
	status?: string;
	userDecision?: 'accepted' | 'rejected';
	additionalData?: Record<string, unknown>;
}

export interface IReviewData {
	status: ReviewStatus;
	selectedOption: ReviewOption;
	isShowingInput: boolean;
	highlightedOption: ReviewOption | undefined;
}

export interface IToolFormer {
	getOrCreateBubbleId(options: IBubbleCreateOptions): string;
	getBubbleIdByToolCallId(toolCallId: string): string | undefined;
	getBubbleData(bubbleId: string): IBubbleData | undefined;
	setBubbleData(bubbleId: string, data: Partial<IBubbleData>): void;
	acceptToolCall(toolCallId: string): void;
	addPendingDecision(
		bubbleId: string,
		toolType: ToolType,
		toolCallId: string,
		callback: (accepted: boolean) => void,
		requiresApproval: boolean
	): () => void;
	shouldAutoRun_runEverythingMode(): boolean;
	shouldAutoRun_eitherUseAllowlistOrRunEverythingMode(): boolean;
	handleToolResult(result: unknown, callId: string, isFinal: boolean): void;
}

// ============================================================================
// Composer Data Types
// ============================================================================

export interface ICapability {
	type: CapabilityType | string;
	// ToolFormer capabilities have IToolFormer methods
	[key: string]: unknown;
}

export interface IComposerDataHandle {
	data: {
		composerId: string;
		capabilities: Array<ICapability & Partial<IToolFormer>>;
		modelConfig?: { modelName?: string };
		generatingBubbleIds?: string[];
		fullConversationHeadersOnly?: Array<{ type: string; bubbleId: string }>;
		latestChatGenerationUUID?: string;
	};
}

export interface IModelConfig {
	modelName?: string;
}

export interface IComposerData {
	modelConfig?: IModelConfig;
	generatingBubbleIds?: string[];
	fullConversationHeadersOnly?: Array<{ type: string; bubbleId: string }>;
}

// ============================================================================
// Handler Context — Passed to all tool call handlers
// ============================================================================

export interface IToolCallHandlerContext {
	composerDataHandle: IComposerDataHandle;
	instantiationService: IInstantiationService;
	generationUUID?: string;
	trackTrajectoryStopped?: (info: TrajectoryStoppedInfo) => void;
	conversationActionManager: { signal: AbortSignal };
}

// ============================================================================
// Service Interfaces (used by handlers via DI)
// ============================================================================

export interface IComposerDataService {
	getComposerData(handle: IComposerDataHandle): IComposerData | undefined;
	updateComposerData(handle: IComposerDataHandle, data: Partial<IComposerData>): void;
	updateComposerDataSetStore(handle: IComposerDataHandle, setter: (key: string, value: unknown) => void): void;
}

export interface IAnalyticsService {
	trackEvent(eventName: string, properties?: Record<string, unknown>): void;
}

export interface IComposerModesService {
	getComposerUnifiedMode(composerId: string): string | undefined;
	setComposerUnifiedMode(handle: IComposerDataHandle, mode: string): void;
}

export interface IReactiveStorageService {
	applicationUserPersistentStorage: {
		composerState?: {
			autoAcceptWebSearchTool?: boolean;
			webFetchDomainAllowlist?: string[];
			autoApprovedModeTransitions?: string[];
			autoRejectedModeTransitions?: string[];
		};
		cursorCreds?: Record<string, unknown>;
		backgroundComposerEnv?: string;
	};
	setApplicationUserPersistentStorage(key: string, value: unknown): void;
}

export interface IMcpServerStatus {
	type: string;
}

export interface IMcpService {
	statusCache(): Record<string, IMcpServerStatus>;
	reloadClient(identifier: string): Promise<void>;
	onDidChangeServerStatus(callback: (event: { identifier: string; status: IMcpServerStatus }) => void): { dispose(): void };
}

// ============================================================================
// Ask Question Types
// ============================================================================

export interface IAskQuestionOption {
	id: string;
	label: string;
}

export interface IAskQuestionQuestion {
	id: string;
	prompt: string;
	allowMultiple?: boolean;
	options: IAskQuestionOption[];
}

export interface IAskQuestionParams {
	title: string;
	questions: IAskQuestionQuestion[];
	runAsync?: boolean;
}

export interface IAskQuestionAnswer {
	questionId: string;
	selectedOptionIds: string[];
	freeformText?: string;
}

export interface IAskQuestionResult {
	answers: IAskQuestionAnswer[];
	isAsync?: boolean;
}

export interface IAskQuestionRequestResponse {
	result: IAskQuestionRequestResult;
}

export interface IAskQuestionRequestResult {
	result:
		| { case: 'success'; value: IAskQuestionSuccess }
		| { case: 'rejected'; value: { reason: string } }
		| { case: 'async'; value: Record<string, never> }
		| { case: undefined };
}

export interface IAskQuestionSuccess {
	answers: IAskQuestionAnswer[];
}

export interface IAskQuestionRequest {
	args?: {
		title?: string;
		questions?: IAskQuestionQuestion[];
		runAsync?: boolean;
		asyncOriginalToolCallId?: string;
		toolCallId?: string;
	};
	toolCallId: string;
}

// ============================================================================
// Web Search Types
// ============================================================================

export interface IWebSearchParams {
	searchTerm: string;
}

export interface IWebSearchRequestResponse {
	result:
		| { case: 'approved'; value: Record<string, never> }
		| { case: 'rejected'; value: { reason: string } };
}

export interface IWebSearchRequest {
	args?: {
		searchTerm?: string;
		toolCallId?: string;
	};
}

// ============================================================================
// Web Fetch Types
// ============================================================================

export interface IWebFetchParams {
	url: string;
}

export interface IWebFetchRequestResponse {
	result:
		| { case: 'approved'; value: Record<string, never> }
		| { case: 'rejected'; value: { reason: string } };
}

export interface IWebFetchRequest {
	args?: {
		url?: string;
		toolCallId?: string;
	};
	skipApproval?: boolean;
}

// ============================================================================
// Switch Mode Types
// ============================================================================

export interface ISwitchModeParams {
	fromModeId: string;
	toModeId: string;
	explanation?: string;
}

export interface ISwitchModeRequestResponse {
	result:
		| { case: 'approved'; value: Record<string, never> }
		| { case: 'rejected'; value: { reason: string } };
}

export interface ISwitchModeRequest {
	args?: {
		targetModeId?: string;
		explanation?: string;
		toolCallId?: string;
	};
}

// ============================================================================
// MCP Auth Types
// ============================================================================

export interface IMcpAuthParams {
	serverIdentifier: string;
}

export interface IMcpAuthRequestResponse {
	result:
		| { case: 'approved'; value: Record<string, never> }
		| { case: 'rejected'; value: { reason: string } };
}

export interface IMcpAuthRequest {
	args?: {
		serverIdentifier?: string;
		toolCallId?: string;
	};
}

export interface IMcpAuthFlowClient {
	getStatus(identifier: string): IMcpServerStatus | undefined;
	reloadClient(identifier: string): Promise<void>;
	onDidChangeServerStatus(callback: (event: { identifier: string; status: IMcpServerStatus }) => void): { dispose(): void };
	openAuthorizationUrl(url: string): Promise<void>;
	hasUserRejectedAuth(): boolean;
}

/** Shared auth flow runner (Original: `K4A`) */
export type PerformMcpAuthFlow = (options: {
	serverIdentifier: string;
	client: IMcpAuthFlowClient;
	abortSignal: AbortSignal;
}) => Promise<IMcpAuthRequestResponse>;
