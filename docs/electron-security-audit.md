# Electron Sandbox 安全配置审计报告

> **审计日期**: 2026-03-05
> **审计人**: architect agent
> **范围**: Claude Editor (Code OSS fork) Electron 主进程安全配置

---

## 1. 总览

Claude Editor 基于 VS Code / Code OSS 构建，继承了其成熟的 Electron 安全架构。本审计覆盖以下五个方面：

1. BrowserWindow 创建与 webPreferences 配置
2. Preload 脚本与 Context Isolation
3. IPC 通信安全
4. Session 权限与请求过滤 (CSP)
5. 文件系统访问控制

**结论**: 当前安全配置继承了 VS Code 的生产级安全实践，sandbox 模式已启用，contextIsolation 通过 sandbox 隐式生效，IPC 通道有完整验证机制。以下为详细分析。

---

## 2. BrowserWindow 创建与 webPreferences

### 2.1 主窗口 (CodeWindow)

**文件**: `src/vs/platform/windows/electron-main/windowImpl.ts` (第 705-718 行)

```typescript
const webPreferences: electron.WebPreferences = {
    preload: FileAccess.asFileUri('vs/base/parts/sandbox/electron-browser/preload.js').fsPath,
    additionalArguments: [`--vscode-window-config=${this.configObjectUrl.resource.toString()}`],
    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none'
};
```

这些 webPreferences 传入 `defaultBrowserWindowOptions()` 函数。

### 2.2 默认浏览器窗口选项

**文件**: `src/vs/platform/windows/electron-main/windows.ts` (第 129-162 行)

```typescript
export function defaultBrowserWindowOptions(...): ... {
    const options = {
        webPreferences: {
            ...webPreferences,          // 合并传入的 preload 等配置
            enableWebSQL: false,        // 禁用 WebSQL (安全)
            spellcheck: false,
            zoomFactor: ...,
            autoplayPolicy: 'user-gesture-required',  // 防止自动播放
            enableBlinkFeatures: 'HighlightAPI',
            sandbox: true,              // *** 关键: sandbox 已启用 ***
            enableDeprecatedPaste: true, // 临时兼容, 有 TODO 移除
        },
    };
}
```

### 2.3 辅助窗口 (Auxiliary Window)

**文件**: `src/vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService.ts` (第 95-97 行)

```typescript
createWindow(details: HandlerDetails): BrowserWindowConstructorOptions {
    return this.instantiationService.invokeFunction(defaultBrowserWindowOptions, state, overrides, {
        preload: FileAccess.asFileUri('vs/base/parts/sandbox/electron-browser/preload-aux.js').fsPath
    });
}
```

辅助窗口同样使用 `defaultBrowserWindowOptions()`，因此也继承 `sandbox: true`。

### 2.4 安全评估

| 配置项 | 当前值 | 安全等级 | 说明 |
|--------|--------|---------|------|
| `sandbox` | `true` | **安全** | 渲染进程在沙箱中运行，无法直接访问 Node.js API |
| `contextIsolation` | 隐式 `true` | **安全** | Electron 在 sandbox=true 时默认启用 contextIsolation |
| `nodeIntegration` | 隐式 `false` | **安全** | sandbox=true 时 nodeIntegration 被禁用 |
| `nodeIntegrationInWorker` | 隐式 `false` | **安全** | 默认未启用 |
| `enableWebSQL` | `false` | **安全** | 已显式禁用 |
| `autoplayPolicy` | `user-gesture-required` | **安全** | 防止恶意自动播放 |

---

## 3. Preload 脚本与 Context Isolation

### 3.1 主窗口 Preload 脚本

**文件**: `src/vs/base/parts/sandbox/electron-browser/preload.ts`

Preload 脚本通过 `contextBridge.exposeInMainWorld('vscode', globals)` 将最小化的 API 暴露给渲染进程。

**暴露的 API 表面**:

| API | 方法 | 安全机制 |
|-----|------|---------|
| `vscode.ipcRenderer` | `send`, `invoke`, `on`, `once`, `removeListener` | 所有通道必须以 `vscode:` 前缀开头 |
| `vscode.ipcMessagePort` | `acquire` | 需要 nonce 验证 |
| `vscode.webFrame` | `setZoomLevel` | 仅接受 number 类型 |
| `vscode.webUtils` | `getPathForFile` | 只读操作 |
| `vscode.process` | `platform`, `arch`, `env`, `versions`, `type`, `execPath`, `cwd`, `shellEnv`, `getProcessMemoryInfo`, `on` | 只读属性 + 受限方法 |
| `vscode.context` | `configuration`, `resolveConfiguration` | 只读配置访问 |

### 3.2 IPC 通道验证 (渲染进程侧)

```typescript
function validateIPC(channel: string): true | never {
    if (!channel?.startsWith('vscode:')) {
        throw new Error(`Unsupported event IPC channel '${channel}'`);
    }
    return true;
}
```

所有通过 preload 暴露的 IPC 方法都强制执行 `vscode:` 前缀检查，防止渲染进程发送任意 IPC 消息。

