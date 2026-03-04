# Claude Desktop App 逆向分析计划

> 基于对 Claude.dmg (v1.1.4498) 实际挂载和 asar 解包后的发现制定

## 1. 应用基本信息

| 属性 | 值 |
|------|------|
| 应用名称 | Claude (com.anthropic.claudefordesktop) |
| 版本 | 1.1.4498 |
| 构建工具 | Electron 40.4.1 + Vite 6.4.1 + electron-forge |
| UI 框架 | React 18 + Tailwind CSS 3.4 |
| 语言 | TypeScript (编译后) |
| 状态管理 | RxJS |
| 字体 | Anthropic Sans (Variable) + Anthropic Serif (Variable) |
| IPC 库 | @marshallofsound/ipc 2.6.2 |
| AI SDK | @anthropic-ai/claude-agent-sdk 0.2.51 |
| MCP SDK | @modelcontextprotocol/sdk 1.26.0 |
| 图标库 | @phosphor-icons/react 2.1.4 |
| 错误追踪 | Sentry |
| 国际化 | react-intl (@formatjs) |
| Node.js | >=22.0.0 |
| 最低系统 | macOS 12.0 |

## 2. 文件结构概览

### 2.1 DMG 挂载后的结构

```
/tmp/claude-mount/Claude.app/Contents/
├── Info.plist                    # 应用元信息
├── MacOS/Claude                  # 主可执行文件
├── Frameworks/
│   ├── Electron Framework.framework
│   ├── Claude Helper.app         # 主辅助进程
│   ├── Claude Helper (GPU).app   # GPU 进程
│   ├── Claude Helper (Plugin).app # 插件进程
│   ├── Claude Helper (Renderer).app # 渲染进程
│   ├── Mantle.framework          # Objective-C 模型框架
│   ├── ReactiveObjC.framework    # 响应式 ObjC
│   └── Squirrel.framework        # 自动更新
├── Helpers/
│   ├── chrome-native-host        # Chrome 原生消息宿主
│   └── disclaimer                # 免责声明工具
└── Resources/
    ├── app.asar                  # 主应用包 (~13.3MB)
    ├── app.asar.unpacked/        # 原生模块
    │   └── node_modules/
    │       ├── @ant/claude-native/   # 原生 Node.js 模块 (.node)
    │       ├── @ant/claude-swift/    # Swift 原生模块 (.node)
    │       └── node-pty/             # 终端伪 PTY
    ├── fonts/
    │   ├── AnthropicSans-Italics-Variable-25x258.ttf
    │   ├── AnthropicSans-Romans-Variable-25x258.ttf
    │   ├── AnthropicSerif-Italics-Variable-25x258.ttf
    │   └── AnthropicSerif-Romans-Variable-25x258.ttf
    ├── claude-ssh/               # SSH 远程连接工具
    │   ├── claude-ssh-darwin-amd64
    │   ├── claude-ssh-darwin-arm64
    │   ├── claude-ssh-linux-amd64
    │   ├── claude-ssh-linux-arm64
    │   └── version.txt
    ├── default.clod              # 默认模型配置 (?)
    ├── EchoTray*.png             # 系统托盘图标 (1x/2x/3x)
    ├── electron.icns             # 应用图标
    ├── *.json                    # 多语言翻译文件 (en-US, de-DE, fr-FR, etc.)
    └── *.lproj/                  # macOS 本地化
```

### 2.2 asar 解包后的结构

