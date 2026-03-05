// Source: out-build/vs/workbench/contrib/composer/browser/composerMessageStorageService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerMessageStorageService — handles CRUD operations
// for composer messages using disk-backed KV storage with performance metrics.

Y9(), IC(), Qt(), st(), jl(), bl(), Er(), Sr(), oy(), g3(), KS(), yhn(), Fx(), hD(), hf(),
  Gk(), VZ(), Ux(), mD(), Jp(), ov(), Wt(), Yu();

/** Metrics version for tracking storage format changes */
const METRICS_VERSION = 1;

/** Whether debug logging is enabled */
const DEBUG_LOGGING_ENABLED = false;

/** Debug logger — only outputs when DEBUG_LOGGING_ENABLED is true */
const debugLog = DEBUG_LOGGING_ENABLED ? console.log : () => {};

const IComposerMessageStorageService = Bi("composerMessageStorageService");

/** Storage key prefix for bubble (message) data */
const STORAGE_KEY_PREFIX = "bubbleId";

/**
 * ComposerMessageStorageService
 *
 * Manages persistent storage of composer conversation messages.
 * Each message is stored as a JSON blob in a disk-backed KV store,
 * keyed by composerId + bubbleId.
 *
 * Features:
 * - Store/retrieve/update/delete individual messages
 * - Batch retrieval for loading conversations
 * - Performance metrics (stringify time, KV set time, total time)
 * - Conversation state encryption support
 * - Corruption detection and error handling
 * - Smart initial message loading (virtualization support)
 */
