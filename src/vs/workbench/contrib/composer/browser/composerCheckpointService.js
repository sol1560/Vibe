// Source: out-build/vs/workbench/contrib/composer/browser/composerCheckpointService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerCheckpointService — manages undo/revert checkpoints
// for composer conversations, allowing users to revert file changes to any point in the conversation.

Qt(), dp(), st(), oa(), Er(), nP(), oy(), zk(), uV(), Xn(), nd(), Pd(), vM(), $d(), ls(), hf(),
  ps(), ace(), _hn(), Qr(), pQ(), Ov(), Jg(), fEe(), jl(), Ex(), Nc(), Of(), Rwi();

const IComposerCheckpointService = Bi("composerCheckpointService");

/**
 * ComposerCheckpointService
 *
 * Manages checkpoint-based undo/revert system for the composer.
 * Each conversation bubble can have a checkpoint that captures the state
 * of all files at that point. Users can revert to any checkpoint,
 * restoring files to their previous state.
 *
 * Key concepts:
 * - Checkpoint: snapshot of file states at a conversation point
 * - ActiveInlineDiffs: files with pending inline diffs at checkpoint time
 * - originalModelDiffWrtV0: diff relative to the original file (version 0)
 * - newlyCreatedFiles/folders: resources created since start
 */
let ComposerCheckpointService = class extends at {
  constructor(
    composerDataService,
    composerViewsService,
    composerFileService,
    prettyDialogService,
    inlineDiffService,
    reactiveStorageService,
    composerTextModelService,
    analyticsService,
    workspaceContextService,
    commandService,
    composerCheckpointStorageService,
    composerCodeBlockService,
    textFileService,
    textModelService,
    patchGraphAdapterService
  ) {
    super();
    this._composerDataService = composerDataService;
    this._composerViewsService = composerViewsService;
    this._composerFileService = composerFileService;
    this._prettyDialogService = prettyDialogService;
    this._inlineDiffService = inlineDiffService;
    this._reactiveStorageService = reactiveStorageService;
    this.composerTextModelService = composerTextModelService;
    this._analyticsService = analyticsService;
    this._workspaceContextService = workspaceContextService;
    this._commandService = commandService;
    this._composerCheckpointStorageService = composerCheckpointStorageService;
    this._composerCodeBlockService = composerCodeBlockService;
    this._textFileService = textFileService;
    this._textModelService = textModelService;
    this._patchGraphAdapterService = patchGraphAdapterService;
  }

  // ============================================================
  // Create checkout callback — main entry point for reverting
  // ============================================================

  async createCheckoutCallback(composerHandle, targetBubbleIdOrCheckpoint, options) {
    if (!composerHandle) {
      console.error("[composer] No composer handle provided");
      return;
    }

    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (!composerData) {
      console.error("[composer] No composer found for the given handle");
      return;
    }

    const composerId = composerData.composerId;
    const isBubbleId = typeof targetBubbleIdOrCheckpoint === "string";

    // Already at target message?
    if (isBubbleId && composerData.currentBubbleId === targetBubbleIdOrCheckpoint) {
      console.log("[composer] Already at the target message");
      return;
    }

    // Find target bubble index
    let targetIndex;
    if (isBubbleId) {
      targetIndex = composerData.fullConversationHeadersOnly.findIndex(
        (msg) => msg.bubbleId === targetBubbleIdOrCheckpoint
      );
      if (targetIndex === -1) {
        console.error(
          "[composer] No message found with the given bubble ID or message has no checkpoint"
        );
        return;
      }
    }

    const checkpointValidation =
      options?.checkpointValidation ??
      (await this.validateCheckpointContent(composerHandle, targetBubbleIdOrCheckpoint));

    // Save current state as latest checkpoint before reverting
    const saveLatestCheckpoint = async () => {
      if (composerData.currentBubbleId === void 0 && isBubbleId) {
        const existingCheckpoint = composerData.latestCheckpointId
          ? await this._composerCheckpointStorageService.retrieveCheckpoint(
              composerId,
              composerData.latestCheckpointId
            )
          : void 0;

        const checkpoint = await this.createCurrentCheckpoint(composerId, existingCheckpoint);
        if (!checkpoint) return;

        if (composerData.latestCheckpointId) {
          await this._composerCheckpointStorageService.updateCheckpoint(
            composerId,
            composerData.latestCheckpointId,
            (existing) => {
              Object.assign(existing, checkpoint);
            }
          );
        } else {
          const checkpointId =
            await this._composerCheckpointStorageService.storeCheckpoint(composerId, checkpoint);
          this._composerDataService.updateComposerData(composerHandle, {
            latestCheckpointId: checkpointId,
          });
        }
      }
    };

    // No changes to revert
    if (checkpointValidation.isSame) {
      console.log("[composer] Checkout to message is the same as current");
      if (!options?.fromSubmitChat) {
        await saveLatestCheckpoint();
        this._commandService.executeCommand(jmi, composerId);
        this._composerDataService.updateComposerData(composerHandle, {
          currentBubbleId: isBubbleId ? targetBubbleIdOrCheckpoint : void 0,
          editingBubbleId: isBubbleId ? targetBubbleIdOrCheckpoint : void 0,
        });
        setTimeout(() => {
          this._composerViewsService
            .getPrevEditingBubbleInputDelegate(composerId)
            .focus();
        }, 0);
      }
      return;
    }

    // Confirm with user
    if (!options?.fromSubmitChat) {
      let dialogMessage;
      if (checkpointValidation.hasNotebookFiles) {
        dialogMessage =
          "You can always undo this later.\nNote: Notebook cells are not supported for reverting.";
      } else {
        dialogMessage = "You can always undo this later.";
      }

      const result = await this._prettyDialogService.openDialog({
        title: "Discard all changes up to this checkpoint?",
        message: dialogMessage,
        cancelButton: { id: "cancel", label: "Cancel" },
        primaryButton: { id: "continue", label: "Continue" },
        shouldShowDontAskAgain: true,
        dialogKey: "composer-checkout-to-message",
      });
      if (result !== "continue") return;

      this._commandService.executeCommand(jmi, composerId);
    }

    // Calculate direction (forward or backward in conversation)
    const currentIndex = composerData.currentBubbleId
      ? composerData.fullConversationHeadersOnly.findIndex(
          (msg) => msg.bubbleId === composerData.currentBubbleId
        )
      : composerData.fullConversationHeadersOnly.length - 1;

    let isMovingForward = !isBubbleId;
    if (targetIndex) {
      isMovingForward = targetIndex > currentIndex;
    }

    this._analyticsService.trackEvent("composer.checkout_to_message", {
      messageIndex: targetIndex,
      isMovingForward: isMovingForward,
    });

    if (!options?.fromSubmitChat) {
      await saveLatestCheckpoint();
    }

    return await this._patchGraphAdapterService.createRevertToCheckpointCallback(
      composerHandle,
      targetBubbleIdOrCheckpoint,
      composerData,
      composerId,
      options
    );
  }

  // ============================================================
  // Create checkout with inline diffs
  // ============================================================

  async createCheckoutCallbackWithInlineDiffs(
    composerHandle,
    targetBubbleIdOrCheckpoint,
    composerData,
    composerId,
    options
  ) {
    const isBubbleId = typeof targetBubbleIdOrCheckpoint === "string";
    let filesToRevert = new Set();
    let intermediateFiles = new Map();
    let foldersToDelete = new Set();
    let checkpoint;

    if (isBubbleId) {
      const checkpointId =
        composerData.conversationMap[targetBubbleIdOrCheckpoint].checkpointId;
      checkpoint = await this._composerCheckpointStorageService.retrieveCheckpoint(
        composerId,
        checkpointId
      );
    } else {
      checkpoint = targetBubbleIdOrCheckpoint;
    }

    if (!checkpoint) {
      throw new Error("[composer] No checkpoint found for the given bubble ID");
    }

    if (isBubbleId) {
      const revertInfo = await this.getFilesToRevertForCheckpoint(
        composerHandle,
        targetBubbleIdOrCheckpoint,
        composerData.currentBubbleId,
        checkpoint
      );
      filesToRevert = revertInfo.filesToRevert;
      intermediateFiles = revertInfo.intermediateFiles;
      foldersToDelete = revertInfo.foldersToDelete;
    } else {
      const activeInlineDiffUris = new Set(
        checkpoint.activeInlineDiffs?.map((diff) => diff.uri.toString()) ?? []
      );
      const trackedUris = this.getUrisForCheckpoints(composerData);
      filesToRevert = new Set(
        checkpoint.files
          .map((file) => file.uri.toString())
          .filter((uri) => !activeInlineDiffUris.has(uri) && trackedUris.has(uri))
      );
    }

    // Snapshot original file states
    const originalFileStates = Object.fromEntries(
      Object.entries(composerData.originalFileStates).map(([uri, state]) => [
        uri,
        { ...state },
      ])
    );

    // Return the actual revert callback
    return async () => {
      // Revert regular files
      for (const fileUri of filesToRevert) {
        try {
          const uri = je.parse(fileUri);
          let fileCheckpoint;

          // Skip notebooks
          if (uri.path.endsWith(".ipynb")) continue;

          if (checkpoint.files.some((f) => f.uri.toString() === fileUri)) {
            fileCheckpoint = checkpoint.files.find((f) => f.uri.toString() === fileUri);
          } else {
            const intermediate = intermediateFiles.get(fileUri);
            if (intermediate) {
              fileCheckpoint = intermediate.checkpoint.files.find(
                (f) => f.uri.toString() === fileUri
              );
            }
          }

          if (fileCheckpoint) {
            const originalContent =
              originalFileStates[uri.toString()]?.content !== void 0
                ? eA(originalFileStates[uri.toString()].content)
                : void 0;

            if (fileCheckpoint.isNewlyCreated) {
              await this._composerFileService.deleteFile({ uri, composerData });
              console.log(`[composer] Deleted newly created file ${fileUri}`);
            } else {
              await this._composerFileService.createNewFileAndMaybeFolder(
                fileCheckpoint.uri,
                composerData,
                true
              );

              let modelRef;
              try {
                modelRef = await this.composerTextModelService.createModelReference(
                  uri,
                  composerData,
                  true
                );
                const textModel = modelRef.object.textEditorModel;
                const currentLines = textModel.getLinesContent();

                if (
                  originalContent === void 0 ||
                  fileCheckpoint.originalModelDiffWrtV0 === void 0
                ) {
                  console.error(
                    `[composer] No original file state found for ${uri.toString()}`
                  );
                  continue;
                }

                const restoredLines = this._composerCodeBlockService.applyDiffToLines(
                  originalContent,
                  fileCheckpoint.originalModelDiffWrtV0
                );

                if (
                  currentLines.length !== restoredLines.length ||
                  currentLines.join("\n") !== restoredLines.join("\n")
                ) {
                  textModel.setValue(restoredLines.join("\n"));
                  await this._composerFileService.saveFile({
                    uri,
                    composerData,
                    options: { ignoreModifiedSince: true },
                  });
                }
              } finally {
                modelRef?.dispose();
              }
            }

            // Remove inline diff decoration for this file
            const existingDiff = this._inlineDiffService.inlineDiffs
              .nonReactive()
              .find((diff) => diff.uri.toString() === fileUri);
            if (existingDiff) {
              this._inlineDiffService.remove(existingDiff.id);
            }

            console.log(`[composer] Processed file ${fileUri} for revert operation`);
          }
        } catch (error) {
          console.error(`[composer] Error processing file ${fileUri}:`, error);
        }
      }

      // Delete newly created folders
      for (const folderUri of foldersToDelete) {
        try {
          await this._composerFileService.deleteFolder({
            uri: je.parse(folderUri),
            composerData,
          });
          console.log(`[composer] Deleted newly created folder ${folderUri}`);
        } catch (error) {
          console.error(`[composer] Error deleting folder ${folderUri}:`, error);
        }
      }

      // Delete non-existent files (files that shouldn't exist at this checkpoint)
      for (const nonExistent of checkpoint.nonExistentFiles) {
        await this._composerFileService.deleteFile({
          uri: nonExistent.uri,
          composerData,
        });
        console.log(`[composer] Deleted non existent file ${nonExistent.uri.toString()}`);
      }

      // Restore active inline diffs
      for (const inlineDiff of checkpoint.activeInlineDiffs) {
        const {
          uri: diffUri,
          originalTextDiffWrtV0,
          newTextDiffWrtV0,
          generationUUID,
        } = inlineDiff;

        const originalContent =
          originalFileStates[diffUri.toString()]?.content !== void 0
            ? eA(originalFileStates[diffUri.toString()].content)
            : void 0;

        if (
          originalTextDiffWrtV0 !== void 0 &&
          newTextDiffWrtV0 !== void 0 &&
          originalContent !== void 0
        ) {
          const originalLines = this._composerCodeBlockService.applyDiffToLines(
            originalContent,
            originalTextDiffWrtV0
          );
          const newLines = this._composerCodeBlockService.applyDiffToLines(
            originalContent,
            newTextDiffWrtV0
          );

          if (originalLines && newLines) {
            const newContent = newLines.join("\n");
            await this._composerFileService.writeFile({
              uri: diffUri,
              bufferOrReadableOrStream: Ps.fromString(newContent),
              composerData,
            });
            await this._composerFileService.revertFile({
              uri: diffUri,
              composerData,
              options: { soft: false },
            });

            const modelRef = await this._textModelService.createModelReference(diffUri);
            try {
              await this._textFileService.files.resolve(diffUri, {
                reload: { async: false },
                forceReadFromFile: true,
              });

              // Remove existing inline diff
              const existingDiff = this._inlineDiffService.inlineDiffs
                .nonReactive()
                .find((d) => d.uri.toString() === diffUri.toString());
              if (existingDiff) {
                this._inlineDiffService.remove(existingDiff.id);
              }

              // Add new inline diff decoration
              const lineCount = newLines.length;
              const range = new rh(1, lineCount + 1);
              await this._inlineDiffService.addDecorationsOnlyDiff({
                uri: diffUri,
                generationUUID: generationUUID ?? Gr(),
                currentRange: range,
                originalTextLines: originalLines,
                newTextLines: newLines,
                prompt: "<checkpoint-revert>",
                attachedToPromptBar: false,
                source: mce,
                createdAt: Date.now(),
                composerMetadata: {
                  composerId: composerData.composerId,
                  composerGenerationID: composerData.chatGenerationUUID ?? "",
                },
                hideDeletionViewZones: false,
              });
            } finally {
              modelRef?.dispose();
            }
          }
        }
      }

      // Update composer state
      if (!options?.fromSubmitChat) {
        this._composerDataService.updateComposerData(composerHandle, {
          currentBubbleId: isBubbleId ? targetBubbleIdOrCheckpoint : void 0,
          editingBubbleId: isBubbleId ? targetBubbleIdOrCheckpoint : void 0,
          newlyCreatedFiles: [...checkpoint.inlineDiffNewlyCreatedResources.files],
          newlyCreatedFolders: [...checkpoint.inlineDiffNewlyCreatedResources.folders],
        });
        setTimeout(() => {
          this._composerViewsService
            .getPrevEditingBubbleInputDelegate(composerId)
            .focus();
        }, 0);
      }

      console.log(
        `[composer] Completed reverting to ${isBubbleId ? "message " + targetBubbleIdOrCheckpoint : "checkpoint"}`
      );
    };
  }

  // ============================================================
  // Shortcut methods
  // ============================================================

  async checkoutToCheckpoint(composerHandle, checkpoint) {
    const callback = await this.createCheckoutCallback(composerHandle, checkpoint);
    if (callback) await callback();
  }

  async checkoutToLatest(composerHandle) {
    if (!composerHandle) {
      console.error("[composer] No composer handle provided");
      return;
    }
    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (!composerData) {
      console.error("[composer] No composer found for the given handle");
      return;
    }
    if (!composerData.latestCheckpointId) {
      console.error("[composer] No latest checkpoint found for the composer");
      return;
    }
    const checkpoint = await this._composerCheckpointStorageService.retrieveCheckpoint(
      composerData.composerId,
      composerData.latestCheckpointId
    );
    if (!checkpoint) {
      console.error("[composer] No latest checkpoint found for the composer");
      return;
    }
    return this.checkoutToCheckpoint(composerHandle, checkpoint);
  }

  // ============================================================
  // Create a checkpoint from current file states
  // ============================================================

  async createCurrentCheckpoint(composerId, previousCheckpoint, targetBubbleId) {
    const handle = this._composerDataService.getHandleIfLoaded(composerId);
    const composerData = handle ? this._composerDataService.getComposerData(handle) : void 0;

    if (!composerData || !handle) {
      throw new Error("[composer] No composer found for the given ID");
    }

    const checkpoint = Ijl(); // createEmptyCheckpoint()
    const trackedUris = this.getUrisForCheckpoints(composerData);

    for (const uriStr of trackedUris) {
      const uri = je.parse(uriStr);
      const originalState = composerData.originalFileStates[uriStr];
      if (originalState === void 0) continue;

      // If targeting a specific bubble and this file was first edited by that bubble
      // and is newly created, just record it as newly created
      if (
        targetBubbleId !== void 0 &&
        originalState.firstEditBubbleId === targetBubbleId &&
        originalState.isNewlyCreated
      ) {
        checkpoint.files.push({
          uri,
          originalModelDiffWrtV0: [],
          isNewlyCreated: true,
        });
        checkpoint.newlyCreatedFolders.push(
          ...originalState.newlyCreatedFolders.map((f) => ({ uri: f }))
        );
        continue;
      }

      const freshData = this._composerDataService.getComposerData(handle);
      if (!(await this._composerFileService.exists({ uri, composerData: freshData }))) {
        checkpoint.nonExistentFiles.push({ uri });
        continue;
      }

      try {
        const currentHandle = this._composerDataService.getHandleIfLoaded(composerId);
        if (!currentHandle) continue;

        const inlineDiff = this._composerCodeBlockService.getInlineDiff(currentHandle, uri);
        if (inlineDiff) {
          if ("newTextLines" in inlineDiff && "originalTextLines" in inlineDiff) {
            const codeBlockId = inlineDiff.composerMetadata?.codeblockId ?? "";
            const [originalDiff, newDiff] = await Promise.all([
              this._composerCodeBlockService.computeLineDiffs(
                currentHandle,
                uri,
                inlineDiff.originalTextLines
              ),
              this._composerCodeBlockService.computeLineDiffs(
                currentHandle,
                uri,
                inlineDiff.newTextLines
              ),
            ]);
            checkpoint.activeInlineDiffs.push({
              uri,
              codeBlockId,
              originalTextDiffWrtV0: originalDiff,
              newTextDiffWrtV0: newDiff,
              generationUUID: inlineDiff.generationUUID,
            });
          }
        } else {
          let modelRef;
          try {
            modelRef = await this.composerTextModelService.createModelReference(
              uri,
              composerData,
              true
            );
            const textModel = modelRef.object.textEditorModel;
            const diff = await this._composerCodeBlockService.computeLineDiffs(
              currentHandle,
              uri,
              textModel.getLinesContent()
            );
            checkpoint.files.push({ uri, originalModelDiffWrtV0: diff });
          } finally {
            modelRef?.dispose();
          }
        }
      } catch (error) {
        console.error(`[composer] Error saving latest state for file ${uriStr}:`, error);
      }
    }

    // Carry forward newly created files from previous checkpoint
    if (previousCheckpoint) {
      const newlyCreated = previousCheckpoint.files.filter(
        (f) =>
          f.isNewlyCreated && !checkpoint.files.find((cf) => cf.uri.toString() === f.uri.toString())
      );
      checkpoint.files.push(...newlyCreated);
      checkpoint.newlyCreatedFolders = [...previousCheckpoint.newlyCreatedFolders];
    }

    checkpoint.inlineDiffNewlyCreatedResources = {
      files: [...composerData.newlyCreatedFiles],
      folders: [...composerData.newlyCreatedFolders],
    };

    return checkpoint;
  }

  // ============================================================
  // Validate checkpoint content (check if revert would change anything)
  // ============================================================

  async validateCheckpointContent(composerHandle, targetBubbleIdOrCheckpoint) {
    if (!composerHandle) return { isSame: false, hasNotebookFiles: false };

    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (!composerData) return { isSame: false, hasNotebookFiles: false };

    const isBubbleId = typeof targetBubbleIdOrCheckpoint === "string";
    let checkpoint;
    let filesToRevert = new Set();
    let intermediateFiles = new Map();
    let foldersToDelete = new Set();

    if (typeof targetBubbleIdOrCheckpoint === "string") {
      const checkpointId =
        composerData.conversationMap[targetBubbleIdOrCheckpoint].checkpointId;
      if (!checkpointId) return { isSame: true, hasNotebookFiles: false };

      checkpoint = await this._composerCheckpointStorageService.retrieveCheckpoint(
        composerData.composerId,
        checkpointId
      );
      if (!checkpoint) return { isSame: true, hasNotebookFiles: false };

      const revertInfo = await this.getFilesToRevertForCheckpoint(
        composerHandle,
        targetBubbleIdOrCheckpoint,
        composerData.currentBubbleId,
        checkpoint
      );
      filesToRevert = revertInfo.filesToRevert;
      intermediateFiles = revertInfo.intermediateFiles;
      foldersToDelete = revertInfo.foldersToDelete;
    } else {
      checkpoint = targetBubbleIdOrCheckpoint;
      const activeInlineDiffUris = new Set(
        checkpoint.activeInlineDiffs?.map((d) => d.uri.toString()) ?? []
      );
      const trackedUris = this.getUrisForCheckpoints(composerData);
      filesToRevert = new Set(
        checkpoint.files
          .map((f) => f.uri.toString())
          .filter((uri) => !activeInlineDiffUris.has(uri) && trackedUris.has(uri))
      );
    }

    const hasNotebookFiles = Array.from(filesToRevert).some((uri) => uri.endsWith(".ipynb"));

    // Check each file to see if content has changed
    const currentContents = await this._composerDataService.getCurrentFilesContent(
      composerData.composerId,
      Array.from(filesToRevert)
    );

    for (const fileUri of filesToRevert) {
      let fileCheckpoint;
      if (checkpoint.files.some((f) => f.uri.toString() === fileUri)) {
        fileCheckpoint = checkpoint.files.find((f) => f.uri.toString() === fileUri);
      } else {
        const intermediate = intermediateFiles.get(fileUri);
        if (intermediate) {
          fileCheckpoint = intermediate.checkpoint.files.find(
            (f) => f.uri.toString() === fileUri
          );
        }
      }

      const currentLines = currentContents.get(fileUri) || [];

      if (fileCheckpoint) {
        if (fileCheckpoint.isNewlyCreated) {
          if (
            await this._composerFileService.exists({
              uri: fileCheckpoint.uri,
              composerData,
            })
          ) {
            return { isSame: false, hasNotebookFiles };
          }
        } else {
          if (
            !(await this._composerFileService.exists({
              uri: fileCheckpoint.uri,
              composerData,
            }))
          ) {
            return { isSame: false, hasNotebookFiles };
          }

          const expectedLines =
            this._composerCodeBlockService.getCodeBlockLinesByDiff(
              composerHandle,
              fileCheckpoint.uri,
              fileCheckpoint.originalModelDiffWrtV0 ?? []
            ) ?? [];

          if (!this.areContentsEqual(currentLines, expectedLines ?? [])) {
            return { isSame: false, hasNotebookFiles };
          }
        }
      } else if (currentLines.length > 0) {
        return { isSame: false, hasNotebookFiles };
      }
    }

    // Check folders and non-existent files
    if (foldersToDelete.size > 0 || checkpoint.nonExistentFiles.length > 0) {
      return { isSame: false, hasNotebookFiles };
    }

    // Check active inline diffs
    for (const inlineDiff of checkpoint.activeInlineDiffs ?? []) {
      const { uri, codeBlockId, originalTextDiffWrtV0, newTextDiffWrtV0 } = inlineDiff;

      const existingDiff = this._inlineDiffService.inlineDiffs
        .nonReactive()
        .find((d) => d.uri.toString() === uri.toString());
      if (!existingDiff) return { isSame: false, hasNotebookFiles };

      const checkpointCodeBlockId = codeBlockId || void 0;
      const existingCodeBlockId = existingDiff.composerMetadata?.codeblockId || void 0;
      if (
        checkpointCodeBlockId !== existingCodeBlockId ||
        composerData.composerId !== existingDiff.composerMetadata?.composerId
      ) {
        return { isSame: false, hasNotebookFiles };
      }

      if ("originalTextLines" in existingDiff && "newTextLines" in existingDiff) {
        const expectedOriginal = this._composerCodeBlockService.getCodeBlockLinesByDiff(
          composerHandle,
          uri,
          originalTextDiffWrtV0 ?? []
        );
        const expectedNew = this._composerCodeBlockService.getCodeBlockLinesByDiff(
          composerHandle,
          uri,
          newTextDiffWrtV0 ?? []
        );
        if (
          !expectedOriginal ||
          !expectedNew ||
          !this.areContentsEqual(expectedOriginal, existingDiff.originalTextLines) ||
          !this.areContentsEqual(expectedNew, existingDiff.newTextLines)
        ) {
          return { isSame: false, hasNotebookFiles };
        }
      }
    }

    return { isSame: true, hasNotebookFiles };
  }

  // ============================================================
  // Get files that need reverting for a checkpoint
  // ============================================================

  async getFilesToRevertForCheckpoint(
    composerHandle,
    targetBubbleId,
    currentBubbleId,
    checkpoint
  ) {
    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (!composerData) {
      throw new Error("[composer] No composer found for the given handle");
    }

    const activeInlineDiffUris = new Set(
      checkpoint.activeInlineDiffs?.map((d) => d.uri.toString()) ?? []
    );
    const foldersToDelete = new Set();
    const intermediateFiles = new Map();

    checkpoint.newlyCreatedFolders.forEach((folder) => {
      foldersToDelete.add(folder.uri.toString());
    });

    // Walk conversation between target and current to find intermediate checkpoints
    const conversation = this._composerDataService.getLoadedConversation(composerHandle);
    const targetIdx = conversation.findIndex((msg) => msg.bubbleId === targetBubbleId) + 1;
    const currentIdx = currentBubbleId
      ? conversation.findIndex((msg) => msg.bubbleId === currentBubbleId)
      : conversation.length;

    for (const message of conversation.slice(targetIdx, currentIdx)) {
      const msgCheckpoint = message.checkpointId
        ? await this._composerCheckpointStorageService.retrieveCheckpoint(
            composerData.composerId,
            message.checkpointId
          )
        : void 0;

      if (msgCheckpoint) {
        msgCheckpoint.files.forEach((file) => {
          const uri = file.uri.toString();
          if (
            !checkpoint.files.some((f) => f.uri.toString() === uri) &&
            !intermediateFiles.has(uri) &&
            !activeInlineDiffUris.has(uri)
          ) {
            intermediateFiles.set(uri, { checkpoint: msgCheckpoint });
          }
        });
        msgCheckpoint.newlyCreatedFolders.forEach((folder) => {
          foldersToDelete.add(folder.uri.toString());
        });
      }
    }

    const trackedUris = this.getUrisForCheckpoints(composerData);
    return {
      filesToRevert: new Set(
        [
          ...checkpoint.files
            .filter((f) => !activeInlineDiffUris.has(f.uri.toString()))
            .map((f) => f.uri.toString()),
          ...intermediateFiles.keys(),
        ].filter((uri) => trackedUris.has(uri))
      ),
      intermediateFiles,
      foldersToDelete,
    };
  }

  // ============================================================
  // Get all URIs that should be tracked for checkpoints
  // ============================================================

  getUrisForCheckpoints(composerData) {
    // NAL mode: use originalFileStates directly
    if (composerData.isNAL) {
      return new Set(
        Array.from(Object.keys(composerData.originalFileStates)).filter((uriStr) => {
          const uri = je.parse(uriStr);
          return uri.scheme !== _n.vscodeNotebookCell && !uri.path.endsWith(".ipynb");
        })
      );
    }

    // Standard mode: collect from codeBlockData + tool former data
    const uris = new Set();

    for (const uriStr of Object.keys(composerData.codeBlockData)) {
      uris.add(uriStr);
    }

    const handle = this._composerDataService.getHandleIfLoaded(composerData.composerId);
    const conversation = handle
      ? this._composerDataService.getLoadedConversation(handle)
      : [];

    for (const message of conversation) {
      if (message.capabilityType === ko.TOOL_FORMER) {
        const bubbleData = handle
          ? this._composerDataService
              .getComposerCapability(handle, ko.TOOL_FORMER)
              ?.getBubbleData(message.bubbleId)
          : void 0;

        if (
          bubbleData?.tool === on.DELETE_FILE &&
          bubbleData.params?.relativeWorkspacePath
        ) {
          const resolvedUri = this._workspaceContextService.resolveRelativePath(
            bubbleData.params.relativeWorkspacePath
          );
          uris.add(resolvedUri.toString());
        }
      }
    }

    return new Set(
      Array.from(uris).filter((uriStr) => {
        const uri = je.parse(uriStr);
        return uri.scheme !== _n.vscodeNotebookCell && !uri.path.endsWith(".ipynb");
      })
    );
  }

  // ============================================================
  // Content comparison helper
  // ============================================================

  areContentsEqual(linesA, linesB) {
    if (linesA.length !== linesB.length) return false;
    for (let i = 0; i < linesA.length; i++) {
      if (linesA[i] !== linesB[i]) return false;
    }
    return true;
  }

  // ============================================================
  // Get file contents at a checkpoint
  // ============================================================

  getFileContentsGivenCheckpoint(composerHandle, checkpoint, fileUri) {
    const uriStr = fileUri.toString();

    const inlineDiff = checkpoint.activeInlineDiffs.find(
      (d) => d.uri.toString() === uriStr
    );
    const fileState = checkpoint.files.find((f) => f.uri.toString() === uriStr);

    let contents = null;
    if (inlineDiff && inlineDiff.newTextDiffWrtV0) {
      contents =
        this._composerCodeBlockService
          .getCodeBlockLinesByDiff(composerHandle, fileUri, inlineDiff.newTextDiffWrtV0)
          ?.join("\n") ?? null;
    } else if (fileState && fileState.originalModelDiffWrtV0) {
      if (fileState.isNewlyCreated && fileState.originalModelDiffWrtV0.length === 0)
        return null;
      contents =
        this._composerCodeBlockService
          .getCodeBlockLinesByDiff(
            composerHandle,
            fileUri,
            fileState.originalModelDiffWrtV0
          )
          ?.join("\n") ?? null;
    }

    return contents;
  }

  async getFileContentsGivenBubbleId(composerHandle, bubbleId, fileUri, options) {
    if (!composerHandle) return { case: "notFound" };

    const composerData = this._composerDataService.getComposerData(composerHandle);
    if (!composerData) return { case: "notFound" };

    const bubble = this._composerDataService.getComposerBubble(composerHandle, bubbleId);
    if (!bubble) return { case: "notFound" };

    let checkpointId = bubble.checkpointId;
    if (options?.isAfterCheckpoint) {
      checkpointId = bubble.afterCheckpointId;
    }

    const checkpoint = checkpointId
      ? await this._composerCheckpointStorageService.retrieveCheckpoint(
          composerData.composerId,
          checkpointId
        )
      : void 0;

    if (!checkpoint) return { case: "notFound" };

    const contents = this.getFileContentsGivenCheckpoint(
      composerHandle,
      checkpoint,
      fileUri
    );

    if (contents === null) {
      const uriStr = fileUri.toString();
      if (composerData.originalFileStates[uriStr]?.isNewlyCreated) {
        return { case: "isNewlyCreated" };
      }
      return { case: "notFound" };
    }

    return { case: "contents", contents };
  }

  // ============================================================
  // Update checkpoint for a bubble
  // ============================================================

  async updateComposerBubbleCheckpoint(composerId, bubbleId, options) {
    const startTime = Date.now();
    try {
      const checkpoint = await this.createCurrentCheckpoint(
        composerId,
        void 0,
        bubbleId
      );
      if (checkpoint) {
        const handle = this._composerDataService.getHandleIfLoaded(composerId);
        if (handle) {
          await this._composerDataService.updateComposerBubbleCheckpoint(
            handle,
            bubbleId,
            checkpoint,
            { isAfterCheckpoint: options?.isAfterCheckpoint ?? false }
          );
        }
      }
    } finally {
      const elapsed = Date.now() - startTime;
      console.debug(
        `[composer.checkpoint] Updated composer bubble checkpoint for composer ${composerId} in ${elapsed}ms`
      );
    }
  }

  // ============================================================
  // Track new file in last checkpoint
  // ============================================================

  async updateLastCheckpointWithFileIfNotTracked(composerHandle, fileUri, options) {
    if (!composerHandle) return;

    const composerId = composerHandle.data.composerId;
    const lastBubbleWithCheckpoint = this._composerDataService.getLastBubbleWhere(
      composerHandle,
      (bubble) => !!bubble.checkpointId
    );

    const existingCheckpoint = lastBubbleWithCheckpoint?.checkpointId
      ? await this._composerCheckpointStorageService.retrieveCheckpoint(
          composerId,
          lastBubbleWithCheckpoint.checkpointId
        )
      : void 0;

    if (!fileUri.path.endsWith(".ipynb") && lastBubbleWithCheckpoint) {
      const isAlreadyTracked =
        existingCheckpoint?.files.some((f) => f.uri.toString() === fileUri.toString()) ||
        existingCheckpoint?.activeInlineDiffs.some(
          (d) => d.uri.toString() === fileUri.toString()
        );

      if (!isAlreadyTracked) {
        let lines = [" "];
        if (options?.forceModelContent) {
          lines = options.forceModelContent;
        } else {
          let modelRef;
          try {
            const composerData = composerHandle.data;
            modelRef = await this.composerTextModelService.createModelReference(
              fileUri,
              composerData,
              true
            );
            lines = modelRef.object.textEditorModel.getLinesContent();
          } finally {
            modelRef?.dispose();
          }
        }

        const diff = await this._composerCodeBlockService.computeLineDiffs(
          composerHandle,
          fileUri,
          lines
        );

        const checkpointPath = [
          "conversationMap",
          lastBubbleWithCheckpoint.bubbleId,
          "checkpointId",
        ];

        // Create checkpoint if none exists
        if (existingCheckpoint === void 0) {
          const emptyCheckpoint = Ijl();
          const newCheckpointId =
            await this._composerCheckpointStorageService.storeCheckpoint(
              composerId,
              emptyCheckpoint
            );
          this._composerDataService.updateComposerDataSetStore(
            composerHandle,
            (setter) => setter(...checkpointPath, newCheckpointId)
          );
        }

        // Add file to checkpoint
        if (lastBubbleWithCheckpoint?.checkpointId) {
          const cpId = lastBubbleWithCheckpoint.checkpointId;
          await this._composerCheckpointStorageService.updateCheckpoint(
            composerId,
            cpId,
            (cp) => {
              cp.files.push({
                uri: fileUri,
                originalModelDiffWrtV0: diff,
                isNewlyCreated: options?.isNewlyCreated ?? false,
              });
              cp.newlyCreatedFolders.push(...(options?.newlyCreatedFolders ?? []));
            }
          );
        }
      }
    }
  }
};

