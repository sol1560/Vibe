# Cursor AI 调用点完整分析

> 提取自 Cursor IDE (VS Code 1.105.1 fork, Electron 39.6.0)
> 分析 Agent: ai-hunter
> 日期: 2026-03-05

## 核心原则：只改后端，不改前端

**不动的（前端 UI 层）**：所有 AI 相关的前端界面 — Chat 面板、Composer UI、Inline Edit 界面、Agent Mode 界面、Tab 补全的 Ghost Text 显示、Diff 预览 UI、工具调用审批弹窗、模式选择器等。这些全部原样保留。

**要改的（后端调用层）**：API 端点 URL、gRPC 客户端调用、认证 token 注入、请求序列化、响应反序列化、遥测上报。把 Cursor 的 AI 后端（api2/3/4/5.cursor.sh 等）替换为 Claude Code CLI / API。

---

## 前端/后端边界图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         前端 UI 层 (不动)                           │
│                                                                     │
│  contrib/composer/browser/         — Composer 面板、消息渲染、输入框  │
│  contrib/agents/browser/           — Agent 图标、上下文菜单         │
│  contrib/aiBackgroundComposer/     — Background Agent UI            │
│  contrib/aiCpp/browser/            — Tab 补全 Ghost Text            │
│  contrib/aiDiff/browser/           — Streaming Diff 渲染            │
│  contrib/aiConfig/browser/         — AI 配置 UI                     │
│  contrib/aiSettings/browser/       — AI 设置面板                    │
│  contrib/inlineChat/browser/       — Cmd+K 内联聊天 Widget          │
│  editor/contrib/inlineCompletions/ — 补全渲染 (GhostTextView)       │
│  editor/contrib/inlineDiffs/       — Inline Diff Widget             │
│  editor/browser/services/inlineDiff* — Inline Diff 控制器           │
│                                                                     │
│  这些模块通过 DI 服务接口消费数据，不直接调用任何后端 API            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ DI 服务接口 (边界)
                            │ IAiService / IAgentProviderService /
                            │ IComposerChatService / ICmdKStateService /
                            │ IMcpProviderService 等
                            │
