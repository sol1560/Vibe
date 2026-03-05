// Source: out-build/vs/workbench/contrib/composer/browser/usageDataService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the UsageDataService — fetches and caches
// plan usage data, spend limits, and plan info from the dashboard API.

st(), Di(), Qt(), Er(), dL(), gb(), Pd();

const IUsageDataService = Bi("usageDataService");

/**
 * UsageDataService
 *
 * Manages plan usage data polling and caching for the composer UI.
 * Features:
 * - Auto-refresh every 5 minutes (30 min retry on error)
 * - 30-second cache for data freshness
 * - Consumer counting — only polls when UI is visible
 * - Plan info (tier, price, included amount)
 * - Usage data (spend tracking, percentage used)
 * - Spend limit tracking (individual limits)
 * - Display message data from server
 */
let UsageDataService = class extends at {
  constructor(cursorAuthenticationService, reactiveStorageService) {
    super();
    this.cursorAuthenticationService = cursorAuthenticationService;
    this.reactiveStorageService = reactiveStorageService;

    // Refresh intervals
    this.refreshInterval = 300 * 1000; // 5 minutes
    this.retryInterval = 1800 * 1000; // 30 minutes
    this.CACHE_DURATION = 30 * 1000; // 30 seconds
    this.PLAN_INFO_CACHE_DURATION = 30 * 1000; // 30 seconds

    // Cache timestamps
    this.lastFetchTime = 0;
    this.lastPlanInfoFetchTime = 0;

    // Refresh state
    this.autoRefreshActive = false;
    this.activeConsumers = 0;
    this.fetchInProgress = null;
    this.planInfoFetchInProgress = null;

    // Create reactive scoped context
    this._register(this.reactiveStorageService.createScoped(this));

    // Reactive state signals
    const [planUsage, setPlanUsage] = dt(null);
    const [spendLimitUsage, setSpendLimitUsage] = dt(null);
    const [planInfo, setPlanInfo] = dt(null);
    const [nextUpgrade, setNextUpgrade] = dt(null);
    const [isLoading, setIsLoading] = dt(false);
    const [error, setError] = dt(null);
    const [displayMessage, setDisplayMessage] = dt(null);
    const [autoModelSelectedDisplayMessage, setAutoModelSelectedDisplayMessage] = dt(null);
    const [namedModelSelectedDisplayMessage, setNamedModelSelectedDisplayMessage] = dt(null);
    const [autoBucketModels, setAutoBucketModels] = dt([]);
    const [usageDisplayEnabled, setUsageDisplayEnabled] = dt(true);

    this.displayMessageData = displayMessage;
    this.setDisplayMessageData = setDisplayMessage;
    this.autoModelSelectedDisplayMessageData = autoModelSelectedDisplayMessage;
    this.setAutoModelSelectedDisplayMessageData = setAutoModelSelectedDisplayMessage;
    this.namedModelSelectedDisplayMessageData = namedModelSelectedDisplayMessage;
    this.setNamedModelSelectedDisplayMessageData = setNamedModelSelectedDisplayMessage;
    this.autoBucketModelsData = autoBucketModels;
    this.setAutoBucketModelsData = setAutoBucketModels;
    this.planUsageData = planUsage;
    this.setPlanUsageData = setPlanUsage;
    this.spendLimitUsageData = spendLimitUsage;
    this.setSpendLimitUsageData = setSpendLimitUsage;
    this.planInfoData = planInfo;
    this.setPlanInfoData = setPlanInfo;
    this.nextUpgradeData = nextUpgrade;
    this.setNextUpgradeData = setNextUpgrade;
    this.isLoadingData = isLoading;
    this.setIsLoading = setIsLoading;
    this.errorData = error;
    this.setError = setError;
    this.usageDisplayEnabledData = usageDisplayEnabled;
    this.setUsageDisplayEnabled = setUsageDisplayEnabled;

    // Listen for login changes
    const onLoginChanged = (isLoggedIn) => {
      this.clearCachedData();
      if (isLoggedIn) {
        if (this.activeConsumers > 0 && !this.autoRefreshActive) {
          this.startAutoRefresh();
        }
      } else {
        this.stopAutoRefresh();
      }
    };

    this.cursorAuthenticationService.addLoginChangedListener(onLoginChanged);
    this._register({
      dispose: () => {
        this.cursorAuthenticationService.removeLoginChangedListener(onLoginChanged);
      },
    });
  }

  // --- Reactive getters ---

  get displayMessage() {
    return this.displayMessageData;
  }
  get autoModelSelectedDisplayMessage() {
    return this.autoModelSelectedDisplayMessageData;
  }
  get namedModelSelectedDisplayMessage() {
    return this.namedModelSelectedDisplayMessageData;
  }
  get autoBucketModels() {
    return this.autoBucketModelsData;
  }
  get planUsage() {
    return this.planUsageData;
  }
  get spendLimitUsage() {
    return this.spendLimitUsageData;
  }
  get planInfo() {
    return this.planInfoData;
  }
  get nextUpgrade() {
    return this.nextUpgradeData;
  }
  get isLoading() {
    return this.isLoadingData;
  }
  get error() {
    return this.errorData;
  }
  get usageDisplayEnabled() {
    return this.usageDisplayEnabledData;
  }
  get hasCachedData() {
    return () => this.planUsageData() !== null || this.planInfoData() !== null;
  }

  // --- Data fetching ---

  async refetch(force = false) {
    if (!this.cursorAuthenticationService.isAuthenticated()) return;

    // Always fetch plan info in parallel
    const planInfoPromise = this.fetchPlanInfo(force).catch((error) => {
      console.error("[UsageDataService] Plan info fetch failed:", error);
    });

    if (this.fetchInProgress) {
      await planInfoPromise;
      return this.fetchInProgress;
    }

    const now = Date.now();
    if (now - this.lastFetchTime < this.CACHE_DURATION && !this.errorData() && !force) {
      await planInfoPromise;
      return;
    }

    this.fetchInProgress = this.performFetch(now);
    try {
      await Promise.all([this.fetchInProgress, planInfoPromise]);
    } finally {
      this.fetchInProgress = null;
    }
  }

  async prefetch() {
    if (!this.cursorAuthenticationService.isAuthenticated()) return;

    const now = Date.now();
    this.fetchPlanInfo(false).catch((error) => {
      console.error("[UsageDataService] Prefetch plan info failed:", error);
    });

    this.fetchInProgress = this.performFetchSilent(now);
    try {
      await this.fetchInProgress;
    } finally {
      this.fetchInProgress = null;
    }
  }

  // --- Internal fetch (silent — no loading indicator) ---

  async performFetchSilent(timestamp) {
    this.setError(null);
    try {
      const client = await this.cursorAuthenticationService.dashboardClient();
      const response = await client.getCurrentPeriodUsage(new Mga());

      this.setUsageDisplayEnabled(response.enabled);
      this.setAutoBucketModelsData(response.autoBucketModels ?? []);

      if (response.enabled) {
        this.setDisplayMessageData(response.displayMessage);
        this.setAutoModelSelectedDisplayMessageData(
          response.autoModelSelectedDisplayMessage ?? null
        );
        this.setNamedModelSelectedDisplayMessageData(
          response.namedModelSelectedDisplayMessage ?? null
        );
      } else {
        this.setDisplayMessageData(null);
        this.setAutoModelSelectedDisplayMessageData(null);
        this.setNamedModelSelectedDisplayMessageData(null);
      }

      if (response.planUsage && response.planUsage.limit > 0) {
        const total = response.planUsage.totalSpend / 100;
        const used = response.planUsage.includedSpend / 100;
        const bonus = response.planUsage.bonusSpend / 100;
        const limit = response.planUsage.limit / 100;
        const autoUsed =
          response.planUsage.autoSpend !== void 0
            ? response.planUsage.autoSpend / 100
            : void 0;
        const apiUsed =
          response.planUsage.apiSpend !== void 0
            ? response.planUsage.apiSpend / 100
            : void 0;
        const usedPercentage = Math.min((used / limit) * 100, 100);

        this.setPlanUsageData({
          total,
          used,
          bonus,
          limit,
          bonusRemaining: response.planUsage?.remainingBonus ?? false,
          bonusTooltip: response.planUsage?.bonusTooltip,
          usedPercentage,
          displayThreshold: response.displayThreshold ?? 50,
          billingCycleEnd: Number(response.billingCycleEnd),
          autoUsed,
          apiUsed,
          autoPercentUsed: response.planUsage.autoPercentUsed,
          apiPercentUsed: response.planUsage.apiPercentUsed,
          totalPercentUsed: response.planUsage.totalPercentUsed,
        });
      } else {
        this.setPlanUsageData(null);
      }

      if (response.spendLimitUsage) {
        const used = response.spendLimitUsage.individualUsed / 100;
        const limit = (response.spendLimitUsage.individualLimit ?? 0) / 100;
        const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        this.setSpendLimitUsageData({ used, limit, percentage });
      } else {
        this.setSpendLimitUsageData(null);
      }

      this.lastFetchTime = timestamp;
    } catch (error) {
      console.error(
        "[UsageDataService] Failed to prefetch current period usage:",
        error
      );
      this.setError(
        error instanceof Error ? error.message : "Failed to fetch usage data"
      );
    }
  }

  // --- Plan info fetch ---

  async fetchPlanInfo(force = false) {
    if (!this.cursorAuthenticationService.isAuthenticated()) return;
    if (this.planInfoFetchInProgress) return this.planInfoFetchInProgress;

    const now = Date.now();
    if (!force && now - this.lastPlanInfoFetchTime < this.PLAN_INFO_CACHE_DURATION) return;

    this.planInfoFetchInProgress = this.performPlanInfoFetch(now);
    try {
      await this.planInfoFetchInProgress;
    } finally {
      this.planInfoFetchInProgress = null;
    }
  }

  async performPlanInfoFetch(timestamp) {
    const client = await this.cursorAuthenticationService.dashboardClient();
    const response = await client.getPlanInfo(new Knu());

    if (response.planInfo) {
      this.setPlanInfoData({
        planName: response.planInfo.planName,
        includedAmount: response.planInfo.includedAmountCents / 100,
        price: response.planInfo.price ?? void 0,
        billingCycleEnd:
          response.planInfo.billingCycleEnd !== void 0
            ? Number(response.planInfo.billingCycleEnd)
            : void 0,
      });
    } else {
      this.setPlanInfoData(null);
    }

    if (response.nextUpgrade && response.nextUpgrade.tier) {
      this.setNextUpgradeData({
        tier: response.nextUpgrade.tier,
        name: response.nextUpgrade.name,
        amount: response.nextUpgrade.includedAmountCents / 100,
        price: response.nextUpgrade.price,
        description: response.nextUpgrade.description,
      });
    } else {
      this.setNextUpgradeData(null);
    }

    this.lastPlanInfoFetchTime = timestamp;
  }

  // --- Main fetch (with loading indicator) ---

  async performFetch(timestamp) {
    this.setIsLoading(true);
    this.setError(null);
    try {
      const client = await this.cursorAuthenticationService.dashboardClient();
      const response = await client.getCurrentPeriodUsage(new Mga());

      this.setUsageDisplayEnabled(response.enabled);
      this.setAutoBucketModelsData(response.autoBucketModels ?? []);

      if (response.enabled) {
        this.setDisplayMessageData(response.displayMessage);
        this.setAutoModelSelectedDisplayMessageData(
          response.autoModelSelectedDisplayMessage ?? null
        );
        this.setNamedModelSelectedDisplayMessageData(
          response.namedModelSelectedDisplayMessage ?? null
        );
      } else {
        this.setDisplayMessageData(null);
        this.setAutoModelSelectedDisplayMessageData(null);
        this.setNamedModelSelectedDisplayMessageData(null);
      }

      if (response.planUsage && response.planUsage.limit > 0) {
        const total = response.planUsage.totalSpend / 100;
        const used = response.planUsage.includedSpend / 100;
        const bonus = response.planUsage.bonusSpend / 100;
        const limit = response.planUsage.limit / 100;
        const autoUsed =
          response.planUsage.autoSpend !== void 0
            ? response.planUsage.autoSpend / 100
            : void 0;
        const apiUsed =
          response.planUsage.apiSpend !== void 0
            ? response.planUsage.apiSpend / 100
            : void 0;
        const usedPercentage = Math.min((used / limit) * 100, 100);

        this.setPlanUsageData({
          total,
          used,
          bonus,
          limit,
          bonusRemaining: response.planUsage?.remainingBonus ?? false,
          bonusTooltip: response.planUsage?.bonusTooltip,
          usedPercentage,
          displayThreshold: response.displayThreshold ?? 50,
          billingCycleEnd: Number(response.billingCycleEnd),
          autoUsed,
          apiUsed,
          autoPercentUsed: response.planUsage.autoPercentUsed,
          apiPercentUsed: response.planUsage.apiPercentUsed,
          totalPercentUsed: response.planUsage.totalPercentUsed,
        });
      } else {
        this.setPlanUsageData(null);
      }

      if (response.spendLimitUsage) {
        const used = response.spendLimitUsage.individualUsed / 100;
        const limit = (response.spendLimitUsage.individualLimit ?? 0) / 100;
        const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        this.setSpendLimitUsageData({ used, limit, percentage });
      } else {
        this.setSpendLimitUsageData(null);
      }

      this.lastFetchTime = timestamp;
    } catch (error) {
      console.error("[UsageDataService] Failed to fetch current period usage:", error);
      this.setError(
        error instanceof Error ? error.message : "Failed to fetch usage data"
      );
      this.setPlanUsageData(null);
      this.setSpendLimitUsageData(null);
      this.setDisplayMessageData(null);
    } finally {
      this.setIsLoading(false);
    }
  }

  // --- Consumer management (reference counting for auto-refresh) ---

  addConsumer() {
    this.activeConsumers++;
    if (
      this.activeConsumers === 1 &&
      !this.autoRefreshActive &&
      this.cursorAuthenticationService.isAuthenticated()
    ) {
      this.startAutoRefresh();
    }
  }

  removeConsumer() {
    this.activeConsumers = Math.max(0, this.activeConsumers - 1);
    if (this.activeConsumers === 0 && this.autoRefreshActive) {
      this.stopAutoRefresh();
    }
  }

  // --- Auto-refresh loop ---

  startAutoRefresh() {
    if (
      this.autoRefreshActive ||
      !this.cursorAuthenticationService.isAuthenticated()
    )
      return;

    this.stopAutoRefresh();
    this.autoRefreshActive = true;

    const scheduleNext = () => {
      if (
        !this.autoRefreshActive ||
        this.activeConsumers === 0 ||
        !this.cursorAuthenticationService.isAuthenticated()
      )
        return;

      const interval = this.errorData() ? this.retryInterval : this.refreshInterval;

      this.timeoutId = setTimeout(async () => {
        if (
          this.autoRefreshActive &&
          this.activeConsumers > 0 &&
          this.cursorAuthenticationService.isAuthenticated()
        ) {
          await this.refetch();
          scheduleNext();
        }
      }, interval);
    };

    scheduleNext();
  }

  stopAutoRefresh() {
    this.autoRefreshActive = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = void 0;
    }
  }

  // --- Cache management ---

  clearCachedData() {
    this.setPlanUsageData(null);
    this.setSpendLimitUsageData(null);
    this.setDisplayMessageData(null);
    this.setAutoModelSelectedDisplayMessageData(null);
    this.setNamedModelSelectedDisplayMessageData(null);
    this.setAutoBucketModelsData([]);
    this.setPlanInfoData(null);
    this.setNextUpgradeData(null);
    this.setError(null);
    this.setUsageDisplayEnabled(true);
    this.lastFetchTime = 0;
    this.lastPlanInfoFetchTime = 0;
    this.planInfoFetchInProgress = null;
  }

  dispose() {
    this.stopAutoRefresh();
    super.dispose();
  }
};

// DI registration
UsageDataService = __decorate(
  [
    __param(0, ag), // ICursorAuthenticationService
    __param(1, xu), // IReactiveStorageService
  ],
  UsageDataService
);

Ki(IUsageDataService, UsageDataService, 1);
