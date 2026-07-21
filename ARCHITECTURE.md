# ChatNotion — Architecture & Internals

> Developer reference. For setup and the project overview, see [README.md](README.md).

# Architecture

## Runtime model

ChatNotion is a Manifest V3 extension with three execution areas:

1. The content script renders the Shadow DOM panel and adapts the visible ChatGPT interface.
2. The background service worker owns durable storage, history, cross-tab synchronization, backup validation, and scheduled backups.
3. The extension backup page obtains user-granted directory access for automatic backups.

There is no backend, and the extension content security policy blocks network connections from extension pages.

## Source modules

| File | Responsibility |
| --- | --- |
| `src/content.js` | ChatGPT DOM adapter, panel controller, tree rendering, drag/drop, selection, and user flows |
| `src/background.js` | Storage RPC, Undo/Redo snapshots, cross-tab broadcasts, import/export, and alarms |
| `src/core.js` | Versioned tree model, validation, migration, node operations, and URL parsing |
| `src/markdown.js` | DOM-free Markdown tokenizing, highlight normalization, and math-fence parsing |
| `src/outline.js` | Local heading/list extraction and depth limiting |
| `src/prompts.js` | Tree-mode and child-chat Prompt composition |
| `src/custom-tools.js` | Custom Prompt normalization |
| `src/history.js` | Bounded immutable Undo/Redo helpers |
| `src/content-store.js` | IndexedDB storage and hydration for Node documents and captured conversation snapshots |
| `src/branch-policy.js` | Visibility rules for the Generate tree answer action |
| `src/drag-scroll.js` | Drag-edge scrolling calculations |
| `src/marquee.js` | Selection rectangle geometry |
| `src/auto-backup.js` | Backup schedule normalization, rotation rules, and directory-handle storage |
| `src/backup.html` / `backup.js` | Explicit directory picker and permission handoff |
| `src/panel.css` / `backup.css` | Panel and backup-page presentation |
| `src/vendor/katex/` | Vendored KaTeX (MIT), woff2 fonts only |

Small pure modules use a browser/Node-compatible wrapper so the same code runs in the extension and in unit tests without a bundler. Keeping text processing free of DOM access is what makes it directly testable.

## Data model

The current schema version is 10. Every visible record is either a folder or a generic conversation-capable node. Legacy Section and Topic records migrate to generic Chat nodes while preserving hierarchy. Workspace state also records canonical URLs that the user deliberately removed, so automatic saving does not recreate them until the user chooses **Save current chat**.

```ts
interface TreeNode {
  id: string;
  kind: string;
  parentId: string | null;
  title: string;
  sourceUrl?: string;
  parentConversationUrl?: string;
  sourceMessageIndex?: number;
  sourceMessageHash?: string;
  status: "idea" | "pending" | "ready";
  prompt?: string;
  noteContent: string;
  noteEdited: boolean;
  sourceSnapshot: ConversationSnapshot;
  bodyStored: boolean;
  position: number;
  createdAt: number;
  updatedAt: number;
}
```

`sourceSnapshot` is the locally captured source conversation. Automatic capture follows the user-facing **Conversation auto save** setting; when it is off, opening an existing Node does not capture its body unless the user explicitly imports the ChatGPT content. The Node Page converts captured messages into one Markdown document. `noteContent` remains empty until the user edits that document, then stores only the edited override. Later source refreshes never overwrite an edited document, and editing never changes ChatGPT. `bodyStored` indicates that the large body is held separately in IndexedDB while the lightweight tree retains only its reference.

Status remains an internal lifecycle detail. The UI communicates only whether a real conversation is linked.

## Math rendering

ChatGPT renders formulas with KaTeX, which emits each formula three times over: a MathML tree, a `<annotation encoding="application/x-tex">` holding the TeX source, and the visual HTML. Reading `textContent` therefore concatenates all three. Capture instead reads the annotation and emits `$…$` for inline math and `$$…$$` for display math, so stored notes hold clean, valid LaTeX.

Rendering uses the vendored KaTeX with `output: "html"`, deliberately skipping the MathML layer: it is visually hidden but still lands in `textContent`, which is what caused the original smearing. Skipping it keeps selection and copy clean inside the Note preview. KaTeX runs with its default `trust: false`, so constructs such as `\href` stay disabled.

Highlight markers wrap whole lines, so highlighting a `$$` display block hides its fence and the block falls back to showing its LaTeX source. This is cosmetic and fully reversible—removing the highlight restores typesetting.

## Storage and synchronization

