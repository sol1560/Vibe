# Composer 面板实现规格文档

> **文档类型**: 实现规格（Implementation Specification）
> **基于分析**: agent-mode-ui-analysis.md 中的设计规范
> **目标**: 为 Claude Editor 从零实现 Composer 面板提供完整技术规格
> **操作 Agent**: reverse-engineer-cursor
> **创建日期**: 2026-03-04
> **状态**: 初稿

---

## 一、概述

Composer 是 Claude Editor 的核心 AI 交互面板，所有与 Claude 的对话都通过 Composer 完成。它不是一个简单的聊天窗口，而是一个支持多种模式、多种交互方式的统一 AI 面板。

### 1.1 核心设计理念

- **对话优先**: Composer 是 IDE 的核心，不是附属品
- **模式化**: 不同任务场景使用不同模式（Chat/Plan/Debug 等）
- **流式渲染**: 实时显示 AI 的思考和执行过程
- **上下文保持**: 长对话中通过 Sticky 头保持上下文
- **沉浸体验**: Glass Mode 提供毛玻璃效果的沉浸式 UI

### 1.2 与 Cursor 的关键差异

| 方面 | Cursor | Claude Editor |
|------|--------|---------------|
| 品牌色 | 蓝/紫色系 | Claude 暖色系（clay #d97757） |
| AI 模型 | 多模型切换 | Claude 专属 |
| 命名空间 | `--cursor-*` | `--claude-editor-*` |
| 模式数量 | 6 种 | 4 种（初始）: Chat/Plan/Debug/Background |
| 最大宽度 | 840px 固定 | 响应式（最大 960px） |

---

## 二、Design Token 系统

### 2.1 CSS 变量命名规范

使用 `--ce-` 前缀（Claude Editor 缩写），分层命名：

```
--ce-{类别}-{语义}-{层级}
```

### 2.2 背景色 Token

```css
:root {
  /* 基础背景 */
  --ce-bg-primary: var(--vscode-editor-background);
  --ce-bg-secondary: var(--vscode-sideBar-background);
  --ce-bg-tertiary: color-mix(in srgb, var(--ce-bg-primary) 95%, var(--ce-text-primary));
  --ce-bg-quaternary: color-mix(in srgb, var(--ce-bg-primary) 90%, var(--ce-text-primary));
  --ce-bg-elevated: var(--vscode-editorWidget-background);
  --ce-bg-active: color-mix(in srgb, var(--ce-bg-primary) 85%, var(--ce-accent-primary));
  --ce-bg-focused: color-mix(in srgb, var(--ce-bg-primary) 90%, var(--ce-accent-primary));

  /* 编辑器/面板特定 */
  --ce-bg-editor: var(--vscode-editor-background);
  --ce-bg-sidebar: var(--vscode-sideBar-background);
  --ce-bg-card: var(--vscode-editorWidget-background);
  --ce-bg-input: var(--vscode-input-background);

  /* Diff */
  --ce-bg-diff-inserted: var(--vscode-diffEditor-insertedLineBackground);
  --ce-bg-diff-removed: var(--vscode-diffEditor-removedLineBackground);
}
```

### 2.3 语义色 Token（模式颜色）

```css
:root {
  /* Chat 模式 - 绿色 */
  --ce-bg-green-primary: oklch(0.45 0.15 145);
  --ce-bg-green-secondary: oklch(0.25 0.05 145);
  --ce-text-green-primary: oklch(0.75 0.15 145);
  --ce-stroke-green-primary: oklch(0.45 0.10 145);

  /* Plan 模式 - 黄色 */
  --ce-bg-yellow-primary: oklch(0.55 0.15 85);
  --ce-bg-yellow-secondary: oklch(0.25 0.05 85);
  --ce-text-yellow-primary: oklch(0.80 0.12 85);
  --ce-stroke-yellow-primary: oklch(0.50 0.10 85);

  /* Debug 模式 - 红色 */
  --ce-bg-red-primary: oklch(0.50 0.18 25);
  --ce-bg-red-secondary: oklch(0.25 0.06 25);
  --ce-text-red-primary: oklch(0.75 0.15 25);
  --ce-stroke-red-primary: oklch(0.45 0.12 25);

  /* Background Agent 模式 - 紫色 */
  --ce-bg-magenta-primary: oklch(0.45 0.15 320);
  --ce-bg-magenta-secondary: oklch(0.25 0.05 320);
  --ce-text-magenta-primary: oklch(0.75 0.12 320);
  --ce-stroke-magenta-primary: oklch(0.45 0.10 320);

  /* 信息/辅助 - 青色 */
  --ce-bg-cyan-primary: oklch(0.50 0.12 200);
  --ce-bg-cyan-secondary: oklch(0.25 0.04 200);
  --ce-text-cyan-primary: oklch(0.78 0.10 200);
}
```

### 2.4 文字色 Token

