"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const marquee = require("../src/marquee.js");

test("normalizes a selection rectangle dragged in any direction", () => {
  assert.deepEqual(marquee.rectangle(80, 90, 20, 30), {
    left: 20,
    top: 30,
    right: 80,
    bottom: 90,
    width: 60,
    height: 60
  });
});

test("selects every tree row touched by the marquee", () => {
  const rows = [
    { id: "one", rect: { left: 10, right: 200, top: 10, bottom: 40 } },
    { id: "two", rect: { left: 10, right: 200, top: 42, bottom: 72 } },
    { id: "three", rect: { left: 10, right: 200, top: 74, bottom: 104 } }
  ];
  const selection = marquee.rectangle(0, 35, 220, 80);
  assert.deepEqual(marquee.selectedIds(rows, selection), ["one", "two", "three"]);
});
