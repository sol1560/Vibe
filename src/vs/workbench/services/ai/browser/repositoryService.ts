/*---------------------------------------------------------------------------------------------
 *  Repository Service — TypeScript conversion from Cursor IDE bundle.
 *
 *  Manages codebase indexing, semantic search, and repository operations.
 *  Provides embedding-based code search and integration with the indexing provider.
 *
 *  Original class: oAa (RepositoryService)
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Emitter, Event, URI, registerSingleton, InstantiationType } from './vscodeShims.js';
import {
	IDiffProvider,
	IFileMatch,
	IGrepProvider,
	IIndexingProvider,
	IIndexingProgress,
	IIndexingStatus,
	IndexingStatusCase,
	ILocalCodeBlock,
	IQueryOnlyIndex,
	IRemoteCodeBlock,
	IRepositoryInfo,
	IRepositoryService,
	ISearchOptions,
	ISearchQuery,
	ISearchResult,
} from './repositoryServiceTypes.js';

// ============================================================================
// RepositoryService Implementation
// ============================================================================

export class RepositoryService extends Disposable implements IRepositoryService {

	declare readonly _serviceBrand: undefined;

	// --- Indexing State ---
	private _indexingGrepEnabled = false;
	private _primaryQueryOnlyIndex: IQueryOnlyIndex | undefined;
	private queryOnlyIndexFromIndexProvider: IQueryOnlyIndex | undefined;
	private repositoryLastSyncedTime: number | undefined;
	private _suppressFileExtensionRecommendationsStart: number | undefined;

	// --- Providers ---
	private indexingProvider: IIndexingProvider | undefined;
	private grepProvider: IGrepProvider | undefined;
	private diffProvider: IDiffProvider | null = null;
	private isUriCursorIgnoredFn: (uri: URI) => boolean = () => false;

	// --- Observable State ---
	private readonly repositoryIndexingError: { value: string | undefined; change(v: string | undefined): void };
	private readonly repositoryIndexingStatus: { value: IIndexingStatus | undefined; change(v: IIndexingStatus): void };
	private readonly repositoryIndexingJobs: { value: Record<string, unknown>; change(v: Record<string, unknown>): void };
	private readonly repositoryIndexingProgress: { value: IIndexingProgress | undefined; change(v: IIndexingProgress | undefined): void };

	// --- Events ---
	private readonly _onDidRequestRepoIndex = this._register(new Emitter<{ forceOverrideRepoInfo?: IRepositoryInfo } | undefined>());
	readonly onDidRequestRepoIndex = this._onDidRequestRepoIndex.event;

	private readonly _onDidRequestRepoInterrupt = this._register(new Emitter<boolean>());
	readonly onDidRequestRepoInterrupt = this._onDidRequestRepoInterrupt.event;

	private readonly _onDidChangeIndexingStatus = this._register(new Emitter<void>());
	readonly onDidChangeIndexingStatus = this._onDidChangeIndexingStatus.event;

	readonly onDidChangeIndexingGrepEnabled: Event<boolean>;

	get indexingGrepEnabled(): boolean {
		return this._indexingGrepEnabled;
	}

	get primaryQueryOnlyIndex(): IQueryOnlyIndex | undefined {
		return this._primaryQueryOnlyIndex;
	}

	get suppressFileExtensionRecommendations(): boolean {
		return Date.now() - (this._suppressFileExtensionRecommendationsStart ?? 0) < 2000;
	}

	constructor(
		// DI dependencies — exact service tokens resolved at runtime
		// Original decorators: @ag, @NJ, @Jr, @Zo, @xl, @Rr, @P1, @un, @Il, @On, @Ji, @gE
	) {
		super();

		// Initialize observable state (simplified from Cursor's reactive system)
		this.repositoryIndexingError = { value: undefined, change(v) { this.value = v; } };
		this.repositoryIndexingStatus = { value: { case: 'loading' }, change(v) { this.value = v; } };
		this.repositoryIndexingJobs = { value: {}, change(v) { this.value = v; } };
		this.repositoryIndexingProgress = { value: undefined, change(v) { this.value = v; } };
		this.onDidChangeIndexingGrepEnabled = Event.None;
	}

	// =========================================================================
	// Query-Only Index Management
	// =========================================================================

	setQueryOnlyIndex(index: IQueryOnlyIndex | undefined): void {
		this._primaryQueryOnlyIndex = index;
	}

	getQueryOnlyIndex(): IQueryOnlyIndex | undefined {
		return this._primaryQueryOnlyIndex ?? this.queryOnlyIndexFromIndexProvider;
	}

	// =========================================================================
	// Provider Registration
	// =========================================================================

	registerIndexingProvider(provider: IIndexingProvider): void {
		this.indexingProvider = provider;
	}

	unregisterIndexingProvider(): void {
		this.indexingProvider = undefined;
	}

	registerGrepProvider(provider: IGrepProvider): void {
		this.grepProvider = provider;
	}

	unregisterGrepProvider(): void {
		this.grepProvider = undefined;
	}

	registerDiffProvider(provider: IDiffProvider): void {
		this.diffProvider = provider;
	}

	setIsUriCursorIgnored(fn: (uri: URI) => boolean): void {
		this.isUriCursorIgnoredFn = fn;
	}

	fireOnDidChangeIndexingStatus(): void {
		this._onDidChangeIndexingStatus.fire();
	}

	// =========================================================================
	// Repository Info
	// =========================================================================

	async getNewRepoInfo(): Promise<IRepositoryInfo | undefined> {
		const startTime = Date.now();
		while (!this.indexingProvider && Date.now() - startTime < 500) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		if (!this.isIndexedMainLocalRepository()) {
			if (this._primaryQueryOnlyIndex) {
				return this._primaryQueryOnlyIndex.repositoryInfo;
			}

			const queryOnlyPromise = this.indexingProvider?.getQueryOnlyRepoInfo();
			if (queryOnlyPromise) {
				const timeout = 5000;
				try {
					const result = await Promise.race([
						queryOnlyPromise,
						new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), timeout)),
					]);
					this.queryOnlyIndexFromIndexProvider = result;
					if (result) {
						return result.repositoryInfo;
					}
				} catch { /* timeout or error */ }
			}
		}

		const repoInfoPromise = this.indexingProvider?.getRepoInfo();
		if (repoInfoPromise) {
			const timeout = 5000;
			try {
				return await Promise.race([
					repoInfoPromise,
					new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), timeout)),
				]);
			} catch { /* timeout or error */ }
		}

		return undefined;
	}

	async getPathEncryptionKey(): Promise<string | undefined> {
		const startTime = Date.now();
		while (!this.indexingProvider && Date.now() - startTime < 5000) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.indexingProvider?.getPathEncryptionKey();
	}

	isIndexedRepository(): boolean {
		return this.isIndexedMainLocalRepository() ||
			this._primaryQueryOnlyIndex !== undefined ||
			this.queryOnlyIndexFromIndexProvider !== undefined;
	}

	getIndexingProgress(): number {
		return this.repositoryIndexingStatus.value?.case === 'synced'
			? 1
			: this.repositoryIndexingProgress.value?.progress ?? 0;
	}

	getIndexingPhase(): IndexingStatusCase | undefined {
		return this.repositoryIndexingStatus.value?.case;
	}

	getNumFilesInUnindexedRepo(): number | undefined {
		return this.repositoryIndexingStatus.value?.case === 'not-auto-indexing'
			? this.repositoryIndexingStatus.value?.numFiles
			: undefined;
	}

	isIndexedMainLocalRepository(options?: { indexingProgressThreshold?: number }): boolean {
		const threshold = options?.indexingProgressThreshold ?? 0.8;
		if (this.getIndexingProgress() >= threshold) {
			return true;
		}

		const phase = this.repositoryIndexingStatus.value?.case;
		if (phase && [
			'indexing-setup', 'indexing', 'indexing-init-from-similar-codebase',
			'loading', 'out-of-sync', 'creating-index', 'error',
		].includes(phase)) {
			if (phase === 'indexing' && (this.repositoryIndexingProgress.value?.progress ?? 0) < 0.5) {
				return false;
			}
			if (this.repositoryLastSyncedTime !== undefined &&
				Date.now() - this.repositoryLastSyncedTime < 1000 * 60 * 60) {
				return true;
			}
		}
		return false;
	}

	// =========================================================================
	// Indexing Operations
	// =========================================================================

	async indexMainRepository(_force = false): Promise<void> {
		// Authentication check would go here
		this._onDidRequestRepoInterrupt.fire(true);
		this._onDidRequestRepoIndex.fire(undefined);
	}

	async deleteMainLocalRepository(): Promise<void> {
		const repoInfo = await this.getNewRepoInfo();
		if (repoInfo === undefined) {
			return;
		}
		// Repository deletion call would go here
		this._onDidRequestRepoInterrupt.fire(false);
		this.repositoryIndexingStatus.change({ case: 'not-indexed' });
		this.repositoryIndexingProgress.change({ progress: 0 });
		this.repositoryIndexingJobs.change({});
	}

	async pauseIndexingJob(): Promise<void> {
		this._onDidRequestRepoInterrupt.fire(true);
	}

	syncIndexWithGivenRepositoryInfo(repoInfo: IRepositoryInfo): void {
		this._onDidRequestRepoInterrupt.fire(true);
		this._onDidRequestRepoIndex.fire({ forceOverrideRepoInfo: repoInfo });
	}

	// =========================================================================
	// Search Operations
	// =========================================================================

	async semanticSearch(
		searchQuery: { contentPattern: { pattern: string } },
		_options: unknown,
		onResult?: (match: IFileMatch) => void
	): Promise<{ results: IFileMatch[]; messages: unknown[] }> {
		const results = await this.parallelSearch(searchQuery.contentPattern.pattern, 100);

		const searchResults: IFileMatch[] = [];
		// Grouping and result assembly would go here using the full logic from the JS version
		// For now, return the skeleton structure

		for (const match of searchResults) {
			onResult?.(match);
		}

		return { results: searchResults, messages: [] };
	}

	async parallelSearch(query: string, topK = 10, maxK?: number, options?: ISearchOptions): Promise<ISearchResult[]> {
		try {
			const results = await this.searchNewLocal(query, topK, options);
			return this.filterResults(results, topK, maxK);
		} catch {
			return [];
		}
	}

	async parallelSearchGetContents(query: string, topK = 10, maxK?: number, options?: ISearchOptions): Promise<ISearchResult[]> {
		return this.parallelSearch(query, topK, maxK, options);
	}

	async searchMultipleQueries(
		queries: ISearchQuery[],
		limits: { topK: number; minK: number; finalK: number },
		options?: ISearchOptions
	): Promise<ISearchResult[]> {
		const allResults = await Promise.all(
			queries.map(q => this.parallelSearch(q.text, limits.topK, limits.topK, options))
		);
		return allResults.flat()
			.sort((a, b) => b.score - a.score)
			.slice(0, limits.finalK);
	}

	private filterResults(results: ISearchResult[], topK = 10, maxK?: number): ISearchResult[] {
		return results
			.filter(r => r.codeBlock !== undefined && (r.codeBlock as ILocalCodeBlock).contents?.length < 20000)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxK ?? topK);
	}

	private async searchNewLocal(query: string, topK = 10, _options?: ISearchOptions): Promise<ISearchResult[]> {
		const repoInfo = await this.getNewRepoInfo();
		if (repoInfo === undefined) {
			throw new Error('No repository info found');
		}
		if (this.indexingProvider === undefined) {
			throw new Error('Indexing provider not found');
		}
		// Full search implementation would call repositoryClient.searchRepositoryV2()
		// and then getFinalCodeResults() to decrypt paths and convert to local blocks
		return [];
	}

	// =========================================================================
	// Embeddings
	// =========================================================================

	async getEmbeddings(..._texts: string[]): Promise<number[][]> {
		// Would call repositoryClient.getEmbeddings()
		return [];
	}

	// =========================================================================
	// Code Block Operations
	// =========================================================================

	async codeBlockFromRemote(_codeBlock: IRemoteCodeBlock): Promise<ILocalCodeBlock | null> {
		// Full implementation would resolve the file, extract the range, process signatures.
		// This is a ~100-line method in the original — skeleton for now.
		return null;
	}

	async getEmbeddableFilesPath(): Promise<URI | undefined> {
		const path = await this.indexingProvider?.getEmbeddableFilesPath();
		return path ? URI.from(path) : undefined;
	}

	// =========================================================================
	// Auth
	// =========================================================================

	async getRepoAuthId(): Promise<string | undefined> {
		// Would check authentication service for access token
		return undefined;
	}
}

registerSingleton(
	IRepositoryService as unknown as { toString(): string },
	RepositoryService as unknown as new (...args: never[]) => IRepositoryService,
	InstantiationType.Delayed
);
