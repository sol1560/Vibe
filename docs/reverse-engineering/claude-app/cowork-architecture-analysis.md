# Claude Desktop Cowork 架构逆向分析

> 来源: `extracted/claude-app/.vite/build/index.js` (主进程) + `mainView.js` (渲染进程 preload)
> 分析者: cowork-dev Agent
> 日期: 2026-03-04

---

## 1. 核心架构概览

Claude Desktop 的 Cowork 不是传统的「文件编辑器」——它是基于 **VM 隔离** 的 Agent 执行环境。实际 UI 从 claude.ai 远程加载，本地 Electron 壳通过 IPC 提供三大本地服务。

```
┌──────────────────────────────────────────────────┐
│             Claude Desktop (Electron)              │
│                                                    │
│  渲染进程 (mainView.js)                            │
│  ├── contextBridge 暴露 claude.internal.ui API      │
│  └── 通过 IPC 调用三大 Cowork 服务                  │
│                                                    │
│  主进程 (index.js, 4.5MB)                           │
│  ├── CoworkSpaces (空间/文件管理)                    │
│  ├── CoworkScheduledTasks (定时任务)                 │
│  ├── CoworkMemory (全局记忆)                        │
│  ├── LocalAgentModeSessions (Agent 会话)            │
│  └── VM 管理器 (Linux VM 隔离执行)                  │
│                                                    │
│  VM 层 (vmlinuz + vmdk)                             │
│  ├── Claude Code CLI 运行在 VM 内部                 │
│  ├── 挂载: /sessions/{sessionId}/mnt/.claude        │
│  └── MCP 服务器通过 VM 代理                         │
└──────────────────────────────────────────────────┘
```

## 2. 三大 Cowork IPC 服务接口

### 2.1 CoworkSpaces（空间管理）

变量名: `Yt` (渲染进程), `mJ` (主进程 handler), `Ei` (实例: `new dLe`)

```typescript
interface CoworkSpaces {
  // 空间 CRUD
  getAllSpaces(): Promise<Space[]>;
  getSpace(spaceId: string): Promise<Space | null>;
  createSpace(params: CreateSpaceParams): Promise<Space | null>;
  updateSpace(spaceId: string, params: UpdateSpaceParams): Promise<Space | null>;
  deleteSpace(spaceId: string): Promise<boolean>;

  // 文件夹管理
  addFolderToSpace(spaceId: string, folderPath: string): Promise<void>;
  removeFolderFromSpace(spaceId: string, folderPath: string): Promise<void>;

  // 项目管理
  addProjectToSpace(spaceId: string, projectUuid: string): Promise<void>;
  removeProjectFromSpace(spaceId: string, projectUuid: string): Promise<void>;

  // 文件操作
  listFolderContents(spaceId: string, folderPath: string): Promise<FileEntry[]>;
  readFileContents(spaceId: string, filePath: string): Promise<string>;
  openFile(spaceId: string, filePath: string): Promise<void>;
  createSpaceFolder(spaceId: string, folderName: string): Promise<void>;
  copyFilesToSpaceFolder(spaceId: string, filePaths: string[]): Promise<void>;

  // 事件
  onOnSpaceEvent(callback: (event: SpaceEvent) => void): () => void;
}
```

**实现类**: `SpacesManager` (变量名 `dLe`)，实例化为 `const Ei = new dLe`

### 2.2 CoworkScheduledTasks（定时任务）

变量名: `Ht` (渲染进程), `dJ` (主进程 handler), `pd` (实例: `new hLe`)

```typescript
interface CoworkScheduledTasks {
  getAllScheduledTasks(): Promise<ScheduledTask[]>;
  getScheduledTaskFileContent(scheduledTaskId: string): Promise<string | null>;
  updateScheduledTaskFileContent(scheduledTaskId: string, content: string): Promise<boolean>;
  updateScheduledTaskStatus(scheduledTaskId: string, status: string): Promise<boolean>;
  createScheduledTask(params: CreateScheduledTaskParams): Promise<ScheduledTask | null>;
  updateScheduledTask(params: UpdateScheduledTaskParams): Promise<ScheduledTask | null>;
  removeApprovedPermission(scheduledTaskId: string, toolName: string, ruleContent?: string): Promise<boolean>;

  // 事件
  onOnScheduledTaskEvent(callback: (event: ScheduledTaskEvent) => void): () => void;
}
```

**ScheduledTask 数据结构** (从 Zod schema 还原):
```typescript
interface ScheduledTask {
  id: string;
  cronExpression?: string;
  enabled: boolean;
  filePath: string;
  model?: string;
  createdAt: number;
  lastRunAt?: string;
  userSelectedFolders?: string[];
  userSelectedFiles?: string[];
  userSelectedProjectUuids?: string[];
  approvedPermissions?: Array<{
    toolName: string;
    ruleContent?: string;
  }>;
  spaceId?: string;
}
```

