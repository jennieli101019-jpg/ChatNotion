"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadBackground() {
  const storageData = {};
  const storageListeners = [];
  const connectListeners = [];
  const messageListeners = [];
  const noOpEvent = { addListener() {} };
  const chrome = {
    runtime: {
      onInstalled: noOpEvent,
      onStartup: noOpEvent,
      onMessage: { addListener(listener) { messageListeners.push(listener); } },
      onConnect: { addListener(listener) { connectListeners.push(listener); } }
    },
    storage: {
      onChanged: { addListener(listener) { storageListeners.push(listener); } },
      local: {
        async get(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(list.filter((key) => key in storageData).map((key) => [key, storageData[key]]));
        },
        async set(values) {
          const changes = {};
          for (const [key, value] of Object.entries(values)) {
            changes[key] = { oldValue: storageData[key], newValue: value };
            storageData[key] = value;
          }
          for (const listener of storageListeners) listener(changes, "local");
        },
        async remove(keys) {
          const changes = {};
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            if (!(key in storageData)) continue;
            changes[key] = { oldValue: storageData[key] };
            delete storageData[key];
          }
          for (const listener of storageListeners) listener(changes, "local");
        },
        async setAccessLevel() {}
      }
    }
  };
  const context = vm.createContext({ chrome, console });
  const src = path.join(__dirname, "..", "src");
  context.importScripts = (...files) => {
    for (const file of files) vm.runInContext(fs.readFileSync(path.join(src, file), "utf8"), context);
  };
  vm.runInContext(fs.readFileSync(path.join(src, "background.js"), "utf8"), context);
  return {
    chrome,
    connect: connectListeners[0],
    send(message, sender = {}) {
      return new Promise((resolve) => messageListeners[0](message, sender, resolve));
    }
  };
}

function mockPort() {
  const messages = [];
  return {
    name: "chat-notion-rpc",
    messages,
    onMessage: { addListener() {} },
    onDisconnect: { addListener() {} },
    postMessage(message) { messages.push(message); }
  };
}

test("broadcasts tree and Prompt changes to every connected ChatNotion tab", async () => {
  const { chrome, connect } = loadBackground();
  const first = mockPort();
  const second = mockPort();
  connect(first);
  connect(second);

  await chrome.storage.local.set({
    chatNotionState: { schemaVersion: 4, nodes: [{ id: "folder" }], collapsedIds: [] },
    chatNotionCustomTools: [{ id: "research", name: "Research", prompt: "Investigate" }]
  });

  for (const port of [first, second]) {
    assert.equal(port.messages.length, 1);
    assert.equal(port.messages[0].event, "WORKSPACE_CHANGED");
    assert.equal(port.messages[0].changes.chatNotionState.value.nodes[0].id, "folder");
    assert.equal(port.messages[0].changes.chatNotionCustomTools.value[0].id, "research");
  }
});

test("broadcasts only Undo and Redo counts instead of full snapshots", async () => {
  const { chrome, connect } = loadBackground();
  const port = mockPort();
  connect(port);
  const largeSnapshot = { treeState: { nodes: Array.from({ length: 100 }, (_, id) => ({ id })) } };

  await chrome.storage.local.set({
    chatNotionUndoStack: [largeSnapshot, largeSnapshot],
    chatNotionRedoStack: [largeSnapshot]
  });

  assert.equal(port.messages[0].changes.chatNotionUndoStack.value, 2);
  assert.equal(port.messages[0].changes.chatNotionRedoStack.value, 1);
});

test("undoes and redoes Note edits with compact history entries", async () => {
  const { chrome, send } = loadBackground();
  await chrome.storage.local.set({
    chatNotionState: {
      schemaVersion: 9,
      nodes: [{ id: "chat", kind: "chat", title: "Chat", noteContent: "before", noteEdited: true }],
      collapsedIds: [],
      dismissedChatUrls: [],
      archivedChatLinks: []
    },
    chatNotionUndoStack: [],
    chatNotionRedoStack: []
  });

  const saved = await send({ type: "NOTE_COMMIT", nodeId: "chat", noteContent: "after", noteEdited: true });
  assert.equal(saved.ok, true, saved.error);
  assert.equal(saved.state.nodes[0].noteContent, "after");
  const stored = await chrome.storage.local.get("chatNotionUndoStack");
  assert.equal(stored.chatNotionUndoStack[0].type, "note-edit");
  assert.equal(Object.prototype.hasOwnProperty.call(stored.chatNotionUndoStack[0], "treeState"), false);

  const undone = await send({ type: "TREE_UNDO" });
  assert.equal(undone.state.nodes[0].noteContent, "before");
  const redone = await send({ type: "TREE_REDO" });
  assert.equal(redone.state.nodes[0].noteContent, "after");
});

