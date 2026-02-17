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
- Markers with automatic clustering for dense annotations
- Session persistence via localStorage — survives reloads
- Export as Markdown (optimized for AI agents)
- Keyboard-first — every interaction reachable without a mouse

## Get started

### Bookmarklet

Drag this link to your bookmark bar:

```
javascript:void((()=>{if(document.querySelector('ui-annotator')){document.querySelector('ui-annotator').toggle();return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/hfrdmnk/kai@latest/dist/kai.min.js';document.head.appendChild(s)})())
```

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
