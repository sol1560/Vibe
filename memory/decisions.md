# 架构决策记录

## [2026-03-04] 项目初始化 — 确定项目方向和技术路线

### 背景
需要构建一个专为 Claude Code 打造的 VS Code 变体开源 IDE，采用 Claude 品牌设计语言。

### 决策
1. **基于 Code OSS 构建**：fork VS Code 开源版本（Code OSS），而非从零开始
2. **逆向调研先行**：先分析 Claude Desktop App 和 Cursor IDE，再开始开发
3. **Claude 设计语言**：UI 完全采用 Anthropic 的品牌规范（配色、字体、组件风格）
4. **Claude Code 原生集成**：深度集成，而非插件形式

### 理由
- Code OSS 提供了成熟的 IDE 基础，避免重复造轮子
- 逆向调研确保设计和功能方向正确
- 品牌一致性让用户感受到这是 Claude 生态的一部分
- 原生集成提供比插件更好的体验

### 影响范围
整个项目架构和开发流程

## [2026-03-04] 逆向调研 — 两个目标应用

### Claude Desktop App
- **目标**：提取 UI 规范（配色、字体、间距、组件）+ Claude Code 调用方式
- **方法**：DMG 挂载 → asar 解包 → CSS/JS 分析

### Cursor IDE
- **目标**：学习 AI IDE 最佳实践（交互设计、架构方案）
- **方法**：DMG 挂载 → asar 解包 → 源码分析
- **对标要求**：做到一模一样的功能体验

## [2026-03-04] Cowork 功能集成 — 架构方案确定

### 背景
用户需要 Claude Editor 支持非代码工作流（文档、表格、PPT、PDF 等），借鉴 Claude Desktop Cowork。

### 决策
1. **内置扩展方式集成**：Cowork 作为 3 个 Bundled Extension（core + editors + mcp-host），而非修改 VS Code 核心
2. **共用 Agent Core**：Cowork 与 Code 模式共享同一个 Claude Code CLI 会话，通过动态切换 Tool Set 区分
3. **渐进式安全**：3 级安全方案（Electron Sandbox → 增强沙箱 → 可选 VM），而非像 Claude Desktop 默认使用完整 VM
4. **技术选型**：Tiptap（文档）+ Univer（表格）+ Reveal.js/PptxGenJS（PPT）+ PDF.js（PDF）

### 理由
- 内置扩展保持与上游 Code OSS 的同步能力
- 共用 Agent Core 减少资源消耗，实现无缝模式切换
- IDE 场景安全风险低于通用 Agent，不需要默认 VM
- 技术选型全部开源、MIT/Apache 许可，社区活跃

### 影响范围
整体 IDE 架构、扩展系统、安全模型、UX 设计

## [2026-03-04] IP 合规 — 实现规格替代直接代码复制

### 背景
团队考虑直接从 Cursor minified bundle 中提取和复制代码。

### 决策
**不直接复制 Cursor 代码**。改用"逆向分析 → 实现规格文档 → 从零编写"的工作流。

### 理由
- CLAUDE.md 明确规定"不直接复制受版权保护的代码"和"最终产品使用自己的实现"
- 从 minified bundle 提取的代码质量差，难以维护
- 实现规格文档提供了足够的技术细节（设计尺寸、CSS 规范、组件结构、交互行为）用于从零实现
- 自己编写的代码更易理解、维护和扩展

### 具体方案
1. 已完成：agent-mode-ui-analysis.md（逆向分析结果）
2. 已完成：composer-implementation-spec.md（Composer 实现规格）
3. 已完成：agent-layout-implementation-spec.md（Agent 布局实现规格）
4. 下一步：IDE 开发团队根据规格文档用 TypeScript/React 从零实现

### 影响范围
Phase 2 全部任务（2A-2E），从"复制代码"变为"参考规格从零实现"

## [2026-03-04] 策略更新 — 直接用 Cursor 代码还原变量名

### 背景
用户明确说"直接照搬代码我也不介意"，从零重写风险太高（遗漏边缘情况）。

### 决策
**JS/TS 代码直接使用 Cursor 代码还原变量名**，不从零重写。CSS 变量映射到 Claude 品牌色。

### 方法
extract → format → restore variable names → replace brand (cursor→claude)

## [2026-03-04] 主题集成 — Claude 品牌默认主题

### 背景
需要让 IDE 启动时立即展示 Claude 品牌色，而非 VS Code 蓝色。

### 决策
1. 创建 `extensions/claude-theme/` 扩展注册 3 个主题 (Dark/Light/Warm)
2. 修改 `ThemeSettingDefaults` 将默认主题改为 Claude Dark/Light
3. 替换 `COLOR_THEME_DARK_INITIAL_COLORS` 和 `COLOR_THEME_LIGHT_INITIAL_COLORS` 为 Claude 品牌色
4. 创建 `claude.theme.contribution.ts` 加载全局 CSS

