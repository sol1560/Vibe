# 常见问题和解决方案

## Code OSS 构建

### Node.js 版本要求
- **问题**：Code OSS 要求 Node.js 22.22.0（在 `.nvmrc` 中定义），过高版本（如 v25）会导致 node-gyp 编译原生模块失败
- **解决**：使用 `nvm use 22.22.0` 切换到正确版本
- **命令**：`source ~/.nvm/nvm.sh && nvm use 22.22.0`

### Yarn 已不再支持
- **问题**：Code OSS 在 preinstall 脚本中明确禁止 yarn，必须使用 npm
- **解决**：始终使用 `npm install`，不要用 `yarn`

### Python 3.14 兼容性
- **问题**：Python 3.14 与 node-gyp 中的 gyp 工具存在语法兼容问题
- **影响**：原生模块编译可能失败
- **解决**：确保使用正确的 Node.js 版本（22.22.0），其自带的 node-gyp 版本兼容

### 编译命令
- **正确**：`npm run compile`（使用 gulp 编译）
- **类型检查**：`npm run compile-check-ts-native`（仅检查 src/ 下 TypeScript）
- **不要用**：直接调用 tsc

### Electron 二进制
- preLaunch 脚本会自动下载 Electron，下载到 `.build/electron/` 目录
- macOS 上应用名称从 `product.json` 的 `nameLong` 读取
- 二进制位于 `.build/electron/<nameLong>.app/Contents/MacOS/<nameShort>`

## Cursor Bundle 提取和反混淆

### 模块提取模式
- **问题**：Cursor 的 50.5MB bundle 是 esbuild 打包的扁平结构，不是 AMD
- **模式**：`Ae({"out-build/vs/workbench/..."(){"use strict"; <code>}})`
- **工具**：`tools/extract-modules.js` 按模块路径提取代码

### format-modules.js 并发问题（已修复）
- **问题**：`--concurrency` 参数被解析但从未使用，串行 execSync 调用 npx prettier
- **修复**：使用 prettier API + async worker pool，2763 文件从 ~30 分钟→6 秒

### convert-to-ts.js Bug（已修复）
- **addFieldTypes()**: 文件级收集字段但给每个 class 都插入，多类文件产生 TS2300 → 已禁用
- **constructor 正则**: `[^)]*` 无法处理嵌套括号 → 改为平衡括号匹配
- **split('=')**: 默认值含 `=` 时截断 → 改为 indexOf 只切第一个
- **启发式接口猜测**: `endsWith('Service')` 猜错类型名 → 已禁用，只用精确映射

### restore-imports.js Bug（已修复）
- **$ 变量名正则**: `$?\w+` 无法匹配 `O$e` 等中间含 $ 的变量 → 改为 `[\w$]+`
- **if/for 包裹**: lifecycle.js 等 6 文件依赖调用嵌在 if() 中 → 添加 controlWrapMatch

### rebundle.js Bug（已修复）
- **class field 正则过于激进**: `I?[A-Z]` 匹配所有大写开头类型 → 收窄为 `I[A-Z]`
- **空白字符遗漏**: extractDepPreamble 只跳过空格和换行 → 改为 `/[\s]/`

### Prettier 格式化限制
- **问题**：prettier 无法有效格式化逗号分隔的长变量声明（如 constants.js）
- **原因**：prettier 视 `var a=1,b=2,c=3` 为单个语句
- **解决**：对结构化代码（class/function）效果好，常量文件需手动处理

### 反混淆策略
- **构造函数参数**：通过 `this._xxxService = e` 赋值模式，自动将 e → xxxService
- **常量变量名**：scripts/rename-constants.js — 根据字符串值推断 UPPER_SNAKE_CASE 名（75 文件, 565 个常量, 902 处替换）
- **局部变量**：scripts/rename-locals.js — 上下文推断（e.dispose()→disposable, e.fsPath→uri 等），限制 500KB 以下文件，65 文件, 102 变量, 555 处替换
- **品牌替换注意**：`--cursor-` → `--claude-`，但 CSS `cursor: pointer` 等属性值不能替换
- **工具**：`tools/deobfuscate.js` 处理构造函数级别重命名

