# Cursor IDE 逆向分析计划

> **分析版本**: Cursor 2.6.11 (基于 VS Code 1.105.1)
> **Electron 版本**: 39.6.0 (Chromium 134)
> **DMG 路径**: `/Users/sollin/Claude-Editor/Cursor-darwin-arm64.dmg`
> **创建日期**: 2026-03-04
> **更新日期**: 2026-03-04
> **操作 Agent**: reverse-engineer (逆向工程师)

> **重点**: Agent Mode 之后的新 UI 设计，详见 [Agent Mode UI 深度分析](./agent-mode-ui-analysis.md)

---

## 一、逆向步骤

### 1.1 挂载与解包

```bash
# 挂载 DMG
hdiutil attach /Users/sollin/Claude-Editor/Cursor-darwin-arm64.dmg -mountpoint /tmp/cursor-mount

# Cursor 不使用顶层 app.asar！源码直接以目录形式存放
# 主要源码路径:
/tmp/cursor-mount/Cursor.app/Contents/Resources/app/

# 唯一的 asar 文件（实际只有 28 字节，是个占位文件）:
/tmp/cursor-mount/Cursor.app/Contents/Resources/app/node_modules.asar

# 完成后卸载
hdiutil detach /tmp/cursor-mount
```

**重要发现**: Cursor 不像典型的 Electron 应用那样把代码打包到 `app.asar`。它直接把编译后的 JS 文件放在 `Resources/app/` 目录里。虽然代码是 minified 的（压缩混淆的），但结构非常清晰。

### 1.2 关键文件和目录

| 路径 | 大小 | 说明 |
|------|------|------|
| `out/main.js` | 1.3MB | Electron 主进程入口 |
| `out/vs/workbench/workbench.desktop.main.js` | 53MB | 渲染进程主 bundle（核心！） |
| `out/vs/workbench/workbench.desktop.main.css` | 1.8MB | 所有 CSS 样式 |
| `out/nls.keys.json` | 456KB | 国际化键名（功能/命令索引） |
| `out/nls.messages.json` | 720KB | 国际化消息文本 |
| `product.json` | 57KB | 产品配置（API 密钥、功能开关、扩展配置） |
| `package.json` | 418B | 基本包信息 |
| `extensions/` | 109 个扩展 | 包含 16 个 Cursor 专有扩展 |

### 1.3 Cursor 专有扩展清单

| 扩展名 | 说明 | 核心文件大小 |
|--------|------|-------------|
| `cursor-agent` | Agent 执行引擎，内嵌 Claude Agent SDK | 3MB |
| `cursor-agent-exec` | Agent 命令执行、文件操作、工具调用 | - |
| `cursor-mcp` | MCP (Model Context Protocol) 支持 | 1.6MB |
| `cursor-retrieval` | 代码索引和检索（使用 @anysphere/file-service） | - |
| `cursor-browser-automation` | 浏览器自动化 MCP 服务器 | - |
| `cursor-commits` | 请求/提交追踪 | - |
| `cursor-deeplink` | 深度链接 URI 处理 | - |
| `cursor-file-service` | 文件服务 | - |
| `cursor-ndjson-ingest` | NDJSON 数据摄入 | - |
| `cursor-polyfills-remote` | 远程环境 polyfills | - |
| `cursor-resolver` | 远程连接解析 | - |
| `cursor-shadow-workspace` | 影子工作区（后台代码分析） | - |
| `cursor-socket` | TCP/TLS socket 提供者 | - |
| `cursor-worktree-textmate` | Worktree TextMate 语法支持 | - |
| `cursor-always-local` | 确保某些功能始终在本地运行 | - |
| `theme-cursor` | Cursor 主题（4 个变体） | - |

---

## 二、AI 交互设计分析计划

### 2.1 Chat 面板（Composer）

**发现**: Cursor 把 AI 对话功能叫做 "Composer"，而不是简单的 "Chat"。这是它的核心功能。

