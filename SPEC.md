# kai — Product Specification

<section name="overview">

## Overview

kai is a framework-agnostic, zero-dependency UI annotation tool built as a single Web Component. Developers activate it on any web page through a Chrome extension to click elements, write feedback, and export structured annotation data for AI coding agents or design review.

The tool injects itself into the page, runs entirely client-side, and outputs JSON or Markdown that includes CSS selectors, computed styles, element paths, and human feedback — giving AI agents the exact context they need to find and fix UI issues without guessing.

</section>

<section name="concepts">

## Core Concepts

### Extension-first
kai works on any website, not just your own dev server. The primary distribution is a Chrome extension installed locally as an unpacked developer extension (not on the Web Store). Clicking the toolbar icon injects the same IIFE bundle into the active tab. No npm install required for end users.

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
- Activate with the toolbar icon, FAB button or `Ctrl+Shift+A`
- Hover highlights elements with a bounding box overlay and a tooltip showing `tag#id.class`
- Hit testing runs on pointer position (`elementFromPoint`), so the box follows scroll and DOM changes; SVG internals snap to their root `<svg>`; inline elements get one box per line fragment
- Open shadow roots are pierced: hover, ↑/↓ walking and paths cross the boundary, and selectors for shadow content read `host-selector >>> inner-selector` (see `resolveSelector` in `src/core/selector.ts`)
- `↑` / `↓` walk the ancestor chain when the wanted parent is fully covered by a child
- Page clicks, pointer actions, and keyboard input are swallowed in annotation mode, before document-level host handlers; scrolling remains available
- `I` toggles interaction mode with no held modifier, e.g. to open a modal before annotating it. In interaction mode, page controls and keyboard shortcuts behave normally. `I` / `?` are ignored in text fields; the interaction button and Keyboard shortcuts in settings remain available
- Kai's own controls do not trigger host outside-click dismissal or modal focus traps; toggling back preserves the open host overlay
- Interaction and selector-pick buttons sit next to each other beside the FAB, using Hugeicons Stroke Rounded PointerIcon (pointing hand) and cursor-02 SVGs respectively; optical-centering offsets live in the SVG viewBoxes
- The HUD omits ancestor-arrow, interaction-toggle, and shortcut-reference hints. `?` or the Keyboard shortcuts link in settings opens a compact panel listing shortcuts for all modes; there is no separate help button
- The HUD is pointer-transparent and fades out over 140 ms when the pointer enters its bounds, then returns on leaving; reduced motion disables the fade. Elements underneath remain inspectable and annotatable
- Click any element to open the annotation panel
- Panel displays:
  - CSS selector (short, readable) plus a hidden positional locator so markers stay on the exact element in repeated lists (see `resolveAnnotation` in `src/core/selector.ts`)
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
- **Copy selector**: cursor action bubble arms a one-shot pick mode; clicking an element copies its selector and the bubble shows the same check confirmation

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
  selector: string;                    // Short, readable CSS selector; may match several elements
  locator?: string;                    // Positional nth-child chain that pins the exact element; not exported
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
| `Ctrl+Shift+A` | Global | Toggle annotator on/off. Extension command (`_execute_action` in `extension/manifest.json`, Ctrl on Mac too); kai itself doesn't listen for it, so the two can't double-toggle |
| `Escape` | Panel open | Close panel |
| `Escape` | Settings open | Close settings |
| `Escape` | Shortcut reference open | Close shortcut reference |
| `Escape` | Pick mode armed | Cancel pick mode |
| `Escape` | Annotation mode, no panel | Deactivate annotator |
| `Escape` | Interaction mode | Pass to the page (e.g. dismiss its dialog) |
| `S` | Annotator active, no text field focused | Toggle copy-selector pick mode |
| `M` | Annotator active, no text field focused | Copy all annotations as Markdown |
| `Backspace` / `Delete` | Annotator active, no text field focused | Clear all (second press within 3 s confirms) |
| `,` | Annotator active, no text field focused | Toggle settings |
| `I` | Annotator active, no text field focused | Toggle interaction / annotation mode |
| `?` | Annotator active, no text field focused | Toggle shortcut reference for all modes |
| `Alt`, held | Annotation mode | Inspect / drag to measure |
| `Alt+Shift`, held | Annotation mode | Inspect text metrics |
| `↑` / `↓` | Element hovered | Move the highlight to the parent / back toward the hovered element |
| `Cmd/Ctrl+Enter` | Panel textarea focused | Submit annotation |
| `Tab` | Autocomplete visible | Accept selected suggestion |
| `Tab` | Rem suggestion visible | Accept px→rem replacement |
| `↑` / `↓` | Autocomplete visible | Navigate suggestions |
| `Enter` | Annotation list item focused | Scroll to element |
| `Delete` / `Backspace` | Annotation list item focused | Remove annotation |

FAB single-key shortcuts are the keys in `SHORTCUTS` (`src/core/platform.ts`). They apply outside interaction mode, are handled in the capture phase, and are swallowed so the host page's own shortcuts never fire; they are ignored while any text field (page or kai) has focus and while a modifier is held. `I` and `?` also work in interaction mode outside text fields. The FAB tooltips show the key next to the label. The README table and shortcut reference must stay in sync.

</section>

<section name="build">

## Build Output

```
dist/
├── kai.js        # Unminified, readable bundle
└── extension/    # Unpacked Chrome extension (manifest, service worker, icons, kai.js)
```

`kai.js` is fully self-contained:
- All SVG icons inlined as template literal strings
- All CSS embedded inside Shadow DOM via `<style>` tags
- No CSS files, no asset files, no chunks, no sourcemaps
- Single IIFE that registers `<ui-annotator>` and auto-injects it into the page
- Unminified, so it stays human-readable for developers who want to understand or fork

### Chrome extension

Source lives in `extension/`; `scripts/build-extension.ts` assembles it into `dist/extension/` and stamps the version from `package.json`. Releases attach it as `kai-extension.zip`.

- Manifest V3, permissions `activeTab` and `scripting` only, so installing shows no host-access warning
- Toolbar click (`extension/background.js`): inject `kai.js` into the tab's MAIN world if `<ui-annotator>` is not yet defined, re-append the element if the page dropped it, then call `toggle()`. The first click therefore opens kai already active
- MAIN world is required because content-script worlds have no `customElements`. The page's CSP doesn't block the injection, but kai's code runs under it afterwards: styles go through a constructed stylesheet so `style-src` can't strip them
- kai uses no HTML parsing sinks (`innerHTML`, `DOMParser`), so it runs under Trusted Types; icons go through `createIcon` in `src/icons.ts`
- Any failure (protected page, kai throwing in the page) shows a `!` badge on the toolbar icon for that tab; the next successful click clears it
- Pages Chrome protects (`chrome://`, the Web Store) reject injection; the click does nothing there
- Toolbar icon is the FAB at its default bottom-left corner: accent bubble with the asterisk. `extension/icons/icon.svg` is the source for the committed PNGs

</section>

<section name="scope">

## Out of Scope (v1)

- No server, no API, no WebSocket, no MCP
- No framework detection (no React fiber walking, no Vue internals)
- No screenshot capture
- No natural language CSS mutation ("make this font 2rem" applying styles) — reserved for v2
- No accounts, no auth, no cloud sync
- Chrome only: no Firefox or Safari extension, no Web Store listing
- No script tag or CDN build; the extension is the only distribution

</section>
