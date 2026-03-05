#!/usr/bin/env node
/**
 * TypeScript 转换脚本
 *
 * 在格式化和导入还原后的基础上，为 JS 文件添加 TypeScript 类型注解，
 * 然后重命名为 .ts 文件。
 *
 * 用法: node scripts/convert-to-ts.js [input-dir] [--dry-run] [--skip-rename]
 *   input-dir   — 默认 extracted/cursor-unbundled/modules/
 *   --dry-run   — 仅显示统计，不修改文件
 *   --skip-rename — 不重命名为 .ts（仅添加类型注解）
 *
 * 转换策略:
 *   1. DI 注入参数类型: constructor(xxxService) → constructor(xxxService: IXxxService)
 *   2. VS Code 接口类型: 已知服务 ID → 对应 Interface 类型
 *   3. 方法返回类型: void / Promise<void> 启发式推断
 *   4. 常量类型: 字符串常量 → const 断言
 *   5. 类属性声明: this._xxx = ... → private _xxx: Type
 *   6. 重命名 .js → .ts
 */

import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname, dirname, basename } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'extracted/cursor-unbundled/modules');

// ─── Parse CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
let inputDir = DEFAULT_INPUT;
let dryRun = false;
let skipRename = false;

for (let i = 0; i < args.length; i++) {
	if (args[i] === '--dry-run') {
		dryRun = true;
	} else if (args[i] === '--skip-rename') {
		skipRename = true;
	} else if (!args[i].startsWith('--')) {
		inputDir = resolve(args[i]);
	}
}

// ─── Known VS Code Service Interface Map ─────────────────────────

/**
 * Map of service ID → interface type name.
 * These are the most common VS Code DI services.
 * Service IDs come from createDecorator('serviceId') or Bi("serviceId").
 */
