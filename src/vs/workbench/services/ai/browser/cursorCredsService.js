/*---------------------------------------------------------------------------------------------
 *  Deobfuscated from Cursor IDE bundle.
 *  Original: vs/workbench/services/ai/browser/cursorCredsService.js
 *  Variable names restored based on context analysis. Logic unchanged.
 *--------------------------------------------------------------------------------------------*/

// Module dependencies
Er(), Qt(), dr(), Pd(), yn(), yE(), st(), zl(), ci(), bv(), So(), ru(), tce();

// Service identifier
const ICursorCredsService = Bi("cursorCredsService"); // NJ

// --- Constants ---
const STAGING_BACKEND_URL = "https://staging.cursor.sh"; // TU
const REPO42_BACKEND_URL = "https://repo42.cursor.sh"; // nAa
const DEV_STAGING_BACKEND_URL = "https://dev-staging.cursor.sh"; // sMe
const DEV_AUTH_CLIENT_ID = "OzaBXLClY5CAGxNzUhQ2vlknpi07tGuE"; // Ont
const DEV_AUTH_DOMAIN = "dev.authentication.cursor.sh"; // iAa
const LOCALHOST_PREFIX = "https://localhost:"; // n5
const DEFAULT_LOCAL_PORT = 8000; // Ftf
const LOCAL_WEBSITE_URL = "http://localhost:4000"; // oMe

// Server names enum
const ServerName = { // B2
  PROD: "Prod",
  PROD_EU_CENTRAL_1_AGENT: "Prod (eu-central-1 agent)",
  PROD_AP_SOUTHEAST_1_AGENT: "Prod (ap-southeast-1 agent)",
  STAGING: "Staging",
  DEV_STAGING: "DevStaging(w/local-website)",
  STAGING_LOCAL_WEBSITE: "Staging(w/local-website)",
  LOCAL_EXCEPT_CPP_AND_EMBEDDINGS: "DefaultLocal(no cpp/embeddings)",
  STAGING_LOCAL_EXCEPT_CPP_AND_EMBEDDINGS: "StagingLocal(cpp/embeddings on Staging)",
  LOCAL_EXCEPT_CPP: "Local(except cpp)",
  FULL_LOCAL: "FullLocal",
  LOCAL_EXCEPT_EMBEDDINGS: "Local(except embeddings)",
};

