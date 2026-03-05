// Source: out-build/vs/workbench/contrib/agents/common/agentsContextKeys.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Wt(), ci();

var AgentsContextKeys;
(function (keys) {
  keys.agentsPaneFocused = new kn("agentsPaneFocused", false, {
    type: "boolean",
    description: _(4787, null), // "Whether the agents pane is focused"
  });

  keys.agentNavigationMode = new kn("agentNavigationMode", false, {
    type: "boolean",
    description: _(4788, null), // "Whether agent navigation mode is active"
  });
})(AgentsContextKeys || (AgentsContextKeys = {}));
