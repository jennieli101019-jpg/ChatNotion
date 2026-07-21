const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const contentSource = fs.readFileSync(path.join(__dirname, "../src/content.js"), "utf8");

function functionBody(name) {
  const signature = `async function ${name}()`;
  const start = contentSource.indexOf(signature);
  assert.notEqual(start, -1, `${name} must exist`);
  const bodyStart = contentSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < contentSource.length; index += 1) {
    if (contentSource[index] === "{") depth += 1;
    if (contentSource[index] === "}") depth -= 1;
    if (depth === 0) return contentSource.slice(bodyStart + 1, index);
  }
  throw new Error(`Could not read ${name}`);
}

test("successful Chat Prompt save closes Settings after persistence", () => {
  const body = functionBody("saveChildPromptTemplate");
  const validation = body.indexOf('if (!template.includes("{topic}"))');
  const persistence = body.indexOf("if (!await persistChildPromptTemplate(template)) return;");
  const close = body.indexOf("hideSettingsPopover();");

  assert.ok(validation >= 0, "topic validation must remain in place");
  assert.ok(persistence > validation, "the prompt must be persisted after validation");
  assert.ok(close > persistence, "Settings must close only after persistence succeeds");
});

test("Auto save toggle updates the footer before storage responds", () => {
  const body = functionBody("saveAutoSavePreference");
  const optimisticState = body.indexOf("autoSaveEnabled = requested;");
  const optimisticRender = body.indexOf("updateSaveChatButton();", optimisticState);
  const persistence = body.indexOf('await sendMessage({ type: "AUTO_SAVE_SET"');

  assert.ok(optimisticState >= 0, "the requested Auto save state must be applied locally");
  assert.ok(optimisticRender > optimisticState, "the footer must refresh from the requested state");
  assert.ok(persistence > optimisticRender, "the visible state must update before waiting for storage");
});

test("enabling Auto save restores and saves a deliberately removed current chat", () => {
  const body = functionBody("activateAutoSaveForCurrentChat");
  const startedGuard = body.indexOf("!hasStartedConversation()");
  const dismissedCheck = body.indexOf("core.isAutoSaveDismissed(state, currentUrl)");
  const restore = body.indexOf("core.restoreAutoSave(state, currentUrl)");
  const save = body.lastIndexOf("autoSaveCurrentChat()");

  assert.ok(startedGuard >= 0, "empty new-chat pages must still be ignored");
  assert.ok(dismissedCheck > startedGuard, "dismissed state is checked only for a real conversation");
  assert.ok(restore > dismissedCheck, "enabling Auto save must clear the removal suppression");
  assert.ok(save > restore, "the restored current chat must then be saved immediately");
});

