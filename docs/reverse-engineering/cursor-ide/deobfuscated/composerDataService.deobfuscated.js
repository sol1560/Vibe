/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Claude Editor Contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * ComposerDataService — Central data store for all composer/conversation state.
 *
 * Deobfuscated from Cursor IDE's composerDataService.js (class dy / s0a).
 * Original bundle position: chars 26923738-27443264 in workbench.desktop.main.js
 *
 * This is the largest module (~521KB). It contains:
 *   1. The ComposerDataService class (~55 methods, 29 DI params)
 *   2. ~730 protobuf message classes for the aiserver.v1 API protocol
 *   3. ~30 enum type registrations
 *
 * The service manages:
 *   - Loaded composer conversations and their handles
 *   - Conversation bubbles (messages) — append, delete, insert, load
 *   - Worktree creation and lifecycle
 *   - Background agent composer creation
 *   - Plan references index
 *   - Capability loading (tool former, questionnaires)
 *   - Composer persistence to storage
 *   - Code block state tracking
 *   - Subagent/sub-composer hierarchies
 *
 * Service ID: IComposerDataService (minified: Fa)
 * Registration: registerSingleton(Fa, dy, InstantiationType.Eager, /* singleton */ true)
 */

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CHAT_NAME = "New Chat"; // Qhn

// ============================================================================
// Service ID
// ============================================================================

const IComposerDataService = createDecorator("composerDataService"); // Fa = Bi("composerDataService")

// ============================================================================
// ComposerDataService
// ============================================================================

/**
 * DI Parameter Mapping (29 parameters):
 *
 *  Index | Minified | Service Identifier                                    | Field Name
 *  ------|----------|-------------------------------------------------------|------------------------------------------
 *    0   |   Ji     | IStorageService                                       | _storageService
 *    1   |   Rr     | IWorkspaceContextService                              | _workspaceContextService
 *    2   |   xu     | IReactiveStorageService                               | _reactiveStorageService
 *    3   |   un     | IInstantiationService                                 | _instantiationService
 *    4   |   aie    | IComposerTextModelService                             | composerTextModelService
 *    5   |   RA     | IComposerEventService                                 | _composerEventService
 *    6   |   KZ     | IComposerFileService                                  | _composerFileService
 *    7   |   A0     | IPaneCompositePartService                             | _paneCompositePartService
 *    8   |   yu     | IViewsService                                         | _viewsService
 *    9   |   bp     | IViewDescriptorService                                | _viewDescriptorService
 *   10   |   br     | ICommandService                                       | _commandService
 *   11   |   _c     | IEnvironmentService                                   | _environmentService
 *   12   |   Ett    | IComposerCheckpointStorageService                     | _composerCheckpointStorageService
 *   13   |   $tt    | IComposerMessageStorageService                        | _composerMessageStorageService
 *   14   |   _$e    | IComposerCodeBlockDiffStorageService                  | _composerCodeBlockDiffStorageService
 *   15   |   Whn    | IComposerMessageRequestContextStorageService          | _composerMessageRequestContextStorageService
 *   16   |   Sga    | IComposerCodeBlockPartialInlineDiffFatesStorageService| _composerCodeBlockPartialInlineDiffFatesStorageService
 *   17   |   tx     | IModelConfigService                                  | _modelConfigService
 *   18   |   fE     | IGitContextService                                   | _gitContextService
 *   19   |   ms     | INotificationService                                 | _notificationService
 *   20   |   un     | IInstantiationService (duplicate)                     | instantiationService
 *   21   |   xu     | IReactiveStorageService (duplicate)                   | reactiveStorageService
 *   22   |   Jr     | IFileService                                         | _fileService
 *   23   |   C$e    | IWorktreeManagerService                               | _worktreeManagerService
 *   24   |   Rl     | IExperimentService                                   | _experimentService
 *   25   |   On     | IConfigurationService                                | _configurationService
 *   26   |   sie    | IClientDebugLogService                               | _clientDebugLogService
 *   27   |   Wtt    | IAsyncOperationRegistry                              | _asyncOperationRegistry
 *   28   |   Hhn    | IPatchGraphStorageService                             | _patchGraphStorageService
 *
 * Note: Params 20/21 are duplicates of 3/2 (instantiationService/reactiveStorageService).
 * This is intentional — the duplicates are stored as public fields (without underscore prefix)
 * while the originals are private. Used differently within the class.
 */
class ComposerDataService extends Disposable {

	// Static reference for self-registration pattern
	static { _selfRef = this; }

	// ========================================================================
	// Properties (getters)
	// ========================================================================

	get loadedComposers() {
		return this._ownLoadedComposers;
	}

	get isRefreshingFromDisk() {
		return this._isRefreshingFromDisk;
	}

	get composerDataStorageID() {
		return COMPOSER_DATA_STORAGE_KEY; // TFn
	}

	get selectedComposerIds() {
		return this.allComposersData.selectedComposerIds;
	}

	get selectedComposer() {
		const handle = this.allComposersData.selectedComposerHandles[this.selectedComposerId];
		if (handle) {
			return handle.data;
		}
	}

	get selectedComposerHandle() {
		return this.allComposersData.selectedComposerHandles[this.selectedComposerId];
	}

	// ========================================================================
	// Static action registration
	// ========================================================================

	static registeredActions = [];

	static registerAction(actionFn) {
		this.registeredActions.push(actionFn);
	}

	// ========================================================================
	// Events
	// ========================================================================

	// _onDidChangeLastFocusedComposerId = new Emitter<string>()
	// onDidChangeLastFocusedComposerId = _onDidChangeLastFocusedComposerId.event
	// _onDidChangeComposerWorktree = new Emitter<{ composerId: string; worktreePath: string }>()
	// onDidChangeComposerWorktree = _onDidChangeComposerWorktree.event


	// ========================================================================
	// Constructor
	// ========================================================================

	constructor(
		/* @IStorageService */                                        storageService,
		/* @IWorkspaceContextService */                               workspaceContextService,
		/* @IReactiveStorageService */                                reactiveStorageService,
		/* @IInstantiationService */                                  instantiationService,
		/* @IComposerTextModelService */                              composerTextModelService,
		/* @IComposerEventService */                                  composerEventService,
		/* @IComposerFileService */                                   composerFileService,
		/* @IPaneCompositePartService */                              paneCompositePartService,
		/* @IViewsService */                                         viewsService,
		/* @IViewDescriptorService */                                viewDescriptorService,
		/* @ICommandService */                                       commandService,
		/* @IEnvironmentService */                                   environmentService,
		/* @IComposerCheckpointStorageService */                     composerCheckpointStorageService,
		/* @IComposerMessageStorageService */                        composerMessageStorageService,
		/* @IComposerCodeBlockDiffStorageService */                  composerCodeBlockDiffStorageService,
		/* @IComposerMessageRequestContextStorageService */          composerMessageRequestContextStorageService,
		/* @IComposerCodeBlockPartialInlineDiffFatesStorageService */composerCodeBlockPartialInlineDiffFatesStorageService,
		/* @IModelConfigService */                                   modelConfigService,
		/* @IGitContextService */                                    gitContextService,
		/* @INotificationService */                                  notificationService,
		/* @IInstantiationService (public duplicate) */              instantiationServicePublic,
		/* @IReactiveStorageService (public duplicate) */            reactiveStorageServicePublic,
		/* @IFileService */                                          fileService,
		/* @IWorktreeManagerService */                               worktreeManagerService,
		/* @IExperimentService */                                    experimentService,
		/* @IConfigurationService */                                 configurationService,
		/* @IClientDebugLogService */                                clientDebugLogService,
		/* @IAsyncOperationRegistry */                               asyncOperationRegistry,
		/* @IPatchGraphStorageService */                             patchGraphStorageService,
	) {
		super();

		// Store private service references
		this._storageService = storageService;
		this._workspaceContextService = workspaceContextService;
		this._reactiveStorageService = reactiveStorageService;
		this._instantiationService = instantiationService;
		this.composerTextModelService = composerTextModelService;
		this._composerEventService = composerEventService;
		this._composerFileService = composerFileService;
		this._paneCompositePartService = paneCompositePartService;
		this._viewsService = viewsService;
		this._viewDescriptorService = viewDescriptorService;
		this._commandService = commandService;
		this._environmentService = environmentService;
		this._composerCheckpointStorageService = composerCheckpointStorageService;
		this._composerMessageStorageService = composerMessageStorageService;
		this._composerCodeBlockDiffStorageService = composerCodeBlockDiffStorageService;
		this._composerMessageRequestContextStorageService = composerMessageRequestContextStorageService;
		this._composerCodeBlockPartialInlineDiffFatesStorageService = composerCodeBlockPartialInlineDiffFatesStorageService;
		this._modelConfigService = modelConfigService;
		this._gitContextService = gitContextService;
		this._notificationService = notificationService;
		this.instantiationService = instantiationServicePublic;          // public duplicate
		this.reactiveStorageService = reactiveStorageServicePublic;      // public duplicate
		this._fileService = fileService;
		this._worktreeManagerService = worktreeManagerService;
		this._experimentService = experimentService;
		this._configurationService = configurationService;
		this._clientDebugLogService = clientDebugLogService;
		this._asyncOperationRegistry = asyncOperationRegistry;
		this._patchGraphStorageService = patchGraphStorageService;

		// Instance state initialization
		this._planReferencesIndex = new Map();                          // Map<composerId, Set<referencingComposerId>>
		this._ownLoadedComposers = createLoadedComposersStore();        // C2g() — reactive store of loaded composers
		this._onDidChangeLastFocusedComposerId = this._register(new Emitter());
		this.onDidChangeLastFocusedComposerId = this._onDidChangeLastFocusedComposerId.event;
		this._onDidChangeComposerWorktree = this._register(new Emitter());
		this.onDidChangeComposerWorktree = this._onDidChangeComposerWorktree.event;
		this._isRefreshingFromDisk = false;
		this._pendingBackgroundAgentComposerCreations = new Map();      // Map<backgroundAgentId, Promise<handle>>
		this._composerDisposableMap = new DisposableMap();              // Qm — per-composer disposable stores
		this._worktreeWatchers = new Map();                             // Map<composerId, IDisposable>
		this._loadingCapabilities = new Set();                          // Set<composerId>

		// --- Event listeners ---

		// Track view focus changes → update last focused composer
		this._register(this._viewsService.onDidChangeFocusedView(event => {
			const focusedView = this._viewsService.getFocusedView();
			if (!focusedView) return;
			const composerId = this.getComposerIdFromViewId(focusedView.id);
			if (composerId) {
				this.setLastFocusedComposerId(composerId);
			}
		}));

		// Track view container visibility → update last focused composer
		this._register(this._viewsService.onDidChangeViewContainerVisibility(({ id, visible, location }) => {
			if (!visible || location !== 2 /* ViewContainerLocation.Panel */) return;
			const viewContainer = this._viewDescriptorService.getViewContainerById(id);
			if (!viewContainer) return;
			const composerId = this.getComposerIdFromViewContainer(viewContainer);
			if (composerId) {
				this.setLastFocusedComposerId(composerId);
			}
		}));

		// Track file deletions → clean up newlyCreatedFiles/newlyCreatedFolders
		this._register(this._composerEventService.onNewFileDeleted(async event => {
			const handle = this.getHandleIfLoaded(event.composerId);
			const composerData = handle ? this.getComposerData(handle) : undefined;
			if (!composerData || !handle) return;

			const updatedFiles = composerData.newlyCreatedFiles?.filter(
				file => file.uri.toString() !== event.uri.toString()
			) ?? [];

			let updatedFolders = toArray(composerData.newlyCreatedFolders) ?? [];
			const affectedFolders = updatedFolders.filter(
				folder => event.uri.toString().startsWith(folder.uri.toString())
			);

			for (const folder of affectedFolders) {
				const resolved = await this._composerFileService.resolve({
					uri: folder.uri,
					options: { resolveMetadata: true },
					composerData,
				});
				const childFiles = (resolved.children ?? []).filter(child => !child.isDirectory);
				if (childFiles.length === 0) {
					await this._composerFileService.deleteFolder({
						uri: folder.uri,
						composerData,
						useTrash: true,
					});
					updatedFolders = updatedFolders.filter(
						f => f.uri.toString() !== folder.uri.toString()
					);
				}
			}

			this.updateComposerData(handle, {
				newlyCreatedFiles: updatedFiles,
				newlyCreatedFolders: updatedFolders,
			});
		}));

		// --- Initialize data handle manager ---
		this.composerDataHandleManager = this._register(
			createComposerDataHandleManager(  // vMA
				this._instantiationService,
				this._experimentService,
				this.composerWasLoadedHook.bind(this),
				this.composerWasUnloadedHook.bind(this),
				this._ownLoadedComposers,
			)
		);

		// --- Initialize all-composers reactive store ---
		let initialLoadPromise;
		[
			this.allComposersData,
			this.setAllComposersData,
			this.resetComposers,
			initialLoadPromise,
		] = initializeAllComposersStore(  // TLA
			this._storageService,
			this._reactiveStorageService,
			this._workspaceContextService,
			this._modelConfigService,
			this.composerDataHandleManager,
			this.composerDataStorageID,
			this._environmentService.isGlass === true,
		);

		this._initialComposerDataLoadPromise = initialLoadPromise;
		initialLoadPromise.finally(() => {
			this._initialComposerDataLoadPromise = undefined;
			initialLoadPromise = undefined;
		});

		// Build plan references from stored headers
		this._rebuildPlanReferencesIndexFromHeaders();

		// Create reactive storage root for this service
		this.reactiveStorageRoot = this._register(
			this._reactiveStorageService.createScoped(this)
		);

		// --- Selected composer change tracking ---
		const pendingChanges = [];
		const changeQueue = new ThrottledDelayer(); // foe — async queue

		const processChanges = async () => {
			const now = Date.now();
			await new Promise(resolve => setTimeout(resolve, 0)); // yield
			if (initialLoadPromise) await initialLoadPromise;

			const changes = pendingChanges.splice(0);
			const seen = new Set();
			const toAdd = [];
			const toRemove = [];

			// Deduplicate, keeping last change per composer
			for (const change of changes.reverse()) {
				if (seen.has(change.composerId)) continue;
				seen.add(change.composerId);
				if (change.type === "add") toAdd.push(change.composerId);
				if (change.type === "remove") toRemove.push(change.composerId);
			}

			// Load handles for newly selected composers
			const loadResults = await Promise.all(
				toAdd.map(async composerId => ({
					handle: await this.getComposerHandleById(composerId).catch(() => {}),
					id: composerId,
				}))
			);

			runInBatch(() => {  // Hw — batch reactive updates
				for (const { id, handle } of loadResults) {
					if (handle) {
						this.loadComposerCapabilities(handle);
						this.setAllComposersData("selectedComposerHandles", id, handle);
					} else {
						toRemove.push(id);
						// Clean up orphaned entries
						const entry = this.allComposersData.allComposers.find(c => c.composerId === id);
						if (entry?.subagentInfo?.parentComposerId) {
							this.setAllComposersData("allComposers", list => list.filter(c => c.composerId !== id));
						}
					}
				}

				for (const composerId of toRemove) {
					const existingHandle = this.allComposersData.selectedComposerHandles[composerId];
					if (existingHandle) {
						existingHandle.dispose();
						this.setAllComposersData(produce(draft => {
							delete draft.selectedComposerHandles[composerId];
						}));
					}
				}

				if (toRemove.length > 0) {
					this.setAllComposersData("lastFocusedComposerIds", ids => ids.filter(id => !toRemove.includes(id)));
					this.setAllComposersData("selectedComposerIds", ids => ids.filter(id => !toRemove.includes(id)));
				}
			});
		};

		// Watch selectedComposerIds for changes (unless in Glass mode)
		if (!this._environmentService.isGlass) {
			this.reactiveStorageRoot.onChangeEffect({
				deps: [() => this.allComposersData.selectedComposerIds],
				onChange: async ({ deps, prevDeps }) => {
					const currentIds = deps[0];
					const previousIds = prevDeps?.[0] ?? [];
					currentIds.filter(id => !previousIds.includes(id))
						.forEach(id => pendingChanges.push({ type: "add", composerId: id }));
					previousIds.filter(id => !currentIds.includes(id))
						.forEach(id => pendingChanges.push({ type: "remove", composerId: id }));
					if (pendingChanges.length > 0) {
						changeQueue.queue(processChanges);
					}
				},
				runNowToo: true,
			});
		}

		// Run static registered actions
		for (const actionFn of ComposerDataService.registeredActions) {
			actionFn(this._reactiveStorageService, this);
		}

		// Persist on storage save
		this._register(this._storageService.onWillSaveState(() => {
			this.saveComposers();
		}));
	}