let ComposerMessageStorageService = class extends at {
  constructor(storageService, structuredLogService, metricsService, aiServerConfigService, experimentService) {
    super();
    this._storageService = storageService;
    this._structuredLogService = structuredLogService;
    this._metricsService = metricsService;
    this._aiServerConfigService = aiServerConfigService;
    this._experimentService = experimentService;
  }

  /**
   * Store a message to disk.
   * Tracks performance metrics for serialization and KV write times.
   * @returns The bubbleId of the stored message
   */
  async storeMessage(composerId, message) {
    const totalStart = performance.now();

    if (!composerId) {
      throw new Error("[composer] composerId is undefined");
    }

    const bubbleId = message.bubbleId;

    // Serialize the message
    const serialized = mNg(message);
    const stringifyStart = performance.now();
    const jsonString = vbi(serialized);
    const stringifyMs = performance.now() - stringifyStart;

    // Write to disk KV store
    const kvSetStart = performance.now();
    await this._storageService.cursorDiskKVSet(
      `${STORAGE_KEY_PREFIX}:${composerId}:${bubbleId}`,
      jsonString
    );
    const kvSetMs = performance.now() - kvSetStart;

    const totalMs = performance.now() - totalStart;

    // Report performance metrics
    const isDev =
      this._aiServerConfigService.cachedServerConfig
        .isDevDoNotUseForSecretThingsBecauseCanBeSpoofedByUsers ?? false;
    const tags = {
      "metrics.version": METRICS_VERSION.toString(),
      "user.dev": isDev.toString(),
    };

    this._metricsService.distribution({
      stat: "renderer.composer.message_storage.store_message.total_ms",
      value: totalMs,
      tags,
    });
    this._metricsService.distribution({
      stat: "renderer.composer.message_storage.store_message.stringify_ms",
      value: stringifyMs,
      tags,
    });
    this._metricsService.distribution({
      stat: "renderer.composer.message_storage.store_message.kv_set_ms",
      value: kvSetMs,
      tags,
    });

    return bubbleId;
  }

  /**
   * Update an existing message by retrieving it, applying a mutator, and saving.
   */
  async updateMessage(composerId, messageId, mutator) {
    if (!messageId || !composerId) {
      throw new Error(
        "[composer] messageId or composerId is undefined" +
          JSON.stringify({ messageId, composerId })
      );
    }

    debugLog(
      "[composer] updating message",
      `${STORAGE_KEY_PREFIX}:${composerId.slice(0, 4)}:${messageId.slice(0, 4)}`
    );

    const existingMessage = await this.retrieveMessage(composerId, messageId);
    if (existingMessage) {
      mutator(existingMessage);
      const serialized = mNg(existingMessage);
      await this._storageService.cursorDiskKVSet(
        `${STORAGE_KEY_PREFIX}:${composerId}:${messageId}`,
        vbi(serialized)
      );
    } else {
      console.error("[composer] No message found for id", messageId);
    }
  }

  /**
   * Retrieve a single message from storage.
   * Handles conversation state decryption and filters out service status messages.
   */
  async retrieveMessage(composerId, messageId) {
    if (!messageId || !composerId) {
      throw new Error(
        "[composer] messageId or composerId is undefined" +
          JSON.stringify({ messageId, composerId })
      );
    }

    debugLog(
      "[composer] retrieving message",
      `${STORAGE_KEY_PREFIX}:${composerId.slice(0, 4)}:${messageId.slice(0, 4)}`
    );

    const rawJson = await this._storageService.cursorDiskKVGet(
      `${STORAGE_KEY_PREFIX}:${composerId}:${messageId}`
    );
    if (!rawJson) return;

    const parsed = JSON.parse(rawJson);
    const message = cpa(parsed);

    // Restore conversation state (may involve decryption)
    message.conversationState = await A2g(
      this._storageService,
      this._structuredLogService,
      composerId,
      messageId,
      parsed.conversationState
    );

    // Filter out service status update messages
    if (message.serviceStatusUpdate && Umi(message.serviceStatusUpdate.message)) {
      return;
    }

    debugLog("[composer] retrieved message", { message });
    return message;
  }

  /**
   * Retrieve multiple messages in batches.
   * @returns Map of messageId → message data
   */
  async retrieveMessagesBatch(composerId, messageIds) {
    return (await this.retrieveMessagesBatchInternal(composerId, messageIds)).messages;
  }

  /**
   * Internal batch retrieval — also reports corruption status.
   */
  async retrieveMessagesBatchInternal(composerId, messageIds) {
    const messages = new Map();
    let hasCorruptedCheckpoints = false;

    for (let i = 0; i < messageIds.length; i += Wze) {
      const batchKeys = messageIds
        .slice(i, i + Wze)
        .map((id) => `${STORAGE_KEY_PREFIX}:${composerId}:${id}`);

      const batchResults = await this._storageService.cursorDiskKVGetBatch(batchKeys);

      for (const [key, value] of batchResults) {
        const messageId = key.split(":").pop();
        const parsed = JSON.parse(value);
        const message = cpa(parsed);

        try {
          message.conversationState = await A2g(
            this._storageService,
            this._structuredLogService,
            composerId,
            messageId,
            parsed.conversationState
          );
        } catch (error) {
          hasCorruptedCheckpoints = true;
          message.conversationState = new bk();
          __(error, {
            tags: {
              client_error_type: "composer_corruption",
              force_upload: "forced",
            },
            extra: { composerId, messageId },
          });
        }

        // Filter out service status messages
        if (message.serviceStatusUpdate && Umi(message.serviceStatusUpdate.message)) {
          continue;
        }

        messages.set(messageId, message);
      }
    }

    return { messages, hasCorruptedCheckpoints };
  }

  /**
   * Delete a single message from storage.
   */
  async deleteMessage(composerId, messageId) {
    if (!messageId || !composerId) {
      throw new Error(
        "[composer] messageId or composerId is undefined" +
          JSON.stringify({ messageId, composerId })
      );
    }

    debugLog(
      "[composer] deleting message",
      `${STORAGE_KEY_PREFIX}:${composerId.slice(0, 4)}:${messageId.slice(0, 4)}`
    );

    await this._storageService.cursorDiskKVSet(
      `${STORAGE_KEY_PREFIX}:${composerId}:${messageId}`,
      void 0
    );
  }

  /**
   * Clear all messages for a given composer.
   */
  async clearComposerMessages(composerId) {
    if (!composerId) {
      throw new Error("[composer] composerId is undefined");
    }

    debugLog("[composer] clearing all messages for composer", composerId);

    return this._storageService
      .cursorDiskKVClearPrefix(`${STORAGE_KEY_PREFIX}:${composerId}:`)
      .catch((error) => {
        console.error(`[composer] Error clearing messages for composer ${composerId}:`, error);
      });
  }

  /**
   * Get the initial set of messages to load for a composer.
   * Supports virtualization — only loads the most recent visible messages.
   * Filters out messages with "reload window" error buttons.
   */
  async getInitialMessages(composerId, conversationTurns) {
    debugLog("[composer] calculating initial messages to load for composer", composerId);

    const turnGroups = rNg(conversationTurns);

    // Determine which message IDs to load
    const messageIdsToLoad = this._experimentService.checkFeatureGate(
      "stricter_in_memory_virtualization"
    )
      ? bMA(conversationTurns)
      : (() => {
          const visibleTurnStart = wLA(turnGroups);
          const visibleTurnCount = turnGroups.length - visibleTurnStart;
          return turnGroups
            .slice(visibleTurnCount)
            .flatMap((group) =>
              group.flatMap((turn) => turn.messages.map((msg) => msg.bubbleId))
            );
        })();

    debugLog("[composer] loading exactly", messageIdsToLoad.length, "messages");

    const result = await this.retrieveMessagesBatchInternal(composerId, messageIdsToLoad);
    const hasCorruptedCheckpoints = result.hasCorruptedCheckpoints;

    return {
      messages: messageIdsToLoad
        .map((id) => result.messages.get(id))
        .filter((msg) => msg !== void 0)
        .filter(
          (msg) =>
            !msg.errorDetails?.error?.details?.buttons?.some(
              (btn) => btn.action?.case === "reloadWindow"
            )
        ),
      hasCorruptedCheckpoints,
    };
  }
};

// Method-level tracing decorators
__decorate(
  [Hs("ComposerMessageStorageService.storeMessage")],
  ComposerMessageStorageService.prototype,
  "storeMessage",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.updateMessage")],
  ComposerMessageStorageService.prototype,
  "updateMessage",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.retrieveMessage")],
  ComposerMessageStorageService.prototype,
  "retrieveMessage",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.retrieveMessagesBatch")],
  ComposerMessageStorageService.prototype,
  "retrieveMessagesBatch",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.deleteMessage")],
  ComposerMessageStorageService.prototype,
  "deleteMessage",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.clearComposerMessages")],
  ComposerMessageStorageService.prototype,
  "clearComposerMessages",
  null
);
__decorate(
  [Hs("ComposerMessageStorageService.getInitialMessages")],
  ComposerMessageStorageService.prototype,
  "getInitialMessages",
  null
);

// DI registration
ComposerMessageStorageService = __decorate(
  [
    __param(0, Ji), // IStorageService
    __param(1, gE), // IStructuredLogService
    __param(2, ZE), // IMetricsService
    __param(3, P1), // IAIServerConfigService
    __param(4, Rl), // IExperimentService
  ],
  ComposerMessageStorageService
);

Ki(IComposerMessageStorageService, ComposerMessageStorageService, 1);
