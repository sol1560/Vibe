# 项目文件索引

## 根目录

| 文件 | 用途 | 状态 |
|------|------|------|
| CLAUDE.md | Agent 角色定义和项目指南 | ✅ 已创建 |
| Claude.dmg | Claude Desktop App 安装包（逆向用） | ✅ 存在 |
| Cursor-darwin-arm64.dmg | Cursor IDE 安装包（逆向用） | ✅ 存在 |

## .claude/agents/

| 文件 | 角色 | 状态 |
|------|------|------|
| reverse-engineer.md | 逆向工程师 | ✅ 已创建 |
| ui-designer.md | UI 设计师 | ✅ 已创建 |
| electron-developer.md | Electron 开发者 | ✅ 已创建 |
| ide-developer.md | IDE 核心开发者 | ✅ 已创建 |
| integration-developer.md | Claude Code 集成开发者 | ✅ 已创建 |
| reviewer.md | 代码审查员 | ✅ 已创建 |
| tester.md | 测试工程师 | ✅ 已创建 |

## memory/

| 文件 | 用途 | 状态 |
|------|------|------|
| decisions.md | 架构决策记录 | ✅ 已创建 |
| patterns.md | 设计模式和最佳实践 | ✅ 已创建 |
| pitfalls.md | 常见问题和解决方案 | ✅ 已创建 |
| files.md | 项目文件索引（本文件） | ✅ 已创建 |

## docs/

| 文件 | 用途 | 状态 |
|------|------|------|
| claude-ui-spec.md | Claude UI 规范 | ⏳ 待逆向提取 |
| cursor-architecture.md | Cursor 架构分析 | ⏳ 待逆向分析 |
| claude-code-integration.md | Claude Code 集成方案 | ⏳ 待设计 |
| cowork-integration-plan.md | Cowork 功能集成架构方案 | ✅ 已创建（architect Agent） |
| reverse-engineering/claude-app/plan.md | Claude App 逆向计划 | ✅ 已完成 |
| reverse-engineering/cursor-ide/plan.md | Cursor IDE 逆向计划 | ✅ 已完成 |
| reverse-engineering/cursor-ide/agent-mode-ui-analysis.md | Cursor Agent Mode UI 深度分析 | ✅ 已完成 |
| reverse-engineering/cursor-ide/composer-implementation-spec.md | Composer 面板实现规格文档 | ✅ 已完成 |
| reverse-engineering/cursor-ide/agent-layout-implementation-spec.md | Agent 布局系统实现规格文档 | ✅ 已完成 |
| reverse-engineering/cursor-ide/ai-endpoints-analysis.md | Cursor AI 调用点完整分析 | ✅ 已完成（ai-hunter Agent） |
| architecture-master-plan.md | IDE 整体架构总规划 | ✅ 已完成（architect Agent） |

## staging/ (提取的代码模块)

| 目录 | 用途 | 状态 |
|------|------|------|
| phase-2c-inline-edit/ | Inline Edit & Diff 代码提取 | ✅ 已完成 (editor-dev) |
| phase-2c-inline-edit/inline-chat/ | 内联聊天模块 (5 files, ~44KB) | ✅ 已提取 |
| phase-2c-inline-edit/inline-diff/ | Inline Diff 模块 (32 files, ~350KB) | ✅ 已提取 |
| phase-2c-inline-edit/tab-completion/ | Tab 补全模块 (40 files, ~195KB) | ✅ 已提取 |
| phase-2c-inline-edit/ANALYSIS.md | 完整分析文档 | ✅ 已完成 |
| phase-4a-mcp/ | MCP Host/Server + Claude Code 集成核心代码 | ✅ 已完成 (architect) |
| phase-4a-mcp/types.ts | 共享类型定义 (459行) | ✅ |
| phase-4a-mcp/claudeCodeService.ts | IClaudeCodeService 接口定义 (252行) | ✅ |
| phase-4a-mcp/claudeCodeServiceImpl.ts | Claude Code CLI 进程管理实现 (908行) | ✅ |
| phase-4a-mcp/claudeSession.ts | 会话管理器 (223行) | ✅ |
| phase-4a-mcp/toolSetManager.ts | Code/Cowork 工具集管理 (553行) | ✅ |
| phase-4a-mcp/mcpClientManager.ts | MCP Client 连接管理 (791行) | ✅ |
| phase-4a-mcp/mcpServerRegistry.ts | MCP Server 发现和注册 (357行) | ✅ |
| phase-4a-mcp/mcpCapabilityProvider.ts | MCP → Agent Tool 桥接 (288行) | ✅ |
| phase-4a-mcp/mcpConfig.ts | MCP 配置文件管理 (366行) | ✅ |
| phase-4a-mcp/mcpAutoDiscover.ts | 自动发现 Claude Desktop/Cursor MCP 配置 (387行) | ✅ |
| phase-4a-mcp/claudeEditorAPI.ts | Internal API 实现 (490行) | ✅ |
| phase-4a-mcp/index.ts | 模块入口 | ✅ |

