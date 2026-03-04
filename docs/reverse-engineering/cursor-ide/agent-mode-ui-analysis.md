# Cursor Agent Mode UI 深度分析

> **分析重点**: Agent Mode 引入后的新 UI 设计，不包括传统 VS Code 界面
> **分析版本**: Cursor 2.6.11
> **创建日期**: 2026-03-04
> **更新日期**: 2026-03-04
> **操作 Agent**: reverse-engineer (逆向工程师)

---

## 一、Agent Mode 总览

Cursor 的 Agent Mode 是一次彻底的 UI 革命，不再是"VS Code + AI 侧边栏"，而是重新定义了 IDE 的布局和交互方式。

### 1.1 核心理念

Agent Mode 将 IDE 从"以编辑器为中心"转变为"以 AI 对话为中心"。主要变化：

- **Agent 面板成为主角**，编辑器成为辅助
- **多种布局模式**，用户可根据任务切换
- **Composer 统一入口**，所有 AI 交互通过 Composer 完成
- **Background Agent**，任务可在云端独立运行
- **Glass Mode**，毛玻璃效果的沉浸式 UI

### 1.2 Agent 统一化（Agent Unification）

Cursor 有一个 `agent-unification-enabled` 的 body class，控制新旧 UI 的切换：

```css
/* 新 Agent UI 启用时的样式 */
body.agent-unification-enabled .bc-instance-header { ... }
body:not(.agent-unification-enabled) .composer-bar.editor { ... }
```

通过 `cursor.agentIdeUnification.enabled` 设置控制：
- `cursor.agentIdeUnification.agentsSurfaceVisible` — Agent 面板可见性
- `cursor.agentIdeUnification.sidebarLocation` — 侧边栏位置
- `cursor.agentIdeUnification.unifiedSidebarVisible` — 统一侧边栏
- `cursor.agentIdeUnification.featureGate` — 功能门控

---

## 二、布局系统

### 2.1 四种布局模式

从 NLS keys 和 CSS 中发现 Cursor 支持四种布局：

| 模式 | 说明 | CSS 标识 |
|------|------|---------|
| **Agent** | AI 面板为主，编辑器在侧边 | `agentLayoutMenu.layout.agent` |
| **Editor** | 传统编辑器为主，AI 在侧边 | `agentLayoutMenu.layout.editor` |
| **Zen** | 全屏 AI 对话模式 | `agentLayoutMenu.layout.zen` |
| **Browser** | 内置浏览器模式 | `agentLayoutMenu.layout.browser` |

### 2.2 Agent Layout Quick Menu

一个精美的弹出菜单，用于快速切换布局：

**尺寸和样式**:
```css
.agent-layout-quick-menu {
    background-color: var(--vscode-menu-background);
    border: 1px solid var(--vscode-menu-border, var(--cursor-bg-tertiary));
    border-radius: 6px;
    box-shadow: var(--cursor-box-shadow-lg);
    width: 244px;
    padding: 2px;
    z-index: 10001;
}
```

**包含元素**:
- 标题栏（含保存布局功能）
- 布局选项网格（2 列 grid）
- 每个选项有图标预览
- 设置切换行（Toggle）
- 分隔线
- 底部链接

**交互细节**:
- 有 titlebar backdrop（背景遮罩）
- 支持 compact 模式
- 每行高度 24px，字号 12px
- hover 背景色: `var(--cursor-bg-tertiary)`
- 选中项有 outline: `1.5px solid var(--vscode-panelTitle-activeForeground)`

### 2.3 布局切换相关事件（Telemetry）

```
agent_layout.layout_swap         — 布局切换
agent_layout.switch_layout       — 切换布局
agent_layout.chat_size_toggle    — 聊天窗口大小切换
agent_layout.diff_opened         — 打开 diff
agent_layout.file_opened         — 打开文件
agent_layout.browser_opened      — 打开浏览器
agent_layout.terminal_opened     — 打开终端
agent_layout.plan_opened         — 打开计划
agent_layout.output_opened       — 打开输出
agent_layout.new_agent_clicked   — 新建 Agent
agent_layout.submit              — 提交
agent_layout.undo_clicked        — 撤销
agent_layout.keep_clicked        — 保留修改
```

