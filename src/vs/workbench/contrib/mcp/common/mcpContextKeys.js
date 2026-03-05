// Source: out-build/vs/workbench/contrib/mcp/common/mcpContextKeys.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

st(), Uc(), Wt(), ci(), yF(), Mqe();

// === MCP Context Keys ===
var McpContextKeys;
(function (keys) {
  keys.serverCount = new kn("mcp.serverCount", undefined, {
    type: "number",
    description: _(8770, null), // "Number of MCP servers"
  });

  keys.hasUnknownTools = new kn("mcp.hasUnknownTools", undefined, {
    type: "boolean",
    description: _(8771, null), // "Whether any MCP servers have unknown tools"
  });

  keys.hasServersWithErrors = new kn("mcp.hasServersWithErrors", undefined, {
    type: "boolean",
    description: _(8772, null), // "Whether any MCP servers have errors"
  });

  keys.toolsCount = new kn("mcp.toolsCount", undefined, {
    type: "number",
    description: _(8773, null), // "Total number of MCP tools"
  });
})(McpContextKeys || (McpContextKeys = {}));

/**
 * McpContextKeyController
 *
 * Maintains context keys for MCP server state, including:
 * - Server count
 * - Total tools count
 * - Whether any servers have unknown/pending tools
 * - Whether any servers are in error state
 */
let McpContextKeyController = class extends at {
  static { this.ID = "workbench.contrib.mcp.contextKey"; }

  constructor(mcpService, contextKeyService) {
    super();

    const serverCountKey = McpContextKeys.serverCount.bindTo(contextKeyService);
    const toolsCountKey = McpContextKeys.toolsCount.bindTo(contextKeyService);
    const hasUnknownToolsKey = McpContextKeys.hasUnknownTools.bindTo(contextKeyService);

    // Reactive binding for hasServersWithErrors
    this._store.add(
      ZN(McpContextKeys.hasServersWithErrors, contextKeyService, (reader) =>
        mcpService.servers
          .read(reader)
          .some(
            (server) => server.connectionState.read(reader).state === 3 /* Error */
          )
      )
    );

    // Reactive binding for server count, tools count, and unknown tools
    this._store.add(
      Oc((reader) => {
        const servers = mcpService.servers.read(reader);
        const serverTools = servers.map((server) => server.tools.read(reader));

        serverCountKey.set(servers.length);
        toolsCountKey.set(
          serverTools.reduce((total, tools) => total + tools.length, 0)
        );

        hasUnknownToolsKey.set(
          mcpService.lazyCollectionState.read(reader) !== 2 /* AllKnown */ ||
            servers.some((server) => {
              if (server.trusted.read(reader) === false) return false;
              const toolState = server.toolsState.read(reader);
              return toolState === 0 /* Unknown */ || toolState === 2 /* RefreshingFromUnknown */;
            })
        );
      })
    );
  }
};

McpContextKeyController = __decorate(
  [
    __param(0, Xye), // IMcpService
    __param(1, Ci),  // IContextKeyService
  ],
  McpContextKeyController
);