## src/vscode/ (Code OSS Fork)

| 文件/目录 | 用途 | 状态 |
|------|------|------|
| product.json | 品牌信息（已修改为 Claude Editor） | ✅ 已修改 (builder Agent) |
| .nvmrc | Node.js 版本要求 (22.22.0) | ✅ 原始 |
| src/vs/workbench/contrib/claude/ | AI 核心 UI 模块 | ✅ Composer + InlineEdit + Diff + TabCompletion |
| src/vs/workbench/contrib/claude/claude.contribution.ts | 功能注册入口（Composer + AgentLayout services + keybindings） | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/agentLayoutTypes.ts | 布局模式/面板类型/Walkthrough 步骤定义 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/agentLayoutService.ts | IAgentLayoutService 接口 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/agentLayoutServiceImpl.ts | AgentLayoutService 实现（StorageService 持久化） | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/agentLayout/agentLayoutContainer.ts | 主布局容器（splitter + drag-to-resize） | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/agentLayout/quickMenu/agentLayoutQuickMenu.ts | Quick Menu 弹出面板（2列布局选择+开关） | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/agentLayout/walkthrough/agentLayoutWalkthrough.ts | 首次使用引导教程 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/agentLayout/media/agentLayout.css | Agent Layout 全部 CSS（布局+Quick Menu+Walkthrough） | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/composerTypes.ts | 模式/消息/Tab 类型定义 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/composerService.ts | IComposerService 接口 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/composerServiceImpl.ts | ComposerService 实现 (已集成 IClaudeCodeService) | ✅ reverse-engineer-cursor + services-dev |
| src/vs/workbench/contrib/claude/common/composerConstants.ts | View ID 常量 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/composer/composerViewPane.ts | ViewPane 面板实现 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/browser/composer/media/composer.css | Design Token + 组件样式 | ✅ reverse-engineer-cursor |
| src/vs/workbench/contrib/claude/common/claudeInlineEdit.ts | Inline Edit + Diff 类型/配置/颜色 | ✅ editor-dev |
| src/vs/workbench/contrib/claude/common/claudeTabCompletion.ts | Tab 补全类型/配置 | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/inlineEdit/ | 内联编辑控制器+Widget | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/diffRenderer/ | Diff 服务+Gutter 渲染+控制器 | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/tabCompletion/ | 补全 Provider+防抖 | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/media/claudeInlineEdit.css | 内联编辑 Widget CSS | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/media/claudeDiffGutter.css | Gutter 3px 条纹 CSS | ✅ editor-dev |
| src/vs/workbench/contrib/claude/browser/claude.inlineEdit.contribution.ts | 功能注册入口 | ✅ editor-dev |
| src/vs/workbench/contrib/cowork/ | Cowork 非代码编辑器 UI | ✅ 目录已创建 |
| src/vs/workbench/services/claude/ | Claude 服务层 | ✅ 目录+实现已创建 |
| src/vs/workbench/services/claude/common/claudeCodeTypes.ts | 核心类型（会话/流事件/CLI信息） | ✅ services-dev |
| src/vs/workbench/services/claude/common/claudeCodeService.ts | IClaudeCodeService 接口 (VS Code DI) | ✅ services-dev |
| src/vs/workbench/services/claude/common/claudeCodeServiceImpl.ts | 服务实现（CLI进程管理/流处理） | ✅ services-dev |
| src/vs/workbench/services/claude/common/claudeToolTypes.ts | 工具类型（14种工具/权限/UI辅助） | ✅ services-dev |
| src/vs/workbench/services/claude/common/claudeStreamProcessor.ts | 流处理器（CLI流→Composer消息） | ✅ services-dev |
| src/vs/workbench/services/mcp/ | MCP 服务层 | ✅ 目录已创建 |
| .build/electron/ | Electron 二进制（自动下载） | ✅ 已下载 |
| src/vs/workbench/contrib/composer/ | Composer 面板（与 Cursor 目录结构一致） | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/agents/ | Agent 管理模块 | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/aiBackgroundComposer/ | 后台 Agent Composer | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/aiConfig/ | AI 配置模块 | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/aiCpp/ | AI C++ 模块 | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/aiDiff/ | AI Diff 模块 | ✅ 目录已创建 (builder) |
| src/vs/workbench/contrib/aiSettings/ | AI 设置模块 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/ai/ | AI 服务层（与 Cursor 一致） | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/agent/ | Agent 服务层 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/aiCmdK/ | Cmd+K 服务 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/aiContext/ | AI 上下文服务 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/aiErrors/ | AI 错误服务 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/aiSettings/ | AI 设置服务 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/composer/ | Composer 服务 | ✅ 目录已创建 (builder) |
| src/vs/workbench/services/inlineDiffsV2/ | Inline Diff V2 服务 | ✅ 目录已创建 (builder) |

