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