	// ========================================================================
	// View ID / Container helpers
	// ========================================================================

	getComposerIdFromViewId(viewId) {
		const prefix = COMPOSER_VIEW_ID_PREFIX + "."; // OB + "."
		if (viewId.startsWith(prefix)) {
			return viewId.slice(prefix.length);
		}
	}

	getComposerIdFromViewContainer(viewContainer) {
		const views = Registry.as(ViewExtensions.ViewsRegistry).getViews(viewContainer);
		const firstView = views[0];
		if (firstView) {
			return this.getComposerIdFromViewId(firstView.id);
		}
	}

	// ========================================================================
	// Worktree change event
	// ========================================================================

	fireWorktreeChanged(composerId, worktreePath) {
		this._onDidChangeComposerWorktree.fire({ composerId, worktreePath });
	}

	// ========================================================================
	// Background agent composer lookup
	// ========================================================================

	findLoadedComposerIdByBackgroundAgentId(backgroundAgentId) {
		const loadedIds = this.getLoadedComposers();
		for (const composerId of loadedIds) {
			const handle = this.getHandleIfLoaded(composerId);
			const data = handle ? this.getComposerData(handle) : undefined;
			if (data?.createdFromBackgroundAgent?.bcId === backgroundAgentId
				&& data.createdFromBackgroundAgent.shouldStreamMessages) {
				return composerId;
			}
		}
	}

	findComposerIdByBackgroundAgentId(backgroundAgentId) {
		// First check all stored composers (not just loaded ones)
		const stored = this.allComposersData.allComposers.find(
			entry => entry.createdFromBackgroundAgent?.bcId === backgroundAgentId
				&& entry.createdFromBackgroundAgent.shouldStreamMessages
		);
		if (stored) return stored.composerId;

		// Fallback: check loaded composers
		return this.findLoadedComposerIdByBackgroundAgentId(backgroundAgentId);
	}

	// ========================================================================
	// Composer title
	// ========================================================================

	getComposerTitle(composerId) {
		try {
			const handle = this.getHandleIfLoaded(composerId);
			const data = handle ? this.getComposerData(handle) : undefined;

			if (data) {
				return data.name ?? DEFAULT_CHAT_NAME;
			}

			// Fallback: check allComposers store
			const entry = this.allComposersData.allComposers.find(c => c.composerId === composerId);
			if (entry) {
				return entry.name ?? DEFAULT_CHAT_NAME;
			}

			return DEFAULT_CHAT_NAME;
		} catch (error) {
			console.error("[composer] error getting composer title", error);
			return DEFAULT_CHAT_NAME;
		}
	}

	// ========================================================================
	// Best-of-N / subcomposer resolution
	// ========================================================================

	resolveComposerIdToSelected(composerId) {
		const handle = this.getHandleIfLoaded(composerId);
		const data = handle ? this.getComposerData(handle) : undefined;
		if (!data) return composerId;

		if (data.isBestOfNParent && data.selectedSubComposerId) {
			const selectedSubId = data.selectedSubComposerId;
			if (data.subComposerIds?.includes(selectedSubId)) {
				return selectedSubId;
			}
		}
		return composerId;
	}

	// ========================================================================
	// Focus management
	// ========================================================================

	setLastFocusedComposerId(composerId) {
		// Handle draft subtitle for previously focused composer
		const previousId = this.allComposersData.selectedComposerIds[0];
		if (previousId && previousId !== composerId) {
			try {
				const prevHandle = this.getHandleIfLoaded(previousId);
				const prevData = prevHandle ? this.getComposerData(prevHandle) : undefined;
				if (prevHandle && prevData && isComposerDraftCandidate(prevData)) {
					const subtitle = generateDraftSubtitle(prevData);
					this.updateComposerData(prevHandle, { subtitle, isDraft: true });
					this.setAllComposersData("allComposers",
						entry => entry.composerId === previousId,
						{ subtitle, isDraft: true }
					);
				}
			} catch (error) {
				console.error("[composer] error handling draft subtitle:", error);
			}
		}

		// Resolve parent for subagent composers
		const handle = computed(() => this.getHandleIfLoaded(composerId));
		const data = handle ? this.getComposerData(handle) : undefined;
		const effectiveId = (data?.isBestOfNSubcomposer ?? false) && data?.subagentInfo?.parentComposerId
			? data.subagentInfo.parentComposerId
			: composerId;

		// Update focus order — move to front
		this.setAllComposersData("lastFocusedComposerIds", ids => {
			const filtered = ids.filter(id => id !== effectiveId);
			return [effectiveId, ...filtered];
		});
		this.setAllComposersData("selectedComposerIds", ids => {
			const filtered = (ids ?? []).filter(id => id !== effectiveId);
			return [effectiveId, ...filtered];
		});

		this._onDidChangeLastFocusedComposerId.fire(composerId);

		// Clear unread messages
		this.setAllComposersData("allComposers",
			entry => entry.composerId === composerId,
			{ hasUnreadMessages: false }
		);

		// Async clear with small delay to debounce
		setTimeout(async () => {
			try {
				const currentHandle = this.getHandleIfLoaded(composerId);
				if (currentHandle) {
					this.updateComposerData(currentHandle, { hasUnreadMessages: false });
				}
			} catch (error) {
				console.error("[composer] error clearing unread messages", error);
			}
		}, 5);
	}

	// ========================================================================
	// Selected composer ID resolution
	// ========================================================================

	get selectedComposerId() {
		// 1. Try last focused that's also selected
		const fromLastFocused = this.allComposersData.lastFocusedComposerIds.find(
			id => this.selectedComposerIds.includes(id)
		);
		if (fromLastFocused) return fromLastFocused;

		// Clean up stale last-focused entries
		this.setAllComposersData("lastFocusedComposerIds",
			ids => ids.filter(id => this.selectedComposerIds.includes(id))
		);

		// 2. Try last active pane composite
		const lastActivePaneId = this._paneCompositePartService.getLastActivePaneCompositeId(2 /* Panel */);
		if (lastActivePaneId) {
			const container = this._viewDescriptorService.getViewContainerById(lastActivePaneId);
			if (container) {
				const composerId = this.getComposerIdFromViewContainer(container);
				if (composerId && this.selectedComposerIds.includes(composerId)) {
					this.setLastFocusedComposerId(composerId);
					return composerId;
				}
			}
		}

		// 3. First selected
		if (this.allComposersData.selectedComposerIds.length > 0) {
			const firstId = this.allComposersData.selectedComposerIds[0];
			this.setLastFocusedComposerId(firstId);
			return firstId;
		}

		// 4. First from allComposers
		if (this.allComposersData.allComposers.length > 0) {
			const first = this.allComposersData.allComposers[0];
			if (first) {
				this.setAllComposersData("selectedComposerIds", [first.composerId]);
				this.setLastFocusedComposerId(first.composerId);
				return first.composerId;
			}
		}

		// 5. Create new default composer
		console.log("[composer] no composers found, resetting");
		const newComposer = this.resetComposers();
		this.setLastFocusedComposerId(newComposer.composerId);
		return newComposer.composerId;
	}


	// ========================================================================
	// Context window / summary caching
	// ========================================================================