```css
:root {
  --ce-text-primary: var(--vscode-foreground);
  --ce-text-secondary: color-mix(in srgb, var(--vscode-foreground) 70%, transparent);
  --ce-text-tertiary: color-mix(in srgb, var(--vscode-foreground) 50%, transparent);
  --ce-text-quaternary: color-mix(in srgb, var(--vscode-foreground) 35%, transparent);
  --ce-text-active: var(--vscode-foreground);
  --ce-text-link: var(--vscode-textLink-foreground);
}
```

### 2.5 描边 Token

```css
:root {
  --ce-stroke-primary: color-mix(in srgb, var(--vscode-foreground) 20%, transparent);
  --ce-stroke-secondary: color-mix(in srgb, var(--vscode-foreground) 12%, transparent);
  --ce-stroke-tertiary: color-mix(in srgb, var(--vscode-foreground) 8%, transparent);
  --ce-stroke-focused: var(--vscode-focusBorder);
}
```

### 2.6 阴影 Token

```css
:root {
  --ce-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --ce-shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --ce-shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --ce-shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --ce-shadow-workbench: 0 0 0 1px var(--ce-stroke-tertiary);
}
```

### 2.7 间距 Token

```css
:root {
  --ce-spacing-0-5: 2px;
  --ce-spacing-1: 4px;
  --ce-spacing-1-5: 6px;
  --ce-spacing-2: 8px;
  --ce-spacing-2-5: 10px;
  --ce-spacing-3: 12px;
  --ce-spacing-4: 16px;
  --ce-spacing-5: 20px;
  --ce-spacing-6: 24px;
  --ce-spacing-8: 32px;
}
```

### 2.8 圆角 Token

```css
:root {
  --ce-radius-sm: 4px;
  --ce-radius-md: 6px;
  --ce-radius-lg: 8px;
  --ce-radius-xl: 12px;
}
```

### 2.9 字体 Token

```css
:root {
  --ce-font-family: var(--vscode-font-family);
  --ce-font-family-mono: var(--vscode-editor-font-family);
  --ce-font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ce-font-size-xs: 11px;
  --ce-font-size-sm: 12px;
  --ce-font-size-base: 13px;
  --ce-font-size-lg: 14px;
}
```

### 2.10 Composer 模式专用 Token

```css
:root {
  /* 模式颜色映射 */
  --ce-composer-mode-chat-bg: var(--ce-bg-green-secondary);
  --ce-composer-mode-chat-text: var(--ce-text-green-primary);
  --ce-composer-mode-plan-bg: var(--ce-bg-yellow-secondary);
  --ce-composer-mode-plan-text: var(--ce-text-yellow-primary);
  --ce-composer-mode-debug-bg: var(--ce-bg-red-secondary);
  --ce-composer-mode-debug-text: var(--ce-text-red-primary);
  --ce-composer-mode-background-bg: var(--ce-bg-magenta-secondary);
  --ce-composer-mode-background-text: var(--ce-text-magenta-primary);

  /* Composer 布局 */
  --ce-composer-max-width: 960px;
  --ce-composer-padding-x: 14px;
  --ce-composer-padding-bottom: 16px;
}
```

---

## 三、DOM 结构规范

### 3.1 Composer 面板整体结构

```
[data-component="composer-panel"]              // 根容器
├── .composer-header                           // 顶部栏
│   ├── .composer-header-tabs                  // Tab 列表（多会话）
│   │   ├── .composer-tab                      // 单个 Tab
│   │   │   ├── .composer-tab-label            // Tab 标题
│   │   │   ├── .composer-tab-dot              // 未读指示器
│   │   │   └── .composer-tab-close            // 关闭按钮
│   │   └── .composer-tab-new                  // 新建 Tab 按钮
│   └── .composer-header-actions               // 操作按钮区
│       ├── .composer-mode-selector            // 模式选择器
│       └── .composer-settings-btn             // 设置按钮
│
├── .composer-body                             // 消息区域
│   ├── .composer-scroll-container             // 滚动容器
│   │   ├── .composer-message-list             // 消息列表
│   │   │   ├── .composer-sticky-title         // Sticky 标题
│   │   │   ├── .composer-message              // 单条消息
│   │   │   │   ├── .composer-human-message    // 用户消息
│   │   │   │   └── .composer-ai-message       // AI 消息
│   │   │   │       ├── .composer-thinking     // 思考过程
│   │   │   │       ├── .composer-text-block   // 文本块
│   │   │   │       ├── .composer-code-block   // 代码块
│   │   │   │       └── .composer-tool-call    // 工具调用
│   │   │   └── .composer-plan-view            // Plan 模式视图
│   │   │       └── .composer-plan-todo-item   // TODO 项
│   │   └── .composer-empty-state              // 空状态
│   └── .composer-scroll-to-bottom             // 滚动到底部按钮
│
├── .composer-followup-area                    // 跟进区域
│   ├── .composer-suggestion-chips             // 建议操作
│   └── .composer-review-pill                  // 审查按钮
│
└── .composer-input-area                       // 输入区域
    ├── .composer-input-box                    // 输入框容器
    │   ├── .composer-input-editor             // 文本输入（Monaco）
    │   ├── .composer-input-attachments        // 附件列表
    │   └── .composer-input-toolbar            // 底部工具栏
    │       ├── .composer-model-selector       // 模型选择
    │       ├── .composer-attach-btn           // 附件按钮
    │       └── .composer-send-btn             // 发送按钮
    └── .composer-input-hints                  // 输入提示
```

