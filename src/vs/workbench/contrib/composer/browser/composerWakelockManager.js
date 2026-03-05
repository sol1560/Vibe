// Source: out-build/vs/workbench/contrib/composer/browser/composerWakelockManager.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Di();

/**
 * ComposerWakelockManager
 *
 * Manages system wakelock during agent loop execution to prevent
 * the machine from sleeping while the AI is actively working.
 * Releases the wakelock when waiting for user approval or when generation ends.
 */
class ComposerWakelockManager {
  constructor(composerHandle, powerMainService, logService) {
    this._composerHandle = composerHandle;
    this._powerMainService = powerMainService;
    this._logService = logService;
    this._disposed = false;
    this._pendingOp = Promise.resolve();

    // Acquire wakelock immediately if no blocking pending actions
    if (!this._composerHandle.data.hasBlockingPendingActions) {
      this._acquire("agent-loop");
    }

    this._setupReactiveWatch();
  }

  _acquire(reason) {
    this._pendingOp = this._pendingOp.then(async () => {
      if (this._disposed) return;
      try {
        const wakelockId = await this._powerMainService.startWakelock(reason);
        if (this._disposed) {
          await this._powerMainService.stopWakelock(wakelockId);
          return;
        }
        this._wakelockId = wakelockId;
        this._logService.info(
          `[ComposerWakelockManager] Acquired wakelock id=${wakelockId} reason="${reason}" composerId=${this._composerHandle.composerId}`
        );
      } catch (err) {
        this._logService.warn(
          `[ComposerWakelockManager] Failed to acquire wakelock: ${err}`
        );
      }
    });
  }

  _release(reason) {
    this._pendingOp = this._pendingOp.then(async () => {
      const wakelockId = this._wakelockId;
      if (wakelockId !== undefined) {
        this._wakelockId = undefined;
        try {
          await this._powerMainService.stopWakelock(wakelockId);
          this._logService.info(
            `[ComposerWakelockManager] Released wakelock id=${wakelockId} reason="${reason}" composerId=${this._composerHandle.composerId}`
          );
        } catch (err) {
          this._logService.warn(
            `[ComposerWakelockManager] Failed to release wakelock id=${wakelockId}: ${err}`
          );
        }
      }
    });
  }

  _setupReactiveWatch() {
    this._disposeReactive = tI((disposables) => (
      An(
        Ff(
          () => this._composerHandle.data.hasBlockingPendingActions,
          (newValue, oldValue) => {
            if (this._disposed) return;
            if (newValue && !oldValue) {
              // User approval requested — release wakelock
              this._release("user-approval-requested");
            } else if (!newValue && oldValue) {
              // Agent loop resumed — re-acquire wakelock
              this._acquire("agent-loop-resumed");
            }
          },
          { defer: true }
        )
      ),
      disposables
    ));
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._disposeReactive?.();
    this._disposeReactive = undefined;
    this._release("generation-ended");
  }
}