	hasNearbyCachedSummary(handle, targetPercentUsed, tolerance) {
		const data = this.getComposerData(handle);
		if (!data) return false;

		const lastSummaryBubbleId =
			data.latestConversationSummary?.summary?.truncationLastBubbleIdInclusive
			?? data.latestConversationSummary?.lastBubbleId;

		let lastContextStatus;
		for (let i = data.fullConversationHeadersOnly.length - 1; i >= 0; i--) {
			const header = data.fullConversationHeadersOnly[i];
			const bubble = data.conversationMap[header.bubbleId];
			if (!bubble) continue;

			// Stop at summary boundary
			if (lastSummaryBubbleId !== undefined
				&& (header.bubbleId === lastSummaryBubbleId || header.serverBubbleId === lastSummaryBubbleId)) {
				break;
			}

			if (bubble.type === BubbleType.HUMAN && bubble.contextWindowStatusAtCreation) {
				lastContextStatus = bubble.contextWindowStatusAtCreation;
			}

			if (bubble.cachedConversationSummary) {
				const contextStatus = bubble.contextWindowStatusAtCreation || lastContextStatus;
				if (!contextStatus) continue;

				let percentUsed;
				if (contextStatus.tokensUsed !== undefined && contextStatus.tokenLimit !== undefined && contextStatus.tokenLimit > 0) {
					percentUsed = (contextStatus.tokensUsed / contextStatus.tokenLimit) * 100;
				} else if (contextStatus.percentageRemainingFloat !== undefined) {
					percentUsed = 100 - contextStatus.percentageRemainingFloat;
				} else if (contextStatus.percentageRemaining !== undefined) {
					percentUsed = 100 - contextStatus.percentageRemaining;
				}

				if (typeof percentUsed === "number" && Math.abs(targetPercentUsed - percentUsed) <= tolerance) {
					return true;
				}
			}
		}
		return false;
	}

	// ========================================================================
	// Capability loading
	// ========================================================================

	loadComposerCapabilities(handle) {
		const composerId = handle.composerId;
		if (this._loadingCapabilities.has(composerId)) return;

		const data = this.getComposerData(handle);
		if (!data) return;

		this._loadingCapabilities.add(composerId);
		try {
			// If capabilities are already instantiated ComposerCapability objects, just restore
			if (data.capabilities !== undefined
				&& data.capabilities.every(cap => cap instanceof ComposerCapability)
				&& data.capabilities.length > 0) {
				this.restorePendingDecisionsForQuestionnaires(handle);
				return;
			}

			// Otherwise, create capabilities from saved data
			this.updateComposerDataSetStore(handle, setData => {
				const capabilities = createComposerCapabilities(
					this.instantiationService,
					handle.composerId,
					{ savedCapabilityData: data.capabilities },
				);
				setData("capabilities", capabilities);

				setTimeout(() => {
					this.restorePendingDecisionsForQuestionnaires(handle);
				}, 0);
			});
		} finally {
			this._loadingCapabilities.delete(composerId);
		}
	}

	restorePendingDecisionsForQuestionnaires(handle) {
		const data = this.getComposerData(handle);
		if (!data) return;

		const toolFormer = data.capabilities?.find(
			cap => cap instanceof ComposerCapability && cap.type === CapabilityType.TOOL_FORMER
		);
		if (toolFormer) {
			toolFormer.restorePendingDecisionsForUnansweredQuestionnaires();
		}
	}

	// ========================================================================
	// Async data update
	// ========================================================================

	async updateComposerDataAsync(composerId, updater) {
		const env = { stack: [], error: undefined, hasError: false };
		try {
			const handle = addDisposableResource(env, await this.getComposerHandleById(composerId), false);
			if (handle) {
				updater(handle.setData);
			}
		} catch (error) {
			env.error = error;
			env.hasError = true;
		} finally {
			disposeResources(env);
		}
	}

	// ========================================================================
	// Dispose
	// ========================================================================

	dispose() {
		for (const [, watcher] of this._worktreeWatchers) {
			watcher.dispose();
		}
		this._worktreeWatchers.clear();
		super.dispose();
	}

	// ========================================================================
	// Handle access
	// ========================================================================

	getHandleIfLoaded(composerId) {
		return this.composerDataHandleManager.getHandleIfLoaded(composerId);
	}

	getHandleIfLoaded_MIGRATED(composerId) {
		return this.getHandleIfLoaded(composerId);
	}

	getRootHandle(handle) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;