### 2.4 Walkthrough（引导教程）

Agent Mode 有一套精美的引导教程系统：

```css
.agent-layout-walkthrough-container {
    backdrop-filter: blur(4px);
    background: var(--cursor-bg-elevated);
    border: 1px solid var(--cursor-stroke-secondary);
    border-radius: 10px;
    box-shadow: inset 0 0 2px 0 rgba(0,0,0,.04),
                0 0 2px 0 rgba(0,0,0,.06),
                0 6px 16px 0 rgba(0,0,0,.06);
    width: 267px;
}
```

包含：
- 动画代码编辑器预览
- 聊天气泡动画
- Diff 插入/删除动画
- 侧边栏模拟
- 支持 `prefers-reduced-motion` 媒体查询

---

## 三、Composer（AI 面板）

### 3.1 Composer 模式

Cursor 的 Composer 支持 **6 种模式**，每种有独特的颜色编码：

| 模式 | 背景色变量 | 文字色变量 | 用途 |
|------|-----------|-----------|------|
| **Chat** | `--composer-mode-chat-background` (green) | `--composer-mode-chat-text` | 普通对话 |
| **Background** | `--composer-mode-background-background` (magenta) | `--composer-mode-background-text` | 后台 Agent |
| **Plan** | `--composer-mode-plan-background` (yellow) | `--composer-mode-plan-text` | 计划制定 |
| **Spec** | `--composer-mode-spec-background` (cyan) | `--composer-mode-spec-text` | 规格说明 |
| **Debug** | `--composer-mode-debug-background` (red) | `--composer-mode-debug-text` | 调试模式 |
| **Edit** | (默认) | (默认) | 代码编辑 |

颜色映射到 Cursor Design Token：
```css
--composer-mode-chat-background: var(--cursor-bg-green-secondary);
--composer-mode-chat-text: var(--cursor-text-green-primary);
--composer-mode-background-background: var(--cursor-bg-magenta-secondary);
--composer-mode-background-text: var(--cursor-text-magenta-primary);
--composer-mode-plan-background: var(--cursor-bg-yellow-secondary);
--composer-mode-plan-text: var(--cursor-text-yellow-primary);
--composer-mode-spec-background: var(--cursor-bg-cyan-secondary);
--composer-mode-spec-text: var(--cursor-text-cyan-primary);
--composer-mode-debug-background: var(--cursor-bg-red-secondary);
--composer-mode-debug-text: var(--cursor-text-red-primary);
```

### 3.2 输入框（Full Input Box）

```css
.ai-input-full-input-box {
    background-color: var(--vscode-input-background);
    border: var(--ai-input-full-input-box-border);
    border-radius: 8px;
    padding: .375rem .5rem .25rem;
    gap: .375rem;
}
```

特性：
- 支持 compact 模式（单行输入）
- 底部工具栏（模型选择、附件、发送按钮）
- 支持代码选择附件
- 支持 slash 命令编辑器
- 空状态有特殊阴影效果：`box-shadow: var(--cursor-shadow-primary), var(--cursor-shadow-secondary)`
- Agent 布局下使用 `var(--cursor-shadow-workbench)`

### 3.3 消息气泡

**Human Message（用户消息）**:
```css
.composer-human-message {
    background-color: var(--vscode-input-background);
    border: 1px solid var(--cursor-stroke-secondary);
    border-radius: 8px;
    min-width: 150px;
    transition: background-color .1s ease-in-out, border .1s ease-in-out;
}
.composer-human-message:not(.unclickable):hover:not(.restore-hovering) {
    background-color: color-mix(in srgb, var(--vscode-input-background) 96%, var(--vscode-editor-background));
    border: 1px solid var(--cursor-stroke-primary);
}
```