### 3.2 HTML 模板示例

```html
<!-- Composer 面板 -->
<div class="composer-panel" data-component="composer-panel" data-mode="chat">

  <!-- Header -->
  <div class="composer-header">
    <div class="composer-header-tabs">
      <div class="composer-tab active" data-tab-id="tab-1">
        <span class="composer-tab-label">New Chat</span>
        <span class="composer-tab-dot hidden"></span>
        <button class="composer-tab-close" aria-label="Close tab">
          <i class="codicon codicon-close"></i>
        </button>
      </div>
      <button class="composer-tab-new" aria-label="New chat">
        <i class="codicon codicon-plus"></i>
      </button>
    </div>
    <div class="composer-header-actions">
      <div class="composer-mode-selector">
        <span class="composer-mode-badge" data-mode="chat">Chat</span>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="composer-body">
    <div class="composer-scroll-container">
      <div class="composer-message-list">
        <!-- Messages rendered here -->
      </div>
    </div>
  </div>

  <!-- Input Area -->
  <div class="composer-input-area">
    <div class="composer-input-box">
      <div class="composer-input-editor">
        <!-- Monaco editor instance -->
      </div>
      <div class="composer-input-toolbar">
        <button class="composer-attach-btn">
          <i class="codicon codicon-attach"></i>
        </button>
        <div class="composer-toolbar-spacer"></div>
        <button class="composer-send-btn" aria-label="Send message">
          <i class="codicon codicon-send"></i>
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 四、组件样式规范

### 4.1 Composer 面板容器

```css
.composer-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--ce-bg-primary);
  color: var(--ce-text-primary);
  font-family: var(--ce-font-family-sans);
  overflow: hidden;
}
```

### 4.2 Header

```css
.composer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px;
  min-height: 35px;
  padding: 0 var(--ce-spacing-2);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
  background-color: var(--ce-bg-primary);
}

.composer-header-tabs {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-0-5);
  overflow-x: auto;
  flex: 1;
}

.composer-tab {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-1);
  padding: var(--ce-spacing-1) var(--ce-spacing-2);
  border-radius: var(--ce-radius-sm);
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.1s ease-in-out;
}

.composer-tab:hover {
  background-color: var(--ce-bg-tertiary);
}

.composer-tab.active {
  color: var(--ce-text-primary);
  background-color: var(--ce-bg-active);
}

.composer-tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ce-accent-primary);
}

.composer-tab-dot.hidden {
  display: none;
}

.composer-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: var(--ce-text-tertiary);
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
  opacity: 0;
}

.composer-tab:hover .composer-tab-close {
  opacity: 1;
}

.composer-tab-close:hover {
  background-color: var(--ce-bg-quaternary);
  color: var(--ce-text-primary);
}

.composer-tab-new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--ce-text-tertiary);
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
}

.composer-tab-new:hover {
  background-color: var(--ce-bg-tertiary);
  color: var(--ce-text-primary);
}
```

### 4.3 模式选择器（Mode Selector）

```css
.composer-mode-selector {
  display: flex;
  align-items: center;
}

.composer-mode-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;  /* pill shape */
  font-size: var(--ce-font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

/* 模式颜色 */
.composer-mode-badge[data-mode="chat"] {
  background-color: var(--ce-composer-mode-chat-bg);
  color: var(--ce-composer-mode-chat-text);
}

.composer-mode-badge[data-mode="plan"] {
  background-color: var(--ce-composer-mode-plan-bg);
  color: var(--ce-composer-mode-plan-text);
}

.composer-mode-badge[data-mode="debug"] {
  background-color: var(--ce-composer-mode-debug-bg);
  color: var(--ce-composer-mode-debug-text);
}

.composer-mode-badge[data-mode="background"] {
  background-color: var(--ce-composer-mode-background-bg);
  color: var(--ce-composer-mode-background-text);
}

.composer-mode-badge:hover {
  opacity: 0.85;
}
```

### 4.4 消息区域

```css
.composer-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.composer-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.composer-message-list {
  max-width: var(--ce-composer-max-width);
  margin: 0 auto;
  padding: var(--ce-spacing-4) var(--ce-composer-padding-x) var(--ce-composer-padding-bottom);
  display: flex;
  flex-direction: column;
  gap: var(--ce-spacing-4);
}

.composer-scroll-to-bottom {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--ce-bg-elevated);
  border: 1px solid var(--ce-stroke-secondary);
  box-shadow: var(--ce-shadow-lg);
  cursor: pointer;
  color: var(--ce-text-secondary);
  transition: opacity 0.2s, transform 0.2s;
  z-index: 10;
}

