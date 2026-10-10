# 回 kai

A UI annotation tool for developers and AI coding agents.

## What is kai?

Click any element on a web page, describe what should change, and export structured feedback as Markdown. kai runs entirely client-side as a single Web Component inside a small Chrome extension, with zero dependencies.

The name 回 (kai) is Japanese for "turn," as in a turn in a cycle. Annotate what needs to change, hand it to your coding agent, and move on to the next iteration.

## Features

- Zero dependencies, one self-contained script
- Works on any website via a Chrome extension: one click in the toolbar, no host permissions
- Closed Shadow DOM — fully isolated from host page styles
- Smart element selection with hover highlight, breadcrumb paths, and computed styles (px→rem)
- CSS variable autocomplete — type `--` to browse the page's custom properties
- Measurement mode (<kbd>Alt</kbd>): crosshair with dimensions, text metrics, box model (padding, margin, flex/grid gaps), selection rectangle
- Interaction mode (<kbd>I</kbd>): interact with the page without leaving the annotator
- Shortcut reference (<kbd>?</kbd>): see shortcuts for every mode in one panel
- Copy any element's selector with the cursor action bubble
- Markers with automatic clustering for dense annotations
- Session persistence via localStorage — survives reloads
- Export as Markdown (optimized for AI agents)
- Keyboard-first — every interaction reachable without a mouse

## Get started

### Chrome extension

kai isn't on the Chrome Web Store. Install it locally as an unpacked extension:

