# Claude Editor — Cowork 功能集成架构方案

> 版本：v1.0
> 日期：2026-03-04
> 作者：architect (Agent)
> 状态：RFC（Request for Comments）

---

## 目录

1. [概述与目标](#1-概述与目标)
2. [核心架构设计](#2-核心架构设计)
3. [非代码工作流设计](#3-非代码工作流设计)
4. [MCP 集成层设计](#4-mcp-集成层设计)
5. [安全架构设计](#5-安全架构设计)
6. [面向非技术用户的 UX 设计](#6-面向非技术用户的-ux-设计)
7. [技术挑战与风险](#7-技术挑战与风险)
8. [技术选型总览](#8-技术选型总览)
9. [实施路线图](#9-实施路线图)
10. [参考资料](#10-参考资料)

---

## 1. 概述与目标

### 1.1 什么是 Cowork

Cowork 是 Anthropic 在 Claude Desktop 中推出的 Agent 功能，让 Claude 能够处理**非代码类工作**——分析表格、撰写文档、制作 PPT、批量处理文件等。它把原本只有程序员才能用的 AI Agent 能力，带给了所有人。

### 1.2 为什么 Claude Editor 需要 Cowork

Claude Editor 的目标不仅仅是一个"代码编辑器"，而是一个**全能的 AI 工作台**：

- **编码模式**：写代码、调试、重构（对标 Cursor）
- **Cowork 模式**：处理文档、表格、PPT、数据分析（对标 Claude Desktop Cowork）
- **无缝切换**：同一个界面，同一个 Agent 核心，两种工作模式自由切换

这让 Claude Editor 成为唯一一个"从代码到文档全覆盖"的 AI IDE。

### 1.3 与 Claude Desktop Cowork 的关系

| 维度 | Claude Desktop Cowork | Claude Editor Cowork |
|------|----------------------|---------------------|
| 定位 | 通用 AI 助手中的 Agent | 开发者工作台中的非代码模块 |
| 隔离方式 | 完整 Linux VM（Apple Virtualization Framework） | 轻量级沙箱（Electron sandbox + 可选 VM） |
| Agent 核心 | Claude Code CLI v2.x | 同，复用 Claude Code CLI |
| 文件编辑 | Agent 直接操作文件 | IDE 内可视化编辑 + Agent 辅助 |
| 目标用户 | 所有人 | 开发者 + 非技术协作者 |

---

## 2. 核心架构设计

### 2.1 总体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Editor (Electron)                     │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │    VS Code Core      │  │       Cowork Module              │ │
│  │  ┌────────────────┐  │  │  ┌──────────┐ ┌──────────────┐  │ │
│  │  │ Monaco Editor   │  │  │  │ Doc Editor│ │ Sheet Viewer │  │ │
│  │  │ (Code Editing)  │  │  │  │ (Tiptap) │ │ (Univer)     │  │ │
│  │  ├────────────────┤  │  │  ├──────────┤ ├──────────────┤  │ │
│  │  │ File Explorer   │  │  │  │ PPT View │ │ PDF Viewer   │  │ │
│  │  │ Terminal         │  │  │  │(PptxGen) │ │ (PDF.js)     │  │ │
│  │  │ Git Integration  │  │  │  ├──────────┤ ├──────────────┤  │ │
│  │  │ Extensions       │  │  │  │Task Panel│ │ Canvas View  │  │ │
│  │  └────────────────┘  │  │  └──────────┘ └──────────────┘  │ │
│  └──────────┬───────────┘  └──────────┬─────────────────────┘ │
│             │                         │                         │
│  ┌──────────┴─────────────────────────┴──────────────────────┐ │
│  │              Unified Agent Core (共享层)                    │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐  │ │
│  │  │ Claude Code  │ │ MCP Host     │ │ Session Manager    │  │ │
│  │  │ CLI Bridge   │ │ (Client Hub) │ │ (会话/状态管理)     │  │ │
│  │  └──────┬──────┘ └──────┬───────┘ └────────────────────┘  │ │
│  └─────────┼───────────────┼─────────────────────────────────┘ │
│            │               │                                    │
└────────────┼───────────────┼────────────────────────────────────┘
             │               │
    ┌────────┴───┐   ┌──────┴──────────────────┐
    │Claude Code │   │ MCP Servers              │
    │  CLI       │   │ ┌────────┐ ┌──────────┐ │
    │ (子进程)    │   │ │Google  │ │ Slack    │ │
    │            │   │ │Drive   │ │          │ │
    └────────────┘   │ ├────────┤ ├──────────┤ │
                     │ │ Gmail  │ │ Custom   │ │
                     │ └────────┘ └──────────┘ │
                     └─────────────────────────┘
```

### 2.2 模块划分策略

我们选择 **内置扩展（Built-in Extension）** 的形式集成 Cowork，原因：

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| 核心模块（直接改 VS Code 源码） | 最深度集成 | 升级困难，与上游 Code OSS 严重分叉 | 不推荐 |
| **内置扩展（Bundled Extension）** | **利用 VS Code 扩展 API，保持与上游同步** | 受限于扩展 API 能力 | **推荐** |
| 独立面板（Electron BrowserWindow） | 完全自由 | 与 IDE 割裂，两套 UI 系统 | 不推荐 |

具体来说，Cowork 模块会以 **3 个内置扩展** 的形式存在：

```
src/extensions/
├── claude-cowork-core/        # Cowork 核心扩展
│   ├── src/
│   │   ├── extension.ts       # 扩展入口
│   │   ├── coworkMode.ts      # Cowork 模式管理
│   │   ├── taskPanel.ts       # 任务面板
│   │   └── agentBridge.ts     # Agent 通信桥接
│   └── package.json
├── claude-cowork-editors/     # 非代码编辑器扩展
│   ├── src/
│   │   ├── extension.ts
│   │   ├── editors/
│   │   │   ├── documentEditor.ts   # 富文本编辑器
│   │   │   ├── spreadsheetEditor.ts # 表格编辑器
│   │   │   ├── presentationEditor.ts # PPT 编辑器
│   │   │   └── pdfViewer.ts         # PDF 查看器
│   │   └── webview/
│   │       ├── document/       # Tiptap 集成
│   │       ├── spreadsheet/    # Univer 集成
│   │       ├── presentation/   # 演示文稿渲染
│   │       └── pdf/            # PDF.js 集成
│   └── package.json
└── claude-mcp-host/           # MCP Host 扩展
    ├── src/
    │   ├── extension.ts
    │   ├── mcpHost.ts         # MCP Host 实现
    │   ├── mcpClient.ts       # MCP Client 管理
    │   ├── transports/        # 传输层
    │   │   ├── stdioTransport.ts
    │   │   └── httpTransport.ts
    │   └── serverManager.ts   # Server 生命周期管理
    └── package.json
```

### 2.3 与 Claude Code 集成层的关系

**核心设计原则：共用同一个 Agent 核心**

Claude Desktop 的 Cowork 和 Claude Code 共享同一个 agentic 架构。我们的实现同样遵循这一原则：

```
┌────────────────────────────────────────┐
│         Unified Agent Core             │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │     Claude Code CLI Bridge       │  │
│  │                                  │  │
│  │  - 子进程管理（spawn）            │  │
│  │  - stdin/stdout JSON Stream      │  │
│  │  - 流式响应处理                   │  │
│  │  - 会话生命周期管理               │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│     ┌───────────┴───────────┐          │
│     │                       │          │
│  ┌──┴──────────┐  ┌────────┴───────┐  │
│  │ Code Mode   │  │ Cowork Mode    │  │
│  │ 代码编辑相关 │  │ 非代码工作相关  │  │
│  │ Tool Set    │  │ Tool Set       │  │
│  └─────────────┘  └────────────────┘  │
└────────────────────────────────────────┘
```

**工作方式**：

1. Claude Code CLI 以子进程方式运行，通过 stdin/stdout 进行 JSON Stream 通信
2. IDE 作为 Host，维护一个长期运行的 Claude Code 会话
3. 代码模式和 Cowork 模式共享同一个会话，但使用不同的 Tool Set
4. 当用户切换模式时，动态调整可用的 Tools，而非重启会话

**Tool Set 划分**：

```typescript
// Code Mode Tools（代码编辑工具）
const codeTools = [
  'read_file', 'write_file', 'edit_file',      // 文件操作
  'execute_command', 'run_terminal',             // 终端操作
  'search_code', 'grep', 'glob',                // 代码搜索
  'git_status', 'git_commit', 'git_diff',       // Git 操作
];

// Cowork Mode Tools（非代码工作工具）
const coworkTools = [
  'read_file', 'write_file',                    // 基础文件操作
  'create_document', 'edit_document',            // 文档创建/编辑
  'create_spreadsheet', 'analyze_data',          // 表格和数据分析
  'create_presentation', 'add_slide',            // PPT 操作
  'convert_format',                              // 格式转换
  'browse_web', 'fetch_url',                     // 网络访问
  'schedule_task', 'batch_process',              // 任务调度
];

// Shared Tools（两个模式共享的工具）
const sharedTools = [
  'read_file', 'write_file', 'list_directory',  // 基础文件
  'mcp_call',                                    // MCP 调用
];
```

---

## 3. 非代码工作流设计

### 3.1 文档编辑（Rich Text Editor）

**方案：VS Code Custom Editor API + Tiptap**

```
用户双击 .docx/.md/.html 文件
        │
        ▼
VS Code Custom Editor Provider 接管
        │
        ▼
Webview 加载 Tiptap 编辑器
        │
        ▼
文件内容 ←→ Tiptap JSON ←→ 目标格式
```

**技术选型理由**：

| 库 | 优点 | 缺点 | 结论 |
|---|------|------|------|
| **Tiptap** | 无头架构，高度可定制；基于 ProseMirror，稳定可靠；100+ 扩展生态 | 需要自建 UI | **推荐** |
| Slate.js | React 原生，灵活 | 文档不如 Tiptap 好，社区更小 | 备选 |
| CKEditor | 功能齐全 | 商业许可，UI 定制难 | 不推荐 |
| Quill | 简单易用 | 功能有限，不够现代 | 不推荐 |

**实现架构**：

```typescript
// documentEditor.ts — Custom Editor Provider
import * as vscode from 'vscode';

export class DocumentEditorProvider implements vscode.CustomTextEditorProvider {

  public static readonly viewType = 'claude.documentEditor';

  // 支持的文件格式
  static readonly supportedExtensions = ['.md', '.docx', '.doc', '.html', '.rtf'];

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // 1. 配置 Webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [/* Tiptap 资源路径 */]
    };

    // 2. 加载 Tiptap 编辑器 HTML
    webviewPanel.webview.html = this.getEditorHtml(webviewPanel.webview);

    // 3. 文档内容 → Tiptap
    const content = await this.parseDocument(document);
    webviewPanel.webview.postMessage({ type: 'setContent', content });

    // 4. Tiptap 变更 → 文档
    webviewPanel.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'contentChanged') {
        this.updateDocument(document, msg.content);
      }
    });
  }
}
```

**格式转换管道**：

```
.docx ──→ mammoth.js ──→ HTML ──→ Tiptap JSON ──→ 编辑 ──→ Tiptap JSON ──→ HTML ──→ docx-templates ──→ .docx
.md   ──→ unified/remark ──→ Tiptap JSON ──→ 编辑 ──→ Tiptap JSON ──→ remark-stringify ──→ .md
.html ──→ DOMParser ──→ Tiptap JSON ──→ 编辑 ──→ Tiptap JSON ──→ HTML Serializer ──→ .html
```

**关键依赖**：
- `@tiptap/core` + `@tiptap/starter-kit` — 核心编辑器
- `@tiptap/extension-*` — 按需加载扩展（表格、代码高亮、图片等）
- `mammoth` — DOCX → HTML 解析
- `docx` (npm: docx) — HTML → DOCX 生成
- `unified` / `remark` / `rehype` — Markdown ↔ HTML 转换

### 3.2 表格处理（Spreadsheet Editor）

**方案：VS Code Custom Editor API + Univer**

选择 Univer 而非单纯的 SheetJS 的原因：

| 库 | 能力 | 适合场景 |
|---|------|---------|
| SheetJS | 解析/生成 Excel | 后台数据处理、格式转换 |
| **Univer** | **完整的电子表格 UI + 公式引擎 + 插件系统** | **在 IDE 中提供类 Excel 编辑体验** |
| Luckysheet | 类 Excel UI | 社区不活跃，不推荐 |
| Handsontable | 数据表格 | 商业许可 |

**架构设计**：

```typescript
// spreadsheetEditor.ts
export class SpreadsheetEditorProvider implements vscode.CustomEditorProvider {

  public static readonly viewType = 'claude.spreadsheetEditor';

  static readonly supportedExtensions = ['.xlsx', '.xls', '.csv', '.tsv'];

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // Webview 中加载 Univer 实例
    webviewPanel.webview.html = this.getSpreadsheetHtml(webviewPanel.webview);

    // 使用 SheetJS 解析文件 → 传递给 Univer
    const workbookData = await this.parseSpreadsheet(document);
    webviewPanel.webview.postMessage({
      type: 'loadWorkbook',
      data: workbookData
    });
  }
}
```

**Univer 在 Webview 中的初始化**（webview 端 JS）：

```typescript
// spreadsheet/main.ts (Webview 端)
import { Univer, LocaleType } from '@univerjs/core';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';

const univer = new Univer({ locale: LocaleType.ZH_CN });
univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsUIPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);

// 从 Extension Host 接收数据并创建工作簿
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  if (type === 'loadWorkbook') {
    univer.createUniverSheet(data);
  }
});
```

**AI 辅助表格能力**（通过 Claude Code Agent）：

- 自然语言查询："找出销售额最高的前 10 个产品"
- 公式生成："帮我写一个 VLOOKUP 公式"
- 数据可视化建议："根据这些数据生成合适的图表"
- 批量清洗："把 A 列的日期格式统一为 YYYY-MM-DD"

### 3.3 演示文稿（Presentation Editor）

**方案：Custom Editor + Reveal.js（预览）+ PptxGenJS（生成）**

PPT 的使用场景有两种：

1. **查看/预览**已有的 .pptx 文件
2. **AI 生成**新的演示文稿

```
场景 1：查看已有 PPT
.pptx ──→ pptx-parser ──→ Slide JSON ──→ Reveal.js 渲染 ──→ 可视预览

场景 2：AI 生成新 PPT
用户描述 ──→ Claude Agent ──→ Slide JSON ──→ PptxGenJS ──→ .pptx 文件
                                      └──→ Reveal.js ──→ 实时预览
```

**技术选型**：

| 库 | 用途 | 说明 |
|---|------|------|
| `pptx2json` / `officegen` | PPTX 解析 | 读取现有 PPTX 文件结构 |
| **Reveal.js** | 幻灯片渲染 | 在 Webview 中实时预览 |
| **PptxGenJS** | PPTX 生成 | AI 生成的内容导出为标准 PPTX |

**实现架构**：

```typescript
// presentationEditor.ts
export class PresentationEditorProvider implements vscode.CustomReadonlyEditorProvider {

  // 注意：PPT 使用只读编辑器 + AI 辅助修改
  // 原因：PPTX 格式复杂，完整编辑器开发成本极高
  // 用户通过自然语言描述修改需求，由 Agent 生成新版本

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // 解析 PPTX → Slide JSON
    const slides = await this.parsePptx(document);

    // Reveal.js 渲染预览
    webviewPanel.webview.html = this.getRevealHtml(slides, webviewPanel.webview);
  }
}
```

### 3.4 PDF 查看

**方案：Custom Editor + PDF.js**

PDF 是只读格式，不需要编辑能力，但需要：
- 高质量渲染
- 文本选择和搜索
- 缩放和翻页
- AI 辅助内容提取和分析

```typescript
// pdfViewer.ts
export class PdfViewerProvider implements vscode.CustomReadonlyEditorProvider {

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    // PDF.js 渲染
    const pdfData = await vscode.workspace.fs.readFile(document.uri);
    webviewPanel.webview.html = this.getPdfViewerHtml(webviewPanel.webview);
    webviewPanel.webview.postMessage({
      type: 'loadPdf',
      data: Array.from(pdfData)
    });
  }
}
```

**PDF.js 在 Webview 中的使用**：

```typescript
// pdf/main.ts (Webview 端)
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