.composer-scroll-to-bottom.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(8px);
}
```

### 4.5 用户消息（Human Message）

```css
.composer-human-message {
  background-color: var(--ce-bg-input);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: var(--ce-radius-lg);
  padding: var(--ce-spacing-3);
  min-width: 150px;
  transition: background-color 0.1s ease-in-out, border 0.1s ease-in-out;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.composer-human-message:hover {
  background-color: color-mix(in srgb, var(--ce-bg-input) 96%, var(--ce-bg-primary));
  border-color: var(--ce-stroke-primary);
}

/* Sticky 用户消息（滚动时固定在顶部） */
.composer-sticky-human-message {
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: 10px;
  background: linear-gradient(
    to bottom,
    var(--ce-bg-primary) 0%,
    var(--ce-bg-primary) 80%,
    transparent 100%
  );
}
```

### 4.6 AI 消息

```css
.composer-ai-message {
  display: flex;
  flex-direction: column;
  gap: var(--ce-spacing-3);
}

/* AI 思考过程 */
.composer-thinking {
  padding: var(--ce-spacing-2) var(--ce-spacing-3);
  border-left: 2px solid var(--ce-stroke-tertiary);
  color: var(--ce-text-tertiary);
  font-size: var(--ce-font-size-sm);
  font-style: italic;
}

.composer-thinking.collapsed {
  max-height: 24px;
  overflow: hidden;
  cursor: pointer;
}

/* AI 文本块 */
.composer-text-block {
  line-height: 1.6;
  font-size: var(--ce-font-size-base);
}

.composer-text-block p {
  margin: 0 0 var(--ce-spacing-2) 0;
}

.composer-text-block p:last-child {
  margin-bottom: 0;
}
```

### 4.7 代码块

```css
.composer-code-block-container {
  border: 1px solid var(--ce-stroke-tertiary);
  border-radius: var(--ce-radius-lg);
  overflow: hidden;
  contain: paint;
  transition: border-color 0.1s ease-in-out;
}

.composer-code-block-container:hover {
  border-color: var(--ce-stroke-secondary);
}

.composer-code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 8px 0 6px;
  background-color: var(--ce-bg-secondary);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
  position: sticky;
  top: 0;
  z-index: 2;
}

.composer-code-block-filename {
  font-size: var(--ce-font-size-xs);
  color: var(--ce-text-secondary);
  font-family: var(--ce-font-family-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-code-block-actions {
  display: flex;
  gap: var(--ce-spacing-1);
}

.composer-code-block-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: var(--ce-text-tertiary);
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
}

.composer-code-block-action:hover {
  background-color: var(--ce-bg-tertiary);
  color: var(--ce-text-primary);
}

.composer-code-block-body {
  background-color: var(--ce-bg-editor);
  overflow-x: auto;
}

/* Monaco Editor 内嵌在代码块中 */
.composer-code-block-body .monaco-editor {
  --vscode-editor-background: var(--ce-bg-editor);
}
```

### 4.8 工具调用展示

```css
.composer-tool-call {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ce-stroke-tertiary);
  border-radius: var(--ce-radius-lg);
  overflow: hidden;
}

.composer-tool-call-header {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-2);
  padding: var(--ce-spacing-2) var(--ce-spacing-3);
  background-color: var(--ce-bg-secondary);
  cursor: pointer;
}

.composer-tool-call-icon {
  width: 16px;
  height: 16px;
  color: var(--ce-text-secondary);
}

.composer-tool-call-name {
  font-size: var(--ce-font-size-sm);
  font-weight: 500;
  color: var(--ce-text-primary);
}

.composer-tool-call-status {
  margin-left: auto;
  font-size: var(--ce-font-size-xs);
  color: var(--ce-text-tertiary);
}

/* 状态颜色 */
.composer-tool-call-status[data-status="running"] {
  color: var(--ce-text-yellow-primary);
}

.composer-tool-call-status[data-status="success"] {
  color: var(--ce-text-green-primary);
}

.composer-tool-call-status[data-status="error"] {
  color: var(--ce-text-red-primary);
}

.composer-tool-call-body {
  padding: var(--ce-spacing-3);
  border-top: 1px solid var(--ce-stroke-tertiary);
  font-size: var(--ce-font-size-sm);
  font-family: var(--ce-font-family-mono);
}

