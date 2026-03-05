/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/subagentComposerService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
jNe(), IC(), V9(), ov(), Ov(), Jg(), Jp(), jl(), st(), oa(), Xn(), Nc(), ts(), Er(), Qt(),
Ux(), ls(), RNe(), wI(), k$e(), zk(), dp(), zw(), Fx(), Yu(), mN(), Ig(), FJ(), V_a(),
$0f(), _qe();

// --- Service Identifier ---
const ISubagentComposerService = Bi("subagentComposerService"); // Fwi — createDecorator

// --- SubagentCreationError ---
const SubagentCreationError = class extends Error { // Owi
  constructor(message, composerId) {
    super(message);
    this.composerId = composerId;
    this.name = "SubagentCreationError";
  }
};

// --- SubagentComposerService ---
// Orchestrates subagent (task) creation, execution, background management,
// and lifecycle. Handles spawning subagent composer sessions, running them
// against the AI backend, managing background promises, continuation loops,
// and queued resume operations.
const SubagentComposerService = class extends at { // Disposable, X_a
  constructor(
    composerDataService,      // IComposerDataService
    aiService,                // IAIService
    modelConfigService,       // IModelConfigService
    instantiationService,     // IInstantiationService
    structuredLogService,     // IStructuredLogService
    metricsService,           // IMetricsService
    workspaceContextService,  // IWorkspaceContextService
    pathService,              // IPathService
    backgroundWorkService,    // IBackgroundWorkService
    experimentService,        // IExperimentService
    fileService               // IFileService
  ) {
    super();
    this._composerDataService = composerDataService;
    this._aiService = aiService;
    this._modelConfigService = modelConfigService;
    this._instantiationService = instantiationService;
    this._structuredLogService = structuredLogService;
    this._metricsService = metricsService;
    this._workspaceContextService = workspaceContextService;
    this._pathService = pathService;
    this._backgroundWorkService = backgroundWorkService;
    this._experimentService = experimentService;
    this._fileService = fileService;

    // Lifecycle store manages run states (idle, running, runningWithQueuedResume)
    this._lifecycleStore = new JYg({ // SubagentLifecycleStore
      onStateChange: ({ sessionId, nextState }) => {
        this._syncBackgroundWorkRegistration(sessionId, nextState);
      },
      onQueuedRunReady: ({ sessionId, sourceRunId, queuedResume }) => {
        this._startQueuedResumeRunFromLifecycle(sessionId, sourceRunId, queuedResume);
      }
    });

    this._backgroundPromises = new Map();
    this._backgroundAbortControllers = new Map();
    this._terminationReasonByComposerId = new Map();

    // Register subagent killer with background work service
    this._register(
      this._backgroundWorkService.registerSubagentKiller(async composerId => {
        if (this._lifecycleStore.getState(composerId).status === "idle" &&
            !this._backgroundPromises.has(composerId)) {
          return false;
        }
        this.cancelSubagentTree(composerId);
        return true;
      })
    );
  }

  isLongRunningJobsEnabled() {
    return this._experimentService.checkFeatureGate("long_running_jobs");
  }

  // --- Create or Resume Subagent ---

  async createOrResumeSubagent(options) {
    let handle;
    let composerId = options.resumeAgentId;

    try {
      const inheritedWorktree = this._resolveInheritedGitWorktree(options);

      if (options.resumeAgentId) {
        // Resume existing subagent
        composerId = options.resumeAgentId;
        const existingHandle = await this._composerDataService.getComposerHandleById(composerId);
        if (!existingHandle) {
          throw new SubagentCreationError(
            `Composer not found for resume: ${composerId}`, composerId
          );
        }
        handle = existingHandle;

        if (inheritedWorktree && !handle.data.gitWorktree) {
          this._composerDataService.updateComposerDataSetStore(handle, setter => {
            setter("gitWorktree", { ...inheritedWorktree });
          });
        }

        await this._appendPromptBubbles(handle, {
          prompt: options.prompt,
          toolCallId: options.toolCallId
        });
      } else {
        // Create new subagent
        composerId = Gr(); // generateId
        const modelConfig = {
          ...this._modelConfigService.getModelConfig("composer"),
          modelName: options.modelId
        };
        const composerMode = options.readonly ? "chat" : "agent";
        const initialData = Pdn(inheritedWorktree, Q9(modelConfig, composerId, composerMode));
        // createComposerData + createDefaultComposerData

        const capabilities = sce( // createCapabilities
          this._instantiationService,
          composerId,
          { forceCapabilities: [ko.TOOL_FORMER, ko.THINKING, ko.SUB_COMPOSER] }
        );
        initialData.capabilities = capabilities;

        if (this.isLongRunningJobsEnabled()) {
          if (!options.parentConversationId ||
              options.parentConversationId.trim().length === 0) {
            throw new SubagentCreationError(
              `Missing parentConversationId for subagent spawn (toolCallId: ${options.toolCallId})`,
              composerId
            );
          }
          const parentHandle = this._composerDataService.getHandleIfLoaded(
            options.parentConversationId
          );
          const lineage = this._deriveLineageFromParent(parentHandle);

          initialData.subagentInfo = {
            subagentType: kve.TASK, // SubagentType.TASK
            parentComposerId: options.parentConversationId,
            conversationLengthAtSpawn: 0,
            additionalData: {},
            subagentTypeName: options.subagentType,
            toolCallId: options.toolCallId,
            ...lineage
          };
        } else {
          const parentInfo = this._findParentComposerAndBubble(options.toolCallId);
          if (parentInfo) {
            const lineage = this._deriveLineageFromParent(parentInfo.parentHandle);
            initialData.subagentInfo = {
              subagentType: kve.TASK,
              parentComposerId: parentInfo.parentHandle.data.composerId,
              conversationLengthAtSpawn: 0,
              additionalData: {},
              subagentTypeName: options.subagentType,
              toolCallId: options.toolCallId,
              ...lineage
            };
          }
        }

        const newHandle = await this._composerDataService.appendSubComposer(initialData);
        if (!newHandle) {
          throw new SubagentCreationError("Failed to create subagent composer", composerId);
        }
        handle = newHandle;

        await this._appendPromptBubbles(handle, {
          prompt: options.prompt,
          toolCallId: options.toolCallId
        });
        this._triggerRenameComposer(handle);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SubagentCreationError(message, composerId ?? Gr());
    }

    return handle;
  }

  // --- Run Subagent ---

  async runSubagentWithHandle(options, handle) {
    return this._runSubagent(options, handle);
  }

  async getBackgroundMessage(composerId) {
    const transcriptPath = await this._resolveAndEnsureTranscriptFile(composerId);
    return mty({ transcriptPath }); // readBackgroundMessage
  }

  getLastTerminationReason(composerId) {
    return this._terminationReasonByComposerId.get(composerId);
  }

  notifyBackgroundFailure({ toolCallId, error }) {
    const parentInfo = this._findParentComposerAndBubble(toolCallId);
    if (!parentInfo) return;

    const errorMessage = error || "Subagent failed in background.";
    parentInfo.toolFormer.setBubbleData(parentInfo.bubbleId, {
      status: "error",
      error: new rke({ clientVisibleErrorMessage: errorMessage }), // ToolError
      additionalData: { status: "error" }
    });
  }

  // --- Background Promise Management ---

  registerBackgroundPromise({ composerId, promise, abortController }) {
    const runId = this._lifecycleStore.startRun(composerId, {
      abort: abortController ? () => abortController.abort() : undefined
    });

    const entry = { runId, promise, settled: false };

    promise.then(result => {
      entry.settled = true;
      entry.result = result;
      this._enqueueSubagentCompletion(result);
      this._resolveBackgroundWaiters(entry);
    }, error => {
      entry.settled = true;
      entry.result = {
        success: false,
        composerId,
        error: "Background subagent promise rejected",
        terminationReason: "error"
      };
      this._enqueueSubagentCompletion(entry.result);
      this._resolveBackgroundWaiters(entry);
    });

    this._backgroundPromises.set(composerId, entry);
    if (abortController) {
      this._backgroundAbortControllers.set(composerId, { runId, abortController });
    }

    promise.finally(() => {
      if (this._backgroundPromises.get(composerId)?.runId === runId) {
        this._backgroundPromises.delete(composerId);
      }
      if (this._backgroundAbortControllers.get(composerId)?.runId === runId) {
        this._backgroundAbortControllers.delete(composerId);
      }
      this._lifecycleStore.finishRun(composerId, runId);
      this._releaseLifecycleIfIdle(composerId);
    });
  }

  _enqueueSubagentCompletion(result) {
    if (!this.isLongRunningJobsEnabled()) return;

    const handle = this._composerDataService.getHandleIfLoaded(result.composerId);
    const backgroundItem = this._backgroundWorkService.backgroundWorkItems.value.find(
      item => item.kind === "subagent" && item.id === result.composerId
    );

    const parentId = handle?.data.subagentInfo?.parentComposerId ?? result.composerId;
    const status = result.success
      ? "success"
      : result.terminationReason === "aborted"
        ? "aborted"
        : "error";
    const detail = !result.success && result.error ? result.error : undefined;
    const composerId = backgroundItem?.composerId ?? parentId;

    this._backgroundWorkService.enqueueCompletion({
      composerId,
      taskId: result.composerId,
      kind: "subagent",
      status,
      title: backgroundItem?.title ?? this._resolveBackgroundSubagentTitle(handle),
      ...(detail ? { detail } : {})
    });
  }

  isRunningInBackground({ composerId }) {
    return this._lifecycleStore.isBusy(composerId) ||
      this._backgroundPromises.has(composerId);
  }

  // --- Queued Resume ---

  enqueueOrMergeResumePrompt({
    composerId, prompt, toolCallId, parentConversationId,
    subagentType, modelId, credentials, readonly, continuationConfig
  }) {
    const state = this._lifecycleStore.getState(composerId);
    const targetRunId = (state.status === "running" || state.status === "runningWithQueuedResume")
      ? state.runId
      : this._backgroundPromises.get(composerId)?.runId;

    this._lifecycleStore.queueResume(composerId, {
      queuedResume: {
        prompt, toolCallIds: [toolCallId], runToolCallId: toolCallId,
        parentConversationId, subagentType, modelId, credentials, readonly,
        continuationConfig
      },
      targetRunId,
      mergeQueuedResume: (existing, incoming) => {
        const mergedPrompt = P3A({ // mergePrompts
          existingPrompt: existing.prompt,
          newPrompt: incoming.prompt
        });
        return {
          ...incoming,
          prompt: mergedPrompt,
          parentConversationId: existing.parentConversationId,
          credentials: existing.credentials ?? incoming.credentials,
          toolCallIds: existing.toolCallIds.includes(incoming.runToolCallId)
            ? existing.toolCallIds
            : [...existing.toolCallIds, incoming.runToolCallId]
        };
      }
    });

    this._linkParentToSubagent(toolCallId, composerId);
  }

  // --- Wait for Background Subagent ---

  async waitForBackgroundSubagent({ composerId, abortSignal }) {
    const isLongRunning = this.isLongRunningJobsEnabled();
    const entry = this._backgroundPromises.get(composerId);

    if (entry) {
      if (isLongRunning) return await this._waitForBackgroundEntry(entry, abortSignal);
      const result = await entry.promise;
      if (this._backgroundPromises.get(composerId) === entry) {
        this._backgroundPromises.delete(composerId);
      }
      return result;
    }

    // Search for child subagent
    for (const [childId, childEntry] of this._backgroundPromises) {
      const childHandle = this._composerDataService.getHandleIfLoaded(childId) ??
        await this._composerDataService.getComposerHandleById(childId);
      if (childHandle && childHandle.data.subagentInfo?.parentComposerId === composerId) {
        if (isLongRunning) return await this._waitForBackgroundEntry(childEntry, abortSignal);
        const result = await childEntry.promise;
        if (this._backgroundPromises.get(childId) === childEntry) {
          this._backgroundPromises.delete(childId);
        }
        return result;
      }
    }

    return { success: true, composerId };
  }

  _resolveBackgroundWaiters(entry) {
    const waiters = entry.waiters;
    if (!waiters || waiters.size === 0) return;
    entry.waiters = undefined;

    const result = entry.result;
    if (!result) {
      const error = new Error("Background subagent settled without a result");
      for (const waiter of waiters) waiter.reject(error);
      return;
    }
    for (const waiter of waiters) waiter.resolve(result);
  }

  _waitForBackgroundEntry(entry, abortSignal) {
    if (entry.settled) {
      return entry.result
        ? Promise.resolve(entry.result)
        : Promise.resolve({
            success: false, composerId: "",
            error: "Background subagent settled without a result",
            terminationReason: "error"
          });
    }
    if (abortSignal?.aborted) return Promise.reject(new Error("aborted"));

    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (abortSignal && abortListener) {
          abortSignal.removeEventListener("abort", abortListener);
        }
      };
      const onResolve = result => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };
      const onReject = error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const waiter = { resolve: onResolve, reject: onReject };
      if (!entry.waiters) entry.waiters = new Set();
      entry.waiters.add(waiter);

      let abortListener;
      if (abortSignal) {
        abortListener = () => {
          entry.waiters?.delete(waiter);
          onReject(new Error("aborted"));
        };
        abortSignal.addEventListener("abort", abortListener, { once: true });
      }
    });
  }

  // --- Cancel ---

  cancelSubagentTree(composerId) {
    this._lifecycleStore.abort(composerId);
    this._lifecycleStore.clearQueuedResume(composerId);
    this._releaseLifecycleIfIdle(composerId);
    this._abortComposerRun(composerId);

    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    if (!handle) return;
    const data = this._composerDataService.getComposerData(handle);
    if (!data) return;

    for (const childId of data.subagentComposerIds ?? []) {
      this.cancelSubagentTree(childId);
      this._lifecycleStore.clearQueuedResume(childId);
      this._releaseLifecycleIfIdle(childId);
    }
  }

  // --- Internal: Append Prompt Bubbles ---

  async _appendPromptBubbles(handle, options) {
    const humanBubbleId = Gr(); // generateId
    const aiBubbleId = Gr();

    await this._composerDataService.appendComposerBubbles(handle, [
      {
        ...d_(), // createBubble
        bubbleId: humanBubbleId,
        type: ul.HUMAN, // BubbleType.HUMAN
        text: options.prompt,
        richText: options.prompt,
        createdAt: new Date().toISOString()
      },
      {
        ...d_(),
        bubbleId: aiBubbleId,
        type: ul.AI, // BubbleType.AI
        text: "",
        richText: "",
        createdAt: new Date().toISOString()
      }
    ]);

    this._linkParentToSubagent(options.toolCallId, handle.data.composerId);
  }

  _deriveLineageFromParent(parentHandle) {
    if (!parentHandle) return {};
    const data = this._composerDataService.getComposerData(parentHandle);
    const generationId = data?.chatGenerationUUID ?? data?.latestChatGenerationUUID;
    if (!generationId) return {};

    const rootParentRequestId = data?.subagentInfo?.rootParentRequestId ??
      data?.subagentInfo?.parentRequestId ?? generationId;

    return {
      parentRequestId: generationId,
      rootParentRequestId
    };
  }

  // --- Internal: Run Subagent Against Backend ---

  async _runSubagent(options, handle, extraOptions) {
    const startTime = performance.now();
    const composerId = handle.data.composerId;
    this._terminationReasonByComposerId.delete(composerId);

    const [generationUUID, abortController] = this._aiService.registerNewGeneration({
      generationUUID: Gr(),
      metadata: { type: "composer", textDescription: options.prompt, isNAL: true }
    });

    let abortListener;
    if (options.abortSignal) {
      abortListener = () => abortController.abort();
      options.abortSignal.addEventListener("abort", abortListener);
    }

    try {
      const modelDetails = new Zf({ // ModelDetails
        modelName: options.modelId,
        maxMode: false,
        ...hty(options.credentials) // extractCredentials
      });

      const conversationState = this._composerDataService.getComposerData(handle)
        ?.conversationState ?? new iEe; // ConversationState
      const conversationLengthAtStart = this._composerDataService
        .getLoadedConversation(handle).length;

      this._composerDataService.updateComposerDataSetStore(handle, setter => {
        setter("status", "generating");
        setter("chatGenerationUUID", generationUUID);
        setter("latestChatGenerationUUID", generationUUID);
      });

      const streamContext = y_a( // createStreamContext
        Kk(), this._structuredLogService, this._metricsService
      );

      await this._instantiationService.invokeFunction(
        accessor => accessor.get(gEe) // IAgentStreamService
      ).getAgentStreamResponse(streamContext, {
        modelDetails,
        generationUUID,
        composerHandle: handle,
        abortController,
        startTime,
        conversationState
      });

      this._composerDataService.updateComposerDataSetStore(handle, setter => {
        setter("status", extraOptions?.deferCompletedStatus ? "generating" : "completed");
        setter("chatGenerationUUID", undefined);
        setter("generatingBubbleIds", []);
      });

      this._aiService.streamingAbortControllers.delete(generationUUID);

      const finalMessage = this._extractFinalAssistantMessage(handle);
      const toolCallCount = this._countToolCallsSince(handle, conversationLengthAtStart);

      this._terminationReasonByComposerId.set(composerId, "completed");

      return {
        success: true,
        composerId,
        finalMessage,
        toolCallCount,
        terminationReason: "completed"
      };
    } catch (error) {
      this._composerDataService.updateComposerDataSetStore(handle, setter => {
        setter("status", "aborted");
        setter("chatGenerationUUID", undefined);
        setter("generatingBubbleIds", []);
      });

      this._aiService.streamingAbortControllers.delete(generationUUID);
      const reason = abortController.signal.aborted ? "aborted" : "error";
      this._terminationReasonByComposerId.set(composerId, reason);

      if (abortController.signal.aborted) {
        return {
          success: false,
          composerId,
          error: "Subagent was aborted by the user",
          terminationReason: reason
        };
      }
      return {
        success: false,
        composerId,
        error: error instanceof Error ? error.message : String(error),
        terminationReason: reason
      };
    } finally {
      this._aiService.removeInprogressAIGeneration(generationUUID);
      if (options.abortSignal && abortListener) {
        options.abortSignal.removeEventListener("abort", abortListener);
      }
    }
  }

  // --- Continuation Loop ---

  async runWithContinuation(options, handle, config) {
    const composerId = handle.data.composerId;
    const maxLoops = config.maxLoops > 0 ? config.maxLoops : Infinity;
    const runOptions = { ...options, runInBackground: false };

    let lastResult;
    this._composerDataService.updateComposerDataSetStore(handle, setter => {
      setter("isContinuationInProgress", true);
    });

    try {
      let result = await this._runContinuationLoop(runOptions, handle, config, maxLoops);

      // Collect background children if enabled
      if (config.collectBackgroundChildren && result.success) {
        this._markComposerAsGenerating(handle);
        const maxCollectionRounds = 500;

        for (let i = 0; i < maxCollectionRounds; i++) {
          if (options.abortSignal.aborted) {
            result = {
              success: false,
              composerId,
              error: "Aborted while collecting child results",
              terminationReason: "aborted"
            };
            break;
          }

          const children = await this._collectAvailableChildren(composerId);
          if (children.length === 0) break;

          const message = this._buildChildrenCompletedMessage(
            children,
            config.childrenCompletedMessageTemplate
          );

          await this._appendPromptBubbles(handle, {
            prompt: message,
            toolCallId: options.toolCallId
          });

          result = await this._runContinuationLoop(
            { ...runOptions, prompt: message, resumeAgentId: composerId },
            handle, config, maxLoops
          );

          if (!result.success) break;
        }
      }

      lastResult = result;
      return result;
    } catch (error) {
      lastResult = {
        success: false,
        composerId,
        error: error instanceof Error ? error.message : String(error),
        terminationReason: options.abortSignal.aborted ? "aborted" : "error"
      };
      return lastResult;
    } finally {
      this._finalizeComposerAfterContinuation(
        handle,
        lastResult ?? {
          success: false,
          composerId,
          error: "Subagent continuation exited unexpectedly",
          terminationReason: "error"
        }
      );
    }
  }

  async _runContinuationLoop(options, handle, config, maxLoops) {
    const composerId = handle.data.composerId;
    let idleCount = 0;
    let escapeToken;
    let lastResult;

    for (let i = 0; i < maxLoops; i++) {
      if (i === 0) {
        lastResult = await this._runSubagent(options, handle, { deferCompletedStatus: true });
      } else {
        const nudge = this._computeContinuationNudge(config, idleCount, escapeToken);
        await this._appendPromptBubbles(handle, {
          prompt: nudge,
          toolCallId: options.toolCallId
        });
        lastResult = await this._runSubagent(
          { ...options, prompt: nudge, resumeAgentId: composerId },
          handle,
          { deferCompletedStatus: true }
        );
      }

      if (!lastResult.success) return lastResult;

      const toolCallCount = lastResult.toolCallCount ?? 0;
      const finalMessage = lastResult.finalMessage ?? "";

      // Check if escape token was echoed back (model is done)
      if (escapeToken && finalMessage.includes(escapeToken)) break;

      if (toolCallCount > 0) {
        this._markComposerAsGenerating(handle);
        idleCount = 0;
        escapeToken = undefined;
        continue;
      }

      idleCount++;
      if (idleCount >= config.idleThreshold) {
        escapeToken = `DONE_${this._randomHex(4)}`;
      } else {
        escapeToken = undefined;
      }
      this._markComposerAsGenerating(handle);
    }

    return lastResult ?? {
      success: false,
      composerId,
      error: "No iterations ran",
      terminationReason: "error"
    };
  }

  _markComposerAsGenerating(handle) {
    this._composerDataService.updateComposerDataSetStore(handle, setter => {
      setter("status", "generating");
    });
  }

  _finalizeComposerAfterContinuation(handle, result) {
    const reason = result.terminationReason ?? (result.success ? "completed" : "error");
    this._terminationReasonByComposerId.set(handle.data.composerId, reason);

    this._composerDataService.updateComposerDataSetStore(handle, setter => {
      setter("status", reason === "completed" ? "completed" : "aborted");
      setter("chatGenerationUUID", undefined);
      setter("generatingBubbleIds", []);
      setter("isContinuationInProgress", false);
    });
  }

  _computeContinuationNudge(config, idleCount, escapeToken) {
    if (idleCount >= config.idleThreshold && escapeToken) {
      return config.escapeMessageTemplate
        .replace("{idle_count}", String(idleCount))
        .replace("{escape_token}", escapeToken);
    }
    return config.nudgeMessage;
  }

  // --- Queued Resume Run ---

  async _startQueuedResumeRunFromLifecycle(composerId, runId, queuedResume) {
    const state = this._lifecycleStore.getState(composerId);
    if (state.status === "idle" || state.runId !== runId) return;

    if (await this._startQueuedResumeRun(composerId, runId, queuedResume)) return;

    const updatedState = this._lifecycleStore.getState(composerId);
    if (updatedState.status !== "idle" && updatedState.runId === runId) {
      this._lifecycleStore.finishRun(composerId, runId);
      this._releaseLifecycleIfIdle(composerId);
    }
  }

  async _startQueuedResumeRun(composerId, runId, queuedResume) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId) ??
      await this._composerDataService.getComposerHandleById(composerId);
    if (!handle) {
      this._notifyQueuedResumeFailure(
        queuedResume,
        `Subagent composer not found for queued resume: ${composerId}`
      );
      return false;
    }

    try {
      await this._appendPromptBubbles(handle, {
        prompt: queuedResume.prompt,
        toolCallId: queuedResume.runToolCallId
      });

      const state = this._lifecycleStore.getState(composerId);
      if (state.status === "idle" || state.runId !== runId) return false;

      const abortController = new AbortController();
      const runOptions = {
        abortSignal: abortController.signal,
        toolCallId: queuedResume.runToolCallId,
        parentConversationId: queuedResume.parentConversationId,
        subagentType: queuedResume.subagentType,
        modelId: queuedResume.modelId,
        credentials: queuedResume.credentials,
        prompt: queuedResume.prompt,
        readonly: queuedResume.readonly,
        resumeAgentId: composerId,
        runInBackground: true,
        continuationConfig: queuedResume.continuationConfig
      };

      const runPromise = (queuedResume.continuationConfig
        ? this.runWithContinuation(runOptions, handle, queuedResume.continuationConfig)
        : this.runSubagentWithHandle(runOptions, handle)
      ).catch(error => {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          composerId,
          error: msg,
          terminationReason: "error"
        };
      });

      this.registerBackgroundPromise({
        composerId,
        promise: runPromise,
        abortController
      });

      runPromise.then(result => {
        if (!result.success) {
          this._notifyQueuedResumeFailure(
            queuedResume,
            result.error ?? "Unknown subagent error"
          );
        }
      });

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this._notifyQueuedResumeFailure(queuedResume, msg);
      return false;
    }
  }

  // --- Background Work Sync ---

  _syncBackgroundWorkRegistration(composerId, state = qYg() /* initialState */) {
    if (state.status === "running" || state.status === "runningWithQueuedResume") {
      const handle = this._composerDataService.getHandleIfLoaded(composerId);
      const parentId = handle?.data.subagentInfo?.parentComposerId ?? composerId;
      const title = this._resolveBackgroundSubagentTitle(handle);
      const existingStartTime = this._backgroundWorkService.backgroundWorkItems.value
        .find(item => item.kind === "subagent" && item.id === composerId)?.startTimeMs;

      this._backgroundWorkService.upsertSubagentWork({
        id: composerId,
        kind: "subagent",
        composerId: parentId,
        title,
        startTimeMs: existingStartTime ?? Date.now(),
        subagentComposerId: composerId
      });
      return;
    }
    this._backgroundWorkService.clearSubagentWork(composerId);
  }

  _resolveBackgroundSubagentTitle(handle) {
    const name = handle?.data.name?.trim();
    if (name) return name;

    const toolCallId = handle?.data.subagentInfo?.toolCallId;
    if (toolCallId) {
      const parentInfo = this._findParentComposerAndBubble(toolCallId);
      const params = parentInfo?.toolFormer.getBubbleData(parentInfo.bubbleId)?.params;

      const description = typeof params?.description === "string"
        ? params.description.trim()
        : typeof params?.value?.description === "string"
          ? params.value.description.trim()
          : undefined;
      if (description && description.length > 0) return description;

      const prompt = typeof params?.prompt === "string"
        ? params.prompt.trim()
        : typeof params?.value?.prompt === "string"
          ? params.value.prompt.trim()
          : undefined;
      if (prompt && prompt.length > 0) return eA(prompt)[0]; // getFirstLine
    }

    const typeName = handle?.data.subagentInfo?.subagentTypeName?.trim();
    return typeName || "Background subagent";
  }

  // --- Helper Methods ---

  _releaseLifecycleIfIdle(composerId) {
    if (this._backgroundPromises.has(composerId)) return;
    if (this._lifecycleStore.getState(composerId).status !== "idle") return;
    this._lifecycleStore.release(composerId);
  }

  _abortComposerRun(composerId) {
    const abortEntry = this._backgroundAbortControllers.get(composerId);
    if (abortEntry) {
      abortEntry.abortController.abort();
      this._backgroundAbortControllers.delete(composerId);
    }

    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    if (!handle) return;
    const data = this._composerDataService.getComposerData(handle);
    if (!data?.chatGenerationUUID) return;

    const streamAbort = this._aiService.streamingAbortControllers.get(data.chatGenerationUUID);
    if (streamAbort) {
      streamAbort.abort();
      this._aiService.streamingAbortControllers.delete(data.chatGenerationUUID);
    }
  }

  _notifyQueuedResumeFailure(queuedResume, error) {
    for (const toolCallId of queuedResume.toolCallIds) {
      this.notifyBackgroundFailure({ toolCallId, error });
    }
  }

  async _findChildEntries(parentId) {
    const children = [];
    for (const [childId, entry] of this._backgroundPromises) {
      const childHandle = this._composerDataService.getHandleIfLoaded(childId) ??
        await this._composerDataService.getComposerHandleById(childId);
      if (childHandle && childHandle.data.subagentInfo?.parentComposerId === parentId) {
        children.push({ childId, entry });
      }
    }
    return children;
  }

  async _collectAvailableChildren(parentId) {
    const results = [];
    const children = await this._findChildEntries(parentId);
    if (children.length === 0) return results;

    let settled = children.filter(c => c.entry.settled);
    const unsettled = children.filter(c => !c.entry.settled);

    if (settled.length === 0 && unsettled.length > 0) {
      await Promise.race(unsettled.map(c => c.entry.promise.catch(() => {})));
      settled = children.filter(c => c.entry.settled);
    }

    for (const child of settled) {
      const result = child.entry.result ?? await child.entry.promise;
      if (this._backgroundPromises.get(child.childId) === child.entry) {
        this._backgroundPromises.delete(child.childId);
      }
      results.push({
        agentId: result.composerId ?? child.childId,
        success: result.success,
        finalMessage: result.success ? result.finalMessage ?? "" : result.error ?? "Unknown error"
      });
    }
    return results;
  }

  _buildChildrenCompletedMessage(children, template) {
    const summaries = children.map(child => {
      const status = child.success ? "SUCCESS" : "FAILED";
      return `## Agent ${child.agentId} -- ${status}\n\n${child.finalMessage}`;
    }).join("\n\n---\n\n");
    return template.replace("{summaries}", summaries);
  }

  _randomHex(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  async _resolveAndEnsureTranscriptFile(composerId) {
    try {
      const workspace = this._workspaceContextService.getWorkspace();
      const transcriptsDir = await uqe(workspace, this._pathService); // getTranscriptsDir

      const handle = await this._composerDataService.getComposerHandleById(composerId);
      const parentId = handle?.data.subagentInfo?.parentComposerId;

      const transcriptPath = parentId
        ? dty({ transcriptsDir, parentConversationId: parentId, conversationId: composerId })
        : ESf(transcriptsDir, composerId); // getTranscriptPath

      // Ensure directory exists
      try {
        const dir = je.joinPath(transcriptPath, "..");
        await this._fileService.createFolder(dir);
      } catch { }

      // Ensure file exists
      try {
        if (!await this._fileService.exists(transcriptPath)) {
          await this._fileService.writeFile(transcriptPath, Ps.fromString(""));
        }
      } catch { }

      return transcriptPath.fsPath;
    } catch {
      return;
    }
  }

  _countToolCallsSince(handle, startIndex) {
    const conversation = this._composerDataService.getLoadedConversation(handle);
    let count = 0;
    for (let i = startIndex; i < conversation.length; i++) {
      if (conversation[i].toolFormerData?.tool) count++;
    }
    return count;
  }

  _extractFinalAssistantMessage(handle) {
    const conversation = [...this._composerDataService.getLoadedConversation(handle)];
    for (let i = conversation.length - 1; i >= 0; i--) {
      const bubble = conversation[i];
      if (bubble.type === ul.AI && bubble.text && bubble.text.trim() !== "") {
        return bubble.text;
      }
    }
  }

  _triggerRenameComposer(handle) {
    this._instantiationService.invokeFunction(
      accessor => accessor.get(bM) // IComposerService
    ).renameComposerIfNeeded(handle).catch(error => {
      console.error("[subagentComposerService] Error renaming subagent composer:", error);
    });
  }

  _linkParentToSubagent(toolCallId, subagentComposerId) {
    const parentInfo = this._findParentComposerAndBubble(toolCallId);
    if (!parentInfo) return;

    parentInfo.toolFormer.setBubbleData(parentInfo.bubbleId, {
      additionalData: { subagentComposerId }
    });

    this._composerDataService.updateComposerDataSetStore(
      parentInfo.parentHandle,
      setter => {
        setter("subagentComposerIds", existing => {
          const ids = existing ?? [];
          return ids.includes(subagentComposerId) ? ids : [...ids, subagentComposerId];
        });
      }
    );
  }

  _findParentComposerAndBubble(toolCallId) {
    for (const id of this._composerDataService.getLoadedComposers()) {
      const handle = this._composerDataService.getHandleIfLoaded(id);
      if (!handle) continue;
      const toolFormer = this._composerDataService.getComposerCapability(
        handle, ko.TOOL_FORMER
      );
      if (!toolFormer) continue;
      const bubbleId = toolFormer.getBubbleIdByToolCallId(toolCallId);
      if (bubbleId) {
        return { parentHandle: handle, bubbleId, toolFormer };
      }
    }
  }

  _resolveInheritedGitWorktree(options) {
    const parentHandle = this._findParentComposerAndBubble(options.toolCallId)?.parentHandle ??
      (options.parentConversationId
        ? this._composerDataService.getHandleIfLoaded(options.parentConversationId)
        : undefined);
    if (!parentHandle) return;

    const data = this._composerDataService.getComposerData(parentHandle);
    if (data?.gitWorktree) return data.gitWorktree;

    // Walk up to root composer
    const rootId = this._composerDataService.getRootComposerId(parentHandle.data.composerId);
    if (rootId === parentHandle.data.composerId) return;
    const rootHandle = this._composerDataService.getHandleIfLoaded(rootId);
    if (!rootHandle) return;
    return this._composerDataService.getComposerData(rootHandle)?.gitWorktree;
  }
};

