/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/ai/browser/subagentsService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *  Brand: cursor- → claude-
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
yn(), st(), Ube(), fnt(), Xn(), ps(), Eye(), ts(), Er(), Qt(), sf(), Sr(), ls(), cO(),
Yu(), Ig(), FJ();

// --- Service Identifier ---
const ISubagentsService = Bi("subagentsService"); // xkt — createDecorator

// --- SubagentsService ---
// Manages the discovery and loading of custom subagent definitions
// from .claude/agents directory (user-level and workspace-level).
// Watches for file changes and reloads automatically.
const SubagentsService = class extends at { // Disposable, gAa
  constructor(
    fileService,                // IFileService
    workspaceContextService,    // IWorkspaceContextService
    pathService,                // IPathService
    commandService,             // ICommandService
    storageService,             // IStorageService
    experimentService,          // IExperimentService
    pluginsProviderService      // IPluginsProviderService
  ) {
    super();
    this.fileService = fileService;
    this.workspaceContextService = workspaceContextService;
    this.pathService = pathService;
    this.commandService = commandService;
    this.storageService = storageService;
    this.experimentService = experimentService;
    this.pluginsProviderService = pluginsProviderService;

    this._subagentsProvider = new kye; // OnceHolder
    this._onDidSubagentsChange = this._register(new Qe); // Emitter
    this.onDidSubagentsChange = this._onDidSubagentsChange.event;

    // Observable for third-party extensibility setting
    this.thirdPartyExtensibilityObservable = this._register(
      sm(this.storageService, "thirdPartyExtensibilityEnabled") // createStorageObservable
    );

    // Watch for file changes in agents/rules directories
    this._register(this.fileService.onDidFilesChange(
      changes => this.onDidFilesChange(changes)
    ));

    // Watch for workspace folder changes
    this._register(this.workspaceContextService.onDidChangeWorkspaceFolders(() => {
      this.initializeWatchedPaths()
        .then(() => this.reload())
        .then(() => { this._onDidSubagentsChange.fire(); });
    }));

    // Watch for plugin changes
    const reloadAndNotify = () => {
      this.reload().then(() => { this._onDidSubagentsChange.fire(); });
    };
    this._register(this.pluginsProviderService.onDidPluginsChange(reloadAndNotify));
    this._register(this.pluginsProviderService.onDidPluginsChangeWithoutRefetch(reloadAndNotify));

    // Watch for third-party extensibility toggle
    this._register(p3(this.thirdPartyExtensibilityObservable, () => {
      this.reload().then(() => { this._onDidSubagentsChange.fire(); });
    }));

    this.initializeWatchedPaths();
  }

  async initializeWatchedPaths() {
    const userHome = await this.pathService.userHome();
    // NOTE: Changed from .cursor/agents to .claude/agents
    this._userAgentsDir = je.joinPath(userHome, ".claude", "agents"); // URI.joinPath

    const workspace = this.workspaceContextService.getWorkspace();
    if (workspace.folders.length > 0) {
      this._workspaceRulesDir = await gnf(workspace, this.pathService); // getWorkspaceRulesDir
    }
  }

  isSubagentRelatedPath(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return !!(
      normalized.includes(".claude/agents") ||
      normalized.includes(".claude/rules") ||
      (this._userAgentsDir && normalized.startsWith(this._userAgentsDir.path)) ||
      (this._workspaceRulesDir && normalized.startsWith(this._workspaceRulesDir.path))
    );
  }

  onDidFilesChange(event) {
    const isRelevant =
      event.rawAdded.some(f => this.isSubagentRelatedPath(f.path)) ||
      event.rawUpdated.some(f => this.isSubagentRelatedPath(f.path)) ||
      event.rawDeleted.some(f => this.isSubagentRelatedPath(f.path));

    if (isRelevant) {
      this.reload().then(() => { this._onDidSubagentsChange.fire(); });
    }
  }

  async reload() {
    const provider = await i8(this._subagentsProvider); // waitForValue
    await provider.reload();
  }

  async getAllSubagents() {
    const provider = await i8(this._subagentsProvider);
    const allSubagents = await provider.getAllSubagents();

    const isThirdPartyEnabled = this.thirdPartyExtensibilityObservable.get();
    const isPluginImportEnabled = this.experimentService.checkFeatureGate(
      "enable_cc_plugin_import"
    );

    const normalizePath = path => path.replace(/\\/g, "/");

    return allSubagents.filter(agent => {
      const normalizedPath = normalizePath(agent.fullPath);
      const isThirdParty = lqe(normalizedPath); // isThirdPartyPath

      // Filter out third-party agents if not enabled
      if (!isThirdPartyEnabled && isThirdParty) return false;
      // Filter out plugin-imported agents if not enabled
      if (!isPluginImportEnabled && isThirdParty) return false;
      return true;
    });
  }

  registerSubagentsProvider(provider) {
    this._subagentsProvider.set(provider);
    return qi(() => { // toDisposable
      this._subagentsProvider.clear();
    });
  }

  notifyProviderReady() {
    this._onDidSubagentsChange.fire();
  }
};

// --- DI Decoration ---
__decorate([
  __param(0, Jr),   // IFileService
  __param(1, Rr),   // IWorkspaceContextService
  __param(2, Rp),   // IPathService
  __param(3, br),   // ICommandService
  __param(4, Ji),   // IStorageService
  __param(5, Rl),   // IExperimentService
  __param(6, Ace)   // IPluginsProviderService
], SubagentsService);

// Register service
Ki(ISubagentsService, SubagentsService, 1); // registerSingleton

// --- Symbol Map ---
// xkt  → ISubagentsService
// gAa  → SubagentsService
// kye  → OnceHolder
// i8   → waitForValue
// Qe   → Emitter
// sm   → createStorageObservable
// p3   → observableAutorun (watch and re-run)
// gnf  → getWorkspaceRulesDir
// lqe  → isThirdPartyPath
// je   → URI
// qi   → toDisposable
// at   → Disposable
// Jr   → IFileService
// Rr   → IWorkspaceContextService
// Rp   → IPathService
// br   → ICommandService
// Ji   → IStorageService
// Rl   → IExperimentService
// Ace  → IPluginsProviderService
// Ki   → registerSingleton
// Bi   → createDecorator
