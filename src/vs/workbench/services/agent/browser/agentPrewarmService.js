/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/agentPrewarmService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
st(), Gk(), tYe(), Er(), Qt(), Wr();

// --- Service Identifier ---
const IAgentPrewarmService = Bi("agentPrewarmService"); // Eyi — createDecorator

// --- Constants ---
const PREWARM_TIMEOUT_MS = 30000; // jcu — 30 seconds

// --- AgentPrewarmService ---
// Manages prewarmed agent connections to reduce latency on first message.
// A prewarm holds an open request stream that can be consumed when a user
// starts a new conversation, avoiding the connection setup delay.
const AgentPrewarmService = class extends at { // Disposable
  constructor(logService) {
    super();
    this.logService = logService;
  }

  isExpired(prewarm) {
    return Date.now() - prewarm.createdAt > PREWARM_TIMEOUT_MS;
  }

  getActivePrewarmKeyHash() {
    if (!this._activePrewarm || this.isExpired(this._activePrewarm)) return;
    return this._activePrewarm.prewarmKeyHash;
  }

  cancelAndAbortStream(requestStream, abortController) {
    const cancelAction = new kF({ // ConversationAction
      action: {
        case: "cancelAction",
        value: new P2c // CancelAction
      }
    });
    const cancelMessage = new y6o({ // StreamMessage
      message: {
        case: "conversationAction",
        value: cancelAction
      }
    });

    requestStream.write(cancelMessage).catch(() => {
      this.logService.debug(
        "[Prewarm] Failed to write cancel message, stream may already be closed"
      );
    }).finally(() => {
      abortController.abort("prewarm_cancelled");
    });
  }

  storePrewarm(prewarm) {
    this.logService.debug(
      "[Prewarm] storePrewarm called",
      prewarm.composerId,
      prewarm.generationUUID,
      "keyHash:", prewarm.prewarmKeyHash,
      "hasExisting:", !!this._activePrewarm
    );

    if (this._activePrewarm) {
      // Check for duplicate with same key
      if (this._activePrewarm.composerId === prewarm.composerId &&
          this._activePrewarm.prewarmKeyHash === prewarm.prewarmKeyHash &&
          !this.isExpired(this._activePrewarm)) {
        this.logService.debug(
          "[Prewarm] Valid prewarm already exists with same key, discarding new one",
          prewarm.composerId
        );
        const abortInfo = {
          composerId: prewarm.composerId,
          requestId: prewarm.generationUUID,
          abortReason: "duplicate_prewarm_same_key"
        };
        this.logService.info("[Prewarm] Aborting prewarm stream", abortInfo);
        this.cancelAndAbortStream(prewarm.requestStream, prewarm.abortController);
        return;
      }

      this.logService.debug("[Prewarm] Replacing existing prewarm (key changed or expired)");
      this.invalidatePrewarm("replaced_by_new_prewarm");
    }

    this._activePrewarm = prewarm;

    // Set up expiration timeout
    if (this._timeoutHandle) clearTimeout(this._timeoutHandle);
    this._timeoutHandle = setTimeout(() => {
      this.logService.debug("[Prewarm] Timeout reached, invalidating");
      this.invalidatePrewarm("timeout");
    }, PREWARM_TIMEOUT_MS);

    this.logService.info(
      "[Prewarm] Stored",
      prewarm.composerId,
      "requestId:", prewarm.generationUUID
    );
  }

  consumePrewarm(composerId, keyHash) {
    this.logService.debug(
      "[Prewarm] consumePrewarm called",
      composerId,
      "hasActive:", !!this._activePrewarm
    );

    if (!this._activePrewarm) {
      this.logService.debug("[Prewarm] No active prewarm to consume");
      return;
    }

    if (this._activePrewarm.composerId !== composerId) {
      this.logService.debug(
        "[Prewarm] Composer mismatch",
        composerId, "!=", this._activePrewarm.composerId
      );
      return;
    }

    if (this.isExpired(this._activePrewarm)) {
      this.logService.debug(
        "[Prewarm] Expired, ageMs:",
        Date.now() - this._activePrewarm.createdAt
      );
      this.invalidatePrewarm("expired");
      return;
    }

    if (keyHash && this._activePrewarm.prewarmKeyHash !== keyHash) {
      this.logService.debug(
        "[Prewarm] Key hash mismatch",
        "stored:", this._activePrewarm.prewarmKeyHash,
        "current:", keyHash
      );
      this.invalidatePrewarm("key-mismatch");
      return;
    }

    const consumed = this._activePrewarm;
    this._activePrewarm = undefined;
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = undefined;
    }

    const ageMs = Date.now() - consumed.createdAt;
    this.logService.info(
      "[Prewarm] Consumed",
      composerId,
      "requestId:", consumed.generationUUID,
      "ageMs:", ageMs
    );
    return consumed;
  }

  hasValidPrewarm(composerId, keyHash) {
    return !(!this._activePrewarm ||
      this._activePrewarm.composerId !== composerId ||
      (keyHash !== undefined && this._activePrewarm.prewarmKeyHash !== keyHash) ||
      this.isExpired(this._activePrewarm));
  }

  invalidatePrewarm(reason) {
    if (!this._activePrewarm) return;

    this.logService.info(
      "[Prewarm] Invalidated",
      this._activePrewarm.composerId,
      "reason:", reason,
      "requestId:", this._activePrewarm.generationUUID
    );

    if (this._activePrewarm.rootSpanCtx) {
      this._activePrewarm.rootSpanCtx.setAttribute(
        "prewarm.invalidationReason",
        reason ?? "unknown"
      );
      this._activePrewarm.rootSpanCtx.end();
    }

    const abortInfo = {
      composerId: this._activePrewarm.composerId,
      requestId: this._activePrewarm.generationUUID,
      abortReason: reason ?? "unknown"
    };
    this.logService.info("[Prewarm] Aborting prewarm stream", abortInfo);
    this.cancelAndAbortStream(
      this._activePrewarm.requestStream,
      this._activePrewarm.abortController
    );

    this._activePrewarm = undefined;
    if (this._timeoutHandle) {
      clearTimeout(this._timeoutHandle);
      this._timeoutHandle = undefined;
    }
  }

  dispose() {
    this.invalidatePrewarm("dispose");
    super.dispose();
  }
};

// --- DI Decoration ---
// @__param(0, ILogService)
__decorate([__param(0, Ir)], AgentPrewarmService); // Ir = ILogService

// Register service
Ki(IAgentPrewarmService, AgentPrewarmService, 1); // registerSingleton

// --- Symbol Map ---
// Eyi → IAgentPrewarmService (service identifier)
// wAa → AgentPrewarmService (implementation class)
// jcu → PREWARM_TIMEOUT_MS (30000)
// kF  → ConversationAction
// P2c → CancelAction
// y6o → StreamMessage
// at  → Disposable
// Ir  → ILogService
// Ki  → registerSingleton
// Bi  → createDecorator
