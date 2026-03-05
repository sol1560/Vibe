// Source: out-build/vs/workbench/contrib/composer/browser/composerDecisionsService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerDecisionsService — handles tool call approval logic
// for shell commands, file writes, file deletes, and MCP tool invocations.

Y9(), st(), Qt(), Er(), $J(), Pd(), nP(), Jg(), Sr(), _me(), dp(), zw(), $d(), fce(), ls(), c2(),
  Gl(), _r(), tit(), $ye(), xie(), PCf(), uQ(), hnt(), fN(), J_a(), Jhn(), gb(), xme(), Yu();

// ============================================================
// Zod schemas for operation details validation
// ============================================================

/** Schema for file write operations */
const WriteOperationSchema = Pr.object({
  path: Pr.string(),
  reason: Pr.string(),
  isNewFile: Pr.boolean(),
  diffString: Pr.string(),
  before: Pr.string().optional(),
  after: Pr.string().optional(),
  blockReason: Pr.enum(["outOfWorkspace", "protectedConfig"]).optional(),
});

/** Schema for shell/terminal command operations */
const ShellOperationSchema = Pr.object({
  command: Pr.string(),
  workingDirectory: Pr.string().optional(),
  timeout: Pr.number().optional(),
  reason: Pr.string().optional(),
  hookSource: Pr.enum(["user", "project", "enterprise", "team"]).optional(),
  isSandboxAvailable: Pr.boolean().optional(),
  isSandboxEnabled: Pr.boolean().optional(),
  canAllowlist: Pr.boolean().optional(),
  notAllowedCommands: Pr.array(Pr.string()).optional(),
});

/** Schema for file delete operations */
const DeleteOperationSchema = Pr.object({
  path: Pr.string(),
});

/** Schema for MCP tool call operations */
const McpOperationSchema = Pr.object({
  name: Pr.string(),
  toolName: Pr.string(),
  providerIdentifier: Pr.string(),
  args: Pr.record(Pr.string(), Pr.any()),
  reason: Pr.string().optional(),
  hookSource: Pr.enum(["user", "project", "enterprise", "team"]).optional(),
  canAllowlist: Pr.boolean().optional(),
});

// ============================================================
// Service ID
// ============================================================

const IComposerDecisionsService = Bi("composerDecisionsService");

// ============================================================
// ComposerDecisionsService
// ============================================================

/**
 * ComposerDecisionsService
 *
 * Central service for handling tool call approval flows.
 * When the agent wants to run a shell command, edit a file,
 * delete a file, or call an MCP tool, this service:
 * 1. Validates the operation
 * 2. Checks auto-approval settings (allowlist, full auto, sandbox)
 * 3. If needed, shows a review UI and waits for user decision
 * 4. Returns the approval result
 *
 * Also tracks analytics events for each approval interaction.
 */