**Glass Mode（毛玻璃模式）**:
```css
body[data-cursor-glass-mode=true] [data-component=agent-panel]
  .composer-human-message.standalone-glass {
    backdrop-filter: blur(10px);
    background-color: var(--glass-chat-bubble-background) !important;
    border: 1px solid var(--cursor-stroke-secondary);
    border-radius: 12px;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,.05);
}
```

### 3.4 代码块

```css
.composer-code-block-container {
    border: 1px solid var(--cursor-stroke-tertiary) !important;
    border-radius: 8px;
    contain: paint;
    transition: border-color .1s ease-in-out;
}
.composer-code-block-header {
    height: 28px;
    padding: 0 8px 0 6px;
    position: sticky;
    z-index: 2;
}
```

### 3.5 Sticky 元素

消息和标题有 sticky 定位，滚动时固定在顶部：
```css
.composer-sticky-human-message {
    position: sticky;
    top: 0;
    z-index: 100;
    padding-top: 10px;
}
.composer-sticky-title {
    position: sticky;
    top: 0;
    z-index: 120;
    max-width: 840px; /* Composer 内容最大宽度 */
}
```

### 3.6 Animated Title

Agent 运行时的动画标题效果：
```css
@keyframes task-title-shine {
    /* 闪烁渐变动画 */
    background-image: linear-gradient(90deg,
        color-mix(in srgb, var(--cursor-foreground) 60%, transparent) 0,
        color-mix(in srgb, var(--cursor-foreground) 60%, transparent) 25%,
        var(--cursor-text-primary) 60%,
        color-mix(in srgb, var(--cursor-foreground) 60%, transparent) 75%,
        color-mix(in srgb, var(--cursor-foreground) 60%, transparent) 100%
    );
    background-size: 200% 100%;
    animation: task-title-shine 2s linear infinite;
}
```

---

## 四、Agent 面板交互

### 4.1 Agent Panel 结构

Agent 面板使用 `[data-component=agent-panel]` 属性标识。

**Follow-up 输入区**：
```
.agent-panel-followup-input       — 跟进输入框
.agent-panel-followup-trays       — 跟进工具托盘
.agent-panel-review-pill          — 审查药丸按钮
.agent-panel-review-pill-diff-*   — Diff 统计
.agent-panel-tray-transition-*    — 托盘过渡动画
```

**侧边栏**：
```
.agent-sidebar-cell-*             — Agent 列表单元格
.agent-sidebar-cell-status-icon   — 状态图标(blocked/mergeable/pending)
.agent-sidebar-new-agent-button   — 新建 Agent 按钮
.agent-sidebar-toggle-unified     — 切换统一视图
```

**Tab 系统**：
```
.agent-tab-*                      — Agent Tab
.agent-tab-dot-indicator          — 未读指示器
.agent-tab-highlighted            — 高亮 Tab
.agent-tab-action-button          — Tab 操作按钮
```

### 4.2 Multi-Diff 视图

Agent 模式下的多文件 Diff 视图：

```css
.agent-layout-multi-diff-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.agent-layout-multi-diff-mode-switcher {
    align-items: center;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    padding: 4px 12px;
    min-height: 26px;
}
.agent-layout-multi-diff-mode-button {
    border-radius: 4px;
    font-size: 11px;
    line-height: 150%;
    max-width: 150px;
    padding: 2px 8px;
}
```

特性：
- 顶部有模式切换按钮（类似 Tab）
- 支持单文件和多文件视图
- 有加载状态动画
- 未保存修改有警告指示器（黄色圆点）

### 4.3 Agent Diff 渲染（定制）

Agent Mode 对 Monaco Diff Editor 做了大量样式覆盖：

