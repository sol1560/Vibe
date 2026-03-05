/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/cloudAgentStorageService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Y9(), K5o(), IC(), Vk(), st(), TXA(), Sr(), vye(), Qt(), Er(), Gw(), VZ(), Ux(), dp();

// --- Constants ---
const CLOUD_AGENT_METADATA_KEY = "cloudAgent:metadata"; // uhu
const METADATA_VERSION = 1; // v_a

// --- StateCache ---
// Per-bcId cache for cloud agent metadata and conversation state blobs.
const StateCache = class { // O0f
  getMetadata() {
    return this.metadata;
  }

  setMetadata(metadata) {
    this.metadata = metadata;
  }

  setState(blobIdHex, state) {
    this.currentStateBlobIdHex = blobIdHex;
    this.currentState = state;
  }

  getState(blobIdHex) {
    if (this.currentStateBlobIdHex === blobIdHex) {
      return this.currentState;
    }
  }

  clear() {
    this.metadata = undefined;
    this.currentStateBlobIdHex = undefined;
    this.currentState = undefined;
  }
};

// --- Service Identifier ---
const ICloudAgentStorageService = Bi("cloudAgentStorageService"); // gwi — createDecorator

// --- Constants ---
const MAX_BLOB_WRITE_QUEUE_SIZE = 50; // U0f