window.addEventListener('message', async (event) => {
  if (event.data.type === 'loadPdf') {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(event.data.data) }).promise;
    // 渲染各页面到 Canvas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      renderPage(page, document.getElementById(`page-${i}`));
    }
  }
});
```

### 3.5 格式支持全景

| 格式 | 操作 | 技术方案 | 优先级 |
|------|------|---------|--------|
| Markdown (.md) | 读 + 写 + 可视化编辑 | Tiptap + remark | P0 |
| CSV/TSV | 读 + 写 + 可视化编辑 | Univer + 内置解析 | P0 |
| PDF | 只读 + AI 分析 | PDF.js | P0 |
| XLSX/XLS | 读 + 写 + 可视化编辑 | Univer + SheetJS | P1 |
| DOCX | 读 + 写 + 可视化编辑 | Tiptap + mammoth + docx | P1 |
| HTML | 读 + 写 + 可视化编辑 | Tiptap | P1 |
| PPTX | 只读预览 + AI 生成 | Reveal.js + PptxGenJS | P2 |
| JSON | 读 + 写 + 树形视图 | 内置 JSON 树组件 | P1 |
| 图片 | 只读预览 | 内置 (VS Code 已有) | P0 |

---

## 4. MCP 集成层设计

### 4.1 MCP 在 Claude Editor 中的角色

MCP（Model Context Protocol）是连接 Claude Agent 与外部世界的标准协议。在 Claude Editor 中，我们需要同时扮演两个角色：

- **MCP Host**：管理多个 MCP Client 实例，每个连接一个 MCP Server
- **MCP Server**：将 IDE 自身的能力暴露为 MCP Resources/Tools，供 Agent 或其他客户端调用

```
┌───────────────────────────────────────────────────┐
│              Claude Editor (MCP Host)              │
│                                                    │
│  ┌─────────────┐  ┌─────────────┐                 │
│  │ MCP Client 1│  │ MCP Client 2│  ...            │
│  │ (→ Google   │  │ (→ Slack    │                 │
│  │    Drive)   │  │    Server)  │                 │
│  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                         │
│  ┌──────┴────────────────┴────────────────────┐   │
│  │          MCP Client Manager                 │   │
│  │  - Server 发现和连接管理                     │   │
│  │  - Transport 选择（stdio / HTTP）            │   │
│  │  - 认证和权限管理                            │   │
│  │  - 健康检查和重连                            │   │
│  └─────────────────────┬──────────────────────┘   │
│                        │                           │
│  ┌─────────────────────┴──────────────────────┐   │
│  │          MCP IDE Server (内置)               │   │
│  │  Resources:                                  │   │
│  │  - ide://workspace/* (工作区文件)             │   │
│  │  - ide://editor/* (当前编辑器状态)            │   │
│  │  - ide://terminal/* (终端输出)               │   │
│  │  Tools:                                      │   │
│  │  - ide.openFile, ide.editFile               │   │
│  │  - ide.runCommand, ide.showDiff              │   │
│  │  - ide.createDocument, ide.openSpreadsheet   │   │
│  │  Prompts:                                    │   │
│  │  - ide.codeReview, ide.explainCode           │   │
│  │  - ide.analyzeData, ide.createPresentation   │   │
│  └────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

