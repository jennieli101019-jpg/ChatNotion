const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../src/core.js");

function sampleGraph() {
  let state = core.createEmptyState();
  state = core.addNode(state, { id: "folder", kind: "folder", title: "Work" });
  state = core.addNode(state, {
    id: "chat",
    kind: "chat",
    parentId: "folder",
    title: "Product design",
    sourceUrl: "https://chatgpt.com/c/root"
  });
  state = core.addNode(state, {
    id: "branch",
    kind: "branch",
    parentId: "chat",
    title: "Chrome extension architecture",
    sourceUrl: "https://chatgpt.com/c/branch-1",
    parentConversationUrl: "https://chatgpt.com/c/root",
    sourceMessageIndex: 4,
    sourceMessageHash: "abc123"
  });
  return state;
}

test("creates a Folder > Chat > Branch graph", () => {
  const state = sampleGraph();
  assert.equal(state.nodes.length, 3);
  assert.equal(core.getChildren(state, "chat")[0].id, "branch");
});

test("stores and updates a private note on a conversation node", () => {
  let state = sampleGraph();
  state = core.updateNode(state, "chat", { noteContent: "# Key points\n\n- Keep this", noteEdited: true });
  assert.equal(core.getNode(state, "chat").noteContent, "# Key points\n\n- Keep this");
  assert.equal(core.getNode(state, "chat").noteEdited, true);
});

test("preserves an intentionally empty edited document", () => {
  let state = sampleGraph();
  state = core.updateNode(state, "chat", { noteContent: "", noteEdited: true });
  assert.equal(core.getNode(state, "chat").noteContent, "");
  assert.equal(core.getNode(state, "chat").noteEdited, true);
});

test("migrates version 6 nodes with an empty note by default", () => {
  const legacy = sampleGraph();
  legacy.schemaVersion = 6;
  for (const node of legacy.nodes) delete node.noteContent;
  const migrated = core.validateState(legacy);
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(core.getNode(migrated, "chat").noteContent, "");
});

test("stores a normalized local conversation snapshot separately from the note", () => {
  let state = sampleGraph();
  state = core.updateNode(state, "chat", {
    sourceSnapshot: {
      sourceUrl: "https://chatgpt.com/c/root", capturedAt: 123, contentHash: "hash", complete: true,
      messages: [
        { id: "u1", role: "user", content: "Question" },
        { id: "a1", role: "assistant", content: "Answer" }
      ]
    }
  });
  const node = core.getNode(state, "chat");
  assert.equal(node.noteContent, "");
  assert.deepEqual(node.sourceSnapshot.messages.map(({ role, content }) => [role, content]), [
    ["user", "Question"], ["assistant", "Answer"]
  ]);
  assert.equal(node.sourceSnapshot.complete, true);
});

test("keeps the workspace timestamp stable during read-only validation", () => {
  const state = core.createEmptyState();
  state.updatedAt = 123456;

  assert.equal(core.validateState(state).updatedAt, 123456);
  assert.equal(core.validateState(core.validateState(state)).updatedAt, 123456);
});

test("migrates version 7 nodes with an empty source snapshot", () => {
  const legacy = sampleGraph();
  legacy.schemaVersion = 7;
  for (const node of legacy.nodes) delete node.sourceSnapshot;
  const migrated = core.validateState(legacy);
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.deepEqual(core.getNode(migrated, "chat").sourceSnapshot.messages, []);
});

test("migrates version 8 edited documents", () => {
  const legacy = sampleGraph();
  legacy.schemaVersion = 8;
  legacy.nodes.find((node) => node.id === "chat").noteContent = "Edited summary";
  const migrated = core.validateState(legacy);
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(core.getNode(migrated, "chat").noteEdited, true);
});

test("returns the full ancestor path for a nested conversation", () => {
  const state = sampleGraph();
  assert.deepEqual(core.getNodePath(state, "branch").map((node) => node.id), ["folder", "chat", "branch"]);
});

test("unlinks every local reference when a ChatGPT conversation is deleted", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "duplicate-reference",
    kind: "chat",
    parentId: "folder",
    title: "Same conversation",
    sourceUrl: "https://chatgpt.com/c/branch-1",
    status: "ready"
  });

  state = core.unlinkConversation(state, "https://chatgpt.com/c/branch-1");

  assert.equal(core.getNode(state, "branch").sourceUrl, "");
  assert.equal(core.getNode(state, "branch").status, "idea");
  assert.equal(core.getNode(state, "duplicate-reference").sourceUrl, "");
  assert.equal(core.getNode(state, "chat").sourceUrl, "https://chatgpt.com/c/root");
});