// --- CloudAgentStorageService ---
// Manages persistent storage for cloud-based agent sessions.
// Stores conversation state, metadata, and blob data using a
// blob store per composer and per background-composer ID (bcId).
const CloudAgentStorageService = class extends at { // Disposable
  constructor(
    storageService,          // IStorageService
    structuredLogService,    // IStructuredLogService
    composerDataService      // IComposerDataService
  ) {
    super();
    this.storageService = storageService;
    this.structuredLogService = structuredLogService;
    this.composerDataService = composerDataService;

    this.composerBlobStores = new Map();
    this.stateCachesByBcId = new Map();
    this.metadataProperties = new Map();
    this.cloudAgentStateProperties = new Map();
    this.bcIdToComposerId = new Map();
    this.blobWriteQueuesByComposerId = new Map();
    this.pendingWritesByComposerId = new Map();
  }

  getComposerBlobStore(bcId, composerId) {
    if (!this.bcIdToComposerId.has(bcId)) {
      this.bcIdToComposerId.set(bcId, composerId);
    } else {
      const existingComposerId = this.bcIdToComposerId.get(bcId);
      if (existingComposerId !== composerId) {
        this.structuredLogService.warn(
          "background_composer",
          "bcId has multiple composerIds",
          { bcId, existingComposerId, composerId }
        );
      }
    }

    let store = this.composerBlobStores.get(composerId);
    if (store === undefined) {
      store = new Z4(this.storageService, composerId); // ComposerBlobStore
      this.composerBlobStores.set(composerId, store);
    }
    return store;
  }

  getStateCache(bcId) {
    let cache = this.stateCachesByBcId.get(bcId);
    if (cache === undefined) {
      cache = new StateCache();
      this.stateCachesByBcId.set(bcId, cache);
    }
    return cache;
  }

  // --- Metadata ---

  async getMetadataIfExists(bcId) {
    const cached = this.getStateCache(bcId).getMetadata();
    if (cached !== undefined && cached.version === METADATA_VERSION) return cached;

    const storageKey = F0f(bcId, CLOUD_AGENT_METADATA_KEY); // buildStorageKey
    const rawData = await this.storageService.cursorDiskKVGet(storageKey);
    if (!rawData) return;

    const metadata = ohu.fromBinary(V3n.dec(rawData)); // CloudAgentMetadata.fromBinary(base64Decode)
    if (metadata.version === METADATA_VERSION) {
      this.getStateCache(bcId).setMetadata(metadata);
      return metadata;
    }
  }

  async getMetadata(bcId) {
    const metadata = await this.getMetadataIfExists(bcId);
    if (metadata === undefined) {
      throw new Error(`Metadata not found for bcId: ${bcId}`);
    }
    return metadata;
  }

  async setMetadata(bcId, metadata) {
    const storageKey = F0f(bcId, CLOUD_AGENT_METADATA_KEY);
    await this.storageService.cursorDiskKVSet(
      storageKey,
      V3n.enc(metadata.toBinary()) // base64Encode
    );
    this.getStateCache(bcId).setMetadata(metadata);
  }

  async getMetadataAsync(bcId) {
    return this.getMetadata(bcId);
  }

  getMetadataProperty(bcId) {
    let property = this.metadataProperties.get(bcId);
    if (property) return property;

    property = new j_("not_loaded"); // ObservableValue
    this.metadataProperties.set(bcId, property);

    (async () => {
      const metadata = await this.getMetadataIfExists(bcId);
      if (metadata) property.change(metadata);
    })();

    return property;
  }

  // --- Blob Operations ---

  async getBlob(params) {
    const { bcId, composerId, blobId } = params;
    return await this.getComposerBlobStore(bcId, composerId).getBlob(
      Kk(), // getCancellationToken
      blobId
    );
  }

  async storePreFetchedBlobs(params) {
    const { bcId, composerId, blobs } = params;
    if (blobs.length === 0) return;

    const store = this.getComposerBlobStore(bcId, composerId);
    const queue = this.getBlobWriteQueue(composerId);
    const token = Kk(); // getCancellationToken

    await queue.enqueueList(blobs, async blob => {
      await store.setBlob(token, blob.id, blob.value);
    });
  }

  getBlobWriteQueue(composerId) {
    let queue = this.blobWriteQueuesByComposerId.get(composerId);
    if (queue) return queue;

    queue = new EIg({ max: MAX_BLOB_WRITE_QUEUE_SIZE }); // ConcurrencyLimiter
    this.blobWriteQueuesByComposerId.set(composerId, queue);
    return queue;
  }

  getPendingWrites(composerId) {
    let writes = this.pendingWritesByComposerId.get(composerId);
    if (writes) return writes;

    writes = new Set();
    this.pendingWritesByComposerId.set(composerId, writes);
    return writes;
  }

  enqueueSetBlobs(params) {
    const { bcId, composerId, blobs } = params;
    if (blobs.length === 0) return;

    const store = this.getComposerBlobStore(bcId, composerId);
    const queue = this.getBlobWriteQueue(composerId);
    const pending = this.getPendingWrites(composerId);
    const token = Kk();

    for (const blob of blobs) {
      const writePromise = queue.enqueue(async () => {
        await store.setBlob(token, blob.id, blob.value);
      }).catch(error => {
        this.structuredLogService.error(
          "background_composer",
          "Error in enqueueSetBlobs",
          error,
          { bcId, composerId }
        );
      }).finally(() => {
        pending.delete(writePromise);
      });
      pending.add(writePromise);
    }
  }

  async waitForPendingWrites(params) {
    const { composerId } = params;
    const pending = this.pendingWritesByComposerId.get(composerId);
    if (!pending || pending.size === 0) return;
    await Promise.all(pending);
  }

  // --- Cloud Agent State ---

  async getCloudAgentStateFromDiskOrCache(params, blobId) {
    const { bcId, composerId } = params;
    const blobIdHex = sQ(blobId); // toHexString

    const cached = this.getStateCache(bcId).getState(blobIdHex);
    if (cached !== undefined) return cached;

    const blobData = await this.getBlob({ bcId, composerId, blobId });
    if (blobData === undefined) {
      throw new Error(
        `Cloud agent state blob not found for bcId: ${bcId}, composerId: ${composerId}`
      );
    }

    const state = pwi.fromBinary(blobData); // CloudAgentState.fromBinary
    this.getStateCache(bcId).setState(blobIdHex, state);
    return state;
  }

  async getPRUrlFromState(params, state) {
    const { bcId, composerId } = params;
    if (!state.prUrl) return;

    const prUrlBlobId = state.prUrl;
    if (!prUrlBlobId) return;

    const blobData = await this.getBlob({ bcId, composerId, blobId: prUrlBlobId });
    if (blobData) return new TextDecoder().decode(blobData);
  }

  async getAgentNameFromState(params, state) {
    const { bcId, composerId } = params;
    if (!state.agentName || state.agentName.length === 0) return;

    const blobData = await this.getBlob({ bcId, composerId, blobId: state.agentName });
    if (blobData) return new TextDecoder().decode(blobData);
  }

  async getBranchNameFromState(params, state) {
    const { bcId, composerId } = params;
    if (!state.branchName || state.branchName.length === 0) return;

    const blobData = await this.getBlob({ bcId, composerId, blobId: state.branchName });
    if (blobData) return new TextDecoder().decode(blobData);
  }

  getNumTurnsFromState(state) {
    return state.conversationState ? state.conversationState.turns.length : 0;
  }

  async getDerivedPropertiesFromState(params, state) {
    const [prUrl, agentName, branchName] = await Promise.all([
      this.getPRUrlFromState(params, state),
      this.getAgentNameFromState(params, state),
      this.getBranchNameFromState(params, state)
    ]);

    const numTurns = this.getNumTurnsFromState(state);
    const baseBranch = state.baseBranch;
    const originalRequestStartTime = state.originalRequestStartUnixMs
      ? new Date(Number(state.originalRequestStartUnixMs))
      : undefined;
    const initialSource = state.initialSource;

    return {
      prUrl,
      numTurns,
      agentName,
      branchName,
      baseBranch,
      originalRequestStartTime,
      initialSource
    };
  }

  getCloudAgentStateProperty(params) {
    const { bcId, composerId } = params;

    let property = this.cloudAgentStateProperties.get(bcId);
    if (property) return property;

    property = new j_("not_loaded"); // ObservableValue
    this.cloudAgentStateProperties.set(bcId, property);

    (async () => {
      const metadata = await this.getMetadataIfExists(bcId);
      if (!metadata || !metadata.cloudAgentStateBlobId) return;

      const state = await this.getCloudAgentStateFromDiskOrCache(
        { bcId, composerId },
        metadata.cloudAgentStateBlobId
      );
      const derivedProps = await this.getDerivedPropertiesFromState(
        { bcId, composerId },
        state
      );
      property.change(derivedProps);
    })();

    return property;
  }

  async getCloudAgentState(params) {
    const { bcId, composerId } = params;
    const metadata = await this.getMetadata(bcId);
    return {
      value: await this.getCloudAgentStateFromDiskOrCache(
        { bcId, composerId },
        metadata.cloudAgentStateBlobId
      ),
      metadata
    };
  }

  async getConversationStateWithLastInteraction(params) {
    const { bcId, composerId } = params;
    const result = await this.getCloudAgentState({ bcId, composerId });
    return {
      value: {
        conversationState: result.value.conversationState,
        lastInteractionUpdateOffsetKey: result.value.lastInteractionUpdateOffsetKey
      },
      metadata: result.metadata
    };
  }

  async updateMetadata(bcId, updates) {
    const existing = await this.getMetadataIfExists(bcId);
    const updated = new ohu({ // CloudAgentMetadata
      cloudAgentStateBlobId: existing?.cloudAgentStateBlobId,
      offsetKey: existing?.offsetKey,
      workflowStatus: existing?.workflowStatus,
      ...updates,
      version: METADATA_VERSION,
      timestampMs: Date.now()
    });
    await this.setMetadata(bcId, updated);
    this.metadataProperties.get(bcId)?.change(updated);
  }

  async saveNewCloudAgentState(params) {
    const disposableStack = { stack: [], error: undefined, hasError: false };
    try {
      const { bcId, composerId, blobId, state, offsetKey } = params;
      const store = this.getComposerBlobStore(bcId, composerId);
      const token = Kk(); // getCancellationToken

      const handle = __addDisposableResource(
        disposableStack,
        await this.composerDataService.getComposerHandleById(composerId),
        false
      );
      if (!handle) {
        throw new Error(`Composer handle not found for composerId: ${composerId}`);
      }

      const binaryState = state.toBinary();
      await store.setBlob(token, blobId, binaryState);

      if (state.conversationState) {
        handle.setData("conversationState", state.conversationState);
      }

      await this.updateMetadata(bcId, {
        cloudAgentStateBlobId: blobId,
        offsetKey
      });

      this.getStateCache(bcId).setState(sQ(blobId), state); // toHexString

      if (this.cloudAgentStateProperties.has(bcId)) {
        const derivedProps = await this.getDerivedPropertiesFromState(
          { bcId, composerId },
          state
        );
        this.cloudAgentStateProperties.get(bcId).change(derivedProps);
      }
    } catch (error) {
      disposableStack.error = error;
      disposableStack.hasError = true;
    } finally {
      __disposeResources(disposableStack);
    }
  }

  async saveNewWorkflowStatus(bcId, status, offsetKey) {
    await this.updateMetadata(bcId, {
      workflowStatus: status,
      offsetKey
    });
  }
};