┌───────────────────────────┴─────────────────────────────────────────┐
│                         后端调用层 (要改)                           │
│                                                                     │
│  services/ai/browser/              — AI 服务核心 (35 个模块)        │
│    ├── aiService.js                — AI 服务总入口 ★★★              │
│    ├── aiClientService.js          — gRPC 客户端 ★★★                │
│    ├── backendClient.js            — 后端连接 (URL 在此) ★★★        │
│    ├── cursorCredsService.js       — 认证凭据 ★★★                   │
│    ├── connectRequestService.js    — Connect-RPC 请求 ★★★           │
│    ├── metricsService.js           — 遥测指标 (移除) ★              │
│    ├── aggregatingMetricsService.js — 聚合指标 (移除) ★             │
│    ├── clientNumericMetricsService.js — 数值指标 (移除) ★           │
│    ├── repositoryService.js        — 云端仓库 (移除) ★              │
│    ├── mcpProviderService.js       — MCP 管理 (保留,改后端)         │
│    ├── mcpService.js               — MCP 核心 (保留)                │
│    ├── diffingService.js           — 后端 Diff 计算 (保留)          │
│    ├── fastContextService.js       — 快速上下文 (保留)              │
│    ├── fastSemSearchService.js     — 语义搜索 (改为本地)            │
│    ├── gitContextService.js        — Git 上下文 (保留)              │
│    └── ...                                                          │
│                                                                     │
│  services/agent/browser/           — Agent 服务 (36 个模块)         │
│    ├── agentProviderService.js     — Agent 注册 ★★★                 │
│    ├── agentResponseAdapter.js     — 响应适配 ★★★                   │
│    ├── subagentComposerService.js  — 子 Agent 编排 ★★               │
│    ├── cloudAgentStorageService.js — 云存储 (移除) ★                │
│    ├── usageLimitPolicyStatus...   — 使用限制 (移除) ★              │
│    ├── toolCallHandlers/           — 工具执行器 (保留)              │
│    └── ...                                                          │
│                                                                     │
│  services/aiCmdK/browser/          — Cmd+K 后端 (2 个模块)          │
│  services/aiContext/browser/       — AI 上下文 (2 个模块)            │
│  services/aiErrors/browser/        — AI 错误处理 (2 个模块)          │
│  services/aiSettings/browser/      — AI 设置后端 (2 个模块)          │
│  services/composer/browser/        — Composer 项目服务 (1 个模块)    │
│  services/inlineDiffsV2/           — InlineDiff V2 后端 (5 个模块)   │
│                                                                     │
│  proto/aiserver/v1/                — Protobuf 定义 (30+ 个模块)     │
│  proto/agent/v1/                   — Agent Protobuf (40+ 个模块)    │
│                                                                     │
│  external/sentry/                  — Sentry 错误追踪 (全部移除)     │
│  platform/tracing/common/          — 追踪系统 (全部移除)            │
│                                                                     │
│  extensions/cursor-agent/          — Agent Provider ★★★              │
│  extensions/cursor-agent-exec/     — 工具执行器 (大部分保留)         │
│  extensions/cursor-always-local/   — 文件同步 + CPP (改后端)         │
│  extensions/cursor-mcp/            — MCP 管理 (改后端)               │
│  extensions/cursor-retrieval/      — 代码检索 (改后端)               │
│  extensions/cursor-commits/        — AI 提交 (改后端)               │
│                                                                     │
│  product.json                      — 端点 URL + Statsig Key         │
│  out/main.js                       — Sentry DSN + 更新 URL          │
└─────────────────────────────────────────────────────────────────────┘
```

### 关键后端服务接口（DI 边界）

这些是前端 UI 调用的接口。接口定义保持不变，只替换实现：

| 接口 | DI ID | 前端调用者 | 后端实现 |
|------|-------|-----------|----------|
| `IAiService` | `"aiService"` | Composer, Cmd+K, Agent | → 替换 gRPC 为 Claude Code CLI |
| `IAgentProviderService` | `"agentProviderService"` | Composer Agent 模式 | → 替换为直接 Claude Code |
| `IComposerChatService` | `"composerChatService"` | Composer Chat 面板 | → 接口保留,后端改 |
| `ICmdKStateService` | `"cmdKStateService"` | Inline Edit Widget | → 替换 gRPC 为 CLI |
| `IMcpProviderService` | `"mcpProviderService"` | MCP 工具面板 | → 本地 MCP 管理 |
| `IAiErrorService` | `"aiErrorService"` | 错误提示 UI | → 简化实现 |
| `IAiContextSessionService` | `"aiContextSession"` | 上下文面板 | → 保留本地逻辑 |

---

## 概述

### AI 调用分布统计

| 类别 | 数量 | 说明 |
|------|------|------|
| AI 后端域名 | **12 个** | cursor.sh 系列 + CDN |
| aiserver.v1 gRPC 服务 | **57 个** | 覆盖 AI/认证/遥测/计费 |
| agent.v1 gRPC 服务 | **6 个** | 本地 Agent 通信 |
| Protobuf 类型定义 | **2804 个** | aiserver.v1.* 命名空间 |
| 支持的 AI 模型 | **35+** | GPT/Claude/Gemini/DeepSeek/o-series |
| 自定义 HTTP 请求头 | **16 个** | x-cursor-* 系列 |
| Cursor-specific 配置项 | **30+** | cursor.* settings |
| 关键源码文件 | **10 个** | 核心 bundle + 扩展 |

### 涉及的关键文件

| 文件 | 大小 | 角色 |
|------|------|------|
| `out/vs/workbench/workbench.desktop.main.js` | ~50MB | 主 workbench bundle（绝大部分 AI 调用） |
| `out/main.js` | ~5MB | Electron 主进程 |
| `out/vs/code/electron-utility/sharedProcess/sharedProcessMain.js` | ~3MB | 共享进程 |
| `extensions/cursor-agent/dist/main.js` | ~2MB | 前台 Agent Provider |
| `extensions/cursor-agent-exec/dist/main.js` | ~1MB | Agent 工具执行器 |
| `extensions/cursor-always-local/dist/main.js` | ~1MB | 本地文件同步 + CPP |
| `extensions/cursor-mcp/dist/main.js` | ~500KB | MCP Server/Lease 管理 |
| `extensions/cursor-retrieval/dist/main.js` | ~500KB | 代码索引 + 检索 |
| `extensions/cursor-commits/dist/main.js` | ~300KB | AI 提交信息 |
| `product.json` | ~20KB | 内置配置（Statsig Key, 端点 URL） |

---

## 1. AI 后端端点

### 1.1 主要 API 端点

| 端点 | 用途 | 协议 | 替换建议 |
|------|------|------|----------|
| `https://api2.cursor.sh` | 主 API（Chat、Composer、大部分 gRPC 服务） | gRPC-web (Connect) | **移除** — 改用 Claude Code CLI |
| `https://api3.cursor.sh` | Tab 补全 (CPP) + Agent 相关 | gRPC-web | **移除** — Claude Code 不需要 |
| `https://api4.cursor.sh` | 辅助 API（备用/特殊服务） | gRPC-web | **移除** |
| `https://repo42.cursor.sh` | 代码库索引服务 | gRPC/REST | **移除** — 不需要云端索引 |
| `https://dev-staging.cursor.sh` | 开发环境 | gRPC-web | **移除** |
| `https://staging.cursor.sh` | 预发布环境 | gRPC-web | **移除** |

### 1.2 Background Agent 端点

| 端点 | 区域 | 角色 |
|------|------|------|
| `https://agent.api5.cursor.sh` | 全球（主） | Background Agent 主入口 |
| `https://agentn.api5.cursor.sh` | 全球（备） | Background Agent 备用入口 |
| `https://agent-gcpp-uswest.api5.cursor.sh` | 美西 | 区域节点（GCP） |
| `https://agentn-gcpp-uswest.api5.cursor.sh` | 美西备 | 区域备用 |
| `https://agent-gcpp-eucentral.api5.cursor.sh` | 欧洲中部 | 区域节点 |
| `https://agentn-gcpp-eucentral.api5.cursor.sh` | 欧洲中部备 | 区域备用 |
| `https://agent-gcpp-apsoutheast.api5.cursor.sh` | 亚太东南 | 区域节点 |
| `https://agentn-gcpp-apsoutheast.api5.cursor.sh` | 亚太东南备 | 区域备用 |

> **替换建议**: 全部移除。Claude Editor 的 Background Agent 使用 Claude Code CLI 的 headless 模式本地运行，不需要云端 Worker。

### 1.3 认证端点

| 端点 | 用途 | 替换建议 |
|------|------|----------|
| `https://prod.authentication.cursor.sh` | 生产环境认证服务 | **移除** — 使用 Claude API Key |
| `https://dev.authentication.cursor.sh` | 开发环境认证 | **移除** |
| `https://authenticator.cursor.sh` | 认证 UI 页面 | **移除** — 使用本地 API Key 配置 |
| `*.authentication.cursor.sh` | 通配认证域名 | **移除** |

