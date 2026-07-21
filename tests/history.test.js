const test = require("node:test");
const assert = require("node:assert/strict");

const history = require("../src/history.js");

test("pushes local states and keeps only the configured limit", () => {
  let stack = [];
  stack = history.push(stack, { id: 1 }, 2);
  stack = history.push(stack, { id: 2 }, 2);
  stack = history.push(stack, { id: 3 }, 2);
  assert.deepEqual(stack.map((state) => state.id), [2, 3]);
});

test("pops the most recent state without mutating the input", () => {
  const original = [{ id: 1 }, { id: 2 }];
  const result = history.pop(original);
  assert.equal(result.state.id, 2);
  assert.deepEqual(result.stack.map((state) => state.id), [1]);
  assert.equal(original.length, 2);
});

test("returns no state when undo history is empty", () => {
  assert.deepEqual(history.pop([]), { state: null, stack: [] });
});

test("supports moving the current state between undo and redo stacks", () => {
  let undoStack = history.push([], { id: "before" });
  let redoStack = [];

  const undone = history.pop(undoStack);
  undoStack = undone.stack;
  redoStack = history.push(redoStack, { id: "after" });
  assert.equal(undone.state.id, "before");

  const redone = history.pop(redoStack);
  redoStack = redone.stack;
  undoStack = history.push(undoStack, undone.state);
  assert.equal(redone.state.id, "after");
  assert.deepEqual(undoStack.map((state) => state.id), ["before"]);
  assert.deepEqual(redoStack, []);
});

test("stores the tree and Prompt settings in one workspace snapshot", () => {
  const snapshot = history.workspace(
    { nodes: [{ id: "folder" }] },
    { chatNotionCustomTools: [{ id: "research" }] }
  );

  assert.equal(history.isWorkspace(snapshot), true);
  assert.equal(snapshot.treeState.nodes[0].id, "folder");
  assert.equal(snapshot.settings.chatNotionCustomTools[0].id, "research");
});

test("detects Prompt changes independently of tree changes", () => {
  const before = history.workspace({ nodes: [] }, { prompt: "Explain" });
  const treeOnly = history.workspace({ nodes: [{ id: "folder" }] }, { prompt: "Explain" });
  const promptEdit = history.workspace({ nodes: [] }, { prompt: "Compare" });

  assert.equal(history.settingsChanged(before, treeOnly), false);
  assert.equal(history.settingsChanged(before, promptEdit), true);
  assert.equal(history.settingsChanged({ nodes: [] }, promptEdit), false);
});

test("stores Note edits as compact history entries", () => {
  const entry = history.noteEdit("chat-1", "before", true, "after", true);

  assert.equal(history.isNoteEdit(entry), true);
  assert.equal(entry.nodeId, "chat-1");
  assert.deepEqual(entry.before, { content: "before", edited: true });
  assert.deepEqual(entry.after, { content: "after", edited: true });
  assert.equal(Object.prototype.hasOwnProperty.call(entry, "treeState"), false);
});

test("stores workspace changes without copying unchanged chat bodies", () => {
  const largeSnapshot = { messages: [{ role: "assistant", content: "large body" }] };
  const before = history.workspace({
    schemaVersion: 9,
    nodes: [
      { id: "chat-1", title: "Before", sourceSnapshot: largeSnapshot },
      { id: "chat-2", title: "Unchanged", sourceSnapshot: largeSnapshot }
    ],
    collapsedIds: []
  });
  const after = history.workspace({
    schemaVersion: 9,
    nodes: [
      { id: "chat-1", title: "After", sourceSnapshot: largeSnapshot },
      { id: "chat-2", title: "Unchanged", sourceSnapshot: largeSnapshot }
    ],
    collapsedIds: []
  });

  const patch = history.workspacePatch(before, after);
  assert.equal(history.isWorkspacePatch(patch), true);
  assert.equal(patch.nodeChanges.length, 1);
  assert.deepEqual(patch.nodeChanges[0].before, { title: "Before" });
  assert.deepEqual(patch.nodeChanges[0].after, { title: "After" });
  assert.equal(JSON.stringify(patch).includes("large body"), false);
  assert.equal(history.applyWorkspacePatch(after, patch, "before").treeState.nodes[0].title, "Before");
  assert.equal(history.applyWorkspacePatch(before, patch, "after").treeState.nodes[0].title, "After");
});

test("restores added and removed nodes from workspace patches", () => {
  const removed = { id: "old", title: "Old", noteContent: "keep me" };
  const added = { id: "new", title: "New" };
  const before = history.workspace({ nodes: [removed], collapsedIds: [] });
  const after = history.workspace({ nodes: [added], collapsedIds: [] });
  const patch = history.workspacePatch(before, after);

  assert.deepEqual(history.applyWorkspacePatch(after, patch, "before").treeState.nodes, [removed]);
  assert.deepEqual(history.applyWorkspacePatch(before, patch, "after").treeState.nodes, [added]);
});
