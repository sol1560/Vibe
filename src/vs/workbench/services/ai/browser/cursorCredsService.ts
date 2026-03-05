/*---------------------------------------------------------------------------------------------
 *  Cursor Creds Service — TypeScript conversion from Cursor IDE bundle.
 *
 *  Manages backend server credentials and configuration.
 *  Provides URL endpoints for authentication, API calls, indexing, etc.
 *  Supports switching between prod, staging, and local development servers.
 *
 *  Original class: rAa (CursorCredsService)
 *--------------------------------------------------------------------------------------------*/

import { Disposable, Emitter, registerSingleton, InstantiationType } from './vscodeShims.js';
import {
	IAgentBackendUrls,
	ICredentials,
	ICursorCredsService,
	ServerEnvironment,
	ServerEnvironmentPorts,
	ServerName,
} from './cursorCredsServiceTypes.js';

// ============================================================================
// Constants (URLs extracted from the Cursor bundle — reference only)
// ============================================================================

const STAGING_BACKEND_URL = 'https://staging.cursor.sh';
const REPO42_BACKEND_URL = 'https://repo42.cursor.sh';
const DEV_STAGING_BACKEND_URL = 'https://dev-staging.cursor.sh';
const DEV_AUTH_CLIENT_ID = 'OzaBXLClY5CAGxNzUhQ2vlknpi07tGuE';
const DEV_AUTH_DOMAIN = 'dev.authentication.cursor.sh';
const LOCALHOST_PREFIX = 'https://localhost:';
const DEFAULT_LOCAL_PORT = 8000;
const LOCAL_WEBSITE_URL = 'http://localhost:4000';

// Placeholder production URLs — these would be replaced with actual Claude Editor URLs
const PROD_WEBSITE_URL = 'https://claude.ai';
const PROD_BACKEND_URL = 'https://api.claude.ai';
const PROD_AUTH_CLIENT_ID = '';
const PROD_AUTH_DOMAIN = '';
const PROD_REPO_BACKEND_URL = '';
const PROD_TELEM_BACKEND_URL = '';
const PROD_GEO_CPP_URL = '';
const PROD_CPP_CONFIG_URL = '';
const PROD_CMDK_BACKEND_URL = '';

// Agent backend URL placeholders
const PROD_AGENT_PRIVACY_DEFAULT_URL = '';
const PROD_AGENT_PRIVACY_US_WEST_1_URL = '';
const PROD_AGENT_NON_PRIVACY_DEFAULT_URL = '';
const PROD_AGENT_NON_PRIVACY_US_WEST_1_URL = '';

// ============================================================================
// CursorCredsService Implementation
// ============================================================================

export class CursorCredsService extends Disposable implements ICursorCredsService {

	declare readonly _serviceBrand: undefined;

	private readonly _onDidRequestRelogin = this._register(new Emitter<void>());
	readonly onDidRequestRelogin = this._onDidRequestRelogin.event;

	private prodGeoCppUrl = PROD_GEO_CPP_URL;
	private testBackendUrlOverride: string | undefined;
	private currentCredentials: ICredentials;

	readonly namingMap: Record<string, (() => void) | undefined>;

	constructor(
		// DI dependencies — original decorators: @xu, @V0, @_c, @Ci, @sie
		// IReactiveStorageService, IStatusbarService, IEnvironmentService, IContextKeyService, IClientDebugLogService
	) {
		super();

		// Initialize with production defaults
		this.currentCredentials = this.buildProdCredentials();

		this.namingMap = {
			[ServerName.PROD]: () => this.switchToProdServer(),
			[ServerName.PROD_EU_CENTRAL_1_AGENT]: () => this.switchToProdEuCentral1AgentServer(),
			[ServerName.PROD_AP_SOUTHEAST_1_AGENT]: () => this.switchToProdApSoutheast1AgentServer(),
			[ServerName.LOCAL_EXCEPT_CPP_AND_EMBEDDINGS]: () => this.switchToLocalExceptCppAndEmbeddingsServer(),
			[ServerName.LOCAL_EXCEPT_CPP]: () => this.switchToLocalExceptCppServer(),
			[ServerName.FULL_LOCAL]: () => this.switchToFullLocalServer(),
			[ServerName.STAGING]: () => this.switchToStagingServer(),
			[ServerName.DEV_STAGING]: () => this.switchToDevStagingServer(),
			[ServerName.STAGING_LOCAL_WEBSITE]: () => this.switchToStagingServerLocalWebsite(),
			[ServerName.STAGING_LOCAL_EXCEPT_CPP_AND_EMBEDDINGS]: () => this.switchToLocalExceptCppAndEmbeddingsServerStagingProd(),
			[ServerName.LOCAL_EXCEPT_EMBEDDINGS]: () => this.switchToLocalExceptEmbeddingsServer(),
		};
	}

