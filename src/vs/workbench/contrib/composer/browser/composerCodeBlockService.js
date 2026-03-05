// Source: out-build/vs/workbench/contrib/composer/browser/composerCodeBlockService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerCodeBlockService — manages code block lifecycle,
// inline diff tracking, caching, status management, and diff computation for all
// AI-generated code modifications in the composer.

Di(), ov(), Pmn(), nw(), st(), au(), Qr(), zr(), oa(), Xn(), Nc(), Dme(), vM(), Ex(),
  N3t(), GY(), Jk(), Er(), Qt(), Pd(), oy(), ls(), Fx(), Yu(), Ig(), qtt(), nFg(), zk(),
  dp(), Zk(), ace(), fEe(), Aye(), hnt(), qF();

/** Default options for diff computation — gracefully falls back on timeout */
const DIFF_COMPUTATION_OPTIONS = { shouldGracefullyFallBackOnTimeout: true };

const IComposerCodeBlockService = Bi("composerCodeBlockService");

/**
 * ComposerCodeBlockService
 *
 * Central service for managing AI-generated code blocks and their diffs.
 * Handles the entire lifecycle of code modifications:
 *
 * - Code block registration and status tracking
 * - Inline diff accept/reject/undo/redo flows
 * - Cached code block management with file watchers
 * - Diff computation (line-level) with semaphore-limited parallelism
 * - Code block chaining (sequential edits to the same file)
 * - Original/new model content reconstruction from stored diffs
 * - File change detection and outdated marking
 * - Diff statistics (lines added/removed)
 * - Partial inline diff fate tracking
 * - Subagent code block delegation
 */