test("repeated workspace reads never replace stored Note bodies with placeholders", async () => {
  const { chrome, send } = loadBackground();
  await chrome.storage.local.set({
    chatNotionState: {
      schemaVersion: 10,
      nodes: [{
        id: "chat",
        kind: "chat",
        title: "Chat",
        noteContent: "",
        noteEdited: true,
        bodyStored: true,
        sourceSnapshot: { messages: [] }
      }],
      collapsedIds: [], dismissedChatUrls: [], archivedChatLinks: [], updatedAt: 10
    },
    chatNotionUndoStack: [], chatNotionRedoStack: []
  });

  // Seed the independent body store through the normal save path.
  const saved = await send({ type: "NOTE_COMMIT", nodeId: "chat", noteContent: "keep this edit", noteEdited: true });
  assert.equal(saved.ok, true, saved.error);
  assert.equal((await send({ type: "TREE_GET" })).state.nodes[0].noteContent, "keep this edit");
  assert.equal((await send({ type: "TREE_GET" })).state.nodes[0].noteContent, "keep this edit");
});

test("stores tree commits as compact workspace patches", async () => {
  const { chrome, send } = loadBackground();
  const original = {
    schemaVersion: 9,
    nodes: [{ id: "chat", kind: "chat", title: "Before", sourceSnapshot: { messages: [{ role: "assistant", content: "large body" }] } }],
    collapsedIds: [], dismissedChatUrls: [], archivedChatLinks: []
  };
  await chrome.storage.local.set({ chatNotionState: original, chatNotionUndoStack: [], chatNotionRedoStack: [] });
  const changed = JSON.parse(JSON.stringify(original));
  changed.nodes[0].title = "After";

  const committed = await send({ type: "TREE_COMMIT", state: changed });
  assert.equal(committed.ok, true, committed.error);
  const stored = await chrome.storage.local.get("chatNotionUndoStack");
  assert.equal(stored.chatNotionUndoStack[0].type, "workspace-patch");
  assert.equal(JSON.stringify(stored.chatNotionUndoStack[0]).includes("large body"), false);
  assert.equal((await send({ type: "TREE_UNDO" })).state.nodes[0].title, "Before");
  assert.equal((await send({ type: "TREE_REDO" })).state.nodes[0].title, "After");
});

test("preserves IndexedDB-backed Note bodies across metadata-only tree commits", async () => {
  const { chrome, send } = loadBackground();
  const initial = {
    schemaVersion: 10,
    nodes: [{
      id: "chat",
      kind: "chat",
      title: "Before",
      parentId: null,
      noteContent: "important local note",
      noteEdited: true,
      sourceSnapshot: { messages: [{ role: "assistant", content: "captured answer" }] }
    }],
    collapsedIds: [], dismissedChatUrls: [], archivedChatLinks: []
  };
  await chrome.storage.local.set({ chatNotionState: initial, chatNotionUndoStack: [], chatNotionRedoStack: [] });
  assert.equal((await send({ type: "TREE_GET" })).state.nodes[0].noteContent, "important local note");

  const hydrated = (await send({ type: "TREE_GET" })).state;
  hydrated.nodes[0].title = "Renamed";
  hydrated.nodes[0].parentId = "folder";
  hydrated.nodes.unshift({ id: "folder", kind: "folder", title: "Folder", parentId: null });
  const committed = await send({ type: "TREE_COMMIT", state: hydrated });
  assert.equal(committed.ok, true, committed.error);

  const reloaded = (await send({ type: "TREE_GET" })).state;
  const chat = reloaded.nodes.find((node) => node.id === "chat");
  assert.equal(chat.title, "Renamed");
  assert.equal(chat.parentId, "folder");
  assert.equal(chat.noteContent, "important local note");
  assert.equal(chat.sourceSnapshot.messages[0].content, "captured answer");
});

test("supports multiple consecutive workspace Undo and Redo steps", async () => {
  const { chrome, send } = loadBackground();
  const state = (title) => ({
    schemaVersion: 10,
    nodes: [{ id: "folder", kind: "folder", title }],
    collapsedIds: [], dismissedChatUrls: [], archivedChatLinks: []
  });
  await chrome.storage.local.set({
    chatNotionState: state("One"),
    chatNotionUndoStack: [],
    chatNotionRedoStack: []
  });

  await send({ type: "TREE_COMMIT", state: state("Two") });
  await send({ type: "TREE_COMMIT", state: state("Three") });
  assert.equal((await send({ type: "TREE_UNDO" })).state.nodes[0].title, "Two");
  assert.equal((await send({ type: "TREE_UNDO" })).state.nodes[0].title, "One");
  assert.equal((await send({ type: "TREE_REDO" })).state.nodes[0].title, "Two");
  assert.equal((await send({ type: "TREE_REDO" })).state.nodes[0].title, "Three");
});

