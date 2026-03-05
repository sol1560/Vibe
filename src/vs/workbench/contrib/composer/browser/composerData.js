// Source: out-build/vs/workbench/contrib/composer/browser/composerData.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// Brand references: cursor- → claude-

Ie(), Ie(), Di(), Gk(), ov(), Ov(), Jg(), Hi(), Qr(), Xn(), Nc(), vI(), Mc(), H9(), Z1e(), Ejl();

// === Error class for composer stream errors ===
class ComposerStreamError extends Error {
  constructor(errorInfo) {
    super(errorInfo.actualErrorMessage);
    this.clientVisibleErrorMessage = errorInfo.clientVisibleErrorMessage;
    this.modelVisibleErrorMessage = errorInfo.modelVisibleErrorMessage;
    this.actualErrorMessage = errorInfo.actualErrorMessage;
    this.errorDetails = errorInfo.errorDetails;
  }
}

// === Data version constants ===
const COMPOSER_DATA_VERSION = 3;
const MAX_CONVERSATION_TURNS = 14;
const MAX_FOLLOW_UP_SUGGESTIONS = 3;

// === Status groups ===
const SETTLED_STATUSES = ["completed", "cancelled", "accepted", "rejected", "outdated"];
const TERMINAL_STATUSES = [...SETTLED_STATUSES, "applying"];

// === URI revival helper (restores serialized URIs in composer data) ===
const reviveComposerData = (data) => ({
  ...data,
  files: data.files.map((file) => ({ ...file, uri: je.revive(file.uri) })),
  nonExistentFiles: data.nonExistentFiles.map((file) => ({
    ...file,
    uri: je.revive(file.uri),
  })),
  newlyCreatedFolders: data.newlyCreatedFolders.map((folder) => ({
    ...folder,
    uri: je.revive(folder.uri),
  })),
  activeInlineDiffs: data.activeInlineDiffs.map((diff) => ({
    ...diff,
    uri: je.revive(diff.uri),
    codeBlockId: diff.codeBlockId ?? "",
  })),
  inlineDiffNewlyCreatedResources: {
    ...data.inlineDiffNewlyCreatedResources,
    files: data.inlineDiffNewlyCreatedResources.files.map((file) => ({
      ...file,
      uri: je.revive(file.uri),
    })),
    folders: data.inlineDiffNewlyCreatedResources.folders.map((folder) => ({
      ...folder,
      uri: je.revive(folder.uri),
    })),
  },
});

// === Empty file state factory ===
const createEmptyFileState = () => ({
  files: [],
  nonExistentFiles: [],
  newlyCreatedFolders: [],
  activeInlineDiffs: [],
  inlineDiffNewlyCreatedResources: { files: [], folders: [] },
});

// === Default conversation turn factory ===
const createDefaultConversationTurn = () => ({
  _v: COMPOSER_DATA_VERSION,
  type: ul.HUMAN,
  approximateLintErrors: [],
  lints: [],
  codebaseContextChunks: [],
  commits: [],
  pullRequests: [],
  attachedCodeChunks: [],
  assistantSuggestedDiffs: [],
  gitDiffs: [],
  interpreterResults: [],
  images: [],
  attachedFolders: [],
  attachedFoldersNew: [],
  bubbleId: Gr(),
  userResponsesToSuggestedCodeBlocks: [],
  suggestedCodeBlocks: [],
  diffsForCompressingFiles: [],
  relevantFiles: [],
  toolResults: [],
  notepads: [],
  capabilities: [],
  multiFileLinterErrors: [],
  diffHistories: [],
  recentLocationsHistory: [],
  recentlyViewedFiles: [],
  isAgentic: false,
  fileDiffTrajectories: [],
  existedSubsequentTerminalCommand: false,
  existedPreviousTerminalCommand: false,
  docsReferences: [],
  webReferences: [],
  aiWebSearchResults: [],
  requestId: "",
  attachedFoldersListDirResults: [],
  humanChanges: [],
  attachedHumanChanges: false,
  summarizedComposers: [],
  cursorRules: [],      // brand note: "cursorRules" is kept for protocol compatibility
  cursorCommands: [],    // brand note: same
  cursorCommandsExplicitlySet: false,
  pastChats: [],
  pastChatsExplicitlySet: false,
  contextPieces: [],
  editTrailContexts: [],
  allThinkingBlocks: [],
  diffsSinceLastApply: [],
  deletedFiles: [],
  supportedTools: [],
  tokenCount: { inputTokens: 0, outputTokens: 0 },
  attachedFileCodeChunksMetadataOnly: [],
  consoleLogs: [],
  uiElementPicked: [],
  isRefunded: false,
  knowledgeItems: [],
  documentationSelections: [],
  externalLinks: [],
  projectLayouts: [],
  unifiedMode: q9e.AGENT,
  capabilityContexts: [],
  todos: [],
  createdAt: new Date().toISOString(),
  mcpDescriptors: [],
  workspaceUris: [],
  conversationState: new bk(),
});