## build/ (构建配置)

| 文件 | 用途 | 状态 |
|------|------|------|
| electron-builder.yml | Electron Builder 打包配置 | ✅ 已创建 (builder Agent) |

## staging/ 集成审计结果 (2026-03-04)

**审计结论：所有 staging 文件均已集成到 Code OSS fork，无遗漏。**

| Staging 目录 | 文件数 | 集成状态 |
|---|---|---|
| phase-2a-composer | 56 | ✅ 全部集成到 contrib/composer/browser/ (fork 有 71 文件) |
| phase-2b-layout | 46 | ✅ 全部集成到 contrib/agents/, appLayout/, reviewChanges/ 等 |
| phase-2c-inline-edit | 76 | ✅ 全部集成到 editor/browser/services/, editor/contrib/inlineDiffs/, inlineCompletions/, workbench/services/inlineDiffsV2/, contrib/aiCpp/, contrib/inlineChat/ |
| phase-2d-services | 144 | ✅ 全部集成到 workbench/services/ 下各子目录 |
| phase-2e-theme | — | ✅ 通过 Task #35 集成到 extensions/claude-theme/ 和 contrib/claude/browser/media/ |
| phase-4a-mcp | 12 | ✅ 全部集成 (fork 有 85 文件) |
| cowork-core | 5 | ✅ 全部集成 (fork 有 22 文件) |

## staging/phase-2a-composer/ (Composer 模块 - bundle 提取)

| 内容 | 说明 | 状态 |
|------|------|------|
| 117 个 JS 文件 | 从 Cursor bundle 提取的 Composer 面板全部模块 | ✅ 已提取+格式化 (builder) |
| 总大小 ~2.2MB | 包含 composerDataService, composerChatService, constants 等 | ✅ prettier 格式化完成 |
| 品牌替换 | --cursor- → --claude-, "Cursor" → "Claude Editor" | ✅ 已替换 |
| 变量名还原 | minified 变量名需还原为有意义名称 | ✅ 已完成 (reverse-engineer-cursor) |

### staging/phase-2a-composer/raw/ (40 个原始提取模块)

从 Cursor 53MB bundle 按模块边界精确提取，使用 `LC_ALL=C grep -ob` 定位 + `dd` 切割。

### staging/phase-2a-composer/deobfuscated/ (45 个反混淆模块)