```css
/* 去掉传统的 char-level 高亮 */
.agent-layout .monaco-diff-editor .char-delete,
.agent-layout .monaco-diff-editor .char-insert {
    background-color: inherit;
}

/* 使用 gutter 条纹来显示增删 */
.agent-layout .monaco-diff-editor .gutter-insert {
    background: linear-gradient(to left,
        var(--vscode-diffEditor-insertedLineBackground) 0 2px,
        var(--vscode-terminal-ansiGreen) 2px 3px,  /* 绿色条纹 */
        transparent 3px);
}
.agent-layout .monaco-diff-editor .gutter-delete {
    background: linear-gradient(to left,
        var(--vscode-diffEditorGutter-removedLineBackground) 0 2px,
        var(--vscode-terminal-ansiRed) 2px 3px,  /* 红色条纹 */
        transparent 3px);
}

/* 行号样式 */
.agent-layout .monaco-editor .line-numbers {
    color: var(--cursor-text-tertiary) !important;
    padding-right: 4px;
}
.agent-layout .monaco-editor .line-numbers.active-line-number {
    color: var(--cursor-text-primary) !important;
}
```

### 4.4 Plan 模式

计划模式有 TODO 列表式的 UI：

```css
.composer-plan-todo-indicator {
    border: 1px solid var(--vscode-foreground);
    border-radius: 50%;
    height: 10px;
    width: 10px;
}
.composer-plan-todo-in-progress-circle {
    background: var(--cursor-text-primary);
    border: 1px solid var(--vscode-foreground);
    border-radius: 50%;
    height: 10px;
    width: 10px;
}
```

状态：
- `completed` — 完成（透明度 0.4）
- `in-progress` — 进行中（实心圆 + codicon 图标）
- `pending` — 待处理（透明度 0.4）
- `cancelled` — 已取消（透明度 0.4）

---

## 五、Background Agent（后台 Agent）

### 5.1 架构

Background Agent 在云端独立运行，通过 `agent.api5.cursor.sh` 服务端通信。

**VPC 配置（从标识符中发现的部署区域）**：
```
agent-runner-vpcs-us1, us1p, us3, us3p, us4, us4p, us5, us5p, us6, us6p
agent-runner-vpcs-dev, eval1, eval2, test1
agent-runner-vpcs-train1~5
```

### 5.2 Background Composer Peek

后台 Agent 的结果以 Peek 视图展示：

```css
.bc-peek-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.bc-peek-content-body {
    display: flex;
    flex: 1;
    flex-direction: column;
}
```

在 Agent 布局下内容限宽：
```css
.agent-layout .bc-peek-content-body .monaco-scrollable-element > div:first-child {
    max-width: 864px;
    margin: 0 auto;
}
.agent-layout .bc-peek-chat {
    max-width: 840px;
    margin: 0 auto;
    padding: 10px 12px 0;
}
```

### 5.3 Cloud Transfer UI

从 Background Agent 转移代码到本地：

```css
.composer-cloud-transfer-quick-button {
    background: rgba(0,0,0,.7);
    border: 1px solid var(--vscode-contrastBorder, hsla(0,0%,100%,.16));
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
}
```

**操作**:
- `applyChangesLocally` — 同步修改到本地
- `checkoutLocally` — 本地检出分支
- `createPRFromPeekContent` — 直接创建 Pull Request
- `archive` — 归档会话
- `revertFile` — 还原文件

### 5.4 Background Agent 状态

从 CSS 中发现的侧边栏状态图标：
```
agent-sidebar-cell-status-icon blocked    — 被阻塞
agent-sidebar-cell-status-icon mergeable  — 可合并
agent-sidebar-cell-status-icon pending    — 进行中
```

---

## 六、Cursor Design Token 系统

### 6.1 完整 Token 清单（109 个变量）

Cursor 定义了一套完整的 Design Token 系统，通过 `--cursor-*` CSS 变量实现：

#### 背景色（Background）
```
--cursor-bg-primary          主背景
--cursor-bg-secondary        次要背景
--cursor-bg-tertiary         三级背景
--cursor-bg-quaternary       四级背景
--cursor-bg-elevated         浮层背景（用于弹窗、卡片）
--cursor-bg-active           激活背景
--cursor-bg-focused          聚焦背景
--cursor-bg-editor           编辑器背景
--cursor-bg-sidebar          侧边栏背景
--cursor-bg-card             卡片背景
--cursor-bg-input            输入框背景
--cursor-bg-diff-inserted    Diff 插入背景
--cursor-bg-diff-removed     Diff 删除背景
```