let ComposerDecisionsService = class extends at {
  constructor(
    toolCallHumanReviewService,
    reactiveStorageService,
    composerViewsService,
    composerDataService,
    aiService,
    analyticsService,
    cursorAuthenticationService,
    workspaceContextService,
    composerModesService,
    storageService,
    pendingApprovalRegistry,
    asyncOperationRegistry,
    experimentService,
    mcpService
  ) {
    super();
    this._toolCallHumanReviewService = toolCallHumanReviewService;
    this._reactiveStorageService = reactiveStorageService;
    this._composerViewsService = composerViewsService;
    this._composerDataService = composerDataService;
    this._aiService = aiService;
    this._analyticsService = analyticsService;
    this._cursorAuthenticationService = cursorAuthenticationService;
    this._workspaceContextService = workspaceContextService;
    this._composerModesService = composerModesService;
    this._storageService = storageService;
    this._pendingApprovalRegistry = pendingApprovalRegistry;
    this._asyncOperationRegistry = asyncOperationRegistry;
    this._experimentService = experimentService;
    this._mcpService = mcpService;
  }

  // --- Privacy mode ---

  isPrivacyModeEnabled() {
    const privacyMode = this._cursorAuthenticationService.granularPrivacyModeRawEnum();
    switch (privacyMode) {
      case mm.NO_STORAGE:
      case mm.NO_TRAINING:
        return true;
      case mm.USAGE_DATA_TRAINING_ALLOWED:
      case mm.USAGE_CODEBASE_TRAINING_ALLOWED:
        return false;
      case mm.UNSPECIFIED:
        return true;
      default:
        return privacyMode;
    }
  }

  getFullPathForAnalytics(relativePath) {
    try {
      return this._workspaceContextService.resolveRelativePath(relativePath).fsPath;
    } catch {
      return relativePath;
    }
  }

  // --- MCP block reason mapping ---

  asMcpBlockReason(reason) {
    switch (reason) {
      case "notInAllowlist":
      case "playwrightProtection":
      case "mcpToolsProtection":
      case "readonlyMode":
      case "hookBlocked":
        return reason;
      default:
        return;
    }
  }

  // --- Analytics reason code helpers ---

  toShellReasonCodeForAnalytics(operation, notAllowedCommands) {
    const reason = operation.reason;
    if (typeof reason === "string") {
      if (reason.includes("team blocklist") || reason.includes("In team blocklist"))
        return "shell.team_blocklisted";
      if (reason.includes("Not in team allowlist")) return "shell.not_in_team_allowlist";
      if (reason.includes("Not in allowlist")) return "shell.not_allowlisted";
    }
    switch (reason) {
      case "notInAllowlist":
        return "shell.not_allowlisted";
      case "inBlocklist":
        return "shell.in_blocklist";
      case "notInTeamAllowlist":
        return "shell.not_in_team_allowlist";
      case "deleteProtection":
        return "shell.delete_protection";
      case "readonlyMode":
        return "shell.readonly_mode";
      case "hookBlocked":
        return "shell.blocked_by_hook";
      default:
        break;
    }
    return notAllowedCommands && notAllowedCommands.length > 0
      ? "shell.not_allowlisted"
      : "shell.needs_approval";
  }

  toMcpReasonCodeForAnalytics(reason) {
    switch (reason) {
      case "notInAllowlist":
        return "mcp.tool_not_allowlisted";
      case "playwrightProtection":
        return "mcp.browser_protection";
      case "mcpToolsProtection":
        return "mcp.tools_protection";
      case "readonlyMode":
        return "mcp.readonly_mode";
      case "hookBlocked":
        return "mcp.blocked_by_hook";
      default:
        return reason;
    }
  }

  getInvocationId(composerHandle) {
    const data = this._composerDataService.getComposerData(composerHandle);
    return data?.latestChatGenerationUUID ?? data?.chatGenerationUUID ?? void 0;
  }

  toEditReasonForAnalytics(reasonInfo) {
    if (reasonInfo) {
      switch (reasonInfo.type) {
        case "outOfWorkspace":
          return "outOfWorkspace";
        case "cursorIgnore":
          return reasonInfo.source === "globalIgnore"
            ? "cursorIgnore_global"
            : "cursorIgnore_workspace";
        case "otherThreadEdit":
          return "otherThreadEdit";
        case "restrictedFile":
          return "restrictedFile";
        case "adminBlock":
          return "adminBlock";
        default:
          return reasonInfo;
      }
    }
  }

  toWriteReasonCodeForAnalytics(reasonInfo) {
    if (!reasonInfo) return "write.needs_approval";
    switch (reasonInfo.type) {
      case "outOfWorkspace":
        return "write.out_of_workspace";
      case "restrictedFile":
        return "write.restricted_file";
      case "cursorIgnore":
        return "write.cursor_ignore";
      case "adminBlock":
        return "write.admin_block";
      case "otherThreadEdit":
        return "write.needs_approval";
      default:
        return reasonInfo;
    }
  }

  trackTrajectoryStopped(eventData) {
    try {
      this._analyticsService.trackEvent("composer.agent_trajectory_stopped", eventData);
    } catch {}
  }

  getShellApprovalMode(isSandboxEnabled, settings) {
    if (settings.enableRunEverything) return "full_yolo";
    if (isSandboxEnabled) return "sandbox";
    if (settings.allowedCommands.length > 0) return "allowlist";
    return "ask_every_time";
  }

  // --- Tool context helpers ---

  getToolContextOrThrow(composerHandle, toolCallId) {
    const context = H_a(this._composerDataService, composerHandle, toolCallId);
    if (!context) {
      throw new Error(
        `[ComposerDecisionsService] Could not find bubble for toolCallId: ${toolCallId}`
      );
    }
    return context;
  }

  getUserApprovedWriteFiles(composerHandle) {
    const data = this._composerDataService.getComposerData(composerHandle);
    const approved = new Set(data?.userApprovedWriteFiles ?? []);

    // Include parent composer's approved files for subagents
    if (data?.subagentInfo?.parentComposerId) {
      const parentHandle = this._composerDataService.getHandleIfLoaded(
        data.subagentInfo.parentComposerId
      );
      if (parentHandle) {
        const parentData = this._composerDataService.getComposerData(parentHandle);
        for (const file of parentData?.userApprovedWriteFiles ?? []) {
          approved.add(file);
        }
      }
    }
    return approved;
  }

  getUserApprovedWriteDirectories(composerHandle) {
    const data = this._composerDataService.getComposerData(composerHandle);
    const approved = new Set(data?.userApprovedWriteDirectories ?? []);

    if (data?.subagentInfo?.parentComposerId) {
      const parentHandle = this._composerDataService.getHandleIfLoaded(
        data.subagentInfo.parentComposerId
      );
      if (parentHandle) {
        const parentData = this._composerDataService.getComposerData(parentHandle);
        for (const dir of parentData?.userApprovedWriteDirectories ?? []) {
          approved.add(dir);
        }
      }
    }
    return approved;
  }

  normalizeFilePath(path) {
    try {
      return this._workspaceContextService.resolveRelativePath(path).fsPath;
    } catch {
      return path;
    }
  }

  async getToolContextOrWait(composerHandle, toolCallId) {
    const composerId = composerHandle.composerId;
    let context = H_a(this._composerDataService, composerHandle, toolCallId);

    if (!context) {
      await this._pendingApprovalRegistry.waitForBubbleCreation(composerId, toolCallId);
      context = H_a(this._composerDataService, composerHandle, toolCallId);
    }

    if (!context) {
      throw new Error(
        `[ComposerDecisionsService] Could not find bubble for toolCallId: ${toolCallId} after waiting`
      );
    }
    return context;
  }

  // ============================================================
  // Main approval dispatch
  // ============================================================

  async handleApprovalRequest(composerHandle, request) {
    switch (request.operation.type) {
      case "shell": {
        const details = ShellOperationSchema.parse(request.operation.details);
        return this.handleShellOperation(composerHandle, request.toolCallId, details);
      }
      case "write": {
        const details = WriteOperationSchema.parse(request.operation.details);
        return this.handleWriteOperation(composerHandle, request.toolCallId, details);
      }
      case "delete": {
        const details = DeleteOperationSchema.parse(request.operation.details);
        return this.handleDeleteOperation(composerHandle, request.toolCallId, details);
      }
      case "mcp": {
        const details = McpOperationSchema.parse(request.operation.details);
        return this.handleMcpOperation(composerHandle, request.toolCallId, details);
      }
      default:
        return { approved: false, reason: "Unknown operation type" };
    }
  }

  // --- MCP approval for app calls (non-interactive) ---

  getMcpToolApprovalForAppCall({ toolName, serverIdentifier }) {
    const settings = Lq();
    if (this._composerModesService.getComposerFullAutoRun()) {
      return { approved: true };
    }
    const autoRun = this._composerModesService.getComposerAutoRun();
    const allowedTools = settings.mcpAllowedTools ?? [];
    if (autoRun && Lhu({ serverId: serverIdentifier, toolName, allowlist: allowedTools })) {
      return { approved: true };
    }
    return { approved: false, reason: "notInAllowlist" };
  }

  // ============================================================
  // Shell (terminal command) approval
  // ============================================================

  async handleShellOperation(composerHandle, toolCallId, operation) {
    let toolContext;
    try {
      toolContext = await this.getToolContextOrWait(composerHandle, toolCallId);
    } catch (error) {
      return {
        approved: false,
        reason: `Failed to find tool call context: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    const toolFormer = this._composerDataService.getToolFormer(toolContext.composerHandle);
    if (!toolFormer)
      throw new Error("[ComposerDecisionsService] ToolFormer not found for composerHandle");

    const composerData = this._composerDataService.getComposerData(toolContext.composerHandle);
    if (!composerData)
      throw new Error("[ComposerDecisionsService] Composer not found for composerHandle");

    // Get abort controller
    let abortController;
    if (composerData.chatGenerationUUID) {
      abortController =
        this._aiService.streamingAbortControllers.get(composerData.chatGenerationUUID) ??
        new AbortController();
    } else {
      abortController = new AbortController();
    }

    const candidatesForAllowlist = operation.canAllowlist
      ? operation.notAllowedCommands
      : void 0;

    const reasonCode = this.toShellReasonCodeForAnalytics(operation, candidatesForAllowlist);
    const stopCategory =
      reasonCode === "shell.blocked_by_hook" ||
      reasonCode === "shell.readonly_mode" ||
      reasonCode === "shell.in_blocklist" ||
      reasonCode === "shell.team_blocklisted"
        ? "blocked_by_policy"
        : "needs_user_approval";

    const settings = Lq();

    this.trackTrajectoryStopped({
      composerId: toolContext.composerHandle.composerId,
      invocationID: this.getInvocationId(toolContext.composerHandle),
      toolCallId,
      stop_category: stopCategory,
      stop_source: "shell",
      reason_code: reasonCode,
      hook_source: operation.hookSource,
      shell_approval_mode: this.getShellApprovalMode(operation.isSandboxEnabled, settings),
      shell_is_admin_controlled: settings.isAdminControlled,
      shell_can_allowlist: operation.canAllowlist,
      shell_not_allowed_commands_count: candidatesForAllowlist?.length,
      shell_is_sandbox_available: operation.isSandboxAvailable,
      shell_is_sandbox_enabled: operation.isSandboxEnabled,
    });

    toolFormer.setBubbleData(toolContext.bubbleId, {
      additionalData: { status: "pending", blockReason: operation.reason },
    });

    // Run terminal review UI
    const result = await this.runTerminalReviewMode(
      toolFormer,
      toolContext.bubbleId,
      toolContext.composerHandle,
      abortController,
      candidatesForAllowlist,
      toolCallId
    );

    switch (result.type) {
      case SV.RUN:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "running" },
        });
        return { approved: true };

      case SV.SKIP:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "skipped" },
        });
        return { approved: false, reason: "User chose to skip" };

      case SV.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "rejected" },
        });
        return { approved: false, reason: result.feedback };

      case SV.ALLOWLIST_COMMANDS:
        // Add commands to allowlist
        this._reactiveStorageService.setApplicationUserPersistentStorage(
          "composerState",
          "yoloCommandAllowlist",
          (existing) => [
            ...(existing ?? []),
            ...result.commands.filter((cmd) => !(existing ?? []).includes(cmd)),
          ]
        );
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "running" },
        });
        return { approved: true };

      case SV.NONE:
      default:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "cancelled" },
        });
        return { approved: false, reason: "Review cancelled or failed" };
    }
  }

  // ============================================================
  // Delete file approval
  // ============================================================

  async handleDeleteOperation(composerHandle, toolCallId, operation) {
    const settings = Lq();

    let toolContext;
    try {
      toolContext = await this.getToolContextOrWait(composerHandle, toolCallId);
    } catch (error) {
      return {
        approved: false,
        reason: `Failed to find tool call context: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    const toolFormer = this._composerDataService.getToolFormer(toolContext.composerHandle);
    if (!toolFormer)
      throw new Error("[ComposerDecisionsService] ToolFormer not found for composerHandle");

    const normalizedPath = Ime(this._workspaceContextService, operation.path);

    // Auto-approve if file is in allowed list
    if (AFA(normalizedPath)) {
      toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
      return { approved: true };
    }

    // Auto-approve in full auto mode
    if (toolFormer.shouldAutoRun_runEverythingMode()) {
      toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
      return { approved: true };
    }

    // Check if delete file protection is enabled
    if (settings.deleteFileProtection) {
      this.trackTrajectoryStopped({
        composerId: toolContext.composerHandle.composerId,
        invocationID: this.getInvocationId(toolContext.composerHandle),
        toolCallId,
        stop_category: "needs_user_approval",
        stop_source: "delete",
        reason_code: "delete.needs_approval",
        delete_file_protection_enabled: settings.deleteFileProtection,
      });

      return new Promise((resolve) => {
        toolFormer.addPendingDecision(
          toolContext.bubbleId,
          on.DELETE_FILE,
          toolCallId,
          (approved) => {
            resolve(
              approved
                ? { approved: true }
                : { approved: false, reason: "User rejected the delete operation" }
            );
          },
          true
        );
      });
    }

    // No protection — auto-approve
    toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
    return { approved: true };
  }

  // ============================================================
  // Write file approval
  // ============================================================

  async handleWriteOperation(composerHandle, toolCallId, operation) {
    let toolContext;
    try {
      toolContext = await this.getToolContextOrWait(composerHandle, toolCallId);
    } catch (error) {
      return {
        approved: false,
        reason: `Failed to find tool call context: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    const toolFormer = this._composerDataService.getToolFormer(toolContext.composerHandle);
    if (!toolFormer)
      throw new Error("[ComposerDecisionsService] ToolFormer not found for composerHandle");

    const composerData = this._composerDataService.getComposerData(toolContext.composerHandle);
    if (!composerData)
      throw new Error("[ComposerDecisionsService] Composer not found for composerHandle");

    let abortController;
    if (composerData.chatGenerationUUID) {
      abortController =
        this._aiService.streamingAbortControllers.get(composerData.chatGenerationUUID) ??
        new AbortController();
    } else {
      abortController = new AbortController();
    }

    const settings = Lq();
    const blockReason = operation.blockReason;

    // Skip protection if disabled
    if (blockReason === "outOfWorkspace" && !settings.outsideWorkspaceProtection) {
      toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
      return { approved: true };
    }

    // Check if file was already approved
    if (blockReason) {
      const normalizedPath = this.normalizeFilePath(operation.path);
      if (this.getUserApprovedWriteFiles(toolContext.composerHandle).has(normalizedPath)) {
        toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
        return { approved: true };
      }

      // Check if directory was approved
      if (
        blockReason === "outOfWorkspace" &&
        [...this.getUserApprovedWriteDirectories(toolContext.composerHandle)].some((dir) =>
          X2n(normalizedPath, dir, yc)
        )
      ) {
        toolFormer.setBubbleData(toolContext.bubbleId, { userDecision: "accepted" });
        return { approved: true };
      }
    }

    // Store before/after content for review
    const fileUri = this._workspaceContextService.resolveRelativePath(operation.path);
    const beforeContent = operation.before;
    const afterContent = operation.after;

    let beforeContentId;
    if (beforeContent !== void 0) {
      const serialized = Zae.serialize(beforeContent);
      beforeContentId = `composer.content.${sQ(await dye(serialized))}`;
      if ((await this._storageService.cursorDiskKVGet(beforeContentId)) === void 0) {
        await this._storageService.cursorDiskKVSet(beforeContentId, beforeContent);
      }
    }

    let afterContentId;
    if (afterContent !== void 0) {
      const serialized = Zae.serialize(afterContent);
      afterContentId = `composer.content.${sQ(await dye(serialized))}`;
      if ((await this._storageService.cursorDiskKVGet(afterContentId)) === void 0) {
        await this._storageService.cursorDiskKVSet(afterContentId, afterContent);
      }
    }

    // Map block reason to reason info
    const reasonForAcceptReject = (() => {
      if (blockReason) {
        switch (blockReason) {
          case "outOfWorkspace":
            return { type: "outOfWorkspace" };
          case "protectedConfig":
            return { type: "restrictedFile" };
          default:
            return;
        }
      }
    })();

    // Set bubble data with before/after references
    toolFormer.setBubbleData(toolContext.bubbleId, {
      params: new ohe({
        relativeWorkspacePath: operation.path,
        noCodeblock: true,
        streamingContent: afterContent,
      }),
      result: new MRe({
        beforeContentId: beforeContentId,
        afterContentId: afterContentId ?? "",
      }),
      additionalData: {
        reasonForAcceptReject,
        blockReason,
      },
    });

    // Analytics
    const writeReasonCode = (() => {
      switch (blockReason) {
        case "outOfWorkspace":
          return "write.out_of_workspace";
        case "protectedConfig":
          return "write.protected_config";
        default:
          return this.toWriteReasonCodeForAnalytics(reasonForAcceptReject);
      }
    })();

    const stopCategory =
      writeReasonCode === "write.cursor_ignore" || writeReasonCode === "write.admin_block"
        ? "blocked_by_policy"
        : "needs_user_approval";

    this.trackTrajectoryStopped({
      composerId: toolContext.composerHandle.composerId,
      invocationID: this.getInvocationId(toolContext.composerHandle),
      toolCallId,
      blocked_file_path:
        this.isPrivacyModeEnabled() || !blockReason
          ? void 0
          : this.getFullPathForAnalytics(operation.path),
      stop_category: stopCategory,
      stop_source: "write",
      reason_code: writeReasonCode,
      edit_reason:
        this.toEditReasonForAnalytics(reasonForAcceptReject) ??
        (blockReason ? "unknown" : void 0),
    });

    // Run edit review UI
    const result = await this.runEditReviewMode(
      toolFormer,
      toolContext.bubbleId,
      toolContext.composerHandle,
      fileUri,
      abortController,
      toolCallId
    );

    if (result.type === hX.ACCEPT) {
      // Remember approved file path
      if (blockReason) {
        const normalizedPath = this.normalizeFilePath(operation.path);
        this._composerDataService.updateComposerDataSetStore(
          toolContext.composerHandle,
          (setter) => {
            setter("userApprovedWriteFiles", (existing = []) =>
              existing.includes(normalizedPath) ? existing : [...existing, normalizedPath]
            );
          }
        );
      }
      return { approved: true };
    } else if (result.type === hX.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY) {
      return { approved: false, reason: result.feedback };
    } else if (result.type === hX.SKIP) {
      return { approved: false, reason: "User chose to skip" };
    } else if (result.type === hX.ACCEPT_AND_ALLOW_FOLDER) {
      // Remember approved directory
      const normalizedPath = this.normalizeFilePath(operation.path);
      const directory = jN(normalizedPath);
      this._composerDataService.updateComposerDataSetStore(
        toolContext.composerHandle,
        (setter) => {
          setter("userApprovedWriteDirectories", (existing = []) =>
            existing.includes(directory) ? existing : [...existing, directory]
          );
        }
      );
      return { approved: true };
    }

    return { approved: false, reason: "Review cancelled or rejected" };
  }

  // ============================================================
  // Edit review mode (UI interaction)
  // ============================================================

  async runEditReviewMode(toolFormer, bubbleId, composerHandle, fileUri, abortController, toolCallId) {
    let reviewModel = this._toolCallHumanReviewService.getEditReviewModelForBubble(
      composerHandle,
      bubbleId
    );

    // Ensure bubble has edit tool type set
    if (!reviewModel) {
      const bubble = toolFormer.getBubbleData(bubbleId);
      if (bubble) {
        const isEditTool =
          bubble.tool === on.EDIT_FILE || bubble.tool === on.EDIT_FILE_V2;
        if (!bubble.tool || isEditTool) {
          if (!bubble.tool) toolFormer.setBubbleData(bubbleId, { tool: on.EDIT_FILE_V2 });
          reviewModel = this._toolCallHumanReviewService.getEditReviewModelForBubble(
            composerHandle,
            bubbleId
          );
        }
      }
    }

    if (!reviewModel) return Promise.resolve({ type: hX.NONE });

    const composerId = composerHandle.composerId;
    this._composerViewsService.focus(composerId);

    abortController.signal.addEventListener("abort", () => {
      reviewModel.reset();
    });

    // Check if already resolved
    const existingResult = NCf(reviewModel.getHumanReviewData());
    if (existingResult) return existingResult;

    reviewModel.setStatus(BA.REQUESTED);
    const removePending = toolFormer.addPendingDecision(
      bubbleId,
      on.EDIT_FILE_V2,
      toolCallId,
      () => {},
      true
    );

    const processReviewData = (reviewData, disposable, resolve) => {
      if (reviewData === void 0 || reviewData.status === BA.NONE) {
        disposable.dispose();
        removePending();
        resolve({ type: hX.NONE });
        return;
      }
      if (reviewData.status === BA.DONE) {
        disposable.dispose();
        removePending();
        resolve(NCf(reviewData) ?? { type: hX.NONE });
      }
    };

    return new Promise((resolve) => {
      const watcher = this._reactiveStorageService.onChangeEffectManuallyDisposed({
        deps: [() => reviewModel.getHumanReviewData()],
        onChange: ({ deps }) => {
          try {
            processReviewData(deps[0], watcher, resolve);
          } catch (error) {
            console.error("Error during processing review mode", error);
            watcher.dispose();
            resolve({ type: hX.NONE });
          }
        },
      });
      abortController.signal.addEventListener("abort", () => {
        resolve({ type: hX.NONE });
      });
    });
  }

  // ============================================================
  // MCP tool call approval
  // ============================================================

  async handleMcpOperation(composerHandle, toolCallId, operation) {
    let toolContext;
    try {
      toolContext = await this.getToolContextOrWait(composerHandle, toolCallId);
    } catch (error) {
      return {
        approved: false,
        reason: `Failed to find tool call context: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    const toolFormer = this._composerDataService.getToolFormer(toolContext.composerHandle);
    if (!toolFormer)
      throw new Error("[ComposerDecisionsService] ToolFormer not found for composerHandle");

    const composerData = this._composerDataService.getComposerData(toolContext.composerHandle);
    if (!composerData)
      throw new Error("[ComposerDecisionsService] Composer not found for composerHandle");

    const serverIdentifier = operation.providerIdentifier;
    const mcpLogger = this._mcpService.mcpAllowlistLogger;
    mcpLogger.info(
      `[handleMcpOperation] Tool="${operation.toolName}", server="${serverIdentifier}", canAllowlist=${operation.canAllowlist}, reason="${operation.reason ?? "none"}"`
    );

    const settings = Lq();
    const isPlaywrightTool = vpn.includes(serverIdentifier);

    // Full auto mode — auto-approve (except playwright)
    if (this._composerModesService.getComposerFullAutoRun() && !isPlaywrightTool) {
      toolFormer.setBubbleData(toolContext.bubbleId, {
        userDecision: "accepted",
        additionalData: { status: "running" },
      });
      return { approved: true };
    }

    // Playwright without protection — auto-approve
    if (isPlaywrightTool && !settings.playwrightProtection) {
      toolFormer.setBubbleData(toolContext.bubbleId, {
        userDecision: "accepted",
        additionalData: { status: "running" },
      });
      return { approved: true };
    }

    // Check allowlist
    const autoRun = this._composerModesService.getComposerAutoRun();
    const allowedTools = settings.mcpAllowedTools ?? [];
    const isInAllowlist =
      autoRun &&
      Lhu({
        serverId: serverIdentifier,
        toolName: operation.toolName,
        allowlist: allowedTools,
      });

    const mcpBlockReason = this.asMcpBlockReason(operation.reason);

    if (isInAllowlist && (!mcpBlockReason || mcpBlockReason === "notInAllowlist")) {
      toolFormer.setBubbleData(toolContext.bubbleId, {
        userDecision: "accepted",
        additionalData: { status: "running" },
      });
      return { approved: true };
    }

    // Need user approval
    let abortController;
    if (composerData.chatGenerationUUID) {
      abortController =
        this._aiService.streamingAbortControllers.get(composerData.chatGenerationUUID) ??
        new AbortController();
    } else {
      abortController = new AbortController();
    }

    const candidatesForAllowlist = operation.canAllowlist
      ? [{ tool: operation.toolName, server: serverIdentifier }]
      : void 0;

    // Determine block reason
    let blockReason;
    if (mcpBlockReason) {
      blockReason = mcpBlockReason;
    } else if (isPlaywrightTool && settings.playwrightProtection) {
      blockReason = "playwrightProtection";
    } else if (operation.canAllowlist) {
      blockReason = "notInAllowlist";
    } else {
      blockReason = "mcpToolsProtection";
    }

    toolFormer.setBubbleData(toolContext.bubbleId, {
      additionalData: { status: "pending", blockReason },
    });

    const stopCategory =
      blockReason === "hookBlocked" || blockReason === "readonlyMode"
        ? "blocked_by_policy"
        : "needs_user_approval";

    this.trackTrajectoryStopped({
      composerId: toolContext.composerHandle.composerId,
      invocationID: this.getInvocationId(toolContext.composerHandle),
      toolCallId,
      stop_category: stopCategory,
      stop_source: "mcp",
      reason_code: blockReason
        ? this.toMcpReasonCodeForAnalytics(blockReason)
        : "mcp.needs_approval",
      hook_source: operation.hookSource,
      mcp_can_allowlist: operation.canAllowlist,
      mcp_is_playwright_tool: isPlaywrightTool,
      mcp_playwright_protection_enabled: settings.playwrightProtection,
    });

    // Run MCP review UI
    const result = await this.runMCPReviewMode(
      toolFormer,
      toolContext.bubbleId,
      toolContext.composerHandle,
      abortController,
      candidatesForAllowlist,
      toolCallId,
      operation.toolName,
      serverIdentifier
    );

    switch (result.type) {
      case EQ.RUN:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "running" },
        });
        return { approved: true };

      case EQ.SKIP:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "skipped" },
        });
        return { approved: false, reason: "User chose to skip" };

      case EQ.REJECT_AND_TELL_WHAT_TO_DO_DIFFERENTLY:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "rejected" },
        });
        return { approved: false, reason: result.feedback };

      case EQ.ALLOWLIST_TOOL:
        mcpLogger.info(
          `[handleMcpOperation] User chose ALLOWLIST_TOOL. Adding "${serverIdentifier}:${operation.toolName}" to allowlist.`
        );
        this._reactiveStorageService.setApplicationUserPersistentStorage(
          "composerState",
          "mcpAllowedTools",
          (existing) =>
            DCf(operation.toolName, serverIdentifier, existing ?? [])
        );
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "running" },
        });
        return { approved: true };

      case EQ.NONE:
      default:
        toolFormer.setBubbleData(toolContext.bubbleId, {
          additionalData: { status: "cancelled" },
        });
        return { approved: false, reason: "Review cancelled or failed" };
    }
  }

  // ============================================================
  // Terminal review mode (UI interaction)
  // ============================================================

  async runTerminalReviewMode(
    toolFormer,
    bubbleId,
    composerHandle,
    abortController,
    candidatesForAllowlist,
    toolCallId
  ) {
    const reviewModel = this._toolCallHumanReviewService.getTerminalReviewModelForBubble(
      composerHandle,
      bubbleId
    );
    if (!reviewModel) return { type: SV.NONE };

    reviewModel.updateReviewData({ candidatesForAllowlist: candidatesForAllowlist ?? [] });
    this._composerViewsService.triggerScrollToBottom(composerHandle);

    abortController.signal.addEventListener("abort", () => {
      reviewModel.reset();
    });

    const existingResult = MCf(reviewModel.getHumanReviewData());
    if (existingResult) return existingResult;

    const composerId = composerHandle.composerId;
    this._asyncOperationRegistry.enter(composerId, "terminal_user_approval");

    reviewModel.setStatus(BA.REQUESTED);
    const removePending = toolFormer.addPendingDecision(
      bubbleId,
      on.RUN_TERMINAL_COMMAND_V2,
      toolCallId,
      () => {},
      true
    );

    const processReviewData = (reviewData, disposable, resolve) => {
      if (reviewData === void 0) {
        disposable.dispose();
        removePending();
      } else if (reviewData.status === BA.NONE) {
        disposable.dispose();
        removePending();
        resolve({ type: SV.NONE });
      } else if (reviewData.status === BA.DONE) {
        disposable.dispose();
        resolve(MCf(reviewData) ?? { type: SV.NONE });
        removePending();
      }
    };

    try {
      return await new Promise((resolve) => {
        const watcher = this._reactiveStorageService.onChangeEffectManuallyDisposed({
          deps: [() => reviewModel.getHumanReviewData()],
          onChange: ({ deps }) => {
            try {
              processReviewData(deps[0], watcher, resolve);
            } catch (error) {
              console.error("Error during processing of terminal review mode", error);
              watcher.dispose();
              resolve({ type: SV.NONE });
            }
          },
        });
        abortController.signal.addEventListener("abort", () => {
          resolve({ type: SV.NONE });
        });
      });
    } finally {
      this._asyncOperationRegistry.exit(composerId, "terminal_user_approval");
    }
  }

  // ============================================================
  // MCP review mode (UI interaction)
  // ============================================================

  async runMCPReviewMode(
    toolFormer,
    bubbleId,
    composerHandle,
    abortController,
    candidatesForAllowlist,
    toolCallId,
    toolName,
    serverIdentifier
  ) {
    const reviewModel = this._toolCallHumanReviewService.getMCPReviewModelForBubble(
      composerHandle,
      bubbleId
    );
    if (!reviewModel) return { type: EQ.NONE };

    reviewModel.updateReviewData({
      candidatesForAllowlist: candidatesForAllowlist ?? [],
      toolName,
      serverId: serverIdentifier,
    });
    this._composerViewsService.triggerScrollToBottom(composerHandle);

    abortController.signal.addEventListener("abort", () => {
      reviewModel.reset();
    });

    const existingResult = FCf(reviewModel.getHumanReviewData());
    if (existingResult) return existingResult;

    const composerId = composerHandle.composerId;
    this._asyncOperationRegistry.enter(composerId, "mcp_user_approval");

    reviewModel.setStatus(BA.REQUESTED);
    const removePending = toolFormer.addPendingDecision(
      bubbleId,
      on.MCP,
      toolCallId,
      () => {},
      true
    );

    const processReviewData = (reviewData, currentAllowlist, disposable, resolve) => {
      if (reviewData === void 0) {
        disposable.dispose();
        removePending();
      } else if (reviewData.status === BA.NONE) {
        disposable.dispose();
        removePending();
        resolve({ type: EQ.NONE });
      } else if (reviewData.status === BA.DONE) {
        disposable.dispose();
        resolve(FCf(reviewData) ?? { type: EQ.NONE });
        removePending();
      } else if (reviewData.status === BA.REQUESTED) {
        // Check if tool was added to allowlist while waiting
        if (
          Lhu({
            serverId: serverIdentifier,
            toolName,
            allowlist: currentAllowlist,
          })
        ) {
          disposable.dispose();
          removePending();
          reviewModel.setSelectedOption(AI.RUN);
          reviewModel.setStatus(BA.DONE);
          resolve({ type: EQ.RUN });
        }
      }
    };

    try {
      return await new Promise((resolve) => {
        const watcher = this._reactiveStorageService.onChangeEffectManuallyDisposed({
          deps: [
            () => reviewModel.getHumanReviewData(),
            () =>
              this._reactiveStorageService.applicationUserPersistentStorage.composerState
                .mcpAllowedTools ?? [],
          ],
          onChange: ({ deps }) => {
            try {
              processReviewData(deps[0], deps[1], watcher, resolve);
            } catch (error) {
              console.error("Error during processing of MCP review mode", error);
              watcher.dispose();
              resolve({ type: EQ.NONE });
            }
          },
        });
        abortController.signal.addEventListener("abort", () => {
          resolve({ type: EQ.NONE });
        });
      });
    } finally {
      this._asyncOperationRegistry.exit(composerId, "mcp_user_approval");
    }
  }
};

// DI registration
ComposerDecisionsService = __decorate(
  [
    __param(0, JEe),  // IToolCallHumanReviewService
    __param(1, xu),   // IReactiveStorageService
    __param(2, sw),   // IComposerViewsService
    __param(3, Fa),   // IComposerDataService
    __param(4, Jv),   // IAIService
    __param(5, mh),   // IAnalyticsService
    __param(6, ag),   // ICursorAuthenticationService
    __param(7, Rr),   // IWorkspaceContextService
    __param(8, DT),   // IComposerModesService
    __param(9, Ji),   // IStorageService
    __param(10, Ypn), // IPendingApprovalRegistry
    __param(11, Wtt), // IAsyncOperationRegistry
    __param(12, Rl),  // IExperimentService
    __param(13, DU),  // IMcpService
  ],
  ComposerDecisionsService
);

Ki(IComposerDecisionsService, ComposerDecisionsService, 1);