| 文件 | 大小 | 说明 | 反混淆者 |
|------|------|------|----------|
| constants.js | 7KB | ToolName 枚举 (60+ 工具名)、命令 ID、模式颜色 | reverse-engineer-cursor |
| composer.js | - | IComposerContribution 接口 | reverse-engineer-cursor |
| composerEventService.js | - | 30+ 事件的 Event Bus | reverse-engineer-cursor |
| composerAgent.js | - | IComposerAgentService + 错误类 | reverse-engineer-cursor |
| composerViews.js | - | IComposerViewsService + model parameter 解析 | reverse-engineer-cursor |
| composerChatServiceInterface.js | - | IComposerChatService 接口 | reverse-engineer-cursor |
| composerModelFilters.js | - | supportsPlanMode 检查 | reverse-engineer-cursor |
| composerUriUtils.js | - | URI 工具函数文档 | reverse-engineer-cursor |
| composerToolLookup.js | - | isToolCallActive | reverse-engineer-cursor |
| composerContextKeys.js | - | 14 个 RawContextKey | reverse-engineer-cursor |
| composerStorageService.js | - | 反应式存储 + 持久标志 | reverse-engineer-cursor |
| asyncOperationRegistry.js | - | 异步操作追踪 | reverse-engineer-cursor |
| agentLayoutService.js | - | IAgentLayoutService + 窗口工具 | reverse-engineer-cursor |
| agentLayoutEventService.js | - | 布局事件 + MRU 导航 | reverse-engineer-cursor |
| composerTextModelService.js | - | 文本模型引用创建 | reverse-engineer-cursor |
| composerAgentProviderRouter.js | - | Agent 路由 + 缓存 | reverse-engineer-cursor |
| composerContextServiceTypes.js | - | IComposerContextService | reverse-engineer-cursor |
| composerCapabilityMappings.js | - | 35+ 能力显示名/Schema | reverse-engineer-cursor |
| composerCapabilities.js | - | 基类 + 注册表 + 生命周期钩子 | reverse-engineer-cursor |
| composerData.js | - | 数据模型、工具审批、分类 | reverse-engineer-cursor |
| naiveComposerAgentProvider.js | - | Agent Handle + 权限计算 | reverse-engineer-cursor |
| pendingApprovalRegistry.js | - | 审批等待 + 结果转换 | reverse-engineer-cursor |
| composerMessageStorageService.js | - | 消息 CRUD (cursorDiskKV) | reverse-engineer-cursor |
| composerMessageRequestContextStorageService.js | - | 请求上下文 CRUD | reverse-engineer-cursor |
| composerCodeBlockPartialInlineDiffFatesStorageService.js | - | Diff Hunk 接受/拒绝状态 | reverse-engineer-cursor |
| composerFileService.js | - | 文件 CRUD + worktree 支持 | reverse-engineer-cursor |
| toolCallHumanReviewTypes.js | - | 审批枚举 + protobuf 反序列化 | reverse-engineer-cursor |
| bubbleComposerDataHandle.js | 9KB | Bubble 数据句柄 + Agent Core 交互查询/更新 + MCP Auth 流程 | reverse-engineer-cursor |
| composerCodeBlockDiffStorageService.js | 20KB | Diff 存储 + ModelConfigService 概要 | reverse-engineer-cursor |
| composerMigrations.js | 8KB | 14 个迁移版本 (v0→v14) | reverse-engineer-cursor |
| utils.js | 20KB | 文件导航、序列化、初始化、反应式状态 | reverse-engineer-cursor |
| browserAutomationService.js | stub | 200KB raw，仅 stub header | reverse-engineer-cursor |
| composerCheckpointStorageService.js | stub | 163KB raw，仅 stub header | reverse-engineer-cursor |
| composerDataHandle.js | 587行 | WeakRef GC + 持久化后端 | architect |
| composerDataService.js | 830行 | 29 DI 参数的完整服务实现 | architect |
| composerBlobStore.js | - | Blob 存储 | architect |
| composerModesService.js | - | 模式管理 | architect |
| composerChatService.js | - | 聊天服务 | architect |
| composerDecisionsService.js | 375行 | 决策服务 | architect |
| composerCodeBlockService.js | 471行 | 代码块管理 | architect |
| composerCheckpointService.js | 17KB | 检查点服务 | architect |
| toolCallHumanReviewService.js | 29KB | 审批服务完整实现 | architect |

## staging/phase-2b-layout/ (布局模块 - bundle 提取)

| 内容 | 说明 | 状态 |
|------|------|------|
| 46 个 JS 文件 | 从 Cursor bundle 提取的 layout/contrib 模块 | ✅ 已提取+格式化 (builder) |
| 总大小 ~848KB | 包含 agentLayout, quickMenu, walkthrough 等 | ✅ prettier 格式化完成 |

## staging/phase-2d-services/ (AI 服务层和 Agent 协议)

