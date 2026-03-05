// Source: out-build/vs/workbench/contrib/composer/browser/composerUtilsService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerUtilsService — the "kitchen sink" utility service
// that handles stream processing, diff computation, capability orchestration,
// tab management, deep cloning, and many other cross-cutting composer concerns.

Y9(), IC(), Qt(), dp(), st(), oa(), Er(), zw(), ls(), Xn(), ov(), Gk(), zk(), Jk(), nw(),
  Pd(), wI(), KS(), Qr(), Ov(), Jg(), oy(), Pmn(), N3t(), au(), Ex(), Lu(), ps(), y9(),
  Zk(), Sba(), nP(), hf(), qtt(), Fx(), ja(), Nc(), Sr(), _hn(), Wbi(), mD(), zk(), pQ(),
  Hi(), uV(), VZ(), ace(), fEe(), fN(), Yu(), gb(), Eye(), t1t(), jSf(), qF();

/** Context lines to show around diff chunks when merging */
const DIFF_MERGE_GAP_THRESHOLD = 5;

/** Context lines to grow each diff chunk by */
const DIFF_CONTEXT_LINES = 2;

const IComposerUtilsService = Bi("composerUtilsService");
const IComposerPlanService = Bi("composerPlanService");

/**
 * ComposerUtilsService
 *
 * A large utility service that provides cross-cutting functionality for the composer:
 *
 * - Stream processing (handleStreamComposer)
 * - Tab management (decideRunningComposerTabAction, selectNextComposer)
 * - Diff computation and formatting (computeDiff, computeDiffAndFormat)
 * - Capability orchestration (runCapabilitiesForProcess)
 * - Conversation editing (removeMessagesAfterBubble, resumeFromToolFormerBubble)
 * - Deep cloning of composers (deepCloneComposer)
 * - File content reading
 * - Plan mode suggestion heuristics
 * - Plugin keyword suggestions
 *
 * Injected services (25 total):
 * 0: IComposerDataService, 1: IComposerFileService, 2: IWorkspaceContextService,
 * 3: IEditorWorkerService, 4: IReactiveStorageService, 5: IComposerTextModelService,
 * 6: IInstantiationService, 7: ICommandService, 8: IUIOverlayService,
 * 9: IComposerEventService, 10: IAIFileInfoService, 11: IComposerViewsService,
 * 12: IComposerCodeBlockDiffStorageService, 13: IMetricsService,
 * 14: IComposerCheckpointStorageService, 15: IMessageRequestContextStorageService,
 * 16: IStorageService, 17: IComposerCodeBlockService, 18: IPrettyDialogService,
 * 19: IAIService, 20: IComposerModesService, 21: IExperimentService,
 * 22: ICursorAuthenticationService, 23: IBlobUploadService, 24: IPluginsProviderService
 */