### 3.3 安全评估

- **Context Isolation**: 通过 `contextBridge.exposeInMainWorld()` 实现，渲染进程无法直接访问 Node.js 或 Electron 原始 API
- **最小权限原则**: 仅暴露必要的 IPC、webFrame、process 子集
- **输入验证**: IPC 通道有前缀白名单验证

---

## 4. IPC 通信安全

### 4.1 ValidatedIpcMain

**文件**: `src/vs/base/parts/ipc/electron-main/ipcMain.ts`

主进程使用 `ValidatedIpcMain` 替代原始 `electron.ipcMain`，对每个 IPC 事件进行多层验证：

```typescript
private validateEvent(channel: string, event: ...): boolean {
    // 1. 通道前缀验证: 必须以 'vscode:' 开头
    if (!channel?.startsWith('vscode:')) { return false; }

    // 2. 发送者 URL 验证: 必须来自合法的 vscode 源
    const url = sender?.url;

    // 3. Host 验证: 必须匹配 VSCODE_AUTHORITY
    if (host !== VSCODE_AUTHORITY) { return false; }

    // 4. Frame 验证: 必须是主 frame (非嵌入 iframe)
    if (sender?.parent !== null) { return false; }

    return true;
}
```

**四层验证**:
1. **通道白名单**: 只接受 `vscode:` 前缀的通道
2. **来源 URL 验证**: 检查发送者的 URL 是否来自合法的 VS Code 资源
3. **Host 验证**: 确认 host 为 `VSCODE_AUTHORITY`
4. **Frame 层级验证**: 确保消息来自顶层 frame，防止嵌入式 iframe 发送 IPC

### 4.2 双端验证

- **渲染进程 (preload)**: `validateIPC()` — 只允许 `vscode:` 通道
- **主进程**: `ValidatedIpcMain` — 四层验证 (通道 + URL + Host + Frame)

这形成了完整的双端 IPC 安全链。

---

## 5. Session 权限与请求过滤

### 5.1 权限控制

**文件**: `src/vs/code/electron-main/app.ts` (第 175-223 行)

```
configureSession() 方法中定义了严格的权限控制:
```

**权限白名单**:

| 上下文 | 允许的权限 |
|--------|-----------|
| 所有 | `pointerLock`, `notifications` |
| Webview | + `clipboard-read`, `clipboard-sanitized-write`, `deprecated-sync-clipboard-read` |
| 核心窗口 | + `media`, `local-fonts`, `deprecated-sync-clipboard-read` |
| 其他来源 | **全部拒绝** |

```typescript
session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    if (isUrlFromWebview(details.requestingUrl)) {
        return callback(allowedPermissionsInWebview.has(permission));
    }
    if (isUrlFromWindow(details.requestingUrl)) {
        return callback(allowedPermissionsInCore.has(permission));
    }
    return callback(false);  // 默认拒绝
});
```

### 5.2 请求过滤 (webRequest)

**文件**: `src/vs/code/electron-main/app.ts` (第 285-356 行)

**三层请求过滤**:

1. **webview 请求过滤** (第 285-310 行):
   - `vscode-webview://` 请求必须来自主编辑器窗口
   - `vscode-file://` 请求必须来自主 frame
   - SVG 请求仅允许特定 scheme: `file`, `vscode-file`, `vscode-remote`, `vscode-managed-remote`, `devtools`

2. **SVG Content-Type 修正** (第 314-336 行):
   - 确保 SVG 响应使用正确的 `image/svg+xml` Content-Type
   - 非安全上下文的 SVG 请求被阻止

3. **CORS 处理** (第 343-354 行):
   - 仅为 Microsoft PRSS CDN 添加 CORS 头
   - 其他来源不受影响

### 5.3 自定义协议注册

**文件**: `src/vs/code/electron-main/app.ts`

| 协议 | 类型 | 用途 | 安全验证 |
|------|------|------|---------|
| `vscode-managed-remote-resource` | Buffer | 远程资源代理 | 验证 authority 必须以 `window:` 开头 |
| `vscode-remote-resource` | HTTP 代理 | 远程资源访问 | scheme 替换为 `http:` |

---

## 6. 文件系统访问控制

### 6.1 UNC 路径限制 (Windows)

**文件**: `src/vs/code/electron-main/app.ts` (第 380-387 行)

```typescript
if (isWindows) {
    if (this.configurationService.getValue('security.restrictUNCAccess') === false) {
        disableUNCAccessRestrictions();
    } else {
        addUNCHostToAllowlist(this.configurationService.getValue('security.allowedUNCHosts'));
    }
}
```

- 默认启用 UNC 路径限制
- 用户可通过 `security.allowedUNCHosts` 配置白名单
- 可通过 `security.restrictUNCAccess` 完全关闭（不推荐）

### 6.2 协议处理安全

```typescript
// 文件协议处理提示配置
[Schemas.file]: 'security.promptForLocalFileProtocolHandling'
[Schemas.vscodeRemote]: 'security.promptForRemoteFileProtocolHandling'
```

