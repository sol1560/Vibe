// Source: out-build/vs/workbench/contrib/composer/browser/pendingApprovalRegistry.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

st(), Qt(), Er(), yn();

const IPendingApprovalRegistry = Bi("pendingApprovalRegistry");

/**
 * PendingApprovalRegistry
 *
 * Manages synchronization between tool call creation and UI bubble rendering.
 * When a tool call requires human review, the agent waits for the corresponding
 * UI bubble to be created before proceeding. This registry coordinates that
 * async handshake with configurable timeouts.
 */
class PendingApprovalRegistry extends at {
  constructor() {
    super();
    this._pendingWaiters = new Map();
    this._createdBubbles = new Map();
    this._onBubbleCreated = this._register(new Qe());
    this.onBubbleCreated = this._onBubbleCreated.event;
  }

  /**
   * Wait for a UI bubble to be created for the given tool call.
   * Resolves immediately if the bubble already exists.
   * Rejects after timeout (default 5 seconds).
   */
  async waitForBubbleCreation(composerId, toolCallId, timeoutMs = 5e3) {
    if (this._createdBubbles.get(composerId)?.has(toolCallId)) {
      return; // Already created
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeWaiter(composerId, toolCallId, waiter);
        reject(
          new Error(
            `Timeout waiting for bubble creation: composerId=${composerId}, toolCallId=${toolCallId}`
          )
        );
      }, timeoutMs);

      const waiter = {
        resolve: () => {
          clearTimeout(timeoutId);
          resolve();
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
        timeoutId: timeoutId,
      };

      this.addWaiter(composerId, toolCallId, waiter);
    });
  }

  /**
   * Signal that a UI bubble has been created for the given tool call.
   * Resolves any pending waiters.
   */
  signalBubbleCreated(composerId, toolCallId) {
    let composerBubbles = this._createdBubbles.get(composerId);
    if (!composerBubbles) {
      composerBubbles = new Set();
      this._createdBubbles.set(composerId, composerBubbles);
    }
    composerBubbles.add(toolCallId);

    const composerWaiters = this._pendingWaiters.get(composerId);
    if (composerWaiters) {
      const toolCallWaiters = composerWaiters.get(toolCallId);
      if (toolCallWaiters) {
        for (const waiter of toolCallWaiters) {
          waiter.resolve();
        }
        composerWaiters.delete(toolCallId);
      }
    }

    this._onBubbleCreated.fire({ composerId, toolCallId });
  }

  /**
   * Clean up all waiters and bubble tracking for a composer.
   * Called when a composer is disposed.
   */
  cleanupComposer(composerId) {
    const composerWaiters = this._pendingWaiters.get(composerId);
    if (composerWaiters) {
      for (const [_toolCallId, waiters] of composerWaiters) {
        for (const waiter of waiters) {
          clearTimeout(waiter.timeoutId);
          waiter.reject(new Error("Composer disposed"));
        }
      }
      this._pendingWaiters.delete(composerId);
    }
    this._createdBubbles.delete(composerId);
  }

  addWaiter(composerId, toolCallId, waiter) {
    let composerWaiters = this._pendingWaiters.get(composerId);
    if (!composerWaiters) {
      composerWaiters = new Map();
      this._pendingWaiters.set(composerId, composerWaiters);
    }

    let toolCallWaiters = composerWaiters.get(toolCallId);
    if (!toolCallWaiters) {
      toolCallWaiters = new Set();
      composerWaiters.set(toolCallId, toolCallWaiters);
    }

    toolCallWaiters.add(waiter);
  }

  removeWaiter(composerId, toolCallId, waiter) {
    const composerWaiters = this._pendingWaiters.get(composerId);
    if (composerWaiters) {
      const toolCallWaiters = composerWaiters.get(toolCallId);
      if (toolCallWaiters) {
        toolCallWaiters.delete(waiter);
        if (toolCallWaiters.size === 0) {
          composerWaiters.delete(toolCallId);
        }
      }
      if (composerWaiters.size === 0) {
        this._pendingWaiters.delete(composerId);
      }
    }
  }

  dispose() {
    for (const [composerId] of this._pendingWaiters) {
      this.cleanupComposer(composerId);
    }
    super.dispose();
  }
}

Ki(IPendingApprovalRegistry, PendingApprovalRegistry, 1);