### 4.2 MCP Host 实现

```typescript
// mcpHost.ts
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/client/streamableHttp';

export class McpHostManager {
  private clients: Map<string, Client> = new Map();

  /**
   * 从配置文件加载并连接所有 MCP Server
   * 配置格式兼容 Claude Desktop 的 claude_desktop_config.json
   */
  async loadServersFromConfig(configPath: string): Promise<void> {
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      await this.connectServer(name, serverConfig);
    }
  }

  async connectServer(name: string, config: McpServerConfig): Promise<void> {
    const client = new Client({
      name: 'claude-editor',
      version: '1.0.0',
    });

    // 选择 Transport
    let transport;
    if (config.command) {
      // stdio 模式：启动子进程
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env,
      });
    } else if (config.url) {
      // HTTP 模式：连接远程 Server
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    }

    await client.connect(transport);
    this.clients.set(name, client);

    // 发现 Server 的能力
    const capabilities = await client.getServerCapabilities();
    this.registerCapabilities(name, capabilities);
  }

  /**
   * 调用某个 Server 的 Tool
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP Server "${serverName}" not connected`);

    return await client.callTool({ name: toolName, arguments: args });
  }

  /**
   * 获取某个 Server 的 Resource
   */
  async getResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP Server "${serverName}" not connected`);

    return await client.readResource({ uri });
  }
}
```