const SERVICE_INTERFACE_MAP = {
	// VS Code core services
	instantiationService: 'IInstantiationService',
	codeEditorService: 'ICodeEditorService',
	modelService: 'IModelService',
	textModelService: 'ITextModelService',
	commandService: 'ICommandService',
	contextKeyService: 'IContextKeyService',
	menuService: 'IMenuService',
	telemetryService: 'ITelemetryService',
	logService: 'ILogService',
	loggerService: 'ILoggerService',
	configurationService: 'IConfigurationService',
	languageService: 'ILanguageService',
	languageConfigurationService: 'ILanguageConfigurationService',
	accessibilityService: 'IAccessibilityService',
	notificationService: 'INotificationService',
	themeService: 'IThemeService',
	environmentService: 'IEnvironmentService',
	fileService: 'IFileService',
	contextService: 'IWorkspaceContextService',
	storageService: 'IStorageService',
	tooltipService: 'ITooltipService',
	undoRedoService: 'IUndoRedoService',
	keybindingService: 'IKeybindingService',
	progressService: 'IProgressService',
	editorProgressService: 'IEditorProgressService',
	editorWorkerService: 'IEditorWorkerService',
	clipboardService: 'IClipboardService',
	contextViewService: 'IContextViewService',
	contextMenuService: 'IContextMenuService',
	hoverService: 'IHoverService',
	quickInputService: 'IQuickInputService',
	dialogService: 'IDialogService',
	fileDialogService: 'IFileDialogService',
	openerService: 'IOpenerService',
	layoutService: 'ILayoutService',
	markerService: 'IMarkerService',
	editorGroupsService: 'IEditorGroupsService',
	editorService: 'IEditorService',
	statusbarService: 'IStatusbarService',
	lifecycleService: 'ILifecycleService',
	viewsService: 'IViewsService',
	viewDescriptorService: 'IViewDescriptorService',
	paneCompositePartService: 'IPaneCompositePartService',
	extensionService: 'IExtensionService',
	labelService: 'ILabelService',
	listService: 'IListService',
	productService: 'IProductService',
	textFileService: 'ITextFileService',
	hostService: 'IHostService',
	remoteAgentService: 'IRemoteAgentService',
	pathService: 'IPathService',
	secretStorageService: 'ISecretStorageService',
	encryptionService: 'IEncryptionService',
	requestService: 'IRequestService',
	urlService: 'IURLService',
	workspacesService: 'IWorkspacesService',
	terminalService: 'ITerminalService',
	terminalConfigurationService: 'ITerminalConfigurationService',
	searchService: 'ISearchService',
	outputService: 'IOutputService',
	debugService: 'IDebugService',
	historyService: 'IHistoryService',
	workingCopyService: 'IWorkingCopyService',
	workingCopyFileService: 'IWorkingCopyFileService',
	explorerService: 'IExplorerService',
	filesConfigurationService: 'IFilesConfigurationService',
	textResourceConfigurationService: 'ITextResourceConfigurationService',
	textResourcePropertiesService: 'ITextResourcePropertiesService',
	activityService: 'IActivityService',
	titleService: 'ITitleService',
	bannerService: 'IBannerService',
	updateService: 'IUpdateService',
	uiOverlayService: 'IUIOverlayService',
	nativeHostService: 'INativeHostService',
	extensionManagementService: 'IExtensionManagementService',
	webviewService: 'IWebviewService',
	taskService: 'ITaskService',
	notebookService: 'INotebookService',
	preferencesService: 'IPreferencesService',
	editorResolverService: 'IEditorResolverService',
	snippetService: 'ISnippetService',
	commentService: 'ICommentService',
	accessibleViewService: 'IAccessibleViewService',
	downloadService: 'IDownloadService',
	jsonEditingService: 'IJSONEditingService',
	textEditorService: 'ITextEditorService',
	shellEnvironmentService: 'IShellEnvironmentService',
	mainProcessService: 'IMainProcessService',
	sharedProcessService: 'ISharedProcessService',
	speechService: 'ISpeechService',

	// Cursor-specific services
	composerService: 'IComposerService',
	composerDataService: 'IComposerDataService',
	composerChatService: 'IComposerChatService',
	composerEventService: 'IComposerEventService',
	composerFileService: 'IComposerFileService',
	composerTextModelService: 'IComposerTextModelService',
	composerCodeBlockService: 'IComposerCodeBlockService',
	composerContextService: 'IComposerContextService',
	composerUtilsService: 'IComposerUtilsService',
	composerPlanService: 'IComposerPlanService',
	composerModesService: 'IComposerModesService',
	composerViewsService: 'IComposerViewsService',
	composerNotificationService: 'IComposerNotificationService',
	composerCheckpointService: 'IComposerCheckpointService',
	composerCheckpointStorageService: 'IComposerCheckpointStorageService',
	composerStorageService: 'IComposerStorageService',
	composerMessageStorageService: 'IComposerMessageStorageService',
	composerMessageRequestContextStorageService: 'IComposerMessageRequestContextStorageService',
	composerCodeBlockDiffStorageService: 'IComposerCodeBlockDiffStorageService',
	composerCodeBlockPartialInlineDiffFatesStorageService: 'IComposerCodeBlockPartialInlineDiffFatesStorageService',
	composerAgentService: 'IComposerAgentService',
	composerDecisionsService: 'IComposerDecisionsService',
	composerFileChangeHandlerService: 'IComposerFileChangeHandlerService',
	composerExtensibilityService: 'IComposerExtensibilityService',
	composerTerminalService: 'IComposerTerminalService',
	composerProjectService: 'IComposerProjectService',
	composerMigrationService: 'IComposerMigrationService',
	backgroundComposerService: 'IBackgroundComposerService',
	backgroundComposerDataService: 'IBackgroundComposerDataService',
	backgroundComposerEventService: 'IBackgroundComposerEventService',
	backgroundEditService: 'IBackgroundEditService',
	backgroundWorkService: 'IBackgroundWorkService',
	backgroundComposerCachedDetailsStorageService: 'IBackgroundComposerCachedDetailsStorageService',
	aiService: 'IAiService',
	aiClientService: 'IAiClientService',
	aiConnectRequestService: 'IAiConnectRequestService',
	aiServerConfigService: 'IAiServerConfigService',
	aiCodeTrackingService: 'IAiCodeTrackingService',
	aiFileInfoService: 'IAiFileInfoService',
	aiErrorService: 'IAiErrorService',
	aiUtilsService: 'IAiUtilsService',
	aiDocsService: 'IAiDocsService',
	cppService: 'ICppService',
	cppSuggestionService: 'ICppSuggestionService',
	cppEventLoggerService: 'ICppEventLoggerService',
	cursorPredictionService: 'ICursorPredictionService',
	importPredictionService: 'IImportPredictionService',
	cmdKStateService: 'ICmdKStateService',
	cmdKService: 'ICmdKService',
	inlineDiffService: 'IInlineDiffService',
	agentProviderService: 'IAgentProviderService',
	agentLayoutService: 'IAgentLayoutService',
	agentClientService: 'IAgentClientService',
	subagentsService: 'ISubagentsService',
	mcpService: 'IMcpService',
	mcpProviderService: 'IMcpProviderService',
	mcpInstallationService: 'IMcpInstallationService',
	cursorCredsService: 'ICursorCredsService',
	cursorIgnoreService: 'ICursorIgnoreService',
	cursorRulesService: 'ICursorRulesService',
	cursorCommandsService: 'ICursorCommandsService',
	experimentService: 'IExperimentService',
	metricsService: 'IMetricsService',
	telemService: 'ITelemService',
	analyticsService: 'IAnalyticsService',
	modelConfigService: 'IModelConfigService',
	usageDataService: 'IUsageDataService',
	patchGraphService: 'IPatchGraphService',
	patchGraphStorageService: 'IPatchGraphStorageService',
	patchGraphAdapterService: 'IPatchGraphAdapterService',
	reviewChangesService: 'IReviewChangesService',
	planStorageService: 'IPlanStorageService',
	worktreeManagerService: 'IWorktreeManagerService',
	worktreeComposerDataService: 'IWorktreeComposerDataService',
	gitContextService: 'IGitContextService',
	selectedContextService: 'ISelectedContextService',
	fastContextService: 'IFastContextService',
	voiceInputService: 'IVoiceInputService',
	humanEditTrackerService: 'IHumanEditTrackerService',
	reactiveContextKeyService: 'IReactiveContextKeyService',
	reactiveStorageService: 'IReactiveStorageService',
	structuredLogService: 'IStructuredLogService',
	adminSettingsService: 'IAdminSettingsService',
	devConsoleService: 'IDevConsoleService',
	prettyDialogService: 'IPrettyDialogService',
	pluginsProviderService: 'IPluginsProviderService',
	agentRepositoryService: 'IAgentRepositoryService',
	glassActiveAgentService: 'IGlassActiveAgentService',
	agentPrewarmService: 'IAgentPrewarmService',
	cloudAgentStorageService: 'ICloudAgentStorageService',
	browserAutomationService: 'IBrowserAutomationService',
	tokenStreamingDiffService: 'ITokenStreamingDiffService',
	diffDecorationVisibilityService: 'IDiffDecorationVisibilityService',
	diffChangeSourceRegistry: 'IDiffChangeSourceRegistry',
	nonAgentChangeTrackerService: 'INonAgentChangeTrackerService',
	appLayoutService: 'IAppLayoutService',
	editorPaneService: 'IEditorPaneService',
	toolCallHumanReviewService: 'IToolCallHumanReviewService',
	blobUploadService: 'IBlobUploadService',
	knowledgeBaseService: 'IKnowledgeBaseService',
	agentExecProviderService: 'IAgentExecProviderService',
	agentSkillsService: 'IAgentSkillsService',
};

