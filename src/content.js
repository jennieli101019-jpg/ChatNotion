(function startConversationTree() {
  "use strict";

  if (globalThis.__CHAT_NOTION_ORGANIZER_LOADED__) return;
  globalThis.__CHAT_NOTION_ORGANIZER_LOADED__ = true;

  const core = globalThis.ChatNotionCore;
  const outlineParser = globalThis.ChatNotionOutline;
  const chatPrompts = globalThis.ChatNotionPrompts;
  const customToolsModel = globalThis.ChatNotionCustomTools;
  const branchPolicy = globalThis.ChatNotionBranchPolicy;
  const dragScroll = globalThis.ChatNotionDragScroll;
  const marqueeModel = globalThis.ChatNotionMarquee;
  const inputIsolation = globalThis.ChatNotionInputIsolation;
  const markdownModel = globalThis.ChatNotionMarkdown;
  if (!core || !outlineParser || !chatPrompts || !customToolsModel || !branchPolicy || !marqueeModel || !inputIsolation) return;

  const ICONS = { folder: "", project: "◆", chat: "○", branch: "", annotation: "✎" };
  const FOLDER_ICON_PATH = "M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z";
  const I18N = {
    en: {
      launcher: "ChatNotion", openTree: "Open ChatNotion", panelLabel: "ChatNotion conversation organizer",
      brand: "ChatNotion",
      resizePanel: "Resize conversation tree", minimize: "Minimize to launcher",
      addFolder: "New folder", newFolder: "New folder", enterChat: "Enter chat", newChildPage: "New child page", contextRename: "Rename", contextDelete: "Delete", saveChat: "Save current chat", savedAutomatically: "✓ Saved automatically", savingChat: "Saving…", retrySave: "Save failed · Retry", treeMode: "Tree mode", promptTool: "Prompt tools", choosePrompt: "Choose a prompt…", builtInPrompts: "Built-in", customPrompts: "Custom", noPrompt: "No prompt", moveUp: "Move up", moveDown: "Move down", promptRestored: "Prompt restored to default", addPromptTool: "Add a prompt", toolName: "Tool name", customPromptPlaceholder: "Prompt text", saveCustom: "Save", deleteTool: "Delete", toolSaved: "Prompt tool saved", toolDeleted: "Prompt tool deleted", toolNameRequired: "Enter a tool name", toolPromptRequired: "Enter prompt text", maxPromptTools: "You can save up to 20 prompt tools", editTool: "Edit prompt tool", customizeTree: "Edit Tree mode", treePromptPlaceholder: "Tree mode instruction", restoreDefault: "Restore default", treePromptSaved: "Tree mode customized", treePromptRestored: "Tree mode restored to default", settings: "Settings", childChatPrompt: "Chat prompt", childPromptTemplateSaved: "Chat prompt template saved", childPromptTemplateRestored: "Chat prompt template restored", topicPlaceholderRequired: "The template must contain {topic}", localData: "Local data backup [Optional]", localBackup: "Local backup", restoreBackup: "Restore backup", backupPrivacy: "Includes your entire structured workspace, custom prompts, and settings in case of data loss.", backupCreated: "Local backup created", invalidBackup: "Could not read this backup", restoreConfirm: "Replace the current workspace with “{file}”?", restoreWarning: "The file is validated before any local data is changed.", confirmRestore: "Restore", cancel: "Cancel", backupRestored: "Workspace restored", autoBackup: "Automatic backup", autoBackupOff: "Off", everyHour: "Every hour", every6Hours: "Every 6 hours", everyDay: "Every day", everyWeek: "Every week", keep: "Keep", backups: "latest backups", chooseFolder: "Choose folder", changeFolder: "Change folder", noFolder: "No folder selected", selectedFolder: "Folder: {folder}", backupNeedsPermission: "Choose the folder again to renew access", backupFolderUnavailable: "Backup folder unavailable — choose it again", prefix: "Prefix", postfix: "Postfix", promptApplied: "Prompt added to the composer", promptRemoved: "Prompt removed from the composer", search: "Search",
      conversationSaving: "Conversation", autoSaveConversations: "Auto save chats & content", manualSaveChat: "Save current chat", savedManually: "✓ Saved", startBeforeSave: "Start the conversation before saving",
      addChild: "Add child", childName: "Child name", childAdded: "Child added locally", addUnavailable: "This item cannot contain conversations", cancel: "Cancel",
      searchLabel: "Search conversation tree", undo: "Undo", redo: "Redo", undone: "Last action undone", redone: "Last action restored", nothingToUndo: "Nothing to undo", nothingToRedo: "Nothing to redo",
      treeLabel: "Conversation tree map", rename: "Rename", open: "Open chat", startChat: "Start chat", remove: "Remove",
      switchLanguage: "中文｜EN",
      generate: "✦ Generate tree", generateAria: "Generate a local knowledge tree from this answer", generating: "Generating…", extractDepth: "Maximum depth", depthButton: "Depth {depth}", depthOption: "{depth} levels",
      expand: "Expand", collapse: "Collapse", currentChat: "Current Chat", project: "ChatGPT Project", untitled: "Untitled",
      noOutline: "No headings and knowledge points were found in this answer", treeExists: "A knowledge tree already exists for this answer",
      generated: "Generated {nodes} child chats locally", openSaved: "Open a saved ChatGPT conversation first",
      alreadySaved: "This Chat is already in the tree", chatSaved: "Current Chat saved locally",
      folderName: "Folder name", renamePrompt: "New name",
      finishBranch: "Finish creating this branch in ChatGPT first", noUrl: "This item has no ChatGPT URL",
      removeInlineConfirm: "Delete “{title}”?", removeInlineConfirmWithChildren: "Delete “{title}” and its children?", confirmDelete: "Delete",
      removeSelectedConfirm: "Delete {count} selected items?",
      removeSelectedConfirmWithChildren: "Delete {count} selected items and their children?",
      deletedChatUnlinked: "Deleted ChatGPT page marked as not started",
      noMatches: "No matching conversations", empty: "Open a ChatGPT conversation to start organizing",
      saveFailed: "Could not save local data", writeQuestion: "Write your question in ChatGPT first",
      treeModeReady: "Tree format added to your question", composerUnavailable: "ChatGPT’s input box was not found", moveTopLevel: "Drop here to move to top level", movedTopLevel: "Moved to top level",
      notePlaceholder: "Open the original conversation once to import its content, or start writing here…", noteSaved: "Saved locally", noteSaving: "Saving…", noteSaveFailed: "Save failed · keep editing or retry", closeNote: "Close page", openOriginal: "Open original chat", importOriginal: "Import ChatGPT content", importingOriginal: "Importing…", originalImported: "ChatGPT content imported", openOriginalToImport: "Open the original chat first, then import this Node again", restoreOriginal: "Restore original", editDocument: "Edit", finishEditing: "Done", highlightSelection: "Highlight", addInlineNote: "Add a note", inlineNotePlaceholder: "Write a note", noteLabel: "Note", highlightColor: "Highlight color", noteColor: "Note color", noOriginalChat: "This node is not linked to a ChatGPT conversation yet", noSnapshot: "Open this conversation once to import its content locally.", capturedDocument: "ChatGPT content · {count} messages", editedDocument: "Edited version · saved locally", you: "You", assistant: "ChatGPT", conversationDocument: "Conversation document"
    },
    zh: {
      launcher: "ChatNotion", openTree: "打开 ChatNotion", panelLabel: "ChatNotion 对话管理器",
      brand: "ChatNotion",
      resizePanel: "调整对话树大小", minimize: "最小化为启动按钮",
      addFolder: "新建文件夹", newFolder: "新建文件夹", enterChat: "进入 Chat", newChildPage: "新建子页面", contextRename: "改名", contextDelete: "删除", saveChat: "保存当前对话", savedAutomatically: "✓ 已自动保存", savingChat: "正在保存…", retrySave: "保存失败 · 重试", treeMode: "树形回答", promptTool: "提问工具", choosePrompt: "选择 Prompt…", builtInPrompts: "内置", customPrompts: "自定义", noPrompt: "不使用 Prompt", moveUp: "上移", moveDown: "下移", promptRestored: "Prompt 已恢复默认", addPromptTool: "添加 Prompt", toolName: "工具名称", customPromptPlaceholder: "Prompt 内容", saveCustom: "保存", deleteTool: "删除", toolSaved: "已保存 Prompt 工具", toolDeleted: "已删除 Prompt 工具", toolNameRequired: "请输入工具名称", toolPromptRequired: "请输入 Prompt 内容", maxPromptTools: "最多可以保存 20 个 Prompt 工具", editTool: "编辑 Prompt 工具", customizeTree: "编辑树形回答", treePromptPlaceholder: "树形回答指令", restoreDefault: "恢复系统默认", treePromptSaved: "已自定义树形回答", treePromptRestored: "已恢复系统默认树形回答", settings: "设置", childChatPrompt: "对话提问", childPromptTemplateSaved: "对话提问模板已保存", childPromptTemplateRestored: "对话提问模板已恢复默认", topicPlaceholderRequired: "模板必须包含 {topic}", localData: "本地数据备份 [可选]", localBackup: "创建本地备份", restoreBackup: "恢复备份", backupPrivacy: "包含完整的结构化工作区、自定义 Prompt 和设置，以便在数据丢失时恢复。", backupCreated: "本地备份已创建", invalidBackup: "无法读取此备份", restoreConfirm: "使用“{file}”替换当前工作区？", restoreWarning: "文件会在修改任何本地数据之前完成验证。", confirmRestore: "恢复", cancel: "取消", backupRestored: "工作区已恢复", autoBackup: "自动备份", autoBackupOff: "关闭", everyHour: "每小时", every6Hours: "每 6 小时", everyDay: "每天", everyWeek: "每周", keep: "保留", backups: "份最新备份", chooseFolder: "选择文件夹", changeFolder: "更改文件夹", noFolder: "尚未选择文件夹", selectedFolder: "文件夹：{folder}", backupNeedsPermission: "请重新选择文件夹以恢复访问权限", backupFolderUnavailable: "备份文件夹不可用，请重新选择", prefix: "前置 Prefix", postfix: "后置 Postfix", promptApplied: "已加入当前输入框", promptRemoved: "已从当前输入框移除 Prompt", search: "搜索",
      conversationSaving: "对话", autoSaveConversations: "自动保存对话与内容", manualSaveChat: "保存当前对话", savedManually: "✓ 已保存", startBeforeSave: "请先开始对话再保存",
      addChild: "添加子节点", childName: "子节点名称", childAdded: "已在本地添加子节点", addUnavailable: "该节点不能包含对话", cancel: "取消",
      searchLabel: "搜索对话树", undo: "撤销", redo: "恢复", undone: "已撤销上一次操作", redone: "已恢复撤销的操作", nothingToUndo: "没有可撤销的操作", nothingToRedo: "没有可恢复的操作",
      treeLabel: "对话树图", rename: "重命名", open: "进入对话", startChat: "开始对话", remove: "移除",
      switchLanguage: "中文｜EN",
      generate: "✦ 生成知识树", generateAria: "根据这条回答生成本地知识树", generating: "正在生成…", extractDepth: "最大深度", depthButton: "深度 {depth}", depthOption: "{depth} 层",
      expand: "展开", collapse: "折叠", currentChat: "当前对话", project: "ChatGPT 项目", untitled: "未命名",
      noOutline: "这条回答中没有找到标题和知识点列表", treeExists: "这条回答已经生成过知识树",
      generated: "已在本地生成 {nodes} 个子对话节点", openSaved: "请先打开一个已保存的 ChatGPT 对话",
      alreadySaved: "当前对话已经在树中", chatSaved: "当前对话已保存到本地",
      folderName: "文件夹名称", renamePrompt: "新名称",
      finishBranch: "请先在 ChatGPT 中完成该分支", noUrl: "该项目没有 ChatGPT URL",
      removeInlineConfirm: "删除“{title}”？", removeInlineConfirmWithChildren: "删除“{title}”及其子项？", confirmDelete: "删除",
      removeSelectedConfirm: "删除选中的 {count} 项？",
      removeSelectedConfirmWithChildren: "删除选中的 {count} 项及其子项？",
      deletedChatUnlinked: "已将删除的 ChatGPT 页面恢复为空心状态",
      noMatches: "没有匹配的对话", empty: "打开一个 ChatGPT 对话即可开始整理",
      saveFailed: "无法保存本地数据", writeQuestion: "请先在 ChatGPT 输入问题",
      treeModeReady: "已为问题添加知识树格式", composerUnavailable: "没有找到 ChatGPT 输入框", moveTopLevel: "拖到这里移至最外层", movedTopLevel: "已移至最外层",
      notePlaceholder: "打开一次原对话即可导入内容，或直接在这里开始编辑…", noteSaved: "已保存到本地", noteSaving: "正在保存…", noteSaveFailed: "保存失败，请继续编辑或重试", closeNote: "关闭页面", openOriginal: "打开原对话", importOriginal: "导入 ChatGPT 内容", importingOriginal: "正在导入…", originalImported: "已导入 ChatGPT 内容", openOriginalToImport: "请先打开原对话，再回来导入此 Node", restoreOriginal: "恢复原始内容", editDocument: "编辑", finishEditing: "完成", highlightSelection: "高亮", addInlineNote: "添加便签", inlineNotePlaceholder: "填写便签", noteLabel: "便签", highlightColor: "高亮颜色", noteColor: "便签颜色", noOriginalChat: "该节点尚未关联 ChatGPT 对话", noSnapshot: "打开一次这个对话，即可将内容导入本地。", capturedDocument: "ChatGPT 内容 · {count} 条消息", editedDocument: "编辑版本 · 已保存到本地", you: "你", assistant: "ChatGPT", conversationDocument: "对话文档"
    }
  };
  const NATIVE_BRANCH_WORDS = /^(?:branch(?: in (?:a )?new chat)?|在新聊天中分支|在新对话中分支|创建分支)(?:\s|$)/i;
  const PENDING_MAX_AGE = 10 * 60 * 1000;
  const NATIVE_BRANCH_DISCOVERY_MS = 3000;
  const ANSWER_STABLE_MS = 1400;
  const PANEL_EDGE_INSET = 8;
  const PANEL_TOP_INSET = 20;
  const PANEL_RIGHT_INSET = 20;
  const DEFAULT_PROMPT_PRESET_ORDER = ["tree"];
  const SYNC_KEYS = {
    tree: "chatNotionState",
    undo: "chatNotionUndoStack",
    redo: "chatNotionRedoStack",
    treePrompt: "chatNotionCustomTreePrompt",
    treePromptPosition: "chatNotionTreePromptPosition",
    childPromptContext: "chatNotionChildPromptContext",
    childPromptTemplate: "chatNotionChildPromptTemplate",
    customTools: "chatNotionCustomTools",
    promptPresetState: "chatNotionPromptPresetState",
    autoBackupSettings: "chatNotionAutoBackupSettings",
    autoBackupFolderName: "chatNotionAutoBackupFolderName",
    autoBackupLastRun: "chatNotionAutoBackupLastRun",
    autoBackupError: "chatNotionAutoBackupError",
    autoSave: "chatNotionAutoSaveEnabled"
  };

  let state = core.createEmptyState();
  let selectedId = null;
  let selectedIds = new Set();
  let selectionAnchorId = null;
  let searchQuery = "";
  let toastTimer = null;
  let pointerTreeDrag = null;
  let treeMarqueeSelection = null;
  let suppressTreeClick = false;
  let inlineEditorFocusGuardUntil = 0;
  let addingChildParentId = null;
  let addingFolderParentId;
  let editingNodeId = null;
  let deletingNodeId = null;
  let deletingNodeIds = new Set();
  let deletingSelectionCount = 0;
  let autoBackupSettings = { intervalMinutes: 0, retention: 10 };
  let autoBackupFolderName = "";
  let autoBackupPermission = "missing";
  let autoBackupError = "";
  let contextMenuNodeId = null;
  // Synthetic identity for logged-out / anonymous chats that never get a /c/<id> URL. Declared here
  // (not next to currentLocation) because canonicalChatUrl() runs during init below, before that line.
  let temporaryChatToken = "";
  let lastChatUrl = canonicalChatUrl();
  let decorating = false;
  let canUndo = false;
  let canRedo = false;
  let historyActionPromise = Promise.resolve();
  let maxExtractDepth = 3;
  let customPromptTools = [];
  let promptPresetState = { order: [...DEFAULT_PROMPT_PRESET_ORDER], hidden: [], overrides: {} };
  let customTreePrompt = "";
  let treePromptPositionValue = "postfix";
  let includeParentContext = true;
  let customChildPromptTemplate = "";
  let childPromptTemplateDirty = false;
  let editingPromptToolId = null;
  let editingBuiltInPromptId = null;
  let activePromptToolId = null;
  let appliedPromptSnapshot = null;
  let launcherPosition = null;
  let launcherDrag = null;
  let suppressLauncherClick = false;
  let panelBounds = null;
  let panelResize = null;
  let workspaceSplitResize = null;
  let panelMove = null;
  let suppressMinimizeClick = false;
  let panelVisibilityAnimation = null;
  let panelVisibilitySequence = 0;
  let panelVisibilityTarget = false;
  let notePageNodeId = null;
  let noteSaveTimer = null;
  let noteSaveSequence = 0;
  let noteDocumentEditing = false;
  let snapshotCaptureTimer = null;
  let snapshotCaptureSequence = 0;
  let extensionContextActive = true;
  let runtimePort = null;
  let nextRuntimeRequestId = 1;
  let answerSettleTimer = null;
  const answerStability = new WeakMap();
  let stateLoaded = false;
  let autoSavePhase = "idle";
  let autoSavePromise = null;
  let autoSaveEnabled = true;
  let pendingNativeBranch = null;
  let lastNativeBranchBaselineUserTurns = null;
  let branchDiscoveryUrl = "";
  let branchDiscoveryStartedAt = 0;
  const pendingRuntimeRequests = new Map();
  const pendingWorkspaceChanges = new Map();
  let workspaceSyncTimer = null;
  let lastConversationActionUrl = "";
  let pendingChatDeletion = null;
  let pendingLocalBackup = null;
  const pendingAnswerObservations = new Map();
  let locale = "en";

  function t(key, values = {}) {
    let value = I18N[locale]?.[key] || I18N.en[key] || key;
    for (const [name, replacement] of Object.entries(values)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
    return value;
  }

  function normalizeTreeDepth(value) {
    const depth = Number(value);
    return Number.isInteger(depth) && depth >= 1 && depth <= 5 ? depth : 3;
  }

  function createTreeLogo() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("tree-logo");
    const branches = document.createElementNS("http://www.w3.org/2000/svg", "path");
    branches.setAttribute("d", "M6.5 12h4M10.5 5.5v13M10.5 5.5h4M10.5 12h4M10.5 18.5h4");
    branches.setAttribute("fill", "none");
    branches.setAttribute("stroke", "currentColor");
    branches.setAttribute("stroke-width", "1.7");
    branches.setAttribute("stroke-linecap", "round");
    branches.setAttribute("stroke-linejoin", "round");
    svg.appendChild(branches);
    for (const [cx, cy] of [[4.5, 12], [17, 5.5], [17, 12], [17, 18.5]]) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", String(cx));
      node.setAttribute("cy", String(cy));
      node.setAttribute("r", "2");
      node.setAttribute("fill", "currentColor");
      svg.appendChild(node);
    }
    return svg;
  }

  function createContextMenuButton(label, modifier, paths) {
    const action = button("", `tree-context-item ${modifier}`);
    action.setAttribute("role", "menuitem");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    icon.classList.add("tree-context-icon");
    for (const pathData of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.appendChild(path);
    }
    action.append(icon, element("span", "tree-context-label", label));
    return action;
  }

  function createFolderGlyph(className = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.classList.add(className);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", FOLDER_ICON_PATH);
    svg.appendChild(path);
    return svg;
  }

  function createBranchGlyph() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 3.25v6.5a3 3 0 0 0 3 3h2.25M4 6.25h4a3 3 0 0 0 3-3");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.35");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    for (const [cx, cy] of [[4, 3.25], [11, 3.25], [10.75, 12.75]]) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", "1.45");
      circle.setAttribute("fill", "var(--tree-bg)");
      circle.setAttribute("stroke", "currentColor");
      circle.setAttribute("stroke-width", "1.25");
      svg.appendChild(circle);
    }
    return svg;
  }

  const host = document.createElement("div");
  host.id = "chat-notion-organizer-host";

  // ChatGPT is a Next.js/React app that hydrates <html> and <body> on the client. A node placed
  // as a direct child of <html> is seen as a hydration mismatch and removed (React minified error
  // #418), and other extensions (e.g. Monica) can wipe it too. Mount inside <body>, which React
  // tolerates, and re-attach if it is ever removed — otherwise the panel just flashes once and
  // vanishes. We deliberately do NOT guard <head> the same way: React reconciles <head> strictly,
  // so re-appending there fights hydration and destabilizes the whole document.
  function mountHost() {
    if (host.isConnected) return;
    (document.body || document.documentElement).appendChild(host);
  }
  mountHost();
  const mountGuard = new MutationObserver(() => {
    if (extensionContextActive) mountHost();
  });
  mountGuard.observe(document.documentElement, { childList: true });
  if (document.body) mountGuard.observe(document.body, { childList: true });

  const shadow = host.attachShadow({ mode: "closed" });

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = chrome.runtime.getURL("src/panel.css");
  shadow.appendChild(stylesheet);

  // KaTeX layout rules belong to the shadow root only; leaking them into the host page would
  // collide with ChatGPT's own .katex styles.
  const katexStylesheet = document.createElement("link");
  katexStylesheet.rel = "stylesheet";
  katexStylesheet.href = chrome.runtime.getURL("src/vendor/katex/katex.min.css");
  shadow.appendChild(katexStylesheet);

  // @font-face is ignored inside a shadow root, so the font declarations have to be registered on
  // the document itself. Appended once — never re-appended: React reconciles <head> strictly, and
  // fighting it there breaks hydration. This file carries nothing but @font-face, so it restyles
  // nothing outside the panel.
  if (!document.getElementById("chat-notion-katex-fonts")) {
    const katexFonts = document.createElement("link");
    katexFonts.id = "chat-notion-katex-fonts";
    katexFonts.rel = "stylesheet";
    katexFonts.href = chrome.runtime.getURL("src/vendor/katex/katex-fonts.css");
    document.head?.appendChild(katexFonts);
  }

  const launcher = button("", "launcher logo-button");
  launcher.appendChild(createTreeLogo());
  launcher.setAttribute("aria-label", t("openTree"));
  launcher.title = t("openTree");

  const panel = element("aside", "panel is-hidden");
  panel.setAttribute("aria-label", t("panelLabel"));

  const header = element("header", "header");
  const brand = element("div", "brand");
  const brandName = element("strong", "brand-name", t("brand"));
  const minimizeButton = button("", "logo-button minimize-button");
  minimizeButton.appendChild(createTreeLogo());
  minimizeButton.setAttribute("aria-label", t("minimize"));
  minimizeButton.title = t("minimize");
  brand.append(brandName);
  const zhLanguageButton = button("中文", "language-option");
  const enLanguageButton = button("EN", "language-option");
  const languageSwitch = element("div", "language-switch");
  languageSwitch.setAttribute("role", "group");
  languageSwitch.setAttribute("aria-label", "Language");
  languageSwitch.append(enLanguageButton, zhLanguageButton);
  const settingsButton = button("", "settings-button");
  settingsButton.setAttribute("aria-label", t("settings"));
  settingsButton.title = t("settings");
  settingsButton.setAttribute("aria-expanded", "false");
  const settingsIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  settingsIcon.setAttribute("viewBox", "0 0 16 16");
  settingsIcon.setAttribute("aria-hidden", "true");
  const settingsPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  settingsPath.setAttribute("d", "M6.9 1.5h2.2l.35 1.45c.35.12.68.3.98.5l1.4-.45 1.1 1.9-1.05 1.02c.04.2.07.42.07.63s-.03.43-.07.63l1.05 1.02-1.1 1.9-1.4-.45c-.3.2-.63.38-.98.5L9.1 11.6H6.9l-.35-1.45a4.6 4.6 0 0 1-.98-.5l-1.4.45-1.1-1.9 1.05-1.02a3.1 3.1 0 0 1 0-1.26L3.07 4.9 4.17 3l1.4.45c.3-.2.63-.38.98-.5L6.9 1.5ZM8 8.55a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z");
  settingsIcon.append(settingsPath);
  settingsButton.append(settingsIcon);
  const headerActions = element("div", "header-actions");
  headerActions.append(languageSwitch, settingsButton);

  const settingsPopover = element("div", "settings-popover is-hidden");
  const settingsTitle = element("strong", "settings-title", t("settings"));
  const conversationSavingSection = element("section", "settings-section settings-conversation-saving");
  const conversationSavingHeader = element("div", "settings-section-header");
  const conversationSavingTitle = element("strong", "settings-section-title", t("conversationSaving"));
  const autoSaveToggleLabel = element("label", "settings-switch-row");
  const autoSaveToggleText = element("span", "settings-switch-label", t("autoSaveConversations"));
  const autoSaveToggle = element("input", "settings-switch-input");
  autoSaveToggle.type = "checkbox";
  autoSaveToggle.setAttribute("role", "switch");
  autoSaveToggle.checked = true;
  autoSaveToggleLabel.append(autoSaveToggleText, autoSaveToggle);
  conversationSavingHeader.append(conversationSavingTitle, autoSaveToggleLabel);
  conversationSavingSection.append(conversationSavingHeader);
  const childPromptSection = element("section", "settings-section settings-child-prompt");
  const childPromptSectionHeader = element("div", "settings-section-header");
  const childPromptContextHeading = element("strong", "settings-section-title", t("childChatPrompt"));
  childPromptSectionHeader.append(childPromptContextHeading);
  const childPromptTemplateInput = element("textarea", "settings-template-input");
  childPromptTemplateInput.maxLength = 1000;
  childPromptTemplateInput.rows = 3;
  const childPromptTemplateActions = element("div", "settings-template-actions");
  const restoreChildPromptTemplateButton = button(t("restoreDefault"), "text-button");
  const saveChildPromptTemplateButton = button(t("saveCustom"), "button primary subtle");
  childPromptTemplateActions.append(restoreChildPromptTemplateButton, saveChildPromptTemplateButton);
  childPromptSection.append(childPromptSectionHeader, childPromptTemplateInput, childPromptTemplateActions);
  const localDataSection = element("section", "settings-section settings-local-data");
  const localDataTitle = element("strong", "settings-section-title", t("localData"));
  const localDataDescription = element("p", "settings-section-description", t("backupPrivacy"));
  const localDataActions = element("div", "settings-local-actions");
  const createLocalBackupButton = button(t("localBackup"), "settings-local-button backup-action");
  const chooseLocalBackupButton = button(t("restoreBackup"), "settings-local-button restore-action");
  const localBackupFileInput = element("input", "is-hidden");
  localBackupFileInput.type = "file";
  localBackupFileInput.accept = ".json,application/json";
  const restoreBackupConfirm = element("div", "settings-restore-confirm is-hidden");
  const restoreBackupConfirmText = element("strong", "settings-restore-title");
  const restoreBackupWarning = element("span", "settings-restore-warning", t("restoreWarning"));
  const restoreBackupConfirmActions = element("div", "settings-restore-actions");
  const cancelRestoreBackupButton = button(t("cancel"), "text-button");
  const confirmRestoreBackupButton = button(t("confirmRestore"), "button primary subtle");
  restoreBackupConfirmActions.append(cancelRestoreBackupButton, confirmRestoreBackupButton);
  restoreBackupConfirm.append(restoreBackupConfirmText, restoreBackupWarning, restoreBackupConfirmActions);
  const autoBackupSection = element("div", "settings-auto-backup");
  const autoBackupTitle = element("strong", "settings-auto-title", t("autoBackup"));
  const autoBackupControls = element("div", "settings-auto-controls");
  const autoBackupIntervalSelect = element("select", "settings-auto-select");
  for (const [value, label] of [[0, "autoBackupOff"], [60, "everyHour"], [360, "every6Hours"], [1440, "everyDay"], [10080, "everyWeek"]]) {
    const option = element("option", "", t(label));
    option.value = String(value);
    option.dataset.i18n = label;
    autoBackupIntervalSelect.append(option);
  }
  const autoBackupRetentionControl = element("label", "settings-retention-control");
  const autoBackupKeepLabel = element("span", "", t("keep"));
  const autoBackupRetentionSelect = element("select", "settings-retention-select");
  for (let count = 1; count <= 20; count += 1) {
    const option = element("option", "", String(count));
    option.value = String(count);
    autoBackupRetentionSelect.append(option);
  }
  const autoBackupBackupsLabel = element("span", "", t("backups"));
  autoBackupRetentionControl.append(autoBackupKeepLabel, autoBackupRetentionSelect, autoBackupBackupsLabel);
  const chooseAutoBackupFolderButton = button(t("chooseFolder"), "settings-folder-button");
  const autoBackupStatusText = element("span", "settings-auto-status", t("noFolder"));
  autoBackupControls.append(autoBackupIntervalSelect, autoBackupRetentionControl);
  autoBackupSection.append(autoBackupTitle, autoBackupControls, chooseAutoBackupFolderButton, autoBackupStatusText);
  localDataActions.append(createLocalBackupButton, chooseLocalBackupButton);
  localDataSection.append(localDataTitle, localDataDescription, localDataActions, localBackupFileInput, restoreBackupConfirm, autoBackupSection);
  settingsPopover.append(settingsTitle, conversationSavingSection, childPromptSection, localDataSection);
  header.append(brand, headerActions, settingsPopover);

  const folderButton = button("", "tree-tool-button folder-tool-button");
  const folderButtonIcon = element("span", "folder-tool-icon");
  folderButtonIcon.appendChild(createFolderGlyph("folder-tool-glyph"));
  const folderButtonLabel = element("span", "folder-tool-label", t("addFolder"));
  folderButton.append(folderButtonIcon, folderButtonLabel);
  folderButton.setAttribute("aria-label", t("addFolder"));
  folderButton.title = t("addFolder");

  const promptToolList = element("div", "prompt-tool-list");
  const promptToolSelect = element("select", "prompt-tool-select");
  promptToolSelect.setAttribute("aria-label", t("promptTool"));
  const editTreePromptButton = button("✎", "prompt-tool-edit");
  editTreePromptButton.setAttribute("aria-label", t("customizeTree"));
  editTreePromptButton.title = t("customizeTree");
  const promptPickerGroup = element("div", "prompt-picker-group");
  promptPickerGroup.append(promptToolSelect, editTreePromptButton);
  promptToolList.append(promptPickerGroup);
  const promptEditorToolbar = element("div", "prompt-editor-toolbar is-hidden");
  const addPromptToolButton = button(t("addPromptTool"), "button prompt-editor-add");
  addPromptToolButton.setAttribute("aria-label", t("addPromptTool"));
  addPromptToolButton.title = t("addPromptTool");
  promptEditorToolbar.append(addPromptToolButton);
  const customPromptEditor = element("div", "custom-prompt-editor is-hidden");
  const customPromptNameInput = element("input", "custom-prompt-name");
  customPromptNameInput.maxLength = 40;
  customPromptNameInput.placeholder = t("toolName");
  const customPromptInput = element("textarea", "custom-prompt-input");
  customPromptInput.maxLength = 1000;
  customPromptInput.rows = 3;
  customPromptInput.placeholder = t("customPromptPlaceholder");
  customPromptInput.setAttribute("aria-label", t("customPromptPlaceholder"));
  const customPromptPosition = element("select", "custom-prompt-position");
  for (const position of ["prefix", "postfix"]) {
    const option = element("option", "", t(position));
    option.value = position;
    customPromptPosition.append(option);
  }
  const customPromptEditorActions = element("div", "custom-prompt-editor-actions");
  const restoreBuiltInPromptButton = button(t("restoreDefault"), "text-button is-hidden");
  const movePromptUpButton = button(t("moveUp"), "text-button");
  const movePromptDownButton = button(t("moveDown"), "text-button");
  const deleteCustomPromptButton = button(t("deleteTool"), "text-button danger-text is-hidden");
  const cancelCustomPromptButton = button(t("cancel"), "text-button");
  const saveCustomPromptButton = button(t("saveCustom"), "button primary subtle");
  customPromptEditorActions.append(restoreBuiltInPromptButton, movePromptUpButton, movePromptDownButton, deleteCustomPromptButton, customPromptPosition, cancelCustomPromptButton, saveCustomPromptButton);
  customPromptEditor.append(customPromptNameInput, customPromptInput, customPromptEditorActions);
  const treePromptEditor = element("div", "custom-prompt-editor is-hidden");
  const treePromptInput = element("textarea", "custom-prompt-input");
  treePromptInput.maxLength = 2500;
  treePromptInput.rows = 5;
  treePromptInput.placeholder = t("treePromptPlaceholder");
  const treePromptEditorActions = element("div", "custom-prompt-editor-actions");
  const restoreTreePromptButton = button(t("restoreDefault"), "text-button");
  const treePromptPosition = element("select", "custom-prompt-position");
  for (const position of ["prefix", "postfix"]) {
    const option = element("option", "", t(position));
    option.value = position;
    treePromptPosition.append(option);
  }
  const cancelTreePromptButton = button(t("cancel"), "text-button");
  const saveTreePromptButton = button(t("saveCustom"), "button primary subtle");
  treePromptEditorActions.append(restoreTreePromptButton, treePromptPosition, cancelTreePromptButton, saveTreePromptButton);
  treePromptEditor.append(treePromptInput, treePromptEditorActions);
  const searchInput = element("input", "compact-search");
  searchInput.type = "search";
  searchInput.placeholder = t("search");
  searchInput.setAttribute("aria-label", t("searchLabel"));
  const searchWrap = element("label", "search-wrap");
  searchWrap.append(searchInput);
  const treeToolbar = element("div", "tree-toolbar");
  treeToolbar.append(promptToolList, folderButton, searchWrap, promptEditorToolbar, customPromptEditor, treePromptEditor);

  const tree = element("div", "tree");
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", t("treeLabel"));
  tree.tabIndex = 0;
  const treeSelectionMarquee = element("div", "tree-selection-marquee is-hidden");

  // Keep widget interactions from reaching ChatGPT's page-level click handlers,
  // which may otherwise move focus back to the main composer.
  for (const eventName of ["pointerdown", "mousedown", "click", "dblclick", "contextmenu"]) {
    shadow.addEventListener(eventName, (event) => event.stopPropagation());
  }
  inputIsolation.install({
    shadowRoot: shadow,
    windowRoot: window,
    documentRoot: document,
    host,
    getProtectedInput: activeInlineEditorInput
  });
  tree.addEventListener("pointerdown", startTreeMarqueeSelection);
  tree.addEventListener("pointermove", moveTreeMarqueeSelection);
  tree.addEventListener("pointerup", finishTreeMarqueeSelection);
  tree.addEventListener("pointercancel", cancelTreeMarqueeSelection);
  tree.addEventListener("click", (event) => {
    if (!suppressTreeClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressTreeClick = false;
  }, true);
  tree.addEventListener("click", (event) => {
    if (event.target.closest(".tree-row, .inline-child-row, button, input, textarea, select")) return;
    if (!selectedIds.size) return;
    selectSingleNode(null);
    updateRenderedSelection();
  });
  tree.addEventListener("keydown", (event) => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
      const visibleIds = visibleTreeNodeIds();
      if (!visibleIds.length) return;
      event.preventDefault();
      selectedIds = new Set(visibleIds);
      selectedId = visibleIds.at(-1);
      selectionAnchorId = visibleIds[0];
      updateRenderedSelection();
      tree.focus({ preventScroll: true });
      return;
    }
    if (["Delete", "Backspace"].includes(event.key) && selectedIds.size && !deletingNodeId) {
      const primaryId = selectedId || [...selectedIds][0];
      if (!primaryId) return;
      event.preventDefault();
      beginDelete(primaryId);
    }
  });
  tree.addEventListener("contextmenu", (event) => {
    const row = event.target.closest(".tree-row");
    if (row) {
      event.preventDefault();
      const node = core.getNode(state, row.dataset.nodeId);
      if (!node) return;
      if (!selectedIds.has(node.id)) selectSingleNode(node.id);
      updateRenderedSelection();
      showTreeContextMenu(event.clientX, event.clientY, node);
      return;
    }
    if (event.target.closest(".inline-child-row, .root-drop-zone, button, input, textarea, select")) {
      hideTreeContextMenu();
      return;
    }
    event.preventDefault();
    showTreeContextMenu(event.clientX, event.clientY, null);
  });

  const treeContextMenu = element("div", "tree-context-menu is-hidden");
  treeContextMenu.setAttribute("role", "menu");
  const contextNewFolderButton = createContextMenuButton(t("newFolder"), "tree-context-folder", ["M2.5 4.5h4l1.25 1.5h5.75v6.75h-11z"]);
  const contextEnterChatButton = createContextMenuButton(t("enterChat"), "tree-context-open", ["M6.5 3.25h6.25v6.25", "M12.5 3.5 6 10", "M12.5 12.75H3.25v-9.5h3"]);
  const contextNewChildButton = createContextMenuButton(t("newChildPage"), "tree-context-child tree-context-group", ["M8 2.5v11", "M2.5 8h11"]);
  const contextRenameButton = createContextMenuButton(t("contextRename"), "tree-context-rename tree-context-group", ["M10.75 2.5l2.75 2.75-7.25 7.25-3.5.75.75-3.5z", "m9.75 3.5 2.75 2.75"]);
  const contextDeleteButton = createContextMenuButton(t("contextDelete"), "tree-context-delete tree-context-danger", ["M3 4.25h10", "M6 2.5h4l.5 1.75h-5z", "m4 6 .25 4", "m8-4-.25 4", "M4.25 4.25 5 13.5h6l.75-9.25"]);
  treeContextMenu.append(contextNewFolderButton, contextEnterChatButton, contextNewChildButton, contextRenameButton, contextDeleteButton);

  const footer = element("footer", "footer");
  const saveChatButton = button(t("saveChat"), "text-button footer-save-button");
  const undoButton = button(t("undo"), "text-button");
  const redoButton = button(t("redo"), "text-button");
  const footerEndActions = element("div", "footer-end-actions");
  footerEndActions.append(undoButton, redoButton);
  footer.append(saveChatButton, footerEndActions);

  const workspaceSidebar = element("div", "workspace-sidebar");
  workspaceSidebar.append(treeToolbar, tree, footer);
  const workspaceSplitHandle = element("div", "workspace-split-handle");
  workspaceSplitHandle.setAttribute("role", "separator");
  workspaceSplitHandle.setAttribute("aria-orientation", "vertical");
  workspaceSplitHandle.setAttribute("aria-label", t("resizePanel"));
  const notePage = element("section", "note-page is-hidden");
  const notePageHeader = element("div", "note-page-header");
  const notePageHeading = element("div", "note-page-heading");
  const notePageTitle = element("h2", "note-page-title");
  const notePageMeta = element("span", "note-page-meta");
  notePageHeading.append(notePageTitle, notePageMeta);
  const notePageActions = element("div", "note-page-actions");
  const editDocumentButton = button(t("editDocument"), "button note-edit-document");
  const restoreOriginalButton = button(t("restoreOriginal"), "button note-restore-original is-hidden");
  const importOriginalButton = button(t("importOriginal"), "button note-import-original is-hidden");
  const openOriginalButton = button(t("openOriginal"), "button note-open-original");
  const closeNoteButton = button("×", "note-close-button");
  closeNoteButton.setAttribute("aria-label", t("closeNote"));
  closeNoteButton.title = t("closeNote");
  notePageActions.append(editDocumentButton, restoreOriginalButton, importOriginalButton, openOriginalButton, closeNoteButton);
  notePageHeader.append(notePageHeading, notePageActions);
  const noteEditor = element("textarea", "note-editor");
  noteEditor.placeholder = t("notePlaceholder");
  noteEditor.setAttribute("aria-label", t("conversationDocument"));
  noteEditor.spellcheck = true;
  const noteFormatToolbar = element("div", "note-format-toolbar is-hidden");
  const highlightSelectionButton = button(t("highlightSelection"), "note-format-button note-highlight-button");
  const addInlineNoteButton = button(t("addInlineNote"), "note-format-button note-inline-note-button");
  const highlightColorSelect = createNoteColorPalette("highlightColor", "yellow");
  const noteColorSelect = createNoteColorPalette("noteColor", "yellow");
  const highlightFormatRow = element("div", "note-format-row");
  const noteFormatRow = element("div", "note-format-row");
  highlightFormatRow.append(highlightSelectionButton, highlightColorSelect);
  noteFormatRow.append(addInlineNoteButton, noteColorSelect);
  noteFormatToolbar.append(highlightFormatRow, noteFormatRow);
  const notePreview = element("div", "note-preview");
  notePreview.tabIndex = 0;
  const noteSaveStatus = element("span", "note-save-status", t("noteSaved"));
  notePage.append(notePageHeader, notePreview, noteFormatToolbar, noteEditor, noteSaveStatus);
  const workspaceBody = element("div", "workspace-body");
  workspaceBody.append(workspaceSidebar, workspaceSplitHandle, notePage);

  const toast = element("div", "toast is-hidden");
  toast.setAttribute("role", "status");
  const panelResizeHandles = ["n", "e", "s", "w", "nw", "ne", "sw", "se"].map((direction) => {
    const handle = element("div", `panel-resize-handle resize-${direction}`);
    handle.dataset.direction = direction;
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", t("resizePanel"));
    return handle;
  });
  const panelSurface = element("div", "panel-surface");
  panelSurface.append(header, workspaceBody, treeContextMenu, treeSelectionMarquee, toast);
  panel.append(minimizeButton, panelSurface, ...panelResizeHandles);
  shadow.append(launcher, panel);

  closeNoteButton.addEventListener("click", closeNotePage);
  editDocumentButton.addEventListener("click", () => setDocumentEditing(!noteDocumentEditing));
  restoreOriginalButton.addEventListener("click", async () => {
    const node = core.getNode(state, notePageNodeId);
    if (!node?.noteEdited) return;
    noteEditor.value = snapshotMarkdown(node.sourceSnapshot);
    noteDocumentEditing = false;
    await saveOpenNote();
    renderNotePage();
  });
  importOriginalButton.addEventListener("click", importOpenNoteOriginalContent);
  openOriginalButton.addEventListener("click", () => {
    const node = core.getNode(state, notePageNodeId);
    if (!node) return;
    selectSingleNode(node.id);
    openSelected();
  });
  noteEditor.addEventListener("input", scheduleNoteSave);
  highlightSelectionButton.addEventListener("pointerdown", (event) => event.preventDefault());
  addInlineNoteButton.addEventListener("pointerdown", (event) => event.preventDefault());
  highlightSelectionButton.addEventListener("click", () => void applyNoteSelectionFormat("highlight", highlightColorSelect.dataset.value));
  addInlineNoteButton.addEventListener("click", () => void applyNoteSelectionFormat("note", noteColorSelect.dataset.value));
  noteEditor.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveOpenNote();
    }
  });

  function handleWorkspaceHistoryShortcut(event) {
    if (panel.classList.contains("is-hidden")) return false;
    const primaryModifier = event.metaKey || event.ctrlKey;
    const key = event.code === "KeyZ" ? "z" : event.code === "KeyY" ? "y" : event.key.toLowerCase();
    const undo = primaryModifier && key === "z" && !event.shiftKey;
    const redo = (primaryModifier && key === "z" && event.shiftKey)
      || (primaryModifier && key === "y")
      || (primaryModifier && event.shiftKey && key === "c");
    if (!undo && !redo) return false;
    event.preventDefault();
    event.stopPropagation();
    void queueHistoryAction(redo ? redoLastAction : undoLastAction);
    return true;
  }

  function queueHistoryAction(action) {
    historyActionPromise = historyActionPromise.catch(() => {}).then(action);
    return historyActionPromise;
  }

  launcher.addEventListener("click", () => {
    if (suppressLauncherClick) {
      suppressLauncherClick = false;
      return;
    }
    setPanelOpen(true);
  });
  launcher.addEventListener("pointerdown", startLauncherDrag);
  launcher.addEventListener("pointermove", moveLauncherDrag);
  launcher.addEventListener("pointerup", finishLauncherDrag);
  launcher.addEventListener("pointercancel", cancelLauncherDrag);
  window.addEventListener("resize", () => {
    applyLauncherPosition(launcherPosition);
    applyPanelBounds(panelBounds);
  });
  minimizeButton.addEventListener("click", () => {
    if (suppressMinimizeClick) {
      suppressMinimizeClick = false;
      return;
    }
    setPanelOpen(false);
  });
  minimizeButton.addEventListener("pointerdown", (event) => startPanelMove(event, true));
  minimizeButton.addEventListener("pointermove", movePanelMove);
  minimizeButton.addEventListener("pointerup", finishPanelMove);
  minimizeButton.addEventListener("pointercancel", cancelPanelMove);
  zhLanguageButton.addEventListener("click", () => setLocale("zh"));
  enLanguageButton.addEventListener("click", () => setLocale("en"));
  settingsButton.addEventListener("click", () => {
    const shouldOpen = settingsPopover.classList.contains("is-hidden");
    settingsPopover.classList.toggle("is-hidden", !shouldOpen);
    settingsButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) void refreshAutoBackupStatus();
  });
  settingsPopover.addEventListener("pointerdown", (event) => event.stopPropagation());
  shadow.addEventListener("pointerdown", (event) => {
    const path = event.composedPath();
    if (!path.includes(treeContextMenu)) hideTreeContextMenu();
    if (!path.includes(settingsButton) && !path.includes(settingsPopover)) hideSettingsPopover();
  });
  for (const handle of panelResizeHandles) {
    handle.addEventListener("pointerdown", startPanelResize);
    handle.addEventListener("pointermove", movePanelResize);
    handle.addEventListener("pointerup", finishPanelResize);
    handle.addEventListener("pointercancel", cancelPanelResize);
  }
  workspaceSplitHandle.addEventListener("pointerdown", startWorkspaceSplitResize);
  workspaceSplitHandle.addEventListener("pointermove", moveWorkspaceSplitResize);
  workspaceSplitHandle.addEventListener("pointerup", finishWorkspaceSplitResize);
  workspaceSplitHandle.addEventListener("pointercancel", finishWorkspaceSplitResize);
  header.addEventListener("pointerdown", startPanelMove);
  header.addEventListener("pointermove", movePanelMove);
  header.addEventListener("pointerup", finishPanelMove);
  header.addEventListener("pointercancel", cancelPanelMove);
  folderButton.addEventListener("click", beginAddFolder);
  saveChatButton.addEventListener("click", () => saveCurrentChat(true));
  autoSaveToggle.addEventListener("change", saveAutoSavePreference);
  promptToolSelect.addEventListener("change", applySelectedPromptTool);
  editTreePromptButton.addEventListener("click", editSelectedPromptTool);
  addPromptToolButton.addEventListener("click", () => openCustomPromptEditor());
  saveCustomPromptButton.addEventListener("click", saveCustomPrompt);
  deleteCustomPromptButton.addEventListener("click", deleteCustomPrompt);
  restoreBuiltInPromptButton.addEventListener("click", restoreSelectedBuiltInPrompt);
  movePromptUpButton.addEventListener("click", () => moveEditedPrompt(-1));
  movePromptDownButton.addEventListener("click", () => moveEditedPrompt(1));
  cancelCustomPromptButton.addEventListener("click", closeCustomPromptEditor);
  saveTreePromptButton.addEventListener("click", saveTreePrompt);
  restoreTreePromptButton.addEventListener("click", restoreTreePrompt);
  cancelTreePromptButton.addEventListener("click", closeTreePromptEditor);
  customPromptInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      closeCustomPromptEditor();
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      saveCustomPrompt();
    }
  });
  treePromptInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      closeTreePromptEditor();
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      saveTreePrompt();
    }
  });
  saveChildPromptTemplateButton.addEventListener("click", saveChildPromptTemplate);
  restoreChildPromptTemplateButton.addEventListener("click", restoreChildPromptTemplate);
  createLocalBackupButton.addEventListener("click", createLocalBackup);
  chooseLocalBackupButton.addEventListener("click", () => {
    localBackupFileInput.value = "";
    localBackupFileInput.click();
  });
  localBackupFileInput.addEventListener("change", prepareLocalBackupRestore);
  cancelRestoreBackupButton.addEventListener("click", cancelLocalBackupRestore);
  confirmRestoreBackupButton.addEventListener("click", restoreLocalBackup);
  autoBackupIntervalSelect.addEventListener("change", saveAutoBackupSettings);
  autoBackupRetentionSelect.addEventListener("change", saveAutoBackupSettings);
  chooseAutoBackupFolderButton.addEventListener("click", chooseAutoBackupFolder);
  childPromptTemplateInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      saveChildPromptTemplate();
    }
  });
  childPromptTemplateInput.addEventListener("input", () => {
    childPromptTemplateDirty = true;
  });
  treePromptPosition.addEventListener("change", async () => {
    const current = currentComposerText();
    const treeEditorOpen = !treePromptEditor.classList.contains("is-hidden");
    const draft = treeEditorOpen
      ? chatPrompts.customTreeInstruction(treePromptInput.value)
      : "";
    const withoutPrefixDraft = draft ? chatPrompts.removeCustomPrompt(current, draft, "prefix") : current;
    const withoutDraft = draft ? chatPrompts.removeCustomPrompt(withoutPrefixDraft, draft, "postfix") : current;
    const draftWasApplied = withoutDraft !== current.trim();
    const wasApplied = draftWasApplied || isTreePromptApplied(current) || activePromptToolId === "tree";
    const base = wasApplied ? stripPromptTools(withoutDraft) : current;
    const response = await sendMessage({
      type: "TREE_PROMPT_SET",
      prompt: customTreePrompt,
      position: treePromptPosition.value
    });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    treePromptPositionValue = response.position === "prefix" ? "prefix" : "postfix";
    syncHistoryAvailability(response);
    if (wasApplied) {
      const instruction = treeEditorOpen
        ? draft
        : (customTreePrompt ? resolvedCustomTreePrompt() : chatPrompts.treeInstruction(locale));
      const filled = await prefillComposer(chatPrompts.appendCustomPrompt(base, instruction, treePromptPositionValue));
      if (filled) rememberAppliedPrompt("tree", instruction, treePromptPositionValue);
      else showToast(t("composerUnavailable"), true);
    }
  });
  undoButton.addEventListener("click", () => void queueHistoryAction(undoLastAction));
  redoButton.addEventListener("click", () => void queueHistoryAction(redoLastAction));
  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    render();
  });
  contextNewFolderButton.addEventListener("click", () => {
    hideTreeContextMenu();
    selectSingleNode(null);
    beginAddFolder(null);
  });
  contextEnterChatButton.addEventListener("click", () => {
    const node = core.getNode(state, contextMenuNodeId);
    hideTreeContextMenu();
    if (!node) return;
    selectSingleNode(node.id);
    openSelected();
  });
  contextNewChildButton.addEventListener("click", () => {
    const node = core.getNode(state, contextMenuNodeId);
    hideTreeContextMenu();
    if (!node) return;
    selectSingleNode(node.id);
    beginAddChild(node.id);
  });
  contextRenameButton.addEventListener("click", () => {
    const node = core.getNode(state, contextMenuNodeId);
    hideTreeContextMenu();
    if (node) beginRename(node.id);
  });
  contextDeleteButton.addEventListener("click", () => {
    const node = core.getNode(state, contextMenuNodeId);
    hideTreeContextMenu();
    if (!node) return;
    beginDelete(node.id);
  });
  document.addEventListener("click", () => {
    closeExtractionDepthMenus();
    hideTreeContextMenu();
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.composedPath().includes(host)) return;
    cancelInlineNodeEditors();
    hideTreeContextMenu();
    hideSettingsPopover();
    if (panelVisibilityTarget || !panel.classList.contains("is-hidden")) setPanelOpen(false);
  }, true);
  document.addEventListener("click", handleChatGptDeleteClick, true);
  document.addEventListener("click", handleNativeBranchClick, true);
  document.addEventListener("click", handleChatGptConversationNavigation, true);
  document.addEventListener("keydown", (event) => {
    if (handleWorkspaceHistoryShortcut(event)) return;
    if (event.key === "Escape") {
      pendingChatDeletion = null;
      settingsPopover.classList.add("is-hidden");
      settingsButton.setAttribute("aria-expanded", "false");
    }
  }, true);

  const observer = new MutationObserver(scheduleDecorateTurns);
  observer.observe(document.body, { childList: true, subtree: true });
  const navigationInterval = setInterval(() => {
    void handleNavigation().catch(handleAsyncFailure);
  }, 700);
  void loadState().catch(handleAsyncFailure);

  async function loadState() {
    const responses = [];
    for (const type of [
      "TREE_GET",
      "EXTRACT_DEPTH_GET",
      "CUSTOM_TOOLS_GET",
      "PROMPT_PRESET_STATE_GET",
      "TREE_PROMPT_GET",
      "CHILD_PROMPT_CONTEXT_GET",
      "CHILD_PROMPT_TEMPLATE_GET",
      "AUTO_SAVE_GET",
      "LAUNCHER_POSITION_GET",
      "PANEL_BOUNDS_GET",
      "AUTO_BACKUP_STATUS_GET"
    ]) {
      responses.push(await sendMessage({ type }));
      if (!extensionContextActive) return;
    }
    const [response, extractDepthResponse, customToolsResponse, presetStateResponse, treePromptResponse, childPromptContextResponse, childPromptTemplateResponse, autoSaveResponse, launcherPositionResponse, panelBoundsResponse, autoBackupResponse] = responses;
    maxExtractDepth = normalizeTreeDepth(extractDepthResponse?.depth);
    customPromptTools = customToolsModel.normalize(customToolsResponse?.tools);
    promptPresetState = normalizePromptPresetState(presetStateResponse?.state);
    const storedTreePrompt = String(treePromptResponse?.prompt || "").trim().slice(0, 2500);
    customTreePrompt = chatPrompts.isDefaultTreeInstruction(storedTreePrompt) ? "" : storedTreePrompt;
    treePromptPositionValue = treePromptResponse?.position === "prefix" ? "prefix" : "postfix";
    includeParentContext = childPromptContextResponse?.enabled !== false;
    customChildPromptTemplate = normalizeStoredChildPromptTemplate(childPromptTemplateResponse?.template, includeParentContext);
    autoSaveEnabled = autoSaveResponse?.enabled !== false;
    autoSaveToggle.checked = autoSaveEnabled;
    childPromptTemplateDirty = false;
    childPromptTemplateInput.value = editableChildPromptTemplate(customChildPromptTemplate);
    if (storedTreePrompt && !customTreePrompt) {
      await sendMessage({ type: "TREE_PROMPT_SET", prompt: "", position: treePromptPositionValue, skipHistory: true });
    }
    treePromptPosition.value = treePromptPositionValue;
    launcherPosition = launcherPositionResponse?.position || null;
    panelBounds = panelBoundsResponse?.bounds || null;
    applyLauncherPosition(launcherPosition);
    applyPanelBounds(panelBounds);
    applyAutoBackupStatus(autoBackupResponse);
    canUndo = Boolean(response?.canUndo);
    canRedo = Boolean(response?.canRedo);
    if (response?.ok && response.state) {
      try {
        state = core.validateState(response.state);
        for (const legacyPending of state.nodes.filter((node) => node.kind === "branch" && node.status === "pending" && !node.sourceUrl)) {
          state = core.removeNode(state, legacyPending.id);
        }
        await persist();
      } catch (_error) {
        state = core.createEmptyState();
      }
    }
    await refreshPendingNativeBranch();
    await finalizePendingChildChat();
    await resumePendingChildChat();
    await completePendingChildChat();
    stateLoaded = true;
    await autoSaveCurrentChat();
    applyLocale();
    render();
    scheduleDecorateTurns();
  }

  function connectRuntimePort() {
    if (runtimePort || !extensionContextActive) return runtimePort;
    try {
      if (!globalThis.chrome?.runtime?.id) throw new Error("Extension context invalidated");
      const port = chrome.runtime.connect({ name: "chat-notion-rpc" });
      runtimePort = port;
      port.onMessage.addListener((envelope) => {
        if (envelope?.event === "AUTO_BACKUP_STATUS_CHANGED") {
          applyAutoBackupStatus(envelope.status);
          return;
        }
        if (envelope?.event === "WORKSPACE_CHANGED") {
          queueWorkspaceChanges(envelope.changes);
          return;
        }
        const pending = pendingRuntimeRequests.get(envelope?.requestId);
        if (!pending) return;
        pendingRuntimeRequests.delete(envelope.requestId);
        pending(envelope.response);
      });
      port.onDisconnect.addListener(() => {
        if (runtimePort === port) runtimePort = null;
        for (const resolve of pendingRuntimeRequests.values()) {
          resolve({ ok: false, error: "Extension background disconnected", runtimeDisconnected: true });
        }
        pendingRuntimeRequests.clear();
      });
      return port;
    } catch (_error) {
      invalidateExtensionContext();
      return null;
    }
  }

  function sendMessage(message) {
    const port = connectRuntimePort();
    if (!port) return Promise.resolve({ ok: false, contextInvalidated: true });
    return new Promise((resolve) => {
      const requestId = nextRuntimeRequestId++;
      pendingRuntimeRequests.set(requestId, resolve);
      try {
        port.postMessage({ requestId, message });
      } catch (error) {
        pendingRuntimeRequests.delete(requestId);
        resolve({ ok: false, error: error.message, contextInvalidated: true });
        invalidateExtensionContext();
      }
    });
  }

  function queueWorkspaceChanges(changes) {
    if (!changes || typeof changes !== "object") return;
    for (const [key, change] of Object.entries(changes)) pendingWorkspaceChanges.set(key, change);
    clearTimeout(workspaceSyncTimer);
    workspaceSyncTimer = setTimeout(applyWorkspaceChanges, 40);
  }

  function syncedValue(changes, key, fallback) {
    const change = changes.get(key);
    if (!change) return fallback;
    return change.removed ? null : change.value;
  }

  function applyWorkspaceChanges() {
    workspaceSyncTimer = null;
    if (!extensionContextActive || !pendingWorkspaceChanges.size) return;
    const changes = new Map(pendingWorkspaceChanges);
    pendingWorkspaceChanges.clear();

    const treeChange = changes.get(SYNC_KEYS.tree);
    if (treeChange && !treeChange.removed && treeChange.value) {
      if (treeChange.value.nodes?.some((node) => node.bodyStored)) {
        void refreshHydratedWorkspace();
      } else {
      try {
        const nextState = core.consolidateConversationDuplicates(core.validateState(treeChange.value));
        if (JSON.stringify(nextState) !== JSON.stringify(state)) {
          state = nextState;
          selectedIds = new Set([...selectedIds].filter((id) => core.getNode(state, id)));
          if (selectedId && !core.getNode(state, selectedId)) selectedId = null;
          if (selectionAnchorId && !core.getNode(state, selectionAnchorId)) selectionAnchorId = null;
          if (editingNodeId && !core.getNode(state, editingNodeId)) editingNodeId = null;
          if (deletingNodeId && !core.getNode(state, deletingNodeId)) deletingNodeId = null;
          if (addingChildParentId && !core.getNode(state, addingChildParentId)) addingChildParentId = null;
          if (addingFolderParentId && !core.getNode(state, addingFolderParentId)) addingFolderParentId = undefined;
          render();
        }
      } catch (_error) {}
      }
    }

    if (changes.has(SYNC_KEYS.undo)) {
      const count = Number(syncedValue(changes, SYNC_KEYS.undo, 0));
      canUndo = Number.isFinite(count) && count > 0;
    }
    if (changes.has(SYNC_KEYS.redo)) {
      const count = Number(syncedValue(changes, SYNC_KEYS.redo, 0));
      canRedo = Number.isFinite(count) && count > 0;
    }
    updateHistoryButtons();

    if (changes.has(SYNC_KEYS.autoSave)) {
      autoSaveEnabled = syncedValue(changes, SYNC_KEYS.autoSave, true) !== false;
      autoSaveToggle.checked = autoSaveEnabled;
      autoSavePhase = "idle";
      updateSaveChatButton();
      if (autoSaveEnabled) {
        void activateAutoSaveForCurrentChat().then(scheduleConversationSnapshotCapture).catch(handleAsyncFailure);
      } else if (snapshotCaptureTimer) {
        clearTimeout(snapshotCaptureTimer);
        snapshotCaptureTimer = null;
      }
      if (notePageNodeId) renderNotePage();
    }

    const autoBackupChanged = [
      SYNC_KEYS.autoBackupSettings,
      SYNC_KEYS.autoBackupFolderName,
      SYNC_KEYS.autoBackupLastRun,
      SYNC_KEYS.autoBackupError
    ].some((key) => changes.has(key));
    if (autoBackupChanged) {
      applyAutoBackupStatus({
        settings: syncedValue(changes, SYNC_KEYS.autoBackupSettings, autoBackupSettings),
        folderName: syncedValue(changes, SYNC_KEYS.autoBackupFolderName, autoBackupFolderName),
        error: syncedValue(changes, SYNC_KEYS.autoBackupError, autoBackupError)
      });
    }

    const promptChanged = [
      SYNC_KEYS.treePrompt,
      SYNC_KEYS.treePromptPosition,
      SYNC_KEYS.childPromptContext,
      SYNC_KEYS.childPromptTemplate,
      SYNC_KEYS.customTools,
      SYNC_KEYS.promptPresetState
    ].some((key) => changes.has(key));
    if (!promptChanged) return;

    const storedTreePrompt = String(syncedValue(changes, SYNC_KEYS.treePrompt, customTreePrompt) || "").trim().slice(0, 2500);
    customTreePrompt = chatPrompts.isDefaultTreeInstruction(storedTreePrompt) ? "" : storedTreePrompt;
    treePromptPositionValue = syncedValue(changes, SYNC_KEYS.treePromptPosition, treePromptPositionValue) === "prefix" ? "prefix" : "postfix";
    includeParentContext = syncedValue(changes, SYNC_KEYS.childPromptContext, includeParentContext) !== false;
    customChildPromptTemplate = normalizeStoredChildPromptTemplate(
      syncedValue(changes, SYNC_KEYS.childPromptTemplate, customChildPromptTemplate),
      includeParentContext
    );
    customPromptTools = customToolsModel.normalize(syncedValue(changes, SYNC_KEYS.customTools, customPromptTools));
    promptPresetState = normalizePromptPresetState(syncedValue(changes, SYNC_KEYS.promptPresetState, promptPresetState));
    if (editingPromptToolId && !customPromptTools.some((tool) => tool.id === editingPromptToolId)) {
      editingPromptToolId = null;
      deleteCustomPromptButton.classList.add("is-hidden");
    }
    const activePromptStillExists = activePromptToolId === "tree"
      ? !promptPresetState.hidden.includes("tree")
      : customPromptTools.some((tool) => tool.id === activePromptToolId);
    if (activePromptToolId && !activePromptStillExists) {
      activePromptToolId = null;
    }
    treePromptPosition.value = treePromptPositionValue;
    if (!isChildPromptTemplateEditing()) {
      childPromptTemplateInput.value = editableChildPromptTemplate(customChildPromptTemplate);
    }
    if (treePromptEditor.classList.contains("is-hidden")) treePromptInput.value = customTreePrompt || chatPrompts.treeInstruction(locale);
    renderPromptToolButtons();
  }

  async function refreshHydratedWorkspace() {
    try {
      const response = await sendMessage({ type: "TREE_GET" });
      if (!response?.ok || !response.state) return;
      let nextState = core.consolidateConversationDuplicates(core.validateState(response.state));
      // A different ChatGPT tab may save while this tab has an unsaved editor
      // buffer. Apply the remote tree change, but never replace that local
      // buffer; its normal debounced NOTE_COMMIT remains the source of truth.
      if (noteDocumentEditing && notePageNodeId) {
        const currentNode = core.getNode(state, notePageNodeId);
        const incomingNode = core.getNode(nextState, notePageNodeId);
        const localDraft = noteEditor.value;
        if (currentNode && incomingNode && localDraft !== currentNode.noteContent) {
          nextState = core.updateNode(nextState, notePageNodeId, {
            noteContent: localDraft,
            noteEdited: true
          });
        }
      }
      if (JSON.stringify(nextState) === JSON.stringify(state)) return;
      state = nextState;
      selectedIds = new Set([...selectedIds].filter((id) => core.getNode(state, id)));
      if (selectedId && !core.getNode(state, selectedId)) selectedId = null;
      render();
    } catch (_error) {}
  }

  function invalidateExtensionContext() {
    if (!extensionContextActive) return;
    extensionContextActive = false;
    try { observer.disconnect(); } catch (_error) {}
    try { mountGuard.disconnect(); } catch (_error) {}
    try { clearInterval(navigationInterval); } catch (_error) {}
    try { clearTimeout(workspaceSyncTimer); } catch (_error) {}
    try { host.remove(); } catch (_error) {}
  }

  function handleAsyncFailure(error) {
    const contextInvalidated = /extension context invalidated/i.test(error?.message || "");
    if (contextInvalidated || !extensionContextActive) {
      invalidateExtensionContext();
      return;
    }
    try { showToast(error?.message || t("saveFailed"), true); } catch (_toastError) {}
  }

  function selectSingleNode(nodeId) {
    selectedId = nodeId || null;
    selectedIds = nodeId ? new Set([nodeId]) : new Set();
    selectionAnchorId = nodeId || null;
  }

  function visibleTreeNodeIds() {
    return [...tree.querySelectorAll(".tree-row[data-node-id]")]
      .map((row) => row.dataset.nodeId)
      .filter(Boolean);
  }

  function selectNodeFromEvent(nodeId, event) {
    const additive = event.metaKey || event.ctrlKey;
    if (event.shiftKey) {
      const visibleIds = visibleTreeNodeIds();
      const anchorIndex = visibleIds.indexOf(selectionAnchorId);
      const targetIndex = visibleIds.indexOf(nodeId);
      if (anchorIndex >= 0 && targetIndex >= 0) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeIds = visibleIds.slice(start, end + 1);
        selectedIds = additive
          ? new Set([...selectedIds, ...rangeIds])
          : new Set(rangeIds);
        selectedId = nodeId;
        return;
      }
    }
    if (additive) {
      if (selectedIds.has(nodeId)) {
        selectedIds.delete(nodeId);
        if (selectedId === nodeId) selectedId = [...selectedIds].at(-1) || null;
      } else {
        selectedIds.add(nodeId);
        selectedId = nodeId;
      }
      selectionAnchorId = nodeId;
      return;
    }
    selectSingleNode(nodeId);
  }

  function selectedRootNodeIds(fallbackId) {
    const selectedForAction = selectedIds.has(fallbackId) && selectedIds.size > 1
      ? new Set(selectedIds)
      : new Set(fallbackId ? [fallbackId] : []);
    const visibleOrder = visibleTreeNodeIds();
    const stateOrder = state.nodes.map((node) => node.id);
    const orderedIds = [...visibleOrder, ...stateOrder.filter((id) => !visibleOrder.includes(id))]
      .filter((id, index, ids) => selectedForAction.has(id) && ids.indexOf(id) === index);
    return orderedIds.filter((id) => !orderedIds.some(
      (possibleAncestorId) => possibleAncestorId !== id && core.isDescendant(state, id, possibleAncestorId)
    ));
  }

  function restoreBatchSelection(nodeIds, primaryId) {
    selectedIds = new Set(nodeIds.filter((id) => core.getNode(state, id)));
    selectedId = selectedIds.has(primaryId) ? primaryId : [...selectedIds].at(-1) || null;
    selectionAnchorId = selectedId;
  }

  function updateRenderedSelection() {
    for (const row of tree.querySelectorAll(".tree-row[data-node-id]")) {
      const selected = selectedIds.has(row.dataset.nodeId);
      row.classList.toggle("is-selected", selected);
      row.classList.toggle("is-primary-selected", selectedId === row.dataset.nodeId);
      row.setAttribute("aria-selected", String(selected));
    }
  }

  function setPanelOpen(open) {
    if (open === panelVisibilityTarget && (panelVisibilityAnimation || panel.classList.contains("is-hidden") !== open)) return;
    panelVisibilityTarget = open;
    const sequence = ++panelVisibilitySequence;
    panelVisibilityAnimation?.cancel();
    panelVisibilityAnimation = null;
    const alignToLauncher = open && panel.classList.contains("is-hidden");
    const launcherRect = alignToLauncher ? launcher.getBoundingClientRect() : null;
    if (!open && !panel.classList.contains("is-hidden")) syncLauncherToExpandedLogo();
    if (open) panel.classList.remove("is-hidden");
    launcher.classList.add("is-panel-open");
    if (launcherRect) alignExpandedLogoToLauncher(launcherRect);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      panel.classList.toggle("is-hidden", !open);
      launcher.classList.toggle("is-panel-open", open);
      return;
    }

    const panelRect = panelSurface.getBoundingClientRect();
    const logoRect = minimizeButton.getBoundingClientRect();
    const revealX = logoRect.left + logoRect.width / 2 - panelRect.left;
    const revealY = logoRect.top + logoRect.height / 2 - panelRect.top;
    const farthestX = Math.max(Math.abs(revealX), Math.abs(panelRect.width - revealX));
    const farthestY = Math.max(Math.abs(revealY), Math.abs(panelRect.height - revealY));
    // Include the surface shadow in the final reveal so it never pops in after
    // the clip-path animation is removed.
    const fullRadius = Math.hypot(farthestX, farthestY) + 24;
    const collapsedRadius = Math.min(23, fullRadius);
    const circle = (radius) => `circle(${radius.toFixed(2)}px at ${revealX.toFixed(2)}px ${revealY.toFixed(2)}px)`;
    panel.classList.add("is-visibility-animating");
    const duration = 80;
    const keyframes = [
      { clipPath: circle(collapsedRadius), offset: 0 },
      { clipPath: circle(fullRadius), offset: 1 }
    ];
    const animation = panelSurface.animate(keyframes, {
      duration,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "both"
    });
    if (!open) {
      animation.pause();
      animation.currentTime = duration;
      animation.playbackRate = -1;
      animation.play();
    }
    panelVisibilityAnimation = animation;
    animation.finished.then(() => {
      if (sequence !== panelVisibilitySequence) return;
      panelVisibilityAnimation = null;
      panel.classList.remove("is-visibility-animating");
      animation.cancel();
      if (open) return;
      panel.classList.add("is-hidden");
      launcher.classList.remove("is-panel-open");
    }).catch(() => {});
  }

  function alignExpandedLogoToLauncher(launcherRect) {
    const panelRect = panel.getBoundingClientRect();
    const logoRect = minimizeButton.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - panelRect.width - PANEL_RIGHT_INSET,
      Math.max(PANEL_EDGE_INSET, panelRect.left + launcherRect.left - logoRect.left)
    );
    const top = Math.min(
      window.innerHeight - panelRect.height - PANEL_EDGE_INSET,
      Math.max(PANEL_TOP_INSET, panelRect.top + launcherRect.top - logoRect.top)
    );
    setPanelGeometry(left, top, panelRect.width, panelRect.height);
    void persistCurrentPanelBounds();
  }

  function syncLauncherToExpandedLogo() {
    const rect = minimizeButton.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - PANEL_EDGE_INSET, Math.max(PANEL_EDGE_INSET, rect.left));
    const top = Math.min(window.innerHeight - rect.height - PANEL_EDGE_INSET, Math.max(PANEL_EDGE_INSET, rect.top));
    launcher.style.left = `${left}px`;
    launcher.style.top = `${top}px`;
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    updatePanelDock(left, rect.width);
    launcherPosition = {
      x: Math.min(1, Math.max(0, (left - PANEL_EDGE_INSET) / Math.max(1, window.innerWidth - rect.width - PANEL_EDGE_INSET * 2))),
      y: Math.min(1, Math.max(0, (top - PANEL_EDGE_INSET) / Math.max(1, window.innerHeight - rect.height - PANEL_EDGE_INSET * 2)))
    };
    void sendMessage({ type: "LAUNCHER_POSITION_SET", position: launcherPosition }).then((response) => {
      if (response?.ok) launcherPosition = response.position;
    });
  }

  function startLauncherDrag(event) {
    if (event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    launcherDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    launcher.setPointerCapture?.(event.pointerId);
  }

  function startPanelResize(event) {
    if (event.button !== 0) return;
    const rect = panel.getBoundingClientRect();
    panelResize = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      direction: event.currentTarget.dataset.direction,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    panel.classList.add("is-resizing");
    event.preventDefault();
  }

  function startWorkspaceSplitResize(event) {
    if (event.button !== 0 || !notePageNodeId) return;
    const bodyRect = workspaceBody.getBoundingClientRect();
    const sidebarRect = workspaceSidebar.getBoundingClientRect();
    workspaceSplitResize = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: sidebarRect.width,
      bodyWidth: bodyRect.width
    };
    workspaceSplitHandle.setPointerCapture?.(event.pointerId);
    panel.classList.add("is-split-resizing");
    event.preventDefault();
  }

  function moveWorkspaceSplitResize(event) {
    if (!workspaceSplitResize || event.pointerId !== workspaceSplitResize.pointerId) return;
    const minimumSidebar = 220;
    const minimumNote = 320;
    const maximumSidebar = Math.max(minimumSidebar, workspaceSplitResize.bodyWidth - minimumNote);
    const width = Math.min(maximumSidebar, Math.max(minimumSidebar,
      workspaceSplitResize.startWidth + event.clientX - workspaceSplitResize.startX));
    workspaceSidebar.style.flexBasis = `${width}px`;
    workspaceSidebar.style.width = `${width}px`;
    event.preventDefault();
  }

  function finishWorkspaceSplitResize(event) {
    if (!workspaceSplitResize || event.pointerId !== workspaceSplitResize.pointerId) return;
    workspaceSplitHandle.releasePointerCapture?.(event.pointerId);
    workspaceSplitResize = null;
    panel.classList.remove("is-split-resizing");
  }

  function startPanelMove(event, fromLogo = false) {
    if (event.button !== 0 || (!fromLogo && event.target.closest("button, select, input, textarea"))) return;
    const rect = panel.getBoundingClientRect();
    panelMove = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      fromLogo,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function movePanelMove(event) {
    if (!panelMove || event.pointerId !== panelMove.pointerId) return;
    const deltaX = event.clientX - panelMove.startX;
    const deltaY = event.clientY - panelMove.startY;
    if (!panelMove.moved && Math.hypot(deltaX, deltaY) < 4) return;
    panelMove.moved = true;
    event.preventDefault();
    panel.classList.add("is-moving");
    const left = Math.min(window.innerWidth - panelMove.width - PANEL_RIGHT_INSET, Math.max(PANEL_EDGE_INSET, panelMove.left + deltaX));
    const top = Math.min(window.innerHeight - panelMove.height - PANEL_EDGE_INSET, Math.max(PANEL_TOP_INSET, panelMove.top + deltaY));
    setPanelGeometry(left, top, panelMove.width, panelMove.height);
  }

  async function finishPanelMove(event) {
    if (!panelMove || event.pointerId !== panelMove.pointerId) return;
    const moved = panelMove.moved;
    const { handle, fromLogo } = panelMove;
    handle.releasePointerCapture?.(event.pointerId);
    panelMove = null;
    panel.classList.remove("is-moving");
    if (moved && fromLogo) {
      suppressMinimizeClick = true;
      setTimeout(() => { suppressMinimizeClick = false; }, 0);
    }
    if (moved) await persistCurrentPanelBounds();
  }

  function cancelPanelMove(event) {
    if (!panelMove || event.pointerId !== panelMove.pointerId) return;
    panelMove = null;
    panel.classList.remove("is-moving");
    applyPanelBounds(panelBounds);
  }

  function movePanelResize(event) {
    if (!panelResize || event.pointerId !== panelResize.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - panelResize.startX;
    const deltaY = event.clientY - panelResize.startY;
    let { left, top, right, bottom } = panelResize;

    if (panelResize.direction.includes("e")) {
      right = Math.min(window.innerWidth - PANEL_RIGHT_INSET, Math.max(left + 280, right + deltaX));
    } else if (panelResize.direction.includes("w")) {
      left = Math.max(8, Math.min(right - 280, left + deltaX));
    }
    if (panelResize.direction.includes("s")) {
      bottom = Math.min(window.innerHeight - 8, Math.max(top + 280, Math.min(top + 1000, bottom + deltaY)));
    } else if (panelResize.direction.includes("n")) {
      top = Math.max(PANEL_TOP_INSET, Math.min(bottom - 280, Math.max(bottom - 1000, top + deltaY)));
    }
    setPanelGeometry(left, top, right - left, bottom - top);
  }

  async function finishPanelResize(event) {
    if (!panelResize || event.pointerId !== panelResize.pointerId) return;
    panelResize.handle.releasePointerCapture?.(event.pointerId);
    panelResize = null;
    panel.classList.remove("is-resizing");
    await persistCurrentPanelBounds();
  }

  function cancelPanelResize(event) {
    if (!panelResize || event.pointerId !== panelResize.pointerId) return;
    panelResize = null;
    panel.classList.remove("is-resizing");
    applyPanelBounds(panelBounds);
  }

  function applyPanelBounds(bounds) {
    if (!bounds) {
      for (const property of ["left", "top", "right", "bottom", "width", "height"]) {
        panel.style.removeProperty(property);
      }
      return;
    }
    const width = Math.min(bounds.width, window.innerWidth - PANEL_EDGE_INSET - PANEL_RIGHT_INSET);
    const height = Math.min(bounds.height, window.innerHeight - PANEL_TOP_INSET - PANEL_EDGE_INSET);
    const left = PANEL_EDGE_INSET + bounds.x * Math.max(1, window.innerWidth - width - PANEL_EDGE_INSET - PANEL_RIGHT_INSET);
    const top = PANEL_TOP_INSET + bounds.y * Math.max(1, window.innerHeight - height - PANEL_TOP_INSET - PANEL_EDGE_INSET);
    setPanelGeometry(left, top, width, height);
  }

  function setPanelGeometry(left, top, width, height) {
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  }

  async function persistCurrentPanelBounds() {
    const rect = panel.getBoundingClientRect();
    panelBounds = {
      x: Math.min(1, Math.max(0, (rect.left - PANEL_EDGE_INSET) / Math.max(1, window.innerWidth - rect.width - PANEL_EDGE_INSET - PANEL_RIGHT_INSET))),
      y: Math.min(1, Math.max(0, (rect.top - PANEL_TOP_INSET) / Math.max(1, window.innerHeight - rect.height - PANEL_TOP_INSET - PANEL_EDGE_INSET))),
      width: rect.width,
      height: rect.height
    };
    const response = await sendMessage({ type: "PANEL_BOUNDS_SET", bounds: panelBounds });
    if (response?.ok) panelBounds = response.bounds;
  }

  function moveLauncherDrag(event) {
    if (!launcherDrag || event.pointerId !== launcherDrag.pointerId) return;
    const deltaX = event.clientX - launcherDrag.startX;
    const deltaY = event.clientY - launcherDrag.startY;
    if (!launcherDrag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    launcherDrag.moved = true;
    event.preventDefault();
    launcher.classList.add("is-dragging");
    const rect = launcher.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - 8, Math.max(8, launcherDrag.left + deltaX));
    const top = Math.min(window.innerHeight - rect.height - 8, Math.max(8, launcherDrag.top + deltaY));
    launcher.style.left = `${left}px`;
    launcher.style.top = `${top}px`;
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    updatePanelDock(left, rect.width);
  }

  async function finishLauncherDrag(event) {
    if (!launcherDrag || event.pointerId !== launcherDrag.pointerId) return;
    const moved = launcherDrag.moved;
    launcher.releasePointerCapture?.(event.pointerId);
    launcherDrag = null;
    launcher.classList.remove("is-dragging");
    if (!moved) return;
    event.preventDefault();
    suppressLauncherClick = true;
    setTimeout(() => { suppressLauncherClick = false; }, 0);
    const rect = launcher.getBoundingClientRect();
    const availableX = Math.max(1, window.innerWidth - rect.width - 16);
    const availableY = Math.max(1, window.innerHeight - rect.height - 16);
    launcherPosition = {
      x: Math.min(1, Math.max(0, (rect.left - 8) / availableX)),
      y: Math.min(1, Math.max(0, (rect.top - 8) / availableY))
    };
    const response = await sendMessage({ type: "LAUNCHER_POSITION_SET", position: launcherPosition });
    if (response?.ok) launcherPosition = response.position;
  }

  function cancelLauncherDrag(event) {
    if (!launcherDrag || event.pointerId !== launcherDrag.pointerId) return;
    launcherDrag = null;
    launcher.classList.remove("is-dragging");
    applyLauncherPosition(launcherPosition);
  }

  function applyLauncherPosition(position) {
    if (!position) {
      launcher.style.removeProperty("left");
      launcher.style.removeProperty("top");
      launcher.style.removeProperty("right");
      launcher.style.removeProperty("bottom");
      panel.classList.remove("dock-left");
      return;
    }
    const rect = launcher.getBoundingClientRect();
    const width = rect.width || 86;
    const height = rect.height || 36;
    const left = 8 + position.x * Math.max(1, window.innerWidth - width - 16);
    const top = 8 + position.y * Math.max(1, window.innerHeight - height - 16);
    launcher.style.left = `${left}px`;
    launcher.style.top = `${top}px`;
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
    updatePanelDock(left, width);
  }

  function updatePanelDock(left, width) {
    panel.classList.toggle("dock-left", left + width / 2 < window.innerWidth / 2);
  }

  async function persist() {
    state = core.consolidateConversationDuplicates(state);
    const response = await sendMessage({ type: "TREE_SET", state });
    if (response?.contextInvalidated) return false;
    if (!response?.ok) throw new Error(response?.error || t("saveFailed"));
    return true;
  }

  async function commit() {
    state = core.consolidateConversationDuplicates(state);
    const response = await sendMessage({ type: "TREE_COMMIT", state });
    if (response?.contextInvalidated) return false;
    if (!response?.ok) throw new Error(response?.error || t("saveFailed"));
    canUndo = Boolean(response.canUndo);
    canRedo = Boolean(response.canRedo);
    updateHistoryButtons();
    return true;
  }

  async function undoLastAction() {
    if (noteSaveTimer) {
      clearTimeout(noteSaveTimer);
      noteSaveTimer = null;
      await saveOpenNote();
    }
    const composerWithoutPrompt = stripPromptTools(currentComposerText());
    const response = await sendMessage({ type: "TREE_UNDO" });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    canUndo = Boolean(response.canUndo);
    canRedo = Boolean(response.canRedo);
    updateHistoryButtons();
    if (!response.state) {
      showToast(t("nothingToUndo"));
      return;
    }
    try {
      state = core.validateState(response.state);
      applyHistoryWorkspace(response.workspace);
      if (response.promptChanged) {
        activePromptToolId = null;
        rememberAppliedPrompt(null, "", "postfix");
        await prefillComposer(composerWithoutPrompt);
      }
      selectSingleNode(null);
      renderHistoryResult();
      showToast(t("undone"));
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function redoLastAction() {
    if (noteSaveTimer) {
      clearTimeout(noteSaveTimer);
      noteSaveTimer = null;
      await saveOpenNote();
    }
    const composerWithoutPrompt = stripPromptTools(currentComposerText());
    const response = await sendMessage({ type: "TREE_REDO" });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    canUndo = Boolean(response.canUndo);
    canRedo = Boolean(response.canRedo);
    updateHistoryButtons();
    if (!response.state) {
      showToast(t("nothingToRedo"));
      return;
    }
    try {
      state = core.validateState(response.state);
      applyHistoryWorkspace(response.workspace);
      if (response.promptChanged) {
        activePromptToolId = null;
        rememberAppliedPrompt(null, "", "postfix");
        await prefillComposer(composerWithoutPrompt);
      }
      selectSingleNode(null);
      renderHistoryResult();
      showToast(t("redone"));
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function updateHistoryButtons() {
    undoButton.disabled = !canUndo;
    redoButton.disabled = !canRedo;
    const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
    const undoShortcut = isApple ? "⌘Z" : "Ctrl+Z";
    const redoShortcut = isApple ? "⇧⌘Z" : "Ctrl+Shift+Z";
    undoButton.title = `${t("undo")} (${undoShortcut})`;
    redoButton.title = `${t("redo")} (${redoShortcut})`;
    undoButton.setAttribute("aria-label", undoButton.title);
    redoButton.setAttribute("aria-label", redoButton.title);
  }

  function renderHistoryResult() {
    const refocusEditor = shadow.activeElement === noteEditor;
    if (refocusEditor) noteEditor.blur();
    render();
    if (refocusEditor && noteDocumentEditing) {
      requestAnimationFrame(() => noteEditor.focus({ preventScroll: true }));
    }
  }

  function syncHistoryAvailability(response) {
    if (typeof response?.canUndo === "boolean") canUndo = response.canUndo;
    if (typeof response?.canRedo === "boolean") canRedo = response.canRedo;
    updateHistoryButtons();
  }

  function applyHistoryWorkspace(workspace) {
    if (!workspace || typeof workspace !== "object") return;
    customPromptTools = customToolsModel.normalize(workspace.customTools);
    promptPresetState = normalizePromptPresetState(workspace.promptPresetState);
    const storedTreePrompt = String(workspace.treePrompt || "").trim().slice(0, 2500);
    customTreePrompt = chatPrompts.isDefaultTreeInstruction(storedTreePrompt) ? "" : storedTreePrompt;
    treePromptPositionValue = workspace.treePromptPosition === "prefix" ? "prefix" : "postfix";
    includeParentContext = workspace.childPromptContext !== false;
    customChildPromptTemplate = normalizeStoredChildPromptTemplate(workspace.childPromptTemplate, includeParentContext);
    childPromptTemplateDirty = false;
    treePromptPosition.value = treePromptPositionValue;
    childPromptTemplateInput.value = editableChildPromptTemplate(customChildPromptTemplate);
    closeCustomPromptEditor();
    closeTreePromptEditor();
    renderPromptToolButtons();
  }

  function normalizePromptPresetState(input) {
    const raw = input && typeof input === "object" ? input : {};
    const order = [];
    for (const id of Array.isArray(raw.order) ? raw.order : []) {
      if (DEFAULT_PROMPT_PRESET_ORDER.includes(id) && !order.includes(id)) order.push(id);
    }
    for (const id of DEFAULT_PROMPT_PRESET_ORDER) {
      if (!order.includes(id)) order.push(id);
    }
    const hidden = [...new Set(Array.isArray(raw.hidden) ? raw.hidden : [])]
      .filter((id) => DEFAULT_PROMPT_PRESET_ORDER.includes(id) && id !== "tree");
    const overrides = raw.overrides && typeof raw.overrides === "object" ? raw.overrides : {};
    return { order, hidden, overrides };
  }

  function defaultBuiltInPromptTools() {
    return [];
  }

  async function persistChildPromptTemplate(template) {
    const requestedTemplate = String(template || "").trim().slice(0, 1000);
    const response = await sendMessage({ type: "CHILD_PROMPT_TEMPLATE_SET", template: requestedTemplate });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return false;
    }
    const verification = await sendMessage({ type: "CHILD_PROMPT_TEMPLATE_GET" });
    const storedTemplate = String(verification?.template || "").trim().slice(0, 1000);
    if (!verification?.ok || storedTemplate !== requestedTemplate) {
      showToast(verification?.error || t("saveFailed"), true);
      return false;
    }
    customChildPromptTemplate = storedTemplate;
    includeParentContext = storedTemplate ? storedTemplate.includes("{context}") : true;
    childPromptTemplateDirty = false;
    syncHistoryAvailability(response);
    childPromptTemplateInput.value = editableChildPromptTemplate(customChildPromptTemplate);
    return true;
  }

  function childContextPrefix(selectedLocale = locale) {
    return selectedLocale === "zh" ? "上下文：{context}。" : "Context: {context}. ";
  }

  function normalizeStoredChildPromptTemplate(value, legacyContextEnabled = true) {
    const template = String(value || "").trim().slice(0, 1000);
    if (!template || template.includes("{context}") || !legacyContextEnabled) return template;
    return `${childContextPrefix()}${template}`.slice(0, 1000);
  }

  function editableChildPromptTemplate(template) {
    return String(template || "").trim() || chatPrompts.childPromptTemplate(locale);
  }

  function hideSettingsPopover() {
    settingsPopover.classList.add("is-hidden");
    settingsButton.setAttribute("aria-expanded", "false");
  }

  function isChildPromptTemplateEditing() {
    return childPromptTemplateDirty || shadow.activeElement === childPromptTemplateInput;
  }

  async function saveChildPromptTemplate() {
    const template = String(childPromptTemplateInput.value || "").trim();
    if (!template.includes("{topic}")) {
      showToast(t("topicPlaceholderRequired"), true);
      return;
    }
    if (!await persistChildPromptTemplate(template)) return;
    showToast(t("childPromptTemplateSaved"));
    hideSettingsPopover();
  }

  async function restoreChildPromptTemplate() {
    if (!await persistChildPromptTemplate("")) return;
    showToast(t("childPromptTemplateRestored"));
  }

  async function createLocalBackup() {
    createLocalBackupButton.disabled = true;
    if (autoBackupSettings.intervalMinutes > 0 && autoBackupFolderName) {
      const automaticResponse = await sendMessage({ type: "AUTO_BACKUP_RUN_NOW" });
      createLocalBackupButton.disabled = false;
      if (!automaticResponse?.ok || !automaticResponse.written) {
        showToast(automaticResponse?.error || t("saveFailed"), true);
        return;
      }
      showToast(t("backupCreated"));
      return;
    }
    const response = await sendMessage({ type: "LOCAL_BACKUP_EXPORT" });
    createLocalBackupButton.disabled = false;
    if (!response?.ok || !response.backup) {
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    const timestamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
    const blob = new Blob([`${JSON.stringify(response.backup, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url;
    download.download = `ChatNotion-backup-${timestamp}.json`;
    download.style.display = "none";
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t("backupCreated"));
  }

  function normalizeAutoBackupSettings(value) {
    const intervals = [0, 60, 360, 1440, 10080];
    const intervalMinutes = intervals.includes(Number(value?.intervalMinutes)) ? Number(value.intervalMinutes) : 0;
    const retention = Math.min(20, Math.max(1, Math.round(Number(value?.retention) || 10)));
    return { intervalMinutes, retention };
  }

  async function refreshAutoBackupStatus() {
    const response = await sendMessage({ type: "AUTO_BACKUP_STATUS_GET" });
    if (response?.ok) applyAutoBackupStatus(response);
  }

  function applyAutoBackupStatus(status = {}) {
    autoBackupSettings = normalizeAutoBackupSettings(status.settings || autoBackupSettings);
    autoBackupFolderName = typeof status.folderName === "string" ? status.folderName : autoBackupFolderName;
    autoBackupPermission = status.permission || autoBackupPermission;
    autoBackupError = typeof status.error === "string" ? status.error : autoBackupError;
    autoBackupIntervalSelect.value = String(autoBackupSettings.intervalMinutes);
    autoBackupRetentionSelect.value = String(autoBackupSettings.retention);
    const automaticBackupEnabled = autoBackupSettings.intervalMinutes > 0;
    autoBackupRetentionSelect.disabled = !automaticBackupEnabled;
    chooseAutoBackupFolderButton.textContent = t(automaticBackupEnabled && autoBackupFolderName ? "changeFolder" : "chooseFolder");
    autoBackupStatusText.classList.toggle("is-hidden", !automaticBackupEnabled);
    if (!automaticBackupEnabled) {
      autoBackupStatusText.textContent = "";
      autoBackupStatusText.classList.remove("is-error");
      return;
    }
    if (autoBackupPermission === "unavailable") {
      autoBackupStatusText.textContent = t("backupFolderUnavailable");
      autoBackupStatusText.classList.add("is-error");
    } else if (["prompt", "denied"].includes(autoBackupPermission) || autoBackupError.toLowerCase().includes("permission")) {
      autoBackupStatusText.textContent = t("backupNeedsPermission");
      autoBackupStatusText.classList.add("is-error");
    } else {
      autoBackupStatusText.textContent = autoBackupFolderName
        ? t("selectedFolder", { folder: autoBackupFolderName })
        : t("noFolder");
      autoBackupStatusText.classList.remove("is-error");
    }
  }

  async function saveAutoBackupSettings() {
    const settings = {
      intervalMinutes: Number(autoBackupIntervalSelect.value),
      retention: Number(autoBackupRetentionSelect.value)
    };
    const response = await sendMessage({ type: "AUTO_BACKUP_SETTINGS_SET", settings });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    applyAutoBackupStatus(response);
    if (settings.intervalMinutes > 0 && !response.folderName) await chooseAutoBackupFolder();
  }

  async function chooseAutoBackupFolder() {
    const response = await sendMessage({ type: "AUTO_BACKUP_CHOOSE_FOLDER", locale });
    if (!response?.ok) showToast(response?.error || t("saveFailed"), true);
  }

  async function prepareLocalBackupRestore() {
    const file = localBackupFileInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error(t("invalidBackup"));
      const backup = JSON.parse(await file.text());
      if (!backup || backup.format !== "chatnotion-local-backup" || backup.version !== 1 || !backup.data) {
        throw new Error(t("invalidBackup"));
      }
      pendingLocalBackup = { fileName: file.name, backup };
      restoreBackupConfirmText.textContent = t("restoreConfirm", { file: file.name });
      restoreBackupConfirm.classList.remove("is-hidden");
    } catch (error) {
      cancelLocalBackupRestore();
      showToast(error?.message || t("invalidBackup"), true);
    }
  }

  function cancelLocalBackupRestore() {
    pendingLocalBackup = null;
    localBackupFileInput.value = "";
    restoreBackupConfirm.classList.add("is-hidden");
  }

  async function restoreLocalBackup() {
    if (!pendingLocalBackup) return;
    confirmRestoreBackupButton.disabled = true;
    cancelRestoreBackupButton.disabled = true;
    const response = await sendMessage({ type: "LOCAL_BACKUP_IMPORT", backup: pendingLocalBackup.backup });
    confirmRestoreBackupButton.disabled = false;
    cancelRestoreBackupButton.disabled = false;
    if (!response?.ok || !response.state) {
      showToast(response?.error || t("invalidBackup"), true);
      return;
    }
    state = core.validateState(response.state);
    applyHistoryWorkspace(response.workspace);
    maxExtractDepth = normalizeTreeDepth(response.extractDepth);
    launcherPosition = response.launcherPosition || null;
    panelBounds = response.panelBounds || null;
    applyLauncherPosition(launcherPosition);
    applyPanelBounds(panelBounds);
    canUndo = response.canUndo === true;
    canRedo = response.canRedo === true;
    updateHistoryButtons();
    selectSingleNode(null);
    cancelLocalBackupRestore();
    render();
    scheduleDecorateTurns();
    showToast(t("backupRestored"));
  }

  function builtInPromptTools(includeHidden = false) {
    const defaults = new Map(defaultBuiltInPromptTools().map((tool) => [tool.id, tool]));
    return promptPresetState.order.flatMap((id) => {
      const original = defaults.get(id);
      if (!original || (!includeHidden && promptPresetState.hidden.includes(id))) return [];
      const override = promptPresetState.overrides[id] || {};
      return [{
        ...original,
        name: String(override.name || original.name),
        prompt: String(override.prompt || original.prompt),
        position: override.position === "prefix" ? "prefix" : original.position
      }];
    });
  }

  function availablePromptTools() {
    return [...builtInPromptTools(), ...customPromptTools];
  }

  function promptOption(value, label) {
    const option = element("option", "", label);
    option.value = value;
    return option;
  }

  function renderPromptToolButtons() {
    const displayedPromptToolId = !treePromptEditor.classList.contains("is-hidden")
      ? "tree"
      : (editingBuiltInPromptId || editingPromptToolId || activePromptToolId);
    const emptyLabel = activePromptToolId ? t("noPrompt") : t("choosePrompt");
    const emptyOption = promptOption("", emptyLabel);
    const builtInGroup = element("optgroup");
    builtInGroup.label = t("builtInPrompts");
    const builtIns = new Map(builtInPromptTools().map((tool) => [tool.id, tool]));
    for (const id of promptPresetState.order) {
      if (promptPresetState.hidden.includes(id)) continue;
      if (id === "tree") builtInGroup.append(promptOption("tree", promptPresetState.overrides.tree?.name || t("treeMode")));
      else if (builtIns.has(id)) builtInGroup.append(promptOption(id, builtIns.get(id).name));
    }
    promptToolSelect.replaceChildren(emptyOption, builtInGroup);
    if (customPromptTools.length) {
      const customGroup = element("optgroup");
      customGroup.label = t("customPrompts");
      for (const tool of customPromptTools) customGroup.append(promptOption(tool.id, tool.name));
      promptToolSelect.append(customGroup);
    }
    const selectedExists = (displayedPromptToolId === "tree" && !promptPresetState.hidden.includes("tree"))
      || availablePromptTools().some((tool) => tool.id === displayedPromptToolId);
    promptToolSelect.value = selectedExists ? displayedPromptToolId : "";
    const editableBuiltIn = builtInPromptTools().find((tool) => tool.id === activePromptToolId);
    const editableTool = customPromptTools.find((tool) => tool.id === activePromptToolId);
    const treeAvailable = !promptPresetState.hidden.includes("tree");
    const canEdit = treeAvailable || Boolean(editableBuiltIn) || Boolean(editableTool);
    const editsTree = activePromptToolId === "tree" || (!activePromptToolId && treeAvailable);
    promptEditorToolbar.classList.toggle("is-hidden", !isPromptEditorOpen());
    editTreePromptButton.classList.toggle("is-hidden", !canEdit);
    editTreePromptButton.setAttribute("aria-label", editsTree ? t("customizeTree") : t("editTool"));
    editTreePromptButton.title = editsTree ? t("customizeTree") : t("editTool");
  }

  async function applySelectedPromptTool() {
    const selectedToolId = promptToolSelect.value;
    if (isPromptEditorOpen() && selectedToolId) {
      if (selectedToolId === "tree") {
        openTreePromptEditor();
        return;
      }
      const builtIn = builtInPromptTools().find((item) => item.id === selectedToolId);
      if (builtIn) {
        openCustomPromptEditor(builtIn, true);
        return;
      }
      const custom = customPromptTools.find((item) => item.id === selectedToolId);
      if (custom) openCustomPromptEditor(custom, false);
      return;
    }
    editingPromptToolId = null;
    editingBuiltInPromptId = null;
    customPromptEditor.classList.add("is-hidden");
    treePromptEditor.classList.add("is-hidden");
    if (!selectedToolId) {
      const base = stripPromptTools(currentComposerText());
      const filled = await prefillComposer(base);
      if (filled) {
        activePromptToolId = null;
        rememberAppliedPrompt(null, "", "postfix");
        showToast(t("promptRemoved"));
      } else {
        showToast(t("composerUnavailable"), true);
      }
      renderPromptToolButtons();
      return;
    }
    if (selectedToolId === "tree") {
      const applied = await addTreeModeToComposer(true);
      renderPromptToolButtons();
      if (applied) setPanelOpen(false);
      return;
    }
    const tool = availablePromptTools().find((item) => item.id === selectedToolId);
    const applied = tool ? await applyCustomPromptTool(tool, true) : false;
    renderPromptToolButtons();
    if (applied) setPanelOpen(false);
  }

  function editSelectedPromptTool() {
    if (activePromptToolId === "tree" || (!activePromptToolId && !promptPresetState.hidden.includes("tree"))) {
      openTreePromptEditor();
      return;
    }
    const builtIn = builtInPromptTools().find((item) => item.id === activePromptToolId);
    if (builtIn) {
      openCustomPromptEditor(builtIn, true);
      return;
    }
    const tool = customPromptTools.find((item) => item.id === activePromptToolId);
    if (tool) openCustomPromptEditor(tool, false);
  }

  function isPromptEditorOpen() {
    return !customPromptEditor.classList.contains("is-hidden") || !treePromptEditor.classList.contains("is-hidden");
  }

  function stripPromptTools(value) {
    let next = removeAppliedPromptSnapshot(value);
    if (customTreePrompt) {
      for (const position of ["prefix", "postfix"]) {
        next = chatPrompts.removeCustomPrompt(next, resolvedCustomTreePrompt(), position);
      }
    }
    next = chatPrompts.removeTreeInstruction(next);
    const removableTools = [...builtInPromptTools(true), ...customPromptTools];
    for (let pass = 0; pass <= removableTools.length; pass += 1) {
      const before = next;
      for (const tool of removableTools) {
        next = chatPrompts.removeCustomPrompt(next, tool.prompt, "prefix");
        next = chatPrompts.removeCustomPrompt(next, tool.prompt, "postfix");
      }
      if (next === before) break;
    }
    return next;
  }

  function removeAppliedPromptSnapshot(value) {
    let next = String(value || "").trim();
    if (!appliedPromptSnapshot?.text) return next;
    next = chatPrompts.removeCustomPrompt(next, appliedPromptSnapshot.text, appliedPromptSnapshot.position);
    const opposite = appliedPromptSnapshot.position === "prefix" ? "postfix" : "prefix";
    return chatPrompts.removeCustomPrompt(next, appliedPromptSnapshot.text, opposite);
  }

  function rememberAppliedPrompt(id, text, position) {
    appliedPromptSnapshot = text
      ? { id, text: String(text).trim(), position: position === "prefix" ? "prefix" : "postfix" }
      : null;
  }

  function resolvedCustomTreePrompt() {
    return chatPrompts.customTreeInstruction(customTreePrompt);
  }

  function isTreePromptApplied(value) {
    const text = String(value || "").trim();
    if (chatPrompts.hasTreeInstruction(text)) return true;
    const instruction = resolvedCustomTreePrompt();
    return Boolean(instruction) && chatPrompts.removeCustomPrompt(text, instruction, treePromptPositionValue) !== text;
  }

  function applyTreePrompt(value) {
    const instruction = customTreePrompt
      ? resolvedCustomTreePrompt()
      : chatPrompts.treeInstruction(locale);
    return chatPrompts.appendCustomPrompt(value, instruction, treePromptPositionValue);
  }

  function openCustomPromptEditor(tool = null, builtIn = false) {
    closeTreePromptEditor();
    editingBuiltInPromptId = builtIn ? tool?.id || null : null;
    editingPromptToolId = builtIn ? null : tool?.id || null;
    customPromptNameInput.value = tool?.name || "";
    customPromptInput.value = tool?.prompt || "";
    customPromptPosition.value = tool?.position === "prefix" ? "prefix" : "postfix";
    deleteCustomPromptButton.classList.toggle("is-hidden", !tool);
    restoreBuiltInPromptButton.classList.toggle("is-hidden", !builtIn);
    movePromptUpButton.classList.toggle("is-hidden", !tool);
    movePromptDownButton.classList.toggle("is-hidden", !tool);
    customPromptEditor.classList.remove("is-hidden");
    renderPromptToolButtons();
    requestAnimationFrame(() => customPromptNameInput.focus());
  }

  function closeCustomPromptEditor() {
    editingPromptToolId = null;
    editingBuiltInPromptId = null;
    customPromptNameInput.value = "";
    customPromptInput.value = "";
    customPromptPosition.value = "postfix";
    customPromptEditor.classList.add("is-hidden");
    renderPromptToolButtons();
  }

  function openTreePromptEditor() {
    closeCustomPromptEditor();
    treePromptInput.value = customTreePrompt || chatPrompts.treeInstruction(locale);
    treePromptPosition.value = treePromptPositionValue;
    treePromptEditor.classList.remove("is-hidden");
    renderPromptToolButtons();
    requestAnimationFrame(() => treePromptInput.focus());
  }

  function closeTreePromptEditor() {
    treePromptEditor.classList.add("is-hidden");
    renderPromptToolButtons();
  }

  async function persistTreePrompt(prompt) {
    const response = await sendMessage({ type: "TREE_PROMPT_SET", prompt, position: treePromptPosition.value });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return false;
    }
    customTreePrompt = String(response.prompt || "").trim().slice(0, 2500);
    treePromptPositionValue = response.position === "prefix" ? "prefix" : "postfix";
    syncHistoryAvailability(response);
    return true;
  }

  async function saveTreePrompt() {
    const promptText = treePromptInput.value.trim();
    if (!promptText) {
      showToast(t("toolPromptRequired"), true);
      return;
    }
    const wasActive = activePromptToolId === "tree" || isTreePromptApplied(currentComposerText());
    const base = wasActive ? stripPromptTools(currentComposerText()) : "";
    const customPrompt = chatPrompts.isDefaultTreeInstruction(promptText) ? "" : promptText;
    if (!await persistTreePrompt(customPrompt)) return;
    if (wasActive) {
      const instruction = customTreePrompt ? resolvedCustomTreePrompt() : chatPrompts.treeInstruction(locale);
      if (await prefillComposer(applyTreePrompt(base))) rememberAppliedPrompt("tree", instruction, treePromptPositionValue);
    }
    activePromptToolId = wasActive ? "tree" : activePromptToolId;
    closeTreePromptEditor();
    renderPromptToolButtons();
    showToast(t("treePromptSaved"));
  }

  async function restoreTreePrompt() {
    const wasActive = activePromptToolId === "tree" || isTreePromptApplied(currentComposerText());
    const base = wasActive ? stripPromptTools(currentComposerText()) : "";
    treePromptPosition.value = "postfix";
    if (!await persistTreePrompt("")) return;
    if (wasActive) {
      const instruction = chatPrompts.treeInstruction(locale);
      if (await prefillComposer(applyTreePrompt(base))) rememberAppliedPrompt("tree", instruction, treePromptPositionValue);
    }
    activePromptToolId = wasActive ? "tree" : activePromptToolId;
    closeTreePromptEditor();
    renderPromptToolButtons();
    showToast(t("promptRestored"));
  }

  async function persistCustomPromptTools(nextTools) {
    const response = await sendMessage({ type: "CUSTOM_TOOLS_SET", tools: nextTools });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return false;
    }
    customPromptTools = customToolsModel.normalize(response.tools);
    syncHistoryAvailability(response);
    renderPromptToolButtons();
    return true;
  }

  async function persistPromptPresetState(nextState) {
    const response = await sendMessage({ type: "PROMPT_PRESET_STATE_SET", state: nextState });
    if (!response?.ok) {
      showToast(response?.error || t("saveFailed"), true);
      return false;
    }
    promptPresetState = normalizePromptPresetState(response.state);
    syncHistoryAvailability(response);
    renderPromptToolButtons();
    return true;
  }

  async function saveCustomPrompt() {
    const name = customPromptNameInput.value.replace(/\s+/g, " ").trim();
    const promptText = customPromptInput.value.trim();
    if (!name) {
      showToast(t("toolNameRequired"), true);
      return;
    }
    if (!promptText) {
      showToast(t("toolPromptRequired"), true);
      return;
    }
    if (!editingPromptToolId && !editingBuiltInPromptId && customPromptTools.length >= 20) {
      showToast(t("maxPromptTools"), true);
      return;
    }
    if (editingBuiltInPromptId) {
      const id = editingBuiltInPromptId;
      const wasActive = activePromptToolId === id;
      const baseComposerText = wasActive ? stripPromptTools(currentComposerText()) : "";
      const nextState = {
        ...promptPresetState,
        overrides: {
          ...promptPresetState.overrides,
          [id]: { name, prompt: promptText, position: customPromptPosition.value }
        }
      };
      if (!await persistPromptPresetState(nextState)) return;
      const updated = builtInPromptTools(true).find((tool) => tool.id === id);
      closeCustomPromptEditor();
      if (wasActive && updated) {
        activePromptToolId = id;
        if (await prefillComposer(chatPrompts.appendCustomPrompt(baseComposerText, updated.prompt, updated.position))) {
          rememberAppliedPrompt(id, updated.prompt, updated.position);
        }
      }
      renderPromptToolButtons();
      showToast(t("toolSaved"));
      return;
    }
    const id = editingPromptToolId || `prompt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const tool = { id, name, prompt: promptText, position: customPromptPosition.value };
    const wasActive = activePromptToolId === id;
    const baseComposerText = wasActive ? stripPromptTools(currentComposerText()) : "";
    const next = editingPromptToolId
      ? customPromptTools.map((item) => item.id === editingPromptToolId ? tool : item)
      : [...customPromptTools, tool];
    if (!await persistCustomPromptTools(next)) return;
    closeCustomPromptEditor();
    if (wasActive) {
      activePromptToolId = id;
      if (await prefillComposer(chatPrompts.appendCustomPrompt(baseComposerText, tool.prompt, tool.position))) {
        rememberAppliedPrompt(id, tool.prompt, tool.position);
      }
      renderPromptToolButtons();
    }
    showToast(t("toolSaved"));
  }

  async function deleteCustomPrompt() {
    if (editingBuiltInPromptId) {
      await deleteBuiltInPrompt(editingBuiltInPromptId);
      return;
    }
    if (!editingPromptToolId) return;
    const wasActive = activePromptToolId === editingPromptToolId;
    const baseComposerText = wasActive ? stripPromptTools(currentComposerText()) : "";
    const next = customPromptTools.filter((tool) => tool.id !== editingPromptToolId);
    if (!await persistCustomPromptTools(next)) return;
    if (wasActive) {
      activePromptToolId = null;
      await prefillComposer(baseComposerText);
      rememberAppliedPrompt(null, "", "postfix");
      renderPromptToolButtons();
    }
    closeCustomPromptEditor();
    showToast(t("toolDeleted"));
  }

  async function deleteBuiltInPrompt(id) {
    if (id === "tree") return;
    if (!DEFAULT_PROMPT_PRESET_ORDER.includes(id)) return;
    const wasActive = activePromptToolId === id;
    const baseComposerText = wasActive ? stripPromptTools(currentComposerText()) : "";
    const nextState = {
      ...promptPresetState,
      hidden: [...new Set([...promptPresetState.hidden, id])]
    };
    if (!await persistPromptPresetState(nextState)) return;
    if (wasActive) {
      activePromptToolId = null;
      await prefillComposer(baseComposerText);
      rememberAppliedPrompt(null, "", "postfix");
    }
    closeCustomPromptEditor();
    closeTreePromptEditor();
    renderPromptToolButtons();
    showToast(t("toolDeleted"));
  }

  async function restoreSelectedBuiltInPrompt() {
    if (!editingBuiltInPromptId) return;
    const id = editingBuiltInPromptId;
    const wasActive = activePromptToolId === id;
    const baseComposerText = wasActive ? stripPromptTools(currentComposerText()) : "";
    const overrides = { ...promptPresetState.overrides };
    delete overrides[id];
    if (!await persistPromptPresetState({ ...promptPresetState, overrides })) return;
    const restored = builtInPromptTools(true).find((tool) => tool.id === id);
    closeCustomPromptEditor();
    if (wasActive && restored) {
      activePromptToolId = id;
      if (await prefillComposer(chatPrompts.appendCustomPrompt(baseComposerText, restored.prompt, restored.position))) {
        rememberAppliedPrompt(id, restored.prompt, restored.position);
      }
    }
    renderPromptToolButtons();
    showToast(t("promptRestored"));
  }

  async function moveEditedPrompt(direction) {
    if (editingBuiltInPromptId) {
      await moveBuiltInPrompt(editingBuiltInPromptId, direction);
      return;
    }
    if (!editingPromptToolId) return;
    const index = customPromptTools.findIndex((tool) => tool.id === editingPromptToolId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= customPromptTools.length) return;
    const next = [...customPromptTools];
    [next[index], next[target]] = [next[target], next[index]];
    await persistCustomPromptTools(next);
  }

  async function moveBuiltInPrompt(id, direction) {
    const index = promptPresetState.order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= promptPresetState.order.length) return;
    const order = [...promptPresetState.order];
    [order[index], order[target]] = [order[target], order[index]];
    await persistPromptPresetState({ ...promptPresetState, order });
  }

  async function applyCustomPromptTool(tool, forceOn = false) {
    const current = currentComposerText();
    const selectedApplied = appliedPromptSnapshot?.id === tool.id
      || chatPrompts.removeCustomPrompt(current, tool.prompt, tool.position) !== current.trim();
    const base = stripPromptTools(current);
    const shouldApply = forceOn || !selectedApplied;
    if (!canApplyPromptToComposer(base, shouldApply)) return false;
    const next = shouldApply ? chatPrompts.appendCustomPrompt(base, tool.prompt, tool.position) : base;
    const filled = await prefillComposer(next);
    if (filled) {
      activePromptToolId = shouldApply ? tool.id : null;
      rememberAppliedPrompt(shouldApply ? tool.id : null, shouldApply ? tool.prompt : "", tool.position);
      renderPromptToolButtons();
    }
    showToast(filled ? t(shouldApply ? "promptApplied" : "promptRemoved") : t("composerUnavailable"), !filled);
    return filled && shouldApply;
  }

  async function setLocale(nextLocale) {
    const next = nextLocale === "zh" ? "zh" : "en";
    if (next === locale) return;
    const current = currentComposerText();
    const usesDefaultTreePrompt = !customTreePrompt
      && (activePromptToolId === "tree" || chatPrompts.hasTreeInstruction(current));
    const base = usesDefaultTreePrompt ? stripPromptTools(current) : current;
    locale = next;
    if (usesDefaultTreePrompt) {
      const instruction = chatPrompts.treeInstruction(locale);
      if (await prefillComposer(chatPrompts.appendCustomPrompt(base, instruction, treePromptPositionValue))) {
        activePromptToolId = "tree";
        rememberAppliedPrompt("tree", instruction, treePromptPositionValue);
      }
    }
    if (!customTreePrompt && !treePromptEditor.classList.contains("is-hidden")) {
      treePromptInput.value = chatPrompts.treeInstruction(locale);
    }
    if (!isChildPromptTemplateEditing()) {
      childPromptTemplateInput.value = editableChildPromptTemplate(customChildPromptTemplate);
    }
    applyLocale();
    render();
    await sendMessage({ type: "LOCALE_SET", locale });
  }

  function applyLocale() {
    launcher.setAttribute("aria-label", t("openTree"));
    launcher.title = t("openTree");
    panel.setAttribute("aria-label", t("panelLabel"));
    brandName.textContent = t("brand");
    minimizeButton.setAttribute("aria-label", t("minimize"));
    minimizeButton.title = t("minimize");
    for (const handle of panelResizeHandles) handle.setAttribute("aria-label", t("resizePanel"));
    zhLanguageButton.classList.toggle("is-active", locale === "zh");
    enLanguageButton.classList.toggle("is-active", locale === "en");
    languageSwitch.classList.toggle("is-zh", locale === "zh");
    languageSwitch.classList.toggle("is-en", locale === "en");
    zhLanguageButton.setAttribute("aria-pressed", String(locale === "zh"));
    enLanguageButton.setAttribute("aria-pressed", String(locale === "en"));
    folderButtonLabel.textContent = t("addFolder");
    folderButton.setAttribute("aria-label", t("addFolder"));
    folderButton.title = t("addFolder");
    updateSaveChatButton();
    contextNewFolderButton.querySelector(".tree-context-label").textContent = t("newFolder");
    contextEnterChatButton.querySelector(".tree-context-label").textContent = t("enterChat");
    contextNewChildButton.querySelector(".tree-context-label").textContent = t("newChildPage");
    contextRenameButton.querySelector(".tree-context-label").textContent = t("contextRename");
    contextDeleteButton.querySelector(".tree-context-label").textContent = t("contextDelete");
    promptToolSelect.setAttribute("aria-label", t("promptTool"));
    addPromptToolButton.setAttribute("aria-label", t("addPromptTool"));
    addPromptToolButton.title = t("addPromptTool");
    addPromptToolButton.textContent = t("addPromptTool");
    editTreePromptButton.setAttribute("aria-label", t("customizeTree"));
    editTreePromptButton.title = t("customizeTree");
    treePromptInput.placeholder = t("treePromptPlaceholder");
    settingsButton.setAttribute("aria-label", t("settings"));
    settingsButton.title = t("settings");
    settingsTitle.textContent = t("settings");
    childPromptContextHeading.textContent = t("childChatPrompt");
    conversationSavingTitle.textContent = t("conversationSaving");
    autoSaveToggleText.textContent = t("autoSaveConversations");
    restoreChildPromptTemplateButton.textContent = t("restoreDefault");
    saveChildPromptTemplateButton.textContent = t("saveCustom");
    localDataTitle.textContent = t("localData");
    localDataDescription.textContent = t("backupPrivacy");
    createLocalBackupButton.textContent = t("localBackup");
    chooseLocalBackupButton.textContent = t("restoreBackup");
    autoBackupTitle.textContent = t("autoBackup");
    for (const option of autoBackupIntervalSelect.options) option.textContent = t(option.dataset.i18n);
    autoBackupKeepLabel.textContent = t("keep");
    autoBackupBackupsLabel.textContent = t("backups");
    applyAutoBackupStatus();
    restoreBackupWarning.textContent = t("restoreWarning");
    cancelRestoreBackupButton.textContent = t("cancel");
    confirmRestoreBackupButton.textContent = t("confirmRestore");
    if (pendingLocalBackup) {
      restoreBackupConfirmText.textContent = t("restoreConfirm", { file: pendingLocalBackup.fileName });
    }
    restoreTreePromptButton.textContent = t("restoreDefault");
    restoreBuiltInPromptButton.textContent = t("restoreDefault");
    movePromptUpButton.setAttribute("aria-label", t("moveUp"));
    movePromptUpButton.title = t("moveUp");
    movePromptUpButton.textContent = t("moveUp");
    movePromptDownButton.setAttribute("aria-label", t("moveDown"));
    movePromptDownButton.title = t("moveDown");
    movePromptDownButton.textContent = t("moveDown");
    cancelTreePromptButton.textContent = t("cancel");
    saveTreePromptButton.textContent = t("saveCustom");
    customPromptNameInput.placeholder = t("toolName");
    customPromptInput.placeholder = t("customPromptPlaceholder");
    customPromptInput.setAttribute("aria-label", t("customPromptPlaceholder"));
    saveCustomPromptButton.textContent = t("saveCustom");
    deleteCustomPromptButton.textContent = t("deleteTool");
    cancelCustomPromptButton.textContent = t("cancel");
    for (const select of [customPromptPosition, treePromptPosition]) {
      for (const option of select.options) option.textContent = t(option.value);
    }
    renderPromptToolButtons();
    undoButton.textContent = t("undo");
    redoButton.textContent = t("redo");
    if (noteSaveStatus.classList.contains("is-error")) noteSaveStatus.textContent = t("noteSaveFailed");
    else noteSaveStatus.textContent = noteSaveTimer ? t("noteSaving") : t("noteSaved");
    highlightColorSelect.setAttribute("aria-label", t("highlightColor"));
    noteColorSelect.setAttribute("aria-label", t("noteColor"));
    searchInput.placeholder = t("search");
    searchInput.setAttribute("aria-label", t("searchLabel"));
    tree.setAttribute("aria-label", t("treeLabel"));
    updateHistoryButtons();

    for (const action of document.querySelectorAll("[data-chat-notion-action]")) {
      if (action.dataset.chatNotionAction === "generate") {
        action.textContent = t("generate");
        action.setAttribute("aria-label", t("generateAria"));
      }
    }
    refreshExtractionDepthControls();
  }

  async function saveAutoSavePreference() {
    const requested = autoSaveToggle.checked;
    const previous = autoSaveEnabled;
    autoSaveEnabled = requested;
    autoSavePhase = "idle";
    updateSaveChatButton();
    const response = await sendMessage({ type: "AUTO_SAVE_SET", enabled: requested });
    if (!response?.ok) {
      autoSaveEnabled = previous;
      autoSaveToggle.checked = previous;
      updateSaveChatButton();
      showToast(response?.error || t("saveFailed"), true);
      return;
    }
    autoSaveEnabled = response.enabled !== false;
    autoSaveToggle.checked = autoSaveEnabled;
    autoSavePhase = "idle";
    updateSaveChatButton();
    if (autoSaveEnabled) {
      await activateAutoSaveForCurrentChat();
      scheduleConversationSnapshotCapture();
    } else if (snapshotCaptureTimer) {
      clearTimeout(snapshotCaptureTimer);
      snapshotCaptureTimer = null;
    }
    if (notePageNodeId) renderNotePage();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, className) {
    const node = element("button", className, text);
    node.type = "button";
    return node;
  }

  // Logged-out / anonymous ChatGPT keeps the whole conversation on the root URL and never mints a
  // /c/<id>, so parseChatGptLocation reports "unsupported" and every URL-keyed feature (Save current
  // chat, Generate tree) stays hidden. We give such a conversation a synthetic, stable-per-session
  // identity so those features work, and drop it again whenever the page returns to a real URL or an
  // empty chat — so a fresh anonymous chat gets a fresh identity. (temporaryChatToken is declared with
  // the other module state near the top, since canonicalChatUrl() runs during init before this point.)
  function temporaryChatContext() {
    if (!temporaryChatToken) {
      temporaryChatToken = `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    const base = String(location.origin).replace(/\/$/, "");
    return { kind: "chat", chatUrl: `${base}/c/${temporaryChatToken}`, projectUrl: "", projectSlug: "" };
  }

  function currentLocation() {
    const parsed = core.parseChatGptLocation(location.pathname, location.origin);
    // A real conversation URL always wins; forget any temporary identity we may have minted.
    if (parsed.chatUrl || parsed.projectUrl) {
      temporaryChatToken = "";
      return parsed;
    }
    // Only synthesize once an answer actually exists on the page. This keeps the plain
    // landing/login screen untouched, and — because a signed-in new chat flips to /c/<id> the moment
    // it streams — avoids attaching a temporary identity to conversations that are about to get a real
    // one. getTurns()/isAssistantTurn() read the DOM only, so there is no recursion back into here.
    if (!getTurns().some(isAssistantTurn)) {
      temporaryChatToken = "";
      return parsed;
    }
    return temporaryChatContext();
  }

  function canonicalChatUrl() {
    return currentLocation().chatUrl;
  }

  function isNativeBranchControl(control) {
    return [control?.innerText, control?.textContent, control?.getAttribute?.("aria-label")]
      .map((label) => String(label || "").replace(/\s+/g, " ").trim())
      .some((label) => NATIVE_BRANCH_WORDS.test(label));
  }

  function handleNativeBranchClick(event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const control = target?.closest?.('button,[role="menuitem"]');
    if (!control || control === host || host.contains(control) || !isNativeBranchControl(control)) return;
    void rememberNativeBranch().catch(handleAsyncFailure);
  }

  function handleChatGptConversationNavigation(event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = target?.closest?.("a[href]");
    if (!link || host.contains(link)) return;
    try {
      const url = new URL(link.href, location.origin);
      const destination = core.parseChatGptLocation(url.pathname, url.origin).chatUrl;
      if (destination && destination !== canonicalChatUrl()) {
        void cancelNativeBranchSession().catch(handleAsyncFailure);
      }
    } catch (_error) {}
  }

  async function rememberNativeBranch() {
    const parentUrl = canonicalChatUrl();
    if (!parentUrl || !hasStartedConversation()) return;
    const existingParent = core.findConversationByUrl(state, parentUrl);
    const parent = existingParent || ensureCurrentConversation();
    const localPending = {
      parentId: parent.id,
      parentUrl,
      baselineUserTurns: lastNativeBranchBaselineUserTurns ?? userTurnCount(),
      branchUrl: "",
      createdAt: Date.now()
    };

    // ChatGPT may navigate before the background round trip finishes. Keep the
    // parent locally first so a branch-of-branch never falls back to the root.
    pendingNativeBranch = localPending;
    if (!existingParent) await persist();
    const response = await sendMessage({
      type: "NATIVE_BRANCH_PENDING_SET",
      pending: localPending
    });
    if (response?.ok) pendingNativeBranch = response.pending;

    // If the route changed during the storage write, claim the new URL now;
    // the regular navigation observer may already have run too early.
    const currentUrl = canonicalChatUrl();
    if (currentUrl && currentUrl !== parentUrl) await refreshPendingNativeBranch(localPending);
  }

  async function refreshPendingNativeBranch(fallbackPending = pendingNativeBranch) {
    const currentUrl = canonicalChatUrl();
    let response = await sendMessage({ type: "NATIVE_BRANCH_PENDING_CLAIM", url: currentUrl });

    // Repair the click/navigation race: the claim can arrive before SET when
    // ChatGPT opens the new branch immediately.
    if (!response?.pending
      && fallbackPending?.parentId
      && fallbackPending.parentUrl
      && currentUrl
      && currentUrl !== fallbackPending.parentUrl
      && !fallbackPending.branchUrl) {
      const restored = await sendMessage({ type: "NATIVE_BRANCH_PENDING_SET", pending: fallbackPending });
      if (restored?.ok) {
        response = await sendMessage({ type: "NATIVE_BRANCH_PENDING_CLAIM", url: currentUrl });
      }
    }

    pendingNativeBranch = response?.ok ? response.pending : null;
    return pendingNativeBranch;
  }

  async function completePendingNativeBranch() {
    const currentUrl = canonicalChatUrl();
    pendingNativeBranch = null;
    await sendMessage({ type: "NATIVE_BRANCH_PENDING_COMPLETE", url: currentUrl });
  }

  async function cancelNativeBranchSession() {
    pendingNativeBranch = null;
    branchDiscoveryUrl = "";
    branchDiscoveryStartedAt = 0;
    await sendMessage({ type: "NATIVE_BRANCH_PENDING_CLEAR" });
  }

  function conversationUrlNear(element) {
    let current = element;
    for (let depth = 0; current instanceof Element && depth < 6; depth += 1) {
      const links = current.matches("a[href]")
        ? [current]
        : [...current.querySelectorAll("a[href]")];
      const chatUrls = [...new Set(links.map((link) => {
        try {
          const url = new URL(link.href, location.origin);
          return core.parseChatGptLocation(url.pathname, url.origin).chatUrl;
        } catch (_error) {
          return "";
        }
      }).filter(Boolean))];
      if (chatUrls.length === 1) return chatUrls[0];
      if (chatUrls.length > 1) return "";
      current = current.parentElement;
    }
    return "";
  }

  function isChatDeleteControl(control) {
    const deletePattern = /^(?:delete(?: chat| conversation)?(?: permanently)?|删除(?:对话|聊天)?|确认删除)\s*\??$/i;
    return [control.innerText, control.textContent, control.getAttribute("aria-label")]
      .map((label) => String(label || "").replace(/\s+/g, " ").trim())
      .some((label) => deletePattern.test(label));
  }

  function isChatDeleteCancelControl(control) {
    const cancelPattern = /^(?:cancel|取消)$/i;
    return [control.innerText, control.textContent, control.getAttribute("aria-label")]
      .map((label) => String(label || "").replace(/\s+/g, " ").trim())
      .some((label) => cancelPattern.test(label));
  }

  function handleChatGptDeleteClick(event) {
    if (!extensionContextActive) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const control = target?.closest?.('button,[role="menuitem"]');
    if (!control || control === host || host.contains(control)) return;
    if (isChatDeleteCancelControl(control)) {
      pendingChatDeletion = null;
      return;
    }
    const nearbyUrl = conversationUrlNear(control);
    const controlLabel = `${control.getAttribute("aria-label") || ""} ${control.title || ""} ${control.textContent || ""}`;
    if (nearbyUrl) lastConversationActionUrl = nearbyUrl;
    else if (/(?:more|options?|actions?|更多|选项|操作)/i.test(controlLabel)) {
      lastConversationActionUrl = canonicalChatUrl();
      const sourceTurn = control.closest('[data-testid^="conversation-turn-"],article,[role="article"]');
      const turns = getTurns();
      const sourceIndex = turns.indexOf(sourceTurn);
      lastNativeBranchBaselineUserTurns = sourceIndex >= 0
        ? turns.slice(0, sourceIndex + 1).filter(isUserTurn).length
        : userTurnCount();
    }
    if (!isChatDeleteControl(control)) return;

    const pending = pendingChatDeletion;
    const pendingIsFresh = pending && Date.now() - pending.createdAt <= 30_000;
    const inDialog = Boolean(control.closest('[role="dialog"], [role="alertdialog"], dialog, [data-testid*="modal" i]'));
    if (pendingIsFresh && (inDialog || control !== pending.triggerControl)) {
      pendingChatDeletion = null;
      void markConversationDeleted(pending.sourceUrl);
      return;
    }

    const sourceUrl = nearbyUrl || lastConversationActionUrl || canonicalChatUrl();
    pendingChatDeletion = sourceUrl ? { sourceUrl, createdAt: Date.now(), triggerControl: control } : null;
  }

  async function markConversationDeleted(sourceUrl) {
    if (!core.hasConversationReference(state, sourceUrl)) return;
    try {
      state = core.unlinkConversation(state, sourceUrl);
      await persist();
      render();
      showToast(t("deletedChatUnlinked"));
    } catch (error) {
      showToast(error.message || t("saveFailed"), true);
    }
  }

  function firstUserQuestion() {
    const turn = getTurns().find((candidate) => isUserTurn(candidate) && turnText(candidate));
    if (!turn) return "";
    // Read the user message node directly so we skip ChatGPT's sibling "You said:" screen-reader
    // label; strip a leading label anyway in case a layout keeps it inside the message.
    const text = snapshotTurnContent(turn, "user") || turnText(turn);
    return text.replace(/^\s*(you said|chatgpt said|你说|您说|你說)\s*[:：]?\s*/i, "").trim();
  }

  function stripTitleInstruction(value) {
    const text = String(value || "");
    // stripPromptTools removes a full, intact tree-mode / prompt-tool instruction. But ChatGPT also
    // seeds the tab title from the raw first message (question + instruction) and clips it, so the
    // marker phrase can be incomplete — also cut from the instruction's opening words to the end.
    const cleaned = stripPromptTools(text).replace(
      /\s*(?:Format the answer as a|请?将回答组织成).*$/is,
      ""
    ).trim();
    return cleaned || text.trim();
  }

  function currentChatTitle() {
    const stripped = document.title.replace(/\s*[|–-]\s*ChatGPT\s*$/i, "").trim();
    // Logged-out ChatGPT never names anonymous sessions, so document.title is just "ChatGPT". Fall
    // back to the first user question so the saved node gets a meaningful heading instead of "ChatGPT".
    // Either source can carry the injected tree-mode instruction, so strip it from whichever we use.
    const title = /^chatgpt$/i.test(stripped) ? "" : stripped;
    return core.normalizeTitle(stripTitleInstruction(title || firstUserQuestion()), t("currentChat"));
  }

  function currentProjectTitle(context) {
    const projectPath = context.projectUrl ? new URL(context.projectUrl).pathname : "";
    for (const link of document.querySelectorAll("a[href]")) {
      try {
        if (projectPath && new URL(link.href, location.origin).pathname === projectPath) {
          const title = link.innerText.replace(/\s+/g, " ").trim();
          if (title) return core.normalizeTitle(title, t("project"));
        }
      } catch (_error) {
        // Ignore host-page links with non-standard URLs.
      }
    }
    return t("project");
  }

  function getTurns() {
    const preferred = [...document.querySelectorAll('[data-testid^="conversation-turn-"]')];
    if (preferred.length) return preferred;
    const seen = new Set();
    return [...document.querySelectorAll("[data-message-author-role]")].map((message) => {
      const turn = message.closest('[data-testid^="conversation-turn-"]')
        || message.closest("article,[role='article']")
        || message;
      if (seen.has(turn)) return null;
      seen.add(turn);
      return turn;
    }).filter(Boolean);
  }

  function turnText(turn) {
    const copy = turn.cloneNode(true);
    copy.querySelectorAll("[data-chat-notion-actions],[data-chat-notion-action]").forEach((node) => node.remove());
    return (copy.textContent || "").replace(/\s+/g, " ").trim();
  }

  function snapshotTurnContent(turn, role) {
    const message = turn.matches?.(`[data-message-author-role="${role}"]`)
      ? turn
      : turn.querySelector?.(`[data-message-author-role="${role}"]`);
    const contentRoot = message?.querySelector?.(".markdown") || message;
    if (!contentRoot) return "";
    if (!contentRoot.matches?.(".markdown")) return String(contentRoot.innerText || contentRoot.textContent || "").trim();
    return [...contentRoot.children].map(snapshotBlockMarkdown).filter(Boolean).join("\n\n").trim()
      || String(contentRoot.innerText || contentRoot.textContent || "").trim();
  }

  // KaTeX renders each formula three times over (MathML, the TeX annotation, and the visual
  // HTML), so plain textContent yields the source smeared together with two renderings. Read the
  // annotation instead and hand back the LaTeX the author actually wrote.
  function katexTex(node) {
    const annotation = node.querySelector?.('annotation[encoding="application/x-tex"]');
    return String(annotation?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function katexMarkdown(node) {
    if (!node.classList?.contains("katex") && !node.classList?.contains("katex-display")) return "";
    const tex = katexTex(node);
    if (!tex) return "";
    return node.classList.contains("katex-display") ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
  }

  function snapshotBlockMarkdown(block) {
    const tag = block.tagName?.toLowerCase();
    const math = katexMarkdown(block);
    if (math) return math.trim();
    const text = String(block.innerText || block.textContent || "").trim();
    if (!text) return "";
    if (/^h[1-6]$/.test(tag)) return `${"#".repeat(Number(tag.slice(1)))} ${snapshotInlineMarkdown(block)}`;
    if (tag === "pre") return `\`\`\`\n${text}\n\`\`\``;
    if (tag === "blockquote") return text.split("\n").map((line) => `> ${line}`).join("\n");
    if (tag === "ul" || tag === "ol") {
      return [...block.children].filter((child) => child.tagName?.toLowerCase() === "li")
        .map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${snapshotInlineMarkdown(item)}`)
        .join("\n");
    }
    if (["div", "section"].includes(tag) && block.children.length) {
      const nested = [...block.children].map(snapshotBlockMarkdown).filter(Boolean).join("\n\n");
      if (nested) return nested;
    }
    return snapshotInlineMarkdown(block) || text;
  }

  function snapshotInlineMarkdown(root) {
    return [...root.childNodes].map((node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const math = katexMarkdown(node);
      if (math) return math;
      const tag = node.tagName.toLowerCase();
      const content = snapshotInlineMarkdown(node) || String(node.textContent || "");
      if (["strong", "b"].includes(tag)) return `**${content}**`;
      if (["em", "i"].includes(tag)) return `*${content}*`;
      if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") return `\`${content}\``;
      if (tag === "a" && node.href) return `[${content}](${node.href})`;
      if (tag === "br") return "\n";
      return content;
    }).join("").trim();
  }

  function scheduleConversationSnapshotCapture() {
    if (snapshotCaptureTimer) return;
    if (!autoSaveEnabled) return;
    snapshotCaptureTimer = setTimeout(() => {
      snapshotCaptureTimer = null;
      captureCurrentConversationSnapshot();
    }, ANSWER_STABLE_MS);
  }

  async function captureCurrentConversationSnapshot(force = false) {
    if (!stateLoaded || (!autoSaveEnabled && !force)) return false;
    const sourceUrl = canonicalChatUrl();
    const conversation = core.findConversationByUrl(state, sourceUrl);
    const turns = getTurns();
    if (!sourceUrl || !conversation || !turns.length) return false;
    const lastAssistant = [...turns].reverse().find(isAssistantTurn) || null;
    if (lastAssistant && isTurnStreaming(lastAssistant, true)) return false;
    const messages = turns.flatMap((turn, index) => {
      const role = isUserTurn(turn) ? "user" : isAssistantTurn(turn) ? "assistant" : "";
      if (!role) return [];
      const content = snapshotTurnContent(turn, role);
      if (!content) return [];
      return [{
        id: turn.getAttribute?.("data-testid") || `${role}-${index}`,
        role,
        content,
        position: index
      }];
    });
    if (!messages.length) return false;
    const contentHash = await sha256(JSON.stringify(messages.map(({ role, content }) => [role, content])));
    const latest = core.getNode(state, conversation.id);
    if (!latest || latest.sourceUrl !== sourceUrl) return false;
    if (latest.sourceSnapshot?.contentHash === contentHash) return true;
    const sequence = ++snapshotCaptureSequence;
    const previousMessageCount = latest.sourceSnapshot?.messages?.length || 0;
    const appendedMessages = messages.length > previousMessageCount
      ? messages.slice(previousMessageCount)
      : [];
    const liveEditedContent = latest.id === notePageNodeId && noteDocumentEditing
      ? noteEditor.value
      : latest.noteContent;
    const appendedNoteContent = latest.noteEdited && appendedMessages.length
      ? appendSnapshotMessages(liveEditedContent, appendedMessages)
      : latest.noteContent;
    state = core.updateNode(state, latest.id, {
      sourceSnapshot: { sourceUrl, messages, capturedAt: Date.now(), contentHash, complete: true },
      ...(appendedNoteContent !== latest.noteContent ? { noteContent: appendedNoteContent } : {})
    });
    if (latest.id === notePageNodeId && noteDocumentEditing && appendedNoteContent !== liveEditedContent) {
      noteEditor.value = appendedNoteContent;
    }
    try {
      await persist();
      if (sequence === snapshotCaptureSequence && notePageNodeId === latest.id) renderNotePage();
      return true;
    } catch (_error) {
      // The next stable DOM change retries capture without disturbing the user's Note.
      return false;
    }
  }

  function assistantAnswerText(turn) {
    const answer = turn?.querySelector?.('[data-message-author-role="assistant"] .markdown')
      || turn?.querySelector?.('[data-message-author-role="assistant"]')
      || turn;
    return answer ? turnText(answer) : "";
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function scheduleDecorateTurns() {
    if (decorating) return;
    decorating = true;
    requestAnimationFrame(() => {
      decorating = false;
      decorateTurns();
    });
  }

  function scheduleAnswerSettleCheck(delay = ANSWER_STABLE_MS) {
    clearTimeout(answerSettleTimer);
    answerSettleTimer = setTimeout(scheduleDecorateTurns, Math.max(50, delay));
  }

  function isAnswerStable(turn, isLastAssistant) {
    const text = assistantAnswerText(turn);
    if (!text) return false;
    if (!isLastAssistant) return true;
    const timestamp = Date.now();
    const previous = answerStability.get(turn);
    if (!previous || previous.text !== text) {
      answerStability.set(turn, { text, changedAt: timestamp });
      scheduleAnswerSettleCheck();
      return false;
    }
    const remaining = ANSWER_STABLE_MS - (timestamp - previous.changedAt);
    if (remaining > 0) {
      scheduleAnswerSettleCheck(remaining);
      return false;
    }
    return true;
  }

  function decorateTurns() {
    if (!canonicalChatUrl()) return;
    const turns = getTurns();
    const lastAssistantTurn = [...turns].reverse().find(isAssistantTurn) || null;
    for (const turn of turns) {
      const assistantTurn = isAssistantTurn(turn);
      const isLastAssistant = turn === lastAssistantTurn;
      const showGenerate = branchPolicy.shouldShowGenerate(
        assistantTurn,
        assistantTurn && isTurnStreaming(turn, isLastAssistant),
        assistantTurn && isAnswerStable(turn, isLastAssistant)
      );
      let actions = turn.querySelector("[data-chat-notion-actions]");
      actions?.querySelectorAll('[data-chat-notion-action="branch"]').forEach((action) => action.remove());
      let generateAction = actions?.querySelector('[data-chat-notion-action="generate"]');

      if (!showGenerate && generateAction) {
        const generateControl = generateAction.closest('[data-chat-notion-generate-control]');
        (generateControl || generateAction).remove();
        generateAction = null;
      }

      if (!actions && showGenerate) {
        actions = document.createElement("div");
        actions.dataset.chatNotionActions = "true";
        Object.assign(actions.style, {
          display: "flex",
          alignItems: "center",
          alignSelf: "flex-end",
          justifyContent: "flex-end",
          gap: "6px",
          width: "fit-content",
          margin: "8px 0 4px auto"
        });
        mountTurnActions(turn, actions);
      }

      if (actions) mountTurnActions(turn, actions);

      if (showGenerate && !generateAction) {
        const generateControl = createGenerateTreeControl(turn);
        generateAction = generateControl.querySelector('[data-chat-notion-action="generate"]');
        actions.appendChild(generateControl);
      }
      if (actions) {
        const generateControl = generateAction?.closest('[data-chat-notion-generate-control]') || generateAction;
        if (generateControl && actions.firstElementChild !== generateControl) actions.prepend(generateControl);
      }

      if (actions && !actions.childElementCount) actions.remove();
    }
    if (turns.length && (!lastAssistantTurn || !isTurnStreaming(lastAssistantTurn, true))) {
      scheduleConversationSnapshotCapture();
    }
  }

  function mountTurnActions(turn, actions) {
    const markdown = turn.querySelector('[data-message-author-role="assistant"] .markdown')
      || turn.querySelector(".markdown");
    const assistant = turn.matches?.('[data-message-author-role="assistant"]')
      ? turn
      : turn.querySelector('[data-message-author-role="assistant"]');
    const target = markdown?.parentElement || assistant || turn;
    if (actions.parentElement !== target) target.appendChild(actions);
  }

  function createGenerateTreeButton() {
      const action = document.createElement("button");
      action.type = "button";
      action.dataset.chatNotionAction = "generate";
      action.textContent = t("generate");
      action.setAttribute("aria-label", t("generateAria"));
      Object.assign(action.style, {
        padding: "5px 9px",
        border: "0",
        borderRadius: "0",
        background: "transparent",
        color: "inherit",
        font: "500 12px ui-sans-serif, system-ui, sans-serif",
        cursor: "pointer",
        opacity: "1"
      });
      return action;
  }

  function createGenerateTreeControl(turn) {
    const control = document.createElement("div");
    control.dataset.chatNotionGenerateControl = "true";
    Object.assign(control.style, {
      display: "inline-flex",
      alignItems: "stretch",
      position: "relative",
      border: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
      borderRadius: "9px",
      opacity: "0.86"
    });
    const generateAction = createGenerateTreeButton();
    generateAction.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      generateKnowledgeTree(turn, generateAction);
    });
    generateAction.style.borderRadius = "8px 0 0 8px";
    generateAction.addEventListener("mouseenter", () => {
      generateAction.style.background = "color-mix(in srgb, currentColor 7%, transparent)";
    });
    generateAction.addEventListener("mouseleave", () => { generateAction.style.background = "transparent"; });
    control.append(generateAction, createExtractionDepthControl());
    control.addEventListener("mouseenter", () => { control.style.opacity = "1"; });
    control.addEventListener("mouseleave", () => { control.style.opacity = "0.86"; });
    return control;
  }

  function createExtractionDepthControl() {
    const segment = document.createElement("span");
    segment.dataset.chatNotionExtractDepthControl = "true";
    Object.assign(segment.style, {
      position: "relative",
      display: "inline-flex",
      alignItems: "stretch",
      borderLeft: "1px solid color-mix(in srgb, currentColor 22%, transparent)"
    });
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.dataset.chatNotionDepthTrigger = "true";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    Object.assign(trigger.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 8px",
      border: "0",
      borderRadius: "0 8px 8px 0",
      background: "transparent",
      color: "inherit",
      font: "500 12px ui-sans-serif, system-ui, sans-serif",
      cursor: "pointer"
    });
    const triggerLabel = document.createElement("span");
    triggerLabel.dataset.chatNotionDepthLabel = "true";
    const chevron = document.createElement("span");
    chevron.textContent = "⌄";
    chevron.setAttribute("aria-hidden", "true");
    Object.assign(chevron.style, { fontSize: "13px", lineHeight: "1", transform: "translateY(-1px)" });
    trigger.append(triggerLabel, chevron);

    const menu = document.createElement("div");
    menu.dataset.chatNotionDepthMenu = "true";
    menu.setAttribute("role", "listbox");
    Object.assign(menu.style, {
      display: "none",
      position: "absolute",
      right: "0",
      bottom: "calc(100% + 7px)",
      zIndex: "2147483646",
      minWidth: "132px",
      padding: "6px",
      border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
      borderRadius: "10px",
      background: "var(--main-surface-primary, Canvas)",
      color: "inherit",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.16)"
    });
    const menuTitle = document.createElement("div");
    menuTitle.dataset.chatNotionDepthMenuTitle = "true";
    Object.assign(menuTitle.style, {
      padding: "4px 7px 6px",
      font: "600 11px ui-sans-serif, system-ui, sans-serif",
      opacity: "0.58"
    });
    menu.appendChild(menuTitle);
    for (const depth of [1, 2, 3, 4, 5]) {
      const option = document.createElement("button");
      option.type = "button";
      option.dataset.chatNotionDepthOption = String(depth);
      option.setAttribute("role", "option");
      Object.assign(option.style, {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "6px 7px",
        border: "0",
        borderRadius: "7px",
        background: "transparent",
        color: "inherit",
        font: "500 12px ui-sans-serif, system-ui, sans-serif",
        textAlign: "left",
        cursor: "pointer"
      });
      const label = document.createElement("span");
      label.dataset.chatNotionDepthOptionLabel = "true";
      const check = document.createElement("span");
      check.dataset.chatNotionDepthCheck = "true";
      check.textContent = "✓";
      option.append(label, check);
      option.addEventListener("mouseenter", () => {
        option.style.background = "color-mix(in srgb, currentColor 8%, transparent)";
      });
      option.addEventListener("mouseleave", () => {
        updateExtractionDepthControl(segment);
      });
      option.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        maxExtractDepth = normalizeTreeDepth(depth);
        refreshExtractionDepthControls();
        closeExtractionDepthMenus();
        await sendMessage({ type: "EXTRACT_DEPTH_SET", depth: maxExtractDepth });
      });
      menu.appendChild(option);
    }
    trigger.addEventListener("mouseenter", () => {
      trigger.style.background = "color-mix(in srgb, currentColor 7%, transparent)";
    });
    trigger.addEventListener("mouseleave", () => { trigger.style.background = "transparent"; });
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const opening = menu.style.display === "none";
      closeExtractionDepthMenus();
      if (opening) {
        menu.style.display = "grid";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
    menu.addEventListener("click", (event) => event.stopPropagation());
    segment.append(trigger, menu);
    updateExtractionDepthControl(segment);
    return segment;
  }

  function updateExtractionDepthControl(control) {
    const trigger = control.querySelector("[data-chat-notion-depth-trigger]");
    trigger.setAttribute("aria-label", `${t("extractDepth")}: ${maxExtractDepth}`);
    trigger.title = t("extractDepth");
    control.querySelector("[data-chat-notion-depth-label]").textContent = t("depthButton", { depth: maxExtractDepth });
    control.querySelector("[data-chat-notion-depth-menu-title]").textContent = t("extractDepth");
    for (const option of control.querySelectorAll("[data-chat-notion-depth-option]")) {
      const depth = Number(option.dataset.chatNotionDepthOption);
      const selected = depth === maxExtractDepth;
      option.setAttribute("aria-selected", String(selected));
      option.style.background = selected ? "color-mix(in srgb, currentColor 9%, transparent)" : "transparent";
      option.style.fontWeight = selected ? "650" : "500";
      option.querySelector("[data-chat-notion-depth-option-label]").textContent = t("depthOption", { depth });
      option.querySelector("[data-chat-notion-depth-check]").style.visibility = selected ? "visible" : "hidden";
    }
  }

  function refreshExtractionDepthControls() {
    for (const control of document.querySelectorAll("[data-chat-notion-extract-depth-control]")) {
      updateExtractionDepthControl(control);
    }
  }

  function closeExtractionDepthMenus() {
    for (const menu of document.querySelectorAll("[data-chat-notion-depth-menu]")) {
      menu.style.display = "none";
    }
    for (const trigger of document.querySelectorAll("[data-chat-notion-depth-trigger]")) {
      trigger.setAttribute("aria-expanded", "false");
    }
  }

  function isAssistantTurn(turn) {
    return Boolean(turn.matches?.('[data-message-author-role="assistant"]')
      || turn.querySelector?.('[data-message-author-role="assistant"]'));
  }

  function isUserTurn(turn) {
    return Boolean(turn.matches?.('[data-message-author-role="user"]')
      || turn.querySelector?.('[data-message-author-role="user"]'));
  }

  function userTurnCount() {
    return getTurns().filter((turn) => isUserTurn(turn) && turnText(turn)).length;
  }

  function pendingBranchForCurrentUrl() {
    const currentUrl = canonicalChatUrl();
    return pendingNativeBranch
      && pendingNativeBranch.branchUrl === currentUrl
      && pendingNativeBranch.parentUrl !== currentUrl
      ? pendingNativeBranch
      : null;
  }

  function nativeBranchParent(pendingBranch) {
    if (!pendingBranch) return null;
    return core.getNode(state, pendingBranch.parentId)
      || core.findConversationByUrl(state, pendingBranch.parentUrl);
  }

  function branchDiscoveryActive(currentUrl) {
    if (!currentUrl) return false;
    if (branchDiscoveryUrl !== currentUrl) {
      branchDiscoveryUrl = currentUrl;
      branchDiscoveryStartedAt = Date.now();
    }
    return Date.now() - branchDiscoveryStartedAt < NATIVE_BRANCH_DISCOVERY_MS;
  }

  async function repairCurrentNativeBranch() {
    const pendingBranch = pendingBranchForCurrentUrl();
    const currentUrl = canonicalChatUrl();
    const current = core.findConversationByUrl(state, currentUrl);
    const parent = nativeBranchParent(pendingBranch);
    if (!pendingBranch || !parent) return false;
    const previousUrls = new Set(Array.isArray(pendingBranch.previousBranchUrls)
      ? pendingBranch.previousBranchUrls
      : []);
    const previousBranch = state.nodes.find((node) => node.kind === "branch"
      && node.parentId === parent.id
      && previousUrls.has(node.sourceUrl));

    if (previousBranch) {
      if (current && current.id !== previousBranch.id) {
        state = core.mergeConversationNodes(state, previousBranch.id, current.id, currentUrl);
      } else if (previousBranch.sourceUrl !== currentUrl) {
        state = core.updateNode(state, previousBranch.id, { sourceUrl: currentUrl });
      }
      state.collapsedIds = state.collapsedIds.filter((id) => id !== parent.id);
      await persist();
      render();
      return true;
    }

    if (!current || current.id === parent.id) return false;
    if (current.kind === "branch" && current.parentId === parent.id) return false;
    state = core.nestConversationAsBranch(state, current.id, parent.id, pendingBranch.parentUrl);
    state.collapsedIds = state.collapsedIds.filter((id) => id !== parent.id);
    await persist();
    render();
    return true;
  }

  function hasStartedConversation() {
    const pendingBranch = pendingBranchForCurrentUrl();
    return pendingBranch
      ? userTurnCount() > Number(pendingBranch.baselineUserTurns || 0)
      : userTurnCount() > 0;
  }

  function freshChildPrompt(child) {
    return chatPrompts.buildChildPrompt({
      locale,
      title: child.title,
      parents: childPromptParents(child),
      template: customChildPromptTemplate
    });
  }

  function childPromptParents(child) {
    return promptParentTitles(child?.parentId);
  }

  function promptParentTitles(parentId) {
    const parents = [];
    const visited = new Set();
    let current = core.getNode(state, parentId);
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (["chat", "branch"].includes(current.kind)) parents.unshift(current.title);
      current = core.getNode(state, current.parentId);
    }
    return parents;
  }

  function isChildChat(node) {
    if (node?.kind !== "chat") return false;
    if (node.prompt || node.parentConversationUrl || node.status === "idea" || node.status === "pending") return true;
    if (!node.parentId) return false;
    const parent = core.getNode(state, node.parentId);
    return ["chat", "branch"].includes(parent?.kind);
  }

  function extractOutline(turn) {
    const root = turn.querySelector('[data-message-author-role="assistant"] .markdown')
      || turn.querySelector(".markdown")
      || turn.querySelector('[data-message-author-role="assistant"]')
      || turn;
    const domBlocks = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li")]
      .filter((block) => block.tagName !== "LI" || !block.parentElement?.closest("li"))
      .map((block) => ({
        kind: /^H[1-6]$/.test(block.tagName) ? "heading" : block.tagName === "LI" ? "list" : "paragraph",
        level: /^H[1-6]$/.test(block.tagName) ? Number(block.tagName.slice(1)) : 0,
        strong: block.tagName === "P" && block.children.length === 1 && block.firstElementChild?.matches("strong,b"),
        text: block.innerText || block.textContent || ""
      }));
    let outline = outlineParser.parseBlocks(domBlocks);

    if (!outline.length) {
      const copy = root.cloneNode(true);
      copy.querySelectorAll("[data-chat-notion-action],[data-chat-notion-actions]").forEach((node) => node.remove());
      outline = outlineParser.parseBlocks([{
        kind: "paragraph",
        text: copy.innerText || copy.textContent || ""
      }]);
    }
    return outline;
  }

  async function generateKnowledgeTree(turn, action) {
    action.disabled = true;
    action.textContent = t("generating");
    try {
      const outline = outlineParser.limitDepth(extractOutline(turn), maxExtractDepth);
      const nodeCount = countOutlineNodes(outline);
      if (!outline.length || !nodeCount) {
        throw new Error(t("noOutline"));
      }
      const parent = ensureCurrentConversation();
      const turns = getTurns();
      const messageIndex = turns.indexOf(turn);
      const messageHash = await sha256(turnText(turn));
      const existing = core.getChildren(state, parent.id)
        .some((node) => node.kind === "chat" && node.sourceMessageHash === messageHash);
      if (existing) throw new Error(t("treeExists"));

      for (const outlineNode of outline) {
        addOutlineNode(outlineNode, parent.id, {
          messageIndex: messageIndex >= 0 ? messageIndex : null,
          messageHash,
          parentConversationUrl: canonicalChatUrl()
        }, []);
      }
      state.collapsedIds = state.collapsedIds.filter((id) => id !== parent.id);
      selectSingleNode(parent.id);
      await commit();
      render();
      setPanelOpen(true);
      showToast(t("generated", { nodes: nodeCount }));
    } catch (error) {
      showToast(error.message, true);
    } finally {
      action.disabled = false;
      action.textContent = t("generate");
    }
  }

  function addOutlineNode(outlineNode, parentId, source, ancestorTitles) {
    const pathTitles = [...ancestorTitles, outlineNode.title];
    const archivedLink = core.findArchivedConversationLink(state, {
      anchorUrl: source.parentConversationUrl,
      sourceMessageHash: source.messageHash,
      pathTitles
    });
    const nodeId = core.createId("chat");
    state = core.addNode(state, {
      id: nodeId,
      kind: "chat",
      parentId,
      title: outlineNode.title,
      sourceUrl: archivedLink?.sourceUrl || "",
      sourceMessageIndex: source.messageIndex,
      sourceMessageHash: source.messageHash,
      sourceOutlinePath: pathTitles,
      parentConversationUrl: archivedLink?.parentConversationUrl || source.parentConversationUrl,
      status: archivedLink ? "ready" : "idea",
      prompt: chatPrompts.buildChildPrompt({ locale, title: outlineNode.title, parents: promptParentTitles(parentId), template: customChildPromptTemplate })
    });
    for (const item of outlineNode.items) {
      const itemPathTitles = [...pathTitles, item];
      const itemArchivedLink = core.findArchivedConversationLink(state, {
        anchorUrl: source.parentConversationUrl,
        sourceMessageHash: source.messageHash,
        pathTitles: itemPathTitles
      });
      state = core.addNode(state, {
        kind: "chat",
        parentId: nodeId,
        title: item,
        sourceUrl: itemArchivedLink?.sourceUrl || "",
        sourceMessageIndex: source.messageIndex,
        sourceMessageHash: source.messageHash,
        sourceOutlinePath: itemPathTitles,
        parentConversationUrl: itemArchivedLink?.parentConversationUrl || source.parentConversationUrl,
        status: itemArchivedLink ? "ready" : "idea",
        prompt: chatPrompts.buildChildPrompt({ locale, title: item, parents: promptParentTitles(nodeId), template: customChildPromptTemplate })
      });
    }
    for (const child of outlineNode.children) addOutlineNode(child, nodeId, source, pathTitles);
  }

  function countOutlineNodes(outline) {
    return outline.reduce((total, node) => (
      total + 1 + node.items.length + countOutlineNodes(node.children)
    ), 0);
  }

  function ensureCurrentConversation() {
    const context = currentLocation();
    if (!context.chatUrl) throw new Error(t("openSaved"));
    if (!hasStartedConversation()) throw new Error(t("startBeforeSave"));
    const existing = core.findConversationByUrl(state, context.chatUrl);
    if (existing) return existing;

    state = core.restoreAutoSave(state, context.chatUrl);

    let parentId = null;
    let kind = "chat";
    const pendingBranch = pendingBranchForCurrentUrl();
    const branchParent = nativeBranchParent(pendingBranch);
    if (pendingBranch && branchParent) {
      parentId = branchParent.id;
      kind = "branch";
      state.collapsedIds = state.collapsedIds.filter((id) => id !== parentId);
    } else if (context.projectUrl) {
      let project = state.nodes.find((node) => node.kind === "project" && node.sourceUrl === context.projectUrl);
      if (!project) {
        state = core.addNode(state, {
          kind: "project",
          title: currentProjectTitle(context),
          sourceUrl: context.projectUrl
        });
        project = state.nodes.find((node) => node.kind === "project" && node.sourceUrl === context.projectUrl);
      }
      parentId = project.id;
    }

    state = core.addNode(state, {
      kind,
      parentId,
      title: currentChatTitle(),
      sourceUrl: context.chatUrl,
      ...(kind === "branch" ? { parentConversationUrl: pendingBranch.parentUrl } : {})
    });
    return core.findConversationByUrl(state, context.chatUrl);
  }

  async function saveCurrentChat(showConfirmation) {
    try {
      const currentUrl = canonicalChatUrl();
      if (branchDiscoveryActive(currentUrl)) {
        await refreshPendingNativeBranch();
        await repairCurrentNativeBranch();
      }
      const before = core.findConversationByUrl(state, currentUrl);
      const wasDismissed = core.isAutoSaveDismissed(state, currentUrl);
      autoSavePhase = "saving";
      updateSaveChatButton();
      const conversation = ensureCurrentConversation();
      if (!before || wasDismissed) {
        if (showConfirmation) await commit();
        else await persist();
      }
      if (pendingBranchForCurrentUrl()) await completePendingNativeBranch();
      autoSavePhase = "saved";
      selectSingleNode(conversation.id);
      render();
      if (showConfirmation) showToast(before ? t("alreadySaved") : t("chatSaved"));
    } catch (error) {
      autoSavePhase = "failed";
      updateSaveChatButton();
      if (showConfirmation) showToast(error.message, true);
    }
  }

  function updateSaveChatButton() {
    const currentUrl = canonicalChatUrl();
    const started = Boolean(currentUrl && hasStartedConversation());
    saveChatButton.classList.toggle("is-hidden", !started);
    if (!started) return;
    const saved = Boolean(core.findConversationByUrl(state, currentUrl));
    const dismissed = core.isAutoSaveDismissed(state, currentUrl);
    saveChatButton.classList.toggle("is-saved", saved);
    if (saved) {
      saveChatButton.textContent = t(autoSaveEnabled ? "savedAutomatically" : "savedManually");
      saveChatButton.disabled = true;
    } else if (dismissed) {
      saveChatButton.textContent = t("saveChat");
      saveChatButton.disabled = false;
    } else if (autoSavePhase === "failed") {
      saveChatButton.textContent = t("retrySave");
      saveChatButton.disabled = false;
    } else if (autoSaveEnabled) {
      saveChatButton.textContent = t("savingChat");
      saveChatButton.disabled = true;
    } else {
      saveChatButton.textContent = t("manualSaveChat");
      saveChatButton.disabled = false;
    }
  }

  function autoSaveCurrentChat() {
    if (!stateLoaded) return Promise.resolve(null);
    if (autoSavePromise) return autoSavePromise;
    autoSavePromise = performAutoSaveCurrentChat()
      .catch(() => {
        autoSavePhase = "failed";
        updateSaveChatButton();
      })
      .finally(() => {
        autoSavePromise = null;
      });
    return autoSavePromise;
  }

  async function activateAutoSaveForCurrentChat() {
    if (!stateLoaded || !autoSaveEnabled) {
      updateSaveChatButton();
      return null;
    }
    const currentUrl = canonicalChatUrl();
    if (!currentUrl || !hasStartedConversation()) {
      autoSavePhase = "idle";
      updateSaveChatButton();
      return null;
    }
    if (autoSavePromise) await autoSavePromise;
    if (!autoSaveEnabled) return null;
    if (core.isAutoSaveDismissed(state, currentUrl)) {
      state = core.restoreAutoSave(state, currentUrl);
      if (!await persist()) return null;
    }
    return autoSaveCurrentChat();
  }

  async function performAutoSaveCurrentChat() {
    if (!autoSaveEnabled) {
      updateSaveChatButton();
      return null;
    }
    const currentUrl = canonicalChatUrl();
    if (!currentUrl) {
      autoSavePhase = "idle";
      updateSaveChatButton();
      return null;
    }
    const discoveringBranch = branchDiscoveryActive(currentUrl);
    let existing = core.findConversationByUrl(state, currentUrl);
    if (discoveringBranch && (!existing || existing.kind !== "branch")) {
      await refreshPendingNativeBranch();
      await repairCurrentNativeBranch();
      existing = core.findConversationByUrl(state, currentUrl);
    }
    const pendingBranch = pendingBranchForCurrentUrl();
    if (!pendingBranch && !existing && discoveringBranch) {
      autoSavePhase = "idle";
      updateSaveChatButton();
      return null;
    }
    if (!hasStartedConversation()) {
      autoSavePhase = "idle";
      updateSaveChatButton();
      return null;
    }
    if (existing) {
      autoSavePhase = "saved";
      updateSaveChatButton();
      if (pendingBranch) await completePendingNativeBranch();
      return null;
    }
    if (core.isAutoSaveDismissed(state, currentUrl)) {
      autoSavePhase = "dismissed";
      updateSaveChatButton();
      return null;
    }
    autoSavePhase = "saving";
    updateSaveChatButton();
    ensureCurrentConversation();
    if (!await persist()) throw new Error(t("saveFailed"));
    if (pendingBranchForCurrentUrl()) await completePendingNativeBranch();
    autoSavePhase = "saved";
    render();
    return null;
  }

  async function finalizePendingChildChat() {
    const currentUrl = canonicalChatUrl();
    if (!currentUrl || core.findConversationByUrl(state, currentUrl)) return false;
    const pending = state.nodes
      .filter((node) => node.kind === "chat" && node.status === "pending")
      .filter((node) => Date.now() - node.updatedAt < PENDING_MAX_AGE)
      .filter((node) => node.parentConversationUrl !== currentUrl)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!pending) return false;

    const prompt = freshChildPrompt(pending);
    state = core.updateNode(state, pending.id, {
      sourceUrl: currentUrl,
      status: "pending",
      prompt
    });
    selectSingleNode(pending.id);
    await persist();
    return true;
  }

  function isTurnStreaming(turn, isLastAssistant = false) {
    const streamingSelector = '.result-streaming,[data-is-streaming="true"],[data-testid*="streaming"]';
    if (turn?.matches?.(streamingSelector) || turn?.querySelector?.(streamingSelector)) {
      return true;
    }
    if (!isLastAssistant) return false;
    return [...document.querySelectorAll(
      'button[data-testid="stop-button"],button[aria-label*="Stop" i],button[aria-label*="停止"]'
    )].some((control) => control.getClientRects().length > 0);
  }

  async function completePendingChildChat() {
    const currentUrl = canonicalChatUrl();
    if (!currentUrl) return false;
    const pending = state.nodes.find((node) => node.kind === "chat"
      && node.status === "pending"
      && node.sourceUrl === currentUrl);
    if (!pending) return false;

    const assistantTurns = getTurns().filter(isAssistantTurn);
    const lastAssistantTurn = assistantTurns.at(-1);
    const answer = assistantAnswerText(lastAssistantTurn);
    if (!answer || isTurnStreaming(lastAssistantTurn, true)) {
      pendingAnswerObservations.delete(pending.id);
      return false;
    }

    const signature = `${assistantTurns.length}:${answer}`;
    const observation = pendingAnswerObservations.get(pending.id);
    if (!observation || observation.signature !== signature) {
      pendingAnswerObservations.set(pending.id, { signature, observedAt: Date.now() });
      return false;
    }
    if (Date.now() - observation.observedAt < ANSWER_STABLE_MS) return false;

    pendingAnswerObservations.delete(pending.id);
    state = core.updateNode(state, pending.id, { status: "ready" });
    selectSingleNode(pending.id);
    await persist();
    scheduleConversationSnapshotCapture();
    render();
    return true;
  }

  async function startSelectedChildChat() {
    const child = core.getNode(state, selectedId);
    if (!isChildChat(child)) return;
    if (child.status === "ready" && child.sourceUrl) {
      openSelected();
      return;
    }
    try {
      const prompt = freshChildPrompt(child);
      state = core.updateNode(state, child.id, {
        status: "pending",
        prompt
      });
      await persist();
      render();

      if (!canonicalChatUrl()) {
        await prefillComposer(prompt);
        return;
      }

      const sourcePath = new URL(child.parentConversationUrl, location.origin).pathname;
      const sourceContext = core.parseChatGptLocation(sourcePath, location.origin);
      location.assign(sourceContext.projectUrl || `${location.origin}/`);
    } catch (error) {
      showToast(error.message, true);
    }
  }

  async function resumePendingChildChat() {
    if (canonicalChatUrl()) return false;
    const pending = state.nodes
      .filter((node) => node.kind === "chat" && node.status === "pending" && node.prompt)
      .filter((node) => Date.now() - node.updatedAt < PENDING_MAX_AGE)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!pending) return false;
    const prompt = freshChildPrompt(pending);
    if (prompt !== pending.prompt) {
      state = core.updateNode(state, pending.id, { prompt });
      await persist();
    }
    const filled = await prefillComposer(prompt);
    if (filled) selectSingleNode(pending.id);
    return filled;
  }

  async function prefillComposer(promptText) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const composer = findComposerElement();
      if (composer instanceof HTMLTextAreaElement) {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        if (setter) setter.call(composer, promptText);
        else composer.value = promptText;
        composer.dispatchEvent(new Event("input", { bubbles: true }));
        if (!isInlineNodeEditorOpen()) composer.focus();
        return true;
      }
      if (composer?.isContentEditable) {
        composer.textContent = promptText;
        composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: promptText }));
        if (!isInlineNodeEditorOpen()) composer.focus();
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    return false;
  }

  function isInlineNodeEditorOpen() {
    return addingFolderParentId !== undefined
      || Boolean(addingChildParentId)
      || Boolean(editingNodeId);
  }

  async function addTreeModeToComposer(forceOn = false) {
    const current = currentComposerText();
    const selectedApplied = appliedPromptSnapshot?.id === "tree" || isTreePromptApplied(current);
    const base = stripPromptTools(current);
    const shouldApply = forceOn || !selectedApplied;
    if (!canApplyPromptToComposer(base, shouldApply)) return false;
    const next = shouldApply ? applyTreePrompt(base) : base;
    const filled = await prefillComposer(next);
    if (filled) {
      activePromptToolId = shouldApply ? "tree" : null;
      const instruction = shouldApply
        ? (customTreePrompt ? resolvedCustomTreePrompt() : chatPrompts.treeInstruction(locale))
        : "";
      rememberAppliedPrompt(shouldApply ? "tree" : null, instruction, treePromptPositionValue);
      renderPromptToolButtons();
    }
    showToast(filled ? t(shouldApply ? "treeModeReady" : "promptRemoved") : t("composerUnavailable"), !filled);
    return filled && shouldApply;
  }

  function canApplyPromptToComposer(base, shouldApply) {
    if (!shouldApply || String(base || "").trim()) return true;
    showToast(t("writeQuestion"), true);
    return false;
  }

  function currentComposerText() {
    return readComposerElement(findComposerElement());
  }

  function readComposerElement(element) {
    if (!element) return "";
    if (element instanceof HTMLTextAreaElement) return element.value || "";
    return element.innerText || element.textContent || "";
  }

  function findComposerElement() {
    const candidates = [...new Set(document.querySelectorAll(
      'textarea[data-testid="prompt-textarea"], textarea#prompt-textarea, #prompt-textarea[contenteditable="true"], [contenteditable="true"][data-testid="prompt-textarea"]'
    ))];
    const visible = candidates.filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    });
    const pool = visible.length ? visible : candidates;
    return pool.reduce((best, element) => {
      if (!best) return element;
      return readComposerElement(element).length >= readComposerElement(best).length ? element : best;
    }, null);
  }

  async function handleNavigation() {
    const currentUrl = canonicalChatUrl();
    if (currentUrl !== lastChatUrl) {
      lastChatUrl = currentUrl;
      activePromptToolId = null;
      appliedPromptSnapshot = null;
      await refreshPendingNativeBranch();
      await finalizePendingChildChat();
      await resumePendingChildChat();
      await autoSaveCurrentChat();
      renderPromptToolButtons();
      render();
      scheduleDecorateTurns();
    }
    await completePendingChildChat();
    await autoSaveCurrentChat();
    scheduleDecorateTurns();
  }

  function showTreeContextMenu(clientX, clientY, node = null) {
    contextMenuNodeId = node?.id || null;
    const batchSelection = Boolean(node && selectedIds.has(node.id) && selectedIds.size > 1);
    contextNewFolderButton.classList.toggle("is-hidden", Boolean(node));
    contextEnterChatButton.classList.toggle("is-hidden", batchSelection || !node || !["project", "chat", "branch"].includes(node.kind));
    contextNewChildButton.classList.toggle("is-hidden", batchSelection || !node || !core.canContain(node.kind, "chat"));
    contextRenameButton.classList.toggle("is-hidden", batchSelection || !node);
    contextDeleteButton.classList.toggle("is-hidden", !node);
    treeContextMenu.style.left = `${clientX}px`;
    treeContextMenu.style.top = `${clientY}px`;
    treeContextMenu.classList.remove("is-hidden");
    const rect = treeContextMenu.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - 8, Math.max(8, clientX));
    const top = Math.min(window.innerHeight - rect.height - 8, Math.max(8, clientY));
    treeContextMenu.style.left = `${left}px`;
    treeContextMenu.style.top = `${top}px`;
    treeContextMenu.querySelector(".tree-context-item:not(.is-hidden)")?.focus();
  }

  function hideTreeContextMenu() {
    treeContextMenu.classList.add("is-hidden");
    contextMenuNodeId = null;
  }

  function beginAddFolder(parentOverride) {
    const selected = core.getNode(state, selectedId);
    const parentId = parentOverride === null
      ? null
      : (selected?.kind === "folder" ? selected.id : null);
    if (addingFolderParentId === parentId) {
      armInlineEditorFocus(".inline-folder-input");
      return;
    }
    addingChildParentId = null;
    editingNodeId = null;
    deletingNodeId = null;
    addingFolderParentId = parentId;
    if (parentId) state.collapsedIds = state.collapsedIds.filter((id) => id !== parentId);
    render();
    armInlineEditorFocus(".inline-folder-input");
  }

  async function addFolderNode(parentId, input) {
    const title = input?.trim();
    if (!title) {
      addingFolderParentId = undefined;
      render();
      return;
    }
    try {
      state = core.addNode(state, { kind: "folder", parentId, title });
      if (parentId) state.collapsedIds = state.collapsedIds.filter((id) => id !== parentId);
      addingFolderParentId = undefined;
      await commit();
      render();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function beginAddChild(parentId) {
    const parent = core.getNode(state, parentId);
    if (!parent || !core.canContain(parent.kind, "chat")) {
      showToast(t("addUnavailable"), true);
      return;
    }
    if (addingChildParentId === parent.id) {
      armInlineEditorFocus(".inline-child-input:not(.inline-folder-input)");
      return;
    }

    selectSingleNode(parent.id);
    addingFolderParentId = undefined;
    editingNodeId = null;
    deletingNodeId = null;
    addingChildParentId = parent.id;
    state.collapsedIds = state.collapsedIds.filter((id) => id !== parent.id);
    render();
    armInlineEditorFocus(".inline-child-input:not(.inline-folder-input)");
  }

  async function addChildNode(parentId, input) {
    const parent = core.getNode(state, parentId);
    if (!parent || !core.canContain(parent.kind, "chat")) {
      showToast(t("addUnavailable"), true);
      return;
    }

    const title = input?.trim();
    if (!title) {
      addingChildParentId = null;
      render();
      return;
    }
    try {
      const id = core.createId("chat");
      state = core.addNode(state, {
        id,
        kind: "chat",
        parentId: parent.id,
        title,
        parentConversationUrl: parent.sourceUrl || parent.parentConversationUrl || canonicalChatUrl(),
        status: "idea",
        prompt: chatPrompts.buildChildPrompt({ locale, title, parents: promptParentTitles(parent.id), template: customChildPromptTemplate })
      });
      selectSingleNode(id);
      addingChildParentId = null;
      state.collapsedIds = state.collapsedIds.filter((id) => id !== parent.id);
      await commit();
      render();
      showToast(t("childAdded"));
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function beginRename(nodeId) {
    const node = core.getNode(state, nodeId);
    if (!node) return;
    selectSingleNode(node.id);
    addingChildParentId = null;
    addingFolderParentId = undefined;
    deletingNodeId = null;
    editingNodeId = node.id;
    render();
    armInlineEditorFocus(".inline-rename-input", true);
  }

  function armInlineEditorFocus(selector, select = false) {
    inlineEditorFocusGuardUntil = performance.now() + 400;
    let firstFocus = true;
    const focus = () => {
      const input = tree.querySelector(selector);
      if (!input) return;
      if (shadow.activeElement !== input) input.focus({ preventScroll: true });
      if (select && firstFocus) input.select();
      firstFocus = false;
    };
    focus();
    requestAnimationFrame(focus);
    setTimeout(focus, 80);
    setTimeout(focus, 220);
  }

  function activeInlineEditorInput() {
    if (editingNodeId) return tree.querySelector(`.inline-rename-input[data-node-id="${CSS.escape(editingNodeId)}"]`);
    if (addingFolderParentId !== undefined) return tree.querySelector(".inline-folder-input");
    if (addingChildParentId) return tree.querySelector(".inline-child-input:not(.inline-folder-input)");
    return null;
  }

  function cancelInlineNodeEditors() {
    if (!editingNodeId && !addingChildParentId && addingFolderParentId === undefined) return false;
    editingNodeId = null;
    addingChildParentId = null;
    addingFolderParentId = undefined;
    render();
    return true;
  }

  function keepInlineEditorAfterEarlyBlur(selector, isEditing) {
    if (!isEditing() || performance.now() >= inlineEditorFocusGuardUntil) return false;
    const replacement = tree.querySelector(selector);
    if (!replacement) return false;
    replacement.focus({ preventScroll: true });
    return true;
  }

  async function renameNode(nodeId, input) {
    const node = core.getNode(state, nodeId);
    const title = input?.trim();
    if (!node || !title) {
      editingNodeId = null;
      render();
      return;
    }
    state = core.updateNode(state, node.id, { title });
    editingNodeId = null;
    await commit();
    render();
  }

  async function openSelected() {
    const node = core.getNode(state, selectedId);
    if (isChildChat(node) && !node.sourceUrl) {
      setPanelOpen(false);
      await cancelNativeBranchSession();
      await startSelectedChildChat();
      return;
    }
    if (!node?.sourceUrl) {
      showToast(node?.status === "pending" ? t("finishBranch") : t("noUrl"), true);
      return;
    }
    setPanelOpen(false);
    await cancelNativeBranchSession();
    if (canonicalChatUrl() !== node.sourceUrl) location.assign(node.sourceUrl);
  }

  function beginDelete(nodeId) {
    const node = core.getNode(state, nodeId);
    if (!node) return;
    const deleteIds = selectedRootNodeIds(node.id);
    if (!selectedIds.has(node.id) || selectedIds.size === 1) selectSingleNode(node.id);
    addingChildParentId = null;
    addingFolderParentId = undefined;
    editingNodeId = null;
    deletingNodeId = node.id;
    deletingNodeIds = new Set(deleteIds);
    deletingSelectionCount = selectedIds.size > 1 ? selectedIds.size : 1;
    render();
    requestAnimationFrame(() => tree.querySelector(".is-confirming-delete .inline-confirm-button.danger")?.focus());
  }

  async function confirmDelete(nodeId) {
    const node = core.getNode(state, nodeId);
    if (!node || deletingNodeId !== node.id) return;
    const deleteRoots = new Set(deletingNodeIds);
    const removedChatUrls = state.nodes
      .filter((candidate) => ["chat", "branch"].includes(candidate.kind) && candidate.sourceUrl)
      .filter((candidate) => core.getNodePath(state, candidate.id).some((ancestor) => deleteRoots.has(ancestor.id)))
      .map((candidate) => candidate.sourceUrl);
    const closesOpenNote = core.getNodePath(state, notePageNodeId)
      .some((ancestor) => deleteRoots.has(ancestor.id));
    state = core.archiveConversationLinks(state, [...deletingNodeIds]);
    state = core.dismissAutoSave(state, removedChatUrls);
    for (const deleteId of deletingNodeIds) state = core.removeNode(state, deleteId);
    deletingNodeId = null;
    deletingNodeIds = new Set();
    deletingSelectionCount = 0;
    if (closesOpenNote) closeNotePage();
    selectSingleNode(null);
    await commit();
    render();
  }

  function openNotePage(nodeId) {
    const node = core.getNode(state, nodeId);
    if (!node || node.kind === "folder") return;
    if (noteSaveTimer) {
      clearTimeout(noteSaveTimer);
      noteSaveTimer = null;
      saveOpenNote();
    }
    notePageNodeId = node.id;
    noteDocumentEditing = false;
    panel.classList.add("note-page-open");
    const panelRect = panel.getBoundingClientRect();
    const targetWidth = Math.min(1120, window.innerWidth - PANEL_EDGE_INSET - PANEL_RIGHT_INSET);
    if (panelRect.width < targetWidth) {
      const left = Math.max(PANEL_EDGE_INSET,
        Math.min(panelRect.left, window.innerWidth - targetWidth - PANEL_RIGHT_INSET));
      setPanelGeometry(left, panelRect.top, targetWidth, panelRect.height);
    }
    notePage.classList.remove("is-hidden");
    renderNotePage();
  }

  function closeNotePage() {
    if (noteSaveTimer) {
      clearTimeout(noteSaveTimer);
      noteSaveTimer = null;
      saveOpenNote();
    }
    notePageNodeId = null;
    panel.classList.remove("note-page-open");
    notePage.classList.add("is-hidden");
  }

  function renderNotePage() {
    const node = core.getNode(state, notePageNodeId);
    if (!node) {
      if (notePageNodeId) closeNotePage();
      return;
    }
    notePageTitle.textContent = node.title;
    const sourceDocument = snapshotMarkdown(node.sourceSnapshot);
    const compatibleSource = compatibleStructuredSource(node.noteContent, node.sourceSnapshot, sourceDocument);
    const displayDocument = node.noteEdited && !compatibleSource ? node.noteContent : (compatibleSource || sourceDocument);
    const messageCount = node.sourceSnapshot?.messages?.length || 0;
    notePageMeta.textContent = node.noteEdited && !compatibleSource
      ? t("editedDocument")
      : messageCount ? t("capturedDocument", { count: messageCount })
        : node.sourceUrl ? t("noSnapshot") : t("noOriginalChat");
    if (shadow.activeElement !== noteEditor && noteEditor.value !== displayDocument) {
      noteEditor.value = displayDocument;
    }
    noteEditor.placeholder = t("notePlaceholder");
    noteEditor.setAttribute("aria-label", t("conversationDocument"));
    openOriginalButton.textContent = t("openOriginal");
    importOriginalButton.textContent = t("importOriginal");
    importOriginalButton.classList.toggle("is-hidden", autoSaveEnabled || !node.sourceUrl);
    restoreOriginalButton.textContent = t("restoreOriginal");
    restoreOriginalButton.classList.toggle("is-hidden", !node.noteEdited);
    editDocumentButton.textContent = t(noteDocumentEditing ? "finishEditing" : "editDocument");
    highlightSelectionButton.textContent = t("highlightSelection");
    addInlineNoteButton.textContent = t("addInlineNote");
    openOriginalButton.disabled = !node.sourceUrl;
    closeNoteButton.setAttribute("aria-label", t("closeNote"));
    closeNoteButton.title = t("closeNote");
    renderMarkdownDocument(notePreview, displayDocument);
    notePreview.classList.toggle("is-hidden", noteDocumentEditing);
    noteFormatToolbar.classList.toggle("is-hidden", !noteDocumentEditing);
    noteFormatToolbar.classList.remove("is-selection-toolbar");
    noteEditor.classList.toggle("is-hidden", !noteDocumentEditing);
  }

  function createNoteColorPalette(labelKey, value) {
    const palette = element("div", "note-color-palette");
    palette.dataset.value = value;
    const trigger = button("", `note-color-trigger color-${value}`);
    trigger.setAttribute("aria-label", t(labelKey));
    trigger.setAttribute("aria-expanded", "false");
    const options = element("div", "note-color-options is-hidden");
    trigger.addEventListener("click", () => {
      const opening = options.classList.contains("is-hidden");
      options.classList.toggle("is-hidden", !opening);
      trigger.setAttribute("aria-expanded", String(opening));
    });
    for (const color of ["yellow", "orange", "red", "pink", "purple", "blue", "green"]) {
      const swatch = button("", `note-color-swatch color-${color}`);
      swatch.dataset.color = color;
      swatch.setAttribute("aria-label", color);
      swatch.addEventListener("click", () => {
        palette.dataset.value = color;
        trigger.className = `note-color-trigger color-${color}`;
        options.classList.add("is-hidden");
        trigger.setAttribute("aria-expanded", "false");
      });
      options.append(swatch);
    }
    palette.append(trigger, options);
    return palette;
  }

  async function applyNoteSelectionFormat(format, color = "yellow") {
    if (!noteDocumentEditing || !notePageNodeId) return;
    let start = noteEditor.selectionStart;
    let end = noteEditor.selectionEnd;
    const selected = noteEditor.value.slice(start, end);
    let replacement;
    let selectionStart;
    let selectionEnd;
    if (format === "highlight") {
      const balanced = balanceBoldSelection(noteEditor.value, start, end);
      const normalized = normalizeHighlightSelection(noteEditor.value, balanced.start, balanced.end);
      start = normalized.start;
      end = normalized.end;
      const content = normalized.content || t("highlightSelection");
      replacement = wrapHighlightLines(content, color);
      selectionStart = start + color.length + 3;
      selectionEnd = selectionStart + content.length;
    } else {
      const selectedLineStart = noteEditor.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const selectedLineEnd = noteEditor.value.indexOf("\n", start);
      const lineEnd = selectedLineEnd < 0 ? noteEditor.value.length : selectedLineEnd;
      const selectedLine = noteEditor.value.slice(selectedLineStart, lineEnd).trim();
      const title = (selectedLine || selected || t("noteLabel")).replace(/^\s*(?:[-*+] |\d+\. )/, "");
      start = lineEnd;
      end = start;
      const beforeSelection = noteEditor.value.slice(0, start);
      const insideCodeFence = (beforeSelection.match(/^```/gm) || []).length % 2 === 1;
      const prefix = insideCodeFence ? "\n```\n\n" : (start > 0 && !beforeSelection.endsWith("\n\n") ? "\n\n" : "");
      const suffix = insideCodeFence ? "\n\n```" : (end < noteEditor.value.length && !noteEditor.value.slice(end).startsWith("\n\n") ? "\n\n" : "");
      const placeholder = t("inlineNotePlaceholder");
      replacement = `${prefix}> [!NOTE:${color}]\n> ${title.replace(/\n/g, " ")}\n>\n> ${placeholder}${suffix}`;
      selectionStart = start + replacement.indexOf(placeholder);
      selectionEnd = selectionStart + t("inlineNotePlaceholder").length;
    }
    noteEditor.setRangeText(replacement, start, end, "end");
    noteEditor.focus({ preventScroll: true });
    noteEditor.setSelectionRange(selectionStart, selectionEnd);
    revealNoteEditorSelection(selectionStart);
    if (noteSaveTimer) {
      clearTimeout(noteSaveTimer);
      noteSaveTimer = null;
    }
    noteSaveStatus.textContent = t("noteSaving");
    await saveOpenNote();
  }

  function normalizeHighlightSelection(value, selectionStart, selectionEnd) {
    let start = selectionStart;
    let end = selectionEnd;
    const annotationPattern = /==(?:(?:yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}):)?[\s\S]+?==/gi;
    let expanded = true;
    while (expanded) {
      expanded = false;
      annotationPattern.lastIndex = 0;
      for (const match of value.matchAll(annotationPattern)) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        if (end <= matchStart || start >= matchEnd) continue;
        const nextStart = Math.min(start, matchStart);
        const nextEnd = Math.max(end, matchEnd);
        if (nextStart !== start || nextEnd !== end) expanded = true;
        start = nextStart;
        end = nextEnd;
      }
    }
    const content = value.slice(start, end)
      .replace(/==(?:(?:yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}):)?/gi, "")
      .replace(/==/g, "");
    return { start, end, content };
  }

  function balanceBoldSelection(value, selectionStart, selectionEnd) {
    let start = selectionStart;
    let end = selectionEnd;
    if (start > 0 && value[start - 1] === "*" && value[start] === "*") start -= 1;
    if (end > 0 && value[end - 1] === "*" && value[end] === "*") end += 1;
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex < 0 ? value.length : lineEndIndex;
    const beforeStart = value.slice(lineStart, start);
    if ((beforeStart.match(/\*\*/g) || []).length % 2 === 1) {
      start = lineStart + beforeStart.lastIndexOf("**");
    }
    const beforeEnd = value.slice(lineStart, end);
    if ((beforeEnd.match(/\*\*/g) || []).length % 2 === 1) {
      const closingMarker = value.indexOf("**", end);
      if (closingMarker >= 0 && closingMarker < lineEnd) end = closingMarker + 2;
    }
    return { start, end };
  }

  function wrapHighlightLines(content, color) {
    return markdownModel.wrapHighlightLines(content, color);
  }

  function revealNoteEditorSelection(position) {
    requestAnimationFrame(() => {
      const content = noteEditor.value;
      const totalLines = Math.max(1, content.split("\n").length);
      const selectedLine = content.slice(0, position).split("\n").length;
      const availableScroll = Math.max(0, noteEditor.scrollHeight - noteEditor.clientHeight);
      noteEditor.scrollTop = availableScroll * Math.max(0, selectedLine - 2) / totalLines;
    });
  }

  async function importOpenNoteOriginalContent() {
    const node = core.getNode(state, notePageNodeId);
    if (!node?.sourceUrl || autoSaveEnabled) return;
    if (canonicalChatUrl() !== node.sourceUrl) {
      showToast(t("openOriginalToImport"), true);
      return;
    }
    importOriginalButton.disabled = true;
    importOriginalButton.textContent = t("importingOriginal");
    const imported = await captureCurrentConversationSnapshot(true);
    importOriginalButton.disabled = false;
    importOriginalButton.textContent = t("importOriginal");
    showToast(t(imported ? "originalImported" : "noSnapshot"), !imported);
  }

  function setDocumentEditing(editing) {
    if (!notePageNodeId) return;
    noteDocumentEditing = Boolean(editing);
    if (!noteDocumentEditing) saveOpenNote();
    renderNotePage();
    if (noteDocumentEditing) {
      noteEditor.focus({ preventScroll: true });
      noteEditor.setSelectionRange(noteEditor.value.length, noteEditor.value.length);
    }
  }

  function renderMarkdownDocument(container, markdown) {
    container.replaceChildren();
    const source = normalizeMultilineHighlights(normalizeUnbalancedHighlightBold(String(markdown || "")));
    const blockHighlight = findMultilineHighlight(source);
    if (blockHighlight) {
      const before = source.slice(0, blockHighlight.index);
      const after = source.slice(blockHighlight.index + blockHighlight.full.length);
      if (before.trim()) {
        const beforeContainer = element("div", "markdown-fragment");
        renderMarkdownDocument(beforeContainer, before);
        container.append(beforeContainer);
      }
      const highlightContainer = element("div", "markdown-highlight-block");
      highlightContainer.style.backgroundColor = annotationColorValue(blockHighlight.color, "highlight");
      renderMarkdownDocument(highlightContainer, blockHighlight.content);
      container.append(highlightContainer);
      if (after.trim()) {
        const afterContainer = element("div", "markdown-fragment");
        renderMarkdownDocument(afterContainer, after);
        container.append(afterContainer);
      }
      return;
    }
    const lines = source.split("\n");
    let codeLines = null;
    let list = null;
    let paragraphLines = [];
    const flushList = () => { list = null; };
    const flushParagraph = () => {
      if (!paragraphLines.length) return;
      const paragraph = element("p");
      appendMarkdownInline(paragraph, paragraphLines.join(" "));
      container.append(paragraph);
      paragraphLines = [];
    };
    const appendCode = (content, legacy = false, rich = false) => {
      const pre = element("pre", `markdown-code${legacy ? " markdown-tree-code" : ""}`);
      const code = element("code");
      if (rich) appendTreeHighlights(code, content);
      else code.textContent = content;
      pre.append(code);
      container.append(pre);
    };
    const appendMath = (tex) => {
      const content = String(tex || "").trim();
      if (!content) return;
      container.append(renderMath(content, true));
    };
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^```/.test(line)) {
        flushParagraph();
        flushList();
        if (codeLines) {
          const codeContent = codeLines.join("\n");
          appendCode(codeContent, false, /==(?:(?:yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}):)?/i.test(codeContent));
          codeLines = null;
        } else codeLines = [];
        continue;
      }
      if (codeLines) {
        codeLines.push(line);
        continue;
      }
      const mathBlock = markdownModel.readMathBlock(lines, index);
      if (mathBlock) {
        flushParagraph();
        flushList();
        appendMath(mathBlock.tex);
        index = mathBlock.nextIndex;
        continue;
      }
      if (/^(?:==(?:(?:yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}):)?)?\s*[│|├└┌┬┼─]/i.test(line)) {
        flushParagraph();
        flushList();
        const treeLines = [line];
        while (index + 1 < lines.length) {
          const next = lines[index + 1];
          if (next.trim() && !/^\s*[│|├└┌┬┼─]/.test(next) && !/==$/.test(next.trim())) break;
          treeLines.push(next);
          index += 1;
        }
        appendCode(treeLines.join("\n").replace(/\n\s*\n/g, "\n"), true, true);
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const normalizedHeading = heading[2].trim().toLocaleLowerCase();
        const userLabels = new Set(["you", "你"]);
        const assistantLabels = new Set(["chatgpt"]);
        if (heading[1].length === 2 && (userLabels.has(normalizedHeading) || assistantLabels.has(normalizedHeading))) {
          const role = userLabels.has(normalizedHeading) ? "user" : "assistant";
          const roleRow = element("div", `markdown-role-row role-${role}`);
          roleRow.append(element("span", "markdown-role-badge", heading[2]));
          container.append(roleRow);
          continue;
        }
        const headingNode = element(`h${heading[1].length}`);
        appendMarkdownInline(headingNode, heading[2]);
        container.append(headingNode);
        continue;
      }
      if (/^---+$/.test(line.trim())) {
        flushParagraph();
        flushList();
        container.append(element("hr"));
        continue;
      }
      const item = line.match(/^\s*(?:[-*+] |\d+\. )(.+)$/);
      if (item) {
        flushParagraph();
        const listTag = /^\s*\d+\./.test(line) ? "ol" : "ul";
        if (!list || list.tagName.toLowerCase() !== listTag) {
          list = element(listTag);
          const orderedNumber = line.match(/^\s*(\d+)\./);
          if (listTag === "ol" && orderedNumber) list.start = Number(orderedNumber[1]);
          container.append(list);
        }
        const listItem = element("li");
        appendMarkdownInline(listItem, item[1]);
        list.append(listItem);
        continue;
      }
      if (/^>\s?/.test(line)) {
        flushParagraph();
        flushList();
        const quoteLines = [line.replace(/^>\s?/, "")];
        while (index + 1 < lines.length && /^>\s?/.test(lines[index + 1])) {
          quoteLines.push(lines[index + 1].replace(/^>\s?/, ""));
          index += 1;
        }
        const noteMarker = quoteLines[0].match(/^\[!NOTE(?::(yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}))?\]\s*/i);
        const isNote = Boolean(noteMarker);
        const noteColor = noteMarker?.[1]?.toLowerCase() || "yellow";
        const quote = element(isNote ? "aside" : "blockquote", isNote ? "markdown-note" : "");
        if (isNote) quote.style.backgroundColor = annotationColorValue(noteColor, "note");
        if (isNote) quote.style.borderColor = annotationColorValue(noteColor, "highlight");
        const quoteContent = element("div", isNote ? "markdown-note-content" : "");
        quoteLines[0] = quoteLines[0].replace(/^\[!NOTE(?::(?:yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}))?\]\s*/i, "");
        if (isNote) {
          quoteLines.shift();
          quoteLines.shift();
          if (!quoteLines[0]) quoteLines.shift();
        }
        quoteLines.forEach((quoteLine, quoteIndex) => {
          if (quoteIndex) quoteContent.append(document.createElement("br"));
          appendMarkdownInline(quoteContent, quoteLine);
        });
        quote.append(quoteContent);
        container.append(quote);
      } else if (line.trim()) {
        flushList();
        paragraphLines.push(line.trim());
      } else {
        flushParagraph();
        flushList();
      }
    }
    flushParagraph();
    if (codeLines) {
      appendCode(codeLines.join("\n"));
    }
    if (!container.childElementCount) container.append(element("p", "markdown-empty", t("notePlaceholder")));
  }

  // Typeset with KaTeX, the same engine ChatGPT uses. output:"html" deliberately skips the MathML
  // layer: it is visually hidden but still lands in textContent, which is exactly what smeared
  // every formula into "x=[x1]x = [x_1]x=[x1]" before. Skipping it keeps selection and copy clean.
  function renderMath(tex, display) {
    const source = String(tex || "").trim();
    const host = element(display ? "div" : "span", display ? "markdown-math-block" : "markdown-math-inline");
    const engine = globalThis.katex;
    if (!engine?.render) {
      host.textContent = source;
      return host;
    }
    try {
      engine.render(source, host, { displayMode: display, throwOnError: false, output: "html" });
      host.classList.add("is-typeset");
    } catch (_error) {
      // Malformed LaTeX still reads better as source than as an empty gap.
      host.replaceChildren();
      host.textContent = source;
    }
    return host;
  }

  function findMultilineHighlight(source) {
    return markdownModel.findMultilineHighlight(source);
  }

  function normalizeMultilineHighlights(source) {
    return markdownModel.normalizeMultilineHighlights(source);
  }

  function normalizeUnbalancedHighlightBold(source) {
    return markdownModel.normalizeUnbalancedHighlightBold(source);
  }

  function appendMarkdownInline(parent, source) {
    for (const token of markdownModel.inlineTokens(source)) {
      if (token.type === "text") {
        parent.append(document.createTextNode(token.value));
      } else if (token.type === "highlight") {
        const mark = element("mark", "markdown-highlight");
        mark.style.backgroundColor = annotationColorValue(token.color, "highlight");
        appendMarkdownInline(mark, token.value);
        parent.append(mark);
      } else if (token.type === "strong") {
        parent.append(element("strong", "", token.value));
      } else if (token.type === "code") {
        parent.append(element("code", "markdown-inline-code", token.value));
      } else if (token.type === "link") {
        const link = element("a", "", token.value);
        link.href = token.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.addEventListener("click", (event) => event.stopPropagation());
        parent.append(link);
      } else if (token.type === "em") {
        parent.append(element("em", "", token.value));
      } else if (token.type === "math") {
        parent.append(renderMath(token.value, false));
      }
    }
  }

  function appendTreeHighlights(parent, source) {
    const pattern = /==(?:(yellow|orange|red|pink|purple|blue|green|#[0-9a-f]{6}):)?([\s\S]+?)==/gi;
    let cursor = 0;
    for (const match of String(source || "").matchAll(pattern)) {
      if (match.index > cursor) parent.append(document.createTextNode(source.slice(cursor, match.index)));
      const mark = element("mark", "markdown-highlight", match[2]);
      mark.style.backgroundColor = annotationColorValue(match[1] || "yellow", "highlight");
      parent.append(mark);
      cursor = match.index + match[0].length;
    }
    if (cursor < source.length) parent.append(document.createTextNode(source.slice(cursor)));
  }

  function annotationColorValue(color, kind) {
    return markdownModel.annotationColor(color, kind);
  }

  function snapshotMarkdown(snapshot) {
    const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
    return snapshotMessagesMarkdown(messages);
  }

  function snapshotMessagesMarkdown(messages) {
    return messages.map((message) => {
      const heading = message.role === "user" ? t("you") : t("assistant");
      return `## ${heading}\n\n${message.content}`;
    }).join("\n\n---\n\n");
  }

  function appendSnapshotMessages(content, messages) {
    const addition = snapshotMessagesMarkdown(messages).trim();
    const existing = String(content || "").trimEnd();
    if (!addition) return existing;
    return existing ? `${existing}\n\n---\n\n${addition}` : addition;
  }

  function compatibleStructuredSource(editedContent, snapshot, fullSource) {
    return markdownModel.compatibleStructuredSource(editedContent, snapshot, fullSource);
  }

  function scheduleNoteSave() {
    noteSaveStatus.textContent = t("noteSaving");
    noteSaveStatus.classList.remove("is-error");
    if (noteSaveTimer) clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(() => {
      noteSaveTimer = null;
      saveOpenNote();
    }, 700);
  }

  async function saveOpenNote() {
    const nodeId = notePageNodeId;
    const node = core.getNode(state, nodeId);
    if (!node) return;
    const content = noteEditor.value;
    const sourceDocument = snapshotMarkdown(node.sourceSnapshot);
    const noteEdited = content !== sourceDocument;
    const storedContent = noteEdited ? content : "";
    if (storedContent === node.noteContent && noteEdited === node.noteEdited) {
      noteSaveStatus.textContent = t("noteSaved");
      return;
    }
    const sequence = ++noteSaveSequence;
    const previousContent = node.noteContent;
    const previousEdited = node.noteEdited;
    noteSaveStatus.textContent = t("noteSaving");
    try {
      const response = await sendMessage({
        type: "NOTE_COMMIT",
        nodeId,
        noteContent: storedContent,
        noteEdited
      });
      if (!response?.ok) throw new Error(response?.error || t("noteSaveFailed"));
      state = core.validateState(response.state);
      canUndo = Boolean(response.canUndo);
      canRedo = Boolean(response.canRedo);
      updateHistoryButtons();
      if (sequence === noteSaveSequence) noteSaveStatus.textContent = t("noteSaved");
    } catch (_error) {
      if (sequence === noteSaveSequence) {
        state = core.updateNode(state, nodeId, { noteContent: previousContent, noteEdited: previousEdited });
        noteSaveStatus.textContent = t("noteSaveFailed");
        noteSaveStatus.classList.add("is-error");
      }
    }
  }

  function render() {
    updateSaveChatButton();
    const liveIds = new Set(state.nodes.map((node) => node.id));
    selectedIds = new Set([...selectedIds].filter((id) => liveIds.has(id)));
    if (selectedId && liveIds.has(selectedId)) selectedIds.add(selectedId);
    else if (selectedId) selectedId = null;
    if (selectionAnchorId && !liveIds.has(selectionAnchorId)) selectionAnchorId = selectedId;
    if (notePageNodeId && !liveIds.has(notePageNodeId)) closeNotePage();
    tree.replaceChildren();
    tree.append(createRootDropZone());
    if (addingFolderParentId === null) tree.append(renderInlineFolderEditor(null, 0));
    const currentConversation = core.findConversationByUrl(state, canonicalChatUrl());
    const activePath = {
      currentId: currentConversation?.id || null,
      ids: new Set(core.getNodePath(state, currentConversation?.id).map((node) => node.id))
    };
    const roots = core.getChildren(state, null).filter(matchesSearch);
    if (!roots.length && addingFolderParentId !== null) {
      tree.append(element("div", "empty", searchQuery ? t("noMatches") : t("empty")));
    } else {
      for (const node of roots) tree.append(renderNode(node, 0, activePath));
    }
    renderNotePage();
  }

  function finishTreeDrag() {
    tree.classList.remove("has-tree-drag");
    tree.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((node) => {
      node.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
    });
  }

  function treeElementAtPoint(clientX, clientY) {
    if (typeof shadow.elementFromPoint === "function") {
      return shadow.elementFromPoint(clientX, clientY);
    }
    if (typeof shadow.elementsFromPoint === "function") {
      return shadow.elementsFromPoint(clientX, clientY)[0] || null;
    }
    return null;
  }

  function pointerDropAt(clientX, clientY, sourceIds) {
    const sources = sourceIds.map((id) => core.getNode(state, id)).filter(Boolean);
    const hit = treeElementAtPoint(clientX, clientY);
    const rootZone = hit?.closest?.(".root-drop-zone");
    if (rootZone && sources.some((source) => source.parentId) && sources.every((source) => source.kind !== "annotation")) {
      return { rootZone };
    }
    const targetRow = hit?.closest?.(".tree-row");
    const target = core.getNode(state, targetRow?.dataset.nodeId);
    if (!sources.length || !target || sources.some((source) => source.id === target.id)) return null;
    const bounds = targetRow.getBoundingClientRect();
    const rowRatio = bounds.height ? (clientY - bounds.top) / bounds.height : 0.5;
    if (rowRatio < 0.3 && sources.every((source) => canDropNodeBeside(source, target))) {
      return { target, targetRow, placement: "before" };
    }
    if (rowRatio > 0.7 && sources.every((source) => canDropNodeBeside(source, target))) {
      return { target, targetRow, placement: "after" };
    }
    if (sources.every((source) => canDropNodeOn(source, target))) return { target, targetRow, placement: "child" };
    return null;
  }

  function showPointerDropTarget(dropTarget) {
    tree.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((item) => {
      item.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
    });
    dropTarget?.rootZone?.classList.add("is-drop-target");
    if (dropTarget?.placement === "before") dropTarget.targetRow.classList.add("is-drop-before");
    if (dropTarget?.placement === "after") dropTarget.targetRow.classList.add("is-drop-after");
    if (dropTarget?.placement === "child") dropTarget.targetRow.classList.add("is-drop-target");
  }

  function startTreeMarqueeSelection(event) {
    if (event.button !== 0) return;
    if (event.target.closest(".tree-row, .inline-child-row, .root-drop-zone, button, input, textarea, select")) return;
    const additive = event.metaKey || event.ctrlKey;
    treeMarqueeSelection = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      additive,
      selectedSnapshot: [...selectedIds],
      primarySnapshot: selectedId,
      anchorSnapshot: selectionAnchorId
    };
  }

  function moveTreeMarqueeSelection(event) {
    const selection = treeMarqueeSelection;
    if (!selection || selection.pointerId !== event.pointerId) return;
    if (!selection.moved && Math.hypot(event.clientX - selection.startX, event.clientY - selection.startY) < 4) return;
    if (!selection.moved) {
      selection.moved = true;
      tree.setPointerCapture?.(event.pointerId);
      treeSelectionMarquee.classList.remove("is-hidden");
    }
    event.preventDefault();
    const treeBounds = tree.getBoundingClientRect();
    const currentX = Math.min(treeBounds.right, Math.max(treeBounds.left, event.clientX));
    const currentY = Math.min(treeBounds.bottom, Math.max(treeBounds.top, event.clientY));
    const startX = Math.min(treeBounds.right, Math.max(treeBounds.left, selection.startX));
    const startY = Math.min(treeBounds.bottom, Math.max(treeBounds.top, selection.startY));
    const selectionRect = marqueeModel.rectangle(startX, startY, currentX, currentY);
    const surfaceBounds = panelSurface.getBoundingClientRect();
    treeSelectionMarquee.style.left = `${selectionRect.left - surfaceBounds.left}px`;
    treeSelectionMarquee.style.top = `${selectionRect.top - surfaceBounds.top}px`;
    treeSelectionMarquee.style.width = `${selectionRect.width}px`;
    treeSelectionMarquee.style.height = `${selectionRect.height}px`;

    const rows = [...tree.querySelectorAll(".tree-row[data-node-id]")].map((row) => {
      const rect = row.getBoundingClientRect();
      return {
        id: row.dataset.nodeId,
        rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
      };
    });
    const sweptIds = marqueeModel.selectedIds(rows, selectionRect);
    selectedIds = selection.additive
      ? new Set([...selection.selectedSnapshot, ...sweptIds])
      : new Set(sweptIds);
    selectedId = sweptIds.at(-1) || (selection.additive ? selection.primarySnapshot : null);
    selectionAnchorId = sweptIds[0] || (selection.additive ? selection.anchorSnapshot : null);
    updateRenderedSelection();

    const velocity = dragScroll.verticalVelocity(event.clientY, treeBounds.top, treeBounds.bottom);
    if (velocity) tree.scrollTop += velocity;
  }

  function finishTreeMarqueeSelection(event) {
    const selection = treeMarqueeSelection;
    if (!selection || selection.pointerId !== event.pointerId) return;
    treeMarqueeSelection = null;
    if (tree.hasPointerCapture?.(event.pointerId)) tree.releasePointerCapture(event.pointerId);
    treeSelectionMarquee.classList.add("is-hidden");
    if (!selection.moved) return;
    suppressTreeClick = true;
    setTimeout(() => { suppressTreeClick = false; }, 0);
    tree.focus({ preventScroll: true });
  }

  function cancelTreeMarqueeSelection(event) {
    const selection = treeMarqueeSelection;
    if (!selection || selection.pointerId !== event.pointerId) return;
    treeMarqueeSelection = null;
    if (tree.hasPointerCapture?.(event.pointerId)) tree.releasePointerCapture(event.pointerId);
    selectedIds = new Set(selection.selectedSnapshot);
    selectedId = selection.primarySnapshot;
    selectionAnchorId = selection.anchorSnapshot;
    treeSelectionMarquee.classList.add("is-hidden");
    updateRenderedSelection();
  }

  function stopPointerTreeAutoScroll(drag) {
    if (!drag?.autoScrollFrame) return;
    cancelAnimationFrame(drag.autoScrollFrame);
    drag.autoScrollFrame = null;
  }

  function schedulePointerTreeAutoScroll(drag) {
    if (!drag?.moved || drag.autoScrollFrame) return;
    const tick = () => {
      drag.autoScrollFrame = null;
      if (pointerTreeDrag !== drag || !drag.moved) return;
      const bounds = tree.getBoundingClientRect();
      const velocity = dragScroll.verticalVelocity(drag.clientY, bounds.top, bounds.bottom);
      if (!velocity) return;
      const previousScrollTop = tree.scrollTop;
      tree.scrollTop += velocity;
      if (tree.scrollTop === previousScrollTop) return;
      showPointerDropTarget(pointerDropAt(drag.clientX, drag.clientY, drag.sourceIds));
      drag.autoScrollFrame = requestAnimationFrame(tick);
    };
    drag.autoScrollFrame = requestAnimationFrame(tick);
  }

  function startPointerTreeDrag(event, node, row) {
    if (event.button !== 0 || event.target.closest("button, input, textarea, select, .row-actions")) return;
    const draggingSelection = selectedIds.has(node.id);
    row.focus({ preventScroll: true });
    pointerTreeDrag = {
      pointerId: event.pointerId,
      sourceId: node.id,
      sourceIds: draggingSelection ? selectedRootNodeIds(node.id) : [node.id],
      selectedSnapshot: draggingSelection ? [...selectedIds] : [node.id],
      draggingSelection,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      row,
      moved: false,
      autoScrollFrame: null
    };
  }

  function movePointerTreeDrag(event) {
    const drag = pointerTreeDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.clientX = event.clientX;
    drag.clientY = event.clientY;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!drag.draggingSelection) {
        selectSingleNode(drag.sourceId);
        tree.querySelectorAll(".tree-row.is-selected, .tree-row.is-primary-selected").forEach((row) => {
          row.classList.remove("is-selected", "is-primary-selected");
          row.setAttribute("aria-selected", "false");
        });
      }
      drag.row.setPointerCapture?.(event.pointerId);
      for (const sourceId of drag.sourceIds) {
        const sourceRow = tree.querySelector(`.tree-row[data-node-id="${CSS.escape(sourceId)}"]`);
        sourceRow?.classList.add("is-dragging", "is-selected");
        sourceRow?.setAttribute("aria-selected", "true");
        if (sourceId === drag.sourceId) sourceRow?.classList.add("is-primary-selected");
      }
      tree.classList.add("has-tree-drag");
    }
    event.preventDefault();
    showPointerDropTarget(pointerDropAt(event.clientX, event.clientY, drag.sourceIds));
    schedulePointerTreeAutoScroll(drag);
  }

  async function finishPointerTreeDrag(event) {
    const drag = pointerTreeDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dropTarget = drag.moved ? pointerDropAt(event.clientX, event.clientY, drag.sourceIds) : null;
    stopPointerTreeAutoScroll(drag);
    pointerTreeDrag = null;
    if (drag.row.hasPointerCapture?.(event.pointerId)) {
      drag.row.releasePointerCapture(event.pointerId);
    }
    tree.querySelectorAll(".tree-row.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
    finishTreeDrag();
    if (!drag.moved) return;

    suppressTreeClick = true;
    setTimeout(() => { suppressTreeClick = false; }, 0);
    if (!dropTarget) return;
    try {
      if (["before", "after"].includes(dropTarget.placement)) {
        const moveIds = dropTarget.placement === "after" ? [...drag.sourceIds].reverse() : drag.sourceIds;
        for (const sourceId of moveIds) {
          state = core.moveNodeRelative(state, sourceId, dropTarget.target.id, dropTarget.placement);
        }
      } else if (dropTarget.target) {
        for (const sourceId of drag.sourceIds) state = core.moveNode(state, sourceId, dropTarget.target.id);
        state.collapsedIds = state.collapsedIds.filter((id) => id !== dropTarget.target.id);
      } else {
        for (const sourceId of drag.sourceIds) state = core.moveNode(state, sourceId, null);
      }
      restoreBatchSelection(drag.selectedSnapshot, drag.sourceId);
      await commit();
      render();
      if (dropTarget.rootZone) showToast(t("movedTopLevel"));
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function cancelPointerTreeDrag(event) {
    const drag = pointerTreeDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    stopPointerTreeAutoScroll(drag);
    pointerTreeDrag = null;
    tree.querySelectorAll(".tree-row.is-dragging").forEach((row) => row.classList.remove("is-dragging"));
    finishTreeDrag();
  }

  function canDropNodeOn(source, target) {
    return Boolean(
      source
      && target
      && source.id !== target.id
      && !core.isDescendant(state, target.id, source.id)
      && core.canContain(target.kind, source.kind)
    );
  }

  function canDropNodeBeside(source, target) {
    if (!source || !target || source.id === target.id) return false;
    const parent = target.parentId ? core.getNode(state, target.parentId) : null;
    if (!parent) return source.kind !== "annotation";
    return parent.id !== source.id
      && !core.isDescendant(state, parent.id, source.id)
      && core.canContain(parent.kind, source.kind);
  }

  function createRootDropZone() {
    return element("div", "root-drop-zone", t("moveTopLevel"));
  }

  function matchesSearch(node) {
    if (!searchQuery) return true;
    if (node.title.toLowerCase().includes(searchQuery)) return true;
    return core.getChildren(state, node.id).some(matchesSearch);
  }

  function rowAction(symbol, label, handler, className = "") {
    const action = button(symbol, `row-action${className ? ` ${className}` : ""}`);
    action.setAttribute("aria-label", label);
    action.title = label;
    action.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    action.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return action;
  }

  function createRowActions(node) {
    const actions = element("span", "row-actions");
    actions.addEventListener("pointerdown", (event) => event.stopPropagation());
    actions.addEventListener("click", (event) => event.stopPropagation());
    actions.addEventListener("dblclick", (event) => event.stopPropagation());
    if (["project", "chat", "branch"].includes(node.kind)) {
      const openLabel = isChildChat(node) && !node.sourceUrl ? t("startChat") : t("open");
      actions.append(rowAction("↗", openLabel, () => {
        selectSingleNode(node.id);
        openSelected();
      }, "open-chat"));
    }
    if (core.canContain(node.kind, "chat")) {
      actions.append(rowAction("＋", t("addChild"), () => {
        beginAddChild(node.id);
      }));
    }
    actions.append(rowAction("✎", t("rename"), () => {
      beginRename(node.id);
    }));
    actions.append(rowAction("×", t("remove"), () => {
      beginDelete(node.id);
    }, "danger"));
    return actions;
  }

  function createFolderNodeIcon() {
    const icon = element("span", "node-icon folder");
    icon.appendChild(createFolderGlyph());
    return icon;
  }

  function renderNode(node, depth, activePath) {
    const fragment = document.createDocumentFragment();
    const active = node.id === activePath.currentId;
    const onActivePath = !active && activePath.ids.has(node.id);
    const rootChat = depth === 0 && node.kind === "chat";
    const childChat = isChildChat(node);
    const showsNodeIcon = node.kind !== "chat" || (childChat && depth > 0);
    const iconlessChat = node.kind === "chat" && !showsNodeIcon;
    const selected = selectedIds.has(node.id);
    const primarySelected = selectedId === node.id;
    const row = element("div", `tree-row${rootChat ? " is-root-chat" : ""}${iconlessChat ? " is-iconless-chat" : ""}${selected ? " is-selected" : ""}${primarySelected ? " is-primary-selected" : ""}${onActivePath ? " is-active-path" : ""}${active ? " is-active" : ""}`);
    row.setAttribute("role", "treeitem");
    row.setAttribute("aria-level", String(depth + 1));
    row.setAttribute("aria-selected", String(selected));
    row.tabIndex = -1;
    row.dataset.nodeId = node.id;
    row.style.setProperty("--depth", String(depth));
    if (active) row.setAttribute("aria-current", "page");

    const children = core.getChildren(state, node.id);
    if (children.length) {
      const collapsed = state.collapsedIds.includes(node.id);
      const toggle = button("", "toggle");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? t("expand") : t("collapse"));
      toggle.addEventListener("click", async (event) => {
        event.stopPropagation();
        state = core.toggleCollapsed(state, node.id);
        await persist();
        render();
      });
      row.append(toggle);
    } else {
      row.append(element("span", "toggle-spacer"));
    }

    if (showsNodeIcon) {
      const depthTone = childChat ? ` depth-${depth % 2 === 0 ? "warm" : "cool"}` : "";
      const iconText = childChat && node.sourceUrl ? "●" : ICONS[node.kind];
      const icon = node.kind === "folder"
        ? createFolderNodeIcon()
        : element("span", `node-icon ${node.kind}${depthTone}`, iconText);
      if (node.kind === "branch") icon.appendChild(createBranchGlyph());
      row.append(icon);
    }
    if (deletingNodeId === node.id) {
      row.classList.add("is-confirming-delete");
      const batchHasChildren = [...deletingNodeIds]
        .some((id) => core.getChildren(state, id).length > 0);
      const confirmationText = deletingSelectionCount > 1
        ? t(batchHasChildren ? "removeSelectedConfirmWithChildren" : "removeSelectedConfirm", { count: deletingSelectionCount })
        : t(children.length ? "removeInlineConfirmWithChildren" : "removeInlineConfirm", { title: node.title });
      const confirmation = element("span", "inline-delete-label", confirmationText);
      confirmation.title = confirmationText;
      const actions = element("span", "inline-confirm-actions");
      const confirmButton = button(t("confirmDelete"), "inline-confirm-button danger");
      confirmButton.setAttribute("aria-label", confirmationText);
      const cancelButton = button(t("cancel"), "inline-confirm-button");
      for (const action of [confirmButton, cancelButton]) {
        action.addEventListener("pointerdown", (event) => event.stopPropagation());
        action.addEventListener("click", (event) => event.stopPropagation());
      }
      confirmButton.addEventListener("click", () => confirmDelete(node.id));
      cancelButton.addEventListener("click", () => {
        deletingNodeId = null;
        deletingNodeIds = new Set();
        deletingSelectionCount = 0;
        render();
      });
      actions.append(confirmButton, cancelButton);
      row.append(confirmation, actions);
    } else if (editingNodeId === node.id) {
      row.classList.add("is-editing");
      const input = element("input", "inline-rename-input");
      input.type = "text";
      input.value = node.title;
      input.placeholder = t("renamePrompt");
      input.dataset.nodeId = node.id;
      input.setAttribute("aria-label", t("rename"));
      const actions = element("span", "row-actions inline-edit-actions");
      const confirmRename = rowAction("✓", t("rename"), () => renameNode(node.id, input.value));
      const cancelRename = rowAction("×", t("cancel"), () => {
        editingNodeId = null;
        render();
      });
      for (const action of [confirmRename, cancelRename]) {
        action.classList.add("inline-action");
        action.addEventListener("mousedown", (event) => event.preventDefault());
      }
      actions.append(confirmRename, cancelRename);
      input.addEventListener("pointerdown", (event) => event.stopPropagation());
      input.addEventListener("click", (event) => event.stopPropagation());
      input.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          renameNode(node.id, input.value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          editingNodeId = null;
          render();
        }
      });
      input.addEventListener("blur", () => {
        setTimeout(() => {
          if (keepInlineEditorAfterEarlyBlur(".inline-rename-input", () => editingNodeId === node.id)) return;
          if (editingNodeId === node.id) {
            editingNodeId = null;
            render();
          }
        }, 0);
      });
      row.append(input, actions);
    } else {
      const title = element("span", `node-title${children.length ? " has-children" : ""}`, node.title);
      row.append(title);
      row.append(createRowActions(node));
      row.addEventListener("click", (event) => {
        if (event.target.closest(".row-actions")) return;
        if (addingChildParentId || addingFolderParentId !== undefined) {
          addingChildParentId = null;
          addingFolderParentId = undefined;
          render();
          return;
        }
        const wasDeleting = Boolean(deletingNodeId);
        deletingNodeId = null;
        deletingNodeIds = new Set();
        deletingSelectionCount = 0;
        selectNodeFromEvent(node.id, event);
        tree.focus({ preventScroll: true });
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && node.kind !== "folder") {
          openNotePage(node.id);
        }
        if (wasDeleting) render();
        else updateRenderedSelection();
      });
    }
    row.addEventListener("pointerdown", (event) => startPointerTreeDrag(event, node, row));
    row.addEventListener("pointermove", movePointerTreeDrag);
    row.addEventListener("pointerup", (event) => { finishPointerTreeDrag(event); });
    row.addEventListener("pointercancel", cancelPointerTreeDrag);

    fragment.append(row);
    if (!state.collapsedIds.includes(node.id)) {
      if (addingFolderParentId === node.id) fragment.append(renderInlineFolderEditor(node.id, depth + 1));
      if (addingChildParentId === node.id) fragment.append(renderInlineChildEditor(node, depth + 1));
      for (const child of children.filter(matchesSearch)) fragment.append(renderNode(child, depth + 1, activePath));
    }
    return fragment;
  }

  function renderInlineFolderEditor(parentId, depth) {
    const editor = element("div", "inline-child-row inline-folder-row");
    editor.style.setProperty("--depth", String(depth));
    for (const eventName of ["pointerdown", "click", "dblclick"]) {
      editor.addEventListener(eventName, (event) => event.stopPropagation());
    }
    editor.append(element("span", "toggle-spacer"));
    editor.append(createFolderNodeIcon());

    const input = element("input", "inline-child-input inline-folder-input");
    input.type = "text";
    input.placeholder = t("folderName");
    input.setAttribute("aria-label", t("folderName"));

    const confirmFolder = rowAction("✓", t("addFolder"), () => addFolderNode(parentId, input.value));
    const cancelFolder = rowAction("×", t("cancel"), () => {
      addingFolderParentId = undefined;
      render();
    });
    for (const action of [confirmFolder, cancelFolder]) {
      action.classList.add("inline-action");
      action.addEventListener("mousedown", (event) => event.preventDefault());
    }

    input.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        addFolderNode(parentId, input.value);
      } else if (event.key === "Escape") {
        event.preventDefault();
        addingFolderParentId = undefined;
        render();
      }
    });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (keepInlineEditorAfterEarlyBlur(".inline-folder-input", () => addingFolderParentId === parentId)) return;
        if (addingFolderParentId === parentId) {
          addingFolderParentId = undefined;
          render();
        }
      }, 0);
    });

    editor.append(input, confirmFolder, cancelFolder);
    return editor;
  }

  function renderInlineChildEditor(parent, depth) {
    const editor = element("div", "inline-child-row");
    editor.style.setProperty("--depth", String(depth));
    for (const eventName of ["pointerdown", "click", "dblclick"]) {
      editor.addEventListener(eventName, (event) => event.stopPropagation());
    }
    editor.append(element("span", "toggle-spacer"));
    editor.append(element("span", `node-icon chat depth-${depth % 2 === 0 ? "warm" : "cool"}`, "○"));

    const input = element("input", "inline-child-input");
    input.type = "text";
    input.placeholder = t("childName");
    input.setAttribute("aria-label", t("childName"));

    const confirm = rowAction("✓", t("addChild"), () => addChildNode(parent.id, input.value));
    const cancel = rowAction("×", t("cancel"), () => {
      addingChildParentId = null;
      render();
    });
    confirm.classList.add("inline-action");
    cancel.classList.add("inline-action");
    for (const action of [confirm, cancel]) {
      action.addEventListener("mousedown", (event) => event.preventDefault());
    }

    input.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        addChildNode(parent.id, input.value);
      } else if (event.key === "Escape") {
        event.preventDefault();
        addingChildParentId = null;
        render();
      }
    });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (keepInlineEditorAfterEarlyBlur(".inline-child-input:not(.inline-folder-input)", () => addingChildParentId === parent.id)) return;
        if (addingChildParentId === parent.id) {
          addingChildParentId = null;
          render();
        }
      }, 0);
    });

    editor.append(input, confirm, cancel);
    return editor;
  }

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.remove("is-hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("is-hidden"), 3600);
  }
})();