**关键标识符**:
- 面板 ID: `workbench.panel.composerChatViewPane`
- 旧版 AI Chat: `workbench.panel.aichat` / `workbench.panel.aichat.view`
- 编辑面板: `workbench.panel.chat.view.edits`

**CSS 类名**（共 424 个 composer 相关类）:
- `composer-bar` — 输入栏
- `composer-code-block-anysphere` — 代码块渲染
- `composer-autocomplete-ghost` — 自动补全幽灵文本
- `composer-cloud-transfer-*` — 云端 Agent 传输
- `composer-create-plan-*` — 计划创建
- `composer-checkout-to-message` — 检出到消息
- `composer-animated-title__text` — 动画标题

**分析重点**:
1. Composer 的 WebView 预加载脚本: `out/vs/workbench/contrib/composer/browser/preload-webview-browser.js`
2. 在 workbench bundle 中搜索 `composerChatViewPane` 的注册逻辑
3. 消息渲染、代码块高亮、Markdown 解析的实现
4. 流式响应的前端处理机制

**分析命令**:
```bash
# 提取 Composer 相关 CSS
python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css', 'r') as f:
    css = f.read()
# 搜索 .composer- 开头的规则块
for m in re.finditer(r'(\.[^{]*composer[^{]*\{[^}]+\})', css):
    print(m.group(1)[:200])
"

# 提取 Composer 命令列表
python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js', 'r') as f:
    content = f.read()
for m in sorted(set(re.findall(r'\"(composer\.[a-zA-Z_.]+)\"', content))):
    print(m)
"
```

### 2.2 Inline Edit（内联编辑）

**关键标识符**:
- 上下文键: `inlineEditIsVisible`, `inlineEditsGutterIndicatorUserKind`
- 颜色 token: `inlineEdit.originalBackground`, `inlineEdit.modifiedBackground`, `inlineEdit.gutterIndicator.*`
- 命令: `action.inlineSuggest.trigger.explicitInlineEdit`

**分析重点**:
1. 内联编辑的触发条件（Cmd+K？选中代码后？）
2. Inline Diff 的渲染机制（原始代码 vs 修改代码的并排展示）
3. 接受/拒绝的交互流程
4. Gutter indicator 的视觉反馈
5. `inlineDiffService` 服务的实现

**分析命令**:
```bash
# 提取 InlineEdit/InlineDiff 相关代码片段
python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js', 'r') as f:
    content = f.read()
# 搜索 inlineDiff 相关上下文
for m in re.finditer(r'.{0,100}inlineDiff.{0,100}', content):
    print(m.group()[:200])
    print('---')
" | head -100
```

### 2.3 Agent 模式

**关键发现**: Cursor 有两种 Agent 模式:
1. **前台 Agent** — 在 Composer 面板中交互
2. **Background Agent** — 云端运行的后台 Agent（`workbench.view.backgroundAgent`）

**Agent 相关命令**（从 NLS keys 中发现）:
- `workbench.action.backgroundComposer.applyChangesLocally` — 将云端修改同步到本地
- `workbench.action.backgroundComposer.checkoutLocally` — 本地检出
- `workbench.action.backgroundComposer.createPRFromPeekContent` — 直接创建 PR
- `workbench.action.backgroundComposer.archive` — 归档
- `workbench.action.backgroundComposer.openDevTools` — 调试工具

**Agent 布局系统**（937+ 个 CSS 类）:
- `agent-layout-*` — Agent 专用布局
- `agent-layout-quick-menu` — 快速切换菜单
- `agent-layout-multi-diff-*` — 多文件 diff 视图
- `agent-group-divider` — Agent 分组分隔符

**重要**: Cursor 内嵌了 **@anthropic-ai/claude-agent-sdk v0.2.4**！这说明 Cursor 的 Agent 模式直接使用 Claude Agent SDK 来驱动。

**分析重点**:
1. Agent SDK 的调用方式和参数配置
2. Agent 执行引擎的工具注册机制（`cursor-agent-exec`）
3. Background Agent 的云端通信协议
4. Agent 结果的展示和应用流程

