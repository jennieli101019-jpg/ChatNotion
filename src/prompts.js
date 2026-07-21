(function exposeChatPrompts(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionPrompts = api;
  }
})(globalThis, function createChatPrompts() {
  "use strict";

  const PREVIOUS_DEFAULT_TREE_INSTRUCTIONS = [
    "将回答组织成 Markdown 知识树，从 ## 开始，按内容需要自行决定层级。\n\n每个叶子必须是一个可以独立保存、学习和追问的单一 Chat 主题。包含多个独立概念时，拆成同级叶子标题；分类节点保持简洁，按逻辑顺序组织。\n\n每个叶子标题后写一到两句具体、有用的说明。不要使用项目符号、表格、代码块、开场白或总结。只输出知识树。",
    "Format the answer as a Markdown knowledge tree. Start at ## and use as many heading levels as the content needs.\n\nEach leaf must be one atomic Chat topic that can be saved, learned, and followed up independently. Split multiple independent concepts into sibling leaf headings; keep category nodes concise and logically ordered.\n\nAfter each leaf heading, write one or two concise, useful sentences. Do not use bullet lists, tables, code fences, introductions, or conclusions. Return only the knowledge tree."
  ];

  function compact(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  }

  function compactParentPath(parents, title) {
    const target = compact(title, 100).toLowerCase();
    const clean = (parents || [])
      .map((parent) => compact(parent, 48))
      .filter((parent, index, values) => parent && parent.toLowerCase() !== target && values.indexOf(parent) === index);
    const selected = clean.length <= 3 ? clean : [clean[0], ...clean.slice(-2)];
    return compact(selected.join(" > "), 150);
  }

  function childPromptTemplate(locale = "en") {
    return locale === "zh"
      ? "上下文：{context}。请解释「{topic}」"
      : "Context: {context}. Explain “{topic}”";
  }

  function buildChildPrompt({ locale = "en", title, parents = [], includeContext = true, template = "" }) {
    const cleanTitle = compact(title, 100);
    const context = includeContext ? compactParentPath(parents, cleanTitle) : "";
    let selectedTemplate = String(template || "").trim() || childPromptTemplate(locale);
    if (!context) {
      selectedTemplate = selectedTemplate
        .replace(/^Context:\s*\{context\}\.\s*/i, "")
        .replace(/^上下文：\s*\{context\}。\s*/, "");
    }
    return selectedTemplate
      .replaceAll("{context}", context)
      .replaceAll("{topic}", cleanTitle)
      .trim();
  }

  function isLegacyPrompt(value) {
    const text = String(value || "").trim();
    return !/^(?:请解释「[^」]+」|Explain “[^”]+”|上下文：.+。请解释「[^」]+」|Context: .+\. Explain “[^”]+”)$/.test(text);
  }

  function treeInstruction(locale = "en") {
    if (locale === "zh") {
      return "将回答组织成 Markdown 知识树。从 ## 开始，按内容需要自行决定层级。直接写有意义的一级分类，不要用重复或改写原问题/主题的总标题。\n\n每个叶子必须是一个可以独立保存、学习和追问的单一 Chat 主题。多个独立概念应拆成同级叶子；分类节点保持简洁并按逻辑排序。\n\n每个叶子标题后写一到两句具体、有用的说明。不要使用项目符号、表格、代码块、开场白或总结。只输出知识树。";
    }
    return "Format the answer as a Markdown knowledge tree. Start at ## with first-level categories, not a root heading that repeats or paraphrases the question or topic. Use as many heading levels as the content needs.\n\nEach leaf must be one atomic Chat topic that can be saved, learned, and followed up independently. Split multiple independent concepts into sibling leaves; keep categories concise and ordered.\n\nAfter each leaf heading, write one or two concise, useful sentences. Do not use bullet lists, tables, code fences, introductions, or conclusions. Return only the knowledge tree.";
  }

  function isDefaultTreeInstruction(value) {
    const text = String(value || "").trim().replaceAll("\r\n", "\n");
    return [treeInstruction("en"), treeInstruction("zh"), ...PREVIOUS_DEFAULT_TREE_INSTRUCTIONS].includes(text);
  }

  function customTreeInstruction(template) {
    return String(template || "").trim().slice(0, 2500);
  }

  function hasTreeInstruction(value) {
    return /Format the answer as a (?:strict knowledge tree|Markdown knowledge tree)|(?:请将回答组织成严格的知识树|将回答组织成 Markdown 知识树)/.test(String(value || ""));
  }

  function splitTreeInstruction(value) {
    const text = String(value || "").trim();
    const markerIndexes = [
      text.indexOf("Format the answer as a strict knowledge tree"),
      text.indexOf("请将回答组织成严格的知识树"),
      text.indexOf("Format the answer as a Markdown knowledge tree"),
      text.indexOf("将回答组织成 Markdown 知识树")
    ].filter((index) => index >= 0);
    if (!markerIndexes.length) return { prefix: text, suffix: "", found: false };
    const markerIndex = Math.min(...markerIndexes);
    let suffix = "";
    const endings = [
      "Return only the heading-based knowledge tree and its leaf descriptions.",
      "只输出以标题组织的知识树及叶子节点说明。",
      "Return only the knowledge tree.",
      "只输出知识树。",
      "Return only the heading-based knowledge tree.",
      "只输出标题组成的知识树。"
    ];
    for (const ending of endings) {
      const endingIndex = text.indexOf(ending, markerIndex);
      if (endingIndex >= 0) {
        suffix = text.slice(endingIndex + ending.length).trim();
        break;
      }
    }
    return { prefix: text.slice(0, markerIndex).trimEnd(), suffix, found: true };
  }

  function appendTreeInstruction(question, locale = "en") {
    const text = String(question || "").trimEnd();
    if (!text) return text;
    const { prefix: questionText, suffix } = splitTreeInstruction(text);
    const instruction = treeInstruction(locale);
    return [questionText, instruction, suffix].filter(Boolean).join("\n\n");
  }

  function removeTreeInstruction(value) {
    const parts = splitTreeInstruction(value);
    return parts.found ? [parts.prefix, parts.suffix].filter(Boolean).join("\n\n") : parts.prefix;
  }

  function appendCustomPrompt(current, prompt, position = "postfix") {
    const text = String(current || "").trim();
    const instruction = String(prompt || "").trim().slice(0, 2500);
    if (!instruction) return text;
    if (!text) return instruction;
    if (position === "prefix") return text.startsWith(instruction) ? text : `${instruction}\n\n${text}`;
    return text.endsWith(instruction) ? text : `${text}\n\n${instruction}`;
  }

  function removeCustomPrompt(current, prompt, position = "postfix") {
    const text = String(current || "").trim();
    const instruction = String(prompt || "").trim().slice(0, 2500);
    if (!instruction || !text) return text;
    const flexibleInstruction = instruction
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    const pattern = position === "prefix"
      ? new RegExp(`^${flexibleInstruction}(?:\\s+|$)`)
      : new RegExp(`(?:^|\\s+)${flexibleInstruction}$`);
    if (pattern.test(text)) return text.replace(pattern, "").trim();
    return text;
  }

  return { childPromptTemplate, buildChildPrompt, isLegacyPrompt, treeInstruction, isDefaultTreeInstruction, customTreeInstruction, hasTreeInstruction, appendTreeInstruction, removeTreeInstruction, appendCustomPrompt, removeCustomPrompt };
});
