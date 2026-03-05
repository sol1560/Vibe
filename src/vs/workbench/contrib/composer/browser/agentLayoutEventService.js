// Source: out-build/vs/workbench/contrib/composer/browser/agentLayoutEventService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

yn(), st(), Qt(), Er();

const IAgentLayoutEventService = Bi("agentLayoutEventService");

class AgentLayoutEventService extends at {
  constructor() {
    super(...arguments);

    // === Events ===
    this._onDidChangeActiveComposer = this._register(new Qe());
    this.onDidChangeActiveComposer = this._onDidChangeActiveComposer.event;

    this._onDidNavigateAgents = this._register(new Qe());
    this.onDidNavigateAgents = this._onDidNavigateAgents.event;

    this._onDidFinalizeNavigation = this._register(new Qe());
    this.onDidFinalizeNavigation = this._onDidFinalizeNavigation.event;

    this._onDidRequestFocusSearchInput = this._register(new Qe());
    this.onDidRequestFocusSearchInput = this._onDidRequestFocusSearchInput.event;

    // === State ===
    this._isInNavigationMode = false;
    this._mruList = []; // Most Recently Used list of agents
  }

  static { this.MAX_MRU_SIZE = 10; }

  isInNavigationMode() {
    return this._isInNavigationMode;
  }

  enterNavigationMode() {
    this._isInNavigationMode = true;
  }

  exitNavigationMode() {
    this._isInNavigationMode = false;
  }

  fireDidChangeActiveComposer(event) {
    this.recordAgentVisit(event.currentComposerId, event.currentType);
    this._onDidChangeActiveComposer.fire(event);
  }

  fireDidNavigateAgents(event) {
    this._onDidNavigateAgents.fire(event);
  }

  fireDidFinalizeNavigation() {
    this._onDidFinalizeNavigation.fire({});
  }

  fireDidRequestFocusSearchInput() {
    this._onDidRequestFocusSearchInput.fire({});
  }

  getMRUList() {
    return this._mruList;
  }

  recordAgentVisit(composerId, type) {
    const existingIndex = this._mruList.findIndex(
      (entry) => entry.composerId === composerId
    );
    if (existingIndex !== -1) {
      this._mruList.splice(existingIndex, 1);
    }

    this._mruList.unshift({
      composerId: composerId,
      type: type,
      timestamp: Date.now(),
    });

    if (this._mruList.length > AgentLayoutEventService.MAX_MRU_SIZE) {
      this._mruList.length = AgentLayoutEventService.MAX_MRU_SIZE;
    }
  }

  removeFromMRU(composerId) {
    const index = this._mruList.findIndex(
      (entry) => entry.composerId === composerId
    );
    if (index !== -1) {
      this._mruList.splice(index, 1);
    }
  }
}

Ki(IAgentLayoutEventService, AgentLayoutEventService, 1);
