// Source: out-build/vs/workbench/contrib/composer/browser/composerFileService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the ComposerFileService — wraps VS Code's file service
// with composer-specific operations (workspace-aware URI resolution, notebook support, etc.)

jl(), st(), Qr(), Xn(), ts(), Er(), Qt(), oy(), ss(), Of(), oce(), Zk(), ls(), Aye(), Q0(),
  Sr(), Yu();

/** Retry delay between file creation attempts (ms) */
const FILE_CREATION_RETRY_DELAY = 500;

const IComposerFileService = Bi("composerFileService");

/**
 * ComposerFileService
 *
 * Provides file operations scoped to a composer context.
 * All URIs are resolved through the workspace context to handle
 * git worktrees and workspace-relative paths correctly.
 *
 * Supports both regular text files and Jupyter notebooks (.ipynb).
 */
let ComposerFileService = class extends at {
  constructor(
    fileService,
    editorService,
    textFileService,
    notebookModelResolverService,
    composerEventService,
    workspaceContextService,
    experimentService,
    storageService
  ) {
    super();
    this._fileService = fileService;
    this._editorService = editorService;
    this._textFileService = textFileService;
    this._notebookModelResolverService = notebookModelResolverService;
    this._composerEventService = composerEventService;
    this._workspaceContextService = workspaceContextService;
    this._experimentService = experimentService;
    this._storageService = storageService;

    // Forward file change events to composer event service
    this._register(
      this._fileService.onDidFilesChange((event) => {
        this._composerEventService.fireDidFilesChange(event);
      })
    );
  }

  // --- Folder operations ---

  async createFolder({ uri, composerData }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return this._fileService.createFolder(resolved);
  }

  /**
   * Create a new file and any missing parent folders.
   * Returns an array of newly created folder URIs.
   * Retries up to 10 times if file doesn't appear immediately.
   */
  async createNewFileAndMaybeFolder(uri, composerData, overwrite) {
    const resolved = this.getURIForComposer(uri, composerData);
    const exists = await this.exists({ uri: resolved, composerData });
    const newFolders = [];

    if (!exists) {
      // Walk up to find the first existing parent
      let currentPath = resolved.fsPath;
      while (currentPath.length > 0) {
        const parentPath = currentPath.split("/").slice(0, -1).join("/");
        if (await this.exists({ uri: je.file(parentPath), composerData })) break;
        newFolders.push({ uri: je.file(parentPath) });
        currentPath = parentPath;
      }

      await this._fileService.createFile(resolved, Ps.fromString(""), { overwrite });

      // Wait for file to appear on disk
      const maxAttempts = 10;
      let attempts = 0;
      while (!(await this.exists({ uri: resolved, composerData })) && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, FILE_CREATION_RETRY_DELAY));
        attempts++;
      }

      if (attempts === maxAttempts) {
        console.error(
          `[composer] Failed to create file ${resolved.toString()} after ${maxAttempts} attempts`
        );
        return [];
      }
    }

    return newFolders;
  }

  // --- File I/O ---

  async writeFile({ uri, composerData, bufferOrReadableOrStream, options }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return this._fileService.writeFile(resolved, bufferOrReadableOrStream, options);
  }

  async deleteFolder({ uri, composerData, ...restOptions }) {
    const resolved = this.getURIForComposer(uri, composerData);
    if (await this.exists({ uri: resolved, composerData })) {
      try {
        await this._fileService.del(resolved, { recursive: true, ...restOptions });
      } catch (error) {
        console.error(`Error deleting folder ${resolved.toString()}:`, error);
      }
    }
  }

  async resolve({ uri, composerData, options }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return this._fileService.resolve(resolved, options);
  }

  watch({ uri, composerData, options }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return this._fileService.watch(resolved, options);
  }

  async stat({ uri, composerData }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return this._fileService.stat(resolved);
  }

  async readFile({ uri, composerData }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return await this._fileService.readFile(resolved);
  }

  async exists({ uri, composerData }) {
    const resolved = this.getURIForComposer(uri, composerData);
    return await this._fileService.exists(resolved);
  }

  // --- Delete file (with cleanup) ---

  async deleteFile({ uri, composerData }) {
    const resolved = this.getURIForComposer(uri, composerData);

    // Signal to remove inline diffs for this file
    this._composerEventService.fireToRemoveDiffs({ uri: resolved });

    try {
      // Revert any unsaved changes first
      await this.revertFile({ uri: resolved, composerData, options: { soft: false } });

      if (await this.exists({ uri: resolved, composerData })) {
        await this._fileService.del(resolved, { recursive: true });

        // Fire a synthetic file change event
        const change = { resource: resolved, type: 2 /* deleted */ };
        const event = new j5e([change], true);
        this._composerEventService.fireDidFilesChange(event);
      }

      // Close any open editors for this file
      const editors = this._editorService.findEditors(resolved);
      for (const editor of editors) {
        await this._editorService.closeEditor(editor);
      }
    } catch (error) {
      console.error(`Error deleting file ${resolved.toString()}:`, error);
    }
  }

  /**
   * Delete a newly created file and fire event.
   * Only deletes if the file is tracked as newly created.
   */
  async deleteNewFileAndMaybeFolder(uri, composerId, composerData) {
    const resolved = this.getURIForComposer(uri, composerData);

    // Check if file was created by this composer
    if (!composerData?.newlyCreatedFiles?.find((f) => f.uri.toString() === resolved.toString())) {
      return false;
    }

    try {
      await this.deleteFile({ uri: resolved, composerData });
      this._composerEventService.fireNewFileDeleted({ composerId, uri: resolved });
      return true;
    } catch (error) {
      console.error(`Error deleting file ${resolved.toString()}:`, error);
      return false;
    }
  }

  // --- Save/Revert ---

  async saveFiles({ uris, composerData, options }) {
    await Promise.allSettled(
      uris.map(async (uri) => {
        await this.saveFile({
          uri: this.getURIForComposer(uri, composerData),
          composerData,
          options,
        });
      })
    );
  }

  async saveFile({ uri, composerData, options }) {
    let resolved = this.getURIForComposer(uri, composerData);

    // Handle notebook cell URIs
    if (resolved.scheme === _n.vscodeNotebookCell) {
      resolved = ygt(resolved); // Convert cell URI to notebook URI
    }

    const shouldForce = Ih(this._storageService) || options?.force === true;

    // Notebook files
    if (resolved.path.endsWith(".ipynb")) {
      if (!this._notebookModelResolverService.isDirty(resolved) && !shouldForce) return true;
      let ref;
      try {
        ref = await this._notebookModelResolverService.resolve(resolved);
        return await ref.object.save({ ...options, force: shouldForce });
      } catch (error) {
        console.error("[composer] Error saving notebook:", error);
        return false;
      } finally {
        ref?.dispose();
      }
    }

    // Regular text files
    if (!this._textFileService.isDirty(resolved) && !shouldForce) return true;
    return !!await this._textFileService.save(resolved, {
      reason: 1,
      force: shouldForce,
      ...options,
    });
  }

  async revertFile({ uri, composerData, options }) {
    let resolved = this.getURIForComposer(uri, composerData);

    if (resolved.scheme === _n.vscodeNotebookCell) {
      resolved = ygt(resolved);
    }

    // Notebook files
    if (resolved.path.endsWith(".ipynb")) {
      if (!this._notebookModelResolverService.isDirty(resolved)) return;
      let ref;
      try {
        ref = await this._notebookModelResolverService.resolve(resolved);
        await ref.object.revert(options);
      } catch (error) {
        console.error("[composer] Error reverting notebook:", error);
      } finally {
        ref?.dispose();
      }
    } else {
      // Regular text files
      if (!this._textFileService.isDirty(resolved)) return;
      await this._textFileService.revert(resolved, options);
    }
  }

  // --- URI resolution ---

  getURIForComposer(uri, composerData) {
    return xSt(uri, composerData, this._workspaceContextService);
  }
};

