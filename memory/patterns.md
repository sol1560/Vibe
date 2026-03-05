# 设计模式和最佳实践

## Electron 应用逆向模式

### DMG 挂载和 asar 解包
```bash
# 标准流程
hdiutil attach <file>.dmg -mountpoint /tmp/<name>-mount
npx asar extract <path>/app.asar ./extracted/<name>
hdiutil detach /tmp/<name>-mount
```

### CSS 变量提取
```bash
# 提取所有 CSS 变量定义
grep -r "^\s*--" ./extracted/<name>/ --include="*.css" | sort | uniq

# 提取颜色值
grep -r "var(--" ./extracted/<name>/ --include="*.css"
```

## Claude Desktop App 架构模式

### 混合架构: 本地壳 + 远程 Web UI
- 主窗口 HTML 仅渲染标题栏和错误界面
- 实际 UI 从 claude.ai 远程加载
- 通过 `contextBridge` 暴露 `claude.internal.ui` API 到渲染进程
- 使用 `@marshallofsound/ipc` 进行类型安全 IPC

### Claude Code 调用方式
- 使用 `@anthropic-ai/claude-agent-sdk` (v0.2.51)
- 通过 `spawnClaudeCodeProcess` 子进程执行 CLI
- `LocalAgentMode` 为核心运行模式 (193处引用)
- MCP 服务器通过 Electron Worker Thread 运行

### Cowork VM 隔离
- 使用 Linux VM (vmlinuz + vmdk)
- 文件挂载: `/sessions/{sessionId}/mnt/.claude`
- 远程 CLI 部署: `downloads.claude.ai/vms/linux/`
- VM 镜像通过 `claude-ssh` 工具管理

### 设计 Token 系统
- 核心位置: `window-shared.css` (HSL 格式的 CSS 变量)
- Tailwind CSS 3.4 + 自定义 Token
- 亮色/暗色主题完整变量系统
- 品牌色: `--claude-accent-clay: #d97757`

## Cursor IDE 架构模式

### 关键架构决策
- 基于 VS Code 1.105.1 fork，Electron 39.6.0
- AI 功能直接实现在 workbench 核心中（非扩展形式）
  - `vs/workbench/contrib/composer/` — Composer（AI Chat + Agent）
  - `vs/workbench/services/ai/` — AI 服务层
  - `vs/workbench/contrib/agents/` — Agent 管理
- 不使用 asar 打包，源码直接放在 `Resources/app/` 目录
- 使用 todesktop 打包（非 electron-builder）

### Composer（AI 对话系统）
- 面板 ID: `workbench.panel.composerChatViewPane`
- 统一 Chat、Agent、Plan 功能
- 209 个 composer.* 命令
- 支持多 Tab（多会话）
- 流式渲染、代码块高亮

### Agent 系统
- 内嵌 @anthropic-ai/claude-agent-sdk v0.2.4
- 前台 Agent + Background Agent（云端）
- 四种布局模式: Agent/Editor/Zen/Browser
- agent-exec 负责命令执行、文件操作、工具调用

### Tab 补全 (CPP)
- cursor.suggestcpp / acceptcppsuggestion
- 支持部分接受（逐词/逐行）
- Ghost Text 渲染
- 可按语言禁用
- CPP CSS 类名: `cpp-suggestion-green-background`
- AcceptResult 枚举: AcceptedWord(0) / NotAccepted(1) / AcceptedAll(2)
- CppDebouncingService: clientDebounceDuration + totalDebounceDuration + evictionDuration
- 详见 staging/phase-2c-inline-edit/ANALYSIS.md

### Inline Diff 系统（Phase 2C 提取）
- 三层架构: InlineDiffService(56KB) → InlineDiffController(17KB) → Widgets
- InlineDiffsV2 引入 PatchGraph 系统（多文件编辑追踪）
- Streaming Diff: activeLine + pendingRange 支持流式编辑
- SourceAdapter 将 diff 数据转为统一描述符，含 composerId/toolCallId
- 14 个 `editor.action.inlineDiffs.*` 命令
- 47 个 `diffEditor.*` 配置项
- 模块路径: vs/editor/browser/services/inlineDiff*, vs/editor/contrib/inlineDiffs/, vs/workbench/services/inlineDiffsV2/

### Inline Completions 系统（Phase 2C 提取）
- 主要模块路径: vs/editor/contrib/inlineCompletions/
- 6 种 InlineEdits 视图变体: Collapsed/Deletion/Insertion/LineReplacement/SideBySide/WordReplacement
- 19 个颜色 Token (inlineEdit.*)
- 11 个 Context Keys
- 12 个 editor.action.inlineSuggest.* 命令
- GhostTextView 负责 Tab 补全渲染