### 1.4 遥测和分析端点

| 端点 | 用途 | 替换建议 |
|------|------|----------|
| `https://80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh/4508016051945472` | Sentry 错误追踪 DSN | **移除** — 使用自有错误追踪或不追踪 |
| `https://api2.cursor.sh/aiserver.v1.AnalyticsService/UploadIssueTrace` | 问题追踪上传 | **移除** |
| `https://api3.cursor.sh/tev1/v1` (product.json `statsigLogEventProxyUrl`) | Statsig 事件代理 | **移除** |

### 1.5 市场和更新端点

| 端点 | 用途 | 替换建议 |
|------|------|----------|
| `https://api2.cursor.sh/updates` (product.json `updateUrl`) | 应用更新检查 | **替换** — 指向 Claude Editor 更新服务 |
| `http://cursorapi.com/updates` (product.json `backupUpdateUrl`) | 备用更新 URL | **替换** |
| `https://marketplace.cursor.sh/*` | Cursor 扩展市场 | **替换** — 指向 Open VSX 或自建市场 |
| `https://staging-marketplace.cursor.sh/*` | 预发市场 | **移除** |
| `https://cursor.com/downloads` | 下载页 | **替换** |
| `https://cursor.com/docs/cloud-agents` | 文档链接 | **替换** |

---

## 2. 通信协议

### 2.1 gRPC (Connect-RPC) 调用

Cursor 使用 **@connectrpc/connect** + **@connectrpc/connect-node** 框架进行 gRPC 通信。

#### 传输层

```
npm 包:
- @bufbuild/protobuf  — protobuf 序列化/反序列化
- @connectrpc/connect — Connect RPC 框架
- @connectrpc/connect-node — Node.js gRPC transport

创建模式:
- createGrpcTransport() — 用于 Node.js 端 gRPC 连接 (1 处)
- 内部 connectTransport 引用 — 用于浏览器端 connect-web (2 处)
```

#### 57 个 aiserver.v1 gRPC 服务

**核心 AI 服务（必须替换）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `AiService` | AI 功能总入口 | Claude Code CLI 服务层 |
| `ChatService` | Chat 对话 | Claude Code `--output-format stream-json` |
| `ChatRequestEventService` | Chat 请求事件流 | Claude Code 流式事件 |
| `ChatRequestEventV2Service` | Chat 请求事件 V2 | 同上 |
| `CppService` | Tab 补全 (Cursor Prediction++) | Claude Code CLI 补全或自定义 |
| `CmdKService` | Cmd+K 内联编辑 | Claude Code CLI |
| `InferenceService` | 模型推理 | Claude Code CLI |
| `FastApplyService` | 快速应用代码修改 | Claude Code Edit 工具 |
| `CursorPredictionService` | 代码预测 | Claude Code 补全 |
| `BidiService` | 双向流式通信 | Claude Code stdin/stdout |
| `AutopilotService` | 自动执行 | Claude Code Agent 模式 |

**Background Agent 服务（替换为本地模式）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `BackgroundComposerService` | 云端后台 Agent 管理 | Claude Code headless 模式 |
| `ShadowWorkspaceService` | 影子工作区（云端沙箱） | 本地 worktree |
| `VmDaemonService` | 虚拟机守护进程 | 不需要（本地执行） |
| `SchedulerService` | 任务调度 | 本地调度 |
| `AutomationsService` | 自动化任务 | 本地 cron |

**代码库服务（替换或移除）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `FileSyncService` | 文件同步到云端 | **移除** — 不需要云端同步 |
| `GitGraphService` | Git 图谱分析 | 本地 Git 操作 |
| `GitIndexService` | Git 索引 | 本地 Git 操作 |
| `CodebaseSnapshotService` | 代码库快照 | 本地 Git 快照 |
| `RepositoryService` | 仓库管理 | 本地 Git 操作 |
| `FastSearchService` | 快速搜索 | 本地 ripgrep |
| `HallucinatedFunctionsService` | 幻觉函数检测 | 不需要 |
| `LinterService` | 代码检查 | 本地 linter |
| `DebuggerService` | AI 辅助调试 | Claude Code |

**认证和计费（移除）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `AuthService` | 认证 | **移除** — Claude API Key |
| `TeamCreditsService` | 团队额度 | **移除** — 开源免费 |
| `DashboardService` | 管理面板 | **移除** |
| `EnterpriseAdminService` | 企业管理 | **移除** |
| `AiBranchService` | AI 分支管理 | **移除** |
| `AiProjectService` | AI 项目管理 | **移除** |

**遥测和分析（移除）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `AnalyticsService` | 使用分析 | **移除** |
| `MetricsService` | 指标收集 | **移除** |
| `OnlineMetricsService` | 在线指标 | **移除** |
| `PerformanceEventService` | 性能事件 | **移除** |
| `ProfilingService` | 性能分析 | **移除** |
| `WebProfilingService` | Web 性能分析 | **移除** |
| `ClientLoggerService` | 客户端日志 | **移除** |
| `TraceService` | 追踪 | **移除** |
| `CiMetricsService` | CI 指标 | **移除** |
| `EvalTrackingService` | 评估追踪 | **移除** |
| `UsageSimulationService` | 使用量模拟 | **移除** |

**其他功能服务（按需保留）**:

| 服务 | 功能 | 替换方案 |
|------|------|----------|
| `BugbotService` | Bug 检测 | 可选保留，用 Claude 实现 |
| `BugbotAdminService` | Bugbot 管理 | **移除** |
| `ConversationsService` | 对话管理 | 本地存储 |
| `ReviewService` | 代码审查 | Claude Code |
| `MCPRegistryService` | MCP 注册表 | 本地 MCP 管理 |
| `MarketplaceService` | 市场服务 | Open VSX |
| `DeeplinkService` | 深链接 | 自定义 scheme |
| `DistributorService` | 分发服务 | **移除** |
| `InAppAdService` | 应用内广告 | **移除** |
| `HealthService` | 健康检查 | 本地实现 |
| `NetworkService` | 网络服务 | 本地实现 |
| `ServerConfigService` | 服务端配置 | 本地配置 |
| `ToolCallEventService` | 工具调用事件 | 本地事件 |
| `UploadService` | 上传服务 | **移除** |
| `ReplayChatService` | 对话回放 | 本地存储 |
| `RequestReplayService` | 请求回放 | 本地存储 |

### 2.2 agent.v1 gRPC 服务（本地 Agent 通信）

这 6 个服务用于前台 Agent（cursor-agent 扩展）和 Background Agent 通信：

| 服务 | 方法数 | 说明 | 替换方案 |
|------|--------|------|----------|
| `AgentService` | 12 | Agent 对话管理（Run, RunSSE, RunPoll 等） | Claude Code CLI stdin/stdout |
| `ControlService` | 17 | 文件/Git/环境操作 | Claude Code 内置工具 |
| `ExecService` | 1 | 工具调用执行 | Claude Code 工具调用 |
| `PrivateWorkerBridgeExternalService` | 1 | Background Agent 桥接 | **移除**（不使用云端 Worker） |
| `LifecycleService` | 4 | Agent 实例生命周期 | 本地进程管理 |
| `PtyHostService` | 6 | 伪终端管理 | VS Code PTY（已有） |

### 2.3 REST API 调用

相比 gRPC，REST API 调用较少：

| 端点 | 方法 | 用途 | 来源文件 |
|------|------|------|----------|
| `api2.cursor.sh/updates` | GET | 应用更新检查 | product.json |
| `api3.cursor.sh/tev1/v1` | POST | Statsig 事件上报 | product.json |
| `completions` | POST | Tab 补全（CPP 服务内部） | workbench bundle |
| `cursor.com/docs/*` | GET | 文档链接 | workbench bundle |
| `cursor.com/license.txt` | GET | 许可证 | product.json |

### 2.4 WebSocket 连接

未发现独立的 WebSocket 连接。Cursor 使用 gRPC BiDi Streaming（AgentService.Run）代替 WebSocket，底层通过 HTTP/2 或 gRPC-Web 实现。

---

## 3. 认证和授权

### 3.1 认证流程

```
用户登录:
1. IDE 打开 authenticator.cursor.sh 的 OAuth 页面
2. 用户通过 GitHub/Google/Email 登录
3. 回调获取 access_token + refresh_token
4. Token 存储在本地 SecretStorage

API 请求认证:
1. 每个请求附带 Authorization: Bearer <token> 头
2. 附带 16 个 x-cursor-* 自定义头
3. 特殊功能需要 x-ghost-mode 头（隐私模式）
```

### 3.2 自定义请求头

| 头名称 | 说明 | 替换建议 |
|--------|------|----------|
| `Authorization` | Bearer token 认证 | **替换** — Claude API Key |
| `x-cursor-checksum` | 客户端校验和（防篡改） | **移除** |
| `x-cursor-client-version` | 客户端版本 | **替换** — Claude Editor 版本 |
| `x-cursor-client-type` | 客户端类型 | **移除** |
| `x-cursor-client-os` | 操作系统 | 可选保留 |
| `x-cursor-client-arch` | CPU 架构 | 可选保留 |
| `x-cursor-client-os-version` | OS 版本 | 可选保留 |
| `x-cursor-client-device-type` | 设备类型 | **移除** |
| `x-cursor-config-version` | 配置版本 | **移除** |
| `x-cursor-server-region` | 服务器区域选择 | **移除** |
| `x-cursor-timezone` | 时区 | 可选保留 |
| `x-cursor-canary` | 金丝雀发布标记 | **移除** |
| `x-cursor-simulate-slow-provider` | 慢速模拟（调试） | **移除** |
| `x-ghost-mode` | 隐私模式标记 | **移除** |
| `x-request-id` | 请求追踪 ID | 可选保留 |
| `x-amzn-trace` | AWS 追踪 ID | **移除** |

### 3.3 Anthropic API Proxy（cursor-agent 扩展内部）

```
流程:
1. cursor-agent 启动本地 HTTP 代理服务器
2. Claude Agent SDK 的 API 请求发到本地代理
3. 本地代理注入 Cursor 的认证信息（token + x-cursor-* 头）
4. 代理转发请求到 Anthropic API

为什么需要代理？
- Cursor 用户不直接持有 Anthropic API Key
- Cursor 后端作为中间人代理 API 调用
- 代理负责注入计费和权限信息

替换建议:
- Claude Editor 用户直接使用自己的 Claude API Key
- 不需要代理层，Claude Code CLI 直接调用 Anthropic API
- 完全移除 Anthropic API Proxy 逻辑
```

---

## 4. 模型配置和选择

### 4.1 支持的模型列表

从 workbench bundle 中提取的所有模型引用：

