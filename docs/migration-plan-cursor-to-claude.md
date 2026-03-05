# Cursor → Claude Editor 迁移方案

> 日期: 2026-03-05
> 基于: extractor + analyzer + ai-hunter 三份分析报告
> 策略: 直接使用 Cursor 完整代码，只替换 AI 后端 + 品牌

---

## 核心原则

1. **UI 完全不动** — Cursor 的前端 UI（Composer、Agent、Inline Edit、Tab 补全）原样保留
2. **只改后端** — AI 调用从 Cursor 服务器 → Claude Code CLI
3. **移除私有** — 遥测、计费、认证等 Cursor 私有功能
4. **品牌替换** — Cursor → Claude Editor（名称、图标、颜色）

---

## 迁移策略: Bundle 层面修补

### 为什么选择这种方式

Cursor 的核心代码打包在一个 **51MB 的 workbench.desktop.main.js** 里，包含 1807 个模块。
全部反混淆不现实（之前做了 ~100 个文件就花了大量时间）。

**方案**: 直接在 minified bundle 上做精确修补（Surgical Patching）：
- 字符串替换 API 端点
- 注入适配层拦截 gRPC 调用
- 移除遥测代码块
- 扩展层做更深度的修改（扩展代码量小且可读性较好）

### 基底

使用 `extracted/cursor-app/` 作为基底（已是完整提取，17,555 文件，504MB）。

---

## Phase 0: 基础准备（预计工作量：小）

### 0.1 创建工作目录
```
cp -r extracted/cursor-app/ build/claude-editor-app/
```

### 0.2 product.json 品牌替换

| 字段 | 原值 | 新值 |
|------|------|------|
| applicationName | cursor | claude-editor |
| nameShort | Cursor | Claude Editor |
| nameLong | Cursor | Claude Editor |
| dataFolderName | .cursor | .claude-editor |
| urlProtocol | cursor | claude-editor |
| darwinBundleIdentifier | com.todesktop.230313mzl4w4u92 | com.anthropic.claude-editor |
| serverApplicationName | cursor-server | claude-editor-server |
| serverDataFolderName | .cursor-server | .claude-editor-server |
| tunnelApplicationName | cursor-tunnel | claude-editor-tunnel |
| reportIssueUrl | github.com/getcursor/cursor | github.com/anthropics/claude-editor |
| downloadUrl | cursor.com/downloads | (我们的下载地址) |
| releaseNotesUrl | cursor.com/changelog | (我们的更新日志) |
| licenseUrl | cursor.com/license.txt | (我们的许可证) |

### 0.3 移除遥测配置

从 product.json 中删除：
- `statsigClientKey`
- `statsigLogEventProxyUrl`
- `enableTelemetry` → `false`

### 0.4 更新扩展市场

| 字段 | 新值 |
|------|------|
| extensionsGallery.serviceUrl | Open VSX Registry URL |
| extensionsGallery.itemUrl | Open VSX Item URL |

### 0.5 移除扩展限制

- 移除 `cannotImportExtensions`（允许 Copilot，用户自由选择）
- 保留 `extensionReplacementMapForImports`（Anysphere 的替换仍然有用）

---

## Phase 1: AI 后端替换（预计工作量：大）

这是最核心的工作。

### 1.1 端点替换 — 在 bundle 中搜索替换

在 `workbench.desktop.main.js` 和 `main.js` 中执行以下替换：

| 搜索 | 替换 | 说明 |
|------|------|------|
| `api2.cursor.sh` | `localhost:0` (禁用) | 主 AI API |
| `api3.cursor.sh` | `localhost:0` (禁用) | Tab 补全 API |
| `api4.cursor.sh` | `localhost:0` (禁用) | 辅助 API |
| `repo42.cursor.sh` | `localhost:0` (禁用) | 代码索引 |
| `agent.api5.cursor.sh` | `localhost:0` (禁用) | Background Agent |
| `agentn.api5.cursor.sh` | `localhost:0` (禁用) | Background Agent 备用 |
| `agent-gcpp-*.api5.cursor.sh` | `localhost:0` (禁用) | 区域 Agent |
| `prod.authentication.cursor.sh` | `localhost:0` (禁用) | 认证 |
| `dev.authentication.cursor.sh` | `localhost:0` (禁用) | 认证(dev) |
| `authenticator.cursor.sh` | `localhost:0` (禁用) | 认证 UI |
| `metrics.cursor.sh` | `localhost:0` (禁用) | Sentry |
| `marketplace.cursor.sh` | Open VSX URL | 扩展市场 |
| `marketplace.cursorapi.com` | Open VSX URL | 扩展市场 |

### 1.2 适配层注入 — Claude Code Bridge Service

创建一个新的 Node.js 服务模块，在 Electron 主进程中运行：

