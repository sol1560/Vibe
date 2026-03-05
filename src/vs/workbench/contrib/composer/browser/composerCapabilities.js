// Source: out-build/vs/workbench/contrib/composer/browser/composerCapabilities.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the Composer capability system — defines base capability class
// and a registry for all capability types (tool former, thinking, loop on tests, etc.)

ru(), Di(), hT(), Ov(), st(), qs(), S$e(), zk();

// ============================================================
// Capability configuration
// ============================================================

/** Capability types that are excluded from the default set */
const EXCLUDED_CAPABILITY_TYPES = [
  ko.UNSPECIFIED,
  ko.LOOP_ON_TESTS,
  ko.LOOP_ON_COMMAND,
  ko.LOOP_ON_LINTS,
  ko.BROWSER_AGENT,
];

/** Default capability types included in every composer */
const DEFAULT_CAPABILITY_TYPES = Object.values(ko).filter(
  (type) => typeof type === "number" && !EXCLUDED_CAPABILITY_TYPES.includes(type)
);

/** Default data for each capability type, derived from schema definitions */
const DEFAULT_CAPABILITY_DATA = Object.fromEntries(
  Object.entries(gnu).map(([key, schema]) => [key, _MA(schema)])
);

// ============================================================
// ComposerCapability — base class
// ============================================================

/**
 * ComposerCapability
 *
 * Base class for all composer capabilities. A capability represents
 * a discrete AI behavior module (e.g., TOOL_FORMER, THINKING, DIFF_REVIEW).
 *
 * Each capability:
 * - Has a type identifier from the ko enum
 * - Maintains its own data state
 * - Can be enabled/disabled
 * - Supports serialization for persistence
 * - Has lifecycle hooks: onStartSubmitChat, onChatStreamFinished, etc.
 * - Has an abort controller for cancellation
 */
const ComposerCapability = class extends at {
  constructor(composerId, data, composerDataService) {
    super();
    this.composerDataService = composerDataService;

    /** Abort controller for cancelling this capability's work */
    this.abortController = null;

    this.composerId = composerId;
    this.data = { ...data };

    // Reactive enabled state
    [this.isEnabled, this.setIsEnabled] = dt(true);
    [this.isEnabledForRequest, this.setIsEnabledForRequest] = dt(true);
  }

  /**
   * Set a weak reference to the composer handle.
   * Used to avoid strong references that prevent GC.
   */
  setProvidedHandle(handle) {
    this._providedHandleRef = new WeakRef(handle);
  }

  /**
   * Get the composer handle, preferring the provided weak ref.
   * Falls back to looking up by composerId.
   */
  getComposerHandle() {
    const provided = this._providedHandleRef?.deref();
    if (provided) return provided;

    const handle = this.composerDataService.getHandleIfLoaded(this.composerId);
    if (!handle) {
      throw new Error(
        `[ComposerCapability] Composer ${this.composerId} is not loaded. Are you obtaining a handle to the composer during its disposal?`
      );
    }
    return handle;
  }

  // --- Lifecycle hook detection ---

  /** Override to provide context information to the request */
  providedContextInformation(contextBuilder) {}

  /** Whether this capability only runs in background mode */
  isBackgroundOnly() {
    return false;
  }

  shouldRunOnStartSubmitChat() {
    return !!this.onStartSubmitChatReturnShouldStop;
  }

  shouldRunOnBeforeSubmitChat() {
    return !!this.onBeforeSubmitChat;
  }

  shouldRunOnChatStreamFinished() {
    return !!this.onChatStreamFinished;
  }

  shouldRunOnComposerDone() {
    return !!this.onComposerDone;
  }

  shouldRunOnAddPendingAction() {
    return !!this.onAddPendingAction;
  }

  shouldRunOnAcceptAllEdits() {
    return !!this.onAcceptAllEdits;
  }

  shouldRunOnBeforeApply() {
    return !!this.onBeforeApply;
  }

  // --- Serialization ---

  toString() {
    return this.serialize();
  }

  serialize() {
    return JSON.stringify(this.toJSON());
  }

  deserialize(jsonString) {
    const parsed = JSON.parse(jsonString);
    const Constructor = this.constructor;
    return new Constructor(this.composerId, parsed, this.composerDataService);
  }

  toJSON() {
    this.onWillSaveState();
    return {
      type: this.type,
      data: this.data,
    };
  }

  // --- Abort/cancel ---

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /** Override to save state before persistence */
  onWillSaveState() {}

  /** Override to handle abort */
  onAborted() {}

  isAborted() {
    return this.abortController ? this.abortController.signal.aborted : true;
  }

  isRunning() {
    return this.abortController !== null && !this.isAborted();
  }

  getAbortSignal() {
    if (!this.abortController) {
      this.abortController = new AbortController();
    }
    return this.abortController.signal;
  }

  dispose() {
    this.cancel();
    this.data = DEFAULT_CAPABILITY_DATA[this.type];
    super.dispose();
  }
};

