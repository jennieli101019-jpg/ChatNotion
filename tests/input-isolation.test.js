const test = require("node:test");
const assert = require("node:assert/strict");

const inputIsolation = require("../src/input-isolation.js");

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
    this.activeElement = null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter((candidate) => candidate !== listener));
  }

  dispatch(type, event) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
}

test("isolates every panel text-input event from ChatGPT page listeners", () => {
  const shadowRoot = new FakeEventTarget();
  const windowRoot = new FakeEventTarget();
  const documentRoot = new FakeEventTarget();
  const host = {};
  const input = { isConnected: true, focus() {} };
  inputIsolation.install({ shadowRoot, windowRoot, documentRoot, host, getProtectedInput: () => input });

  assert.deepEqual([...shadowRoot.listeners.keys()], inputIsolation.INPUT_EVENTS);
  for (const eventName of inputIsolation.INPUT_EVENTS) {
    let stopped = false;
    shadowRoot.dispatch(eventName, { stopPropagation() { stopped = true; } });
    assert.equal(stopped, true, `${eventName} must stay inside ChatNotion`);
  }
});

test("hides ChatNotion focus events from ChatGPT document handlers", () => {
  const shadowRoot = new FakeEventTarget();
  const windowRoot = new FakeEventTarget();
  const documentRoot = new FakeEventTarget();
  const host = {};
  let stopped = false;
  inputIsolation.install({
    shadowRoot,
    windowRoot,
    documentRoot,
    host,
    getProtectedInput: () => null
  });

  windowRoot.dispatch("focusin", {
    composedPath: () => [{ id: "rename-input" }, host],
    stopImmediatePropagation() { stopped = true; }
  });
  assert.equal(stopped, true);
});

test("restores an inline editor when ChatGPT programmatically steals focus", () => {
  const shadowRoot = new FakeEventTarget();
  const windowRoot = new FakeEventTarget();
  const documentRoot = new FakeEventTarget();
  const host = {};
  let focusCount = 0;
  const input = {
    isConnected: true,
    focus(options) {
      assert.deepEqual(options, { preventScroll: true });
      focusCount += 1;
      shadowRoot.activeElement = input;
    }
  };
  const queued = [];
  inputIsolation.install({
    shadowRoot,
    windowRoot,
    documentRoot,
    host,
    getProtectedInput: () => input,
    queueTask: (task) => queued.push(task)
  });

  documentRoot.dispatch("focusin", { composedPath: () => [{ id: "chatgpt-composer" }] });
  assert.equal(queued.length, 1);
  queued.shift()();
  assert.equal(focusCount, 1);
});

test("does not interfere with focus changes inside ChatNotion", () => {
  const shadowRoot = new FakeEventTarget();
  const windowRoot = new FakeEventTarget();
  const documentRoot = new FakeEventTarget();
  const host = {};
  let focusCount = 0;
  const input = { isConnected: true, focus() { focusCount += 1; } };
  const queued = [];
  inputIsolation.install({
    shadowRoot,
    windowRoot,
    documentRoot,
    host,
    getProtectedInput: () => input,
    queueTask: (task) => queued.push(task)
  });

  documentRoot.dispatch("focusin", { composedPath: () => [input, host] });
  assert.equal(queued.length, 0);
  assert.equal(focusCount, 0);
});
