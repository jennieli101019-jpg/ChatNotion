const test = require("node:test");
const assert = require("node:assert/strict");

const prompts = require("../src/prompts.js");

test("creates a minimal English child prompt", () => {
  const prompt = prompts.buildChildPrompt({
    locale: "en",
    title: "Agent loops"
  });
  assert.equal(prompt, "Explain “Agent loops”");
  assert.doesNotMatch(prompt, /Original question|Knowledge-tree path/);
  assert.doesNotMatch(prompt, /definition, mechanics, intuition/);
});

test("does not add instructions based on the source question", () => {
  const prompt = prompts.buildChildPrompt({
    locale: "en",
    title: "Context engineering"
  });
  assert.equal(prompt, "Explain “Context engineering”");
});

test("adds concise parent context to a child prompt", () => {
  const prompt = prompts.buildChildPrompt({
    locale: "en",
    title: "Self-attention",
    parents: ["Large language models", "KV cache"]
  });
  assert.equal(prompt, "Context: Large language models > KV cache. Explain “Self-attention”");
  const deepPrompt = prompts.buildChildPrompt({
    locale: "en",
    title: "Flash attention",
    parents: ["Large language models", "Attention", "Optimization", "Memory IO"]
  });
  assert.equal(deepPrompt, "Context: Large language models > Optimization > Memory IO. Explain “Flash attention”");
  assert.equal(prompts.isLegacyPrompt(prompt), false);
});

test("can omit parent context from a child prompt", () => {
  const english = prompts.buildChildPrompt({
    locale: "en",
    title: "Self-attention",
    parents: ["Large language models", "KV cache"],
    includeContext: false
  });
  const chinese = prompts.buildChildPrompt({
    locale: "zh",
    title: "自注意力",
    parents: ["大模型", "注意力机制"],
    includeContext: false
  });
  assert.equal(english, "Explain “Self-attention”");
  assert.equal(chinese, "请解释「自注意力」");
});

test("lets the custom child Prompt explicitly include or omit parent context", () => {
  assert.equal(prompts.buildChildPrompt({
    locale: "en",
    title: "Self-attention",
    parents: ["Transformers"],
    template: "Context: {context}. Teach {topic} with one example."
  }), "Context: Transformers. Teach Self-attention with one example.");
  assert.equal(prompts.buildChildPrompt({
    locale: "en",
    title: "Self-attention",
    parents: ["Transformers"],
    template: "Teach {topic} with one example."
  }), "Teach Self-attention with one example.");
});

test("creates a minimal Chinese child prompt", () => {
  const prompt = prompts.buildChildPrompt({
    locale: "zh",
    title: "Agent 成功率评测"
  });
  assert.equal(prompt, "请解释「Agent 成功率评测」");
});

test("detects the old one-size-fits-all prompts", () => {
  assert.equal(prompts.isLegacyPrompt("请深入讲解「Async programming」，包括定义、原理、直觉、工程实践、常见失败模式和面试追问。"), true);
  assert.equal(prompts.isLegacyPrompt("Original question: “What should I learn?”\nKnowledge-tree path: Architecture > Context engineering\n\nTeach Context engineering."), true);
  assert.equal(prompts.isLegacyPrompt("Explain “Context engineering” and give me one practical exercise."), true);
  assert.equal(prompts.isLegacyPrompt("Explain “Async programming”"), false);
});