		if (data.isBestOfNSubcomposer === true && data.subagentInfo?.parentComposerId) {
			const parentId = data.subagentInfo.parentComposerId;
			return this.getHandleIfLoaded_MIGRATED(parentId);
		}
		return handle;
	}

	getLoadedSubComposerHandles(handle) {
		const data = this.getComposerData(handle);
		if (!data) return [];

		const subIds = data.subComposerIds ?? [];
		const handles = [];
		for (const subId of subIds) {
			const subHandle = this.getHandleIfLoaded_MIGRATED(subId);
			if (subHandle) handles.push(subHandle);
		}
		return handles;
	}

	async getComposerHandleById(composerId) {
		return await this.composerDataHandleManager.getHandle(composerId);
	}

	whenInitialComposerDataLoaded() {
		return this._initialComposerDataLoadPromise ?? Promise.resolve();
	}


	// ========================================================================
	// Composer lifecycle hooks
	// ========================================================================

	composerWasLoadedHook(composerData) {
		try {
			const entry = this.allComposersData.allComposers.find(c => c.composerId === composerData.composerId);
			const isWorktree = composerData.gitWorktree !== undefined || composerData.worktreeStartedReadOnly === true;

			// Sync worktree status
			if (entry && (entry.isWorktree !== isWorktree || entry.worktreeStartedReadOnly !== composerData.worktreeStartedReadOnly)) {
				this.setAllComposersData("allComposers",
					c => c.composerId === composerData.composerId,
					{ isWorktree, worktreeStartedReadOnly: composerData.worktreeStartedReadOnly }
				);
			}

			// Sync subcomposer count
			const numSub = composerData.subComposerIds?.length;
			if (entry && entry.numSubComposers !== numSub) {
				this.setAllComposersData("allComposers",
					c => c.composerId === composerData.composerId,
					{ numSubComposers: numSub }
				);
			}

			// Sync unified mode
			if (composerData.unifiedMode !== entry?.unifiedMode && composerData.unifiedMode !== undefined) {
				this.setAllComposersData("allComposers",
					c => c.composerId === composerData.composerId,
					{ unifiedMode: composerData.unifiedMode }
				);
			}

			// Sync authored plan
			if (entry && composerData.plan) {
				const content = composerData.plan.content || "";
				const title = extractPlanTitle(content, composerData.plan.name);
				const overview = composerData.plan.overview
					? composerData.plan.overview.replace(/\s+/g, " ").trim().slice(0, 120)
					: "";
				const authoredPlan = { title, overview, composerId: composerData.composerId };
				const existing = entry.authoredPlan;
				if (!existing || existing.title !== authoredPlan.title
					|| existing.overview !== authoredPlan.overview
					|| existing.composerId !== authoredPlan.composerId) {
					this.setAllComposersData("allComposers",
						c => c.composerId === composerData.composerId,
						{ authoredPlan }
					);
				}
			} else if (entry && !composerData.plan && entry.authoredPlan) {
				this.setAllComposersData("allComposers",
					c => c.composerId === composerData.composerId,
					{ authoredPlan: undefined }
				);
			}

			// Sync plan references
			if (entry) {
				const references = [];
				const seen = new Set();

				const addReference = (uriStr) => {
					const uri = URI.from(uriStr);
					if (uri.scheme === Schemas.cursorPlan) {
						const refComposerId = uri.authority;
						if (refComposerId) {
							const key = `composer:${refComposerId}`;
							if (!seen.has(key)) {
								seen.add(key);
								references.push({ type: "composer", composerId: refComposerId });
							}
						}
					} else if (uri.scheme === Schemas.file && uri.path.includes(".cursor/plans/")) {
						const key = `file:${uri.toString()}`;
						if (!seen.has(key)) {
							seen.add(key);
							references.push({ type: "file", uri: uri.toString() });
						}
					}
				};

				// From context file selections
				if (composerData.context?.fileSelections) {
					for (const sel of composerData.context.fileSelections) {
						if (sel.uri) addReference(sel.uri);
					}
				}

				// From conversation bubble contexts
				if (composerData.conversationMap) {
					for (const bubble of Object.values(composerData.conversationMap)) {
						if (bubble.context?.fileSelections) {
							for (const sel of bubble.context.fileSelections) {
								if (sel.uri) addReference(sel.uri);
							}
						}
					}
				}

				const existing = entry.referencedPlans || [];
				const changed = references.length !== existing.length
					|| !references.every((ref, idx) => {
						const ex = existing[idx];
						if (!ex || ref.type !== ex.type) return false;
						return ref.type === "composer"
							? ex.type === "composer" && ref.composerId === ex.composerId
							: ex.type === "file" && ref.uri === ex.uri;
					});

				if (changed) {
					this.setAllComposersData("allComposers",
						c => c.composerId === composerData.composerId,
						{ referencedPlans: references }
					);
					this._updatePlanReferencesIndex(composerData.composerId, references);
				}
			}

			// --- Setup reactive disposable store for this composer ---
			if (!this._composerDisposableMap.has(composerData.composerId)
				|| this._composerDisposableMap.get(composerData.composerId)?.isDisposed === true) {
				this._composerDisposableMap.set(composerData.composerId, new DisposableStore());
			}

			const store = this._composerDisposableMap.get(composerData.composerId);
			if (!store) {
				console.error("[composer] No store found for composer id: " + composerData.composerId);
				return;
			}

			// Reactive effect: sync all mutable composer fields to allComposers store
			store.add(this._reactiveStorageService.onChangeEffectManuallyDisposed({
				deps: [
					() => composerData.composerId,      // 0
					() => composerData.name,             // 1
					() => composerData.lastUpdatedAt,    // 2
					() => composerData.createdAt,        // 3
					() => composerData.unifiedMode,      // 4
					() => composerData.hasUnreadMessages, // 5
					() => composerData.contextUsagePercent, // 6
					() => composerData.hasBlockingPendingActions, // 7
					() => composerData.totalLinesAdded,  // 8
					() => composerData.totalLinesRemoved, // 9
					() => composerData.subtitle,         // 10
					() => composerData.isArchived,       // 11
					() => composerData.isDraft,          // 12
					() => composerData.draftTarget,      // 13
					() => composerData.gitWorktree,      // 14
					() => composerData.worktreeStartedReadOnly, // 15
					() => composerData.isSpec,           // 16
					() => composerData.subagentInfo,     // 17
					() => composerData.createdFromBackgroundAgent, // 18
					() => composerData.plan,             // 19
					() => composerData.conversationMap,  // 20
					() => composerData.context,          // 21
					() => composerData.subComposerIds,   // 22
					() => composerData.filesChangedCount, // 23
					() => composerData.isEphemeral,      // 24
					() => composerData.prUrl,            // 25
					() => composerData.prBranchName,     // 26
					() => composerData.committedToBranch, // 27
					() => composerData.lastMessageSentOnBranch, // 28
					() => composerData.createdOnBranch,  // 29
					() => composerData.activeBranch,     // 30
					() => composerData.branches,         // 31
					() => composerData.isProject,        // 32
					() => composerData.projectIcon,      // 33
				],
				onChange: ({ deps }) => {
					const [
						id, name, lastUpdatedAt, createdAt, unifiedMode, hasUnreadMessages,
						contextUsagePercent, hasBlockingPendingActions, totalLinesAdded, totalLinesRemoved,
						subtitle, _isArchived, isDraft, draftTarget, gitWorktree, worktreeStartedReadOnly,
						isSpec, subagentInfo, createdFromBackgroundAgent, plan, conversationMap, context,
						subComposerIds, filesChangedCount, isEphemeral, prUrl, prBranchName,
						committedToBranch, lastMessageSentOnBranch, createdOnBranch, activeBranch,
						branches, isProject, projectIcon,
					] = deps;

					// Compute authored plan reactively
					let authoredPlan;
					if (plan) {
						authoredPlan = computed(() => {
							const content = plan.content || "";
							const title = extractPlanTitle(content, plan.name);
							const overview = plan.overview
								? plan.overview.replace(/\s+/g, " ").trim().slice(0, 120)
								: "";
							return { title, overview, composerId: id };
						});
					}

					// Compute plan references reactively
					const referencedPlans = computed(() => {
						const seen = new Set();
						const refs = [];
						const addRef = (uriStr) => {
							const uri = URI.from(uriStr);
							if (uri.scheme === Schemas.cursorPlan) {
								const refId = uri.authority;
								if (refId) {
									const key = `composer:${refId}`;
									if (!seen.has(key)) { seen.add(key); refs.push({ type: "composer", composerId: refId }); }
								}
							} else if (uri.scheme === Schemas.file && uri.path.includes(".cursor/plans/")) {
								const key = `file:${uri.toString()}`;
								if (!seen.has(key)) { seen.add(key); refs.push({ type: "file", uri: uri.toString() }); }
							}
						};
						if (context?.fileSelections) {
							for (const sel of context.fileSelections) { if (sel.uri) addRef(sel.uri); }
						}
						if (conversationMap) {
							for (const bubble of Object.values(conversationMap)) {
								computed(() => {
									if (bubble.context?.fileSelections) {
										for (const sel of bubble.context.fileSelections) { if (sel.uri) addRef(sel.uri); }
									}
								});
							}
						}
						return refs;
					});

					this.setAllComposersData("allComposers",
						entry => entry.composerId === id,
						{
							name, lastUpdatedAt, createdAt, unifiedMode, hasUnreadMessages,
							contextUsagePercent, hasBlockingPendingActions,
							totalLinesAdded, totalLinesRemoved, filesChangedCount,
							subtitle, isDraft, draftTarget,
							isWorktree: gitWorktree !== undefined || worktreeStartedReadOnly === true,
							worktreeStartedReadOnly, isSpec, isProject, projectIcon,
							subagentInfo, createdFromBackgroundAgent,
							authoredPlan, referencedPlans,
							numSubComposers: subComposerIds?.length,
							isEphemeral, prUrl, prBranchName,
							committedToBranch, lastMessageSentOnBranch,
							createdOnBranch, activeBranch, branches,
						}
					);
					this._updatePlanReferencesIndex(id, referencedPlans);
				},
			}));

			// Reactive effect: sync composer name to view title
			store.add(this._reactiveStorageService.onChangeEffectManuallyDisposed({
				deps: [() => composerData.name],
				onChange: ({ deps }) => {
					const name = deps[0];
					this._commandService.executeCommand(
						RENAME_COMPOSER_VIEW_COMMAND, // Faa
						composerData.composerId,
						name ?? DEFAULT_CHAT_NAME,
					);
				},
			}));

			// Reactive effect: sync composer status to view badge
			store.add(this._reactiveStorageService.onChangeEffectManuallyDisposed({
				deps: [() => composerData.status],
				onChange: ({ deps }) => {
					const status = deps[0];
					this._commandService.executeCommand(
						UPDATE_COMPOSER_STATUS_COMMAND, // Oaa
						composerData.composerId,
						status,
					);

					// Error reporting: composer status reset to "none" with existing content
					if (status === "none") {
						const messageCount = computed(() => composerData.fullConversationHeadersOnly?.length ?? 0);
						if (messageCount > 0) {
							const hasName = computed(() => !!composerData.name);
							const nameLength = computed(() => composerData.name?.length ?? 0);
							const isBackgroundComposer = computed(() => !!composerData.createdFromBackgroundAgent?.bcId);
							const isPendingBackgroundAgent = computed(() => !!composerData.pendingBackgroundAgent);
							const isBackgroundFlow = isBackgroundComposer || isPendingBackgroundAgent;
							const stackTrace = new Error().stack;

							reportError(new Error("Composer status set to none with existing content"), {
								tags: {
									client_error_type: "composer_status_reset_to_none",
									is_background_composer: isBackgroundComposer,
									is_pending_background_agent: isPendingBackgroundAgent,
									is_background_flow: isBackgroundFlow,
								},
								extra: {
									composerId: composerData.composerId,
									messageCount,
									hasName,
									nameLength,
									isBackgroundComposer,
									isPendingBackgroundAgent,
									createdAt: computed(() => composerData.createdAt),
									lastUpdatedAt: computed(() => composerData.lastUpdatedAt),
									stackTrace,
								},
							});
						}
					}
				},
			}));

			// Fire loaded event
			this._composerEventService.fireDidLoadComposer({ composerId: composerData.composerId });

		} catch (error) {
			console.error("[composer] Error loading composer data:", error);
		}
	}

	composerWasUnloadedHook(composerId) {
		this._composerDisposableMap.deleteAndDispose(composerId);
		this._asyncOperationRegistry.clear(composerId);
	}


	// ========================================================================
	// Agent reference API
	// ========================================================================

	async getAgentReferenceByComposerId(composerId) {
		const handle = await this.getComposerHandleById(composerId);
		if (!handle) throw new Error(`Composer not found: ${composerId}`);

		const blobStorage = new ComposerBlobStorage(this._storageService, composerId);
		const blobStore = {
			getBlob: async (key, blobId) => {
				const blob = await blobStorage.getBlob(key, blobId);
				if (blob === undefined) throw new Error(`Blob not found: ${blobId}`);
				return blob;
			},
			hasBlobLoaded: (key) => true,
		};

		// Conversation state observable
		const conversationStateListeners = new Set();
		const getConversationState = () => computed(() => handle.data.conversationState) ?? new ConversationState();
		const conversationStateStructure = {
			get value() { return getConversationState(); },
			onChange: (listener) => {
				conversationStateListeners.add(listener);
				return { dispose: () => { conversationStateListeners.delete(listener); } };
			},
		};

		// Pending decisions observable
		const decisionListeners = new Set();
		const getPendingDecisions = () => {
			const toolFormer = computed(() => this.getToolFormer(handle));
			if (!toolFormer) return [];
			return computed(() => toolFormer.getPendingUserDecisionGroup()()).map(decision => {
				if (decision.clientSideTool === ToolType.ASK_QUESTION) {
					const question = toolFormer.getBubbleData(
						toolFormer.getBubbleIdByToolCallId(decision.toolCallId) ?? ""
					)?.params?.questions?.[0]?.prompt ?? "";
					return { type: "ask_question", toolCallId: decision.toolCallId, question };
				}
				return { type: "edit_tool", toolCallId: decision.toolCallId };
			});
		};
		const pendingDecisions = {
			get value() { return getPendingDecisions(); },
			onChange: (listener) => {
				decisionListeners.add(listener);
				return { dispose: () => { decisionListeners.delete(listener); } };
			},
		};

		// Interaction updates
		const internalEmitter = new Emitter();
		const interactionUpdates = {
			addListener: (listener) => {
				const composerSub = this._instantiationService.invokeFunction(
					accessor => accessor.get(IComposerInteractionService)
				).getInteractionUpdatesEvent(composerId)(updates => {
					for (const update of updates) listener(update);
				});
				const internalSub = internalEmitter.event(updates => {
					for (const update of updates) listener(update);
				});
				return { dispose: () => { composerSub.dispose(); internalSub.dispose(); } };
			},
		};

		return {
			conversationStateStructure,
			blobStore,
			interactionUpdates,
			pendingDecisions,
			submitMessage: async (opts, context, messageText) => {
				const messageId = generateUUID();
				const update = new ComposerStreamUpdate({
					message: {
						case: "userMessageAppended",
						value: new UserMessageAppended({
							userMessage: new UserMessage({ text: messageText, messageId }),
						}),
					},
				});
				internalEmitter.fire([update]);
				await this._instantiationService.invokeFunction(
					accessor => accessor.get(IComposerChatService)
				).submitChatMaybeAbortCurrent(composerId, messageText, { forceBubbleId: messageId });
			},
		};
	}

	// ========================================================================
	// Background agent composer creation
	// ========================================================================

	async getOrCreateHandleForBackgroundAgent(backgroundAgentId, options) {
		// 1. Check if composer already exists for this agent
		const existingId = this.findComposerIdByBackgroundAgentId(backgroundAgentId);
		if (existingId) {
			return await this.getComposerHandleById(existingId);
		}

		// 2. Check pending creations (dedup)
		const pending = this._pendingBackgroundAgentComposerCreations.get(backgroundAgentId);
		if (pending) return await pending;

		// 3. Create new composer
		const createPromise = (async () => {
			try {
				const composerService = await this._instantiationService.invokeFunction(
					accessor => accessor.get(IComposerService)
				);
				const newComposer = await composerService.createComposer({
					skipSelect: true,
					partialState: {
						createdFromBackgroundAgent: {
							bcId: backgroundAgentId,
							shouldStreamMessages: options?.shouldStreamMessages ?? true,
						},
					},
				});
				if (!newComposer?.composerId) return undefined;

				// Ensure it's selected
				const currentIds = this.selectedComposerIds;
				if (!currentIds.includes(newComposer.composerId)) {
					this.setAllComposersData("selectedComposerIds", [...currentIds, newComposer.composerId]);
				}

				return await this.getComposerHandleById(newComposer.composerId);
			} finally {
				this._pendingBackgroundAgentComposerCreations.delete(backgroundAgentId);
			}
		})();

		this._pendingBackgroundAgentComposerCreations.set(backgroundAgentId, createPromise);
		return await createPromise;
	}

	// ========================================================================
	// Data update helpers
	// ========================================================================

	updateSelectedComposer(update) {
		const handle = this.selectedComposerHandle;
		if (handle) {
			handle.setData(update);
		}
	}

	updateComposerDataSetStore(handle, updater) {
		updater(handle.setData);
	}

	updateComposerData(handle, update) {
		handle.setData(prev => ({ ...prev, ...update }));
	}

	// ========================================================================
	// Persistence
	// ========================================================================

	async saveComposers() {
		const openViewIds = await this._commandService.executeCommand(GET_OPEN_COMPOSER_VIEW_IDS_COMMAND) || [];

		const isSubagentOrTask = (composerId) => {
			const data = this.getComposerDataIfLoaded(composerId)
				?? this.allComposersData.allComposers.find(c => c.composerId === composerId);
			if (!data || data.isBestOfNSubcomposer) return false;
			return !!(data.composerId.startsWith("task-") || data.subagentInfo?.parentComposerId);
		};

		const filteredSelectedIds = openViewIds.filter(id => !isSubagentOrTask(id));

		let lastFocused = this.allComposersData.lastFocusedComposerIds.filter(id => !isSubagentOrTask(id));
		if (lastFocused.length === 0 && filteredSelectedIds.length > 0) {
			lastFocused = [filteredSelectedIds[0]];
		}

		const dataToSave = {
			allComposers: this.allComposersData.allComposers,
			selectedComposerIds: filteredSelectedIds,
			lastFocusedComposerIds: lastFocused,
			hasMigratedComposerData: this.allComposersData.hasMigratedComposerData,
			hasMigratedMultipleComposers: this.allComposersData.hasMigratedMultipleComposers,
		};

		const serialized = JSON.stringify(dataToSave);
		this._storageService.store(this.composerDataStorageID, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
	}


	// ========================================================================
	// Composer CRUD
	// ========================================================================

	async appendComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING(composerData) {
		if (this.allComposersData.allComposers.find(c => c.composerId === composerData.composerId)) {
			console.error(`[composer] appendComposer called with existing composerId ${composerData.composerId}`);
			reportError(new Error("appendComposer called with existing composerId"), {
				tags: { client_error_type: "appendComposer_duplicate" },
				extra: { composerId: composerData.composerId },
			});
			return;
		}
		const summary = createComposerSummary(composerData);
		this.setAllComposersData("allComposers", list => [summary, ...list]);

		if (this.allComposersData.selectedComposerIds.length === 0) {
			this.setAllComposersData("selectedComposerIds", [composerData.composerId]);
		}

		await this.composerDataHandleManager.persistLoadedComposer(composerData);
		await this.saveComposers();
		this.composerDataHandleManager.pushComposer(composerData);
		return this.getHandleIfLoaded(composerData.composerId);
	}

	async appendSubComposer(composerData) {
		if (this.allComposersData.allComposers.find(c => c.composerId === composerData.composerId)) {
			console.error(`[composer] appendSubComposer called with existing composerId ${composerData.composerId}`);
			reportError(new Error("appendSubComposer called with existing composerId"), {
				tags: { client_error_type: "appendSubComposer_duplicate" },
				extra: { composerId: composerData.composerId },
			});
			return;
		}
		const summary = createComposerSummary(composerData);
		this.setAllComposersData("allComposers", list => [summary, ...list]);
		await this.composerDataHandleManager.persistLoadedComposer(composerData);
		await this.saveComposers();
		this.composerDataHandleManager.pushComposer(composerData);
		return this.getHandleIfLoaded(composerData.composerId);
	}

	async ensureSubagentPersistedForStandaloneOpen(composerData) {
		const composerId = composerData.composerId;
		const existing = this.allComposersData.allComposers.find(c => c.composerId === composerId);
		if (existing) {
			if (!existing.name && composerData.name) {
				this.setAllComposersData("allComposers", c => c.composerId === composerId, { name: composerData.name });
			}
		} else {
			const summary = createComposerSummary(composerData);
			this.setAllComposersData("allComposers", list => [summary, ...list]);
		}
		this.composerDataHandleManager.pushComposer(composerData);
		await this.composerDataHandleManager.persistLoadedComposer(composerData);
	}

	unlistComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING(composerId) {
		this.setAllComposersData("allComposers", list => list.filter(c => c.composerId !== composerId));
		if (this.allComposersData.selectedComposerIds.includes(composerId)) {
			this.setAllComposersData("selectedComposerIds", ids => ids.filter(id => id !== composerId));
		}
	}

	async deleteComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING(composerId, isSubComposerDeletion) {
		const handle = this.getHandleIfLoaded(composerId);
		const data = handle ? this.getComposerData(handle) : undefined;
		const subIds = data?.subComposerIds || [];

		// Handle best-of-N subcomposer deletion
		if (handle && data?.isBestOfNSubcomposer) {
			const rootHandle = this.getRootHandle(handle);
			if (rootHandle && rootHandle !== handle) {
				const rootData = this.getComposerData(rootHandle);
				const remainingSubs = (rootData?.subComposerIds || []).filter(id => id !== composerId);
				this.updateComposerDataSetStore(rootHandle, setData => setData("subComposerIds", remainingSubs));
				if (rootData?.selectedSubComposerId === composerId) {
					const newSelected = remainingSubs.length > 0 ? remainingSubs[0] : rootHandle.composerId;
					this.updateComposerDataSetStore(rootHandle, setData => setData("selectedSubComposerId", newSelected));
				}
			}
		}

		// Stop running composers before deletion
		const composerService = this.instantiationService.invokeFunction(accessor => accessor.get(IComposerService));
		try {
			if (data?.status === "generating") {
				console.log(`[composer] Stopping composer ${composerId} before deletion`);
				composerService.cancelChat(composerId);
			}
		} catch (error) {
			console.info("[composer] Error stopping composer before deletion (continuing):", error);
		}

		// Stop sub-composers
		for (const subId of subIds) {
			try {
				const subHandle = this.getHandleIfLoaded(subId);
				const subData = subHandle ? this.getComposerData(subHandle) : undefined;
				if (subData?.status === "generating") {
					console.log(`[composer] Stopping subcomposer ${subId} before deletion`);
					composerService.cancelChat(subId);
				}
			} catch (error) {
				console.info(`[composer] Error stopping subcomposer ${subId} before deletion (continuing):`, error);
			}
		}

		// Archive linked background composer
		try {
			const bgAgentId = data?.createdFromBackgroundAgent?.bcId;
			if (bgAgentId && data?.createdFromBackgroundAgent?.shouldStreamMessages) {
				this.instantiationService.invokeFunction(
					accessor => accessor.get(IBackgroundAgentService)
				).archiveBackgroundComposer(bgAgentId);
			}
		} catch (error) {
			console.info("[composer] Error archiving linked background composer (continuing):", error);
		}

		// Remove worktree
		try {
			const worktreePath = data?.gitWorktree?.worktreePath;
			if (worktreePath) {
				const currentHandle = this.getHandleIfLoaded(composerId);
				if (currentHandle) {
					this.updateComposerDataSetStore(currentHandle, setData => setData("gitWorktree", undefined));
				}
				this._stopWorktreeWatcher(composerId);
				// Async cleanup
				(async () => {
					try {
						await this._worktreeManagerService.removeWorktree(worktreePath);
					} catch (err) {
						console.info("[composer] Async worktree cleanup failed (continuing):", err);
					}
				})();
			}
		} catch (error) {
			console.info("[composer] Error scheduling worktree cleanup (continuing with delete):", error);
		}

		// Remove from allComposers list
		this.unlistComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING(composerId);

		// Clear all associated storage
		await Promise.all([
			this._composerCheckpointStorageService.clearComposerCheckpoints(composerId),
			this._composerCodeBlockDiffStorageService.clearComposerDiffs(composerId),
			this._composerMessageStorageService.clearComposerMessages(composerId),
			this._composerMessageRequestContextStorageService.clearComposerContexts(composerId),
			this._composerCodeBlockPartialInlineDiffFatesStorageService.clearComposerPartialInlineDiffFates(composerId),
			this._patchGraphStorageService.clearPatchesForComposer(composerId),
			this.composerDataHandleManager.deleteComposer(composerId),
		]);

		// Recursively delete sub-composers
		for (const subId of subIds) {
			await this.deleteComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING(subId, true);
		}
	}


	// ========================================================================
	// Worktree management
	// ========================================================================

	async removeComposerWorktreeIfPresent(composerId, visited) {
		const seen = visited ?? new Set();
		if (seen.has(composerId)) return;
		seen.add(composerId);

		let handle;
		try {
			handle = this.getHandleIfLoaded(composerId);
			let data = handle ? this.getComposerData(handle) : undefined;

			if (!data) {
				handle = await this.getComposerHandleById(composerId);
				data = handle ? this.getComposerData(handle) : undefined;
			}

			if (!data) {
				console.info(`[composer] No composer data found for ${composerId};`);
				return;
			}

			const worktreePath = data.gitWorktree?.worktreePath;
			if (!worktreePath) return;

			try {
				await this._gitContextService?.waitForGitContextProvider();
				if (this._gitContextService?.hasGitContextProvider()) {
					await this._gitContextService.removeWorktree(worktreePath);
					console.info(`[composer] Removed git worktree: ${worktreePath}`);
				} else {
					console.info(`[composer] Git provider not registered; skipping git worktree removal for ${worktreePath}`);
				}
			} catch (error) {
				console.info(`[composer] Error removing git worktree ${worktreePath}`, error);
			}
		} finally {
			if (handle && !handle.isDisposed) {
				this.updateComposerDataSetStore(handle, setData => setData("gitWorktree", undefined));
			}
			this._stopWorktreeWatcher(composerId);
			handle?.dispose();
		}
	}

	async createWorktree(handle, branchOptions, baseBranch, targetPath, excludeDirtyFiles) {
		const composerId = handle.composerId;
		try {
			this.updateComposerDataSetStore(handle, setData => setData("isCreatingWorktree", true));

			// Reset code block state for clean worktree
			this.updateComposerDataSetStore(handle, setData => {
				setData("codeBlockData", {});
				setData("originalFileStates", {});
				setData("newlyCreatedFiles", []);
				setData("newlyCreatedFolders", []);
			});

			const result = await this._worktreeManagerService.createWorktree(
				{ composerId, baseBranch, targetWorktreePath: targetPath, excludeDirtyFiles },
				branchOptions,
			);

			if (result) {
				const mainWorktreePath = await this._resolveMainWorktreePath();
				const worktreeInfo = {
					worktreePath: result.path,
					commitHash: result.commitHash,
					branchName: result.branchName,
					mainWorktreePath,
				};

				this.updateComposerDataSetStore(handle, setData => setData("gitWorktree", worktreeInfo));
				this._startWorktreeWatcher(composerId, worktreeInfo.worktreePath);
				this._onDidChangeComposerWorktree.fire({ composerId, worktreePath: worktreeInfo.worktreePath });

				// Generate branch name asynchronously
				this._generateAndSetWorktreeBranch(handle, result.path).catch(error => {
					console.error("[composer] Failed to generate and set worktree branch", error);
				});

				return worktreeInfo;
			}
		} catch (error) {
			console.error("[composer] Error creating worktree", error);
			this._notificationService?.notify?.({
				message: `Failed to create Git worktree: ${toErrorMessage(error)}`,
				severity: Severity.Error,
			});
		} finally {
			if (!handle.isDisposed) {
				this.updateComposerDataSetStore(handle, setData => setData("isCreatingWorktree", false));
				if (baseBranch) {
					this.updateComposerDataSetStore(handle, setData => setData("pendingCreateWorktreeBaseBranchName", undefined));
				}
			}
		}
	}

	async _resolveMainWorktreePath() {
		const folders = this._workspaceContextService.getWorkspace().folders;
		if (folders.length === 0) return undefined;
		const rootPath = folders[0].uri.fsPath;
		if (rootPath.length === 0) return undefined;
		try {
			return await this._gitContextService.getGitRoot(rootPath) ?? rootPath;
		} catch {
			return rootPath;
		}
	}

	_startWorktreeWatcher(composerId, worktreePath) {
		this._stopWorktreeWatcher(composerId);
		const uri = URI.file(worktreePath);
		const options = { recursive: true, excludes: [] };
		const watcher = this._fileService.watch(uri, options);
		this._worktreeWatchers.set(composerId, watcher);

		if (isCorrelatedFileWatcher(watcher) && watcher.onDidChange) {
			watcher.onDidChange(changes => {
				this._composerEventService.fireDidFilesChange(changes);
			});
		}
	}

	_stopWorktreeWatcher(composerId) {
		const watcher = this._worktreeWatchers.get(composerId);
		if (watcher) {
			try { watcher.dispose(); } catch { /* ignore */ }
			this._worktreeWatchers.delete(composerId);
		}
	}

	async _generateAndSetWorktreeBranch(handle, worktreePath) {
		try {
			const composerId = handle.composerId;
			const { IComposerService } = await import("./composerService.js");
			const branchName = await this._instantiationService.invokeFunction(
				accessor => accessor.get(IComposerService)
			).generateBranchNameForWorktree(composerId);

			if (!branchName) {
				console.warn("[composer] Failed to generate branch name for worktree");
				return;
			}

			await this._worktreeManagerService.updateWorktreeBranchName(worktreePath, branchName);

			if (!handle.isDisposed) {
				this.updateComposerDataSetStore(handle, setData => {
					setData("gitWorktree", existing => existing && { ...existing, branchName });
				});
			}

			console.log(`[composer] Generated branch name ${branchName} for worktree`);
		} catch (error) {
			console.error("[composer] Error generating and setting worktree branch:", error);
		}
	}

	// ========================================================================
	// Root composer / hierarchy
	// ========================================================================

	getRootComposerId(composerId) {
		return this._getRootComposerIdRecursive(composerId, new Set(), 0);
	}

	_getRootComposerIdRecursive(composerId, visited, depth) {
		if (depth > 10) {
			console.warn("[ComposerDataService] Maximum subagent hierarchy depth exceeded, returning current composer ID");
			return composerId;
		}
		if (visited.has(composerId)) {
			console.warn("[ComposerDataService] Circular reference detected in subagent hierarchy, returning current composer ID");
			return composerId;
		}
		visited.add(composerId);

		const handle = this.getHandleIfLoaded(composerId);
		const data = handle ? this.getComposerData(handle) : undefined;

		if (data?.subagentInfo?.parentComposerId) {
			return this._getRootComposerIdRecursive(data.subagentInfo.parentComposerId, visited, depth + 1);
		}
		return composerId;
	}


	// ========================================================================
	// Data access
	// ========================================================================

	getComposerData(handle) {
		try { return handle.data; } catch { return undefined; }
	}

	getComposerDataIfLoaded(composerId) {
		const handle = this.getHandleIfLoaded(composerId);
		if (handle) return handle.data;
	}

	// ========================================================================
	// Code block queries
	// ========================================================================

	getAllCachedCodeBlocks(handle) {
		const data = this.getComposerData(handle);
		if (!data) throw Error("[composer] composer doesn't exist");

		const { codeBlockData } = data;
		const result = [];
		for (const fileUri of Object.keys(codeBlockData)) {
			const blocks = codeBlockData[fileUri];
			for (const blockId of Object.keys(blocks)) {
				result.push(blocks[blockId]);
			}
		}
		return result.filter(({ isCached }) => isCached === true);
	}

	updateCodeBlockLastAppliedAt(handle, fileUri, blockId) {
		if (!this.getComposerData(handle)) return;
		const uriStr = fileUri.toString();
		this.updateComposerDataSetStore(handle, setData =>
			setData("codeBlockData", uriStr, blockId, "lastAppliedAt", Date.now())
		);
	}

	// ========================================================================
	// Running state queries
	// ========================================================================

	isRunningCapabilities(handle) {
		const data = this.getComposerData(handle);
		if (!data) return false;
		for (const cap of data.capabilities) {
			if (cap.isRunning()) return true;
		}
		return false;
	}

	isComposerRunning(handle) {
		const data = this.getComposerData(handle);
		if (!data) return false;
		if (data.status === "generating") return true;

		// Also check if any code blocks are being applied
		return Object.values(data.codeBlockData ?? {}).some(fileBlocks =>
			Object.values(fileBlocks).some(block =>
				block.status === "applying" && !block.isNotApplied
			)
		);
	}

	getOldestNonRunningSelectedComposerId(excludeId) {
		const selected = this.selectedComposerIds;
		if (selected.length === 0) return undefined;

		const nonRunning = selected.filter(id => {
			if (excludeId && id === excludeId) return false;
			const handle = this.getHandleIfLoaded(id);
			return !(handle && this.isComposerRunning(handle));
		});

		if (nonRunning.length === 0) return undefined;

		// Prefer least-recently-focused
		const leastRecent = this.allComposersData.lastFocusedComposerIds.filter(
			id => nonRunning.includes(id)
		);
		return leastRecent.length > 0 ? leastRecent[leastRecent.length - 1] : nonRunning[0];
	}

	// ========================================================================
	// Tool former / decisions
	// ========================================================================

	getToolFormer(handle) {
		return this.getComposerCapability(handle, CapabilityType.TOOL_FORMER);
	}

	getPendingUserDecisionGroup(handle) {
		const toolFormer = this.getToolFormer(handle);
		return toolFormer ? toolFormer.getPendingUserDecisionGroup()() : [];
	}

	getIsBlockingUserDecision(handle) {
		const toolFormer = this.getToolFormer(handle);
		return toolFormer ? toolFormer.getIsBlockingUserDecision()() : false;
	}

	getBlockingUserDecisionToolType(handle) {
		const toolFormer = this.getToolFormer(handle);
		if (!toolFormer) return undefined;
		const decisions = toolFormer.getPendingUserDecisionGroup()();
		if (decisions.length === 0) return undefined;
		return decisions[0].clientSideTool;
	}

	setLoadingToolFormerToolsToCancelled(handle) {
		const toolFormer = this.getToolFormer(handle);
		if (toolFormer) toolFormer.setLoadingToolsToCancelled();
	}

	setPendingToolFormerToolsToCancelled(handle) {
		const toolFormer = this.getToolFormer(handle);
		if (toolFormer) toolFormer.setPendingToolsToCancelled();
	}

	getComposerCapability(handle, capabilityType) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;

		return computed(() => {
			let cap = data.capabilities.find(c => c.type === capabilityType);
			if ((!cap || !(cap instanceof ComposerCapability))) {
				this.loadComposerCapabilities(handle);
				cap = data.capabilities.find(c => c.type === capabilityType);
				if (!cap || !(cap instanceof ComposerCapability)) return undefined;
			}
			return cap;
		});
	}

	// ========================================================================
	// Conversation access
	// ========================================================================

	getLoadedConversation(handle) {
		const data = this.getComposerData(handle);
		if (!data) return [];

		const { conversationMap, fullConversationHeadersOnly: headers } = data;
		const headerCount = headers.length;

		return computed(() => {
			const loaded = [];
			for (let i = headers.length - 1; i >= 0; i--) {
				const header = headers[i];
				const bubble = conversationMap[header.bubbleId];
				if (bubble) loaded.push(bubble);
				else break; // stop at first unloaded bubble
			}
			return loaded.reverse();
		});
	}

	getLoadedConversationById(composerId) {
		const data = computed(() => this.loadedComposers.byId[composerId]);
		if (!data) return [];

		const { conversationMap, fullConversationHeadersOnly: headers } = data;
		const headerCount = headers.length;

		return computed(() => {
			const loaded = [];
			for (let i = headers.length - 1; i >= 0; i--) {
				const header = headers[i];
				const bubble = conversationMap[header.bubbleId];
				if (bubble) loaded.push(bubble);
				else break;
			}
			return loaded.reverse();
		});
	}

	// ========================================================================
	// Bubble operations
	// ========================================================================

	unloadComposerBubblesBeforeBubble(handle, bubbleId) {
		const data = this.getComposerData(handle);
		if (!data) return;

		const index = data.fullConversationHeadersOnly.findIndex(h => h.bubbleId === bubbleId);
		if (index <= 0) return;

		const toUnload = data.fullConversationHeadersOnly.slice(0, index)
			.map(h => h.bubbleId)
			.filter(id => data.conversationMap[id] !== undefined);

		if (toUnload.length === 0) return;

		this.updateComposerDataSetStore(handle, setData => {
			runInBatch(() => {
				for (const id of toUnload) {
					setData("conversationMap", id, undefined);
				}
			});
		});
	}

	async deleteComposerBubbles(handle, bubbleIds) {
		// Remove from headers
		this.updateComposerDataSetStore(handle, setData =>
			setData("fullConversationHeadersOnly", headers =>
				headers.filter(h => !bubbleIds.includes(h.bubbleId))
			)
		);

		// Remove from conversation map
		for (const bubbleId of bubbleIds) {
			this.updateComposerDataSetStore(handle, setData =>
				setData("conversationMap", bubbleId, undefined)
			);
		}

		// Remove from storage
		await Promise.all(
			bubbleIds.map(id => this._composerMessageStorageService.deleteMessage(handle.composerId, id))
		);
	}

	async appendComposerBubbles(handle, bubbles) {
		const data = computed(() => this.getComposerData(handle));
		if (!data) return;

		// Add to conversation map
		this.updateComposerDataSetStore(handle, setData => {
			runInBatch(() => {
				for (const bubble of bubbles) {
					setData("conversationMap", bubble.bubbleId, bubble);
				}
			});
		});

		// Add to headers
		this.updateComposerDataSetStore(handle, setData => {
			runInBatch(() => {
				let insertIdx = data.fullConversationHeadersOnly.length;
				for (const bubble of bubbles) {
					setData("fullConversationHeadersOnly", insertIdx, {
						bubbleId: bubble.bubbleId,
						type: bubble.type,
						serverBubbleId: bubble.serverBubbleId,
					});
					insertIdx++;
				}
			});
		});

		// Persist to storage (with background agent filtering)
		const composerId = handle.composerId;
		let toStore = bubbles;

		if (data.createdFromBackgroundAgent?.shouldStreamMessages) {
			if (data.createdFromBackgroundAgent.bcId === SENTINEL_BACKGROUND_ID) {
				toStore = [];
			} else {
				const kickoffMessageId = data.agentSessionId !== undefined
					? data.createdFromBackgroundAgent.kickoffMessageId
					: undefined;

				if (kickoffMessageId !== undefined) {
					toStore = bubbles.filter(b =>
						(b.serverBubbleId !== undefined && b.serverBubbleId.length > 0)
						? true
						: b.bubbleId === kickoffMessageId
					);
				} else {
					toStore = bubbles.filter(b =>
						b.serverBubbleId !== undefined && b.serverBubbleId.length > 0
					);
				}
			}
		}

		if (toStore.length > 0) {
			await Promise.all(
				toStore.map(b => this._composerMessageStorageService.storeMessage(composerId, b))
			);
		}
	}

	async insertComposerBubblesAtIndex(handle, bubbles, insertIndex) {
		// Insert into headers at position
		this.updateComposerDataSetStore(handle, setData =>
			setData("fullConversationHeadersOnly", headers => {
				const idx = Math.max(0, Math.min(insertIndex, headers.length));
				const before = headers.slice(0, idx);
				const after = headers.slice(idx);
				return [
					...before,
					...bubbles.map(b => ({ bubbleId: b.bubbleId, type: b.type, serverBubbleId: b.serverBubbleId })),
					...after,
				];
			})
		);

		// Add to conversation map
		for (const bubble of bubbles) {
			this.updateComposerDataSetStore(handle, setData =>
				setData("conversationMap", bubble.bubbleId, bubble)
			);
		}

		// Persist
		await Promise.all(
			bubbles.map(b => this._composerMessageStorageService.storeMessage(handle.composerId, b))
		);
	}

	getComposerBubbleIndex(handle, bubbleId) {
		const data = this.getComposerData(handle);
		if (!data) return -1;
		return computed(() => data.fullConversationHeadersOnly.findIndex(h => h.bubbleId === bubbleId));
	}

	getComposerBubble(handle, bubbleId) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		return data.conversationMap[bubbleId];
	}

	getComposerBubbleUntracked(handle, bubbleId) {
		return computed(() => {
			const data = this.getComposerData(handle);
			if (data) return data.conversationMap[bubbleId];
		});
	}

	getComposerBubbleAsync(handle, bubbleId) {
		const bubble = this.getComposerBubble(handle, bubbleId);
		if (bubble) return Promise.resolve(bubble);
		return this._composerMessageStorageService.retrieveMessage(handle.composerId, bubbleId);
	}

	updateComposerBubbleSetStore(handle, bubbleId, updater) {
		this.updateComposerDataSetStore(handle, setData => {
			updater((...args) => setData("conversationMap", bubbleId, ...args));
		});
	}

	async updateComposerBubbleCheckpoint(handle, bubbleId, checkpointData, options) {
		if (!checkpointData) return;

		const composerId = handle.composerId;
		const existingCheckpointId = this.getComposerBubble(handle, bubbleId)?.checkpointId;
		const existingAfterCheckpointId = this.getComposerBubble(handle, bubbleId)?.afterCheckpointId;

		if (existingCheckpointId && !options.isAfterCheckpoint) {
			this._composerCheckpointStorageService.updateCheckpoint(composerId, existingCheckpointId, existing => {
				Object.assign(existing, checkpointData);
			});
		} else if (existingAfterCheckpointId && options.isAfterCheckpoint) {
			this._composerCheckpointStorageService.updateCheckpoint(composerId, existingAfterCheckpointId, existing => {
				Object.assign(existing, checkpointData);
			});
		} else {
			const newCheckpointId = await this._composerCheckpointStorageService.storeCheckpoint(composerId, checkpointData);
			this.updateComposerDataSetStore(handle, setData =>
				setData("conversationMap", bubbleId, bubble =>
					options.isAfterCheckpoint
						? { ...bubble, afterCheckpointId: newCheckpointId }
						: { ...bubble, checkpointId: newCheckpointId }
				)
			);
		}
	}

	updateComposerBubble(handle, bubbleId, update) {
		this.updateComposerDataSetStore(handle, setData =>
			setData("conversationMap", bubbleId, existing => ({ ...existing, ...update }))
		);
	}


	// ========================================================================
	// Last bubble queries
	// ========================================================================

	getLastHumanBubble(handle) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		const _headerCount = data.fullConversationHeadersOnly.length;
		const lastHumanId = computed(() => {
			for (let i = data.fullConversationHeadersOnly.length - 1; i >= 0; i--) {
				if (data.fullConversationHeadersOnly[i].type === BubbleType.HUMAN) {
					return data.fullConversationHeadersOnly[i].bubbleId;
				}
			}
		});
		if (lastHumanId) return data.conversationMap[lastHumanId];
	}

	getLastAiBubble(handle, options) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		const _headerCount = data.fullConversationHeadersOnly.length;
		const lastAiId = computed(() => {
			for (let i = data.fullConversationHeadersOnly.length - 1; i >= 0; i--) {
				if (data.fullConversationHeadersOnly[i].type === BubbleType.AI) {
					if (options?.skipSummarization
						&& data.conversationMap[data.fullConversationHeadersOnly[i].bubbleId]?.capabilityType === CapabilityType.SUMMARIZATION) {
						continue;
					}
					return data.fullConversationHeadersOnly[i].bubbleId;
				}
			}
		});
		if (lastAiId) return data.conversationMap[lastAiId];
	}

	getLastHumanBubbleId(handle) {
		if (!this.getComposerData(handle)) return undefined;
		return this.getLastHumanBubble(handle)?.bubbleId;
	}

	getLastAiBubbleId(handle) {
		if (!this.getComposerData(handle)) return undefined;
		return this.getLastAiBubble(handle)?.bubbleId;
	}

	getLastBubble(handle) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		const lastId = this.getLastBubbleId(handle);
		if (lastId) return data.conversationMap[lastId];
	}

	getLastBubbleId(handle) {
		const data = this.getComposerData(handle);
		if (!data || data.fullConversationHeadersOnly.length === 0) return undefined;
		return data.fullConversationHeadersOnly[data.fullConversationHeadersOnly.length - 1].bubbleId;
	}

	getLastBubbleWhere(handle, predicate) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		const _headerCount = data.fullConversationHeadersOnly.length;
		const matchId = computed(() =>
			[...this.getLoadedConversation(handle)].reverse().find(b => predicate(b))?.bubbleId
		);
		if (matchId) return data.conversationMap[matchId];
	}

	getLastAiBubbles(handle, options) {
		const data = this.getComposerData(handle);
		if (!data) return [];

		if (options?.humanBubbleId) {
			const humanIdx = this.getComposerBubbleIndex(handle, options.humanBubbleId);
			if (humanIdx === -1) return [];

			// Walk backwards past consecutive human bubbles
			let startHuman = humanIdx;
			while (startHuman > 0 && data.fullConversationHeadersOnly[startHuman - 1].type === BubbleType.HUMAN) {
				startHuman--;
			}

			// Walk backwards past consecutive AI bubbles
			let startAi = startHuman - 1;
			while (startAi >= 0 && data.fullConversationHeadersOnly[startAi].type === BubbleType.AI) {
				startAi--;
			}

			const aiStart = startAi < 0 ? 0 : startAi + 1;
			return data.fullConversationHeadersOnly.slice(aiStart, startHuman)
				.map(h => data.conversationMap[h.bubbleId])
				.filter(isDefined);
		}

		// Default: get AI bubbles after last human
		const lastHumanId = this.getLastHumanBubbleId(handle);
		if (!lastHumanId) return [];
		const humanIdx = data.fullConversationHeadersOnly.findIndex(h => h.bubbleId === lastHumanId);
		return data.fullConversationHeadersOnly.slice(humanIdx + 1)
			.map(h => data.conversationMap[h.bubbleId])
			.filter(isDefined);
	}

	getNextAiBubbles(handle, options) {
		const data = this.getComposerData(handle);
		if (!data) return [];

		const humanIdx = this.getComposerBubbleIndex(handle, options.humanBubbleId);
		if (humanIdx === -1) return [];

		// Walk forward past consecutive human bubbles
		let endHuman = humanIdx;
		while (endHuman + 1 < data.fullConversationHeadersOnly.length
			&& data.fullConversationHeadersOnly[endHuman + 1].type === BubbleType.HUMAN) {
			endHuman++;
		}

		const aiStart = endHuman + 1;
		if (aiStart >= data.fullConversationHeadersOnly.length) return [];

		// Collect consecutive AI bubbles
		let aiEnd = aiStart;
		while (aiEnd < data.fullConversationHeadersOnly.length
			&& data.fullConversationHeadersOnly[aiEnd].type === BubbleType.AI) {
			aiEnd++;
		}

		return data.fullConversationHeadersOnly.slice(aiStart, aiEnd)
			.map(h => data.conversationMap[h.bubbleId])
			.filter(isDefined);
	}

	// ========================================================================
	// File content helpers
	// ========================================================================

	async getCurrentFilesContent(composerId, fileUris) {
		const contents = new Map();
		const handle = this.getHandleIfLoaded(composerId);
		const composerData = handle ? this.getComposerData(handle) : undefined;

		for (const uriStr of fileUris) {
			if (!await this._composerFileService.exists({
				uri: URI.parse(uriStr),
				composerData,
			})) {
				continue;
			}

			const uri = URI.parse(uriStr);
			let modelRef;
			try {
				modelRef = await this.composerTextModelService.createModelReference(uri, composerData, true);
				const lines = modelRef.object.textEditorModel.getLinesContent();
				contents.set(uriStr, lines);
			} finally {
				modelRef?.dispose();
			}
		}
		return contents;
	}

	// ========================================================================
	// UI helpers
	// ========================================================================

	selectLastHumanBubbleAboveInput(handle) {
		const data = this.getComposerData(handle);
		if (!data) return false;

		for (let i = data.fullConversationHeadersOnly.length - 1; i >= 0; i--) {
			const header = data.fullConversationHeadersOnly[i];
			if (header.type === BubbleType.HUMAN) {
				this.updateComposerData(handle, { selectedBubbleId: header.bubbleId });
				scrollBubbleIntoView(header.bubbleId); // oSt
				return true;
			}
		}
		return false;
	}

	// ========================================================================
	// Debug / info
	// ========================================================================

	getDebugInfo() {
		return {
			allComposersData: this.allComposersData,
			selectedComposerId: this.selectedComposerId,
			selectedComposerIds: this.selectedComposerIds,
			lastFocusedComposerIds: this.getLastFocusedComposerIds(),
		};
	}

	getLoadedComposers() {
		return toArray(this.loadedComposers.ids);
	}

	getLastFocusedComposerIds() {
		return [...this.allComposersData.lastFocusedComposerIds];
	}

	anyComposerHasMessages() {
		return this.allComposersData.allComposers.some(
			entry => entry.lastUpdatedAt !== undefined && entry.lastUpdatedAt > entry.createdAt
		);
	}

	isCompatibleScheme(scheme) {
		return [Schemas.file, Schemas.vscodeRemote, Schemas.vscodeNotebook, Schemas.vscodeTerminal, Schemas.git].includes(scheme);
	}

	async manuallyPersistComposer(composerId) {
		try {
			const handle = this.getHandleIfLoaded(composerId);
			if (handle) {
				await this.composerDataHandleManager.persistLoadedComposer(handle.data);
			}
		} catch (error) {
			console.error("[composer] error manually persisting composer data", error);
		}
	}

	isWorktreeComposer(composerId) {
		if (!composerId) return false;
		const handle = this.getHandleIfLoaded(composerId);
		const data = handle ? this.getComposerData(handle) : undefined;
		return !!data?.gitWorktree?.worktreePath;
	}

	// ========================================================================
	// Conversation loading
	// ========================================================================

	async getConversationFromBubble(handle, startBubbleId) {
		const data = this.getComposerData(handle);
		if (!data) return [];

		const composerId = handle.composerId;
		const startIdx = this.getComposerBubbleIndex(handle, startBubbleId);
		if (startIdx === -1) return [];

		const headersSlice = data.fullConversationHeadersOnly.slice(startIdx);

		// Collect loaded bubbles
		const loaded = new Map();
		for (const header of headersSlice) {
			const bubble = data.conversationMap[header.bubbleId];
			if (bubble) loaded.set(header.bubbleId, bubble);
		}

		// Load missing bubbles from storage
		const missingIds = headersSlice
			.filter(h => !loaded.has(h.bubbleId))
			.map(h => h.bubbleId);

		if (missingIds.length > 0) {
			const retrieved = missingIds.map(id =>
				this._composerMessageStorageService.retrieveMessage(composerId, id)
			);
			const results = await Promise.all(retrieved);
			for (const bubble of results) {
				if (bubble) loaded.set(bubble.bubbleId, bubble);
			}
		}

		// Return in order
		const conversation = [];
		for (const header of headersSlice) {
			const bubble = loaded.get(header.bubbleId);
			if (bubble) conversation.push(bubble);
		}
		return conversation;
	}

	async loadConversationFromBubble(handle, startBubbleId) {
		const conversation = await this.getConversationFromBubble(handle, startBubbleId);

		// Merge newly loaded bubbles into the reactive store
		const newBubbles = conversation.filter(b => !this.getComposerBubble(handle, b.bubbleId));
		if (newBubbles.length > 0) {
			this.updateComposerDataSetStore(handle, setData => {
				runInBatch(() => {
					for (const bubble of newBubbles) {
						setData("conversationMap", bubble.bubbleId, bubble);
					}
				});
			});
		}

		return conversation;
	}

	async loadBubblesByIds(handle, bubbleIds) {
		const data = this.getComposerData(handle);
		if (!data || bubbleIds.length === 0) return;

		const missingIds = bubbleIds.filter(id => !data.conversationMap[id]);
		if (missingIds.length === 0) return;

		const results = await this._composerMessageStorageService.retrieveMessagesBatch(
			handle.composerId,
			missingIds,
		);

		if (results.size > 0) {
			this.updateComposerDataSetStore(handle, setData => {
				runInBatch(() => {
					for (const [bubbleId, bubble] of results) {
						setData("conversationMap", bubbleId, bubble);
					}
				});
			});
		}
	}

	getComposerBubbleIdFromPotentialServerBubbleId(handle, potentialId) {
		const data = this.getComposerData(handle);
		if (!data) return undefined;
		return computed(() => {
			for (const header of data.fullConversationHeadersOnly) {
				if (header.bubbleId === potentialId || header.serverBubbleId === potentialId) {
					return header.bubbleId;
				}
			}
		});
	}

	// ========================================================================
	// Plan references index
	// ========================================================================

	_rebuildPlanReferencesIndexFromHeaders() {
		this._planReferencesIndex.clear();
		for (const entry of this.allComposersData.allComposers) {
			if (entry.referencedPlans) {
				this._updatePlanReferencesIndex(entry.composerId, entry.referencedPlans);
			}
		}
	}

	_updatePlanReferencesIndex(composerId, references) {
		// Remove old entries for this composer
		for (const [key, referencers] of this._planReferencesIndex.entries()) {
			referencers.delete(composerId);
			if (referencers.size === 0) {
				this._planReferencesIndex.delete(key);
			}
		}

		// Add new references
		for (const ref of references) {
			if (ref.type === "composer") {
				const refId = ref.composerId;
				if (!this._planReferencesIndex.has(refId)) {
					this._planReferencesIndex.set(refId, new Set());
				}
				this._planReferencesIndex.get(refId).add(composerId);
			} else if (ref.type === "file" && ref.composerId) {
				const refId = ref.composerId;
				if (!this._planReferencesIndex.has(refId)) {
					this._planReferencesIndex.set(refId, new Set());
				}
				this._planReferencesIndex.get(refId).add(composerId);
			}
		}
	}

	getComposersReferencingPlan(planComposerId) {
		const referencers = this._planReferencesIndex.get(planComposerId);
		if (!referencers || referencers.size === 0) return [];

		const results = [];
		for (const refId of referencers) {
			const entry = this.allComposersData.allComposers.find(c => c.composerId === refId);
			if (entry) {
				results.push({ composerId: entry.composerId, name: entry.name });
			}
		}
		return results;
	}

} // end class ComposerDataService