**实现类**: `ScheduledTasksManager` (变量名 `hLe`)，实例化为 `const pd = new hLe`

### 2.3 CoworkMemory（全局记忆）

变量名: `Qt` (渲染进程), `gje` (主进程 handler)

```typescript
interface CoworkMemory {
  readGlobalMemory(): Promise<string | null>;
  writeGlobalMemory(content: string): Promise<boolean>;
}
```

这是最简单的服务——Cowork 全局记忆只是一个字符串读写接口。

## 3. LocalAgentModeSessions（Agent 会话管理）

这是最核心的服务，管理 Cowork 的 Agent 执行会话。

```typescript
interface LocalAgentModeSessions {
  start(info: SessionStartInfo): Promise<SessionInfo>;
  sendMessage(
    sessionId: string,
    message: string,
    images?: ImageData[],
    userSelectedFiles?: string[],
    messageUuid?: string
  ): Promise<void>;
  setModel(sessionId: string, model: string): Promise<void>;
  stop(sessionId: string): Promise<void>;
  archive(sessionId: string, options?: ArchiveOptions): Promise<void>;
  updateSession(sessionId: string, ...): Promise<void>;

  // 事件
  onOnEvent(callback: (event: SessionEvent) => void): () => void;
  onOnToolPermissionRequest(callback: (request: ToolPermissionRequest) => void): () => void;
  onOnCoworkFromMain(callback: (request: CoworkFromMainRequest) => void): () => void;
  onOnRemoteSessionStart(callback: (request: RemoteSessionStartRequest) => void): () => void;
}
```

### 关键发现 — Agent 执行参数

从 `index.js` 中提取的实际 Agent 配置:

```javascript
{
  cwd: `/sessions/${sessionId}`,
  model: session.model || "default",
  effort: getEffort(),
  pathToClaudeCodeExecutable: "/usr/local/bin/claude",
  allowedTools: [
    "Task", "Bash", "Glob", "Grep", "Read", "Edit", "Write",
    "NotebookEdit", "WebFetch", "TodoWrite", "WebSearch", "Skill",
    "REPL", "JavaScript",
    "mcp__mcp-registry__search_mcp_registry",
    "mcp__mcp-registry__suggest_connectors",
    "mcp__plugins__search_plugins",
    "mcp__plugins__suggest_plugin_install",
    "mcp__scheduled-tasks__list_scheduled_tasks",
    "mcp__Claude_in_Chrome",
    "mcp__cowork__present_files",
    "mcp__spaces__reply_to_space"
  ]
}
```

## 4. VM 隔离架构

### 4.1 VM 配置

- **调试模式**: `process.env.COWORK_VM_DEBUG === "1"`
- **日志文件**: `cowork_vm_node.log`, `coworkd.log`, `ssh.log`
- **Windows named pipe**: `\\.\pipe\cowork-vm-service`
- **挂载路径**: `/sessions/{sessionId}/mnt/.claude`
- **插件路径**: `mnt/.claude/cowork_plugins/`
- **网络模式**: 通过 `coworkNetworkMode` 设置管理 (值: "auto")

### 4.2 文件系统映射

```javascript
// 每个会话有独立的文件系统挂载
function getSessionPath(sessionId, subpath) {
  return path.join(app.getPath("userData"), "sessions", sessionId, subpath);
}

function getPluginsPath(sessionId, subpath) {
  return path.join(getSessionPath(sessionId, subpath), "cowork_plugins");
}

function getSettingsPath(sessionId, subpath) {
  return path.join(getSessionPath(sessionId, subpath), "cowork_settings.json");
}
```

### 4.3 VM 挂载配置

```javascript
// VM 内的文件挂载
{
  [containerPath(".claude")]: { path: hostClaudeDir, mode: "rw" },
  [containerPath(".claude/cowork_plugins")]: { path: pluginsDir, mode: "rwd" }
}

// 环境变量
{
  CLAUDE_CONFIG_DIR: configDir,
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
  CLAUDE_CODE_HOST_PLATFORM: process.platform
}
```

## 5. MCP 集成

### 5.1 内建 MCP 工具

Cowork 注册了一个名为 `cowork` 的 MCP server:

```javascript
// 内建 Cowork MCP 服务器
{
  name: "cowork",
  version: "1.0.0",
  tools: [
    requestCoworkDirectory,  // 请求访问用户目录
    presentFiles,            // mcp__cowork__present_files
    replyToSpace             // mcp__spaces__reply_to_space
  ]
}
```

