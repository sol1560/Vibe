// Source: out-build/vs/workbench/contrib/mcp/common/mcpTypes.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Pv(), ap(), zs(), Xn(), Wt(), JA(), Qt();

// === Extension prefix ===
const MCP_EXTENSION_PREFIX = "ext.";

// === MCP Server Source enum ===
// Defines where the MCP server config comes from
var McpServerSource;
(function (source) {
  source[(source.WorkspaceFolder = 0)] = "WorkspaceFolder";
  source[(source.Workspace = 100)] = "Workspace";
  source[(source.User = 200)] = "User";
  source[(source.Extension = 300)] = "Extension";
  source[(source.Filesystem = 400)] = "Filesystem";
  source[(source.RemoteBoost = -50)] = "RemoteBoost";
})(McpServerSource || (McpServerSource = {}));

// === MCP Server Definition comparison ===
var McpServerDefinition;
(function (def) {
  function equals(a, b) {
    return (
      a.id === b.id &&
      a.remoteAuthority === b.remoteAuthority &&
      a.label === b.label &&
      a.isTrustedByDefault === b.isTrustedByDefault
    );
  }
  def.equals = equals;
})(McpServerDefinition || (McpServerDefinition = {}));

// === MCP Server Config serialization ===
var McpServerConfig;
(function (config) {
  function toSerialized(serverConfig) {
    return serverConfig;
  }
  config.toSerialized = toSerialized;

  function fromSerialized(serialized) {
    return {
      id: serialized.id,
      label: serialized.label,
      launch: McpLaunchConfig.fromSerialized(serialized.launch),
      variableReplacement: serialized.variableReplacement
        ? McpVariableReplacement.fromSerialized(serialized.variableReplacement)
        : undefined,
    };
  }
  config.fromSerialized = fromSerialized;

  function equals(a, b) {
    return (
      a.id === b.id &&
      a.label === b.label &&
      lg(a.roots, b.roots, (rootA, rootB) => rootA.toString() === rootB.toString()) &&
      pv(a.launch, b.launch) &&
      pv(a.presentation, b.presentation) &&
      pv(a.variableReplacement, b.variableReplacement)
    );
  }
  config.equals = equals;
})(McpServerConfig || (McpServerConfig = {}));

// === MCP Variable Replacement serialization ===
var McpVariableReplacement;
(function (varReplace) {
  function toSerialized(data) {
    return data;
  }
  varReplace.toSerialized = toSerialized;

  function fromSerialized(serialized) {
    return {
      section: serialized.section,
      folder: serialized.folder
        ? { ...serialized.folder, uri: je.revive(serialized.folder.uri) }
        : undefined,
      target: serialized.target,
    };
  }
  varReplace.fromSerialized = fromSerialized;
})(McpVariableReplacement || (McpVariableReplacement = {}));

// === MCP Tool Discovery State enum ===
var McpToolDiscoveryState;
(function (state) {
  state[(state.HasUnknown = 0)] = "HasUnknown";
  state[(state.LoadingUnknown = 1)] = "LoadingUnknown";
  state[(state.AllKnown = 2)] = "AllKnown";
})(McpToolDiscoveryState || (McpToolDiscoveryState = {}));

// === Service identifier ===
const IMcpService = Bi("IMcpService");

// === MCP Tool State enum ===
var McpToolState;
(function (state) {
  state[(state.Unknown = 0)] = "Unknown";
  state[(state.Cached = 1)] = "Cached";
  state[(state.RefreshingFromUnknown = 2)] = "RefreshingFromUnknown";
  state[(state.RefreshingFromCached = 3)] = "RefreshingFromCached";
  state[(state.Live = 4)] = "Live";
})(McpToolState || (McpToolState = {}));

// === MCP Transport Type enum ===
var McpTransportType;
(function (transport) {
  transport[(transport.Stdio = 1)] = "Stdio";
  transport[(transport.SSE = 2)] = "SSE";
})(McpTransportType || (McpTransportType = {}));

// === MCP Launch Config serialization ===
var McpLaunchConfig;
(function (launch) {
  function toSerialized(config) {
    return config;
  }
  launch.toSerialized = toSerialized;

  function fromSerialized(serialized) {
    switch (serialized.type) {
      case 2: // SSE
        return {
          type: serialized.type,
          uri: je.revive(serialized.uri),
          headers: serialized.headers,
        };
      case 1: // Stdio
        return {
          type: serialized.type,
          cwd: serialized.cwd ? je.revive(serialized.cwd) : undefined,
          command: serialized.command,
          args: serialized.args,
          env: serialized.env,
          envFile: serialized.envFile,
        };
    }
  }
  launch.fromSerialized = fromSerialized;
})(McpLaunchConfig || (McpLaunchConfig = {}));

// === MCP Connection State ===
var McpConnectionState;
(function (connState) {
  let Kind;
  (function (kind) {
    kind[(kind.Stopped = 0)] = "Stopped";
    kind[(kind.Starting = 1)] = "Starting";
    kind[(kind.Running = 2)] = "Running";
    kind[(kind.Error = 3)] = "Error";
  })((Kind = connState.Kind || (connState.Kind = {})));

  connState.toString = (state) => {
    switch (state.state) {
      case 0:
        return _(8791, null); // "Stopped"
      case 1:
        return _(8792, null); // "Starting"
      case 2:
        return _(8793, null); // "Running"
      case 3:
        return _(8794, null, state.message); // "Error: {0}"
      default:
        WN(state);
    }
  };

  connState.toKindString = (kind) => {
    switch (kind) {
      case 0:
        return "stopped";
      case 1:
        return "starting";
      case 2:
        return "running";
      case 3:
        return "error";
      default:
        WN(kind);
    }
  };

  connState.canBeStarted = (kind) => kind === 3 || kind === 0;
  connState.isRunning = (state) => !connState.canBeStarted(state.state);
})(McpConnectionState || (McpConnectionState = {}));

// === MCP Error types ===
class McpError extends Error {
  constructor(message, code, data) {
    super(`MPC ${code}: ${message}`);
    this.code = code;
    this.data = data;
  }
}

class McpTimeoutError extends Error {}