### 2.4 Tab 补全（CPP - Cursor Prediction/Completion）

**关键标识符**:
- `cursor.suggestcpp` — 触发 CPP 建议
- `cursor.acceptcppsuggestion` — 接受建议
- `cursor.acceptcppsuggestionpartial` — 部分接受
- `cursor.rejectcppsuggestion` — 拒绝
- `cursor.revertcppsuggestion` — 撤销
- `cursor.peekcppsuggestion` — 预览
- `cursor.fullcppsuggestion` — 完整建议
- `cursor.cpp.disabledLanguages` — 禁用语言列表
- `cursor.cpp.enablePartialAccepts` — 启用部分接受

**Ghost Text 机制**:
- `ghostText` — 幽灵文本上下文键
- `composer-autocomplete-ghost` — 自动补全幽灵文本

**分析重点**:
1. CPP（Cursor Predictive Programming）的触发时机
2. 预测结果的缓存和预取策略
3. 部分接受（逐词/逐行）的实现
4. 与 LSP/IntelliSense 的整合方式

### 2.5 Diff 预览和应用

**关键机制**:
- `cursor.tinderdiffeditor` — Tinder 风格的 Diff 编辑器（左右滑动？）
- `composerDiffEditor` — Composer 内嵌 Diff 编辑器
- `agent-layout-multi-diff-*` — Agent 模式下的多文件 Diff

**命令**:
- `composer.accept_diff` — 接受单个 diff
- `composer.accept_diff_file` — 接受整个文件的 diff
- `composer.accept_all` — 接受所有修改
- `composer.accept_reject_diff_details` — diff 详情操作
- `composer.acceptComposerStep` — 逐步接受
- `composer.cancelComposerStep` — 取消步骤

**分析重点**:
1. Diff 的计算和渲染方式
2. 逐步接受的实现机制（Checkpoint 系统）
3. 多文件批量操作的 UI/UX
4. 撤销/回滚机制

---

## 三、VS Code 改造分析计划

### 3.1 核心改动点

基于逆向分析，Cursor 对 VS Code 的主要改动:

1. **产品标识替换**
   - `applicationName`: "cursor"（VS Code 是 "code"）
   - `dataFolderName`: ".cursor"
   - `urlProtocol`: "cursor"
   - `bundleIdentifier`: "com.todesktop.230313mzl4w4u92"

2. **Workbench 核心修改**（`workbench.desktop.main.js` - 53MB）
   - 新增 `vs/workbench/contrib/composer/` — Composer（AI Chat + Agent）
   - 新增 `vs/workbench/contrib/agents/` — Agent 管理系统
   - 新增 `vs/workbench/contrib/cursorBlame/` — AI Blame 功能
   - 新增 `vs/workbench/contrib/onboarding/` — 自定义 onboarding
   - 新增 `vs/workbench/services/ai/` — AI 服务层
   - 新增 `vs/workbench/services/agent/` — Agent 执行服务
   - 新增 `vs/workbench/services/cursorAuth/` — Cursor 认证
   - 新增 `vs/workbench/services/cursorfs/` — Cursor 文件系统
   - 修改 `vs/workbench/contrib/inlineChat/` — 增强内联聊天
   - 修改 `vs/workbench/contrib/mcp/` — MCP 集成
   - 新增 `vs/workbench/browser/actions/agentLayoutQuickMenu` — Agent 布局管理
   - 新增 `vs/workbench/api/browser/mainThreadCursor` — Cursor API 主线程桥接

3. **Editor 核心修改**
   - 新增 `vs/editor/browser/services/inlineDiffService` — 内联 Diff 服务
   - 修改 `vs/editor/contrib/inlineCompletions/` — 增强内联补全（Tab 补全）
   - 新增 `vs/editor/contrib/inlineDiffs/` — 内联 Diff 控制器