```
extracted/claude-app/
├── package.json                  # 应用配置
├── .vite/
│   ├── build/                    # 主进程代码
│   │   ├── index.pre.js          # 预加载/启动脚本 (~592KB)
│   │   ├── index.js              # 主进程核心 (~4.5MB, 1335行 minified)
│   │   ├── mainWindow.js         # 主窗口预加载 (~153KB)
│   │   ├── mainView.js           # 主视图预加载 (~123KB)
│   │   ├── aboutWindow.js        # 关于窗口 (~140KB)
│   │   ├── quickWindow.js        # 快速输入窗口 (~140KB)
│   │   ├── findInPage.js         # 页面内搜索 (~138KB)
│   │   ├── echoWindows.js        # Echo 窗口 (~6.7KB)
│   │   ├── mcp-runtime/
│   │   │   └── nodeHost.js       # MCP 服务器宿主进程 (~3.6KB)
│   │   ├── shell-path-worker/    # Shell PATH 获取 worker
│   │   └── window-shared.css     # 共享 CSS (~5KB) ★ 核心设计 Token
│   └── renderer/                 # 渲染进程代码
│       ├── main_window/
│       │   ├── index.html        # 主窗口 HTML (含完整 Tailwind CSS, 3844行)
│       │   ├── window-shared.css
│       │   └── assets/
│       │       ├── main-D_pzgCQe.js      # 主渲染 JS (~289KB)
│       │       ├── MainWindowPage-DXEzOgrP.js  # 标题栏组件 (~13.5KB)
│       │       ├── Anthropic*.ttf         # 字体文件
│       ├── quick_window/
│       │   ├── quick-window.html
│       │   └── assets/
│       │       └── main-hujRGrEG.js       # 快速窗口渲染 (~341KB)
│       ├── about_window/
│       │   ├── about.html
│       │   └── assets/
│       │       ├── main-BuOSfaYB.js
│       │       └── AboutWindow-CsEzqfLe.js
│       └── find_in_page/
│           └── ...
└── node_modules/
    ├── @ant/claude-native/       # → 指向 unpacked
    ├── @ant/claude-swift/        # → 指向 unpacked
    ├── node-pty/                 # → 指向 unpacked
    └── ws/                       # WebSocket 库 v8.18.3
```

## 3. 逆向分析计划

### 3.1 UI 规范提取 (最高优先级)

#### 已发现的 CSS 变量系统

**核心设计 Token 位置**: `extracted/claude-app/.vite/build/window-shared.css`

已提取到完整的 CSS 变量系统，包括：