// === Unique ID generator ===
const generateComposerId = JS();

// === Capability labels ===
const CAPABILITY_LABELS = {
  [zY.ADD_FILE_TO_CONTEXT]: "Add file to context",
  [zY.ITERATE]: "Iterate and improve",
  [zY.UNSPECIFIED]: "Unspecified",
  [zY.REMOVE_FILE_FROM_CONTEXT]: "Remove file from context",
  [zY.SEMANTIC_SEARCH_CODEBASE]: "Semantic search codebase",
};

// === Capability icons ===
const CAPABILITY_ICONS = {
  [zY.ADD_FILE_TO_CONTEXT]: Be.fileAdd,
  [zY.ITERATE]: Be.sync,
  [zY.UNSPECIFIED]: Be.question,
  [zY.REMOVE_FILE_FROM_CONTEXT]: Be.trash,
  [zY.SEMANTIC_SEARCH_CODEBASE]: Be.search,
};

// === Enabled composer capabilities ===
const ENABLED_CAPABILITIES = [
  ko.DIFF_REVIEW,
  ko.AUTO_CONTEXT,
  ko.TOOL_FORMER,
  ko.CURSOR_RULES,
  ko.SUMMARIZATION,
  ko.USAGE_DATA,
  ko.CHIMES,
  ko.NOTIFICATIONS,
  ko.QUEUING,
  ko.MEMORIES,
  ko.ONLINE_METRICS,
  ko.AI_CODE_TRACKING,
  ko.BACKGROUND_COMPOSER,
  ko.THINKING,
  ko.CONTEXT_WINDOW,
  ko.SUB_COMPOSER,
];

// === Multi-diff editor URI ===
const MULTI_DIFF_EDITOR_URI = je.parse("multi-diff-editor:composer-all-active-changes");

// === Tools requiring human review ===
const TOOLS_REQUIRING_REVIEW = new Set([
  on.RUN_TERMINAL_COMMAND_V2,
  on.MCP,
  on.EDIT_FILE_V2,
  on.ASK_QUESTION,
  on.WEB_FETCH,
  on.WEB_SEARCH,
  on.MCP_AUTH,
]);

// === Tool review button labels ===
const TOOL_REVIEW_LABELS = {
  [on.RUN_TERMINAL_COMMAND_V2]: {
    accept: "Run",
    reject: "Stop",
    waitText: "Waiting for approval",
  },
  [on.EDIT_FILE]: {
    accept: "Keep",
    reject: "Undo",
    waitText: "",
  },
  [on.BACKGROUND_COMPOSER_FOLLOWUP]: {
    accept: "Send to background composer",
    reject: "Skip",
    waitText: "Waiting for approval",
  },
  [on.WEB_SEARCH]: {
    accept: "Continue",
    reject: "Cancel",
    waitText: "Waiting for approval",
  },
  [on.SWITCH_MODE]: {
    accept: "Switch",
    reject: "Skip",
    waitText: "Waiting for approval",
  },
  [on.MCP_AUTH]: {
    accept: "Authenticate",
    reject: "Skip",
    waitText: "Waiting for approval",
  },
};

// === Tool groups for UI ===
const TOOLS_WITH_INLINE_REVIEW = [on.EDIT_FILE];
const TOOLS_WITH_DIFF_PREVIEW = [on.EDIT_FILE];
const TOOLS_WITH_AUTO_APPROVE = [
  on.WEB_SEARCH,
  on.EDIT_FILE,
  on.EDIT_FILE_V2,
  on.BACKGROUND_COMPOSER_FOLLOWUP,
  on.SWITCH_MODE,
];

// === Tool categories for settings UI ===
const TOOL_CATEGORIES = [
  {
    id: "search",
    title: "Search",
    description: "Codebase, web",
    tools: [
      { tool: on.READ_SEMSEARCH_FILES, label: "Codebase" },
      { tool: on.WEB_SEARCH, label: "Web" },
      { tool: on.RIPGREP_RAW_SEARCH, label: "Grep Search" },
      { tool: on.FILE_SEARCH, label: "Search files" },
    ],
  },
  {
    id: "edit",
    title: "Edit",
    description: "Files in workspace",
    tools: [
      { tool: on.EDIT_FILE, label: "Edit & Reapply" },
      { tool: on.DELETE_FILE, label: "Delete file" },
    ],
  },
  {
    id: "run",
    title: "Run",
    description: "Commands",
    tools: [{ tool: on.RUN_TERMINAL_COMMAND_V2, label: "Terminal" }],
  },
];

// === Tool dependencies (implied tools) ===
const TOOL_DEPENDENCIES = {
  [on.EDIT_FILE]: [on.REAPPLY],
};
