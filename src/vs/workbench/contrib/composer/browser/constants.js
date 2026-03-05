// Source: out-build/vs/workbench/contrib/composer/browser/constants.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// Original minified names restored to meaningful identifiers
// Brand references: cursor- → claude-

Od(), Ov(), Jg(), Hi(), bl();

// === Chat defaults ===
const NEW_CHAT_LABEL = "New Chat";
const DEFAULT_FONT_SIZE = 10;

// === Code block apply status ===
const CODE_BLOCK_APPLY_STATUS = {
  none: "None",
  applying: "Applying",
  generating: "Generating",
  apply_pending: "Waiting to be applied",
  cancelled: "Cancelled",
  completed: "Completed",
  accepted: "Accepted",
  rejected: "Rejected",
  aborted: "Aborted",
  outdated: "Outdated",
};

// === Limits ===
const MAX_INPUT_LENGTH = 1e5;
const MAX_RETRY_COUNT = 3;
const DEFAULT_RETRY_COUNT = MAX_RETRY_COUNT;

// === UI dimensions ===
const DEFAULT_LINE_HEIGHT = 10;
const COMPOSER_HEADER_HEIGHT = 24;
const COMPOSER_TAB_HEIGHT = 9;
const COMPOSER_FOOTER_HEIGHT = 13;
const COMPOSER_PADDING = 4;
const TRANSPARENT_BG = "transparent";
const TRANSPARENT_FG = "transparent";
const CODE_BLOCK_BORDER_RADIUS = 10;
const CODE_BLOCK_PADDING = 6;

// === Panel dimensions ===
const COMPOSER_MIN_WIDTH = 400;
const COMPOSER_MIN_HEIGHT = 400;
const COMPOSER_COMPACT_MIN_WIDTH = 320;
const COMPOSER_COMPACT_MIN_HEIGHT = 320;
const COMPOSER_MAX_WIDTH = 800;
const COMPOSER_MAX_HEIGHT = 800;
const COMPOSER_SCROLLBAR_SIZE = 20;
const COMPOSER_SIDEBAR_WIDTH = 320;

// === Mode config ===
const MODE_ICON_SIZE = 9;
const MODE_BUTTON_OPACITY = 0.9;
const MODE_BUTTON_GAP = 8;
const COMPOSER_CONTENT_MAX_WIDTH = 740;
const CONTEXT_FILE_LIMIT = 4;
const CONTEXT_POPUP_WIDTH = 450;
const CONTEXT_POPUP_MAX_ITEMS = 5;

// === Command labels ===
const SHOW_CHAT_HISTORY_LABEL = "Show Chat History";
const SHOW_CHAT_HISTORY_EDITOR_LABEL = "Show Chat History (Editor)";

// === Timing ===
const HISTORY_EXPIRY_MS = 1e3 * 60 * 60 * 2; // 2 hours