.composer-tool-call.collapsed .composer-tool-call-body {
  display: none;
}
```

### 4.9 输入框

```css
.composer-input-area {
  padding: var(--ce-spacing-3) var(--ce-composer-padding-x) var(--ce-spacing-4);
  max-width: var(--ce-composer-max-width);
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.composer-input-box {
  background-color: var(--ce-bg-input);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: var(--ce-radius-lg);
  padding: 6px 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.composer-input-box:focus-within {
  border-color: var(--ce-stroke-focused);
  box-shadow: 0 0 0 1px var(--ce-stroke-focused);
}

/* 空状态特殊阴影（无消息时输入框更突出） */
.composer-panel[data-empty="true"] .composer-input-box {
  box-shadow: var(--ce-shadow-base), var(--ce-shadow-sm);
}

/* Agent 布局下使用 workbench 阴影 */
.agent-layout .composer-input-box {
  box-shadow: var(--ce-shadow-workbench);
}

.composer-input-editor {
  min-height: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.composer-input-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-1);
  min-height: 28px;
}

.composer-toolbar-spacer {
  flex: 1;
}

.composer-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ce-radius-md);
  background-color: var(--ce-accent-primary, #d97757);
  color: white;
  cursor: pointer;
  transition: opacity 0.15s;
}

.composer-send-btn:hover {
  opacity: 0.9;
}

.composer-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 4.10 Plan 模式 UI

```css
.composer-plan-view {
  display: flex;
  flex-direction: column;
  gap: var(--ce-spacing-2);
}

.composer-plan-todo-item {
  display: flex;
  align-items: flex-start;
  gap: var(--ce-spacing-2);
  padding: var(--ce-spacing-1-5) 0;
}

.composer-plan-todo-indicator {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 50%;
  border: 1px solid var(--ce-text-primary);
  margin-top: 4px;
}

/* 进行中：实心圆 */
.composer-plan-todo-indicator[data-status="in-progress"] {
  background: var(--ce-text-primary);
}

/* 已完成 */
.composer-plan-todo-item[data-status="completed"] {
  opacity: 0.4;
}

.composer-plan-todo-item[data-status="completed"] .composer-plan-todo-indicator {
  background: var(--ce-text-primary);
}

/* 待处理 */
.composer-plan-todo-item[data-status="pending"] {
  opacity: 0.4;
}

/* 已取消 */
.composer-plan-todo-item[data-status="cancelled"] {
  opacity: 0.4;
  text-decoration: line-through;
}

.composer-plan-todo-label {
  font-size: var(--ce-font-size-base);
  line-height: 1.5;
}
```

### 4.11 Animated Title（Agent 运行中标题动画）

```css
@keyframes ce-title-shine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.composer-animated-title {
  background-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--ce-text-primary) 60%, transparent) 0%,
    color-mix(in srgb, var(--ce-text-primary) 60%, transparent) 25%,
    var(--ce-text-primary) 60%,
    color-mix(in srgb, var(--ce-text-primary) 60%, transparent) 75%,
    color-mix(in srgb, var(--ce-text-primary) 60%, transparent) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ce-title-shine 2s linear infinite;
}
```

### 4.12 Glass Mode

```css
/* Glass Mode 全局开关 */
.composer-panel[data-glass-mode="true"] .composer-human-message {
  backdrop-filter: blur(10px);
  background-color: var(--ce-glass-bubble-bg, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: var(--ce-radius-xl);
  box-shadow: var(--ce-shadow-sm);
  transition: none;  /* Glass Mode 下禁用过渡避免性能问题 */
}

/* Glass Mode AI 消息区域 */
.composer-panel[data-glass-mode="true"] .composer-body {
  background: transparent;
}
```

### 4.13 Sticky 标题

```css
.composer-sticky-title {
  position: sticky;
  top: 0;
  z-index: 120;
  max-width: var(--ce-composer-max-width);
  margin: 0 auto;
  padding: var(--ce-spacing-2) 0;
  background: linear-gradient(
    to bottom,
    var(--ce-bg-primary) 0%,
    var(--ce-bg-primary) 80%,
    transparent 100%
  );
  font-size: var(--ce-font-size-lg);
  font-weight: 600;
}
```

### 4.14 空状态

```css
.composer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  gap: var(--ce-spacing-4);
  color: var(--ce-text-tertiary);
}

.composer-empty-state-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.composer-empty-state-title {
  font-size: var(--ce-font-size-lg);
  font-weight: 500;
  color: var(--ce-text-secondary);
}

.composer-empty-state-hint {
  font-size: var(--ce-font-size-sm);
  max-width: 300px;
  text-align: center;
  line-height: 1.5;
}
```

### 4.15 建议操作芯片

