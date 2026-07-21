# Privacy Policy

Last updated: 2026-07-19

ChatNotion is a local browser extension. Its single purpose is to help users organize ChatGPT chats into editable knowledge trees and edit the original answers into their own private notes.

ChatNotion is open source under the [MIT License](LICENSE). Every claim in this policy can be verified against the published source code.

## Data handled by the extension

The extension may process the following information on the user's device:

- Titles and URLs of ChatGPT conversations the user chooses to organize.
- User-authored Node Notes.
- Text of user and Assistant messages from an organized conversation after the user visits that conversation. This local source snapshot initializes the node's editable document and is refreshed only from visible, loaded ChatGPT page content.
- The source message's position and a one-way SHA-256 hash used to prevent duplicate extraction.
- Folder, conversation, native branch, and nested child relationships created by the user.
- The user's English or Chinese interface preference.
- User-authored Prompt tools and extension preferences such as collapsed nodes, panel bounds, and launcher position.

The extension does not request, read, store, or transmit ChatGPT passwords, authentication cookies, access tokens, payment information, or unrelated browsing history.

## Local processing and storage

All processing takes place in the user's browser. Organizer data is stored with Chrome's local extension storage. The extension has no developer-operated backend, analytics service, advertising SDK, crash-reporting service, or remote logging endpoint.

No organizer data is transmitted to the developer or to third parties.

The extension executes no remotely hosted code. Its content security policy blocks network connections from extension pages. Third-party code is limited to [KaTeX](https://katex.org/), which renders mathematical formulas and is bundled inside the extension package together with its fonts; it is loaded from the extension itself and makes no network requests.

## Permissions

- `storage`: stores the user's organizer tree, Node Notes, visited conversation text snapshots, and backup preferences locally.
- `alarms`: runs optional automatic backups at the interval selected by the user.
- `unlimitedStorage`: allows larger locally captured conversation snapshots and edited Node documents to remain on the user's device without Chrome's small extension-storage quota. It does not grant network or website access.
- Access to `https://chatgpt.com/*`: displays the organizer and reads only visible page content needed to save conversation links, capture organized conversations locally, recognize a user-invoked native branch action, and extract user-requested knowledge trees.

The extension does not request access to cookies, browser history, all websites, web requests, identity, camera, microphone, or location.

## Retention and deletion

Data remains in the browser until the user removes individual organizer nodes, clears the extension's local storage through Chrome, or uninstalls the extension. Deleting an organizer node does not delete the corresponding ChatGPT conversation.

ChatNotion creates a manual local backup only when the user selects **Local backup**. Automatic backup is off by default and begins only after the user chooses an interval and grants access to a specific local folder. ChatNotion writes only to that folder, keeps only the selected number of recent automatic snapshots, and never uploads these files. Backup files contain the complete local workspace, including edited node documents and locally captured conversation source text, as well as node titles, Chat links, tree relationships, Prompt tools, and settings. Restore files are validated before the current local workspace is changed.

## User control

Users can remove organizer nodes in the interface, clear the extension's local storage through Chrome, or uninstall the extension to remove its local data.

## Project website

The project website at <https://jennieli101019-jpg.github.io/ChatNotion/> is a static page hosted by GitHub Pages. It sets no cookies, runs no analytics, and stores only the user's language choice in the browser's own `localStorage`.

The demo video is shown as a still image with a play button. Nothing is requested from YouTube while the page is simply viewed or scrolled. The player is loaded from `youtube-nocookie.com` only after the visitor presses play; from that point YouTube receives the visitor's IP address and request headers, as with any embedded video. A visitor who never presses play never contacts YouTube.

This website behavior is separate from the extension, which makes no network requests at all.

## Changes

Any future feature that transmits or synchronizes user data will be opt-in, prominently disclosed before activation, and documented here before release. The local-only default will remain available.

## Contact

Privacy questions can be filed as issues at <https://github.com/jennieli101019-jpg/ChatNotion/issues>. Users should never include private conversation content in an issue.