let ComposerUtilsService = class extends at {
  constructor(
    composerDataService,
    composerFileService,
    workspaceContextService,
    editorWorkerService,
    reactiveStorageService,
    composerTextModelService,
    instantiationService,
    commandService,
    uiOverlayService,
    composerEventService,
    aiFileInfoService,
    composerViewsService,
    composerCodeBlockDiffStorageService,
    metricsService,
    composerCheckpointStorageService,
    messageRequestContextStorageService,
    storageService,
    composerCodeBlockService,
    prettyDialogService,
    aiService,
    composerModesService,
    experimentService,
    cursorAuthenticationService,
    blobUploadService,
    pluginsProviderService
  ) {
    super();
    this._composerDataService = composerDataService;
    this._composerFileService = composerFileService;
    this._workspaceContextService = workspaceContextService;
    this._editorWorkerService = editorWorkerService;
    this._reactiveStorageService = reactiveStorageService;
    this.composerTextModelService = composerTextModelService;
    this._instantiationService = instantiationService;
    this._commandService = commandService;
    this._uiOverlayService = uiOverlayService;
    this._composerEventService = composerEventService;
    this._aiFileInfoService = aiFileInfoService;
    this._composerViewsService = composerViewsService;
    this._composerCodeBlockDiffStorageService = composerCodeBlockDiffStorageService;
    this._metricsService = metricsService;
    this._composerCheckpointStorageService = composerCheckpointStorageService;
    this._messageRequestContextStorageService = messageRequestContextStorageService;
    this._storageService = storageService;
    this._composerCodeBlockService = composerCodeBlockService;
    this._prettyDialogService = prettyDialogService;
    this._aiService = aiService;
    this._composerModesService = composerModesService;
    this._experimentService = experimentService;
    this._cursorAuthenticationService = cursorAuthenticationService;
    this._blobUploadService = blobUploadService;
    this._pluginsProviderService = pluginsProviderService;

    /** LRU diff cache (max 50 entries) */
    this._composerDiffCache = new Nb(50);

    /** Semaphore limiting concurrent diff computations to 5 */
    this._composerDiffSemaphore = new Rmn(5);

    /** Disposables keyed by composerId for per-composer listeners */
    this._composerIdToDisposables = this._register(new Qm());

    // Watch for selected composers and set up listeners
    this._register(
      this._reactiveStorageService.onChangeEffectManuallyDisposed({
        deps: [
          () => kSt(this._composerDataService.loadedComposers.ids),
          () => kSt(this._composerDataService.allComposersData.selectedComposerIds),
        ],
        onChange: ({ deps: [loadedIds, selectedIds] }) => {
          const activeIds = loadedIds.filter((id) => selectedIds.includes(id));

          for (const composerId of activeIds) {
            if (!this._composerIdToDisposables.has(composerId)) {
              const composerData =
                this._composerDataService.loadedComposers.byId[composerId];
              this._composerIdToDisposables.set(
                composerId,
                this.setupComposerListeners(composerData)
              );
            }
          }

          for (const composerId of this._composerIdToDisposables.keys()) {
            if (!activeIds.includes(composerId)) {
              this._composerIdToDisposables.deleteAndDispose(composerId);
            }
          }
        },
        runNowToo: true,
      })
    );
  }

  /**
   * Set up reactive listeners for a specific composer.
   * Monitors editing bubble changes and auto-cleans empty editing bubbles.
   */
  setupComposerListeners(composerData) {
    const data = kSt(composerData);
    const disposables = new Ht();

    disposables.add(
      this._reactiveStorageService.onChangeEffectManuallyDisposed({
        deps: [() => composerData.editingBubbleId],
        onChange: ({ deps: [currentEditingId], prevDeps: [prevEditingId] = [void 0] }) => {
          if (prevEditingId === void 0 || currentEditingId === prevEditingId) return;

          const prevIndex = data.fullConversationHeadersOnly.findIndex(
            (h) => h.bubbleId === prevEditingId
          );
          if (
            prevIndex === -1 ||
            prevIndex >= data.fullConversationHeadersOnly.length - 1
          )
            return;

          const nextBubbleId =
            data.fullConversationHeadersOnly[prevIndex + 1]?.bubbleId;
          const prevBubbleId =
            data.fullConversationHeadersOnly[prevIndex - 1]?.bubbleId;

          const nextBubble = nextBubbleId
            ? data.conversationMap[nextBubbleId]
            : void 0;
          const prevBubble = prevBubbleId
            ? data.conversationMap[prevBubbleId]
            : void 0;

          // Only auto-clean if surrounded by TOOL_FORMER AI messages
          if (
            (nextBubble?.type !== ul.AI ||
              nextBubble?.capabilityType !== ko.TOOL_FORMER) &&
            (prevBubble?.type !== ul.AI ||
              prevBubble?.capabilityType !== ko.TOOL_FORMER)
          )
            return;

          // Only clean if text is empty
          if (data.conversationMap[prevEditingId]?.text?.trim() !== "") return;

          const handle = this._composerDataService.getHandleIfLoaded(data.composerId);
          if (handle) {
            this._composerDataService.deleteComposerBubbles(handle, [prevEditingId]);
          }
        },
      })
    );

    return disposables;
  }

  // ============================================================
  // Tab management
  // ============================================================

  /**
   * Decide what to do when the user wants to switch/create a tab while a composer is running.
   * Returns: "skip" | "new-tab" | "replace" | "cancel"
   */
  async decideRunningComposerTabAction(action, targetComposerId) {
    const selectedId = this._composerDataService.selectedComposerId;
    const handle = this._composerDataService.getHandleIfLoaded(selectedId);
    const isRunning = handle
      ? this._composerDataService.isComposerRunning(handle)
      : false;

    if (
      targetComposerId &&
      this._composerDataService.selectedComposerIds.includes(targetComposerId)
    ) {
      return "skip";
    }

    const openCount = this._composerDataService.selectedComposerIds.length;
    const maxTabsMode =
      this._reactiveStorageService.applicationUserPersistentStorage.composerState
        .maxOpenTabsMode;
    const maxTabsCustom =
      this._reactiveStorageService.applicationUserPersistentStorage.composerState
        .maxOpenTabsCustomValue;

    let maxTabs = 5;
    if (maxTabsMode === "5") maxTabs = 5;
    else if (maxTabsMode === "10") maxTabs = 10;
    else if (maxTabsMode === "unlimited") maxTabs = Infinity;
    else if (maxTabsMode === "custom") maxTabs = Math.max(1, maxTabsCustom ?? maxTabs);

    const hasRoom = openCount < maxTabs;

    if (action === "switch") {
      if (
        hasRoom ||
        this._composerDataService.getOldestNonRunningSelectedComposerId(targetComposerId)
      ) {
        return "new-tab";
      }

      const result = await this._prettyDialogService.openDialog({
        title: "Replace current chat?",
        message:
          "You've reached the limit for open chats. To switch to another chat, you'll have to replace the current one.",
        primaryButton: { id: "replace", label: "Replace Chat" },
        cancelButton: { id: "cancel", label: "Cancel" },
        dialogIcon: Be.warning,
      });
      return result === "cancel" || result === void 0 ? "cancel" : "replace";
    }

    if (!isRunning || !handle) return "skip";

    if (this._composerDataService.getPendingUserDecisionGroup(handle).length > 0) {
      return "replace";
    }

    if (hasRoom) return "new-tab";

    const result = await this._prettyDialogService.openDialog({
      title: "Replace current chat?",
      message:
        "You've reached the limit for open chats. To create a new one, you'll have to replace the current chat.",
      primaryButton: { id: "replace", label: "Replace Chat" },
      cancelButton: { id: "cancel", label: "Cancel" },
      dialogIcon: Be.warning,
    });
    return result === "cancel" || result === void 0 ? "cancel" : "replace";
  }

  // ============================================================
  // File content reading
  // ============================================================

  async getFileLinesContent({ uri, composerId }) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const composerData = handle
      ? this._composerDataService.getComposerData(handle)
      : void 0;
    if (!(await this._composerFileService.exists({ uri, composerData }))) return null;

    let modelRef;
    try {
      modelRef = await this.composerTextModelService.createModelReference(
        uri,
        composerData,
        true
      );
      return modelRef.object.textEditorModel.getLinesContent();
    } catch (error) {
      console.error("[composer] error getting content of file", uri, error);
      return null;
    } finally {
      modelRef?.dispose();
    }
  }

  async getFileContents({ uri, composerId }) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const composerData = handle
      ? this._composerDataService.getComposerData(handle)
      : void 0;
    if (!(await this._composerFileService.exists({ uri, composerData }))) return null;

    let modelRef;
    try {
      modelRef = await this.composerTextModelService.createModelReference(
        uri,
        composerData,
        true
      );
      return modelRef.object.textEditorModel.getValue();
    } catch (error) {
      console.error("[composer] error getting full content of file", uri, error);
      return null;
    } finally {
      modelRef?.dispose();
    }
  }

  // ============================================================
  // Capability management
  // ============================================================

  async ensureCapabilitiesAreLoaded(handle) {
    const composerData = this._composerDataService.getComposerData(handle);
    if (!composerData || composerData.capabilities.length > 0) return;

    const capabilities = sce(this._instantiationService, handle.composerId);
    if (capabilities.length === 0) {
      throw new Error(
        `[composer] No capabilities found for composer ${handle.composerId}`
      );
    }
    this._composerDataService.updateComposerData(handle, { capabilities });
  }

  async getShouldWebSearchBeEnabled(forceRefresh = false, context) {
    const stored =
      this._reactiveStorageService.applicationUserPersistentStorage.composerState
        .isWebSearchToolEnabled3;
    return stored ?? true;
  }

  getShouldAutoSaveAgenticEdits() {
    return true;
  }

  // ============================================================
  // Fast edit helpers
  // ============================================================

  /** Replace a bubble's text with edit-specific content (file path + code) */
  replacedBubbleForEdit(bubbleData, codeBlock, bubble) {
    if (bubbleData.additionalData === void 0) return bubble;

    const instructions = bubbleData.params?.instructions;
    if (instructions === void 0) return bubble;

    let text = "";
    if (instructions !== void 0) {
      text += `${instructions}\n\n`;
    }

    let relativePath;
    try {
      relativePath = this._workspaceContextService.asRelativePath(codeBlock.uri);
    } catch {
      relativePath = codeBlock.uri.fsPath;
    }

    text += `\`\`\`${relativePath}\n${codeBlock.content}\n\`\`\``;

    return new Ww({ ...bubble, text });
  }

  replacedBubbleForFastEdit(handle, bubble, codeBlockRef) {
    const toolFormer = this._composerDataService.getComposerCapability(
      handle,
      ko.TOOL_FORMER
    );
    if (toolFormer === void 0) return new Ww(bubble);

    const bubbleData = toolFormer.getBubbleData(bubble.bubbleId);
    const matchingBlock = bubble.codeBlocks?.find(
      (cb) =>
        !cb.unregistered && cb.uri
          ? cb.codeblockId === codeBlockRef.codeblockId &&
            jMo(cb.uri, codeBlockRef.uri)
          : false
    );

    if (!bubbleData || !matchingBlock) return new Ww(bubble);

    if (bubbleData.tool === on.EDIT_FILE) {
      return this.replacedBubbleForEdit(bubbleData, matchingBlock, new Ww(bubble));
    }

    return new Ww(bubble);
  }

  processConversationForFastEdit(handle, conversation, codeBlockRef) {
    const targetIdx = conversation.findIndex(
      (msg) =>
        msg.type === ul.AI &&
        msg.codeBlocks?.some(
          (cb) =>
            !cb.unregistered && cb.uri
              ? cb.codeblockId === codeBlockRef.codeblockId &&
                jMo(cb.uri, codeBlockRef.uri)
              : false
        )
    );

    const sliced = conversation.slice(0, targetIdx + 1).map((msg, idx) => {
      if (msg.type === ul.AI && idx !== targetIdx) {
        const condensed = msg.text.replace(/```[\s\S]*?```/g, "[old_code]");
        return new Ww({ ...msg, text: condensed });
      }
      return new Ww(msg);
    });

    const targetBubble = conversation.at(targetIdx);
    if (targetBubble.capabilityType === ko.TOOL_FORMER) {
      const replaced = this.replacedBubbleForFastEdit(handle, targetBubble, codeBlockRef);
      sliced[sliced.length - 1] = replaced;
    }

    return sliced;
  }

  // ============================================================
  // Stream processing
  // ============================================================

  /**
   * Process the AI response stream, updating composer data as chunks arrive.
   * Handles: text tokens, citations, status updates, image descriptions,
   * symbol/file links, stars feedback, service status updates, and more.
   */
  async *handleStreamComposer(streamContext) {
    let firstTokenReceived = false;
    let shouldStopUsingDsv3 = false;

    try {
      for await (const chunk of streamContext.streamer) {
        if (!this._composerDataService.getComposerData(streamContext.composerHandle))
          continue;

        const lastBubble = this._composerDataService.getLastBubble(
          streamContext.composerHandle
        );
        if (!lastBubble) continue;

        // --- Update conversation metadata from stream ---

        if ("conversationSummary" in chunk && chunk.conversationSummary && lastBubble) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "conversationMap",
                lastBubble.bubbleId,
                "conversationSummary",
                chunk.conversationSummary
              )
          );
        }

        if (
          "serverBubbleId" in chunk &&
          chunk.serverBubbleId &&
          typeof chunk.serverBubbleId === "string" &&
          chunk.serverBubbleId !== "" &&
          lastBubble
        ) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "conversationMap",
                lastBubble.bubbleId,
                "serverBubbleId",
                chunk.serverBubbleId
              )
          );
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "fullConversationHeadersOnly",
                (h) => h.bubbleId === lastBubble.bubbleId,
                "serverBubbleId",
                chunk.serverBubbleId
              )
          );
        }

        if (
          "usageUuid" in chunk &&
          chunk.usageUuid &&
          typeof chunk.usageUuid === "string" &&
          chunk.usageUuid !== "" &&
          lastBubble
        ) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s("conversationMap", lastBubble.bubbleId, "usageUuid", chunk.usageUuid)
          );
        }

        if (
          "modelProviderRequestJson" in chunk &&
          chunk.modelProviderRequestJson &&
          typeof chunk.modelProviderRequestJson === "string" &&
          chunk.modelProviderRequestJson !== "" &&
          lastBubble
        ) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "conversationMap",
                lastBubble.bubbleId,
                "modelProviderRequestJson",
                chunk.modelProviderRequestJson
              )
          );
        }

        if ("subagentReturn" in chunk && chunk.subagentReturn && lastBubble) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "conversationMap",
                lastBubble.bubbleId,
                "subagentReturn",
                chunk.subagentReturn
              )
          );
        }

        // --- Process citations and references ---

        const lastHumanBubbleId = this._composerDataService.getLastHumanBubbleId(
          streamContext.composerHandle
        );

        if (lastHumanBubbleId) {
          const composerId = streamContext.composerHandle.composerId;

          if (chunk !== null && typeof chunk === "object") {
            // Web citations
            if (chunk.webCitation && chunk.webCitation.references?.length) {
              await this._messageRequestContextStorageService.updateContext(
                composerId,
                lastHumanBubbleId,
                (ctx) => {
                  ctx.webReferences = [
                    ...(ctx.webReferences ?? []),
                    ...chunk.webCitation.references,
                  ];
                }
              );
              this._composerDataService.updateComposerDataSetStore(
                streamContext.composerHandle,
                (s) =>
                  s(
                    "conversationMap",
                    lastBubble.bubbleId,
                    "webCitations",
                    chunk.webCitation.references.map((ref) => ({
                      title: ref.title,
                      url: ref.url,
                    }))
                  )
              );
            }

            // AI web search results
            if (chunk.aiWebSearchResults && chunk.aiWebSearchResults.results?.length) {
              this._composerDataService.updateComposerDataSetStore(
                streamContext.composerHandle,
                (s) =>
                  s(
                    "conversationMap",
                    lastBubble.bubbleId,
                    "aiWebSearchResults",
                    chunk.aiWebSearchResults.results.map((r) => ({
                      title: r.title,
                      content: r.content,
                    }))
                  )
              );
            }

            // Docs references
            if (chunk.docsReference) {
              await this._messageRequestContextStorageService.updateContext(
                composerId,
                lastHumanBubbleId,
                (ctx) => {
                  ctx.docsReferences = [
                    ...(ctx.docsReferences ?? []),
                    chunk.docsReference,
                  ];
                }
              );
              this._composerDataService.updateComposerDataSetStore(
                streamContext.composerHandle,
                (s) =>
                  s(
                    "conversationMap",
                    lastBubble.bubbleId,
                    "docsCitations",
                    (existing) => [
                      ...(existing ?? []),
                      {
                        title: chunk.docsReference.title,
                        url: chunk.docsReference.url,
                      },
                    ]
                  )
              );
            }

            // Git context
            if (chunk.viewableGitContext) {
              await this._messageRequestContextStorageService.updateContext(
                composerId,
                lastHumanBubbleId,
                (ctx) => {
                  ctx.gitContext = chunk.viewableGitContext;
                }
              );
            }
          }
        }

        // --- Status updates ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "statusUpdates" in chunk &&
          chunk.statusUpdates !== void 0 &&
          chunk.statusUpdates !== null &&
          lastBubble
        ) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s(
                "conversationMap",
                lastBubble.bubbleId,
                "statusUpdates",
                chunk.statusUpdates
              )
          );
        }

        // --- Service status update (with optional command execution) ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "serviceStatusUpdate" in chunk &&
          chunk.serviceStatusUpdate !== void 0 &&
          chunk.serviceStatusUpdate !== null &&
          lastBubble
        ) {
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s("conversationMap", lastBubble.bubbleId, "serviceStatusUpdate", {
                ...chunk.serviceStatusUpdate,
              })
          );

          if (chunk.serviceStatusUpdate.actionToRunOnStatusUpdate) {
            try {
              this._commandService.executeCommand(
                chunk.serviceStatusUpdate.actionToRunOnStatusUpdate
              );
            } catch (error) {
              console.error(
                `[composer] error running action ${chunk.serviceStatusUpdate.actionToRunOnStatusUpdate}`,
                error
              );
            }
          }
        }

        // --- Stars feedback request ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "starsFeedbackRequest" in chunk &&
          chunk.starsFeedbackRequest !== void 0 &&
          chunk.starsFeedbackRequest !== null
        ) {
          const dontAskAgain =
            this._reactiveStorageService.applicationUserPersistentStorage
              .dialogDontAskAgainPreferences?.["stars-feedback"] ?? false;
          const composerData = this._composerDataService.getComposerData(
            streamContext.composerHandle
          );
          const isBackgroundAgent = !!composerData?.createdFromBackgroundAgent?.bcId;

          if (dontAskAgain || isBackgroundAgent) continue;

          const targetBubbleId = chunk.starsFeedbackRequest.bubbleId;
          if (!targetBubbleId || !composerData) continue;

          const conversation = this._composerDataService.getLoadedConversation(
            streamContext.composerHandle
          );
          let targetBubble;
          let targetIndex = -1;
          for (let i = 0; i < conversation.length; i++) {
            const msg = conversation[i];
            if (msg.serverBubbleId === targetBubbleId || msg.bubbleId === targetBubbleId) {
              targetBubble = msg;
              targetIndex = i;
              break;
            }
          }

          if (
            !targetBubble ||
            !targetBubble.requestId ||
            targetBubble.starRating !== void 0 ||
            targetBubble.type !== ul.AI
          )
            continue;

          // Find the last human message index
          let lastHumanIdx = -1;
          for (let i = conversation.length - 1; i >= 0; i--) {
            if (conversation[i].type === ul.HUMAN) {
              lastHumanIdx = i;
              break;
            }
          }
          if (lastHumanIdx === -1) continue;

          // Find the AI message just before the last human message
          let prevAiIdx = -1;
          for (let i = lastHumanIdx - 1; i >= 0; i--) {
            if (conversation[i].type === ul.AI) {
              prevAiIdx = i;
              break;
            }
          }
          if (targetIndex !== prevAiIdx) continue;

          this._uiOverlayService.showStarsFeedbackPopup({
            composerId: composerData.composerId,
            requestId: targetBubble.requestId,
            popupText: chunk.starsFeedbackRequest.message,
            didPopup: true,
            targetBubbleId: targetBubble.bubbleId,
          });
        }

        // --- DSv3 model stop signal ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "stopUsingDsv3AgenticModel" in chunk &&
          chunk.stopUsingDsv3AgenticModel === true
        ) {
          shouldStopUsingDsv3 = true;
        }

        // --- Image description updates ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "imageDescription" in chunk &&
          chunk.imageDescription !== void 0 &&
          chunk.imageDescription !== null &&
          lastBubble
        ) {
          const desc = chunk.imageDescription;
          console.log("[imageDescription] imageDescription", desc);

          const composerData = this._composerDataService.getComposerData(
            streamContext.composerHandle
          );
          if (composerData) {
            let found = false;
            for (const bubbleId in composerData.conversationMap) {
              const bubble = composerData.conversationMap[bubbleId];

              // Check selected images
              for (const [imgIdx, img] of (
                bubble.context?.selectedImages ?? []
              ).entries()) {
                if (img.uuid === desc.imageUuid) {
                  console.log(
                    "[imageDescription] found image, updating description"
                  );
                  found = true;
                  this._composerDataService.updateComposerDataSetStore(
                    streamContext.composerHandle,
                    (s) =>
                      s(
                        "conversationMap",
                        bubbleId,
                        "context",
                        "selectedImages",
                        imgIdx,
                        "taskSpecificDescription",
                        desc.description
                      )
                  );
                }
              }

              // Check tool result images
              for (const [trIdx, toolResult] of (
                bubble.toolResults ?? []
              ).entries()) {
                for (const [imgIdx, img] of (toolResult.images ?? []).entries()) {
                  if (img.uuid === desc.imageUuid) {
                    console.log(
                      "[imageDescription] found image in tool result, updating description"
                    );
                    found = true;
                    this._composerDataService.updateComposerDataSetStore(
                      streamContext.composerHandle,
                      (s) =>
                        s(
                          "conversationMap",
                          bubbleId,
                          "toolResults",
                          trIdx,
                          "images",
                          imgIdx,
                          "taskSpecificDescription",
                          desc.description
                        )
                    );
                  }
                }
              }
            }

            if (!found) {
              console.warn(
                "[imageDescription] Could not figure out what image the description belongs to"
              );
            }
          } else {
            console.warn(
              "[imageDescription] composer not found for updating image description"
            );
          }
        }

        // --- Symbol links ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "symbolLink" in chunk &&
          chunk.symbolLink !== void 0 &&
          chunk.symbolLink !== null &&
          lastBubble
        ) {
          const link = chunk.symbolLink;
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s("conversationMap", lastBubble.bubbleId, "symbolLinks", (existing) =>
                existing ? [...existing, link] : [link]
              )
          );
        }

        // --- File links ---

        if (
          chunk !== null &&
          typeof chunk === "object" &&
          "fileLink" in chunk &&
          chunk.fileLink !== void 0 &&
          chunk.fileLink !== null &&
          lastBubble
        ) {
          const link = chunk.fileLink;
          this._composerDataService.updateComposerDataSetStore(
            streamContext.composerHandle,
            (s) =>
              s("conversationMap", lastBubble.bubbleId, "fileLinks", (existing) =>
                existing ? [...existing, link] : [link]
              )
          );
        }

        yield chunk;

        // Track time to first token
        if (firstTokenReceived === false && (chunk.text?.length ?? 0) > 0) {
          firstTokenReceived = true;
          console.debug(
            `[composer.submitChat] ttft is ${Date.now() - streamContext.startTime}ms`
          );
        }
      }
    } finally {
      if (
        this._composerDataService.getComposerData(streamContext.composerHandle) &&
        shouldStopUsingDsv3
      ) {
        this._commandService.executeCommand(Maa, { isAutoResume: true });
      }
    }
  }

  async readFileContents(uri, composerId) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const composerData = handle
      ? this._composerDataService.getComposerData(handle)
      : void 0;
    return (
      await this._composerFileService.readFile({ uri, composerData })
    ).value.toString();
  }

  // ============================================================
  // Conversation editing
  // ============================================================

  /** Get code block data from a specific bubble onwards (for keeping history) */
  getCodeBlockDataFromBubbleId(handle, bubbleId) {
    const composerData = this._composerDataService.getComposerData(handle);
    if (!composerData)
      throw new Error("[composer] Cannot get bubble for unloaded composer");

    const conversation = this._composerDataService.getLoadedConversation(handle);
    const startIdx = conversation.findIndex((msg) => msg.bubbleId === bubbleId);
    if (startIdx === -1)
      throw new Error("[composer] No bubble found with the given bubble ID");

    // Collect code block IDs from the target bubble onwards
    const codeBlockIdsToRemove = {};
    conversation.slice(startIdx).forEach((msg) => {
      msg.codeBlocks
        ?.filter((cb) => !cb.unregistered && cb.uri !== void 0)
        .forEach((cb) => {
          const uriStr = cb.uri.toString();
          if (!codeBlockIdsToRemove[uriStr]) {
            codeBlockIdsToRemove[uriStr] = new Set();
          }
          codeBlockIdsToRemove[uriStr].add(cb.codeblockId);
        });
    });

    // Build remaining code block data (everything NOT in the removed set)
    const remaining = { ...composerData.codeBlockData };
    for (const [uriStr, idsToRemove] of Object.entries(codeBlockIdsToRemove)) {
      if (remaining[uriStr]) {
        const kept = {};
        for (const [blockId, blockData] of Object.entries(remaining[uriStr])) {
          if (!idsToRemove.has(blockId)) {
            kept[blockId] = blockData;
          }
        }
        if (Object.keys(kept).length === 0) {
          delete remaining[uriStr];
        } else {
          remaining[uriStr] = kept;
        }
      }
    }

    return remaining;
  }

  /** Remove all messages after a given bubble (for conversation truncation/edit) */
  removeMessagesAfterBubble(handle, bubbleId) {
    const composerData = this._composerDataService.getComposerData(handle);
    if (!composerData || bubbleId === void 0) return;

    const conversation = this._composerDataService.getLoadedConversation(handle);
    const startIdx = conversation.findIndex((msg) => msg.bubbleId === bubbleId);
    if (startIdx === -1) return;

    const codeBlockDataToKeep = this.getCodeBlockDataFromBubbleId(handle, bubbleId);
    const bubblesAfter = conversation.slice(startIdx);
    const bubbleIdsToRemove = bubblesAfter.map((msg) => msg.bubbleId);

    // Collect plan URIs from deleted TASK_V2 bubbles
    const planUrisToDeref = ((msgs) => {
      const uriMap = new Map();
      for (const msg of msgs) {
        const tfData = msg.toolFormerData;
        if (tfData?.tool !== on.CREATE_PLAN) continue;
        const planUri = tfData.additionalData?.planUri;
        if (!planUri) continue;
        const parsed = lEe(planUri);
        uriMap.set(parsed.fsPath, parsed);
      }
      return Array.from(uriMap.values());
    })(bubblesAfter);

    this._composerDataService.deleteComposerBubbles(handle, bubbleIdsToRemove);

    // Dereference deleted plans
    if (planUrisToDeref.length > 0) {
      this._instantiationService
        .invokeFunction((accessor) => accessor.get(IComposerPlanService))
        .dereferencePlansCreatedByDeletedBubbles(handle.composerId, planUrisToDeref)
        .catch((error) => {
          console.warn(
            "[composer] Failed to dereference deleted plan entries:",
            error
          );
        });
    }

    // Update plan if the plan's bubble was deleted
    let updatedPlan = composerData.plan;
    if (composerData.plan?.bubbleId && bubbleIdsToRemove.includes(composerData.plan.bubbleId)) {
      const toolFormer = this._composerDataService.getToolFormer(handle);
      if (toolFormer) {
        for (let i = startIdx - 1; i >= 0; i--) {
          const msg = conversation[i];
          const bData = toolFormer.getBubbleData(msg.bubbleId);
          if (bData?.tool === on.CREATE_PLAN && bData.params) {
            const hasSteps = bData.params.steps && bData.params.steps.length > 0;
            updatedPlan = {
              content: bData.params.plan || "",
              bubbleId: msg.bubbleId,
              steps: bData.params.steps,
              overview: bData.params.overview,
              todos: bData.params.todos?.map((t) => ({
                id: t.id,
                content: t.content,
                status: "pending",
                dependencies: t.dependencies || [],
              })),
              isSpec: hasSteps,
            };
            break;
          }
        }
        if (updatedPlan === composerData.plan) {
          updatedPlan = void 0;
        }
      }
    }

    // Determine which URI code blocks were fully removed
    const removedUris = Object.keys(composerData.codeBlockData).filter(
      (uri) => !(uri in codeBlockDataToKeep)
    );

    // Update store
    this._composerDataService.updateComposerDataSetStore(handle, (setStore) => {
      setStore("editingBubbleId", void 0);
      setStore("currentBubbleId", void 0);
      setStore("latestCheckpointId", void 0);

      if (updatedPlan !== composerData.plan) {
        setStore("plan", updatedPlan);
        setStore("isSpec", updatedPlan?.isSpec ?? false);
      }

      // Remove original file states for deleted bubbles
      for (const [uriStr, state] of Object.entries(composerData.originalFileStates)) {
        if (bubbleIdsToRemove.includes(state.firstEditBubbleId)) {
          setStore("originalFileStates", uriStr, void 0);
        }
      }

      // Remove fully deleted code block URIs
      for (const uriStr of removedUris) {
        setStore("codeBlockData", uriStr, void 0);
      }

      // Restore kept code block data
      for (const uriStr of Object.keys(codeBlockDataToKeep)) {
        setStore("codeBlockData", uriStr, codeBlockDataToKeep[uriStr]);
      }
    });

    // Remove inline diffs for deleted URIs
    for (const uriStr of removedUris) {
      try {
        const uri = je.parse(uriStr);
        this._composerEventService.fireToRemoveDiffs({ uri });
      } catch (error) {
        console.warn(`[composer] Failed to remove diffs for URI ${uriStr}:`, error);
      }
    }
  }

  // ============================================================
  // Diff computation
  // ============================================================

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

    for (; diffIdx < diffs.length; diffIdx++) {
      const { modified } = diffs[diffIdx];
      result.push(...modified);
    }

    return result;
  }

  /**
   * Run capability hooks for a specific process phase.
   * Processes: start-submit-chat, before-submit-chat, chat-stream-finished,
   * after-apply, before-apply, accept-all-edits, add-pending-action, composer-done.
   */
  async runCapabilitiesForProcess(handle, process, context) {
    const env = { stack: [], error: void 0, hasError: false };
    try {
      const span = __addDisposableResource(
        env,
        context.parentSpanCtx?.startSpan(`runCapabilitiesForProcess.${process}`),
        false
      );

      const composerData = this._composerDataService.getComposerData(handle);
      if (!composerData) return;

      const capabilities = EMA(composerData.capabilities, process, context);

      if (process === "start-submit-chat") {
        const sorted = capabilities
          .filter((cap) => !!cap.onStartSubmitChatReturnShouldStop)
          .sort((a, b) => a.priority - b.priority);

        for (const cap of sorted) {
          if (cap.onStartSubmitChatReturnShouldStop) {
            try {
              const result = await this.measureCapabilityExecution({
                process: "start-submit-chat",
                capabilityName: cap.name,
                parentSpanCtx: span,
                capabilityFn: () =>
                  cap.onStartSubmitChatReturnShouldStop.bind(cap)(context),
              });
              if (typeof result === "object" && result.shouldStop) return result;
            } catch (error) {
              console.error(
                `[composer] Error running capability '${cap.name}' during start-submit-chat`,
                error
              );
            }
          }
        }
      }

      if (process === "before-submit-chat") {
        const sorted = capabilities
          .filter((cap) => !!cap.onBeforeSubmitChat)
          .sort((a, b) => a.priority - b.priority);

        for (const cap of sorted) {
          if (cap.onBeforeSubmitChat) {
            try {
              const result = await this.measureCapabilityExecution({
                process: "before-submit-chat",
                capabilityName: cap.name,
                parentSpanCtx: span,
                capabilityFn: () => cap.onBeforeSubmitChat.bind(cap)(context),
              });
              if (result === true) return true;
            } catch (error) {
              console.error(
                `[composer] Error running capability '${cap.name}' during before-submit-chat`,
                error
              );
              if (error instanceof yA) throw error;
            }
          }
        }
        return false;
      }

      // All other processes run in parallel
      await Promise.all(
        capabilities.map(async (cap) => {
          try {
            switch (process) {
              case "chat-stream-finished":
                if (cap.onChatStreamFinished) {
                  await this.measureCapabilityExecution({
                    process: "chat-stream-finished",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onChatStreamFinished.bind(cap)(context),
                  });
                }
                return;
              case "after-apply":
                if (cap.onAfterApply) {
                  await this.measureCapabilityExecution({
                    process: "after-apply",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onAfterApply.bind(cap)(context),
                  });
                }
                return;
              case "before-apply":
                if (cap.onBeforeApply) {
                  await this.measureCapabilityExecution({
                    process: "before-apply",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onBeforeApply.bind(cap)(context),
                  });
                }
                return;
              case "accept-all-edits":
                if (cap.onAcceptAllEdits) {
                  await this.measureCapabilityExecution({
                    process: "accept-all-edits",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onAcceptAllEdits.bind(cap)(context),
                  });
                }
                return;
              case "add-pending-action":
                if (cap.onAddPendingAction) {
                  await this.measureCapabilityExecution({
                    process: "add-pending-action",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onAddPendingAction.bind(cap)(context),
                  });
                }
                return;
              case "composer-done":
                if (cap.onComposerDone) {
                  await this.measureCapabilityExecution({
                    process: "composer-done",
                    capabilityName: cap.name,
                    parentSpanCtx: span,
                    capabilityFn: () => cap.onComposerDone.bind(cap)(context),
                  });
                }
                return;
              default:
                return;
            }
          } catch (error) {
            console.error(
              `[composer] Error running capability '${cap.name}' during ${process}`,
              error
            );
          }
        })
      );
    } catch (error) {
      env.error = error;
      env.hasError = true;
    } finally {
      __disposeResources(env);
    }
  }

  // ============================================================
  // Composer navigation
  // ============================================================

  async selectNextComposer(reverse) {
    const currentId = this._composerDataService.selectedComposerId;

    if (this._composerDataService.selectedComposerIds.length > 1) {
      const ordered = this._composerViewsService.getOrderedSelectedComposerIds();
      const idx = ordered.findIndex((id) => id === currentId);
      if (idx === -1 || ordered.length <= 1) return;

      const count = ordered.length;
      const nextIdx = (idx + (reverse ? -1 : 1) + count) % count;
      const nextId = ordered[nextIdx];
      if (nextId) await this._commandService.executeCommand(K0t, nextId);
    } else {
      const allComposers = iNg([
        ...this._composerDataService.allComposersData.allComposers,
      ]);
      const idx = allComposers.findIndex((c) => c.composerId === currentId);
      if (idx === -1 || allComposers.length <= 1) return;

      const count = allComposers.length;
      const nextIdx = (idx + (reverse ? -1 : 1) + count) % count;
      const nextId = allComposers[nextIdx].composerId;

      if (nextId) {
        const currentHandle = this._composerDataService.getHandleIfLoaded(currentId);
        const isRunning = currentHandle
          ? this._composerDataService.isComposerRunning(currentHandle)
          : false;

        if (isRunning) {
          const openCount = this._composerDataService.selectedComposerIds.length;
          const decision = await this.decideRunningComposerTabAction("switch", nextId);
          if (decision === "cancel") return;
          if (decision === "new-tab") {
            await this._commandService.executeCommand(K0t, nextId, {
              openInNewTab: true,
            });
            return;
          }
        }
        await this._commandService.executeCommand(K0t, nextId);
      }
    }
  }

  async selectPrevComposer() {
    await this.selectNextComposer(true);
  }

  // ============================================================
  // Diff computation utilities
  // ============================================================

  async computeDiff(originalContent, newContent, options) {
    if (originalContent === newContent) return [];

    const result = await this.computeLinesDiffWithSemaphore({
      first: originalContent,
      second: newContent,
      options: {
        ignoreTrimWhitespace: false,
        computeMoves: false,
        maxComputationTimeMs: 1000,
        ...(options ?? {}),
      },
    });

    if (result.hitTimeout) return [];

    return result.changes.map((change) => ({
      original: change.original,
      modified: eA(newContent).slice(
        change.modified.startLineNumber - 1,
        change.modified.endLineNumberExclusive - 1
      ),
    }));
  }

  async computeDiffAndFormat(originalContent, newContent, options) {
    if (originalContent === newContent) {
      return new a9t({ chunks: [], hitTimeout: false });
    }

    const result = await this.computeLinesDiffWithSemaphore({
      first: originalContent,
      second: newContent,
      options: {
        ignoreTrimWhitespace: false,
        computeMoves: false,
        maxComputationTimeMs: this._experimentService.getDynamicConfigParam(
          "tool_limits_config",
          "composerDiffMaxComputationTimeMs"
        ),
        ...(options ?? {}),
      },
    });

    if (result.hitTimeout) {
      return new a9t({ chunks: [], hitTimeout: true });
    }

    const chunks = result.changes
      .map((change) => {
        const removedLines = eA(originalContent)
          .slice(
            change.original.startLineNumber - 1,
            change.original.endLineNumberExclusive - 1
          )
          .map((line) => "- " + line);
        const addedLines = eA(newContent)
          .slice(
            change.modified.startLineNumber - 1,
            change.modified.endLineNumberExclusive - 1
          )
          .map((line) => "+ " + line);

        return new g8n({
          diffString: [...removedLines, ...addedLines].join("\n"),
          oldStart: change.original.startLineNumber,
          newStart: change.modified.startLineNumber,
          oldLines:
            change.original.endLineNumberExclusive -
            change.original.startLineNumber,
          newLines:
            change.modified.endLineNumberExclusive -
            change.modified.startLineNumber,
          linesAdded:
            change.modified.endLineNumberExclusive -
            change.modified.startLineNumber,
          linesRemoved:
            change.original.endLineNumberExclusive -
            change.original.startLineNumber,
        });
      })
      .reduce((merged, chunk) => {
        if (merged.length === 0) return [chunk];
        const lastChunk = merged[merged.length - 1];
        if (this.shouldMergeChunks(lastChunk, chunk)) {
          merged[merged.length - 1] = this.mergeChunks(
            lastChunk,
            chunk,
            originalContent,
            newContent
          );
        } else {
          merged.push(chunk);
        }
        return merged;
      }, [])
      .map((chunk) => this.growChunk(chunk, originalContent, newContent));

    return new a9t({ chunks, hitTimeout: false });
  }

  async computeLinesDiffWithSemaphore({ first, second, options }) {
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(new Woe([], [], true));
      }, options.maxComputationTimeMs);
    });

    const diffPromise = this._composerDiffSemaphore.withSemaphore(async () => {
      const firstHash = await a2o(
        Array.isArray(first) ? first.join("\n") : first
      );
      const secondHash = await a2o(
        Array.isArray(second) ? second.join("\n") : second
      );
      const cacheKey = JSON.stringify({
        firstSha1: firstHash,
        secondSha1: secondHash,
      });

      const cached = this._composerDiffCache.get(cacheKey);
      if (cached) return cached;

      const result = await this._editorWorkerService.computeLinesDiff(
        Array.isArray(first) ? first : eA(first),
        Array.isArray(second) ? second : eA(second),
        options
      );

      this._composerDiffCache.set(cacheKey, result);
      return result;
    });

    const result = await Promise.race([diffPromise, timeoutPromise]);

    if (result.hitTimeout) {
      this._metricsService.increment({ stat: "composer.computeLinesDiff.timedOut" });
    }

    return result;
  }

  shouldMergeChunks(chunkA, chunkB) {
    return (
      chunkB.newStart - (chunkA.newStart + chunkA.newLines) <= DIFF_MERGE_GAP_THRESHOLD
    );
  }

  mergeChunks(chunkA, chunkB, originalContent, newContent) {
    const contextLines = eA(newContent)
      .slice(chunkA.newStart + chunkA.newLines - 1, chunkB.newStart - 1)
      .map((line) => "  " + line);

    return new g8n({
      diffString:
        chunkA.diffString +
        (contextLines.length > 0
          ? "\n" + contextLines.join("\n") + "\n"
          : "\n") +
        chunkB.diffString,
      oldStart: chunkA.oldStart,
      newStart: chunkA.newStart,
      oldLines: chunkB.oldStart + chunkB.oldLines - chunkA.oldStart,
      newLines: chunkB.newStart + chunkB.newLines - chunkA.newStart,
      linesRemoved: chunkA.linesRemoved + chunkB.linesRemoved,
      linesAdded: chunkA.linesAdded + chunkB.linesAdded,
    });
  }

  growChunk(chunk, originalContent, newContent) {
    const originalLines = eA(originalContent);
    const newLines = eA(newContent);

    const newStart = Math.max(1, chunk.newStart - DIFF_CONTEXT_LINES);
    const newEnd = Math.min(
      newLines.length + 1,
      chunk.newStart + chunk.newLines + DIFF_CONTEXT_LINES
    );
    const oldStart = Math.max(1, chunk.oldStart - DIFF_CONTEXT_LINES);
    const oldEnd = Math.min(
      originalLines.length + 1,
      chunk.oldStart + chunk.oldLines + DIFF_CONTEXT_LINES
    );

    const beforeContext = newLines
      .slice(newStart - 1, chunk.newStart - 1)
      .map((line) => "  " + line);
    const afterContext = newLines
      .slice(chunk.newStart + chunk.newLines - 1, newEnd - 1)
      .map((line) => "  " + line);
    const chunkLines = chunk.diffString.split("\n");

    return new g8n({
      diffString: [...beforeContext, ...chunkLines, ...afterContext].join("\n"),
      oldStart,
      newStart,
      oldLines: oldEnd - oldStart,
      newLines: newEnd - newStart,
      linesAdded: chunk.linesAdded,
      linesRemoved: chunk.linesRemoved,
    });
  }

  // ============================================================
  // Misc utilities
  // ============================================================

  codeChunkHasFullFileIntent(chunk) {
    return (
      chunk.intent !== void 0 &&
      [gz.COMPOSER_FILE, gz.MENTIONED_FILE].includes(chunk.intent)
    );
  }

  shouldShowCancel(handle) {
    try {
      const composerData = this._composerDataService.getComposerData(handle);
      if (!composerData) return false;

      return (
        this._composerDataService.getPendingUserDecisionGroup(handle).length > 0 ||
        composerData.status === "generating" ||
        this._composerCodeBlockService
          .getCodeBlocksOfStatuses(handle, "applying")
          .filter((cb) => !cb.isNotApplied).length > 0
      );
    } catch (error) {
      console.error("[composer] Error in shouldShowCancel", error);
      return false;
    }
  }

  clearErrorDetailsAndServiceStatusUpdatesFromLatestAIMessages(handle) {
    if (!this._composerDataService.getComposerData(handle)) return;

    const conversation = this._composerDataService.getLoadedConversation(handle);
    for (let i = conversation.length - 1; i >= 0; i--) {
      const msg = conversation[i];
      if (msg.type === ul.AI) {
        if (msg.errorDetails || msg.serviceStatusUpdate) {
          this._composerDataService.updateComposerDataSetStore(handle, (s) =>
            s("conversationMap", msg.bubbleId, "errorDetails", void 0)
          );
          this._composerDataService.updateComposerDataSetStore(handle, (s) =>
            s("conversationMap", msg.bubbleId, "serviceStatusUpdate", void 0)
          );
          break;
        }
      } else {
        break;
      }
    }
  }

  /** Resume conversation from a specific tool former bubble */
  resumeFromToolFormerBubble(handle, bubbleId, afterBubble) {
    const composerData = this._composerDataService.getComposerData(handle);
    if (!composerData)
      throw new Error("[composer] Cannot get bubble for unloaded composer");

    const conversation = this._composerDataService.getLoadedConversation(handle);
    const targetIdx = conversation.findIndex((msg) => msg.bubbleId === bubbleId);
    if (targetIdx === -1)
      throw new Error(`[composer] No message found with bubble ID ${bubbleId}`);

    const targetBubble = this._composerDataService.getComposerBubble(handle, bubbleId);
    if (!targetBubble || targetBubble.type !== ul.AI)
      throw new Error(
        `[composer] Message with bubble ID ${bubbleId} is not an AI message`
      );

    const newHumanBubble = {
      ...d_(),
      text: "",
      context: composerData.context,
      skipRendering: true,
    };

    if (afterBubble) {
      if (targetBubble.afterCheckpointId) {
        newHumanBubble.checkpointId = targetBubble.afterCheckpointId;
      }
    } else if (!afterBubble) {
      if (targetBubble.checkpointId) {
        newHumanBubble.checkpointId = targetBubble.checkpointId;
      }
    } else {
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (conversation[i].checkpointId) {
          newHumanBubble.checkpointId = conversation[i].checkpointId;
          break;
        }
      }
    }

    const insertIdx = targetIdx + (afterBubble ? 1 : 0);
    this._composerDataService.insertComposerBubblesAtIndex(
      handle,
      [newHumanBubble],
      insertIdx
    );

    return newHumanBubble.bubbleId;
  }

  clearText(handle) {
    const composerData = this._composerDataService.getComposerData(handle);
    if (!composerData) return;

    this._composerDataService.updateComposerData(handle, {
      text: "",
      richText: "",
    });
    this._composerEventService.fireShouldForceText({
      composerId: composerData.composerId,
    });
  }

  /** Get the current file open in the editor */
  getCurrentFile() {
    const editor = this._aiFileInfoService.getLastActiveFileEditor();
    if (!editor) return;

    let uri = fp.getOriginalUri(editor.input);
    if (!uri) {
      if (Gpi(editor.input)) {
        uri = editor.input.modified.resource;
      }
      if (!uri) return;
    }

    // Handle git URIs
    if (uri.scheme === _n.git) {
      try {
        const parsed = JSON.parse(uri.query);
        if (parsed && parsed.path) {
          return { uri: je.file(parsed.path), isCurrentFile: true };
        }
      } catch (error) {
        console.error("Failed to parse git URI", error);
      }
    }

    if (this.isCompatibleScheme(uri.scheme)) {
      return { uri, isCurrentFile: true };
    }
  }

  isCompatibleScheme(scheme) {
    return this._composerDataService.isCompatibleScheme(scheme);
  }

  isComposerEmpty(handle) {
    let composerData;
    try {
      composerData = this._composerDataService.getComposerData(handle);
    } catch (error) {
      console.warn("tried to check if composer is empty but missing composer", error);
      return false;
    }

    if (!composerData) return false;
    if (composerData.isSpec || composerData.isProject) return false;
    if (composerData.createdFromBackgroundAgent?.bcId) return false;

    return (
      composerData.fullConversationHeadersOnly.length === 0 &&
      composerData.text.trim() === ""
    );
  }

  async abortGenerationUUID(uuid) {
    const controller = this._aiService.streamingAbortControllers.get(uuid);
    if (controller) {
      controller.abort();
      this._aiService.streamingAbortControllers.delete(uuid);
    }
  }

  getBestOfNGroupId(composerId) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const composerData = handle
      ? this._composerDataService.getComposerData(handle)
      : void 0;

    if (
      composerData &&
      composerData.isBestOfNSubcomposer &&
      composerData.subagentInfo?.parentComposerId
    ) {
      return composerData.subagentInfo.parentComposerId;
    }
    return composerId;
  }

  /** Convert formatted diff chunks back to raw diff entries */
  unformatComposerDiff(formattedDiff) {
    if (
      !formattedDiff.chunks ||
      formattedDiff.chunks.length === 0 ||
      formattedDiff.hitTimeout
    ) {
      return [];
    }

    const results = [];
    for (const chunk of formattedDiff.chunks) {
      const lines = chunk.diffString.split("\n");
      let lineNum = chunk.oldStart;
      let removedLines = [];
      let addedLines = [];
      let startLine = null;

      const flush = () => {
        if (startLine !== null) {
          const range = new rh(startLine - 1, lineNum - 1);
          results.push({ original: range, modified: [...addedLines] });
          removedLines = [];
          addedLines = [];
          startLine = null;
        }
      };

      for (const line of lines) {
        if (line.startsWith("- ")) {
          if (startLine === null) startLine = lineNum;
          removedLines.push(line.substring(2));
          lineNum += 1;
        } else if (line.startsWith("+ ")) {
          if (startLine === null) startLine = lineNum;
          addedLines.push(line.substring(2));
        } else if (line.startsWith("  ")) {
          flush();
          lineNum += 1;
        } else {
          flush();
        }
      }
      flush();
    }

    return results;
  }

  async measureCapabilityExecution({ process, capabilityName, parentSpanCtx, capabilityFn }) {
    const start = performance.now();
    let result;
    const span = parentSpanCtx?.startSpan(
      `composerCapability.${process}.${capabilityName}`
    );

    try {
      result = await capabilityFn();
      return result;
    } catch (error) {
      throw error;
    } finally {
      const duration = performance.now() - start;
      span?.end();
      this._metricsService.distribution({
        stat: "composer.runCapabilities",
        value: duration,
        tags: { capability: capabilityName, process },
      });
    }
  }

  /** Get diffs from a subagent's code blocks */
  async getDiffsFromSubagent(parentComposerId, subagentComposerId) {
    const diffs = [];
    const subHandle = this._composerDataService.getHandleIfLoaded(subagentComposerId);
    const subData = subHandle
      ? this._composerDataService.getComposerData(subHandle)
      : void 0;
    if (!subData) return diffs;

    const parentHandle = this._composerDataService.getHandleIfLoaded(parentComposerId);
    const parentData = parentHandle
      ? this._composerDataService.getComposerData(parentHandle)
      : void 0;
    if (!parentData || !parentHandle) return diffs;

    for (const [uriStr] of Object.entries(subData.codeBlockData)) {
      try {
        const uri = je.parse(uriStr);
        const parentComposerData = this._composerDataService.getComposerData(parentHandle);

        if (!(await this._composerFileService.exists({ uri, composerData: parentComposerData })))
          continue;
        if (uri.path.endsWith(".ipynb")) continue;

        const currentSubHandle = this._composerDataService.getHandleIfLoaded(subagentComposerId);
        if (!currentSubHandle) continue;

        const lastApplied = this._composerCodeBlockService.getLastAppliedCodeBlock(
          currentSubHandle,
          uri
        );
        if (!lastApplied) continue;

        const originalLines = this._composerCodeBlockService.getCodeBlockV0ModelLines(
          currentSubHandle,
          uri
        );
        const newLines =
          await this._composerCodeBlockService.getCodeBlockNewModelLines(
            currentSubHandle,
            uri,
            lastApplied.codeblockId
          );

        if (!originalLines || !newLines) continue;

        const originalContent = originalLines.join("\n");
        const newContent = newLines.join("\n");
        if (originalContent === newContent) continue;

        const formattedDiff = await this.computeDiffAndFormat(
          originalContent,
          newContent
        );
        const relativePath = this._workspaceContextService.asRelativePath(uri);

        diffs.push({ filePath: relativePath, diff: formattedDiff, uri });
      } catch (error) {
        console.error(
          "[ComposerUtilsService] Failed computing diff for",
          uriStr,
          error
        );
        continue;
      }
    }

    return diffs;
  }

  /**
   * Deep clone a composer and all its associated data (conversation state,
   * checkpoints, code block diffs, message request contexts, blob storage).
   * Used for branching/duplicating conversations.
   */
  async deepCloneComposer(sourceData, newId, options) {
    // [Large deep-clone implementation preserved from original]
    // Creates a deep copy of the composer with new IDs for all:
    // - Bubble IDs (conversation messages)
    // - Server bubble IDs
    // - Conversation state blobs
    // - Checkpoints
    // - Code block diffs
    // - Message request contexts
    // - Subagent/TASK_V2 composers
    // - Sub-composers
    //
    // Also handles:
    // - Status normalization (running/loading -> cancelled)
    // - Capability re-instantiation
    // - Blob upload notification for clone
    newId = newId ?? Gr();

    const visited = new WeakMap();
    const deepClone = (obj) => {
      if (obj === null || typeof obj !== "object") return obj;
      const unwrapped = kSt(obj);
      if (unwrapped instanceof je) return unwrapped;
      if (unwrapped instanceof re) return unwrapped.clone();
      if (unwrapped instanceof Uint8Array) return new Uint8Array(unwrapped);
      if (visited.has(unwrapped)) return visited.get(unwrapped);

      if (Array.isArray(unwrapped)) {
        const arr = [];
        visited.set(unwrapped, arr);
        for (const item of unwrapped) arr.push(deepClone(item));
        return arr;
      }

      const clone = {};
      visited.set(unwrapped, clone);
      for (const [key, value] of Object.entries(unwrapped)) {
        clone[key] = deepClone(value);
      }
      return clone;
    };

    const normalizeStatus = (status) =>
      status === "running" || status === "loading" ? "cancelled" : status;

    const unwrapped = kSt(sourceData);
    const { capabilities, conversationActionManager, ...rest } = unwrapped;
    const sourceComposerId = unwrapped.composerId;
    const conversationMap = unwrapped.conversationMap;

    // Clone with TASK_V2 subagent normalization
    let dataToClone = rest;
    if (conversationMap) {
      const clonedMap = {};
      for (const [bubbleId, bubble] of Object.entries(conversationMap)) {
        const tfData = bubble.toolFormerData;
        if (tfData && tfData.tool === on.TASK_V2) {
          const additionalData = tfData.additionalData;
          const subComposerData = additionalData?.composerData;
          if (subComposerData) {
            const sub = kSt(subComposerData);
            const { capabilities: subCaps, conversationActionManager: subCam, ...subRest } = sub;
            const stripped = { ...subRest, capabilities: [] };
            const status = normalizeStatus(additionalData?.status ?? "pending");
            clonedMap[bubbleId] = {
              ...bubble,
              toolFormerData: {
                ...tfData,
                additionalData: {
                  ...(additionalData ?? { status }),
                  status,
                  composerData: stripped,
                },
              },
            };
            continue;
          }
        }
        clonedMap[bubbleId] = bubble;
      }
      dataToClone = { ...rest, conversationMap: clonedMap };
    }

    const cloned = {
      ...Q9(unwrapped.modelConfig, newId),
      ...deepClone(dataToClone),
    };
    cloned.composerId = newId;
    if (cloned.status === "generating") cloned.status = "aborted";

    // Remap bubble IDs
    const bubbleIdMap = new Map();
    const serverBubbleIdMap = new Map();
    const remappedConversationMap = {};

    for (const [oldId, bubble] of Object.entries(cloned.conversationMap)) {
      const newBubbleId = Gr();
      bubbleIdMap.set(oldId, newBubbleId);

      if (bubble.serverBubbleId) {
        const newServerBubbleId = Gr();
        serverBubbleIdMap.set(bubble.serverBubbleId, newServerBubbleId);
        bubble.serverBubbleId = newServerBubbleId;
      }

      bubble.bubbleId = newBubbleId;
      remappedConversationMap[newBubbleId] = bubble;
    }
    cloned.conversationMap = remappedConversationMap;

    cloned.fullConversationHeadersOnly = cloned.fullConversationHeadersOnly.map(
      (header) => {
        const newBubbleId = bubbleIdMap.get(header.bubbleId);
        const newServerBubbleId = header.serverBubbleId
          ? serverBubbleIdMap.get(header.serverBubbleId) ?? Gr()
          : void 0;
        return newBubbleId
          ? { ...header, bubbleId: newBubbleId, serverBubbleId: newServerBubbleId }
          : header;
      }
    );

    // Remap code block bubble IDs
    for (const uriStr of Object.keys(cloned.codeBlockData)) {
      for (const block of Object.values(cloned.codeBlockData[uriStr])) {
        if (!block) continue;
        const newBubbleId = bubbleIdMap.get(block.bubbleId);
        if (newBubbleId) block.bubbleId = newBubbleId;
      }
    }

    // Clone conversation state blobs
    const blobStorage = new NLg(this._storageService, newId);
    const blobScopeId = Kk();
    const turnSerializer = new oQ(eYe);
    const messageSerializer = new oQ(jR);
    const blobIdRemaps = new Map();
    const messageRemaps = new Map();

    const toHex = (bytes) =>
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

    const cloneMessageBlob = async (oldBlobId) => {
      const hex = toHex(oldBlobId);
      const existing = messageRemaps.get(hex);
      if (existing) return existing;

      const blob = await blobStorage.getBlob(blobScopeId, oldBlobId);
      if (!blob) throw new Error(`[composer] Missing user message blob (${hex})`);

      const msg = messageSerializer.deserialize(blob);
      const oldMsgId = msg.messageId;
      const newMsgId = bubbleIdMap.get(oldMsgId);

      if (!newMsgId || newMsgId === oldMsgId) {
        messageRemaps.set(hex, oldBlobId);
        return oldBlobId;
      }

      msg.messageId = newMsgId;
      const serialized = messageSerializer.serialize(msg);
      const newBlobId = await dye(serialized);
      await blobStorage.setBlob(blobScopeId, newBlobId, serialized);
      messageRemaps.set(hex, newBlobId);
      return newBlobId;
    };

    const cloneConversationState = async (state = cloned.conversationState) => {
      if (!state?.turns?.length) return;

      for (let i = 0; i < state.turns.length; i++) {
        const turnBlobId = state.turns[i];
        if (!turnBlobId.length) {
          throw new Error(
            "[composer] Missing turn blob id while cloning conversation state"
          );
        }

        const hex = toHex(turnBlobId);
        const existing = blobIdRemaps.get(hex);
        if (existing) {
          state.turns[i] = existing;
          continue;
        }

        const turnBlob = await blobStorage.getBlob(blobScopeId, turnBlobId);
        if (!turnBlob) throw new Error(`[composer] Missing turn blob for ${hex}`);

        const turn = turnSerializer.deserialize(turnBlob);
        if (turn.turn.case !== "agentConversationTurn") continue;

        const agentTurn = turn.turn.value;
        const userMsgBlobId = agentTurn.userMessage;
        if (!userMsgBlobId.length) {
          throw new Error(
            `[composer] Missing user message blob id for turn ${hex}`
          );
        }

        const oldMsgHex = toHex(userMsgBlobId);
        const newMsgBlobId = await cloneMessageBlob(userMsgBlobId);

        if (toHex(newMsgBlobId) === oldMsgHex) {
          blobIdRemaps.set(hex, turnBlobId);
          continue;
        }

        agentTurn.userMessage = Uint8Array.from(newMsgBlobId);
        const serialized = turnSerializer.serialize(turn);
        const newTurnBlobId = await dye(serialized);
        await blobStorage.setBlob(blobScopeId, newTurnBlobId, serialized);
        blobIdRemaps.set(hex, newTurnBlobId);
        state.turns[i] = newTurnBlobId;
      }
    };

    // Clone all conversation states
    const statesToClone = new Set([cloned.conversationState]);
    for (const bubble of Object.values(cloned.conversationMap)) {
      if (bubble.type === ul.HUMAN) statesToClone.add(bubble.conversationState);
    }
    for (const state of statesToClone) {
      await cloneConversationState(state);
    }

    // Clone checkpoints
    for (const bubble of Object.values(cloned.conversationMap)) {
      for (const key of ["checkpointId", "afterCheckpointId"]) {
        const checkpointId = bubble[key];
        if (checkpointId) {
          try {
            const checkpoint =
              await this._composerCheckpointStorageService.retrieveCheckpoint(
                sourceComposerId,
                checkpointId
              );
            if (!checkpoint) {
              bubble[key] = void 0;
              continue;
            }
            const newCheckpointId =
              await this._composerCheckpointStorageService.storeCheckpoint(
                newId,
                checkpoint
              );
            bubble[key] = newCheckpointId;
          } catch (error) {
            console.error(`[composer] Failed to clone checkpoint (${key}):`, error);
            bubble[key] = void 0;
          }
        }
      }
    }

    // Clone code block diffs
    for (const uriStr of Object.keys(cloned.codeBlockData)) {
      for (const block of Object.values(cloned.codeBlockData[uriStr])) {
        block.applyGenerationUUID = void 0;
        block.latestApplyGenerationUUID = void 0;
        if (block.status === "generating") block.status = "completed";
        if (block.status === "applying") block.status = "cancelled";

        if (block.diffId) {
          try {
            const diff =
              await this._composerCodeBlockDiffStorageService.retrieveDiff(
                sourceComposerId,
                block.diffId
              );
            if (diff) {
              const newDiffId =
                await this._composerCodeBlockDiffStorageService.storeDiff(
                  newId,
                  diff
                );
              block.diffId = newDiffId;
            } else {
              block.diffId = void 0;
            }
          } catch (error) {
            console.error("[composer] Failed to clone diff:", error);
            block.diffId = void 0;
          }
        }
      }
    }

    // Clone message request contexts
    const contextClonePromises = [];
    for (const [oldBubbleId, newBubbleId] of bubbleIdMap.entries()) {
      contextClonePromises.push(
        (async () => {
          try {
            const context =
              await this._messageRequestContextStorageService.retrieveContext(
                sourceComposerId,
                oldBubbleId
              );
            if (context) {
              await this._messageRequestContextStorageService.storeContext(
                newId,
                newBubbleId,
                context
              );
            }
          } catch (error) {
            console.error(
              `[composer] Failed to clone message request context for bubble ${oldBubbleId}:`,
              error
            );
          }
        })()
      );
    }
    await Promise.all(contextClonePromises);

    // Clone TASK_V2 subagent data
    if (conversationMap) {
      const taskClonePromises = [];
      for (const [oldBubbleId, bubble] of Object.entries(conversationMap)) {
        const tfData = bubble.toolFormerData;
        if (!tfData || tfData.tool !== on.TASK_V2) continue;

        const subComposerData = tfData.additionalData?.composerData;
        if (!subComposerData) continue;

        const newBubbleId = bubbleIdMap.get(oldBubbleId);
        if (!newBubbleId) continue;

        const clonedBubble = cloned.conversationMap[newBubbleId];
        if (!clonedBubble?.toolFormerData || clonedBubble.toolFormerData.tool !== on.TASK_V2)
          continue;

        taskClonePromises.push(
          (async () => {
            try {
              const subId = `${sit}${Gr()}`;
              const clonedSubData = await this.deepCloneComposer(
                subComposerData,
                subId,
                { skipCapabilities: true }
              );

              // Serialize capabilities
              const serializedCaps = [];
              const sourceCaps = subComposerData.capabilities;
              if (Array.isArray(sourceCaps)) {
                for (const cap of sourceCaps) {
                  if (cap instanceof Dq) {
                    const json = cap.toJSON();
                    serializedCaps.push({
                      type: json.type,
                      data: deepClone(json.data),
                    });
                    continue;
                  }
                  if (cap && typeof cap === "object") {
                    const type = cap.type;
                    const data = cap.data;
                    if (typeof type === "number" && data !== void 0) {
                      serializedCaps.push({ type, data: deepClone(data) });
                    }
                  }
                }
              }
              clonedSubData.capabilities = serializedCaps;

              const clonedTfData = clonedBubble.toolFormerData;
              if (!clonedTfData || clonedTfData.tool !== on.TASK_V2) return;

              const additionalData = clonedTfData.additionalData;
              const status = normalizeStatus(additionalData?.status ?? "pending");
              clonedTfData.additionalData = {
                ...(additionalData ?? { status }),
                status,
                composerData: clonedSubData,
              };
            } catch (error) {
              console.error(
                `[composer] Failed to clone TASK_V2 subagent ${oldBubbleId}:`,
                error
              );
              const status = "cancelled";
              if (
                clonedBubble.toolFormerData &&
                clonedBubble.toolFormerData.tool === on.TASK_V2
              ) {
                const additionalData = clonedBubble.toolFormerData.additionalData;
                clonedBubble.toolFormerData.additionalData = {
                  ...(additionalData ?? { status }),
                  status,
                  composerData: void 0,
                };
              }
            }
          })()
        );
      }
      await Promise.all(taskClonePromises);
    }

    // Clone sub-composers
    const clonedSubComposerIds = [];
    if (sourceData.subComposerIds && sourceData.subComposerIds.length > 0) {
      for (const subId of sourceData.subComposerIds) {
        try {
          const subHandle = await this._composerDataService.getComposerHandleById(subId);
          if (subHandle) {
            const newSubId = Gr();
            clonedSubComposerIds.push(newSubId);
            const clonedSubData = await this.deepCloneComposer(subHandle.data, newSubId);
            await this._composerDataService.appendSubComposer(clonedSubData);
          }
        } catch (error) {
          console.error(`[composer] Failed to clone subComposer ${subId}:`, error);
        }
      }
    }
    cloned.subComposerIds = clonedSubComposerIds;

    // Re-instantiate capabilities
    if (!options?.skipCapabilities) {
      const capabilityData = sourceData.capabilities.map((cap) => ({
        type: cap.type,
        data: deepClone(cap.toJSON().data),
      }));
      cloned.capabilities = sce(this._instantiationService, newId, {
        savedCapabilityData: capabilityData,
      });
    }

    // Notify blob upload service about clone
    if (
      this._experimentService.checkFeatureGate("clone_blob_upload") &&
      this._cursorAuthenticationService.reactivePrivacyMode() !== true
    ) {
      let sourceRequestId = "";
      const headers = sourceData.fullConversationHeadersOnly ?? [];
      for (let i = headers.length - 1; i >= 0; i--) {
        const bubble = sourceData.conversationMap[headers[i].bubbleId];
        if (bubble?.requestId) {
          sourceRequestId = bubble.requestId;
          break;
        }
      }
      if (!sourceRequestId) {
        sourceRequestId = sourceData.latestChatGenerationUUID ?? Gr();
      }

      this._blobUploadService.notifyClone({
        conversationId: cloned.composerId,
        sourceConversationId: sourceData.composerId,
        sourceRequestId,
      });

      const writtenBlobIds = blobStorage.getWrittenBlobIds();
      if (writtenBlobIds.length > 0) {
        this._blobUploadService.enqueue({
          conversationId: cloned.composerId,
          blobIds: writtenBlobIds,
        });
      }
    }

    return cloned;
  }

  /** Extract a text summary from a subagent's conversation */
  async extractSummaryFromSubagent(composerId) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const conversation = handle
      ? this._composerDataService.getLoadedConversation(handle)
      : [];

    if (!conversation || conversation.length === 0) {
      throw new xjl({
        clientVisibleErrorMessage: "Failed to get subagent conversation",
        modelVisibleErrorMessage: "Tool call failed",
        actualErrorMessage: "No conversation found for subagent composer",
      });
    }

    const lastMsg = conversation[conversation.length - 1];
    return lastMsg.type === ul.HUMAN ? "" : lastMsg.text || "Task completed";
  }

  // ============================================================
  // Mode suggestion heuristics
  // ============================================================

  /** Heuristic to suggest plan mode based on input text keywords */
  shouldSuggestPlanMode(text) {
    if (
      !this._composerModesService.getAllModes().find((m) => m.id === "plan") ||
      !text ||
      text.trim().length === 0
    ) {
      return false;
    }

    // Keywords in multiple languages: English, Chinese, Hindi, Spanish, French,
    // Arabic, Bengali, Portuguese, Russian, Japanese
    const keywords = [
      "plan", "planning", "refactor", "migrate", "restructure", "design",
      "architect", "spec", "specify", "outline", "draft", "blueprint",
      "proposal", "roadmap", "strategy", "approach", "steps", "checklist",
      "timeline", "milestones", "phased", "staged", "rollout", "implementation",
      "execution", "workflow", "scope", "estimate", "breakdown", "todo",
      "acceptance criteria", "definition of done",
      // Chinese
      "\u8BA1\u5212", "\u91CD\u6784", "\u8FC1\u79FB", "\u91CD\u7EC4", "\u8BBE\u8BA1",
      "\u65B9\u6848", "\u8DEF\u7EBF\u56FE", "\u6B65\u9AA4", "\u8349\u6848", "\u84DD\u56FE",
      "\u7B56\u7565", "\u5DE5\u4F5C\u6D41", "\u65F6\u95F4\u8868", "\u9636\u6BB5\u6027",
      "\u6267\u884C", "\u8303\u56F4", "\u4F30\u7B97", "\u4EFB\u52A1\u5206\u89E3",
      "\u9A8C\u6536\u6807\u51C6", "\u5B8C\u6210\u5B9A\u4E49",
      // And many more languages...
    ];

    const lower = text.toLowerCase();
    const hasKeyword = keywords.some((kw) => lower.includes(kw));
    const hasSentences = (text.match(/[.!?]+/g) || []).length >= 1;
    const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;

    return !!(hasKeyword || hasSentences || wordCount >= 35);
  }

  shouldSuggestDebugMode(text) {
    if (
      !this._composerModesService.getAllModes().find((m) => m.id === "debug") ||
      !text ||
      text.trim().length === 0
    ) {
      return false;
    }

    const keywords = ["debug", "bug", "debugging"];
    const lower = text.toLowerCase();
    return !!keywords.some((kw) => lower.includes(kw));
  }

  shouldSuggestReviewCta(handle) {
    return false;
  }

  getPluginKeywordSuggestion(text) {
    const pluginsCache = this._pluginsProviderService.pluginsCache.get();
    const allPlugins = pluginsCache?.allMarketplacePlugins ?? [];
    const installedIds = new Set(
      (pluginsCache?.installedPlugins ?? []).map((p) => p.plugin.id)
    );
    return Oty(text, allPlugins, installedIds);
  }

  getPrimaryAssociatedBranchFromHeader(header) {
    if (header.activeBranch?.branchName) return header.activeBranch.branchName;
    if (header.prUrl) return header.prBranchName;
    if (header.committedToBranch) return header.committedToBranch;
    if (header.lastMessageSentOnBranch) return header.lastMessageSentOnBranch;
    return header.createdOnBranch;
  }
};