```css
.composer-suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ce-spacing-2);
  padding: var(--ce-spacing-2) 0;
}

.composer-suggestion-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--ce-spacing-1) var(--ce-spacing-3);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: 9999px;
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  cursor: pointer;
  transition: background-color 0.1s, border-color 0.1s;
}

.composer-suggestion-chip:hover {
  background-color: var(--ce-bg-tertiary);
  border-color: var(--ce-stroke-primary);
  color: var(--ce-text-primary);
}
```

### 4.16 审查药丸（Review Pill）

```css
.composer-review-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--ce-spacing-2);
  padding: var(--ce-spacing-1-5) var(--ce-spacing-3);
  border-radius: 9999px;
  background-color: var(--ce-bg-green-secondary);
  color: var(--ce-text-green-primary);
  font-size: var(--ce-font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.composer-review-pill:hover {
  opacity: 0.85;
}

.composer-review-pill-diff-added {
  color: var(--ce-text-green-primary);
}

.composer-review-pill-diff-removed {
  color: var(--ce-text-red-primary);
}
```

---

## 五、TypeScript 组件接口

### 5.1 Composer 模式定义

```typescript
// src/vs/workbench/contrib/composer/common/composerTypes.ts

/**
 * Composer 支持的模式
 */
export enum ComposerMode {
  Chat = 'chat',
  Plan = 'plan',
  Debug = 'debug',
  Background = 'background',
}

/**
 * Composer 模式配置
 */
export interface IComposerModeConfig {
  readonly id: ComposerMode;
  readonly label: string;
  readonly description: string;
  readonly colorTokenBg: string;       // CSS 变量名
  readonly colorTokenText: string;     // CSS 变量名
  readonly icon: string;               // codicon 名
  readonly shortcut?: string;          // 快捷键
}

/**
 * 模式注册表
 */
export const COMPOSER_MODES: Record<ComposerMode, IComposerModeConfig> = {
  [ComposerMode.Chat]: {
    id: ComposerMode.Chat,
    label: 'Chat',
    description: 'Ask questions and get help',
    colorTokenBg: '--ce-composer-mode-chat-bg',
    colorTokenText: '--ce-composer-mode-chat-text',
    icon: 'comment-discussion',
  },
  [ComposerMode.Plan]: {
    id: ComposerMode.Plan,
    label: 'Plan',
    description: 'Create a step-by-step plan',
    colorTokenBg: '--ce-composer-mode-plan-bg',
    colorTokenText: '--ce-composer-mode-plan-text',
    icon: 'tasklist',
  },
  [ComposerMode.Debug]: {
    id: ComposerMode.Debug,
    label: 'Debug',
    description: 'Debug errors and issues',
    colorTokenBg: '--ce-composer-mode-debug-bg',
    colorTokenText: '--ce-composer-mode-debug-text',
    icon: 'debug-alt',
  },
  [ComposerMode.Background]: {
    id: ComposerMode.Background,
    label: 'Background',
    description: 'Run tasks in background',
    colorTokenBg: '--ce-composer-mode-background-bg',
    colorTokenText: '--ce-composer-mode-background-text',
    icon: 'cloud',
  },
};
```

### 5.2 消息类型定义

```typescript
// src/vs/workbench/contrib/composer/common/composerMessages.ts

export enum MessageRole {
  Human = 'human',
  Assistant = 'assistant',
  System = 'system',
}

export enum MessageContentType {
  Text = 'text',
  CodeBlock = 'code_block',
  ToolCall = 'tool_call',
  ToolResult = 'tool_result',
  Thinking = 'thinking',
  Plan = 'plan',
  Image = 'image',
}

export interface IMessageContent {
  readonly type: MessageContentType;
}

export interface ITextContent extends IMessageContent {
  readonly type: MessageContentType.Text;
  readonly text: string;
}

export interface ICodeBlockContent extends IMessageContent {
  readonly type: MessageContentType.CodeBlock;
  readonly language: string;
  readonly code: string;
  readonly filename?: string;
}

export interface IToolCallContent extends IMessageContent {
  readonly type: MessageContentType.ToolCall;
  readonly toolName: string;
  readonly toolCallId: string;
  readonly arguments: Record<string, unknown>;
  readonly status: 'pending' | 'running' | 'success' | 'error';
  readonly result?: string;
  readonly error?: string;
}

export interface IThinkingContent extends IMessageContent {
  readonly type: MessageContentType.Thinking;
  readonly text: string;
  readonly isCollapsed: boolean;
}

export interface IPlanContent extends IMessageContent {
  readonly type: MessageContentType.Plan;
  readonly items: IPlanItem[];
}

export interface IPlanItem {
  readonly id: string;
  readonly label: string;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  readonly description?: string;
}

export type ComposerMessageContent =
  | ITextContent
  | ICodeBlockContent
  | IToolCallContent
  | IThinkingContent
  | IPlanContent;

export interface IComposerMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly contents: ComposerMessageContent[];
  readonly timestamp: number;
  readonly mode: ComposerMode;
}
```

### 5.3 Composer 面板接口