### 4.3 MCP Server 配置管理

配置文件路径：`~/.claude-editor/mcp-servers.json`

```json
{
  "mcpServers": {
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-google-drive"],
      "env": {
        "GOOGLE_CREDENTIALS_PATH": "~/.config/google/credentials.json"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-slack"],
      "env": {
        "SLACK_TOKEN": "${secret:slack-token}"
      }
    },
    "custom-api": {
      "url": "https://my-company.com/mcp/v1",
      "headers": {
        "Authorization": "Bearer ${secret:custom-api-key}"
      }
    }
  }
}
```

**配置 UI（设置面板）**：

IDE 设置中提供可视化的 MCP Server 管理界面：
- 已连接 Server 列表（状态指示灯）
- 添加新 Server（从 MCP Registry 浏览/手动配置）
- Server 能力浏览（列出该 Server 提供的 Tools、Resources、Prompts）
- 连接日志和调试

### 4.4 IDE 自身作为 MCP Server

将 IDE 的能力暴露为 MCP Server，让 Agent 可以通过标准协议操作 IDE：

```typescript
// ideServer.ts
import { McpServer } from '@modelcontextprotocol/server';

export function createIdeServer(context: vscode.ExtensionContext): McpServer {
  const server = new McpServer({
    name: 'claude-editor-ide',
    version: '1.0.0',
  });

  // === Resources ===

  // 暴露工作区文件作为 Resource
  server.resource(
    'workspace-files',
    'ide://workspace/{path}',
    async (uri) => {
      const filePath = uri.pathname;
      const content = await vscode.workspace.fs.readFile(
        vscode.Uri.file(filePath)
      );
      return {
        contents: [{
          uri: uri.href,
          text: new TextDecoder().decode(content),
          mimeType: getMimeType(filePath)
        }]
      };
    }
  );

  // 暴露当前编辑器状态
  server.resource(
    'editor-state',
    'ide://editor/active',
    async () => ({
      contents: [{
        uri: 'ide://editor/active',
        text: JSON.stringify({
          activeFile: vscode.window.activeTextEditor?.document.uri.path,
          selection: vscode.window.activeTextEditor?.selection,
          visibleRange: vscode.window.activeTextEditor?.visibleRanges,
          language: vscode.window.activeTextEditor?.document.languageId,
        })
      }]
    })
  );

  // === Tools ===

  server.tool(
    'open_file',
    { path: z.string().describe('File path to open') },
    async ({ path }) => {
      const doc = await vscode.workspace.openTextDocument(path);
      await vscode.window.showTextDocument(doc);
      return { content: [{ type: 'text', text: `Opened ${path}` }] };
    }
  );

  server.tool(
    'create_document',
    {
      title: z.string(),
      format: z.enum(['md', 'docx', 'html']),
      content: z.string().optional(),
    },
    async ({ title, format, content }) => {
      // 创建新文档并用 Cowork 编辑器打开
      const filePath = path.join(workspaceRoot, `${title}.${format}`);
      await fs.writeFile(filePath, content || '');
      await vscode.commands.executeCommand(
        'vscode.openWith',
        vscode.Uri.file(filePath),
        'claude.documentEditor'
      );
      return { content: [{ type: 'text', text: `Created ${filePath}` }] };
    }
  );

  server.tool(
    'analyze_spreadsheet',
    {
      path: z.string(),
      query: z.string().describe('Natural language query about the data'),
    },
    async ({ path, query }) => {
      // 读取表格数据，让 Agent 分析
      const data = await parseSpreadsheetForAnalysis(path);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ schema: data.schema, sampleRows: data.sample, query })
        }]
      };
    }
  );

  return server;
}
```

---

## 5. 安全架构设计

### 5.1 安全模型概览

