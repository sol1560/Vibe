# Claude Editor — 整体架构方案 v1.0

> 综合 Claude Desktop App 逆向、Cursor IDE 逆向、Cowork 集成方案三方成果
> 编写日期：2026-03-04
> 编写者：Team Lead（综合 reverse-engineer-claude、reverse-engineer-cursor、architect 的分析）

---

## 1. 项目定位

**Claude Editor** 不只是一个 AI 代码编辑器，而是一个 **全能 AI 工作站**：

```
┌──────────────────────────────────────────────────┐
│              Claude Editor                        │
│                                                  │
│   ┌─────────────┐    ┌──────────────────────┐    │
│   │  Code Mode  │    │    Cowork Mode        │    │
│   │  开发者模式  │ ⇄  │    协作模式           │    │
│   │             │    │                      │    │
│   │ • 代码编辑   │    │ • 文档编辑            │    │
│   │ • 终端      │    │ • 表格分析            │    │
│   │ • Git       │    │ • PPT 生成            │    │
│   │ • 调试      │    │ • PDF 查看            │    │
│   │ • AI Agent  │    │ • AI Agent            │    │
│   └─────────────┘    └──────────────────────┘    │
│                                                  │
│         ┌──────────────────────────┐             │
│         │    Claude Agent Core     │             │
│         │  (Claude Code CLI/SDK)   │             │
│         │  + MCP Host + MCP Server │             │
│         └──────────────────────────┘             │
└──────────────────────────────────────────────────┘
```

**三个核心目标**：
1. **Claude 品牌体验** — 完整采用 Anthropic 设计语言（已从 Claude Desktop 提取到全套设计 Token）
2. **Claude Code 深度集成** — 原生集成 Claude Code，对标 Cursor 的 Composer/Agent 体验
3. **Cowork 工作流** — 支持非代码文件处理，面向产品经理、分析师等非技术用户

---

## 2. 技术基座

### 2.1 基于 Code OSS Fork

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 基础框架 | Code OSS (VS Code 开源版) | Cursor 验证了可行性，成熟的编辑器基础 |
| 上游版本 | VS Code 1.105.x+ | 与 Cursor 2.6.11 使用的版本对齐 |
| Electron | 40.x（与 Claude Desktop 对齐） | 最新安全补丁 + Node.js 22 支持 |
| 语言 | TypeScript 5.x | 严格模式 |
| 构建 | Electron Builder | 避免 Cursor 使用的 todesktop 方案 |
| 包管理 | pnpm | 更好的 monorepo 支持 |

### 2.2 与上游同步策略

```
Code OSS (upstream)
  │
  ├─ fork ──► Claude Editor (our repo)
  │            ├── src/vs/workbench/contrib/claude/    ← AI 核心（新增目录）
  │            ├── src/vs/workbench/contrib/cowork/    ← Cowork 核心（新增目录）
  │            ├── src/vs/workbench/services/claude/   ← Claude 服务层（新增）
  │            ├── src/vs/workbench/services/mcp/      ← MCP 服务层（新增）
  │            ├── extensions/claude-cowork-editors/    ← 非代码编辑器（内置扩展）
  │            └── extensions/claude-theme/            ← Claude 主题（内置扩展）
  │
  定期 rebase / merge upstream
```

**关键原则**：所有新增代码放在独立目录，不修改上游文件（仅在必要的注册入口添加引用），最大化上游同步能力。

---

