# Cursor vs VS Code 完整修改分析

> **分析版本**: Cursor 2.6.11 (基于 VS Code 1.105.1)
> **Electron 版本**: 39.6.0 (Chromium 134)
> **分析日期**: 2026-03-05
> **操作 Agent**: analyzer (架构分析师)

---

## 概述

Cursor 在 VS Code 1.105.1 基础上进行了**大规模修改**，远超简单的品牌替换。修改涵盖了从基础库到用户界面的全部层级。

### 改动规模统计

| 维度 | 数量 | 说明 |
|------|------|------|
| Bundle 总模块数 | 1807 | workbench.desktop.main.js 中的模块 |
| **Cursor 新增模块** | **323** | VS Code 中完全不存在的模块 |
| **Cursor 修改模块** | **42** | 基于 VS Code 模块的增强修改 |
| 新增 CSS 类 | 1348+ | composer(418) + cursor(299) + agent(284) + glass(90) + onboarding(73) + mcp(63) + ai(43) + inline-diff(25) + cpp(25) + ghost-text(14) + review-changes(13) |
| 新增 CSS 变量 | 118 | --cursor-*(87) + --composer-*(23) + --agent-*(2) + 其他(6) |
| 新增命令 | 392 | composer.*(200) + cursor.*(179) + agent/bc.*(13) |
| 新增扩展 | 16 | cursor-* 系列 |
| 新增 npm 包 | 6 | @anysphere/*, @apm-js-collab/*, cursor-proclist |
| 主进程模块 | 331 | 含多个 Cursor 独有平台服务 |
| CSS 总大小 | 1.76 MB | 13,593 条规则 |
| JS Bundle 总大小 | 53 MB | 渲染进程主 bundle |
| Main.js 大小 | 1.3 MB | 主进程入口 |

### 改动类型分布

```
基础库层 (vs/base/)          ██░░░░░░░░  ~30 模块新增（hooks、cppUtils、cursor-icons、cursorAsync）
编辑器层 (vs/editor/)         ███░░░░░░░  ~18 模块新增（inlineDiff 系统）+ 42 模块修改（inlineCompletions）
平台层 (vs/platform/)         ████░░░░░░  ~20 模块新增（agent analytics、browserView、MCP、tracing、proclist）
工作台 contrib (contrib/)     █████████░  ~170 模块新增（composer、agent、ai*、mcp、reviewChanges 等）
工作台 services (services/)   ████████░░  ~85 模块新增（agent、ai*、cursorAuth、cursorIgnore 等）
扩展系统                       ██████░░░░  16 个新扩展 + API proposals + 替换映射
构建/配置                       ██░░░░░░░░  product.json 全面修改 + todesktop 打包
```

---

## 1. 新增模块（VS Code 中不存在的）

### 1.1 vs/base/ 基础库扩展（30 个模块）

Cursor 在 VS Code 基础库中新增了几个关键子系统：

#### 1.1.1 Hooks 系统（22 个文件）
路径: `vs/base/common/hooks/`

一套完整的 Agent 生命周期钩子验证器系统，用于在 Agent 执行的各个节点插入自定义逻辑：

| 钩子类型 | 文件 | 触发时机 |
|----------|------|----------|
| beforePromptSubmitResponse | validators/ | 提交 prompt 前 |
| beforeCommandExecutionHookResponse | validators/ | 执行命令前 |
| beforeReadFileResponse | validators/ | 读取文件前 |
| beforeTabFileReadResponse | validators/ | Tab 补全读文件前 |
| afterAgentResponseResponse | validators/ | Agent 响应后 |
| afterAgentThoughtResponse | validators/ | Agent 思考后 |
| afterEditFileResponse | validators/ | 编辑文件后 |
| afterShellExecutionResponse | validators/ | Shell 执行后 |
| afterMCPExecutionResponse | validators/ | MCP 执行后 |
| afterTabFileEditResponse | validators/ | Tab 补全编辑后 |
| preToolUseResponse | validators/ | 工具调用前 |
| postToolUseResponse | validators/ | 工具调用后 |
| postToolUseFailureResponse | validators/ | 工具调用失败后 |
| preCompactResponse | validators/ | 压缩上下文前 |
| sessionStartResponse | validators/ | 会话开始 |
| sessionEndResponse | validators/ | 会话结束 |
| stopResponse | validators/ | 停止 Agent |
| subagentStartResponse | validators/ | 子 Agent 启动 |
| subagentStopResponse | validators/ | 子 Agent 停止 |

**迁移影响**: 这套 Hooks 系统是 Cursor Rules (`.cursor/rules`) 功能的底层实现。迁移时需要保留并适配为 Claude Editor 的规则系统。

#### 1.1.2 CPP Diff 工具（5 个文件）
路径: `vs/base/common/cppUtils/`

用于 Tab 补全（CPP）的差异计算工具库：
- `diff/base.js` — 基础 diff 算法
- `diff/line.js` — 行级 diff
- `diff/word.js` — 词级 diff
- `diff/utils.js` — diff 辅助工具
- `utils.js` — 通用工具

#### 1.1.3 Cursor 自定义图标（2 个文件）
路径: `vs/base/browser/ui/cursor-icons/`

- `cursor-icons-font-vscode.css` — 自定义图标字体
- `cursorIconStyles.js` — 图标样式注册

#### 1.1.4 其他基础库扩展
- `vs/base/common/cursorAsync.js` — 异步工具扩展

---

### 1.2 vs/editor/ 编辑器核心扩展（18 个模块）

#### 1.2.1 Inline Diff 服务（5 个文件）
路径: `vs/editor/browser/services/inlineDiff*`

这是 Cursor 最核心的编辑器层新增——内联 Diff 系统：

| 文件 | 说明 |
|------|------|
| inlineDiffService.js | 核心 Diff 服务（56KB），管理 Diff 计算和渲染 |
| inlineDiffDecorationUtils.js | Diff 装饰工具（条纹式 Gutter 标记） |
| inlineDiffServiceUtils.js | 服务辅助函数 |
| inlineDiffSourceAdapter.js | 数据源适配器（连接 Composer/Agent） |
| inlineDiffUndoRedoElement.js | 撤销/重做元素 |

#### 1.2.2 Inline Diffs 控制器和 Widget（7 个文件）
路径: `vs/editor/contrib/inlineDiffs/`

- `controllers/inlineDiffController.js` — Diff 控制器（接受/拒绝/导航）
- `inlineDiffTypes.js` — 类型定义和命令 ID
- `widgets/inlineDiffWidget.css` — Diff Widget CSS
- `widgets/inlineDiffPartialWidget.js` — 部分 Diff Widget
- `widgets/removedLinesZoneWidget.js` — 移除行区域 Widget
- `widgets/removedLineZoneWidget.css` — 移除行 CSS
- `widgets/renderInlineDiffPartialWidget.js` — 渲染辅助

#### 1.2.3 Diff Editor 扩展（1 个文件）
- `vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/inlineDiffDeletedCodeMargin.js`

**迁移影响**: Inline Diff 系统是 AI 编辑体验的核心。必须完整保留。

---

### 1.3 vs/platform/ 平台层扩展（~20 个模块）

Cursor 在 VS Code 平台层新增了多个服务：

| 模块路径 | 说明 | 涉及进程 |
|----------|------|----------|
| platform/agentAnalyticsOperations/ | Agent 分析和运营数据收集 | main + renderer |
| platform/abuse/ | 滥用检测服务 | common + node |
| platform/browserView/ | 内置浏览器 BrowserView 管理 | main |
| platform/continuousProfiling/ | 持续性能分析 | main |
| platform/cursor/browser/aiEverythingProviderService.js | AI Everything Provider | renderer |
| platform/cursorProclist/ | Cursor 进程列表（原生模块） | common + node |
| platform/fileAppend/ | 文件追加服务 | main |
| platform/localAgentRepository/ | 本地 Agent 存储 | common + main |
| platform/mcp/ | MCP 原生发现服务 | common + node |
| platform/pathInspection/ | 路径检查服务 | main |
| platform/tracing/ | 分布式追踪（Sentry 集成） | common + main + node |
| platform/tray/ | 系统托盘 | common + main |
| platform/webContentExtractor/ | 网页内容提取（CDP 协议） | common + main |

**迁移影响**:
- `browserView` — 浏览器自动化依赖，需要保留
- `mcp` — MCP 发现需要保留并适配
- `tracing` — Sentry 追踪可以替换为我们的方案或移除
- `abuse` — 可以移除
- `cursorProclist` — 原生模块，需要重新编译或替代

---

### 1.4 vs/workbench/contrib/ 工作台贡献模块（~170 个模块）

这是修改量最大的区域。

#### 1.4.1 Composer（AI 对话系统）— 113 个模块
路径: `vs/workbench/contrib/composer/`

Composer 是 Cursor 最核心的 AI 功能模块，统一了 Chat、Agent、Plan、Browser 等功能。

**核心服务层（~40 个模块）**:

| 文件 | 说明 |
|------|------|
| composer.js | IComposerContribution 接口定义 |
| constants.js | 所有命令 ID、模式颜色、工具名枚举（60+ 工具） |
| composerAgent.js | IComposerAgentService + 错误类型 |
| composerChatService.js | 聊天服务实现 |
| composerChatServiceInterface.js | IComposerChatService 接口 |
| composerDataService.js | 数据服务（29 个 DI 参数） |
| composerDataHandle.js | 数据句柄 + WeakRef GC |
| composerDataCreation.js | 数据创建工厂 |
| composerEventService.js | 30+ 事件的 Event Bus |
| composerModesService.js | 模式管理（Chat/Agent/Plan/Spec/Debug/Background） |
| composerContextKeys.js | 14 个 RawContextKey |
| composerStorageService.js | 反应式存储 + 持久标志 |
| composerMessageStorageService.js | 消息 CRUD |
| composerMessageRequestContextStorageService.js | 请求上下文 CRUD |
| composerFileService.js | 文件 CRUD + worktree 支持 |
| composerCheckpointService.js | 检查点（回滚支持） |
| composerCheckpointStorageService.js | 检查点持久化 |
| composerCodeBlockService.js | 代码块管理 |
| composerCodeBlockDiffStorageService.js | Diff 存储 |
| composerCodeBlockPartialInlineDiffFatesStorageService.js | Diff 接受/拒绝状态 |
| composerDecisionsService.js | 决策服务 |
| composerCapabilities.js | 能力基类 + 注册表 |
| composerCapabilityMappings.js | 35+ 能力 Schema |
| composerContextServiceTypes.js | 上下文服务类型 |
| composerExtensibilityService.js | 扩展性服务 |
| composerTerminalService.js | 终端集成服务 |
| composerTextModelService.js | 文本模型引用 |
| composerToolLookup.js | 工具查找 |
| composerUriUtils.js | URI 工具函数 |
| composerUtilsService.js | 通用工具服务 |
| composerModelFilters.js | 模型过滤（supportsPlanMode 检查） |
| composerViews.js | 视图管理 |
| composerBlobStore.js | Blob 存储 |
| composerMultiDiffContentProvider.js | 多文件 Diff 内容提供者 |
| composerMigrations.js | 14 个迁移版本 (v0→v14) |
| composerWakelockManager.js | 防睡眠管理 |

**Agent 集成层（~10 个模块）**:

| 文件 | 说明 |
|------|------|
| naiveComposerAgentProvider.js | Agent Handle + 权限计算 |
| composerAgentProviderRouter.js | Agent 路由 + 缓存 |
| bubbleComposerDataHandle.js | Bubble 数据句柄 + Agent Core 交互 |
| quickAgentService.js | 快速 Agent 服务 |
| agentLayoutEventService.js | 布局事件 + MRU 导航 |
| asyncOperationRegistry.js | 异步操作追踪 |
| pendingApprovalRegistry.js | 审批等待 + 结果转换 |
| toolCallHumanReviewService.js | 工具调用人工审批 |
| toolCallHumanReviewTypes.js | 审批类型定义 |
| usageDataService.js | 使用数据收集 |

**Browser 自动化层（~15 个模块）**:

| 文件 | 说明 |
|------|------|
| browserAutomationService.js | 浏览器自动化核心（200KB） |
| browserEditor.contribution.js | 浏览器编辑器注册 |
| browserInjection.js | 页面注入 |
| browserOverlay.js | 浏览器覆盖层 |
| browserPlaceholderPages.js | 占位页面 |
| browserScreenshotService.js | 截图服务 |
| browserTabId.js | Tab 管理 |
| browserViewStore.js | 视图存储 |
| browserAnalytics.js | 浏览器分析 |
| blobUploadService.js | Blob 上传 |
| renderBrowserEditor.js | 浏览器编辑器渲染 |
| components/BrowserEditorContent.js | 浏览器编辑器内容组件 |
| components/BrowserMoreMenu.react.js | 更多菜单（React） |
| components/CSSInspectorPanel.js | CSS 检查器面板 |
| components/DOMTreeView.js | DOM 树视图 |
| components/ElementTreeSidebar.js | 元素树侧边栏 |

**UI 组件层（~15 个模块）**:

| 文件 | 说明 |
|------|------|
| components/AgentContextTabDirtyIndicator.js | Agent Tab 脏标记 |
| components/ComposerCompactMenu.js | 紧凑菜单 |
| components/ComposerUnifiedContextMenu.js | 统一上下文菜单 |
| components/ComposerUnifiedDropdown.css | 统一下拉菜单 |
| components/OmniboxDropdown.js | Omnibox 下拉 |
| components/agentLayoutMultiDiffTabContent.css | 多 Diff Tab CSS |
| components/slashMenu/slashMenuData.js | 斜杠命令菜单 |
| components/cssInspector/*.js | CSS 检查器（10 个子组件） |

**Worktree 支持（5 个模块）**:

| 文件 | 说明 |
|------|------|
| worktreeGate.js | Worktree 入口守卫 |
| worktreeSetupConfigManager.js | 配置管理 |
| worktreeSetupLogger.js | 日志 |
| worktreeSetupRunner.js | 运行器 |
| worktreeSetupScripts.js | 脚本管理 |

**Plan 服务（3 个模块）**:

| 文件 | 说明 |
|------|------|
| services/composerPlanService.js | 计划服务 |
| services/planStorageService.js | 计划存储 |
| services/planUpdateMerger.js | 计划更新合并 |

**Hooks 和工具（~10 个模块）**:

| 文件 | 说明 |
|------|------|
| hooks/useAutoVerticalScroll.js | 自动滚动 Hook |
| hooks/useComposerHoverTooltip.js | Hover 提示 Hook |
| hooks/useFileDirtiness.js | 文件脏状态 Hook |
| hooks/useFileMarkers.js | 文件标记 Hook |
| utils.js | 通用工具（20KB） |
| utils/debugLogFileUtils.js | 调试日志 |
| utils/featureGatedActions.js | 功能门控 |
| utils/getComposerSubtitle.js | 副标题工具 |
| utils/planFileUtils.js | 计划文件工具 |
| utils/toolUtils.js | 工具调用工具 |
| mockComposerStreamController.js | Mock 流控制器 |

#### 1.4.2 AI Background Composer（后台 Agent）— 13 个模块
路径: `vs/workbench/contrib/aiBackgroundComposer/`

| 文件 | 说明 |
|------|------|
| browser/backgroundComposer.js | 后台 Composer 核心 |
| browser/backgroundComposerDataService.js | 数据服务 |
| browser/backgroundComposerEventService.js | 事件服务 |
| browser/backgroundComposerCachedDetailsStorageService.js | 缓存详情存储 |
| browser/backgroundComposerData.js | 数据模型 |
| browser/worktreeComposerDataService.js | Worktree 数据服务 |
| browser/composerDnd.js | 拖拽支持 |
| browser/components/ModelNameDisplay.js | 模型名称显示 |
| browser/components/modelNameDisplayLookup.js | 模型名查找 |
| browser/components/artifacts/artifactUtils.js | 制品工具 |
| common/backgroundComposerConstants.js | 常量 |
| common/backgroundComposerTypes.js | 类型 |
| common/constants.js | 通用常量 |

#### 1.4.3 Agents 管理模块 — 3 个模块
路径: `vs/workbench/contrib/agents/`

| 文件 | 说明 |
|------|------|
| browser/agentIconUtils.js | Agent 图标工具 |
| browser/unificationGate.js | Agent 统一入口（"Agent IDE Unification"） |
| common/agentsContextKeys.js | Agent 上下文键 |

#### 1.4.4 AI 配置和设置模块 — 5 个模块

| 路径 | 说明 |
|------|------|
| contrib/aiConfig/browser/aiConfigHelper.js | AI 配置辅助 |
| contrib/aiCpp/browser/cppDebouncingService.js | CPP 防抖服务 |
| contrib/aiCpp/browser/cppEventLogger.js | CPP 事件日志 |
| contrib/aiCpp/browser/cppTypes.js | CPP 类型定义 |
| contrib/aiCpp/common/cppUtils.js | CPP 工具函数 |

#### 1.4.5 AI Diff 模块 — 2 个模块
路径: `vs/workbench/contrib/aiDiff/`

| 文件 | 说明 |
|------|------|
| browser/tokenStreamingDiffService.js | 流式 Diff 服务 |
| browser/tokenStreamingNoVZDiff.js | 非 ViewZone Diff |

#### 1.4.6 AI Settings — 1 个模块
- `contrib/aiSettings/browser/autorunSettingsValues.js` — Agent 自动运行设置

#### 1.4.7 App Layout (Agent Layout) — 1 个模块
- `contrib/appLayout/browser/agentLayoutService.js` — Agent 布局服务

#### 1.4.8 Cursor Blame — 5 个模块
路径: `vs/workbench/contrib/cursorBlame/`

AI 归因功能，显示代码的 AI 贡献信息：

| 文件 | 说明 |
|------|------|
| browser/cursorBlameEditor.js | Blame 编辑器 |
| browser/cursorBlameUtils.js | 工具函数 |
| browser/renderCursorBlamePane.js | 渲染逻辑 |
| browser/components/CursorBlamePane.js | 面板组件 |
| browser/components/cursorBlamePane.css | 面板 CSS |

#### 1.4.9 MCP 模块 — 7 个模块
路径: `vs/workbench/contrib/mcp/`

| 文件 | 说明 |
|------|------|
| browser/mcpCommands.js | MCP 命令注册 |
| browser/mcpCommandsAddConfiguration.js | 添加配置命令 |
| browser/mcpUrlHandler.js | MCP URL 处理 |
| common/mcpConfiguration.js | MCP 配置管理 |
| common/mcpContextKeys.js | MCP 上下文键 |
| common/mcpRegistryTypes.js | MCP 注册表类型 |
| common/mcpTypes.js | MCP 核心类型 |

#### 1.4.10 Review Changes — 26 个模块
路径: `vs/workbench/contrib/reviewChanges/`

代码审查和变更查看功能：

| 类别 | 文件 | 说明 |
|------|------|------|
| 核心 | ReviewChangesResource.js | 资源管理 |
| 核心 | ReviewChangesResourceManager.js | 资源管理器 |
| 服务 | service/reviewChangesService.js | 审查服务 |
| 服务 | service/semanticReviewService.js | 语义审查服务 |
| 组件 | components/CIStatusIndicator.js | CI 状态指示器 |
| 组件 | components/CursorDiffPane.js | Diff 面板 |
| 组件 | components/ReviewChangesEllipsisMenu.js | 省略菜单 |
| 组件 | components/ReviewChangesFileList/ | 文件列表（含子组件） |
| 组件 | components/ReviewChangesFindWidget.js | 查找 Widget |
| 组件 | components/ReviewChangesMarkdownDescription.js | Markdown 描述 |
| 组件 | components/ReviewChangesSummaryHeader.js | 摘要头部 |
| Bugbot | bugbot/bugbotViewZone.css | Bug 检测视图区 |
| 工具 | utils/ciMessageUtils.js | CI 消息工具 |
| 工具 | utils/ciParsingUtils.js | CI 解析工具 |
| 工具 | utils/diffMentionUtils.js | Diff 提及工具 |
| 工具 | utils/discussionUtils.js | 讨论工具 |
| 工具 | utils/generatedFilesConstants.js | 生成文件常量 |
| Hook | hooks/useResourceLineCounts.js | 行数计算 Hook |
| 注释 | diffCommentViewZoneManager.js | Diff 注释管理 |

#### 1.4.11 Notebook Inline Diff — 6 个模块
路径: `vs/workbench/contrib/notebook/browser/diff/inlineDiff/`

Notebook 内联 Diff 支持（基于编辑器 Inline Diff 扩展）。

#### 1.4.12 UI Hooks — 6 个模块
路径: `vs/workbench/contrib/ui/browser/hooks/`

通用 UI Hooks（React 风格）：
- useIsUsingFileIconTheme
- useKeyboardShortcut
- useLargeHoverTooltip
- useMeasureWidthHeight
- useMenuHover
- useVSHoverTooltip

#### 1.4.13 Onboarding — 独立模块
路径: `vs/workbench/contrib/onboarding/`

自定义入门向导，包含 30 个状态事件跟踪点：
- Welcome 页面（登录/注册）
- 主题选择
- 快捷键设置
- 数据隐私设置
- 设置导入（从 VS Code/JetBrains）
- Agent-first 项目创建

---

### 1.5 vs/workbench/services/ 服务层扩展（~85 个模块）

#### 1.5.1 Agent 服务 — 37 个模块
路径: `vs/workbench/services/agent/browser/`

这是 Agent 执行的核心服务层：

**核心服务**:

| 文件 | 说明 |
|------|------|
| agentResponseAdapter.js | 核心流式响应适配器（1347 行） |
| subagentComposerService.js | 子 Agent 编排/后台管理/续传（1146 行） |
| agentProviderService.js | Agent Handler 注册和创建 |
| agentPrewarmService.js | 预热连接管理 |
| cloudAgentStorageService.js | 云端 Agent 持久化存储 |
| backgroundWorkRegistry.js | 后台工作项跟踪 |
| conversationActionManager.js | 会话动作/中止信号管理 |
| contextSetup.js | 上下文设置 |
| populateConversationFromState.js | 从状态恢复会话 |
| agentTranslationUtils.js | 翻译工具 |
| transcriptPaths.js | 记录路径 |
| usageLimitPolicyStatusService.js | 使用限制策略 |

**Tool Call Handlers（12 个处理器）**:

| 处理器 | 说明 |
|--------|------|
| shell/shellToolCallHandler.js | Shell 命令执行（383 行） |
| edit/editToolCallHandler.js | 文件编辑（267 行） |
| task/taskToolCallHandler.js | 子任务/子 Agent（603 行） |
| task/nestedTaskUtils.js | 嵌套任务工具 |
| todo/todoToolCallHandler.js | Todo 列表（181 行） |
| askQuestion/ | 向用户提问（3 文件） |
| createPlan/ | 创建计划（3 文件） |
| mcpAuth/ | MCP 认证（2 文件） |
| switchMode/ | 模式切换 |
| webFetch/ | Web 抓取 |
| webSearch/ | Web 搜索 |

#### 1.5.2 Agent Data 服务 — 8 个模块
路径: `vs/workbench/services/agentData/`

| 文件 | 说明 |
|------|------|
| browser/agentRepositoryService.js | Agent 仓库管理 |
| browser/draftAgentRepositoryService.js | 草稿 Agent 仓库 |
| browser/artifactCacheService.js | 制品缓存 |
| browser/cacheStorageService.js | 缓存存储 |
| browser/localAgentEnvironment.js | 本地 Agent 环境 |
| browser/mentionsCapabilityService.js | @提及能力 |
| browser/mentionsRollout.js | 提及功能灰度 |
| common/glassActiveAgentService.js | Glass 活跃 Agent |
| common/displayHelpers.js | 显示辅助 |
| common/reactive.js | 响应式工具 |

#### 1.5.3 AI 服务 — 3 个模块
路径: `vs/workbench/services/ai/browser/`

| 文件 | 说明 |
|------|------|
| composerNotificationService.js | Composer 通知 |
| cursorCredsService.js | 认证凭据管理 |
| subagentsService.js | 子 Agent 定义发现和加载 |

#### 1.5.4 AI CmdK 服务 — 3 个模块
路径: `vs/workbench/services/aiCmdK/browser/`

| 文件 | 说明 |
|------|------|
| cmdKService.js | Cmd+K 服务 v1 |
| cmdKService2.js | Cmd+K 服务 v2 |
| cmdKStateService.js | Cmd+K 状态管理 |

#### 1.5.5 其他 AI 相关服务

| 路径 | 说明 |
|------|------|
| services/aiContext/browser/ | AI 上下文服务（2 文件） |
| services/aiErrors/browser/ | AI 错误服务（2 文件） |
| services/aiSettings/browser/ | AI 设置服务（2 文件） |
| services/composer/browser/ | Composer 项目服务（1 文件） |

#### 1.5.6 Cursor 专有服务

| 路径 | 说明 |
|------|------|
| services/cursorAuth/browser/authenticationService.js | Cursor 认证服务 |
| services/cursorCommands/common/cursorCommands.js | Cursor 命令管理 |
| services/cursorHooks/browser/hooksAttachmentHelper.js | Hooks 附加辅助 |
| services/cursorHooks/common/cursorHooks.js | Cursor Hooks 服务 |
| services/cursorIgnore/browser/cursorIgnoreService.js | .cursorignore 服务 |
| services/cursorIgnore/common/searchGitRepos.js | Git 仓库搜索 |
| services/cursorPlugins/browser/pluginsProviderService.js | 插件提供者 |
| services/cursorRules/common/cursorRules.js | .cursorrules 服务 |

#### 1.5.7 Inline Diffs V2 服务 — 6 个模块
路径: `vs/workbench/services/inlineDiffsV2/`

| 文件 | 说明 |
|------|------|
| browser/nonAgentChangeTracker.js | 非 Agent 变更追踪 |
| browser/patchGraphAdapter.js | Patch Graph 适配器 |
| browser/patchGraphSourceAdapterV3.js | V3 源适配器 |
| browser/patchGraphStorageService.js | Patch Graph 存储 |
| common/lineProvenanceMap.js | 行溯源映射 |
| common/patchGraph.js | Patch Graph 核心 |

#### 1.5.8 扩展隔离服务
- `services/extensions/browser/cursorExtensionIsolationService.js`

#### 1.5.9 Worktree 服务
- `services/worktree/common/worktree.js`
- `services/utils/common/worktreeUtils.js`

---

## 2. 修改的核心模块（基于 VS Code 增强）

### 2.1 Inline Completions 模块 — 42 个文件被修改
路径: `vs/editor/contrib/inlineCompletions/`

这是 Cursor Tab 补全（CPP）的核心修改区域。Cursor 对 VS Code 原生的 InlineCompletions 模块进行了大量增强：

**Controller 层**:
- `controller/commandIds.js` — 新增 CPP 相关命令 ID
- `controller/inlineCompletionContextKeys.js` — 新增 11 个上下文键
- `controller/inlineCompletionsController.js` — 增强控制器（接入 CPP Provider）

**Model 层**:
- `model/inlineCompletionsModel.js` — 增强模型（支持 AI 预测）
- `model/inlineCompletionsSource.js` — 增强数据源
- `model/inlineEdit.js` — 新增内联编辑模型
- `model/computeGhostText.js` — 增强幽灵文本计算
- `model/ghostText.js` — 增强幽灵文本数据
- `model/animation.js` — 新增动画支持
- `model/changeRecorder.js` — 新增变更记录
- `model/provideInlineCompletions.js` — 增强补全提供
- `model/singleTextEditHelpers.js` — 编辑辅助
- `model/suggestWidgetAdapter.js` — 建议 Widget 适配

**View 层**:
- `view/inlineCompletionsView.js` — 增强补全视图
- `view/ghostText/ghostTextView.js` — 增强幽灵文本视图
- `view/ghostText/ghostTextView.css` — 增强样式
- `view/inlineEdits/inlineEditsModel.js` — 内联编辑模型
- `view/inlineEdits/inlineEditsView.js` — 内联编辑视图
- `view/inlineEdits/inlineEditsViewInterface.js` — 视图接口
- `view/inlineEdits/inlineEditsViewProducer.js` — 视图生产者
- `view/inlineEdits/inlineEditWithChanges.js` — 带变更的内联编辑
- `view/inlineEdits/theme.js` — 主题定义（19 个颜色 token）
- `view/inlineEdits/view.css` — 视图 CSS
- `view/inlineEdits/utils/utils.js` — 工具函数
- `view/inlineEdits/components/gutterIndicatorMenu.js` — Gutter 指示器菜单
- `view/inlineEdits/components/gutterIndicatorView.js` — Gutter 指示器视图
- **6 种内联编辑视图变体**:
  - `inlineEditsCollapsedView.js` — 折叠视图
  - `inlineEditsDeletionView.js` — 删除视图
  - `inlineEditsInsertionView.js` — 插入视图
  - `inlineEditsLineReplacementView.js` — 行替换视图
  - `inlineEditsSideBySideView.js` — 并排视图
  - `inlineEditsWordReplacementView.js` — 词替换视图
  - `originalEditorInlineDiffView.js` — 原始编辑器 Diff 视图

**其他**:
- `structuredLogger.js` — 结构化日志
- `utils.js` — 工具函数

### 2.2 Inline Chat 模块 — 5 个文件被修改
路径: `vs/workbench/contrib/inlineChat/`

| 文件 | 修改说明 |
|------|----------|
| browser/inlineChatSessionService.js | 增强会话服务（接入 Agent） |
| browser/inlineChatWidget.js | 增强 Widget（Agent UI） |
| browser/utils.js | 新增工具函数 |
| browser/media/inlineChat.css | 增强样式 |
| common/inlineChat.js | 增强配置项 |

---

## 3. UI/UX 修改

### 3.1 布局系统

Cursor 引入了 **Agent Layout** 系统，重新定义了 IDE 的窗口布局：

**四种预定义布局模式**:

| 模式 | 说明 | 编辑器区 | Composer 位置 |
|------|------|----------|---------------|
| Agent | AI 优先布局 | 右侧 | 左侧全高 |
| Editor | 传统编辑优先 | 中央 | 辅助面板 |
| Zen | 禅模式（专注） | 全屏 | 隐藏 |
| Browser | 浏览器模式 | 右侧浏览器 | 左侧 |

**Agent Layout Quick Menu**:
- 244px 宽弹出面板
- 2 列网格布局选择
- 开关控制各面板可见性

**View 注册**:

| View ID | 说明 |
|---------|------|
| `workbench.panel.composerChatViewPane` | Composer 主面板 |
| `workbench.panel.aichat` | 旧版 AI Chat（兼容） |
| `workbench.panel.aichat.view` | 旧版 AI Chat 视图 |
| `workbench.view.backgroundAgent` | 后台 Agent 视图 |
| `workbench.view.backgroundAgent.content` | 后台 Agent 内容 |

### 3.2 主题系统

#### Cursor 主题变体

| 主题 | UI Theme | 核心色值 |
|------|----------|----------|
| Cursor Dark | vs-dark | 编辑器 #181818, 侧边栏 #141414 |
| Cursor Dark Midnight | vs-dark | 更深的暗色变体 |
| Cursor Dark High Contrast | hc-black | 高对比度 |
| Cursor Light | vs | 浅色主题 |

#### CSS 变量系统（118 个变量）

**--cursor-* Design Token 体系（87 个）**:

```
背景系:  --cursor-bg-{primary|secondary|tertiary|quaternary|elevated|focused|active|editor|input|sidebar}
         --cursor-bg-{green|cyan|magenta|red|yellow}-{primary|secondary}
         --cursor-bg-diff-{inserted|removed}
文本系:  --cursor-text-{primary|secondary|tertiary|quaternary|focused|active}
         --cursor-text-{green|cyan|magenta|red|yellow|orange}-{primary|secondary}
图标系:  --cursor-icon-{primary|secondary|tertiary|quaternary|content}
         --cursor-icon-{green|cyan|magenta|red|yellow|cyan}-{primary|secondary}
边框系:  --cursor-stroke-{primary|secondary|tertiary|quaternary|focused}
         --cursor-stroke-{green|cyan|magenta|red|yellow}-{primary|secondary}
阴影系:  --cursor-shadow-{primary|secondary|tertiary|workbench}
         --cursor-box-shadow-{sm|base|lg|xl}
字体系:  --cursor-font-size-sm, --cursor-font-smoothing-{webkit|moz}
滚动条:  --cursor-scrollbar-{vertical|horizontal}-size
         --cursor-scrollbar-thumb-{background|hover-background|active-background}
```

**--composer-* 变量（23 个）**:

```
模式背景:  --composer-mode-{chat|background|plan|spec|debug}-background
模式文本:  --composer-mode-{chat|background|plan|spec|debug}-text
模式边框:  --composer-mode-{plan|spec|debug}-border
模式图标:  --composer-mode-{plan|spec|debug}-icon
面板:     --composer-pane-background, --composer-max-width, --composer-tab-label-max-width
审批:     --composer-pending-action-{color|review-mode-color}
Todo:     --composer-todo-summary-mix-base
Glass:    --glass-composer-todo-background
```

**--agent-* 变量（2 个）**:
```
--agent-panel-followup-bottom-bleed-mask-height
--agent-panel-followup-top-fade-height
```

#### CSS 类名统计（Cursor 新增 1348+）

| 前缀 | 数量 | 用途 |
|------|------|------|
| composer-* | 418 | Composer 面板所有组件 |
| cursor-* | 299 | 通用 Cursor UI 组件 |
| agent-* | 284 | Agent 相关 UI |
| glass-* | 90 | Glass Mode（毛玻璃效果） |
| onboarding-* | 73 | 入门向导 |
| mcp-* | 63 | MCP 管理界面 |
| ai-* | 43 | AI Blame 等 AI 功能 |
| inline-diff* | 25 | 内联 Diff |
| cpp-* | 25 | Tab 补全 Ghost Text |
| ghost-text* | 14 | 幽灵文本 |
| review-changes* | 13 | 变更审查 |
| browser-editor* | 1 | 浏览器编辑器 |

### 3.3 图标和字体

- 新增 `cursor-icons-font-vscode` 自定义图标字体
- `cursorIconStyles.js` 注册图标样式
- Agent 各模式有独立图标和颜色编码
- AI Blame 有专属头像图标（`cursor_blame_logo.svg`, `playwright.svg`）

### 3.4 Glass Mode（毛玻璃效果）

Cursor 引入了 `glass-*` 系列 CSS 类（90 个），实现毛玻璃效果 UI：
- `backdrop-filter: blur(10px)`
- 用于 Composer 面板、Agent Preview、书签等
- 创造现代 IDE 视觉层次感

### 3.5 Animated Title

Agent 运行时标题栏显示闪光渐变动画：
- `composer-animated-title__text` CSS 类
- 颜色根据 Composer 模式变化（Chat=绿、Background=紫、Plan=黄、Spec=青、Debug=红）

---

## 4. 扩展系统

### 4.1 Cursor 专有扩展（16 个）

| 扩展 | 大小 | 说明 | 激活方式 |
|------|------|------|----------|
| **cursor-agent** | **38.8 MB** | Agent 执行引擎，内嵌 Claude Agent SDK v0.2.4 | * (始终) |
| **cursor-retrieval** | **29.1 MB** | 代码索引和检索 (@anysphere/file-service) | onStartupFinished |
| cursor-resolver | 9.2 MB | Background Agent 远程权限解析 | onResolveRemoteAuthority |
| cursor-agent-exec | 4.4 MB | Agent 命令执行/文件操作/工具调用 | * (始终) |
| cursor-always-local | 4.0 MB | 实验功能和本地策略 | onStartupFinished |
| cursor-commits | 2.5 MB | 请求/提交追踪 | onStartupFinished |
| cursor-mcp | 1.5 MB | MCP 协议支持 | onStartupFinished + onUri |
| cursor-shadow-workspace | 1.2 MB | 后台代码分析 | onStartupFinished |
| cursor-deeplink | 877 KB | 深度链接 URI 处理 | onStartupFinished |
| cursor-browser-automation | 314 KB | 浏览器自动化 MCP 服务器 | onStartupFinished |
| theme-cursor | 129 KB | 4 个主题变体 | 主题贡献 |
| cursor-polyfills-remote | 99 KB | 远程环境 polyfills | * (始终) |
| cursor-ndjson-ingest | 15 KB | NDJSON 日志摄入 | onCommand |
| cursor-worktree-textmate | 11 KB | Worktree TextMate 语法 | 语法贡献 |
| cursor-file-service | 1 KB | 文件服务存根 | — |
| cursor-socket | 1 KB | TCP/TLS socket 提供者 | onResolveRemoteAuthority |

### 4.2 扩展 API 修改

**自定义 API Proposals**:
- `cursor` — Cursor 扩展 API
- `control` — 控制 API
- `cursorTracing` — 分布式追踪 API（被 6 个 anysphere 扩展使用）

**扩展替换映射** (`extensionReplacementMapForImports`):

| 原始 MS 扩展 | 替换为 |
|--------------|--------|
| ms-vscode-remote.remote-ssh | anysphere.remote-ssh |
| ms-vscode-remote.remote-containers | anysphere.remote-containers |
| ms-vscode-remote.remote-wsl | anysphere.remote-wsl |
| jeanp413.open-remote-ssh | anysphere.remote-ssh |
| ms-python.vscode-pylance | anysphere.cursorpyright |
| ms-vscode.cpptools | anysphere.cpptools |
| ms-dotnettools.csharp | anysphere.csharp |

**禁止安装的扩展** (`cannotImportExtensions`):
- `github.copilot-chat`
- `github.copilot`
- `ms-vscode.remote-explorer`

**扩展版本限制** (`extensionMaxVersions`):
- ms-vscode.cpptools: 1.20.5 ~ 1.23.6
- ms-python.vscode-pylance: 2024.4.1 ~ 2024.8.1
- 等其他限制

**可信扩展** (`cursorTrustedExtensionAuthAccess`):
- anysphere.cursor-retrieval
- anysphere.cursor-commits

**受信协议处理器** (`trustedExtensionProtocolHandlers`):
- vscode.git
- vscode.github-authentication
- vscode.microsoft-authentication
- anysphere.cursor-deeplink
- anysphere.cursor-mcp

### 4.3 扩展市场替换

```json
{
  "galleryId": "cursor",
  "serviceUrl": "https://marketplace.cursorapi.com/_apis/public/gallery",
  "itemUrl": "https://marketplace.cursorapi.com/items"
}
```

Cursor 运营自己的扩展市场（`marketplace.cursorapi.com`），而非微软的 Visual Studio Marketplace。

---

## 5. 构建系统

### 5.1 打包方式

| 方面 | VS Code | Cursor |
|------|---------|--------|
| 打包工具 | gulp + electron-builder | **todesktop** |
| asar 打包 | 使用 app.asar | **不使用**（直接目录形式） |
| Bundle 方式 | webpack/esbuild | **esbuild**（单一 53MB bundle） |
| 代码混淆 | 无 | **minified** |
| Source Map | 开发可用 | **不提供** |
| 扩展打包 | 各自独立 | 各自独立（webpack 打包为单文件） |
| 原生模块 | 标准 node-gyp | 标准 node-gyp |

### 5.2 product.json 修改

关键改动字段：

| 字段 | 原值 (VS Code) | Cursor 值 |
|------|-----------------|-----------|
| applicationName | code | cursor |
| nameShort | Code | Cursor |
| nameLong | Visual Studio Code | Cursor |
| dataFolderName | .vscode | .cursor |
| urlProtocol | vscode | cursor |
| darwinBundleIdentifier | com.microsoft.VSCode | com.todesktop.230313mzl4w4u92 |
| updateUrl | (microsoft) | https://api2.cursor.sh/updates |
| extensionsGallery.serviceUrl | (microsoft) | https://marketplace.cursorapi.com/... |
| reportIssueUrl | (github.com/microsoft/vscode) | https://github.com/getcursor/cursor/issues/new |
| enableTelemetry | false | true |
| statsigClientKey | (无) | client-Bm4HJ0... |
| serverApplicationName | code-server | cursor-server |
| vscodeVersion | (自身版本) | 1.105.1 |
| version | (VS Code 版本) | 2.6.11 |

### 5.3 Cursor 独有配置

| 字段 | 说明 |
|------|------|
| `backupUpdateUrl` | 备用更新地址 (cursorapi.com) |
| `statsigClientKey` | Statsig A/B 测试客户端密钥 |
| `statsigLogEventProxyUrl` | Statsig 事件代理 |
| `cursorTrustedExtensionAuthAccess` | Cursor 可信扩展认证 |
| `removeLinesBeforeCompilingIfTheyContainTheseWords` | 编译前移除的开发行标记 |
| `skipPackagingLocalExtensions` | 跳过打包的本地扩展 |
| `openToWelcomeMainPage` | 启动时打开欢迎页 |
| `simulateProdOnDev` | 开发环境模拟生产 |

---

## 6. 配置文件和数据存储

### 6.1 数据目录

| 用途 | VS Code | Cursor |
|------|---------|--------|
| 用户数据 | ~/.vscode/ | ~/.cursor/ |
| 服务端数据 | ~/.vscode-server/ | ~/.cursor-server/ |
| 扩展数据 | ~/.vscode/extensions/ | ~/.cursor/extensions/ |
| 工作区存储 | cursorDiskKV | cursorDiskKV |

### 6.2 Cursor 专有存储

Cursor 在主进程中引入了 **cursorDiskKV** — 一个自定义的键值存储系统：
- `cursorDiskKVGet` / `cursorDiskKVSet`
- `cursorDiskKVGetBatch` / `cursorDiskKVGetPrefix`
- `cursorDiskKVGetBinary` / `cursorDiskKVSetBinary`
- `cursorDiskKVClearPrefix`
- `cursorDiskKVGetWithLogs`

用于持久化 Composer 数据、Agent 状态、消息历史等。

### 6.3 Native 模块

| 模块 | 说明 |
|------|------|
| cursor-proclist (cursor_proclist.node) | Cursor 进程列表（自研原生模块） |
| keytar | 密钥链存储 |
| native-keymap | 键盘布局 |
| native-watchdog | 进程看门狗 |
| native-is-elevated | 权限检测 |
| node-pty | 伪终端 |
| kerberos | Kerberos 认证 |

### 6.4 Cursor 专有 npm 依赖

| 包名 | 说明 |
|------|------|
| @anysphere/policy-watcher | 策略观察器 |
| @apm-js-collab/code-transformer | 代码转换器 |
| @apm-js-collab/tracing-hooks | 追踪钩子 |
| cursor-proclist | 进程列表原生模块 |

---

## 7. 命令系统

### 7.1 composer.* 命令（200 个）

核心命令分类：

| 类别 | 命令示例 | 数量 |
|------|----------|------|
| Diff 操作 | accept_diff, accept_diff_file, accept_all, cancelComposerStep | ~20 |
| 会话管理 | openComposer, closeComposer, clearComposerTabs, newComposerTab | ~15 |
| 文件操作 | addfilestocomposer, addfilestonnewcomposer, addsymbolstocomposer | ~10 |
| 模式切换 | switchMode, togglePlan, toggleBackground | ~10 |
| 语音 | cancelVoiceDictation, startVoiceComposer | ~5 |
| 检查点 | checkout_to_message, acceptComposerStep | ~5 |
| 浏览器 | browserTabsTelemetry | ~5 |
| 遥测 | 各种 telemetry/analytics 事件 | ~50 |
| 其他 | cancelChat, cancel_chat, copyBubbleToClipboard, ... | ~80 |

### 7.2 cursor.* 命令（179 个）

| 类别 | 命令示例 | 数量 |
|------|----------|------|
| CPP/Tab 补全 | acceptcppsuggestion, rejectcppsuggestion, fullcppsuggestion | ~10 |
| 浏览器自动化 | browserView.*, browserAutomation.* | ~20 |
| Agent 统一 | agentIdeUnification.* | ~5 |
| 布局 | appLayout, applyLayoutStorageData | ~5 |
| AI 功能 | aichat, aisettings, blame | ~10 |
| 设置 | billingBanner, browserTabEnabled | ~10 |
| 其他 | generateGitCommitMessage, worktreesSetup, ... | ~119 |

### 7.3 Agent 命令（13 个）

| 命令 | 说明 |
|------|------|
| agent.loop | Agent 执行循环 |
| agent.request | Agent 请求 |
| agent.update | Agent 更新 |
| agent.prewarm | Agent 预热 |
| agent.prewarm.rpc | Agent 预热 RPC |
| agent.turn.start | Agent 轮次开始 |
| agent.turn.outcome | Agent 轮次结果 |
| agent.turn.simulated_thinking_timeout | Agent 模拟思考超时 |
| backgroundComposer.* | 后台 Composer 相关 (5 个) |

---

## 总结：迁移方案（保留全部代码，仅改后端/品牌/遥测）

> **核心策略**：直接使用 Cursor 全部代码（包括 AI 前端 UI），只修改 4 个方面：
> 1. 品牌（Cursor → Claude Editor）
> 2. AI 后端调用（Cursor server → Claude Code）
> 3. 遥测/计费（移除 Cursor 私有的）
> 4. 新增我们自己的功能

---

### 第一类：品牌替换

**改动规模**：小 | **难度**：⭐ 低 | **优先级**：P0

#### product.json（88 个键）
需要替换的关键字段：
| 字段 | 原值 | 目标值 |
|------|------|--------|
| `nameShort` | Cursor | Claude Editor |
| `nameLong` | Cursor | Claude Editor |
| `applicationName` | cursor | claude-editor |
| `dataFolderName` | .cursor | .claude-editor |
| `serverDataFolderName` | .cursor-server | .claude-editor-server |
| `win32MutexName` | cursor | claude-editor |
| `darwinBundleIdentifier` | com.todesktop.* | com.anthropic.claude-editor |
| `reportIssueUrl` | github.com/getcursor/cursor | （我们的仓库） |
| `licenseUrl` | cursor.com/privacy | （我们的隐私页面） |

#### URL/链接替换
product.json 和代码中引用的 `cursor.com/docs/*`、`cursor.com/privacy`、`cursor.com/security`、`cursor.com/pricing` 等链接需要替换为我们的域名。

#### 扩展市场
| 字段 | 原值 | 目标值 |
|------|------|--------|
| `extensionsGallery.serviceUrl` | marketplace.cursorapi.com | Open VSX 或自建 |
| `marketplace.cursor.sh` | Cursor 市场 | 移除或替换 |

---

### 第二类：AI 后端调用替换

**改动规模**：中 | **难度**：⭐⭐⭐ 中高 | **优先级**：P0

这是最关键的改动。Cursor 的所有 AI 功能都通过以下服务和 endpoint 与后端通信。

#### 核心 API Endpoint（需全部替换为 Claude Code 调用）

| 用途 | 当前 Endpoint | 说明 |
|------|---------------|------|
| AI 主 API | `api2.cursor.sh` | 主要 AI 请求入口 |
| AI API（备选） | `api3.cursor.sh` | Statsig 代理 + 备选 |
| AI API（备选） | `api4.cursor.sh` | 备选 |
| Agent 服务（隐私模式） | `agent.api5.cursor.sh` | Agent 请求（隐私模式） |
| Agent 服务（非隐私） | `agentn.api5.cursor.sh` | Agent 请求（非隐私模式） |
| Agent 区域节点 | `agent-gcpp-{uswest,eucentral,apsoutheast}.api5.cursor.sh` | 区域化 Agent |
| Agent 区域节点 | `agentn-gcpp-{uswest,eucentral,apsoutheast}.api5.cursor.sh` | 区域化 Agent（非隐私） |
| 代码索引 | `repo42.cursor.sh` | 仓库索引服务 |
| 云 Agent VM | `us{1,3,4,5,6}.cursorvm-manager.com` | 云 Agent 虚拟机 |
| 云 Agent VM（隐私）| `us{1,3,4,5,6}p.cursorvm-manager.com` | 云 Agent VM（隐私） |
| 云 Agent（开发/测试）| `{dev,staging,eval1,eval2,test1,train1-5}.cursorvm-manager.com` | 开发环境 |

#### 核心认证服务（需替换为 Claude 认证）

| 服务/存储键 | 说明 |
|------------|------|
| `prod.authentication.cursor.sh` | OAuth 认证服务器 |
| `cursorAuth/accessToken` | 访问令牌 |
| `cursorAuth/refreshToken` | 刷新令牌 |
| `cursorAuth/cachedEmail` | 缓存邮箱 |
| `cursorAuth/cachedSignUpType` | 注册方式 |
| `cursorAuth/claudeKey` | 用户自带的 Claude API Key |
| `cursorAuth/openAIKey` | 用户自带的 OpenAI Key |
| `cursorAuth/googleKey` | 用户自带的 Google Key |
| `cursorAuth/stripeCustomerId` | Stripe 客户 ID |
| `cursorAuth/stripeMembershipType` | 会员类型 |
| `cursorAuth/onboardingDate` | 注册日期 |

#### 核心凭据服务（cursorCredsService）

这个服务是所有 AI 后端调用的关键中间层，提供以下方法：
| 方法 | 说明 | 替换策略 |
|------|------|----------|
| `getBackendUrl()` | 获取 AI 后端 URL | → Claude Code API endpoint |
| `getSettingsUrl()` | 获取设置页 URL | → 我们的设置页 |
| `getRepoBackendUrl()` | 获取仓库索引 URL | → 我们的索引服务或移除 |
| `getCredentials()` | 获取全部凭据 | → Claude API Key |
| `getConnectGithubUrl()` | GitHub 连接 URL | → 保留或替换 |

#### AI 服务调用链

所有 AI 请求都经过这个链路：
```
UI (Composer/Agent/InlineDiff)
  → composerService / agentClientService
    → agentProviderService
      → cursorCredsService.getBackendUrl() + cursorAuth/accessToken
        → Cursor gRPC/HTTP API (api2/api5.cursor.sh)
```

**替换策略**：在 `agentProviderService` 或 `cursorCredsService` 层拦截，将请求重定向到 Claude Code CLI/API。上层 UI 代码完全不动。

#### 主进程 API 端点（main.js）

| 端点 | 说明 |
|------|------|
| `http://*.cursor.localhost:8001/*` | 本地 dev server |
| `marketplace.cursor.sh/*` / `marketplace.cursorapi.com/*` | 扩展市场 |
| `staging-marketplace.cursor.sh/*` | 测试环境市场 |
| `api2.cursor.sh/aiserver.v1.AnalyticsService/UploadIssueTrace` | 错误追踪上报 |

---

### 第三类：遥测/计费移除

**改动规模**：中 | **难度**：⭐⭐ 中 | **优先级**：P1

#### Statsig A/B 测试（70+ 处引用）
- **Client SDK Key**: `client-Bm4HJ0aDjXHQVsoACMREyLNxm5p6zzuzhO50MgtoT5D`
- **Statsig 代理**: `api3.cursor.sh/tev1/v1`
- **核心类**: `StatsigService`（负责 bootstrap、polling、feature flag 管理）
- **实验服务**: `experimentService`（读取 Statsig 动态配置、feature flag 覆盖）
- **策略**：替换为我们自己的 feature flag 系统，或直接硬编码默认值

#### Sentry 错误监控（1 处 DSN）
- **Sentry DSN**: `80ec2259ebfad12d8aa2afe6eb4f6dd5@metrics.cursor.sh/4508016051945472`
- **上报端点**: `api2.cursor.sh/aiserver.v1.AnalyticsService/UploadIssueTrace`
- **策略**：替换为我们的 Sentry 项目或移除

#### 计费/订阅系统（160+ 处引用）
- **Stripe 集成**: `cursorAuth/stripeCustomerId`、`cursorAuth/stripeMembershipType`
- **会员类型枚举**: `FREE_TRIAL`、`FREE`、`PRO`、`ENTERPRISE` 等
- **关键服务/UI**:
  - `cursorAuthenticationService.membershipType()` — 会员类型查询
  - `cursorAuthenticationService.subscriptionStatus()` — 订阅状态
  - `cursorAuthenticationService.tryImmediateUpgrade()` — 升级
  - `/auth/stripe_profile` — Stripe 账户信息
  - `/auth/start-subscription-now` — 开始订阅
  - `/auth/logout` — 登出
  - `usageBasedPricingModal` — 按量计费弹窗
  - `subscriptionTiersModal` — 订阅层级弹窗
  - `upgradeConfirmationModal` — 升级确认弹窗
  - `billing-status-banner-below` — 计费状态横幅
- **策略**：移除 Stripe 集成，替换为 Claude 的订阅/API Key 认证模式。可保留 `membershipType` 枚举但硬编码为 PRO 或根据 Claude API Key 有效性判断。

#### 遥测服务（1506 处引用）
- `metricsService` — 性能指标上报
- `telemetryService` — 使用数据遥测
- `analyticsService` — 分析事件
- `telemService` — 额外遥测层
- `structuredLogService` — 结构化日志
- **策略**：替换为我们的遥测后端或全部设为 no-op。注意部分遥测被用于功能逻辑（如使用量限制），需要仔细区分。

---

### 第四类：新增我们自己的功能（未来）

**改动规模**：按需 | **难度**：按需 | **优先级**：P2+

在完成前三类改动后，可以在 Cursor 的框架上新增：
- Claude Code 原生终端集成（利用现有 Composer Terminal 架构）
- MCP 协议增强（利用现有 mcpService）
- Claude 特有的 Agent 能力（利用现有 agentProviderService）
- 自定义 Onboarding 流程
- Claude 品牌主题微调（可选，非必须）

---

### 迁移执行顺序建议

```
Phase 0: 基础设施准备
├─ 解混淆 Cursor 源码（已完成大部分）
├─ 建立构建系统（todesktop → electron-builder）
└─ product.json 品牌替换

Phase 1: 后端切换（最关键）
├─ cursorCredsService → 返回 Claude API endpoint
├─ cursorAuth → Claude 认证（API Key 或 OAuth）
├─ agentProviderService → 代理到 Claude Code CLI
└─ 验证 Composer/Agent/InlineDiff 全链路可用

Phase 2: 遥测/计费清理
├─ 移除 Statsig（硬编码 feature flag 默认值）
├─ 替换 Sentry DSN
├─ 移除 Stripe 计费 UI（或替换为简单 API Key 输入）
└─ 遥测服务替换为 no-op 或我们的后端

Phase 3: 品牌细节
├─ URL 链接替换（cursor.com → 我们的域名）
├─ 扩展市场配置
└─ 图标/应用名称最终确认
```

### 总结

Cursor 对 VS Code 的修改是**深层次、系统性的**。新增了 323 个模块、修改了 42 个模块、添加了 16 个扩展、118 个 CSS 变量和 1348+ 个 CSS 类。但根据我们的策略——**保留全部代码、仅改后端调用**——实际需要修改的范围是可控的：

| 改动类别 | 涉及文件/服务 | 工作量预估 |
|----------|--------------|-----------|
| 品牌替换 | product.json + 少量硬编码字符串 | 小 |
| AI 后端调用 | cursorCredsService + cursorAuth（2-3 个核心服务文件） | 中 |
| 遥测/计费 | Statsig + Sentry + Stripe（~10 个服务文件） | 中 |
| 新增功能 | 按需 | 按需 |

核心切入点是 **cursorCredsService** 和 **cursorAuthenticationService** 这两个服务——它们是所有 AI 后端调用和认证的中枢。只要替换这两个服务的实现，整个 AI 功能链路就能重定向到 Claude Code。
