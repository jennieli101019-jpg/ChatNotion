const test = require("node:test");
const assert = require("node:assert/strict");

const dragScroll = require("../src/drag-scroll.js");

test("scrolls upward and downward near the tree edges", () => {
  assert.ok(dragScroll.verticalVelocity(110, 100, 500) < 0);
  assert.equal(dragScroll.verticalVelocity(300, 100, 500), 0);
  assert.ok(dragScroll.verticalVelocity(490, 100, 500) > 0);
});

test("caps drag auto-scroll speed outside the tree", () => {
  assert.equal(dragScroll.verticalVelocity(0, 100, 500), -16);
  assert.equal(dragScroll.verticalVelocity(600, 100, 500), 16);
});
