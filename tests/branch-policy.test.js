const test = require("node:test");
const assert = require("node:assert/strict");

const policy = require("../src/branch-policy.js");

test("shows Generate tree only after an assistant answer finishes streaming", () => {
  assert.equal(policy.shouldShowGenerate(true, true), false);
  assert.equal(policy.shouldShowGenerate(true, false, false), false);
  assert.equal(policy.shouldShowGenerate(true, false, true), true);
  assert.equal(policy.shouldShowGenerate(false, false), false);
});