// --- DI Decoration ---
// @__param(0, IStorageService), @__param(1, IStructuredLogService), @__param(2, IComposerDataService)
__decorate([
  __param(0, Ji),  // Ji = IStorageService
  __param(1, gE),  // gE = IStructuredLogService
  __param(2, Fa)   // Fa = IComposerDataService
], CloudAgentStorageService);

// Register service
Ki(ICloudAgentStorageService, CloudAgentStorageService, 1); // registerSingleton

// --- Symbol Map ---
// gwi  → ICloudAgentStorageService
// A_a  → CloudAgentStorageService
// O0f  → StateCache
// uhu  → CLOUD_AGENT_METADATA_KEY ("cloudAgent:metadata")
// v_a  → METADATA_VERSION (1)
// U0f  → MAX_BLOB_WRITE_QUEUE_SIZE (50)
// Z4   → ComposerBlobStore
// EIg  → ConcurrencyLimiter
// j_   → ObservableValue
// F0f  → buildStorageKey
// ohu  → CloudAgentMetadata (protobuf type)
// pwi  → CloudAgentState (protobuf type)
// V3n  → base64 codec (enc/dec)
// sQ   → toHexString
// Kk   → getCancellationToken
// Ji   → IStorageService
// gE   → IStructuredLogService
// Fa   → IComposerDataService
// at   → Disposable
// Ki   → registerSingleton
// Bi   → createDecorator