test("collapsing a parent also collapses descendant parents", () => {
  let state = sampleGraph();
  state = core.addNode(state, { id: "leaf", kind: "chat", parentId: "branch", title: "Leaf" });
  state = core.toggleCollapsed(state, "folder");
  assert.deepEqual(new Set(state.collapsedIds), new Set(["folder", "chat", "branch"]));

  state = core.toggleCollapsed(state, "folder");
  assert.equal(state.collapsedIds.includes("folder"), false);
  assert.equal(state.collapsedIds.includes("chat"), true);
  assert.equal(state.collapsedIds.includes("branch"), true);
});

test("preserves answer order when sibling positions are equal", () => {
  let state = sampleGraph();
  const position = core.getNode(state, "branch").position;
  state = core.addNode(state, { id: "child-z", kind: "chat", parentId: "chat", title: "Z first", position, status: "idea" });
  state = core.addNode(state, { id: "child-a", kind: "chat", parentId: "chat", title: "A second", position, status: "idea" });
  assert.deepEqual(core.getChildren(state, "chat").map((node) => node.id), ["branch", "child-z", "child-a"]);
});

test("allows a branch inside another branch", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "child-branch",
    kind: "branch",
    parentId: "branch",
    title: "Permissions",
    status: "pending"
  });
  assert.equal(core.getNode(state, "child-branch").parentId, "branch");
  assert.equal(core.getNode(state, "child-branch").status, "pending");
});

test("repairs a root conversation into a nested native branch", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "incorrect-root",
    kind: "chat",
    title: "Branch of branch",
    sourceUrl: "https://chatgpt.com/c/branch-2"
  });
  state = core.nestConversationAsBranch(
    state,
    "incorrect-root",
    "branch",
    "https://chatgpt.com/c/branch-1"
  );
  const repaired = core.getNode(state, "incorrect-root");
  assert.equal(repaired.kind, "branch");
  assert.equal(repaired.parentId, "branch");
  assert.equal(repaired.parentConversationUrl, "https://chatgpt.com/c/branch-1");
});

test("consolidates duplicate root branches into the nested conversation", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "duplicate-root",
    kind: "chat",
    title: "Branch · Chrome extension architecture",
    sourceUrl: "https://chatgpt.com/c/branch-1"
  });
  state = core.addNode(state, {
    id: "branch-of-branch",
    kind: "branch",
    parentId: "duplicate-root",
    title: "Branch of branch",
    sourceUrl: "https://chatgpt.com/c/branch-2"
  });

  state = core.consolidateConversationDuplicates(state);
  const matches = state.nodes.filter((node) => node.sourceUrl === "https://chatgpt.com/c/branch-1");
  assert.deepEqual(matches.map((node) => node.id), ["branch"]);
  assert.equal(core.getNode(state, "branch-of-branch").parentId, "branch");
});

test("merges a final branch URL root into its earlier nested branch", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "final-url-root",
    kind: "chat",
    title: "Branch · Chrome extension architecture",
    sourceUrl: "https://chatgpt.com/c/branch-final"
  });
  state = core.addNode(state, {
    id: "nested-follow-up",
    kind: "branch",
    parentId: "final-url-root",
    title: "Branch of branch",
    sourceUrl: "https://chatgpt.com/c/follow-up"
  });

  state = core.mergeConversationNodes(state, "branch", "final-url-root", "https://chatgpt.com/c/branch-final");
  assert.equal(core.getNode(state, "final-url-root"), null);
  assert.equal(core.getNode(state, "branch").sourceUrl, "https://chatgpt.com/c/branch-final");
  assert.equal(core.getNode(state, "nested-follow-up").parentId, "branch");
});

test("consolidates an existing final-URL Branch root by its exact native title", () => {
  let state = sampleGraph();
  state = core.updateNode(state, "branch", { title: "Branch · Chrome extension architecture" });
  state = core.addNode(state, {
    id: "legacy-final-root",
    kind: "chat",
    title: "Branch · Chrome extension architecture",
    sourceUrl: "https://chatgpt.com/c/branch-final",
    createdAt: core.getNode(state, "branch").createdAt + 1000
  });
  state = core.addNode(state, {
    id: "legacy-nested-follow-up",
    kind: "branch",
    parentId: "legacy-final-root",
    title: "Branch · Branch · Chrome extension architecture",
    sourceUrl: "https://chatgpt.com/c/branch-2"
  });

  state = core.consolidateConversationDuplicates(state);
  assert.equal(core.getNode(state, "legacy-final-root"), null);
  assert.equal(core.getNode(state, "branch").sourceUrl, "https://chatgpt.com/c/branch-final");
  assert.equal(core.getNode(state, "legacy-nested-follow-up").parentId, "branch");
});