- Lightweight organizer state, preferences, and bounded history metadata live in `chrome.storage.local`.
- Node documents and captured conversation snapshots live in extension-owned IndexedDB and are hydrated only when needed.
- Extension storage is restricted to trusted extension contexts.
- Content scripts communicate with the background through one reconnectable runtime port.
- The background broadcasts relevant storage changes to every connected ChatGPT tab.
- Undo and Redo store at most ten compact workspace patches and include Prompt settings. Note edits store only their before/after text; unchanged conversation bodies are not copied into workspace patches.
- Normal extension reloads preserve storage; uninstalling the extension removes its local storage unless the user has made a separate backup.

## Conversation flows

### Child conversation

```text
Tree node
  → explicit open/start action
  → new ChatGPT chat
  → prefilled customizable Prompt
  → user sends the question
  → Assistant answer becomes stable
  → linked node is marked complete internally
```

### Native ChatGPT branch recognition

ChatNotion does not add its own branch action or immediately create a visible node. When the user selects ChatGPT's visible native branch command on an already organized conversation, ChatNotion stores temporary parent metadata and claims the resulting canonical URL. The branch becomes a child only after its user-message count exceeds the count inherited from the branch point. Untouched branches remain absent from the workspace.

## Backup design

Manual and automatic backups use format `chatnotion-local-backup`, version 2. Before export, the workspace is hydrated, so a backup contains organizer metadata, preferences, edited Node documents, and captured conversation source text. Backups remain local and are written only when the user explicitly exports one or enables automatic backup for a chosen folder. Version 1 backups remain importable.

Automatic backup:

- is disabled by default;
- uses `chrome.alarms` rather than continuous polling;
- stores the user-selected directory handle in extension-owned IndexedDB;
- checks the directory and write permission before every run;
- reads the current folder name from the saved handle so an external rename is reflected in Settings;
- clears a stale displayed name and asks the user to choose again if the directory handle becomes unavailable;
- writes timestamped JSON snapshots;
- deletes only older files with the ChatNotion automatic-backup prefix;
- preserves unrelated files in the selected folder.

Imported backups do not replace the current device's directory handle, schedule, or retention settings. When automatic backup is active, a successful restore immediately writes the restored workspace as the latest snapshot.

## Failure boundaries

- Invalid storage messages return explicit errors.
- Invalid backups do not modify current data.
- Extension-context invalidation stops content-script RPC instead of generating repeated unhandled rejections; the page must be refreshed after reloading an unpacked extension.
- Removing a ChatNotion node never deletes the corresponding ChatGPT conversation.
- ChatGPT deletion detection clears local URL links while preserving the user's tree title and position.

---

# Development

Requirements: Node.js 20 or newer and a Chromium-based browser. There are no dependencies and no
bundler, so there is nothing to install.

```bash
node --test                     # run the test suite
bash scripts/check.sh           # syntax-check every module, then run the tests
bash scripts/build-release.sh   # build dist/ChatNotion-<version>/ and the matching .zip
```

`build-release.sh` deletes and recreates `dist/` from `manifest.json`, `LICENSE`, `PRIVACY.md`, `src/`, and `icons/`, taking the version number from `manifest.json`. `dist/` is a build artifact and is not committed—never edit it directly, because the next build overwrites it. Run `node --test` without a path argument; passing `node --test tests/` fails to resolve the directory.

## Repository layout

```text
manifest.json        Extension manifest; also the source of the version number
src/                 Extension runtime and UI
src/vendor/katex/    Vendored KaTeX (MIT)
tests/               Node-based unit and integration tests
icons/               Extension and product icons
scripts/             Release packaging
docs/                Landing page, served by GitHub Pages
dist/                Build output (generated, not committed)
```

`docs/` holds the static landing page only; it is not part of the extension package and is
ignored by the build script. It is named `docs/` because GitHub Pages can publish from a
branch only at the repository root or `/docs`—no other folder name is accepted. To serve it,
set **Settings → Pages** to the `main` branch and the `/docs` folder. To preview it locally:

```bash
cd docs && python3 -m http.server 8777
```

## Testing notes

Tests cover migrations, tree operations, Markdown and math parsing, Prompt composition, cross-tab storage behavior, backup validation and rotation, selection geometry, parsing, and answer-action visibility policy.

`tests/content-settings.test.js` asserts against the *source text* of `content.js` rather than executing it. Those assertions break on harmless refactors and prove little about runtime behavior; prefer extracting logic into a DOM-free module and testing it directly, as `src/markdown.js` and `tests/markdown.test.js` do.

Manual release testing must also cover the real ChatGPT DOM, project-chat URLs, extension reload, browser restart, backup permission renewal, and Chrome Web Store upgrade behavior.

## Known limitations

- ChatGPT interface changes may require DOM-adapter updates.
- ChatNotion does not reconstruct every historical branch created before installation.
- Answer extraction is local and heuristic; poorly structured prose may need Tree mode first.
- Concurrent branch creation in several tabs can still be ambiguous.
- Most of `content.js` has no behavior tests; only the extracted Markdown layer is directly covered.

---