Claude Desktop Cowork 使用 5 层安全隔离：
```
macOS Host → Apple Virtualization Framework → Ubuntu VM → bubblewrap → seccomp → Claude Code
```

对于 Claude Editor，我们采用**渐进式安全方案**——根据操作的风险等级选择不同的隔离策略：

```
┌──────────────────────────────────────────────────┐
│                    安全层级                        │
│                                                   │
│  Level 0: IDE 内置操作（无需隔离）                  │
│  ├── 打开/查看文件                                 │
│  ├── Webview 中的编辑操作                          │
│  └── UI 交互                                      │
│                                                   │
│  Level 1: Electron Sandbox（默认）                 │
│  ├── Claude Code CLI 子进程                       │
│  ├── 受限文件系统访问（仅工作区）                    │
│  └── 网络访问白名单                                │
│                                                   │
│  Level 2: 增强沙箱（Node.js vm + 文件限制）        │
│  ├── MCP Server 子进程                            │
│  ├── 用户脚本执行                                  │
│  └── 第三方扩展运行                                │
│                                                   │
│  Level 3: VM 隔离（可选，高安全场景）               │
│  ├── 不受信任的代码执行                            │
│  ├── 处理敏感数据                                  │
│  └── 企业部署场景                                  │
└──────────────────────────────────────────────────┘
```

### 5.2 Level 1：Electron Sandbox + 文件系统控制

这是默认的安全等级，适用于大多数场景：

```typescript
// sandboxManager.ts
export class SandboxManager {

  private allowedPaths: Set<string> = new Set();

  /**
   * 用户显式授权的目录才能被 Agent 访问
   * 类似 Claude Desktop 的"文件夹挂载"机制
   */
  grantAccess(dirPath: string): void {
    this.allowedPaths.add(path.resolve(dirPath));
  }

  revokeAccess(dirPath: string): void {
    this.allowedPaths.delete(path.resolve(dirPath));
  }

  /**
   * 检查某个路径是否在授权范围内
   */
  isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    for (const allowed of this.allowedPaths) {
      if (resolved.startsWith(allowed)) return true;
    }
    return false;
  }

  /**
   * 包装文件操作，自动检查权限
   */
  async safeReadFile(filePath: string): Promise<Buffer> {
    if (!this.isPathAllowed(filePath)) {
      throw new SecurityError(`Access denied: ${filePath} is not in authorized directories`);
    }
    return fs.readFile(filePath);
  }

  async safeWriteFile(filePath: string, content: Buffer): Promise<void> {
    if (!this.isPathAllowed(filePath)) {
      throw new SecurityError(`Access denied: ${filePath} is not in authorized directories`);
    }
    // 额外保护：阻止写入系统关键文件
    if (this.isSystemCriticalPath(filePath)) {
      throw new SecurityError(`Cannot write to system path: ${filePath}`);
    }
    return fs.writeFile(filePath, content);
  }

  private isSystemCriticalPath(p: string): boolean {
    const forbidden = ['/etc', '/usr', '/bin', '/sbin', '/System', '/Library'];
    return forbidden.some(f => p.startsWith(f));
  }
}
```

### 5.3 Level 2：增强沙箱

用于运行不完全信任的代码（如 MCP Server 子进程、用户脚本）：

```typescript
// enhancedSandbox.ts
import { spawn } from 'child_process';

export class EnhancedSandbox {

  /**
   * 在受限环境中启动子进程
   * macOS 使用 sandbox-exec（App Sandbox），Linux 使用 bubblewrap
   */
  async spawnSandboxed(
    command: string,
    args: string[],
    options: SandboxOptions
  ): Promise<ChildProcess> {

    if (process.platform === 'darwin') {
      // macOS: 使用 sandbox-exec profile
      const profile = this.generateSandboxProfile(options);
      return spawn('sandbox-exec', ['-p', profile, command, ...args], {
        env: this.sanitizeEnv(options.env),
        cwd: options.workDir,
      });
    } else if (process.platform === 'linux') {
      // Linux: 使用 bubblewrap
      const bwrapArgs = this.buildBwrapArgs(options);
      return spawn('bwrap', [...bwrapArgs, command, ...args], {
        env: this.sanitizeEnv(options.env),
      });
    }

    // Fallback: 基本的进程隔离
    return spawn(command, args, {
      env: this.sanitizeEnv(options.env),
      cwd: options.workDir,
      uid: options.restrictedUid,
    });
  }

  private generateSandboxProfile(options: SandboxOptions): string {
    return `
      (version 1)
      (deny default)
      (allow file-read* (subpath "${options.workDir}"))
      ${options.writeAccess ? `(allow file-write* (subpath "${options.workDir}"))` : ''}
      (allow process-exec)
      (allow sysctl-read)
      ${options.networkAccess ? '(allow network*)' : '(deny network*)'}
    `;
  }
}
```

### 5.4 Level 3：VM 隔离（可选）

对于企业级安全需求，可以选择启用 VM 隔离。这与 Claude Desktop 的方案类似：

```typescript
// vmIsolation.ts（可选模块，仅在需要时加载）
export class VmIsolationManager {

  /**
   * macOS: 使用 Apple Virtualization Framework
   * Linux: 使用 QEMU/KVM
   *
   * 注意：这是可选的高级功能，默认不启用
   * 适用场景：
   * - 处理高度敏感的数据
   * - 企业合规要求
   * - 运行不受信任的第三方代码
   */
  async createVm(config: VmConfig): Promise<VmInstance> {
    // 通过原生模块调用 Apple Virtualization Framework
    // 或通过 QEMU 创建轻量级 VM
    // 实现类似 Claude Desktop 的 VM 方案
  }
}
```

### 5.5 网络安全

```typescript
// networkPolicy.ts
export class NetworkPolicy {

  // 默认的网络白名单（Cowork 模式下）
  private static readonly DEFAULT_ALLOWLIST = [
    'api.anthropic.com',     // Anthropic API
    'pypi.org',              // Python 包
    'registry.npmjs.org',    // Node 包
    'cdn.jsdelivr.net',      // CDN 资源
  ];

  // Agent 网络请求需要经过审批
  async approveNetworkRequest(url: string, context: string): Promise<boolean> {
    const hostname = new URL(url).hostname;

    // 白名单内的直接放行
    if (this.allowlist.has(hostname)) return true;

    // 否则弹出确认对话框
    const result = await vscode.window.showWarningMessage(
      `Agent 请求访问: ${hostname}\n原因: ${context}`,
      '允许', '允许并记住', '拒绝'
    );

    if (result === '允许并记住') {
      this.allowlist.add(hostname);
    }

    return result !== '拒绝';
  }
}
```