// ============================================================================
// Method tracing decorators (55 traced methods)
// ============================================================================
//
// __decorate([trace("ComposerDataService.getComposerTitle")], ComposerDataService.prototype, "getComposerTitle", null);
// __decorate([trace("ComposerDataService.setLastFocusedComposerId")], ComposerDataService.prototype, "setLastFocusedComposerId", null);
// __decorate([trace("ComposerDataService.updateComposerDataAsync")], ComposerDataService.prototype, "updateComposerDataAsync", null);
// __decorate([trace("ComposerDataService.getHandleIfLoaded")], ComposerDataService.prototype, "getHandleIfLoaded", null);
// __decorate([trace("ComposerDataService.composerWasLoadedHook")], ComposerDataService.prototype, "composerWasLoadedHook", null);
// __decorate([trace("ComposerDataService.composerWasUnloadedHook")], ComposerDataService.prototype, "composerWasUnloadedHook", null);
// __decorate([trace("ComposerDataService.getComposerHandleById")], ComposerDataService.prototype, "getComposerHandleById", null);
// __decorate([trace("ComposerDataService.getOrCreateHandleForBackgroundAgent")], ComposerDataService.prototype, "getOrCreateHandleForBackgroundAgent", null);
// __decorate([trace("ComposerDataService.updateSelectedComposer")], ComposerDataService.prototype, "updateSelectedComposer", null);
// __decorate([trace("ComposerDataService.updateComposerDataSetStore")], ComposerDataService.prototype, "updateComposerDataSetStore", null);
// __decorate([trace("ComposerDataService.updateComposerData")], ComposerDataService.prototype, "updateComposerData", null);
// __decorate([trace("ComposerDataService.saveComposers")], ComposerDataService.prototype, "saveComposers", null);
// __decorate([trace("ComposerDataService.appendComposer")], ComposerDataService.prototype, "appendComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING", null);
// __decorate([trace("ComposerDataService.appendSubComposer")], ComposerDataService.prototype, "appendSubComposer", null);
// __decorate([trace("ComposerDataService.deleteComposer")], ComposerDataService.prototype, "deleteComposer_DO_NOT_CALL_UNLESS_YOU_KNOW_WHAT_YOURE_DOING", null);
// __decorate([trace("ComposerDataService.getAllCachedCodeBlocks")], ComposerDataService.prototype, "getAllCachedCodeBlocks", null);
// __decorate([trace("ComposerDataService.isRunningCapabilities")], ComposerDataService.prototype, "isRunningCapabilities", null);
// __decorate([trace("ComposerDataService.isComposerRunning")], ComposerDataService.prototype, "isComposerRunning", null);
// __decorate([trace("ComposerDataService.getOldestSelectedComposerId")], ComposerDataService.prototype, "getOldestNonRunningSelectedComposerId", null);
// __decorate([trace("ComposerDataService.getToolFormer")], ComposerDataService.prototype, "getToolFormer", null);
// __decorate([trace("ComposerDataService.getPendingUserDecisionGroup")], ComposerDataService.prototype, "getPendingUserDecisionGroup", null);
// __decorate([trace("ComposerDataService.getIsBlockingUserDecision")], ComposerDataService.prototype, "getIsBlockingUserDecision", null);
// __decorate([trace("ComposerDataService.getBlockingUserDecisionToolType")], ComposerDataService.prototype, "getBlockingUserDecisionToolType", null);
// __decorate([trace("ComposerDataService.setGeneratingToolFormerToolsToCancelled")], ComposerDataService.prototype, "setLoadingToolFormerToolsToCancelled", null);
// __decorate([trace("ComposerDataService.setPendingToolFormerToolsToCancelled")], ComposerDataService.prototype, "setPendingToolFormerToolsToCancelled", null);
// __decorate([trace("ComposerDataService.getComposerCapability")], ComposerDataService.prototype, "getComposerCapability", null);
// __decorate([trace("ComposerDataService.getLoadedConversation")], ComposerDataService.prototype, "getLoadedConversation", null);
// __decorate([trace("ComposerDataService.getLoadedConversationById")], ComposerDataService.prototype, "getLoadedConversationById", null);
// __decorate([trace("ComposerDataService.unloadComposerBubblesBeforeBubble")], ComposerDataService.prototype, "unloadComposerBubblesBeforeBubble", null);
// __decorate([trace("ComposerDataService.deleteComposerBubbles")], ComposerDataService.prototype, "deleteComposerBubbles", null);
// __decorate([trace("ComposerDataService.appendComposerBubbles")], ComposerDataService.prototype, "appendComposerBubbles", null);
// __decorate([trace("ComposerDataService.insertComposerBubblesAtIndex")], ComposerDataService.prototype, "insertComposerBubblesAtIndex", null);
// __decorate([trace("ComposerDataService.getComposerBubbleIndex")], ComposerDataService.prototype, "getComposerBubbleIndex", null);
// __decorate([trace("ComposerDataService.getComposerBubble")], ComposerDataService.prototype, "getComposerBubble", null);
// __decorate([trace("ComposerDataService.getComposerBubbleUntracked")], ComposerDataService.prototype, "getComposerBubbleUntracked", null);
// __decorate([trace("ComposerDataService.getComposerBubbleAsync")], ComposerDataService.prototype, "getComposerBubbleAsync", null);
// __decorate([trace("ComposerDataService.updateComposerBubbleSetStore")], ComposerDataService.prototype, "updateComposerBubbleSetStore", null);
// __decorate([trace("ComposerDataService.updateComposerBubbleCheckpoint")], ComposerDataService.prototype, "updateComposerBubbleCheckpoint", null);
// __decorate([trace("ComposerDataService.updateComposerBubble")], ComposerDataService.prototype, "updateComposerBubble", null);
// __decorate([trace("ComposerDataService.getLastHumanBubble")], ComposerDataService.prototype, "getLastHumanBubble", null);
// __decorate([trace("ComposerDataService.getLastAiBubble")], ComposerDataService.prototype, "getLastAiBubble", null);
// __decorate([trace("ComposerDataService.getLastHumanBubbleId")], ComposerDataService.prototype, "getLastHumanBubbleId", null);
// __decorate([trace("ComposerDataService.getLastAiBubbleId")], ComposerDataService.prototype, "getLastAiBubbleId", null);
// __decorate([trace("ComposerDataService.getLastBubble")], ComposerDataService.prototype, "getLastBubble", null);
// __decorate([trace("ComposerDataService.getLastBubbleId")], ComposerDataService.prototype, "getLastBubbleId", null);
// __decorate([trace("ComposerDataService.getLastBubbleWhere")], ComposerDataService.prototype, "getLastBubbleWhere", null);
// __decorate([trace("ComposerDataService.getCurrentFilesContent")], ComposerDataService.prototype, "getCurrentFilesContent", null);
// __decorate([trace("ComposerDataService.selectLastHumanBubbleAboveInput")], ComposerDataService.prototype, "selectLastHumanBubbleAboveInput", null);
// __decorate([trace("ComposerDataService.getLoadedComposers")], ComposerDataService.prototype, "getLoadedComposers", null);
// __decorate([trace("ComposerDataService.getConversationFromBubble")], ComposerDataService.prototype, "getConversationFromBubble", null);
// __decorate([trace("ComposerDataService.loadConversationFromBubble")], ComposerDataService.prototype, "loadConversationFromBubble", null);
// __decorate([trace("ComposerDataService.loadBubblesByIds")], ComposerDataService.prototype, "loadBubblesByIds", null);
// __decorate([trace("ComposerDataService.getComposerBubbleIdFromPotentialServerBubbleId")], ComposerDataService.prototype, "getComposerBubbleIdFromPotentialServerBubbleId", null);
// __decorate([trace("ComposerDataService.getRootComposerId")], ComposerDataService.prototype, "getRootComposerId", null);
// __decorate([trace("ComposerDataService.manuallyPersistComposer")], ComposerDataService.prototype, "manuallyPersistComposer", null);

