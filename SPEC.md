# kai — Product Specification

<section name="overview">

## Overview

kai is a framework-agnostic, zero-dependency UI annotation tool built as a single Web Component. Developers activate it on any web page — via a `<script>` tag or bookmarklet — to click elements, write feedback, and export structured annotation data for AI coding agents or design review.

The tool injects itself into the page, runs entirely client-side, and outputs JSON or Markdown that includes CSS selectors, computed styles, element paths, and human feedback — giving AI agents the exact context they need to find and fix UI issues without guessing.

</section>

<section name="concepts">

## Core Concepts

### Bookmarklet-first
kai works on any website, not just your own dev server. The primary distribution is a single JS file injectable via bookmarklet. No npm install required for end users.

### Web Component with Shadow DOM
All UI (toolbar, panel, drawer, markers) lives inside a `<ui-annotator>` custom element with a closed shadow root. Styles are fully isolated from the host page and vice versa.

### Session persistence
Annotations survive page reloads. Sessions are stored in `localStorage` keyed by `origin + pathname`. A URL hash can be used to share/restore sessions.

### Keyboard-first
Every interaction in the panel and drawer is reachable via keyboard. Mouse is supported but not required once the tool is activated.

### Framework-agnostic
No React, no Svelte, no Vue. Pure vanilla TypeScript compiled to a single IIFE bundle.

</section>

<section name="features">

## Features

### Element Selection & Inspection
- Activate with FAB button (bottom-right) or `Ctrl+Shift+A`
- Hover highlights elements with a bounding box overlay and a tooltip showing `tag#id.class`
- Click any element to open the annotation panel
- Panel displays:
  - CSS selector (minimal, unique)
  - Element path breadcrumb (e.g. `div.wrapper › section.hero › h1`)
  - Computed styles (font-size, color, padding, margin, border-radius, etc.) with px→rem conversion shown inline

### Annotation Authoring
- Textarea for writing feedback
- **CSS variable autocomplete**: When the user types `--`, harvest all CSS custom properties from the page's stylesheets available for the selected element. Show a dropdown with variable names, resolved values, and color swatches for color values. Navigate with arrow keys, accept with Tab/Enter.
- **px→rem conversion**: When the user types a value like `16px`, show an inline suggestion (e.g. `→ 1rem`) that can be accepted with Tab, replacing the px value.
- Submit with `Cmd+Enter` (Mac) or `Ctrl+Enter`

### Annotation Management
- Numbered markers appear on annotated elements (repositioned on scroll/resize)
- Drawer lists all annotations with selector and comment preview
- Click an annotation in the drawer to scroll the page to that element
- Remove individual annotations or clear all
- Keyboard navigation: Tab between items, Enter to scroll, Delete/Backspace to remove

### Export
- **JSON**: Structured object with url, viewport dimensions, timestamp, and annotation array (each with selector, path, intent, styles, rect, comment)
- **Markdown**: Formatted for pasting into AI coding agents — headings per annotation with selector as code, styles listed, feedback quoted
- Copy to clipboard with inline button feedback (icon swap + color change, auto-reset)

### Session Persistence
- Annotations saved to `localStorage` under key `ui-annotator:{origin}{pathname}`
- Sessions load automatically when the tool initializes on a page with prior data
- Clear session button in the drawer

</section>

<section name="data">

## Data Types

```typescript
type Annotation = {
  id: string;
  selector: string;                    // Minimal unique CSS selector
  path: string;                        // Human-readable breadcrumb (tag.class › tag.class)
  comment: string;                     // User's feedback text
  styles: Record<string, string>;      // Relevant computed styles
  rect: { x: number; y: number; w: number; h: number };
  createdAt: string;                   // ISO timestamp
};

type ExportPayload = {
  url: string;
  viewport: { width: number; height: number };
  exportedAt: string;
  annotations: Annotation[];
};
```

</section>

<section name="design">

## Design System

### Theme
Light/Dark, very clean & minimal. Inspired by Dieter Rams and iA Writer.

### Typography
- **UI text**: System sans-serif stack
- **Code / selectors**: System monospace stack

### Border radius
Three tiers: small, medium, and large — applied consistently by element role.

### Animations
Subtle transitions on hover/focus, slightly longer for panel open/close transforms. No spring physics, no bounce.

### FAB
Touch-target-sized button, corner-positioned, fixed. Shows annotation count badge when > 0.

### Z-index strategy
All kai UI layers sit at the top of the stacking context, above any host page content. Layers are ordered: overlay < tooltip < shadow DOM host < FAB.

</section>

<section name="keyboard">

## Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `Ctrl+Shift+A` | Global | Toggle annotator on/off |
| `Escape` | Panel open | Close panel |
| `Escape` | Annotator active, no panel | Deactivate annotator |
| `Cmd/Ctrl+Enter` | Panel textarea focused | Submit annotation |
| `Tab` | Autocomplete visible | Accept selected suggestion |
| `Tab` | Rem suggestion visible | Accept px→rem replacement |
| `↑` / `↓` | Autocomplete visible | Navigate suggestions |
| `Enter` | Annotation list item focused | Scroll to element |
| `Delete` / `Backspace` | Annotation list item focused | Remove annotation |

</section>

<section name="build">

## Build Output

Two files in `dist/`:

```
dist/
├── kai.js        # Unminified, readable, with source comments
└── kai.min.js    # Minified + tree-shaken, production-ready
```

Both are fully self-contained:
- All SVG icons inlined as template literal strings
- All CSS embedded inside Shadow DOM via `<style>` tags
- No CSS files, no asset files, no chunks, no sourcemaps
- Single IIFE that registers `<ui-annotator>` and auto-injects it into the page
- Unminified version is human-readable for developers who want to understand or fork

### Bookmarklet

```javascript
javascript:void((()=>{if(document.querySelector('ui-annotator')){document.querySelector('ui-annotator').toggle();return}const s=document.createElement('script');s.src='https://jsdelivr.link/kai.min.js';document.head.appendChild(s)})())
```

</section>

<section name="scope">

## Out of Scope (v1)

- No server, no API, no WebSocket, no MCP
- No framework detection (no React fiber walking, no Vue internals)
- No screenshot capture
- No natural language CSS mutation ("make this font 2rem" applying styles) — reserved for v2
- No accounts, no auth, no cloud sync
- No browser extension — bookmarklet and script tag only

</section>
