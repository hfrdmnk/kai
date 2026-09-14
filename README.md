# 回 kai

A UI annotation tool for developers and AI coding agents.

## What is kai?

Click any element on a web page, describe what should change, and export structured feedback as Markdown. kai runs entirely client-side as a single Web Component — zero dependencies, nothing to install.

The name 回 (kai) is Japanese for "turn," as in a turn in a cycle. Annotate what needs to change, hand it to your coding agent, and move on to the next iteration.

## Features

- Zero dependencies, ~60 kB self-contained script
- Works on any website via bookmarklet — lives in your bookmark bar
- Closed Shadow DOM — fully isolated from host page styles
- Smart element selection with hover highlight, breadcrumb paths, and computed styles (px→rem)
- CSS variable autocomplete — type `--` to browse the page's custom properties
- Measurement mode (<kbd>Alt</kbd>): crosshair with dimensions, text metrics, selection rectangle
- Pass-through mode (hold <kbd>Cmd</kbd> / <kbd>Ctrl</kbd>): interact with the page without leaving the annotator
- Copy any element's selector with the cursor action bubble
- Markers with automatic clustering for dense annotations
- Session persistence via localStorage — survives reloads
- Export as Markdown (optimized for AI agents)
- Keyboard-first — every interaction reachable without a mouse

## Get started

### Bookmarklet

[![Add kai bookmarklet](https://img.shields.io/badge/kai-Add_Bookmarklet-ff5500?style=for-the-badge)](https://hfrdmnk.github.io/kai/)

> Visit the link above and drag the **kai** button to your bookmark bar.

<details>
<summary>Raw bookmarklet code</summary>

```
javascript:void((()=>{if(document.querySelector('ui-annotator')){document.querySelector('ui-annotator').toggle();return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/hfrdmnk/kai@latest/dist/kai.min.js';document.head.appendChild(s)})())
```

</details>

### Script tag

Alternatively, you can also add this script tag to your project and render it conditionally in dev mode:

```html
<script src="https://cdn.jsdelivr.net/gh/hfrdmnk/kai@latest/dist/kai.min.js"></script>
```

## How it works

1. **Activate** — click the bookmarklet and activate kai by clicking on the asterisk icon
2. **Select** — hover over elements to see selector paths, computed styles, and dimensions
3. **Annotate** — click an element, describe what should change, save
4. **Repeat** — annotate as many elements as needed
5. **Export** — copy as Markdown and paste into your AI coding agent

### Measurement mode

Hold <kbd>Alt</kbd> to enter measurement mode. A crosshair follows your cursor showing element dimensions. Hold <kbd>Shift</kbd> additionally to see text metrics. Click and drag to measure arbitrary distances.

### Pass-through mode

While kai is active, clicks never reach the page. Hold <kbd>Cmd</kbd> (Mac) or <kbd>Ctrl</kbd> (Windows/Linux) to interact with the page normally, for example to open a modal, then release to annotate what appeared.

### Selecting a covered parent

When a child fills its parent (a link wrapping a card, a span filling a button), press <kbd>↑</kbd> while hovering to move the highlight to the parent and <kbd>↓</kbd> to go back down.

### Copy a selector

Click the cursor bubble next to the FAB, then click any element. Its selector lands on the clipboard and the bubble shows a check.

## Keyboard shortcuts

Every action has a keyboard path. The single-key shortcuts apply while kai is active and no text field has focus; the FAB button tooltips show them too.

| Shortcut | Context | Action |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> | Anywhere | Toggle kai on / off |
| <kbd>Esc</kbd> | Active | Close settings → cancel pick mode → deactivate, whichever applies first |
| <kbd>S</kbd> | Active | Toggle copy-selector pick mode |
| <kbd>M</kbd> | Active, has annotations | Copy all annotations as Markdown |
| <kbd>⌫</kbd> / <kbd>Del</kbd> | Active, has annotations | Clear all: first press arms, second press within 3 s confirms |
| <kbd>,</kbd> | Active | Toggle settings |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> (hold) | Active | Pass-through: interact with the page |
| <kbd>Alt</kbd> (hold) | Active | Measurement mode |
| <kbd>Alt</kbd>+<kbd>Shift</kbd> (hold) | Active | Measurement mode with text metrics |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Element hovered | Move highlight to parent / back down |
| <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> | Annotation popover | Save annotation |
| <kbd>Esc</kbd> | Annotation popover | Close popover |
| <kbd>Tab</kbd> / <kbd>Enter</kbd> | Autocomplete open | Accept suggestion |
| <kbd>Arrow keys</kbd> | Settings open | Move between theme and accent options |

## FAQ

**What inspired kai?**
[agentation.dev](https://agentation.dev) — a great annotation tool for AI agents with MCP integration and bidirectional agent communication. But it requires `npm install` into your project and leans React-first. I wanted something that works on _any_ site. Just a bookmarklet you drag to your toolbar and use anywhere.

**Can I adapt this?**
Yes, it's MIT licensed. Fork away.

**Bug or feedback?**
[Open an issue](https://github.com/hfrdmnk/kai/issues) or email hi [at] dominikhofer [dot] me.

## Changelog

[Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
