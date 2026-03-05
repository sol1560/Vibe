// Source: out-build/vs/workbench/contrib/composer/browser/utils.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file contains shared utility functions for the Composer:
// - File navigation helpers (open file, open in neighboring group)
// - Composer data serialization/deserialization
// - Migration helpers
// - Composer state initialization

Di(), ai(), _r(), Xn(), vI(), So(), Mc(), g$e(), ov(), Jg(), pWl(), mE(), hf(), qF();

// ============================================================
// Constants
// ============================================================

/** Storage key for "keep all no inline diffs" toast */
const KEEP_ALL_NO_INLINE_DIFFS_TOAST_SHOWN_KEY = "composer-keep-all-no-inline-diffs-toast-shown";

/**
 * Format a keyboard shortcut with platform modifier (Cmd on Mac, Ctrl otherwise)
 */
const formatShortcut = (key) => (Ls ? `\u2318${key}` : `^${key}`);

// ============================================================
// File Navigation Helpers
// ============================================================

/**
 * Open a file in the editor from a composer context.
 * Handles URI resolution, selection navigation, and editor group targeting.
 *
 * @param filePathOrUri - File path string or URI
 * @param services - Service collection (workspaceContextService, fileService, editorService, etc.)
 * @param options - Open options (selection, openToSide, preserveFocus, preferNeighboringGroup)
 */
const openFileFromComposer = async (filePathOrUri, services, options) => {
  // Check if file should be handled by special handler (e.g. external links)
  if (Yun(services, { filePathOrUri, selection: options?.selection })) return;

  let uri;
  if (typeof filePathOrUri === "string") {
    uri = services.workspaceContextService.resolveRelativePath(filePathOrUri);
  } else {
    uri = filePathOrUri;
  }

  // Append selection as fragment
  if (options?.selection) {
    uri = g2(uri, {
      startLineNumber: options.selection.startLineNumber,
      startColumn: options.selection.startColumn ?? 1,
      endLineNumber: options.selection.endLineNumber ?? options.selection.startLineNumber,
      endColumn: options.selection.endColumn ?? options.selection.startColumn ?? 1,
    });
  }

  // Check file exists
  const baseUri = uri.with({ fragment: "", query: "" });
  if (!(await services.fileService.exists(baseUri))) return;

  // Prefer neighboring group if requested
  if (options?.preferNeighboringGroup) {
    openFileInNeighboringGroup(uri, services, options.openToSide);
    return;
  }

  const openToSide = options?.openToSide ?? false;
  const preserveFocus = options?.preserveFocus ?? true;

  // Try to find an already-open editor in another group
  if (!openToSide) {
    const activeGroup =
      services.editorService.activeEditorPane?.group ?? services.editorGroupService.activeGroup;
    const allGroups = services.editorGroupService.mainPart.getGroups(1);
    const orderedGroups = activeGroup
      ? [activeGroup, ...allGroups.filter((g) => g.id !== activeGroup.id)]
      : allGroups;
    const matchingGroup = hCt(orderedGroups);

    if (matchingGroup && activeGroup && matchingGroup.id !== activeGroup.id) {
      matchingGroup.focus();
      await services.openerService.open(uri, {
        openToSide: false,
        editorOptions: {
          revealIfVisible: true,
          revealIfOpened: true,
          source: rR.USER,
          preserveFocus: preserveFocus,
        },
        fromUserGesture: true,
      });
      if (preserveFocus) activeGroup.focus();
      return;
    }
  }

  services.openerService.open(uri, {
    openToSide: openToSide,
    editorOptions: {
      revealIfVisible: true,
      revealIfOpened: true,
      source: rR.USER,
      preserveFocus: preserveFocus,
    },
    fromUserGesture: true,
  });
};

/**
 * Open a file in a neighboring editor group (split view).
 */