## 3. 核心架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: UI / 用户界面                                          │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │ Composer  │ │ Agent    │ │ Cowork   │ │ Custom Editors   │  │
│   │ Panel     │ │ Layout   │ │ Panel    │ │ (Doc/Sheet/PPT)  │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: AI 功能层                                              │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ Claude Composer (统一 AI 入口)                            │  │
│   │  ├── Chat Mode (对话)                                    │  │
│   │  ├── Agent Mode (自主执行)                                │  │
│   │  ├── Plan Mode (规划审批)                                 │  │
│   │  └── Cowork Mode (非代码工作流)                           │  │
│   └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Agent Core / 核心引擎                                   │
│   ┌──────────────────────┐  ┌────────────────────────────────┐ │
│   │ Claude Code Runner   │  │ Tool System                    │ │
│   │ (claude-agent-sdk +  │  │  ├── Code Tools (编辑/终端/Git)│ │
│   │  spawnClaudeCode)    │  │  ├── Cowork Tools (文件/分析)  │ │
│   │                      │  │  └── MCP Tools (外部连接)      │ │
│   └──────────────────────┘  └────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: 平台服务层                                              │
│   ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐   │
│   │ MCP Host  │ │ MCP Server│ │ Session    │ │ Security   │   │
│   │ Service   │ │ Service   │ │ Manager    │ │ Sandbox    │   │
│   └───────────┘ └───────────┘ └────────────┘ └────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: VS Code 基础平台                                        │
│   Editor Core │ Extension Host │ File System │ Terminal │ ...  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 关键架构决策：混合集成策略

经过综合分析 Cursor（核心集成）和原始 Cowork 方案（扩展集成），采用 **混合方案**：

| 模块 | 位置 | 理由 |
|------|------|------|
| Claude Composer（统一 AI 入口） | `workbench/contrib/claude/` 核心 | 性能 + 深度集成，参考 Cursor |
| Agent Core（Claude Code 集成） | `workbench/services/claude/` 核心 | 需要访问 VS Code 内部 API |
| MCP Host/Server | `workbench/services/mcp/` 核心 | 平台级能力，所有模式都依赖 |
| Cowork 控制面板 | `workbench/contrib/cowork/` 核心 | 需要深度 UI 集成 |
| 文档编辑器（Tiptap） | `extensions/claude-cowork-editors/` 扩展 | 模块化，可独立更新 |
| 表格编辑器（Univer） | `extensions/claude-cowork-editors/` 扩展 | 模块化，重量级依赖 |
| PPT 预览/生成 | `extensions/claude-cowork-editors/` 扩展 | 模块化 |
| PDF 查看器 | `extensions/claude-cowork-editors/` 扩展 | 模块化 |
| Claude 主题 | `extensions/claude-theme/` 扩展 | 主题系统天然适合扩展形式 |
| MCP 配置 UI / 调试面板 | `extensions/claude-mcp/` 扩展 | UI 频繁变化，放扩展更灵活 |
| IDE MCP Server | `extensions/claude-mcp/` 扩展 | Tool/Resource 定义频繁迭代 |

### 3.3 Internal API 边界（核心 ↔ 内置扩展）

核心模块通过 `ClaudeEditorInternalAPI` 向内置扩展暴露能力，明确契约边界：

```typescript
// src/vs/workbench/services/claude/common/claudeEditorAPI.ts

interface ClaudeEditorInternalAPI {
  // Agent Core — 会话和工具管理
  readonly agentCore: {
    getCurrentSession(): AgentSession;
    setToolSet(mode: 'code' | 'cowork', tools: string[]): void;
    onToolCall: Event<ToolCallEvent>;
    onStreamChunk: Event<StreamChunk>;
  };

  // MCP — 连接和协议操作
  readonly mcp: {
    getConnectedServers(): McpServerInfo[];
    callTool(server: string, tool: string, args: any): Promise<any>;
    readResource(server: string, uri: string): Promise<any>;
    registerIdeServer(server: McpServer): void;
  };

  // Mode — 模式切换
  readonly mode: {
    currentMode: 'code' | 'cowork';
    onModeChange: Event<ModeChangeEvent>;
  };
}
```

**注意**：此 API 仅对 Bundled Extension 开放，不暴露给第三方扩展。第三方扩展通过标准 VS Code Extension API 交互。

---

## 4. Claude 品牌设计系统

