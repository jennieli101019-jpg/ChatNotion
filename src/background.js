"use strict";

importScripts("core.js", "history.js", "custom-tools.js", "auto-backup.js", "content-store.js");

const STORAGE_KEY = "chatNotionState";
const LOCALE_KEY = "chatNotionLocale";
const LEGACY_DEPTH_KEY = "chatNotionMaxDepth";
const EXTRACT_DEPTH_KEY = "chatNotionExtractMaxDepth";
const TREE_PROMPT_KEY = "chatNotionCustomTreePrompt";
const TREE_PROMPT_POSITION_KEY = "chatNotionTreePromptPosition";
const CHILD_PROMPT_CONTEXT_KEY = "chatNotionChildPromptContext";
const CHILD_PROMPT_TEMPLATE_KEY = "chatNotionChildPromptTemplate";
const AUTO_SAVE_KEY = "chatNotionAutoSaveEnabled";
const PENDING_NATIVE_BRANCH_KEY = "chatNotionPendingNativeBranch";
const LAUNCHER_POSITION_KEY = "chatNotionLauncherPosition";
const PANEL_BOUNDS_KEY = "chatNotionPanelBounds";
const CUSTOM_PROMPT_KEY = "chatNotionCustomPrompt";
const CUSTOM_TOOLS_KEY = "chatNotionCustomTools";
const PROMPT_PRESET_STATE_KEY = "chatNotionPromptPresetState";
const UNDO_KEY = "chatNotionUndoStack";
const REDO_KEY = "chatNotionRedoStack";
const AUTO_BACKUP_SETTINGS_KEY = "chatNotionAutoBackupSettings";
const AUTO_BACKUP_FOLDER_NAME_KEY = "chatNotionAutoBackupFolderName";
const AUTO_BACKUP_LAST_RUN_KEY = "chatNotionAutoBackupLastRun";
const AUTO_BACKUP_ERROR_KEY = "chatNotionAutoBackupError";
const AUTO_BACKUP_ALARM = "chatnotion-auto-backup";
const NATIVE_BRANCH_COMPLETION_GRACE_MS = 30_000;
const MAX_UNDO_STATES = 10;
const BACKUP_FORMAT = "chatnotion-local-backup";
const BACKUP_VERSION = 2;
const SUPPORTED_BACKUP_VERSIONS = new Set([1, BACKUP_VERSION]);
const core = globalThis.ChatNotionCore;
const undoHistory = globalThis.ChatNotionUndoHistory;
const customTools = globalThis.ChatNotionCustomTools;
const autoBackup = globalThis.ChatNotionAutoBackup;
const contentStore = globalThis.ChatNotionContentStore;
const BUILT_IN_PROMPT_IDS = ["tree"];
const PROMPT_HISTORY_KEYS = [
  TREE_PROMPT_KEY,
  TREE_PROMPT_POSITION_KEY,
  CHILD_PROMPT_CONTEXT_KEY,
  CHILD_PROMPT_TEMPLATE_KEY,
  CUSTOM_TOOLS_KEY,
  PROMPT_PRESET_STATE_KEY
];
const WORKSPACE_HISTORY_KEYS = [STORAGE_KEY, ...PROMPT_HISTORY_KEYS];
const BACKUP_STORAGE_KEYS = [
  STORAGE_KEY,
  EXTRACT_DEPTH_KEY,
  TREE_PROMPT_KEY,
  TREE_PROMPT_POSITION_KEY,
  CHILD_PROMPT_CONTEXT_KEY,
  CHILD_PROMPT_TEMPLATE_KEY,
  CUSTOM_TOOLS_KEY,
  PROMPT_PRESET_STATE_KEY,
  LAUNCHER_POSITION_KEY,
  PANEL_BOUNDS_KEY,
  AUTO_SAVE_KEY,
  AUTO_BACKUP_SETTINGS_KEY
];
const SYNC_STORAGE_KEYS = new Set([
  ...WORKSPACE_HISTORY_KEYS,
  UNDO_KEY,
  REDO_KEY,
  AUTO_BACKUP_SETTINGS_KEY,
  AUTO_BACKUP_FOLDER_NAME_KEY,
  AUTO_BACKUP_LAST_RUN_KEY,
  AUTO_BACKUP_ERROR_KEY,
  AUTO_SAVE_KEY
]);
const syncPorts = new Set();

function broadcastAutoBackupStatus(status) {
  for (const port of syncPorts) {
    try { port.postMessage({ event: "AUTO_BACKUP_STATUS_CHANGED", status }); } catch (_error) {}
  }
}

function normalizePromptPresetState(input) {
  const raw = input && typeof input === "object" ? input : {};
  const order = [];
  for (const id of Array.isArray(raw.order) ? raw.order : []) {
    if (BUILT_IN_PROMPT_IDS.includes(id) && !order.includes(id)) order.push(id);
  }
  for (const id of BUILT_IN_PROMPT_IDS) {
    if (!order.includes(id)) order.push(id);
  }
  const hidden = [...new Set(Array.isArray(raw.hidden) ? raw.hidden : [])]
    .filter((id) => BUILT_IN_PROMPT_IDS.includes(id) && id !== "tree");
  const overrides = {};
  for (const id of BUILT_IN_PROMPT_IDS) {
    const override = raw.overrides?.[id];
    if (!override || typeof override !== "object") continue;
    const name = String(override.name || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const prompt = String(override.prompt || "").trim().slice(0, id === "tree" ? 2500 : 1000);
    if (name || prompt) {
      overrides[id] = {
        ...(name ? { name } : {}),
        ...(prompt ? { prompt } : {}),
        position: override.position === "prefix" ? "prefix" : "postfix"
      };
    }
  }
  return { order, hidden, overrides };
}

function normalizeTreeDepth(value) {
  const depth = Number(value);
  return Number.isInteger(depth) && depth >= 1 && depth <= 5 ? depth : 3;
}

function normalizeLauncherPosition(value) {
  if (value === null || typeof value === "undefined") return null;
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) throw new Error("Invalid launcher position in backup");
  return { x: Math.min(1, Math.max(0, value.x)), y: Math.min(1, Math.max(0, value.y)) };
}