```typescript
// src/vs/workbench/contrib/composer/browser/composerPanel.ts

import { IViewPaneOptions, ViewPane } from 'vs/workbench/browser/parts/views/viewPane';

export interface IComposerPanelOptions extends IViewPaneOptions {
  readonly initialMode?: ComposerMode;
}

export interface IComposerTab {
  readonly id: string;
  readonly label: string;
  readonly mode: ComposerMode;
  readonly messages: IComposerMessage[];
  readonly isActive: boolean;
  readonly hasUnread: boolean;
}

export interface IComposerState {
  readonly tabs: IComposerTab[];
  readonly activeTabId: string;
  readonly mode: ComposerMode;
  readonly isStreaming: boolean;
  readonly isGlassMode: boolean;
  readonly isEmpty: boolean;
}
```

### 5.4 Composer 服务接口

```typescript
// src/vs/workbench/contrib/composer/common/composerService.ts

import { Event } from 'vs/base/common/event';
import { IDisposable } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const IComposerService = createDecorator<IComposerService>('composerService');

export interface IComposerService extends IDisposable {
  readonly _serviceBrand: undefined;

  // 事件
  readonly onDidChangeMode: Event<ComposerMode>;
  readonly onDidAddMessage: Event<IComposerMessage>;
  readonly onDidUpdateMessage: Event<IComposerMessage>;
  readonly onDidChangeTab: Event<string>;
  readonly onDidStreamStart: Event<void>;
  readonly onDidStreamEnd: Event<void>;

  // 状态
  getState(): IComposerState;
  getActiveTab(): IComposerTab | undefined;
  getMessages(tabId?: string): readonly IComposerMessage[];

  // 操作
  setMode(mode: ComposerMode): void;
  createTab(mode?: ComposerMode): string;
  closeTab(tabId: string): void;
  switchTab(tabId: string): void;
  sendMessage(text: string, attachments?: IAttachment[]): Promise<void>;
  cancelStreaming(): void;
  clearHistory(tabId?: string): void;

  // Glass Mode
  setGlassMode(enabled: boolean): void;
  isGlassMode(): boolean;
}

export interface IAttachment {
  readonly type: 'file' | 'selection' | 'image' | 'url';
  readonly name: string;
  readonly content: string;
  readonly uri?: string;
}
```

### 5.5 流式更新类型

```typescript
// src/vs/workbench/contrib/composer/common/composerStream.ts

export enum StreamUpdateType {
  TextDelta = 'text_delta',
  ThinkingDelta = 'thinking_delta',
  ThinkingCompleted = 'thinking_completed',
  ToolCallStarted = 'tool_call_started',
  ToolCallDelta = 'tool_call_delta',
  ToolCallCompleted = 'tool_call_completed',
  StepStarted = 'step_started',
  StepCompleted = 'step_completed',
  TurnEnded = 'turn_ended',
  Heartbeat = 'heartbeat',
  PromptSuggestion = 'prompt_suggestion',
}

export interface IStreamUpdate {
  readonly type: StreamUpdateType;
  readonly timestamp: number;
}

export interface ITextDeltaUpdate extends IStreamUpdate {
  readonly type: StreamUpdateType.TextDelta;
  readonly text: string;
}

export interface IToolCallStartedUpdate extends IStreamUpdate {
  readonly type: StreamUpdateType.ToolCallStarted;
  readonly toolCallId: string;
  readonly toolName: string;
}

export interface IToolCallCompletedUpdate extends IStreamUpdate {
  readonly type: StreamUpdateType.ToolCallCompleted;
  readonly toolCallId: string;
  readonly result?: string;
  readonly error?: string;
}

export interface IPromptSuggestionUpdate extends IStreamUpdate {
  readonly type: StreamUpdateType.PromptSuggestion;
  readonly suggestions: string[];
}
```

---

## 六、状态机定义

### 6.1 Composer 面板状态机

```
                      ┌─────────────────┐
                      │                 │
                      │    IDLE         │ ◄── 初始状态
                      │ (等待用户输入)   │
                      │                 │
                      └────────┬────────┘
                               │
                          用户发送消息
                               │
                      ┌────────▼────────┐
                      │                 │
                      │   STREAMING     │ ◄── AI 正在响应
                      │ (流式接收中)     │
                      │                 │
                      └──┬──────┬───────┘
                         │      │
                    完成  │      │ 用户取消
                         │      │
                ┌────────▼──┐ ┌─▼────────────┐
                │           │ │              │
                │ COMPLETED │ │  CANCELLED   │
                │ (响应完成) │ │ (用户取消)    │
                │           │ │              │
                └─────┬─────┘ └──────┬───────┘
                      │              │
                      └──────┬───────┘
                             │
                       自动回到 IDLE
                             │
                      ┌──────▼────────┐
                      │               │
                      │    IDLE       │
                      │               │
                      └───────────────┘
```