#### 语义色背景
```
--cursor-bg-green-primary / secondary      成功/Chat 模式
--cursor-bg-red-primary / secondary        错误/Debug 模式
--cursor-bg-yellow-primary / secondary     警告/Plan 模式
--cursor-bg-cyan-primary / secondary       信息/Spec 模式
--cursor-bg-magenta-primary / secondary    紫色/Background 模式
```

#### 文字色（Text）
```
--cursor-text-primary        主要文字
--cursor-text-secondary      次要文字
--cursor-text-tertiary       三级文字（弱化）
--cursor-text-quaternary     四级文字（最弱）
--cursor-text-active         激活文字
--cursor-text-focused        聚焦文字
--cursor-text-link           链接文字
--cursor-text               通用文字
```

#### 语义色文字
```
--cursor-text-green-primary / secondary
--cursor-text-red-primary / secondary
--cursor-text-yellow-primary / secondary
--cursor-text-cyan-primary / secondary
--cursor-text-magenta-primary / secondary
--cursor-text-orange-primary / secondary
```

#### 描边（Stroke）
```
--cursor-stroke-primary      主要描边
--cursor-stroke-secondary    次要描边
--cursor-stroke-tertiary     三级描边
--cursor-stroke-quaternary   四级描边
--cursor-stroke-focused      聚焦描边
```

#### 语义色描边
```
--cursor-stroke-green-primary / secondary
--cursor-stroke-red-primary / secondary
--cursor-stroke-yellow-primary / secondary
--cursor-stroke-cyan-primary / secondary
--cursor-stroke-magenta-primary / secondary
```

#### 图标色（Icon）
```
--cursor-icon-primary / secondary / tertiary / quaternary
--cursor-icon-content
--cursor-icon-green-primary / secondary
--cursor-icon-red-primary / secondary
--cursor-icon-yellow-primary / secondary
--cursor-icon-cyan-primary / secondary
--cursor-icon-magenta-primary / secondary
```

#### 填充色（Fill）
```
--cursor-fill-primary / secondary / tertiary / quaternary
```

#### 阴影（Shadow）
```
--cursor-shadow-primary       主阴影
--cursor-shadow-secondary     次要阴影
--cursor-shadow-tertiary      三级阴影
--cursor-shadow-workbench     工作台阴影
--cursor-box-shadow-sm        小阴影
--cursor-box-shadow-base      基础阴影
--cursor-box-shadow-lg        大阴影
--cursor-box-shadow-xl        超大阴影
```

#### 圆角（Radius）
```
--cursor-radius-sm            小圆角
--cursor-radius-md            中圆角
```

#### 间距（Spacing）
```
--cursor-spacing-0-5          0.5 单位
--cursor-spacing-1            1 单位
--cursor-spacing-1-5          1.5 单位
--cursor-spacing-2            2 单位
--cursor-spacing-2-5          2.5 单位
--cursor-spacing-3            3 单位
--cursor-spacing-4            4 单位
```

#### 字体（Font）
```
--cursor-font-family          默认字体
--cursor-font-family-mono     等宽字体
--cursor-font-family-sans     无衬线字体
--cursor-font-size-sm         小字号
--cursor-font-smoothing-webkit    Webkit 字体平滑
--cursor-font-smoothing-moz       Moz 字体平滑
```

#### 滚动条（Scrollbar）
```
--cursor-scrollbar-vertical-size
--cursor-scrollbar-horizontal-size
--cursor-scrollbar-thumb-background
--cursor-scrollbar-thumb-hover-background
--cursor-scrollbar-thumb-active-background
```

#### 其他
```
--cursor-accent-primary       强调色
--cursor-foreground          前景色
--cursor-error-foreground    错误前景色
--cursor-border-secondary    次要边框
```

---

## 七、Agent API 协议（protobuf）

### 7.1 核心服务