test("keeps the built-in Tree mode visible even when old state tries to hide it", async () => {
  const { send } = loadBackground();
  const response = await send({
    type: "PROMPT_PRESET_STATE_SET",
    state: { order: ["tree"], hidden: ["tree"], overrides: {} }
  });

  assert.equal(response.ok, true);
  assert.equal(response.state.hidden.length, 0);
});

test("defaults conversation auto save on and persists manual mode", async () => {
  const { send } = loadBackground();
  assert.equal((await send({ type: "AUTO_SAVE_GET" })).enabled, true);
  assert.equal((await send({ type: "AUTO_SAVE_SET", enabled: false })).enabled, false);
  assert.equal((await send({ type: "AUTO_SAVE_GET" })).enabled, false);
});

test("defers a native branch until its new conversation is claimed", async () => {
  const { send } = loadBackground();
  const parentUrl = "https://chatgpt.com/c/parent";
  const childUrl = "https://chatgpt.com/c/child";
  const created = await send({
    type: "NATIVE_BRANCH_PENDING_SET",
    pending: { parentId: "parent", parentUrl, baselineUserTurns: 2 }
  }, { tab: { id: 20 } });
  assert.equal(created.ok, true);
  assert.equal(created.pending.branchUrl, "");
  assert.equal((await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: parentUrl },
    { tab: { id: 20 } }
  )).pending.branchUrl, "");
  assert.equal((await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: childUrl },
    { tab: { id: 21, openerTabId: 20 } }
  )).pending.branchUrl, childUrl);
  assert.equal((await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: "https://chatgpt.com/c/other" },
    { tab: { id: 22 } }
  )).pending, null);
  assert.equal((await send({ type: "NATIVE_BRANCH_PENDING_CLEAR" })).ok, true);
  assert.equal((await send({ type: "NATIVE_BRANCH_PENDING_CLAIM", url: childUrl })).pending, null);
});

test("keeps a native branch-of-branch beneath its immediate parent", async () => {
  const { send } = loadBackground();
  const parentUrl = "https://chatgpt.com/c/first-branch";
  const childUrl = "https://chatgpt.com/c/nested-branch";
  const created = await send({
    type: "NATIVE_BRANCH_PENDING_SET",
    pending: { parentId: "first-branch-node", parentUrl, baselineUserTurns: 3 }
  });
  assert.equal(created.ok, true);

  const claimed = await send({ type: "NATIVE_BRANCH_PENDING_CLAIM", url: childUrl });
  assert.equal(claimed.pending.parentId, "first-branch-node");
  assert.equal(claimed.pending.parentUrl, parentUrl);
  assert.equal(claimed.pending.branchUrl, childUrl);
});

test("keeps intermediate and final URLs in one native branch session", async () => {
  const { send } = loadBackground();
  const parentUrl = "https://chatgpt.com/c/parent";
  const intermediateUrl = "https://chatgpt.com/c/branch-loading";
  const finalUrl = "https://chatgpt.com/c/branch-final";
  await send({
    type: "NATIVE_BRANCH_PENDING_SET",
    pending: { parentId: "parent-node", parentUrl, baselineUserTurns: 2 }
  }, { tab: { id: 10 } });

  const first = await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: intermediateUrl },
    { tab: { id: 11, openerTabId: 10 } }
  );
  assert.equal(first.pending.branchUrl, intermediateUrl);
  await send({ type: "NATIVE_BRANCH_PENDING_COMPLETE", url: intermediateUrl }, { tab: { id: 11 } });

  const final = await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: finalUrl },
    { tab: { id: 11, openerTabId: 10 } }
  );
  assert.equal(final.pending.branchUrl, finalUrl);
  assert.deepEqual(Array.from(final.pending.previousBranchUrls), [intermediateUrl]);

  const unrelated = await send(
    { type: "NATIVE_BRANCH_PENDING_CLAIM", url: "https://chatgpt.com/c/unrelated" },
    { tab: { id: 12 } }
  );
  assert.equal(unrelated.pending, null);
});