function normalizePanelBounds(value) {
  if (value === null || typeof value === "undefined") return null;
  if (!value || ![value.x, value.y, value.width, value.height].every(Number.isFinite)) {
    throw new Error("Invalid panel bounds in backup");
  }
  return {
    x: Math.min(1, Math.max(0, value.x)),
    y: Math.min(1, Math.max(0, value.y)),
    width: Math.min(4000, Math.max(280, value.width)),
    height: Math.min(1000, Math.max(280, value.height))
  };
}

function createLocalBackup(result) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      treeState: core.validateState(result[STORAGE_KEY] || core.createEmptyState()),
      extractDepth: normalizeTreeDepth(result[EXTRACT_DEPTH_KEY]),
      treePrompt: String(result[TREE_PROMPT_KEY] || "").trim().slice(0, 2500),
      treePromptPosition: result[TREE_PROMPT_POSITION_KEY] === "prefix" ? "prefix" : "postfix",
      childPromptContext: result[CHILD_PROMPT_CONTEXT_KEY] !== false,
      childPromptTemplate: String(result[CHILD_PROMPT_TEMPLATE_KEY] || "").trim().slice(0, 1000),
      autoSaveEnabled: result[AUTO_SAVE_KEY] !== false,
      customTools: customTools.normalize(result[CUSTOM_TOOLS_KEY]),
      promptPresetState: normalizePromptPresetState(result[PROMPT_PRESET_STATE_KEY]),
      launcherPosition: normalizeLauncherPosition(result[LAUNCHER_POSITION_KEY]),
      panelBounds: normalizePanelBounds(result[PANEL_BOUNDS_KEY]),
      autoBackupSettings: autoBackup.normalizeSettings(result[AUTO_BACKUP_SETTINGS_KEY])
    }
  };
}

function validateLocalBackup(backup) {
  if (!backup || backup.format !== BACKUP_FORMAT || !SUPPORTED_BACKUP_VERSIONS.has(backup.version) || !backup.data || typeof backup.data !== "object") {
    throw new Error("This is not a supported ChatNotion backup");
  }
  const data = backup.data;
  if (!data.treeState) throw new Error("The backup does not contain a ChatNotion workspace");
  if (typeof data.childPromptTemplate !== "undefined" && typeof data.childPromptTemplate !== "string") {
    throw new Error("Invalid Chat Prompt template in backup");
  }
  if (typeof data.treePrompt !== "undefined" && typeof data.treePrompt !== "string") {
    throw new Error("Invalid Tree mode Prompt in backup");
  }
  if (typeof data.customTools !== "undefined" && !Array.isArray(data.customTools)) {
    throw new Error("Invalid Prompt tools in backup");
  }
  const treeState = core.validateState(data.treeState);
  const childPromptTemplate = String(data.childPromptTemplate || "").trim().slice(0, 1000);
  if (childPromptTemplate && !childPromptTemplate.includes("{topic}")) {
    throw new Error("The Chat Prompt template must contain {topic}");
  }
  return {
    [STORAGE_KEY]: treeState,
    [EXTRACT_DEPTH_KEY]: normalizeTreeDepth(data.extractDepth),
    [TREE_PROMPT_KEY]: String(data.treePrompt || "").trim().slice(0, 2500),
    [TREE_PROMPT_POSITION_KEY]: data.treePromptPosition === "prefix" ? "prefix" : "postfix",
    [CHILD_PROMPT_CONTEXT_KEY]: childPromptTemplate
      ? (childPromptTemplate.includes("{context}") || data.childPromptContext !== false)
      : true,
    [CHILD_PROMPT_TEMPLATE_KEY]: childPromptTemplate,
    [AUTO_SAVE_KEY]: data.autoSaveEnabled !== false,
    [CUSTOM_TOOLS_KEY]: customTools.normalize(data.customTools),
    [PROMPT_PRESET_STATE_KEY]: normalizePromptPresetState(data.promptPresetState),
    [LAUNCHER_POSITION_KEY]: normalizeLauncherPosition(data.launcherPosition),
    [PANEL_BOUNDS_KEY]: normalizePanelBounds(data.panelBounds),
    [CUSTOM_PROMPT_KEY]: ""
  };
}

async function syncAutoBackupAlarm() {
  if (!chrome.alarms) return;
  const result = await chrome.storage.local.get(AUTO_BACKUP_SETTINGS_KEY);
  const settings = autoBackup.normalizeSettings(result[AUTO_BACKUP_SETTINGS_KEY]);
  await chrome.alarms.clear(AUTO_BACKUP_ALARM);
  if (settings.intervalMinutes > 0) {
    await chrome.alarms.create(AUTO_BACKUP_ALARM, {
      delayInMinutes: settings.intervalMinutes,
      periodInMinutes: settings.intervalMinutes
    });
  }
}

