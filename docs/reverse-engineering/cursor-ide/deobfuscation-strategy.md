# Cursor 代码反混淆策略

> 本文档描述如何将 Cursor 2.6.11 workbench.desktop.main.js 拆包后的 1807 个 minified 模块还原为可读的 TypeScript 代码。

## 概述

### 数据规模

| 指标 | 数值 |
|------|------|
| Bundle 大小 | 53 MB (workbench.desktop.main.js) |
| 总模块数 | 1807 (1654 JS + 153 CSS) |
| VS Code 核心模块 | ~1211（可通过开源代码对照还原） |
| Cursor 专属模块 | ~253 |
| 需人工检查模块 | ~190 |
| DI 服务标识符 | 570（`Bi()` 声明） |
| Ki() 注册 | 433（接口→实现映射） |
| NLS 本地化调用 | 12,289（可映射到模块路径） |
| NLS 消息数 | 15,013 |
| NLS 模块键 | 1,273（模块路径→字符串索引映射） |

### 还原目标

将 minified 变量名（如 `zs`, `$d`, `Qhg`）还原为语义化名称，达到以下可读性层级：

1. **Level 1 — 服务标识符**：所有 DI 服务变量恢复为 `IXxxService` 格式（570 个，100% 确定性）
2. **Level 2 — 构造函数参数**：通过 `this._xxxService = param` 模式恢复参数名（已有基础工具）
3. **Level 3 — VS Code 核心对照**：~1211 个模块可通过开源源码完整还原所有变量名
4. **Level 4 — 导出名/类名**：通过 `Ki()` 注册和 `__decorate` 恢复类名和接口名（433 对）
5. **Level 5 — 字符串推断**：通过 NLS 消息、错误字符串、命令 ID 推断剩余变量名

---

## 策略一：DI 服务标识符还原

### 原理

Cursor 使用 VS Code 的依赖注入系统。每个服务通过 `Bi("serviceName")` 创建标识符：

```javascript
// minified
var vU = Bi("AISettingsService");
var On = Bi("configurationService");
var Rr = Bi("workspaceContextService");
```

还原后：
```javascript
var IAISettingsService = Bi("AISettingsService");
var IConfigurationService = Bi("configurationService");
var IWorkspaceContextService = Bi("workspaceContextService");
```

### 数据来源

从 bundle 中提取到 **570 个唯一映射**：

```
vU       → AISettingsService      (→ IAISettingsService)
On       → configurationService   (→ IConfigurationService)
Rr       → workspaceContextService (→ IWorkspaceContextService)
og       → composerService        (→ IComposerService)
Fa       → composerDataService    (→ IComposerDataService)
ag       → cursorAuthenticationService (→ ICursorAuthenticationService / 保留原始)
NJ       → cursorCredsService     (→ ICursorCredsService)
...
```

### 命名规则

| 原始格式 | 还原格式 | 说明 |
|----------|----------|------|
| `Bi("configurationService")` | `IConfigurationService` | 加 `I` 前缀，首字母大写 |
| `Bi("ILanguageFeaturesService")` | `ILanguageFeaturesService` | 已有 `I` 前缀，保持不变 |
| `Bi("AISettingsService")` | `IAISettingsService` | 加 `I` 前缀 |

### 实现方法

1. 正则提取所有 `varName = Bi("serviceName")` 映射
2. 构建全局替换表：`{vU: "IAISettingsService", On: "IConfigurationService", ...}`
3. 在每个模块文件中，将短变量名替换为长名称
4. **关键约束**：只替换作为 DI 装饰器的用法（`__param(N, varName)` 和 `Ki(varName, ...)` 中的引用），避免误替换同名局部变量

### 置信度：100%

---

## 策略二：构造函数参数还原

### 原理

VS Code 的 DI 系统在构造函数中注入服务。minified 代码保留了 `this._xxxService = param` 赋值：

```javascript
// minified
constructor(e, t, i, r, s) {
    super();
    this._configurationService = e;
    this._logService = t;
    this._storageService = i;
    this._telemetryService = r;
    this._workspaceContextService = s;
}
```

还原后：
```javascript
constructor(configurationService, logService, storageService, telemetryService, workspaceContextService) {
    super();
    this._configurationService = configurationService;
    this._logService = logService;
    this._storageService = storageService;
    this._telemetryService = telemetryService;
    this._workspaceContextService = workspaceContextService;
}
```

### 增强：结合 __param 装饰器

`__param(index, serviceVar)` 提供了参数位置到服务的精确映射：

```javascript
ClassName = __decorate([
    __param(0, On),      // On = IConfigurationService
    __param(1, Rr),      // Rr = IWorkspaceContextService
    __param(2, Jr),       // Jr = IFileService
], ClassName);
```

这告诉我们：
- 构造函数第 0 个参数是 `configurationService`
- 第 1 个参数是 `workspaceContextService`
- 第 2 个参数是 `fileService`

### 实现方法

1. 找到 `__decorate([__param(0, X), __param(1, Y), ...], ClassName)` 块
2. 通过策略一的映射表，将 `X, Y` 解析为服务名
3. 在 `ClassName` 的 constructor 中，按位置替换参数名
4. 同时替换 constructor body 中对这些参数的引用