**Claude 系列**:
| 模型 ID | 说明 |
|---------|------|
| `claude-3-haiku-20240307` | Claude 3 Haiku |
| `claude-3-sonnet-20240229` | Claude 3 Sonnet |
| `claude-3-opus-20240229` | Claude 3 Opus |
| `claude-3.5-sonnet` | Claude 3.5 Sonnet |
| `claude-4.5-haiku` | Claude 4.5 Haiku |
| `claude-4-5-sonnet-20250929` | Claude 4.5 Sonnet |
| `claude-4.5-opus-high` | Claude 4.5 Opus |
| `claude-4.5-opus-high-thinking` | Claude 4.5 Opus (高思考) |

**GPT 系列**:
| 模型 ID | 说明 |
|---------|------|
| `gpt-3.5-turbo` / `gpt-3.5` / `gpt-3` | GPT-3.5 |
| `gpt-4` | GPT-4 |
| `gpt-4o` | GPT-4o |
| `gpt-4o-mini` | GPT-4o Mini |
| `gpt-4.1-mini` | GPT-4.1 Mini |
| `gpt-5` | GPT-5 |
| `gpt-5-mini` | GPT-5 Mini |
| `gpt-5-high` | GPT-5 高规格 |
| `gpt-5.1-codex` | GPT-5.1 Codex |
| `gpt-5.1-codex-high` | GPT-5.1 Codex 高规格 |
| `gpt-5.2-codex-high` | GPT-5.2 Codex 高规格 |

**推理系列 (o-models)**:
| 模型 ID | 说明 |
|---------|------|
| `o1` | OpenAI o1 |
| `o3-mini` | OpenAI o3-mini |
| `o3` | OpenAI o3 |

**Gemini 系列**:
| 模型 ID | 说明 |
|---------|------|
| `gemini-1.5-flash-8b` | Gemini 1.5 Flash 8B |
| `gemini-1.5-flash` | Gemini 1.5 Flash |
| `gemini-1.5-preview` | Gemini 1.5 Preview |
| `gemini-2.5-flash` | Gemini 2.5 Flash |

**特殊引用**:
| 引用 | 说明 |
|------|------|
| `claude-code` | Claude Code CLI 引用 |
| `claude-desktop` | Claude Desktop 引用 |
| `claude-plugin` / `claude-project` / `claude-project-local` / `claude-user` | 内部引用 |
| `deepseek-*` | DeepSeek 模型（代码中有引用但未在常量中） |

### 4.2 模型选择逻辑

```
模型选择层级:
1. 用户手动选择（Composer 模式选择器）
2. 服务端配置（ServerConfigService 返回的模型列表）
3. 订阅等级限制（freePlan / hobbyPlan / proMode / maxMode）
4. 功能特定默认值（Tab 补全、Cmd+K、Agent 各有默认模型）
5. Statsig 特性门控（A/B 测试不同模型）

替换建议:
- 移除订阅等级限制
- 保留模型选择 UI，但列表改为 Claude 系列模型
- 默认模型为 claude-4.5-sonnet（最新可用）
- 通过 Claude Code CLI 的 --model 参数传递选择
```

---

## 5. 遥测和分析（需移除）

### 5.1 Sentry 错误追踪

| 组件 | DSN | 位置 |
|------|-----|------|
| 渲染进程 | `https://80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh/4508016051945472` | workbench bundle |
| 主进程 | 同上 | main.js |

**npm 包**:
- `@sentry/browser` — 浏览器/渲染进程 Sentry SDK
- `@sentry/electron` — Electron 专用 Sentry SDK
- `@sentry/node` — Node.js Sentry SDK
- `@sentry/opentelemetry` — OpenTelemetry 集成
- `@sentry/core` — Sentry 核心库

**替换建议**: 完全移除。如需错误追踪，使用自有 Sentry 实例或其他方案。

### 5.2 Statsig A/B 测试

```
配置 (product.json):
- statsigClientKey: "client-Bm4HJ0aDjXHQVsoACMREyLNxm5p6zzuzhO50MgtoT5D"
- statsigLogEventProxyUrl: "https://api3.cursor.sh/tev1/v1"

用途:
- 特性门控 (feature gates) — 控制新功能的渐进发布
- 动态配置 (dynamic configs) — 远程配置参数
- 实验 (experiments) — A/B 测试不同 AI 模型和 UI
- 事件日志 — 用户行为分析

影响范围:
- workbench bundle 中有 5 处 "statsig" 引用
- 特性门控影响: 模型选择、Agent 功能、UI 布局等

替换建议: 完全移除 Statsig SDK 和所有 feature gate 检查。
所有功能默认启用，不需要远程控制。
```

### 5.3 OpenTelemetry

**npm 包**:
- `@opentelemetry/exporter-trace-otlp-proto` — OTLP 追踪导出
- `@opentelemetry/otlp-transformer` — OTLP 数据转换
- `@opentelemetry/semantic-conventions` — 语义约定
- `@opentelemetry/instrumentation-graphql` — GraphQL 追踪
- `@opentelemetry/instrumentation-undici` — HTTP 追踪

**替换建议**: 移除所有 OpenTelemetry 集成。如需性能追踪，使用本地日志。

### 5.4 aiserver 遥测和分析服务

需要移除的 10 个遥测服务:
1. `AnalyticsService` — 使用分析
2. `MetricsService` — 指标收集
3. `OnlineMetricsService` — 在线指标
4. `PerformanceEventService` — 性能事件
5. `ProfilingService` — 性能分析
6. `WebProfilingService` — Web 性能
7. `ClientLoggerService` — 客户端日志
8. `TraceService` — 分布式追踪
9. `CiMetricsService` — CI 指标
10. `EvalTrackingService` — 评估追踪

---

## 6. 计费和使用限制（需移除）

### 6.1 订阅相关

