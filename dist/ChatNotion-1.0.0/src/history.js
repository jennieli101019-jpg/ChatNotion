(function exposeUndoHistory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionUndoHistory = api;
  }
})(globalThis, function createUndoHistory() {
  "use strict";

  function push(stack, state, limit = 10) {
    const next = Array.isArray(stack) ? [...stack] : [];
    if (state) next.push(state);
    return next.slice(-Math.max(1, limit));
  }

  function pop(stack) {
    const next = Array.isArray(stack) ? [...stack] : [];
    const state = next.pop() || null;
    return { state, stack: next };
  }

  function workspace(treeState, settings = {}) {
    return {
      historyVersion: 1,
      treeState: treeState || null,
      settings: { ...(settings && typeof settings === "object" ? settings : {}) }
    };
  }

  function isWorkspace(value) {
    return value?.historyVersion === 1 && value.settings && typeof value.settings === "object";
  }

  function settingsChanged(before, after) {
    if (!isWorkspace(before) || !isWorkspace(after)) return false;
    return JSON.stringify(before.settings) !== JSON.stringify(after.settings);
  }

  function noteEdit(nodeId, beforeContent, beforeEdited, afterContent, afterEdited) {
    return {
      historyVersion: 2,
      type: "note-edit",
      nodeId: String(nodeId || ""),
      before: { content: String(beforeContent || ""), edited: beforeEdited === true },
      after: { content: String(afterContent || ""), edited: afterEdited === true }
    };
  }

  function isNoteEdit(value) {
    return value?.historyVersion === 2 && value.type === "note-edit" && Boolean(value.nodeId);
  }

  function workspacePatch(beforeWorkspace, afterWorkspace) {
    const beforeTree = beforeWorkspace?.treeState || { nodes: [] };
    const afterTree = afterWorkspace?.treeState || { nodes: [] };
    const beforeNodes = new Map((beforeTree.nodes || []).map((node, index) => [node.id, { node, index }]));
    const afterNodes = new Map((afterTree.nodes || []).map((node, index) => [node.id, { node, index }]));
    const nodeChanges = [];
    for (const id of new Set([...beforeNodes.keys(), ...afterNodes.keys()])) {
      const before = beforeNodes.get(id);
      const after = afterNodes.get(id);
      if (!before) {
        nodeChanges.push({ id, kind: "add", after: after.node, afterIndex: after.index });
      } else if (!after) {
        nodeChanges.push({ id, kind: "remove", before: before.node, beforeIndex: before.index });
      } else if (JSON.stringify(before.node) !== JSON.stringify(after.node)) {
        const beforeFields = {};
        const afterFields = {};
        for (const key of new Set([...Object.keys(before.node), ...Object.keys(after.node)])) {
          if (JSON.stringify(before.node[key]) === JSON.stringify(after.node[key])) continue;
          beforeFields[key] = before.node[key];
          afterFields[key] = after.node[key];
        }
        nodeChanges.push({ id, kind: "update", before: beforeFields, after: afterFields });
      }
    }
    const withoutNodes = (tree) => Object.fromEntries(Object.entries(tree || {}).filter(([key]) => key !== "nodes"));
    const beforeMeta = withoutNodes(beforeTree);
    const afterMeta = withoutNodes(afterTree);
    const beforeSettings = beforeWorkspace?.settings || {};
    const afterSettings = afterWorkspace?.settings || {};
    if (!nodeChanges.length
      && JSON.stringify(beforeMeta) === JSON.stringify(afterMeta)
      && JSON.stringify(beforeSettings) === JSON.stringify(afterSettings)) return null;
    return {
      historyVersion: 3,
      type: "workspace-patch",
      nodeChanges,
      tree: { before: beforeMeta, after: afterMeta },
      settings: { before: beforeSettings, after: afterSettings }
    };
  }

  function isWorkspacePatch(value) {
    return value?.historyVersion === 3 && value.type === "workspace-patch" && Array.isArray(value.nodeChanges);
  }

  function applyWorkspacePatch(currentWorkspace, patch, direction) {
    const side = direction === "after" ? "after" : "before";
    const nodes = [...(currentWorkspace?.treeState?.nodes || [])];
    for (const change of patch.nodeChanges || []) {
      const index = nodes.findIndex((node) => node.id === change.id);
      if (change.kind === "add") {
        if (side === "before") {
          if (index >= 0) nodes.splice(index, 1);
        } else if (index < 0) {
          nodes.splice(Math.min(change.afterIndex ?? nodes.length, nodes.length), 0, change.after);
        }
      } else if (change.kind === "remove") {
        if (side === "before" && index < 0) {
          nodes.splice(Math.min(change.beforeIndex ?? nodes.length, nodes.length), 0, change.before);
        } else if (side === "after" && index >= 0) nodes.splice(index, 1);
      } else if (change.kind === "update" && index >= 0) {
        nodes[index] = { ...nodes[index], ...(change[side] || {}) };
      }
    }
    return workspace(
      { ...(patch.tree?.[side] || {}), nodes },
      { ...(patch.settings?.[side] || {}) }
    );
  }

  return {
    push, pop, workspace, isWorkspace, settingsChanged,
    noteEdit, isNoteEdit, workspacePatch, isWorkspacePatch, applyWorkspacePatch
  };
});