### 4.1 已提取的设计 Token（来自 Claude Desktop 逆向）

**品牌色**：
```css
--brand-primary: #d97757;          /* Claude 标志性橙色 */
--brand-gradient: linear-gradient(#d97757, #c4663e);
```

**配色体系（暗色主题）**：
```css
/* 背景层级 */
--bg-100: #1a1a1e;    /* 最深 - 侧边栏 */
--bg-200: #212126;    /* 编辑器背景 */
--bg-300: #2a2a30;    /* 面板背景 */

/* 文字层级 */
--text-primary: #e8e4de;
--text-secondary: #a8a29e;
--text-tertiary: #6b6560;

/* 语义色 */
--accent: #d97757;
--success: #4ade80;
--warning: #fbbf24;
--error: #ef4444;
```

**字体系统**：
```css
--font-sans: 'Anthropic Sans Variable', system-ui, sans-serif;
--font-serif: 'Anthropic Serif Variable', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* 字号层级 */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 20px;
--text-2xl: 24px;
```

**注意**：Anthropic Sans/Serif 是专有字体，我们需要：
1. 联系 Anthropic 获取授权，或
2. 使用视觉接近的开源替代字体（如 Inter / Source Serif Pro）
3. 先用系统字体开发，后续确认字体方案

### 4.2 主题实现方案

基于 VS Code 主题系统实现，参考 Cursor 的 4 种主题变体：

```
extensions/claude-theme/
├── package.json
├── themes/
│   ├── claude-dark.json         # 主暗色主题（默认）
│   ├── claude-light.json        # 亮色主题
│   ├── claude-dark-dimmed.json  # 柔和暗色
│   └── claude-warm.json         # 暖色调（Claude 特色）
└── fonts/
    └── (字体文件，待确认授权)
```

---

## 5. Claude Composer — 统一 AI 入口

### 5.1 设计灵感

综合 Cursor 的 Composer 系统和 Claude Desktop 的交互模式：

```
┌──────────────────────────────────────────────┐
│  Claude Composer                    ─ □ ✕   │
├──────────────────────────────────────────────┤
│                                              │
│  [Chat] [Agent] [Plan] [Cowork]   模式选项卡  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Claude: 好的，我来帮你分析这个数据集。  │  │
│  │                                        │  │
│  │ > 正在读取 data.csv...                 │  │
│  │ > 发现 1,234 行数据                    │  │
│  │ > 生成分析报告...                      │  │
│  │                                        │  │
│  │ ┌──────────────────────────────────┐   │  │
│  │ │ 📊 分析结果                      │   │  │
│  │ │ • 平均值: 42.5                   │   │  │
│  │ │ • 异常值: 3 个                   │   │  │
│  │ └──────────────────────────────────┘   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 请描述你想要做的事...           ⌘Enter │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 5.2 四种模式

| 模式 | 用途 | Tool Set |
|------|------|----------|
| **Chat** | 快速问答、代码解释 | 无工具，纯对话 |
| **Agent** | 自主完成编码任务 | Code Tools（编辑、终端、Git、搜索） |
| **Plan** | 规划复杂任务，需用户审批 | Code Tools + 规划工具 |
| **Cowork** | 非代码工作流 | Cowork Tools（文档、表格、文件管理） |

### 5.3 布局系统

参考 Cursor 的 4 种布局模式，扩展为 5 种：

```
1. Editor 布局（默认）
   [侧边栏] [编辑器区域        ] [Composer 面板]

2. Agent 布局
   [Composer 面板（宽）        ] [编辑器区域    ]

3. Cowork 布局
   [文件浏览器] [Cowork 编辑器  ] [Composer 面板]

4. Zen 布局
   [           编辑器区域（全屏）              ]

5. Browser 布局（参考 Cursor）
   [Composer 面板（宽）        ] [WebView      ]