| 变量/配置 | 说明 |
|-----------|------|
| `subscriptionStatus` | 订阅状态 |
| `subscriptionIncludedReqs` | 包含的请求数 |
| `subscriptionProductId` | 产品 ID |
| `subscriptionLimitedUsers` | 限制用户数 |
| `subscriptionCycleStart` | 计费周期起始 |
| `cursor.showSubscriptionTiersModal` | 订阅层级弹窗 |
| `cursor.billingBanner.paymentFailedDismissed` | 支付失败横幅 |

### 6.2 使用模式

| 模式 | 说明 |
|------|------|
| `maxMode` (15 处引用) | Max 模式（高级订阅） |
| `privacyMode` (7 处引用) | 隐私模式 |
| `privacyModeForced` (5 处引用) | 强制隐私模式 |
| `ghostMode` (1 处引用) | 隐身模式 |
| `usageLimitCents` | 使用限额（分） |
| `usageLimitPolicyStatus` | 限额策略状态 |

### 6.3 相关 gRPC 服务

- `TeamCreditsService` — 团队额度管理
- `UsageSimulationService` — 使用量模拟
- `DashboardService` — 用量面板

**替换建议**: 全部移除。Claude Editor 是开源的，用户直接使用自己的 Claude API Key，不需要任何计费系统。

---

## 7. 按功能维度的调用点分析

### 7.1 Chat / Composer

**涉及服务**: `ChatService`, `ChatRequestEventService`, `ChatRequestEventV2Service`, `ConversationsService`, `BidiService`

**调用流程**:
```
用户输入 → ComposerService → IAiService → gRPC ChatService → api2.cursor.sh
                                          ↓
                             流式响应 → ChatRequestEventV2Service → 渲染
```

**替换**: ComposerService → IClaudeCodeService → Claude Code CLI (stdin/stdout stream-json)

### 7.2 Tab 补全 (CPP - Cursor Prediction++)

**涉及服务**: `CppService`, `CursorPredictionService`

**调用流程**:
```
编辑器输入 → CppDebouncingService → IAiService → gRPC CppService → api3.cursor.sh
                                                                   ↓
                                          Ghost Text ← CppSuggestionService
```

**配置项**:
- `cursor.cpp.disabledLanguages` — 禁用的语言
- `cursor.cpp.enablePartialAccepts` — 部分接受
- 全局: `cursor.cppEnabled()`

**替换**: 可使用 Claude Code CLI 的补全功能，或使用本地模型进行 Tab 补全。需要评估延迟要求。

### 7.3 Cmd+K 内联编辑

**涉及服务**: `CmdKService`, `FastApplyService`

**调用流程**:
```
Cmd+K → InlineEditWidget → IAiCmdKStateService → gRPC CmdKService → api2.cursor.sh
                                                                    ↓
                                 InlineDiffService ← FastApplyService → diff 应用
```

**替换**: Claude Code CLI 的 Edit 工具

### 7.4 Agent 模式

**涉及服务**: `AgentService`（agent.v1），`ExecService`，通过 cursor-agent 扩展的 Claude Agent SDK

**调用流程**:
```
Composer (Agent 模式) → CursorAgentProvider → ClaudeSDKClient
                                              ↓
                                Claude Agent SDK (v0.2.4)
                                              ↓
                                CLI Process (stdin/stdout JSON)
                                              ↓
                              Anthropic API Proxy (本地 HTTP)
                                              ↓
                                       Anthropic API
```

**替换**: 最简单的路径 — 直接使用 Claude Code CLI，移除中间的 Proxy 层。

### 7.5 Background Agent

**涉及服务**: `BackgroundComposerService`, `ShadowWorkspaceService`, `VmDaemonService`, `PrivateWorkerBridgeExternalService`, `LifecycleService`

**调用流程**:
```
创建 BC → BackgroundComposerService → agent.api5.cursor.sh → 云端 Worker
                                                              ↓
                                          PrivateWorkerBridge → cursor-agent-exec (本地)
                                                              ↓
                                                     工具执行 + 结果回传
```

**替换**: Claude Code CLI headless 模式，本地后台进程，不需要云端 Worker。

### 7.6 代码索引和检索

**涉及服务**: `FileSyncService`, `GitGraphService`, `GitIndexService`, `RepositoryService`, `FastSearchService`, `CodebaseSnapshotService`

**调用位置**: cursor-always-local 扩展 + cursor-retrieval 扩展

**涉及端点**: repo42.cursor.sh

**替换**: 本地索引方案（ripgrep + 本地向量化），或依赖 Claude Code CLI 自带的搜索工具。

### 7.7 MCP 管理

**涉及服务**: `MCPRegistryService`（云端 MCP 注册表），cursor-mcp 扩展

**调用位置**: cursor-mcp 扩展 → api2.cursor.sh

**替换**: 本地 MCP 配置管理，已在 Phase 4A 实现。

---

## 8. product.json 关键配置项

以下配置项需要在迁移时修改：

```json
{
  // 必须修改
  "statsigClientKey": "client-Bm4HJ0aDjXHQVsoACMREyLNxm5p6zzuzhO50MgtoT5D",  // → 移除
  "statsigLogEventProxyUrl": "https://api3.cursor.sh/tev1/v1",                // → 移除
  "updateUrl": "https://api2.cursor.sh/updates",                               // → Claude Editor URL
  "backupUpdateUrl": "http://cursorapi.com/updates",                           // → 移除
  "downloadUrl": "https://cursor.com/downloads",                               // → Claude Editor URL
  "releaseNotesUrl": "https://www.cursor.com/changelog",                       // → Claude Editor URL
  "licenseUrl": "https://cursor.com/license.txt",                             // → Claude Editor License
  "reportIssueUrl": "https://github.com/getcursor/cursor/issues/new",         // → Claude Editor Issues
  "serverApplicationName": "cursor-server",                                    // → claude-editor-server
  "serverDataFolderName": ".cursor-server",                                    // → .claude-editor-server
  "tunnelApplicationName": "cursor-tunnel",                                    // → claude-editor-tunnel

  // Sentry DSN (移除)
  // 内嵌在 workbench 和 main 中，需从源码移除

  // 扩展市场 (替换)
  // marketplace.cursor.sh → Open VSX 或自建
}
```

