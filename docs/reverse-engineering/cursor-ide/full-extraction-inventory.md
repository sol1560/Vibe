# Cursor IDE 完整提取清单

> 生成日期：2026-03-05
> Cursor 版本：2.6.11（基于 VS Code 1.105.1）
> Electron 版本：39.6.0
> 构建日期：2026-03-03T18:57:48.001Z
> Commit: 8c95649f251a168cc4bb34c89531fae7db4bd990

---

## 1. Cursor.app 完整目录结构概览

```
Cursor.app/Contents/
├── _CodeSignature/            # 代码签名
├── CodeResources              # 代码资源清单
├── Frameworks/                # 原生框架
│   ├── Cursor Helper (GPU).app/
│   ├── Cursor Helper (Plugin).app/
│   ├── Cursor Helper (Renderer).app/
│   ├── Cursor Helper.app/
│   ├── Electron Framework.framework/   # Electron 39.6.0
│   ├── Mantle.framework/               # Objective-C 模型框架
│   ├── ReactiveObjC.framework/         # 响应式 ObjC 框架
│   └── Squirrel.framework/             # 自动更新框架
├── Info.plist                 # 应用配置（版本 2.6.11）
├── MacOS/                     # 主可执行文件
├── PkgInfo
└── Resources/
    ├── *.lproj/               # 60+ 语言本地化文件
    └── app/                   # ★ 核心应用代码（504MB）
        ├── bin/               # CLI 工具（12MB）
        ├── extensions/        # 内置扩展（134MB）
        ├── node_modules/      # 依赖包（168MB）
        ├── out/               # 编译后代码（74MB）
        ├── policies/          # 企业策略配置
        ├── resources/         # 资源和 helper 二进制
        ├── package.json       # 包配置
        └── product.json       # 产品配置（57KB）
```

## 2. 文件统计

### 2.1 总体统计

| 目录 | 文件数 | 大小 |
|------|--------|------|
| `out/` | 145 | 74MB |
| `extensions/` | 919 | 134MB |
| `node_modules/` | 16,473 | 168MB |
| `bin/` | 3 | 12MB |
| `resources/` | 8 | 115MB |
| `policies/` | 2 | 12KB |
| **总计** | **17,555** | **504MB** |

### 2.2 按文件类型统计

| 类型 | 数量 | 说明 |
|------|------|------|
| `.js` | 10,964 | JavaScript 代码 |
| `.cjs` | 1,736 | CommonJS 模块 |
| `.cts` | 1,692 | CommonJS TypeScript 声明 |
| `.json` | 1,380 | 配置和数据文件 |
| `.mjs` | 459 | ES Module |
| `.png` | 156 | 图片资源 |
| `.ts` | 102 | TypeScript 源文件 |
| `.svg` | 99 | 矢量图标 |
| `.css` | 19 | 样式表 |
| `.node` | 17 | 原生 Node 模块 |
| `.wasm` | 14 | WebAssembly 模块 |
| `.html` | 15 | HTML 页面 |
| `.proto` | 6 | Protocol Buffers 定义 |

### 2.3 `out/vs/` 子目录统计

| 目录 | 文件数 | 大小 | 说明 |
|------|--------|------|------|
| `base/` | 5 | 20KB | 基础工具库 |
| `code/` | 12 | 2.7MB | Electron 进程代码 |
| `editor/` | 6 | 528KB | 编辑器核心 |
| `platform/` | 31 | 1.7MB | 平台服务层 |
| `workbench/` | 76 | 65MB | ★ 工作台（含 AI 核心） |

## 3. 核心代码目录详细列表

### 3.1 `out/` 入口文件

| 文件 | 大小 | 说明 |
|------|------|------|
| `main.js` | 1.35MB | Electron 主进程入口（含 Sentry 集成） |
| `cli.js` | 211KB | CLI 工具代码 |
| `bootstrap-fork.js` | 19KB | 子进程启动引导 |
| `nls.messages.json` | 720KB | 国际化消息 |
| `nls.keys.json` | 456KB | 国际化键值 |