| 文件 | 用途 | 状态 |
|------|------|------|
| ANALYSIS.md | 完整分析文档（服务/协议/适配方案） | ✅ 已完成 (services-dev Agent) |
| ai-service/aiService.ts | 46+ 个 AI 服务接口和模块路径 | ✅ 已完成 |
| agent-protocol/protobuf-types.ts | 626 个 protobuf 类型的 TypeScript 定义 | ✅ 已完成 |
| agent-protocol/services.ts | 6 个 gRPC 服务的完整方法定义 | ✅ 已完成 |
| agent-extension/agentRunner.ts | cursor-agent 扩展架构和 SDK 调用模式 | ✅ 已完成 |
| agent-extension/agentExec.ts | cursor-agent-exec 执行引擎架构 | ✅ 已完成 |
| background-agent/backgroundAgent.ts | Background Agent 通信协议和端点 | ✅ 已完成 |

## staging/phase-2d-services/ai/ (AI 服务 - bundle 提取)

| 内容 | 说明 | 状态 |
|------|------|------|
| 40 个 JS 文件 | 从 Cursor bundle 提取的 AI 服务模块 | ✅ 已提取+格式化 (builder) |
| 总大小 ~388KB | 包含 mcpService, aiProviderService 等 | ✅ prettier 格式化完成 |

## staging/phase-2d-services/agent/ (Agent 服务 - bundle 提取)

| 内容 | 说明 | 状态 |
|------|------|------|
| 40 个 JS 文件 | 从 Cursor bundle 提取的 Agent 服务模块 | ✅ 已提取+格式化 (builder) |
| 总大小 ~220KB | 包含 agentProviderService, agentRunner 等 | ✅ prettier 格式化完成 |

## staging/phase-2e-theme/ (主题系统)

| 文件 | 用途 | 状态 |
|------|------|------|
| claude-dark.json | Claude Dark 主题（VS Code 格式） | ✅ 已完成 |
| claude-light.json | Claude Light 主题（VS Code 格式） | ✅ 已完成 |
| claude-warm.json | Claude Warm 暖色主题变体 | ✅ 已完成 |
| cursor-variables.css | 109 个 --cursor-* 变量 + glass + prompt-input 变量 | ✅ 已完成 |
| ai-components.css | 16 类 AI UI 组件 CSS 样式 | ✅ 已完成 |
| theme-mapping.md | 变量映射文档（Cursor→Claude 完整对照表） | ✅ 已完成 |
| cursor-ai-styles.css | 2874 条 Cursor 专属 CSS 规则 (从 bundle 提取, ~490KB) | ✅ 已提取 (builder) |
| claude-ai-styles.css | Claude 品牌替换版 CSS (cursor→claude) | ✅ 已提取 (builder) |
| cursor-variables-complete.css | 222 个唯一 CSS 变量定义 | ✅ 已提取 (builder) |

## tools/ (提取和格式化工具)

| 文件 | 用途 | 状态 |
|------|------|------|
| find-modules.js | 枚举 Cursor bundle 中所有模块路径 (782个) | ✅ 已创建 (builder) |
| extract-modules.js | 从 bundle 提取模块代码，支持分类提取+品牌替换 | ✅ 已创建 (builder) |
| extract-css.js | 提取 Cursor 专属 CSS 规则和变量 | ✅ 已创建 (builder) |
| format-extracted.js | 用 prettier 格式化提取的代码片段 | ✅ 已创建 (builder) |

## scripts/ (提取和反混淆工具)

| 文件 | 用途 | 状态 |
|------|------|------|
| extract-modules.js | 从 Cursor bundle 按模块边界提取代码 | ✅ 已创建 (architect) |
| unbundle.js | 自动拆包脚本（bundle → 独立模块文件） | ✅ 已创建 (extractor) |
| deobfuscate.js | 反混淆流水线（符号表构建 + 变量名还原 + 验证） | ✅ 已创建 (analyzer) |
| format-modules.js | 批量 prettier 格式化拆包后模块（含 fallback 格式化） | ✅ 已创建 (ai-hunter) |
| restore-imports.js | esbuild 运行时→ES module 还原（Ae→import, Bi→createDecorator, GN→export） | ✅ 已创建 (ai-hunter) |
| convert-to-ts.js | TypeScript 转换（DI 类型注解、字段类型、enum 转换、.js→.ts 重命名） | ✅ 已创建 (ai-hunter) |
| data/service-map.json | 559 个 Bi() DI 服务标识符映射 | ✅ 自动生成 (analyzer) |
| data/singleton-map.json | 431 个 Ki() 单例注册映射 | ✅ 自动生成 (analyzer) |
| data/param-map.json | 1750 个类的 DI 构造函数参数映射 | ✅ 自动生成 (analyzer) |
| data/nls-map.json | 15013 个 NLS 索引→模块路径映射 | ✅ 自动生成 (analyzer) |
| data/module-var-map.json | 1793 个模块变量→路径映射 | ✅ 自动生成 (analyzer) |

