# 交接文档：Cursor 全量逆向工程

> 日期: 2026-03-05
> 上下文: Team Lead context 即将耗尽，需要下一位接手

---

## 一、项目战略转向

**旧方案**（已废弃）: Code OSS + 从 Cursor 提取部分 AI 模块 → UI 效果差
**新方案**（当前）: 直接用 Cursor 完整代码做基底，只改三样东西：
1. **AI 后端** — Cursor 服务器 → Claude Code CLI（只改后端调用，前端 UI 完全不动）
2. **品牌** — Cursor → Claude Editor
3. **移除私有功能** — 遥测、计费、认证

---

## 二、当前进度

### 已完成的任务

| # | 任务 | 产出 |
|---|------|------|
| 1 | 完整提取 Cursor 代码 | `extracted/cursor-app/`（17,555 文件，504MB） |
| 2 | 分析 Cursor vs VS Code 修改点 | `docs/reverse-engineering/cursor-ide/cursor-vs-vscode-diff.md` |
| 3 | 定位所有 AI 调用点 | `docs/reverse-engineering/cursor-ide/ai-endpoints-analysis.md` |
| 4 | 制定迁移方案 | `docs/migration-plan-cursor-to-claude.md` |
| 8 | 分析 bundle 格式 | `docs/reverse-engineering/cursor-ide/bundle-format-analysis.md` |
| 9 | 开发拆包脚本 | `scripts/unbundle.js` → `extracted/cursor-unbundled/`（2763 个模块） |
| 10 | 开发反混淆流水线 | 5 个脚本全部就绪 |

### 正在进行的任务

**Task #11: 全量逆向流水线执行**

```
Step 1: format-modules.js    ← extractor 正在执行（格式化 2763 个文件）
Step 2: restore-imports.js   ← ai-hunter 就绪（14345 条 import 待生成）
Step 3: deobfuscate.js       ← analyzer 就绪（559 服务 + 1750 参数映射）
Step 4: convert-to-ts.js     ← 待分配
Step 5: 重组为可编译项目      ← 待创建任务
```

---

## 三、团队状态

Team name: `cursor-full-reverse`

| Agent | 当前任务 | 状态 |
|-------|---------|------|
| extractor | 跑 format-modules.js | 执行中 |
| analyzer | 等跑 deobfuscate.js restore | 就绪待命 |
| ai-hunter | 等跑 restore-imports.js | 就绪待命 |

**重要**: 不要解散团队。三个 Agent 都有上下文，可以直接继续用。

---

## 四、关键文件索引

### 逆向分析文档
- `docs/reverse-engineering/cursor-ide/full-extraction-inventory.md` — Cursor 完整文件清单
- `docs/reverse-engineering/cursor-ide/cursor-vs-vscode-diff.md` — Cursor vs VS Code 修改分析（323 新模块 + 42 修改模块）
- `docs/reverse-engineering/cursor-ide/ai-endpoints-analysis.md` — AI 调用点分析（57+6 gRPC 服务）
- `docs/reverse-engineering/cursor-ide/bundle-format-analysis.md` — Bundle 格式分析（esbuild ESM）
- `docs/reverse-engineering/cursor-ide/deobfuscation-strategy.md` — 反混淆策略文档
- `docs/migration-plan-cursor-to-claude.md` — 完整迁移方案

### 自动化脚本
- `scripts/unbundle.js` — 拆包脚本（51MB → 2763 个文件）✅ 已运行
- `scripts/format-modules.js` — prettier 批量格式化 ⏳ 执行中
- `scripts/restore-imports.js` — esbuild 运行时 → ES module import 还原
- `scripts/deobfuscate.js` — 变量名还原（5 层策略）
- `scripts/convert-to-ts.js` — TypeScript 转换 + 类型注解

### 符号表数据
- `scripts/data/service-map.json` — 559 个 DI 服务映射
- `scripts/data/param-map.json` — 1750 个类构造函数参数映射
- `scripts/data/singleton-map.json` — 431 个单例注册
- `scripts/data/nls-map.json` — 15013 个国际化字符串
- `scripts/data/module-var-map.json` — 1793 个模块变量映射