从 `agent.v1.*` 命名空间发现的完整 protobuf 定义（500+ 类型），核心服务：

```
agent.v1.AgentService        — Agent 主服务
agent.v1.ControlService      — 控制服务
agent.v1.ExecService         — 执行服务
agent.v1.LifecycleService    — 生命周期服务
agent.v1.PtyHostService      — PTY 终端服务
```

### 7.2 核心消息类型

```
agent.v1.AgentClientMessage       — 客户端 → 服务器
agent.v1.AgentServerMessage       — 服务器 → 客户端
agent.v1.AgentRunRequest          — 运行请求
agent.v1.AgentConversationTurn    — 对话轮次
agent.v1.ConversationState        — 会话状态
agent.v1.ConversationPlan         — 会话计划
agent.v1.ConversationSummary      — 会话摘要
```

### 7.3 工具调用类型（Tool Calls）

```
agent.v1.EditToolCall         — 编辑文件
agent.v1.ReadToolCall         — 读取文件
agent.v1.WriteToolCall        — 写入文件（新建）
agent.v1.DeleteToolCall       — 删除文件
agent.v1.ShellToolCall        — 执行命令
agent.v1.GlobToolCall         — 文件搜索
agent.v1.GrepToolCall         — 内容搜索
agent.v1.FetchToolCall        — HTTP 请求
agent.v1.WebSearchToolCall    — Web 搜索
agent.v1.WebFetchToolCall     — Web 获取
agent.v1.McpToolCall          — MCP 工具调用
agent.v1.SubagentToolCall     — 子 Agent
agent.v1.TaskToolCall         — 任务
agent.v1.CreatePlanToolCall   — 创建计划
agent.v1.ApplyAgentDiffToolCall     — 应用 Diff
agent.v1.ComputerUseToolCall        — 浏览器操作
agent.v1.GenerateImageToolCall      — 图片生成
agent.v1.RecordScreenToolCall       — 屏幕录制
agent.v1.AiAttributionToolCall      — AI 归因
agent.v1.SemSearchToolCall          — 语义搜索
agent.v1.ReadLintsToolCall          — 读取 Lint 结果
agent.v1.ReadTodosToolCall          — 读取 TODO
agent.v1.UpdateTodosToolCall        — 更新 TODO
agent.v1.SetupVmEnvironmentToolCall — 设置 VM 环境
agent.v1.ReflectToolCall            — 反思/自省
agent.v1.AwaitToolCall              — 等待任务
agent.v1.SwitchModeToolCall         — 切换模式
agent.v1.PrManagementToolCall       — PR 管理
agent.v1.McpAuthToolCall            — MCP 认证
agent.v1.AskQuestionToolCall        — 向用户提问
agent.v1.BackgroundShellSpawnToolCall — 后台 Shell
agent.v1.StartGrindPlanningToolCall   — 启动 Grind 计划
agent.v1.StartGrindExecutionToolCall  — 启动 Grind 执行
agent.v1.WriteShellStdinToolCall      — 写入 Shell 标准输入
agent.v1.ListMcpResourcesToolCall     — 列出 MCP 资源
agent.v1.ReadMcpResourceToolCall      — 读取 MCP 资源
agent.v1.TruncatedToolCallArgs        — 截断的工具调用
agent.v1.ReportBugfixResultsToolCall  — 报告 Bug 修复结果
```

### 7.4 子 Agent 类型

```
agent.v1.SubagentTypeBash          — Bash 执行
agent.v1.SubagentTypeBrowserUse    — 浏览器使用
agent.v1.SubagentTypeComputerUse   — 计算机使用
agent.v1.SubagentTypeCustom        — 自定义
agent.v1.SubagentTypeDebug         — 调试
agent.v1.SubagentTypeExplore       — 探索
agent.v1.SubagentTypeMediaReview   — 媒体审查
agent.v1.SubagentTypeShell         — Shell
agent.v1.SubagentTypeVmSetupHelper — VM 设置助手
```

### 7.5 流式更新类型