### 扩展策略
- 替换关键 MS 扩展（SSH、Pylance、cpptools 等）
- 禁止安装 github.copilot
- 16 个 Cursor 专有扩展
- 自定义 API proposals: cursor、control、cursorTracing

### 主题系统
- 4 个主题变体（Dark、Dark Midnight、HC、Light）
- 编辑器背景 #181818，侧边栏 #141414
- 使用标准 VS Code 主题 token 格式

### Agent Mode UI（重点参考）
- 109 个 `--cursor-*` CSS 变量构成完整 Design Token 系统
- 6 种 Composer 模式: Chat(绿)/Background(紫)/Plan(黄)/Spec(青)/Debug(红)/Edit(默认)
- 每种模式有独立的颜色编码（bg/text/stroke/icon）
- Agent Layout Quick Menu: 244px 宽弹出菜单切换布局
- Composer 内容最大宽度 840px，BC Peek 864px
- Glass Mode: backdrop-filter: blur(10px) 毛玻璃效果
- Animated Title: 闪光渐变动画表示 Agent 运行中
- Gutter 条纹式 Diff（绿/红色 3px 条纹替代背景色）
- 626 个 agent.v1.* protobuf 类型定义了完整 Agent API（Phase 2D 精确计数）
- 37 种工具调用类型（详见 staging/phase-2d-services/ANALYSIS.md）
- 10 种子 Agent 类型（Unspecified/ComputerUse/Custom/Explore/MediaReview/Bash/BrowserUse/Shell/VmSetupHelper/Debug）
- 19 种流式更新类型（InteractionUpdate oneof）
- 15 种交互查询类型（InteractionQuery oneof — Server 向 IDE 请求信息）
- 6 个 gRPC 服务（AgentService 12方法 / ControlService 17方法 / ExecService 1方法 / PrivateWorkerBridge 1方法 / LifecycleService 4方法 / PtyHostService 6方法）
- Background Agent 通过 agent.api5.cursor.sh 通信，8 个端点（3 区域 × 主备 + 2 全局）

### Agent 通信协议（Phase 2D 深度提取）
- cursor-agent 扩展使用 @anthropic-ai/claude-agent-sdk v0.2.4
- ClaudeSDKClient 封装 SDK query() 调用，通过 stdin/stdout JSON Stream 与 CLI 通信
- CursorAgentProvider → CursorAgentProviderHandle → ClaudeSDKClient 三层结构
- Anthropic API Proxy (本地 HTTP) 注入认证信息到请求头
- 权限模式: unrestricted / allowlist (Shell 模式匹配) / ask-every-time
- cursor-agent-exec 扩展提供 20 种 Executor Resource（工具执行器）
- SimpleControlledExecManager 管理执行生命周期（心跳 3s + abort + streamClose）
- 详见 staging/phase-2d-services/ 完整提取

### AI 调用点完整分析（ai-hunter Agent 提取）
- 12 个 cursor.sh 域名端点（api2/api3/api4/api5/repo42/auth/metrics/marketplace）
- 57 个 aiserver.v1.* gRPC 服务 + 6 个 agent.v1.* gRPC 服务
- 2804 个 protobuf 类型定义（aiserver.v1.* 命名空间）
- 35+ AI 模型引用（GPT-3.5~5.2 / Claude-3~4.5 / Gemini / o-series）
- 16 个 x-cursor-* 自定义请求头
- Sentry DSN: 80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh
- Statsig Key: client-Bm4HJ0aDjXHQVsoACMREyLNxm5p6zzuzhO50MgtoT5D
- 通信框架: @connectrpc/connect + @bufbuild/protobuf
- 替换策略: 所有 gRPC 调用 → Claude Code CLI stdin/stdout stream-json
- 详见 docs/reverse-engineering/cursor-ide/ai-endpoints-analysis.md

## Cowork 集成模式

