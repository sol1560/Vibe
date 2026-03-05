# 反编译流水线遗留问题修复报告

**日期**: 2026-03-05
**团队**: pipeline-fix
**Team Lead**: Opus (team-lead@pipeline-fix)

---

## 工作概述

修复了反编译流水线中全部 7 个遗留问题，涉及格式化失败、语法错误、变量名混淆、类名混淆、TS 覆盖率不足、命名导入缺失等。

## 参与 Agent 及贡献

| Agent | 任务 | 成果 |
|-------|------|------|
| **format-fixer** | P0 #1: 格式化失败文件 | 10 个文件从 215→939 行（4.4x 增长） |
| **syntax-fixer** | P0 #2: 语法错误模块 | 4 个关键文件修复，rebundle 零跳过 |
| **class-renamer** | P1 #5: 混淆类名还原 | 594 个类名还原，1367 处替换 |
| **var-deobfuscator** | P1-P2 #3+#4: 常量名+局部变量名 | 565 常量 + 102 局部变量还原 |
| **ts-converter** | P2 #6: TS 转换覆盖率 | 12.6% → 38.6%（+719 文件） |
| **import-fixer** | P3 #7: 命名导入还原 | 5560 条命名导入生成 |

## 详细结果

### P0 #1: 格式化失败的 9 个文件 ✅

Prettier 无法处理的文件改用 `js-beautify` 成功格式化：

| 文件 | 原始行数 | 格式化后 |
|------|---------|---------|
| pieceTreeBase.ts | 22 | 233 |
| naiveComposerAgentProvider.ts | 23 | 105 |
| diffCommentViewZoneManager.js | 22 | 155 |
| cursorMoveCommands.js | 27 | 158 |
| suggestWidgetDetails.js | 24 | 63 |
| range.js (core) | 14 | 36 |
| textEdit.js | 25 | 63 |
| inlineCompletionsView.ts | 21 | 45 |
| explorerFileNestingTrie.js | 8 | 49 |
| range.js (base) | 29 | 32 |

**新增脚本**: `scripts/fix-format-failures.js`, `scripts/fix-format-hard-files.js`

### P0 #2: 19 个语法错误模块 ✅

修复了 4 个有实际语法错误的文件（其余 15 个在前一轮已被修复或是误报）：

1. **snippetParser.js** — 多余 `}`、损坏的正则、错误的 exports
2. **StorageProvider.js** — 命名导入错误 + 缺少闭合括号
3. **fileActions.contribution.ts** — 逗号链中多余的 `)` + for 循环闭合错误
4. **bundle.ts** — 移除 TS-only 语法（const enum → const 对象）

**验证**: `node scripts/rebundle.js` 完成零跳过，`node --check` 通过

### P1 #5: 80 个混淆类名 ✅

实际发现并还原了 **594 个类名**（远超预期的 80 个）：

**策略分布**:
- A (singleton-map Ki()): 3 个
- B (单类文件名推断): 523 个
- B2 (多类文件名 Service/Provider 后缀): 52 个
- C (export-map): 16 个

**关键还原**:
- `dy` → `ComposerDataService` (59 处)
- `JCf` → `NaiveComposerAgentProvider` (2 处)
- `HSf` → `AgentResponseAdapter` (3 处)
- `WCf` → `ComposerAgentProviderRouter` (1 处)
- `rS` → `ComposerCodeBlockService` (44 处)
- `dB` → `EnvironmentService` (31 处)

**新增脚本**: `scripts/rename-classes.js`
**数据文件**: `scripts/data/class-rename-map.json`

### P1-P2 #3+#4: 常量名 + 局部变量名 ✅

**常量变量名还原 (Strategy 5: 字符串推断)**:
- 扫描 2763 模块，处理 75 个文件
- 还原 565 个常量名，902 处替换
- 支持三种模式：Command ID (CMD_)、Settings key (SETTING_)、纯字符串 (UPPER_SNAKE)

**局部变量名推断 (上下文推断)**:
- 15+ 种推断规则（dispose→disposable, fsPath→uri, isCancellationRequested→token 等）
- 函数作用域限制，80% 置信度阈值
- 处理 65 个文件，102 个局部变量，555 处替换

**新增脚本**: `scripts/rename-constants.js`, `scripts/rename-locals.js`
**数据文件**: `scripts/data/constant-rename-map.json`, `scripts/data/local-rename-stats.json`

### P2 #6: TS 转换覆盖率 ✅

| 指标 | 转换前 | 转换后 |
|------|--------|--------|
| .ts 文件 | 349 | 1068 |
| .js 文件 | 2414 | 1695 |
| 覆盖率 | 12.6% | 38.6% |

**转换策略**: 包含 class (284)、包含 enum (12)、>5KB (248)、workbench 路径 (176)

**新增脚本**: `scripts/convert-to-ts-v2.js`

### P3 #7: 命名导入还原 ✅

- 5560 条命名 import 语句生成
- 999 个模块添加了 export 语句
- 9666 条 side-effect import 保留
- 0 个语法错误引入

**新增脚本**: `scripts/restore-named-imports.js`

## 关键变更（文件列表）

### 新增脚本
- `scripts/fix-format-failures.js` — js-beautify 格式化
- `scripts/fix-format-hard-files.js` — 带 TS 装饰器的文件格式化
- `scripts/rename-classes.js` — 类名还原
- `scripts/rename-constants.js` — 常量名还原
- `scripts/rename-locals.js` — 局部变量名推断
- `scripts/convert-to-ts-v2.js` — 扩展 TS 转换
- `scripts/restore-named-imports.js` — 命名导入生成

### 新增数据文件
- `scripts/data/class-rename-map.json` — 594 条类名映射
- `scripts/data/constant-rename-map.json` — 565 条常量映射
- `scripts/data/local-rename-stats.json` — 局部变量统计

### 修改的模块文件
- 10 个文件重新格式化
- 4 个文件修复语法错误
- 584 个文件类名替换
- 75 个文件常量名替换
- 65 个文件局部变量替换
- 719 个文件 .js → .ts 重命名
- ~1632 个文件添加命名导入

## 遗留问题

1. **GCf 和 rit** 两个辅助类名无法自动推断（多类文件中的非主类），需手动命名
2. **局部变量还原覆盖率有限**：只还原了 102 个变量（数十万中的一小部分），Strategy 3（VS Code 源码对照）尚未实现
3. **剩余 1695 个 .js 文件**未转为 .ts（多为小文件或 external 目录）
4. **rebundle 需要重新运行**以包含所有修改（syntax-fixer 已运行一次验证通过）

## 后续建议

1. 运行完整的 rebundle 生成最终 bundle
2. 实现 VS Code 源码对照策略（大规模局部变量还原）
3. 按 `docs/migration-plan-cursor-to-claude.md` 开始迁移工作
