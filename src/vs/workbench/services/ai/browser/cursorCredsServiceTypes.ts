/*---------------------------------------------------------------------------------------------
 *  Cursor Creds Service Types — Shared type definitions for backend credential management.
 *
 *  Extracted from Cursor IDE bundle CursorCredsService (rAa).
 *--------------------------------------------------------------------------------------------*/

import { createDecorator, type Event } from './vscodeShims.js';

// ============================================================================
// Service Identifier
// ============================================================================

export const ICursorCredsService = createDecorator<ICursorCredsService>('cursorCredsService');

// ============================================================================
// Server Names
// ============================================================================

export const ServerName = {
	PROD: 'Prod',
	PROD_EU_CENTRAL_1_AGENT: 'Prod (eu-central-1 agent)',
	PROD_AP_SOUTHEAST_1_AGENT: 'Prod (ap-southeast-1 agent)',
	STAGING: 'Staging',
	DEV_STAGING: 'DevStaging(w/local-website)',
	STAGING_LOCAL_WEBSITE: 'Staging(w/local-website)',
	LOCAL_EXCEPT_CPP_AND_EMBEDDINGS: 'DefaultLocal(no cpp/embeddings)',
	STAGING_LOCAL_EXCEPT_CPP_AND_EMBEDDINGS: 'StagingLocal(cpp/embeddings on Staging)',
	LOCAL_EXCEPT_CPP: 'Local(except cpp)',
	FULL_LOCAL: 'FullLocal',
	LOCAL_EXCEPT_EMBEDDINGS: 'Local(except embeddings)',
} as const;

export type ServerNameValue = typeof ServerName[keyof typeof ServerName];

// ============================================================================
// Server Environment
// ============================================================================

export const ServerEnvironment = {
	Prod: 'prod',
	ProdEuCentral1Agent: 'prodEuCentral1Agent',
	Staging: 'staging',
	DevStaging: 'devStagingEverything',
	StagingLocalWebsite: 'stagingLocalWebsite',
	LocalExceptCppAndEmbeddings: 'local',
	LocalExceptCppAndEmbeddingsStaging: 'localStaging',
	LocalExceptCPP: 'fullLocal',
	LocalExceptEmbeddings: 'localExceptEmbeddings',
	FullLocal: 'fullLocalincludingcpp',
} as const;

export type ServerEnvironmentValue = typeof ServerEnvironment[keyof typeof ServerEnvironment];

export const ServerEnvironmentPorts: Record<ServerEnvironmentValue, number> = {
	[ServerEnvironment.Prod]: 1814,
	[ServerEnvironment.ProdEuCentral1Agent]: 1813,
	[ServerEnvironment.Staging]: 1815,
	[ServerEnvironment.StagingLocalWebsite]: 1816,
	[ServerEnvironment.LocalExceptCppAndEmbeddings]: 1817,
	[ServerEnvironment.LocalExceptCPP]: 1818,
	[ServerEnvironment.FullLocal]: 1819,
	[ServerEnvironment.LocalExceptEmbeddings]: 1820,
	[ServerEnvironment.DevStaging]: 1821,
	[ServerEnvironment.LocalExceptCppAndEmbeddingsStaging]: 1822,
};

// ============================================================================
// Credentials Types
// ============================================================================

export interface IAgentBackendUrls {
	privacy: { default: string; 'us-west-1'?: string };
	nonPrivacy: { default: string; 'us-west-1'?: string };
}

export interface ICredentials {
	websiteUrl: string;
	backendUrl: string;
	authClientId: string;
	authDomain: string;
	repoBackendUrl: string;
	telemBackendUrl: string;
	geoCppBackendUrl: string;
	cppConfigBackendUrl: string;
	cmdkBackendUrl: string;
	bcProxyUrl: string;
	agentBackendUrlPrivacy: IAgentBackendUrls['privacy'];
	agentBackendUrlNonPrivacy: IAgentBackendUrls['nonPrivacy'];
	credentialsDisplayName: string;
}

// ============================================================================
// ICursorCredsService — Service Interface
// ============================================================================

export interface ICursorCredsService {
	readonly _serviceBrand: undefined;

	// Server switching
	readonly namingMap: Record<string, (() => void) | undefined>;
	readonly onDidRequestRelogin: Event<void>;

	// Credential getters
	getCredentials(): ICredentials;
	getAuth0ClientId(): string | undefined;
	getEffectiveCredentials(): ICredentials;

	// URL getters
	getLoginUrl(): string;
	getLogoutUrl(): string;
	getPricingUrl(): string;
	getSettingsUrl(): string;
	getBackgroundAgentSettingsUrl(): string;
	getIntegrationsUrl(): string;
	getConnectGithubUrl(options: { authId: string; githubRepo?: string; useBackgroundComposerEnv?: boolean }): string;
	getPollingEndpoint(): string;
	getBackendUrl(): string;
	getRepoBackendUrl(): string;
	getTelemBackendUrl(): string;
	getGeoCppBackendUrl(): string;
	getCppConfigBackendUrl(): string;
	upgradeToPlanOrGetUrl(tier: string, allowTrial?: boolean, allowAutomaticPayment?: boolean): string;

	// Server switching
	reloginIfNeeded(previousClientId: string | undefined): void;
	localBackendPort(): number;
	setGeoCppBackendUrl(url: string): void;
	getAgentBackendUrls(backendUrl: string): IAgentBackendUrls;

	// Environment
	isDevUserOrDevBuild(): boolean;
	getBcProxyDevUrl(): string;
}