1. Download [`kai-extension.zip`](https://github.com/hfrdmnk/kai/releases/latest/download/kai-extension.zip) from the latest release and unzip it
2. Open `chrome://extensions` and turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the unzipped folder
4. Pin kai from the puzzle-piece menu so the icon stays in your toolbar

To update, replace the folder's contents with the new release (for example `unzip -o kai-extension.zip -d path/to/your/kai-folder`) and click the reload icon on kai's card in `chrome://extensions`. Unzipping by double-click creates a new folder instead, so Chrome would keep loading the old one.

kai can't run on Chrome's own pages (`chrome://…`) or the Chrome Web Store; clicking the icon there shows a `!` badge. For local `file://` pages, turn on **Allow access to file URLs** in kai's details.

#### From source

```bash
bun install
bun run build   # writes the unpacked extension to dist/extension/
```

Then load `dist/extension/` as above.

#### Amp orbs

`.agents/setup` installs development dependencies from `bun.lock` using the Bun and Node.js
toolchains included in Amp orbs. Amp snapshots the prepared environment so matching fresh
orbs skip setup; when setup runs again, Bun reuses installed dependencies and its package cache.
No secrets, backing services, or resume hook are required. Run `bun run build` to validate the
checkout or `bun run dev` to start the development server.

To run the browser regression check, install `agent-browser` and its Chromium browser, then run
`bun run build && bun scripts/check-interaction.ts`. It tests the packaged extension bundle.

## How it works

1. **Activate** — click the kai icon in the toolbar (click again to turn it off)
2. **Select** — hover over elements to see selector paths, computed styles, and dimensions
3. **Annotate** — click an element, describe what should change, save
4. **Repeat** — annotate as many elements as needed
5. **Export** — copy as Markdown and paste into your AI coding agent

### Measurement mode

Hold <kbd>Alt</kbd> to enter measurement mode. A crosshair follows your cursor showing element dimensions. Hold <kbd>Shift</kbd> additionally to see text metrics. Tap <kbd>Ctrl</kbd> while holding Alt to toggle the box model: padding in the accent color, margin and flex/grid gaps hatched, with values in px and rem. It stays on until you release Alt. Shift and the box model combine. <kbd>↑</kbd> / <kbd>↓</kbd> move whatever you're measuring to the parent or child, and the selection carries across annotating, measuring and the box model as long as you keep the mouse still. The first mouse move after switching goes back to the innermost element. Click and drag to measure arbitrary distances.

### Interaction mode

While kai is in annotation mode, page clicks and keyboard input are blocked. Press <kbd>I</kbd> to
switch to interaction mode: links, inputs, popovers, and dialogs work normally, with no modifier
held. Press <kbd>I</kbd> again to annotate what appeared. In a text field, use the
pointer button beside kai instead; typing `I` or `?` does not switch modes or open help.

Press <kbd>?</kbd> (or choose **Keyboard shortcuts** in settings) for shortcuts in every mode. Escape closes the
shortcut panel. In interaction mode, other shortcuts—including Escape—belong to the page.
The HUD fades out when hovered and never intercepts pointer events, so elements beneath it
remain selectable. Interaction and selector-pick buttons sit together beside the FAB; their
pointer-hand and selector icons use Hugeicons Stroke Rounded, embedded as local SVGs with no runtime dependency.

### Selecting a covered parent

When a child fills its parent (a link wrapping a card, a span filling a button), press <kbd>↑</kbd> while hovering to move the highlight to the parent and <kbd>↓</kbd> to go back down.

### Copy a selector

Click the cursor bubble next to the FAB, then click any element. Its selector lands on the clipboard and the bubble shows a check.

## Keyboard shortcuts

Every action has a keyboard path. Annotation shortcuts apply in annotation/inspection/selector
mode with no text field focused; the FAB button tooltips show them too. `I` and `?` also work in
interaction mode outside text fields.

| Shortcut | Context | Action |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> | Any tab | Toggle kai on / off (extension shortcut, change it at `chrome://extensions/shortcuts`) |
| <kbd>Esc</kbd> | Annotation mode | Close help / panel / settings → cancel pick mode → deactivate, whichever applies first |
| <kbd>Esc</kbd> | Interaction mode | Dismiss the page's topmost overlay |
| <kbd>S</kbd> | Active | Toggle copy-selector pick mode |
| <kbd>M</kbd> | Active, has annotations | Copy all annotations as Markdown |
| <kbd>⌫</kbd> / <kbd>Del</kbd> | Active, has annotations | Clear all: first press arms, second press within 3 s confirms |
| <kbd>,</kbd> | Active | Toggle settings |
| <kbd>I</kbd> | Active, outside text fields | Toggle interaction / annotation mode (also a button beside kai) |
| <kbd>?</kbd> | Active, outside text fields | Toggle shortcut reference for all modes |
| <kbd>Alt</kbd> (hold) | Active | Measurement mode |
| <kbd>Alt</kbd>+<kbd>Shift</kbd> (hold) | Active | Measurement mode with text metrics |
| <kbd>Ctrl</kbd> (tap, holding <kbd>Alt</kbd>) | Measurement mode | Toggle the box model (combines with <kbd>Shift</kbd>) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Element hovered, annotating or measuring | Move highlight / measurement to parent / back down |
| <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> | Annotation popover | Save annotation |
| <kbd>Esc</kbd> | Annotation popover | Close popover |
| <kbd>Tab</kbd> / <kbd>Enter</kbd> | Autocomplete open | Accept suggestion |
| <kbd>Tab</kbd> | px→rem suggestion shown | Accept the rem value (<kbd>Enter</kbd> inserts a newline); without one, move focus |
| <kbd>Arrow keys</kbd> | Settings open | Move between theme and accent options |

## FAQ

**What inspired kai?**
[agentation.dev](https://agentation.dev) — a great annotation tool for AI agents with MCP integration and bidirectional agent communication. But it requires `npm install` into your project and leans React-first. I wanted something that works on _any_ site. Just a toolbar button you click and use anywhere.

**Can I adapt this?**
Yes, it's MIT licensed. Fork away.

**Bug or feedback?**
[Open an issue](https://github.com/hfrdmnk/kai/issues) or email hi [at] dominikhofer [dot] me.

## Changelog

[Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