// Method-level tracing decorators
__decorate([Hs("ComposerUtilsService.decideRunningComposerTabAction")], ComposerUtilsService.prototype, "decideRunningComposerTabAction", null);
__decorate([Hs("ComposerUtilsService.ensureCapabilitiesAreLoaded")], ComposerUtilsService.prototype, "ensureCapabilitiesAreLoaded", null);
__decorate([Hs("ComposerUtilsService.getShouldWebSearchBeEnabled")], ComposerUtilsService.prototype, "getShouldWebSearchBeEnabled", null);
__decorate([Hs("ComposerUtilsService.getShouldAutoSaveAgenticEdits")], ComposerUtilsService.prototype, "getShouldAutoSaveAgenticEdits", null);
__decorate([Hs("ComposerUtilsService.replacedBubbleForFastEdit")], ComposerUtilsService.prototype, "replacedBubbleForFastEdit", null);
__decorate([Hs("ComposerUtilsService.processConversationForFastEdit")], ComposerUtilsService.prototype, "processConversationForFastEdit", null);
__decorate([Hs("ComposerUtilsService.handleStreamComposer")], ComposerUtilsService.prototype, "handleStreamComposer", null);
__decorate([Hs("ComposerUtilsService.readFileContents")], ComposerUtilsService.prototype, "readFileContents", null);
__decorate([Hs("ComposerUtilsService.getCodeBlockDataFromBubbleId")], ComposerUtilsService.prototype, "getCodeBlockDataFromBubbleId", null);
__decorate([Hs("ComposerUtilsService.removeMessagesAfterBubble")], ComposerUtilsService.prototype, "removeMessagesAfterBubble", null);
__decorate([Hs("ComposerUtilsService.runCapabilitiesForProcess")], ComposerUtilsService.prototype, "runCapabilitiesForProcess", null);
__decorate([Hs("ComposerUtilsService.selectNextComposer")], ComposerUtilsService.prototype, "selectNextComposer", null);
__decorate([Hs("ComposerUtilsService.selectPrevComposer")], ComposerUtilsService.prototype, "selectPrevComposer", null);
__decorate([Hs("ComposerUtilsService.computeDiff")], ComposerUtilsService.prototype, "computeDiff", null);
__decorate([Hs("ComposerUtilsService.computeDiffAndFormat")], ComposerUtilsService.prototype, "computeDiffAndFormat", null);
__decorate([Hs("ComposerUtilsService.growChunk")], ComposerUtilsService.prototype, "growChunk", null);
__decorate([Hs("ComposerUtilsService.shouldShowCancel")], ComposerUtilsService.prototype, "shouldShowCancel", null);
__decorate([Hs("ComposerUtilsService.resumeFromToolFormerBubble")], ComposerUtilsService.prototype, "resumeFromToolFormerBubble", null);
__decorate([Hs("ComposerUtilsService.getCurrentFile")], ComposerUtilsService.prototype, "getCurrentFile", null);
__decorate([Hs("ComposerUtilsService.unformatComposerDiff")], ComposerUtilsService.prototype, "unformatComposerDiff", null);