---

## 9. Cursor 专用配置项汇总

需要审查的 `cursor.*` 配置项：

### 保留并重命名
| 原始 | 新名称 | 说明 |
|------|--------|------|
| `cursor.composer.*` | `claude.composer.*` | Composer 设置 |
| `cursor.chat.smoothStreaming` | `claude.chat.smoothStreaming` | 平滑流式 |
| `cursor.cpp.disabledLanguages` | `claude.tabComplete.disabledLanguages` | 禁用语言 |
| `cursor.cpp.enablePartialAccepts` | `claude.tabComplete.enablePartialAccepts` | 部分接受 |
| `cursor.inlineDiff.enablePerformanceProtection` | `claude.inlineDiff.enablePerformanceProtection` | 性能保护 |
| `cursor.terminal.enableAiChecks` | `claude.terminal.enableAiChecks` | 终端 AI |
| `cursor.terminal.usePreviewBox` | `claude.terminal.usePreviewBox` | 预览框 |
| `cursor.general.enableShadowWorkspace` | `claude.general.enableShadowWorkspace` | 影子工作区 |
| `cursor.general.gitGraphIndexing` | `claude.general.gitGraphIndexing` | Git 索引 |
| `cursor.agentIdeUnification.*` | `claude.agentLayout.*` | Agent 布局 |

### 移除
| 配置 | 原因 |
|------|------|
| `cursor.billingBanner.*` | 计费相关 |
| `cursor.selectBackend` | Cursor 后端选择 |
| `cursor.useLocalhostUpdateServer` | Cursor 更新服务 |
| `cursor.featureStatus.dataPrivacyOnboarding` | Cursor 特有流程 |
| `cursor.general.emailPrivacyEnabled` | Cursor 特有 |
| `cursor.rpcFileLogger.*` | Cursor RPC 日志 |
| `cursor.debuggingData.*` | Cursor 调试数据 |
| `cursor.publicLogCapture` | Cursor 日志 |

---

## 10. 后端替换方案总结（不动前端 UI）

### 总体策略

```
原则: 前端 UI 全部保留，只替换后端调用实现

要替换的后端调用层:
├── services/ai/browser/ 中的 gRPC 客户端实现 (5 个核心模块)
│   ├── backendClient.js      — URL 端点定义 → 指向 Claude Code CLI
│   ├── aiClientService.js    — gRPC 调用 → CLI stdin/stdout
│   ├── aiService.js          — 服务总入口 → 适配新后端
│   ├── cursorCredsService.js — Cursor token → Claude API Key
│   └── connectRequestService.js — Connect-RPC → CLI 通信
├── extensions/cursor-agent/  — Anthropic API Proxy → 直连 CLI
├── product.json              — 端点 URL + Statsig Key
└── out/main.js               — Sentry DSN

要移除的后端模块:
├── proto/aiserver/v1/  (30+ protobuf 模块) — gRPC 不再需要
├── proto/agent/v1/     (40+ protobuf 模块) — 用 JSON 替代
├── external/sentry/    (170+ 模块) — 错误追踪
├── platform/tracing/   (6 模块) — 分布式追踪
├── Statsig SDK — A/B 测试
└── OpenTelemetry — 性能追踪

不动的前端 UI:
├── contrib/composer/browser/          — 120+ 模块全部保留
├── contrib/agents/browser/            — Agent UI 保留
├── contrib/aiBackgroundComposer/      — Background UI 保留
├── contrib/aiCpp/browser/             — Tab 补全 UI 保留
├── contrib/aiDiff/browser/            — Diff 渲染保留
├── contrib/aiConfig/browser/          — 配置 UI 保留
├── contrib/inlineChat/browser/        — 内联聊天保留
├── editor/contrib/inlineCompletions/  — Ghost Text 保留
├── editor/contrib/inlineDiffs/        — Inline Diff 保留
└── 所有 CSS/样式文件                  — 完全不动
```

### 优先级排序（仅后端）

| 优先级 | 操作 | 工作量 | 涉及模块 |
|--------|------|--------|----------|
| P0 | 替换 `backendClient.js` — 端点 URL → Claude Code CLI 通信 | 中 | 1 个核心模块 |
| P0 | 替换 `aiClientService.js` — gRPC 调用 → CLI JSON stream | 大 | 1 个核心模块 |
| P0 | 替换 `cursorCredsService.js` — Cursor token → Claude API Key | 小 | 1 个模块 |
| P0 | 修改 `product.json` — 移除 Statsig Key + 替换 URL | 小 | 1 个文件 |
| P0 | 重写 cursor-agent 扩展 — 移除 Proxy，直连 CLI | 中 | 1 个扩展 |
| P1 | 移除 proto/ 目录 — protobuf 定义不再需要 | 小 | 70+ 文件删除 |
| P1 | 移除 external/sentry/ — Sentry 错误追踪 | 小 | 170+ 文件删除 |
| P1 | 移除 platform/tracing/ — 追踪系统 | 小 | 6 文件删除 |
| P1 | 简化 `metricsService.js` 等 — 遥测类服务 stub 化 | 中 | 3-4 个模块 |
| P2 | 修改 cursor-always-local — 移除云端同步 | 中 | 1 个扩展 |
| P2 | 修改 cursor-retrieval — 移除云端索引 | 中 | 1 个扩展 |
| P2 | 移除 `usageLimitPolicyStatusService.js` 等计费逻辑 | 小 | 2-3 个模块 |

