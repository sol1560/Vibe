# Agent 布局系统实现规格文档

> **文档类型**: 实现规格（Implementation Specification）
> **基于分析**: agent-mode-ui-analysis.md 中的设计规范
> **目标**: 为 Claude Editor 从零实现 Agent 布局系统提供完整技术规格
> **操作 Agent**: reverse-engineer-cursor
> **创建日期**: 2026-03-04
> **状态**: 初稿

---

## 一、概述

Agent 布局系统是 Claude Editor 的核心 UI 框架，定义了 IDE 窗口如何分配空间给不同面板。它不是简单的拖拽分屏，而是一套预设的布局模板，用户可以根据当前任务快速切换。

### 1.1 设计理念

- **任务驱动布局**: 不同任务场景有不同的最佳布局
- **一键切换**: 通过 Quick Menu 快速切换，不需要手动拖拽
- **平滑过渡**: 布局切换有流畅的动画
- **记忆偏好**: 记住用户的布局偏好和窗口比例

### 1.2 四种布局模式

| 模式 | 场景 | 面板分配 |
|------|------|----------|
| **Agent** | AI 辅助编码 | 左侧 Composer（主），右侧编辑器 |
| **Editor** | 传统编码 | 左侧编辑器（主），右侧 Composer |
| **Zen** | 纯 AI 对话 | 全屏 Composer，无编辑器 |
| **Browser** | 预览调试 | 左侧 Composer，右侧内置浏览器 |

---

## 二、DOM 结构规范

### 2.1 整体布局结构

```
.ce-workbench                              // VS Code 工作台根
├── .ce-titlebar                           // 标题栏
├── .ce-workbench-body                     // 工作台主体
│   ├── .ce-activitybar                    // 活动栏（最左侧图标栏）
│   ├── .agent-layout                      // Agent 布局容器（核心）
│   │   ├── .agent-layout-primary          // 主面板
│   │   │   └── (Composer 或 Editor)
│   │   ├── .agent-layout-splitter         // 分隔条（可拖拽）
│   │   └── .agent-layout-secondary        // 次要面板
│   │       └── (Editor 或 Composer 或 Browser)
│   └── .ce-panel                          // 底部面板（终端等）
└── .ce-statusbar                          // 状态栏
```

### 2.2 Agent Layout 容器

```html
<div class="agent-layout" data-layout="agent" data-split-direction="horizontal">
  <!-- 主面板 -->
  <div class="agent-layout-primary" style="flex: 1 1 60%;">
    <!-- Composer 或 Editor 在这里渲染 -->
  </div>

  <!-- 分隔条 -->
  <div class="agent-layout-splitter" role="separator" aria-orientation="vertical"
       aria-label="Resize panels" tabindex="0">
    <div class="agent-layout-splitter-handle"></div>
  </div>

  <!-- 次要面板 -->
  <div class="agent-layout-secondary" style="flex: 1 1 40%;">
    <!-- Editor 或 Browser 在这里渲染 -->
  </div>
</div>
```

### 2.3 Quick Menu 结构