```
agent.v1.TextDeltaUpdate          — 文本增量
agent.v1.TokenDeltaUpdate         — Token 增量
agent.v1.ThinkingDeltaUpdate      — 思考增量
agent.v1.ThinkingCompletedUpdate  — 思考完成
agent.v1.ToolCallStartedUpdate    — 工具调用开始
agent.v1.ToolCallDeltaUpdate      — 工具调用增量
agent.v1.ToolCallCompletedUpdate  — 工具调用完成
agent.v1.StepStartedUpdate        — 步骤开始
agent.v1.StepCompletedUpdate      — 步骤完成
agent.v1.SummaryStartedUpdate     — 摘要开始
agent.v1.SummaryCompletedUpdate   — 摘要完成
agent.v1.TurnEndedUpdate          — 轮次结束
agent.v1.UserMessageAppendedUpdate — 用户消息追加
agent.v1.PromptSuggestionUpdate   — 提示建议
agent.v1.HeartbeatUpdate          — 心跳
agent.v1.InteractionUpdate        — 交互更新
```

---

## 八、Glass Mode（毛玻璃模式）

Cursor 有一个实验性的 Glass Mode（`data-cursor-glass-mode=true`）：

```css
/* Glass Mode 下的消息气泡 */
body[data-cursor-glass-mode=true] [data-component=agent-panel]
  .composer-human-message.standalone-glass {
    backdrop-filter: blur(10px);
    background-color: var(--glass-chat-bubble-background) !important;
    border-radius: 12px;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,.05);
}

/* Glass Mode 下禁用过渡动画 */
body[data-cursor-glass-mode=true] [data-component=agent-panel]
  .composer-human-message-container .composer-human-message {
    transition: none;
}
```

引入了 `--glass-chat-bubble-background` 变量。

---

## 九、关键设计尺寸

| 元素 | 尺寸 |
|------|------|
| Composer 最大宽度 | `var(--composer-max-width)` / `840px` |
| BC Peek 内容最大宽度 | `864px` |
| Quick Menu 宽度 | `244px` |
| Walkthrough 容器宽度 | `267px` |
| 消息气泡最小宽度 | `150px` |
| 消息气泡圆角 | `8px` (标准) / `12px` (Glass) |
| 代码块圆角 | `8px` |
| Quick Menu 圆角 | `6px` |
| Quick Menu 行高 | `24px` |
| Quick Menu 字号 | `12px` |
| Multi-Diff 按钮字号 | `11px` |
| Code Block Header 高度 | `28px` |
| Plan TODO 指示器 | `10px x 10px` 圆形 |
| Agent 面板 padding | `0 14px 16px` |

---

## 十、对 Claude Editor 的设计启示

### 10.1 必须实现

1. **布局切换系统** — 至少支持 Agent/Editor/Zen 三种模式
2. **Composer 统一面板** — 以对话为中心的 AI 交互
3. **Design Token 系统** — 完整的 CSS 变量体系，支持主题切换
4. **Multi-Diff 视图** — Agent 修改多文件时的预览
5. **Plan 模式** — 带 TODO 列表的计划功能
6. **流式更新渲染** — 实时显示 Agent 执行进度
7. **Sticky 消息头** — 长对话中的上下文保持

### 10.2 值得借鉴

1. **颜色编码的模式区分** — 不同模式用不同颜色
2. **Glass Mode** — 毛玻璃效果增强沉浸感
3. **Walkthrough 引导** — 精美的交互式教程
4. **Gutter 条纹式 Diff** — 比传统背景色更优雅的 Diff 显示
5. **Animated Title** — 闪光渐变动画表示 Agent 运行中

### 10.3 可以改进

1. **Composer 最大宽度 840px** — 对于大屏幕可能太窄，考虑响应式
2. **109 个 CSS 变量** — 可以更好地分层组织
3. **颜色使用 `color-mix()`** — 可以用更简单的 token 替代
4. **z-index 管理** — Quick Menu 用 10001，需要更系统的 z-index 策略
