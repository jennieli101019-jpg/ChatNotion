const test = require("node:test");
const assert = require("node:assert/strict");
const markdown = require("../src/markdown.js");

const types = (source) => markdown.inlineTokens(source).map((token) => token.type);
const valueOf = (source, type) => markdown.inlineTokens(source).find((token) => token.type === type)?.value;

test("inline math is recognised between hugging delimiters", () => {
  assert.deepEqual(types("其中 $E_{\\text{token}}$ 是 Token Embedding。"), ["text", "math", "text"]);
  assert.equal(valueOf("其中 $E_{\\text{token}}$ 是", "math"), "E_{\\text{token}}");
});

test("currency amounts are not mistaken for math", () => {
  // A closing "$" preceded by a space cannot end a formula, which is what keeps prose intact.
  assert.deepEqual(types("价格是 $5 和 $10 这种情况"), ["text"]);
  assert.deepEqual(types("成本 $100 到 $200"), ["text"]);
});

test("inline code wins over math so LaTeX inside backticks stays literal", () => {
  assert.deepEqual(types("`代码里的 $x$ 不是公式`"), ["code"]);
  assert.equal(valueOf("`代码里的 $x$ 不是公式`", "code"), "代码里的 $x$ 不是公式");
});

test("a highlight survives an equals sign inside it", () => {
  // Regression: "[^=]+" used to end the highlight at the first "=", so highlighting any
  // formula left the "==yellow:" marker visible as literal text.
  const tokens = markdown.inlineTokens("==yellow:$x = [x_1]$==");
  assert.deepEqual(tokens.map((token) => token.type), ["highlight"]);
  assert.equal(tokens[0].value, "$x = [x_1]$");
  assert.equal(tokens[0].color, "yellow");
});

test("a highlight still terminates at the closing double equals", () => {
  const tokens = markdown.inlineTokens("==green:a=b== 后续文本");
  assert.equal(tokens[0].type, "highlight");
  assert.equal(tokens[0].value, "a=b");
  assert.equal(tokens[1].value, " 后续文本");
});

test("highlight colour defaults to yellow when unspecified", () => {
  assert.equal(markdown.inlineTokens("==裸高亮==")[0].color, "yellow");
  assert.equal(markdown.inlineTokens("==#ff8800:自定义==")[0].color, "#ff8800");
});

test("bold, links and emphasis still tokenise alongside math", () => {
  const tokens = markdown.inlineTokens("**粗** 与 $x_1$ 与 [名](https://example.com) 与 *斜*");
  assert.deepEqual(
    tokens.filter((token) => token.type !== "text").map((token) => token.type),
    ["strong", "math", "link", "em"]
  );
  assert.equal(tokens.find((token) => token.type === "link").href, "https://example.com");
});

test("a highlight hands its inner markdown back for nested rendering", () => {
  // The renderer recurses into this value, which is how bold survives inside a highlight.
  const tokens = markdown.inlineTokens("==yellow:**粗体** 和普通文本==");
  assert.equal(tokens[0].type, "highlight");
  assert.deepEqual(
    markdown.inlineTokens(tokens[0].value).map((token) => token.type),
    ["strong", "text"]
  );
});

test("normalizeMultilineHighlights rewrites only the highlights that span lines", () => {
  const singleLine = "==yellow:一行内容==";
  assert.equal(markdown.normalizeMultilineHighlights(singleLine), singleLine);

  const spanning = markdown.normalizeMultilineHighlights("==yellow:1. 第一项\n2. 第二项==");
  assert.equal(spanning, "1. ==yellow:第一项==\n2. ==yellow:第二项==");
});

test("normalizeUnbalancedHighlightBold repairs markers crossed by a partial selection", () => {
  // Highlighting half of a bold run used to emit "**a*==*" style crossed markers.
  assert.equal(
    markdown.normalizeUnbalancedHighlightBold("==yellow:**加粗内容*==*"),
    "==yellow:**加粗内容**=="
  );
  assert.equal(
    markdown.normalizeUnbalancedHighlightBold("==yellow:**加粗内容==**"),
    "==yellow:**加粗内容**=="
  );
});

test("normalizeUnbalancedHighlightBold leaves already balanced markup alone", () => {
  const balanced = "==yellow:**加粗内容**==";
  assert.equal(markdown.normalizeUnbalancedHighlightBold(balanced), balanced);
});

test("semanticText keeps a highlighted note distinct from its source", () => {
  // Regression guard, and it must stay this way: stripping highlight markers here makes the
  // Note compare equal to the capture, so renderNotePage swaps in the plain source and the next
  // save writes noteContent back to "" — the highlight disappears from screen and from storage.
  const source = "LayerNorm 对每个 token 归一化。";
  const highlighted = "==yellow:LayerNorm 对每个 token 归一化。==";
  assert.notEqual(markdown.semanticText(highlighted), markdown.semanticText(source));
});

test("semanticText keeps genuinely different text different", () => {
  assert.notEqual(markdown.semanticText("原始内容"), markdown.semanticText("改写后的内容"));
});

test("compatibleStructuredSource refuses to discard a highlighted note", () => {
  // An empty result is what preserves the user's annotation: it tells the render path to keep
  // showing noteContent instead of substituting the freshly captured source.
  const snapshot = { messages: [{ role: "assistant", content: "第一段。\n\n第二段。" }] };
  const fullSource = "## ChatGPT\n\n第一段。\n\n第二段。";
  const annotated = "## ChatGPT\n\n==yellow:第一段。==\n\n第二段。";
  assert.equal(markdown.compatibleStructuredSource(annotated, snapshot, fullSource), "");
});