```html
<div class="agent-layout-quick-menu" role="menu" aria-label="Switch layout">
  <!-- 标题 -->
  <div class="agent-layout-quick-menu-header">
    <span class="agent-layout-quick-menu-title">Layout</span>
    <button class="agent-layout-quick-menu-save" aria-label="Save layout">
      <i class="codicon codicon-save"></i>
    </button>
  </div>

  <!-- 布局选项网格 -->
  <div class="agent-layout-quick-menu-grid">
    <button class="agent-layout-quick-menu-option active" data-layout="agent"
            role="menuitemradio" aria-checked="true">
      <div class="agent-layout-quick-menu-preview">
        <!-- SVG 布局预览图标 -->
      </div>
      <span class="agent-layout-quick-menu-label">Agent</span>
    </button>

    <button class="agent-layout-quick-menu-option" data-layout="editor"
            role="menuitemradio" aria-checked="false">
      <div class="agent-layout-quick-menu-preview">
        <!-- SVG 布局预览图标 -->
      </div>
      <span class="agent-layout-quick-menu-label">Editor</span>
    </button>

    <button class="agent-layout-quick-menu-option" data-layout="zen"
            role="menuitemradio" aria-checked="false">
      <div class="agent-layout-quick-menu-preview">
        <!-- SVG 布局预览图标 -->
      </div>
      <span class="agent-layout-quick-menu-label">Zen</span>
    </button>

    <button class="agent-layout-quick-menu-option" data-layout="browser"
            role="menuitemradio" aria-checked="false">
      <div class="agent-layout-quick-menu-preview">
        <!-- SVG 布局预览图标 -->
      </div>
      <span class="agent-layout-quick-menu-label">Browser</span>
    </button>
  </div>

  <!-- 分隔线 -->
  <div class="agent-layout-quick-menu-separator"></div>

  <!-- 设置开关 -->
  <div class="agent-layout-quick-menu-toggles">
    <label class="agent-layout-quick-menu-toggle">
      <span>Sidebar</span>
      <input type="checkbox" role="switch" aria-label="Toggle sidebar">
    </label>
    <label class="agent-layout-quick-menu-toggle">
      <span>Panel</span>
      <input type="checkbox" role="switch" aria-label="Toggle panel">
    </label>
  </div>

  <!-- 分隔线 -->
  <div class="agent-layout-quick-menu-separator"></div>

  <!-- 底部链接 -->
  <div class="agent-layout-quick-menu-footer">
    <button class="agent-layout-quick-menu-footer-link">
      <i class="codicon codicon-question"></i>
      <span>Keyboard shortcuts</span>
    </button>
  </div>
</div>
```

---

## 三、CSS 样式规范

### 3.1 布局容器

```css
.agent-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 水平分割（默认） */
.agent-layout[data-split-direction="horizontal"] {
  flex-direction: row;
}

/* 垂直分割 */
.agent-layout[data-split-direction="vertical"] {
  flex-direction: column;
}
```

### 3.2 面板

```css
.agent-layout-primary,
.agent-layout-secondary {
  overflow: hidden;
  position: relative;
  transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Agent 布局：Composer 占主位 */
.agent-layout[data-layout="agent"] .agent-layout-primary {
  flex: 1 1 55%;
  min-width: 350px;
}

.agent-layout[data-layout="agent"] .agent-layout-secondary {
  flex: 1 1 45%;
  min-width: 300px;
}

/* Editor 布局：编辑器占主位 */
.agent-layout[data-layout="editor"] .agent-layout-primary {
  flex: 1 1 65%;
  min-width: 400px;
}

.agent-layout[data-layout="editor"] .agent-layout-secondary {
  flex: 1 1 35%;
  min-width: 280px;
}

/* Zen 布局：全屏 Composer */
.agent-layout[data-layout="zen"] .agent-layout-primary {
  flex: 1 1 100%;
}

.agent-layout[data-layout="zen"] .agent-layout-secondary {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
}

.agent-layout[data-layout="zen"] .agent-layout-splitter {
  display: none;
}

/* Browser 布局：Composer + 浏览器 */
.agent-layout[data-layout="browser"] .agent-layout-primary {
  flex: 1 1 45%;
  min-width: 320px;
}

.agent-layout[data-layout="browser"] .agent-layout-secondary {
  flex: 1 1 55%;
  min-width: 400px;
}
```

### 3.3 分隔条

```css
.agent-layout-splitter {
  flex: 0 0 1px;
  background-color: var(--ce-stroke-tertiary);
  cursor: col-resize;
  position: relative;
  z-index: 5;
  transition: background-color 0.15s;
}

.agent-layout[data-split-direction="vertical"] .agent-layout-splitter {
  cursor: row-resize;
}

/* 拖拽手柄（扩大点击区域） */
.agent-layout-splitter-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -3px;
  right: -3px;
}

.agent-layout[data-split-direction="vertical"] .agent-layout-splitter-handle {
  left: 0;
  right: 0;
  top: -3px;
  bottom: -3px;
}

/* 悬停和拖拽中状态 */
.agent-layout-splitter:hover,
.agent-layout-splitter.dragging {
  background-color: var(--ce-accent-primary, #d97757);
}

.agent-layout-splitter.dragging {
  transition: none;
}
```

