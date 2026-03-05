// Source: out-build/vs/workbench/contrib/agents/browser/agentIconUtils.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Hi(), Hr(), Xn();

// === Agent loading spinner icon ===
const LOADING_ICON = { id: "loading~spin" };

// === Agent avatar SVG (dark/light variants) ===
const AGENT_AVATAR_DARK_SVG = hLf("#424242");
const AGENT_AVATAR_LIGHT_SVG = hLf("#cccccc");

const AGENT_AVATAR_THEME_ICON = {
  dark: je.parse(`data:image/svg+xml;utf8,${encodeURIComponent(AGENT_AVATAR_LIGHT_SVG)}`),
  light: je.parse(`data:image/svg+xml;utf8,${encodeURIComponent(AGENT_AVATAR_DARK_SVG)}`),
};
