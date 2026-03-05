/*---------------------------------------------------------------------------------------------
 *  Repository Service Types — Shared type definitions for the codebase indexing system.
 *
 *  Extracted from Cursor IDE bundle RepositoryService (oAa).
 *--------------------------------------------------------------------------------------------*/

import { URI, createDecorator, type Event } from './vscodeShims.js';

// ============================================================================
// Service Identifier
// ============================================================================

export const IRepositoryService = createDecorator<IRepositoryService>('repositoryService');

// ============================================================================
// Enums
// ============================================================================

export const enum GitStatus {
	INDEX_MODIFIED = 0,
	INDEX_ADDED = 1,
	INDEX_DELETED = 2,
	INDEX_RENAMED = 3,
	INDEX_COPIED = 4,
	MODIFIED = 5,
	DELETED = 6,
	UNTRACKED = 7,
	IGNORED = 8,
	INTENT_TO_ADD = 9,
	ADDED_BY_US = 10,
	ADDED_BY_THEM = 11,
	DELETED_BY_US = 12,
	DELETED_BY_THEM = 13,
	BOTH_ADDED = 14,
	BOTH_DELETED = 15,
	BOTH_MODIFIED = 16,
}

// ============================================================================
// Indexing Types
// ============================================================================

export type IndexingStatusCase =
	| 'not-indexed'
	| 'not-auto-indexing'
	| 'error'
	| 'indexing-setup'
	| 'indexing-init-from-similar-codebase'
	| 'indexing'
	| 'synced'
	| 'paused'
	| 'loading'
	| 'out-of-sync'
	| 'creating-index';

export interface IIndexingStatus {
	case: IndexingStatusCase;
	error?: string;
	numFiles?: number;
}

export interface IIndexingProgress {
	progress: number;
}

export interface IRepositoryInfo {
	id?: string;
	repoName: string;
	repoOwner: string;
	relativeWorkspacePath?: string;
}

export interface IQueryOnlyIndex {
	repositoryInfo: IRepositoryInfo;
	pathEncryptionKey?: string;
	queryOnlyRepoAccess?: unknown;
}

// ============================================================================
// Code Search Types
// ============================================================================

export interface ICodeBlockRange {
	startPosition?: { line: number; column: number };
	endPosition?: { line: number; column: number };
}

export interface IRemoteCodeBlock {
	relativeWorkspacePath: string;
	range?: ICodeBlockRange;
	contents?: string;
	signatures?: { ranges?: ICodeBlockRange[] };
}

export interface ILocalCodeBlock {
	detailedLines: Array<{ lineNumber: number; text: string; isSignature: boolean }>;
	contents: string;
	originalContents: string;
	relativeWorkspacePath: string;
	range: ICodeBlockRange;
}

export interface ISearchResult {
	score: number;
	codeBlock?: ILocalCodeBlock | IRemoteCodeBlock;
}

export interface ISearchQuery {
	text: string;
	globsNewLineSeparated?: string;
}

export interface ISearchOptions {
	includePattern?: string;
	excludePattern?: string;
	globFilter?: string;
	abortSignal?: AbortSignal;
	silent?: boolean;
	contextCacheRequest?: unknown;
	topK?: number;
	excludeCursorIgnored?: boolean;
	overridePathEncryptionKey?: string;
	repoInfo?: IRepositoryInfo;
	newlineSepGlobFilter?: string;
}

export interface IFileMatch {
	resource: URI;
	results: Array<{
		uri: URI;
		previewText: string;
		rangeLocations: Array<{
			source: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
			preview: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
		}>;
	}>;
}

// ============================================================================
// Indexing Provider Interface
// ============================================================================