// --- CursorCredsService ---
// Manages backend server credentials and configuration.
// Provides URL endpoints for authentication, API calls, indexing, etc.
// Supports switching between prod, staging, and local development servers.
let CursorCredsService = class extends at { // rAa
  static { Ayi = this; }

  constructor(
    reactiveStorageService,
    statusbarService,
    environmentService,
    contextKeyService,
    clientDebugLogService
  ) {
    super();
    this.reactiveStorageService = reactiveStorageService;
    this.statusbarService = statusbarService;
    this.environmentService = environmentService;
    this.contextKeyService = contextKeyService;
    this.clientDebugLogService = clientDebugLogService;

    this._onDidRequestRelogin = new Qe; // Emitter
    this.onDidRequestRelogin = this._onDidRequestRelogin.event;
    this.prodGeoCppUrl = NUo; // PROD_GEO_CPP_URL

    // Server switcher map
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

    this.clientDebugLogService.setIssueTraceBaseUrl(() => this.getBackendUrl());
    this.testBackendUrlOverride = this.environmentService.testBackendUrl;
    this.switchToProdServer();
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  isDevUserOrDevBuild() {
    const isDevUser = this.contextKeyService.getContextKeyValue(hN.key) ?? false; // isDevUserContextKey
    return !this.environmentService.isBuilt ||
      this.environmentService.isExtensionDevelopment ||
      isDevUser;
  }

  getEffectiveCredentials() {
    const creds = this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds;
    const testOverride = this.testBackendUrlOverride;
    if (!testOverride) return creds;

    const agentUrls = this.getAgentBackendUrls(testOverride);
    return {
      ...creds,
      backendUrl: testOverride,
      repoBackendUrl: testOverride,
      telemBackendUrl: testOverride,
      geoCppBackendUrl: testOverride,
      cppConfigBackendUrl: testOverride,
      cmdkBackendUrl: testOverride,
      bcProxyUrl: testOverride,
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
    };
  }

  switchToExistingServer() {
    this.testBackendUrlOverride;
  }

  updateServerStatusBarOnlyRunsOnLocal() {
    if (!this.isDevUserOrDevBuild()) return;

    let displayName = this.reactiveStorageService.applicationUserPersistentStorage
      .cursorCreds.credentialsDisplayName;
    if (!displayName) return;
    displayName = displayName.replace("(", " (").replace("  (", " (");

    const statusBarEntry = {
      text: `Server: ${displayName}`,
      tooltip: "Click to switch backend server",
      command: "cursor.selectBackend",
      color: "statusBarItemProminentForeground",
      name: "currentServer",
      ariaLabel: `Current Server: ${displayName}`,
    };

    let entry = this.serverStatusBarEntry ?? CursorCredsService.globalServerStatusBarEntry;
    if (entry) {
      entry.update(statusBarEntry);
      this.serverStatusBarEntry = entry;
      CursorCredsService.globalServerStatusBarEntry = entry;
    } else {
      entry = this.statusbarService.addEntry(statusBarEntry, "status.currentServer", 1, 200);
      this.serverStatusBarEntry = entry;
      CursorCredsService.globalServerStatusBarEntry = entry;
    }
  }

  getAuth0ClientId() {
    return this.reactiveStorageService.applicationUserPersistentStorage
      .cursorCreds.authClientId;
  }

  reloginIfNeeded(previousClientId) {
    const currentClientId = this.getAuth0ClientId();
    if (previousClientId !== currentClientId) {
      this._onDidRequestRelogin.fire();
    }
  }

  localBackendPort() {
    return DEFAULT_LOCAL_PORT;
  }

  getBcProxyDevUrl() {
    const bgEnv = this.reactiveStorageService.applicationUserPersistentStorage
      .backgroundComposerEnv ?? "prod";
    return this.getBackendUrl().includes("localhost") || bgEnv === "dev" || bgEnv === "fullLocal"
      ? LOCALHOST_PREFIX + this.localBackendPort()
      : ghe; // PROD_BACKEND_URL
  }

  switchToProdServer() {
    const previousClientId = this.getAuth0ClientId();
    const agentUrls = this.getAgentBackendUrls(ghe); // PROD_BACKEND_URL
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: Evt, // PROD_WEBSITE_URL
      backendUrl: ghe, // PROD_BACKEND_URL
      authClientId: F9t, // PROD_AUTH_CLIENT_ID
      authDomain: O9t, // PROD_AUTH_DOMAIN
      repoBackendUrl: O6n, // PROD_REPO_BACKEND_URL
      telemBackendUrl: r8e, // PROD_TELEM_BACKEND_URL
      geoCppBackendUrl: this.prodGeoCppUrl,
      cppConfigBackendUrl: xvt, // PROD_CPP_CONFIG_URL
      cmdkBackendUrl: F6n, // PROD_CMDK_BACKEND_URL
      bcProxyUrl: ghe,
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
      credentialsDisplayName: ServerName.PROD,
    });
    this.reloginIfNeeded(previousClientId);
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToProdEuCentral1AgentServer() {
    const previousClientId = this.getAuth0ClientId();
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: Evt,
      backendUrl: ghe,
      authClientId: F9t,
      authDomain: O9t,
      repoBackendUrl: O6n,
      telemBackendUrl: r8e,
      geoCppBackendUrl: this.prodGeoCppUrl,
      cppConfigBackendUrl: xvt,
      cmdkBackendUrl: F6n,
      bcProxyUrl: ghe,
      agentBackendUrlPrivacy: { default: hHh }, // EU_CENTRAL_1_PRIVACY_URL
      agentBackendUrlNonPrivacy: { default: mHh }, // EU_CENTRAL_1_NON_PRIVACY_URL
      credentialsDisplayName: ServerName.PROD_EU_CENTRAL_1_AGENT,
    });
    this.reloginIfNeeded(previousClientId);
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToProdApSoutheast1AgentServer() {
    const previousClientId = this.getAuth0ClientId();
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: Evt,
      backendUrl: ghe,
      authClientId: F9t,
      authDomain: O9t,
      repoBackendUrl: O6n,
      telemBackendUrl: r8e,
      geoCppBackendUrl: this.prodGeoCppUrl,
      cppConfigBackendUrl: xvt,
      cmdkBackendUrl: F6n,
      bcProxyUrl: ghe,
      agentBackendUrlPrivacy: { default: pHh }, // AP_SOUTHEAST_1_PRIVACY_URL
      agentBackendUrlNonPrivacy: { default: gHh }, // AP_SOUTHEAST_1_NON_PRIVACY_URL
      credentialsDisplayName: ServerName.PROD_AP_SOUTHEAST_1_AGENT,
    });
    this.reloginIfNeeded(previousClientId);
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToLocalExceptCppServer() {
    const port = this.localBackendPort();
    const localUrl = LOCALHOST_PREFIX + port;
    const agentUrls = this.getAgentBackendUrls(localUrl);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: LOCAL_WEBSITE_URL,
      backendUrl: localUrl,
      authClientId: DEV_AUTH_CLIENT_ID,
      authDomain: LOCALHOST_PREFIX + port,
      repoBackendUrl: LOCALHOST_PREFIX + port,
      telemBackendUrl: r8e,
      geoCppBackendUrl: this.prodGeoCppUrl,
      cppConfigBackendUrl: xvt,
      cmdkBackendUrl: LOCALHOST_PREFIX + port,
      bcProxyUrl: this.getBcProxyDevUrl(),
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
      credentialsDisplayName: ServerName.LOCAL_EXCEPT_CPP,
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToFullLocalServer() {
    const port = this.localBackendPort();
    const localUrl = LOCALHOST_PREFIX + port;
    const agentUrls = this.getAgentBackendUrls(localUrl);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
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
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToLocalExceptCppAndEmbeddingsServerStagingProd() {
    const port = this.localBackendPort();
    const localUrl = LOCALHOST_PREFIX + port;
    const agentUrls = this.getAgentBackendUrls(localUrl);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
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
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToLocalExceptCppAndEmbeddingsServer() {
    const port = this.localBackendPort();
    const localUrl = LOCALHOST_PREFIX + port;
    const agentUrls = this.getAgentBackendUrls(localUrl);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: LOCAL_WEBSITE_URL,
      backendUrl: localUrl,
      authClientId: DEV_AUTH_CLIENT_ID,
      authDomain: LOCALHOST_PREFIX + port,
      repoBackendUrl: REPO42_BACKEND_URL,
      telemBackendUrl: r8e,
      geoCppBackendUrl: this.prodGeoCppUrl,
      cppConfigBackendUrl: xvt,
      cmdkBackendUrl: LOCALHOST_PREFIX + port,
      bcProxyUrl: this.getBcProxyDevUrl(),
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
      credentialsDisplayName: ServerName.LOCAL_EXCEPT_CPP_AND_EMBEDDINGS,
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToStagingServer() {
    const agentUrls = this.getAgentBackendUrls(STAGING_BACKEND_URL);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: Evt,
      backendUrl: STAGING_BACKEND_URL,
      authClientId: F9t,
      authDomain: O9t,
      repoBackendUrl: STAGING_BACKEND_URL,
      telemBackendUrl: STAGING_BACKEND_URL,
      geoCppBackendUrl: STAGING_BACKEND_URL,
      cppConfigBackendUrl: STAGING_BACKEND_URL,
      cmdkBackendUrl: STAGING_BACKEND_URL,
      bcProxyUrl: STAGING_BACKEND_URL,
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
      credentialsDisplayName: ServerName.STAGING,
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToDevStagingServer() {
    const agentUrls = this.getAgentBackendUrls(DEV_STAGING_BACKEND_URL);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
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
    });
  }

  switchToStagingServerLocalWebsite() {
    const agentUrls = this.getAgentBackendUrls(STAGING_BACKEND_URL);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
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
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  switchToLocalExceptEmbeddingsServer() {
    const port = this.localBackendPort();
    const localUrl = LOCALHOST_PREFIX + port;
    const agentUrls = this.getAgentBackendUrls(localUrl);
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", {
      websiteUrl: LOCAL_WEBSITE_URL,
      backendUrl: localUrl,
      authClientId: DEV_AUTH_CLIENT_ID,
      authDomain: DEV_AUTH_DOMAIN,
      repoBackendUrl: REPO42_BACKEND_URL,
      telemBackendUrl: r8e,
      geoCppBackendUrl: LOCALHOST_PREFIX + port,
      cppConfigBackendUrl: LOCALHOST_PREFIX + port,
      cmdkBackendUrl: LOCALHOST_PREFIX + port,
      bcProxyUrl: this.getBcProxyDevUrl(),
      agentBackendUrlPrivacy: agentUrls.privacy,
      agentBackendUrlNonPrivacy: agentUrls.nonPrivacy,
      credentialsDisplayName: ServerName.LOCAL_EXCEPT_EMBEDDINGS,
    });
    this.updateServerStatusBarOnlyRunsOnLocal();
  }

  // --- URL Getters ---

  getCredentials() {
    return this.getEffectiveCredentials();
  }

  getLoginUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/loginDeepControl`;
  }

  getLogoutUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/api/auth/logout`;
  }

  getPricingUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/pricing`;
  }

  getSettingsUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/dashboard`;
  }

  getBackgroundAgentSettingsUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/dashboard?tab=cloud-agents`;
  }

  getIntegrationsUrl() {
    return `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/dashboard?tab=integrations`;
  }

  getConnectGithubUrl({ authId, githubRepo, useBackgroundComposerEnv }) {
    let baseUrl = this.reactiveStorageService.applicationUserPersistentStorage
      .cursorCreds.websiteUrl;

    if (useBackgroundComposerEnv === true) {
      const bgEnv = this.reactiveStorageService.applicationUserPersistentStorage
        .backgroundComposerEnv ?? "prod";
      if (this.getBackendUrl().includes("localhost") || bgEnv === "dev" || bgEnv === "fullLocal") {
        baseUrl = LOCAL_WEBSITE_URL;
      } else {
        baseUrl = Evt; // PROD_WEBSITE_URL
      }
    }

    return `${baseUrl}/api/auth/connect-github?auth_id=${encodeURIComponent(authId)}&github_repo=${encodeURIComponent(githubRepo ?? "")}&source=BACKGROUND_AGENT`;
  }

  getPollingEndpoint() {
    return `${this.getBackendUrl()}/auth/poll`;
  }

  getBackendUrl() {
    return this.getCredentials().backendUrl;
  }

  getRepoBackendUrl() {
    return this.getCredentials().repoBackendUrl;
  }

  getTelemBackendUrl() {
    return this.getCredentials().telemBackendUrl;
  }

  getGeoCppBackendUrl() {
    return this.getCredentials().geoCppBackendUrl;
  }

  getCppConfigBackendUrl() {
    return this.getCredentials().cppConfigBackendUrl;
  }

  upgradeToPlanOrGetUrl(tier, allowTrial, allowAutomaticPayment) {
    let url = `${this.reactiveStorageService.applicationUserPersistentStorage.cursorCreds.websiteUrl}/api/auth/checkoutDeepControl?tier=${tier}`;
    if (allowTrial === true) url += "&allowTrial=true";
    else if (allowTrial === false) url += "&allowTrial=false";
    if (allowAutomaticPayment === true) url += "&allowAutomaticPayment=true";
    return url;
  }

  setGeoCppBackendUrl(url) {
    if (url === "" || !url.includes("cursor.sh")) {
      url = NUo; // PROD_GEO_CPP_URL (fallback)
    }
    this.prodGeoCppUrl = url;
    this.reactiveStorageService.setApplicationUserPersistentStorage("cursorCreds", creds =>
      creds.credentialsDisplayName !== ServerName.LOCAL_EXCEPT_EMBEDDINGS &&
      creds.credentialsDisplayName !== ServerName.FULL_LOCAL
        ? { ...creds, geoCppBackendUrl: url }
        : creds
    );
  }

  getAgentBackendUrls(backendUrl) {
    if (backendUrl.includes("localhost") || backendUrl.includes("lclhst.build")) {
      return {
        privacy: { default: backendUrl, "us-west-1": backendUrl },
        nonPrivacy: { default: backendUrl, "us-west-1": backendUrl },
      };
    }
    if (backendUrl.includes(STAGING_BACKEND_URL) || backendUrl.includes(DEV_STAGING_BACKEND_URL)) {
      return {
        privacy: { default: backendUrl, "us-west-1": backendUrl },
        nonPrivacy: { default: backendUrl, "us-west-1": backendUrl },
      };
    }
    return {
      privacy: { default: U6n, "us-west-1": q6n },    // PROD_AGENT_PRIVACY_URLS
      nonPrivacy: { default: $6n, "us-west-1": H6n },  // PROD_AGENT_NON_PRIVACY_URLS
    };
  }
};

// DI decorators
CursorCredsService = Ayi = __decorate([
  __param(0, xu),   // IReactiveStorageService
  __param(1, V0),   // IStatusbarService
  __param(2, _c),   // IEnvironmentService
  __param(3, Ci),   // IContextKeyService
  __param(4, sie),  // IClientDebugLogService
], CursorCredsService);

Ki(ICursorCredsService, CursorCredsService, 1); // registerSingleton

// --- Server Environment Enum ---
(function (ServerEnvironment) { // i5
  ServerEnvironment.Prod = "prod";
  ServerEnvironment.ProdEuCentral1Agent = "prodEuCentral1Agent";
  ServerEnvironment.Staging = "staging";
  ServerEnvironment.DevStaging = "devStagingEverything";
  ServerEnvironment.StagingLocalWebsite = "stagingLocalWebsite";
  ServerEnvironment.LocalExceptCppAndEmbeddings = "local";
  ServerEnvironment.LocalExceptCppAndEmbeddingsStaging = "localStaging";
  ServerEnvironment.LocalExceptCPP = "fullLocal";
  ServerEnvironment.LocalExceptEmbeddings = "localExceptEmbeddings";
  ServerEnvironment.FullLocal = "fullLocalincludingcpp";
})(i5 || (i5 = {}));

// Server environment to port mapping
const ServerEnvironmentPorts = { // Otf
  [i5.Prod]: 1814,
  [i5.ProdEuCentral1Agent]: 1813,
  [i5.Staging]: 1815,
  [i5.StagingLocalWebsite]: 1816,
  [i5.LocalExceptCppAndEmbeddings]: 1817,
  [i5.LocalExceptCPP]: 1818,
  [i5.FullLocal]: 1819,
  [i5.LocalExceptEmbeddings]: 1820,
  [i5.DevStaging]: 1821,
  [i5.LocalExceptCppAndEmbeddingsStaging]: 1822,
};

// Register server environment commands
C9A().map(It); // registerServerCommands

// --- SelectBackendCommand ---
// Allows developers to switch backend servers via quick pick.
const SelectBackendCommand = class extends nn { // Utf
  constructor() {
    super({
      id: "cursor.selectBackend",
      title: { value: "Select Backend Server", original: "Select Backend Server" },
      f1: true,
      precondition: ke.or(rw, hN), // ContextKeyExpr.or(isDevBuild, isDevUser)
    });
  }

  async run(accessor) {
    const environmentService = accessor.get(_c); // IEnvironmentService
    const contextKeyService = accessor.get(Ci); // IContextKeyService
    const notificationService = accessor.get(ms); // INotificationService
    const isDevUser = contextKeyService.getContextKeyValue(hN.key) ?? false;

    if (environmentService.isBuilt && !environmentService.isExtensionDevelopment && !isDevUser) {
      notificationService.warn("Backend switching is not available in production builds.");
      return;
    }

    const quickInputService = accessor.get(da); // IQuickInputService
    const credsService = accessor.get(ICursorCredsService);
    const currentServer = credsService.getCredentials().credentialsDisplayName;

    const items = Object.entries(credsService.namingMap)
      .filter(([, handler]) => typeof handler === "function")
      .map(([name]) => ({
        label: name,
        description: name === currentServer ? "Current" : undefined,
      }));

    const picked = await quickInputService.pick(items, {
      placeHolder: "Select backend server to use",
      matchOnDescription: true,
    });

    if (!picked) return;

    const selectedName = picked.label;
    const handler = credsService.namingMap[selectedName];
    if (typeof handler === "function") {
      const previousClientId = credsService.getAuth0ClientId();
      handler();
      credsService.reloginIfNeeded(previousClientId);
    }
  }
};

It(SelectBackendCommand); // registerAction

// --- Symbol Map ---
// rAa  -> CursorCredsService
// NJ   -> ICursorCredsService
// Utf  -> SelectBackendCommand
// B2   -> ServerName
// i5   -> ServerEnvironment
// Otf  -> ServerEnvironmentPorts
// TU   -> STAGING_BACKEND_URL
// nAa  -> REPO42_BACKEND_URL
// sMe  -> DEV_STAGING_BACKEND_URL
// Ont  -> DEV_AUTH_CLIENT_ID
// iAa  -> DEV_AUTH_DOMAIN
// n5   -> LOCALHOST_PREFIX
// Ftf  -> DEFAULT_LOCAL_PORT
// oMe  -> LOCAL_WEBSITE_URL
// Evt  -> PROD_WEBSITE_URL
// ghe  -> PROD_BACKEND_URL
// F9t  -> PROD_AUTH_CLIENT_ID
// O9t  -> PROD_AUTH_DOMAIN
// O6n  -> PROD_REPO_BACKEND_URL
// r8e  -> PROD_TELEM_BACKEND_URL
// xvt  -> PROD_CPP_CONFIG_URL
// F6n  -> PROD_CMDK_BACKEND_URL
// NUo  -> PROD_GEO_CPP_URL
// hHh  -> EU_CENTRAL_1_PRIVACY_URL
// mHh  -> EU_CENTRAL_1_NON_PRIVACY_URL
// pHh  -> AP_SOUTHEAST_1_PRIVACY_URL
// gHh  -> AP_SOUTHEAST_1_NON_PRIVACY_URL
// U6n  -> PROD_AGENT_PRIVACY_DEFAULT_URL
// q6n  -> PROD_AGENT_PRIVACY_US_WEST_1_URL
// $6n  -> PROD_AGENT_NON_PRIVACY_DEFAULT_URL
// H6n  -> PROD_AGENT_NON_PRIVACY_US_WEST_1_URL
// xu   -> IReactiveStorageService
// V0   -> IStatusbarService
// _c   -> IEnvironmentService
// Ci   -> IContextKeyService
// sie  -> IClientDebugLogService
// da   -> IQuickInputService
// ms   -> INotificationService
// hN   -> isDevUserContextKey
// rw   -> isDevBuildContextKey
// Qe   -> Emitter
// at   -> Disposable
// ke   -> ContextKeyExpr
