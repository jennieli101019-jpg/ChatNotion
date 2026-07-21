(function initChatNotionAutoBackup(root) {
  "use strict";

  const DB_NAME = "ChatNotionAutoBackup";
  const STORE_NAME = "directoryHandles";
  const DIRECTORY_KEY = "backupDirectory";
  const FILE_PREFIX = "ChatNotion-auto-backup-";
  const ALLOWED_INTERVALS = [0, 60, 360, 1440, 10080];

  function normalizeSettings(value) {
    const raw = value && typeof value === "object" ? value : {};
    const intervalMinutes = ALLOWED_INTERVALS.includes(Number(raw.intervalMinutes))
      ? Number(raw.intervalMinutes)
      : 0;
    const retention = Math.min(20, Math.max(1, Math.round(Number(raw.retention) || 10)));
    return { intervalMinutes, retention };
  }

  function fileName(date = new Date()) {
    return `${FILE_PREFIX}${date.toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z")}.json`;
  }

  function matchingFileNames(names) {
    return [...names].filter((name) => name.startsWith(FILE_PREFIX) && name.endsWith(".json")).sort().reverse();
  }

  function filesToDelete(names, retention) {
    return matchingFileNames(names).slice(normalizeSettings({ retention }).retention);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open backup storage"));
    });
  }

  async function withStore(mode, operation) {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Could not access backup storage"));
      });
    } finally {
      db.close();
    }
  }

  function saveDirectoryHandle(handle) {
    return withStore("readwrite", (store) => store.put(handle, DIRECTORY_KEY));
  }

  function getDirectoryHandle() {
    return withStore("readonly", (store) => store.get(DIRECTORY_KEY));
  }

  function removeDirectoryHandle() {
    return withStore("readwrite", (store) => store.delete(DIRECTORY_KEY));
  }

  async function inspectDirectoryHandle(handle) {
    if (!handle) return { permission: "missing", folderName: "" };
    try {
      const permission = await handle.queryPermission({ mode: "readwrite" });
      if (permission === "granted" && typeof handle.entries === "function") {
        await handle.entries().next();
      }
      return {
        permission,
        folderName: typeof handle.name === "string" ? handle.name.slice(0, 255) : ""
      };
    } catch (_error) {
      return { permission: "unavailable", folderName: "" };
    }
  }

  root.ChatNotionAutoBackup = {
    ALLOWED_INTERVALS,
    FILE_PREFIX,
    normalizeSettings,
    fileName,
    matchingFileNames,
    filesToDelete,
    saveDirectoryHandle,
    getDirectoryHandle,
    removeDirectoryHandle,
    inspectDirectoryHandle
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
