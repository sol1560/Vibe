# 项目上下文

## 项目元信息
- **项目名称**：Claude Editor
- **创建日期**：2026-03-04
- **最后更新**：2026-03-05
- **当前版本**：0.1.0-alpha
- **阶段**：从逆向调研过渡到 IDE 开发（Phase 1-4A 已完成）

## 核心数据

| 指标 | 数值 |
|------|------|
| Composer 模块 TS 文件 | 98 |
| Composer 模块 JS 残余 | 1 (browserInjection.js，转换中) |
| Claude 服务层 TS | 14 |
| Cowork 服务层 TS | 5 |
| Claude 扩展 | 6 (agent, agent-exec, mcp, retrieval, theme, completion) |
| TypeScript 编译 | 零错误 |
| Electron 启动 | 成功 |

## 已完成的阶段

### Phase 1: 搭建 Code OSS Fork 基础框架
- Fork VS Code v1.111.0 (Code OSS)
- 配置 product.json Claude 品牌
- Electron 39.6.0, Node.js 22.22.0

### Phase 2A-2E: 从 Cursor IDE 提取和还原核心 AI 模块
- **2A**: Composer 面板（Chat UI、消息渲染、输入框）
- **2B**: Agent 布局系统（事件服务、上下文感知）
- **2C**: Inline Edit/Diff 渲染（内联编辑、Tab 补全）
- **2D**: AI 服务层和 Agent 协议（protobuf、AI server、gRPC）
- **2E**: 主题系统（Claude Dark/Light/Warm 主题、设计 Token）

### Phase 3: Cowork 非代码编辑器扩展
- Welcome Editor（带空间列表、任务进度、动画）
- Cowork Panel ViewPane
- Task Progress ViewPane
- 服务层（5 个 TS 文件）

### Phase 4A: MCP Host/Server 和 Claude Code 集成
- Claude Code Service 接口和实现
- MCP Host/Server 通信层
- 会话管理器

### JS→TS 大规模反混淆
- 从 Cursor 压缩 bundle 还原 ~100 个 JS 文件为可读 TypeScript
- 还原变量名、添加类型标注、DI 装饰器
- 所有文件通过 TypeScript 编译检查

## 逆向调研进度

### Claude Desktop App
- [x] UI 规范提取（设计 Token、HSL 语义色、品牌色）
- [x] Claude Code 集成方式分析（WebContentsView 加载 claude.ai）
- [x] 应用架构分析（Electron shell + 远程 Web UI）

### Cursor IDE
- [x] AI 交互设计分析（Composer、Agent Mode、Inline Edit）
- [x] 架构方案分析（基于 Code OSS 的修改层）
- [x] 功能清单整理

## 技术栈
- **基础框架**：Code OSS v1.111.0
- **运行时**：Electron 39.6.0
- **Node.js**：22.22.0
- **语言**：TypeScript (strict)
- **编译器**：tsgo (native TS compiler)
- **UI 主题**：Claude Design System (3 themes: Dark/Light/Warm)
- **AI 集成**：Claude Code CLI + MCP Protocol
- **扩展**：6 个 Claude 内置扩展

## 关键架构决策
1. 基于 Code OSS fork 而非从零开始
2. 直接使用 Cursor 代码还原变量名（非从零重写）
3. Cowork 作为 Bundled Extension（非修改核心）
4. Claude 品牌色通过设计 Token 系统注入
5. Claude Code 原生集成（非插件形式）

## 技术债务
- [ ] browserInjection.js 最后一个 JS 文件待转换为 TS
- [ ] 部分 TS 文件使用 `unknown` 类型，需要后续细化
- [ ] 运行时 Claude 扩展功能需要 smoke test
- [ ] Cowork 服务层有多个 TODO 标记

## 未完成的任务
- [ ] **Phase 4B**: 安全沙箱和构建打包
- [ ] 运行时功能验证（Claude 扩展、Composer 面板、主题切换）
- [ ] 端到端集成测试
- [ ] 构建分发包（.dmg / .AppImage / .exe）
- [ ] 用户文档和使用指南

## 编译命令参考
```bash
# TypeScript 类型检查（主源码）
npm run compile-check-ts-native

# Electron 启动
VSCODE_SKIP_PRELAUNCH=1 ./scripts/code.sh

# 扩展编译
gulp compile-extensions
```