const openFileInNeighboringGroup = async (
  filePathOrUri,
  services,
  openToSide = true,
  selection
) => {
  if (Yun(services, { filePathOrUri, selection })) return;

  let uri;
  if (typeof filePathOrUri === "string") {
    const trimmed = filePathOrUri.trim();
    if (!trimmed) return;
    uri = services.workspaceContextService.resolveRelativePath(trimmed);
  } else {
    uri = filePathOrUri;
  }

  if (selection) {
    uri = g2(uri, {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn ?? 1,
      endLineNumber: selection.endLineNumber ?? selection.startLineNumber,
      endColumn: selection.endColumn ?? selection.startColumn ?? 1,
    });
  }

  const baseUri = uri.with({ fragment: "", query: "" });
  if (!(await services.fileService.exists(baseUri))) return;

  if (openToSide) {
    const neighborGroup = nNg(services.editorGroupService);
    if (neighborGroup) {
      const activeGroup = services.editorGroupService.activeGroup;
      neighborGroup.focus();
      await services.openerService.open(uri, {
        openToSide: false,
        editorOptions: {
          revealIfVisible: false,
          revealIfOpened: false,
          source: rR.USER,
          preserveFocus: true,
        },
        fromUserGesture: true,
      });
      activeGroup.focus();
      return;
    }
    services.openerService.open(uri, {
      openToSide: true,
      editorOptions: {
        revealIfVisible: true,
        revealIfOpened: true,
        source: rR.USER,
        preserveFocus: true,
      },
      fromUserGesture: true,
    });
  } else {
    services.openerService.open(uri, {
      openToSide: false,
      editorOptions: {
        revealIfVisible: true,
        revealIfOpened: true,
        source: rR.USER,
        preserveFocus: true,
      },
      fromUserGesture: true,
    });
  }
};

/**
 * Open a code block location in the editor (from a conversation bubble).
 */
const openCodeBlockLocation = (codeBlock, services, options) => {
  if (options?.preferNeighboringGroup) {
    openCodeBlockLocationInNeighboringGroup(codeBlock, services, options);
    return;
  }

  const filePath = codeBlock.uri.path ?? "";
  const selection = {
    startLineNumber: codeBlock.range.selectionStartLineNumber,
    startColumn: 1,
    endLineNumber: codeBlock.range.positionLineNumber,
    endColumn: 1,
  };

  if (Yun(services, { filePathOrUri: filePath, selection })) return;

  const resolvedUri = services.workspaceContextService.resolveRelativePath(filePath);
  if (!resolvedUri) return;

  const uri = g2(resolvedUri, selection);
  const activeGroup =
    services.editorService.activeEditorPane?.group ?? services.editorGroupService.activeGroup;
  const allGroups = services.editorGroupService.mainPart.getGroups(1);
  const orderedGroups = activeGroup
    ? [activeGroup, ...allGroups.filter((g) => g.id !== activeGroup.id)]
    : allGroups;
  const matchingGroup = hCt(orderedGroups);
  const preserveFocus = options?.preserveFocus;

  if (!options?.openToSide && matchingGroup && activeGroup && matchingGroup.id !== activeGroup.id) {
    matchingGroup.focus();
    services.openerService
      .open(uri, {
        openToSide: false,
        editorOptions: {
          revealIfVisible: true,
          revealIfOpened: true,
          source: rR.USER,
          preserveFocus: preserveFocus,
        },
        fromUserGesture: true,
        ...options,
      })
      .finally(() => {
        if (preserveFocus) activeGroup.focus();
      });
    return;
  }

  services.openerService.open(uri, {
    openToSide: false,
    editorOptions: {
      revealIfVisible: true,
      revealIfOpened: true,
      source: rR.USER,
      preserveFocus: preserveFocus,
    },
    fromUserGesture: true,
    ...options,
  });
};

/**
 * Open a code block location in a neighboring editor group.
 */
const openCodeBlockLocationInNeighboringGroup = async (codeBlock, services, options) => {
  const filePath = codeBlock.uri.path ?? "";
  const selection = {
    startLineNumber: codeBlock.range.selectionStartLineNumber,
    startColumn: 1,
    endLineNumber: codeBlock.range.positionLineNumber,
    endColumn: 1,
  };

  if (Yun(services, { filePathOrUri: filePath, selection })) return;

  const resolvedUri = services.workspaceContextService.resolveRelativePath(filePath);
  if (!resolvedUri) return;

  const uri = g2(resolvedUri, selection);

  if ((options?.preferNeighboringGroup ?? true) && !options?.openToSide) {
    const neighborGroup = nNg(services.editorGroupService);
    if (neighborGroup) {
      const activeGroup = services.editorGroupService.activeGroup;
      neighborGroup.focus();
      await services.openerService.open(uri, {
        ...options,
        openToSide: false,
        editorOptions: {
          revealIfVisible: false,
          revealIfOpened: false,
          source: rR.USER,
          preserveFocus: options?.editorOptions?.preserveFocus,
          ...options?.editorOptions,
        },
        fromUserGesture: true,
      });
      if (options?.editorOptions?.preserveFocus) activeGroup.focus();
      return;
    }
  }

  services.openerService.open(uri, {
    ...options,
    editorOptions: {
      revealIfVisible: true,
      revealIfOpened: true,
      source: rR.USER,
      ...options?.editorOptions,
    },
    openToSide: options?.openToSide,
    fromUserGesture: true,
  });
};

