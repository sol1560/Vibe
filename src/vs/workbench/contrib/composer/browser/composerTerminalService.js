// Source: out-build/vs/workbench/contrib/composer/browser/composerTerminalService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerTerminalService — manages AI-owned terminal
// instances, tracks command execution, and detects human terminal commands.

Qt(), st(), Er(), yn(), Up(), tDa();

const IComposerTerminalService = Bi("composerTerminalService");

/** Maximum number of persistent AI terminals to keep per composer */
const MAX_PERSISTENT_TERMINALS = 5;

/**
 * ComposerTerminalService
 *
 * Manages terminal instances used by the AI agent:
 * - Persistent terminals: reused across commands for the same composer (LRU eviction)
 * - Background terminals: one-off terminals for background tasks
 * - Tracks which terminals are AI-owned vs user-owned
 * - Detects human-run commands in AI terminals
 * - Cleans up terminals on composer disposal and app shutdown
 */
let ComposerTerminalService = class extends at {
  constructor(lifecycleService) {
    super();
    this._lifecycleService = lifecycleService;

    /** Map<composerId, terminal> — persistent AI terminals */
    this._backgroundAITerminals = new Map();
    this._commandDetectionDisposables = new Map();
    this._aiCommandRunning = new Map();
    this._activeToolExecutions = new Map();

    /** Event fired when a human runs a command in an AI terminal */
    this._onHumanTerminalCommand = new Qe();
    this.onHumanTerminalCommand = this._onHumanTerminalCommand.event;

    /** LRU cache of persistent terminals, auto-evicts oldest when full */
    this._persistentAITerminals = new tvn(MAX_PERSISTENT_TERMINALS, (composerId, terminal) => {
      console.log(
        "[ComposerTerminalService] Auto-evicting persistent terminal for composer:",
        composerId,
        terminal.instanceId
      );
      if (!terminal.isDisposed) terminal.dispose();
    });

    // Clean up all terminals on app shutdown
    this._register(
      this._lifecycleService.onWillShutdown(() => {
        console.log(
          "[ComposerTerminalService] App shutting down, cleaning up all AI terminals"
        );
        for (const composerId of this._persistentAITerminals.keys()) {
          this.cleanupComposerTerminals(composerId);
        }
      })
    );
  }

  dispose() {
    for (const disposable of this._commandDetectionDisposables.values()) {
      disposable.dispose();
    }
    this._commandDetectionDisposables.clear();

    for (const composerId of this._persistentAITerminals.keys()) {
      this.cleanupComposerTerminals(composerId);
    }

    this._onHumanTerminalCommand.dispose();
    super.dispose();
  }

  // --- Persistent terminal management ---

  getPersistentAITerminal(composerId) {
    const terminal = this._persistentAITerminals.get(composerId);
    if (terminal && !terminal.isDisposed) return terminal;
    if (terminal) this._persistentAITerminals.delete(composerId);
  }

  registerPersistentAITerminal(composerId, terminal) {
    console.log(
      "[ComposerTerminalService] Registering persistent AI terminal for composer:",
      composerId,
      terminal.instanceId
    );

    this._persistentAITerminals.set(composerId, terminal);

    this._register(
      terminal.onDisposed(() => {
        console.log(
          "[ComposerTerminalService] Persistent AI terminal disposed for composer:",
          composerId,
          terminal.instanceId
        );
        if (this._persistentAITerminals.get(composerId) === terminal) {
          const disposable = this._commandDetectionDisposables.get(composerId);
          if (disposable) {
            disposable.dispose();
            this._commandDetectionDisposables.delete(composerId);
          }
          this._persistentAITerminals.delete(composerId);
          this._aiCommandRunning.delete(composerId);
          console.log(
            "[ComposerTerminalService] Cleaned up state for manually disposed persistent terminal"
          );
        }
      })
    );

    this._setupCommandDetectionMonitoring(composerId, terminal);
  }

  // --- Background terminal management ---

  registerBackgroundAITerminal(composerId, terminal) {
    console.log(
      "[ComposerTerminalService] Registering background AI terminal for composer:",
      composerId,
      terminal.instanceId
    );

    const terminals = this._backgroundAITerminals.get(composerId) || [];
    terminals.push(terminal);
    this._backgroundAITerminals.set(composerId, terminals);

    this._register(
      terminal.onDisposed(() => {
        console.log(
          "[ComposerTerminalService] Background AI terminal disposed for composer:",
          composerId,
          terminal.instanceId
        );
        const currentTerminals = this._backgroundAITerminals.get(composerId);
        if (currentTerminals) {
          const idx = currentTerminals.indexOf(terminal);
          if (idx !== -1) {
            currentTerminals.splice(idx, 1);
            console.log(
              "[ComposerTerminalService] Removed disposed background terminal from tracking"
            );
            if (currentTerminals.length === 0) {
              this._backgroundAITerminals.delete(composerId);
            }
          }
        }
      })
    );

    // Evict oldest if too many
    if (terminals.length > 10) {
      const oldest = terminals.shift();
      if (oldest && !oldest.isDisposed) {
        console.log(
          "[ComposerTerminalService] Evicting oldest background terminal:",
          oldest.instanceId
        );
        oldest.dispose();
      }
    }
  }

  // --- Terminal identification ---

  isAITerminal(terminal) {
    for (const [, persistentTerminal] of this._persistentAITerminals) {
      if (persistentTerminal === terminal) return true;
    }
    for (const [, bgTerminals] of this._backgroundAITerminals) {
      for (const bgTerminal of bgTerminals) {
        if (bgTerminal === terminal) return true;
      }
    }
    return false;
  }

  getComposerIdForTerminal(terminal) {
    for (const [composerId, persistentTerminal] of this._persistentAITerminals) {
      if (persistentTerminal === terminal) return composerId;
    }
    for (const [composerId, bgTerminals] of this._backgroundAITerminals) {
      for (const bgTerminal of bgTerminals) {
        if (bgTerminal === terminal) return composerId;
      }
    }
  }

  // --- Command tracking ---

  setAICommandRunning(composerId, isRunning) {
    this._aiCommandRunning.set(composerId, isRunning);
    console.log(
      `[ComposerTerminalService] AI command running for composer ${composerId}: ${isRunning}`
    );
  }

  registerToolExecution(composerId, toolCallId, abortController) {
    console.log(
      `[ComposerTerminalService] Registering tool execution for composer ${composerId}, tool ${toolCallId}`
    );
    if (!this._activeToolExecutions.has(composerId)) {
      this._activeToolExecutions.set(composerId, new Map());
    }
    this._activeToolExecutions.get(composerId).set(toolCallId, abortController);
  }

  unregisterToolExecution(composerId, toolCallId) {
    console.log(
      `[ComposerTerminalService] Unregistering tool execution for composer ${composerId}, tool ${toolCallId}`
    );
    const executions = this._activeToolExecutions.get(composerId);
    if (executions) {
      executions.delete(toolCallId);
      if (executions.size === 0) {
        this._activeToolExecutions.delete(composerId);
      }
    }
  }

  // --- Cleanup ---

  cleanupComposerTerminals(composerId) {
    console.log("[ComposerTerminalService] Cleaning up terminals for composer:", composerId);

    const disposable = this._commandDetectionDisposables.get(composerId);
    if (disposable) {
      disposable.dispose();
      this._commandDetectionDisposables.delete(composerId);
    }

    this._aiCommandRunning.delete(composerId);

    // Abort all active tool executions
    const executions = this._activeToolExecutions.get(composerId);
    if (executions) {
      for (const [toolCallId, abortController] of executions) {
        console.log(
          `[ComposerTerminalService] Aborting remaining tool execution: ${toolCallId}`
        );
        abortController.abort();
      }
      this._activeToolExecutions.delete(composerId);
    }

    // Dispose persistent terminal
    const persistent = this._persistentAITerminals.get(composerId);
    if (persistent && !persistent.isDisposed) {
      console.log(
        "[ComposerTerminalService] Disposing shared terminal:",
        persistent.instanceId
      );
      persistent.dispose();
    }
    this._persistentAITerminals.delete(composerId);

    // Dispose background terminals
    const bgTerminals = this._backgroundAITerminals.get(composerId);
    if (bgTerminals) {
      for (const terminal of bgTerminals) {
        if (!terminal.isDisposed) {
          console.log(
            "[ComposerTerminalService] Disposing background terminal:",
            terminal.instanceId
          );
          terminal.dispose();
        }
      }
    }
    this._backgroundAITerminals.delete(composerId);
  }

  // --- Command detection (human commands in AI terminals) ---

  _setupCommandDetectionMonitoring(composerId, terminal) {
    const existingDisposable = this._commandDetectionDisposables.get(composerId);
    if (existingDisposable) existingDisposable.dispose();

    const disposableStore = new Ht();
    this._commandDetectionDisposables.set(composerId, disposableStore);

    let retryTimeout;

    const scheduleRetry = () => {
      retryTimeout = setTimeout(setupMonitoring, 500);
      disposableStore.add(qi(() => clearTimeout(retryTimeout)));
    };

    const setupMonitoring = () => {
      if (disposableStore.isDisposed) return;

      const commandDetection = terminal.capabilities.get(2 /* CommandDetection */);
      if (commandDetection) {
        console.log(
          "[ComposerTerminalService] Setting up command detection monitoring for composer:",
          composerId
        );

        const listener = commandDetection.onCommandFinished((commandInfo) => {
          const hasActiveToolExecution =
            (this._activeToolExecutions.get(composerId)?.size ?? 0) > 0;
          const isAIRunning = this._aiCommandRunning.get(composerId) ?? false;

          if (!(isAIRunning || hasActiveToolExecution) && commandInfo.command) {
            console.log(
              "[ComposerTerminalService] Detected human-run command:",
              commandInfo.command
            );
            this._onHumanTerminalCommand.fire({
              composerId,
              command: commandInfo.command,
              terminalResource: terminal.resource,
            });
          }
        });

        disposableStore.add(listener);
      } else {
        // Terminal doesn't have command detection yet, retry
        scheduleRetry();
      }
    };

    setupMonitoring();
  }
};

// DI registration
ComposerTerminalService = __decorate(
  [
    __param(0, up), // ILifecycleService
  ],
  ComposerTerminalService
);

Ki(IComposerTerminalService, ComposerTerminalService, 2);