4. **Extension API 扩展**
   - 自定义 API proposal: `cursor`, `control`, `cursorTracing`
   - 扩展了 VS Code 的 Extension Host

5. **构建打包方式**
   - 使用 todesktop 打包（非标准 Electron Builder）
   - 不使用 asar 打包，源码直接放在目录中
   - 使用 webpack/esbuild 将扩展打包为单文件

### 3.2 扩展系统修改

**扩展替换映射**（`extensionReplacementMapForImports`）:
```json
{
  "ms-vscode-remote.remote-ssh": "anysphere.remote-ssh",
  "ms-python.vscode-pylance": "anysphere.cursorpyright",
  "ms-vscode.cpptools": "anysphere.cpptools",
  "ms-dotnettools.csharp": "anysphere.csharp"
}
```

**禁止安装的扩展**（`cannotImportExtensions`）:
- `github.copilot-chat`
- `github.copilot`
- `ms-vscode.remote-explorer`

**扩展版本限制**（`extensionMaxVersions`）:
- 对多个 MS 扩展设置了版本上下限
- 这确保了与 Cursor 修改的兼容性

### 3.3 主题系统

Cursor 提供 4 个主题变体:

| 主题 | UI Theme 类型 | 基调 |
|------|-------------|------|
| Cursor Dark | vs-dark | 深色，#181818 背景，#141414 侧边栏 |
| Cursor Dark Midnight | vs-dark | 更深的午夜主题 |
| Cursor Dark High Contrast | hc-black | 高对比度深色 |
| Cursor Light | vs | 浅色主题 |

**Cursor Dark 主题核心色值**:
- 编辑器背景: `#181818`
- 侧边栏/面板背景: `#141414`
- 前景文字: `#E4E4E4EB`
- 次要文字: `#E4E4E48D`
- 弱化文字: `#E4E4E442`
- 强调色（蓝色）: `#81A1C1` / `#88C0D0`
- 成功色（绿色）: `#3FA266`
- 错误色（红色）: `#E34671`
- 警告色（黄色）: `#D2943E` / `#F1B467`
- 紫色: `#B48EAD` / `#AAA0FA`
- 边框: `#E4E4E413`
- 选中: `#E4E4E41E`

### 3.4 构建系统

**关键信息**:
- 基于 VS Code 1.105.1 fork
- 使用 todesktop 作为打包工具（而非 electron-builder）
- Electron 39.6.0
- 主 bundle 使用 esbuild 打包（minified）
- 扩展各自独立打包

---

## 四、功能清单提取计划

### 4.1 已识别的 AI 功能

基于 186 个 `cursor.*` 标识符和 209 个 `composer.*` 命令，功能列表:

#### 核心 AI 功能
1. **Composer（AI 对话）** — 主要 AI 交互面板
2. **Background Agent（后台 Agent）** — 云端自主执行任务
3. **CPP（Tab 补全）** — AI 预测代码补全
4. **Inline Edit（内联编辑）** — 选中代码后直接编辑
5. **Inline Chat（内联聊天）** — 编辑器内对话
6. **AI Blame（AI 归因）** — 显示代码的 AI 贡献

#### Agent 功能
7. **Agent 布局管理** — Agent/Editor/Zen/Browser 四种布局模式
8. **Agent 执行引擎** — 工具调用、文件操作、命令执行
9. **Agent 子模型选择** — `cursor.composer.subagentModel`
10. **Agent 计划制定** — `composer-create-plan-*`
11. **Agent Cloud Transfer** — 本地/云端切换

#### 浏览器自动化
12. **内置浏览器** — `cursor.browserView.*` （20+ 个命令）
13. **浏览器自动化** — 截图、导航、执行 JS、控制台日志

#### 工具集成
14. **MCP 支持** — 完整的 MCP 服务器管理
15. **Git 提交消息生成** — `cursor.generateGitCommitMessage`
16. **语义搜索** — `cursor.semanticSearch.*`
17. **语义审查** — `cursor.semanticReview.*`
18. **Shadow Workspace** — 后台代码分析