## docs/reverse-engineering/cursor-ide/ (新增)

| 文件 | 用途 | 状态 |
|------|------|------|
| cursor-vs-vscode-diff.md | Cursor vs VS Code 完整修改清单 + 迁移方案 | ✅ 已完成 (analyzer) |
| deobfuscation-strategy.md | 5 层反混淆策略文档 | ✅ 已完成 (analyzer) |

## extracted/ (逆向提取的源码，不提交到 git)

| 目录 | 用途 | 状态 |
|------|------|------|
| claude-app/ | Claude Desktop App asar 解包 | ✅ 已提取 |
| claude-app/.vite/build/ | 主进程代码 (minified) | ✅ 已分析 |
| claude-app/.vite/renderer/ | 渲染进程代码 | ✅ 部分分析 |
| cursor-app/ | Cursor IDE 应用解包 | ✅ 已提取 |
| cursor-app/extensions/theme-cursor/ | Cursor 主题 JSON 文件 | ✅ 已分析 |
| cursor-app/out/vs/workbench/ | Cursor workbench CSS | ✅ 已分析 |
| cursor-modules/ | 从 bundle 拆分的独立模块 (264 files) | ✅ 已提取 (architect) |
| cursor-modules/composer-related.css | Composer 相关 CSS 规则 (2475 rules) | ✅ 已提取 |
| cursor-modules/MODULE_INDEX.txt | 模块索引 | ✅ 已生成 |

## staging/restored/ (反混淆后的 Inline Edit/Diff/Tab 代码)

| 文件 | 用途 | 状态 |
|------|------|------|
| INDEX.md | 完整的标识符映射表和目录结构 | ✅ 已创建 (editor-dev) |
| inline-diff/inlineDiffTypes.js | 11 个 Inline Diff 命令 ID | ✅ 已反混淆 (editor-dev) |
| inline-diff/inlineDiffController.js | 编辑器贡献：accept/reject/navigate (1317行) | ✅ 已反混淆 (editor-dev) |
| inline-diff/inlineDiffService.api.js | InlineDiffService API 文档 (56KB模块) | ✅ 已创建 (editor-dev) |
| inline-chat/inlineChat.js | 配置键、上下文键、颜色令牌、命令 ID | ✅ 已反混淆 (editor-dev) |
| tab-completion/commandIds.js | 6 个 Inline Suggest 命令 ID | ✅ 已反混淆 (editor-dev) |
| tab-completion/inlineCompletionContextKeys.js | 11 个上下文键 | ✅ 已反混淆 (editor-dev) |
| tab-completion/inlineCompletionsController.js | Tab 补全控制器 (602行) | ✅ 已反混淆 (editor-dev) |
| tab-completion/ghostTextView.js | Ghost Text 渲染 Widget (553行) | ✅ 已反混淆 (editor-dev) |
| tab-completion/cppDebouncingService.js | CPP 请求防抖服务 | ✅ 已反混淆 (editor-dev) |
| tab-completion/cppTypes.js | CPP 全局状态和 CSS 类名 | ✅ 已反混淆 (editor-dev) |
| css/inlineDiffStyles.css | 88 条内联 Diff 装饰 CSS | ✅ 已提取 (editor-dev) |
| css/diffEditorStyles.css | 257 条 Diff 编辑器 CSS | ✅ 已提取 (editor-dev) |
| css/ghostTextStyles.css | 63 条 Ghost Text CSS | ✅ 已提取 (editor-dev) |
| css/inlineChatStyles.css | 140 条内联聊天 CSS | ✅ 已提取 (editor-dev) |

