/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/agentProviderService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
st(), fnt(), Er(), Qt(), Wr();

// --- Service Identifier ---
const IAgentProviderService = Bi("agentProviderService"); // _Aa — createDecorator

// --- AgentProviderService ---
// Manages the registration of agent handlers and creation of agent sessions.
const AgentProviderService = class extends at { // Disposable
  constructor(logService) {
    super();
    this._logService = logService;
    this._handlerHolder = new kye; // OnceHolder — holds a single handler
    this._logService.debug("[AgentProviderService] Initialized");
  }

  registerHandler(handler) {
    this._logService.debug("[AgentProviderService] Handler registered");
    const registration = this._handlerHolder.set(handler);
    return qi(() => { // toDisposable
      registration.dispose();
      this._logService.debug("[AgentProviderService] Handler unregistered");
    });
  }

  async createAgent(sessionId, options) {
    this._logService.debug("[AgentProviderService] createAgent called", {
      sessionId,
      options
    });
    const handler = await i8(this._handlerHolder); // waitForValue — waits until handler is set
    this._logService.debug("[AgentProviderService] Got handler, creating agent");
    return handler.createAgent(sessionId, options);
  }
};

// --- DI Decoration ---
// CAa = AgentProviderService
// @__param(0, ILogService)
AgentProviderService.__decorate = [__param(0, Ir)]; // Ir = ILogService
__decorate([__param(0, Ir)], AgentProviderService);

// Register service
Ki(IAgentProviderService, AgentProviderService, 1); // registerSingleton

// --- Symbol Map ---
// _Aa → IAgentProviderService (service identifier)
// CAa → AgentProviderService (implementation class)
// kye → OnceHolder (holds single value, disposes previous)
// i8  → waitForValue (async wait for holder to have a value)
// at  → Disposable (base class)
// qi  → toDisposable
// Ir  → ILogService
// Ki  → registerSingleton
// Bi  → createDecorator
