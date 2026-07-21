const test = require("node:test");
const assert = require("node:assert/strict");

const customTools = require("../src/custom-tools.js");

test("normalizes multiple named custom prompt tools", () => {
  const tools = customTools.normalize([
    { id: "review", name: "Review", prompt: "Critique this", position: "prefix" },
    { id: "examples", name: "Examples", prompt: "Give examples", position: "postfix" }
  ]);
  assert.deepEqual(tools, [
    { id: "review", name: "Review", prompt: "Critique this", position: "prefix" },
    { id: "examples", name: "Examples", prompt: "Give examples", position: "postfix" }
  ]);
});

test("drops empty tools and defaults insertion to postfix", () => {
  const tools = customTools.normalize([
    { id: "empty", name: "Empty", prompt: "" },
    { id: "valid", name: "  My   tool  ", prompt: "  Apply this  ", position: "unknown" }
  ]);
  assert.deepEqual(tools, [{ id: "valid", name: "My tool", prompt: "Apply this", position: "postfix" }]);
});
