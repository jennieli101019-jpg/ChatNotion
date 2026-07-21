const test = require("node:test");
const assert = require("node:assert/strict");

const outline = require("../src/outline.js");

test("parses a plain-text Chinese answer into nested nodes and items", () => {
  const tree = outline.parseBlocks([{
    kind: "paragraph",
    text: `1. Transformer 与基础原理
Transformer 结构
需要掌握：
Token embedding、position embedding
Self-attention、cross-attention
Multi-head attention
FFN / MLP block
核心公式：
Q=XW
需要能回答：
为什么使用多个 attention head
Tokenization
掌握：
BPE
WordPiece
SentencePiece
2. 大模型训练
Pretraining
需要掌握：
Next-token prediction
Causal language modeling`
  }]);

  assert.equal(tree.length, 2);
  assert.equal(tree[0].title, "Transformer 与基础原理");
  assert.equal(tree[0].children[0].title, "Transformer 结构");
  assert.ok(tree[0].children[0].items.includes("Token embedding"));
  assert.ok(tree[0].children[0].items.includes("position embedding"));
  assert.equal(tree[0].children[1].title, "Tokenization");
  assert.ok(tree[0].children[1].items.includes("BPE"));
  assert.equal(tree[1].title, "大模型训练");
  assert.ok(outline.countItems(tree) >= 10);
});

test("uses semantic headings as the tree and ignores their supporting content", () => {
  const tree = outline.parseBlocks([
    { kind: "heading", level: 2, text: "Agent" },
    { kind: "heading", level: 3, text: "Planning" },
    { kind: "paragraph", text: "Planning helps an agent choose its next action." },
    { kind: "list", text: "ReAct" },
    { kind: "list", text: "Tree of Thoughts" },
    { kind: "heading", level: 4, text: "Search" }
  ]);

  assert.equal(tree[0].title, "Agent");
  assert.equal(tree[0].children[0].title, "Planning");
  assert.deepEqual(tree[0].children[0].items, []);
  assert.equal(tree[0].children[0].children[0].title, "Search");
});

test("does not split complete English sentences into comma-separated topics", () => {
  const tree = outline.parseBlocks([
    { kind: "paragraph", strong: true, text: "Step 1: Learn the Basics" },
    { kind: "list", text: "Understand stocks, ETFs, market orders, volume, and risk." },
    { kind: "list", text: "Position sizing" }
  ]);

  assert.equal(tree[0].title, "Step 1: Learn the Basics");
  assert.deepEqual(tree[0].items, ["Position sizing"]);
});

test("limits generated knowledge trees to the selected depth", () => {
  const tree = [{
    title: "Level 1",
    items: ["Level 2 item"],
    children: [{
      title: "Level 2 heading",
      items: ["Level 3 item"],
      children: [{ title: "Level 3 heading", items: [], children: [] }]
    }]
  }];
  const limited = outline.limitDepth(tree, 2);
  assert.deepEqual(limited[0].items, ["Level 2 item"]);
  assert.equal(limited[0].children.length, 1);
  assert.deepEqual(limited[0].children[0].items, []);
  assert.deepEqual(limited[0].children[0].children, []);
  const oneLevel = outline.limitDepth(tree, 1);
  assert.deepEqual(oneLevel[0].items, []);
  assert.deepEqual(oneLevel[0].children, []);
});