// ============================================================================
// DI Param decorators
// ============================================================================
//
// __param(0,  IStorageService)               // Ji
// __param(1,  IWorkspaceContextService)      // Rr
// __param(2,  IReactiveStorageService)       // xu
// __param(3,  IInstantiationService)         // un
// __param(4,  IComposerTextModelService)     // aie
// __param(5,  IComposerEventService)         // RA
// __param(6,  IComposerFileService)          // KZ
// __param(7,  IPaneCompositePartService)     // A0
// __param(8,  IViewsService)                 // yu
// __param(9,  IViewDescriptorService)        // bp
// __param(10, ICommandService)               // br
// __param(11, IEnvironmentService)           // _c
// __param(12, IComposerCheckpointStorageService) // Ett
// __param(13, IComposerMessageStorageService)    // $tt
// __param(14, IComposerCodeBlockDiffStorageService) // _$e
// __param(15, IComposerMessageRequestContextStorageService) // Whn
// __param(16, IComposerCodeBlockPartialInlineDiffFatesStorageService) // Sga
// __param(17, IModelConfigService)           // tx
// __param(18, IGitContextService)            // fE
// __param(19, INotificationService)          // ms
// __param(20, IInstantiationService)         // un  (duplicate)
// __param(21, IReactiveStorageService)       // xu  (duplicate)
// __param(22, IFileService)                  // Jr
// __param(23, IWorktreeManagerService)       // C$e
// __param(24, IExperimentService)            // Rl
// __param(25, IConfigurationService)         // On
// __param(26, IClientDebugLogService)        // sie
// __param(27, IAsyncOperationRegistry)       // Wtt
// __param(28, IPatchGraphStorageService)     // Hhn