async function autoBackupStatus() {
  const result = await chrome.storage.local.get([
    AUTO_BACKUP_SETTINGS_KEY,
    AUTO_BACKUP_FOLDER_NAME_KEY,
    AUTO_BACKUP_LAST_RUN_KEY,
    AUTO_BACKUP_ERROR_KEY
  ]);
  let directory = { permission: "missing", folderName: "" };
  try {
    const handle = await autoBackup.getDirectoryHandle();
    directory = await autoBackup.inspectDirectoryHandle(handle);
  } catch (_error) {
    directory = { permission: "unavailable", folderName: "" };
  }
  const cachedFolderName = String(result[AUTO_BACKUP_FOLDER_NAME_KEY] || "");
  if (directory.folderName !== cachedFolderName) {
    await chrome.storage.local.set({ [AUTO_BACKUP_FOLDER_NAME_KEY]: directory.folderName });
  }
  return {
    settings: autoBackup.normalizeSettings(result[AUTO_BACKUP_SETTINGS_KEY]),
    folderName: directory.folderName,
    lastRun: Number(result[AUTO_BACKUP_LAST_RUN_KEY]) || 0,
    error: String(result[AUTO_BACKUP_ERROR_KEY] || ""),
    permission: directory.permission
  };
}

async function runAutomaticBackup() {
  const result = await chrome.storage.local.get(BACKUP_STORAGE_KEYS);
  const settings = autoBackup.normalizeSettings(result[AUTO_BACKUP_SETTINGS_KEY]);
  if (settings.intervalMinutes === 0) return { written: false, skipped: true };
  const handle = await autoBackup.getDirectoryHandle();
  if (!handle) throw new Error("Choose a backup folder");
  const directory = await autoBackup.inspectDirectoryHandle(handle);
  if (directory.permission === "unavailable") throw new Error("Backup folder is unavailable. Choose it again");
  if (directory.permission !== "granted") throw new Error("Backup folder permission is required again");
  result[STORAGE_KEY] = await hydrateStoredState(result[STORAGE_KEY]);
  const backup = createLocalBackup(result);
  const filename = autoBackup.fileName(new Date(backup.exportedAt));
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(backup, null, 2)}\n`);
  await writable.close();

  const names = [];
  for await (const [name] of handle.entries()) names.push(name);
  for (const name of autoBackup.filesToDelete(names, settings.retention)) {
    await handle.removeEntry(name);
  }
  await chrome.storage.local.set({
    [AUTO_BACKUP_FOLDER_NAME_KEY]: directory.folderName,
    [AUTO_BACKUP_LAST_RUN_KEY]: Date.now(),
    [AUTO_BACKUP_ERROR_KEY]: ""
  });
  return { written: true, filename, folderName: directory.folderName };
}

async function handleAutomaticBackupAlarm() {
  try {
    return { ok: true, ...(await runAutomaticBackup()) };
  } catch (error) {
    await chrome.storage.local.set({ [AUTO_BACKUP_ERROR_KEY]: error?.message || "Automatic backup failed" });
    return { ok: false, error: error?.message || "Automatic backup failed" };
  }
}

function captureWorkspaceSnapshot(result) {
  const settings = {};
  for (const key of PROMPT_HISTORY_KEYS) {
    settings[key] = Object.prototype.hasOwnProperty.call(result || {}, key) ? result[key] : null;
  }
  return undoHistory.workspace(result?.[STORAGE_KEY], settings);
}

async function prepareStateForStorage(value) {
  const fullState = core.consolidateConversationDuplicates(core.validateState(value));
  return contentStore.persistAndStrip(fullState);
}

async function hydrateStoredState(value) {
  const normalized = core.validateState(value);
  // Only schema-9/legacy nodes still carry their body inline. A schema-10
  // bodyStored node intentionally contains empty placeholders; writing those
  // placeholders would erase the real IndexedDB record during every read.
  await contentStore.saveStateBodies({
    ...normalized,
    nodes: normalized.nodes.filter((node) => !node.bodyStored)
  });
  return contentStore.hydrateState(contentStore.stripStateBodies(normalized));
}

function isWorkspaceSnapshot(value) {
  return undoHistory.isWorkspace(value);
}

function workspaceResponse(snapshot) {
  return {
    treePrompt: String(snapshot.settings[TREE_PROMPT_KEY] || "").trim().slice(0, 2500),
    treePromptPosition: snapshot.settings[TREE_PROMPT_POSITION_KEY] === "prefix" ? "prefix" : "postfix",
    childPromptContext: snapshot.settings[CHILD_PROMPT_CONTEXT_KEY] !== false,
    childPromptTemplate: String(snapshot.settings[CHILD_PROMPT_TEMPLATE_KEY] || "").trim().slice(0, 1000),
    customTools: customTools.normalize(snapshot.settings[CUSTOM_TOOLS_KEY]),
    promptPresetState: normalizePromptPresetState(snapshot.settings[PROMPT_PRESET_STATE_KEY])
  };
}

function promptSettingsChanged(before, after) {
  return undoHistory.settingsChanged(before, after);
}

async function restoreHistorySnapshot(snapshot, currentResult, stackChanges) {
  const changes = { ...stackChanges };
  const removeKeys = [];
  if (isWorkspaceSnapshot(snapshot)) {
    changes[STORAGE_KEY] = await prepareStateForStorage(snapshot.treeState || currentResult[STORAGE_KEY]);
    for (const key of PROMPT_HISTORY_KEYS) {
      const value = snapshot.settings[key];
      if (value === null || typeof value === "undefined") removeKeys.push(key);
      else changes[key] = value;
    }
  } else {
    // History created before 0.55 stores only the tree. Preserve current Prompt settings.
    changes[STORAGE_KEY] = snapshot;
  }
  await chrome.storage.local.set(changes);
  if (removeKeys.length) await chrome.storage.local.remove(removeKeys);
  const restored = await chrome.storage.local.get(WORKSPACE_HISTORY_KEYS);
  restored[STORAGE_KEY] = await hydrateStoredState(restored[STORAGE_KEY]);
  return captureWorkspaceSnapshot(restored);
}

async function commitUndoableSettings(changes, removeKeys = []) {
  const result = await chrome.storage.local.get([...WORKSPACE_HISTORY_KEYS, UNDO_KEY, REDO_KEY]);
  const changed = Object.entries(changes).some(([key, value]) => JSON.stringify(result[key]) !== JSON.stringify(value))
    || removeKeys.some((key) => Object.prototype.hasOwnProperty.call(result, key));
  if (!changed) {
    return {
      canUndo: Array.isArray(result[UNDO_KEY]) && result[UNDO_KEY].length > 0,
      canRedo: Array.isArray(result[REDO_KEY]) && result[REDO_KEY].length > 0
    };
  }
  const nextResult = { ...result, ...changes };
  for (const key of removeKeys) delete nextResult[key];
  const patch = undoHistory.workspacePatch(captureWorkspaceSnapshot(result), captureWorkspaceSnapshot(nextResult));
  const undoStack = undoHistory.push(result[UNDO_KEY], patch, MAX_UNDO_STATES);
  await chrome.storage.local.set({ ...changes, [UNDO_KEY]: undoStack, [REDO_KEY]: [] });
  if (removeKeys.length) await chrome.storage.local.remove(removeKeys);
  return { canUndo: true, canRedo: false };
}

chrome.runtime.onInstalled.addListener(async () => {
  await restrictStorageAccess();
  const existing = await chrome.storage.local.get(STORAGE_KEY);
  if (!existing[STORAGE_KEY]) {
    await chrome.storage.local.set({
      [STORAGE_KEY]: core.createEmptyState(),
      [UNDO_KEY]: [],
      [REDO_KEY]: []
    });
  }
  await syncAutoBackupAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await restrictStorageAccess();
  await syncAutoBackupAlarm();
});

chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name === AUTO_BACKUP_ALARM) void handleAutomaticBackupAlarm();
});

function handleRuntimeMessage(message, sender, sendResponse) {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === "TREE_GET") {
    chrome.storage.local.get([STORAGE_KEY, UNDO_KEY, REDO_KEY]).then(async (result) => {
      const undoStack = Array.isArray(result[UNDO_KEY]) ? result[UNDO_KEY] : [];
      const redoStack = Array.isArray(result[REDO_KEY]) ? result[REDO_KEY] : [];
      if (!result[STORAGE_KEY]) {
        sendResponse({ ok: true, state: null, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });
        return;
      }
      const state = await hydrateStoredState(result[STORAGE_KEY]);
      const storedState = contentStore.stripStateBodies(state);
      if (JSON.stringify(storedState) !== JSON.stringify(result[STORAGE_KEY])) {
        await chrome.storage.local.set({ [STORAGE_KEY]: storedState });
      }
      sendResponse({ ok: true, state, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_COMMIT") {
    chrome.storage.local.get([...WORKSPACE_HISTORY_KEYS, UNDO_KEY]).then(async (result) => {
      const nextState = core.consolidateConversationDuplicates(core.validateState(message.state));
      const currentState = await hydrateStoredState(result[STORAGE_KEY]);
      const normalizedResult = { ...result, [STORAGE_KEY]: currentState };
      const before = captureWorkspaceSnapshot(normalizedResult);
      const after = undoHistory.workspace(nextState, before.settings);
      const patch = undoHistory.workspacePatch(before, after);
      const trimmed = patch ? undoHistory.push(result[UNDO_KEY], patch, MAX_UNDO_STATES) : (result[UNDO_KEY] || []);
      const storedState = await prepareStateForStorage(nextState);
      return chrome.storage.local.set({
        [STORAGE_KEY]: storedState,
        [UNDO_KEY]: trimmed,
        [REDO_KEY]: []
      }).then(() => sendResponse({ ok: true, canUndo: trimmed.length > 0, canRedo: false }));
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "NOTE_COMMIT") {
    chrome.storage.local.get([STORAGE_KEY, UNDO_KEY]).then(async (result) => {
      const currentState = await hydrateStoredState(result[STORAGE_KEY]);
      const node = core.getNode(currentState, message.nodeId);
      if (!node) throw new Error("Note node does not exist");
      const nextContent = String(message.noteContent || "").slice(0, 200000);
      const nextEdited = message.noteEdited === true;
      if (node.noteContent === nextContent && node.noteEdited === nextEdited) {
        const undoStack = Array.isArray(result[UNDO_KEY]) ? result[UNDO_KEY] : [];
        sendResponse({ ok: true, state: currentState, canUndo: undoStack.length > 0, canRedo: false });
        return null;
      }
      const entry = undoHistory.noteEdit(node.id, node.noteContent, node.noteEdited, nextContent, nextEdited);
      const undoStack = undoHistory.push(result[UNDO_KEY], entry, MAX_UNDO_STATES);
      const nextState = core.updateNode(currentState, node.id, { noteContent: nextContent, noteEdited: nextEdited });
      const storedState = await prepareStateForStorage(nextState);
      return chrome.storage.local.set({
        [STORAGE_KEY]: storedState,
        [UNDO_KEY]: undoStack,
        [REDO_KEY]: []
      }).then(() => sendResponse({ ok: true, state: nextState, canUndo: true, canRedo: false }));
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_UNDO") {
    chrome.storage.local.get([...WORKSPACE_HISTORY_KEYS, UNDO_KEY, REDO_KEY]).then(async (result) => {
      const { state: previous, stack: undoStack } = undoHistory.pop(result[UNDO_KEY]);
      const redoStack = Array.isArray(result[REDO_KEY]) ? result[REDO_KEY] : [];
      if (!previous) {
        sendResponse({ ok: true, state: null, canUndo: false, canRedo: redoStack.length > 0 });
        return null;
      }
      const hydratedCurrentState = await hydrateStoredState(result[STORAGE_KEY]);
      const hydratedResult = { ...result, [STORAGE_KEY]: hydratedCurrentState };
      if (undoHistory.isNoteEdit(previous)) {
        const currentState = hydratedCurrentState;
        const node = core.getNode(currentState, previous.nodeId);
        if (!node) throw new Error("Note node does not exist");
        const restoredState = core.updateNode(currentState, node.id, {
          noteContent: previous.before.content,
          noteEdited: previous.before.edited
        });
        const nextRedoStack = undoHistory.push(redoStack, previous, MAX_UNDO_STATES);
        const storedState = await prepareStateForStorage(restoredState);
        await chrome.storage.local.set({
          [STORAGE_KEY]: storedState,
          [UNDO_KEY]: undoStack,
          [REDO_KEY]: nextRedoStack
        });
        sendResponse({ ok: true, state: restoredState, workspace: null, promptChanged: false, canUndo: undoStack.length > 0, canRedo: true });
        return null;
      }
      if (undoHistory.isWorkspacePatch(previous)) {
        const current = captureWorkspaceSnapshot(hydratedResult);
        const target = undoHistory.applyWorkspacePatch(current, previous, "before");
        const nextRedoStack = undoHistory.push(redoStack, previous, MAX_UNDO_STATES);
        const promptChanged = promptSettingsChanged(current, target);
        const restored = await restoreHistorySnapshot(target, hydratedResult, {
          [UNDO_KEY]: undoStack,
          [REDO_KEY]: nextRedoStack
        });
        sendResponse({ ok: true, state: restored.treeState, workspace: workspaceResponse(restored), promptChanged, canUndo: undoStack.length > 0, canRedo: true });
        return null;
      }
      const current = captureWorkspaceSnapshot(hydratedResult);
      const nextRedoStack = undoHistory.push(redoStack, current, MAX_UNDO_STATES);
      const promptChanged = promptSettingsChanged(current, previous);
      const restored = await restoreHistorySnapshot(previous, hydratedResult, {
        [UNDO_KEY]: undoStack,
        [REDO_KEY]: nextRedoStack
      });
      sendResponse({ ok: true, state: restored.treeState, workspace: workspaceResponse(restored), promptChanged, canUndo: undoStack.length > 0, canRedo: true });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_REDO") {
    chrome.storage.local.get([...WORKSPACE_HISTORY_KEYS, UNDO_KEY, REDO_KEY]).then(async (result) => {
      const { state: next, stack: redoStack } = undoHistory.pop(result[REDO_KEY]);
      const undoStack = Array.isArray(result[UNDO_KEY]) ? result[UNDO_KEY] : [];
      if (!next) {
        sendResponse({ ok: true, state: null, canUndo: undoStack.length > 0, canRedo: false });
        return null;
      }
      const hydratedCurrentState = await hydrateStoredState(result[STORAGE_KEY]);
      const hydratedResult = { ...result, [STORAGE_KEY]: hydratedCurrentState };
      if (undoHistory.isNoteEdit(next)) {
        const currentState = hydratedCurrentState;
        const node = core.getNode(currentState, next.nodeId);
        if (!node) throw new Error("Note node does not exist");
        const restoredState = core.updateNode(currentState, node.id, {
          noteContent: next.after.content,
          noteEdited: next.after.edited
        });
        const nextUndoStack = undoHistory.push(undoStack, next, MAX_UNDO_STATES);
        const storedState = await prepareStateForStorage(restoredState);
        await chrome.storage.local.set({
          [STORAGE_KEY]: storedState,
          [UNDO_KEY]: nextUndoStack,
          [REDO_KEY]: redoStack
        });
        sendResponse({ ok: true, state: restoredState, workspace: null, promptChanged: false, canUndo: true, canRedo: redoStack.length > 0 });
        return null;
      }
      if (undoHistory.isWorkspacePatch(next)) {
        const current = captureWorkspaceSnapshot(hydratedResult);
        const target = undoHistory.applyWorkspacePatch(current, next, "after");
        const nextUndoStack = undoHistory.push(undoStack, next, MAX_UNDO_STATES);
        const promptChanged = promptSettingsChanged(current, target);
        const restored = await restoreHistorySnapshot(target, hydratedResult, {
          [UNDO_KEY]: nextUndoStack,
          [REDO_KEY]: redoStack
        });
        sendResponse({ ok: true, state: restored.treeState, workspace: workspaceResponse(restored), promptChanged, canUndo: true, canRedo: redoStack.length > 0 });
        return null;
      }
      const current = captureWorkspaceSnapshot(hydratedResult);
      const nextUndoStack = undoHistory.push(undoStack, current, MAX_UNDO_STATES);
      const promptChanged = promptSettingsChanged(current, next);
      const restored = await restoreHistorySnapshot(next, hydratedResult, {
        [UNDO_KEY]: nextUndoStack,
        [REDO_KEY]: redoStack
      });
      sendResponse({ ok: true, state: restored.treeState, workspace: workspaceResponse(restored), promptChanged, canUndo: true, canRedo: redoStack.length > 0 });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_SET") {
    prepareStateForStorage(message.state).then((nextState) => chrome.storage.local.set({ [STORAGE_KEY]: nextState })).then(() => {
      sendResponse({ ok: true });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LOCALE_GET") {
    chrome.storage.local.get(LOCALE_KEY).then((result) => {
      sendResponse({ ok: true, locale: result[LOCALE_KEY] || null });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LOCALE_SET") {
    const locale = message.locale === "zh" ? "zh" : "en";
    chrome.storage.local.set({ [LOCALE_KEY]: locale }).then(() => {
      sendResponse({ ok: true, locale });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_SAVE_GET") {
    chrome.storage.local.get(AUTO_SAVE_KEY).then((result) => {
      sendResponse({ ok: true, enabled: result[AUTO_SAVE_KEY] !== false });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_SAVE_SET") {
    const enabled = message.enabled !== false;
    chrome.storage.local.set({ [AUTO_SAVE_KEY]: enabled }).then(() => {
      sendResponse({ ok: true, enabled });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "NATIVE_BRANCH_PENDING_SET") {
    const pending = {
      parentId: String(message.pending?.parentId || ""),
      parentUrl: String(message.pending?.parentUrl || ""),
      baselineUserTurns: Math.max(0, Number(message.pending?.baselineUserTurns) || 0),
      branchUrl: "",
      previousBranchUrls: [],
      sourceTabId: Number(sender?.tab?.id) || 0,
      branchTabId: 0,
      completedAt: 0,
      createdAt: Date.now()
    };
    if (!pending.parentId || !pending.parentUrl) {
      sendResponse({ ok: false, error: "Invalid native branch parent" });
      return false;
    }
    chrome.storage.local.set({ [PENDING_NATIVE_BRANCH_KEY]: pending }).then(() => {
      sendResponse({ ok: true, pending });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "NATIVE_BRANCH_PENDING_CLAIM") {
    const candidateUrl = String(message.url || "");
    chrome.storage.local.get(PENDING_NATIVE_BRANCH_KEY).then(async (result) => {
      const pending = result[PENDING_NATIVE_BRANCH_KEY];
      const age = Date.now() - Number(pending?.createdAt || 0);
      const completionAge = Date.now() - Number(pending?.completedAt || 0);
      if (!pending || age > 2 * 60 * 60 * 1000
        || (pending.completedAt && completionAge > NATIVE_BRANCH_COMPLETION_GRACE_MS)) {
        if (pending) await chrome.storage.local.remove(PENDING_NATIVE_BRANCH_KEY);
        sendResponse({ ok: true, pending: null });
        return;
      }
      const candidateTabId = Number(sender?.tab?.id) || 0;
      const openerTabId = Number(sender?.tab?.openerTabId) || 0;
      const firstClaimEligible = !pending.sourceTabId || !candidateTabId
        || candidateTabId === pending.sourceTabId
        || openerTabId === pending.sourceTabId
        || (!pending.branchTabId && age < 5000);
      const sameBranchTab = !pending.branchTabId || !candidateTabId || candidateTabId === pending.branchTabId;
      if (candidateUrl && candidateUrl !== pending.parentUrl && !pending.branchUrl && firstClaimEligible) {
        pending.branchUrl = candidateUrl;
        pending.branchTabId = candidateTabId;
        await chrome.storage.local.set({ [PENDING_NATIVE_BRANCH_KEY]: pending });
      } else if (candidateUrl && candidateUrl !== pending.parentUrl
        && pending.branchUrl && candidateUrl !== pending.branchUrl && sameBranchTab) {
        pending.previousBranchUrls = [...new Set([
          ...(Array.isArray(pending.previousBranchUrls) ? pending.previousBranchUrls : []),
          pending.branchUrl
        ])].slice(-5);
        pending.branchUrl = candidateUrl;
        pending.branchTabId = pending.branchTabId || candidateTabId;
        pending.completedAt = pending.completedAt ? Date.now() : 0;
        await chrome.storage.local.set({ [PENDING_NATIVE_BRANCH_KEY]: pending });
      }
      sendResponse({ ok: true, pending: !pending.branchUrl || pending.branchUrl === candidateUrl ? pending : null });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "NATIVE_BRANCH_PENDING_COMPLETE") {
    chrome.storage.local.get(PENDING_NATIVE_BRANCH_KEY).then(async (result) => {
      const pending = result[PENDING_NATIVE_BRANCH_KEY];
      if (!pending || (message.url && pending.branchUrl !== message.url)) {
        sendResponse({ ok: true, pending: null });
        return;
      }
      pending.completedAt = Date.now();
      await chrome.storage.local.set({ [PENDING_NATIVE_BRANCH_KEY]: pending });
      sendResponse({ ok: true, pending });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "NATIVE_BRANCH_PENDING_CLEAR") {
    chrome.storage.local.remove(PENDING_NATIVE_BRANCH_KEY).then(() => {
      sendResponse({ ok: true });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LAUNCHER_POSITION_GET") {
    chrome.storage.local.get(LAUNCHER_POSITION_KEY).then((result) => {
      const stored = result[LAUNCHER_POSITION_KEY];
      const position = stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)
        ? { x: Math.min(1, Math.max(0, stored.x)), y: Math.min(1, Math.max(0, stored.y)) }
        : null;
      sendResponse({ ok: true, position });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LAUNCHER_POSITION_SET") {
    const position = {
      x: Math.min(1, Math.max(0, Number(message.position?.x) || 0)),
      y: Math.min(1, Math.max(0, Number(message.position?.y) || 0))
    };
    chrome.storage.local.set({ [LAUNCHER_POSITION_KEY]: position }).then(() => {
      sendResponse({ ok: true, position });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "PANEL_BOUNDS_GET") {
    chrome.storage.local.get(PANEL_BOUNDS_KEY).then((result) => {
      const stored = result[PANEL_BOUNDS_KEY];
      const bounds = stored && [stored.x, stored.y, stored.width, stored.height].every(Number.isFinite)
        ? {
            x: Math.min(1, Math.max(0, stored.x)),
            y: Math.min(1, Math.max(0, stored.y)),
            width: Math.min(4000, Math.max(280, stored.width)),
            height: Math.min(1000, Math.max(280, stored.height))
          }
        : null;
      sendResponse({ ok: true, bounds });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "PANEL_BOUNDS_SET") {
    const raw = message.bounds || {};
    const bounds = {
      x: Math.min(1, Math.max(0, Number(raw.x) || 0)),
      y: Math.min(1, Math.max(0, Number(raw.y) || 0)),
      width: Math.min(4000, Math.max(280, Number(raw.width) || 380)),
      height: Math.min(1000, Math.max(280, Number(raw.height) || 600))
    };
    chrome.storage.local.set({ [PANEL_BOUNDS_KEY]: bounds }).then(() => {
      sendResponse({ ok: true, bounds });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "EXTRACT_DEPTH_GET") {
    chrome.storage.local.get([EXTRACT_DEPTH_KEY, LEGACY_DEPTH_KEY]).then((result) => {
      const depth = normalizeTreeDepth(result[EXTRACT_DEPTH_KEY] ?? result[LEGACY_DEPTH_KEY]);
      sendResponse({ ok: true, depth });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "EXTRACT_DEPTH_SET") {
    const depth = normalizeTreeDepth(message.depth);
    chrome.storage.local.set({ [EXTRACT_DEPTH_KEY]: depth }).then(() => {
      sendResponse({ ok: true, depth });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_PROMPT_GET") {
    chrome.storage.local.get([TREE_PROMPT_KEY, TREE_PROMPT_POSITION_KEY]).then((result) => {
      const position = result[TREE_PROMPT_POSITION_KEY] === "prefix" ? "prefix" : "postfix";
      sendResponse({ ok: true, prompt: String(result[TREE_PROMPT_KEY] || "").trim().slice(0, 2500), position });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "TREE_PROMPT_SET") {
    const prompt = String(message.prompt || "").trim().slice(0, 2500);
    const position = message.position === "prefix" ? "prefix" : "postfix";
    const changes = { [TREE_PROMPT_POSITION_KEY]: position, ...(prompt ? { [TREE_PROMPT_KEY]: prompt } : {}) };
    const removeKeys = prompt ? [] : [TREE_PROMPT_KEY];
    const operation = message.skipHistory
      ? chrome.storage.local.set(changes).then(() => removeKeys.length ? chrome.storage.local.remove(removeKeys) : null).then(() => ({}))
      : commitUndoableSettings(changes, removeKeys);
    operation.then((historyState) => sendResponse({ ok: true, prompt, position, ...historyState }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CHILD_PROMPT_CONTEXT_GET") {
    chrome.storage.local.get(CHILD_PROMPT_CONTEXT_KEY).then((result) => {
      sendResponse({ ok: true, enabled: result[CHILD_PROMPT_CONTEXT_KEY] !== false });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CHILD_PROMPT_CONTEXT_SET") {
    const enabled = message.enabled !== false;
    commitUndoableSettings({ [CHILD_PROMPT_CONTEXT_KEY]: enabled }).then((historyState) => {
      sendResponse({ ok: true, enabled, ...historyState });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CHILD_PROMPT_TEMPLATE_GET") {
    chrome.storage.local.get(CHILD_PROMPT_TEMPLATE_KEY).then((result) => {
      const template = String(result[CHILD_PROMPT_TEMPLATE_KEY] || "").trim().slice(0, 1000);
      sendResponse({ ok: true, template });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CHILD_PROMPT_TEMPLATE_SET") {
    const template = String(message.template || "").trim().slice(0, 1000);
    const changes = {
      [CHILD_PROMPT_CONTEXT_KEY]: template ? template.includes("{context}") : true,
      ...(template ? { [CHILD_PROMPT_TEMPLATE_KEY]: template } : {})
    };
    const removeKeys = template ? [] : [CHILD_PROMPT_TEMPLATE_KEY];
    commitUndoableSettings(changes, removeKeys).then((historyState) => sendResponse({ ok: true, template, ...historyState }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CUSTOM_TOOLS_GET") {
    chrome.storage.local.get([CUSTOM_TOOLS_KEY, CUSTOM_PROMPT_KEY]).then((result) => {
      const stored = customTools.normalize(result[CUSTOM_TOOLS_KEY]);
      const legacyPrompt = String(result[CUSTOM_PROMPT_KEY] || "").trim();
      const tools = stored.length || !legacyPrompt
        ? stored
        : customTools.normalize([{ id: "legacy-custom", name: "Custom", prompt: legacyPrompt, position: "postfix" }]);
      if (!stored.length && tools.length) {
        return chrome.storage.local.set({ [CUSTOM_TOOLS_KEY]: tools }).then(() => chrome.storage.local.remove(CUSTOM_PROMPT_KEY)).then(() => {
          sendResponse({ ok: true, tools });
        });
      }
      sendResponse({ ok: true, tools });
      return null;
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "CUSTOM_TOOLS_SET") {
    const tools = customTools.normalize(message.tools);
    commitUndoableSettings({ [CUSTOM_TOOLS_KEY]: tools })
      .then((historyState) => chrome.storage.local.remove(CUSTOM_PROMPT_KEY).then(() => historyState))
      .then((historyState) => {
        sendResponse({ ok: true, tools, ...historyState });
      }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "PROMPT_PRESET_STATE_GET") {
    chrome.storage.local.get(PROMPT_PRESET_STATE_KEY).then((result) => {
      sendResponse({ ok: true, state: normalizePromptPresetState(result[PROMPT_PRESET_STATE_KEY]) });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "PROMPT_PRESET_STATE_SET") {
    const state = normalizePromptPresetState(message.state);
    commitUndoableSettings({ [PROMPT_PRESET_STATE_KEY]: state }).then((historyState) => {
      sendResponse({ ok: true, state, ...historyState });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LOCAL_BACKUP_EXPORT") {
    chrome.storage.local.get(BACKUP_STORAGE_KEYS).then(async (result) => {
      result[STORAGE_KEY] = await hydrateStoredState(result[STORAGE_KEY]);
      sendResponse({ ok: true, backup: createLocalBackup(result) });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "LOCAL_BACKUP_IMPORT") {
    chrome.storage.local.get([...WORKSPACE_HISTORY_KEYS, UNDO_KEY]).then(async (current) => {
      const restoredValues = validateLocalBackup(message.backup);
      current[STORAGE_KEY] = await hydrateStoredState(current[STORAGE_KEY]);
      const fullRestoredState = restoredValues[STORAGE_KEY];
      restoredValues[STORAGE_KEY] = await prepareStateForStorage(fullRestoredState);
      const nextResult = { ...current, ...restoredValues, [STORAGE_KEY]: fullRestoredState };
      const patch = undoHistory.workspacePatch(captureWorkspaceSnapshot(current), captureWorkspaceSnapshot(nextResult));
      const undoStack = patch ? undoHistory.push(current[UNDO_KEY], patch, MAX_UNDO_STATES) : (current[UNDO_KEY] || []);
      await chrome.storage.local.set({
        ...restoredValues,
        [UNDO_KEY]: undoStack,
        [REDO_KEY]: []
      });
      await syncAutoBackupAlarm();
      await handleAutomaticBackupAlarm();
      const restored = captureWorkspaceSnapshot(await chrome.storage.local.get(WORKSPACE_HISTORY_KEYS));
      sendResponse({
        ok: true,
        state: fullRestoredState,
        workspace: workspaceResponse(restored),
        extractDepth: restoredValues[EXTRACT_DEPTH_KEY],
        launcherPosition: restoredValues[LAUNCHER_POSITION_KEY],
        panelBounds: restoredValues[PANEL_BOUNDS_KEY],
        canUndo: true,
        canRedo: false
      });
    }).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_BACKUP_STATUS_GET") {
    autoBackupStatus().then((status) => sendResponse({ ok: true, ...status }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_BACKUP_SETTINGS_SET") {
    const settings = autoBackup.normalizeSettings(message.settings);
    chrome.storage.local.set({ [AUTO_BACKUP_SETTINGS_KEY]: settings })
      .then(syncAutoBackupAlarm)
      .then(autoBackupStatus)
      .then((status) => sendResponse({ ok: true, ...status }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_BACKUP_RUN_NOW") {
    handleAutomaticBackupAlarm().then(sendResponse);
    return true;
  }

  if (message.type === "AUTO_BACKUP_CHOOSE_FOLDER") {
    const locale = message.locale === "zh" ? "zh" : "en";
    chrome.tabs.create({ url: `${chrome.runtime.getURL("src/backup.html")}?locale=${locale}` })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "AUTO_BACKUP_FOLDER_SELECTED") {
    chrome.storage.local.set({
      [AUTO_BACKUP_FOLDER_NAME_KEY]: String(message.name || "").slice(0, 255),
      [AUTO_BACKUP_ERROR_KEY]: ""
    }).then(syncAutoBackupAlarm).then(autoBackupStatus).then((status) => {
      broadcastAutoBackupStatus(status);
      sendResponse({ ok: true, ...status });
    })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
}

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const relevantChanges = {};
  for (const [key, change] of Object.entries(changes)) {
    if (!SYNC_STORAGE_KEYS.has(key)) continue;
    const isHistoryStack = key === UNDO_KEY || key === REDO_KEY;
    relevantChanges[key] = {
      removed: typeof change.newValue === "undefined",
      value: typeof change.newValue === "undefined"
        ? null
        : (isHistoryStack && Array.isArray(change.newValue) ? change.newValue.length : change.newValue)
    };
  }
  if (!Object.keys(relevantChanges).length) return;
  for (const port of syncPorts) {
    try { port.postMessage({ event: "WORKSPACE_CHANGED", changes: relevantChanges }); } catch (_error) {}
  }
});
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "chat-notion-rpc") return;
  syncPorts.add(port);
  port.onDisconnect.addListener(() => syncPorts.delete(port));
  port.onMessage.addListener((envelope) => {
    const requestId = envelope?.requestId;
    if (!requestId || !envelope.message) return;
    let responded = false;
    const sendResponse = (response) => {
      if (responded) return;
      responded = true;
      try { port.postMessage({ requestId, response }); } catch (_error) {}
    };
    try {
      const pending = handleRuntimeMessage(envelope.message, port.sender, sendResponse);
      if (!pending && !responded) sendResponse({ ok: false, error: "Unknown request" });
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
    }
  });
});

async function restrictStorageAccess() {
  if (chrome.storage.local.setAccessLevel) {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  }
}
