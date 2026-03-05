// Source: out-build/vs/workbench/contrib/composer/browser/composerDataHandle.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

st(), Sr(), zk(), yhn(), _hn(), ySt(), qtt(), oy(), mN(), hf(), hT(), Di(), Ott(), vr(), g3(), Fx(), hD();

// === Timing constants ===
const GC_INTERVAL_MS = 1e3;          // Garbage collection every 1 second
const METRICS_VERSION = 1;
const DIRTY_PERSIST_DELAY_MS = 3e4;  // 30 seconds

// === Composer Data Storage Backend ===
let ComposerDataStorageBackend = class {
  constructor(
    storageService,
    composerCheckpointStorageService,
    composerMessageStorageService,
    composerCodeBlockDiffStorageService,
    modelConfigService,
    metricsService,
    aiServerConfigService
  ) {
    this.storageService = storageService;
    this.composerCheckpointStorageService = composerCheckpointStorageService;
    this.composerMessageStorageService = composerMessageStorageService;
    this.composerCodeBlockDiffStorageService = composerCodeBlockDiffStorageService;
    this.modelConfigService = modelConfigService;
    this.metricsService = metricsService;
    this.aiServerConfigService = aiServerConfigService;
  }

  registerSaveHook(callback) {
    return this.storageService.cursorDiskKVOnShouldSave(callback);
  }

  async load(composerId, log) {
    const { result, logs } = await this.storageService.cursorDiskKVGetWithLogs(
      this.getComposerDataStorageKey(composerId)
    );

    logs.forEach((logEntry) => log(logEntry));
    log(`[composer] getHandle: ${composerId} value=${result ? "exists" : "undefined"}`);

    if (!result) return;

    const deserialized = await ELA(result, {
      composerCheckpointStorageService: this.composerCheckpointStorageService,
      composerMessageStorageService: this.composerMessageStorageService,
      composerCodeBlockDiffStorageService: this.composerCodeBlockDiffStorageService,
      modelConfigService: this.modelConfigService,
      storageService: this.storageService,
    });

    log(`[composer] getHandle: ${composerId} deserialized`);
    deserialized.hasLoaded = false;
    return deserialized;
  }

  async persistLoadedComposer(composerData) {
    const serializeStart = performance.now();
    const serialized = dNg(composerData);
    const serializeTime = performance.now() - serializeStart;

    const kvSetStart = performance.now();
    await this.storageService
      .cursorDiskKVSet(this.getComposerDataStorageKey(composerData.composerId), serialized)
      .catch((err) => {
        __(err, { tags: { client_error_type: "persistLoadedComposer" } });
      });
    const kvSetTime = performance.now() - kvSetStart;

    const isDev =
      this.aiServerConfigService.cachedServerConfig
        .isDevDoNotUseForSecretThingsBecauseCanBeSpoofedByUsers ?? false;
    const tags = {
      "metrics.version": METRICS_VERSION.toString(),
      "user.dev": isDev.toString(),
    };

    this.metricsService.distribution({
      stat: "renderer.composer.persist.serialize_ms",
      value: serializeTime,
      tags: tags,
    });
    this.metricsService.distribution({
      stat: "renderer.composer.persist.kv_set_ms",
      value: kvSetTime,
      tags: tags,
    });

    // Determine which messages need persisting
    let messagesToPersist;
    if (composerData.createdFromBackgroundAgent?.shouldStreamMessages) {
      const kickoffMessageId =
        composerData.agentSessionId !== undefined
          ? composerData.createdFromBackgroundAgent?.kickoffMessageId
          : undefined;
      const kickoffIndex =
        kickoffMessageId !== undefined
          ? composerData.fullConversationHeadersOnly.findIndex(
              (header) =>
                header.bubbleId === kickoffMessageId ||
                header.serverBubbleId === kickoffMessageId
            )
          : -1;

      messagesToPersist = composerData.fullConversationHeadersOnly
        .filter((header, index) => {
          const isBeforeKickoff = kickoffIndex !== -1 && index <= kickoffIndex;
          const hasServerBubbleId =
            header.serverBubbleId !== undefined && header.serverBubbleId.length > 0;
          return isBeforeKickoff || hasServerBubbleId;
        })
        .map((header) => composerData.conversationMap[header.bubbleId])
        .filter((msg) => msg !== undefined);
    } else {
      messagesToPersist = Object.values(composerData.conversationMap);
    }

    if (messagesToPersist.length === 0) return;

    // Persist messages in batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < messagesToPersist.length; i += BATCH_SIZE) {
      const batch = messagesToPersist.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((msg) =>
          this.composerMessageStorageService.storeMessage(composerData.composerId, msg).catch((err) => {
            __(err, { tags: { client_error_type: "persistLoadedComposer" } });
          })
        )
      );
      // Yield to event loop between batches
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  async deleteComposer(composerId) {
    await this.storageService.cursorDiskKVSet(
      this.getComposerDataStorageKey(composerId),
      undefined
    );
  }

  getComposerDataStorageKey(composerId) {
    return cNg(composerId);
  }
};