// ============================================================================
// Service registration
// ============================================================================
//
// registerSingleton(IComposerDataService, ComposerDataService, InstantiationType.Eager, /* singleton */ true);
// Original: Ki(Fa, dy, 0, 1)

// ============================================================================
// Protobuf Enums (aiserver.v1)
// ============================================================================
//
// BackgroundComposerSecretLevel: UNSPECIFIED=0, ENVIRONMENT_VARIABLE=1, INJECTED_SECRET=2
// CycleType: UNSPECIFIED=0, MONTH=1, START_TIME=2
// TeamRole: UNSPECIFIED=0, OWNER=1, MEMBER=2, FREE_OWNER=3, REMOVED=4
// ProtectedGitProvider: UNSPECIFIED=0, GITHUB=1, GITLAB=2, GITHUB_ENTERPRISE=3, GITLAB_SELF_HOSTED=4
// FirstPartyPluginMode: UNSPECIFIED=0, ENABLE_ALL=1, ALLOWLIST=2
// AutoCreatePrMode: UNSPECIFIED=0, ALWAYS=1, SINGLE=2, NEVER=3
// PrReviewOpenDestinationMode: UNSPECIFIED=0, GITHUB=1, GRAPHITE=2
// GithubArtifactPostingMode: UNSPECIFIED=0, POST_ARTIFACT=1, LINK_ONLY=2
// CloudAgentEgressProtectionMode: UNSPECIFIED=0, ALLOW_ALL=1, DEFAULT_WITH_NETWORK_SETTINGS=2, NETWORK_SETTINGS_ONLY=3
// TeamFollowupEnabledMode: UNSPECIFIED=0, DISABLED=1, SERVICE_ACCOUNTS_ONLY=2, ALL=3
// SandboxingMode: UNSPECIFIED=0, ENABLED=1, DISABLED=2
// NetworkingMode: UNSPECIFIED=0, USER_CONTROLLED=1, ALWAYS_DISABLED=2
// GitMode: UNSPECIFIED=0, USER_CONTROLLED=1, ALWAYS_DISABLED=2
// TrialType: UNSPECIFIED=0, REQUEST=1, TOKEN=2
// AllowlistConfig: UNSPECIFIED=0, ALLOWLIST=1, BLOCKLIST=2
// BugbotAutofixMode: UNSPECIFIED=0, OFF=1, MANUAL=2, AUTO_PR=3, AUTO_MERGE=4
// BugbotBackfillStatus: UNSPECIFIED=0, RUNNING=1, COMPLETED=2, FAILED=3
// BugbotUsageTier: UNSPECIFIED=0, FREE_TIER=1, TRIAL=2, PAID=3
// LinearActor: UNSPECIFIED=0, APP=1, USER=2
// LinearRunOption: UNSPECIFIED=0, AUTOMATICALLY=1, BASED_ON_CONDITIONS=2, MANUALLY=3
// LabelFilterMode: UNSPECIFIED=0, AND=1, OR=2
// LinearIssuesOrderBy: UNSPECIFIED=0, UPDATED_AT=1, CREATED_AT=2
// GroupType: UNSPECIFIED=0, BILLING=1, PRODUCT=2
// SpendGroupByCategory: UNSPECIFIED=0, MODEL=1, USAGE_TYPE=2
// SpendType: UNSPECIFIED=0, ON_DEMAND=1, INCLUDED=2, ALL=3
// GroupMemberChangeType: UNSPECIFIED=0, ADD=1, REMOVE=2
// AdminNotificationRequestType: UNSPECIFIED=0, PRIVACY_MODE=1, BUGBOT=2
// SharedConversationVisibility: UNSPECIFIED=0, PRIVATE=1, TEAM=2, PUBLIC=3
// IndividualLimitsOptOutOutcome: UNSPECIFIED=0, SUCCESS=1, ALREADY_ALLOWED=2, ENTERPRISE=3, NOT_ADMIN=4, CREATED_AFTER_CUTOFF=5
// SlackConversationType: UNSPECIFIED=0, CHANNEL=1, DM=2, GROUP_DM=3
// PluginStatus: UNSPECIFIED=0, DRAFT=1, PENDING_APPROVAL=2, APPROVED=3, REJECTED=4