test("appends an English tree instruction without replacing the question", () => {
  const result = prompts.appendTreeInstruction("What should I learn about AI agents?", "en");
  assert.match(result, /^What should I learn about AI agents\?/);
  assert.match(result, /Start at ##/);
  assert.match(result, /as many heading levels as the content needs/);
  assert.match(result, /one atomic Chat topic/);
  assert.doesNotMatch(result, /maximum depth/i);
});

test("creates an unconstrained tree of standalone chat topics", () => {
  const result = prompts.appendTreeInstruction("Teach me agents", "en");
  assert.match(result, /use as many heading levels as the content needs/i);
  assert.match(result, /saved, learned, and followed up independently/);
  assert.match(result, /Split multiple independent concepts/);
  assert.doesNotMatch(result, /\d+ levels/);
});

test("replaces an existing tree instruction when language changes", () => {
  const english = prompts.appendTreeInstruction("Teach me agents", "en");
  const withPostfix = prompts.appendCustomPrompt(english, "Focus on production systems", "postfix");
  const chinese = prompts.appendTreeInstruction(withPostfix, "zh");
  assert.match(chinese, /将回答组织成 Markdown 知识树/);
  assert.doesNotMatch(chinese, /Format the answer as a Markdown knowledge tree/);
  assert.match(chinese, /Focus on production systems$/);
});

test("keeps the built-in tree prompt concise and example-free", () => {
  const instruction = prompts.treeInstruction("en");
  assert.match(instruction, /Start at ##/);
  assert.match(instruction, /not a root heading that repeats or paraphrases the question or topic/);
  assert.match(instruction, /After each leaf heading/);
  assert.match(instruction, /Do not use bullet lists/);
  assert.doesNotMatch(instruction, /BFS|DFS|for example/i);
  assert.ok(instruction.length < 600);
});

test("localizes the built-in tree prompt to the selected language", () => {
  const english = prompts.treeInstruction("en");
  const chinese = prompts.treeInstruction("zh");
  assert.match(english, /^Format the answer as a Markdown knowledge tree/);
  assert.doesNotMatch(english, /请将回答组织成严格的知识树/);
  assert.match(chinese, /^将回答组织成 Markdown 知识树/);
  assert.doesNotMatch(chinese, /Format the answer as a strict knowledge tree/);
  assert.match(chinese, /可以独立保存、学习和追问的单一 Chat 主题/);
});

test("recognizes saved built-in tree prompts in either language", () => {
  assert.equal(prompts.isDefaultTreeInstruction(prompts.treeInstruction("en")), true);
  assert.equal(prompts.isDefaultTreeInstruction(prompts.treeInstruction("zh")), true);
  assert.equal(prompts.isDefaultTreeInstruction("Format the answer as a Markdown knowledge tree. Start at ## and use as many heading levels as the content needs.\n\nEach leaf must be one atomic Chat topic that can be saved, learned, and followed up independently. Split multiple independent concepts into sibling leaf headings; keep category nodes concise and logically ordered.\n\nAfter each leaf heading, write one or two concise, useful sentences. Do not use bullet lists, tables, code fences, introductions, or conclusions. Return only the knowledge tree."), true);
  assert.equal(prompts.isDefaultTreeInstruction("Explain this as a custom tree."), false);
});

test("preserves a custom tree instruction without injecting a depth", () => {
  assert.equal(prompts.customTreeInstruction("Use the hierarchy the topic needs."), "Use the hierarchy the topic needs.");
  assert.equal(prompts.customTreeInstruction("Keep it short"), "Keep it short");
});

test("applies a custom prompt as prefix or postfix", () => {
  assert.equal(prompts.appendCustomPrompt("Explain KV cache", "Be concise", "prefix"), "Be concise\n\nExplain KV cache");
  assert.equal(prompts.appendCustomPrompt("Explain KV cache", "Give examples", "postfix"), "Explain KV cache\n\nGive examples");
  assert.equal(prompts.appendCustomPrompt("Be concise\n\nExplain KV cache", "Be concise", "prefix"), "Be concise\n\nExplain KV cache");
  assert.equal(prompts.removeCustomPrompt("Be concise\n\nExplain KV cache", "Be concise", "prefix"), "Explain KV cache");
  assert.equal(prompts.removeCustomPrompt("Explain KV cache\n\nGive examples", "Give examples", "postfix"), "Explain KV cache");
});

test("removes boundary prompts after ChatGPT normalizes their whitespace", () => {
  const instruction = "Format this answer\n\nas a two-level tree.";
  assert.equal(
    prompts.removeCustomPrompt("Format this answer as a two-level tree.\nExplain KV cache", instruction, "prefix"),
    "Explain KV cache"
  );
  assert.equal(
    prompts.removeCustomPrompt("Explain KV cache Format this answer as a two-level tree.", instruction, "postfix"),
    "Explain KV cache"
  );
});

test("keeps the original question when Tree mode is used as a prefix", () => {
  const instruction = prompts.treeInstruction("en");
  const prefixed = prompts.appendCustomPrompt("Explain KV cache", instruction, "prefix");
  assert.match(prefixed, /^Format the answer as a Markdown knowledge tree/);
  assert.match(prefixed, /Explain KV cache$/);
  assert.equal(prompts.removeTreeInstruction(prefixed), "Explain KV cache");
});

test("removes a tree instruction without changing surrounding text", () => {
  const withTree = prompts.appendTreeInstruction("Explain KV cache", "en");
  const withSuffix = prompts.appendCustomPrompt(withTree, "Use examples", "postfix");
  assert.equal(prompts.removeTreeInstruction(withSuffix), "Explain KV cache\n\nUse examples");
});

test("adds the tree instruction only once and supports Chinese", () => {
  const first = prompts.appendTreeInstruction("大模型工程师需要学习什么？", "zh");
  const second = prompts.appendTreeInstruction(first, "zh");
  assert.match(first, /从 ## 开始，按内容需要自行决定层级/);
  assert.equal(second, first);
});
