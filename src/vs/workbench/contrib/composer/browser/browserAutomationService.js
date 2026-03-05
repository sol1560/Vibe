// Source: out-build/vs/workbench/contrib/composer/browser/browserAutomationService.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// This file implements the BrowserAutomationService — manages bookmarks, browsing
// history, navigation requests, zoom levels, and CSS style injection for the
// embedded browser automation feature.

yn(), st(), Uc(), Nc(), ps(), ci(), Er(), Qt(), So(), Sr(), wu(), Up(), K0f();

const IBrowserAutomationService = Bi("browserAutomationService");

/**
 * BrowserAutomationService
 *
 * Manages the embedded browser automation feature in Cursor/Claude Editor.
 * Handles:
 * - Bookmark management (add, remove, rename, reorder, folders)
 * - Browsing history tracking (with visit counts, max 500 entries)
 * - URL navigation requests
 * - DevTools open requests
 * - Per-tab and per-host zoom level persistence
 * - CSS style change injection
 * - Tab state tracking
 */
let BrowserAutomationService = class extends at {
  /** Self-reference for static access within decorators */
  static { qme = this; }

  static { this.STORAGE_KEY_LAST_URL = "browserAutomation.lastUrl"; }
  static { this.STORAGE_KEY_ZOOM_LEVEL = "browserAutomation.zoomLevel"; }
  static { this.STORAGE_KEY_HOST_ZOOM = "browserAutomation.hostZoomLevels"; }
  static { this.STORAGE_KEY_BOOKMARKS = "browserAutomation.bookmarks"; }
  static { this.STORAGE_KEY_HISTORY = "browserAutomation.history"; }
  static { this.MAX_HISTORY_ENTRIES = 500; }

  constructor(
    commandService,
    notificationService,
    storageService,
    extensionService,
    contextKeyService,
    lifecycleService
  ) {
    super();
    this.commandService = commandService;
    this.notificationService = notificationService;
    this.storageService = storageService;
    this.extensionService = extensionService;
    this.contextKeyService = contextKeyService;
    this.lifecycleService = lifecycleService;

    // --- Events ---

    /** Fired when a URL navigation is requested */
    this._onNavigateRequest = this._register(new Qe());
    this.onNavigateRequest = this._onNavigateRequest.event;

    /** Fired when DevTools open is requested */
    this._onDevToolsRequest = this._register(new Qe());
    this.onDevToolsRequest = this._onDevToolsRequest.event;
    this._pendingDevToolsRequest = false;

    /** Bookmark change events */
    this._onDidAddBookmark = this._register(new Qe());
    this.onDidAddBookmark = this._onDidAddBookmark.event;

    this._onDidRemoveBookmark = this._register(new Qe());
    this.onDidRemoveBookmark = this._onDidRemoveBookmark.event;

    this._onDidReorderBookmarks = this._register(new Qe());
    this.onDidReorderBookmarks = this._onDidReorderBookmarks.event;

    this._onDidChangeBookmarkBar = this._register(new Qe());
    this.onDidChangeBookmarkBar = this._onDidChangeBookmarkBar.event;

    /** History change event */
    this._onDidChangeHistory = this._register(new Qe());
    this.onDidChangeHistory = this._onDidChangeHistory.event;

    // --- Observable state ---

    /** Whether browser automation is enabled */
    this._settableEnabled = Ma("BrowserAutomationService.enabled", true);
    this.enabled = this._settableEnabled;

    /** CSS style changes to inject into the browser */
    this._settableCssStyleChanges = Ma("BrowserAutomationService.cssStyleChanges", []);
    this.cssStyleChanges = this._settableCssStyleChanges;

    /** Context key for enabled state */
    this._enabledContextKey = phu.bindTo(this.contextKeyService);
    this._enabledContextKey.set(this._settableEnabled.get());

    /** Current tab state */
    this.tabState = Ma("BrowserAutomationService.tabState", void 0);
  }

  // --- Storage key helpers ---

  getStorageKey(browserId, key) {
    return browserId
      ? `browserAutomation.${browserId}.${key}`
      : `browserAutomation.${key}`;
  }

  // --- URL persistence ---

  getLastUrl(browserId) {
    return this.storageService.get(this.getStorageKey(browserId, "lastUrl"), 1);
  }

  saveLastUrl(url, browserId) {
    this.storageService.store(this.getStorageKey(browserId, "lastUrl"), url, 1, 1);
  }

  // --- Zoom level management ---

  getSavedZoomLevel(browserId) {
    const level = this.storageService.getNumber(
      this.getStorageKey(browserId, "zoomLevel"),
      1
    );
    return level !== void 0 ? level : void 0;
  }

  saveZoomLevel(level, browserId) {
    this.storageService.store(this.getStorageKey(browserId, "zoomLevel"), level, 1, 1);
  }

  /** Get per-host zoom level */
  getHostZoomLevel(hostname) {
    const raw = this.storageService.get(qme.STORAGE_KEY_HOST_ZOOM, 0);
    if (raw) {
      try {
        const levels = JSON.parse(raw);
        return typeof levels[hostname] === "number" ? levels[hostname] : void 0;
      } catch {
        return;
      }
    }
  }

  /** Save per-host zoom level (0 removes the entry) */
  saveHostZoomLevel(hostname, level) {
    const raw = this.storageService.get(qme.STORAGE_KEY_HOST_ZOOM, 0);
    let levels = {};
    if (raw) {
      try {
        levels = JSON.parse(raw);
      } catch {
        levels = {};
      }
    }
    if (level === 0) {
      delete levels[hostname];
    } else {
      levels[hostname] = level;
    }
    this.storageService.store(qme.STORAGE_KEY_HOST_ZOOM, JSON.stringify(levels), 0, 1);
  }

  // --- Bookmark management ---

  /** Get all bookmark bar items (bookmarks + folders) */
  getBookmarkBarItems(storageScope = 1) {
    const raw = this.storageService.get(qme.STORAGE_KEY_BOOKMARKS, storageScope);
    if (!raw) return [];
    try {
      const items = JSON.parse(raw);
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  /** Save bookmark bar items to storage */
  saveBookmarkBarItems(items, storageScope = 1) {
    this.saveItems(items, storageScope);
    this._onDidChangeBookmarkBar.fire();
  }

  /** Create a new bookmark folder */
  createBookmarkFolder(name, storageScope = 1) {
    return {
      type: "folder",
      id: Gr(),
      name,
      children: [],
    };
  }

  /** Get all bookmarks (flattened from folders) */
  getBookmarks(storageScope = 1) {
    const barItems = this.getBookmarkBarItems(storageScope);
    const bookmarks = [];
    for (const item of barItems) {
      if (jF(item)) {
        bookmarks.push(...item.children);
      } else {
        bookmarks.push(item);
      }
    }
    return bookmarks;
  }

  /** Add a bookmark (deduplicates by URL) */
  addBookmark(url, title, favicon, customName, storageScope = 1) {
    const barItems = this.getBookmarkBarItems(storageScope);
    const existingIdx = this.getBookmarks(storageScope).findIndex((b) => b.url === url);

    if (existingIdx === -1) {
      const bookmark = {
        url,
        title,
        favicon,
        timestamp: Date.now(),
        customName,
      };
      barItems.push(bookmark);
      this.saveItems(barItems, storageScope);
      this._onDidAddBookmark.fire(bookmark);
    }
  }

  /** Remove a bookmark by URL (handles folders) */
  removeBookmark(url, storageScope = 1) {
    const barItems = this.getBookmarkBarItems(storageScope);
    let removed = false;

    const filtered = barItems
      .filter((item) => {
        if (!jF(item) && item.url === url) {
          removed = true;
          return false;
        }
        return true;
      })
      .map((item) => {
        if (jF(item)) {
          const filteredChildren = item.children.filter((child) => child.url !== url);
          if (filteredChildren.length !== item.children.length) {
            removed = true;
            return { ...item, children: filteredChildren };
          }
        }
        return item;
      });

    if (removed) {
      this.saveItems(filtered, storageScope);
      this._onDidRemoveBookmark.fire(url);
    }
  }

  /** Reorder bookmarks (keeps folders at end) */
  reorderBookmarks(newOrder, storageScope = 1) {
    const barItems = this.getBookmarkBarItems(storageScope);
    const folders = barItems.filter(jF);

    // Collect URLs that are inside folders
    const folderUrls = new Set();
    for (const folder of folders) {
      for (const child of folder.children) {
        folderUrls.add(child.url);
      }
    }

    // Filter out items already in folders
    const topLevelBookmarks = newOrder.filter((item) => !folderUrls.has(item.url));
    const reordered = [...topLevelBookmarks, ...folders];

    this.saveItems(reordered, storageScope);
    this._onDidReorderBookmarks.fire(topLevelBookmarks);
  }

  /** Check if a URL is bookmarked */
  isBookmarked(url, storageScope = 1) {
    return this.getBookmarkBarItems(storageScope).some((item) =>
      jF(item) ? item.children.some((child) => child.url === url) : item.url === url
    );
  }

  /** Rename a bookmark's custom name */
  renameBookmark(url, newName, storageScope = 1) {
    const barItems = this.getBookmarkBarItems(storageScope);
    let updatedBookmark;

    const updated = barItems.map((item) => {
      if (!jF(item) && item.url === url) {
        updatedBookmark = { ...item, customName: newName };
        return updatedBookmark;
      }
      if (jF(item)) {
        const updatedChildren = item.children.map((child) => {
          if (child.url === url) {
            updatedBookmark = { ...child, customName: newName };
            return updatedBookmark;
          }
          return child;
        });
        if (updatedBookmark) {
          return { ...item, children: updatedChildren };
        }
      }
      return item;
    });

    if (updatedBookmark) {
      this.saveItems(updated, storageScope);
      this._onDidAddBookmark.fire(updatedBookmark);
    }
  }

  /** Internal: persist items to storage */
  saveItems(items, storageScope) {
    this.storageService.store(
      qme.STORAGE_KEY_BOOKMARKS,
      JSON.stringify(items),
      storageScope,
      1
    );
  }

  // --- History management ---

  /** Get browsing history */
  getHistory() {
    const raw = this.storageService.get(qme.STORAGE_KEY_HISTORY, 0);
    if (!raw) return [];
    try {
      const history = JSON.parse(raw);
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  }

  /** Add or update a history entry (deduplicates by URL, tracks visit count) */
  addHistoryEntry(url, title, favicon) {
    if (!url) return;

    const history = this.getHistory();
    const existingIdx = history.findIndex((entry) => entry.url === url);

    if (existingIdx !== -1) {
      // Update existing entry
      const existing = history[existingIdx];
      existing.visitCount += 1;
      existing.lastVisited = Date.now();
      if (title) existing.title = title;
      if (favicon) existing.favicon = favicon;

      // Move to top (most recent)
      history.splice(existingIdx, 1);
      history.unshift(existing);
    } else {
      // Add new entry at top
      const newEntry = {
        url,
        title: title || url,
        favicon: favicon || "",
        visitCount: 1,
        lastVisited: Date.now(),
      };
      history.unshift(newEntry);
    }

    // Trim to max entries
    if (history.length > qme.MAX_HISTORY_ENTRIES) {
      history.sort((a, b) => b.lastVisited - a.lastVisited);
      history.length = qme.MAX_HISTORY_ENTRIES;
    }

    this.storageService.store(qme.STORAGE_KEY_HISTORY, JSON.stringify(history), 0, 1);
    this._onDidChangeHistory.fire();
  }

  /** Remove a single history entry by URL */
  removeHistoryEntry(url) {
    const history = this.getHistory();
    const filtered = history.filter((entry) => entry.url !== url);
    if (filtered.length !== history.length) {
      this.storageService.store(qme.STORAGE_KEY_HISTORY, JSON.stringify(filtered), 0, 1);
      this._onDidChangeHistory.fire();
    }
  }

  /** Clear all browsing history */
  clearHistory() {
    this.storageService.store(qme.STORAGE_KEY_HISTORY, JSON.stringify([]), 0, 1);
    this._onDidChangeHistory.fire();
  }

  // --- Navigation ---

  /** Request navigation to a URL in the embedded browser */
  requestNavigation(url, targetBrowserId) {
    this._onNavigateRequest.fire({ url, targetBrowserId });
  }

  // --- DevTools ---

  /** Request DevTools to be opened */
  requestDevToolsOpen() {
    this._pendingDevToolsRequest = true;
    this._onDevToolsRequest.fire();
  }

  hasPendingDevToolsRequest() {
    return this._pendingDevToolsRequest;
  }

  clearPendingDevToolsRequest() {
    this._pendingDevToolsRequest = false;
  }

  // --- CSS injection ---

  /** Set CSS style changes to inject into the browser content */
  setCssStyleChanges(changes) {
    this._settableCssStyleChanges.set(changes, void 0);
  }
};

// DI registration
BrowserAutomationService = qme = __decorate(
  [
    __param(0, br), // ICommandService
    __param(1, ms), // INotificationService
    __param(2, Ji), // IStorageService
    __param(3, eu), // IExtensionService
    __param(4, Ci), // IContextKeyService
    __param(5, up), // ILifecycleService
  ],
  BrowserAutomationService
);

Ki(IBrowserAutomationService, BrowserAutomationService, 1, 1);
