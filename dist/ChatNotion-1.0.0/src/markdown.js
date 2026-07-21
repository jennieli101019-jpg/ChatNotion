(function exposeMarkdown(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ChatNotionMarkdown = api;
  }
})(globalThis, function createMarkdown() {
  "use strict";

  const COLORS = "yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}";

  // Highlight content accepts a lone "=" (formulas are full of them) and stops only at "==".
  const INLINE_PATTERN = new RegExp(
    `(==(?:(${COLORS}):)?((?:[^=]|=(?!=))+)==`
    + "|\\*\\*([^*]+)\\*\\*"
    + "|`([^`]+)`"
    + "|\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)"
    + "|\\*([^*]+)\\*"
    // Math delimiters must hug their content, so prose like "$5 and $10" stays prose.
    + "|\\$([^\\s$](?:[^$\\n]*[^\\s$])?)\\$)",
    "gi"
  );

  const MULTILINE_HIGHLIGHT = new RegExp(`==(?:(${COLORS}):)?([\\s\\S]+?)==`, "gi");

  // Splits one line of markdown into typed tokens. Rendering them is the caller's job, which is
  // what keeps this whole module free of DOM and therefore testable.
  function inlineTokens(source) {
    const text = String(source || "");
    const tokens = [];
    let cursor = 0;
    for (const match of text.matchAll(INLINE_PATTERN)) {
      if (match.index > cursor) tokens.push({ type: "text", value: text.slice(cursor, match.index) });
      if (match[3]) tokens.push({ type: "highlight", value: match[3], color: (match[2] || "yellow").toLowerCase() });
      else if (match[4]) tokens.push({ type: "strong", value: match[4] });
      else if (match[5]) tokens.push({ type: "code", value: match[5] });
      else if (match[6] && match[7]) tokens.push({ type: "link", value: match[6], href: match[7] });
      else if (match[8]) tokens.push({ type: "em", value: match[8] });
      else if (match[9]) tokens.push({ type: "math", value: match[9] });
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
    return tokens;
  }

  // Reduces markdown to comparable prose, used to decide whether a Note is merely the captured
  // source in disguise and can therefore be replaced by a fresher capture.
  //
  // Highlight markers ("==colour:...==") are deliberately NOT stripped. They are the user's own
  // annotations: a highlighted Note is a real divergence that must survive re-capture. Stripping
  // them makes the Note compare equal to the source, so the render path substitutes the plain
  // source and the next save writes noteContent back to "" — silently destroying the highlight.
  function semanticText(markdown) {
    return String(markdown || "")
      .replace(/^```[^\n]*$/gm, "")
      .replace(/^\s*(?:#{1,6}|>|[-*+]|\d+\.)\s*/gm, "")
      .replace(/\*\*|__|\*|_|`|---+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function wrapHighlightLines(content, color) {
    return String(content || "").split("\n").map((line) => {
      if (!line) return line;
      const structural = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s?))(.*)$/);
      if (structural) return `${structural[1]}==${color}:${structural[2]}==`;
      return `==${color}:${line}==`;
    }).join("\n");
  }

  function findMultilineHighlight(source) {
    for (const match of String(source || "").matchAll(MULTILINE_HIGHLIGHT)) {
      if (!match[2].includes("\n")) continue;
      return { index: match.index, full: match[0], color: match[1] || "yellow", content: match[2] };
    }
    return null;
  }

  function normalizeMultilineHighlights(source) {
    return String(source || "").replace(
      MULTILINE_HIGHLIGHT,
      (full, color = "yellow", content) => content.includes("\n") ? wrapHighlightLines(content, color) : full
    );
  }

  function normalizeUnbalancedHighlightBold(source) {
    return String(source || "")
      .replace(new RegExp(`==((?:${COLORS}):)\\*\\*([^=\\n]+)\\*==\\*`, "gi"), "==$1**$2**==")
      .replace(new RegExp(`\\*\\*([^=\\n]+)==((?:${COLORS}):)([^=\\n]*\\*\\*[^=\\n]*)==`, "gi"),
        (_full, before, color, highlighted) => `==${color}**${before}${highlighted}==`)
      .replace(new RegExp(`==((?:${COLORS}):)\\*\\*([^=\\n]+)==\\*\\*`, "gi"), "==$1**$2**==")
      .replace(new RegExp(`\\*\\*==((?:${COLORS}):)([^*\\n]+)\\*\\*==`, "gi"), "==$1**$2**==");
  }

  function annotationColor(color, kind) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const colors = kind === "note"
      ? { yellow: "#fffbea", orange: "#fff1df", red: "#ffeded", pink: "#fff1f6", purple: "#f5efff", blue: "#eef7ff", green: "#effaf2" }
      : { yellow: "#fff0a8", orange: "#ffd9ad", red: "#ffc7c7", pink: "#ffd6e7", purple: "#e5d5ff", blue: "#cfe8ff", green: "#cef1d8" };
    return colors[color] || colors.yellow;
  }

  // Reads a "$$" fence starting at `index`. Returns the TeX plus the line the caller resumes from,
  // covering single-line "$$x$$", multi-line fences, and fences the document never closes.
  function readMathBlock(lines, index) {
    const opening = String(lines[index] || "").trim();
    if (!/^\$\$/.test(opening)) return null;
    if (opening.length > 4 && /\$\$$/.test(opening)) {
      return { tex: opening.slice(2, -2).trim(), nextIndex: index };
    }
    const collected = opening.slice(2).trim() ? [opening.slice(2).trim()] : [];
    let cursor = index;
    while (cursor + 1 < lines.length && !/^\$\$/.test(String(lines[cursor + 1]).trim())) {
      collected.push(lines[cursor + 1]);
      cursor += 1;
    }
    return { tex: collected.join("\n").trim(), nextIndex: cursor + 1 };
  }

  function compatibleStructuredSource(editedContent, snapshot, fullSource) {
    if (!editedContent || !snapshot?.messages?.length) return "";
    const editedText = semanticText(editedContent);
    if (!editedText) return "";
    const candidates = [fullSource];
    const assistantMessages = snapshot.messages
      .filter((message) => message.role === "assistant")
      .map((message) => message.content);
    if (assistantMessages.length) candidates.push(assistantMessages.join("\n\n"));
    return candidates.find((candidate) => semanticText(candidate) === editedText) || "";
  }

  return {
    COLORS,
    inlineTokens,
    semanticText,
    wrapHighlightLines,
    findMultilineHighlight,
    normalizeMultilineHighlights,
    normalizeUnbalancedHighlightBold,
    annotationColor,
    readMathBlock,
    compatibleStructuredSource
  };
});