### 3.2 `out/vs/workbench/` — 核心 Bundle

| 文件 | 大小 | 说明 |
|------|------|------|
| `workbench.desktop.main.js` | **51MB** | ★ 主 bundle，包含所有 workbench 代码和 Cursor AI 模块 |
| `workbench.desktop.main.css` | 1.7MB | 主样式表（含 774 个 Cursor 特有 CSS 类） |

### 3.3 `out/media/` — 全局资源

| 文件 | 说明 |
|------|------|
| `code-icon.svg` | VS Code 图标 |
| `codicon.ttf` | Codicon 图标字体 |
| `cursor-icons-outline.woff2` | ★ Cursor 自定义图标字体 |
| `jetbrains-mono-regular.ttf` | JetBrains Mono 等宽字体 |
| `loading-dark.svg` / `loading.svg` / `loading-hc.svg` | 加载动画 |
| `logo.png` | Cursor Logo |
| `opacity-background.png` | 透明背景图 |

### 3.4 `bin/` — CLI 工具

| 文件 | 大小 | 说明 |
|------|------|------|
| `cursor` | 4.8KB | Cursor CLI shell 脚本 |
| `code` | 4.8KB | VS Code 兼容 CLI |
| `cursor-tunnel` | 12.7MB | 远程隧道二进制 |
| `code-tunnel` | → `cursor-tunnel` | 符号链接 |

### 3.5 `resources/helpers/` — 辅助二进制

| 文件 | 大小 | 类型 | 说明 |
|------|------|------|------|
| `node` | 107MB | Mach-O arm64 | 内置 Node.js 运行时 |
| `crepectl` | 4.6MB | Mach-O arm64 | ★ Cursor 特有：CREPE 控制器 |
| `cursorsandbox` | 3.2MB | Mach-O arm64 | ★ Cursor 特有：沙箱执行器 |
| `cursor-terminal-wrapper` | 1.1MB | Mach-O arm64 | ★ Cursor 特有：终端包装器 |

## 4. Cursor 自定义扩展（16 个）

### 4.1 AI 核心扩展

| 扩展名 | 版本 | 描述 | 激活方式 |
|--------|------|------|----------|
| `cursor-agent` | 0.0.1 | Agent 扩展 | `*`（始终激活） |
| `cursor-agent-exec` | 0.0.1 | Agent 执行能力（命令运行、文件交互、工具使用） | `*`（始终激活） |
| `cursor-always-local` | 0.0.1 | 实验功能 + 本地设置 | `onStartupFinished` |
| `cursor-browser-automation` | 1.0.0 | 浏览器自动化 MCP 服务器 | `onStartupFinished` |
| `cursor-mcp` | 0.0.1 | MCP 协议处理 | `onStartupFinished`, `onUri` |

### 4.2 基础设施扩展

| 扩展名 | 版本 | 描述 | 激活方式 |
|--------|------|------|----------|
| `cursor-commits` | 0.0.1 | 请求和提交跟踪 | `onStartupFinished` |
| `cursor-deeplink` | 0.0.1 | Deep-link URI 处理 | `onStartupFinished` |
| `cursor-file-service` | 1.0.0 | 索引和检索服务 | — |
| `cursor-ndjson-ingest` | 0.0.1 | NDJSON 日志摄取 HTTP 服务器 | `onCommand` |
| `cursor-polyfills-remote` | 0.0.1 | 远程扩展主机 Polyfills | `*`（始终激活） |
| `cursor-resolver` | 0.0.1 | Background Composer 远程授权解析器 | `onResolveRemoteAuthority` |
| `cursor-retrieval` | 0.0.1 | 代码索引和检索 | `onStartupFinished` |
| `cursor-shadow-workspace` | 1.0.0 | 影子工作区 | `onStartupFinished` |
| `cursor-socket` | 0.0.1 | TCP/TLS Socket 提供者 | `onResolveRemoteAuthority` |
| `cursor-worktree-textmate` | 0.0.1 | Worktree TextMate 语法高亮 | — |