	// =========================================================================
	// Environment Checks
	// =========================================================================

	isDevUserOrDevBuild(): boolean {
		// In Claude Editor, this would check the environment service
		return false;
	}

	// =========================================================================
	// Credential Management
	// =========================================================================

	getEffectiveCredentials(): ICredentials {
		if (!this.testBackendUrlOverride) {
			return this.currentCredentials;
		}
		const agentUrls = this.getAgentBackendUrls(this.testBackendUrlOverride);
		return {
			...this.currentCredentials,
			backendUrl: this.testBackendUrlOverride,
			repoBackendUrl: this.testBackendUrlOverride,
			telemBackendUrl: this.testBackendUrlOverride,
			geoCppBackendUrl: this.testBackendUrlOverride,
			cppConfigBackendUrl: this.testBackendUrlOverride,
			cmdkBackendUrl: this.testBackendUrlOverride,
			bcProxyUrl: this.testBackendUrlOverride,
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
		};
	}

	getCredentials(): ICredentials {
		return this.getEffectiveCredentials();
	}

	getAuth0ClientId(): string | undefined {
		return this.currentCredentials.authClientId || undefined;
	}

	reloginIfNeeded(previousClientId: string | undefined): void {
		const currentClientId = this.getAuth0ClientId();
		if (previousClientId !== currentClientId) {
			this._onDidRequestRelogin.fire();
		}
	}

	localBackendPort(): number {
		return DEFAULT_LOCAL_PORT;
	}

	getBcProxyDevUrl(): string {
		return this.getBackendUrl().includes('localhost')
			? LOCALHOST_PREFIX + this.localBackendPort()
			: PROD_BACKEND_URL;
	}

	// =========================================================================
	// URL Getters
	// =========================================================================

	getLoginUrl(): string {
		return `${this.currentCredentials.websiteUrl}/loginDeepControl`;
	}

	getLogoutUrl(): string {
		return `${this.currentCredentials.websiteUrl}/api/auth/logout`;
	}

	getPricingUrl(): string {
		return `${this.currentCredentials.websiteUrl}/pricing`;
	}

	getSettingsUrl(): string {
		return `${this.currentCredentials.websiteUrl}/dashboard`;
	}

	getBackgroundAgentSettingsUrl(): string {
		return `${this.currentCredentials.websiteUrl}/dashboard?tab=cloud-agents`;
	}

	getIntegrationsUrl(): string {
		return `${this.currentCredentials.websiteUrl}/dashboard?tab=integrations`;
	}

	getConnectGithubUrl(options: { authId: string; githubRepo?: string; useBackgroundComposerEnv?: boolean }): string {
		const baseUrl = this.currentCredentials.websiteUrl;
		return `${baseUrl}/api/auth/connect-github?auth_id=${encodeURIComponent(options.authId)}&github_repo=${encodeURIComponent(options.githubRepo ?? '')}&source=BACKGROUND_AGENT`;
	}

	getPollingEndpoint(): string {
		return `${this.getBackendUrl()}/auth/poll`;
	}

	getBackendUrl(): string {
		return this.getCredentials().backendUrl;
	}

	getRepoBackendUrl(): string {
		return this.getCredentials().repoBackendUrl;
	}

	getTelemBackendUrl(): string {
		return this.getCredentials().telemBackendUrl;
	}

	getGeoCppBackendUrl(): string {
		return this.getCredentials().geoCppBackendUrl;
	}

	getCppConfigBackendUrl(): string {
		return this.getCredentials().cppConfigBackendUrl;
	}

	upgradeToPlanOrGetUrl(tier: string, allowTrial?: boolean, allowAutomaticPayment?: boolean): string {
		let url = `${this.currentCredentials.websiteUrl}/api/auth/checkoutDeepControl?tier=${tier}`;
		if (allowTrial === true) {
			url += '&allowTrial=true';
		} else if (allowTrial === false) {
			url += '&allowTrial=false';
		}
		if (allowAutomaticPayment === true) {
			url += '&allowAutomaticPayment=true';
		}
		return url;
	}

	setGeoCppBackendUrl(url: string): void {
		if (url === '' || !url.includes('cursor.sh')) {
			url = PROD_GEO_CPP_URL;
		}
		this.prodGeoCppUrl = url;
		if (this.currentCredentials.credentialsDisplayName !== ServerName.LOCAL_EXCEPT_EMBEDDINGS &&
			this.currentCredentials.credentialsDisplayName !== ServerName.FULL_LOCAL) {
			this.currentCredentials = { ...this.currentCredentials, geoCppBackendUrl: url };
		}
	}