ComposerDataStorageBackend = __decorate(
  [
    __param(0, Ji),   // IStorageService
    __param(1, Ett),  // IComposerCheckpointStorageService
    __param(2, $tt),  // IComposerMessageStorageService
    __param(3, _$e),  // IComposerCodeBlockDiffStorageService
    __param(4, tx),   // IModelConfigService
    __param(5, ZE),   // IMetricsService
    __param(6, P1),   // IAIServerConfigService
  ],
  ComposerDataStorageBackend
);

// === Composer Handle Manager ===
// Manages lifecycle of loaded composer data handles with weak references and garbage collection
let ComposerHandleManager = class extends at {
  constructor(
    backend,
    composerWasLoadedHook,
    composerWasUnloadedHook,
    loadedComposers,
    clientNumericMetricsService
  ) {
    super();
    this.backend = backend;
    this.composerWasLoadedHook = composerWasLoadedHook;
    this.composerWasUnloadedHook = composerWasUnloadedHook;
    this.loadedComposers = loadedComposers;
    this.clientNumericMetricsService = clientNumericMetricsService;

    this.refById = new Map();
    this.metricsTimer = this._register(new boe());
    this.gcIntervalTimer = this._register(new boe());
    this.finalizingComposers = new Set();
    this.dirtyComposers = new Set();
    this.dirtyPersistScheduler = this._register(
      new qu(() => this.doDirtyPersistWhenIdle(), DIRTY_PERSIST_DELAY_MS)
    );
    this.runDirtyPersistWhenIdle = this._register(new lo());

    // Register save hook for shutdown persistence
    const saveHookDisposable = this.backend.registerSaveHook?.(async (reason) => {
      if (reason !== bW.SHUTDOWN) return;

      const allComposers = eS(this.loadedComposers.byId);
      await Promise.allSettled([
        ...Object.values(allComposers).map((composer) =>
          this.persistLoadedComposer(composer).catch((err) => {
            __(err, { tags: { client_error_type: "persistLoadedComposer" } });
          })
        ),
      ]);
      this.dirtyComposers.clear();
    });
    if (saveHookDisposable) this._register(saveHookDisposable);

    // Periodic metrics reporting
    this.metricsTimer.cancelAndSet(() => {
      this.clientNumericMetricsService.report(
        "client.loadedComposers.ids.length",
        this.loadedComposers.ids.length
      );
      this.clientNumericMetricsService.report("client.refById.size", this.refById.size);
      this.clientNumericMetricsService.report(
        "client.dirtyComposers.size",
        this.dirtyComposers.size
      );
    }, 6e4); // every 60 seconds

    // Periodic garbage collection
    this.gcIntervalTimer.cancelAndSet(() => {
      this.runGarbageCollection();
    }, GC_INTERVAL_MS);

    this.dirtyPersistScheduler.schedule();
  }

  dispose() {
    super.dispose();
    this.gcIntervalTimer.dispose();
    this.metricsTimer.dispose();
    this.dirtyPersistScheduler.dispose();
    this.runDirtyPersistWhenIdle.dispose();
  }

  doDirtyPersistWhenIdle() {
    this.runDirtyPersistWhenIdle.value = qze(() => {
      this.persistDirtyComposers();
      this.dirtyPersistScheduler.schedule();
    });
  }

  markDirty(composerId) {
    this.dirtyComposers.add(composerId);
  }

  async persistDirtyComposers() {
    if (this.dirtyComposers.size === 0) return;

    const dirtyIds = [...this.dirtyComposers];
    this.dirtyComposers.clear();

    const allComposers = eS(this.loadedComposers.byId);
    await Promise.allSettled(
      dirtyIds.map(async (composerId) => {
        const composer = allComposers[composerId];
        if (composer) {
          await this.persistLoadedComposer(composer).catch((err) => {
            this.dirtyComposers.add(composerId);
            __(err, { tags: { client_error_type: "persistDirtyComposer" } });
          });
        }
      })
    );
  }

  runGarbageCollection() {
    const staleRefs = [];
    for (const [composerId, entry] of this.refById) {
      if (entry.type === "REF" && !entry.ref.deref()) {
        staleRefs.push({
          composerId: composerId,
          deleteOnUnload: entry.deleteOnUnload,
        });
      }
    }

    for (const { composerId, deleteOnUnload } of staleRefs) {
      const current = this.refById.get(composerId);
      if (current?.type === "REF" && !current.ref.deref()) {
        this.startFinalization(composerId, deleteOnUnload).finally(() => {
          if (this.refById.get(composerId)?.type === "FINALIZING") {
            this.refById.delete(composerId);
          }
        });
      }
    }
  }

  startFinalization(composerId, deleteOnUnload) {
    const promise = this.finalizeComposer(composerId, deleteOnUnload);
    this.refById.set(composerId, { type: "FINALIZING", promise: promise });
    return promise;
  }

  async finalizeComposer(composerId, deleteOnUnload) {
    if (this.finalizingComposers.has(composerId)) {
      const error = new Error(
        `[composer] Invariant violation: double finalization for composer: ${composerId}`
      );
      console.error(error.message);
      __(error, {
        tags: {
          client_error_type: "composer_invariant_violation",
          force_upload: "forced",
        },
      });
      return;
    }

    const composerData = eS(this.loadedComposers.byId)[composerId];
    if (composerData) {
      this.finalizingComposers.add(composerId);
      try {
        xLA(composerData);
        this.composerWasUnloadedHook(composerId);
        this.loadedComposers.delete(composerId);

        if (deleteOnUnload) {
          await this.backend.deleteComposer(composerId);
        } else if (!sua(composerData)) {
          await this.backend.persistLoadedComposer(composerData);
        }
      } finally {
        this.finalizingComposers.delete(composerId);
      }
    }
  }

  async persistLoadedComposer(composerData) {
    await this.backend.persistLoadedComposer(composerData);
  }

  getHandleIfLoaded(composerId) {
    const entry = this.refById.get(composerId);
    if (entry?.type === "REF") {
      const handle = entry.ref.deref();
      if (handle) return handle;
    }
  }

  getComposerDataIfLoaded(composerId) {
    return rc(() => this.loadedComposers.byId[composerId]);
  }

  pushComposer(composerData) {
    if (!this.refById.has(composerData.composerId)) {
      this.registerComposer(composerData);
    }
  }

  createHandle(composerId) {
    return new ComposerDataHandle(composerId, this);
  }

  createWeakRef(handle) {
    return new WeakRef(handle);
  }

  registerComposer(composerData) {
    const handle = this.createHandle(composerData.composerId);

    // Truncate text if too long (MAX_INPUT_LENGTH = 1e5)
    if (composerData.text.length > fJl) {
      composerData.text = "";
      composerData.richText = "";
    }

    this.refById.set(composerData.composerId, {
      type: "REF",
      ref: this.createWeakRef(handle),
      deleteOnUnload: false,
    });

    this.loadedComposers.add(composerData);
    this.composerWasLoadedHook(handle.data);
    return handle;
  }

  async deleteComposer(composerId) {
    const entry = this.refById.get(composerId);

    if (entry?.type === "REF") {
      await this.startFinalization(composerId, true);
      this.refById.delete(composerId);
    } else if (entry?.type === "LOADING") {
      entry.deleteOnUnload = true;
    } else if (entry?.type === "FINALIZING") {
      await entry.promise;
      await this.backend.deleteComposer(composerId);
    } else {
      await this.backend.deleteComposer(composerId);
    }
  }

  async getHandle(composerId, log) {
    const disposables = { stack: [], error: undefined, hasError: false };
    try {
      const perfMarker = __addDisposableResource(disposables, WP("getHandle"), false);
      log = log ?? (() => {});

      const existing = this.refById.get(composerId);

      if (existing?.type === "LOADING") {
        return existing.promise;
      }

      if (existing?.type === "FINALIZING") {
        await existing.promise;
      } else if (existing?.type === "REF") {
        const handle = existing.ref.deref();
        if (handle) return handle;
        await this.startFinalization(composerId, existing.deleteOnUnload);
      }

      const current = this.refById.get(composerId);
      if (current?.type === "LOADING") return current.promise;
      if (current?.type === "REF") {
        const handle = current.ref.deref();
        if (handle) return handle;
      }

      const loadPromise = this.loadFromStorage(composerId, log);
      this.refById.set(composerId, { type: "LOADING", promise: loadPromise });
      return loadPromise;
    } catch (err) {
      disposables.error = err;
      disposables.hasError = true;
    } finally {
      __disposeResources(disposables);
    }
  }

  async loadFromStorage(composerId, log) {
    const fallbackError = new Error("getHandle returned undefined");
    try {
      const data = await this.backend.load(composerId, log);

      if (data) {
        const entry = this.refById.get(composerId);
        if (entry?.type === "LOADING" && entry.deleteOnUnload) {
          log(`[composer] getHandle: ${composerId} delete requested during load`);
          await this.backend.deleteComposer(composerId);
          this.refById.delete(composerId);
          return;
        }
        return this.registerComposer(data);
      }

      this.refById.delete(composerId);
      __(fallbackError);
      return;
    } catch (err) {
      log(`[composer] getHandle: ${composerId} error=${err.stack}`);
      this.refById.delete(composerId);
      console.error("[composer] Error loading composer data:", err);
      return;
    }
  }
};