### 4.3 主题扩展

| 扩展名 | 版本 | 包含主题 |
|--------|------|----------|
| `theme-cursor` | 0.0.2 | Cursor Dark, Cursor Dark Midnight, Cursor Dark High Contrast, Cursor Light |

## 5. 与原版 VS Code 的差异分析

### 5.1 Cursor 新增 Platform 层模块（8 个）

这些模块被注入到 `vs/platform/` 命名空间中，是 Cursor 对 VS Code 底层平台的扩展：

| 模块 | 推测功能 |
|------|----------|
| `vs/platform/agentAnalyticsOperations` | Agent 操作分析追踪 |
| `vs/platform/cursor` | Cursor 核心平台服务 |
| `vs/platform/externalServices` | 外部服务集成 |
| `vs/platform/localAgentRepository` | 本地 Agent 仓库管理 |
| `vs/platform/reactivestorage` | 响应式存储 |
| `vs/platform/structuredLog` | 结构化日志系统 |
| `vs/platform/tracing` | 追踪系统 |
| `vs/platform/webContentExtractor` | 网页内容提取 |

### 5.2 Cursor 新增 Workbench Contrib 模块（20 个）

这些模块在 `vs/workbench/contrib/` 命名空间下，是 Cursor 的 UI 功能贡献：

| 模块 | 推测功能 |
|------|----------|
| `agents` | Agent 模式管理 |
| `aiApplyToFileActionsService` | AI 应用到文件操作 |
| `aiBackgroundComposer` | 后台 AI Composer（Background Agent） |
| `aiConfig` | AI 配置管理 |
| `aiCpp` | AI C++ 特殊处理 |
| `aiDiff` | AI 差异对比 |
| `aiServerConfigService` | AI 服务端配置 |
| `aiSettings` | AI 设置面板 |
| `analytics` | 分析追踪 |
| `appLayout` | 应用布局管理 |
| `composer` | ★ Composer UI（核心聊天/编辑界面） |
| `controlCommon` | 通用控件 |
| `cursorBlame` | AI Blame（代码归因追踪） |
| `markdownPlanEditor` | Markdown 计划编辑器 |
| `mcp` | MCP 协议 UI 集成 |
| `onboarding` | 新手引导 |
| `prettyDialog` | 美化对话框 |
| `recentFilesTrackerService` | 最近文件追踪 |
| `reviewChanges` | AI 变更审查 |
| `ui` | 通用 UI 组件 |

### 5.3 Cursor 新增 Workbench Services 模块（23 个）

这些模块在 `vs/workbench/services/` 命名空间下，是 Cursor 的后端服务：

| 模块 | 推测功能 |
|------|----------|
| `agent` | Agent 服务 |
| `agentData` | Agent 数据管理 |
| `ai` | ★ AI 核心服务 |
| `aiCmdK` | Inline Edit (Cmd+K) 服务 |
| `aiContext` | AI 上下文管理 |
| `aiErrors` | AI 错误处理 |
| `aiSettings` | AI 设置服务 |
| `composer` | Composer 服务层 |
| `cursorAuth` | 认证服务 |
| `cursorCommands` | 自定义命令服务 |
| `cursorHooks` | 钩子系统 |
| `cursorIgnore` | .cursorignore 文件处理 |
| `cursorPlugins` | 插件系统 |
| `cursorRules` | .cursorrules 文件处理 |
| `experiment` | 实验/功能开关 |
| `inlineDiffsV` | 内联差异可视化 |
| `knowledgeBase` | 知识库（@docs 功能） |
| `lexical` | 词法分析/编辑器 |
| `magicLink` | 魔法链接 |
| `modelConfig` | 模型配置管理 |
| `selectedContext` | 选中的上下文管理（@file, @folder 等） |
| `worktree` | Git Worktree 支持 |
| `workspaceCollection` | 工作区集合管理 |