	getAgentBackendUrls(backendUrl: string): IAgentBackendUrls {
		if (backendUrl.includes('localhost') || backendUrl.includes('lclhst.build')) {
			return {
				privacy: { default: backendUrl, 'us-west-1': backendUrl },
				nonPrivacy: { default: backendUrl, 'us-west-1': backendUrl },
			};
		}
		if (backendUrl.includes(STAGING_BACKEND_URL) || backendUrl.includes(DEV_STAGING_BACKEND_URL)) {
			return {
				privacy: { default: backendUrl, 'us-west-1': backendUrl },
				nonPrivacy: { default: backendUrl, 'us-west-1': backendUrl },
			};
		}
		return {
			privacy: { default: PROD_AGENT_PRIVACY_DEFAULT_URL, 'us-west-1': PROD_AGENT_PRIVACY_US_WEST_1_URL },
			nonPrivacy: { default: PROD_AGENT_NON_PRIVACY_DEFAULT_URL, 'us-west-1': PROD_AGENT_NON_PRIVACY_US_WEST_1_URL },
		};
	}

	// =========================================================================
	// Server Switching Methods
	// =========================================================================

	private buildProdCredentials(): ICredentials {
		const agentUrls = this.getAgentBackendUrls(PROD_BACKEND_URL);
		return {
			websiteUrl: PROD_WEBSITE_URL,
			backendUrl: PROD_BACKEND_URL,
			authClientId: PROD_AUTH_CLIENT_ID,
			authDomain: PROD_AUTH_DOMAIN,
			repoBackendUrl: PROD_REPO_BACKEND_URL,
			telemBackendUrl: PROD_TELEM_BACKEND_URL,
			geoCppBackendUrl: this.prodGeoCppUrl,
			cppConfigBackendUrl: PROD_CPP_CONFIG_URL,
			cmdkBackendUrl: PROD_CMDK_BACKEND_URL,
			bcProxyUrl: PROD_BACKEND_URL,
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.PROD,
		};
	}

	private switchToProdServer(): void {
		const previousClientId = this.getAuth0ClientId();
		this.currentCredentials = this.buildProdCredentials();
		this.reloginIfNeeded(previousClientId);
	}

	private switchToProdEuCentral1AgentServer(): void {
		const previousClientId = this.getAuth0ClientId();
		this.currentCredentials = {
			...this.buildProdCredentials(),
			agentBackendUrlPrivacy: { default: '' },
			agentBackendUrlNonPrivacy: { default: '' },
			credentialsDisplayName: ServerName.PROD_EU_CENTRAL_1_AGENT,
		};
		this.reloginIfNeeded(previousClientId);
	}

	private switchToProdApSoutheast1AgentServer(): void {
		const previousClientId = this.getAuth0ClientId();
		this.currentCredentials = {
			...this.buildProdCredentials(),
			agentBackendUrlPrivacy: { default: '' },
			agentBackendUrlNonPrivacy: { default: '' },
			credentialsDisplayName: ServerName.PROD_AP_SOUTHEAST_1_AGENT,
		};
		this.reloginIfNeeded(previousClientId);
	}

