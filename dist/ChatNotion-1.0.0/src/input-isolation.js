(function exposeInputIsolation(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionInputIsolation = api;
  }
})(globalThis, function createInputIsolation() {
  "use strict";

  const INPUT_EVENTS = [
    "keydown",
    "keyup",
    "keypress",
    "beforeinput",
    "input",
    "compositionstart",
    "compositionupdate",
    "compositionend",
    "change",
    "paste",
    "cut",
    "copy"
  ];

  function eventPathIncludes(event, node) {
    return Boolean(node && typeof event?.composedPath === "function" && event.composedPath().includes(node));
  }

  function install({
    shadowRoot,
    windowRoot,
    documentRoot,
    host,
    getProtectedInput,
    queueTask = queueMicrotask
  }) {
    if (!shadowRoot || !windowRoot || !documentRoot || !host || typeof getProtectedInput !== "function") {
      throw new Error("ChatNotion input isolation requires its panel roots and protected-input resolver");
    }

    const stopPanelInputEvent = (event) => event.stopPropagation();
    for (const eventName of INPUT_EVENTS) {
      shadowRoot.addEventListener(eventName, stopPanelInputEvent);
    }

    // Focus has already changed by the time focusin is dispatched. Stopping
    // the composed event at Window keeps ChatGPT's document-level focus
    // handlers from treating a ChatNotion input as a request for the composer.
    const hidePanelFocusFromPage = (event) => {
      if (eventPathIncludes(event, host)) event.stopImmediatePropagation();
    };
    windowRoot.addEventListener("focusin", hidePanelFocusFromPage, true);

    let focusRestoreQueued = false;
    const restoreProtectedInput = () => {
      focusRestoreQueued = false;
      const input = getProtectedInput();
      if (!input || input.isConnected === false || shadowRoot.activeElement === input) return;
      input.focus({ preventScroll: true });
    };
    const handleDocumentFocus = (event) => {
      const input = getProtectedInput();
      if (!input || input.isConnected === false || eventPathIncludes(event, host) || focusRestoreQueued) return;
      focusRestoreQueued = true;
      queueTask(restoreProtectedInput);
    };
    documentRoot.addEventListener("focusin", handleDocumentFocus, true);

    return () => {
      for (const eventName of INPUT_EVENTS) {
        shadowRoot.removeEventListener(eventName, stopPanelInputEvent);
      }
      windowRoot.removeEventListener("focusin", hidePanelFocusFromPage, true);
      documentRoot.removeEventListener("focusin", handleDocumentFocus, true);
    };
  }

  return {
    INPUT_EVENTS,
    eventPathIncludes,
    install
  };
});