// DI registration (25 services)
ComposerUtilsService = __decorate(
  [
    __param(0, Fa),   // IComposerDataService
    __param(1, KZ),   // IComposerFileService
    __param(2, Rr),   // IWorkspaceContextService
    __param(3, c_),   // IEditorWorkerService
    __param(4, xu),   // IReactiveStorageService
    __param(5, aie),  // IComposerTextModelService
    __param(6, un),   // IInstantiationService
    __param(7, br),   // ICommandService
    __param(8, YD),   // IUIOverlayService
    __param(9, RA),   // IComposerEventService
    __param(10, gnt), // IAIFileInfoService
    __param(11, sw),  // IComposerViewsService
    __param(12, _$e), // IComposerCodeBlockDiffStorageService
    __param(13, ZE),  // IMetricsService
    __param(14, Ett), // IComposerCheckpointStorageService
    __param(15, Whn), // IMessageRequestContextStorageService
    __param(16, Ji),  // IStorageService
    __param(17, SJ),  // IComposerCodeBlockService
    __param(18, iO),  // IPrettyDialogService
    __param(19, Jv),  // IAIService
    __param(20, DT),  // IComposerModesService
    __param(21, Rl),  // IExperimentService
    __param(22, ag),  // ICursorAuthenticationService
    __param(23, jhu), // IBlobUploadService
    __param(24, Ace), // IPluginsProviderService
  ],
  ComposerUtilsService
);

Ki(IComposerUtilsService, ComposerUtilsService, 1);