---

## 6. 面向非技术用户的 UX 设计

### 6.1 双模式切换

Claude Editor 有两个"人格"：

- **Code 模式** — 标准 IDE，面向开发者
- **Cowork 模式** — 简化的 AI 工作台，面向所有人

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐                               │
│  │ </> Code │ │ 📋 Cowork│    ← 顶部模式切换按钮          │
│  └──────────┘ └──────────┘                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Code 模式：                 Cowork 模式：                │
│  ┌─────┬─────────┬──────┐  ┌──────┬──────────┬────────┐ │
│  │文件 │ 编辑器  │ 终端 │  │文件  │ 文档预览  │ Claude │ │
│  │树   │ (代码)  │      │  │管理  │ /编辑    │ Chat   │ │
│  │     │         │      │  │      │          │        │ │
│  │.git │ Monaco  │ bash │  │简化  │ Tiptap/  │ 对话   │ │
│  │node │ Editor  │      │  │视图  │ Univer/  │ 面板   │ │
│  │_mod │         │      │  │      │ PDF.js   │        │ │
│  └─────┴─────────┴──────┘  └──────┴──────────┴────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 6.2 简化的文件管理视图

在 Cowork 模式下，文件管理器会自动过滤开发者文件：

```typescript
// coworkFileExplorer.ts
export class CoworkFileExplorer {

  // 在 Cowork 模式下隐藏的文件/文件夹
  private static readonly HIDDEN_PATTERNS = [
    '.git', '.svn', '.hg',           // 版本控制
    'node_modules', '.venv', 'venv', // 依赖目录
    '.env', '.env.local',            // 环境变量
    'package-lock.json', 'yarn.lock', // 锁文件
    '.eslintrc', '.prettierrc',       // 配置文件
    'tsconfig.json', 'webpack.config', // 构建配置
    '.DS_Store', 'Thumbs.db',         // 系统文件
    '__pycache__', '.pyc',            // 缓存
  ];

  // 文件图标映射（更直观的图标）
  private static readonly FILE_ICONS: Record<string, string> = {
    '.docx': '📄', '.doc': '📄',
    '.xlsx': '📊', '.xls': '📊', '.csv': '📊',
    '.pptx': '📽️', '.ppt': '📽️',
    '.pdf': '📕',
    '.md': '📝',
    '.png': '🖼️', '.jpg': '🖼️', '.gif': '🖼️',
    '.mp4': '🎬', '.mov': '🎬',
    '.zip': '📦', '.tar': '📦',
  };

  /**
   * 获取 Cowork 模式下的文件列表
   * - 隐藏开发者文件
   * - 使用直观的文件图标
   * - 按类型分组（文档、表格、图片、其他）
   */
  async getCoworkFileTree(rootPath: string): Promise<CoworkFileNode[]> {
    const files = await this.scanDirectory(rootPath);
    return this.groupByCategory(
      files.filter(f => !this.isHidden(f))
    );
  }
}
```

### 6.3 Cowork 模式入口

**方式一：启动界面选择**
```
┌──────────────────────────────────────┐
│                                      │
│     Welcome to Claude Editor         │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │   </> Code   │ │  📋 Cowork   │  │
│  │              │ │              │  │
│  │  写代码      │ │  处理文档    │  │
│  │  调试        │ │  分析数据    │  │
│  │  Git 管理    │ │  做 PPT      │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
│  最近项目:                           │
│  📁 my-project                       │
│  📄 Q3 Report.xlsx                   │
│  📝 Meeting Notes.md                 │
└──────────────────────────────────────┘
```

**方式二：状态栏快速切换**
```
┌─── 状态栏 ───────────────────────────────┐
│ [</> Code ▾]  main  UTF-8  LF  TypeScript │
│                                            │
│ 点击后：                                   │
│ ┌─────────────────┐                       │
│ │ </> Code Mode   │ ← 当前                │
│ │ 📋 Cowork Mode  │                       │
│ └─────────────────┘                       │
└────────────────────────────────────────────┘
```

**方式三：快捷键**
- `Cmd+Shift+W` — 切换到 Cowork 模式
- `Cmd+Shift+C` — 切换到 Code 模式

### 6.4 任务进度可视化

当 Agent 执行 Cowork 任务时，需要清晰的进度展示：

```
┌─── Cowork 任务面板 ──────────────────────┐
│                                           │
│  🟢 正在处理: "分析 Q3 销售数据"           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━ 65%           │
│                                           │
│  ✅ 读取 sales-q3.xlsx (2.3MB)           │
│  ✅ 解析 1,247 行数据                     │
│  ✅ 清洗异常值（发现 23 条）               │
│  🔄 生成趋势分析图表...                   │
│  ⏳ 写入分析报告                          │
│  ⏳ 创建演示文稿                          │
│                                           │
│  [暂停] [取消] [查看详情]                  │
└───────────────────────────────────────────┘
```

**实现方案**：

```typescript
// taskPanel.ts
export class CoworkTaskPanel {

  private panel: vscode.WebviewPanel;

  /**
   * 显示 Agent 任务的实时进度
   * 通过监听 Claude Code CLI 的 stream-json 输出来更新
   */
  async trackAgentTask(task: AgentTask): Promise<void> {
    // 监听 Agent 的工具调用
    task.onToolCall((toolName, args) => {
      this.addStep({
        status: 'running',
        label: this.humanizeToolCall(toolName, args),
        // 例如: "read_file sales-q3.xlsx" → "读取 sales-q3.xlsx"
      });
    });

    // 监听工具调用结果
    task.onToolResult((toolName, result) => {
      this.updateLastStep({ status: 'completed' });
    });

    // 监听 Agent 的思考过程（可选展示）
    task.onThinking((thought) => {
      this.updateThinkingBubble(thought);
    });
  }

  /**
   * 把工具调用翻译成人类可读的描述
   */
  private humanizeToolCall(tool: string, args: any): string {
    const translations: Record<string, (args: any) => string> = {
      'read_file': (a) => `读取 ${path.basename(a.path)}`,
      'write_file': (a) => `写入 ${path.basename(a.path)}`,
      'execute_command': (a) => `执行命令: ${a.command.slice(0, 50)}`,
      'create_document': (a) => `创建文档: ${a.title}`,
      'analyze_data': (a) => `分析数据: ${a.query}`,
    };
    return translations[tool]?.(args) || `${tool}...`;
  }
}
```

