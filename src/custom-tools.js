(function exposeCustomTools(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionCustomTools = api;
  }
})(globalThis, function createCustomTools() {
  "use strict";

  function normalize(input) {
    const ids = new Set();
    return (Array.isArray(input) ? input : []).slice(0, 20).map((raw, index) => {
      const prompt = String(raw?.prompt || "").trim().slice(0, 1000);
      if (!prompt) return null;
      let id = String(raw?.id || `prompt-tool-${index}`).trim().slice(0, 80);
      if (!id || ids.has(id)) id = `prompt-tool-${index}-${id || "local"}`;
      ids.add(id);
      return {
        id,
        name: String(raw?.name || "Custom").replace(/\s+/g, " ").trim().slice(0, 40) || "Custom",
        prompt,
        position: raw?.position === "prefix" ? "prefix" : "postfix"
      };
    }).filter(Boolean);
  }

  return { normalize };
});