export interface IIndexingProvider {
	getGlobalStatus(): Promise<IIndexingStatus | undefined>;
	getCodebases(): Promise<string[] | undefined>;
	getIndexingProgress(codebase: string): Promise<number | undefined>;
	getCurrentJobs(codebase: string): Promise<unknown | undefined>;
	getRepoInfo(): Promise<IRepositoryInfo | undefined>;
	getQueryOnlyRepoInfo(): Promise<IQueryOnlyIndex | undefined>;
	getEmbeddableFilesPath(): Promise<{ scheme: string; path: string } | undefined>;
	getPathEncryptionKey(): Promise<string | undefined>;
	compileGlobFilter(options: { globFilter?: string; notGlobFilter?: string; overridePathEncryptionKey?: string }): Promise<{ globFilter?: string; notGlobFilter?: string }>;
	decryptPaths(options: { paths: string[]; overridePathEncryptionKey?: string }): Promise<string[]>;
}

export interface IGrepProvider {
	// Grep provider interface — details TBD from further deobfuscation
}

export interface IDiffProvider {
	// Diff provider interface — details TBD from further deobfuscation
}

// ============================================================================
// IRepositoryService — Main Service Interface
// ============================================================================

export interface IRepositoryService {
	readonly _serviceBrand: undefined;

	// Indexing state
	readonly indexingGrepEnabled: boolean;
	readonly primaryQueryOnlyIndex: IQueryOnlyIndex | undefined;

	setQueryOnlyIndex(index: IQueryOnlyIndex | undefined): void;

	// Indexing provider management
	registerIndexingProvider(provider: IIndexingProvider): void;
	unregisterIndexingProvider(): void;
	registerGrepProvider(provider: IGrepProvider): void;
	unregisterGrepProvider(): void;
	registerDiffProvider(provider: IDiffProvider): void;
	setIsUriCursorIgnored(fn: (uri: URI) => boolean): void;
	fireOnDidChangeIndexingStatus(): void;

	// Repository info
	getNewRepoInfo(): Promise<IRepositoryInfo | undefined>;
	getPathEncryptionKey(): Promise<string | undefined>;
	isIndexedRepository(): boolean;
	isIndexedMainLocalRepository(options?: { indexingProgressThreshold?: number }): boolean;
	getIndexingProgress(): number;
	getIndexingPhase(): IndexingStatusCase | undefined;
	getNumFilesInUnindexedRepo(): number | undefined;

	// Indexing operations
	indexMainRepository(force?: boolean): Promise<void>;
	deleteMainLocalRepository(): Promise<void>;
	pauseIndexingJob(): Promise<void>;
	syncIndexWithGivenRepositoryInfo(repoInfo: IRepositoryInfo): void;

	// Search operations
	semanticSearch(searchQuery: { contentPattern: { pattern: string } }, options: unknown, onResult?: (match: IFileMatch) => void): Promise<{ results: IFileMatch[]; messages: unknown[] }>;
	parallelSearch(query: string, topK?: number, maxK?: number, options?: ISearchOptions): Promise<ISearchResult[]>;
	parallelSearchGetContents(query: string, topK?: number, maxK?: number, options?: ISearchOptions): Promise<ISearchResult[]>;
	searchMultipleQueries(queries: ISearchQuery[], limits: { topK: number; minK: number; finalK: number }, options?: ISearchOptions): Promise<ISearchResult[]>;

	// Embeddings
	getEmbeddings(...texts: string[]): Promise<number[][]>;

	// Code block conversion
	codeBlockFromRemote(codeBlock: IRemoteCodeBlock): Promise<ILocalCodeBlock | null>;
	getEmbeddableFilesPath(): Promise<URI | undefined>;

	// Auth
	getRepoAuthId(): Promise<string | undefined>;

	// Events
	readonly onDidRequestRepoIndex: Event<{ forceOverrideRepoInfo?: IRepositoryInfo } | undefined>;
	readonly onDidRequestRepoInterrupt: Event<boolean>;
	readonly onDidChangeIndexingStatus: Event<void>;
	readonly onDidChangeIndexingGrepEnabled: Event<boolean>;
}