ComposerHandleManager = __decorate(
  [__param(4, y$e)],  // IClientNumericMetricsService
  ComposerHandleManager
);

// === Composer Data Handle ===
// A lightweight handle that references loaded composer data through the manager
class ComposerDataHandle {
  constructor(composerId, manager) {
    this.composerId = composerId;
    this.manager = manager;
    this.isDisposed = false;

    this.setData = (...args) => {
      if (!rc(() => this.manager.loadedComposers.byId[this.composerId])) {
        console.warn(
          "[composer] Attempting to set data on unloaded composer:",
          this.composerId
        );
        return;
      }
      this.manager.loadedComposers.update(this.composerId, ...args);
      this.manager.markDirty(this.composerId);
    };
  }

  get data() {
    const data = rc(() => this.manager.loadedComposers.byId[this.composerId]);
    if (!data) {
      throw new Error("[composer] No loaded composer found");
    }
    return data;
  }

  dispose() {}
  [Symbol.dispose]() { this.dispose(); }
  clone() { return this; }
}

// === Standalone Composer Data Handle ===
// A handle that directly wraps composer data without manager dependency
class StandaloneComposerDataHandle {
  constructor(loadedComposerData) {
    this.isDisposed = false;
    this.loadedComposerData = loadedComposerData;
    this.setData = (...args) => {
      this.loadedComposerData[1](...args);
    };
  }

  get composerId() {
    return this.loadedComposerData[0].composerId;
  }

  clone() {
    return new StandaloneComposerDataHandle(this.loadedComposerData);
  }

  dispose() {
    this.isDisposed = true;
  }

  get data() {
    return this.loadedComposerData[0];
  }

  [Symbol.dispose]() { this.dispose(); }
}
