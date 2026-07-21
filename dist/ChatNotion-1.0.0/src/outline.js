(function exposeOutlineParser(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionOutline = api;
  }
})(globalThis, function createOutlineParser() {
  "use strict";

  const LABEL = /^(?:需要掌握|掌握|需要理解|重点理解|重点准备|常见问题|需要能回答|核心公式|重点|包括|面试重点|key concepts?|topics?|you should know|focus on|common questions?)\s*[:：]?$/i;
  const ITEM_INTRO_LABEL = /^(?:需要掌握|掌握|需要理解|重点理解|重点准备|包括|key concepts?|topics?|you should know|focus on)\s*[:：]?$/i;
  const NUMBERED = /^\s*(\d{1,2})[.)、]\s*(\S.*)$/;
  const BULLET = /^\s*[•*\-–—]\s+(\S.*)$/;

  function cleanTitle(value) {
    return String(value || "")
      .replace(/^#{1,6}\s*/, "")
      .replace(/^\d{1,2}[.)、]\s*/, "")
      .replace(/^[•*\-–—]\s+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  function linesFromText(value) {
    return String(value || "")
      .split(/\r?\n+/)
      .map((line) => line.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function isFormulaOrNoise(text) {
    if (!text || text.length > 140) return true;
    if (/[=∑∏√∇⊤∣βγλθϵσπ]/u.test(text)) return true;
    if (/[<>_^{}[\]\\]/.test(text)) return true;
    if (/^[=+×÷∑∏√_^{}()[\]<>|\\\d\s.,:;βθηϵ⊤−]+$/u.test(text)) return true;
    if ((text.match(/[=^_{}]/g) || []).length >= 2) return true;
    if (text.length <= 2 && !/^[A-Z]{2}$/.test(text)) return true;
    if (/^[A-Za-z]\s*[\dA-Za-z]?$/.test(text)) return true;
    return false;
  }

  function looksLikeItem(text) {
    if (!text || LABEL.test(text) || isFormulaOrNoise(text)) return false;
    if (text.length < 2 || text.length > 120) return false;
    return !/[。！？!?.:：]$/.test(text);
  }

  function splitItems(value) {
    const clean = cleanTitle(value);
    if (/[。！？!?.]$/.test(clean)) return [clean];
    const parts = clean.split(/[、，,]/).map(cleanTitle).filter(Boolean);
    if (parts.length < 2 || parts.length > 10 || parts.some((part) => part.length > 55)) return [clean];
    return parts;
  }

  function parseBlocks(inputBlocks) {
    const blocks = [];
    for (const input of inputBlocks || []) {
      const lines = linesFromText(input.text);
      for (const line of lines) {
        blocks.push({
          kind: input.kind || "paragraph",
          level: Number(input.level) || 0,
          strong: Boolean(input.strong),
          text: line
        });
      }
    }

    const headingLevels = blocks.filter((block) => block.kind === "heading").map((block) => block.level);
    const minHeading = headingLevels.length ? Math.min(...headingLevels) : 1;
    const outline = [];
    const stack = [];
    const seenItems = new Set();
    let current = null;
    let collectingItems = false;

    function addNode(value, level) {
      const title = cleanTitle(value);
      if (!title) return;
      const node = { title, items: [], children: [] };
      while (stack.length && stack.at(-1).level >= level) stack.pop();
      if (stack.length) stack.at(-1).node.children.push(node);
      else outline.push(node);
      stack.push({ level, node });
      current = node;
      collectingItems = false;
    }

    function addItem(value) {
      if (!current) return;
      for (const title of splitItems(value)) {
        if (!looksLikeItem(title)) continue;
        const key = `${current.title}\n${title}`.toLowerCase();
        if (seenItems.has(key)) continue;
        seenItems.add(key);
        current.items.push(title);
      }
    }

    // Tree mode uses Markdown headings as the source of truth. Descriptive
    // paragraphs and lists under those headings are content, not extra nodes.
    if (headingLevels.length) {
      for (const block of blocks) {
        if (block.kind === "heading") addNode(block.text, block.level - minHeading + 1);
      }
      return outline;
    }

    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
      const text = block.text;
      const next = blocks[index + 1]?.text || "";
      const numbered = text.match(NUMBERED);
      const bullet = text.match(BULLET);

      if (block.kind === "heading") {
        addNode(text, block.level - minHeading + 1);
      } else if (numbered) {
        addNode(numbered[2], 1);
      } else if (block.strong && !LABEL.test(text) && text.length <= 90) {
        addNode(text, stack.length ? stack.at(-1).level + 1 : 1);
      } else if (LABEL.test(text)) {
        collectingItems = !/^(?:核心公式|formula)/i.test(text);
        continue;
      } else if (block.kind === "list" || bullet) {
        addItem(bullet?.[1] || text);
      } else if (current && ITEM_INTRO_LABEL.test(next) && looksLikeItem(text) && text.length <= 70) {
        const currentLevel = stack.length ? stack.at(-1).level : 0;
        addNode(text, current.items.length ? currentLevel : Math.max(1, currentLevel + 1));
      } else if (current && collectingItems && looksLikeItem(text)) {
        addItem(text);
      }
    }

    return outline;
  }

  function countItems(outline) {
    return (outline || []).reduce(
      (total, node) => total + node.items.length + countItems(node.children),
      0
    );
  }

  function limitDepth(outline, maxDepth = 3, depth = 1) {
    const limit = Math.max(1, Number(maxDepth) || 3);
    if (depth > limit) return [];
    return (outline || []).map((node) => ({
      ...node,
      items: depth < limit ? [...node.items] : [],
      children: depth < limit ? limitDepth(node.children, limit, depth + 1) : []
    }));
  }

  return { parseBlocks, countItems, limitDepth, cleanTitle };
});