### 关键发现
Claude Desktop App 的聊天界面是通过 WebContentsView 从 claude.ai 加载的，不是本地渲染。
本地 Electron shell 只提供：title bar、IPC bridge、MCP runtime、design tokens。
因此无法从 Claude Desktop 提取聊天 UI 组件，但成功提取了官方设计 Token。

### 官方设计 Token 来源
`extracted/claude-app/.vite/renderer/main_window/window-shared.css`
- HSL 语义 Token: --accent-brand, --bg-000~500, --text-000~500, --border-*, --danger-*, --success-*
- 品牌色: --clay (#D97757), --kraft, --book-cloth, --manilla
- Dark 主题: .darkTheme 类
- Legacy 变量: --claude-foreground-color, --claude-background-color 等

## [2026-03-05] Claude Code CLI 集成 — Agent Handler 架构

### 背景
已完成 5 个 AI 后端模块的 stub 替换，需要实现真正的 Claude Code CLI 调用。

### 决策
1. **绕过 protobuf 编解码**：创建 `_claudeEditorUpdate` 标记的 JS 对象，在 naiveComposerAgentProvider 中检测并跳过 `fromBinary()` 解码
2. **在 Agent Handler 层集成**：创建 `ClaudeCodeAgentHandler` 实现 `createAgent()` 接口，替代原来连接 Cursor 服务器的 gRPC handler
3. **翻译层**：`translateClaudeStreamToUpdates()` 将 Claude CLI stream-json 事件翻译为 Cursor UI 期望的 InteractionUpdate 消息格式
4. **CLI 参数**：使用 `claude -p <prompt> --output-format stream-json --verbose` 获取实时流式输出

### 关键文件
- `claudeCodeBridge.js` — spawn CLI、解析 NDJSON
- `claudeCodeAgentHandler.js` — 翻译 Claude→Cursor 消息格式
- `naiveComposerAgentProvider.ts` — 修改：用 Claude handler 替代 gRPC agent

### InteractionUpdate 消息格式 (Cursor UI 期望)
| case | value | 说明 |
|------|-------|------|
| textDelta | { text } | 流式文本 |
| thinkingDelta | { text, thinkingStyle } | 思考/推理 token |
| thinkingCompleted | { thinkingDurationMs } | 思考完成 |
| toolCallStarted | { callId, toolCall: { tool: { case, value } } } | 工具开始 |
| toolCallCompleted | { callId, toolCall: { tool: { case, value } } } | 工具完成 |
| turnEnded | {} | 对话轮结束 |
| heartbeat | {} | 保活信号 |

### Claude CLI stream-json 事件格式
| type | 内容 | 映射 |
|------|------|------|
| system | { session_id, ... } | heartbeat |
| stream_event | { event: { type: "content_block_delta", delta: { type: "text_delta", text } } } | textDelta |
| stream_event | { event: { type: "content_block_delta", delta: { type: "thinking_delta", thinking } } } | thinkingDelta |
| assistant | { message: { content: [...] } } | textDelta / toolCall |
| result | { result, session_id, ... } | turnEnded |

## [2026-03-05] Pipeline 修复 — deobfuscate + convert-to-ts 跨模块引用问题

### 背景
rebundled workbench.desktop.main.js 加载时报 `ReferenceError: Disposable is not defined`，导致黑屏。

### 决策
1. **方向 1（修复源头脚本）**：修复 deobfuscate.js 和 convert-to-ts.js 的 bug，而非在 rebundle.js 中做反向映射
2. **禁用 addDisposableType()**：convert-to-ts.js 中的类型推断功能不成熟，暂时禁用
3. **定义站点检测**：deobfuscate.js 只在模块有变量定义站点时才重命名

### 理由
- 修复源头比在下游做反向映射更可持续
- addDisposableType() 的启发式逻辑不可靠（38 处误判）
- 定义站点检测确保不会破坏跨模块引用

### 验证结果
- Pipeline 重跑：`extends Disposable` = 0，`node --check` = PASS
- App 启动：无 ReferenceError，无黑屏，MCP Gateway 初始化成功
- 剩余非致命错误均为预期行为（扩展 API 版本不匹配等）

## [2026-03-05] re-obfuscation 步骤 — rebundle.js Phase 5a

### 背景
deobfuscate.js 将 DI 服务和单例的短名替换为人类可读名，但 rebundle 回 bundle 时需要恢复原始短名以匹配跨模块引用。

### 决策
在 rebundle.js Phase 5 后添加 Phase 5a re-obfuscation，从 service-map.json 和 singleton-map.json 构建逆转映射。

### 实现
- 读取 service-map (559) + singleton-map (431) 构建 reverseMap
- 按 longName 长度降序排列，防止短名干扰
- word-boundary 正则替换，与 deobfuscate.js 对称
- 不逆转 Strategy 2（构造函数局部参数）— 安全

## [2026-03-05] App 测试环境 — 使用 src app 而非 build app

### 决策
开发和测试基于 `src/ClaudeEditor-darwin-arm64/Claude Editor.app/`（Cursor 完整结构），而非 `build/Claude Editor.app/`。

### 理由
- src app 有正确的 Cursor Electron 二进制和完整目录结构（electron-browser）
- build app 使用 Code OSS 结构（electron-sandbox），与 Cursor workbench 不兼容
- src app 中 Cursor 原版 Electron Framework（173MB）含自定义补丁，是运行 rebundled workbench 的必要条件

## [2026-03-05] AI 调用链完整逆向 — Agent Provider 架构

### 背景
需要找到 Cursor AI 请求的完整调用链，以确定 Claude Code CLI 接入的最佳拦截点。

### 调用链路
```
Composer UI → ComposerService (Bi("composerService"))
  → ComposerAgentProviderRouter (WCf class)
    → NaiveComposerAgentProvider (GCf/JCf class)
      → AgentProviderService (CAa class, Bi("agentProviderService"))
        → MainThreadCursorAgentProviderService (rlb class)
          → [IPC] ExtHostCursorAgentProviderService
            → cursor-agent extension → gRPC backend
```

### 关键类和位置（workbench.desktop.main.js）
- `CAa` = AgentProviderService: line 124532, `registerHandler(handler)` + `createAgent(sessionId, options)`
- `rlb` = MainThreadCursorAgentProviderService: line 304684, IPC bridge
- `WCf` = ComposerAgentProviderRouter: line 124743
- `JCf` = NaiveComposerAgentProvider agent runner: line 124735, `run()` 解码 protobuf

### 拦截点选择
- **推荐方案 A**: 直接在 AgentProviderService 注册 ClaudeCodeHandler（绕过 ExtHost IPC）
- **方案 B**: 通过 cursor-agent 扩展的 `vscode.cursor.registerAgentProvider()` API

### 原始注册方式
`vscode.cursor.registerAgentProvider(agentProvider)` — 在 cursor-agent 扩展的 `activate()` 中调用

## [2026-03-05] 反编译流水线完整重跑 — 全部 6 步完成

### 背景
之前的反编译产出文件丢失（只剩 303/2763），需要从头重跑完整流水线。

### 执行结果
1. unbundle: 2763 模块 ✅
2. format: 2554 文件格式化（使用 prettier API + async 并发，6 秒完成） ✅
3. restore-imports: 15229 条 import ✅
4. deobfuscate: 993 文件, 28482 处替换 ✅
5. convert-to-ts: 349 文件加类型注解 ✅
6. rebundle: 54.1 MB 输出, node --check 通过 ✅

### 修复的脚本 Bug
- convert-to-ts.js: 4 个 bug（addFieldTypes 禁用、正则修复、split 修复、启发式禁用）
- rebundle.js: 2 个 bug（正则收窄 I?→I、空白字符匹配）
- restore-imports.js: 2 个 bug（$ 变量名正则、if 包裹格式）
- format-modules.js: 重写并发（串行 CLI → 并行 API，30 分钟→6 秒）

## [2026-03-05] IPC 错误根本原因分析

### cursorDiskKV* 错误 (P0)
- **原因**: main.js `StorageDatabaseChannel.call()` 只处理 `getItems/updateItems/optimize/isUsed`
- **Cursor 扩展方法**: `cursorDiskKVGet/Set/SetBinary/GetBinary/ClearPrefix/GetPrefix/GetPrefixKeys/GetPrefixBinary/GetBatch`
- **影响**: Composer blob store + checkpoint + message storage 全部失败
- **修复**: 在 main.js `StorageDatabaseChannel.call()` 的 switch 中添加所有 cursorDiskKV* case

### onDidChangeCssModules 错误 (P2)
- **原因**: workbench line 140565 调用 `nativeHostService.onDidChangeCssModules()`, main.js NativeHost channel 不提供
- **影响**: 非致命，只影响 CSS hot-reload，但会抛 uncaught exception
- **修复**: try-catch 包裹或在 main.js 添加空事件

### MainThreadChatContext 错误 (P2)
- **原因**: ExtHost 引用但 workbench Tf actor map 中不存在
- **修复**: 添加 no-op 实现到 Tf map

### $onUnexpectedError on MainThreadTreeViews (P3)
- **原因**: ExtHost 调用该方法但实现中没有
- **影响**: 日志污染 (16803 次)
- **修复**: 添加空方法