```

---

## 6. Claude Code 集成方案

### 6.1 集成方式

基于逆向发现，Claude Desktop 通过 `@anthropic-ai/claude-agent-sdk` + 子进程方式调用 Claude Code。我们采用相同方案：

```typescript
// src/vs/workbench/services/claude/claudeCodeService.ts

interface IClaudeCodeService {
  // 启动 Claude Code 会话
  startSession(options: {
    mode: 'code' | 'cowork';
    workspaceRoot: string;
    modelId?: string;
  }): Promise<ClaudeSession>;

  // 发送消息
  sendMessage(sessionId: string, message: string): AsyncIterable<StreamEvent>;

  // 切换 Tool Set
  switchToolSet(sessionId: string, toolSet: 'code' | 'cowork'): Promise<void>;

  // 管理 MCP 连接
  getMcpConnections(): McpConnection[];
}
```

### 6.2 关键实现细节

```
启动流程：
1. 检测 claude CLI 是否安装 → 未安装则引导安装
2. 通过 claude-agent-sdk 创建 session
3. 传入 workspace 路径和初始 system prompt
4. 建立 streaming 连接
5. 根据模式加载对应 Tool Set

通信协议：
├── stdin/stdout （主要，低延迟）
├── 流式响应 (SSE-like events)
└── 结构化工具调用 (JSON)
```

### 6.3 Cowork 模式的 Tool Set

```typescript
// Cowork 专用工具集
const coworkTools = {
  // 文件操作
  'read_file': { ... },
  'write_file': { ... },
  'list_directory': { ... },

  // 文档处理
  'edit_document': { ... },     // Tiptap 编辑
  'create_document': { ... },

  // 表格处理
  'read_spreadsheet': { ... },  // Univer 读取
  'write_spreadsheet': { ... },
  'analyze_data': { ... },      // 数据分析

  // PPT 处理
  'create_presentation': { ... }, // PptxGenJS
  'preview_slides': { ... },     // Reveal.js

  // MCP 工具（动态加载）
  ...mcpTools
};
```

---

## 7. MCP 集成架构

### 7.1 双重角色

Claude Editor 同时扮演 MCP Host 和 MCP Server：

```
                    ┌────────────────────────────┐
   外部 MCP Server  │    Claude Editor           │  IDE 功能
   (Google Drive,   │                            │  暴露为
    Gmail, etc.)    │  ┌──────────┐              │  MCP Server
        ┌───────────┤  │ MCP Host │              ├──────────┐
        │           │  │ Service  │              │          │
   ┌────▼────┐      │  └──────────┘              │   ┌──────▼──────┐
   │ Google  │      │       │                    │   │ Claude Code │
   │ Drive   │◄─────┤       ▼                    ├──►│   CLI       │
   │ Server  │      │  ┌──────────┐              │   └─────────────┘
   └─────────┘      │  │ Agent    │              │
                    │  │ Core     │              │
   ┌─────────┐      │  └──────────┘              │
   │ Gmail   │◄─────┤       │                    │
   │ Server  │      │       ▼                    │
   └─────────┘      │  ┌──────────┐              │
                    │  │MCP Server│              │
                    │  │(IDE能力)  │              │
                    │  └──────────┘              │
                    └────────────────────────────┘
```

### 7.2 MCP 分层架构（基于团队讨论优化）

MCP 能力拆分为核心层和扩展层，兼顾性能和灵活性：

```
Workbench 核心层 (workbench/services/mcp/):
├── McpClientManager        # Client 连接管理、Transport 抽象
├── McpServerRegistry       # Server 发现和注册
└── McpCapabilityProvider   # 将 MCP 能力注入到 Agent Tool Set