## staging/extensions/ (Cursor 扩展提取与分析)

| 文件 | 用途 | 状态 |
|------|------|------|
| EXTENSION_ANALYSIS.md | 4 个 Cursor 扩展完整架构分析 | ✅ 已完成 (editor-dev) |
| extract_webpack_modules.py | Webpack bundle 模块提取脚本 v1 | ✅ 已创建 (editor-dev) |
| extract_activate_v2.py | Activate 函数提取脚本 v2 | ✅ 已创建 (editor-dev) |
| extracted/cursor-agent/ | 原始提取的 activate + strings | ✅ 已提取 (editor-dev) |
| extracted/cursor-agent-exec/ | 原始提取的 activate (22KB) + strings | ✅ 已提取 (editor-dev) |
| extracted/cursor-mcp/ | 原始提取的 activate + strings | ✅ 已提取 (editor-dev) |
| extracted/cursor-retrieval/ | 原始提取的 activate + strings | ✅ 已提取 (editor-dev) |

## staging/extensions/restored/ (反混淆后的扩展代码)

| 文件 | 用途 | 状态 |
|------|------|------|
| INDEX.md | 完整扩展架构文档+API映射+适配方案 | ✅ 已创建 (editor-dev) |
| cursor-agent/activate.js | Anthropic Proxy + Agent Provider (65行) | ✅ 已反混淆 (editor-dev) |
| cursor-agent-exec/activate.js | 完整执行引擎 16 子系统 (~850行) | ✅ 已反混淆 (editor-dev) |
| cursor-mcp/activate.js | MCP Lease + OAuth + Everything Provider (155行) | ✅ 已反混淆 (editor-dev) |
| cursor-retrieval/activate.js | Grep + 索引 + Git Graph + Bugbot (340行) | ✅ 已反混淆 (editor-dev) |

## src/vs/workbench/contrib/ (反混淆后的源码)

| 文件 | 用途 | 状态 |
|------|------|------|
| composer/browser/constants.js | 所有 Composer 常量、命令 ID、模式颜色 | ✅ 已反混淆 (architect) |
| composer/browser/composerContextKeys.js | 14 个 Composer Context Keys | ✅ 已反混淆 (architect) |
| composer/browser/composerAgent.js | IComposerAgentService 接口 + 错误类型 | ✅ 已反混淆 (architect) |
| composer/browser/composerModesService.js | ComposerModesService (mode 管理、keybinding) | ✅ 已反混淆 (architect) |
| composer/browser/composerEventService.js | ComposerEventService (30+ 事件) | ✅ 已反混淆 (architect) |
| composer/browser/composerData.js | 数据结构、工具分类、审批标签 | ✅ 已反混淆 (architect) |
| composer/browser/composerDataHandle.js | 数据句柄管理 + WeakRef GC + 持久化 | ✅ 已反混淆 (architect) |
| composer/browser/composerChatServiceInterface.js | IComposerChatService 接口 | ✅ 已反混淆 (architect) |
| composer/browser/agentLayoutEventService.js | Agent 布局事件 + MRU 导航 | ✅ 已反混淆 (architect) |
| composer/browser/composer.css | Composer CSS (cursor→claude 品牌替换) | ✅ 已反混淆 (architect) |
| composer/browser/VARIABLE_MAP.md | 变量名映射表 (minified→meaningful) | ✅ 已创建 (architect) |
| mcp/common/mcpTypes.js | MCP 类型、枚举、连接状态 | ✅ 已反混淆 (architect) |
| mcp/common/mcpConfiguration.js | MCP 配置 schema、发现源 | ✅ 已反混淆 (architect) |

## src/vs/workbench/services/agent/browser/ (Agent 服务层 - 反混淆)