**亮色主题 (`:root`)**：
- `--accent-brand`: 15 63.1% 59.6% (HSL 格式，Clay 橙色 #d97757)
- `--accent-main-*`: 0-900 级别主强调色
- `--accent-pro-*`: Pro 版紫色系 (251度色相)
- `--accent-secondary-*`: 蓝色系辅色 (210度色相)
- `--bg-000 ~ --bg-500`: 背景色层级 (从白到米灰)
- `--border-100 ~ --border-400`: 边框色
- `--danger-*`: 红色危险色
- `--success-*`: 绿色成功色
- `--text-000 ~ --text-500`: 文字色层级
- `--oncolor-*`: 反色文字 (用于色块上的文字)

**暗色主题 (`.darkTheme`)**：
- 完整的暗色主题对应变量 (已全部提取)

**传统变量**：
- `--claude-foreground-color`, `--claude-background-color` 等
- `--claude-accent-clay: #d97757` (Claude 标志性橙色)
- `--kraft`, `--book-cloth`, `--manilla`, `--clay` 等命名颜色

**字体系统**：
- 主字体: `Anthropic Sans` (Variable TTF, Roman + Italic)
- 衬线字体: `Anthropic Serif` (Variable TTF, Roman + Italic)
- 等宽字体: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
- 系统字体回退: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`

#### 下一步提取计划

1. **Tailwind 配置提取**: 从 `index.html` 中已编译的 Tailwind CSS 提取所有自定义颜色映射、间距、圆角等 Token
2. **组件样式提取**: 从渲染器 JS 中的 className 字符串提取按钮、输入框等组件样式
3. **动画/过渡效果**: 搜索 `transition`, `animation`, `ease` 等 CSS 属性
4. **阴影系统**: 搜索 `shadow`, `drop-shadow` 等
5. **圆角规则**: 搜索 `rounded-` Tailwind 类名

#### 已发现的 Tailwind 组件样式 (来自 MainWindowPage)

**按钮变体** (`Button` 组件):
- `primary`: `bg-text-000 text-bg-000` + 悬停缩放动画 + 径向渐变底部高亮
- `secondary`: `text-text-000 border-0.5 border-border-300` + 悬停 `bg-bg-400`
- `flat`: `bg-accent-main-000 text-oncolor-100` + 悬停 `bg-accent-main-200`
- `ghost`: `text-text-300` + 悬停 `bg-bg-400` + `aria-pressed:bg-bg-400`
- `danger`: `bg-danger-200 text-oncolor-100` + 悬停缩放

**按钮尺寸**:
- `default`: `h-9 px-4 py-2 rounded-lg min-w-[5rem] text-sm`
- `sm`: `h-8 rounded-md px-3 text-xs min-w-[4rem]`
- `lg`: `h-11 rounded-[0.6rem] px-5 min-w-[6rem]`
- `icon`: `h-9 w-9 rounded-md`
- `icon_xs`: `h-6 w-6 rounded-md`
- `icon_sm`: `h-8 w-8 rounded-md`
- `icon_lg`: `h-11 w-11 rounded-[0.6rem]`

**标题栏高度**:
- macOS 主窗口: 36px (非 Mac: 0px)
- 其他窗口: 36px (非 Mac: 28px)

### 3.2 架构分析

#### 已发现的窗口架构

Claude Desktop 使用 **混合架构**：本地 Electron 壳 + 远程 claude.ai 网页

**窗口类型**:
| 窗口 | 预加载脚本 | 用途 |
|------|-----------|------|
| Main Window | mainWindow.js | 主聊天界面 (加载 claude.ai) |
| Main View | mainView.js | 内嵌 WebView/BrowserView |
| Quick Window | quickWindow.js | 快速输入 (全局快捷键触发) |
| About Window | aboutWindow.js | 关于对话框 |
| Find in Page | findInPage.js | 页面内搜索 |
| Echo Windows | echoWindows.js | 系统托盘快捷入口 |

**关键发现**:
- 主窗口的 HTML 标注: "this is the html for app title bar and error UI. everything else gets loaded from claude.ai"
- 也就是说，Claude Desktop 的主要 UI 实际来自 **claude.ai 远程网页**，本地只渲染标题栏和错误界面
- 通过 `contextBridge` 暴露 `claude.internal.ui` 命名空间到渲染进程
- 使用 `@marshallofsound/ipc` 进行类型安全的 IPC 通信

**IPC 通信命名空间**:
- `claude.internal.ui` — UI 交互 (MainWindow, QuickWindow, AboutWindow)
- `claude.internal.findInPage` — 页面内搜索

**主窗口 Bridge API (从 MainWindowPage 分析)**:
```typescript
globalThis["claude.internal.ui"] = {
  MainWindowTitleBar: {
    onUpdateTitleBar(callback: (title: string) => void): void
    onShowLoadError(callback: (details: ErrorDetails) => void): void
    onHideLoadError(callback: () => void): void
    titleBarReady(): void
    isClaudeCurrentlyHealthy(): Promise<boolean>
    requestReloadMainView(): void
  },
  AboutWindow: { ... },
  QuickWindow: { ... }
}
```

#### 下一步架构分析计划

1. **mainWindow.js 分析**: 提取完整的 contextBridge API 定义
2. **index.js 分析**: 分析主进程的模块组织和核心逻辑
3. **IPC 通道完整列表**: 提取所有 IPC 通信通道
4. **窗口创建配置**: BrowserWindow 的配置参数 (尺寸、安全策略等)

### 3.3 Claude Code 调用方式分析

#### 已发现的关键信息

**Agent SDK 集成**:
- 使用 `@anthropic-ai/claude-agent-sdk` (v0.2.51) 作为 Claude Code 的核心调用库
- 同时引入了 `@anthropic-ai/claude-agent-sdk-future` (v0.2.54-dev) 测试版
- 在主进程中有 193 处 `LocalAgentMode` 引用 — 这是 Claude Code 的本地运行模式

**Claude Code 执行方式**:
```
pathToClaudeCodeExecutable → 找到 Claude Code CLI 路径
spawnClaudeCodeProcess → 通过子进程启动 Claude Code
```

**核心参数** (从 `spawnClaudeCodeProcess` 分析):
```typescript
{
  pathToClaudeCodeExecutable: string,    // CLI 路径
  executableArgs: string[],              // CLI 参数
  cwd: string,                           // 工作目录
  env: Record<string, string>,           // 环境变量
  model: string,                         // 模型名
  fallbackModel: string,                 // 备选模型
  permissionMode: PermissionMode,        // 权限模式 (Bypass/Auto/Default)
  thinkingConfig: unknown,               // 思考配置
  maxTurns: number,                      // 最大轮次
  maxBudgetUsd: number,                  // 最大预算 (美元)
  jsonSchema: unknown,                   // JSON Schema
  allowDangerouslySkipPermissions: boolean,
  permissionPromptToolName: string,
  continueConversation: boolean,
  resume: string,                        // 恢复会话 ID
  sessionId: string,
  settingSources: unknown[],             // 设置来源
  allowedTools: string[],
  disallowedTools: string[],
  tools: unknown,
  mcpServers: unknown,                   // MCP 服务器配置
  strictMcpConfig: boolean,
  canUseTool: boolean,
  includePartialMessages: boolean,
  persistSession: boolean,
  plugins: unknown,
  sandbox: unknown,                      // 沙箱配置
  hooks: boolean,
  systemPrompt: string,
  appendSystemPrompt: string,
  agents: unknown,
  promptSuggestions: unknown
}
```

**MCP Runtime 实现** (nodeHost.js):
- MCP 服务器通过 Electron `utilityProcess` (Worker Thread) 运行
- 使用 `MessagePort` 进行 stdin/stdout 桥接
- 支持运行任意 Node.js 入口点作为 MCP 服务器
- 进程间通信: `{type: "stdout"|"stderr"|"stdin", content|data: string}`

**MCP 相关事件**:
- `mcp_setup`, `mcp_status`, `mcp_toggle`, `mcp_reconnect`
- `mcp_message`, `mcp_tool_use`, `mcp_authenticate`, `mcp_clear_auth`
- `mcp_set_servers`
- 内置 MCP 工具: `mcp__cowork__*`, `mcp__plugins__*`, `mcp__spaces__*`, `mcp__scheduled-tasks__*`, `mcp__mcp-registry__*`

#### 下一步 Claude Code 分析计划

1. **Agent SDK 集成细节**: 分析 `claude-agent-sdk` 的初始化和使用方式
2. **Session 管理**: 会话创建、恢复、持久化机制
3. **工具调用流程**: 从用户输入到工具执行的完整流程
4. **Permission 系统**: 权限模式的实现
5. **环境变量**: `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_ENTRYPOINT` 等

### 3.4 Cowork 架构分析

#### 已发现的关键信息

**VM 隔离机制**:
- Cowork 使用 **Linux VM** 进行隔离执行 (不是容器)
- VM 相关字符串: `vmlinuz`, `vmdk`, `vm-info.json` 表明使用标准 Linux 内核
- 存在远程平台检测: `linux-x64`, `linux-arm64`, `linux-x64-musl`, `linux-arm64-musl`
- VM 下载: 从 `downloads.claude.ai/vms/linux/` 获取 VM 镜像
- VM 使用状态机: boot → running → disconnected/stopped
- 支持 `claude-swift` 原生模块 — 可能使用 Apple Virtualization Framework

**Cowork 限制**:
- 不支持 Windows on Arm
- macOS 某些功能需要 13.0+, 某些需要 14.0+
- 用户可以禁用 Cowork
- 组织管理员可以禁用 Claude Code for Desktop

**Cowork MCP 工具**:
- `mcp__cowork__allow_cowork_file_delete` — 文件删除授权
- `mcp__cowork__present_files` — 展示文件
- `mcp__cowork__request_cowork_directory` — 请求工作目录

**文件共享机制**:
- 挂载路径: `./mnt/.claude`
- 配置目录: `/sessions/{sessionId}/mnt/.claude`
- 环境变量: `CLAUDE_CONFIG_DIR=/sessions/{n}/mnt/.claude`
- Worktree 支持: 可创建 Git worktree 进行隔离开发
- 远程 Worktree: `{baseRepo}/.claude/worktrees/{name}`

**VM 管理功能**:
- 删除 VM Sessions 并重启
- 删除 VM Bundle 并重启
- VM 调试日志
- VM 健康监控

**定时任务系统**:
- `cowork_scheduled_tasks_created/deleted/disabled/enabled/run/updated`
- `mcp__scheduled-tasks__list_scheduled_tasks`

**Claude Code CLI 部署到远程**:
- 通过 `claude-ssh` 工具部署到远程 Linux 环境
- 下载 CLI 二进制: `downloads.claude.ai/{version}/{platform}/claude.zst` (zstd 压缩)
- 支持校验: checksum 验证

#### 下一步 Cowork 分析计划

1. **VM 生命周期**: 启动、连接、断开、停止的完整流程
2. **文件共享桥接**: 宿主与 VM 之间的文件同步机制
3. **Claude Code 远程执行**: 在 VM 中运行 Claude Code 的方式
4. **定时任务**: 调度机制和持久化

### 3.5 扩展系统 (DXT) 分析

#### 已发现的关键信息

- 扩展文件格式: `.dxt` (Desktop Extension), `.mcpb` (MCP Bundle)
- `.skill` 文件: 技能文件 (最大 30MB)
- 扩展安装和管理
- 组织级别的扩展限制
- 自动更新支持
- 安全签名验证
- 扩展阻止列表: `extensions-blocklist.json`

### 3.6 其他功能

**Chrome 原生集成**:
- `chrome-native-host` 二进制: 支持 Chrome 浏览器原生消息
- `@ant/claude-for-chrome-mcp`: Chrome 浏览器 MCP 集成
- 登录同步: "Login to Claude in Chrome", "Make sure you are signed in to Claude in Chrome with the same account"

**语音输入**:
- 麦克风权限请求
- 语音识别权限
- Quick Entry 支持语音听写 (`quickEntryDictationShortcut`)

**自动更新**:
- Squirrel.framework (macOS 自动更新)
- 静默更新支持 (`performStealthUpdate`)

**SSH 远程连接**:
- `claude-ssh` 工具 (多平台: darwin-amd64, darwin-arm64, linux-amd64, linux-arm64)
- 支持远程开发场景

## 4. 执行步骤

### Phase 1: CSS/设计 Token 完整提取 (已部分完成)
```bash
# ★ 已完成: 核心 CSS 变量提取
# window-shared.css 中的所有设计 token

# 待完成: 从 Tailwind CSS 编译输出提取更多 token
# 从 index.html (3844行) 中提取所有自定义 Tailwind 类
# 从渲染器 JS 中提取组件 className

# 提取颜色映射
grep -oE 'bg-[a-z]+-[0-9]+|text-[a-z]+-[0-9]+|border-[a-z]+-[0-9]+' index.html | sort -u

# 提取间距和圆角
grep -oE 'rounded-[a-z0-9\[\].]+|p[xytblr]?-[0-9a-z\[\].]+|m[xytblr]?-[0-9a-z\[\].]+|gap-[0-9a-z\[\].]+' index.html | sort -u
```

### Phase 2: 组件库分析
```bash
# 提取 React 组件名
grep -oE '[A-Z][a-zA-Z]+\.displayName\s*=\s*"[^"]*"' renderer/main_window/assets/*.js

# 提取所有使用的 Phosphor 图标
grep -oE 'from.*phosphor-icons.*import[^;]+' renderer/main_window/assets/*.js
```

### Phase 3: 主进程架构分析
```bash
# 分析 IPC 通道 (已部分完成)
# 分析窗口创建
grep -oE 'new BrowserWindow\([^)]+\)' index.pre.js

# 分析路由
grep -oE '"/(claude-code-desktop|chat|settings)[^"]*"' index.js
```

### Phase 4: Agent SDK 深入分析
```bash
# 分析 Claude Code 执行流程
# 搜索 session 创建和管理逻辑
grep -oE 'createSession|startSession|resumeSession' index.js

# 分析权限系统
grep -oE 'permissionMode|PermissionMode|ec\.[A-Z][a-z]+' index.js | sort -u
```

### Phase 5: Cowork VM 深入分析
```bash
# 分析 VM 启动流程
grep -oE 'startVM|bootVM|vmClient|VmService' index.js | sort -u

# 分析文件挂载
grep -oE 'mount|Mount|MOUNT' index.js | sort -u
```

## 5. 风险评估

### 知识产权边界

**可以提取 (客观数据/设计规范)**:
- CSS 变量值 (颜色代码、数值) — 属于视觉规范的客观数据
- 字体名称和使用方式 — 但不能重新分发字体文件本身
- 组件尺寸和间距数值
- 架构模式和交互设计思路

**不可以复制**:
- Anthropic Sans / Anthropic Serif 字体文件 — 专有字体，需获取授权或替代
- 编译后的 JS 源码 — 受版权保护
- SVG 图标和图片资源 — 使用 Phosphor Icons (MIT) 可替代
- Sentry 配置和密钥
- API 端点和认证逻辑

### 技术难度评估

| 难度 | 项目 | 说明 |
|------|------|------|
| 低 | CSS Token 提取 | 已在 window-shared.css 中明文存储 |
| 低 | 字体系统 | 字体名称已知，可用开源替代 |
| 中 | Tailwind 配置还原 | 需从编译输出逆推 tailwind.config |
| 中 | 组件样式提取 | JS 中的 className 需要解析 |
| 中 | IPC 通道分析 | minified 代码但模式明确 |
| 高 | Agent SDK 协议 | 调用约定复杂，参数多 |
| 高 | VM 隔离机制 | 涉及原生模块和 Apple VF |
| 高 | MCP Runtime | 需理解完整的消息路由 |

### 代码混淆情况

- **混淆程度**: 中等 — Vite 生产构建 (minify + tree-shake)
- **变量名**: 被压缩为短名称 (a, b, c 等)
- **字符串**: 大部分保留原文 (非常有利于分析)
- **结构**: 代码结构基本保留 (类、函数边界可识别)
- **Source Maps**: 未包含 (生产构建)
- **原生模块**: `.node` 文件为编译后的二进制，无法直接阅读

## 6. 输出文档规划

完成分析后，将产出以下文档：

1. `docs/claude-ui-spec.md` — Claude UI 完整设计规范
   - 配色方案 (HSL 值 + HEX 转换)
   - 字体系统
   - 间距/圆角/阴影系统
   - 组件样式规范 (按钮、输入框、对话框等)
   - 动画/过渡规范

2. `docs/claude-code-integration.md` — Claude Code 集成方案
   - Agent SDK 使用方式
   - 进程通信协议
   - Session 管理
   - 权限系统

3. `docs/reverse-engineering/claude-app/architecture.md` — 架构详细分析
   - 窗口系统
   - IPC 通信
   - 状态管理
   - 扩展系统

4. `docs/reverse-engineering/claude-app/cowork-analysis.md` — Cowork 功能分析
   - VM 架构
   - 文件共享
   - 远程执行