### 3.4 Quick Menu

```css
.agent-layout-quick-menu {
  position: fixed;
  background-color: var(--vscode-menu-background);
  border: 1px solid var(--vscode-menu-border, var(--ce-bg-tertiary));
  border-radius: var(--ce-radius-md);
  box-shadow: var(--ce-shadow-xl);
  width: 244px;
  padding: 2px;
  z-index: 10001;
  animation: ce-quick-menu-in 0.15s ease-out;
}

@keyframes ce-quick-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 背景遮罩 */
.agent-layout-quick-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
}
```

### 3.5 Quick Menu Header

```css
.agent-layout-quick-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ce-spacing-1-5) var(--ce-spacing-2);
}

.agent-layout-quick-menu-title {
  font-size: var(--ce-font-size-xs);
  font-weight: 600;
  color: var(--ce-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.agent-layout-quick-menu-save {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--ce-text-tertiary);
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
}

.agent-layout-quick-menu-save:hover {
  background-color: var(--ce-bg-tertiary);
  color: var(--ce-text-primary);
}
```

### 3.6 Quick Menu Grid

```css
.agent-layout-quick-menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 2px;
}

.agent-layout-quick-menu-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ce-spacing-1);
  padding: var(--ce-spacing-2);
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
  transition: background-color 0.1s;
}

.agent-layout-quick-menu-option:hover {
  background-color: var(--ce-bg-tertiary);
}

.agent-layout-quick-menu-option.active {
  outline: 1.5px solid var(--vscode-panelTitle-activeForeground);
  outline-offset: -1.5px;
}

.agent-layout-quick-menu-preview {
  width: 80px;
  height: 48px;
  border-radius: var(--ce-radius-sm);
  background-color: var(--ce-bg-secondary);
  border: 1px solid var(--ce-stroke-tertiary);
  overflow: hidden;
  /* SVG 预览图渲染在这里 */
}

.agent-layout-quick-menu-label {
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  line-height: 1;
}

.agent-layout-quick-menu-option.active .agent-layout-quick-menu-label {
  color: var(--ce-text-primary);
  font-weight: 500;
}
```

### 3.7 Quick Menu Toggles

```css
.agent-layout-quick-menu-separator {
  height: 1px;
  background-color: var(--ce-stroke-tertiary);
  margin: 2px 0;
}

.agent-layout-quick-menu-toggles {
  padding: 2px;
}

.agent-layout-quick-menu-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px var(--ce-spacing-2);
  height: 24px;
  border-radius: var(--ce-radius-sm);
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  cursor: pointer;
}

.agent-layout-quick-menu-toggle:hover {
  background-color: var(--ce-bg-tertiary);
}

.agent-layout-quick-menu-footer {
  padding: 2px;
}

.agent-layout-quick-menu-footer-link {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-2);
  width: 100%;
  padding: 4px var(--ce-spacing-2);
  height: 24px;
  border: none;
  background: none;
  border-radius: var(--ce-radius-sm);
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-tertiary);
  cursor: pointer;
}

.agent-layout-quick-menu-footer-link:hover {
  background-color: var(--ce-bg-tertiary);
  color: var(--ce-text-primary);
}
```

### 3.8 Multi-Diff 视图

