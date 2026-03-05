// Source: out-build/vs/workbench/contrib/composer/browser/composerAgent.js
// Deobfuscated from Cursor IDE workbench.desktop.main.js

Qt();

const IComposerAgentService = Bi("composerAgentService");

class DuplicateStepStartedError extends Error {
  constructor(offsetKey) {
    super(`Duplicate step-started event detected at offset ${offsetKey}`);
    this.name = "DuplicateStepStartedError";
    this.offsetKey = offsetKey;
  }
}

class RestartFromBeginningError extends Error {
  constructor(reason) {
    super(`Restarting from beginning: ${reason}`);
    this.name = "RestartFromBeginningError";
  }
}
