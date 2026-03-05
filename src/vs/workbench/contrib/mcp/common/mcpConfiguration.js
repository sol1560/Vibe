// Source: out-build/vs/workbench/contrib/mcp/common/mcpConfiguration.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js
// Brand references: cursor- → claude-

Wt(), g8(), Qpu();

// === MCP Collection event prefix ===
const MCP_COLLECTION_EVENT_PREFIX = "onMcpCollection:";
const getMcpCollectionEventId = (collectionId) =>
  MCP_COLLECTION_EVENT_PREFIX + collectionId;

// === Example MCP server config ===
const EXAMPLE_STDIO_CONFIG = {
  command: "node",
  args: ["my-mcp-server.js"],
  env: {},
};

// === MCP Discovery Source enum ===
var McpDiscoverySource;
(function (source) {
  source.ClaudeDesktop = "claude-desktop";
  source.Windsurf = "windsurf";
  source.CursorGlobal = "claude-global";       // brand: cursor→claude
  source.CursorWorkspace = "claude-workspace";  // brand: cursor→claude
})(McpDiscoverySource || (McpDiscoverySource = {}));

// === All discovery source keys ===
const ALL_DISCOVERY_SOURCES = Object.keys({
  "claude-desktop": true,
  windsurf: true,
  "claude-global": true,       // brand: cursor→claude
  "claude-workspace": true,    // brand: cursor→claude
});

// === Discovery source labels ===
const DISCOVERY_SOURCE_LABELS = {
  "claude-desktop": _(8754, null),   // "Claude Desktop"
  windsurf: _(8755, null),           // "Windsurf"
  "claude-global": _(8756, null),    // "Claude Editor (Global)"  // brand: cursor→claude
  "claude-workspace": _(8757, null), // "Claude Editor (Workspace)"  // brand: cursor→claude
};

// === MCP config section key ===
const MCP_CONFIG_SECTION = "mcp";
const MCP_DISCOVERY_ENABLED_KEY = "chat.mcp.discovery.enabled";
const MCP_ENABLED_KEY = "chat.mcp.enabled";

// === Example MCP server config set ===
const EXAMPLE_MCP_SERVERS = {
  "mcp-server-time": {
    command: "python",
    args: ["-m", "mcp_server_time", "--local-timezone=America/Los_Angeles"],
    env: {},
  },
};

// === JSON Schema: Stdio MCP server ===
const STDIO_SERVER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  examples: [EXAMPLE_STDIO_CONFIG],
  properties: {
    type: {
      type: "string",
      enum: ["stdio"],
      description: _(8758, null), // "Transport type"
    },
    command: {
      type: "string",
      description: _(8759, null), // "Command to run"
    },
    args: {
      type: "array",
      description: _(8760, null), // "Arguments"
      items: { type: "string" },
    },
    envFile: {
      type: "string",
      description: _(8761, null), // "Environment file path"
      examples: ["${workspaceFolder}/.env"],
    },
    env: {
      description: _(8762, null), // "Environment variables"
      additionalProperties: {
        anyOf: [{ type: "null" }, { type: "string" }, { type: "number" }],
      },
    },
  },
};

// === JSON Schema: MCP settings file ===
const MCP_SETTINGS_SCHEMA = {
  id: qpu,
  type: "object",
  title: _(8763, null), // "MCP Settings"
  allowTrailingCommas: true,
  allowComments: true,
  additionalProperties: false,
  properties: {
    servers: {
      examples: [EXAMPLE_MCP_SERVERS],
      additionalProperties: {
        oneOf: [
          STDIO_SERVER_SCHEMA,
          {
            type: "object",
            additionalProperties: false,
            required: ["url", "type"],
            examples: [{ type: "sse", url: "http://localhost:3001", headers: {} }],
            properties: {
              type: {
                type: "string",
                enum: ["sse"],
                description: _(8764, null), // "SSE transport type"
              },
              url: {
                type: "string",
                format: "uri",
                description: _(8765, null), // "Server URL"
              },
              env: {
                description: _(8766, null), // "Environment variables"
                additionalProperties: { type: "string" },
              },
            },
          },
        ],
      },
    },
    inputs: MCa.definitions.inputs,
  },
};

// === Extension point: MCP Server Collections ===
const MCP_SERVER_COLLECTIONS_EXTENSION_POINT = {
  extensionPoint: "modelContextServerCollections",
  activationEventsGenerator(collections, events) {
    for (const collection of collections) {
      if (collection.id) {
        events.push(getMcpCollectionEventId(collection.id));
      }
    }
  },
  jsonSchema: {
    description: _(8767, null), // "MCP server collections"
    type: "array",
    defaultSnippets: [{ body: [{ id: "", label: "" }] }],
    items: {
      additionalProperties: false,
      type: "object",
      defaultSnippets: [{ body: { id: "", label: "" } }],
      properties: {
        id: {
          description: _(8768, null), // "Collection ID"
          type: "string",
        },
        label: {
          description: _(8769, null), // "Collection label"
          type: "string",
        },
      },
    },
  },
};