```css
.agent-layout-multi-diff-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.agent-layout-multi-diff-header {
  display: flex;
  align-items: center;
  background: var(--ce-bg-primary);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
  padding: 4px 12px;
  min-height: 26px;
  gap: var(--ce-spacing-1);
}

.agent-layout-multi-diff-tab {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-1);
  padding: 2px 8px;
  border-radius: var(--ce-radius-sm);
  font-size: var(--ce-font-size-xs);
  line-height: 150%;
  color: var(--ce-text-secondary);
  cursor: pointer;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: none;
  background: none;
}

.agent-layout-multi-diff-tab:hover {
  background-color: var(--ce-bg-tertiary);
}

.agent-layout-multi-diff-tab.active {
  background-color: var(--ce-bg-active);
  color: var(--ce-text-primary);
}

/* 未保存修改指示器 */
.agent-layout-multi-diff-tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ce-text-yellow-primary);
  flex-shrink: 0;
}

.agent-layout-multi-diff-body {
  flex: 1;
  overflow: hidden;
}

/* Agent 模式 Diff 渲染定制 */
.agent-layout .monaco-diff-editor .char-delete,
.agent-layout .monaco-diff-editor .char-insert {
  background-color: inherit;  /* 去掉 char-level 高亮 */
}

/* Gutter 条纹式 Diff */
.agent-layout .monaco-diff-editor .gutter-insert {
  background: linear-gradient(
    to left,
    var(--vscode-diffEditor-insertedLineBackground) 0 2px,
    var(--ce-text-green-primary) 2px 3px,
    transparent 3px
  );
}

.agent-layout .monaco-diff-editor .gutter-delete {
  background: linear-gradient(
    to left,
    var(--vscode-diffEditorGutter-removedLineBackground) 0 2px,
    var(--ce-text-red-primary) 2px 3px,
    transparent 3px
  );
}

/* 行号颜色定制 */
.agent-layout .monaco-editor .line-numbers {
  color: var(--ce-text-tertiary) !important;
  padding-right: 4px;
}

.agent-layout .monaco-editor .line-numbers.active-line-number {
  color: var(--ce-text-primary) !important;
}
```

### 3.9 Walkthrough 引导教程

```css
.agent-layout-walkthrough-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  animation: ce-walkthrough-fade-in 0.3s ease-out;
}

@keyframes ce-walkthrough-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.agent-layout-walkthrough-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--ce-bg-elevated);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: 10px;
  box-shadow:
    inset 0 0 2px 0 rgba(0, 0, 0, 0.04),
    0 0 2px 0 rgba(0, 0, 0, 0.06),
    0 6px 16px 0 rgba(0, 0, 0, 0.06);
  width: 267px;
  overflow: hidden;
  z-index: 10000;
  animation: ce-walkthrough-slide-in 0.3s ease-out;
}

@keyframes ce-walkthrough-slide-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.agent-layout-walkthrough-preview {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--ce-bg-primary);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
  overflow: hidden;
  position: relative;
}

/* 动画元素在预览区内 */
.agent-layout-walkthrough-preview-code {
  position: absolute;
  inset: 8px;
  font-family: var(--ce-font-family-mono);
  font-size: 8px;
  line-height: 1.4;
  color: var(--ce-text-tertiary);
  overflow: hidden;
}

.agent-layout-walkthrough-content {
  padding: var(--ce-spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--ce-spacing-3);
}

.agent-layout-walkthrough-title {
  font-size: var(--ce-font-size-lg);
  font-weight: 600;
  color: var(--ce-text-primary);
}

.agent-layout-walkthrough-description {
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  line-height: 1.5;
}

.agent-layout-walkthrough-actions {
  display: flex;
  gap: var(--ce-spacing-2);
}

.agent-layout-walkthrough-primary-btn {
  flex: 1;
  padding: var(--ce-spacing-2) var(--ce-spacing-4);
  border: none;
  border-radius: var(--ce-radius-md);
  background-color: var(--ce-accent-primary, #d97757);
  color: white;
  font-size: var(--ce-font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.agent-layout-walkthrough-primary-btn:hover {
  opacity: 0.9;
}

.agent-layout-walkthrough-secondary-btn {
  padding: var(--ce-spacing-2) var(--ce-spacing-4);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: var(--ce-radius-md);
  background: none;
  color: var(--ce-text-secondary);
  font-size: var(--ce-font-size-sm);
  cursor: pointer;
}

.agent-layout-walkthrough-secondary-btn:hover {
  background-color: var(--ce-bg-tertiary);
}

/* 步骤指示器 */
.agent-layout-walkthrough-steps {
  display: flex;
  justify-content: center;
  gap: var(--ce-spacing-1);
}

.agent-layout-walkthrough-step-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ce-text-quaternary);
  transition: background-color 0.2s;
}

.agent-layout-walkthrough-step-dot.active {
  background-color: var(--ce-accent-primary, #d97757);
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .agent-layout-walkthrough-preview-code * {
    animation: none !important;
  }
}
```