let ComposerCodeBlockService = class extends at {
  get userPlansDir() {
    return this._userPlansDir;
  }

  async _getUserPlansDirAsync() {
    if (this._userPlansDir) return this._userPlansDir;
    if (!this._userPlansDirPromise) {
      this._userPlansDirPromise = this._pathService.userHome().then((home) => {
        this._userPlansDir = sV(home);
        return this._userPlansDir;
      });
    }
    return this._userPlansDirPromise;
  }

  constructor(
    reactiveStorageService,
    composerTextModelService,
    composerEventService,
    composerCodeBlockDiffStorageService,
    composerCodeBlockPartialInlineDiffFatesStorageService,
    editorWorkerService,
    metricsService,
    composerDataService,
    composerFileService,
    inlineDiffService,
    diffChangeSourceRegistry,
    experimentService,
    workspaceContextService,
    pathService
  ) {
    super();
    this._reactiveStorageService = reactiveStorageService;
    this.composerTextModelService = composerTextModelService;
    this._composerEventService = composerEventService;
    this._composerCodeBlockDiffStorageService = composerCodeBlockDiffStorageService;
    this._composerCodeBlockPartialInlineDiffFatesStorageService =
      composerCodeBlockPartialInlineDiffFatesStorageService;
    this._editorWorkerService = editorWorkerService;
    this._metricsService = metricsService;
    this._composerDataService = composerDataService;
    this._composerFileService = composerFileService;
    this._inlineDiffService = inlineDiffService;
    this._diffChangeSourceRegistry = diffChangeSourceRegistry;
    this._experimentService = experimentService;
    this._workspaceContextService = workspaceContextService;
    this._pathService = pathService;

    /** LRU cache for computed diffs (max 50 entries) */
    this._composerDiffCache = new Nb(50);

    /** Semaphore to limit concurrent diff computations to 5 */
    this._composerDiffSemaphore = new Rmn(5);

    /** Map<uriString, IDisposable> — file watchers for cached code blocks */
    this._fileWatchers = new Map();

    /** Map<uriString, CachedCodeBlockEntry[]> — active cached code blocks */
    this._uriToCachedCodeBlocks = new Map();

    /** Map<uriString, CachedCodeBlockEntry[]> — queued cached code blocks */
    this._uriToCachedCodeBlocksQueue = new Map();

    // Initialize user plans directory
    this._getUserPlansDirAsync();

    // --- File change listener: mark cached code blocks as outdated ---
    this._register(
      this._composerEventService.onDidFilesChange((changeEvent) => {
        const allTrackedUris = Array.from(
          new Set([
            ...this._uriToCachedCodeBlocks.keys(),
            ...this._uriToCachedCodeBlocksQueue.keys(),
          ])
        );

        for (const uriString of allTrackedUris) {
          const uri = je.parse(uriString);
          if (changeEvent.contains(uri)) {
            const queuedBlocks =
              this._uriToCachedCodeBlocksQueue.get(uri.toString()) ?? [];
            this.markUriAsOutdated(uri, queuedBlocks.length > 0);

            if (queuedBlocks.length > 0) {
              this._uriToCachedCodeBlocks.set(uri.toString(), queuedBlocks);
              this._uriToCachedCodeBlocksQueue.delete(uri.toString());
            }
          }
        }
      })
    );

    // --- Partial inline diff fate storage ---
    this._register(
      this._inlineDiffService.onDidAcceptDiff((diffInfo) => {
        this._storePartialInlineDiffFates(diffInfo);
      })
    );
    this._register(
      this._inlineDiffService.onDidRejectDiff((diffInfo) => {
        this._storePartialInlineDiffFates(diffInfo);
      })
    );

    // --- Internal diff event handlers ---

    /**
     * Abort and remove the apply generation UUID from a code block.
     */
    const abortAndRemoveApplyGenerationUUID = (handle, uri, codeblockId) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.abortAndRemoveApplyGenerationUUID"),
          false
        );
        const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
        if (codeBlock?.applyGenerationUUID) {
          this.updateComposerCodeBlock(handle, uri, codeblockId, {
            applyGenerationUUID: void 0,
          });
        }
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    /**
     * Handle diff removal from undo/redo stack.
     */
    const handleDiffRemoval = (removedDiff) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.handleDiffRemoval"),
          false
        );
        if (!removedDiff.composerId) return;
        if (removedDiff.accepted) {
          handleDiffAccept(removedDiff.diffInfo, false);
        } else {
          handleDiffReject(removedDiff.diffInfo, false);
        }
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    /**
     * Handle diff rejection — update code block status, handle file cleanup.
     */
    const handleDiffReject = (diffInfo, shouldSaveFile = true) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.handleDiffReject"),
          false
        );
        const { composerId, codeblockId } = diffInfo.composerMetadata ?? {};
        if (!composerId) return;

        const handle = this._composerDataService.getHandleIfLoaded(composerId);
        if (!handle) return;

        const composerData = this._composerDataService.getComposerData(handle);
        if (!composerData) return;

        let uri = diffInfo.uri;
        // Handle notebook cell URIs
        if (composerData.isNAL === true && diffInfo.uri.scheme === _n.vscodeNotebookCell) {
          try {
            uri = ygt(diffInfo.uri);
          } catch {
            uri = diffInfo.uri;
          }
        }

        if (
          codeblockId !== void 0 &&
          this.getComposerCodeBlock(handle, uri, codeblockId)
        ) {
          if (!this.isCodeBlockRegisteredAsCached(handle, uri, codeblockId)) {
            this.setCodeBlockStatusIncludingPreviouslyChained(
              handle,
              uri,
              codeblockId,
              "rejected"
            );
            abortAndRemoveApplyGenerationUUID(handle, uri, codeblockId);
          }
        }

        if (this._isLegacyInlineDiffsUsed()) {
          // Legacy path: check if this is a new empty file (original lines = 0)
          const isNewEmptyFile =
            diffInfo.inlineDiff !== void 0 &&
            diffInfo.inlineDiff.uri.scheme !== _n.vscodeNotebookCell &&
            diffInfo.inlineDiff.originalTextLines.length === 0;

          if (!isNewEmptyFile) {
            const uriString = uri.toString();
            const isNewlyCreated =
              composerData.newlyCreatedFiles?.some(
                (f) => f.uri.toString() === uriString
              ) ?? false;

            if (isNewlyCreated) {
              this._composerDataService.updateComposerData(handle, {
                newlyCreatedFiles:
                  composerData.newlyCreatedFiles?.filter(
                    (f) => f.uri.toString() !== uriString
                  ) ?? [],
                newlyCreatedFolders:
                  composerData.newlyCreatedFolders?.filter(
                    (f) => !uriString.startsWith(f.uri.toString())
                  ) ?? [],
              });
            }
          }

          if (isNewEmptyFile) {
            this._composerFileService
              .deleteNewFileAndMaybeFolder(uri, composerId, composerData)
              .then((deleted) => {
                if (!deleted && shouldSaveFile) {
                  this._composerFileService.saveFile({
                    uri,
                    composerData,
                    options: { force: true },
                  });
                }
              });
          } else if (shouldSaveFile) {
            this._composerFileService.saveFile({
              uri,
              composerData,
              options: { force: true },
            });
          }
        } else {
          // Non-legacy path: try to delete new file, otherwise save
          this._composerFileService
            .deleteNewFileAndMaybeFolder(uri, composerId, composerData)
            .then((deleted) => {
              if (!deleted && shouldSaveFile) {
                this._composerFileService.saveFile({
                  uri,
                  composerData,
                  options: { force: true },
                });
              }
            });
        }
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    /**
     * Handle diff acceptance — update code block status, save file, clean up tracking.
     */
    const handleDiffAccept = (diffInfo, shouldSaveFile = true) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.handleDiffAccept"),
          false
        );
        const { composerId, codeblockId } = diffInfo.composerMetadata ?? {};
        if (!composerId) return;

        const handle = this._composerDataService.getHandleIfLoaded(composerId);
        if (!handle) return;

        const composerData = handle.data;
        if (!composerData) return;

        let uri = diffInfo.uri;
        if (composerData.isNAL === true && diffInfo.uri.scheme === _n.vscodeNotebookCell) {
          try {
            uri = ygt(diffInfo.uri);
          } catch {
            uri = diffInfo.uri;
          }
        }

        if (codeblockId !== void 0) {
          if (!this.getComposerCodeBlock(handle, uri, codeblockId)) return;
          this.setCodeBlockStatusIncludingPreviouslyChained(
            handle,
            uri,
            codeblockId,
            "accepted"
          );
          abortAndRemoveApplyGenerationUUID(handle, uri, codeblockId);
        }

        if (shouldSaveFile) {
          this._composerFileService.saveFile({
            uri,
            composerData,
            options: { force: true },
          });
        }

        // Remove from newly created tracking
        this._composerDataService.updateComposerData(handle, {
          newlyCreatedFiles:
            composerData.newlyCreatedFiles?.filter(
              (f) => f.uri.toString() !== uri.toString()
            ) ?? [],
          newlyCreatedFolders:
            composerData.newlyCreatedFolders?.filter(
              (f) => !uri.toString().startsWith(f.uri.toString())
            ) ?? [],
        });
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    /**
     * Handle partial diff accept/reject (for line-by-line review).
     */
    const handlePartialDiff = (partialDiffEvent, action) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.handlePartialDiff"),
          false
        );
        const { composerId } = partialDiffEvent.diffInfo.composerMetadata ?? {};
        if (!composerId) return;

        const handle = this._composerDataService.getHandleIfLoaded(composerId);
        if (!(handle ? this._composerDataService.getComposerData(handle) : void 0))
          return;

        const { diffInfo, isDone } = partialDiffEvent;
        if (isDone) {
          if (action === "accepted") {
            handleDiffAccept(diffInfo);
          } else if (this._isLegacyInlineDiffsUsed()) {
            handleDiffReject({ ...diffInfo, inlineDiff: partialDiffEvent.inlineDiff });
          } else {
            handleDiffReject(diffInfo);
          }
        }
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    /**
     * Handle diff restored from undo/redo — mark code block as completed.
     */
    const handleAddDiffFromUndoRedo = (diffInfo) => {
      const env = { stack: [], error: void 0, hasError: false };
      try {
        const span = __addDisposableResource(
          env,
          WP("ComposerCodeBlockService.handleAddDiffFromUndoRedo"),
          false
        );
        const { composerId, codeblockId } = diffInfo.composerMetadata ?? {};
        if (!composerId || codeblockId === void 0) return;

        const handle = this._composerDataService.getHandleIfLoaded(composerId);
        if (!handle || !handle.data || !this.getComposerCodeBlock(handle, diffInfo.uri, codeblockId))
          return;

        this.updateComposerCodeBlock(handle, diffInfo.uri, codeblockId, {
          status: "completed",
        });
        console.log(
          `[composer] Restored diff for ${diffInfo.uri.toString()} with codeblockId ${codeblockId}`
        );
      } catch (error) {
        env.error = error;
        env.hasError = true;
      } finally {
        __disposeResources(env);
      }
    };

    // --- Register inline diff event handlers ---
    this._register(this._inlineDiffService.onDidAcceptDiff(handleDiffAccept));
    this._register(
      this._inlineDiffService.onDidRejectDiff((info) => handleDiffReject(info))
    );
    this._register(
      this._inlineDiffService.onDidRemoveDiffFromUndoRedo((info) =>
        handleDiffRemoval(info)
      )
    );
    this._register(
      this._inlineDiffService.onDidAddDiffFromUndoRedo((info) =>
        handleAddDiffFromUndoRedo(info)
      )
    );
    this._register(
      this._inlineDiffService.onDidAcceptPartialDiff((info) =>
        handlePartialDiff(info, "accepted")
      )
    );
    this._register(
      this._inlineDiffService.onDidRejectPartialDiff((info) =>
        handlePartialDiff(info, "rejected")
      )
    );
  }

  // --- Legacy inline diffs detection ---

  _isLegacyInlineDiffsUsed() {
    const registry = this._diffChangeSourceRegistry;
    if (registry !== void 0) {
      return registry.isLegacyInlineDiffsUsed();
    }
    return !this._experimentService.checkFeatureGate("inline_diffs_v2_adapter");
  }

  // --- Partial inline diff fate storage ---

  async _storePartialInlineDiffFates(diffEvent) {
    const { composerMetadata, partialInlineDiffFates } = diffEvent;
    if (!composerMetadata || !partialInlineDiffFates) return;

    const { composerId, codeblockId } = composerMetadata;
    const uri = diffEvent.uri;

    const fatesId =
      await this._composerCodeBlockPartialInlineDiffFatesStorageService.storePartialInlineDiffFates(
        composerId,
        partialInlineDiffFates
      );

    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    if (handle && codeblockId) {
      this.updateComposerCodeBlock(handle, uri, codeblockId, {
        partialInlineDiffFatesId: fatesId,
      });
    }
  }

  // ============================================================
  // Code block CRUD
  // ============================================================

  /** Get a code block by handle, URI, and codeblockId */
  getComposerCodeBlock(handle, uri, codeblockId) {
    return handle.data.codeBlockData?.[uri.toString()]?.[codeblockId];
  }

  /** Update properties on an existing code block */
  updateComposerCodeBlock(handle, uri, codeblockId, updates) {
    if (!handle.data.codeBlockData[uri.toString()]?.[codeblockId]) {
      console.trace(
        "[composer] updateReactiveCodeBlock called for codeblockId that does not exist",
        uri,
        codeblockId
      );
      return;
    }
    try {
      this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
        setStore("codeBlockData", uri.toString(), codeblockId, (existing) => ({
          ...existing,
          ...updates,
        }))
      );
    } catch {}
  }

  /** Update code block via store setter function */
  updateComposerCodeBlockSetStore(handle, uri, codeblockId, updater) {
    if (!handle.data.codeBlockData[uri.toString()]?.[codeblockId]) {
      console.trace(
        "[composer] updateComposerCodeBlockSetStore called for codeblockId that does not exist",
        uri,
        codeblockId
      );
      return;
    }
    try {
      this._composerDataService.updateComposerDataSetStore(handle, (setStore) => {
        updater((...args) => setStore("codeBlockData", uri.toString(), codeblockId, ...args));
      });
    } catch {}
  }

  // ============================================================
  // Caching
  // ============================================================

  /** Determine if a code block should be cached (not in foreground) */
  shouldCache(handle, codeBlockRef) {
    const composerData = handle.data;

    if (codeBlockRef !== void 0) {
      const codeBlock = this.getComposerCodeBlock(
        handle,
        codeBlockRef.uri,
        codeBlockRef.codeblockId
      );
      if (codeBlock && codeBlock.isNotApplied) return true;
    }

    const isSelected = this._composerDataService.selectedComposerIds.includes(
      composerData.composerId
    );
    const rootId = this._composerDataService.getRootComposerId(composerData.composerId);
    const isRootSelected =
      this._composerDataService.selectedComposerIds.includes(rootId);

    return !isSelected && !isRootSelected;
  }

  /** Unregister a cached code block and clean up watchers */
  unregisterCachedCodeBlock(handle, uri, codeblockId) {
    this.updateComposerCodeBlock(handle, uri, codeblockId, { isCached: false });

    const composerId = handle.data.composerId;
    const activeBlocks = (
      this._uriToCachedCodeBlocks.get(uri.toString()) ?? []
    ).filter(
      (entry) => entry.composerId !== composerId || entry.codeblockId !== codeblockId
    );
    const queuedBlocks = (
      this._uriToCachedCodeBlocksQueue.get(uri.toString()) ?? []
    ).filter(
      (entry) => entry.composerId !== composerId || entry.codeblockId !== codeblockId
    );

    if (activeBlocks.length === 0 && queuedBlocks.length === 0) {
      this._fileWatchers.get(uri.toString())?.dispose();
      this._fileWatchers.delete(uri.toString());
      this._uriToCachedCodeBlocks.delete(uri.toString());
      this._uriToCachedCodeBlocksQueue.delete(uri.toString());
      return;
    }

    this._uriToCachedCodeBlocks.set(uri.toString(), activeBlocks);
    this._uriToCachedCodeBlocksQueue.set(uri.toString(), queuedBlocks);
  }

  /** Unregister all cached code blocks for a composer handle */
  unregisterAllCachedCodeBlocks(handle) {
    const allCached = this.getAllCachedCodeBlocks(handle);
    for (const block of allCached) {
      this.unregisterCachedCodeBlock(handle, block.uri, block.codeblockId);
    }
  }

  /** Register a code block for caching with file watcher */
  registerCachedCodeBlock(handle, uri, codeblockId, isQueued) {
    this.updateComposerCodeBlock(handle, uri, codeblockId, { isCached: true });

    const composerData = handle.data;
    const composerId = composerData.composerId;

    // Ensure file watcher exists
    if (!this._fileWatchers.has(uri.toString())) {
      const watcher = this._composerFileService.watch({ uri, composerData });
      this._fileWatchers.set(uri.toString(), watcher);
    }

    if (isQueued) {
      const queuedBlocks =
        this._uriToCachedCodeBlocksQueue.get(uri.toString()) ?? [];
      this._uriToCachedCodeBlocksQueue.set(uri.toString(), [
        ...queuedBlocks.filter(
          (e) => e.composerId !== composerId || e.codeblockId !== codeblockId
        ),
        { composerId, codeblockId },
      ]);

      // Remove from active cache
      const activeBlocks = (
        this._uriToCachedCodeBlocks.get(uri.toString()) ?? []
      ).filter(
        (e) => e.composerId !== composerId || e.codeblockId !== codeblockId
      );
      this._uriToCachedCodeBlocks.set(uri.toString(), activeBlocks);
    } else {
      const activeBlocks =
        this._uriToCachedCodeBlocks.get(uri.toString()) ?? [];
      this._uriToCachedCodeBlocks.set(uri.toString(), [
        ...activeBlocks.filter(
          (e) => e.composerId !== composerId || e.codeblockId !== codeblockId
        ),
        { composerId, codeblockId },
      ]);
    }
  }

  /** Mark all cached code blocks for a URI as outdated */
  markUriAsOutdated(uri, hasQueuedBlocks) {
    if (
      !this._uriToCachedCodeBlocks.has(uri.toString()) ||
      !this._fileWatchers.has(uri.toString())
    ) {
      return;
    }

    const cachedBlocks = this._uriToCachedCodeBlocks.get(uri.toString()) ?? [];
    for (const { composerId, codeblockId } of cachedBlocks) {
      const handle = this._composerDataService.getHandleIfLoaded(composerId);
      if (!handle) continue;

      const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
      if (codeBlock && codeBlock.isNotApplied) {
        // Clear diffId for not-yet-applied blocks
        this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
          setStore("codeBlockData", uri.toString(), codeblockId, "diffId", void 0)
        );
      } else {
        this.setCodeBlockStatus(handle, uri, codeblockId, "outdated");
        this.updateComposerCodeBlock(handle, uri, codeblockId, { isCached: false });
      }
    }

    if (!hasQueuedBlocks) {
      this._fileWatchers.get(uri.toString())?.dispose();
      this._fileWatchers.delete(uri.toString());
    }
    this._uriToCachedCodeBlocks.delete(uri.toString());
    this._uriToCachedCodeBlocksQueue.delete(uri.toString());
  }

  /** Check if a code block is registered as cached */
  isCodeBlockRegisteredAsCached(handle, uri, codeblockId) {
    const composerId = handle.data.composerId;
    const inActive = !!this._uriToCachedCodeBlocks
      .get(uri.toString())
      ?.some((e) => e.codeblockId === codeblockId && e.composerId === composerId);
    const inQueued = !!this._uriToCachedCodeBlocksQueue
      .get(uri.toString())
      ?.some((e) => e.codeblockId === codeblockId && e.composerId === composerId);
    const isCachedFlag = this.getComposerCodeBlock(handle, uri, codeblockId)?.isCached;
    return ((inActive || inQueued) && isCachedFlag) ?? false;
  }

  // ============================================================
  // Status management
  // ============================================================

  getCodeBlockStatus(handle, uri, codeblockId) {
    const composerData = handle.data;
    if (!composerData) return "none";

    const uriBlocks = composerData?.codeBlockData[uri.toString()];
    if (!uriBlocks) return "none";

    const block = uriBlocks[codeblockId];
    return block ? block.status : "none";
  }

  /** Set status and propagate to subagent code blocks */
  setCodeBlockStatus(handle, uri, codeblockId, status) {
    const composerData = handle.data;
    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);

    if (codeBlock) {
      this.updateComposerCodeBlock(handle, uri, codeblockId, { status });

      // Propagate to subagent source code block
      if (codeBlock.fromSubagentCodeBlockInfo) {
        const subHandle = this._composerDataService.getHandleIfLoaded(
          codeBlock.fromSubagentCodeBlockInfo.composerId
        );
        if (subHandle) {
          this.updateComposerCodeBlock(
            subHandle,
            codeBlock.uri,
            codeBlock.fromSubagentCodeBlockInfo.codeblockId,
            { status }
          );
        }
      }
    }
  }

  /** Set status on a code block and all previously chained code blocks */
  setCodeBlockStatusIncludingPreviouslyChained(handle, uri, codeblockId, status) {
    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
    if (!codeBlock) return;

    this.setCodeBlockStatus(handle, uri, codeblockId, status);

    if (codeBlock.chainedInfo) {
      const visited = new Set([codeblockId]);
      let current = codeBlock.chainedInfo;

      while (current) {
        const chainedId = current.chainedFromCodeblockId;
        const chainedComposerId = current.composerId || handle.data.composerId;
        const chainedHandle = chainedComposerId
          ? this._composerDataService.getHandleIfLoaded(chainedComposerId)
          : handle;

        if (!chainedHandle) break;

        const chainedBlock = this.getComposerCodeBlock(chainedHandle, uri, chainedId);
        if (!chainedBlock || visited.has(chainedId)) break;

        visited.add(chainedId);
        this.setCodeBlockStatus(chainedHandle, uri, chainedId, status);
        current = chainedBlock.chainedInfo || void 0;
      }
    }
  }

  /** Get all code blocks matching one or more statuses */
  getCodeBlocksOfStatuses(handle, statuses) {
    const composerData = handle.data;
    if (!composerData) return [];

    const codeBlockData = composerData.codeBlockData;
    const statusList = Array.isArray(statuses) ? statuses : [statuses];
    const results = [];

    for (const uriString of Object.keys(codeBlockData)) {
      const uriBlocks = codeBlockData[uriString];
      for (const blockId of Object.keys(uriBlocks)) {
        const block = uriBlocks[blockId];
        if (statusList.includes(block.status)) {
          results.push(block);
        }
      }
    }
    return results;
  }

  /** Mark all "generating" code blocks as "aborted" */
  setGeneratingCodeBlocksToAborted(handle) {
    const generatingBlocks = this.getCodeBlocksOfStatuses(handle, "generating");
    for (const block of generatingBlocks) {
      this.setCodeBlockStatus(handle, block.uri, block.codeblockId, "aborted");
    }

    const composerData = handle.data;
    if (composerData) {
      for (const bubbleId of Object.keys(composerData.conversationMap)) {
        const bubble = composerData.conversationMap[bubbleId];
        if (bubble.type === ul.AI) {
          for (const codeBlock of bubble.codeBlocks ?? []) {
            if (codeBlock.isGenerating === true) {
              this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
                setStore(
                  "conversationMap",
                  bubbleId,
                  "codeBlocks",
                  (cb) =>
                    cb.codeBlockIdx === codeBlock.codeBlockIdx &&
                    cb.unregistered === true,
                  "isGenerating",
                  false
                )
              );
            }
          }
        }
      }
    }
  }

  // ============================================================
  // Code block lookups
  // ============================================================

  /** Get the most recently created code block ID for a URI */
  getLastCreatedCodeBlockId(handle, uri) {
    const composerData = handle.data;
    if (!composerData) return;

    const uriBlocks = composerData.codeBlockData[uri.toString()];
    if (!uriBlocks || Object.keys(uriBlocks).length === 0) return;

    let maxCreatedAt = -1;
    let result;
    for (const blockId in uriBlocks) {
      const block = uriBlocks[blockId];
      if (block.createdAt !== void 0 && block.createdAt > maxCreatedAt) {
        maxCreatedAt = block.createdAt;
        result = blockId;
      }
    }
    return result;
  }

  /** Get the most recently applied code block ID for a URI */
  getLastAppliedCodeBlockId(handle, uri) {
    const composerData = handle.data;
    if (!composerData) return;

    const uriBlocks = composerData.codeBlockData[uri.toString()];
    if (!uriBlocks || Object.keys(uriBlocks).length === 0) return;

    let maxAppliedAt = -1;
    let result;
    for (const blockId in uriBlocks) {
      const block = uriBlocks[blockId];
      if (block.lastAppliedAt !== void 0 && block.lastAppliedAt > maxAppliedAt) {
        maxAppliedAt = block.lastAppliedAt;
        result = blockId;
      }
    }
    return result;
  }

  getLastAppliedCodeBlock(handle, uri) {
    const blockId = this.getLastAppliedCodeBlockId(handle, uri);
    if (blockId) return this.getComposerCodeBlock(handle, uri, blockId);
  }

  getLastAcceptedCodeBlock(handle, uri) {
    const composerData = handle.data;
    if (!composerData) return;

    const uriBlocks = composerData.codeBlockData[uri.toString()];
    if (!uriBlocks || Object.keys(uriBlocks).length === 0) return;

    let maxAppliedAt = -1;
    let result;
    for (const blockId in uriBlocks) {
      const block = uriBlocks[blockId];
      if (
        block.status === "accepted" &&
        block.lastAppliedAt !== void 0 &&
        block.lastAppliedAt > maxAppliedAt
      ) {
        maxAppliedAt = block.lastAppliedAt;
        result = blockId;
      }
    }
    if (result) return this.getComposerCodeBlock(handle, uri, result);
  }

  getLastAppliedCodeBlocks(handle) {
    const composerData = handle.data;
    if (!composerData) return [];

    const results = [];
    Object.keys(composerData.codeBlockData ?? {}).forEach((uriString) => {
      const uri = je.parse(uriString);
      const block = this.getLastAppliedCodeBlock(handle, uri);
      if (block) results.push(block);
    });
    return results;
  }

  /** Get all cached code blocks for a composer handle */
  getAllCachedCodeBlocks(handle) {
    const composerData = handle.data;
    if (!composerData) throw Error("[composer] composer doesn't exist");

    const { codeBlockData } = composerData;
    const allBlocks = [];
    for (const uriString of Object.keys(codeBlockData)) {
      const uriBlocks = codeBlockData[uriString];
      for (const blockId of Object.keys(uriBlocks)) {
        allBlocks.push(uriBlocks[blockId]);
      }
    }
    return allBlocks.filter(({ isCached }) => isCached === true);
  }

  /** Update the lastAppliedAt timestamp for a code block */
  updateCodeBlockLastAppliedAt(handle, uri, codeblockId) {
    if (!handle.data) return;
    const uriString = uri.toString();
    this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
      setStore("codeBlockData", uriString, codeblockId, "lastAppliedAt", Date.now())
    );
  }

  // ============================================================
  // Relevant composer IDs (includes subagents)
  // ============================================================

  _getRelevantComposerIds(handle) {
    const ids = new Set();
    const queue = [handle.data.composerId];

    while (queue.length > 0) {
      const id = queue.pop();
      if (ids.has(id)) continue;
      ids.add(id);

      const composerHandle =
        id === handle.data.composerId
          ? handle
          : this._composerDataService.getHandleIfLoaded(id);
      if (composerHandle) {
        for (const subId of composerHandle.data.subagentComposerIds ?? []) {
          if (!ids.has(subId)) queue.push(subId);
        }
      }
    }
    return ids;
  }

  getRelevantComposerIds(handle) {
    return this._getRelevantComposerIds(handle);
  }

  // ============================================================
  // Inline diff queries
  // ============================================================

  /** Check if any pending diffs exist for this composer (and subagents) */
  hasPendingDiffs(handle) {
    const relevantIds = this._getRelevantComposerIds(handle);
    return this._diffChangeSourceRegistry.getDescriptors().some((descriptor) => {
      const composerId = descriptor.metadata?.composerId;
      return composerId !== void 0 && relevantIds.has(composerId);
    });
  }

  /** Get the inline diff for a specific URI */
  getInlineDiff(handle, uri) {
    const relevantIds = this._getRelevantComposerIds(handle);
    return this._inlineDiffService.inlineDiffs.nonReactive().find((diff) => {
      if (diff.uri.toString() !== uri.toString()) return false;
      const composerId = diff.composerMetadata?.composerId;
      return !(!composerId || !relevantIds.has(composerId));
    });
  }

  /** Get all inline diffs for this composer, excluding plans dir and workspace-external files */
  getAllInlineDiffs(handle) {
    const relevantIds = this._getRelevantComposerIds(handle);
    const allDiffs = this._inlineDiffService.inlineDiffs
      .nonReactive()
      .filter((diff) => {
        const composerId = diff.composerMetadata?.composerId;
        return composerId !== void 0 && relevantIds.has(composerId);
      });

    const plansDir = this.userPlansDir;
    return allDiffs.filter(
      (diff) =>
        !(
          XSt(diff.uri, this._workspaceContextService) ||
          (plansDir && Iq(diff.uri, plansDir))
        )
    );
  }

  /** Get all pending diff descriptors */
  getAllPendingDiffDescriptors(handle) {
    const relevantIds = this._getRelevantComposerIds(handle);
    const descriptors = this._diffChangeSourceRegistry.getDescriptors();
    const plansDir = this.userPlansDir;

    return descriptors.filter((descriptor) => {
      const composerId = descriptor.metadata?.composerId;
      return !(
        !composerId ||
        !relevantIds.has(composerId) ||
        XSt(descriptor.uri, this._workspaceContextService) ||
        (plansDir && Iq(descriptor.uri, plansDir))
      );
    });
  }

  /** Get file URIs that have code block data (excluding plans) */
  getCodeBlockFileUris(handle) {
    const codeBlockData = handle.data.codeBlockData;
    const uriStrings = Object.keys(codeBlockData);
    const plansDir = this.userPlansDir;

    return uriStrings.filter((uriString) => {
      const blocks = codeBlockData[uriString];
      if (!blocks || Object.keys(blocks).length === 0) return false;
      try {
        const uri = je.parse(uriString);
        return !(
          XSt(uri, this._workspaceContextService) ||
          (plansDir && Iq(uri, plansDir))
        );
      } catch {
        return true;
      }
    });
  }

  /** Get inline diff for chaining (any composer's diff on this URI) */
  getInlineDiffForChaining(uri) {
    const uriString = uri.toString();
    return this._inlineDiffService.inlineDiffs
      .nonReactive()
      .find(
        (diff) =>
          diff.uri.toString() === uriString &&
          diff.composerMetadata?.composerId !== void 0
      );
  }

  doesFileHaveInlineDiff(handle, uri) {
    return !!this.getInlineDiff(handle, uri);
  }

  doesFileHaveChanges(handle, uri) {
    const block = this.getLastAppliedCodeBlock(handle, uri);
    return block != null && block.diffId !== void 0;
  }

  /** Get URIs of code blocks with diffs in the last AI bubbles */
  getUrisOfCodeblocksWithDiffsInLastAiBubbles(handle, humanBubbleId) {
    if (!handle.data) return [];
    const aiBubbles = this._composerDataService.getLastAiBubbles(handle, {
      humanBubbleId,
    });
    if (!aiBubbles.length) return [];
    return this.getUrisOfCodeblocksWithDiffsInAiBubbles(handle, aiBubbles).map(
      (entry) => entry.uri
    );
  }

  getUrisOfCodeblocksWithDiffsInAiBubbles(handle, aiBubbles) {
    if (!aiBubbles.length) return [];

    const uriToBubbleId = new Map();
    for (const bubble of aiBubbles) {
      bubble.codeBlocks?.forEach((cb) => {
        if (cb.uri && !uriToBubbleId.has(cb.uri.toString())) {
          const codeBlock = this.getComposerCodeBlock(handle, cb.uri, cb.codeblockId);
          if (codeBlock?.diffId !== void 0 && codeBlock.lastAppliedAt !== void 0) {
            uriToBubbleId.set(cb.uri.toString(), bubble.bubbleId);
          }
        }
      });
    }

    return Array.from(uriToBubbleId.entries()).map(([uriString, bubbleId]) => ({
      uri: je.parse(uriString),
      firstBubbleId: bubbleId,
    }));
  }

  // ============================================================
  // Code block URI change
  // ============================================================

  /** Move a code block from one URI to another (e.g., file rename) */
  changeCodeBlockUri(handle, oldUri, newUri, codeblockId) {
    const composerData = handle.data;
    if (!composerData) throw new Error("[composer] No composer found for the given ID");

    const oldUriStr = oldUri.toString();
    const newUriStr = newUri.toString();

    const codeBlock = this.getComposerCodeBlock(handle, oldUri, codeblockId);
    if (!codeBlock) {
      console.error(
        "[composer] No codeblock found for the given URI and codeblockId",
        oldUri,
        codeblockId
      );
      return "";
    }

    // Move code block data to new URI
    if (composerData.codeBlockData[oldUriStr]?.[codeblockId]) {
      const updatedBlock = {
        ...composerData.codeBlockData[oldUriStr][codeblockId],
        uri: newUri,
      };

      const remainingKeys = Object.keys(composerData.codeBlockData[oldUriStr]).filter(
        (id) => id !== codeblockId
      );
      if (remainingKeys.length === 0) {
        this._composerDataService.updateComposerDataSetStore(handle, (setStore) => {
          setStore("codeBlockData", oldUriStr, void 0);
        });
      } else {
        this._composerDataService.updateComposerDataSetStore(handle, (setStore) => {
          setStore("codeBlockData", oldUriStr, codeblockId, void 0);
        });
      }

      this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
        setStore("codeBlockData", newUriStr, (existing = {}) => ({
          ...existing,
          [codeblockId]: updatedBlock,
        }))
      );
    }

    // Update conversation map references
    this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
      setStore(
        "conversationMap",
        codeBlock.bubbleId,
        "codeBlocks",
        (cb) =>
          !cb.unregistered &&
          cb.uri?.toString() === oldUriStr &&
          cb.codeblockId === codeblockId,
        (cb) => ({ ...cb, uri: newUri })
      )
    );

    return codeblockId;
  }

  // ============================================================
  // Diff computation
  // ============================================================

  /** Compute line-level diffs between original file and new content */
  async computeLineDiffs(handle, uri, newLines, options) {
    const originalLines = this.getCodeBlockV0ModelLines(handle, uri);
    if (!originalLines) return [];

    const diffResult = await this.computeLinesDiffWithSemaphore({
      first: originalLines,
      second: newLines,
      options: {
        ignoreTrimWhitespace: options?.forStats === true,
        computeMoves: false,
        maxComputationTimeMs: 2000,
        ...DIFF_COMPUTATION_OPTIONS,
      },
    });

    let changes = diffResult.changes;

    if (diffResult.hitTimeout) {
      console.warn(
        `[composer] Diff computation timed out for ${uri.fsPath}. File has ${originalLines.length} original lines and ${newLines.length} new lines. Treating entire file as changed.`
      );
      changes = [
        new C3(
          new rh(1, originalLines.length + 1),
          new rh(1, newLines.length + 1),
          void 0
        ),
      ];
    }

    return changes.map((change) => ({
      original: change.original,
      modified: newLines.slice(
        change.modified.startLineNumber - 1,
        change.modified.endLineNumberExclusive - 1
      ),
    }));
  }

  /** Compute line diffs with concurrency-limited semaphore and caching */
  async computeLinesDiffWithSemaphore({ first, second, options }) {
    return this._composerDiffSemaphore.withSemaphore(async () => {
      const firstHash = await a2o(Array.isArray(first) ? first.join("\n") : first);
      const secondHash = await a2o(Array.isArray(second) ? second.join("\n") : second);
      const cacheKey = JSON.stringify({ firstSha1: firstHash, secondSha1: secondHash });

      const cached = this._composerDiffCache.get(cacheKey);
      if (cached) return cached;

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(new Woe([], [], true));
        }, options.maxComputationTimeMs);
      });

      const diffPromise = this._editorWorkerService.computeLinesDiff(
        Array.isArray(first) ? first : eA(first),
        Array.isArray(second) ? second : eA(second),
        options
      );

      const result = await Promise.race([diffPromise, timeoutPromise]);

      if (result.hitTimeout) {
        this._metricsService.increment({ stat: "composer.computeLinesDiff.timedOut" });
      } else {
        this._composerDiffCache.set(cacheKey, result);
      }

      return result;
    });
  }

  // ============================================================
  // Content reconstruction
  // ============================================================

  /** Get code block lines by applying diff to V0 (original) model */
  getCodeBlockLinesByDiff(handle, uri, diff) {
    if (!handle.data) return null;
    const v0Lines = this.getCodeBlockV0ModelLines(handle, uri);
    return rc(() =>
      diff.length === 0 ? v0Lines ?? [] : this.applyDiffToLines(v0Lines ?? [], diff)
    );
  }

  /** Get the original (V0) file content lines */
  getCodeBlockV0ModelLines(handle, uri) {
    const composerData = handle.data;
    if (!composerData) return null;

    const originalState = composerData.originalFileStates[uri.toString()];
    return originalState ? eA(originalState.content) : null;
  }

  /** Get original model lines for a specific code block (before its changes) */
  async getCodeBlockOriginalModelLines(handle, uri, codeblockId, options) {
    const composerData = handle.data;
    if (!composerData) return null;

    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
    if (!codeBlock || !codeBlock.diffId) return null;

    // Handle chaining: get the original from the chained-from code block
    if (options?.shouldChain && codeBlock.chainedInfo) {
      const chainedComposerId =
        codeBlock.chainedInfo.composerId || handle.data.composerId;
      const chainedHandle = chainedComposerId
        ? this._composerDataService.getHandleIfLoaded(chainedComposerId)
        : handle;

      if (!chainedHandle) return null;

      const chainedBlock = this.getComposerCodeBlock(
        chainedHandle,
        uri,
        codeBlock.chainedInfo.chainedFromCodeblockId
      );
      if (!chainedBlock || !chainedBlock.diffId) return null;

      const chainedDiff =
        await this._composerCodeBlockDiffStorageService.retrieveDiff(
          chainedComposerId,
          chainedBlock.diffId
        );
      return chainedDiff
        ? this.getCodeBlockLinesByDiff(
            chainedHandle,
            uri,
            chainedDiff.originalModelDiffWrtV0
          )
        : null;
    }

    const storedDiff =
      await this._composerCodeBlockDiffStorageService.retrieveDiff(
        composerData.composerId,
        codeBlock.diffId
      );
    return storedDiff
      ? this.getCodeBlockLinesByDiff(handle, uri, storedDiff.originalModelDiffWrtV0)
      : null;
  }

  /** Get new model lines for a specific code block (after its changes) */
  async getCodeBlockNewModelLines(handle, uri, codeblockId) {
    const composerData = handle.data;
    if (!composerData) return null;

    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
    if (!codeBlock || !codeBlock.diffId) return null;

    const storedDiff =
      await this._composerCodeBlockDiffStorageService.retrieveDiff(
        composerData.composerId,
        codeBlock.diffId
      );
    return storedDiff
      ? this.getCodeBlockLinesByDiff(handle, uri, storedDiff.newModelDiffWrtV0)
      : null;
  }

  /** Apply a list of diffs to a base set of lines */
  applyDiffToLines(baseLines, diffs) {
    const result = [];
    let diffIdx = 0;

    for (let i = 0; i < baseLines.length; i++) {
      const line = baseLines[i];
      if (diffIdx < diffs.length) {
        const { original, modified } = diffs[diffIdx];
        if (i === original.startLineNumber - 1) {
          result.push(...modified);
          diffIdx++;
          if (original.endLineNumberExclusive !== original.startLineNumber) {
            i += original.endLineNumberExclusive - original.startLineNumber - 1;
            continue;
          }
          continue;
        }
      }
      result.push(line);
    }

    // Append any remaining diffs (insertions at end)
    for (; diffIdx < diffs.length; diffIdx++) {
      const { original, modified } = diffs[diffIdx];
      result.push(...modified);
    }

    return result;
  }

  // ============================================================
  // Code block registration
  // ============================================================

  /**
   * Register a new code block for a file.
   * Creates the code block entry, stores original file state on first edit,
   * and adds the code block to the conversation bubble.
   */
  async registerNewCodeBlock(handle, uri, content, codeBlockIdx, options) {
    const composerData = handle.data;
    if (!composerData) {
      throw new Error("[composer] No composer found for the given ID");
    }

    const conversation = this._composerDataService.getLoadedConversation(handle);
    const bubbleIndex = options?.bubbleId
      ? conversation.findIndex((msg) => msg.bubbleId === options.bubbleId)
      : conversation.length - 1;
    const bubble = conversation.at(bubbleIndex);
    const bubbleId = options?.bubbleId ?? bubble?.bubbleId;

    if (!bubbleId) {
      throw new Error("[composer] No AI message found");
    }

    // Check if this code block was previously registered as unregistered
    const isUnregistered =
      bubble &&
      bubble.codeBlocks?.find((cb) => cb.codeBlockIdx === codeBlockIdx)?.unregistered ===
        true;

    const uriString = uri.toString();
    const codeblockId = Gr();

    const codeBlockData = {
      _v: pwg,
      bubbleId,
      codeBlockIdx,
      uri,
      codeblockId,
      status: options?.status ?? "none",
      isNotApplied: options?.isNotApplied,
      languageId: options?.languageId,
      chainedInfo: options?.chainedInfo,
      fromSubagentCodeBlockInfo: options?.fromSubagentCodeBlockInfo,
      codeBlockDisplayPreference: options?.isNotApplied ? "expanded" : "collapsed",
      createdAt: Date.now(),
      composerChatGenerationUuid: composerData.chatGenerationUUID,
    };

    // Add to code block data store
    this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
      setStore("codeBlockData", uriString, (existing = {}) => ({
        ...existing,
        [codeblockId]: codeBlockData,
      }))
    );

    // Add/update in conversation map
    if (bubble) {
      if (isUnregistered) {
        this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
          setStore(
            "conversationMap",
            bubbleId,
            "codeBlocks",
            (cb) => cb.codeBlockIdx === codeBlockIdx,
            {
              uri,
              codeblockId,
              codeBlockIdx,
              unregistered: false,
              content,
              searchReplace: options?.searchReplace,
            }
          )
        );
      } else {
        this.addNewCodeBlockToBubble(handle, bubbleId, codeBlockIdx, {
          uri,
          codeblockId,
          codeBlockIdx,
          content,
          languageId: options?.languageId,
          searchReplace: options?.searchReplace,
        });
      }
    }

    // Store original file state on first code block for this URI
    const existingBlocks = composerData.codeBlockData[uriString];
    if (
      (!existingBlocks || Object.keys(existingBlocks).length === 1) &&
      composerData.originalFileStates[uriString] === void 0
    ) {
      const originalContent =
        (await this.getFileContent(uri, handle)) ?? "";
      const fileExists = await this._composerFileService.exists({
        uri,
        composerData,
      });

      // Track newly created folders
      const newFolders = [];
      if (!fileExists) {
        let currentUri = uri;
        let parentUri = Id(currentUri);
        while (
          !Zc(currentUri, parentUri) &&
          !(await this._composerFileService.exists({ uri: parentUri, composerData }))
        ) {
          newFolders.push(parentUri);
          currentUri = parentUri;
          parentUri = Id(currentUri);
        }
        newFolders.reverse();
      }

      this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
        setStore("originalFileStates", uriString, {
          content: originalContent,
          firstEditBubbleId: bubbleId,
          isNewlyCreated: !fileExists,
          newlyCreatedFolders: newFolders,
        })
      );

      // Handle notebook cell URIs — also store notebook-level state
      if (uri.scheme === _n.vscodeNotebookCell) {
        try {
          const notebookUri = ygt(uri);
          if (composerData.originalFileStates[notebookUri.toString()] === void 0) {
            const notebookContent =
              (await this.getFileContent(notebookUri, handle)) ?? "";
            const notebookExists = await this._composerFileService.exists({
              uri: notebookUri,
              composerData,
            });
            this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
              setStore("originalFileStates", notebookUri.toString(), {
                content: notebookContent,
                firstEditBubbleId: bubbleId,
                isNewlyCreated: !notebookExists,
                newlyCreatedFolders: newFolders,
              })
            );
          }
        } catch {
          console.error(
            `[registerNewCodeBlock] Failed to process notebook cell URI: ${uri.toString()}`
          );
        }
      }
    }

    // Fire event
    this._composerEventService.fireDidRegisterNewCodeBlock({
      composerId: composerData.composerId,
      uri,
      codeblockId,
      codeBlockIdx,
      messageIndex: bubbleIndex,
    });

    return codeBlockData;
  }

  /** Read file content via text model reference */
  async getFileContent(uri, handle) {
    const composerData = handle.data;
    if (
      !(await this._composerFileService.exists({ uri, composerData }))
    ) {
      return null;
    }

    let modelRef;
    try {
      modelRef = await this.composerTextModelService.createModelReference(
        uri,
        composerData,
        true
      );
      return modelRef.object.textEditorModel.getValue();
    } catch (error) {
      console.error("[composer] error getting content of file", uri, error);
      return null;
    } finally {
      modelRef?.dispose();
    }
  }

  /** Insert a new code block entry into a conversation bubble's codeBlocks array */
  addNewCodeBlockToBubble(handle, bubbleId, codeBlockIdx, codeBlockRef) {
    this._composerDataService.updateComposerDataSetStore(handle, (setStore) =>
      setStore("conversationMap", bubbleId, "codeBlocks", (existing) => {
        const blocks = [...(existing || [])];
        const insertIdx = blocks.findIndex((cb) => cb.codeBlockIdx > codeBlockIdx);
        const entry = { ...codeBlockRef, codeBlockIdx };
        if (insertIdx === -1) {
          blocks.push(entry);
        } else {
          blocks.splice(insertIdx, 0, entry);
        }
        return blocks;
      })
    );
  }

  // ============================================================
  // Code block chaining
  // ============================================================

  /** Walk the chain of code blocks to find the original (first) one */
  getChainedOriginalCodeBlock(handle, uri, codeblockId) {
    if (!handle.data) return null;

    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
    if (!codeBlock || !codeBlock.chainedInfo) return null;

    let current = codeBlock.chainedInfo;
    let result;
    const visited = new Set([codeblockId]);

    while (current) {
      const chainedId = current.chainedFromCodeblockId;
      const chainedComposerId = current.composerId || handle.data.composerId;
      const chainedHandle = chainedComposerId
        ? this._composerDataService.getHandleIfLoaded(chainedComposerId)
        : handle;

      if (!chainedHandle) break;

      result = this.getComposerCodeBlock(chainedHandle, uri, chainedId);
      if (visited.has(chainedId)) break;
      visited.add(chainedId);
      current = result?.chainedInfo || void 0;
    }

    return result ?? null;
  }

  // ============================================================
  // Diff statistics
  // ============================================================

  /** Compute added/removed line counts for a code block diff */
  async getCodeBlockDiffStats(handle, uri) {
    const composerData = handle.data;
    if (!composerData) return { added: 0, removed: 0 };

    let uriString = uri.toString();
    // Handle git worktree URI resolution
    if (composerData.gitWorktree) {
      uriString = xSt(uri, composerData, this._workspaceContextService).toString();
    }

    const uriBlocks = composerData.codeBlockData[uriString];
    if (!uriBlocks || Object.keys(uriBlocks).length === 0) {
      console.warn(
        `[composer] No code blocks found for URI: ${uriString} in composer ${handle.composerId}`
      );
      return { added: 0, removed: 0 };
    }

    const lastApplied = this.getLastAppliedCodeBlock(handle, uri);
    if (!lastApplied) return { added: 0, removed: 0 };

    const originalLines = this.getCodeBlockV0ModelLines(handle, uri);
    const newLines = await this.getCodeBlockNewModelLines(
      handle,
      uri,
      lastApplied.codeblockId
    );
    if (!originalLines || !newLines) return { added: 0, removed: 0 };

    // Quick check: if same length and all lines match, no changes
    if (originalLines.length === newLines.length) {
      let identical = true;
      for (let i = 0; i < originalLines.length; i++) {
        if (originalLines[i] !== newLines[i]) {
          identical = false;
          break;
        }
      }
      if (identical) return { added: 0, removed: 0 };
    }

    const diffs = await this.computeLineDiffs(handle, uri, newLines, { forStats: true });

    // Detect unusually large diffs (possibly due to timeout)
    const totalChangedLines = diffs.reduce(
      (sum, d) =>
        sum +
        d.modified.length +
        (d.original.endLineNumberExclusive - d.original.startLineNumber),
      0
    );
    const totalLines = originalLines.length + newLines.length;
    if (totalChangedLines > totalLines * 0.8) {
      console.warn(
        `[composer] Large diff detected for ${uri.fsPath} (${totalChangedLines}/${totalLines} lines). This may be due to diff timeout or whitespace issues.`
      );
    }

    let added = 0;
    let removed = 0;
    for (const diff of diffs) {
      added += diff.modified.length;
      removed += diff.original.endLineNumberExclusive - diff.original.startLineNumber;
    }

    return { added, removed };
  }

  // ============================================================
  // Partial inline diff fates
  // ============================================================

  async getPartialInlineDiffFates(handle, uri, codeblockId) {
    const composerData = handle.data;
    if (!composerData) return;

    const codeBlock = this.getComposerCodeBlock(handle, uri, codeblockId);
    if (!codeBlock || !codeBlock.partialInlineDiffFatesId) return void 0;

    return (
      await this._composerCodeBlockPartialInlineDiffFatesStorageService.retrievePartialInlineDiffFates(
        composerData.composerId,
        codeBlock.partialInlineDiffFatesId
      )
    )?.fates;
  }

  // ============================================================
  // Recent diff descriptors
  // ============================================================

  getRecentDiffDescriptors(handle) {
    if (this._isLegacyInlineDiffsUsed()) {
      return this.getAllPendingDiffDescriptors(handle);
    }

    const relevantIds = this._getRelevantComposerIds(handle);
    const descriptors = [];
    for (const composerId of relevantIds) {
      descriptors.push(
        ...this._diffChangeSourceRegistry.getRecentDiffDescriptors(composerId)
      );
    }
    return descriptors;
  }
};