| 文件 | 用途 | 状态 |
|------|------|------|
| agentResponseAdapter.js | 核心流式响应适配器 (1347行) | ✅ 已反混淆 (services-dev) |
| subagentComposerService.js | 子Agent编排/后台管理/续传 (1146行) | ✅ 已反混淆 (services-dev) |
| agentProviderService.js | Agent Handler 注册和 Agent 创建 (61行) | ✅ 已反混淆 (services-dev) |
| agentPrewarmService.js | 预热连接管理 (228行) | ✅ 已反混淆 (services-dev) |
| cloudAgentStorageService.js | 云端Agent持久化存储 (458行) | ✅ 已反混淆 (services-dev) |
| backgroundWorkRegistry.js | 后台工作项跟踪 (159行) | ✅ 已反混淆 (services-dev) |
| conversationActionManager.js | 会话动作/中止信号管理 (101行) | ✅ 已反混淆 (services-dev) |
| toolCallHandlers/shell/shellToolCallHandler.js | Shell 命令处理 (383行) | ✅ 已反混淆 (services-dev) |
| toolCallHandlers/edit/editToolCallHandler.js | 文件编辑处理 (267行) | ✅ 已反混淆 (services-dev) |
| toolCallHandlers/task/taskToolCallHandler.js | 子任务/子Agent处理 (603行) | ✅ 已反混淆 (services-dev) |
| toolCallHandlers/todo/todoToolCallHandler.js | Todo 列表处理 (181行) | ✅ 已反混淆 (services-dev) |

## src/vs/workbench/services/ai/browser/ (AI 服务层 - 反混淆)

| 文件 | 用途 | 状态 |
|------|------|------|
| subagentsService.js | 子Agent定义发现和加载 (140行) | ✅ 已反混淆 (services-dev) |
| mcpSchema.js | MCP 配置 JSON Schema (119行) | ✅ 已反混淆 (services-dev) |

## extensions/claude-theme/ (Claude 主题扩展)

| 文件 | 用途 | 状态 |
|------|------|------|
| package.json | 扩展清单：注册 3 个主题 (Claude Dark/Light/Warm) | ✅ 已创建 (reverse-engineer-claude) |
| themes/claude-dark.json | 328+ 颜色定义 + 34 token 规则 | ✅ 已集成 (reverse-engineer-claude) |
| themes/claude-light.json | Light 主题变体 | ✅ 已集成 (reverse-engineer-claude) |
| themes/claude-warm.json | Warm Dark 主题变体 | ✅ 已集成 (reverse-engineer-claude) |

## contrib/claude/browser/media/ (主题 CSS)

| 文件 | 用途 | 状态 |
|------|------|------|
| claudeOfficialTokens.css | Claude App 官方设计 Token (HSL, 来自 window-shared.css) | ✅ 已提取 (reverse-engineer-claude) |
| claudeVariables.css | 109 个 --cursor-* CSS 变量映射到 Claude 品牌色 | ✅ 已集成 (reverse-engineer-claude) |
| claudeAiComponents.css | AI 组件 CSS (composer, tool call, diff, chat) | ✅ 已集成 (reverse-engineer-claude) |

## contrib/claude/browser/ (主题贡献)

| 文件 | 用途 | 状态 |
|------|------|------|
| claude.theme.contribution.ts | CSS 导入入口 (4 个 CSS 文件) | ✅ 已创建 (reverse-engineer-claude) |

## workbench 层修改 (主题默认值)

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| workbenchThemeService.ts | 默认主题改为 Claude Dark/Light + 启动闪屏色替换 | ✅ 已修改 (reverse-engineer-claude) |
| workbench.common.main.ts | 注册 claude.theme.contribution.js | ✅ 已修改 (reverse-engineer-claude) |

## Claude Code CLI 集成模块 (extracted/cursor-unbundled/)

| 文件 | 用途 | 状态 |
|------|------|------|
| services/ai/browser/claudeCodeBridge.js | 核心 CLI Bridge — spawn claude 进程、解析 stream-json | ✅ 新建 (claude-integrator) |
| services/agent/browser/claudeCodeAgentHandler.js | Agent 处理器 — 实现 agentProviderService 接口、Claude 事件→InteractionUpdate 转换 | ✅ 新建 (claude-integrator) |
| contrib/composer/browser/naiveComposerAgentProvider.ts | 修改：用 ClaudeCodeAgentHandler 替代 gRPC agent、跳过 protobuf 解码 | ✅ 已修改 (claude-integrator) |
| services/agent/browser/agentProviderService.ts | 修改：注册 Claude CLI handler 为默认 fallback | ✅ 已修改 (claude-integrator) |
| services/ai/browser/backendClient.ts | 修改：Proxy 方法路由到 Claude CLI 而非抛错 | ✅ 已修改 (claude-integrator) |