### 3.10 Agent 侧边栏

```css
.agent-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--ce-bg-sidebar);
}

.agent-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ce-spacing-2) var(--ce-spacing-3);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
}

.agent-sidebar-new-btn {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-1);
  padding: var(--ce-spacing-1) var(--ce-spacing-2);
  border: 1px solid var(--ce-stroke-secondary);
  border-radius: var(--ce-radius-sm);
  background: none;
  color: var(--ce-text-secondary);
  font-size: var(--ce-font-size-sm);
  cursor: pointer;
}

.agent-sidebar-new-btn:hover {
  background-color: var(--ce-bg-tertiary);
  color: var(--ce-text-primary);
}

.agent-sidebar-list {
  flex: 1;
  overflow-y: auto;
}

.agent-sidebar-cell {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-2);
  padding: var(--ce-spacing-2) var(--ce-spacing-3);
  cursor: pointer;
  transition: background-color 0.1s;
}

.agent-sidebar-cell:hover {
  background-color: var(--ce-bg-tertiary);
}

.agent-sidebar-cell.active {
  background-color: var(--ce-bg-active);
}

.agent-sidebar-cell-status-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agent-sidebar-cell-status-icon[data-status="pending"] {
  background-color: var(--ce-text-yellow-primary);
}

.agent-sidebar-cell-status-icon[data-status="mergeable"] {
  background-color: var(--ce-text-green-primary);
}

.agent-sidebar-cell-status-icon[data-status="blocked"] {
  background-color: var(--ce-text-red-primary);
}

.agent-sidebar-cell-label {
  flex: 1;
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-sidebar-cell-time {
  font-size: var(--ce-font-size-xs);
  color: var(--ce-text-tertiary);
  flex-shrink: 0;
}
```

### 3.11 Agent Tab 系统

```css
.agent-tab-bar {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 var(--ce-spacing-2);
  height: 35px;
  background-color: var(--ce-bg-secondary);
  border-bottom: 1px solid var(--ce-stroke-tertiary);
  overflow-x: auto;
}

.agent-tab {
  display: flex;
  align-items: center;
  gap: var(--ce-spacing-1);
  padding: 0 var(--ce-spacing-3);
  height: 100%;
  font-size: var(--ce-font-size-sm);
  color: var(--ce-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.1s, border-color 0.1s;
}

.agent-tab:hover {
  color: var(--ce-text-primary);
}

.agent-tab.active {
  color: var(--ce-text-primary);
  border-bottom-color: var(--ce-accent-primary, #d97757);
}

.agent-tab-dot-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ce-accent-primary, #d97757);
}

.agent-tab-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: var(--ce-text-tertiary);
  cursor: pointer;
  border-radius: var(--ce-radius-sm);
  opacity: 0;
  transition: opacity 0.1s;
}

.agent-tab:hover .agent-tab-action-button {
  opacity: 1;
}

.agent-tab-action-button:hover {
  background-color: var(--ce-bg-quaternary);
  color: var(--ce-text-primary);
}
```

---

## 四、TypeScript 接口定义

### 4.1 布局模式