test("allows every record kind to become another record's child", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    kind: "branch",
    parentId: "folder",
    title: "Folder branch"
  });
  state = core.addNode(state, { id: "project", kind: "project", title: "Research" });
  state = core.moveNode(state, "project", "branch");
  state = core.addNode(state, { id: "nested-folder", kind: "folder", title: "Notes" });
  state = core.moveNode(state, "nested-folder", "project");
  assert.equal(core.getNode(state, "project").parentId, "branch");
  assert.equal(core.getNode(state, "nested-folder").parentId, "project");
});

test("finds both root chats and branch conversations by URL", () => {
  const state = sampleGraph();
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/root").id, "chat");
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/branch-1").id, "branch");
});

test("treats chats with the same title but different URLs as separate conversations", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "same-title-chat",
    kind: "chat",
    title: "Product design",
    sourceUrl: "https://chatgpt.com/c/different-chat"
  });
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/root").id, "chat");
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/different-chat").id, "same-title-chat");
});

test("finds a URL-linked knowledge chat while its answer is still pending", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "pending-child",
    kind: "chat",
    parentId: "chat",
    title: "Context engineering",
    status: "pending",
    sourceUrl: "https://chatgpt.com/c/generating"
  });
  const conversation = core.findConversationByUrl(state, "https://chatgpt.com/c/generating");
  assert.equal(conversation.id, "pending-child");
  assert.equal(conversation.status, "pending");
});

test("finalizes a pending branch without changing its anchor", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "pending",
    kind: "branch",
    parentId: "branch",
    title: "New branch",
    sourceMessageHash: "anchor",
    status: "pending"
  });
  state = core.updateNode(state, "pending", {
    sourceUrl: "https://chatgpt.com/c/branch-2",
    status: "ready"
  });
  assert.equal(core.getNode(state, "pending").sourceUrl, "https://chatgpt.com/c/branch-2");
  assert.equal(core.getNode(state, "pending").sourceMessageHash, "anchor");
  assert.equal(core.getNode(state, "pending").status, "ready");
});

test("rejects circular moves", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "child-branch",
    kind: "branch",
    parentId: "branch",
    title: "Follow-up"
  });
  assert.throws(() => core.moveNode(state, "branch", "child-branch"), /descendants/);
});

test("moves a nested chat back to the top level", () => {
  let state = sampleGraph();
  state = core.addNode(state, { id: "nested-chat", kind: "chat", parentId: "chat", title: "KV cache" });
  state = core.moveNode(state, "nested-chat", null);
  assert.equal(core.getNode(state, "nested-chat").parentId, null);
  assert.ok(core.getChildren(state, null).some((node) => node.id === "nested-chat"));
});

test("reorders a chat before another chat at the same level", () => {
  let state = sampleGraph();
  state = core.addNode(state, { id: "first", kind: "chat", parentId: "folder", title: "First" });
  state = core.addNode(state, { id: "second", kind: "chat", parentId: "folder", title: "Second" });
  state = core.moveNodeRelative(state, "second", "chat", "before");
  assert.deepEqual(core.getChildren(state, "folder").map((node) => node.id), ["second", "chat", "first"]);
});

test("moves a chat beside a target under a different parent", () => {
  let state = sampleGraph();
  state = core.addNode(state, { id: "other-folder", kind: "folder", title: "Other" });
  state = core.addNode(state, { id: "other-chat", kind: "chat", parentId: "other-folder", title: "Other chat" });
  state = core.moveNodeRelative(state, "branch", "other-chat", "after");
  assert.equal(core.getNode(state, "branch").parentId, "other-folder");
  assert.deepEqual(core.getChildren(state, "other-folder").map((node) => node.id), ["other-chat", "branch"]);
});

test("rejects moving a parent beside one of its descendants", () => {
  const state = sampleGraph();
  assert.throws(() => core.moveNodeRelative(state, "chat", "branch", "before"), /descendants/);
});