### 后端文件级修改清单

**核心替换（5 个模块 — P0）**:

| 源码路径 | 操作 | 说明 |
|----------|------|------|
| `services/ai/browser/backendClient.js` | **重写** | 将 api2/3/4/5.cursor.sh 端点替换为 Claude Code CLI 通信层 |
| `services/ai/browser/aiClientService.js` | **重写** | 将 gRPC Connect-RPC 调用替换为 CLI stdin/stdout JSON stream |
| `services/ai/browser/aiService.js` | **适配** | 调整总入口，路由到新的 CLI 后端 |
| `services/ai/browser/cursorCredsService.js` | **重写** | Cursor OAuth token → Claude API Key（从 SecretStorage 读取） |
| `services/ai/browser/connectRequestService.js` | **重写** | Connect-RPC 请求构建 → CLI 命令构建 |

**扩展替换（3 个扩展 — P0/P1）**:

| 扩展 | 操作 | 说明 |
|------|------|------|
| `extensions/cursor-agent/` | **重写** | 移除 Anthropic API Proxy，直接启动 Claude Code CLI 进程 |
| `extensions/cursor-always-local/` | **部分重写** | 保留本地 CPP 逻辑，移除云端 FileSyncService 调用 |
| `extensions/cursor-mcp/` | **部分重写** | 移除 Lease 管理，保留 MCP 工具发现 |

**删除（清理 — P1）**:

| 路径 | 文件数 | 说明 |
|------|--------|------|
| `proto/aiserver/v1/` | ~30 | Protobuf 定义 — gRPC 不再需要 |
| `proto/agent/v1/` | ~40 | Agent protobuf — 改用 CLI JSON |
| `external/sentry/` | ~170 | Sentry SDK — 完全移除 |
| `platform/tracing/common/` | 6 | 追踪系统 — 完全移除 |

**Stub 化（降级为空实现 — P1/P2）**:

| 模块 | 说明 |
|------|------|
| `services/ai/browser/metricsService.js` | 指标收集 → 空实现（前端可能调用接口） |
| `services/ai/browser/aggregatingMetricsService.js` | 聚合指标 → 空实现 |
| `services/ai/browser/clientNumericMetricsService.js` | 数值指标 → 空实现 |
| `services/agent/browser/usageLimitPolicyStatusService.js` | 使用限制 → 始终返回"无限制" |
| `services/agent/browser/cloudAgentStorageService.js` | 云存储 → 本地存储 |
| `services/ai/browser/repositoryService.js` | 云端仓库 → 本地 Git |

**保留不动（前端 UI 模块）**:

| 路径 | 模块数 | 说明 |
|------|--------|------|
| `contrib/composer/browser/` | 120+ | Composer 全部 UI — 不动 |
| `contrib/agents/browser/` | 3 | Agent UI — 不动 |
| `contrib/aiBackgroundComposer/browser/` | 16 | Background Agent UI — 不动 |
| `contrib/aiCpp/browser/` | 4 | Tab 补全 UI — 不动 |
| `contrib/aiDiff/browser/` | 2 | AI Diff 渲染 — 不动 |
| `contrib/aiConfig/browser/` | 1 | AI 配置 — 不动 |
| `contrib/aiSettings/browser/` | 1 | AI 设置 — 不动 |
| `contrib/inlineChat/browser/` | 4 | 内联聊天 — 不动 |
| `services/agent/browser/toolCallHandlers/` | 20 | 工具处理器 — 保留（本地执行） |
| `services/inlineDiffsV2/` | 5 | Diff V2 后端逻辑 — 保留 |
| `services/aiCmdK/` | 2 | Cmd+K 状态管理 — 保留接口 |
| `services/aiContext/` | 2 | AI 上下文 — 保留 |

---

## 附录 A: aiserver.v1 服务分类汇总

### 核心 AI (11 个) — 必须替换
AiService, ChatService, ChatRequestEventService, ChatRequestEventV2Service, CppService, CmdKService, InferenceService, FastApplyService, CursorPredictionService, BidiService, AutopilotService

### Background Agent (5 个) — 替换为本地
BackgroundComposerService, ShadowWorkspaceService, VmDaemonService, SchedulerService, AutomationsService

### 代码库 (9 个) — 替换为本地
FileSyncService, GitGraphService, GitIndexService, CodebaseSnapshotService, RepositoryService, FastSearchService, HallucinatedFunctionsService, LinterService, DebuggerService

### 认证计费 (6 个) — 移除
AuthService, TeamCreditsService, DashboardService, EnterpriseAdminService, AiBranchService, AiProjectService

### 遥测分析 (11 个) — 移除
AnalyticsService, MetricsService, OnlineMetricsService, PerformanceEventService, ProfilingService, WebProfilingService, ClientLoggerService, TraceService, CiMetricsService, EvalTrackingService, UsageSimulationService

### 其他功能 (15 个) — 按需保留/移除
BugbotService, BugbotAdminService, ConversationsService, ReviewService, MCPRegistryService, MarketplaceService, DeeplinkService, DistributorService, InAppAdService, HealthService, NetworkService, ServerConfigService, ToolCallEventService, UploadService, ReplayChatService, RequestReplayService