```typescript
// src/vs/workbench/contrib/agentLayout/common/agentLayoutTypes.ts

/**
 * 布局模式枚举
 */
export enum AgentLayoutMode {
  Agent = 'agent',
  Editor = 'editor',
  Zen = 'zen',
  Browser = 'browser',
}

/**
 * 布局模式配置
 */
export interface IAgentLayoutModeConfig {
  readonly id: AgentLayoutMode;
  readonly label: string;
  readonly description: string;
  readonly icon: string;                // codicon 名
  readonly primaryPanel: PanelType;     // 主面板内容
  readonly secondaryPanel: PanelType;   // 次要面板内容
  readonly defaultSplitRatio: number;   // 默认分割比例 (0-1，主面板占比)
  readonly minPrimaryWidth: number;     // 主面板最小宽度 (px)
  readonly minSecondaryWidth: number;   // 次要面板最小宽度 (px)
  readonly shortcut?: string;
}

export enum PanelType {
  Composer = 'composer',
  Editor = 'editor',
  Browser = 'browser',
  None = 'none',
}

/**
 * 布局模式注册表
 */
export const LAYOUT_MODES: Record<AgentLayoutMode, IAgentLayoutModeConfig> = {
  [AgentLayoutMode.Agent]: {
    id: AgentLayoutMode.Agent,
    label: 'Agent',
    description: 'AI-first layout with Composer as primary',
    icon: 'robot',
    primaryPanel: PanelType.Composer,
    secondaryPanel: PanelType.Editor,
    defaultSplitRatio: 0.55,
    minPrimaryWidth: 350,
    minSecondaryWidth: 300,
  },
  [AgentLayoutMode.Editor]: {
    id: AgentLayoutMode.Editor,
    label: 'Editor',
    description: 'Classic editor layout with AI sidebar',
    icon: 'code',
    primaryPanel: PanelType.Editor,
    secondaryPanel: PanelType.Composer,
    defaultSplitRatio: 0.65,
    minPrimaryWidth: 400,
    minSecondaryWidth: 280,
  },
  [AgentLayoutMode.Zen]: {
    id: AgentLayoutMode.Zen,
    label: 'Zen',
    description: 'Full-screen AI conversation',
    icon: 'eye',
    primaryPanel: PanelType.Composer,
    secondaryPanel: PanelType.None,
    defaultSplitRatio: 1.0,
    minPrimaryWidth: 400,
    minSecondaryWidth: 0,
  },
  [AgentLayoutMode.Browser]: {
    id: AgentLayoutMode.Browser,
    label: 'Browser',
    description: 'AI with built-in browser preview',
    icon: 'globe',
    primaryPanel: PanelType.Composer,
    secondaryPanel: PanelType.Browser,
    defaultSplitRatio: 0.45,
    minPrimaryWidth: 320,
    minSecondaryWidth: 400,
  },
};
```

### 4.2 Agent Layout 服务接口

```typescript
// src/vs/workbench/contrib/agentLayout/common/agentLayoutService.ts

import { Event } from 'vs/base/common/event';
import { IDisposable } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const IAgentLayoutService = createDecorator<IAgentLayoutService>('agentLayoutService');

export interface IAgentLayoutService extends IDisposable {
  readonly _serviceBrand: undefined;

  // 事件
  readonly onDidChangeLayout: Event<AgentLayoutMode>;
  readonly onDidChangeSplitRatio: Event<number>;
  readonly onDidToggleSidebar: Event<boolean>;
  readonly onDidTogglePanel: Event<boolean>;

  // 状态
  getActiveLayout(): AgentLayoutMode;
  getSplitRatio(): number;
  isSidebarVisible(): boolean;
  isPanelVisible(): boolean;

  // 操作
  setLayout(mode: AgentLayoutMode, animate?: boolean): void;
  setSplitRatio(ratio: number): void;
  toggleSidebar(): void;
  togglePanel(): void;

  // Quick Menu
  showQuickMenu(anchor: { x: number; y: number }): void;
  hideQuickMenu(): void;

  // 保存/恢复
  saveLayoutPreference(): void;
  restoreLayoutPreference(): void;
}
```

### 4.3 Quick Menu 控制器

