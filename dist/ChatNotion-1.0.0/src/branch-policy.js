(function exposeBranchPolicy(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionBranchPolicy = api;
  }
})(globalThis, function createBranchPolicy() {
  "use strict";

  function shouldShowGenerate(isAssistant, isStreaming, isStable = true) {
    return isAssistant === true && isStreaming !== true && isStable === true;
  }

  return { shouldShowGenerate };
});