### 拆包产出
- `extracted/cursor-unbundled/modules/` — 2763 个独立 JS 模块
- `extracted/cursor-unbundled/module-map.json` — 混淆变量名 → 模块路径
- `extracted/cursor-unbundled/dependency-graph.json` — 模块依赖图（15149 条边）
- `extracted/cursor-unbundled/export-map.json` — 导出映射
- `extracted/cursor-unbundled/_runtime.js` — esbuild 运行时
- `extracted/cursor-unbundled/_entry.js` — 入口代码

---

## 五、接手后需要做什么

### 立即要做

1. **检查 extractor 是否完成格式化** — 看 Task #11 Step 1 状态
2. **如果格式化完成，通知 ai-hunter 跑 restore-imports.js**:
   ```
   SendMessage to ai-hunter: "格式化完成，现在全量跑 restore-imports.js"
   ```
3. **import 还原完成后，通知 analyzer 跑 deobfuscate.js restore**:
   ```
   SendMessage to analyzer: "import 还原完成，现在全量跑 deobfuscate.js restore"
   ```
4. **变量名还原完成后，分配 convert-to-ts.js 给任一 Agent**

### 流水线完成后

5. **质量检查** — 抽查核心模块的还原质量：
   - `services/ai/browser/aiService.js` — AI 核心
   - `contrib/composer/browser/composerDataService.js` — Composer 核心
   - `services/agent/browser/agentResponseAdapter.js` — Agent 核心

6. **开始迁移执行** — 按 `docs/migration-plan-cursor-to-claude.md` 执行：
   - Phase 0: product.json 品牌替换
   - Phase 1: AI 后端替换（只需改 5 个核心模块的实现）
   - Phase 2: 移除遥测/计费
   - Phase 3: 品牌细节
   - Phase 4: 扩展适配
   - Phase 5: 构建打包

---

## 六、关键技术细节

### Bundle 格式
- esbuild ES Module 单文件 bundle
- 模块边界: `var VARNAME = Ae({"path"(){...}})`
- 模块路径未混淆（完整文件路径保留）
- 变量名混淆为 1-3 字符短标识符

### AI 后端只需改 5 个模块
根据 ai-hunter 的分析，整条 AI 调用链可以通过替换以下模块重定向：
1. `services/ai/browser/backendClient.js` — URL 端点
2. `services/ai/browser/aiClientService.js` — gRPC → CLI
3. `services/ai/browser/aiService.js` — 服务总入口
4. `services/ai/browser/cursorCredsService.js` — 认证
5. `services/ai/browser/connectRequestService.js` — 请求构建

加上 `extensions/cursor-agent/` 扩展的重写。

### 反混淆脚本注意事项
- `deobfuscate.js` 的 Strategy 1 跳过 <=2 字符变量名（防止全局替换冲突）
- Strategy 2 构造函数参数重命名限定在 constructor 作用域内（已修复 bug）
- 重复参数名自动加数字后缀

### Cursor 基础版本
- VS Code 1.105.1
- Electron 39.6.0
- 2763 个模块（2716 ESM + 47 CJS）
- 577 个 DI 服务
- 508 个 workbench contribution
- 16 个自定义扩展

---

## 七、共享记忆

团队共享记忆在 `memory/` 目录下，Agent 们会读取和更新：
- `memory/decisions.md` — 架构决策
- `memory/patterns.md` — 设计模式
- `memory/pitfalls.md` — 已知坑
- `memory/files.md` — 文件索引

---

## 八、规则提醒

1. **前端 UI 完全不动** — 用户明确要求
2. **只改后端调用** — Cursor server → Claude Code CLI
3. **Agent 团队不要解散** — 等用户说"解散"才解散
4. **工作完成后生成报告** — 放 `Reports/` 目录
5. **全程简体中文沟通**