// Method-level tracing decorators
__decorate(
  [Hs("ComposerFileService.createFolder")],
  ComposerFileService.prototype,
  "createFolder",
  null
);
__decorate(
  [Hs("ComposerFileService.createNewFileAndMaybeFolder")],
  ComposerFileService.prototype,
  "createNewFileAndMaybeFolder",
  null
);
__decorate(
  [Hs("ComposerFileService.writeFile")],
  ComposerFileService.prototype,
  "writeFile",
  null
);
__decorate(
  [Hs("ComposerFileService.deleteFolder")],
  ComposerFileService.prototype,
  "deleteFolder",
  null
);
__decorate(
  [Hs("ComposerFileService.resolve")],
  ComposerFileService.prototype,
  "resolve",
  null
);
__decorate(
  [Hs("ComposerFileService.watch")],
  ComposerFileService.prototype,
  "watch",
  null
);
__decorate(
  [Hs("ComposerFileService.stat")],
  ComposerFileService.prototype,
  "stat",
  null
);
__decorate(
  [Hs("ComposerFileService.readFile")],
  ComposerFileService.prototype,
  "readFile",
  null
);
__decorate(
  [Hs("ComposerFileService.exists")],
  ComposerFileService.prototype,
  "exists",
  null
);
__decorate(
  [Hs("ComposerService.deleteFile")],
  ComposerFileService.prototype,
  "deleteFile",
  null
);
__decorate(
  [Hs("ComposerFileService.deleteNewFileAndMaybeFolder")],
  ComposerFileService.prototype,
  "deleteNewFileAndMaybeFolder",
  null
);
__decorate(
  [Hs("ComposerFileService.saveFiles")],
  ComposerFileService.prototype,
  "saveFiles",
  null
);
__decorate(
  [Hs("ComposerFileService.saveFile")],
  ComposerFileService.prototype,
  "saveFile",
  null
);
__decorate(
  [Hs("ComposerFileService.revertFile")],
  ComposerFileService.prototype,
  "revertFile",
  null
);

// DI registration
ComposerFileService = __decorate(
  [
    __param(0, Jr),  // IFileService
    __param(1, _i),  // IEditorService
    __param(2, Wg),  // ITextFileService
    __param(3, Bq),  // INotebookModelResolverService
    __param(4, RA),  // IComposerEventService
    __param(5, Rr),  // IWorkspaceContextService
    __param(6, Rl),  // IExperimentService
    __param(7, Ji),  // IStorageService
  ],
  ComposerFileService
);

Ki(IComposerFileService, ComposerFileService, 1);