### 5.4 Cursor 特有 CSS 类统计

| 前缀 | 类名数量 | 说明 |
|------|----------|------|
| `.composer*` | 419 | Composer UI 组件 |
| `.ai-*` | 43 | AI 相关 UI |
| `.anysphere*` | 10 | Anysphere 通用组件 |
| 其他 `cursor*` | 302 | 其他 Cursor 组件 |
| **总计** | **774** | |

### 5.5 Cursor 特有 Service 标识符

从 workbench.desktop.main.js 中提取的 Cursor 特有服务：

```
CursorAgentProviderService
cursorAuthenticationService / cursorAuthService / cursorCredsService
cursorCommandsService
cursorExtensionIsolationService / CursorExtensionIsolationService
CursorFSService / cursorfsManagerService
cursorHooksService
cursorIgnoreService
CursorPredictionService / cursorPredictionService / ICursorPredictionService
cursorProclistService
cursorRulesService
cursorServerUrlWarmupService
cursorUpdateService
```

## 6. 关键配置文件摘要

### 6.1 product.json（57KB）

| 配置项 | 值 |
|--------|-----|
| `vscodeVersion` | `1.105.1` |
| `quality` | `stable` |
| `serverApplicationName` | `cursor-server` |
| `serverDataFolderName` | `.cursor-server` |
| `updateUrl` | `https://api2.cursor.sh/updates` |
| `backupUpdateUrl` | `http://cursorapi.com/updates` |
| `downloadUrl` | `https://cursor.com/downloads` |
| `statsigClientKey` | `client-Bm4HJ0aDjXHQVsoACMREyLNxm5p6zzuzhO50MgtoT5D` |
| `statsigLogEventProxyUrl` | `https://api3.cursor.sh/tev1/v1` |
| `cannotImportExtensions` | `github.copilot-chat`, `github.copilot`, `ms-vscode.remote-explorer` |

扩展替换映射（重要）：
- `ms-python.vscode-pylance` → `anysphere.cursorpyright`
- `ms-vscode.cpptools` → `anysphere.cpptools`
- `ms-dotnettools.csharp` → `anysphere.csharp`
- `ms-vscode-remote.remote-ssh` → `anysphere.remote-ssh`
- `ms-vscode-remote.remote-containers` → `anysphere.remote-containers`
- `ms-vscode-remote.remote-wsl` → `anysphere.remote-wsl`

### 6.2 package.json

| 配置项 | 值 |
|--------|-----|
| `name` | `Cursor` |
| `version` | `2.6.11` |
| `author` | `Anysphere, Inc.` |
| `main` | `./out/main.js` |
| `type` | `module` |
| `packageManager` | `npm@1.10.4` |

### 6.3 product.json 中的 dev-only 功能开关

从 `__GULPFILE_REMOVE_LINE_BEFORE_COMPILING__` 前缀可以看到以下内部功能开关：
- `disable_log_sentry` — Sentry 日志
- `disable_statsig` — Statsig 实验平台
- `disable_hmr` — 热模块替换
- `disable_resume` — 恢复功能
- `disable_composer_migration_warning` — Composer 迁移警告
- `disable_rcp_server` — RCP 服务器
- `disable_agent_cli_formatter` — Agent CLI 格式化
- `disable_performance_events` — 性能事件
- `disable_user_intent_agents` — 用户意图 Agent
- `disable_fill_screen` — 全屏填充
- `allow_skip_privacy_mode_grace_period` — 隐私模式宽限期

## 7. 已提取 vs 未提取对比

### 7.1 提取状态

