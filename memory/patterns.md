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
- 500+ 个 agent.v1.* protobuf 类型定义了完整 Agent API
- 30+ 种工具调用类型（Edit/Read/Shell/Grep/MCP/SubAgent 等）
- Background Agent 通过 agent.api5.cursor.sh 通信，多区域部署

## Cowork 集成模式

### 内置扩展架构
- 3 个 Bundled Extension: claude-cowork-core + claude-cowork-editors + claude-mcp-host
- 使用 VS Code Custom Editor API 支持非代码文件格式
- Webview 中集成第三方编辑器（Tiptap、Univer、PDF.js）

### Agent Core 共享模式
- Code 模式和 Cowork 模式共享同一个 Claude Code CLI 会话
- 通过动态切换 Tool Set 区分模式，而非重启会话
- Claude Code CLI 通过 stdin/stdout JSON Stream 通信

### 渐进式安全模型
- Level 0: IDE 内置操作（无隔离）
- Level 1: Electron Sandbox + 文件路径白名单（默认）
- Level 2: 增强沙箱（macOS sandbox-exec / Linux bubblewrap）
- Level 3: VM 隔离（可选，企业场景）

### MCP 双角色模式
- IDE 同时是 MCP Host（管理外部 Server 连接）和 MCP Server（暴露 IDE 能力）
- 兼容 Claude Desktop 的 MCP 配置格式