#### 代码审查
19. **PR 审查** — `cursor.reviewpr`
20. **变更审查** — `cursor.reviewchanges`
21. **Bugbot** — 自动 bug 检测 `cursor.bugbot`

#### 用户体验
22. **自定义提示音** — `cursor.composer.customChimeSoundPath`
23. **Smooth Streaming** — `cursor.chat.smoothStreaming`
24. **Text Size Scale** — `cursor.composer.textSizeScale`
25. **Onboarding 向导** — 主题选择、功能引导
26. **Worktree 管理** — `cursor.worktreesSetup`

### 4.2 快捷键映射提取

需要从 workbench bundle 中提取。关键快捷键:
```bash
# 提取所有 keybinding 定义
python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js', 'r') as f:
    content = f.read()
# 查找 keybinding 注册模式
for m in re.finditer(r'registerKeybindingRule\(\{[^}]*\}', content):
    print(m.group()[:300])
" | head -200
```

**已知快捷键**（基于功能推断）:
- `Cmd+L` — 打开 Composer（AI Chat）
- `Cmd+K` — 触发 Inline Edit
- `Cmd+I` — 触发 Inline Chat
- `Tab` — 接受 CPP 建议
- `Escape` — 关闭/拒绝

### 4.3 配置项提取

所有 `cursor.*` 设置项（从 product.json 和 workbench 中提取）:

```bash
# 提取所有配置项定义
python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js', 'r') as f:
    content = f.read()
for m in sorted(set(re.findall(r'\"(cursor\.\w+(?:\.\w+)*)\"', content))):
    print(m)
"
```

---

## 五、架构经验总结

### 5.1 值得借鉴的设计

1. **Composer 作为统一入口**
   - Cursor 把 Chat、Agent、Plan 等功能统一在 Composer 面板中
   - 不是简单的聊天窗口，而是一个完整的 AI 工作流引擎
   - 这种设计减少了用户的认知负担

2. **Agent 布局系统**
   - 四种预定义布局（Agent/Editor/Zen/Browser）可快速切换
   - 用户可以自定义和保存布局
   - 这对 AI IDE 非常重要，因为不同任务需要不同的窗口配置

3. **Background Agent 概念**
   - 任务可以在云端独立运行
   - 用户可以同时处理多个任务
   - 完成后可以本地检出或直接创建 PR

4. **直接在 Workbench 核心中实现 AI 功能**
   - Composer 不是一个扩展，而是 `vs/workbench/contrib/composer/`
   - AI 服务是 `vs/workbench/services/ai/`
   - 这提供了最好的性能和集成度

5. **Claude Agent SDK 集成**
   - Cursor 内嵌了 @anthropic-ai/claude-agent-sdk
   - 说明 Agent 执行可以利用现成的 SDK
   - 我们的 Claude Editor 也应该深度集成 Claude Agent SDK

6. **MCP 协议支持**
   - 完整的 MCP 服务器管理（发现、启动、停止、重启）
   - 支持多种安装方式（npm、pip、docker、command、http）
   - 自动发现 Claude Desktop 和 Windsurf 的 MCP 配置

7. **扩展替换策略**
   - 用自己的版本替换关键 MS 扩展（SSH、Pylance 等）
   - 禁止安装竞争产品（Copilot）
   - 限制特定扩展版本确保兼容性

### 5.2 应该避免的设计

1. **过度混淆**
   - 53MB 的 minified bundle 极难维护和调试
   - 我们应该考虑更好的代码分割策略
   - 至少保留 source map 用于开发

2. **todesktop 打包**
   - 依赖第三方打包服务
   - 我们应该使用标准的 electron-builder 保持开源可控

3. **禁止竞品扩展**
   - 硬编码禁止列表不够优雅
   - 我们可以用更友好的方式处理（提示冲突而非直接禁止）