### rename-constants.js 注意事项
- 只处理顶层 `(VAR = 'string')` 模式，不处理数字/布尔常量（避免 magic numbers 错命名）
- 跳过长度 <= 2 的短变量名（高碰撞风险）
- 跳过 > 8 字符且已有驼峰命名的变量（已可读，不需要改）
- Command ID 格式：`CMD_` 前缀 + UPPER_SNAKE
- Settings key 格式：`SETTING_` 前缀 + UPPER_SNAKE
- 全局替换（不限作用域），因为常量通常是模块级别

### rename-locals.js 注意事项
- 按函数作用域替换，不做全局替换
- 推断规则：15+ 种属性/方法签名识别（disposal, uri, error, element, accessor, range, position 等）
- 置信度阈值 80%，多类型竞争时动态扣分
- 跳过 > 500KB 的文件（避免处理大 bundle）
- 输出统计到 scripts/data/local-rename-stats.json

### TypeScript 编译修复常见模式
- **TS6138 (unused property)**: 构造函数参数有 `private readonly` 但未被使用 → 移除 `private readonly` 让参数成为普通的未使用参数
- **TS6133 (unused variable)**: 移除未使用的导入或给变量加 `_` 前缀，加 `void _var;` 语句
- **URI.revive() 类型错误**: 参数类型为 `unknown` 不兼容 → 添加 `as URI | null` 类型断言
- **IAllComposersStore ↔ Record<string,unknown>**: 接口需要 `[key: string]: unknown` 索引签名
- **const enum**: 不能用本地 object literal 代替 `const enum`，必须 import 原始 const enum 值
- **bundle.ts 的 const enum**: bundle.ts 包含 14 处 `const enum NAME { field = 0 }` 作为可变对象使用，需用 `const NAME = { field: 0 }` 替换（regex: `const enum\s+(\w+)\s*\{([^}]*)\}` → `const $1 = {$2}` + 字段 `=` 改为 `:`）

### 语法错误修复 binary search 陷阱
- **new Function(partialCode) 假阳性**: 截断代码时出现的错误不代表真实问题：
  - `Unexpected end of input` → 代码不完整，非真实错误
  - `Unexpected token ')'` → new Function 包装器的 `)` 被截断代码看到，非真实错误
  - `Unexpected token '}'` → new Function 包装器的 `}` 在 trailing `,` 后被看到，非真实错误
  - `Unexpected token 'return'`/`'if'`/`'else'` → 代码在控制流中间被切断
- **只信任 COMPLETE 表达式边界处的错误**: 在 `};`、`});`、`}));` 等完整闭合处切断测试才有意义
- **模板字符串多行问题**: binary search 在模板字符串中间截断时，截断后的代码中的 SVG 路径数据会被当作 JS 表达式，产生 `Unexpected number` 等假错误
- **asRelativePath 不存在**: `IWorkspaceContextService` 没有这个方法 → 用 `getWorkspace().folders[0].uri.path` 手动拼接

### restore-named-imports.js 设计决策
- **全局变量检测**: 使用深度跟踪（depth 0/1/2）而不是行缩进判断，因为 minified 代码是单行
- **depth=1 + prevToken='('**: 捕获 `(IDENT = value)` 格式化模块包装模式
- **depth=2 + prevToken='('**: 捕获 `(EnumVar || (EnumVar = {}))` IIFE enum 模式
- **最小长度过滤**: 长度 < 2 的变量跳过（单字母太模糊）；2-char 名如 Ht/at/Qm 是合法 VS Code 类
- **多 owner 全局跳过**: 多模块定义同名全局时不生成命名 import（避免歧义）
- **已有 named imports 的文件**: addExportsToFile 会检查 export {} 已有内容，不重复添加
- **import 升级后的 side-effect imports**: 保留 - 只升级能确认其全局变量被使用的 deps

### Bash 工具输出问题
- **问题**: Bash 工具有时不返回 stdout 输出
- **解决**: 重定向到临时文件 `command > /tmp/output.txt 2>&1`，然后用 Read 工具读取

