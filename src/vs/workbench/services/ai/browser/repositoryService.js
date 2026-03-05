/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/ai/browser/repositoryService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Xau(), QY(), rMe(), q6(), yn(), iR(), Xn(), Er(), Qt(), ts(), sA(), wie(), gb(), mD(), Jp(), st(), Nc(), dd(), nd(), dr(), ls(), oB(), gN(), I9A(), mie(), vE(), bl(), hD(), Ii(), Gl(), c2(), xa(), Gw(), sf(), Ux(), Sr(), Vk();

// --- GitStatus Enum ---
(function (GitStatus) {
  GitStatus[GitStatus.INDEX_MODIFIED = 0] = "INDEX_MODIFIED";
  GitStatus[GitStatus.INDEX_ADDED = 1] = "INDEX_ADDED";
  GitStatus[GitStatus.INDEX_DELETED = 2] = "INDEX_DELETED";
  GitStatus[GitStatus.INDEX_RENAMED = 3] = "INDEX_RENAMED";
  GitStatus[GitStatus.INDEX_COPIED = 4] = "INDEX_COPIED";
  GitStatus[GitStatus.MODIFIED = 5] = "MODIFIED";
  GitStatus[GitStatus.DELETED = 6] = "DELETED";
  GitStatus[GitStatus.UNTRACKED = 7] = "UNTRACKED";
  GitStatus[GitStatus.IGNORED = 8] = "IGNORED";
  GitStatus[GitStatus.INTENT_TO_ADD = 9] = "INTENT_TO_ADD";
  GitStatus[GitStatus.ADDED_BY_US = 10] = "ADDED_BY_US";
  GitStatus[GitStatus.ADDED_BY_THEM = 11] = "ADDED_BY_THEM";
  GitStatus[GitStatus.DELETED_BY_US = 12] = "DELETED_BY_US";
  GitStatus[GitStatus.DELETED_BY_THEM = 13] = "DELETED_BY_THEM";
  GitStatus[GitStatus.BOTH_ADDED = 14] = "BOTH_ADDED";
  GitStatus[GitStatus.BOTH_DELETED = 15] = "BOTH_DELETED";
  GitStatus[GitStatus.BOTH_MODIFIED = 16] = "BOTH_MODIFIED";
})(qtf || (qtf = {}));

// Service identifier
const IRepositoryService = Bi("repositoryService"); // aX