// ─── Type Inference Patterns ─────────────────────────────────────

/**
 * Infer a reasonable type annotation for a constructor parameter
 * based on its name.
 */
function inferParamType(paramName) {
	// Check direct service map
	const cleanName = paramName.startsWith('_') ? paramName.slice(1) : paramName;
	if (SERVICE_INTERFACE_MAP[cleanName]) {
		return SERVICE_INTERFACE_MAP[cleanName];
	}

	// [DISABLED] Heuristic guessing produces wrong interface names
	// e.g. remoteService → IRemoteService (actual: IRemoteAgentService)
	// Only use exact matches from SERVICE_INTERFACE_MAP
	return null;
}

// ─── Transformations ─────────────────────────────────────────────

/**
 * Add type annotations to constructor parameters.
 * Transforms: constructor(configurationService, composerDataService)
 * Into: constructor(@IConfigurationService configurationService: IConfigurationService, ...)
 */
function addConstructorTypes(code) {
	let changed = false;

	// Find constructor declarations — use balanced paren matching
	// to handle nested parens in default values like `callback = () => {}`
	const ctorMatches = [];
	const ctorStartRegex = /constructor\s*\(/g;
	let ctorMatch;
	while ((ctorMatch = ctorStartRegex.exec(code)) !== null) {
		const start = ctorMatch.index;
		const parenStart = start + ctorMatch[0].length;
		let depth = 1, pos = parenStart;
		while (pos < code.length && depth > 0) {
			if (code[pos] === '(') depth++;
			else if (code[pos] === ')') depth--;
			pos++;
		}
		if (depth === 0) {
			ctorMatches.push({
				start,
				end: pos,
				full: code.slice(start, pos),
				params: code.slice(parenStart, pos - 1)
			});
		}
	}
	// Replace in reverse order to preserve indices
	for (let ci = ctorMatches.length - 1; ci >= 0; ci--) {
		const cm = ctorMatches[ci];
		const params = cm.params;
		const match = cm.full;
		const replacer = ((match, params) => {
		if (!params.trim()) return match;

		const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
		const typedParams = paramList.map(param => {
			// Skip if already typed (contains ':')
			if (param.includes(':')) return param;

			// Skip if it's a destructured parameter
			if (param.includes('{') || param.includes('[')) return param;

			// Skip if it has a default value — only split on first '='
			const eqIdx = param.indexOf('=');
			const name = eqIdx >= 0 ? param.slice(0, eqIdx).trim() : param.trim();
			const defaultValue = eqIdx >= 0 ? param.slice(eqIdx + 1).trim() : undefined;

			const type = inferParamType(name);
			if (type) {
				changed = true;
				if (defaultValue !== undefined) {
					return `@${type} ${name}: ${type} = ${defaultValue}`;
				}
				return `@${type} ${name}: ${type}`;
			}
			return param;
		});

		return `constructor(${typedParams.join(', ')})`;
	})(match, params);
		code = code.slice(0, cm.start) + replacer + code.slice(cm.end);
	}

	return { code, changed };
}

/**
 * Add type annotations to class field declarations.
 * Transforms: this._configurationService = configurationService
 * Adds: private _configurationService: IConfigurationService
 */
function addFieldTypes(code) {
	const fields = new Map(); // fieldName → type
	let changed = false;

	// Find field assignments in constructor
	const assignRegex = /this\.(_?\w+Service)\s*=\s*(\w+)/g;
	let match;
	while ((match = assignRegex.exec(code)) !== null) {
		const fieldName = match[1];
		const paramName = match[2];
		const type = inferParamType(paramName) || inferParamType(fieldName);
		if (type) {
			fields.set(fieldName, type);
		}
	}

	if (fields.size === 0) return { code, changed: false };

	// Find class declaration and insert field declarations after opening brace
	const classRegex = /class\s+\w+(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
	code = code.replace(classRegex, (classDecl) => {
		const fieldDecls = [];
		for (const [fieldName, type] of fields) {
			const visibility = fieldName.startsWith('_') ? 'private' : 'public';
			fieldDecls.push(`  ${visibility} ${fieldName}: ${type};`);
		}
		changed = fieldDecls.length > 0;
		return classDecl + '\n' + fieldDecls.join('\n');
	});

	return { code, changed };
}

/**
 * Convert enum-like objects to TypeScript const enums.
 * Pattern: const Foo = { A: 0, B: 1, C: 2 }
 * → const enum Foo { A = 0, B = 1, C = 2 }
 */
function convertEnumPatterns(code) {
	let changed = false;

	// Match: var/let/const NAME = { KEY: number, ... } where all values are numbers
	const enumRegex = /(?:var|let|const)\s+(\w+)\s*=\s*\{([^}]+)\}/g;
	code = code.replace(enumRegex, (match, name, body) => {
		// Check if all values are numeric
		const entries = body.split(',').map(e => e.trim()).filter(Boolean);
		const isEnum = entries.every(entry => {
			const parts = entry.split(':').map(s => s.trim());
			return parts.length === 2 && /^-?\d+$/.test(parts[1]);
		});

		if (!isEnum || entries.length < 2) return match;

		changed = true;
		const enumEntries = entries.map(entry => {
			const [key, value] = entry.split(':').map(s => s.trim());
			return `  ${key} = ${value}`;
		}).join(',\n');

		return `const enum ${name} {\n${enumEntries}\n}`;
	});

	return { code, changed };
}

/**
 * Add basic method return type annotations.
 * Heuristic: if method body contains `return` → infer type,
 * otherwise → void.
 */
function addMethodReturnTypes(code) {
	// This is a conservative heuristic — only annotate obvious patterns
	let changed = false;

	// Pattern: methodName(...) {  → methodName(...): void {
	// Only for simple cases where we can determine void
	// (method has no return statement with a value)
	// Skip this for now — too error-prone without proper AST parsing

	return { code, changed };
}

// ─── File Processing ─────────────────────────────────────────────

function splitHeaderAndBody(content) {
	const lines = content.split('\n');
	let headerEnd = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.startsWith('// Module:') ||
			line.startsWith('// Variable:') ||
			line.startsWith('// Type:') ||
			line.startsWith('// Dependencies:') ||
			line.startsWith('// Exports:') ||
			line.startsWith('import ') ||
			line === '') {
			headerEnd = i + 1;
		} else {
			break;
		}
	}

	const header = lines.slice(0, headerEnd).join('\n');
	const body = lines.slice(headerEnd).join('\n');
	return { header, body };
}