Bundled Extension 层 (extensions/claude-mcp/):
├── MCP Settings UI         # Server 配置界面（设置面板）
├── MCP Debug Panel         # 连接状态、日志查看
└── IDE MCP Server          # 暴露 IDE 能力为 MCP Resources/Tools
```

**理由**：核心层处理协议和连接（需要 `utilityProcess` Worker Thread），UI 和诊断工具放扩展更灵活。IDE 自身作为 MCP Server 的 Tool/Resource 定义会频繁变化，放扩展更方便迭代。

### 7.3 MCP 配置兼容性

兼容 Claude Desktop 的配置格式：

```json
// ~/.claude-editor/mcp.json (兼容 claude_desktop_config.json)
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-google-drive"],
      "env": { "GOOGLE_API_KEY": "..." }
    }
  }
}
```

同时支持自动发现已有的 Claude Desktop 和 Cursor 的 MCP 配置。

---

## 8. 非代码编辑器方案

### 8.1 技术选型

| 文件类型 | 编辑器方案 | 核心库 | 能力 |
|----------|-----------|--------|------|
| Markdown (.md) | Monaco Editor | 内置 | 完整编辑 + 预览 |
| 富文本文档 (.docx/.html) | Custom Editor | **Tiptap** (ProseMirror) | 所见即所得编辑 |
| 表格 (.xlsx/.csv/.tsv) | Custom Editor | **Univer** | 完整电子表格 |
| 演示文稿 (.pptx) | Custom Editor | **Reveal.js** + **PptxGenJS** | 预览 + AI 生成 |
| PDF (.pdf) | Custom Editor | **PDF.js** | 只读查看 + AI 分析 |
| JSON/YAML | Monaco Editor | 内置 | 完整编辑 |

### 8.2 VS Code Custom Editor API 集成

```typescript
// extensions/claude-cowork-editors/src/documentEditorProvider.ts
class ClaudeDocumentEditorProvider implements vscode.CustomEditorProvider {
  // 使用 Tiptap 在 WebView 中渲染富文本编辑器
  resolveCustomEditor(document, webviewPanel) {
    webviewPanel.webview.html = this.getTiptapEditorHtml();
    // 双向数据绑定: document <-> Tiptap
  }
}

// extensions/claude-cowork-editors/src/spreadsheetEditorProvider.ts
class ClaudeSpreadsheetEditorProvider implements vscode.CustomEditorProvider {
  // 使用 Univer 在 WebView 中渲染电子表格
  resolveCustomEditor(document, webviewPanel) {
    webviewPanel.webview.html = this.getUniverEditorHtml();
  }
}
```

---

## 9. 安全架构

### 9.1 渐进式安全模型

```
Level 0: IDE 内置操作
  └── VS Code 沙箱（Extension Host 隔离）
  └── 适用：代码编辑、文件浏览

Level 1: Electron 增强沙箱（默认）
  └── contextIsolation + 受限 nodeIntegration
  └── 适用：Cowork 模式下的文档编辑

Level 2: OS 级沙箱
  └── macOS: sandbox-exec  /  Linux: bubblewrap
  └── 适用：执行 Agent 生成的脚本

Level 3: VM 隔离（可选，高级功能）
  └── macOS: Apple Virtualization Framework
  └── Linux: microVM (firecracker)
  └── 适用：不受信任的代码执行、企业环境