| 来源 | DMG 文件数 | 已提取文件数 | 状态 |
|------|-----------|-------------|------|
| `out/` | 145 | 145 | ✅ 完整 |
| `extensions/` | 919 | 919 | ✅ 完整 |
| `node_modules/` | 16,473 | 16,473 | ✅ 完整 |

**结论：extracted/cursor-app/ 目录已经是完整提取，与 DMG 内容完全一致。**

### 7.2 extracted/cursor-modules/ — 之前的反混淆模块

之前在 `extracted/cursor-modules/` 中提取了部分反混淆的 AI 模块，包含：
- `vs/` 目录下的反混淆 TypeScript 文件
- `composer-related.css` — Composer 相关 CSS
- `MODULE_INDEX.txt` — 模块索引

这些是从 `workbench.desktop.main.js` 中手动提取并反混淆的部分代码，覆盖了部分 AI 模块但不是全部。

### 7.3 重要发现

**Cursor 的代码打包方式与 VS Code 不同**：

1. **Cursor 不使用 asar 打包** — 所有文件直接在文件系统中
2. **核心 AI 代码全部打包在 `workbench.desktop.main.js`（51MB）** — 不是独立文件
3. **workbench.desktop.main.css（1.7MB）** 包含所有样式，其中 774 个 CSS 类是 Cursor 独有的
4. **16 个自定义扩展** 提供额外的 Agent/MCP/检索等功能
5. **3 个自定义原生二进制** (crepectl, cursorsandbox, cursor-terminal-wrapper) 提供沙箱和终端功能
6. **product.json（57KB）** 包含大量配置，包括扩展替换映射、功能开关、API 端点等

## 8. node_modules 关键依赖

### 8.1 Cursor/Anysphere 私有包

| 包名 | 版本 | 说明 |
|------|------|------|
| `@anysphere/policy-watcher` | 1.3.2-cursor.2 | 策略监控 |

### 8.2 重要第三方依赖（非标准 VS Code）

| 包名 | 说明 |
|------|------|
| `@bufbuild/*` | Protocol Buffers / Connect-RPC |
| `@connectrpc/*` | gRPC-Web 通信框架 |
| `@sentry/*` | 错误追踪 |
| `@tanstack/*` | 状态管理 |
| `@prisma/*` | 数据库 ORM |
| `@fastify/*` | HTTP 服务器框架 |
| `@opentelemetry/*` | 可观测性 |
| `cheerio` | HTML 解析 |
| `@jimp/*` | 图像处理 |
| `@novnc/*` | VNC 客户端（浏览器自动化） |

总依赖包数量：**328 个顶层包**

## 9. 架构关键洞察

### 9.1 代码组织

Cursor 的代码架构在 VS Code 基础上做了三层扩展：

1. **Platform 层**（`vs/platform/`）：添加了 8 个新模块，主要是追踪、存储、Agent 仓库等基础设施
2. **Workbench Services 层**（`vs/workbench/services/`）：添加了 23 个新模块，是 AI 功能的后端服务
3. **Workbench Contrib 层**（`vs/workbench/contrib/`）：添加了 20 个新模块，是 AI 功能的 UI 组件

### 9.2 通信架构

从依赖分析可以看出：
- **gRPC-Web / Connect-RPC**：用于与 AI 后端服务通信（protobuf 定义 + @connectrpc）
- **WebSocket**：可能用于实时流式响应
- **Sentry**：集成在主进程入口，用于错误追踪
- **Statsig**：A/B 测试和功能开关平台
- **OpenTelemetry**：分布式追踪

### 9.3 安全沙箱

Cursor 拥有专门的安全沙箱架构：
- `cursorsandbox`（3.2MB 原生二进制）— 沙箱执行器
- `crepectl`（4.6MB 原生二进制）— CREPE 控制器（可能是权限控制）
- `cursor-terminal-wrapper`（1.1MB 原生二进制）— 终端命令包装器

这表明 Cursor 在 Agent 执行用户代码时有严格的沙箱隔离机制。