// ============================================================================
// Protobuf Message Classes (730 classes, 744 types — all in aiserver.v1)
// ============================================================================
//
// These are mechanical protobuf-generated message classes following the pattern:
//   class MinifiedName extends Message {
//     static typeName = "aiserver.v1.TypeName"
//     static fields = [...]
//     static fromBinary(data, options) { ... }
//     static fromJson(data, options) { ... }
//     static fromJsonString(data, options) { ... }
//     static equals(a, b) { ... }
//   }
//
// Key API categories include:
//   - GitHub/GitLab integration (Connect, Disconnect, Sync, Confirm)
//   - Team management (Create, Update, Delete, List members)
//   - Usage/billing (GetUsage, UpdateFastRequests, SpendTracking)
//   - Background agents (Create, List, Archive, GetStatus)
//   - Shared conversations (Share, Get, List, UpdateVisibility)
//   - Bugbot (Autofix, Backfill, LinearIntegration)
//   - Dashboard (Settings, Permissions, Notifications)
//   - Slack integration (ListConversations, SlackBot setup)
//   - Plugins (Create, Approve, Reject, List)
//
// Total protobuf classes: 730
// Total message type names: 744
// All in package: aiserver.v1
//
// These are NOT included inline because:
//   1. They are 100% mechanical (no logic to deobfuscate)
//   2. They add ~490KB of boilerplate
//   3. The original minified names are already the same pattern
//   4. They will be replaced by proper .proto → TypeScript generation