### 6.5 与编码模式的无缝切换

关键设计原则：**同一个工作区，同一个 Agent 会话，两种视图**

```typescript
// modeManager.ts
export class ModeManager {

  private currentMode: 'code' | 'cowork' = 'code';

  async switchMode(targetMode: 'code' | 'cowork'): Promise<void> {
    if (this.currentMode === targetMode) return;

    // 1. 保存当前模式的布局状态
    await this.saveLayoutState(this.currentMode);

    // 2. 切换 Activity Bar
    if (targetMode === 'cowork') {
      // 隐藏代码相关的 Activity Bar 图标
      await vscode.commands.executeCommand('setContext', 'claude.mode', 'cowork');
      // 显示 Cowork 专属侧边栏（文件管理、任务面板）
      await vscode.commands.executeCommand('workbench.view.extension.cowork-sidebar');
    } else {
      await vscode.commands.executeCommand('setContext', 'claude.mode', 'code');
      await vscode.commands.executeCommand('workbench.view.explorer');
    }

    // 3. 切换文件过滤器
    this.fileExplorer.setMode(targetMode);

    // 4. 更新 Agent 的可用 Tool Set
    this.agentBridge.setToolSet(targetMode === 'cowork' ? coworkTools : codeTools);

    // 5. 恢复目标模式的布局状态
    await this.restoreLayoutState(targetMode);

    this.currentMode = targetMode;
  }
}
```

---

## 7. 技术挑战与风险

### 7.1 VS Code 架构限制

| 挑战 | 描述 | 缓解方案 |
|------|------|---------|
| **Webview 性能** | 每个 Custom Editor 都是独立的 Webview（iframe），内存开销大 | 使用虚拟化列表、懒加载；限制同时打开的非代码编辑器数量 |
| **Webview 通信延迟** | Extension Host ↔ Webview 通过 postMessage，有序列化开销 | 批量传输数据；对大文件分块传输；使用 SharedArrayBuffer（需安全头） |
| **Custom Editor 的限制** | VS Code 的 Custom Editor API 不支持所有编辑器功能（如多标签页） | 在 Code OSS fork 中扩展 API；必要时使用 Webview Panel 替代 |
| **扩展 API 上限** | 某些深度定制需要修改 VS Code 核心代码 | 作为 Code OSS fork，我们可以修改核心；但需谨慎管理与上游的分叉 |

### 7.2 富文本编辑的性能问题

| 挑战 | 描述 | 缓解方案 |
|------|------|---------|
| **大文档性能** | Tiptap/ProseMirror 处理 10万+ 字的文档可能卡顿 | 使用虚拟滚动；只渲染可见区域 |
| **大表格性能** | Univer 处理 10万+ 行的 Excel 可能内存溢出 | 使用 Web Worker 处理数据；分页加载 |
| **格式转换精度** | DOCX ↔ HTML 转换不可能100%无损 | 明确告知用户可能的格式差异；保留原始文件备份 |

### 7.3 Claude Code 集成风险

| 挑战 | 描述 | 缓解方案 |
|------|------|---------|
| **CLI 版本兼容** | Claude Code CLI 更新频繁，API 可能变化 | 抽象通信层；使用版本检测和适配器模式 |
| **流式响应处理** | stream-json 格式复杂，需要健壮的解析 | 使用官方 SDK 的解析器；完善错误处理 |
| **长时间运行的任务** | Cowork 任务可能运行数分钟甚至数小时 | 实现任务持久化；支持断点续做；后台运行 |
| **Token 消耗** | Cowork 任务的 context 可能很长（大文件内容） | 智能截断；只传递必要的上下文；支持摘要 |

### 7.4 安全性风险

| 挑战 | 描述 | 缓解方案 |
|------|------|---------|
| **Agent 文件越权** | Agent 可能尝试访问授权范围外的文件 | 严格的 Path Guard；默认最小权限 |
| **MCP Server 风险** | 第三方 MCP Server 可能有恶意行为 | Server 来源审核；运行时沙箱；权限审批 |
| **敏感数据泄露** | 文档内容可能包含敏感信息 | 本地处理优先；API 传输加密；用户知情同意 |

---

## 8. 技术选型总览

### 8.1 核心依赖

| 模块 | 技术选型 | 版本 | 许可证 | 说明 |
|------|---------|------|--------|------|
| 富文本编辑 | Tiptap | 2.x | MIT | 基于 ProseMirror 的无头编辑器 |
| 表格编辑 | Univer | 0.5.x+ | Apache 2.0 | 完整的电子表格引擎 |
| 表格数据处理 | SheetJS CE | 0.20.x | Apache 2.0 | Excel 格式解析/生成 |
| PPT 渲染 | Reveal.js | 5.x | MIT | 幻灯片渲染引擎 |
| PPT 生成 | PptxGenJS | 3.x | MIT | PowerPoint 文件生成 |
| PDF 查看 | PDF.js | 4.x | Apache 2.0 | Mozilla 的 PDF 渲染库 |
| DOCX 解析 | mammoth | 1.x | BSD-2 | DOCX → HTML 转换 |
| DOCX 生成 | docx | 8.x | MIT | HTML → DOCX 生成 |
| Markdown | unified + remark | latest | MIT | Markdown 处理生态 |
| MCP SDK | @modelcontextprotocol/sdk | latest | MIT | MCP 官方 TypeScript SDK |

### 8.2 开发工具

| 工具 | 用途 |
|------|------|
| TypeScript 5.x | 主要开发语言 |
| esbuild | Webview 资源打包（快速） |
| Vite | Webview 开发服务器 |
| Vitest | 单元测试 |
| Playwright | E2E 测试 |

---

