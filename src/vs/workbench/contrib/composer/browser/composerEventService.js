// Source: out-build/vs/workbench/contrib/composer/browser/composerEventService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Qt(), st(), Er(), yn(), Fx(), So();

const IComposerEventService = Bi("composerEventService");

let ComposerEventService = class ComposerEventService extends at {
  static { _self = this; }
  static { this.MAX_PENDING_TIMING_AGE_MS = 1e5; }

  constructor(metricsService, notificationService) {
    super();
    this._metricsService = metricsService;
    this._notificationService = notificationService;

    // === Event emitters ===
    this._onContextRemovedEmitter = this._register(new Qe());
    this.onContextRemoved = this._onContextRemovedEmitter.event;

    this._onShouldShowPreviewEmitter = this._register(new Qe());
    this.onShouldShowPreview = this._onShouldShowPreviewEmitter.event;

    this._onShouldForceTextEmitter = this._register(new Qe());
    this.onShouldForceText = this._onShouldForceTextEmitter.event;

    this._onDidAiEditFileEmitter = this._register(new Qe());
    this.onDidAiEditFile = this._onDidAiEditFileEmitter.event;

    this._onDidAcceptDiffWithoutInlineEmitter = this._register(new Qe());
    this.onDidAcceptDiffWithoutInline = this._onDidAcceptDiffWithoutInlineEmitter.event;

    this._onDidPatchGraphDiffDisplayedEmitter = this._register(new Qe());
    this.onDidPatchGraphDiffDisplayed = this._onDidPatchGraphDiffDisplayedEmitter.event;

    this._onDidPatchGraphDiffAcceptedEmitter = this._register(new Qe());
    this.onDidPatchGraphDiffAccepted = this._onDidPatchGraphDiffAcceptedEmitter.event;

    this._onDidPatchGraphDiffRejectedEmitter = this._register(new Qe());
    this.onDidPatchGraphDiffRejected = this._onDidPatchGraphDiffRejectedEmitter.event;

    this._onDidFinishAiEditToolCallEmitter = this._register(new Qe());
    this.onDidFinishAiEditToolCall = this._onDidFinishAiEditToolCallEmitter.event;

    this._onDidSendRequestEmitter = this._register(new Qe());
    this.onDidSendRequest = this._onDidSendRequestEmitter.event;

    this._onMaybeRunOnComposerSettledEmitter = this._register(new Qe());
    this.onMaybeRunOnComposerSettled = this._onMaybeRunOnComposerSettledEmitter.event;

    this._onDidContextChangeEmitter = this._register(new Qe());
    this.onDidContextChange = this._onDidContextChangeEmitter.event;

    this._onDidPasteEmitter = this._register(new Qe());
    this.onDidPaste = this._onDidPasteEmitter.event;

    this._onDidPasteImageEmitter = this._register(new Qe());
    this.onDidPasteImage = this._onDidPasteImageEmitter.event;

    this._onShouldSwapComposersEmitter = this._register(new Qe());
    this.onShouldSwapComposers = this._onShouldSwapComposersEmitter.event;

    this._onDidChangeUnifiedModeEmitter = this._register(new Qe());
    this.onDidChangeUnifiedMode = this._onDidChangeUnifiedModeEmitter.event;

    this._onDidComposerViewsServiceFinishInitializingEmitter = this._register(new Qe());
    this.onDidComposerViewsServiceFinishInitializing =
      this._onDidComposerViewsServiceFinishInitializingEmitter.event;

    this._onDidComposerServiceFinishInitializingEmitter = this._register(new Qe());
    this.onDidComposerServiceFinishInitializing =
      this._onDidComposerServiceFinishInitializingEmitter.event;

    this._onWindowInWindowChangedTitleBarEmitter = this._register(new Qe());
    this.onWindowInWindowChangedTitleBar =
      this._onWindowInWindowChangedTitleBarEmitter.event;

    this._onDidRegisterNewCodeBlockEmitter = this._register(new Qe());
    this.onDidRegisterNewCodeBlock = this._onDidRegisterNewCodeBlockEmitter.event;

    this._onResetComposerEmitter = this._register(new Qe());
    this.onResetComposer = this._onResetComposerEmitter.event;

    this._onDidFinishStreamChatEmitter = this._register(new Qe());
    this.onDidFinishStreamChat = this._onDidFinishStreamChatEmitter.event;

    this._onDidDeleteFileToolCallEmitter = this._register(new Qe());
    this.onDidDeleteFileToolCall = this._onDidDeleteFileToolCallEmitter.event;

    this._onDidFilesChangeEmitter = this._register(new Qe());
    this.onDidFilesChange = this._onDidFilesChangeEmitter.event;

    this._onNewFileDeletedEmitter = this._register(new Qe());
    this.onNewFileDeleted = this._onNewFileDeletedEmitter.event;

    this._onToRemoveDiffsEmitter = this._register(new Qe());
    this.onToRemoveDiffs = this._onToRemoveDiffsEmitter.event;

    this._onDidUpdateAgentLayoutPaneEmitter = this._register(new Qe());
    this.onDidUpdateAgentLayoutPane = this._onDidUpdateAgentLayoutPaneEmitter.event;

    this._onDidRequestComposerLocationChangeEmitter = this._register(new Qe());
    this.onDidRequestComposerLocationChange =
      this._onDidRequestComposerLocationChangeEmitter.event;

    this._onDidRequestOpenBranchMenuEmitter = this._register(new Qe());
    this.onDidRequestOpenBranchMenu = this._onDidRequestOpenBranchMenuEmitter.event;

    this._onDidRequestSwitchSubComposerTabEmitter = this._register(new Qe());
    this.onDidRequestSwitchSubComposerTab =
      this._onDidRequestSwitchSubComposerTabEmitter.event;

    this._onDidRequestSelectSubComposerTabByIndexEmitter = this._register(new Qe());
    this.onDidRequestSelectSubComposerTabByIndex =
      this._onDidRequestSelectSubComposerTabByIndexEmitter.event;

    this._onDidLoadComposerEmitter = this._register(new Qe());
    this.onDidLoadComposer = this._onDidLoadComposerEmitter.event;

    this._onDidComposerStopGeneratingEmitter = this._register(new Qe());
    this.onDidComposerStopGenerating = this._onDidComposerStopGeneratingEmitter.event;

    // === State ===
    this._isComposerViewsServiceInitialized = false;
    this._isComposerServiceInitialized = false;
    this._pendingChatLoadTimings = new Map();
  }

  // === Fire methods ===
  fireContextRemoved(data) { this._onContextRemovedEmitter.fire(data); }
  fireShouldShowPreview(data) { this._onShouldShowPreviewEmitter.fire(data); }
  fireShouldForceText(data) { this._onShouldForceTextEmitter.fire(data); }
  fireDidAiEditFile(data) { this._onDidAiEditFileEmitter.fire(data); }
  fireDidAcceptDiffWithoutInline(data) { this._onDidAcceptDiffWithoutInlineEmitter.fire(data); }
  fireDidPatchGraphDiffDisplayed(data) { this._onDidPatchGraphDiffDisplayedEmitter.fire(data); }
  fireDidPatchGraphDiffAccepted(data) { this._onDidPatchGraphDiffAcceptedEmitter.fire(data); }
  fireDidPatchGraphDiffRejected(data) { this._onDidPatchGraphDiffRejectedEmitter.fire(data); }
  fireDidFinishAiEditToolCall(data) { this._onDidFinishAiEditToolCallEmitter.fire(data); }
  fireDidSendRequest(data) { this._onDidSendRequestEmitter.fire(data); }
  fireMaybeRunOnComposerSettled(data) { this._onMaybeRunOnComposerSettledEmitter.fire(data); }
  fireDidContextChange(data) { this._onDidContextChangeEmitter.fire(data); }
  fireDidPaste(data) { this._onDidPasteEmitter.fire(data); }
  fireDidPasteImage(data) { this._onDidPasteImageEmitter.fire(data); }
  fireShouldSwapComposers(data) { this._onShouldSwapComposersEmitter.fire(data); }
  fireOnDidChangeUnifiedMode(data) { this._onDidChangeUnifiedModeEmitter.fire(data); }

  fireDidComposerViewsServiceFinishInitializing() {
    this._isComposerViewsServiceInitialized = true;
    this._onDidComposerViewsServiceFinishInitializingEmitter.fire();
  }

  fireDidComposerServiceFinishInitializing() {
    this._isComposerServiceInitialized = true;
    this._onDidComposerServiceFinishInitializingEmitter.fire();
  }

  fireDidRegisterNewCodeBlock(data) { this._onDidRegisterNewCodeBlockEmitter.fire(data); }
  fireResetComposer() { this._onResetComposerEmitter.fire(); }
  fireWindowInWindowChangedTitleBar() { this._onWindowInWindowChangedTitleBarEmitter.fire(); }
  fireDidFinishStreamChat(data) { this._onDidFinishStreamChatEmitter.fire(data); }
  fireDidDeleteFileToolCall(data) { this._onDidDeleteFileToolCallEmitter.fire(data); }
  fireDidComposerStopGenerating(data) { this._onDidComposerStopGeneratingEmitter.fire(data); }
  fireNewFileDeleted(data) { this._onNewFileDeletedEmitter.fire(data); }

  isComposerViewsServiceInitialized() {
    return this._isComposerViewsServiceInitialized;
  }

  isComposerServiceInitialized() {
    return this._isComposerServiceInitialized;
  }

  fireDidFilesChange(data) { this._onDidFilesChangeEmitter.fire(data); }
  fireToRemoveDiffs(data) { this._onToRemoveDiffsEmitter.fire(data); }
  fireDidUpdateAgentLayoutPane(data) { this._onDidUpdateAgentLayoutPaneEmitter.fire(data); }
  fireDidRequestComposerLocationChange(data) { this._onDidRequestComposerLocationChangeEmitter.fire(data); }
  fireDidRequestOpenBranchMenu(data) { this._onDidRequestOpenBranchMenuEmitter.fire(data); }
  fireDidRequestSwitchSubComposerTab(data) { this._onDidRequestSwitchSubComposerTabEmitter.fire(data); }
  fireDidRequestSelectSubComposerTabByIndex(data) { this._onDidRequestSelectSubComposerTabByIndexEmitter.fire(data); }
  fireDidLoadComposer(data) { this._onDidLoadComposerEmitter.fire(data); }

  // === Chat load timing ===
  markChatLoadStart(chatId) {
    this._cleanupStaleTimings();
    this._pendingChatLoadTimings.set(chatId, performance.now());
  }

  markChatLoadComplete(chatId, chatType) {
    const startTime = this._pendingChatLoadTimings.get(chatId);
    if (startTime === undefined) return;

    const duration = performance.now() - startTime;
    this._pendingChatLoadTimings.delete(chatId);

    this._metricsService.distribution({
      stat: "composer.time_to_chat_load_ms",
      value: duration,
      tags: { chat_type: chatType },
    });
  }

  _cleanupStaleTimings() {
    const now = performance.now();
    for (const [chatId, startTime] of this._pendingChatLoadTimings) {
      if (now - startTime > _self.MAX_PENDING_TIMING_AGE_MS) {
        this._pendingChatLoadTimings.delete(chatId);
      }
    }
  }
};

ComposerEventService = _self = __decorate(
  [
    __param(0, ZE),  // IMetricsService
    __param(1, ms),  // INotificationService
  ],
  ComposerEventService
);

Ki(IComposerEventService, ComposerEventService, 0, 1);