### 已有工具

`tools/deobfuscate.js` 已实现基础版本（仅处理 `this._xxx = param` 模式）。需增强为：
- 支持 `__param` 装饰器匹配
- 支持多个 constructor 的类
- 支持继承链（`super()` 调用后的参数传递）

### 置信度：95%（依赖 `this._xxx` 赋值存在）

---

## 策略三：VS Code 开源代码对照还原

### 原理

1807 个模块中约 **1211 个来自 VS Code 核心**（vs/base/*, vs/platform/*, vs/editor/*, vs/workbench/ 中的标准模块）。VS Code 1.105.1 源码是完全公开的。

对照方法：通过模块路径匹配 + 结构验证，将 minified 模块与 VS Code 源码一一对应，然后用源码的变量名覆盖 minified 变量名。

### 匹配算法

```
对每个拆包后的模块文件 (module_path.js):
  1. 检查 out-build 路径是否对应 VS Code 源码文件
     例: "out-build/vs/base/common/lifecycle.js" → src/vs/base/common/lifecycle.ts

  2. 如果源码文件存在:
     a. 提取 minified 版本的函数签名列表 (参数个数、返回模式)
     b. 提取源码版本的函数签名列表
     c. 按顺序匹配（esbuild 保持声明顺序）
     d. 用源码变量名替换 minified 变量名

  3. 验证:
     a. 函数数量必须匹配
     b. 字符串常量必须匹配
     c. NLS 索引必须匹配
```

### 关键技术：NLS 索引对照

`nls.keys.json` 文件提供了精确的模块→字符串映射：

```json
["vs/base/browser/ui/dialog/dialog", ["ok", "dialogInfoMessage", "dialogErrorMessage", ...]]
```

bundle 中的 `_(12345, null)` 调用对应 `nls.messages.json[12345]`。这些索引在同一版本中是稳定的，可以作为模块识别的指纹。

### 匹配策略详细步骤

**Step 1: 获取 VS Code 1.105.1 源码**
```bash
git clone --depth 1 --branch 1.105.1 https://github.com/microsoft/vscode.git /tmp/vscode-1.105.1
```

**Step 2: 建立模块路径映射**
```
out-build/vs/base/common/lifecycle.js → /tmp/vscode-1.105.1/src/vs/base/common/lifecycle.ts
out-build/vs/editor/browser/editorBrowser.js → /tmp/vscode-1.105.1/src/vs/editor/browser/editorBrowser.ts
```

**Step 3: AST 结构对比**

对于每个匹配的文件对：
1. 解析 minified JS → 提取导出函数/类列表（保持声明顺序）
2. 解析 TypeScript 源码 → 提取导出函数/类列表
3. 按序一一匹配
4. 对于每个匹配的函数/类：
   - 用源码的函数名替换 minified 函数名
   - 用源码的参数名替换 minified 参数名
   - 用源码的局部变量名替换 minified 局部变量名（需 AST 层面的作用域匹配）

**Step 4: 验证**

每个还原后的模块进行 diff 验证：
- 去除空白后，逻辑结构应相同
- 所有字符串常量必须完全匹配
- 函数参数个数必须匹配

### 覆盖率

| 模块来源 | 数量 | 对照还原可行性 |
|----------|------|---------------|
| vs/base/* | ~200 | 完全可对照 |
| vs/platform/* | ~150 | 完全可对照 |
| vs/editor/* | ~300 | 完全可对照 |
| vs/workbench/contrib/（标准） | ~400 | 完全可对照 |
| vs/workbench/services/（标准） | ~160 | 完全可对照 |
| Cursor 修改的 VS Code 模块 | ~42 | 部分可对照（改动部分需手动） |

### 置信度：90%（取决于 esbuild 是否保持声明顺序）

---

## 策略四：导出名和类名还原

### 原理

Bundle 中保留了两种信息可以恢复类名：

#### 4a. Ki() 注册表

`Ki(interfaceVar, implementationVar, instantiationType)` 注册了 433 对接口→实现映射：

```javascript
Ki(vU, hfa, 1)    // Ki(IAISettingsService, AISettingsServiceImpl, Delayed)
Ki(og, eCh, 1)    // Ki(IComposerService, ComposerServiceImpl, Delayed)
```

由策略一已知 `vU = IAISettingsService`，所以 `hfa` 就是该服务的实现类。

命名规则：`hfa` → `AISettingsService`（去掉 `I` 前缀即为实现类名）

#### 4b. __decorate 模式

```javascript
ClassName = __decorate([
    __param(0, serviceA),
    __param(1, serviceB),
], ClassName);
```

`ClassName` 在这里是明文的（esbuild 保留了部分类名）。但实际上 minified 后它也是短变量名。

#### 4c. 类的 static 属性

一些类有 `static` 属性包含原始名称：
```javascript
SomeClass.ID = "workbench.action.someAction";
```

### 实现方法

1. 从 Ki() 注册表中，通过已知接口名推导实现类名
2. 在模块文件中找到对应的 class 定义并重命名
3. 检查 `static ID`、`static key` 等属性获取额外名称信息

### 置信度：85%

---

## 策略五：字符串常量推断

### 原理

Minified 代码中的字符串常量是不变的。这些字符串可以帮助推断变量名：

#### 5a. NLS 本地化消息

`nls.keys.json` 将模块路径映射到消息键名：
```json
["vs/workbench/contrib/files/browser/fileActions", ["newFile", "newFolder", "openExplorerAction", ...]]
```

12,289 个 `_(index, null)` 调用可以精确定位到模块，确认模块身份。

#### 5b. 命令 ID

```javascript
registerAction("workbench.action.files.newFile", ...)
```

命令 ID 包含了 action 名称，可以推断包含这段代码的变量/函数名称。

#### 5c. 错误消息和日志

```javascript
throw new Error("ComposerService#initialize: already initialized");
```

`ClassName#methodName` 格式直接告诉我们类名和方法名。

#### 5d. CSS 类名

```javascript
element.classList.add("composer-input-container");
```

CSS 类名暗示了变量的语义。

### 实现方法

1. 扫描模块中所有字符串常量
2. 模式匹配：
   - `"ClassName#methodName"` → 直接还原类名和方法名
   - `"workbench.action.xxx"` → 推断 action handler 变量名
   - `"xxx.yyy.zzz"` 命令 ID → 推断 contribution 文件名
3. NLS 索引回溯到 `nls.keys.json` 确认模块身份

### 置信度：60%（需要启发式匹配）

---

## 执行流水线

### Phase 1: 全局符号表构建（在拆包前）

在 bundle 级别提取全局信息：

```
输入: workbench.desktop.main.js (53MB)
输出:
  ├── service-map.json       — 570 个 Bi() 映射 (varName → serviceName)
  ├── singleton-map.json     — 433 个 Ki() 映射 (interfaceVar → implVar)
  ├── param-map.json         — __param() 装饰器映射
  ├── nls-module-map.json    — NLS 索引 → 模块路径映射
  └── export-map.json        — 模块导出表
```

### Phase 2: 模块级还原（拆包后）

对每个独立模块文件执行：

```
对每个 module.js:
  1. [策略一] 替换 DI 服务标识符（全局查找替换）
  2. [策略二] 还原构造函数参数（__param + this._xxx 模式）
  3. [策略三] 如果是 VS Code 核心模块 → 对照源码全量还原
  4. [策略四] 还原 Ki() 中的类名
  5. [策略五] 字符串推断补充还原
  6. Prettier 格式化
```

### Phase 3: 验证

```
对每个还原后的 module.js:
  1. 语法检查（确保还原后仍是有效 JS）
  2. 字符串常量完整性检查
  3. 函数参数个数不变检查
  4. 生成 diff 报告（minified vs restored）
```

---

## 工具架构

```
scripts/deobfuscate.js
├── lib/
│   ├── symbol-table.js       — 全局符号表构建（Phase 1）
│   ├── di-restorer.js        — DI 服务标识符还原（策略一）
│   ├── constructor-restorer.js — 构造函数参数还原（策略二）
│   ├── vscode-matcher.js     — VS Code 源码对照（策略三）
│   ├── class-restorer.js     — 类名/导出名还原（策略四）
│   ├── string-inferrer.js    — 字符串推断（策略五）
│   └── validator.js          — 验证器
├── data/
│   ├── service-map.json      — 自动生成的服务映射
│   ├── singleton-map.json    — 自动生成的注册映射
│   └── manual-overrides.json — 手动补充的映射
└── main.js                   — 流水线入口
```

---

## 预期结果

| 还原层级 | 影响变量数 | 自动化程度 | 置信度 |
|----------|-----------|-----------|--------|
| DI 服务标识符 | 570 全局变量 | 100% 自动 | 100% |
| 构造函数参数 | 每个类 5-20 个参数 | 100% 自动 | 95% |
| VS Code 核心对照 | ~1211 模块全量变量 | 90% 自动 | 90% |
| 类名/导出名 | 433 对接口+实现 | 100% 自动 | 85% |
| 字符串推断 | 数百个局部变量 | 70% 自动 | 60% |

**综合预期**：可自动还原 70-80% 的有意义变量名，剩余 20-30% 需要人工审查或保留 minified 名称。

---

## 风险和限制

1. **esbuild 声明顺序**：策略三假设 esbuild 保持声明顺序，如果打包器重排了声明，AST 对比会失败。需要先验证少量模块确认此假设。

2. **同名冲突**：短变量名（如 `e`, `t`）在不同作用域有不同含义。全局替换会引入错误。必须使用 AST 级别的作用域感知替换。

3. **Cursor 修改的 VS Code 模块**：约 42 个模块虽然路径属于 VS Code，但 Cursor 做了修改。对照时会出现不匹配，需要 diff 合并。

4. **Tree-shaking**：esbuild 可能删除了未使用的代码，导致 minified 版本比源码少一些函数。对比时需要容忍缺失。

5. **运行时正确性**：变量名还原不影响运行时行为，但如果还原错误（同名冲突），可能导致语义误导。建议还原后附带置信度标记。