### 提取分类
- composer (106 modules) → `staging/phase-2a-composer/`
- layout/contrib (46 modules) → `staging/phase-2b-layout/`
- AI services (40 modules) → `staging/phase-2d-services/ai/`
- Agent services (40 modules) → `staging/phase-2d-services/agent/`
- CSS (2874 rules, 222 vars) → `staging/phase-2e-theme/`

### 全局符号表数据（反混淆流水线）
- **DI 服务**: 559 个 `Bi()` 映射（`varName = Bi("serviceName")`）— 100% 确定
- **单例注册**: 431 个 `Ki(interfaceVar, implVar, type)` — 接口→实现类映射
- **构造函数参数**: 1750 个类的 `__param(index, serviceVar)` 装饰器映射
- **NLS 索引**: 15013 个索引→模块路径映射（来自 nls.keys.json）
- **模块变量**: 1793 个 `varName = Ae({"out-build/vs/..."})` 映射
- 符号表存放: `scripts/data/*.json`
- **重要**: DI 服务变量替换必须使用 word-boundary 匹配，避免误替换同名局部变量
- **重要**: `Bi()` 有两种格式 — 已有 `I` 前缀的（如 `ILanguageFeaturesService`）和没有的（如 `configurationService`），命名规则不同
- **严重**: 167 个 DI 服务变量名只有 1-2 字符（如 `e`, `b`, `U`），全局替换会污染所有同名参数/变量 → 必须跳过短名，仅重命名 Bi() 定义站点
- **严重**: 构造函数参数重命名（Strategy 2）必须限制作用域到 constructor 签名+body，不能全局应用 → esbuild minifier 会在每个方法中复用 `e,t,i,r,s` 等短名
- **注意**: 多个构造函数参数可能映射到相同服务名（如两个 `instantiationService`），需要去重后缀（`instantiationService2`）

### 三层变量架构（Bundle 作用域）
- **Level 1**: 模块工厂变量（在 module-var-map.json 中）：`st` → lifecycle.js
- **Level 2**: 导出提取变量（不在 module-var-map 中）：`at` → Disposable（1568 个 extends）、`Ht` → DisposableStore、`Qe` → Emitter
- **Level 3**: 模块私有变量 — 无跨模块引用
- **关键**: deobfuscate.js 只能重命名在当前模块中有定义站点（`var/let/const` 或 `= Bi|Ki|class|function|new`）的变量

### convert-to-ts.js 的 addDisposableType() Bug（已修复）
- **问题**: 检测到 `super.dispose()` 或 `this._register` 时，错误地给无继承的类添加 `extends Disposable`
- **影响**: 38 个类被注入 `extends Disposable`，但 `Disposable` 在 bundle 作用域中不存在（实际是 `at`）
- **修复**: 函数已从脚本中完全删除（不是注释掉，是彻底移除）

### convert-to-ts.js 的 addFieldTypes() Bug（未修复）
- **问题**: 在文件级别收集所有 `this._xxxService = ...` 字段后，对文件中每个类声明都全量插入，多类文件中 A 类的字段会出现在 B 类头部
- **影响**: 多类文件产生 `TS2300 Duplicate identifier` 错误
- **建议**: 禁用 addFieldTypes() 或改为作用域感知的按类收集

### convert-to-ts.js 的 constructor 正则嵌套括号 Bug（未修复）
- **问题**: `/constructor\s*\(([^)]*)\)/g` 在参数含嵌套括号（如箭头函数默认值 `callback = () => {}`）时提前截断
- **影响**: 含复杂默认值的构造函数会被损坏
- **建议**: 增加嵌套括号计数器，或对含 `(` 的参数跳过处理

### convert-to-ts.js 的默认值 split('=') Bug（未修复）
- **问题**: `param.split('=')` 在默认值含 `=` 时（如箭头函数 `fn = (x) => x`）只保留第一段
- **影响**: 默认值被截断，生成无效 TypeScript
- **修复代码**:
  ```js
  const eqIdx = param.indexOf('=');
  const name = eqIdx === -1 ? param : param.slice(0, eqIdx).trim();
  const defaultValue = eqIdx === -1 ? undefined : param.slice(eqIdx + 1).trim();
  ```

