(function exposeContentStore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ChatNotionContentStore = api;
})(globalThis, function createContentStore() {
  "use strict";

  const DB_NAME = "chatnotion-content";
  const STORE_NAME = "node-content";
  const memory = new Map();
  let databasePromise = null;
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function openDatabase() {
    if (!globalThis.indexedDB) return Promise.resolve(null);
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open content storage"));
    });
    return databasePromise;
  }

  function bodyFromNode(node) {
    return {
      id: node.id,
      noteContent: String(node.noteContent || ""),
      noteEdited: node.noteEdited === true,
      sourceSnapshot: node.sourceSnapshot || null
    };
  }

  function hasBody(body) {
    return Boolean(body?.noteEdited || body?.noteContent || body?.sourceSnapshot?.messages?.length);
  }

  async function putMany(records) {
    const entries = records.filter((record) => record?.id);
    if (!entries.length) return;
    const database = await openDatabase();
    if (!database) {
      for (const record of entries) memory.set(record.id, clone(record));
      return;
    }
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      for (const record of entries) store.put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save content"));
      transaction.onabort = () => reject(transaction.error || new Error("Content save was aborted"));
    });
  }

  async function getMany(ids) {
    const keys = [...new Set(ids.filter(Boolean))];
    const database = await openDatabase();
    if (!database) return keys.map((id) => memory.get(id)).filter(Boolean).map(clone);
    return Promise.all(keys.map((id) => new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read content"));
    }))).then((records) => records.filter(Boolean));
  }

  async function pruneExcept(ids) {
    const keep = new Set(ids.filter(Boolean));
    const database = await openDatabase();
    if (!database) {
      for (const id of memory.keys()) if (!keep.has(id)) memory.delete(id);
      return;
    }
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        for (const id of request.result || []) if (!keep.has(id)) store.delete(id);
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not clean content storage"));
    });
  }

  async function saveStateBodies(state) {
    const records = (state?.nodes || []).map(bodyFromNode).filter(hasBody);
    await putMany(records);
  }

  function stripStateBodies(state) {
    return {
      ...state,
      nodes: (state?.nodes || []).map((node) => ({
        ...node,
        noteContent: "",
        sourceSnapshot: { sourceUrl: node.sourceUrl || "", messages: [], capturedAt: 0, contentHash: "", complete: false },
        bodyStored: hasBody(bodyFromNode(node)) || node.bodyStored === true
      }))
    };
  }

  async function hydrateState(state) {
    const records = await getMany((state?.nodes || []).filter((node) => node.bodyStored).map((node) => node.id));
    const byId = new Map(records.map((record) => [record.id, record]));
    return {
      ...state,
      nodes: (state?.nodes || []).map((node) => {
        const body = byId.get(node.id);
        return body ? { ...node, ...body, id: node.id, bodyStored: true } : node;
      })
    };
  }

  async function persistAndStrip(state) {
    await saveStateBodies(state);
    await pruneExcept((state?.nodes || []).map((node) => node.id));
    return stripStateBodies(state);
  }

  return { bodyFromNode, hasBody, saveStateBodies, stripStateBodies, hydrateState, persistAndStrip };
});