打开本地文件和远程文件协议链接时有提示确认机制。

### 6.3 Sandbox 对文件访问的限制

由于 `sandbox: true`，渲染进程无法直接使用 Node.js `fs` 模块。所有文件操作必须通过 IPC 向主进程请求，由主进程的文件系统服务 (`IFileService`, `DiskFileSystemProvider`) 代理执行。

---

## 7. 安全架构总结

```
┌─────────────────────────────────────────────────────┐
│                    渲染进程 (Sandbox)                  │
│                                                       │
│  ┌─────────────┐    contextBridge     ┌────────────┐ │
│  │  VS Code UI  │ ◄──────────────────► │  preload.ts │ │
│  │  (隔离上下文)  │    vscode.* API     │  (受限 API)  │ │
│  └──────┬───────┘                     └──────┬─────┘ │
│         │ vscode:* 通道验证                    │       │
└─────────┼───────────────────────────────────┼───────┘
          │ IPC (仅 vscode:* 通道)              │
          ▼                                    ▼
┌─────────────────────────────────────────────────────┐
│                    主进程                             │
│                                                       │
│  ┌──────────────────┐  ┌───────────────────────────┐ │
│  │ ValidatedIpcMain  │  │  Session 权限控制           │ │
│  │ - 通道白名单       │  │  - 权限白名单              │ │
│  │ - URL 来源验证     │  │  - 请求过滤 (SVG/webview) │ │
│  │ - Host 验证       │  │  - CORS 控制              │ │
│  │ - Frame 层级验证   │  │  - 协议注册安全            │ │
│  └──────────────────┘  └───────────────────────────┘ │
│                                                       │
│  ┌──────────────────┐  ┌───────────────────────────┐ │
│  │ 文件系统服务       │  │  UNC 路径限制 (Windows)    │ │
│  │ (DiskFileSystem)  │  │  协议处理提示              │ │
│  └──────────────────┘  └───────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 8. Claude Editor 特有的安全考虑

作为集成 Claude Code 的 IDE，以下是需要额外关注的安全点：

### 8.1 Claude Code CLI 集成

Claude Code 通过 CLI 子进程调用集成。需确保：
- [ ] CLI 进程不以 root 权限运行
- [ ] CLI stdin/stdout 通信有超时和大小限制
- [ ] 用户确认高风险操作（文件删除、命令执行）

### 8.2 MCP Server 通信

MCP (Model Context Protocol) 服务器是外部进程：
- [ ] 验证 MCP 服务器的来源和签名
- [ ] 限制 MCP 服务器的文件系统访问范围
- [ ] MCP 消息有 schema 验证

### 8.3 扩展主机隔离

VS Code 扩展运行在独立的扩展主机进程中：
- [x] 扩展主机有独立的进程 (`ExtensionHostStarter`)
- [ ] 验证内置 Claude 扩展不会绕过 sandbox

---

## 9. 建议与后续行动

### 已满足的安全要求 (无需修改)

1. **sandbox: true** — 已在 `defaultBrowserWindowOptions` 中全局启用
2. **contextIsolation** — 通过 sandbox 隐式启用
3. **nodeIntegration: false** — 通过 sandbox 隐式禁用
4. **IPC 双端验证** — preload + ValidatedIpcMain 形成完整链
5. **权限最小化** — Session 权限白名单默认拒绝

### 建议改进项

| 优先级 | 项目 | 说明 |
|--------|------|------|
| 中 | CSP 头配置 | 当前未发现显式 CSP 头设置，VS Code 依赖 Electron 默认 CSP + 请求过滤。可考虑为 Claude Editor 添加显式 CSP `default-src 'self'` |
| 中 | Claude Code CLI 沙箱 | CLI 子进程运行时需要额外的权限限制（如 macOS Sandbox entitlements） |
| 低 | MCP 服务器签名验证 | MCP 服务器进程应有可选的签名验证机制 |
| 低 | 审计日志 | 记录安全相关事件（权限请求、被阻止的请求、IPC 验证失败）到单独的安全日志 |

---

## 10. 关键文件索引

| 文件 | 安全功能 |
|------|---------|
| `src/vs/platform/windows/electron-main/windows.ts` | `defaultBrowserWindowOptions()` — sandbox:true 配置 |
| `src/vs/platform/windows/electron-main/windowImpl.ts` | BrowserWindow 创建，preload 配置 |
| `src/vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService.ts` | 辅助窗口安全配置 |
| `src/vs/base/parts/sandbox/electron-browser/preload.ts` | 主窗口 preload — contextBridge + IPC 验证 |
| `src/vs/base/parts/sandbox/electron-browser/preload-aux.ts` | 辅助窗口 preload |
| `src/vs/base/parts/ipc/electron-main/ipcMain.ts` | ValidatedIpcMain — 主进程 IPC 四层验证 |
| `src/vs/code/electron-main/app.ts` | Session 配置、权限控制、请求过滤、协议注册 |
| `src/vs/code/electron-main/main.ts` | 应用入口 |