function findJSFiles(dir) {
	const files = [];
	try {
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				files.push(...findJSFiles(fullPath));
			} else if (extname(entry.name) === '.js') {
				files.push(fullPath);
			}
		}
	} catch { /* noop */ }
	return files;
}

function processFile(filePath) {
	const content = readFileSync(filePath, 'utf8');

	// Skip tiny files
	if (content.trim().length < 20) {
		return { status: 'skipped', reason: 'too-small' };
	}

	const { header, body } = splitHeaderAndBody(content);
	let transformedBody = body;
	let totalChanges = 0;

	// Apply transformations in order
	const transforms = [
		addConstructorTypes,
		// [DISABLED] addFieldTypes — collects fields file-wide but inserts into every
		// class declaration, causing TS2300 Duplicate identifier in multi-class files
		convertEnumPatterns,
		addMethodReturnTypes,
	];

	for (const transform of transforms) {
		const result = transform(transformedBody);
		transformedBody = result.code;
		if (result.changed) totalChanges++;
	}

	if (totalChanges === 0) {
		return { status: 'no-changes' };
	}

	// Reassemble
	const output = header.trimEnd() + '\n\n' + transformedBody.trim() + '\n';

	if (!dryRun) {
		writeFileSync(filePath, output);

		// Rename .js → .ts
		if (!skipRename && extname(filePath) === '.js') {
			const tsPath = filePath.replace(/\.js$/, '.ts');
			renameSync(filePath, tsPath);
		}
	}

	return { status: 'converted', changes: totalChanges };
}