// === Command IDs ===
const CMD_START_COMPOSER_PROMPT_2 = "composer.startComposerPrompt2";
const CMD_START_COMPOSER_PROMPT = "composer.startComposerPrompt";
const CMD_START_COMPOSER_FROM_SELECTION = "composer.startComposerPromptFromSelection";
const CMD_ADD_FILES_TO_COMPOSER = "composer.addfilestocomposer";
const CMD_ADD_FILES_TO_NEW_COMPOSER = "composer.addfilestonnewcomposer";
const CMD_SHOW_COMPOSER_HISTORY = "composer.showComposerHistory";
const CMD_SHOW_BACKGROUND_AGENT_HISTORY = "composer.showBackgroundAgentHistory";
const CMD_SHOW_COMPOSER_HISTORY_EDITOR = "composer.showComposerHistoryEditor";
const CMD_OPEN_COMPOSER_SETTINGS = MCc; // reference to external constant
const CMD_SELECT_PREVIOUS_COMPOSER = "composer.selectPreviousComposer";
const CMD_SELECT_NEXT_COMPOSER = "composer.selectNextComposer";
const CMD_SELECT_PREVIOUS_SUB_TAB = "composer.selectPreviousSubComposerTab";
const CMD_SELECT_NEXT_SUB_TAB = "composer.selectNextSubComposerTab";
const CMD_SELECT_SUB_TAB_1 = "composer.selectSubComposerTab1";
const CMD_SELECT_SUB_TAB_2 = "composer.selectSubComposerTab2";
const CMD_SELECT_SUB_TAB_3 = "composer.selectSubComposerTab3";
const CMD_SELECT_SUB_TAB_4 = "composer.selectSubComposerTab4";
const CMD_SELECT_SUB_TAB_5 = "composer.selectSubComposerTab5";
const CMD_SELECT_SUB_TAB_6 = "composer.selectSubComposerTab6";
const CMD_SELECT_SUB_TAB_7 = "composer.selectSubComposerTab7";
const CMD_SELECT_SUB_TAB_8 = "composer.selectSubComposerTab8";
const CMD_SELECT_SUB_TAB_LAST = "composer.selectSubComposerTabLast";
const CMD_ADD_SYMBOLS_TO_NEW_COMPOSER = "composer.addsymbolstonewcomposer";
const CMD_ADD_SYMBOLS_TO_COMPOSER = "composer.addsymbolstocomposer";
const CMD_NEW_FOLLOWUP_ACTION = "aichat.newfollowupaction";
const CMD_FIX_ERROR_MESSAGE = "composer.fixerrormessage";
const CMD_OPEN_AS_PANE = "composer.openAsPane";
const CMD_OPEN_AS_BAR = "composer.openAsBar";
const CMD_OPEN_CHAT_AS_EDITOR = "composer.openChatAsEditor";
const CMD_OPEN_IN_WEB_FOR_BACKGROUND = "composer.openInWebForBackgroundComposer";
const CMD_OPEN_VM_FOR_BACKGROUND = "composer.openVMForBackgroundComposer";
const CMD_EXPORT_CHAT_AS_MD = "composer.exportChatAsMd";
const CMD_SHARE_CHAT = "composer.shareChat";
const CMD_FORK_SHARED_CHAT = "composer.forkSharedChat";
const CMD_COPY_REQUEST_ID = "composer.copyRequestId";
const CMD_COPY_REQUEST_ID_FROM_PANE = "composer.copyRequestIdFromPane";
const CMD_COPY_REQUEST_ID_FROM_EDITOR = "composer.copyRequestIdFromEditor";
const CMD_REPORT_FEEDBACK = "composer.reportFeedback";
const CMD_OPEN_SETTINGS = "chat.openCursorSettings"; // TODO: replace with claude settings
const CMD_CANCEL_CHAT = "composer.cancelChat";
const CMD_RESUME_CURRENT_CHAT = "composer.resumeCurrentChat";
const CMD_NEW_AGENT_CHAT = "composer.newAgentChat";
const CMD_UPDATE_TITLE = "composer.updateTitle";
const CMD_UPDATE_STATUS = "composer.updateStatus";
const CMD_CYCLE_MODE = "composer.cycleMode";
const CMD_TOGGLE_CHAT_AS_EDITOR = "composer.toggleChatAsEditor";
const CMD_CLOSE_COMPOSER_TAB = "composer.closeComposerTab";
const CMD_CLOSE_OTHER_COMPOSER_TABS = "composer.closeOtherComposerTabs";
const CMD_PREVIOUS_CHAT_TAB = "composer.previousChatTab";
const CMD_NEXT_CHAT_TAB = "composer.nextChatTab";
const CMD_OPEN_MODEL_TOGGLE = "composer.openModelToggle";
const CMD_CYCLE_MODEL = "composer.cycleModel";
const CMD_CYCLE_MODEL_PARAMETER = "composer.cycleModelParameter";
const CMD_OPEN_MODE_MENU = "composer.openModeMenu";
const CMD_OPEN_ADD_CONTEXT_MENU = "composer.openAddContextMenu";
const CMD_OPEN_COMPOSER = "composer.openComposer";
const CMD_OPEN_COMPOSER_FROM_NOTIFICATION = "composer.openComposerFromNotification";
const CMD_ACCEPT_PENDING_FROM_NOTIFICATION = "composer.acceptPendingFromNotification";
const CMD_REJECT_PENDING_FROM_NOTIFICATION = "composer.rejectPendingFromNotification";
const CMD_GET_COMPOSER_HANDLE_BY_ID = "composer.getComposerHandleById";
const CMD_CANCEL_COMPOSER_STEP = "composer.cancelComposerStep";
const CMD_ACCEPT_COMPOSER_STEP = "composer.acceptComposerStep";
const CMD_CANCEL_STEP_INPUT_FOCUSED = "composer.cancelComposerStepInputFocused";
const CMD_CANCEL_TERMINAL_TOOL_CALL = "composer.cancelTerminalToolCall";
const CMD_TOGGLE_VOICE_DICTATION = "composer.toggleVoiceDictation";
const CMD_RESET_MODE = "composer.resetMode";
const CMD_CREATE_NEW_BACKGROUND_AGENT = "composer.createNewBackgroundAgent";
const CMD_TRIGGER_CREATE_WORKTREE_BUTTON = "composer.triggerCreateWorktreeButton";
const CMD_CLEAR_COMPOSER_TABS = "composer.clearComposerTabs";
const CMD_CREATE_NEW_COMPOSER_TAB = "composer.createNewComposerTab";
const CMD_BG_CREATE_NEW_COMPOSER_TAB = "workbench.action.backgroundComposer.createNewComposerTab";
const CMD_DUPLICATE_CHAT = "composer.duplicateChat";
const CMD_SEND_TO_AGENT = "composer.sendToAgent";
const CMD_HANDLE_BUGBOT_DEEPLINK = "composer.handleBugBotDeeplink";
const CMD_HANDLE_BUGBOT_MULTIPLE_DEEPLINKS = "composer.handleBugBotMultipleDeeplinks";
const CMD_FOCUS_COMPOSER = "composer.focusComposer";
const CMD_HIDE_WORKTREE_SETUP_WARNING = "composer.hideWorktreeSetupWarning";
const CMD_OPEN_TERMINAL_IN_WORKTREE = "composer.openTerminalInWorktree";
const CMD_FIND_FOCUS = "composer.find.focus";
const CMD_FIND_HIDE = "composer.find.hide";
const CMD_FIND_NEXT = "composer.find.next";
const CMD_FIND_PREVIOUS = "composer.find.previous";
const CMD_GET_ORDERED_SELECTED_IDS = "composer.getOrderedSelectedComposerIds";
const CMD_CHAT_OPEN = "workbench.action.chat.open";
const CMD_TEST_OPEN_WITH_PROMPT = "workbench.action.chat.testOpenWithPrompt";
const CMD_TEST_NOTIFICATION = "composer.testNotification";