```typescript
// src/vs/workbench/contrib/agentLayout/browser/agentLayoutQuickMenu.ts

export interface IQuickMenuOptions {
  readonly anchor: { x: number; y: number };
  readonly currentLayout: AgentLayoutMode;
  readonly sidebarVisible: boolean;
  readonly panelVisible: boolean;
}

export interface IQuickMenuResult {
  readonly action: 'layout' | 'toggle_sidebar' | 'toggle_panel' | 'save' | 'cancel';
  readonly layout?: AgentLayoutMode;
}
```

### 4.4 分隔条控制器

```typescript
// src/vs/workbench/contrib/agentLayout/browser/agentLayoutSplitter.ts

export interface ISplitterDragEvent {
  readonly startRatio: number;
  readonly currentRatio: number;
  readonly deltaPixels: number;
}

export interface IAgentLayoutSplitter extends IDisposable {
  readonly onDidStartDrag: Event<ISplitterDragEvent>;
  readonly onDidDrag: Event<ISplitterDragEvent>;
  readonly onDidEndDrag: Event<ISplitterDragEvent>;

  setOrientation(orientation: 'horizontal' | 'vertical'): void;
  setVisible(visible: boolean): void;
}
```

### 4.5 Walkthrough 服务

```typescript
// src/vs/workbench/contrib/agentLayout/browser/agentLayoutWalkthrough.ts

export interface IWalkthroughStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly previewType: 'code-edit' | 'chat' | 'diff' | 'layout-switch';
}

export interface IAgentLayoutWalkthrough extends IDisposable {
  readonly onDidComplete: Event<void>;
  readonly onDidDismiss: Event<void>;

  show(): void;
  dismiss(): void;
  nextStep(): void;
  previousStep(): void;
  getCurrentStep(): number;
  getTotalSteps(): number;

  /**
   * 是否需要显示引导（首次使用判断）
   */
  shouldShow(): boolean;

  /**
   * 标记为已完成（不再显示）
   */
  markCompleted(): void;
}
```

---

## 五、状态机定义

### 5.1 布局切换状态机

```
  ┌─────────┐
  │  IDLE   │ ◄── 初始状态（当前布局已应用）
  └────┬────┘
       │ 用户触发切换
       │
  ┌────▼──────────┐
  │  ANIMATING    │ ◄── CSS transition 播放中 (300ms)
  │ (过渡动画中)   │
  └────┬──────────┘
       │ 动画完成
       │
  ┌────▼────────┐
  │ STABILIZING │ ◄── 面板内容重新布局 (requestAnimationFrame)
  │ (稳定化中)   │
  └────┬────────┘
       │ 布局稳定
       │
  ┌────▼────┐
  │  IDLE   │ ◄── 新布局就绪
  └─────────┘
```

### 5.2 分隔条拖拽状态机

```
  IDLE ──(mousedown)──► READY
                          │
                     (mousemove > 2px)
                          │
                        DRAGGING ──(mouseup)──► IDLE
```

### 5.3 Quick Menu 状态机

```
  CLOSED ──(触发)──► OPENING ──(动画完成)──► OPEN
                                               │
                                          (选择 / 点击外部 / Escape)
                                               │
                                            CLOSING ──(动画完成)──► CLOSED
```

---

## 六、交互行为规范

### 6.1 键盘快捷键

