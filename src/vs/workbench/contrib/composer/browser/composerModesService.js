// Source: out-build/vs/workbench/contrib/composer/browser/composerModesService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// Brand references: cursor- → claude-

Di(), Jg(), st(), dr(), ps(), Ii(), Er(), Qt(), Sa(), Pd(), Sr(), _J(), gb(), Yu(), zSt(), mN(), wJ(), fce(), dp(), AJg(), hf(), ci(), bhn(), Vfa(), Bme();

const IComposerModesService = Bi("composerModesService");

let ComposerModesService = class ComposerModesService extends at {
  static { _self = this; }
  static { this.ACTION_ID_PREFIX = "composerMode."; }
  static {
    this.PROTECTED_MODE_IDS = [
      "agent", "chat", "edit", "background", "plan", "spec", "debug", "triage", "project"
    ];
  }

  constructor(
    reactiveStorageService,
    composerDataService,
    keybindingEditingService,
    keybindingService,
    configurationService,
    backgroundComposerDataService,
    modelConfigService,
    aiSettingsService,
    authenticationService,
    storageService,
    experimentService,
    commandService,
    instantiationService,
    debugServerService,
    workbenchCommandRegistry
  ) {
    super();
    this._reactiveStorageService = reactiveStorageService;
    this._composerDataService = composerDataService;
    this._keybindingEditingService = keybindingEditingService;
    this._keybindingService = keybindingService;
    this._configurationService = configurationService;
    this._backgroundComposerDataService = backgroundComposerDataService;
    this._modelConfigService = modelConfigService;
    this._aiSettingsService = aiSettingsService;
    this._cursorAuthenticationService = authenticationService;
    this._storageService = storageService;
    this._experimentService = experimentService;
    this._commandService = commandService;
    this._instantiationService = instantiationService;
    this._debugServerService = debugServerService;
    this._workbenchCommandRegistry = workbenchCommandRegistry;
    this.modeActionDisposables = new Map();

    // Remove legacy Cmd/Ctrl+E keybinding for background mode
    try {
      const backgroundActionId = `${_self.ACTION_ID_PREFIX}background`;
      const existingBindings = this._keybindingService
        .getKeybindings()
        .filter((binding) => binding.command === backgroundActionId);

      for (const binding of existingBindings) {
        const label = binding.resolvedKeybinding?.getUserSettingsLabel()?.toLowerCase();
        if (label === "cmd+e" || label === "ctrl+e" || label === "meta+e") {
          this._keybindingEditingService
            .removeKeybinding(binding)
            .catch((err) =>
              console.error(
                "[ChangeManagement] Failed to remove legacy background mode keybinding:",
                err
              )
            );
        }
      }
    } catch (err) {
      console.error(
        "[ChangeManagement] Failed to ensure background mode no longer uses Cmd/Ctrl+E:",
        err
      );
    }

    this.registerExistingModeActions();
    this.maybeRegisterBackgroundModeAction();

    this._register(
      this._cursorAuthenticationService.onDidPotentiallyChangePrivacyMode(() => {
        try {
          this.maybeRegisterBackgroundModeAction();
        } catch (err) {
          console.error(
            "[composerModesService] Failed to (re)register background command on privacy change:",
            err
          );
        }
      })
    );

    this._register(
      this._composerDataService.onDidChangeLastFocusedComposerId((composerId) => {
        if (this.getComposerUnifiedMode(composerId) === "debug") {
          this.maybeStartDebugServer();
        }
      })
    );

    const selectedId = this._composerDataService.selectedComposerId;
    if (selectedId && this.getComposerUnifiedMode(selectedId) === "debug") {
      this.maybeStartDebugServer();
    }
  }

  registerExistingModeActions() {
    const allModes = this.getAllModes();
    for (const mode of allModes) {
      if (mode.actionId) {
        this.registerModeAction(mode, mode.actionId);
      }
    }
  }

  maybeRegisterBackgroundModeAction() {
    const modeId = "background";
    const actionId = `${_self.ACTION_ID_PREFIX}${modeId}`;

    let modeConfig = (
      this._reactiveStorageService.applicationUserPersistentStorage.composerState?.modes4 ?? []
    ).find((m) => m.id === modeId);

    const hasKeybinding =
      !!this._keybindingService.lookupKeybinding(actionId) ||
      (!!modeConfig?.actionId &&
        !!this._keybindingService.lookupKeybinding(modeConfig.actionId));

    if (!this._cursorAuthenticationService.isBackgroundComposerEnabled() && !hasKeybinding) {
      return;
    }

    if (!modeConfig) {
      modeConfig = {
        id: modeId,
        name: "Cloud",
        actionId: actionId,
        icon: "cloudTwo",
        enabledTools: [],
        enabledMcpServers: [],
        shouldAutoApplyIfNoEditTool: false,
        autoFix: false,
        autoRun: false,
        thinkingLevel: "none",
      };
    }

    if (this.modeActionDisposables.has(modeId) && modeConfig.actionId === actionId) {
      return;
    }

    if (modeConfig.actionId !== actionId) {
      this.updateModeSetStore(modeId, (setField) => {
        setField("actionId", actionId);
      });
      modeConfig = { ...modeConfig, actionId: actionId };
    }

    this.registerModeAction(modeConfig, actionId);
  }

  getComposerUnifiedMode(composerId) {
    let composerData;
    rc(() => {
      composerData = this._composerDataService.getComposerDataIfLoaded(composerId);
      if (!composerData) {
        composerData = this._composerDataService.allComposersData.allComposers.find(
          (c) => c.composerId === composerId
        );
      }
    });

    const unifiedMode = composerData?.unifiedMode ?? "agent";

    if (this.checkIfModeExists(unifiedMode)) {
      return unifiedMode;
    }

    // Fallback: if mode doesn't exist, reset to "agent"
    if (composerId && this._composerDataService.loadedComposers.ids.includes(composerId)) {
      const handle = this._composerDataService.getHandleIfLoaded(composerId);
      if (handle) {
        this.setComposerUnifiedMode(handle, "agent");
      }
    }

    return "agent";
  }

  checkIfModeExists(modeId) {
    return rc(
      () =>
        !!(
          this.getAllModes().some((m) => m.id === modeId) ||
          _self.PROTECTED_MODE_IDS.includes(modeId)
        )
    );
  }

  setComposerUnifiedMode(composerHandle, modeId) {
    // Prevent debug mode with multiple models
    if (
      modeId === "debug" &&
      this._modelConfigService.getSelectedModelsForComposer(composerHandle).length > 1
    ) {
      return;
    }

    // Handle plan mode: filter models that support planning
    if (modeId === "plan") {
      const composerData = this._composerDataService.getComposerData(composerHandle);
      const modelNames = (
        composerData ? composerData.modelConfig?.modelName : undefined
      )
        ?.split(",")
        .map((name) => name.trim()) ?? [
        this._modelConfigService.getModelConfig("composer").modelName,
      ];

      const availableModels = this._aiSettingsService.getAvailableModelsWithStatus({
        specificModelField: "composer",
      });

      const planCapableModels = modelNames.filter((name) => {
        const modelInfo = availableModels.find((m) => m.name === name);
        return modelInfo ? jfa(modelInfo) : true;
      });

      if (planCapableModels.length === 0) {
        // No plan-capable models selected; find a fallback
        const featureModelConfigs =
          this._reactiveStorageService.applicationUserPersistentStorage.featureModelConfigs;
        let fallbackModel = X2A(featureModelConfigs).find((name) => {
          const modelInfo = availableModels.find((m) => m.name === name);
          return modelInfo && jfa(modelInfo);
        });
        if (!fallbackModel) {
          fallbackModel = availableModels.find((m) => jfa(m))?.name;
        }
        if (fallbackModel) {
          this._composerDataService.updateComposerDataSetStore(composerHandle, (setField) => {
            setField("modelConfig", "modelName", fallbackModel);
          });
        }
      } else if (planCapableModels.length !== modelNames.length) {
        // Some models removed; update to only plan-capable ones
        this._composerDataService.updateComposerDataSetStore(composerHandle, (setField) => {
          setField("modelConfig", "modelName", planCapableModels.join(","));
        });
      }
    }

    // Handle worktree creation for non-chat/non-background modes
    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (
      modeId !== "chat" &&
      modeId !== "background" &&
      composerData?.worktreeStartedReadOnly === true &&
      composerData?.gitWorktree === undefined &&
      composerData?.pendingCreateWorktree !== true
    ) {
      this._composerDataService.updateComposerDataSetStore(composerHandle, (setField) => {
        setField("pendingCreateWorktree", true);
        setField("worktreeStartedReadOnly", false);
      });
    }

    this._composerDataService.updateComposerDataSetStore(composerHandle, (setField) => {
      setField("unifiedMode", modeId);
    });

    if (modeId === "debug") {
      this.maybeStartDebugServer();
    }
  }

  maybeStartDebugServer() {
    this._debugServerService.getConfig().catch(() => {});
  }

  getAllModes() {
    const storedModes =
      this._reactiveStorageService.applicationUserPersistentStorage.composerState?.modes4 ?? [];

    // Modes to exclude
    const excludedModes = ["spec"];
    if (!this._experimentService.checkFeatureGate("nal_async_task_tool")) {
      excludedModes.push("triage");
    }
    excludedModes.push("project");

    // Preferred display order
    const displayOrder = ["agent", "triage", "plan", "spec", "debug", "chat"];

    return rc(() =>
      storedModes
        .filter((mode) => _self.PROTECTED_MODE_IDS.includes(mode.id))
        .filter((mode) => !excludedModes.includes(mode.id))
        .sort((modeA, modeB) => {
          const orderA = displayOrder.indexOf(modeA.id);
          const orderB = displayOrder.indexOf(modeB.id);
          const posA = orderA === -1 ? storedModes.indexOf(modeA) : orderA;
          const posB = orderB === -1 ? storedModes.indexOf(modeB) : orderB;
          return posA - posB;
        })
    );
  }

  getMode(modeId) {
    const allModes = this.getAllModes();
    let mode = rc(() => allModes.find((m) => m.id === modeId));

    if (!mode && _self.PROTECTED_MODE_IDS.includes(modeId)) {
      const storedModes =
        this._reactiveStorageService.applicationUserPersistentStorage.composerState?.modes4 ?? [];
      mode = rc(() => storedModes.find((m) => m.id === modeId));
    }

    if (!mode) {
      console.error(`[composerModesService] Mode not found: ${modeId}`);
    }

    return mode;
  }

  updateModeSetStore(modeId, callback) {
    callback((...args) => {
      this._reactiveStorageService.setApplicationUserPersistentStorage(
        "composerState",
        "modes4",
        (mode) => mode.id === modeId,
        ...args
      );
    });
  }

  getModeThinkingLevel(modeId) {
    return this.getAllModes().find((m) => m.id === modeId)?.thinkingLevel ?? "none";
  }

  setModeThinkingLevel(modeId, level) {
    this.updateModeSetStore(modeId, (setField) => {
      setField("thinkingLevel", level);
    });
  }

  getModeAutoRun(modeId) {
    if (Lq().isDisabledByAdmin) return false;
    return this.getAllModes().find((m) => m.id === modeId)?.autoRun ?? false;
  }

  setModeAutoRun(modeId, enabled) {
    this.updateModeSetStore(modeId, (setField) => {
      setField("autoRun", enabled);
    });
  }

  getModeFullAutoRun(modeId) {
    if (Lq().isDisabledByAdmin) return false;
    return this.getAllModes().find((m) => m.id === modeId)?.fullAutoRun ?? false;
  }

  setModeFullAutoRun(modeId, enabled) {
    this.updateModeSetStore(modeId, (setField) => {
      setField("fullAutoRun", enabled);
    });
    if (enabled) {
      this._autoApproveAllComposersInMode(modeId);
    }
  }

  getComposerAutoRun() {
    return this.getModeAutoRun("agent") ?? false;
  }

  setComposerAutoRun(enabled) {
    this.setModeAutoRun("agent", enabled);
    if (!enabled) {
      this.setModeFullAutoRun("agent", false);
    }
  }

  getComposerFullAutoRun() {
    return this.getModeFullAutoRun("agent") ?? false;
  }

  setComposerFullAutoRun(enabled) {
    this.setModeFullAutoRun("agent", enabled);
  }

  async _autoApprovePendingTerminalReviews(composerId) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const toolFormer = handle
      ? this._composerDataService.getToolFormer(handle)
      : undefined;

    if (!toolFormer) return;

    const { IToolCallHumanReviewService } = await Promise.resolve().then(() => (
      $J(), KSf
    ));

    const humanReviewService = this._instantiationService.invokeFunction((accessor) =>
      accessor.get(IToolCallHumanReviewService)
    );

    const pendingBubbleIds = rc(() =>
      toolFormer.pendingDecisions().userInteractionBubbleIds
    );

    for (const bubbleId of pendingBubbleIds) {
      const bubbleData = rc(() => toolFormer.getBubbleData(bubbleId));

      if (
        !bubbleData ||
        bubbleData.tool !== on.RUN_TERMINAL_COMMAND_V2 ||
        bubbleData?.additionalData?.reviewData?.status !== "Requested"
      ) {
        continue;
      }

      const currentHandle = this._composerDataService.getHandleIfLoaded(composerId);
      if (!currentHandle) continue;

      const reviewModel = humanReviewService.getTerminalReviewModelForBubble(
        currentHandle,
        bubbleId
      );

      if (reviewModel) {
        reviewModel.updateReviewData({ approvalType: fhn.FULL_AUTO });
        reviewModel.setSelectedOption(dD.RUN);
      }
    }
  }

  _autoApproveAllComposersInMode(modeId) {
    const composerIds = this._composerDataService.loadedComposers.store.ids;
    for (const composerId of composerIds) {
      if (this.getComposerUnifiedMode(composerId) === modeId) {
        this._autoApprovePendingTerminalReviews(composerId);
      }
    }
  }

  getModeShouldAutoApplyIfNoEditTool(modeId) {
    return (
      this.getAllModes().find((m) => m.id === modeId)?.shouldAutoApplyIfNoEditTool ?? false
    );
  }

  async saveModeKeybinding(modeId, keybinding) {
    const mode = this.getMode(modeId);
    if (!mode) {
      console.error(
        `[composerModesService] Cannot save keybinding for non-existent mode: ${modeId}`
      );
      return;
    }

    // Check for keybinding conflicts with other modes
    const conflictingMode = this.getAllModes().find((otherMode) => {
      if (otherMode.id === modeId) return false;
      if (otherMode.actionId) {
        const existingBinding = this._keybindingService.lookupKeybinding(
          otherMode.actionId
        );
        if (existingBinding) {
          return existingBinding.getUserSettingsLabel() === keybinding;
        }
      }
      return false;
    });

    if (conflictingMode) {
      throw new Error(
        `[composerModesService] Keybinding "${keybinding}" already used by mode "${conflictingMode.name}" (${conflictingMode.id})`
      );
    }

    try {
      let actionId = mode.actionId;
      if (!actionId) {
        actionId = this.generateActionIdForMode(mode);
        this.updateModeSetStore(modeId, (setField) => {
          setField("actionId", actionId);
        });
      }

      if (this._keybindingService.lookupKeybinding(actionId)) {
        const existingBinding = this._keybindingService
          .getKeybindings()
          .find((b) => b.command === actionId);
        if (existingBinding) {
          await this._keybindingEditingService.editKeybinding(
            existingBinding,
            keybinding,
            undefined
          );
        } else {
          await this._keybindingEditingService.addKeybindingRule(actionId, keybinding);
        }
      } else {
        await this._keybindingEditingService.addKeybindingRule(actionId, keybinding);
      }

      this.deregisterModeAction(modeId);
      this.registerModeAction(mode, actionId);
    } catch (err) {
      throw new Error(
        `[composerModesService] Failed to save keybinding for mode ${modeId}:`,
        err
      );
    }
  }

  deregisterModeAction(modeId) {
    const disposable = this.modeActionDisposables.get(modeId);
    if (disposable) {
      disposable.dispose();
      this.modeActionDisposables.delete(modeId);
    }
  }

  registerModeAction(mode, actionId) {
    try {
      this.deregisterModeAction(mode.id);
      const self = this;

      const disposable = this._workbenchCommandRegistry.registerAction2(
        class extends nn {
          constructor() {
            super({
              id: actionId,
              title: {
                value: `Open Chat in ${mode.name} Mode`,
                original: `Open Chat in ${mode.name} Mode`,
              },
              precondition: mode.id === "background" ? Zj.INSTANCE : undefined,
              f1: true,
            });
          }
          run(accessor) {
            return accessor.get(br).executeCommand(CMD_START_COMPOSER_PROMPT_2, mode.id);
          }
        }
      );

      this.modeActionDisposables.set(mode.id, disposable);
    } catch (err) {
      throw new Error(
        `[composerModesService] Failed to register action for mode ${mode.id}:`,
        err
      );
    }
  }

  generateActionIdForMode(mode) {
    if (!mode.name) {
      return `${_self.ACTION_ID_PREFIX}${mode.id}`;
    }

    let baseName = mode.name.toLowerCase().replace(/\s+/g, "_");
    let actionId = `${_self.ACTION_ID_PREFIX}${baseName}`;

    const existingActionIds = this.getAllModes()
      .filter((m) => m.id !== mode.id && m.actionId)
      .map((m) => m.actionId);

    if (!existingActionIds.includes(actionId)) {
      return actionId;
    }

    let suffix = 2;
    while (existingActionIds.includes(`${actionId}_${suffix}`)) {
      suffix++;
    }

    return `${actionId}_${suffix}`;
  }

  getModeActionId(modeId) {
    return this.getMode(modeId)?.actionId;
  }

  dispose() {
    for (const disposable of this.modeActionDisposables.values()) {
      disposable.dispose();
    }
    this.modeActionDisposables.clear();
    super.dispose();
  }

  getModeDescription(modeId) {
    switch (modeId) {
      case "agent":
        return "Plan, search, build anything";
      case "chat":
        return "Ask Claude questions about your codebase"; // brand: Cursor→Claude
      case "edit":
        return "Manually decide what gets added to the context (no tools)";
      case "plan":
        return "Create detailed plans for accomplishing tasks";
      case "spec":
        return "Create structured plans with implementation steps";
      case "triage":
        return "Coordinate long-horizon tasks with delegated subagents";
      default:
        return this.getMode(modeId)?.description;
    }
  }
};

ComposerModesService = _self = __decorate(
  [
    __param(0, xu),                  // IReactiveStorageService
    __param(1, Fa),                  // IComposerDataService
    __param(2, dnt),                 // IKeybindingEditingService
    __param(3, po),                  // IKeybindingService
    __param(4, On),                  // IConfigurationService
    __param(5, Yk),                  // IBackgroundComposerDataService
    __param(6, tx),                  // IModelConfigService
    __param(7, vU),                  // IAISettingsService
    __param(8, ag),                  // ICursorAuthenticationService
    __param(9, Ji),                  // IStorageService
    __param(10, Rl),                 // IExperimentService
    __param(11, br),                 // ICommandService
    __param(12, un),                 // IInstantiationService
    __param(13, xmn),               // IDebugServerService
    __param(14, lie),                // IWorkbenchCommandRegistry
  ],
  ComposerModesService
);

Ki(IComposerModesService, ComposerModesService, 1);