// --- RepositoryService ---
// Manages codebase indexing, semantic search, and repository operations.
// Provides embedding-based code search and integration with the indexing provider.
const RepositoryService = class extends at { // oAa

  get indexingGrepEnabled() {
    return this._indexingGrepEnabled.get();
  }

  get primaryQueryOnlyIndex() {
    return this._primaryQueryOnlyIndex;
  }

  setQueryOnlyIndex(index) {
    this._primaryQueryOnlyIndex = index;
  }

  get suppressFileExtensionRecommendations() {
    return Date.now() - (this._suppressFileExtensionRecommendationsStart ?? 0) < 2000;
  }

  constructor(
    cursorAuthenticationService, // _cursorAuthenticationService
    cursorCredsService,
    fileService,
    telemetryService,
    textModelService,
    workspaceContextService,
    serverConfigService,
    instantiationService,
    modelService,
    configurationService,
    storageService,
    structuredLogService
  ) {
    super();
    this._cursorAuthenticationService = cursorAuthenticationService;
    this.cursorCredsService = cursorCredsService;
    this.fileService = fileService;
    this.telemetryService = telemetryService;
    this.textModelService = textModelService;
    this.workspaceContextService = workspaceContextService;
    this.serverConfigService = serverConfigService;
    this.instantiationService = instantiationService;
    this.modelService = modelService;
    this.configurationService = configurationService;
    this.storageService = storageService;
    this.structuredLogService = structuredLogService;

    this.clearPollingIntervalFunction = () => {};
    this.clearRepositoryIntervalFunction = () => {};
    this.diffProvider = null;
    this.indexingProvider = undefined;
    this.grepProvider = undefined;

    this._onDidRequestRepoIndex = this._register(new Qe);
    this.onDidRequestRepoIndex = this._onDidRequestRepoIndex.event;
    this._onDidRequestRepoInterrupt = this._register(new Qe);
    this.onDidRequestRepoInterrupt = this._onDidRequestRepoInterrupt.event;
    this._onDidChangeIndexingStatus = this._register(new Qe);
    this.onDidChangeIndexingStatus = this._onDidChangeIndexingStatus.event;

    this.isUriCursorIgnored = () => false;
    this.repositoryIndexingError = this._register(new j_(undefined));
    this.repositoryIndexingStatus = this._register(new j_({ case: "loading" }));
    this.repositoryIndexingJobs = this._register(new j_({}));
    this.repositoryIndexingProgress = this._register(new j_(undefined));
    this.indexingData = this._register(sm(this.storageService, "indexingData"));
    this._indexingGrepEnabled = this._register(sm(this.storageService, "indexingGrepEnabled"));
    this.onDidChangeIndexingGrepEnabled = Dn.fromObservable(this._indexingGrepEnabled);

    this.queryBuilder = this.instantiationService.createInstance(bV); // QueryBuilder
    this.repositoryClientPromise = this.instantiationService.createInstance(YS, { service: eAa }); // RepositoryClient
    this.aiServerClientPromise = this.instantiationService.createInstance(YS, { service: Pce }); // AIServerClient

    // Watch indexing data changes to trigger re-indexing
    Dn.fromObservableLight(this.indexingData)(() => {
      this.indexMainLocalRepository();
    });

    // Watch indexing status changes
    this.onDidChangeIndexingStatus(async () => {
      const globalStatus = await this.indexingProvider?.getGlobalStatus();
      if (globalStatus === undefined) return;

      if (globalStatus.case === "synced") {
        this.repositoryLastSyncedTime = Date.now();
      }
      this.repositoryIndexingStatus.change(globalStatus);

      switch (globalStatus.case) {
        case "not-indexed":
          break;
        case "not-auto-indexing":
          break;
        case "error": {
          this.repositoryIndexingError.change(globalStatus.error);
          break;
        }
        case "indexing-setup": {
          if (await this.getNewRepoInfo() === undefined) {
            this.repositoryIndexingError.change(undefined);
            return;
          }
          break;
        }
        case "indexing-init-from-similar-codebase": {
          if (await this.getNewRepoInfo() === undefined) {
            this.repositoryIndexingError.change(undefined);
            return;
          }
          break;
        }
        case "indexing": {
          const repoInfo = await this.getNewRepoInfo();
          if (repoInfo === undefined) {
            this.repositoryIndexingError.change(undefined);
            return;
          }
          const repoName = repoInfo.repoName;
          const codebases = await this.indexingProvider?.getCodebases();
          if (codebases === undefined) return;

          const jobs = {};
          let maxProgress = 0;
          for (const codebase of codebases) {
            const progress = await this.indexingProvider?.getIndexingProgress(codebase);
            if (progress === undefined) continue;
            const currentJobs = await this.indexingProvider?.getCurrentJobs(codebase);
            if (currentJobs !== undefined) {
              if (progress > maxProgress) maxProgress = progress;
              jobs[codebase] = currentJobs;
            }
          }
          this.repositoryIndexingProgress.change({ progress: maxProgress });
          this.repositoryIndexingJobs.change(jobs);
          break;
        }
        case "synced":
          break;
        case "paused":
          break;
        case "loading":
          break;
        default:
          return globalStatus;
      }
    });
  }

  async getEmbeddableFilesPath() {
    const path = await this.indexingProvider?.getEmbeddableFilesPath();
    return path ? je.from(path) : undefined; // URI.from
  }

  setIsUriCursorIgnored(fn) {
    this.isUriCursorIgnored = fn;
  }

  registerIndexingProvider(provider) {
    this.indexingProvider = provider;
  }

  unregisterIndexingProvider() {
    this.indexingProvider = undefined;
  }

  registerGrepProvider(provider) {
    this.grepProvider = provider;
  }

  unregisterGrepProvider() {
    this.grepProvider = undefined;
  }

  fireOnDidChangeIndexingStatus() {
    this._onDidChangeIndexingStatus.fire();
  }

  unregisterOnDidChangeIndexingStatus() {}

  async getNewRepoInfo() {
    const startTime = Date.now();
    // Wait up to 500ms for indexing provider
    while (!this.indexingProvider && Date.now() - startTime < 500) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.isIndexedMainLocalRepository()) {
      if (this.primaryQueryOnlyIndex) {
        return this.primaryQueryOnlyIndex.repositoryInfo;
      }

      const queryOnlyPromise = this.indexingProvider?.getQueryOnlyRepoInfo();
      const timeout = 5000;
      let timeoutId;
      const timeoutPromise = queryOnlyPromise
        ? new Promise(resolve => {
            timeoutId = setTimeout(() => {
              this.structuredLogService.warn("composer", "IndexingProvider.getQueryOnlyRepoInfo timed out", {
                operation: "IndexingProvider.getQueryOnlyRepoInfo",
                timeoutMs: timeout,
                indexingProviderRegistered: this.indexingProvider !== undefined,
              });
              resolve(undefined);
            }, timeout);
          })
        : undefined;

      this.queryOnlyIndexFromIndexProvider = queryOnlyPromise
        ? await (async () => {
            try {
              return await Promise.race([queryOnlyPromise, timeoutPromise]);
            } finally {
              if (timeoutId !== undefined) clearTimeout(timeoutId);
            }
          })()
        : undefined;

      if (this.queryOnlyIndexFromIndexProvider) {
        return this.queryOnlyIndexFromIndexProvider.repositoryInfo;
      }
    }

    const repoInfoPromise = this.indexingProvider?.getRepoInfo();
    const timeout = 5000;
    let timeoutId;
    const timeoutPromise = repoInfoPromise
      ? new Promise(resolve => {
          timeoutId = setTimeout(() => {
            this.structuredLogService.warn("composer", "IndexingProvider.getRepoInfo timed out", {
              operation: "IndexingProvider.getRepoInfo",
              timeoutMs: timeout,
              indexingProviderRegistered: this.indexingProvider !== undefined,
            });
            resolve(undefined);
          }, timeout);
        })
      : undefined;

    return repoInfoPromise
      ? await (async () => {
          try {
            return await Promise.race([repoInfoPromise, timeoutPromise]);
          } finally {
            if (timeoutId !== undefined) clearTimeout(timeoutId);
          }
        })()
      : undefined;
  }

  async getPathEncryptionKey() {
    const startTime = Date.now();
    while (!this.indexingProvider && Date.now() - startTime < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return await this.indexingProvider?.getPathEncryptionKey();
  }

  isIndexedRepository() {
    return this.isIndexedMainLocalRepository() ||
      this.primaryQueryOnlyIndex !== undefined ||
      this.queryOnlyIndexFromIndexProvider !== undefined;
  }

  getQueryOnlyIndex() {
    let index = this.primaryQueryOnlyIndex;
    if (index === undefined) {
      index = this.queryOnlyIndexFromIndexProvider;
    }
    return index;
  }

  getOverridePathEncryptionKey(repoInfo) {
    const queryOnlyIndex = this.getQueryOnlyIndex();
    if (
      queryOnlyIndex !== undefined &&
      repoInfo.repoName === queryOnlyIndex.repositoryInfo.repoName &&
      repoInfo.repoOwner === queryOnlyIndex.repositoryInfo.repoOwner
    ) {
      return queryOnlyIndex.pathEncryptionKey;
    }
  }

  maybeGetQueryOnlyRepoAccess(repoInfo) {
    const queryOnlyIndex = this.getQueryOnlyIndex();
    if (
      queryOnlyIndex === undefined || repoInfo === undefined
    ) return;
    if (
      repoInfo.repoName === queryOnlyIndex.repositoryInfo.repoName &&
      repoInfo.repoOwner === queryOnlyIndex.repositoryInfo.repoOwner
    ) {
      return queryOnlyIndex.queryOnlyRepoAccess;
    }
  }

  getIndexingProgress() {
    return this.repositoryIndexingStatus.value?.case === "synced"
      ? 1
      : this.repositoryIndexingProgress.value?.progress ?? 0;
  }

  getIndexingPhase() {
    return this.repositoryIndexingStatus.value?.case;
  }

  getNumFilesInUnindexedRepo() {
    return this.repositoryIndexingStatus.value?.case === "not-auto-indexing"
      ? this.repositoryIndexingStatus.value?.numFiles
      : undefined;
  }

  isIndexedMainLocalRepository(options) {
    const threshold = options?.indexingProgressThreshold ?? 0.8;
    if (this.getIndexingProgress() >= threshold) return true;

    const phase = this.repositoryIndexingStatus.value?.case;
    if ([
      "indexing-setup", "indexing", "indexing-init-from-similar-codebase",
      "loading", "out-of-sync", "creating-index", "error"
    ].includes(phase)) {
      if (phase === "indexing" && (this.repositoryIndexingProgress.value?.progress ?? 0) < 0.5) {
        return false;
      }
      const lastSyncedTime = this.repositoryLastSyncedTime;
      if (lastSyncedTime !== undefined && Date.now() - lastSyncedTime < 1000 * 60 * 60) {
        return true;
      }
    }
    return false;
  }

  async indexMainRepository(force = false) {
    if (!this._cursorAuthenticationService.isAuthenticated()) {
      this.repositoryIndexingStatus.change({ case: "error", error: "Not authenticated" });
      return;
    }
    return this.indexMainLocalRepository();
  }

  async deleteMainLocalRepository() {
    const repoInfo = await this.getNewRepoInfo();
    if (repoInfo === undefined) return;

    await (await this.repositoryClientPromise.get()).removeRepositoryV2(
      new TRc({ repository: repoInfo }), // RemoveRepositoryRequest
      { headers: vv(Gr()) } // auth headers
    );

    this._onDidRequestRepoInterrupt.fire(false);
    this.repositoryIndexingStatus.change({ case: "not-indexed" });
    this.repositoryIndexingProgress.change({ progress: 0 });
    this.repositoryIndexingJobs.change({});
  }

  async pauseIndexingJob() {
    this._onDidRequestRepoInterrupt.fire(true);
  }

  registerDiffProvider(provider) {
    this.diffProvider = provider;
  }

  dispose() {
    super.dispose();
    this.clearPollingIntervalFunction();
    this.clearRepositoryIntervalFunction();
  }

  repositoryToInfo(repository) {
    const remotes = repository.provider.remotes;
    if (remotes === undefined) return null;
    if (remotes.length === 0) throw new Error("No remotes found");

    const parts = remotes[0].fetchUrl?.split(/\/|\:/);
    if (parts === undefined) throw new Error("Could not parse origin url");

    const repoOwner = parts[parts.length - 2];
    const repoName = parts[parts.length - 1].split(".")[0];
    if (repoOwner === undefined || repoName === undefined) {
      throw new Error("Could not parse repo owner and name");
    }

    return {
      id: repository.id,
      repoName,
      repoOwner,
      relativeWorkspacePath: B9A(repository), // getRelativeWorkspacePath
    };
  }

  async codeBlockFromRemote(codeBlock) {
    const relativePath = codeBlock.relativeWorkspacePath;
    const resolvedUri = this.workspaceContextService.resolveRelativePath(relativePath);

    let modelRef;
    let result = null;

    try {
      this._suppressFileExtensionRecommendationsStart = Date.now();
      modelRef = await this.textModelService.createModelReference(resolvedUri, true);

      const range = codeBlock.range;
      if (range === undefined || range.startPosition === undefined || range.endPosition === undefined) {
        console.log(`[Cpp] Skipping ${codeBlock.relativeWorkspacePath} because it has an invalid range`);
        return null;
      }

      let processedContents;
      let signatures = [];
      let originalContents;
      const detailedLines = [];

      // Extract main content
      originalContents = modelRef.object.textEditorModel.getValueInRange({
        startLineNumber: range.startPosition.line,
        startColumn: range.startPosition.column,
        endLineNumber: range.endPosition.line,
        endColumn: range.endPosition.column,
      });
      processedContents = originalContents;

      // Build detailed lines
      for (const [lineIdx, lineText] of originalContents.split("\n").entries()) {
        detailedLines.push({
          lineNumber: lineIdx + (range.startPosition?.line - 1) + 1,
          text: lineText,
          isSignature: false,
        });
      }

      // Process signature ranges
      const signatureRanges = codeBlock.signatures?.ranges;
      if (signatureRanges) {
        signatureRanges.sort((a, b) => {
          if (!a.startPosition || !b.startPosition) return 0;
          return a.startPosition.line !== b.startPosition.line
            ? a.startPosition.line - b.startPosition.line
            : (a.startPosition.column ?? 0) - (b.startPosition.column ?? 0);
        });

        const mergedRanges = D9A(signatureRanges); // mergeOverlappingRanges

        for (const sigRange of mergedRanges) {
          if (sigRange === undefined || sigRange.startPosition === undefined || sigRange.endPosition === undefined) {
            signatures.push("");
            continue;
          }
          if (sigRange.endPosition.line >= range.startPosition.line) {
            signatures.push("");
            continue;
          }

          signatures.push(
            modelRef.object.textEditorModel.getValueInRange({
              startLineNumber: sigRange.startPosition.line,
              startColumn: sigRange.startPosition.column,
              endLineNumber: sigRange.endPosition.line,
              endColumn: Math.min(
                modelRef.object.textEditorModel.getLineLength(sigRange.endPosition.line) + 1,
                sigRange.endPosition.column
              ),
            }).trimEnd()
          );
        }

        if (signatures.length !== 0) {
          let combined = "";
          let sigIdx = 0;

          for (const [idx, text] of [...signatures, processedContents].entries()) {
            if (idx < signatures.length && text === "") continue;

            let startLine;
            if (idx < signatures.length) {
              for (const [lineIdx, lineText] of text.split("\n").entries()) {
                detailedLines.push({
                  lineNumber: lineIdx + (mergedRanges[idx]?.startPosition?.line ?? 1),
                  text: lineText,
                  isSignature: true,
                });
              }
              startLine = mergedRanges[idx]?.startPosition?.line ?? 1;
            } else {
              startLine = range.startPosition?.line ?? 1;
            }

            if (idx === 0) {
              combined += text;
              continue;
            }

            const indentMatch = text.match(/^\s*/);
            let indent;
            if (indentMatch) indent = indentMatch[0];
            else indent = "";

            combined += "\n" + indent + "...\n" + text;
            detailedLines.push({
              lineNumber: startLine - 0.5,
              text: indent + "...",
              isSignature: true,
            });
          }
          processedContents = combined;
        }
      }

      // Sort detailed lines by line number
      detailedLines.sort((a, b) => a.lineNumber - b.lineNumber);

      result = {
        detailedLines,
        contents: processedContents,
        originalContents,
        relativeWorkspacePath: this.workspaceContextService.asRelativePath(resolvedUri),
        range,
      };
    } catch (error) {
      console.error("Error in codeBlockFromRemote:", error);
    } finally {
      if (modelRef) modelRef.dispose();
    }

    return result;
  }

  async semanticSearch(searchQuery, options, onResult) {
    function rangeToVSCodeRange(range) {
      return {
        startLineNumber: (range.startPosition?.line || 1) - 1,
        startColumn: (range.startPosition?.column || 1) - 1,
        endLineNumber: (range.endPosition?.line || 1) - 1,
        endColumn: (range.endPosition?.column || 1) - 1,
      };
    }

    const searchResults = (await this.parallelSearch(searchQuery.contentPattern.pattern, 100))
      .flatMap((result, idx) => {
        if (result.codeBlock === undefined || result.codeBlock.range === undefined) return [];
        const range = rangeToVSCodeRange(result.codeBlock.range);
        return [{
          uri: this.workspaceContextService.resolveRelativePath(result.codeBlock.relativeWorkspacePath),
          previewText: result.codeBlock.contents,
          rangeLocations: [{
            source: range,
            preview: {
              startLineNumber: 0,
              startColumn: 0,
              endLineNumber: range.endLineNumber - range.startLineNumber,
              endColumn: range.endColumn,
            },
          }],
        }];
      });

    // Group by URI
    const groupedResults = {};
    for (const result of searchResults) {
      if (result.uri) {
        if (groupedResults[result.uri.toString()] === undefined) {
          groupedResults[result.uri.toString()] = [];
        }
        groupedResults[result.uri.toString()].push(result);
      }
    }

    // Build file match results
    const fileMatches = [];
    for (const uriStr in groupedResults) {
      const uri = je.parse(uriStr); // URI.parse
      if (NAi(searchQuery, uri.fsPath) && Object.prototype.hasOwnProperty.call(groupedResults, uriStr)) {
        const results = groupedResults[uriStr];
        fileMatches.push({ resource: uri, results });
      }
    }

    // Emit results
    for (const fileMatch of fileMatches) {
      onResult?.(fileMatch);
    }

    return { results: fileMatches, messages: [] };
  }

  async getRepoAuthId() {
    const token = await (async () => {
      // Use repo42 auth token if on cursor.sh repo backend but different main backend
      if (
        this.cursorCredsService.getRepoBackendUrl().includes("cursor.sh") &&
        !this.cursorCredsService.getBackendUrl().includes("cursor.sh")
      ) {
        const serverConfig = this.serverConfigService.cachedServerConfig;
        if (serverConfig.indexingConfig?.repo42AuthToken) {
          return serverConfig.indexingConfig.repo42AuthToken;
        }
      }
      return await this._cursorAuthenticationService.getAccessToken();
    })();

    return token ? this._cursorAuthenticationService.getAuthIdFromToken(token) : undefined;
  }

  async parallelSearchGetContents(query, topK = 10, maxK, options) {
    return (await this.parallelSearch(query, topK, maxK, options)).map(result => {
      const codeBlock = result.codeBlock;
      if (codeBlock === undefined) return result;

      const resolvedUri = this.workspaceContextService.resolveRelativePath(codeBlock.relativeWorkspacePath);
      const model = this.modelService.getModel(resolvedUri);
      if (!model || codeBlock.range === undefined) return result;

      return new WR({ // SearchResult
        ...result,
        codeBlock: {
          ...result.codeBlock,
          contents: model.getValueInRange({
            startColumn: codeBlock.range.startPosition?.column ?? 1,
            startLineNumber: codeBlock.range.startPosition?.line ?? 1,
            endColumn: codeBlock.range.endPosition?.column ?? 1,
            endLineNumber: codeBlock.range.endPosition?.line ?? 1,
          }),
        },
      });
    });
  }

  async searchMultipleQueries(queries, { topK, minK, finalK }, options) {
    const searchPromises = queries
      .map(query => ({
        text: query.text,
        newGlob: o0A({ // compileGlobsForSearch
          globsNewLineSeparated: query.globsNewLineSeparated,
          properGlob: options?.newlineSepGlobFilter,
        }),
      }))
      .map(query =>
        this.parallelSearch(query.text, topK, topK, {
          includePattern: options?.includePattern,
          excludePattern: options?.excludePattern,
          globFilter: query.newGlob,
        })
      );

    return await T9A(searchPromises, { minK, finalK }); // mergeSearchResults
  }

  async parallelSearch(query, topK = 10, maxK, options) {
    try {
      const results = await this.searchNewLocal(query, topK, options);
      return this.filterResults(results, topK, maxK);
    } catch {
      return [];
    }
  }

  filterResults(results, topK = 10, maxK) {
    return results
      .filter(r => r.codeBlock !== undefined && r.codeBlock.contents.length < 20000)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxK ?? topK);
  }

  async compileGlobFilterFromPattern(options) {
    if (this.indexingProvider === undefined) {
      throw new Error("Indexing provider not found");
    }

    const filterOptions = {
      globFilter: options?.globFilter ?? await this.compilePatternIntoGlobFilter(options?.includePattern),
      notGlobFilter: await this.compilePatternIntoGlobFilter(options?.excludePattern),
      overridePathEncryptionKey: options.overridePathEncryptionKey ?? this.getOverridePathEncryptionKey(options.repoInfo),
    };

    return await this.indexingProvider.compileGlobFilter(filterOptions);
  }

  async searchNewLocal(query, topK = 10, options) {
    const repoClient = await this.repositoryClientPromise.get();
    const repoInfo = await this.getNewRepoInfo();

    if (repoInfo === undefined) throw new Error("No repository info found");
    if (this.indexingProvider === undefined) throw new Error("Indexing provider not found");

    const searchRepoInfo = { ...repoInfo, id: lpa.id }; // LOCAL_REPO_ID
    let searchResponse;

    try {
      const compiledFilter = await this.compileGlobFilterFromPattern({
        includePattern: options?.includePattern,
        excludePattern: options?.excludePattern,
        globFilter: options?.globFilter,
        repoInfo,
      });

      const searchRequest = {
        query,
        repository: repoInfo,
        topK,
        contextCacheRequest: options?.contextCacheRequest,
        globFilter: compiledFilter.globFilter,
        notGlobFilter: compiledFilter.notGlobFilter,
        queryOnlyRepoAccess: this.maybeGetQueryOnlyRepoAccess(repoInfo),
      };

      const authHeaders = Gr(); // getAuthHeaders
      const requestOptions = {
        headers: vv(authHeaders), // formatHeaders
        signal: options?.abortSignal,
      };

      if (options?.abortSignal?.aborted) throw new Error("Aborted");

      searchResponse = await repoClient.searchRepositoryV2(searchRequest, requestOptions);
    } catch (error) {
      if (error instanceof yA) { // ConnectError
        if (!options?.silent) console.error("searchRepositoryV2 failed", error);
        return [];
      }
      throw error;
    }

    return await this.getFinalCodeResults(searchRepoInfo, searchResponse.codeResults, {
      ...options,
      topK,
    });
  }

  async refreshTabContext(request) {
    const repoInfo = await this.getNewRepoInfo();
    const aiServerClient = await this.aiServerClientPromise.get();

    if (repoInfo === undefined) throw new Error("No repository info found");

    const fullRequest = { ...request, repositoryInfo: repoInfo };
    const response = await aiServerClient.refreshTabContext(fullRequest, {
      headers: vv(Gr()),
    });

    const finalResults = await this.getFinalCodeResults(repoInfo, response.codeResults);
    return new o4c({ codeResults: finalResults }); // RefreshTabContextResponse
  }

  syncIndexWithGivenRepositoryInfo(repoInfo) {
    this._onDidRequestRepoInterrupt.fire(true);
    this._onDidRequestRepoIndex.fire({ forceOverrideRepoInfo: repoInfo });
  }

  indexMainLocalRepository() {
    if (!this._cursorAuthenticationService.isAuthenticated()) return;
    this._onDidRequestRepoInterrupt.fire(true);
    this._onDidRequestRepoIndex.fire(undefined);
  }

  interruptLocalRepository(repo) {
    if (repo.id === lpa.id) { // LOCAL_REPO_ID
      this._onDidRequestRepoInterrupt.fire(false);
    }
  }

  async getEmbeddings(...texts) {
    return (
      await (await this.repositoryClientPromise.get()).getEmbeddings(
        { texts },
        { headers: vv(Gr()) }
      )
    ).embeddings.map(embedding => embedding.embedding);
  }

  async *getLineNumberClassifications(codeResults, query, abortSignal) {
    const resultKey = (result) =>
      JSON.stringify({
        relativeWorkspacePath: result.codeBlock?.relativeWorkspacePath,
        range: result.codeBlock?.range,
      });

    const resultMap = new Map(
      codeResults.map((item, idx) => [resultKey(item.ogCodeResult), { ogCodeResult: item.ogCodeResult, idx }])
    );

    const request = {
      query,
      codeResults: codeResults.map(item => item.localCodeResult).filter(item => item !== null),
    };

    const stream = await (await this.repositoryClientPromise.get())
      .getLineNumberClassifications(request, { signal: abortSignal });

    for await (const chunk of stream) {
      const classified = chunk.classifiedResult;
      if (classified?.codeResult !== undefined) {
        const match = resultMap.get(resultKey(classified.codeResult));
        if (match !== undefined) {
          yield { withClassificationInfo: classified, idx: match.idx };
        }
      }
    }
  }

  async convertToLocalBlock(remoteBlock) {
    try {
      const localBlock = await this.codeBlockFromRemote(remoteBlock);
      if (!localBlock) {
        console.log(`[Cpp] Skipping ${remoteBlock.relativeWorkspacePath} because it couldn't be converted to a local block`);
        return null;
      }
      if (localBlock.contents !== undefined && localBlock.contents.length > 20000) {
        console.log(`[Cpp] Skipping ${remoteBlock.relativeWorkspacePath} because it's too big`);
        return null;
      }
      return localBlock;
    } catch (error) {
      console.error("Failed to convert code block to local block:", error);
      return null;
    }
  }

  async getFinalCodeResults(repoInfo, rawResults, options) {
    if (!this.indexingProvider) throw new Error("Indexing provider not found");

    // Decrypt paths
    const encryptedPaths = rawResults
      .map(r => r.codeBlock?.relativeWorkspacePath)
      .filter(p => p !== undefined);

    const decryptedPaths = await this.indexingProvider.decryptPaths({
      paths: encryptedPaths,
      overridePathEncryptionKey: this.getOverridePathEncryptionKey(repoInfo),
    });

    const pathMap = new Map();
    for (let i = 0; i < encryptedPaths.length; i++) {
      pathMap.set(encryptedPaths[i], decryptedPaths[i]);
    }

    // Process results in parallel (max 8 concurrent)
    const processed = (
      await kIg(rawResults, async (rawResult) => { // parallelMap
        if (rawResult.codeBlock === undefined) {
          console.log("[Cpp] Skipping because it's undefined");
          throw new Error("Code block undefined");
        }

        const decryptedPath = pathMap.get(rawResult.codeBlock.relativeWorkspacePath);
        if (decryptedPath === undefined) throw new Error("Path not found");

        rawResult.codeBlock.relativeWorkspacePath = decryptedPath;

        // Strip leading "./" or ".\\"
        if (
          rawResult.codeBlock.relativeWorkspacePath.startsWith("./") ||
          rawResult.codeBlock.relativeWorkspacePath.startsWith(".\\")
        ) {
          rawResult.codeBlock.relativeWorkspacePath =
            rawResult.codeBlock.relativeWorkspacePath.substring(2);
        }

        // Check include/exclude patterns
        if (!M9A(rawResult.codeBlock.relativeWorkspacePath, this.queryBuilder, options)) {
          console.log(`[Cpp] Skipping ${rawResult.codeBlock.relativeWorkspacePath} because it doesn't match the include/exclude patterns`);
          return null;
        }

        const localBlock = await this.convertToLocalBlock(rawResult.codeBlock);
        if (localBlock === null) {
          console.log(`[Cpp] Skipping ${rawResult.codeBlock.relativeWorkspacePath} because it couldn't be converted to a local block`);
          return null;
        }

        return new WR({ // SearchResult
          score: rawResult.score,
          codeBlock: localBlock,
        });
      }, { max: 8 })
    )
      .map(settled => {
        if (settled.status === "rejected") {
          console.error(settled.reason);
          return null;
        }
        // Filter cursorIgnored files
        if (options?.excludeCursorIgnored && settled.value?.codeBlock?.relativeWorkspacePath) {
          const resolvedUri = this.workspaceContextService.resolveRelativePath(
            settled.value.codeBlock.relativeWorkspacePath
          );
          if (this.isUriCursorIgnored(resolvedUri)) return null;
        }
        return settled.value;
      })
      .filter(r => r !== null)
      .sort((a, b) => b.score - a.score);

    return options?.topK ? processed.slice(0, options.topK) : processed;
  }

  async compilePatternIntoGlobFilter(pattern) {
    if (pattern === undefined) return;

    const normalizedPattern = P9A(pattern); // normalizePattern
    this.telemetryService.publicLogCapture("SimpleGlobPattern.Attempted");

    const simpleGlob = await this.generateSimpleGlobPattern(normalizedPattern);
    if (simpleGlob !== undefined) {
      this.telemetryService.publicLogCapture("SimpleGlobPattern.Success");
      return simpleGlob;
    }

    this.telemetryService.publicLogCapture("SimpleGlobPattern.Fallback");
    const searchPaths = this.queryBuilder.parseSearchPaths(normalizedPattern);
    if (searchPaths.pattern !== undefined) {
      return N9A(searchPaths.pattern); // convertPatternToGlobFilter
    }
  }

  async generateSimpleGlobPattern(pattern) {
    return R9A(pattern, this.fileService, this.workspaceContextService); // generateSimpleGlob
  }
};