// ============================================================
// ComposerCapabilityRegistry — singleton factory
// ============================================================

/**
 * ComposerCapabilityRegistry
 *
 * Registry pattern for creating capability instances.
 * Each capability type maps to a constructor class.
 * Handles:
 * - Registering capability constructors
 * - Creating capability instances with DI
 * - Filtering capabilities for different contexts (glass, background)
 */
const ComposerCapabilityRegistry = class RegistrySingleton {
  static INSTANCE = new RegistrySingleton();

  static registerCapability(type, constructor) {
    this.INSTANCE.capabilitiesMap[type] = constructor;
  }

  static getCapabilities(instantiationService, composerId, options) {
    let capabilityConfigs = [];

    if (options?.forceCapabilities !== void 0) {
      capabilityConfigs = options.forceCapabilities.map((type) => ({
        type,
        data: DEFAULT_CAPABILITY_DATA[type],
      }));
    } else {
      // Merge saved capabilities with default set
      const savedCapabilities = (options?.savedCapabilityData || []).filter((saved) =>
        Djl.some((defaultType) => defaultType === saved.type)
      );
      const missingDefaults = Djl.filter(
        (type) => !savedCapabilities.some((saved) => saved.type === type)
      ).map((type) => ({ type, data: DEFAULT_CAPABILITY_DATA[type] }));
      capabilityConfigs = [...savedCapabilities, ...missingDefaults];
    }

    // Filter out BACKGROUND_COMPOSER capability in glass mode
    const isGlass = instantiationService.invokeFunction((accessor) =>
      accessor.get(_c).isGlass
    );
    if (isGlass) {
      capabilityConfigs = capabilityConfigs.filter(
        (config) => config.type !== ko.BACKGROUND_COMPOSER
      );
    }

    // Create instances
    const instances = capabilityConfigs
      .map((config) => {
        try {
          const Constructor = this.INSTANCE.capabilitiesMap[config.type];
          if (!Constructor || !this.getSchema(config.type)) return;

          const data = {
            ...this.INSTANCE.getDefaultDataForCapability(config.type),
            ...(config.data || {}),
          };
          const instance = instantiationService.createInstance(Constructor, composerId, data);

          if (options?.providedHandle) {
            instance.setProvidedHandle(options.providedHandle);
          }

          return instance;
        } catch (error) {
          console.error(
            `[composerCapabilities] Error creating capability ${config.type}`,
            error
          );
          return;
        }
      })
      .filter(Qh); // Filter out undefined

    return kMA(instances); // Sort by priority
  }

  static getSchema(type) {
    return gnu[type];
  }

  static createInstance(instantiationService, composerId, type, data) {
    const Constructor = this.INSTANCE.capabilitiesMap[type];
    if (!Constructor) {
      throw new Error(`No constructor found for capability type: ${type}`);
    }
    return instantiationService.createInstance(Constructor, composerId, data);
  }

  getDefaultDataForCapability(type) {
    return DEFAULT_CAPABILITY_DATA[type] || {};
  }

  constructor() {
    this.capabilitiesMap = {};
  }
};