```

### 9.2 文件权限控制

```typescript
// Cowork 模式下的文件访问控制
interface CoworkPermissions {
  allowedDirectories: string[];     // 用户授权的目录
  readOnlyPatterns: string[];       // 只读文件模式
  blockedPatterns: string[];        // 禁止访问的文件（.env, credentials 等）
}
```

---

## 10. 项目结构（开发阶段）

```
Claude-Editor/
├── src/vs/workbench/
│   ├── contrib/
│   │   ├── claude/                    # Claude AI 核心 UI
│   │   │   ├── browser/
│   │   │   │   ├── composer/          # Composer 面板
│   │   │   │   │   ├── composerPanel.ts
│   │   │   │   │   ├── chatMode.ts
│   │   │   │   │   ├── agentMode.ts
│   │   │   │   │   ├── planMode.ts
│   │   │   │   │   └── coworkMode.ts
│   │   │   │   ├── layout/            # 布局系统
│   │   │   │   │   ├── agentLayout.ts
│   │   │   │   │   ├── coworkLayout.ts
│   │   │   │   │   └── layoutRegistry.ts
│   │   │   │   └── components/        # 共享 UI 组件
│   │   │   │       ├── messageBubble.ts
│   │   │   │       ├── codeBlock.ts
│   │   │   │       ├── toolCallView.ts
│   │   │   │       └── progressPanel.ts
│   │   │   └── claude.contribution.ts # 注册入口
│   │   │
│   │   └── cowork/                    # Cowork 模式 UI
│   │       ├── browser/
│   │       │   ├── coworkPanel.ts     # Cowork 控制面板
│   │       │   ├── taskProgress.ts    # 任务进度可视化
│   │       │   └── fileExplorer.ts    # 简化文件浏览器
│   │       └── cowork.contribution.ts
│   │
│   └── services/
│       ├── claude/                    # Claude Code 服务
│       │   ├── common/
│       │   │   ├── claudeCodeService.ts     # 接口定义
│       │   │   ├── claudeSession.ts         # 会话管理
│       │   │   └── toolSetManager.ts        # Tool Set 管理
│       │   └── node/
│       │       └── claudeCodeServiceImpl.ts # Node.js 实现
│       │
│       └── mcp/                       # MCP 服务
│           ├── common/
│           │   ├── mcpHostService.ts   # MCP Host 接口
│           │   └── mcpServerService.ts # MCP Server 接口
│           └── node/
│               ├── mcpHostImpl.ts      # Host 实现
│               └── mcpServerImpl.ts    # Server 实现
│
├── extensions/
│   ├── claude-theme/                  # Claude 主题扩展
│   │   ├── package.json
│   │   └── themes/
│   │       ├── claude-dark.json
│   │       ├── claude-light.json
│   │       ├── claude-dark-dimmed.json
│   │       └── claude-warm.json
│   │
│   └── claude-cowork-editors/         # 非代码编辑器扩展
│       ├── package.json
│       ├── src/
│       │   ├── documentEditor/        # 富文本编辑器 (Tiptap)
│       │   ├── spreadsheetEditor/     # 表格编辑器 (Univer)
│       │   ├── presentationEditor/    # PPT 编辑器 (Reveal.js)
│       │   └── pdfViewer/             # PDF 查看器 (PDF.js)
│       └── media/                     # WebView 资源
│
├── docs/                              # 文档
├── memory/                            # 团队共享记忆
├── Reports/                           # 工作报告
├── extracted/                         # 逆向提取文件（不提交到 Git）
│   ├── claude-app/
│   └── cursor-app/
└── build/                             # 构建配置
    ├── electron-builder.yml
    └── scripts/
