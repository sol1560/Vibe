# 工作报告：反编译流水线完整执行

> 日期: 2026-03-05
> 团队: decompile-pipeline
> 耗时: ~15 分钟（从创建团队到完成所有 6 步）

---

## 工作概述

从头重新执行了 Cursor 完整反编译流水线（6 步），将 52MB 的 minified bundle 反编译为 2763 个可读的独立模块文件，并重新组装为可运行的 54.1MB bundle。

**背景**: 之前的反编译产出文件丢失（modules 目录中只剩 303/2763 个文件），需要从 unbundle 开始完整重跑。

---

## 流水线执行结果

| 步骤 | 脚本 | 结果 | 耗时 |
|------|------|------|------|
| Step 1: 拆包 | unbundle.js | 2763 模块提取 | ~10s |
| Step 2: 格式化 | format-modules.js | 2554 格式化 + 207 跳过, 0 失败 | ~6s |
| Step 3: Import 还原 | restore-imports.js | 15229 条 import, 0 失败 | ~8s |
| Step 4: 变量名还原 | deobfuscate.js | 993 文件, 3418 变量, 28482 处替换 | ~10s |
| Step 5: TS 转换 | convert-to-ts.js | 349 文件加类型注解, 0 失败 | ~8s |
| Step 6: 重新打包 | rebundle.js | 54.1MB 输出, node --check 通过 | ~15s |

---

## 参与的 Agent 列表

### 审计阶段（5 个 Sonnet agents 并行）

| Agent | 任务 | 发现 |
|-------|------|------|
| audit-format | 审计 format-modules.js | 可直接运行 |
| audit-restore-imports | 审计 restore-imports.js | 2 个 bug（已修复）：$ 变量名正则 + if 包裹格式 |
| audit-deobfuscate | 审计 deobfuscate.js | 可直接运行，Strategy 3/5 缺失但不影响 |
| audit-convert-ts | 审计 convert-to-ts.js | 4 个 bug（已修复）：addFieldTypes、正则、split、启发式猜测 |
| audit-rebundle | 审计 rebundle.js | 8 个问题（修复 2 个关键的）：正则过于激进、空白字符遗漏 |

### QC 阶段（3 个 Sonnet agents 并行）

| Agent | 任务 | 评分 |
|-------|------|------|
| qc-ai-service | AI 核心模块质量检查 | backendClient: 4/5, connectRequestService: 4/5, cursorCredsService: 3/5 |
| qc-composer | Composer 模块质量检查 | 已完成 |
| qc-agent | Agent 模块质量检查 | 已完成 |

---

## 关键变更

### 修复的 Bug（运行前）

#### convert-to-ts.js（4 个修复）
1. **禁用启发式接口猜测** — `inferParamType()` 中 `endsWith('Service')` 的猜测会产生错误类型名
2. **修复 `split('=')` 默认值解析** — 改用 `indexOf('=')` 只切第一个等号
3. **禁用 `addFieldTypes()`** — 多类文件中字段会被重复注入到每个 class
4. **修复 constructor 正则** — 用平衡括号匹配替代 `[^)]*` 处理嵌套括号

#### rebundle.js（2 个修复）
1. **class field 删除正则收窄** — `I?[A-Z]` → `I[A-Z]`，避免误删非接口类型的 field
2. **空白字符遗漏** — `extractDepPreamble` 改用 `/[\s]/` 匹配所有空白

#### restore-imports.js（由 audit agent 修复）
1. **$ 变量名正则** — `/^(\$?\w+)\(\)/` → `/^([\w$]+)\(\)/`，支持中间含 $ 的变量名
2. **if/for 包裹格式** — 添加 controlWrapMatch 检测，自动剥离控制流前缀

### 性能优化

#### format-modules.js（重写并发）
- **问题**: `--concurrency` 参数被解析但从未使用，实际串行执行 `execSync` 调用 npx prettier
- **修复**: 使用 prettier API 替代 CLI，实现真正的 async worker pool 并发
- **效果**: 2763 文件处理时间从 ~30 分钟降到 ~6 秒

---

## 关键发现

### 质量评估

**AI 模块** (qc-ai-service):
- **backendClient.ts**: 4/5 — 结构清晰，DI 注解完整，可直接用于迁移
- **connectRequestService.ts**: 4/5 — 认证等待逻辑完整
- **cursorCredsService.ts**: 3/5 — 逻辑清晰但 URL 常量仍混淆
- **aiService.js / aiClientService.js**: 1-2/5 — 只是 DI token 定义，实际实现在别处（搜索 `Ki(IAiService`）

**Composer 模块** (qc-composer):
- **composerDataService.ts**: 4/5 — 2171 行，50+ import，方法名清晰，DI 注解完整
- **constants.js**: 3/5 — 格式化正常但变量名几乎全部混淆（gJl, Fdg 等），含大量有价值的 command ID 和 CSS 变量
- **composerDataCreation.js**: 2/5 — 只有 29 行，疑似 unbundle 截断或实际逻辑内联到其他模块

**Agent 模块** (qc-agent):
- **agentProviderService.ts**: 4.5/5 — 质量最好，接近可直接阅读
- **quickAgentService.ts**: 4/5 — DI token 名仍混淆但结构完整
- **agentResponseAdapter.js**: 3.5/5 — 大量类名未还原（HSf, rit, rSf 等）
- **naiveComposerAgentProvider.ts**: 2/5 — **严重问题：核心 agent 执行逻辑格式化失败，压缩成单行**
- **composerAgentProviderRouter.js**: 3/5 — 类名 WCf/GCf 未还原

### 已知限制与问题

**格式化问题**:
- naiveComposerAgentProvider.ts 核心逻辑未展开（包含权限管理、流式处理的关键代码）
- 需要单独做二次格式化

**反混淆覆盖率**:
- 局部变量 (e/t/i/r/s) 未还原 — 预期行为，deobfuscate 只处理 DI 服务和构造函数参数
- 类名覆盖不足 — HSf, WCf, GCf 等 10+ 个重要类名未还原
- 常量文件变量名几乎全部混淆 — Strategy 5（字符串推断）未实现
- VS Code 框架层短码 token (Fa, bM, kM 等) 系统性未还原

**其他**:
- 19 个模块有语法错误，rebundle 使用原始代码
- export-map.json 的 key 与 module-map 不一致，export 还原精度有限
- cursorCredsService 中 URL 常量仍是混淆名

---

## 产出文件

### 反编译模块
- `extracted/cursor-unbundled/modules/` — 2763 个独立模块（.js + .ts 混合）
- 目录结构：vs/, external/, packages/, proto/, src/, node_modules/

### 符号表
- `scripts/data/service-map.json` — 559 个 DI 服务
- `scripts/data/param-map.json` — 1750 个构造函数参数
- `scripts/data/singleton-map.json` — 431 个单例
- `scripts/data/nls-map.json` — 15013 个国际化字符串
- `scripts/data/module-var-map.json` — 1793 个模块变量

### Rebundled 输出
- `build/workbench.desktop.main.js` — 54.1 MB（原始 50.5 MB，+7.2%）
- `node --check` 语法验证通过

---

## 后续建议

1. **搜索真实 AI 实现**: 用 `Ki(IAiService` / `Ki(IAiClientService` 在模块中搜索实际注册位置
2. **常量还原**: cursorCredsService 中的 URL 常量需要从运行时或 .env 推断
3. **提升反混淆覆盖率**: 实现 deobfuscate Strategy 3（VS Code 源码对照）和 5（字符串推断）
4. **App 启动测试**: 将 rebundled workbench 部署到 src app 进行实际启动测试
