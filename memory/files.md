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

## extracted/ (逆向提取的源码，不提交到 git)

| 目录 | 用途 | 状态 |
|------|------|------|
| claude-app/ | Claude Desktop App asar 解包 | ✅ 已提取 |
| claude-app/.vite/build/ | 主进程代码 (minified) | ✅ 已分析 |
| claude-app/.vite/renderer/ | 渲染进程代码 | ✅ 部分分析 |