```

---

## 11. 实施路线图

### Phase 0: 逆向调研深化（1-2 周）

目标：完成所有逆向分析，形成可执行的设计文档

| 任务 | 负责 Agent | 产出 |
|------|-----------|------|
| Claude Desktop UI 规范完整提取 | reverse-engineer-claude | docs/claude-ui-spec.md |
| Claude Code 集成方式详细分析 | reverse-engineer-claude | docs/claude-code-integration.md |
| Cursor Agent Mode UI 详细分析 | reverse-engineer-cursor | docs/cursor-architecture.md |
| Cursor Composer 交互分析 | reverse-engineer-cursor | docs/cursor-composer-analysis.md |
| 设计对比报告 | ui-designer | docs/design-comparison.md |

### Phase 1: 基础框架搭建（3-4 周）

目标：能编译运行的 Code OSS Fork + Claude 主题

- [ ] Fork Code OSS，配置构建环境
- [ ] 创建 Claude 暗色主题（基于提取的设计 Token）
- [ ] 搭建 `workbench/contrib/claude/` 目录结构
- [ ] 实现基础 Composer 面板（Chat 模式）
- [ ] 集成 Claude Code CLI 基础调用
- [ ] 品牌定制（图标、启动画面、应用名称）

### Phase 2: AI 核心功能（4-5 周）

目标：完整的 Claude Code Agent 体验

- [ ] Composer Agent 模式
- [ ] Composer Plan 模式
- [ ] 内联编辑（Inline Edit）
- [ ] Diff 预览和应用
- [ ] 布局系统（Editor/Agent/Zen）
- [ ] 会话管理和历史

### Phase 3: Cowork 功能（4-5 周）

目标：非代码工作流完整可用

- [ ] Cowork 模式切换和布局
- [ ] Markdown 增强编辑器
- [ ] CSV/Excel 表格编辑器 (Univer)
- [ ] 富文本文档编辑器 (Tiptap)
- [ ] PPT 预览和 AI 生成
- [ ] PDF 查看器
- [ ] Cowork 专用 Tool Set
- [ ] 简化文件浏览器

### Phase 4: MCP + 安全 + 打磨（3-4 周）

目标：生产就绪

- [ ] MCP Host 实现
- [ ] MCP Server 实现（暴露 IDE 能力）
- [ ] MCP 配置兼容和自动发现
- [ ] 安全沙箱实现
- [ ] 性能优化
- [ ] 自动更新机制
- [ ] 安装包构建（macOS / Windows / Linux）

### Phase 5: 高级功能（持续）

- [ ] Background Agent（云端）
- [ ] VM 隔离（可选）
- [ ] 协作编辑
- [ ] 插件市场
- [ ] 企业版功能

---

## 12. 技术风险和缓解

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| Anthropic 字体授权 | 无法使用品牌字体 | 先用 Inter + Source Serif Pro 替代 |
| Code OSS 上游大版本更新 | 合并冲突 | 新增代码放独立目录，最小化改动上游文件 |
| claude-agent-sdk 非公开 API | SDK 变更导致功能失效 | 抽象适配层，支持 fallback 到 CLI 直接调用 |
| Univer 表格引擎体积大 | 应用体积膨胀 | 懒加载 + 按需拆分 |
| VS Code Custom Editor API 限制 | 编辑器功能受限 | 必要时绕过限制，直接使用 WebView |
| 非技术用户不熟悉 IDE 界面 | UX 障碍 | Cowork 模式大幅简化界面，只展示必要元素 |

---

## 13. 与竞品差异化

| 特性 | Cursor | Claude Desktop | **Claude Editor** |
|------|--------|---------------|-------------------|
| 代码编辑 | ✅ 核心 | ❌ | ✅ 核心 |
| AI Agent | ✅ | ✅ | ✅ |
| 非代码文件编辑 | ❌ | ✅ (Cowork) | ✅ (Cowork Mode) |
| Claude Code 原生 | ❌ | ✅ | ✅ |
| MCP 支持 | ✅ | ✅ | ✅ |
| 开源 | ❌ | ❌ | ✅ |
| Claude 品牌 UI | ❌ | ✅ | ✅ |
| VS Code 扩展兼容 | ✅ | ❌ | ✅ |

**Claude Editor 的独特价值**：唯一同时具备代码编辑 + Cowork 非代码工作流 + Claude Code 原生集成 + 开源的 AI 工作站。

---

## 14. 开放问题

1. **字体授权**：是否联系 Anthropic 获取 Anthropic Sans/Serif 的使用授权？
2. **claude-agent-sdk 可用性**：该 SDK 是否公开发布？是否有使用限制？
3. **品牌使用**：使用 "Claude" 品牌名是否需要 Anthropic 授权？
4. **Background Agent**：是否需要自建云基础设施？还是直接对接 Anthropic 的服务？
5. **商业模式**：完全免费开源？还是有商业版？

---

*本文档为 v1.0 版本，将随着开发进展持续更新。*