	private switchToLocalExceptCppServer(): void {
		const port = this.localBackendPort();
		const localUrl = LOCALHOST_PREFIX + port;
		const agentUrls = this.getAgentBackendUrls(localUrl);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: localUrl,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: LOCALHOST_PREFIX + port,
			repoBackendUrl: LOCALHOST_PREFIX + port,
			telemBackendUrl: PROD_TELEM_BACKEND_URL,
			geoCppBackendUrl: this.prodGeoCppUrl,
			cppConfigBackendUrl: PROD_CPP_CONFIG_URL,
			cmdkBackendUrl: LOCALHOST_PREFIX + port,
			bcProxyUrl: this.getBcProxyDevUrl(),
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.LOCAL_EXCEPT_CPP,
		};
	}

	private switchToFullLocalServer(): void {
		const port = this.localBackendPort();
		const localUrl = LOCALHOST_PREFIX + port;
		const agentUrls = this.getAgentBackendUrls(localUrl);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: localUrl,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: LOCALHOST_PREFIX + port,
			repoBackendUrl: LOCALHOST_PREFIX + port,
			telemBackendUrl: LOCALHOST_PREFIX + port,
			geoCppBackendUrl: LOCALHOST_PREFIX + port,
			cppConfigBackendUrl: LOCALHOST_PREFIX + port,
			cmdkBackendUrl: LOCALHOST_PREFIX + port,
			bcProxyUrl: this.getBcProxyDevUrl(),
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.FULL_LOCAL,
		};
	}

	private switchToLocalExceptCppAndEmbeddingsServer(): void {
		const port = this.localBackendPort();
		const localUrl = LOCALHOST_PREFIX + port;
		const agentUrls = this.getAgentBackendUrls(localUrl);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: localUrl,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: LOCALHOST_PREFIX + port,
			repoBackendUrl: REPO42_BACKEND_URL,
			telemBackendUrl: PROD_TELEM_BACKEND_URL,
			geoCppBackendUrl: this.prodGeoCppUrl,
			cppConfigBackendUrl: PROD_CPP_CONFIG_URL,
			cmdkBackendUrl: LOCALHOST_PREFIX + port,
			bcProxyUrl: this.getBcProxyDevUrl(),
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.LOCAL_EXCEPT_CPP_AND_EMBEDDINGS,
		};
	}

	private switchToLocalExceptCppAndEmbeddingsServerStagingProd(): void {
		const port = this.localBackendPort();
		const localUrl = LOCALHOST_PREFIX + port;
		const agentUrls = this.getAgentBackendUrls(localUrl);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: localUrl,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: LOCALHOST_PREFIX + port,
			repoBackendUrl: REPO42_BACKEND_URL,
			telemBackendUrl: STAGING_BACKEND_URL,
			geoCppBackendUrl: STAGING_BACKEND_URL,
			cppConfigBackendUrl: STAGING_BACKEND_URL,
			cmdkBackendUrl: LOCALHOST_PREFIX + port,
			bcProxyUrl: this.getBcProxyDevUrl(),
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.STAGING_LOCAL_EXCEPT_CPP_AND_EMBEDDINGS,
		};
	}

	private switchToStagingServer(): void {
		const agentUrls = this.getAgentBackendUrls(STAGING_BACKEND_URL);
		this.currentCredentials = {
			websiteUrl: PROD_WEBSITE_URL,
			backendUrl: STAGING_BACKEND_URL,
			authClientId: PROD_AUTH_CLIENT_ID,
			authDomain: PROD_AUTH_DOMAIN,
			repoBackendUrl: STAGING_BACKEND_URL,
			telemBackendUrl: STAGING_BACKEND_URL,
			geoCppBackendUrl: STAGING_BACKEND_URL,
			cppConfigBackendUrl: STAGING_BACKEND_URL,
			cmdkBackendUrl: STAGING_BACKEND_URL,
			bcProxyUrl: STAGING_BACKEND_URL,
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.STAGING,
		};
	}

	private switchToDevStagingServer(): void {
		const agentUrls = this.getAgentBackendUrls(DEV_STAGING_BACKEND_URL);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: DEV_STAGING_BACKEND_URL,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: DEV_AUTH_DOMAIN,
			repoBackendUrl: DEV_STAGING_BACKEND_URL,
			telemBackendUrl: DEV_STAGING_BACKEND_URL,
			geoCppBackendUrl: DEV_STAGING_BACKEND_URL,
			cppConfigBackendUrl: DEV_STAGING_BACKEND_URL,
			cmdkBackendUrl: DEV_STAGING_BACKEND_URL,
			bcProxyUrl: DEV_STAGING_BACKEND_URL,
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.DEV_STAGING,
		};
	}

	private switchToStagingServerLocalWebsite(): void {
		const agentUrls = this.getAgentBackendUrls(STAGING_BACKEND_URL);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: STAGING_BACKEND_URL,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: DEV_AUTH_DOMAIN,
			repoBackendUrl: STAGING_BACKEND_URL,
			telemBackendUrl: STAGING_BACKEND_URL,
			geoCppBackendUrl: STAGING_BACKEND_URL,
			cppConfigBackendUrl: STAGING_BACKEND_URL,
			cmdkBackendUrl: STAGING_BACKEND_URL,
			bcProxyUrl: STAGING_BACKEND_URL,
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.STAGING_LOCAL_WEBSITE,
		};
	}

	private switchToLocalExceptEmbeddingsServer(): void {
		const port = this.localBackendPort();
		const localUrl = LOCALHOST_PREFIX + port;
		const agentUrls = this.getAgentBackendUrls(localUrl);
		this.currentCredentials = {
			websiteUrl: LOCAL_WEBSITE_URL,
			backendUrl: localUrl,
			authClientId: DEV_AUTH_CLIENT_ID,
			authDomain: DEV_AUTH_DOMAIN,
			repoBackendUrl: REPO42_BACKEND_URL,
			telemBackendUrl: PROD_TELEM_BACKEND_URL,
			geoCppBackendUrl: LOCALHOST_PREFIX + port,
			cppConfigBackendUrl: LOCALHOST_PREFIX + port,
			cmdkBackendUrl: LOCALHOST_PREFIX + port,
			bcProxyUrl: this.getBcProxyDevUrl(),
			agentBackendUrlPrivacy: agentUrls.privacy,
			agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
			credentialsDisplayName: ServerName.LOCAL_EXCEPT_EMBEDDINGS,
		};
	}
}

registerSingleton(
	ICursorCredsService as unknown as { toString(): string },
	CursorCredsService as unknown as new (...args: never[]) => ICursorCredsService,
	InstantiationType.Delayed
);
