/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/backgroundWorkRegistry.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
jNe(), yn(), st(), Er(), Qt(), Gw();

// --- Service Identifier ---
const IBackgroundWorkService = Bi("backgroundWorkService"); // ign — createDecorator

// --- BackgroundWorkService ---
// Tracks background work items (shell commands, subagent tasks) and their lifecycle.
// Provides reactive state for UI to display background job status.
const BackgroundWorkService = class extends at { // Disposable
  constructor() {
    super(...arguments);
    this._shellWorkById = new Map();
    this._subagentWorkById = new Map();
    this._pendingCompletionsByComposerId = new Map();

    this._onDidEnqueueCompletion = this._register(new Qe); // Emitter
    this.onDidEnqueueCompletion = this._onDidEnqueueCompletion.event;
    this.backgroundWorkItems = this._register(new j_([]) /* ObservableValue */);
  }

  _publish() {
    this.backgroundWorkItems.change([
      ...this._subagentWorkById.values(),
      ...this._shellWorkById.values()
    ]);
  }

  getComposerBackgroundWork(composerId) {
    return this.backgroundWorkItems.value.filter(item => item.composerId === composerId);
  }

  // --- Completion Queue ---

  enqueueCompletion(completion) {
    const pending = this._pendingCompletionsByComposerId.get(completion.composerId) ?? [];
    pending.push(completion);
    this._pendingCompletionsByComposerId.set(completion.composerId, pending);
    this._onDidEnqueueCompletion.fire({ composerId: completion.composerId });
  }

  hasPendingCompletions(composerId) {
    const pending = this._pendingCompletionsByComposerId.get(composerId);
    return pending !== undefined && pending.length > 0;
  }

  drainCompletions(composerId) {
    const pending = this._pendingCompletionsByComposerId.get(composerId);
    if (!pending || pending.length === 0) return [];
    this._pendingCompletionsByComposerId.delete(composerId);
    return [...pending];
  }

  // --- Shell Work ---

  replaceShellWorkSnapshot(items) {
    this._shellWorkById.clear();
    for (const item of items) {
      if (item.kind === "shell") {
        this._shellWorkById.set(item.id, item);
      }
    }
    this._publish();
  }

  upsertShellWork(item) {
    if (item.kind === "shell") {
      this._shellWorkById.set(item.id, item);
      this._publish();
    }
  }

  clearShellWork(itemId) {
    if (this._shellWorkById.delete(itemId)) {
      this._publish();
    }
  }

  async openBackgroundShell(shellItem) {
    return this._shellOpener?.(shellItem) ?? false;
  }

  // --- Subagent Work ---

  upsertSubagentWork(item) {
    if (item.kind === "subagent") {
      this._subagentWorkById.set(item.id, item);
      this._publish();
    }
  }

  clearSubagentWork(itemId) {
    if (this._subagentWorkById.delete(itemId)) {
      this._publish();
    }
  }

  // --- Kill Background Work ---

  async killBackgroundWork(item) {
    switch (item.kind) {
      case "shell": {
        const killed = await this._shellKiller?.(item.id);
        if (killed) this.clearShellWork(item.id);
        return killed ?? false;
      }
      case "subagent": {
        const killed = await this._subagentKiller?.(item.id);
        if (killed) this.clearSubagentWork(item.id);
        return killed ?? false;
      }
      default:
        return Oey(item.kind); // assertNever — exhaustive check
    }
  }

  // --- Handler Registration ---

  registerShellKiller(killer) {
    this._shellKiller = killer;
    return qi(() => { // toDisposable
      if (this._shellKiller === killer) this._shellKiller = undefined;
    });
  }

  registerShellOpener(opener) {
    this._shellOpener = opener;
    return qi(() => {
      if (this._shellOpener === opener) this._shellOpener = undefined;
    });
  }

  registerSubagentKiller(killer) {
    this._subagentKiller = killer;
    return qi(() => {
      if (this._subagentKiller === killer) this._subagentKiller = undefined;
    });
  }
};

// Register service
Ki(IBackgroundWorkService, BackgroundWorkService, 1); // registerSingleton

// --- Symbol Map ---
// ign  → IBackgroundWorkService
// aSf  → BackgroundWorkService
// at   → Disposable
// Qe   → Emitter
// j_   → ObservableValue
// qi   → toDisposable
// Oey  → assertNever
// Ki   → registerSingleton
// Bi   → createDecorator