## 9. 实施路线图

### Phase 1：基础框架（预计 4 周）

- [ ] 搭建 3 个内置扩展的项目结构
- [ ] 实现 Cowork 模式切换机制
- [ ] 实现基础的 Agent Bridge（Claude Code CLI 通信）
- [ ] 实现 Markdown 可视化编辑（Tiptap + Custom Editor）
- [ ] 实现 CSV 查看/编辑（Univer）
- [ ] 实现 PDF 查看（PDF.js）

### Phase 2：完善编辑器（预计 4 周）

- [ ] DOCX 读写支持（mammoth + docx）
- [ ] XLSX 完整支持（Univer + SheetJS）
- [ ] PPT 预览支持（Reveal.js）
- [ ] PPT AI 生成（PptxGenJS）
- [ ] Cowork 文件管理器（简化视图）
- [ ] 任务进度面板

### Phase 3：MCP 集成（预计 3 周）

- [ ] MCP Host 实现（Client Manager）
- [ ] MCP IDE Server 实现（暴露 IDE 能力）
- [ ] MCP Server 配置 UI
- [ ] 常用 MCP Server 预集成（Google Drive、Slack 等）

### Phase 4：安全与打磨（预计 3 周）

- [ ] Level 1 安全沙箱实现
- [ ] Level 2 增强沙箱实现
- [ ] 文件权限管理 UI
- [ ] 网络策略管理 UI
- [ ] 性能优化（大文件、大表格）
- [ ] 无障碍支持
- [ ] 多语言支持（中/英）

### Phase 5：高级功能（持续迭代）

- [ ] VM 隔离（可选模块）
- [ ] 实时协作编辑（基于 Univer 的协作能力）
- [ ] 自定义 MCP Server 开发模板
- [ ] Cowork 任务模板/Workflow 系统
- [ ] 插件市场中的 Cowork 扩展支持

---

## 10. 参考资料

### 官方文档

- [VS Code Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors) — Custom Editor 开发指南
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview) — Webview 开发指南
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — MCP 官方 SDK
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25) — MCP 协议规范
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference) — Claude Code CLI 文档

### 技术库

- [Tiptap](https://tiptap.dev/) — 无头富文本编辑器框架
- [Univer](https://github.com/dream-num/univer) — 开源电子表格/文档/幻灯片引擎
- [SheetJS](https://sheetjs.com/) — Excel 文件处理
- [Reveal.js](https://revealjs.com/) — HTML 演示文稿框架
- [PptxGenJS](https://github.com/gitbrent/PptxGenJS) — PowerPoint 文件生成
- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF 渲染引擎
- [mammoth](https://github.com/mwilliamson/mammoth.js) — DOCX → HTML 转换

### Claude Desktop Cowork 架构分析

- [Claude Cowork Architecture Deep Dive](https://claudecn.com/en/blog/claude-cowork-architecture/) — Cowork 技术架构解析
- [Inside Claude Cowork](https://pvieito.com/2026/01/inside-claude-cowork) — VM 隔离层逆向分析

### Cursor IDE 参考

- [Cursor Features](https://cursor.com/features) — AI IDE 功能列表
- [Cursor AI Architecture Deep Dive](https://collabnix.com/cursor-ai-deep-dive-technical-architecture-advanced-features-best-practices-2025/) — 架构分析

---

## 附录 A：关键数据结构

### Agent Task 定义

```typescript
interface AgentTask {
  id: string;
  mode: 'code' | 'cowork';
  prompt: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  steps: TaskStep[];
  createdAt: Date;
  updatedAt: Date;

  // 事件监听
  onToolCall(callback: (tool: string, args: any) => void): void;
  onToolResult(callback: (tool: string, result: any) => void): void;
  onThinking(callback: (thought: string) => void): void;
  onComplete(callback: (result: any) => void): void;
  onError(callback: (error: Error) => void): void;

  // 控制
  pause(): Promise<void>;
  resume(): Promise<void>;
  cancel(): Promise<void>;
}

interface TaskStep {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  label: string;       // 人类可读的描述
  tool?: string;       // 使用的工具名
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}
```

### MCP Server 配置

```typescript
interface McpServerConfig {
  // stdio 模式
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // HTTP 模式
  url?: string;
  headers?: Record<string, string>;

  // 通用
  name: string;
  description?: string;
  enabled: boolean;
  autoConnect: boolean;

  // 安全
  permissions: {
    fileAccess: 'none' | 'read' | 'readwrite';
    networkAccess: boolean;
    shellAccess: boolean;
  };
}
```

### Cowork 文件分类

```typescript
enum CoworkFileCategory {
  Documents = 'documents',     // .docx, .doc, .md, .html, .rtf
  Spreadsheets = 'spreadsheets', // .xlsx, .xls, .csv, .tsv
  Presentations = 'presentations', // .pptx, .ppt
  PDFs = 'pdfs',              // .pdf
  Images = 'images',          // .png, .jpg, .gif, .svg
  Data = 'data',              // .json, .xml, .yaml
  Archives = 'archives',      // .zip, .tar, .gz
  Other = 'other',
}
```

---

## 附录 B：与 Claude Desktop Cowork 功能对照

| 功能 | Claude Desktop | Claude Editor | 备注 |
|------|---------------|--------------|------|
| 文件读写 | VM 内直接操作 | IDE Custom Editor | 可视化编辑体验更好 |
| 表格分析 | Agent 代码生成 | Univer 可视化 + Agent | 双重交互 |
| PPT 生成 | Agent 生成文件 | 实时预览 + Agent | 即时反馈 |
| PDF 查看 | VM 内工具打开 | PDF.js 内嵌 | 更好的集成 |
| 定时任务 | VM 内 cron | IDE 任务调度器 | Phase 5 |
| 批量处理 | Agent 循环 | Agent 循环 + 进度 UI | 可视化进度 |
| MCP 集成 | Claude Desktop Host | IDE MCP Host | 兼容配置格式 |
| VM 隔离 | 默认启用 | 可选启用 | IDE 场景风险更低 |
| 网络控制 | 白名单 proxy | 白名单 + 用户审批 | 更灵活 |
| 代码执行 | VM 内完整 Linux | IDE Terminal + Sandbox | 更方便的开发体验 |
