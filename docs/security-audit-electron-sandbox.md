# Electron Sandbox 安全审计报告

> **审计日期**: 2026-03-05
> **审计人**: architect agent
> **范围**: Claude Editor (Code OSS fork) 完整安全审计
> **版本**: v2 (包含新增代码审计)

---

## 目录

1. [BrowserWindow webPreferences 审计](#1-browserwindow-webpreferences-审计)
2. [渲染进程安全 — Preload 与 Context Isolation](#2-渲染进程安全)
3. [IPC 通信安全](#3-ipc-通信安全)
4. [Session 权限与请求过滤](#4-session-权限与请求过滤)
5. [文件系统访问控制](#5-文件系统访问控制)
6. [新增代码安全审计](#6-新增代码安全审计)
7. [发现汇总与风险分级](#7-发现汇总与风险分级)
8. [修复建议](#8-修复建议)

---

## 1. BrowserWindow webPreferences 审计

### 1.1 主窗口 (CodeWindow)

**文件**: `src/vs/platform/windows/electron-main/windowImpl.ts:705-718`

```typescript
const webPreferences: electron.WebPreferences = {
    preload: FileAccess.asFileUri('vs/base/parts/sandbox/electron-browser/preload.js').fsPath,
    additionalArguments: [`--vscode-window-config=${this.configObjectUrl.resource.toString()}`],
    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none'
};
// 合并到 defaultBrowserWindowOptions() 后传给 new electron.BrowserWindow(options)
```

### 1.2 默认窗口选项

**文件**: `src/vs/platform/windows/electron-main/windows.ts:147-160`

```typescript
webPreferences: {
    ...webPreferences,
    enableWebSQL: false,         // 禁用 WebSQL
    spellcheck: false,
    autoplayPolicy: 'user-gesture-required',
    enableBlinkFeatures: 'HighlightAPI',
    sandbox: true,               // *** 已启用 ***
    enableDeprecatedPaste: true,  // 临时, 有 TODO 移除
}
```

### 1.3 辅助窗口 (Auxiliary Window)

**文件**: `src/vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService.ts:95-97`

同样调用 `defaultBrowserWindowOptions()`，继承 `sandbox: true`，使用独立 preload (`preload-aux.js`)。

### 1.4 nodeIntegration/contextIsolation 搜索

全项目搜索 `nodeIntegration: true` 和 `contextIsolation: false`：**未找到任何匹配**。

| 配置项 | 当前值 | 安全状态 |
|--------|--------|---------|
| `sandbox` | `true` (显式) | **P0 — 安全** |
| `contextIsolation` | `true` (sandbox 隐式) | **P0 — 安全** |
| `nodeIntegration` | `false` (sandbox 隐式) | **P0 — 安全** |
| `nodeIntegrationInWorker` | `false` (默认) | **P0 — 安全** |
| `enableWebSQL` | `false` (显式) | **安全** |
| `autoplayPolicy` | `user-gesture-required` | **安全** |

---

## 2. 渲染进程安全

### 2.1 Preload 脚本分析

**文件**: `src/vs/base/parts/sandbox/electron-browser/preload.ts`

- 使用 `contextBridge.exposeInMainWorld('vscode', globals)` 暴露最小化 API
- 渲染进程通过 `window.vscode` 访问受控 API，无法访问 Node.js 原始模块

**暴露的 API 清单**:

| API | 风险等级 | 安全机制 |
|-----|---------|---------|
| `ipcRenderer.send/invoke/on/once/removeListener` | 低 | 所有通道强制 `vscode:` 前缀验证 |
| `ipcMessagePort.acquire` | 低 | nonce 验证防重放 |
| `webFrame.setZoomLevel` | 无 | 仅接受 `number` 类型 |
| `webUtils.getPathForFile` | 低 | 只读，返回文件路径 |
| `process.platform/arch/env/versions/type/execPath` | 无 | 只读属性 |
| `process.cwd/shellEnv/getProcessMemoryInfo/on` | 低 | 受限方法 |
| `context.configuration/resolveConfiguration` | 无 | 只读配置 |

### 2.2 IPC 通道前缀验证 (渲染进程侧)

```typescript
function validateIPC(channel: string): true | never {
    if (!channel?.startsWith('vscode:')) {
        throw new Error(`Unsupported event IPC channel '${channel}'`);
    }
    return true;
}
```

**结论**: 渲染进程无法向主进程发送非 `vscode:` 前缀的 IPC 消息。

---

## 3. IPC 通信安全

### 3.1 ValidatedIpcMain (主进程侧)

**文件**: `src/vs/base/parts/ipc/electron-main/ipcMain.ts`

`ValidatedIpcMain` 类替代原始 `electron.ipcMain`，对每个事件执行四层验证：

| 验证层 | 检查内容 | 失败处理 |
|--------|---------|---------|
| 1. 通道白名单 | `channel.startsWith('vscode:')` | 拒绝 + 记录错误 |
| 2. 发送者 URL | `sender.url` 来自合法 VS Code 源 | 拒绝 + 记录错误 |
| 3. Host 匹配 | `host === VSCODE_AUTHORITY` | 拒绝 + 记录错误 |
| 4. Frame 层级 | `sender.parent === null` (顶层 frame) | 拒绝 + 记录错误 |

**特殊处理**:
- 开发模式 (`VSCODE_DEV`) 允许 localhost 来源
- Playwright 测试和 DevTools 重载场景 (`about:blank`) 跳过验证

### 3.2 双端验证链

```
渲染进程                           主进程
┌──────────────┐                  ┌───────────────────┐
│ preload.ts   │                  │ ValidatedIpcMain   │
│ validateIPC()│  vscode:* 通道   │ validateEvent()    │
│ 前缀检查     │ ──────────────► │ 4 层验证           │
└──────────────┘                  └───────────────────┘
```

**结论**: IPC 通信安全，双端均有验证。

---

## 4. Session 权限与请求过滤

### 4.1 权限控制

**文件**: `src/vs/code/electron-main/app.ts:175-223`

| 上下文 | 允许的权限 | 其他权限 |
|--------|-----------|---------|
| 所有来源 | `pointerLock`, `notifications` | 拒绝 |
| Webview (`vscode-webview://`) | + `clipboard-read`, `clipboard-sanitized-write` | 拒绝 |
| 核心窗口 (`vscode-file://`) | + `media`, `local-fonts` | 拒绝 |
| 未知来源 | 无 | **全部拒绝** |

### 4.2 请求过滤

**文件**: `src/vs/code/electron-main/app.ts:285-356`

| 过滤规则 | 保护目标 |
|---------|---------|
| `vscode-webview://` 请求必须来自主窗口 frame | 防止 webview 内容劫持 |
| `vscode-file://` 请求必须来自主 frame | 防止嵌入内容访问本地文件 |
| SVG 请求仅允许 `file/vscode-file/vscode-remote/devtools` scheme | 防止 SVG XSS |
| 非安全上下文的 `image/svg` Content-Type 被阻止 | SVG Content-Type 注入防护 |

### 4.3 自定义协议安全

| 协议 | 安全措施 |
|------|---------|
| `vscode-managed-remote-resource` | authority 必须以 `window:` 开头 |
| `vscode-remote-resource` | scheme 替换为 `http:`，无额外验证 |

### 4.4 CSP 配置

**发现**: 未找到显式 `Content-Security-Policy` 头设置。VS Code 依赖 Electron 默认 CSP 加上上述请求过滤机制。webview 本身由 VS Code 的 webview 框架管理，有独立的 CSP。

**风险**: **P2** — 虽然请求过滤提供了类似保护，但缺乏显式 CSP 头作为额外防线。

---

## 5. 文件系统访问控制

### 5.1 Sandbox 隔离

`sandbox: true` 确保渲染进程无法直接使用 `require('fs')` 等 Node.js 模块。所有文件操作必须通过 IPC → 主进程 `DiskFileSystemProvider` 代理。

### 5.2 UNC 路径限制 (Windows)

**文件**: `src/vs/code/electron-main/app.ts:380-387`

- 默认启用 UNC 路径限制
- `security.allowedUNCHosts` 配置白名单
- `security.restrictUNCAccess = false` 可关闭（不推荐）

### 5.3 协议处理提示

```typescript
[Schemas.file]: 'security.promptForLocalFileProtocolHandling'
[Schemas.vscodeRemote]: 'security.promptForRemoteFileProtocolHandling'
```

打开外部协议链接时有确认提示。

---

## 6. 新增代码安全审计

### 6.1 Composer 模块

#### eval() / new Function() 搜索

**结果**: Composer 模块中 **未找到** `eval()` 或 `new Function()` 调用。

#### innerHTML 使用

| 文件 | 行号 | 代码 | 风险 |
|------|------|------|------|
| `composerPanel.ts` | 161 | `this.modeSelector.innerHTML = ''` | **P2 — 低风险**: 赋值为空字符串，用于清空容器，安全 |
| `browserOverlay.ts` | 1305/1484 | `innerHTML: element.innerHTML \|\| ''` | **P2 — 低风险**: 读取 innerHTML 用于序列化，非写入 |
| `browserInjection.ts` | 3753 | `tempContainer.innerHTML = clipboard.html` | **P1 — 中风险**: 将剪贴板 HTML 写入 DOM。虽在 sandbox 内，但缺少 HTML sanitize |

#### browserInjection.ts 详细分析 (第 3753 行)

```typescript
const tempContainer = document.createElement('div');
tempContainer.innerHTML = clipboard.html;  // ← 潜在 XSS
const newElement = tempContainer.firstElementChild;
```

**风险**: `clipboard.html` 来源是 `window.__cursorClipboard`（内部剪贴板），不是系统剪贴板。但如果攻击者能修改该对象，可注入恶意 HTML。

**缓解**: sandbox 环境中 `innerHTML` 不会执行 `<script>` 标签（Chromium 安全策略），但 `<img onerror>` 等仍可能触发。

#### executeJavaScript 使用

`browserOverlay.ts` 的注释提到通过 `executeJavaScript()` 向 webview 注入脚本。这是 VS Code webview 的标准模式，代码字符串是编译时常量，不包含用户输入。

**风险**: **P2 — 低风险**。注入的是静态常量代码。

### 6.2 Claude Code 服务层

**文件**: `src/vs/workbench/services/claude/node/claudeCodeServiceImpl.ts`

| 操作 | 代码位置 | 安全评估 |
|------|---------|---------|
| `spawn(cliPath, args, ...)` (第 130 行) | CLI 进程启动 | **P1**: `cliPath` 来自 `_findCliPath()`，需确保路径验证 |
| `spawn(cmd, args, ...)` (第 868 行) | 简单命令执行 | **P1**: `_execSimple` 辅助方法，需确认调用者不传用户输入 |
| `stdio: ['pipe', 'pipe', 'pipe']` | 进程通信 | **安全**: 使用管道而非 shell |
| `cwd: config.workspaceRoot` | 工作目录 | **P2**: 需确认 workspaceRoot 不含路径穿越 |

**关键安全点**: `spawn()` 使用数组形式传递参数（非 shell 字符串），这避免了命令注入。但 `cliPath` 来源需要验证。

### 6.3 Claude 扩展权限

| 扩展 | 激活事件 | enabledApiProposals | 风险 |
|------|---------|-------------------|------|
| `claude-agent` | `onStartupFinished` | 无 | **P2 — 低** |
| `claude-agent-exec` | `onStartupFinished` | 无 | **P2 — 低** |
| `claude-mcp` | `onStartupFinished` | 无 | **P2 — 低** |
| `claude-cowork-editors` | `onCommand/onCustomEditor` | 无 | **安全**: 按需激活 |
| `claude-retrieval` | `onStartupFinished` | 无 | **P2 — 低** |
| `claude-themes` | 无 (声明式) | 无 | **安全** |

**发现**: 3 个扩展使用 `onStartupFinished` 全局激活。建议改为按需激活以缩小攻击面。

### 6.4 MCP 通信

MCP (Model Context Protocol) 使用 JSON-RPC 通过 stdio 管道通信。

| 安全点 | 当前状态 | 风险 |
|--------|---------|------|
| 传输层 | stdio 管道 (本地进程) | **安全**: 无网络暴露 |
| 消息格式 | JSON-RPC | **P2**: 需 schema 验证防畸形消息 |
| 服务器来源 | 用户配置的可执行文件路径 | **P1**: 缺少可执行文件签名验证 |
| 权限控制 | 依赖 Claude Code 自身的工具权限系统 | **P2**: IDE 侧无额外限制 |

---

## 7. 发现汇总与风险分级

### P0 — 严重 (需立即修复)

**无 P0 发现。** 核心安全配置 (sandbox, contextIsolation, nodeIntegration) 均正确。

### P1 — 中等 (建议短期修复)

| # | 发现 | 文件 | 描述 |
|---|------|------|------|
| P1-1 | innerHTML 未消毒 | `browserInjection.ts:3753` | `tempContainer.innerHTML = clipboard.html` 缺少 HTML sanitize |
| P1-2 | CLI 路径验证不足 | `claudeCodeServiceImpl.ts:130` | `spawn(cliPath, ...)` 中 cliPath 来自查找逻辑，需添加路径白名单验证 |
| P1-3 | MCP 服务器无签名验证 | Claude 服务层 | 用户配置的 MCP 服务器可执行文件无签名/hash 验证 |

### P2 — 低 (建议长期改进)

| # | 发现 | 文件 | 描述 |
|---|------|------|------|
| P2-1 | 缺少显式 CSP 头 | `app.ts` | 无 `Content-Security-Policy` 头，依赖请求过滤 |
| P2-2 | 扩展过早激活 | 3 个 Claude 扩展 | `onStartupFinished` 可改为按需激活 |
| P2-3 | MCP 消息无 schema 验证 | Claude 服务层 | JSON-RPC 消息缺少严格 schema 验证 |
| P2-4 | workspaceRoot 路径穿越 | `claudeCodeServiceImpl.ts` | `cwd: config.workspaceRoot` 未验证路径合法性 |
| P2-5 | 安全审计日志缺失 | 全局 | 安全事件未记录到独立日志 |

---

## 8. 修复建议

### P1-1: innerHTML sanitize

```typescript
// 修复方案: 使用 DOMPurify 或手动 sanitize
import { sanitizeHtml } from '../../base/browser/dom.js'; // VS Code 内置

const tempContainer = document.createElement('div');
tempContainer.innerHTML = sanitizeHtml(clipboard.html); // 消毒后写入
```

### P1-2: CLI 路径白名单

```typescript
// 在 spawn 前验证 cliPath
private _validateCliPath(cliPath: string): boolean {
    const allowedPaths = [
        '/usr/local/bin/claude',
        path.join(this._environmentService.appRoot, 'bin', 'claude'),
        // ... 已知合法路径
    ];
    return allowedPaths.some(p => path.resolve(cliPath) === path.resolve(p));
}
```

### P1-3: MCP 可执行文件验证

添加可选的 hash/签名验证机制，至少在日志中记录未验证的 MCP 服务器。

### P2-1: 显式 CSP

在 `app.ts` 的 `configureSession()` 中添加：

```typescript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ["default-src 'self' vscode-file: vscode-webview:; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"]
        }
    });
});
```

---

## 关键文件索引

| 文件 | 安全功能 |
|------|---------|
| `src/vs/platform/windows/electron-main/windows.ts:129-162` | `defaultBrowserWindowOptions()` — sandbox:true |
| `src/vs/platform/windows/electron-main/windowImpl.ts:705-718` | BrowserWindow 创建，preload 配置 |
| `src/vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService.ts:93-97` | 辅助窗口安全 |
| `src/vs/base/parts/sandbox/electron-browser/preload.ts` | 主窗口 preload — contextBridge + IPC 验证 |
| `src/vs/base/parts/ipc/electron-main/ipcMain.ts` | ValidatedIpcMain — 四层验证 |
| `src/vs/code/electron-main/app.ts:175-387` | Session 配置、权限、请求过滤 |
| `src/vs/workbench/contrib/composer/browser/browserInjection.ts:3753` | innerHTML 风险点 |
| `src/vs/workbench/services/claude/node/claudeCodeServiceImpl.ts:130,868` | CLI spawn 风险点 |