// Method-level tracing decorators
__decorate([Hs("ComposerCodeBlockService.getComposerCodeBlock")], ComposerCodeBlockService.prototype, "getComposerCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.updateComposerCodeBlock")], ComposerCodeBlockService.prototype, "updateComposerCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.updateComposerCodeBlockSetStore")], ComposerCodeBlockService.prototype, "updateComposerCodeBlockSetStore", null);
__decorate([Hs("ComposerCodeBlockService.unregisterCachedCodeBlock")], ComposerCodeBlockService.prototype, "unregisterCachedCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.unregisterAllCachedCodeBlocks")], ComposerCodeBlockService.prototype, "unregisterAllCachedCodeBlocks", null);
__decorate([Hs("ComposerCodeBlockService.registerCachedCodeBlock")], ComposerCodeBlockService.prototype, "registerCachedCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.markUriAsOutdated")], ComposerCodeBlockService.prototype, "markUriAsOutdated", null);
__decorate([Hs("ComposerCodeBlockService.isCodeBlockRegisteredAsCached")], ComposerCodeBlockService.prototype, "isCodeBlockRegisteredAsCached", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockStatus")], ComposerCodeBlockService.prototype, "getCodeBlockStatus", null);
__decorate([Hs("ComposerCodeBlockService.setCodeBlockStatus")], ComposerCodeBlockService.prototype, "setCodeBlockStatus", null);
__decorate([Hs("ComposerCodeBlockService.setCodeBlockStatusIncludingPreviouslyChained")], ComposerCodeBlockService.prototype, "setCodeBlockStatusIncludingPreviouslyChained", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlocksOfStatuses")], ComposerCodeBlockService.prototype, "getCodeBlocksOfStatuses", null);
__decorate([Hs("ComposerCodeBlockService.setGeneratingCodeBlocksToAborted")], ComposerCodeBlockService.prototype, "setGeneratingCodeBlocksToAborted", null);
__decorate([Hs("ComposerCodeBlockService.getLastCreatedCodeBlockId")], ComposerCodeBlockService.prototype, "getLastCreatedCodeBlockId", null);
__decorate([Hs("ComposerCodeBlockService.getLastAppliedCodeBlockId")], ComposerCodeBlockService.prototype, "getLastAppliedCodeBlockId", null);
__decorate([Hs("ComposerCodeBlockService.getLastAppliedCodeBlock")], ComposerCodeBlockService.prototype, "getLastAppliedCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.getLastAcceptedCodeBlock")], ComposerCodeBlockService.prototype, "getLastAcceptedCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.getLastAppliedCodeBlocks")], ComposerCodeBlockService.prototype, "getLastAppliedCodeBlocks", null);
__decorate([Hs("ComposerCodeBlockService.getAllCachedCodeBlocks")], ComposerCodeBlockService.prototype, "getAllCachedCodeBlocks", null);
__decorate([Hs("ComposerCodeBlockService.updateCodeBlockLastAppliedAt")], ComposerCodeBlockService.prototype, "updateCodeBlockLastAppliedAt", null);
__decorate([Hs("ComposerCodeBlockService.getInlineDiff")], ComposerCodeBlockService.prototype, "getInlineDiff", null);
__decorate([Hs("ComposerCodeBlockService.getAllInlineDiffs")], ComposerCodeBlockService.prototype, "getAllInlineDiffs", null);
__decorate([Hs("ComposerCodeBlockService.getAllPendingDiffDescriptors")], ComposerCodeBlockService.prototype, "getAllPendingDiffDescriptors", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockFileUris")], ComposerCodeBlockService.prototype, "getCodeBlockFileUris", null);
__decorate([Hs("ComposerCodeBlockService.getInlineDiffForChaining")], ComposerCodeBlockService.prototype, "getInlineDiffForChaining", null);
__decorate([Hs("ComposerCodeBlockService.doesFileHaveInlineDiff")], ComposerCodeBlockService.prototype, "doesFileHaveInlineDiff", null);
__decorate([Hs("ComposerCodeBlockService.doesFileHaveChanges")], ComposerCodeBlockService.prototype, "doesFileHaveChanges", null);
__decorate([Hs("ComposerCodeBlockService.getUrisOfCodeblocksWithDiffsInLastAiBubbles")], ComposerCodeBlockService.prototype, "getUrisOfCodeblocksWithDiffsInLastAiBubbles", null);
__decorate([Hs("ComposerCodeBlockService.getUrisOfCodeblocksWithDiffsInLastAiBubbles")], ComposerCodeBlockService.prototype, "getUrisOfCodeblocksWithDiffsInAiBubbles", null);
__decorate([Hs("ComposerCodeBlockService.changeCodeBlockUri")], ComposerCodeBlockService.prototype, "changeCodeBlockUri", null);
__decorate([Hs("ComposerCodeBlockService.computeLineDiffs")], ComposerCodeBlockService.prototype, "computeLineDiffs", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockLinesByDiff")], ComposerCodeBlockService.prototype, "getCodeBlockLinesByDiff", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockV0ModelLines")], ComposerCodeBlockService.prototype, "getCodeBlockV0ModelLines", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockOriginalModelLines")], ComposerCodeBlockService.prototype, "getCodeBlockOriginalModelLines", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockNewModelLines")], ComposerCodeBlockService.prototype, "getCodeBlockNewModelLines", null);
__decorate([Hs("ComposerCodeBlockService.registerNewCodeBlock")], ComposerCodeBlockService.prototype, "registerNewCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.getChainedOriginalCodeBlock")], ComposerCodeBlockService.prototype, "getChainedOriginalCodeBlock", null);
__decorate([Hs("ComposerCodeBlockService.getCodeBlockDiffStats")], ComposerCodeBlockService.prototype, "getCodeBlockDiffStats", null);
__decorate([Hs("ComposerCodeBlockService.getPartialInlineDiffFates")], ComposerCodeBlockService.prototype, "getPartialInlineDiffFates", null);
__decorate([Hs("ComposerCodeBlockService.getRecentDiffDescriptors")], ComposerCodeBlockService.prototype, "getRecentDiffDescriptors", null);

// DI registration
ComposerCodeBlockService = __decorate(
  [
    __param(0, xu),   // IReactiveStorageService
    __param(1, aie),  // IComposerTextModelService
    __param(2, RA),   // IComposerEventService
    __param(3, _$e),  // IComposerCodeBlockDiffStorageService
    __param(4, Sga),  // IComposerCodeBlockPartialInlineDiffFatesStorageService
    __param(5, c_),   // IEditorWorkerService
    __param(6, ZE),   // IMetricsService
    __param(7, Fa),   // IComposerDataService
    __param(8, KZ),   // IComposerFileService
    __param(9, mL),   // IInlineDiffService
    __param(10, AU),  // IDiffChangeSourceRegistry
    __param(11, Rl),  // IExperimentService
    __param(12, Rr),  // IWorkspaceContextService
    __param(13, Rp),  // IPathService
  ],
  ComposerCodeBlockService
);

Ki(IComposerCodeBlockService, ComposerCodeBlockService, 1);