test("removes descendant branches without touching their ChatGPT data", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "child-branch",
    kind: "branch",
    parentId: "branch",
    title: "Follow-up"
  });
  state = core.removeNode(state, "branch");
  assert.equal(core.getNode(state, "branch"), null);
  assert.equal(core.getNode(state, "child-branch"), null);
  assert.equal(core.getNode(state, "chat").sourceUrl, "https://chatgpt.com/c/root");
});

test("archives linked descendants and restores them only for the same answer path", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "nested-linked-chat",
    kind: "chat",
    parentId: "branch",
    title: "Permission model",
    sourceUrl: "https://chatgpt.com/c/permission-model",
    parentConversationUrl: "https://chatgpt.com/c/branch-1",
    sourceMessageHash: "abc123",
    sourceOutlinePath: ["Chrome extension architecture", "Permission model"]
  });

  state = core.updateNode(state, "nested-linked-chat", { title: "Renamed permission notes" });
  state = core.archiveConversationLinks(state, ["branch"]);
  state = core.removeNode(state, "branch");
  const restored = core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/branch-1",
    sourceMessageHash: "abc123",
    pathTitles: ["Chrome extension architecture", "Permission model"]
  });

  assert.equal(restored.sourceUrl, "https://chatgpt.com/c/permission-model");
  assert.equal(core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/branch-1",
    sourceMessageHash: "different-answer",
    pathTitles: ["Chrome extension architecture", "Permission model"]
  }), null);
  assert.equal(core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/branch-1",
    sourceMessageHash: "abc123",
    pathTitles: ["Different topic", "Permission model"]
  }), null);
});

test("restores explored nodes after deleting and regenerating an entire conversation tree", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "generated-topic",
    kind: "chat",
    parentId: "chat",
    title: "Memory",
    sourceMessageHash: "answer-hash",
    sourceOutlinePath: ["Agentic AI", "Memory"],
    parentConversationUrl: "https://chatgpt.com/c/root",
    status: "idea"
  });
  state = core.addNode(state, {
    id: "explored-leaf",
    kind: "chat",
    parentId: "generated-topic",
    title: "Long-Term Memory",
    sourceUrl: "https://chatgpt.com/c/long-term-memory",
    parentConversationUrl: "https://chatgpt.com/c/root",
    sourceMessageHash: "answer-hash",
    sourceOutlinePath: ["Agentic AI", "Memory", "Long-Term Memory"],
    status: "ready"
  });

  state = core.archiveConversationLinks(state, ["chat"]);
  state = core.removeNode(state, "chat");

  const restored = core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/root",
    sourceMessageHash: "answer-hash",
    pathTitles: ["Agentic AI", "Memory", "Long-Term Memory"]
  });
  assert.equal(restored.sourceUrl, "https://chatgpt.com/c/long-term-memory");
  assert.equal(restored.parentConversationUrl, "https://chatgpt.com/c/root");
});

test("restores a moved nested tree from the conversation that generated it", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "memory-chat",
    kind: "chat",
    parentId: "chat",
    title: "Memory",
    sourceUrl: "https://chatgpt.com/c/memory",
    parentConversationUrl: "https://chatgpt.com/c/root",
    sourceMessageHash: "outer-answer",
    sourceOutlinePath: ["Agentic AI", "Memory"],
    status: "ready"
  });
  state = core.addNode(state, {
    id: "nested-category",
    kind: "chat",
    parentId: "memory-chat",
    title: "Memory Types",
    parentConversationUrl: "https://chatgpt.com/c/memory",
    sourceMessageHash: "memory-answer",
    sourceOutlinePath: ["Memory Types"],
    status: "idea"
  });
  state = core.addNode(state, {
    id: "nested-explored",
    kind: "chat",
    parentId: "nested-category",
    title: "Long-Term Memory",
    sourceUrl: "https://chatgpt.com/c/long-term-memory",
    parentConversationUrl: "https://chatgpt.com/c/memory",
    sourceMessageHash: "memory-answer",
    sourceOutlinePath: ["Memory Types", "Long-Term Memory"],
    status: "ready"
  });

  // Workspace edits must not replace the immutable extraction provenance.
  state = core.moveNode(state, "nested-explored", "memory-chat");
  state = core.updateNode(state, "nested-explored", { title: "My memory notes" });
  state = core.archiveConversationLinks(state, ["chat"]);
  state = core.removeNode(state, "chat");

  const restored = core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/memory",
    sourceMessageHash: "memory-answer",
    pathTitles: ["Memory Types", "Long-Term Memory"]
  });
  assert.equal(restored.sourceUrl, "https://chatgpt.com/c/long-term-memory");
});

