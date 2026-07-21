(function exposeCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionCore = api;
  }
})(globalThis, function createCore() {
  "use strict";

  const SCHEMA_VERSION = 10;
  const MAX_NOTE_LENGTH = 200000;
  const MAX_SNAPSHOT_MESSAGES = 200;
  const MAX_SNAPSHOT_MESSAGE_LENGTH = 50000;

  function normalizeSourceSnapshot(value) {
    const messages = (Array.isArray(value?.messages) ? value.messages : [])
      .map((message, index) => ({
        id: String(message?.id || `message-${index}`).slice(0, 160),
        role: message?.role === "user" ? "user" : "assistant",
        content: String(message?.content || "").trim().slice(0, MAX_SNAPSHOT_MESSAGE_LENGTH),
        position: index
      }))
      .filter((message) => message.content)
      .slice(0, MAX_SNAPSHOT_MESSAGES);
    return {
      sourceUrl: String(value?.sourceUrl || ""),
      messages,
      capturedAt: Number.isFinite(value?.capturedAt) ? value.capturedAt : 0,
      contentHash: String(value?.contentHash || "").slice(0, 128),
      complete: value?.complete === true
    };
  }
  const NODE_KINDS = new Set(["folder", "project", "chat", "branch", "annotation"]);

  function now() {
    return Date.now();
  }

  function createId(prefix = "node") {
    const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    return `${prefix}-${random}`;
  }

  function createEmptyState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      nodes: [],
      collapsedIds: [],
      dismissedChatUrls: [],
      archivedChatLinks: [],
      updatedAt: now()
    };
  }

  function normalizeTitle(value, fallback = "Untitled") {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    return normalized.slice(0, 120) || fallback;
  }

  function parseChatGptLocation(pathname, origin = "https://chatgpt.com") {
    const base = String(origin).replace(/\/$/, "");
    const path = String(pathname || "");
    const regularChat = path.match(/^\/c\/([^/?#]+)/);
    if (regularChat) {
      return {
        kind: "chat",
        chatUrl: `${base}/c/${regularChat[1]}`,
        projectUrl: "",
        projectSlug: ""
      };
    }

    const projectChat = path.match(/^\/g\/([^/?#]+)\/c\/([^/?#]+)/);
    if (projectChat) {
      const projectSlug = projectChat[1];
      return {
        kind: projectSlug.startsWith("g-p-") ? "project-chat" : "gpt-chat",
        chatUrl: `${base}/g/${projectSlug}/c/${projectChat[2]}`,
        projectUrl: projectSlug.startsWith("g-p-") ? `${base}/g/${projectSlug}/project` : "",
        projectSlug
      };
    }

    const project = path.match(/^\/g\/(g-p-[^/?#]+)(?:\/project)?\/?$/);
    if (project) {
      return {
        kind: "project",
        chatUrl: "",
        projectUrl: `${base}/g/${project[1]}/project`,
        projectSlug: project[1]
      };
    }

    return { kind: "unsupported", chatUrl: "", projectUrl: "", projectSlug: "" };
  }

  function createNode(input) {
    if (!NODE_KINDS.has(input.kind)) {
      throw new Error(`Unsupported node kind: ${input.kind}`);
    }

    const timestamp = now();
    return {
      id: input.id || createId(input.kind),
      kind: input.kind,
      parentId: input.parentId ?? null,
      title: normalizeTitle(input.title),
      position: Number.isFinite(input.position) ? input.position : timestamp,
      sourceUrl: input.sourceUrl || "",
      sourceMessageIndex: Number.isInteger(input.sourceMessageIndex) ? input.sourceMessageIndex : null,
      sourceMessageHash: input.sourceMessageHash || "",
      sourceOutlinePath: (Array.isArray(input.sourceOutlinePath) ? input.sourceOutlinePath : [])
        .map((title) => normalizeTitle(title))
        .filter(Boolean)
        .slice(0, 20),
      parentConversationUrl: input.parentConversationUrl || "",
      status: ["idea", "pending", "ready"].includes(input.status) ? input.status : "ready",
      prompt: String(input.prompt || "").slice(0, 500),
      noteContent: String(input.noteContent || "").slice(0, MAX_NOTE_LENGTH),
      noteEdited: input.noteEdited === true || Boolean(input.noteContent),
      sourceSnapshot: normalizeSourceSnapshot(input.sourceSnapshot),
      bodyStored: input.bodyStored === true,
      createdAt: input.createdAt || timestamp,
      updatedAt: input.updatedAt || timestamp
    };
  }

  // structuredClone is roughly an order of magnitude cheaper than a JSON round-trip here, and
  // every tree operation clones the whole workspace. State is plain JSON-safe data either way.
  function cloneState(state) {
    return typeof structuredClone === "function"
      ? structuredClone(state)
      : JSON.parse(JSON.stringify(state));
  }

  function getNode(state, id) {
    return state.nodes.find((node) => node.id === id) || null;
  }

  function getChildren(state, parentId) {
    return state.nodes
      .map((node, index) => ({ node, index }))
      .filter((item) => item.node.parentId === parentId)
      .sort((a, b) => a.node.position - b.node.position || a.index - b.index)
      .map((item) => item.node);
  }

  function getNodePath(state, nodeId) {
    const path = [];
    const visited = new Set();
    let current = getNode(state, nodeId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      current = current.parentId ? getNode(state, current.parentId) : null;
    }
    return path;
  }

  function isDescendant(state, candidateId, ancestorId) {
    let current = getNode(state, candidateId);
    const visited = new Set();

    while (current?.parentId) {
      if (visited.has(current.id)) return true;
      visited.add(current.id);
      if (current.parentId === ancestorId) return true;
      current = getNode(state, current.parentId);
    }
    return false;
  }

  function canContain(parentKind, childKind) {
    const recordKinds = ["folder", "project", "chat", "branch"];
    return recordKinds.includes(parentKind) && [...recordKinds, "annotation"].includes(childKind);
  }

  function addNode(state, input) {
    const next = cloneState(state);
    const node = createNode(input);

    if (node.parentId) {
      const parent = getNode(next, node.parentId);
      if (!parent) throw new Error("Parent node does not exist");
      if (!canContain(parent.kind, node.kind)) {
        throw new Error(`${parent.kind} cannot contain ${node.kind}`);
      }
    }

    if (next.nodes.some((item) => item.id === node.id)) {
      throw new Error("Node id already exists");
    }

    next.nodes.push(node);
    next.updatedAt = now();
    return next;
  }

  function moveNode(state, nodeId, parentId) {
    const next = cloneState(state);
    const node = getNode(next, nodeId);
    const parent = parentId ? getNode(next, parentId) : null;

    if (!node) throw new Error("Node does not exist");
    if (parentId === nodeId || (parent && isDescendant(next, parent.id, node.id))) {
      throw new Error("Cannot move a node into itself or its descendants");
    }
    if (parent && !canContain(parent.kind, node.kind)) {
      throw new Error(`${parent.kind} cannot contain ${node.kind}`);
    }
    if (!parent && node.kind === "annotation") {
      throw new Error("Conversation content must remain inside a conversation");
    }

    node.parentId = parentId ?? null;
    node.position = now();
    node.updatedAt = now();
    next.updatedAt = now();
    return next;
  }

  function nestConversationAsBranch(state, nodeId, parentId, parentConversationUrl = "") {
    let next = moveNode(state, nodeId, parentId);
    const node = getNode(next, nodeId);
    const parent = getNode(next, parentId);
    if (!node || !parent || !["chat", "branch"].includes(node.kind) || !["chat", "branch"].includes(parent.kind)) {
      throw new Error("Native branch requires conversation nodes");
    }
    node.kind = "branch";
    node.parentConversationUrl = String(parentConversationUrl || parent.sourceUrl || "");
    node.updatedAt = now();
    next.updatedAt = now();
    return next;
  }

  function mergeConversationNodes(state, canonicalId, duplicateId, sourceUrl = "") {
    let next = cloneState(state);
    const canonical = getNode(next, canonicalId);
    const duplicate = getNode(next, duplicateId);
    if (!canonical || !duplicate || canonical.id === duplicate.id) {
      throw new Error("Conversation nodes cannot be merged");
    }
    for (const child of getChildren(next, duplicate.id)) {
      if (child.id === canonical.id) throw new Error("Cannot merge an ancestor into its descendant");
      next = moveNode(next, child.id, canonical.id);
    }
    next = removeNode(next, duplicate.id);
    if (sourceUrl) next = updateNode(next, canonical.id, { sourceUrl });
    return next;
  }

  function consolidateConversationDuplicates(state) {
    let next = cloneState(state);
    const urls = [...new Set(next.nodes
      .filter((node) => ["chat", "branch"].includes(node.kind) && node.sourceUrl)
      .map((node) => node.sourceUrl))];

    for (const sourceUrl of urls) {
      const duplicates = next.nodes.filter(
        (node) => ["chat", "branch"].includes(node.kind) && node.sourceUrl === sourceUrl
      );
      if (duplicates.length < 2) continue;
      const score = (node) => (node.kind === "branch" ? 100 : 0)
        + (node.parentId ? 20 : 0)
        + getChildren(next, node.id).length;
      const canonical = [...duplicates].sort((a, b) => score(b) - score(a))[0];

      for (const duplicate of duplicates) {
        if (duplicate.id === canonical.id || !getNode(next, duplicate.id)) continue;
        let safeToRemove = true;
        for (const child of getChildren(next, duplicate.id)) {
          if (child.id === canonical.id) {
            safeToRemove = false;
            break;
          }
          try {
            next = moveNode(next, child.id, canonical.id);
          } catch (_error) {
            safeToRemove = false;
            break;
          }
        }
        if (safeToRemove) next = removeNode(next, duplicate.id);
      }
    }

    const rootBranchCopies = next.nodes.filter((node) => node.kind === "chat"
      && !node.parentId
      && /^branch\s*[·:—-]\s*/i.test(node.title));
    for (const rootCopy of rootBranchCopies) {
      if (!getNode(next, rootCopy.id)) continue;
      const matchingNested = next.nodes
        .filter((node) => node.kind === "branch"
          && node.parentId
          && node.title.toLocaleLowerCase() === rootCopy.title.toLocaleLowerCase()
          && Math.abs(Number(node.createdAt) - Number(rootCopy.createdAt)) < 5 * 60 * 1000)
        .sort((a, b) => Math.abs(Number(a.createdAt) - Number(rootCopy.createdAt))
          - Math.abs(Number(b.createdAt) - Number(rootCopy.createdAt)))[0];
      if (!matchingNested) continue;
      try {
        next = mergeConversationNodes(next, matchingNested.id, rootCopy.id, rootCopy.sourceUrl);
      } catch (_error) {}
    }
    return next;
  }

  function moveNodeRelative(state, nodeId, targetId, placement = "before") {
    if (!["before", "after"].includes(placement)) {
      throw new Error("Placement must be before or after");
    }

    const next = cloneState(state);
    const node = getNode(next, nodeId);
    const target = getNode(next, targetId);
    if (!node || !target) throw new Error("Node does not exist");
    if (node.id === target.id) throw new Error("Cannot move a node relative to itself");

    const parentId = target.parentId ?? null;
    const parent = parentId ? getNode(next, parentId) : null;
    if (parentId === node.id || (parent && isDescendant(next, parent.id, node.id))) {
      throw new Error("Cannot move a node into itself or its descendants");
    }
    if (parent && !canContain(parent.kind, node.kind)) {
      throw new Error(`${parent.kind} cannot contain ${node.kind}`);
    }
    if (!parent && node.kind === "annotation") {
      throw new Error("Conversation content must remain inside a conversation");
    }

    const siblings = getChildren(next, parentId).filter((item) => item.id !== node.id);
    const targetIndex = siblings.findIndex((item) => item.id === target.id);
    if (targetIndex < 0) throw new Error("Target is not in the destination");
    siblings.splice(targetIndex + (placement === "after" ? 1 : 0), 0, node);

    node.parentId = parentId;
    siblings.forEach((item, index) => { item.position = index + 1; });
    node.updatedAt = now();
    next.updatedAt = now();
    return next;
  }

  function updateNode(state, nodeId, changes) {
    const next = cloneState(state);
    const node = getNode(next, nodeId);
    if (!node) throw new Error("Node does not exist");

    if (Object.prototype.hasOwnProperty.call(changes, "title")) {
      node.title = normalizeTitle(changes.title, node.title);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "sourceUrl")) {
      node.sourceUrl = String(changes.sourceUrl || "");
    }
    if (Object.prototype.hasOwnProperty.call(changes, "status")) {
      node.status = ["idea", "pending", "ready"].includes(changes.status) ? changes.status : "ready";
    }
    if (Object.prototype.hasOwnProperty.call(changes, "prompt")) {
      node.prompt = String(changes.prompt || "").slice(0, 500);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "noteContent")) {
      node.noteContent = String(changes.noteContent || "").slice(0, MAX_NOTE_LENGTH);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "noteEdited")) {
      node.noteEdited = changes.noteEdited === true;
    }
    if (Object.prototype.hasOwnProperty.call(changes, "sourceSnapshot")) {
      node.sourceSnapshot = normalizeSourceSnapshot(changes.sourceSnapshot);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "bodyStored")) {
      node.bodyStored = changes.bodyStored === true;
    }
    node.updatedAt = now();
    next.updatedAt = now();
    return next;
  }

  function removeNode(state, nodeId) {
    const next = cloneState(state);
    const removeIds = new Set([nodeId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const node of next.nodes) {
        if (node.parentId && removeIds.has(node.parentId) && !removeIds.has(node.id)) {
          removeIds.add(node.id);
          changed = true;
        }
      }
    }

    next.nodes = next.nodes.filter((node) => !removeIds.has(node.id));
    next.collapsedIds = next.collapsedIds.filter((id) => !removeIds.has(id));
    next.updatedAt = now();
    return next;
  }

  function archivedPathKey(pathTitles) {
    return (Array.isArray(pathTitles) ? pathTitles : [])
      .map((title) => normalizeTitle(title).toLocaleLowerCase())
      .join("\u001f");
  }

  function archiveConversationLinks(state, nodeIds) {
    const next = cloneState(state);
    const roots = new Set((Array.isArray(nodeIds) ? nodeIds : [nodeIds]).filter(Boolean));
    const removeIds = new Set();
    for (const node of next.nodes) {
      if (getNodePath(next, node.id).some((ancestor) => roots.has(ancestor.id))) removeIds.add(node.id);
    }

    const archived = Array.isArray(next.archivedChatLinks) ? [...next.archivedChatLinks] : [];
    for (const node of next.nodes) {
      if (!removeIds.has(node.id) || !["chat", "branch"].includes(node.kind) || !node.sourceUrl) continue;
      const path = getNodePath(next, node.id);
      const firstRemovedIndex = path.findIndex((ancestor) => removeIds.has(ancestor.id));
      // Keep the nearest conversation URL at or above the deletion boundary.
      // When the conversation root itself is deleted there is no surviving
      // parent, so the removed root's URL must remain the recovery anchor.
      const survivingAnchor = path
        .slice(0, Math.max(0, firstRemovedIndex))
        .reverse()
        .find((ancestor) => String(ancestor?.sourceUrl || "").trim()) || null;
      const removedBoundary = path[Math.max(0, firstRemovedIndex)] || null;
      const anchor = survivingAnchor
        || (String(removedBoundary?.sourceUrl || "").trim() ? removedBoundary : null);
      const pathTitles = node.sourceOutlinePath?.length
        ? node.sourceOutlinePath
        : path.slice(Math.max(0, firstRemovedIndex)).map((ancestor) => ancestor.title);
      const sourceMessageHash = String(node.sourceMessageHash || path[firstRemovedIndex]?.sourceMessageHash || "").trim();
      // Extraction provenance is independent from the node's current place in
      // the workspace. Prefer the conversation whose answer produced this
      // outline, so moving or deeply nesting the node cannot break recovery.
      const anchorUrl = String(node.parentConversationUrl || anchor?.sourceUrl || "").trim();
      if (!anchorUrl || !sourceMessageHash || !pathTitles.length) continue;

      const entry = {
        anchorUrl,
        sourceMessageHash,
        pathTitles,
        sourceUrl: node.sourceUrl,
        parentConversationUrl: node.parentConversationUrl || anchorUrl,
        updatedAt: now()
      };
      const key = `${anchorUrl}\u001e${sourceMessageHash}\u001e${archivedPathKey(pathTitles)}`;
      const existingIndex = archived.findIndex((candidate) => (
        `${candidate.anchorUrl}\u001e${candidate.sourceMessageHash}\u001e${archivedPathKey(candidate.pathTitles)}` === key
      ));
      if (existingIndex >= 0) archived.splice(existingIndex, 1);
      archived.push(entry);
    }
    next.archivedChatLinks = archived.slice(-1000);
    next.updatedAt = now();
    return next;
  }

  function findArchivedConversationLink(state, { anchorUrl, sourceMessageHash, pathTitles } = {}) {
    const normalizedAnchor = String(anchorUrl || "").trim();
    const normalizedHash = String(sourceMessageHash || "").trim();
    const pathKey = archivedPathKey(pathTitles);
    if (!normalizedAnchor || !normalizedHash || !pathKey) return null;
    const archived = [...(Array.isArray(state?.archivedChatLinks) ? state.archivedChatLinks : [])].reverse();
    const exact = archived.find((entry) => entry.anchorUrl === normalizedAnchor
      && entry.sourceMessageHash === normalizedHash
      && archivedPathKey(entry.pathTitles) === pathKey) || null;
    if (exact) return exact;

    // Versions before 0.64.7 could archive a deeply generated tree against
    // its outermost deleted conversation. Recover that legacy record only
    // when answer fingerprint + original outline path identify one URL.
    const legacyCandidates = archived.filter((entry) => entry.sourceMessageHash === normalizedHash
      && archivedPathKey(entry.pathTitles) === pathKey);
    const legacyUrls = new Set(legacyCandidates.map((entry) => entry.sourceUrl));
    return legacyUrls.size === 1 ? legacyCandidates[0] : null;
  }

  function unlinkConversation(state, sourceUrl) {
    const normalizedUrl = String(sourceUrl || "");
    if (!normalizedUrl) return cloneState(state);
    const next = cloneState(state);
    let changed = false;
    for (const node of next.nodes) {
      if (node.sourceUrl !== normalizedUrl) continue;
      node.sourceUrl = "";
      node.status = "idea";
      node.updatedAt = now();
      changed = true;
    }
    const archivedLength = Array.isArray(next.archivedChatLinks) ? next.archivedChatLinks.length : 0;
    next.archivedChatLinks = (Array.isArray(next.archivedChatLinks) ? next.archivedChatLinks : [])
      .filter((entry) => entry.sourceUrl !== normalizedUrl);
    if (next.archivedChatLinks.length !== archivedLength) changed = true;
    if (changed) next.updatedAt = now();
    return next;
  }

  function dismissAutoSave(state, sourceUrls) {
    const next = cloneState(state);
    const dismissed = new Set(Array.isArray(next.dismissedChatUrls) ? next.dismissedChatUrls : []);
    for (const sourceUrl of sourceUrls || []) {
      const normalized = String(sourceUrl || "").trim();
      if (normalized) dismissed.add(normalized);
    }
    next.dismissedChatUrls = [...dismissed].slice(-500);
    next.updatedAt = now();
    return next;
  }

  function restoreAutoSave(state, sourceUrl) {
    const normalized = String(sourceUrl || "").trim();
    const next = cloneState(state);
    next.dismissedChatUrls = (Array.isArray(next.dismissedChatUrls) ? next.dismissedChatUrls : [])
      .filter((url) => url !== normalized);
    next.updatedAt = now();
    return next;
  }

  function isAutoSaveDismissed(state, sourceUrl) {
    const normalized = String(sourceUrl || "").trim();
    return Boolean(normalized && Array.isArray(state?.dismissedChatUrls) && state.dismissedChatUrls.includes(normalized));
  }

  function toggleCollapsed(state, nodeId) {
    const next = cloneState(state);
    const ids = new Set(next.collapsedIds);
    if (ids.has(nodeId)) {
      ids.delete(nodeId);
    } else {
      const childrenByParent = new Map();
      for (const node of next.nodes) {
        if (!node.parentId) continue;
        const children = childrenByParent.get(node.parentId) || [];
        children.push(node.id);
        childrenByParent.set(node.parentId, children);
      }
      const visited = new Set();
      const pending = [nodeId];
      while (pending.length) {
        const id = pending.pop();
        if (visited.has(id)) continue;
        visited.add(id);
        const children = childrenByParent.get(id) || [];
        if (children.length) ids.add(id);
        pending.push(...children);
      }
    }
    next.collapsedIds = [...ids];
    next.updatedAt = now();
    return next;
  }

  function findChatByUrl(state, sourceUrl) {
    if (!sourceUrl) return null;
    return state.nodes.find((node) => node.kind === "chat" && node.sourceUrl === sourceUrl) || null;
  }

  function findConversationByUrl(state, sourceUrl) {
    if (!sourceUrl) return null;
    return state.nodes.find(
      (node) => ["chat", "branch"].includes(node.kind)
        && node.sourceUrl === sourceUrl
    ) || null;
  }

  function hasConversationReference(state, sourceUrl) {
    const normalizedUrl = String(sourceUrl || "").trim();
    if (!normalizedUrl) return false;
    return Boolean(findConversationByUrl(state, normalizedUrl)
      || (Array.isArray(state?.archivedChatLinks)
        && state.archivedChatLinks.some((entry) => entry.sourceUrl === normalizedUrl)));
  }

  function migrateV1(value) {
    const migrated = createEmptyState();
    const legacyNodes = Array.isArray(value?.nodes) ? value.nodes : [];
    const legacyById = new Map(legacyNodes.map((node) => [node.id, node]));

    for (const raw of legacyNodes.filter((node) => node.kind !== "page")) {
      migrated.nodes.push(createNode(raw));
    }

    for (const raw of legacyNodes.filter((node) => node.kind === "page")) {
      let parent = legacyById.get(raw.parentId);
      while (parent?.kind === "page") parent = legacyById.get(parent.parentId);
      if (!parent || parent.kind !== "chat") continue;
      migrated.nodes.push(createNode({
        ...raw,
        kind: "annotation",
        parentId: parent.id,
        title: `[Legacy note] ${raw.title || "Saved passage"}`
      }));
    }

    migrated.collapsedIds = Array.isArray(value?.collapsedIds)
      ? value.collapsedIds.filter((id) => migrated.nodes.some((node) => node.id === id))
      : [];
    return migrated;
  }

  function migrateV2(value) {
    return {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode(node))
    };
  }

  function migrateV3(value) {
    return {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode({
        ...node,
        kind: ["section", "topic"].includes(node.kind) ? "chat" : node.kind
      }))
    };
  }

  function migrateV4(value) {
    return {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      dismissedChatUrls: []
    };
  }

  function migrateV5(value) {
    return {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      archivedChatLinks: []
    };
  }

  function validateState(value) {
    if (value?.schemaVersion === 1) value = migrateV1(value);
    if (value?.schemaVersion === 2) value = migrateV2(value);
    if (value?.schemaVersion === 3) value = migrateV3(value);
    if (value?.schemaVersion === 4) value = migrateV4(value);
    if (value?.schemaVersion === 5) value = migrateV5(value);
    if (value?.schemaVersion === 6) value = {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode(node))
    };
    if (value?.schemaVersion === 7) value = {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode(node))
    };
    if (value?.schemaVersion === 8) value = {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode(node))
    };
    if (value?.schemaVersion === 9) value = {
      ...value,
      schemaVersion: SCHEMA_VERSION,
      nodes: value.nodes.map((node) => createNode(node))
    };
    if (!value || value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.nodes)) {
      throw new Error("Unsupported or invalid local state format");
    }

    const ids = new Set();
    for (const rawNode of value.nodes) {
      if (!rawNode || typeof rawNode.id !== "string" || ids.has(rawNode.id)) {
        throw new Error("Local state contains invalid or duplicate node ids");
      }
      if (!NODE_KINDS.has(rawNode.kind)) throw new Error("Local state contains an invalid node kind");
      ids.add(rawNode.id);
    }

    for (const rawNode of value.nodes) {
      if (rawNode.parentId && !ids.has(rawNode.parentId)) {
        throw new Error("Local state contains an orphan node");
      }
    }

    const normalized = createEmptyState();
    normalized.nodes = value.nodes.map((node) => createNode(node));
    normalized.collapsedIds = Array.isArray(value.collapsedIds)
      ? value.collapsedIds.filter((id) => ids.has(id))
      : [];
    normalized.dismissedChatUrls = [...new Set(Array.isArray(value.dismissedChatUrls)
      ? value.dismissedChatUrls.map((url) => String(url || "").trim()).filter(Boolean)
      : [])].slice(-500);
    normalized.archivedChatLinks = (Array.isArray(value.archivedChatLinks) ? value.archivedChatLinks : [])
      .map((entry) => ({
        anchorUrl: String(entry?.anchorUrl || "").trim(),
        sourceMessageHash: String(entry?.sourceMessageHash || "").trim(),
        pathTitles: (Array.isArray(entry?.pathTitles) ? entry.pathTitles : [])
          .map((title) => normalizeTitle(title))
          .filter(Boolean)
          .slice(0, 20),
        sourceUrl: String(entry?.sourceUrl || "").trim(),
        parentConversationUrl: String(entry?.parentConversationUrl || "").trim(),
        updatedAt: Number(entry?.updatedAt) || now()
      }))
      .filter((entry) => entry.anchorUrl && entry.sourceMessageHash && entry.pathTitles.length && entry.sourceUrl)
      .slice(-1000);
    normalized.updatedAt = Number(value.updatedAt) || now();

    for (const node of normalized.nodes) {
      if (!node.parentId) continue;
      const parent = getNode(normalized, node.parentId);
      if (!canContain(parent.kind, node.kind)) {
        throw new Error("Local state contains an invalid parent-child relationship");
      }
      if (isDescendant(normalized, node.parentId, node.id)) {
        throw new Error("Local state contains a cycle");
      }
    }

    return normalized;
  }

  return {
    SCHEMA_VERSION,
    addNode,
    archiveConversationLinks,
    canContain,
    consolidateConversationDuplicates,
    createEmptyState,
    createId,
    createNode,
    dismissAutoSave,
    findChatByUrl,
    findArchivedConversationLink,
    findConversationByUrl,
    getChildren,
    getNodePath,
    getNode,
    hasConversationReference,
    isDescendant,
    isAutoSaveDismissed,
    moveNode,
    moveNodeRelative,
    mergeConversationNodes,
    nestConversationAsBranch,
    normalizeTitle,
    parseChatGptLocation,
    removeNode,
    restoreAutoSave,
    toggleCollapsed,
    unlinkConversation,
    updateNode,
    validateState
  };
});