### 5.2 MCP 协调器

```javascript
class McpCoordinator {
  async setupServers(sessionId, config) {
    // session_type 为 "cowork"
    // 支持 local, remote, internal 三种 server 类型
  }

  async createMcpServer(sessionId, serverConfig, options) {
    // options.sessionType 默认为 "cowork"
  }

  async callRemoteTool(sessionId, serverName, toolName, args) { ... }
  async readRemoteResource(sessionId, serverName, uri) { ... }
  async listRemoteResources(sessionId, serverName) { ... }
  getLocalMcpServersInfo() { ... }
}
```

### 5.3 Remote MCP 调用

```javascript
// 远程 MCP 工具调用
const response = await electron.net.fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-mcp-client-name": "Cowork"
  },
  body: JSON.stringify({
    tool_name: toolName,
    arguments: args
  })
});
```

## 6. 配置项 (Feature Flags)

从默认配置 `w9` 和 Zod schema `ECe` 还原:

```typescript
interface CoworkSettings {
  coworkScheduledTasksEnabled: boolean;   // 默认 false
  coworkWebSearchEnabled: boolean;        // 默认 true
  secureVmFeaturesEnabled: boolean;       // 默认 true（VM 隔离）
  sidebarMode: "chat" | "code" | "task";  // 默认 "chat"
  bypassPermissionsModeEnabled: boolean;  // 默认 false
  localAgentModeTrustedFolders: string[]; // 默认 []
}

interface YukonSilverConfig {
  autoDownloadInBackground: boolean;
  autoStartOnUserIntent: boolean;
  memoryGB: number;
  mcpToolTimeoutMs?: number;
  defaultSubagentModel?: string;
  maxThinkingTokens?: number;
  useCoworkOauth?: boolean;
  effort?: string;
  memoryBalloon?: {
    enabled: boolean;
    overrides?: {
      maxGB?: number;
      baselineGB?: number;
      minGB?: number;
    };
  };
}
```

### Cowork 支持检测逻辑

```javascript
function evaluateYukonSilverSupport() {
  // 1. 检查基础平台支持
  // 2. 检查企业管理员是否禁用: secureVmFeaturesEnabled === false
  //    → "Cowork has been disabled by your organization administrator"
  // 3. 检查用户是否禁用
  //    → "You have disabled Cowork"
  // 4. 都通过 → "supported"
}
```

## 7. 文件拖放处理

```javascript
// 目录选择
function handleDirectorySelection(path) {
  dispatcher.dispatchOnCoworkFromMain({ selectedDirectories: [path] });
  mainWindow.show();
  mainWindow.focus();
}

// 文件拖放
function handleFileDrop(filePaths) {
  dispatcher.dispatchOnCoworkFromMain({ selectedFiles: filePaths });
  mainWindow.show();
  mainWindow.focus();
}
```

## 8. OTEL 遥测

```javascript
// Cowork 会话的遥测配置
{
  CLAUDE_CODE_ENABLE_TELEMETRY: "1",
  OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
  OTEL_EXPORTER_OTLP_PROTOCOL: protocol,
  OTEL_LOG_USER_PROMPTS: "1",
  OTEL_LOG_TOOL_DETAILS: "1",
  OTEL_LOGS_EXPORTER: "otlp",
  OTEL_LOGS_EXPORT_INTERVAL: "0",
  OTEL_RESOURCE_ATTRIBUTES: `service.name=cowork,service.version=${version},...`
}
```

## 9. 对 Claude Editor 的启示

### 关键发现
1. **Claude Desktop 的 Cowork 不包含文件编辑器 UI** — 它是纯 Agent 执行环境，UI 由 claude.ai 提供
2. **核心是 3 个 IPC 服务**: CoworkSpaces + CoworkScheduledTasks + CoworkMemory
3. **文件系统通过 VM 挂载隔离**，而非直接文件操作
4. **MCP 是核心通信层**，内建 `cowork` MCP server 提供文件访问能力
5. **Agent 在 VM 内运行 Claude Code CLI**，工具集包含标准 IDE 工具 + Cowork 专用 MCP 工具

### 对我们 IDE Cowork 的影响
- 我们的 Cowork 编辑器（Tiptap/Univer/Reveal.js/PDF.js）是 Claude Editor **独有的扩展**
- Claude Desktop 没有这些 — 它依赖 claude.ai 的 Web UI
- 但我们应该实现相同的 **3 大服务接口**（Spaces、ScheduledTasks、Memory）
- 以及 **MCP 内建工具**（present_files、reply_to_space、request_cowork_directory）
