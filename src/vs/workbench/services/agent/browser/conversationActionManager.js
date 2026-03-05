/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/agent/browser/conversationActionManager.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
skt(), dp(), Iie();

// --- ConversationActionManager ---
// Manages the lifecycle of conversation actions — coordinates between the
// composer's abort controller and the generation UUID. Links abort signals
// so aborting the composer also aborts the active generation and vice versa.
const ConversationActionManager = class extends _Ai { // AbortableDisposable
  constructor(
    composerId,
    composerAbortController,
    instantiationService,
    generationUUID
  ) {
    super();
    this.composerId = composerId;
    this.composerAbortController = composerAbortController;
    this.instantiationService = instantiationService;
    this.generationUUID = generationUUID;

    // When this manager is aborted, handle the composer abort
    this.addAbortCallback(() => {
      const composerService = this.instantiationService.invokeFunction(
        accessor => accessor.get(bM) // IComposerService
      );
      const composerDataService = this.instantiationService.invokeFunction(
        accessor => accessor.get(Fa) // IComposerDataService
      );
      const handle = composerDataService.getHandleIfLoaded(this.composerId);
      if (!handle) return;

      const data = composerDataService.getComposerData(handle);
      if (data?.status !== "generating" || data?.chatGenerationUUID !== this.generationUUID) {
        return;
      }
      composerService.handleAbortChat(handle);
      composerDataService.updateComposerDataSetStore(
        handle,
        setter => setter("conversationActionManager", undefined)
      );
    });

    // Link abort signals bidirectionally
    if (this.composerAbortController.signal.aborted) {
      this.abort("composer_abort_controller_already_aborted");
    } else {
      this.composerAbortControllerListener = () =>
        this.abort("composer_abort_controller_aborted");
      this.composerAbortController.signal.addEventListener(
        "abort",
        this.composerAbortControllerListener,
        { once: true }
      );
    }

    if (!this.signal.aborted) {
      this.signalListener = () => {
        const reason = this.signal.reason ?? "linked_signal_aborted";
        this.composerAbortController.abort(reason);
      };
      this.signal.addEventListener("abort", this.signalListener, { once: true });
    } else {
      const reason = this.signal.reason ?? "linked_signal_already_aborted";
      this.composerAbortController.abort(reason);
    }
  }

  getGenerationUUID() {
    return this.generationUUID;
  }

  dispose() {
    super.dispose();
    // Clean up composer abort controller listener
    if (this.composerAbortControllerListener &&
        !this.composerAbortController.signal.aborted) {
      this.composerAbortController.signal.removeEventListener(
        "abort",
        this.composerAbortControllerListener
      );
      this.composerAbortControllerListener = undefined;
    }
    // Clean up own signal listener
    if (this.signalListener && !this.signal.aborted) {
      this.signal.removeEventListener("abort", this.signalListener);
      this.signalListener = undefined;
    }
  }
};

// --- Symbol Map ---
// Gpn  → ConversationActionManager
// _Ai  → AbortableDisposable (base class with abort support)
// bM   → IComposerService
// Fa   → IComposerDataService
