"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const store = require("../src/content-store.js");

test("moves Note and chat bodies out of the lightweight workspace", async () => {
  const state = {
    schemaVersion: 10,
    nodes: [{
      id: "chat-1",
      title: "Chat",
      noteContent: "edited note",
      noteEdited: true,
      sourceUrl: "https://chatgpt.com/c/1",
      sourceSnapshot: { messages: [{ role: "assistant", content: "original answer" }] }
    }]
  };

  const lightweight = await store.persistAndStrip(state);
  assert.equal(lightweight.nodes[0].noteContent, "");
  assert.equal(lightweight.nodes[0].sourceSnapshot.messages.length, 0);
  assert.equal(lightweight.nodes[0].bodyStored, true);

  const hydrated = await store.hydrateState(lightweight);
  assert.equal(hydrated.nodes[0].noteContent, "edited note");
  assert.equal(hydrated.nodes[0].sourceSnapshot.messages[0].content, "original answer");
});