// ─── Main ────────────────────────────────────────────────────────

console.log(`[convert-to-ts] 扫描 ${inputDir} ...`);
const files = findJSFiles(inputDir);
console.log(`[convert-to-ts] 发现 ${files.length} 个 JS 文件`);

if (dryRun) {
	console.log('[convert-to-ts] 模式: dry-run (不修改文件)');
}

const stats = { converted: 0, noChanges: 0, skipped: 0, failed: 0 };
const failures = [];

for (let i = 0; i < files.length; i++) {
	const file = files[i];
	const relPath = relative(inputDir, file);

	try {
		const result = processFile(file);

		switch (result.status) {
			case 'converted':
				stats.converted++;
				process.stdout.write('.');
				break;
			case 'no-changes':
				stats.noChanges++;
				break;
			case 'skipped':
				stats.skipped++;
				break;
		}
	} catch (err) {
		stats.failed++;
		failures.push({ file: relPath, reason: err.message });
		process.stdout.write('x');
	}

	if ((i + 1) % 100 === 0) {
		process.stdout.write(` [${i + 1}/${files.length}]\n`);
	}
}

console.log('\n');
console.log('[convert-to-ts] === 结果 ===');
console.log(`  TypeScript 转换: ${stats.converted}`);
console.log(`  无需更改: ${stats.noChanges}`);
console.log(`  已跳过: ${stats.skipped}`);
console.log(`  失败: ${stats.failed}`);

if (!skipRename && !dryRun) {
	console.log(`  重命名: .js → .ts`);
}

if (failures.length > 0) {
	console.log('\n[convert-to-ts] 失败文件:');
	for (const f of failures.slice(0, 20)) {
		console.log(`  ${f.file}: ${f.reason}`);
	}
	if (failures.length > 20) {
		console.log(`  ... 还有 ${failures.length - 20} 个`);
	}
}

console.log('\n[convert-to-ts] 完成!');