### convert-to-ts.js 启发式 service 接口名猜测（建议禁用）
- **问题**: 对不在 SERVICE_INTERFACE_MAP 中的 service 参数，用 `'I' + PascalCase(name)` 猜测接口名，如 `remoteService` → `IRemoteService`（实际为 `IRemoteAgentService`）
- **影响**: 产生 TypeScript 找不到接口的类型错误
- **建议**: 删除 inferParamType 中的 heuristic 分支，只用已知 map

### deobfuscate.js 跨模块重命名 Bug（已修复）
- **问题**: buildRenameMap() 的 Strategy 1 和 4 会在没有定义站点的模块中也进行重命名
- **影响**: 跨模块引用被错误重命名，导致 ReferenceError
- **修复**: 添加 defRegex 定义站点检测，只在有 `var/let/const shortVar` 或 `shortVar = Bi|Ki|class|function|new` 的模块中才重命名

### workbench.html CSP trusted-types（已修复）
- **问题**: Cursor 使用的 solidjs/aibubble/aibubble2 等 TrustedTypes 策略名未在 CSP 中注册
- **修复**: 在 workbench.html 的 trusted-types 列表中添加完整的 Cursor 策略名
- **文件**: src/ClaudeEditor-darwin-arm64/.../workbench/workbench.html

### Build App vs Src App 目录结构差异
- **build app**: 使用 `electron-sandbox/workbench/workbench.html`（Code OSS 结构）
- **src app**: 使用 `electron-browser/workbench/workbench.html`（Cursor 结构）
- **结论**: 测试和开发应基于 src app（Cursor 完整结构），build app 结构不匹配

### main.js StorageDatabaseChannel cursorDiskKV*（已修复）
- **问题**: workbench 通过 IPC 调用 cursorDiskKV* 但 main.js 不支持
- **修复**: 在 main.js 添加 SQLite 表 + 10 个 IPC handler + 5 个 helper 方法
- **验证**: App 启动后 cursorDiskKV 错误 = 0

### onDidChangeCssModules 事件（已修复）
- **问题**: workbench 调用但 NativeHostMainService 不提供
- **修复**: 在 NativeHostMainService 构造函数中添加 `this.onDidChangeCssModules = Event.None`
- **验证**: App 启动后 main.log 中 onDidChangeCssModules 错误 = 0

### MainThreadChatContext 缺失
- **问题**: extensionHostProcess.js 引用但 workbench 的 Tf actor map 中不存在
- **注意**: 实际测试中此错误已消失，但出现了新的 `Unknown actor MainThreadChatDebug`
- **修复**: 可能需要在 workbench 中注册 no-op 实现

### $onUnexpectedError on MainThreadTreeViews（状态未知）
- **问题**: ExtHost 调用该方法但实现中没有
- **前次**: 16803 次错误
- **最新测试**: 0 次（可能被其他 agent 在 workbench 中修复了）

### App 品牌命名一致性（Vibe）
- **规则**: 所有地方使用 "Vibe"（不是 "Claude Editor"）
- **Info.plist**: CFBundleExecutable 必须匹配实际二进制文件名
  - 主 binary: `Contents/MacOS/Vibe`
  - Helper: `Frameworks/Vibe Helper.app/Contents/MacOS/Vibe Helper`
- **product.json**: nameShort/nameLong = "Vibe", applicationName = "vibe"
- **数据目录**: `~/.vibe/`, 日志在 `~/Library/Application Support/vibe/logs/`
- **陷阱**: 如果 CFBundleExecutable 和 binary 名不一致 → FATAL: "Unable to find helper app"

### Agent Provider 调用链
- **AgentProviderService** (`CAa`): handler proxy 模式，`registerHandler(h)` + `createAgent(s,o)` → `h.createAgent(s,o)`
- **MainThreadCursorAgentProviderService** (`rlb`): 注册 handler 时调用 `agentProviderService.registerHandler({createAgent: ...})`
- **原始注册**: `vscode.cursor.registerAgentProvider(agentProvider)` 在 cursor-agent 扩展中
- **关键**: run() 返回 `ReadableStream<Uint8Array>`，被 `j$.fromBinary(buffer)` 解码为 protobuf InteractionUpdate