4. **telemetry 集成**
   - Cursor 深度集成了 Statsig（A/B 测试平台）
   - 我们应该默认关闭遥测，尊重开源用户隐私

5. **扩展替换的维护成本**
   - 替换 6+ 个 MS 扩展意味着要持续跟进上游更新
   - 我们应该尽量减少需要 fork 的扩展数量

---

## 六、详细分析执行计划

### Phase 1: 主题和 UI 规范提取（优先级: 高）

- [ ] 完整提取 Cursor Dark 主题的所有颜色 token
- [ ] 提取 CSS 中的 Cursor 专有组件样式
- [ ] 分析 onboarding 页面的设计
- [ ] 截取关键 UI 界面用于参考

### Phase 2: Composer 深度分析（优先级: 高）

- [ ] 分析 Composer 面板的组件结构
- [ ] 提取消息渲染逻辑（代码块、Markdown、引用等）
- [ ] 分析流式响应的前端处理
- [ ] 分析 Composer 的状态管理
- [ ] 理解 Composer Tab（多会话）的实现

### Phase 3: Agent 系统分析（优先级: 高）

- [ ] 分析 cursor-agent 扩展的工具注册机制
- [ ] 分析 cursor-agent-exec 的命令执行流程
- [ ] 理解 Claude Agent SDK 的集成方式
- [ ] 分析 Background Agent 的通信协议
- [ ] 理解 Agent 布局系统

### Phase 4: Tab 补全 & Inline Edit 分析（优先级: 中）

- [ ] 分析 CPP 的触发和缓存机制
- [ ] 分析 Inline Edit 的 UI 交互流程
- [ ] 分析 Inline Diff 的渲染方式
- [ ] 理解 Ghost Text 的实现

### Phase 5: MCP & 工具集成分析（优先级: 中）

- [ ] 分析 cursor-mcp 的服务器管理
- [ ] 分析 browser-automation 的实现
- [ ] 理解 cursor-retrieval 的索引机制
- [ ] 分析 Shadow Workspace 的工作原理

### Phase 6: 构建系统分析（优先级: 低）

- [ ] 分析 VS Code 1.105.1 到 Cursor 的 diff
- [ ] 理解自定义 API proposals 的注册方式
- [ ] 分析 Extension Host 的修改
- [ ] 理解 product.json 中各字段的作用

---

## 七、工具和脚本

以下脚本在分析过程中需要重复使用:

```bash
# 确保 DMG 已挂载
mount_cursor() {
  hdiutil attach /Users/sollin/Claude-Editor/Cursor-darwin-arm64.dmg -mountpoint /tmp/cursor-mount 2>/dev/null
}

# 在 workbench bundle 中搜索关键词
search_workbench() {
  python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js', 'r', errors='ignore') as f:
    content = f.read()
for m in re.finditer(r'.{0,100}$1.{0,100}', content):
    print(m.group()[:250])
    print('---')
" | head -50
}

# 在 CSS 中搜索样式
search_css() {
  python3 -c "
import re
with open('/tmp/cursor-mount/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css', 'r') as f:
    css = f.read()
for m in re.finditer(r'[^}]*$1[^}]*\{[^}]+\}', css):
    print(m.group()[:300])
    print('---')
" | head -50
}
```

---

## 八、对 Claude Editor 的启示

基于以上分析，对 Claude Editor 项目的关键建议:

1. **也应该在 workbench 核心中实现 AI 功能**，而非仅作为扩展
2. **直接集成 Claude Agent SDK**（Cursor 已经在用了！）
3. **参考 Composer 的设计**，但用 Claude 的品牌语言重新设计
4. **支持 MCP 协议**，这已经是行业标准
5. **实现 Background Agent**，这是差异化竞争力
6. **VS Code 版本选择**: Cursor 用的 1.105.1，我们可以用最新稳定版
7. **主题系统**: 参考 Cursor 的 token 结构，但用 Claude 的配色
8. **构建打包**: 使用标准 electron-builder，不依赖 todesktop