### Claude Desktop Cowork 实际架构（逆向确认）
- Cowork 不是文件编辑器 — 是 VM 隔离的 Agent 执行环境
- UI 由 claude.ai 远程提供，本地 Electron 壳通过 IPC 暴露 3 大服务
- 3 大 IPC 服务: CoworkSpaces（空间/文件管理）+ CoworkScheduledTasks（定时任务）+ CoworkMemory（全局记忆）
- Agent 在 Linux VM 内运行 Claude Code CLI（路径: /usr/local/bin/claude）
- VM 挂载: /sessions/{sessionId}/mnt/.claude
- 内建 MCP server "cowork" 提供: present_files / reply_to_space / request_cowork_directory
- 工具集: 标准 IDE 工具 + MCP 工具（mcp__cowork__*, mcp__spaces__*, mcp__plugins__*）
- 配置: coworkScheduledTasksEnabled / coworkWebSearchEnabled / secureVmFeaturesEnabled
- 详细分析: docs/reverse-engineering/claude-app/cowork-architecture-analysis.md

### Claude Editor Cowork 实现策略
- 3 个 Bundled Extension: claude-cowork-core + claude-cowork-editors + claude-mcp-host
- claude-cowork-editors: 使用 VS Code Custom Editor API（Tiptap/Univer/Reveal.js/PDF.js）
  - 这是 Claude Editor **独有功能**，Claude Desktop 没有可视化文件编辑器
- 应实现相同的 3 大服务接口（Spaces、ScheduledTasks、Memory）以保持兼容
- MCP 内建工具也应保持相同命名（mcp__cowork__*）

### Agent Core 共享模式
- Code 模式和 Cowork 模式共享同一个 Claude Code CLI 会话
- 通过动态切换 Tool Set 区分模式，而非重启会话
- Claude Code CLI 通过 stdin/stdout JSON Stream 通信

### 渐进式安全模型
- Level 0: IDE 内置操作（无隔离）
- Level 1: Electron Sandbox + 文件路径白名单（默认）
- Level 2: 增强沙箱（macOS sandbox-exec / Linux bubblewrap）
- Level 3: VM 隔离（可选，企业场景）
- Claude Desktop 默认使用 VM 隔离（Level 3），我们默认用 Level 1

### MCP 双角色模式
- IDE 同时是 MCP Host（管理外部 Server 连接）和 MCP Server（暴露 IDE 能力）
- 兼容 Claude Desktop 的 MCP 配置格式
- Remote MCP 调用头: "x-mcp-client-name": "Cowork"

## Claude Code CLI 集成模式 (已实现)

### CLI 子进程通信
- 使用 `spawn` 启动 `claude` CLI 子进程
- 参数: `--output-format stream-json --model <model> --session-id <id>`
- stdin: JSON 消息 (用户输入)
- stdout: 换行分隔的 JSON (流事件: assistant/tool_result/system/result)
- 使用 readline 逐行解析 stdout

### 会话管理
- Session ID 格式: `ces-<timestamp36>-<random>`
- 会话可持久化并恢复 (`--resume --persist-session`)
- 状态机: initializing → ready → busy → ready (循环) → paused/terminated

### Tool Set 动态切换
- Code 模式: 27 个工具 (文件操作+代码搜索+终端+Git)
- Cowork 模式: 21 个工具 (文件+文档+表格+PPT+数据分析)
- MCP 工具动态注册，两个模式都可用
- 工具命名: 内置用短名, MCP 用 `mcp__<server>__<tool>`

### MCP Client Manager 模式
- 支持 stdio 和 streamable-http 两种 transport
- 自动发现 Claude Desktop/Cursor/Claude Code CLI 的 MCP 配置
- 断线自动重连（指数退避，最多 5 次）
- McpCapabilityProvider 将 MCP 工具注入 ToolSetManager

## VS Code ViewPane 注册模式 (Composer 实现)

### 注册步骤
1. `createDecorator<IComposerService>('claudeComposerService')` — 定义服务标识
2. `registerSingleton(IComposerService, ComposerService, InstantiationType.Delayed)` — 注册实现
3. `registerViewContainer({...}, ViewContainerLocation.AuxiliaryBar)` — 注册容器
4. `registerViews([viewDescriptor], viewContainer)` — 注册 ViewPane
5. `workbench.common.main.ts` 中添加 `import ./contrib/claude/claude.contribution.js`

### Design Token 系统
- 命名空间: `--ce-*`（Claude Editor 缩写）
- 层级: `--ce-{类别}-{语义}-{层级}`（如 `--ce-bg-green-secondary`）
- 与 VS Code 主题变量联动: `var(--vscode-editor-background)` 等
- 品牌色: `--ce-accent-primary: #d97757`
- 4 种 Composer 模式各有独立颜色 token（bg + text）

### 关键 ID
- View ID: `workbench.panel.claudeComposer`
- Container ID: `workbench.view.claudeComposer`
- Service ID: `claudeComposerService`
