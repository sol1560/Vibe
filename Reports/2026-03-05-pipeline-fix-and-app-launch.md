# 工作报告：Pipeline 修复与 App 启动验证

**日期**：2026-03-05
**团队**：app-debug
**状态**：关键里程碑达成 — App 成功启动

---

## 工作概述

修复了 rebundle pipeline 中的两个核心 bug，使得全量模块替换后的 workbench.desktop.main.js 能够在 Cursor Electron 上成功运行。这是项目从"逆向分析"进入"可运行应用"的关键里程碑。

### 问题链条
1. `convert-to-ts.js` 错误注入 38 个 `extends Disposable` → `ReferenceError` → 黑屏
2. `deobfuscate.js` 跨模块重命名 → 潜在的更多 ReferenceError
3. `workbench.html` CSP 缺少 Cursor 专有的 TrustedTypes 策略名 → solidjs 策略被阻止
4. build app 使用了错误的 Electron 二进制 → 渲染器无法启动

---

## 参与的 Agent 及贡献

| Agent | 角色 | 主要贡献 |
|-------|------|----------|
| **team-lead** | 团队协调 | 问题诊断、方向决策、直接修复 convert-to-ts.js 和 deobfuscate.js |
| **app-inspector** | 应用检查 | Task #8（重命名映射分析）、Task #19（rebundle.js re-obfuscation 实现） |
| **log-analyzer** | 日志分析 | Task #15（pipeline 重跑验证）、Task #17（部署测试）、Task #20（CSP 修复） |
| **config-auditor** | 配置审查 | Task #9（模块对比）、Task #13（deobfuscate.js 分析）、Task #14（全局重命名映射提取）、Task #21（Electron 二进制复制） |

---

## 关键变更

### 修改的文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `scripts/convert-to-ts.js` | 修复 | 禁用 addDisposableType() 函数 |
| `scripts/deobfuscate.js` | 修复 | Strategy 1 和 4 添加定义站点检测 (defRegex) |
| `scripts/rebundle.js` | 新增功能 | Phase 5a re-obfuscation 步骤（逆转 deobfuscate 的重命名） |
| `workbench.html` (src app) | 修复 | CSP trusted-types 添加 solidjs/aibubble 等策略名 |
| `build/Claude Editor.app/` | 修复 | 替换为 Cursor 原版 Electron 二进制 |

### 生成的分析文件

| 文件 | 说明 |
|------|------|
| `scripts/extract-rename-map.js` | 重命名映射提取工具 |
| `scripts/data/global-rename-map.json` | 811 个全局重命名条目（人类可读名→混淆名） |
| `scripts/data/skipped-short-vars.json` | 173 个被跳过的短变量名 |
| `scripts/data/convert-ts-renames.json` | convert-to-ts Disposable bug 文档 |

---

## 发现的问题和解决方案

### 问题 1：ReferenceError: Disposable is not defined（已解决）

**根因**：
- `convert-to-ts.js` 的 `addDisposableType()` 在检测到 `super.dispose()` 或 `this._register` 时，给没有继承的类错误地添加 `extends Disposable`
- `Disposable` 在 bundle 作用域中不存在，实际变量名是 `at`（Level 2 导出提取变量）

**修复**：禁用 addDisposableType()

### 问题 2：跨模块重命名导致 ReferenceError（已解决）

**根因**：
- `deobfuscate.js` 的 `buildRenameMap()` 在 Strategy 1（DI 服务）和 Strategy 4（单例类名）中，不检查变量是否在当前模块中有定义，直接进行全局重命名

**修复**：添加 defRegex 检测，只有在模块中找到 `var/let/const shortVar` 或 `shortVar = Bi|Ki|class|function|new` 时才进行重命名

### 问题 3：CSP TrustedTypes Policy "solidjs" disallowed（已解决）

**根因**：workbench.html 的 CSP trusted-types 列表缺少 Cursor 自定义的策略名

**修复**：添加完整的策略名列表

### 问题 4：Build app Electron 不匹配（已缓解）

**根因**：build app 使用了 Code OSS 的 Electron 二进制（51,920 bytes），而非 Cursor 自定义的（33,968 bytes）

**缓解**：从 src app 复制了正确的 Electron 二进制到 build app。长期方案需要重新考虑 build 流程。

---

## 剩余非致命错误（预期行为）

1. `CodeExpectedError: Event not found: onDidChangeCssModules` — main 进程，非阻塞
2. `TrustedScript assignment blocked` — Function constructor CSP 限制，非阻塞
3. 多个 `Unknown method` exthost 错误 — 扩展 API 版本不匹配，非阻塞
4. `vscode.github` 扩展找不到 `out/extension.js` — 已知问题

---

## 遗留问题和后续建议

1. **品牌替换**：bundle 中仍有约 10,212 个 "cursor" 字符串需要替换为 "claude"
2. **Build 流程**：需要建立基于 src app 的正确 build 流程，而非使用 Code OSS 结构的 build app
3. **re-obfuscation 验证**：Task #19 实现了 rebundle.js 的 Phase 5a，但尚未用新的 re-obfuscation 重跑完整 pipeline
4. **扩展兼容性**：部分 Cursor 扩展（vscode.github 等）的文件路径需要修复
5. **Electron 二进制长期方案**：需要确定是直接使用 Cursor 的 Electron 还是自行编译

---

## 测试结果

| 测试项 | 结果 |
|--------|------|
| Pipeline 全流程（format → restore → deobfuscate → rebundle） | ✅ 通过 |
| `extends Disposable` 残留检查 | ✅ 0 个 |
| `node --check` 语法验证 | ✅ 通过 |
| App 启动（src app） | ✅ 成功 |
| ReferenceError 检查 | ✅ 无 |
| 黑屏检查 | ✅ 无黑屏 |
| MCP Gateway 初始化 | ✅ 成功 |
| Claude 服务初始化 | ✅ 成功（读取 ~/.claude/settings.json） |

---

## 里程碑意义

这次修复验证了**全量模块替换**方案的可行性：

```
unbundle (2763 模块) → format → restore-imports → deobfuscate → rebundle → 部署 → 成功启动
```

我们现在可以在任何模块中进行修改（如替换 AI 后端、修改品牌字符串），然后通过 rebundle pipeline 重新打包，生成可运行的应用。