test("exports and restores a complete local ChatNotion backup", async () => {
  const { chrome, send } = loadBackground();
  const originalTree = {
    schemaVersion: 4,
    nodes: [{ id: "folder", kind: "folder", parentId: null, title: "Research", position: 1, noteContent: "# Key findings" }],
    collapsedIds: ["folder"],
    updatedAt: 1
  };
  await chrome.storage.local.set({
    chatNotionState: originalTree,
    chatNotionExtractMaxDepth: 4,
    chatNotionCustomTreePrompt: "Build a useful tree",
    chatNotionTreePromptPosition: "prefix",
    chatNotionChildPromptContext: false,
    chatNotionChildPromptTemplate: "Teach {topic}",
    chatNotionAutoSaveEnabled: false,
    chatNotionCustomTools: [{ id: "research", name: "Research", prompt: "Investigate", position: "postfix" }],
    chatNotionPromptPresetState: { order: ["tree"], hidden: [], overrides: {} },
    chatNotionLauncherPosition: { x: 0.25, y: 0.5 },
    chatNotionPanelBounds: { x: 0.2, y: 0.1, width: 420, height: 640 }
  });

  const exported = await send({ type: "LOCAL_BACKUP_EXPORT" });
  assert.equal(exported.ok, true);
  assert.equal(exported.backup.format, "chatnotion-local-backup");
  assert.equal(exported.backup.version, 2);
  assert.equal(exported.backup.data.treeState.nodes[0].title, "Research");
  assert.equal(exported.backup.data.treeState.nodes[0].noteContent, "# Key findings");
  assert.equal(exported.backup.data.childPromptTemplate, "Teach {topic}");
  assert.equal(exported.backup.data.customTools[0].name, "Research");
  assert.equal(exported.backup.data.treePrompt, "Build a useful tree");
  assert.equal(exported.backup.data.autoSaveEnabled, false);

  await chrome.storage.local.set({
    chatNotionState: { schemaVersion: 4, nodes: [], collapsedIds: [], updatedAt: 2 },
    chatNotionChildPromptTemplate: "Explain {topic}"
  });
  const restored = await send({ type: "LOCAL_BACKUP_IMPORT", backup: exported.backup });
  assert.equal(restored.ok, true);
  assert.equal(restored.state.nodes[0].title, "Research");
  assert.equal(restored.state.nodes[0].noteContent, "# Key findings");
  assert.equal(restored.workspace.childPromptTemplate, "Teach {topic}");
  assert.equal(restored.extractDepth, 4);
  assert.equal(restored.launcherPosition.x, 0.25);
  assert.equal(restored.launcherPosition.y, 0.5);
  assert.equal(restored.panelBounds.width, 420);
  const restoredSettings = await chrome.storage.local.get("chatNotionAutoSaveEnabled");
  assert.equal(restoredSettings.chatNotionAutoSaveEnabled, false);
});

test("continues to import version 1 local backups", async () => {
  const { chrome, send } = loadBackground();
  await chrome.storage.local.set({
    chatNotionState: {
      schemaVersion: 10,
      nodes: [{ id: "legacy", kind: "chat", title: "Legacy backup", noteContent: "kept" }],
      collapsedIds: [], dismissedChatUrls: [], archivedChatLinks: []
    }
  });
  const exported = await send({ type: "LOCAL_BACKUP_EXPORT" });
  exported.backup.version = 1;
  const restored = await send({
    type: "LOCAL_BACKUP_IMPORT",
    backup: exported.backup
  });
  assert.equal(restored.ok, true, restored.error);
  assert.equal(restored.state.nodes[0].title, "Legacy backup");
  assert.equal(restored.state.nodes[0].noteContent, "kept");
});

test("rejects a damaged backup without replacing the current workspace", async () => {
  const { chrome, send } = loadBackground();
  const currentTree = {
    schemaVersion: 4,
    nodes: [{ id: "safe", kind: "folder", parentId: null, title: "Keep me", position: 1 }],
    collapsedIds: [],
    updatedAt: 1
  };
  await chrome.storage.local.set({ chatNotionState: currentTree });
  const response = await send({
    type: "LOCAL_BACKUP_IMPORT",
    backup: {
      format: "chatnotion-local-backup",
      version: 1,
      data: {
        treeState: {
          schemaVersion: 4,
          nodes: [{ id: "orphan", kind: "chat", parentId: "missing", title: "Broken" }],
          collapsedIds: []
        }
      }
    }
  });

  assert.equal(response.ok, false);
  const stored = await chrome.storage.local.get("chatNotionState");
  assert.equal(stored.chatNotionState.nodes[0].id, "safe");
});