// === Panel identifiers ===
const CHAT_VIEW_LABEL = "Chat";
const CHAT_VIEW_ICON = Be.files;
const COMPOSER_CHAT_VIEW_PANE_ID = "workbench.panel.composerChatViewPane";

// === Agent capabilities ===
const AGENT_CAPABILITIES = [zY.ITERATE];

// === Read-only tool set (safe tools that don't modify state) ===
const READ_ONLY_TOOLS = new Set([
  on.WEB_SEARCH,
  on.WEB_FETCH,
  on.LIST_DIR,
  on.LIST_DIR_V2,
  on.RIPGREP_SEARCH,
  on.RIPGREP_RAW_SEARCH,
  on.SEMANTIC_SEARCH_FULL,
  on.FILE_SEARCH,
  on.GLOB_FILE_SEARCH,
  on.READ_SEMSEARCH_FILES,
  on.SEARCH_SYMBOLS,
  on.GO_TO_DEFINITION,
  on.READ_FILE,
  on.READ_FILE_V2,
  on.TODO_READ,
  on.FETCH_RULES,
  on.READ_LINTS,
  on.AWAIT,
]);

// === Token limits ===
const TOKEN_LIMIT_AGENT = 2090;
const TOKEN_LIMIT_CHAT = 2087;
const TOKEN_LIMIT_PLAN = 3114;
const TOKEN_LIMIT_PLAN_ALT = 3114;
const TOKEN_LIMIT_SPEC = 3106;
const TOKEN_LIMIT_DEBUG = 3075;

// === Streaming config ===
const STREAM_CHUNK_DELAY_MS = 5;
const STREAM_RENDER_BATCH_SIZE = 12;
const STREAM_MAX_BUFFER_SIZE = 100;
const STREAM_FLUSH_INTERVAL_MS = 200;
const STREAM_SCROLL_THRESHOLD = 20;
const STREAM_ANIMATION_DURATION_MS = 240;
const STREAM_HEADER_HEIGHT = 72;

// === Tab config ===
const MAX_VISIBLE_TABS = 6;
const MIN_TAB_WIDTH_RATIO = 1;
const TAB_CLOSE_ANIMATION_MS = 1e3;
const TAB_SCROLL_SPEED = 30;

// === Mode menu icons (5x4 grid of icons for mode quick select) ===
const MODE_MENU_ICON_GRID = [
  [Be.infinity, Be.editTwo, Be.eraser, Be.swirlSparkle, Be.folder],
  [Be.lightning, Be.inboxTwo, Be.brain, Be.magnifyingGlass, Be.microphone],
  [Be.running, Be.fileAddTwo, Be.stopThree, Be.chat, Be.fileTwo],
  [Be.list, Be.calendarTwo, Be.hammer, Be.paperWords, Be.mortarboard],
];