### 6.2 工具调用状态机

```
  PENDING ──► RUNNING ──► SUCCESS
                │
                └──────► ERROR
```

### 6.3 Plan 项状态机

```
  PENDING ──► IN_PROGRESS ──► COMPLETED
      │           │
      │           └──────────► CANCELLED
      └──────────────────────► CANCELLED
```

---

## 七、交互行为规范

### 7.1 键盘快捷键

| 快捷键 | 动作 | 上下文 |
|--------|------|--------|
| `Enter` | 发送消息 | 输入框聚焦 |
| `Shift+Enter` | 换行 | 输入框聚焦 |
| `Escape` | 取消流式响应 / 关闭面板 | Composer 聚焦 |
| `Cmd/Ctrl+L` | 打开/聚焦 Composer | 全局 |
| `Cmd/Ctrl+Shift+L` | 新建对话 | 全局 |
| `Cmd/Ctrl+N` | 新建 Tab | Composer 聚焦 |
| `Cmd/Ctrl+W` | 关闭当前 Tab | Composer 聚焦 |
| `Cmd/Ctrl+Tab` | 切换到下一个 Tab | Composer 聚焦 |

### 7.2 滚动行为

- **自动滚动**: 流式响应时自动滚动到最新内容
- **滚动锁定**: 用户向上滚动时暂停自动滚动
- **滚到底部按钮**: 当用户不在底部时显示浮动按钮
- **Sticky 消息**: 用户消息滚出视口时固定在顶部

### 7.3 输入框行为

- **自动扩展**: 输入文本时高度自动增长（最大 200px）
- **代码粘贴**: 粘贴代码时自动包裹在代码块中
- **文件拖放**: 支持拖放文件作为附件
- **Slash 命令**: 输入 `/` 触发命令面板
- **@ 提及**: 输入 `@` 触发文件/符号搜索

### 7.4 消息交互

- **点击用户消息**: 可以编辑并重新发送
- **悬停代码块**: 显示操作按钮（复制、应用、插入）
- **点击工具调用**: 展开/折叠详情
- **点击思考过程**: 展开/折叠
- **悬停 Review Pill**: 显示 Diff 统计

---

## 八、无障碍（Accessibility）

### 8.1 ARIA 角色

```html
<div role="complementary" aria-label="AI Composer">
  <div role="tablist" aria-label="Chat sessions">
    <button role="tab" aria-selected="true">Chat 1</button>
  </div>
  <div role="log" aria-label="Message history" aria-live="polite">
    <div role="article" aria-label="User message">...</div>
    <div role="article" aria-label="AI response">...</div>
  </div>
  <div role="form" aria-label="Message input">
    <textarea aria-label="Type a message"></textarea>
    <button aria-label="Send message">Send</button>
  </div>
</div>
```

### 8.2 焦点管理

- Tab 键在输入框、按钮、消息之间切换
- 发送消息后焦点保持在输入框
- 新 Tab 创建后焦点移到输入框
- Escape 关闭 Composer 后焦点返回编辑器

### 8.3 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  .composer-animated-title {
    animation: none;
    background: none;
    -webkit-text-fill-color: var(--ce-text-primary);
  }

  .composer-panel * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 九、实现优先级

### Phase 1: 基础框架
1. Composer 面板容器和注册
2. 消息列表渲染（文本消息）
3. 输入框（基本发送/接收）
4. Design Token CSS 变量

### Phase 2: 核心功能
5. 代码块渲染（Monaco 内嵌）
6. 流式响应渲染
7. 工具调用展示
8. 多 Tab 支持
9. 模式切换

### Phase 3: 增强体验
10. Sticky 消息头
11. 自动滚动 + 滚到底部按钮
12. 思考过程展开/折叠
13. Animated Title
14. Plan 模式 TODO UI

### Phase 4: 高级功能
15. Glass Mode
16. 建议操作芯片
17. Review Pill
18. 文件拖放附件
19. @ 提及和 / 命令

---

## 十、关键尺寸参考表

| 元素 | 值 |
|------|-----|
| Composer 最大宽度 | `960px`（响应式） |
| Header 高度 | `35px` |
| Tab 高度 | `24px` |
| Tab 字号 | `12px` |
| 消息间距 | `16px` |
| 消息气泡圆角 | `8px` (标准) / `12px` (Glass) |
| 消息气泡最小宽度 | `150px` |
| 代码块圆角 | `8px` |
| 代码块 Header 高度 | `28px` |
| 输入框圆角 | `8px` |
| 输入框最大高度 | `200px` |
| 发送按钮尺寸 | `28px x 28px` |
| Plan TODO 指示器 | `10px x 10px` |
| 滚到底部按钮 | `32px x 32px` |
| z-index: sticky title | `120` |
| z-index: sticky message | `100` |
| z-index: scroll-to-bottom | `10` |