test("compatibleStructuredSource still recognises an untouched copy of the capture", () => {
  // The feature this function exists for: an unmodified Note yields to a fresher capture.
  const snapshot = { messages: [{ role: "assistant", content: "第一段。\n\n第二段。" }] };
  const fullSource = "## ChatGPT\n\n第一段。\n\n第二段。";
  assert.equal(markdown.compatibleStructuredSource(fullSource, snapshot, fullSource), fullSource);
});

test("compatibleStructuredSource returns nothing once the note really diverges", () => {
  const snapshot = { messages: [{ role: "assistant", content: "第一段。" }] };
  const edited = "## ChatGPT\n\n第一段。\n\n我自己补充的一段。";
  assert.equal(markdown.compatibleStructuredSource(edited, snapshot, "## ChatGPT\n\n第一段。"), "");
});

// Mirrors the note page round-trip: renderNotePage decides what lands in the editor, and the
// next saveOpenNote decides what gets written back. A highlight has to survive both halves.
// Testing the two functions apart is what let a highlight-erasing regression through.
function noteRoundTrip(node, snapshot) {
  const fullSource = `## ChatGPT\n\n${snapshot.messages.map((m) => m.content).join("\n\n")}`;
  const compatible = markdown.compatibleStructuredSource(node.noteContent, snapshot, fullSource);
  // renderNotePage
  const displayed = node.noteEdited && !compatible ? node.noteContent : (compatible || fullSource);
  // saveOpenNote, with the user pressing Done without further typing
  const edited = displayed !== fullSource;
  return { displayed, storedContent: edited ? displayed : "", noteEdited: edited };
}

test("a highlight survives Done and is still in storage afterwards", () => {
  const snapshot = { messages: [{ role: "assistant", content: "第一段。\n\n第二段。" }] };
  const highlighted = "## ChatGPT\n\n==yellow:第一段。==\n\n第二段。";
  const afterSave = noteRoundTrip({ noteContent: highlighted, noteEdited: true }, snapshot);

  assert.match(afterSave.displayed, /==yellow:/, "预览必须仍然带高亮标记");
  assert.equal(afterSave.storedContent, highlighted, "高亮必须原样写回存储");
  assert.equal(afterSave.noteEdited, true, "带高亮的笔记必须保持已编辑状态");
});

test("a highlight still survives a second open-and-close cycle", () => {
  const snapshot = { messages: [{ role: "assistant", content: "第一段。\n\n第二段。" }] };
  const highlighted = "## ChatGPT\n\n==yellow:第一段。==\n\n第二段。";
  const first = noteRoundTrip({ noteContent: highlighted, noteEdited: true }, snapshot);
  const second = noteRoundTrip({ noteContent: first.storedContent, noteEdited: first.noteEdited }, snapshot);
  assert.equal(second.storedContent, highlighted, "反复打开关闭不得逐步侵蚀标注");
});

test("an untouched note still yields to a re-capture that added messages", () => {
  const snapshot = { messages: [{ role: "assistant", content: "第一段。\n\n新增的第二段。" }] };
  const stale = "## ChatGPT\n\n第一段。";
  const afterSave = noteRoundTrip({ noteContent: stale, noteEdited: false }, snapshot);
  assert.match(afterSave.displayed, /新增的第二段/, "未标注的笔记应当采用更新后的抓取内容");
});

test("readMathBlock reads a multi-line display fence", () => {
  const lines = ["$$", "\\mu = \\frac{1}{d}\\sum_{i=1}^d x_i", "$$", "尾部"];
  const block = markdown.readMathBlock(lines, 0);
  assert.equal(block.tex, "\\mu = \\frac{1}{d}\\sum_{i=1}^d x_i");
  assert.equal(lines[block.nextIndex + 1], "尾部");
});

test("readMathBlock reads a single-line display fence", () => {
  const block = markdown.readMathBlock(["$$O(L^2d)$$"], 0);
  assert.equal(block.tex, "O(L^2d)");
  assert.equal(block.nextIndex, 0);
});

test("readMathBlock reads TeX that starts on the opening line", () => {
  const lines = ["$$ y_i = \\gamma_i\\hat{x}_i", "$$"];
  assert.equal(markdown.readMathBlock(lines, 0).tex, "y_i = \\gamma_i\\hat{x}_i");
});

test("readMathBlock tolerates a fence the document never closes", () => {
  const lines = ["$$", "\\frac{1}{2}"];
  const block = markdown.readMathBlock(lines, 0);
  assert.equal(block.tex, "\\frac{1}{2}");
  assert.ok(block.nextIndex >= lines.length - 1);
});

test("readMathBlock ignores lines that are not a fence", () => {
  assert.equal(markdown.readMathBlock(["普通段落"], 0), null);
  assert.equal(markdown.readMathBlock(["行内 $x$ 不是块"], 0), null);
});

test("multi-line highlights are rewritten per line and keep structural prefixes", () => {
  const wrapped = markdown.wrapHighlightLines("- 第一项\n- 第二项", "blue");
  assert.equal(wrapped, "- ==blue:第一项==\n- ==blue:第二项==");
});

test("findMultilineHighlight only reports highlights that span lines", () => {
  assert.equal(markdown.findMultilineHighlight("==yellow:单行=="), null);
  const found = markdown.findMultilineHighlight("==yellow:第一行\n第二行==");
  assert.equal(found.color, "yellow");
  assert.ok(found.content.includes("\n"));
});

test("annotationColor separates highlight and note palettes and rejects unknown names", () => {
  assert.equal(markdown.annotationColor("blue", "highlight"), "#cfe8ff");
  assert.equal(markdown.annotationColor("blue", "note"), "#eef7ff");
  assert.equal(markdown.annotationColor("#abcdef", "highlight"), "#abcdef");
  assert.equal(markdown.annotationColor("chartreuse", "highlight"), "#fff0a8");
});
