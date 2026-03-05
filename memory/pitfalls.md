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

### Prettier 格式化限制
- **问题**：prettier 无法有效格式化逗号分隔的长变量声明（如 constants.js）
- **原因**：prettier 视 `var a=1,b=2,c=3` 为单个语句
- **解决**：对结构化代码（class/function）效果好，常量文件需手动处理

### 反混淆策略
- **构造函数参数**：通过 `this._xxxService = e` 赋值模式，自动将 e → xxxService
- **局部变量**：风险高，需作用域分析，暂不自动处理
- **品牌替换注意**：`--cursor-` → `--claude-`，但 CSS `cursor: pointer` 等属性值不能替换
- **工具**：`tools/deobfuscate.js` 处理构造函数级别重命名

### TypeScript 编译修复常见模式
- **TS6138 (unused property)**: 构造函数参数有 `private readonly` 但未被使用 → 移除 `private readonly` 让参数成为普通的未使用参数
- **TS6133 (unused variable)**: 移除未使用的导入或给变量加 `_` 前缀，加 `void _var;` 语句
- **URI.revive() 类型错误**: 参数类型为 `unknown` 不兼容 → 添加 `as URI | null` 类型断言
- **IAllComposersStore ↔ Record<string,unknown>**: 接口需要 `[key: string]: unknown` 索引签名
- **const enum**: 不能用本地 object literal 代替 `const enum`，必须 import 原始 const enum 值
- **asRelativePath 不存在**: `IWorkspaceContextService` 没有这个方法 → 用 `getWorkspace().folders[0].uri.path` 手动拼接

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
