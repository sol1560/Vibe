# 改动日志

## [0.1.0-alpha] - 2026-03-05

### 新增

- **Code OSS Fork 基础框架** (Phase 1)
  - Fork VS Code v1.111.0 作为基础
  - product.json Claude 品牌配置（名称、图标、颜色）
  - **操作 Agent**: builder

- **Cursor AI 模块提取与还原** (Phase 2A-2E)
  - Composer 面板（Chat UI、消息渲染、输入框） — Phase 2A
  - Agent 布局系统（事件服务、上下文感知） — Phase 2B
  - Inline Edit/Diff 渲染（内联编辑、Tab 补全） — Phase 2C
  - AI 服务层和 Agent 协议（protobuf、gRPC） — Phase 2D
  - 主题系统（Claude Dark/Light/Warm） — Phase 2E
  - **操作 Agent**: reverse-engineer-cursor, editor-dev, services-dev, architect

- **Cowork 非代码编辑器** (Phase 3)
  - Welcome Editor（空间列表、任务进度、动画）
  - Cowork Panel 和 Task Progress ViewPane
  - 5 个 Cowork 服务层 TypeScript 文件
  - **操作 Agent**: cowork-dev

- **MCP/Claude Code 集成** (Phase 4A)
  - Claude Code Service 接口和实现
  - MCP Host/Server 通信层
  - 会话管理器
  - **操作 Agent**: architect

- **Claude 扩展** (6 个)
  - claude-agent: Agent Provider
  - claude-agent-exec: Agent 执行引擎
  - claude-mcp: MCP 服务
  - claude-retrieval: 文件索引和检索
  - claude-theme: Claude 品牌主题
  - claude-completion: Tab 补全服务
  - **操作 Agent**: editor-dev, builder

- **逆向调研文档**
  - Claude Desktop App 逆向计划和 UI 规范
  - Cursor IDE 架构分析
  - Composer/Agent 实现规格文档
  - **操作 Agent**: reverse-engineer-claude, reverse-engineer-cursor

- **项目文档**
  - PROJECT_CONTEXT.md: 项目上下文和进度
  - Reports/: 工作报告
  - memory/: 共享记忆（decisions, patterns, pitfalls, files）
  - **操作 Agent**: team-lead

### 修改

- **JS→TS 大规模反混淆**
  - 从 ~100 个压缩 JS 文件还原为可读 TypeScript
  - 还原变量名、添加类型标注、DI 装饰器
  - 删除 86+ 个已转换/空的 JS 文件
  - **最终状态**: Composer 目录零 JS 文件，98 个 TS 文件
  - **操作 Agent**: team-lead, reverse-engineer-cursor, builder, editor-dev, architect, services-dev, cowork-dev

### 修复

- **38+ TypeScript 编译错误**
  - composerBrowserUtils.ts: URI.revive 类型断言、IAllComposersStore 索引签名
  - composerUtilsService.ts: 未使用参数、.map() 回调类型、缺失方法
  - GroupsOrder const enum 导入修复
  - DIFF_CHUNK_GROW_LINES 别名导入
  - **最终状态**: 零编译错误
  - **操作 Agent**: team-lead, builder, editor-dev

- **Claude 扩展编译**
  - 4 个 Claude 扩展缺少 out/ 目录 — 已编译
  - **操作 Agent**: editor-dev

- **Electron 启动**
  - 首次启动成功，无崩溃
  - **操作 Agent**: editor-dev, team-lead