| 快捷键 | 动作 | 上下文 |
|--------|------|--------|
| `Cmd/Ctrl+\` | 打开 Quick Menu | 全局 |
| `Cmd/Ctrl+Shift+1` | Agent 布局 | 全局 |
| `Cmd/Ctrl+Shift+2` | Editor 布局 | 全局 |
| `Cmd/Ctrl+Shift+3` | Zen 布局 | 全局 |
| `Cmd/Ctrl+Shift+4` | Browser 布局 | 全局 |
| `Cmd/Ctrl+B` | 切换侧边栏 | 全局 |
| `Cmd/Ctrl+J` | 切换底部面板 | 全局 |

### 6.2 Quick Menu 交互

- **触发方式**: 点击标题栏中的布局图标，或使用快捷键
- **定位**: 锚定到触发按钮的下方（底部对齐，水平居中）
- **关闭**: 点击选项后自动关闭，点击外部区域关闭，按 Escape 关闭
- **键盘导航**: 方向键在选项间移动，Enter 确认选择

### 6.3 分隔条拖拽

- **吸附**: 拖拽到特定比例时轻微吸附（50%、33%、67%）
- **双击**: 双击分隔条恢复默认比例
- **最小宽度**: 面板不会被压缩到配置的最小宽度以下
- **过渡**: 非拖拽的分割比例变化有 300ms 过渡动画

### 6.4 布局切换动画

- **动画时长**: 300ms
- **缓动函数**: `cubic-bezier(0.4, 0, 0.2, 1)`（Material Design standard easing）
- **属性**: `flex` 过渡
- **Zen 模式**: 次要面板 `flex: 0` 时使用 `overflow: hidden` 防止内容闪烁

### 6.5 Walkthrough 引导

- **触发**: 首次打开 Agent 布局时
- **步骤数**: 3-4 步
- **可跳过**: 有"跳过"按钮
- **记忆**: 完成或跳过后不再显示（存储在 user settings）

---

## 七、遥测事件

```typescript
// 布局相关遥测事件
export enum AgentLayoutTelemetryEvent {
  LayoutSwap = 'agent_layout.layout_swap',
  SwitchLayout = 'agent_layout.switch_layout',
  ChatSizeToggle = 'agent_layout.chat_size_toggle',
  DiffOpened = 'agent_layout.diff_opened',
  FileOpened = 'agent_layout.file_opened',
  BrowserOpened = 'agent_layout.browser_opened',
  TerminalOpened = 'agent_layout.terminal_opened',
  PlanOpened = 'agent_layout.plan_opened',
  NewAgentClicked = 'agent_layout.new_agent_clicked',
  Submit = 'agent_layout.submit',
  UndoClicked = 'agent_layout.undo_clicked',
  KeepClicked = 'agent_layout.keep_clicked',
}
```

---

## 八、实现优先级

### Phase 1: 基础框架
1. Agent Layout 容器和布局切换（4 种模式）
2. 分隔条（拖拽调整比例）
3. CSS 变量和主题集成
4. 布局偏好存储/恢复

### Phase 2: Quick Menu
5. Quick Menu UI（布局选项网格 + 预览）
6. Quick Menu 交互（键盘导航、动画）
7. Sidebar/Panel 开关
8. 快捷键绑定

### Phase 3: Multi-Diff 视图
9. Multi-Diff 容器和 Tab 切换
10. Gutter 条纹式 Diff 渲染
11. 行号样式定制
12. 未保存修改指示器

### Phase 4: 引导和完善
13. Walkthrough 引导教程
14. Agent 侧边栏（会话列表）
15. Agent Tab 系统
16. 布局切换动画优化

---

## 九、关键尺寸参考表

| 元素 | 值 |
|------|-----|
| Quick Menu 宽度 | `244px` |
| Quick Menu 圆角 | `6px` |
| Quick Menu 行高 | `24px` |
| Quick Menu 字号 | `12px` |
| Quick Menu z-index | `10001` |
| Quick Menu 遮罩 z-index | `10000` |
| Walkthrough 宽度 | `267px` |
| Walkthrough 圆角 | `10px` |
| Walkthrough z-index | `10000` |
| Multi-Diff Header 高度 | `26px` |
| Multi-Diff Tab 字号 | `11px` |
| Multi-Diff Tab padding | `2px 8px` |
| Agent 面板最小宽度 | `350px` (Agent) / `280px` (Editor) |
| 编辑器面板最小宽度 | `300px` (Agent) / `400px` (Editor) |
| 分隔条宽度 | `1px`（视觉）/ `7px`（点击区域） |
| Diff Gutter 条纹 | `3px` 宽，`2px` 间距 |
| Sidebar cell padding | `8px 12px` |
| Tab bar 高度 | `35px` |
| 布局切换动画 | `300ms cubic-bezier(0.4, 0, 0.2, 1)` |