```typescript
// claude-code-bridge.js
// 作用：拦截 Cursor 的 gRPC 调用，转发给 Claude Code CLI

import { spawn } from 'child_process';
import http from 'http';

class ClaudeCodeBridge {
  private claudeProcess: ChildProcess | null = null;

  // 启动本地 HTTP 服务器，模拟 Cursor 的 gRPC 端点
  async start(port: number) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    server.listen(port);
  }

  // 将 Cursor 的 gRPC 请求格式转换为 Claude Code CLI 输入
  async handleRequest(req, res) {
    // 解析 Connect-RPC 请求
    // 转换为 Claude Code CLI 命令
    // 流式返回响应
  }

  // 启动/管理 Claude Code CLI 进程
  async ensureClaudeCode() {
    if (!this.claudeProcess) {
      this.claudeProcess = spawn('claude', [
        '--output-format', 'stream-json',
        '--verbose'
      ], { stdio: ['pipe', 'pipe', 'pipe'] });
    }
    return this.claudeProcess;
  }
}
```

**关键点**:
- 这个 Bridge 在本地启动一个 HTTP 服务器
- workbench bundle 中的端点被替换为 `localhost:{port}`
- Bridge 将 Connect-RPC 格式的请求翻译为 Claude Code CLI 调用
- 这样 **前端代码完全不需要改动**

### 1.3 gRPC 服务映射

57 个 aiserver.v1 服务的处理方式：

| 类别 | 服务数 | Bridge 处理方式 |
|------|--------|----------------|
| 核心 AI（Chat/Agent/CmdK） | 11 | 转发给 Claude Code CLI |
| Background Agent | 5 | 转发给本地 headless Claude Code |
| 代码库服务 | 9 | 本地实现（ripgrep/git） |
| 认证计费 | 6 | 返回空/成功响应（bypass） |
| 遥测分析 | 11 | 静默丢弃（no-op） |
| 其他功能 | 15 | 按需实现或 no-op |

### 1.4 认证替换

替换 Cursor OAuth 为 Claude API Key：

1. **移除** Cursor 认证流程（OAuth + authenticator.cursor.sh）
2. **新增** Claude API Key 输入界面
3. **存储** API Key 到 SecretStorage（复用 VS Code 的安全存储）
4. **注入** API Key 到所有 Claude Code CLI 调用

### 1.5 模型配置

Cursor 的模型选择 UI 保留，但列表改为 Claude 模型：

| 原 Cursor 模型 | Claude Editor 模型 |
|----------------|-------------------|
| gpt-4o | claude-sonnet-4-6 |
| claude-3.5-sonnet | claude-sonnet-4-6 |
| gpt-4 | claude-opus-4-6 |
| claude-3-opus | claude-opus-4-6 |
| cursor-small | claude-haiku-4-5 |

模型列表通过 Bridge Service 返回，不需要改前端代码。

---

## Phase 2: 移除 Cursor 私有功能（预计工作量：中）

### 2.1 Sentry 移除

在 bundle 中定位并禁用 Sentry DSN：
```
搜索: 80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh/4508016051945472
替换: (空字符串或无效 DSN)
```

同时在 main.js 中移除 Sentry 初始化。

### 2.2 Statsig 移除

- 从 product.json 删除 `statsigClientKey`
- 在 bundle 中将 Statsig 初始化调用替换为空操作
- 所有 feature gate 检查默认返回 true（功能全部启用）

### 2.3 计费系统移除

在 Bridge Service 中：
- `TeamCreditsService` → 返回无限额度
- `DashboardService` → 返回空仪表板
- `AuthService` → 返回已认证状态
- 订阅状态 → 始终返回 "Pro"

### 2.4 遥测 no-op

11 个遥测服务在 Bridge 中全部返回空成功响应。

---

## Phase 3: 品牌替换（预计工作量：小-中）

### 3.1 CSS 变量品牌色

**不改 CSS 变量名**（`--cursor-*` 保留）—— 改值不改名，减少工作量。

在 `workbench.desktop.main.css` 中替换核心色值：

| 用途 | Cursor 色值 | Claude 色值 |
|------|------------|------------|
| 主强调色 | #007ACC (蓝) | #D97757 (Clay/陶土) |
| 编辑器背景 (Dark) | #181818 | #1A1A1A |
| 侧边栏 (Dark) | #141414 | #141414 |
| 成功色 | 绿色系 | 保留 |
| 错误色 | 红色系 | 保留 |

### 3.2 图标和 Logo

| 资源 | 位置 | 操作 |
|------|------|------|
| Logo | out/media/logo.png | 替换为 Claude Logo |
| 应用图标 | Info.plist + .icns | 替换为 Claude 图标 |
| 加载动画 | out/media/loading-*.svg | 可选替换 |
| Code Icon | out/media/code-icon.svg | 替换 |

### 3.3 文本品牌替换

在 `nls.messages.json` (720KB) 中替换用户可见的 "Cursor" 文本：
- 产品名称
- 欢迎信息
- 设置描述
- 帮助文本

### 3.4 主题扩展

将 `extensions/theme-cursor/` 复制为 `extensions/theme-claude/`：
- 重命名主题：Cursor Dark → Claude Dark, etc.
- 调整核心色值为 Claude 品牌色
- 保留其他 UI 布局色值不变

---