// ============================================================
// Composer Data Storage Helpers
// ============================================================

/**
 * Generate storage key for composer data.
 */
function composerStorageKey(composerId) {
  return `composerData:${composerId}`;
}

/**
 * Persist composer data to disk with retry.
 */
async function persistComposerData(composerData, storageService) {
  const serialized = serializeComposerData(composerData);
  const retryDelays = [1000, 5000, 10000, 20000];
  let attempt = 0;

  const tryPersist = async () => {
    try {
      await storageService.cursorDiskKVSet(composerStorageKey(composerData.composerId), serialized);
    } catch (error) {
      if (attempt < retryDelays.length) {
        console.warn(
          `[composer] Failed to migrate composer data (attempt ${attempt + 1}), retrying in ${retryDelays[attempt] / 1000}s`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
        attempt++;
        return tryPersist();
      }
      console.error("[composer] Failed to migrate composer data after all retries", error);
    }
  };

  await tryPersist().catch((error) => {
    console.error("[composer] Unexpected error during migration retry", error);
  });
}

// ============================================================
// Composer State Migration
// ============================================================

/**
 * Migrate stored composer state to the latest format.
 * Handles:
 * - Multiple composers migration (selectedComposerId → selectedComposerIds)
 * - Composer data migration (inline → persisted)
 * - Unified mode migration (isAgentic → unifiedMode)
 * - Encryption key initialization
 */
function migrateStoredComposers(storedState, services) {
  let hasMigratedMultiple = storedState.hasMigratedMultipleComposers ?? false;
  let state;

  // Migrate from single to multiple composer selection
  if (!hasMigratedMultiple && "selectedComposerId" in storedState) {
    state = {
      ...storedState,
      selectedComposerIds: [storedState.selectedComposerId],
      lastFocusedComposerIds: [storedState.selectedComposerId],
      selectedComposerHandles: {},
    };
  } else {
    state = storedState;
    const firstComposer = state.allComposers[0];
    if (state.selectedComposerIds.length === 0 && firstComposer) {
      state.selectedComposerIds = [firstComposer.composerId];
    }
    if (
      (!state.lastFocusedComposerIds || state.lastFocusedComposerIds.length === 0) &&
      firstComposer
    ) {
      state.lastFocusedComposerIds = [firstComposer.composerId];
    }
  }

  let hasMigratedData = state.hasMigratedComposerData ?? false;
  let composers = state.allComposers;
  const migrationPromises = [];

  // Migrate inline composer data to persisted storage
  if (!hasMigratedData) {
    composers = composers.map((composer) => {
      if (composer.type === "head") {
        return composer.isWorktree === void 0
          ? { ...composer, isWorktree: false }
          : composer;
      }
      migrationPromises.push(persistComposerData(composer, services.storageService));
      return i$e(composer); // Convert to head reference
    });
    hasMigratedData = true;
  }

  // Normalize and clean up composers
  composers = iNg(composers)
    .map(yLA)
    .map((composer) => {
      let updated = composer;
      if (composer.isWorktree === void 0) {
        updated = { ...updated, isWorktree: false };
      }
      if (composer.authoredPlan === void 0) {
        updated = { ...updated, authoredPlan: void 0 };
      }
      return updated;
    });

  let selectedIds = state.selectedComposerIds || [];

  // Create initial composers if none exist
  if (selectedIds.length === 0 || pNg) {
    const newId = Gr();
    const modelConfig = services.modelConfigService.getModelConfig("composer");
    const newComposer = Q9(modelConfig, newId);
    if (services.isGlass) {
      newComposer.isEphemeral = true;
    }
    migrationPromises.push(persistComposerData(newComposer, services.storageService));
    selectedIds = [newId];
    composers = [i$e(newComposer), ...composers];
  }

  state = {
    allComposers: composers,
    selectedComposerIds: selectedIds,
    lastFocusedComposerIds: state.lastFocusedComposerIds || [],
    hasMigratedComposerData: hasMigratedData,
    hasMigratedMultipleComposers: true,
    selectedComposerHandles: {},
  };

  return [state, Promise.allSettled(migrationPromises).then(() => {})];
}

/**
 * Limit conversation length by trimming from the beginning.
 * Ensures the trim point starts at a HUMAN message boundary.
 */
function trimConversation(messages, maxLength) {
  if (messages.length <= maxLength) return messages;

  let trimStart = messages.length - maxLength;
  while (trimStart < messages.length && messages[trimStart].type !== ul.HUMAN) {
    trimStart++;
  }
  return messages.slice(trimStart);
}

// ============================================================
// Composer Data Deserialization
// ============================================================

/**
 * Deserialize raw composer data from storage JSON.
 * Handles encryption key recovery, URI revival, code block status normalization,
 * and conversation state protobuf deserialization.
 */
async function deserializeAndPostProcessComposerData(rawJson, services) {
  let data = deserializeComposerData(rawJson);
  data = await dLA(data, services);
  return data;
}

/**
 * Deserialize a single conversation message from storage.
 * Handles:
 * - Leading whitespace stripping from AI messages
 * - URI revival in code blocks
 * - ToolFormerData protobuf deserialization
 * - Context deserialization
 * - Todo/summary protobuf deserialization
 * - Service status update deserialization
 * - Error details deserialization
 */
function deserializeConversationMessage(message) {
  // Strip leading newlines from AI messages
  if (message.type === ul.AI) {
    message.text = message.text.replace(/^[\r\n]+/, "");
  }

  // Revive URIs in code blocks
  const codeBlocks = message.codeBlocks?.map((block) =>
    block.unregistered ? block : { ...block, uri: je.revive(block.uri) }
  );

  // Deserialize toolFormerData
  let toolFormerData;
  try {
    toolFormerData =
      "toolFormerData" in message &&
      message.toolFormerData !== void 0 &&
      message.toolFormerData.tool !== void 0
        ? RLg(BLg(message.toolFormerData))
        : void 0;
  } catch (error) {
    console.error("[composer] Error parsing toolFormerData", error);
  }

  // Deserialize context for human messages
  const context =
    message.type === ul.HUMAN
      ? { ...sR(), ...(message.context ? EWl(message.context) : {}) }
      : void 0;

  // Deserialize todos
  let todos;
  if (message.todos) {
    try {
      todos = message.todos.map((todo) =>
        typeof todo === "string" ? QB.fromJsonString(todo) : new QB(todo)
      );
    } catch (error) {
      console.error("[composer] Error deserializing todos", error);
      todos = void 0;
    }
  }

  // Deserialize conversation summary
  let conversationSummary;
  if (message.conversationSummary) {
    try {
      if (typeof message.conversationSummary === "string") {
        conversationSummary = lhe.fromJsonString(message.conversationSummary);
      } else {
        conversationSummary = new lhe(message.conversationSummary);
      }
    } catch (error) {
      console.error("[composer] Error deserializing conversationSummary", error);
      conversationSummary = void 0;
    }
  }

  const hasThinking = message.thinking !== void 0;

  // Deserialize service status update
  let serviceStatusUpdate;
  if (message.serviceStatusUpdate) {
    try {
      if (typeof message.serviceStatusUpdate === "string") {
        serviceStatusUpdate = n9t.fromJsonString(message.serviceStatusUpdate);
      } else {
        serviceStatusUpdate = new n9t(message.serviceStatusUpdate);
      }
    } catch (error) {
      console.error("[composer] Error deserializing serviceStatusUpdate", error);
      serviceStatusUpdate = void 0;
    }
  }

  // Deserialize error details
  let errorDetails;
  if (message.errorDetails) {
    try {
      errorDetails = { ...message.errorDetails };
      if (message.errorDetails.error !== void 0 && typeof message.errorDetails.error === "string") {
        errorDetails.error = rN.fromJsonString(message.errorDetails.error);
      } else {
        errorDetails.error = void 0;
      }
    } catch (error) {
      console.error("[composer] Error deserializing errorDetails.error", error);
      errorDetails = message.errorDetails;
    }
  }

  return {
    ...d_(),
    ...message,
    codeBlocks,
    toolFormerData,
    context,
    todos,
    conversationSummary,
    capabilityType: hasThinking ? ko.THINKING : message.capabilityType,
    serviceStatusUpdate,
    errorDetails,
  };
}

/**
 * Deserialize composer data from JSON string.
 * Main deserialization entry point that handles:
 * - Model config defaults
 * - Unified mode migration (isAgentic → unifiedMode)
 * - Context deserialization
 * - Encryption key initialization and recovery
 * - Code block data migration (v5 → v6+ format)
 * - URI revival for files/folders
 * - Status normalization (generating → aborted, applying → cancelled)
 * - Conversation state protobuf deserialization
 */
function deserializeComposerData(jsonString) {
  const raw = JSON.parse(jsonString);
  const modelConfig = raw.modelConfig ?? { modelName: "default", maxMode: false };
  const data = {
    ...Q9(modelConfig, raw.composerId),
    ...raw,
    modelConfig: raw.modelConfig ?? modelConfig,
  };

  // Version migration
  if (!("_v" in raw)) {
    data._v = 0;
  }

  // Unified mode migration
  if (data.unifiedMode === void 0) {
    if (data.isAgentic) {
      data.unifiedMode = "agent";
    } else {
      data.unifiedMode = data.forceMode ?? "edit";
    }
  }
  data.forceMode = data.unifiedMode === "chat" ? "chat" : "edit";
  data.isAgentic = data.unifiedMode === "agent";

  // Context deserialization
  data.context = { ...sR(), ...EWl(raw.context) };

  // Encryption keys — speculativeSummarizationEncryptionKey
  if (data.speculativeSummarizationEncryptionKey) {
    if (typeof data.speculativeSummarizationEncryptionKey === "string") {
      try {
        const decoded = _Y(data.speculativeSummarizationEncryptionKey);
        data.speculativeSummarizationEncryptionKey = new Uint8Array(decoded.buffer);
        if (data.speculativeSummarizationEncryptionKey.byteLength === 0) {
          console.error(
            "[composer] speculativeSummarizationEncryptionKey is empty, regenerating"
          );
          data.speculativeSummarizationEncryptionKey = crypto.getRandomValues(
            new Uint8Array(32)
          );
        }
      } catch (error) {
        console.error(
          "[composer] Error deserializing speculativeSummarizationEncryptionKey",
          error
        );
        data.speculativeSummarizationEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
      }
    } else if (data.speculativeSummarizationEncryptionKey instanceof Uint8Array) {
      if (data.speculativeSummarizationEncryptionKey.byteLength === 0) {
        console.error(
          "[composer] speculativeSummarizationEncryptionKey is empty, regenerating"
        );
        data.speculativeSummarizationEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
      }
    } else {
      console.error(
        "[composer] speculativeSummarizationEncryptionKey is not a Uint8Array (regenerating). Its type is: ",
        typeof data.speculativeSummarizationEncryptionKey
      );
      data.speculativeSummarizationEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
    }
  } else {
    data.speculativeSummarizationEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
  }

  // Encryption keys — blobEncryptionKey
  if (data.blobEncryptionKey) {
    if (typeof data.blobEncryptionKey === "string") {
      try {
        const decoded = _Y(data.blobEncryptionKey);
        data.blobEncryptionKey = new Uint8Array(decoded.buffer);
        if (data.blobEncryptionKey.byteLength === 0) {
          console.error("[composer] blobEncryptionKey is empty, regenerating");
          data.blobEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
        }
      } catch (error) {
        console.error("[composer] Error deserializing blobEncryptionKey", error);
        data.blobEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
      }
    } else if (data.blobEncryptionKey instanceof Uint8Array) {
      if (data.blobEncryptionKey.byteLength === 0) {
        console.error("[composer] blobEncryptionKey is empty, regenerating");
        data.blobEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
      }
    } else {
      console.error(
        "[composer] blobEncryptionKey is not a Uint8Array (regenerating). Its type is: ",
        typeof data.blobEncryptionKey
      );
      data.blobEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
    }
  } else {
    data.blobEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
  }

  // Trim conversation headers
  data.fullConversationHeadersOnly = trimConversation(
    data.fullConversationHeadersOnly || [],
    1000
  );

  // Code block data migration (v5 → v6+)
  if (data._v < 6) {
    data.codeBlockData = Object.fromEntries(
      Object.entries(raw.codeBlockData).map(([uri, blocks]) => [
        uri,
        blocks.map((block) => {
          if (block.version === 0 && block.originalModelLines !== void 0) {
            data.originalModelLines[uri] = block.originalModelLines;
          }
          let status = block.status;
          if (status === "generating") status = "aborted";
          else if (status === "applying") status = "cancelled";
          const revivedUri = je.revive(block.uri);
          return { ...block, uri: revivedUri, status };
        }),
      ])
    );
  } else {
    data.codeBlockData = Object.fromEntries(
      Object.entries(raw.codeBlockData).map(([uri, blockMap]) => [
        uri,
        Object.fromEntries(
          Object.entries(blockMap).map(([blockId, block]) => {
            let status = block.status;
            if (status === "generating") status = "aborted";
            else if (status === "applying") status = "cancelled";
            const revivedUri = je.revive(block.uri);
            return [blockId, { ...block, uri: revivedUri, status }];
          })
        ),
      ])
    );
  }

  // Revive URIs in newly created files/folders
  data.newlyCreatedFiles = (data.newlyCreatedFiles || []).map((file) => ({
    ...file,
    uri: je.revive(file.uri),
  }));
  data.newlyCreatedFolders = (data.newlyCreatedFolders || []).map((folder) => ({
    ...folder,
    uri: je.revive(folder.uri),
  }));

  // Revive git checkpoint URIs
  if (data.gitCheckpoint) {
    data.gitCheckpoint.inlineDiffNewlyCreatedResources.files =
      data.gitCheckpoint.inlineDiffNewlyCreatedResources.files.map((f) => je.revive(f));
    data.gitCheckpoint.inlineDiffNewlyCreatedResources.folders =
      data.gitCheckpoint.inlineDiffNewlyCreatedResources.folders.map((f) => je.revive(f));
  }

  // Normalize status
  let status = data.status;
  if (status === "generating") status = "aborted";
  data.status = status;

  // Reset loaded flag
  data.hasLoaded = false;

  // Normalize attached file URIs set
  if (data.allAttachedFileCodeChunksUris) {
    data.allAttachedFileCodeChunksUris = new Set(
      Array.isArray(data.allAttachedFileCodeChunksUris)
        ? data.allAttachedFileCodeChunksUris
        : []
    );
  } else {
    data.allAttachedFileCodeChunksUris = new Set();
  }

  // Deserialize conversation state protobuf
  if (typeof data.conversationState === "string") {
    try {
      const encoded = data.conversationState;
      const buffer = encoded.startsWith("~")
        ? _Y(encoded.slice(1)).buffer
        : nie(encoded);
      data.conversationState = bk.fromBinary(buffer);
    } catch (error) {
      console.error("[composer] Failed to deserialize conversationState:", error);
      data.conversationState = new bk();
    }
  } else {
    data.conversationState = new bk();
  }

  return data;
}

/**
 * Dispose all capabilities in a composer.
 */
function disposeComposerCapabilities(composerData) {
  for (const capability of composerData.capabilities) {
    try {
      capability.dispose();
    } catch (error) {
      __(error, {
        tags: {
          client_error_type: "composer_capability_dispose_failure",
          force_upload: "forced",
        },
      });
    }
  }
}

// ============================================================
// Composer Data Serialization (for persistence)
// ============================================================

/**
 * Prepare composer data for storage.
 * Strips runtime-only fields, normalizes statuses,
 * serializes encryption keys and conversation state.
 */
function prepareComposerForStorage(composerData) {
  const {
    applied,
    appliedDiffs,
    composerId,
    name,
    text,
    richText,
    fullConversationHeadersOnly,
    status,
    lastUpdatedAt,
    createdAt,
    codeBlockData,
    hasChangedContext,
    browserChipManuallyDisabled,
    browserChipManuallyEnabled,
    capabilities,
    unifiedMode,
    browserConnection,
    originalFileStates,
    newlyCreatedFiles,
    newlyCreatedFolders,
    latestConversationSummary,
    dontShowSummarizeForLongChats,
    tokenCount,
    chatGenerationUUID,
    latestChatGenerationUUID,
    latestEventId,
    latestCheckpointId,
    currentBubbleId,
    editingBubbleId,
    selectedBubbleId,
    usageData,
    contextUsagePercent,
    contextTokensUsed,
    contextTokenLimit,
    allAttachedFileCodeChunksUris,
    modelConfig,
    todos,
    gitHubPromptDismissed,
    createdFromBackgroundAgent,
    gitCheckpoint,
    subtitle,
    totalLinesAdded,
    totalLinesRemoved,
    filesChangedCount,
    isDraft,
    draftTarget,
    firstTodoWriteBubble,
    gitWorktree,
    worktreeStartedReadOnly,
    reservedWorktree,
    plan,
    isSpec,
    isProject,
    projectIcon,
    isSpecSubagentDone,
    isBestOfNSubcomposer,
    isBestOfNParent,
    selectedSubComposerId,
    bestOfNJudgeStatus,
    bestOfNJudgeWinner,
    bestOfNJudgeReasoning,
    initialBestOfNAgentRequestId,
    subagentInfo,
    subComposerIds,
    subagentComposerIds,
    speculativeSummarizationEncryptionKey,
    blobEncryptionKey,
    isNAL,
    lastMessageSentOnBranch,
    committedToBranch,
    createdOnBranch,
    prBranchName,
    activeBranch,
    branches,
    prUrl,
    planEditSnapshots,
    conversationState,
    hasCorruptedCheckpoints,
    agentBackend,
    agentBackendData,
    queueItems,
    pluginFlowState,
    _v,
  } = composerData;

  // Normalize code block statuses
  const normalizedCodeBlockData = Object.fromEntries(
    Object.entries(codeBlockData).map(([uri, blockMap]) => [
      uri,
      Object.fromEntries(
        Object.entries(blockMap).map(([blockId, block]) => {
          let blockStatus = block.status;
          if (blockStatus === "generating") blockStatus = "aborted";
          else if (blockStatus === "applying") blockStatus = "cancelled";
          return [blockId, { ...block, status: blockStatus }];
        })
      ),
    ])
  );

  // Filter conversation for background agent streaming
  const isBackgroundStreaming = !!createdFromBackgroundAgent?.shouldStreamMessages;
  const normalizedStatus =
    status === "generating" && !isBackgroundStreaming ? "aborted" : status;

  // Strip terminal files from context
  let context = { ...composerData.context, terminalFiles: void 0 };

  // Filter conversation messages for background agents
  const filteredConversation = fullConversationHeadersOnly.filter((msg, idx) => {
    if (isBackgroundStreaming) {
      const kickoffMsgId =
        composerData.agentSessionId !== void 0
          ? createdFromBackgroundAgent?.kickoffMessageId
          : void 0;

      if (kickoffMsgId !== void 0) {
        const kickoffIdx = fullConversationHeadersOnly.findIndex(
          (m) => m.bubbleId === kickoffMsgId || m.serverBubbleId === kickoffMsgId
        );
        const isBeforeKickoff = kickoffIdx !== -1 && idx <= kickoffIdx;
        const hasServerBubbleId =
          msg.serverBubbleId !== void 0 && msg.serverBubbleId.length > 0;
        return isBeforeKickoff || hasServerBubbleId;
      } else {
        return msg.serverBubbleId !== void 0 && msg.serverBubbleId.length > 0;
      }
    }
    return true;
  });

  return {
    ...Q9(modelConfig),
    applied,
    appliedDiffs,
    composerId,
    name,
    text,
    richText,
    fullConversationHeadersOnly: filteredConversation,
    status: normalizedStatus,
    lastUpdatedAt,
    createdAt,
    context,
    codeBlockData: normalizedCodeBlockData,
    hasChangedContext,
    browserChipManuallyDisabled,
    browserChipManuallyEnabled,
    capabilities,
    unifiedMode,
    browserConnection,
    originalFileStates,
    newlyCreatedFiles,
    newlyCreatedFolders,
    latestConversationSummary,
    dontShowSummarizeForLongChats,
    tokenCount,
    chatGenerationUUID,
    latestChatGenerationUUID,
    latestEventId,
    latestCheckpointId,
    currentBubbleId,
    editingBubbleId,
    selectedBubbleId,
    forceMode: unifiedMode === "agent" ? "edit" : unifiedMode,
    isAgentic: unifiedMode === "agent",
    usageData,
    contextUsagePercent,
    contextTokensUsed,
    contextTokenLimit,
    allAttachedFileCodeChunksUris: Array.from(allAttachedFileCodeChunksUris || new Set()),
    todos,
    gitHubPromptDismissed,
    createdFromBackgroundAgent,
    gitCheckpoint,
    subtitle,
    totalLinesAdded,
    totalLinesRemoved,
    filesChangedCount,
    isDraft,
    draftTarget,
    firstTodoWriteBubble,
    gitWorktree,
    worktreeStartedReadOnly,
    reservedWorktree,
    plan,
    isSpec,
    isProject,
    projectIcon,
    isSpecSubagentDone,
    isBestOfNSubcomposer,
    isBestOfNParent,
    selectedSubComposerId,
    bestOfNJudgeStatus,
    bestOfNJudgeWinner,
    bestOfNJudgeReasoning,
    initialBestOfNAgentRequestId,
    subagentInfo,
    subComposerIds,
    subagentComposerIds,
    speculativeSummarizationEncryptionKey: speculativeSummarizationEncryptionKey
      ? l2(Ps.wrap(speculativeSummarizationEncryptionKey))
      : void 0,
    blobEncryptionKey: blobEncryptionKey ? l2(Ps.wrap(blobEncryptionKey)) : void 0,
    isNAL,
    lastMessageSentOnBranch,
    committedToBranch,
    createdOnBranch,
    prBranchName,
    activeBranch,
    branches,
    prUrl,
    planEditSnapshots,
    conversationState: "~" + l2(Ps.wrap(conversationState.toBinary())),
    hasCorruptedCheckpoints,
    agentBackend,
    agentBackendData,
    queueItems,
    pluginFlowState,
    _v,
  };
}

/**
 * Serialize composer data to JSON string.
 */
function serializeComposerData(composerData) {
  return JSON.stringify(prepareComposerForStorage(composerData));
}

// ============================================================
// Composer Initialization
// ============================================================

/**
 * Create a fresh pair of composers (agent + chat) for a new workspace.
 */
function createInitialComposers(agentId, chatId, storageService, hasMigratedData, modelConfigService, isGlass) {
  const agentComposer = Q9(
    {
      modelName: modelConfigService.getModelConfig("composer").modelName,
      maxMode: modelConfigService.getModelConfig("composer").maxMode,
    },
    agentId
  );
  const chatComposer = Q9(
    {
      modelName: modelConfigService.getModelConfig("composer").modelName,
      maxMode: modelConfigService.getModelConfig("composer").maxMode,
    },
    chatId,
    "chat"
  );

  if (isGlass) {
    agentComposer.isEphemeral = true;
    chatComposer.isEphemeral = true;
  }

  const migrationPromise = Promise.allSettled([
    persistComposerData(agentComposer, storageService),
    persistComposerData(chatComposer, storageService),
  ]).then(() => {});

  return [
    {
      allComposers: [i$e(agentComposer), i$e(chatComposer)],
      selectedComposerIds: [agentId],
      lastFocusedComposerIds: [agentId],
      hasMigratedComposerData: hasMigratedData,
      hasMigratedMultipleComposers: true,
      selectedComposerHandles: {},
    },
    migrationPromise,
  ];
}

/**
 * Initialize composer state from storage.
 * Reads persisted state, migrates if needed, creates defaults if missing.
 */
function initializeComposerState(
  storageService,
  reactiveStorageService,
  workspaceContextService,
  modelConfigService,
  composerDataHandleManager,
  storageKey,
  isGlass
) {
  const isEmptyWorkspace = workspaceContextService.getWorkbenchState() === 1;
  const storageScope = isGlass && isEmptyWorkspace ? 1 : isEmptyWorkspace ? -1 : 1;

  let rawJson = storageService.get(storageKey, storageScope);
  let hasMigratedData = false;
  let state = {
    allComposers: [],
    selectedComposerIds: [],
    lastFocusedComposerIds: [],
    hasMigratedComposerData: hasMigratedData,
    hasMigratedMultipleComposers: true,
    selectedComposerHandles: {},
  };

  const pendingPromises = [];
  let migrationPromise;

  if (rawJson) {
    try {
      let parsed = JSON.parse(rawJson);
      if (parsed) {
        const [migrated, migPromise] = migrateStoredComposers(parsed, {
          workspaceContextService,
          storageService,
          reactiveStorageService,
          composerDataHandleManager,
          modelConfigService,
          isGlass,
        });
        pendingPromises.push(migPromise);
        state = migrated;

        // Limit number of selected composers
        const maxSelected = Ih(storageService) ? bJl : Baa;
        if (state.selectedComposerIds.length > maxSelected) {
          const focusOrder = state.lastFocusedComposerIds || [];
          state.selectedComposerIds = state.selectedComposerIds
            .sort((a, b) => {
              const aIdx = focusOrder.indexOf(a);
              const bIdx = focusOrder.indexOf(b);
              if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
              if (aIdx !== -1) return -1;
              if (bIdx !== -1) return 1;
              return 0;
            })
            .slice(0, maxSelected);
        }
      } else {
        throw new Error("[composer] No stored composers data found");
      }
    } catch (error) {
      console.error("[composer] Error parsing stored composers data:", error);
      const newId = Gr();
      [state, migrationPromise] = createInitialComposers(
        newId,
        Gr(),
        storageService,
        hasMigratedData,
        modelConfigService,
        isGlass
      );
      pendingPromises.push(migrationPromise);
    }
  } else {
    const newId = Gr();
    [state, migrationPromise] = createInitialComposers(
      newId,
      Gr(),
      storageService,
      hasMigratedData,
      modelConfigService,
      isGlass
    );
    pendingPromises.push(migrationPromise);
  }

  const [reactiveState, stateAccessor] = A3(state);

  return [
    reactiveState,
    stateAccessor,
    () => {
      __(new Error("resetComposers called - wiping all composers"), {
        tags: { client_error_type: "resetComposers_called" },
        extra: {
          existingComposerCount: reactiveState.allComposers.length,
          existingSelectedCount: reactiveState.selectedComposerIds.length,
        },
      });
    },
  ];
}