test("recovers a uniquely identifiable nested link archived with a legacy outer anchor", () => {
  const state = core.validateState({
    ...core.createEmptyState(),
    archivedChatLinks: [{
      anchorUrl: "https://chatgpt.com/c/outer-root",
      sourceMessageHash: "nested-answer",
      pathTitles: ["Memory Types", "Long-Term Memory"],
      sourceUrl: "https://chatgpt.com/c/long-term-memory",
      parentConversationUrl: "https://chatgpt.com/c/memory"
    }]
  });

  const restored = core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/memory",
    sourceMessageHash: "nested-answer",
    pathTitles: ["Memory Types", "Long-Term Memory"]
  });
  assert.equal(restored.sourceUrl, "https://chatgpt.com/c/long-term-memory");
});

test("does not guess between conflicting legacy archived conversations", () => {
  const state = core.validateState({
    ...core.createEmptyState(),
    archivedChatLinks: [
      {
        anchorUrl: "https://chatgpt.com/c/outer-a",
        sourceMessageHash: "same-answer",
        pathTitles: ["Memory"],
        sourceUrl: "https://chatgpt.com/c/memory-a"
      },
      {
        anchorUrl: "https://chatgpt.com/c/outer-b",
        sourceMessageHash: "same-answer",
        pathTitles: ["Memory"],
        sourceUrl: "https://chatgpt.com/c/memory-b"
      }
    ]
  });

  assert.equal(core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/new-anchor",
    sourceMessageHash: "same-answer",
    pathTitles: ["Memory"]
  }), null);
});

test("removes an archived solid link when its ChatGPT conversation is deleted", () => {
  let state = core.archiveConversationLinks(sampleGraph(), ["branch"]);
  state = core.removeNode(state, "branch");
  assert.equal(core.hasConversationReference(state, "https://chatgpt.com/c/branch-1"), true);
  state = core.unlinkConversation(state, "https://chatgpt.com/c/branch-1");
  assert.equal(core.hasConversationReference(state, "https://chatgpt.com/c/branch-1"), false);
  assert.equal(core.findArchivedConversationLink(state, {
    anchorUrl: "https://chatgpt.com/c/root",
    sourceMessageHash: "abc123",
    pathTitles: ["Chrome extension architecture"]
  }), null);
});

test("migrates version 1 Pages to flat legacy annotations", () => {
  const legacy = {
    schemaVersion: 1,
    nodes: [
      { id: "chat", kind: "chat", parentId: null, title: "Old chat", sourceUrl: "https://chatgpt.com/c/old" },
      { id: "page", kind: "page", parentId: "chat", title: "Saved text", sourceMessageHash: "oldhash" },
      { id: "nested", kind: "page", parentId: "page", title: "Nested text" }
    ],
    collapsedIds: []
  };
  const migrated = core.validateState(legacy);
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(core.getNode(migrated, "page").kind, "annotation");
  assert.equal(core.getNode(migrated, "nested").parentId, "chat");
});

test("creates an answer-generated tree of generic child chats", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "child",
    kind: "chat",
    parentId: "chat",
    title: "Transformer 与基础原理",
    sourceMessageHash: "answer-hash",
    parentConversationUrl: "https://chatgpt.com/c/root"
  });
  state = core.addNode(state, {
    id: "grandchild",
    kind: "chat",
    parentId: "child",
    title: "Token embedding",
    status: "idea",
    prompt: "请深入讲解 Token embedding"
  });
  assert.equal(core.getNode(state, "grandchild").status, "idea");
  assert.equal(core.getNode(state, "grandchild").prompt, "请深入讲解 Token embedding");
  assert.equal(core.findConversationByUrl(state, ""), null);
});

test("supports appending generic child chats at every depth", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "manual-child",
    kind: "chat",
    parentId: "chat",
    title: "Manual child",
    status: "idea"
  });
  state = core.addNode(state, {
    id: "manual-grandchild",
    kind: "chat",
    parentId: "manual-child",
    title: "Manual grandchild",
    status: "idea"
  });
  assert.deepEqual(core.getChildren(state, "manual-child").map((node) => node.id), ["manual-grandchild"]);
  assert.equal(core.getNode(state, "manual-grandchild").status, "idea");
  state = core.addNode(state, {
    id: "nested-child",
    kind: "chat",
    parentId: "manual-grandchild",
    title: "Nested child",
    status: "idea"
  });
  assert.equal(core.getChildren(state, "manual-grandchild")[0].id, "nested-child");
});