## Phase 4: 扩展适配（预计工作量：中）

### 4.1 需要重写的扩展

| 扩展 | 原大小 | 改动 | 说明 |
|------|--------|------|------|
| cursor-agent | 38.8MB | **重写核心** | 移除 Anthropic Proxy，直接调用 Claude Code CLI |
| cursor-always-local | 4.0MB | **重构** | 移除云端同步，保留本地功能 |

### 4.2 需要适配的扩展

| 扩展 | 改动 | 说明 |
|------|------|------|
| cursor-agent-exec | 小改 | 更新 Agent 工具注册 |
| cursor-mcp | 小改 | 移除 Lease 管理，保留本地 MCP |
| cursor-retrieval | 中改 | 移除 repo42 云端索引 |
| cursor-commits | 小改 | 更新 API 调用 |
| cursor-resolver | 评估 | Background Agent 是否保留 |

### 4.3 直接保留的扩展

| 扩展 | 说明 |
|------|------|
| cursor-browser-automation | 浏览器自动化，直接可用 |
| cursor-shadow-workspace | 影子工作区，直接可用 |
| cursor-deeplink | 深度链接，改协议名即可 |
| cursor-worktree-textmate | TextMate 语法，直接可用 |
| cursor-polyfills-remote | Polyfills，直接可用 |
| cursor-ndjson-ingest | 日志，直接可用 |
| cursor-file-service | 存根，直接可用 |
| cursor-socket | Socket，直接可用 |

### 4.4 移除的扩展

无。所有扩展都有保留价值，最多只是禁用部分功能。

---

## Phase 5: 构建和分发（预计工作量：中）

### 5.1 Electron 打包

- 替换 todesktop → electron-builder
- 配置 macOS 代码签名 + 公证
- 配置 Windows 代码签名
- 配置 Linux .deb / .rpm / .AppImage

### 5.2 自动更新

- 搭建更新服务器（或使用 GitHub Releases）
- 配置 Squirrel (macOS) / Electron-updater

### 5.3 原生二进制

| 二进制 | 操作 |
|--------|------|
| cursorsandbox | 重命名或替换 |
| crepectl | 评估是否需要 |
| cursor-terminal-wrapper | 重命名 |
| cursor-tunnel | 替换为 claude-editor-tunnel |

---

## 执行顺序和依赖

```
Phase 0 (基础准备)
    ├── 0.1 创建工作目录
    ├── 0.2 product.json 修改
    ├── 0.3 移除遥测配置
    ├── 0.4 扩展市场配置
    └── 0.5 扩展限制调整
         │
Phase 1 (AI 后端替换) ← 最关键
    ├── 1.1 端点字符串替换
    ├── 1.2 Claude Code Bridge Service 开发 ← 核心工作
    ├── 1.3 gRPC 服务映射实现
    ├── 1.4 认证替换
    └── 1.5 模型配置
         │
Phase 2 (移除私有功能) ← 可与 Phase 1 并行
    ├── 2.1 Sentry 移除
    ├── 2.2 Statsig 移除
    ├── 2.3 计费 bypass
    └── 2.4 遥测 no-op
         │
Phase 3 (品牌替换) ← 可与 Phase 1/2 并行
    ├── 3.1 CSS 色值替换
    ├── 3.2 图标 Logo
    ├── 3.3 文本替换
    └── 3.4 主题扩展
         │
Phase 4 (扩展适配)
    ├── 4.1 cursor-agent 重写 ← 依赖 Phase 1.2
    ├── 4.2 其他扩展适配
    └── 4.3 保留扩展检查
         │
Phase 5 (构建分发)
    ├── 5.1 Electron 打包
    ├── 5.2 自动更新
    └── 5.3 原生二进制
```

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Bundle 字符串替换破坏代码 | 中 | 高 | 精确匹配，替换后立即测试启动 |
| Bridge Service 协议兼容性 | 高 | 高 | 使用 @connectrpc 库解析真实 gRPC 格式 |
| 原生二进制缺失导致崩溃 | 低 | 中 | 提供 fallback 实现 |
| 扩展依赖 Cursor 私有 API | 中 | 中 | 逐个扩展测试，提供 stub |
| 代码签名问题 | 低 | 低 | macOS 公证流程文档完善 |

---

## 验收标准

### 最小可用版本 (MVP)

- [ ] 应用可以正常启动，显示 Claude Editor 品牌
- [ ] Composer 面板可以打开和关闭
- [ ] 可以通过 Claude API Key 认证
- [ ] 可以发送消息并收到 Claude 回复
- [ ] 内联编辑 (Cmd+K) 可以工作
- [ ] Agent 模式可以执行工具调用
- [ ] 没有向 cursor.sh 发送任何请求
- [ ] 没有遥测数据外泄

### 完整版本

- [ ] Tab 补全工作正常
- [ ] Background Agent 可以使用
- [ ] MCP 工具集成正常
- [ ] 扩展市场可以搜索和安装
- [ ] 自动更新工作正常
- [ ] 三平台构建 (macOS/Windows/Linux)