// --- DI Decoration ---
__decorate([
  __param(0, Fa),   // IComposerDataService
  __param(1, Jv),   // IAIService
  __param(2, tx),   // IModelConfigService
  __param(3, un),   // IInstantiationService
  __param(4, gE),   // IStructuredLogService
  __param(5, ZE),   // IMetricsService
  __param(6, Rr),   // IWorkspaceContextService
  __param(7, Rp),   // IPathService
  __param(8, ign),  // IBackgroundWorkService
  __param(9, Rl),   // IExperimentService
  __param(10, Jr)   // IFileService
], SubagentComposerService);

// Register service
Ki(ISubagentComposerService, SubagentComposerService, 1); // registerSingleton

// --- Symbol Map ---
// Fwi  → ISubagentComposerService
// Owi  → SubagentCreationError
// X_a  → SubagentComposerService
// JYg  → SubagentLifecycleStore
// kve.TASK → SubagentType.TASK
// ko.TOOL_FORMER → CapabilityType.TOOL_FORMER
// ko.THINKING → CapabilityType.THINKING
// ko.SUB_COMPOSER → CapabilityType.SUB_COMPOSER
// ul.HUMAN → BubbleType.HUMAN
// ul.AI → BubbleType.AI
// rke  → ToolError
// d_   → createBubble
// Gr   → generateId
// Kk   → getCancellationToken
// Zf   → ModelDetails
// iEe  → ConversationState
// Pdn  → createComposerDataWithWorktree
// Q9   → createDefaultComposerData
// sce  → createCapabilities
// y_a  → createStreamContext
// P3A  → mergePrompts
// eA   → getFirstLine
// uqe  → getTranscriptsDir
// dty  → getSubagentTranscriptPath
// ESf  → getTranscriptPath
// hty  → extractCredentials
// Ps   → VSBuffer
// je   → URI
// Fa   → IComposerDataService
// Jv   → IAIService
// tx   → IModelConfigService
// un   → IInstantiationService
// gE   → IStructuredLogService
// ZE   → IMetricsService
// Rr   → IWorkspaceContextService
// Rp   → IPathService
// ign  → IBackgroundWorkService
// Rl   → IExperimentService
// Jr   → IFileService
// bM   → IComposerService
// gEe  → IAgentStreamService
// at   → Disposable
// Ki   → registerSingleton
// Bi   → createDecorator