// DI decorators
RepositoryService = __decorate([
  __param(0, ag),   // ICursorAuthenticationService
  __param(1, NJ),   // ICursorCredsService
  __param(2, Jr),   // IFileService
  __param(3, Zo),   // ITelemetryService
  __param(4, xl),   // ITextModelService
  __param(5, Rr),   // IWorkspaceContextService
  __param(6, P1),   // IServerConfigService
  __param(7, un),   // IInstantiationService
  __param(8, Il),   // IModelService
  __param(9, On),   // IConfigurationService
  __param(10, Ji),  // IStorageService
  __param(11, gE),  // IStructuredLogService
], RepositoryService);

Ki(IRepositoryService, RepositoryService, 1); // registerSingleton

// --- SetQueryOnlyIndexCommand ---
const SetQueryOnlyIndexCommand = class extends nn { // Htf
  constructor() {
    super({
      id: gCc, // 'cursor.setQueryOnlyIndex'
      title: { value: "Set Query Only Index", original: "Set Query Only Index" },
      f1: false,
    });
  }

  run(accessor, { queryOnlyRepositoryInfo }) {
    accessor.get(IRepositoryService).setQueryOnlyIndex(queryOnlyRepositoryInfo);
  }
};

It(SetQueryOnlyIndexCommand); // registerAction

