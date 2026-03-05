// Source: out-build/vs/workbench/contrib/composer/browser/quickAgentService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Qt(), Er(), st(), yn(), J0(), Iie(), dp(), uie(), Pd();

const IQuickAgentService = Bi("quickAgentService");

/**
 * QuickAgentService
 *
 * Manages ephemeral "quick chat" composer sessions that can be triggered
 * from quick actions (e.g., error fix, inline question). Creates a temporary
 * composer with agent mode and auto-submits the prompt.
 */
let QuickAgentService = class extends at {
  constructor(
    instantiationService,
    composerService,
    composerChatService,
    composerDataService,
    composerContextService,
    reactiveStorageService
  ) {
    super();
    this.instantiationService = instantiationService;
    this.composerService = composerService;
    this.composerChatService = composerChatService;
    this.composerDataService = composerDataService;
    this.composerContextService = composerContextService;
    this.reactiveStorageService = reactiveStorageService;

    this._onDidChangeQuickAgentComposerIdEmitter = this._register(new Qe());
    this.onDidChangeQuickAgentComposerId =
      this._onDidChangeQuickAgentComposerIdEmitter.event;

    this.setupComposerDeletionListener();
  }

  get quickAgentComposerId() {
    return this._quickAgentComposerId;
  }

  clearQuickAgentComposer() {
    this.setQuickAgentComposerId(undefined);
  }

  setQuickAgentComposerId(composerId) {
    if (this._quickAgentComposerId !== composerId) {
      this._quickAgentComposerId = composerId;
      this._onDidChangeQuickAgentComposerIdEmitter.fire(composerId);
    }
  }

  setupComposerDeletionListener() {
    this._register(
      this.reactiveStorageService.onChangeEffectManuallyDisposed({
        deps: [
          () =>
            this.composerDataService.allComposersData.allComposers.map(
              (composer) => composer.composerId
            ),
        ],
        onChange: ({ deps, prevDeps }) => {
          const currentIds = deps[0];
          const deletedIds = (prevDeps?.[0] ?? []).filter(
            (id) => !currentIds.includes(id)
          );

          if (
            this._quickAgentComposerId &&
            deletedIds.includes(this._quickAgentComposerId)
          ) {
            this.setQuickAgentComposerId(undefined);
          }
        },
        runNowToo: false,
      })
    );
  }

  async submit(promptText, context, richText) {
    const composerId = await this.getOrCreateQuickAgentComposer(promptText);

    if (context) {
      await this.addContextToComposer(composerId, context);
    }

    const defaultModel =
      this.reactiveStorageService.applicationUserPersistentStorage.featureModelConfigs
        ?.quickAgent?.defaultModel ?? "default";

    await this.composerChatService.submitChatMaybeAbortCurrent(
      composerId,
      promptText,
      { modelOverride: defaultModel, richText: richText }
    );
  }

  async getOrCreateQuickAgentComposer(promptText) {
    // Reuse existing ephemeral quick agent composer if available
    if (this._quickAgentComposerId) {
      const existingData = this.composerDataService.getComposerDataIfLoaded(
        this._quickAgentComposerId
      );
      if (existingData && existingData.isEphemeral === true) {
        return this._quickAgentComposerId;
      }
      this.setQuickAgentComposerId(undefined);
    }

    const defaultModel =
      this.reactiveStorageService.applicationUserPersistentStorage.featureModelConfigs
        ?.quickAgent?.defaultModel ?? "default";

    const handle = await this.composerService.createComposer({
      partialState: {
        unifiedMode: "agent",
        modelConfig: { modelName: defaultModel, maxMode: false },
        text: promptText,
        isEphemeral: true,
        name: "Quick Chat",
      },
      autoSubmit: false,
      skipShowAndFocus: true,
      skipFocus: true,
      skipSelect: true,
    });

    if (!handle) {
      throw new Error("Failed to create quick agent composer");
    }

    this.setQuickAgentComposerId(handle.composerId);
    return handle.composerId;
  }

  async addContextToComposer(composerId, context) {
    const handle = this.composerDataService.getHandleIfLoaded(composerId);
    if (!handle) return;

    // Add file context
    if (context.files && context.files.length > 0) {
      for (const fileUri of context.files) {
        this.composerContextService.addContext({
          composerHandle: handle,
          contextType: "fileSelections",
          value: { uri: fileUri },
          shouldShowPreview: false,
        });
      }
    }

    // Add additional context (file selections, folder selections, code selections)
    if (context.additionalContext) {
      const additional = context.additionalContext;

      if (additional.fileSelections) {
        for (const fileSel of additional.fileSelections) {
          this.composerContextService.addContext({
            composerHandle: handle,
            contextType: "fileSelections",
            value: fileSel,
            shouldShowPreview: false,
          });
        }
      }

      if (additional.folderSelections) {
        for (const folderSel of additional.folderSelections) {
          this.composerContextService.addContext({
            composerHandle: handle,
            contextType: "folderSelections",
            value: folderSel,
            shouldShowPreview: false,
          });
        }
      }

      if (additional.selections) {
        for (const selection of additional.selections) {
          this.composerContextService.addContext({
            composerHandle: handle,
            contextType: "selections",
            value: selection,
            shouldShowPreview: false,
          });
        }
      }
    }
  }
};

QuickAgentService = __decorate(
  [
    __param(0, un),   // IInstantiationService
    __param(1, og),   // IComposerService
    __param(2, bM),   // IComposerChatService
    __param(3, Fa),   // IComposerDataService
    __param(4, cV),   // IComposerContextService
    __param(5, xu),   // IReactiveStorageService
  ],
  QuickAgentService
);

Ki(IQuickAgentService, QuickAgentService, 1);