test("conversation snapshot capture cannot be starved by navigation polling", () => {
  assert.match(
    contentSource,
    /function scheduleConversationSnapshotCapture\(\) \{\s*if \(snapshotCaptureTimer\) return;/,
    "an already queued stable capture must not be reset by the 700ms navigation poll"
  );
  const completion = functionBody("completePendingChildChat");
  const ready = completion.indexOf('{ status: "ready" }');
  const schedule = completion.indexOf("scheduleConversationSnapshotCapture();");
  assert.ok(schedule > ready, "a newly completed child conversation must explicitly queue synchronization");
});

test("Conversation Auto save controls automatic ChatGPT content capture", () => {
  assert.match(
    contentSource,
    /function scheduleConversationSnapshotCapture\(\) \{\s*if \(snapshotCaptureTimer\) return;\s*if \(!autoSaveEnabled\) return;/,
    "automatic snapshot scheduling must stop when Conversation Auto save is off"
  );
  assert.match(
    contentSource,
    /async function captureCurrentConversationSnapshot\(force = false\) \{\s*if \(!stateLoaded \|\| \(!autoSaveEnabled && !force\)\) return false;/,
    "only an explicit manual import may bypass the Auto save setting"
  );
  assert.match(
    contentSource,
    /importOriginalButton\.addEventListener\("click", importOpenNoteOriginalContent\)/,
    "the Note page must expose a manual ChatGPT content import action"
  );
});

test("manual ChatGPT content import never navigates to the original chat", () => {
  const body = functionBody("importOpenNoteOriginalContent");
  const mismatch = body.indexOf("canonicalChatUrl() !== node.sourceUrl");
  const prompt = body.indexOf('showToast(t("openOriginalToImport"), true)', mismatch);

  assert.ok(mismatch >= 0, "manual import must detect when a different chat is open");
  assert.ok(prompt > mismatch, "a mismatched page must explain how to open the source chat");
  assert.equal(body.indexOf("openSelected()"), -1, "Import must not behave like Open original chat");
  assert.equal(body.indexOf("location.assign"), -1, "Import must never navigate directly");
});

test("Note editor offers lightweight highlight and inline note formatting", () => {
  assert.match(contentSource, /applyNoteSelectionFormat\("highlight", highlightColorSelect\.dataset\.value\)/);
  assert.match(contentSource, /applyNoteSelectionFormat\("note", noteColorSelect\.dataset\.value\)/);
  assert.match(contentSource, /replacement = wrapHighlightLines\(content, color\)/);
  assert.match(contentSource, /replacement = `\$\{prefix\}> \[!NOTE:\$\{color\}\]\\n> \$\{title\.replace/);
  assert.match(contentSource, /element\("mark", "markdown-highlight"/);
  assert.match(contentSource, /element\(isNote \? "aside" : "blockquote", isNote \? "markdown-note"/);
});

test("reading a Note stays in preview and formatting remains inside Edit", () => {
  assert.doesNotMatch(contentSource, /notePreview\.addEventListener\("click", \(\) => setDocumentEditing/);
  assert.doesNotMatch(contentSource, /notePreview\.addEventListener\("contextmenu"/);
  assert.match(contentSource, /if \(!noteDocumentEditing \|\| !notePageNodeId\) return;/);
  assert.match(contentSource, /\["yellow", "orange", "red", "pink", "purple", "blue", "green"\]/);
  assert.doesNotMatch(contentSource, /input\.type = "color"/);
});

// Highlight tokenising, nesting and colour parsing now live in src/markdown.js and are covered
// by real behaviour tests in tests/markdown.test.js. Only the DOM wiring is asserted here.
test("highlight rendering recurses so nested Markdown keeps rendering", () => {
  assert.match(contentSource, /appendMarkdownInline\(mark, token\.value\)/);
  assert.match(contentSource, /element\("mark", "markdown-highlight"\)/);
});

test("tree code blocks render multiline colored highlights", () => {
  assert.match(contentSource, /appendCode\(treeLines\.join\("\\n"\).*true, true\)/);
  assert.match(contentSource, /function appendTreeHighlights\(parent, source\)/);
  assert.match(contentSource, /\(\[\\s\\S\]\+\?\)==/);
});

// Detecting and rewriting multiline highlights is tested for real in tests/markdown.test.js.
test("a multiline highlight is rendered as its own Markdown block", () => {
  assert.match(contentSource, /renderMarkdownDocument\(highlightContainer, blockHighlight\.content\)/);
});

test("Add a note keeps its source reference in Markdown without repeating it in preview", () => {
  assert.match(contentSource, /const title = \(selectedLine \|\| selected \|\| t\("noteLabel"\)\)/);
  assert.match(contentSource, /> \[!NOTE:\$\{color\}\]\\n> \$\{title\.replace/);
  assert.doesNotMatch(contentSource, /markdown-note-label/);
  assert.doesNotMatch(contentSource, /appendMarkdownInline\(label, title\)/);
});

test("annotation toolbar actions save immediately instead of waiting for the typing debounce", () => {
  assert.match(contentSource, /noteEditor\.setSelectionRange\(selectionStart, selectionEnd\);\s*revealNoteEditorSelection\(selectionStart\);\s*if \(noteSaveTimer\)/);
  assert.match(contentSource, /noteSaveStatus\.textContent = t\("noteSaving"\);\s*await saveOpenNote\(\);/);
});

test("Add a note inserts beside the selected line and reveals the new Note", () => {
  assert.match(contentSource, /const selectedLineStart = noteEditor\.value\.lastIndexOf\("\\n"/);
  assert.match(contentSource, /const selectedLineEnd = noteEditor\.value\.indexOf\("\\n", start\)/);
  assert.match(contentSource, /start = lineEnd/);
  assert.match(contentSource, /revealNoteEditorSelection\(selectionStart\)/);
  assert.match(contentSource, /noteEditor\.scrollTop = availableScroll/);
});

test("Add a note splits a fenced tree so the Note renders outside code", () => {
  assert.match(contentSource, /const insideCodeFence = \(beforeSelection\.match\(\/\^```\/gm\) \|\| \[\]\)\.length % 2 === 1/);
  assert.match(contentSource, /insideCodeFence \? "\\n```\\n\\n"/);
  assert.match(contentSource, /insideCodeFence \? "\\n\\n```"/);
});

test("ordered lists resume their explicit Markdown number after a Note", () => {
  assert.match(contentSource, /const orderedNumber = line\.match\(\/\^\\s\*\(\\d\+\)\\\./);
  assert.match(contentSource, /list\.start = Number\(orderedNumber\[1\]\)/);
});

test("fenced code blocks opt into colored highlight rendering", () => {
  assert.match(contentSource, /appendCode\(codeContent, false, \/==/);
});

test("overlapping highlights are merged instead of producing crossed markers", () => {
  assert.match(contentSource, /function normalizeHighlightSelection\(value, selectionStart, selectionEnd\)/);
  assert.match(contentSource, /const normalized = normalizeHighlightSelection\(noteEditor\.value, balanced\.start, balanced\.end\)/);
  assert.match(contentSource, /return \{ start, end, content \}/);
});

test("highlighting part of bold text keeps both bold markers balanced", () => {
  assert.match(contentSource, /function balanceBoldSelection\(value, selectionStart, selectionEnd\)/);
  assert.match(contentSource, /beforeStart\.match\(\/\\\*\\\*\/g\).*length % 2 === 1/s);
  assert.match(contentSource, /start = lineStart \+ beforeStart\.lastIndexOf\("\*\*"\)/);
  assert.match(contentSource, /closingMarker >= 0 && closingMarker < lineEnd/);
  // The repair itself is behaviour-tested in tests/markdown.test.js; this only pins the ordering.
  assert.match(contentSource, /normalizeMultilineHighlights\(normalizeUnbalancedHighlightBold/);
});

test("highlight selection cannot split the two characters of a bold marker", () => {
  assert.match(contentSource, /value\[start - 1\] === "\*" && value\[start\] === "\*"/);
  assert.match(contentSource, /value\[end - 1\] === "\*" && value\[end\] === "\*"/);
});

test("the whole workspace supports platform Undo and Redo keyboard shortcuts", () => {
  assert.match(contentSource, /document\.addEventListener\("keydown", \(event\) => \{\s*if \(handleWorkspaceHistoryShortcut\(event\)\) return/);
  assert.match(contentSource, /function handleWorkspaceHistoryShortcut\(event\)/);
  assert.match(contentSource, /if \(panel\.classList\.contains\("is-hidden"\)\) return false/);
  assert.doesNotMatch(contentSource, /const externalEditor =/);
  assert.match(contentSource, /const primaryModifier = event\.metaKey \|\| event\.ctrlKey/);
  assert.match(contentSource, /const undo = primaryModifier && key === "z" && !event\.shiftKey/);
  assert.match(contentSource, /queueHistoryAction\(redo \? redoLastAction : undoLastAction\)/);
  assert.match(contentSource, /primaryModifier && key === "y"/);
  assert.match(contentSource, /primaryModifier && event\.shiftKey && key === "c"/);
  assert.match(contentSource, /event\.code === "KeyZ"/);
});

test("rapid Undo and Redo actions execute sequentially", () => {
  assert.match(contentSource, /let historyActionPromise = Promise\.resolve\(\)/);
  assert.match(contentSource, /function queueHistoryAction\(action\)/);
  assert.match(contentSource, /historyActionPromise = historyActionPromise\.catch\(\(\) => \{\}\)\.then\(action\)/);
  assert.match(contentSource, /queueHistoryAction\(undoLastAction\)/);
  assert.match(contentSource, /queueHistoryAction\(redoLastAction\)/);
});

test("Undo and Redo do not overwrite the atomic history result with TREE_SET", () => {
  const undoBody = functionBody("undoLastAction");
  const redoBody = functionBody("redoLastAction");
  assert.equal(undoBody.includes("await persist()"), false);
  assert.equal(redoBody.includes("await persist()"), false);
});

test("history results refresh a focused Note editor before restoring focus", () => {
  assert.match(contentSource, /function renderHistoryResult\(\)/);
  assert.match(contentSource, /const refocusEditor = shadow\.activeElement === noteEditor/);
  assert.match(contentSource, /if \(refocusEditor\) noteEditor\.blur\(\)/);
  assert.match(contentSource, /requestAnimationFrame\(\(\) => noteEditor\.focus/);
  assert.equal((contentSource.match(/renderHistoryResult\(\);/g) || []).length, 2);
});

test("Undo and Redo buttons expose localized platform shortcuts on hover", () => {
  assert.match(contentSource, /undoButton\.title = `\$\{t\("undo"\)\} \(\$\{undoShortcut\}\)`/);
  assert.match(contentSource, /redoButton\.title = `\$\{t\("redo"\)\} \(\$\{redoShortcut\}\)`/);
});

test("changing language refreshes the Note save status", () => {
  assert.match(contentSource, /noteSaveStatus\.textContent = noteSaveTimer \? t\("noteSaving"\) : t\("noteSaved"\)/);
  assert.match(contentSource, /highlightColorSelect\.setAttribute\("aria-label", t\("highlightColor"\)\)/);
});