// --- Symbol Map ---
// oAa  -> RepositoryService
// aX   -> IRepositoryService
// Htf  -> SetQueryOnlyIndexCommand
// WR   -> SearchResult
// TRc  -> RemoveRepositoryRequest
// o4c  -> RefreshTabContextResponse
// YS   -> ServiceClientFactory
// eAa  -> RepositoryServiceDefinition
// Pce  -> AIServerServiceDefinition
// bV   -> QueryBuilder
// lpa  -> LOCAL_REPO_ID (constant)
// j_   -> ObservableValue
// sm   -> storageObservable
// Qe   -> Emitter
// Dn   -> Event
// je   -> URI
// yA   -> ConnectError
// at   -> Disposable
// vv   -> formatHeaders
// Gr   -> getAuthHeaders
// kIg  -> parallelMap
// D9A  -> mergeOverlappingRanges
// B9A  -> getRelativeWorkspacePath
// M9A  -> matchesIncludeExcludePatterns
// P9A  -> normalizePattern
// N9A  -> convertPatternToGlobFilter
// R9A  -> generateSimpleGlob
// T9A  -> mergeSearchResults
// o0A  -> compileGlobsForSearch
// NAi  -> matchesSearchQuery (filter function)
// ag   -> ICursorAuthenticationService
// NJ   -> ICursorCredsService
// Jr   -> IFileService
// Zo   -> ITelemetryService
// xl   -> ITextModelService
// Rr   -> IWorkspaceContextService
// P1   -> IServerConfigService
// un   -> IInstantiationService
// Il   -> IModelService
// On   -> IConfigurationService
// Ji   -> IStorageService
// gE   -> IStructuredLogService
// qtf  -> GitStatus enum