test("a child becomes a conversation after it gets a real URL", () => {
  let state = sampleGraph();
  state = core.addNode(state, {
    id: "child",
    kind: "chat",
    parentId: "chat",
    title: "ReAct",
    status: "idea"
  });
  state = core.updateNode(state, "child", { status: "ready", sourceUrl: "https://chatgpt.com/c/react" });
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/react").id, "child");
  state = core.addNode(state, { kind: "branch", parentId: "child", title: "ReAct failure modes" });
  assert.equal(core.getChildren(state, "child").length, 1);
});

test("a child chat keeps its nested children after linking", () => {
  let state = sampleGraph();
  state = core.addNode(state, { id: "child-chat", kind: "chat", parentId: "chat", title: "Architecture", status: "idea" });
  state = core.addNode(state, { id: "nested-child", kind: "chat", parentId: "child-chat", title: "Agent loop", status: "idea" });
  state = core.updateNode(state, "child-chat", { status: "ready", sourceUrl: "https://chatgpt.com/c/architecture" });
  state = core.addNode(state, { kind: "branch", parentId: "child-chat", title: "Architecture follow-up" });
  assert.equal(core.findConversationByUrl(state, "https://chatgpt.com/c/architecture").id, "child-chat");
  assert.equal(core.getChildren(state, "child-chat").length, 2);
});

test("migrates version 3 Sections and Topics into generic child chats", () => {
  const migrated = core.validateState({
    schemaVersion: 3,
    nodes: [
      { id: "root", kind: "chat", parentId: null, title: "Root", sourceUrl: "https://chatgpt.com/c/root" },
      { id: "legacy-section", kind: "section", parentId: "root", title: "Architecture", status: "idea" },
      { id: "legacy-topic", kind: "topic", parentId: "legacy-section", title: "Context", status: "idea" }
    ],
    collapsedIds: []
  });
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(core.getNode(migrated, "legacy-section").kind, "chat");
  assert.equal(core.getNode(migrated, "legacy-topic").kind, "chat");
  assert.equal(core.getNode(migrated, "legacy-topic").parentId, "legacy-section");
});

test("does not create legacy Section or Topic node kinds", () => {
  assert.throws(() => core.createNode({ kind: "section", title: "Legacy" }), /Unsupported node kind/);
  assert.throws(() => core.createNode({ kind: "topic", title: "Legacy" }), /Unsupported node kind/);
});

test("migrates version 2 branch graphs without losing URLs", () => {
  const previous = sampleGraph();
  previous.schemaVersion = 2;
  const migrated = core.validateState(previous);
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(core.getNode(migrated, "branch").sourceUrl, "https://chatgpt.com/c/branch-1");
});

test("parses regular and Project conversation URLs", () => {
  const regular = core.parseChatGptLocation("/c/abc-123");
  assert.equal(regular.kind, "chat");
  assert.equal(regular.chatUrl, "https://chatgpt.com/c/abc-123");

  const project = core.parseChatGptLocation("/g/g-p-6a57145-private-project/c/chat-123");
  assert.equal(project.kind, "project-chat");
  assert.equal(project.chatUrl, "https://chatgpt.com/g/g-p-6a57145-private-project/c/chat-123");
  assert.equal(project.projectUrl, "https://chatgpt.com/g/g-p-6a57145-private-project/project");
});

test("remembers when a user removes an auto-saved conversation", () => {
  const url = "https://chatgpt.com/c/removed";
  let state = core.createEmptyState();
  state = core.dismissAutoSave(state, [url]);
  assert.equal(core.isAutoSaveDismissed(state, url), true);
  state = core.restoreAutoSave(state, url);
  assert.equal(core.isAutoSaveDismissed(state, url), false);
});

test("migrates version 4 workspaces without auto-save dismissals", () => {
  const migrated = core.validateState({ schemaVersion: 4, nodes: [], collapsedIds: [] });
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.deepEqual(migrated.dismissedChatUrls, []);
  assert.deepEqual(migrated.archivedChatLinks, []);
});

test("migrates version 5 workspaces without archived Chat links", () => {
  const migrated = core.validateState({
    schemaVersion: 5,
    nodes: [],
    collapsedIds: [],
    dismissedChatUrls: ["https://chatgpt.com/c/removed"]
  });
  assert.equal(migrated.schemaVersion, core.SCHEMA_VERSION);
  assert.deepEqual(migrated.dismissedChatUrls, ["https://chatgpt.com/c/removed"]);
  assert.deepEqual(migrated.archivedChatLinks, []);
});