// === Composer mode colors ===
const COMPOSER_MODE_COLORS = {
  agent: {
    background: "transparent",
    text: "var(--vscode-input-foreground)",
    iconButton: "var(--vscode-button-background)",
  },
  chat: {
    background: "var(--composer-mode-chat-background)",
    text: "var(--composer-mode-chat-text)",
    iconButton: "var(--composer-mode-chat-text)",
  },
  background: {
    background: "var(--composer-mode-background-background)",
    text: "var(--composer-mode-background-text)",
    iconButton: "var(--composer-mode-background-text)",
  },
  plan: {
    background: "var(--composer-mode-plan-background)",
    text: "var(--composer-mode-plan-text)",
    iconButton: "var(--composer-mode-plan-icon)",
    border: "var(--composer-mode-plan-border)",
  },
  triage: {
    background: "var(--composer-mode-triage-background, transparent)",
    text: "var(--composer-mode-triage-text, var(--vscode-input-foreground))",
    iconButton:
      "var(--composer-mode-triage-icon, var(--vscode-button-background))",
    border: "var(--composer-mode-triage-border, var(--vscode-focusBorder))",
  },
  spec: {
    background: "var(--composer-mode-spec-background)",
    text: "var(--composer-mode-spec-text)",
    iconButton: "var(--composer-mode-spec-icon)",
    border: "var(--composer-mode-spec-border)",
  },
  debug: {
    background: "var(--composer-mode-debug-background)",
    text: "var(--composer-mode-debug-text)",
    iconButton: "var(--composer-mode-debug-icon)",
    border: "var(--composer-mode-debug-border)",
  },
};

// === Auth storage keys ===
const AUTH_ONBOARDING_DATE_KEY = "claudeAuth/onboardingDate"; // brand: cursor→claude
const AUTH_CHANGE_MANAGEMENT_KEY = "claudeAuth/changeManagementCodeSnippets"; // brand: cursor→claude
const AUTH_WORKSPACE_OPENED_KEY = "claudeAuth/workspaceOpenedDate"; // brand: cursor→claude
const DISABLE_FEATURE_FLAG = false;

// === Conflict resolution commands ===
const CMD_RESOLVE_CONFLICT_IN_CMDK = "cmdK.resolveConflictInCmdK";
const CMD_RESOLVE_ALL_CONFLICTS_IN_CHAT = "composer.resolveAllConflictsInChat";

// === View menu ===
const CMD_SHOW_VIEW_MENU = "composer.showViewMenu";

// === Developer commands ===
const CMD_DEV_OPEN_AGENT_TRANSCRIPT = "developer.openAgentTranscript";
const CMD_DEV_SLOW_PROVIDER_TOGGLE = "developer.simulateSlowProviderToggle";

// === New chat command group ===
const NEW_CHAT_COMMANDS = [
  CMD_CREATE_NEW_COMPOSER_TAB,
  "composer.createNewWithPrevContext",
  "workbench.action.backgroundComposer.createNewComposerWithPrevContext",
  CMD_BG_CREATE_NEW_COMPOSER_TAB,
  CMD_SHOW_BACKGROUND_AGENT_HISTORY,
  "workbench.action.backgroundComposer.showBackgroundAgentHistory",
];

// === Worktree setup messages ===
const WORKTREE_SETUP_MESSAGES = {
  legacy:
    "[Click here](command:composer.configureWorktreeSetup) to configure a worktree setup script. [Learn more](https://claude.ai/docs/configuration/worktrees)", // brand: cursor.com→claude.ai
  v20240901: `[Click here](command:composer.configureWorktreeSetup) to configure a worktree setup script. [Don't show again](command:${CMD_HIDE_WORKTREE_SETUP_WARNING}).`,
  v20241031: `[Click here](command:composer.configureWorktreeSetup) to configure a worktree setup script. This will be executed on every new worktree and can be used to configure dependencies or environment variables.

[Don't show again](command:${CMD_HIDE_WORKTREE_SETUP_WARNING}).`,
};
const WORKTREE_SETUP_CURRENT_VERSION = "v20241031";
const WORKTREE_SETUP_CURRENT_MESSAGE =
  WORKTREE_SETUP_MESSAGES[WORKTREE_SETUP_CURRENT_VERSION];
const WORKTREE_SETUP_ALL_MESSAGES = new Set(
  Object.values(WORKTREE_SETUP_MESSAGES)
);

// === Layout config ===
const COMPOSER_GUTTER_WIDTH = 6;
const COMPOSER_TOOLBAR_HEIGHT = 32;
const COMPOSER_STATUS_BAR_HEIGHT = 6;
const DEFAULT_COMPOSER_LOCATION = "pane";