// Method-level tracing decorators
__decorate(
  [Hs("ComposerCheckpointService.createCheckoutCallback")],
  ComposerCheckpointService.prototype,
  "createCheckoutCallback",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.createCheckoutCallbackWithInlineDiffs")],
  ComposerCheckpointService.prototype,
  "createCheckoutCallbackWithInlineDiffs",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.checkoutToCheckpoint")],
  ComposerCheckpointService.prototype,
  "checkoutToCheckpoint",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.checkoutToLatest")],
  ComposerCheckpointService.prototype,
  "checkoutToLatest",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.createCurrentCheckpoint")],
  ComposerCheckpointService.prototype,
  "createCurrentCheckpoint",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.validateCheckpointContent")],
  ComposerCheckpointService.prototype,
  "validateCheckpointContent",
  null
);
__decorate(
  [Hs("ComposerUtilsService.getFilesToRevertForCheckpoint")],
  ComposerCheckpointService.prototype,
  "getFilesToRevertForCheckpoint",
  null
);
__decorate(
  [Hs("ComposerUtilsService.getUrisForCheckpoints")],
  ComposerCheckpointService.prototype,
  "getUrisForCheckpoints",
  null
);
__decorate(
  [Hs("ComposerUtilsService.areContentsEqual")],
  ComposerCheckpointService.prototype,
  "areContentsEqual",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.getFileContentsGivenCheckpoint")],
  ComposerCheckpointService.prototype,
  "getFileContentsGivenCheckpoint",
  null
);
__decorate(
  [Hs("ComposerCheckpointService.getFileContentsGivenBubbleId")],
  ComposerCheckpointService.prototype,
  "getFileContentsGivenBubbleId",
  null
);

// DI registration
ComposerCheckpointService = __decorate(
  [
    __param(0, Fa),   // IComposerDataService
    __param(1, sw),   // IComposerViewsService
    __param(2, KZ),   // IComposerFileService
    __param(3, iO),   // IPrettyDialogService
    __param(4, mL),   // IInlineDiffService
    __param(5, xu),   // IReactiveStorageService
    __param(6, aie),  // IComposerTextModelService
    __param(7, mh),   // IAnalyticsService
    __param(8, Rr),   // IWorkspaceContextService
    __param(9, br),   // ICommandService
    __param(10, Ett), // IComposerCheckpointStorageService
    __param(11, SJ),  // IComposerCodeBlockService
    __param(12, Wg),  // ITextFileService
    __param(13, xl),  // ITextModelService
    __param(14, Zpn), // IPatchGraphAdapterService
  ],
  ComposerCheckpointService
);

Ki(IComposerCheckpointService, ComposerCheckpointService, 1);
