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
- `↑` / `↓` walk the ancestor chain when the wanted parent is fully covered by a child. Annotate, inspect and the box model share one selection: each mode draws it its own way. A walked selection carries across mode switches (Alt, Ctrl or Shift while inspecting) while the pointer stays still; the first move of at least 4px afterwards returns it to the innermost element. A fresh `↑` / `↓` after the switch is deliberate and isn't reset. Without a mode switch, a walked ancestor stays selected while the cursor stays inside it
- Page clicks, pointer actions, and keyboard input are swallowed in annotation mode, before document-level host handlers; scrolling remains available
- `I` toggles interaction mode with no held modifier, e.g. to open a modal before annotating it. In interaction mode, page controls and keyboard shortcuts behave normally. `I` / `?` are ignored in text fields and while focus is in the annotation popover; the interaction button and Keyboard shortcuts in settings remain available
- Kai's own controls do not trigger host outside-click dismissal or modal focus traps; toggling back preserves the open host overlay
- Interaction and selector-pick buttons sit next to each other beside the FAB, using Hugeicons Stroke Rounded PointerIcon (pointing hand) and cursor-02 SVGs respectively; optical-centering offsets live in the SVG viewBoxes
- The HUD omits ancestor-arrow, interaction-toggle, and shortcut-reference hints. `?` or the Keyboard shortcuts link in settings opens a compact panel listing shortcuts for all modes; there is no separate help button. The panel sits above the page and the rest of kai on a blurred backdrop; clicking the backdrop closes it
- kai's UI text uses medium weight (500) for emphasis, never bold
- Focus rings appear only after the user presses Tab, and hide again on pointer use or a kai shortcut. Shortcuts move focus themselves (`,` focuses the selected theme, `?` the panel's close button), and browsers would otherwise show a ring for that
- In annotation mode, Tab cycles through kai's visible controls without leaving for the frozen page or the browser UI; Tab from the page enters the toolbar. The shortcut panel keeps focus to itself while open
- The HUD is pointer-transparent and fades to 20% opacity over 140 ms when the pointer enters its bounds, then returns on leaving; reduced motion disables the fade. Elements underneath remain inspectable and annotatable
- Click any element to open the annotation panel
- Panel displays:
  - CSS selector (short, readable) plus a hidden positional locator so markers stay on the exact element in repeated lists (see `resolveAnnotation` in `src/core/selector.ts`)
  - Element path breadcrumb (e.g. `div.wrapper › section.hero › h1`)
  - Computed styles (font-size, color, padding, margin, border-radius, etc.) with px→rem conversion shown inline

### Box Model Overlay
- Holding `Ctrl` while holding Alt shows a box model layer for the selected element, on top of the crosshair, or of text metrics with Shift, like Shift it lasts only while held. Some systems reserve Ctrl+Alt+arrow (screen rotation, workspace switching), so walk with `↑` / `↓` before pressing Ctrl: the walked selection carries across the switch
- Padding is accent at 32% opacity. Margin is accent at 12% with a 1px diagonal hatch, so empty space reads apart from padding at every accent. The border and any classic scrollbar are part of the padding band, with the border's outer edge outlined. The content box gets a 1px accent outline and no fill
- Flex and grid containers with a `gap` also hatch their gutters. Each gutter is drawn at the `gap` width, centered in the space between items or tracks (`justify-content` / `align-content` can widen that space). Flex gutters come from the in-flow children's margin boxes plus text runs, which become anonymous items; `nowrap` containers are one line. Grid gutters come from the resolved `grid-template-columns` / `grid-template-rows`, minus the 0px tracks `auto-fit` collapses. Gutters are clipped to the container's padding box and the viewport
- Bands at least 16px wide show their value inline. A card below the element (or above it, or pinned inside the viewport) lists `Box` (`tag#id.class` W×H), `Margin`, `Border` (when non-zero), `Padding` and `Gap` in CSS shorthand order with rem equivalents, and replaces the crosshair's size pill. With text metrics on, they describe the same element as the box model, and the rows join the text-metrics card
- In inspect mode the crosshair measures the selected element: its lines run from the cursor to where that element (descendants included) stops being visible. Once walked up, the element gets a 1px dashed outline. Text metrics describe the selected element and hide when it has no text of its own
- Non-replaced inline boxes ignore vertical margin; replaced ones (`img`, `svg`, form controls…) keep it. A wrapped inline box is drawn on its first line fragment, with no end-side edges. Negative margins are drawn as 0 but listed with their real value
- Uniformly scaled elements (or ancestors) get bands at the drawn scale; values stay in CSS px. Rotated, skewed or unevenly scaled elements only get their bounding box
- The model is computed once per target and recomputed on scroll, resize or DOM changes
- Dragging to measure hides the layer. `Ctrl+wheel` (browser zoom) is blocked while inspecting

### Drag to Adjust
- In plain annotation mode (not interaction or pick mode, not while inspecting, not while a text field, the popover, settings or the shortcut panel has focus), a property key arms that property on the selection: `P` padding, `M` margin, `G` gap of the selection or its closest flex/grid ancestor, `F` font-size, `L` line-height (unitless), `B` border-radius. The same key again or `Esc` disarms; another property key switches. While armed the selection is locked to hover; `↑` / `↓` still walk it and move the armed target
- Press, drag and release anywhere is one adjustment; afterwards kai is disarmed. A press without movement changes nothing and doesn't open the popover
- Sides (P, M): the side whose edge (the segment) is nearest the pointer at press time; pulling it outward is more. `Alt` adds the opposite side, `Shift` takes all four. Corners (B): the nearest corner by quadrant; `Alt` both corners on the nearest side, `Shift` all four; toward the element's middle is more. Gap (G): a flex container's main-axis gap (`column-gap` for rows, `row-gap` for columns); for grid the first 6px of travel pick `column-gap` (↔) or `row-gap` (↕); `Shift` both. F, L: → or ↑ is more, no modifiers. Modifiers apply live mid-drag. While armed, `Alt` is this modifier and doesn't enter inspect
- 2px of travel per px of spacing, radius and gap, 4px per px of font size, 2px per 0.01 of line height. Values are whole px, line height steps of 0.05; travel under 3px is ignored. Radii are read as drawn by the CSS rule (all scale down together only when a side is over-full; an elliptical radius reads as its horizontal component) and gap percentages against the content box. The release commits the values at the release position. Padding, gap and radius stop at 0; margin goes negative
- The change previews live as inline `!important` longhands on the annotated element and its identical siblings (`resolveAnnotationMatches`): the elements under the same parent with the same tag and the same classes in any order, `kai-` classes aside, such as the cards of a grid rendered from one template, since the fix will change them all. The annotation's own selector is unique on purpose (`:nth-of-type`), so it can't find them. An element without classes matches only itself. Siblings get a dashed accent outline and the tooltip shows `×N`. The hover box hugs the element with a thin outline
- One edit per sibling group per longhand (`routeChanges`): adjusting an element whose sibling's annotation already edits a longhand updates that annotation's edit (keeping its original `from`) instead of adding a competing edit on the element's own annotation, so every sibling follows. Longhands no sibling annotation covers go to the element's own annotation, created if needed. When the update brings a sibling's edit back to its `from`, the edit goes and every sibling returns to the page value. A new edit's `from` is the page's own value (kai's styles for the adjusted property lifted for the moment). On an element with its own edit for a longhand, that edit wins over a sibling's; that's only a tiebreak, since routing keeps one edit per group. An element's own annotation is the last one resolving to it (`ownerIndexes` / `ownAnnotationOf` in `src/core/selector.ts`), the same rule for painting, routing, Backspace reset and opening the popover; an earlier annotation on the same element only fills in, like a sibling's. A drag that leaves the edits as they were saves nothing and isn't an undo step
- While armed and dragging, kai draws what will change like the box model: padding bands, hatched margin bands and gap gutters, stripes on alternate lines for line height, and for each changing corner a second rounded border 4px outside its curve. Changing sides and gutters get a 2px accent outline; an empty one still gets a 4px sliver (for a gap of 0, one at each boundary between items). Hidden look-alikes get no outline. The cursor is `ew-resize` / `ns-resize` / `move` along the changing sides or gaps, `crosshair` otherwise
- The HUD stays one 32px line. Armed: a side or corner glyph (changing ones in accent), the property and its current value as CSS shorthand, and the modifier chips, lit while held (`⌥ axis · ⇧ all`; B `⌥ side · ⇧ all`; G `⇧ both`). Dragging: the declaration, its new value and the signed delta (`padding-right  35px  +11px`) in fixed-width tabular cells; several declarations at once show as one row named after the shorthand (`padding`, `gap`, `border-radius (right)`), valued at the grabbed side or corner. The pill only grows during a drag. After release, `✓ Annotation 3` or `✓ Added to annotation 3` shows for 1.2 s, display only
- Release writes the change into an annotation's `edits` (the structured list; see Data Types): the element's own annotation, created with an empty note if needed, or a sibling's as above. Each edit is stored in its shortest form (all four sides equal → `padding`, left and right → `padding-inline`, top and bottom → `padding-block`, else single sides; likewise `gap` and `border-radius`). Editing an adjusted property again keeps the original value; back at the original value, the edit goes. The note (`comment`) is the user's own text; kai never writes into it. kai's inline styles go back to the element's own, including an inline shorthand such as `padding: var(--pad)` whose longhands read empty. Known limitation: an inline `var()` shorthand combined with a separate inline longhand of it on the same element (`padding: var(--p); padding-top: 4px`) reads empty as a shorthand, so kai can't capture it, and restoring can lose the `var()` value
- kai's styles on the page are derived from the edits (`createEditStyles` in `src/core/edit-styles.ts`): every annotation's edits are applied to its matches and every other longhand kai touched goes back to the element's own inline value, captured the first time kai touched it. This runs on load, activation, release, comment save, delete and clear all
- `T` while armed toggles snapping to the project's scale; it stays on across armings until toggled off, and is offered (with a `T snap` chip in the armed HUD, accent while on) only when the page has a scale for the armed property. The scale (`harvestScale` in `src/core/scale.ts`, read when arming and again whenever the page's stylesheets changed, by sheet and rule count) is the project's own utility classes from same-origin stylesheets: single-class rules for spacing (`p`, `px`… `m`… `gap`, `gap-x`, `gap-y`), `text-*` that set a font size, `leading-*` with a unitless value (px ones like `leading-7` are fixed heights, not ratios) and `rounded-*`, including sheets they `@import`, values probed on a hidden element; look-alikes such as `text-red-500` or `rounded-t-lg` are skipped. With spacing utilities the scale also has Tailwind's `0` step. Without utility classes it falls back to custom properties with length values on `:root`, `html`, `:root, :host` or `:where(:root)` rules, named like a scale (`--space-*`, `--text-*`, `--leading-*`, `--radius-*`). While snapping, a drag moves one scale value per 12px of travel; an off-scale start goes to the next value in that direction, margin continues into negatives. The edit records the class named after the declaration's own prefix and the step (`pr-8`, `px-4`, `-mt-2`, `rounded-tl-lg`) or the variable; the popover row reads `padding-right  24px → 32px  pr-8`, the Markdown bullet `` `padding-right: 24px → 32px` (2rem, `pr-8`) ``. The drag HUD shows the class or token in a muted cell while snapping is on
- `←` / `→` while armed nudge the side (or corner, gap, value) under the pointer one step: 1px, 0.05 of line height, or one scale value while snapping; `→` is more. Each nudge is saved right away, like a release. The HUD shows the drag row with the delta since this arming's first nudge, and goes back to the hints 1.5 s after the last one
- `Backspace` (or `Delete`) while armed resets the property on what the element shows: its own annotation's edits and those of sibling annotations covering it (the whole group goes back). An annotation left with neither a note nor edits goes. The page goes back through the derived styles, and kai disarms with a short `Reset padding` notice. Unarmed, they still clear all
- While a property is armed or dragging, annotation markers let the pointer through, so the annotated element's corner under its marker can be grabbed again
- Keys that mean something while armed (Esc, Backspace / Delete, T, ← / →, the property keys, Alt, Shift) are handled before kai's single-key shortcuts. The adjust state machine lives in `src/adjust-mode.ts`; the annotator routes key and pointer events to it. Held modifiers are one record for every mode (`nextHeld` in `src/core/held-keys.ts`): a modifier's own key event decides it, other events report flags, and while armed mouse events can only add a modifier, since synthetic input sends none

### Undo / Redo
- `⌘Z` / `⇧⌘Z` on a Mac, `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` elsewhere, in annotation mode (not interaction mode; not while a text field, the popover, settings or the shortcut panel has focus: text fields keep their native undo). Mid-drag they do nothing
- Every change to the annotation list goes through one path, `commit(next, label)` in the annotator: a new note, a comment save (an unchanged one isn't a step), a delete, clear all, a drag, a nudge, a reset. It shows the new list (saves the session, re-derives kai's styles from the edits, updates markers and the FAB) and records an undo step `{ label, before, after }` of the immutable annotation arrays (`src/core/history.ts`)
- The history is linear: a new step after undoing drops the redo steps. It keeps the last 100 steps, lasts for the page load (it survives turning kai off and on) and isn't saved
- Undo and redo disarm a property and close the popover, then show the step's `before` / `after` through the same path without recording. The HUD says `Undid padding-right`, `Redid reset padding`, `Undid note`, `Undid delete annotation`, `Undid clear all`, or `Nothing to undo` / `Nothing to redo`; drags and nudges are named by the declarations they wrote

### Annotation Authoring
- Textarea for writing feedback
- **CSS variable autocomplete**: When the user types `--`, harvest all CSS custom properties from the page's stylesheets available for the selected element. Show a dropdown with variable names, resolved values, and color swatches for color values. Navigate with arrow keys, accept with Tab/Enter.
- **px→rem conversion**: When the user types a value like `16px`, show an inline suggestion (e.g. `→ 1rem`) that can be accepted with Tab, replacing the px value. Enter inserts a newline and Escape dismisses it; without a suggestion, Tab moves focus.
- Submit with `Cmd+Enter` (Mac) or `Ctrl+Enter`

### Annotation Management
- Numbered markers appear on annotated elements (repositioned on scroll/resize)
- Drawer lists all annotations with selector and comment preview
- Click an annotation in the drawer to scroll the page to that element
- Remove individual annotations or clear all; their adjustments come off the page with them. An annotation is deleted only when its note is empty and it has no edits: saving an empty note keeps an annotation that still has changes
- The popover lists an annotation's edits below the note, one row each on a single line: the declaration (mono), `24px → 32px`, and the class or token it snapped to (muted); line height is unitless. Long rows are cut short with an ellipsis (the row's title has the full line). On hover or focus within a row, a remove button (aria-label `Remove padding-right change`, reachable with Tab) fades in at its right edge over a gradient, 140 ms, none with reduced motion. Removing goes through `commit` (undoable, labelled by the declaration): the row disappears and the page reverts; removing the last change of an annotation without a note deletes it, unless a note is being typed, which then becomes the note in the same step. A hidden remove button takes no pointer events until its row is hovered or it has keyboard focus; on touch screens (`hover: none`, or any coarse pointer, as on touchscreen laptops) the buttons are always shown. A pointer removal within 400 ms of the previous one in the same popover is ignored, so a double click removes one change; keyboard removals aren't limited. After a mouse removal focus goes to the note (after a tap it stays put, so no on-screen keyboard opens); with the keyboard (Enter, Space, or Delete / Backspace on a focused remove button) it goes to the next row's button, else the previous one, else the note. While focus is in the popover, keys go to it, not to kai's shortcuts, `I` and `?` included
- Keyboard navigation: Tab between items, Enter to scroll, Delete/Backspace to remove

### Export
- **JSON**: Structured object with url, viewport dimensions, timestamp, and annotation array (each with selector, path, intent, styles, rect, comment, edits)
- **Markdown**: Formatted for pasting into AI coding agents — headings per annotation with selector as code, styles listed, feedback quoted, then a `**Changes:**` list with one bullet per edit: `` - `padding-right: 24px → 32px` (2rem, `pr-8`) `` (the variable instead of a class when snapped to one; no rem for line height). When the annotation's fix covers siblings, a line follows: ``Applies to all 3 identical siblings (`article.card.px-2` under `#cards`)``, counted at export time
- Copy to clipboard with inline button feedback (icon swap + color change, auto-reset)
- **Copy selector**: cursor action bubble arms a one-shot pick mode; clicking an element copies its selector and the bubble shows the same check confirmation

### Session Persistence
- Annotations saved to `localStorage` under key `ui-annotator:{origin}{pathname}`
- Sessions load automatically when the tool initializes on a page with prior data, adjustments re-applied to the page
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
  comment: string;                     // User's note; kai never writes into it
  styles: Record<string, string>;      // Relevant computed styles
  rect: { x: number; y: number; w: number; h: number };
  createdAt: string;                   // ISO timestamp
  edits?: StyleEdit[];                 // Drag-to-adjust changes; each has a line in comment
};

type StyleEdit = {
  property: string;   // As written: padding | padding-inline | padding-block | padding-top… | margin… | gap | row-gap | column-gap | font-size | line-height | border-radius | border-top-left-radius…
  from: number;       // px; unitless for line-height
  to: number;
  className?: string; // Project utility class when snapped with T, named for this declaration (pr-8, px-4)
  token?: string;     // var(--x) when snapped to a CSS variable
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
| `Escape` | Property armed or dragging | Disarm; mid-drag, cancel and put the page back |
| `Escape` | Annotation mode, no panel | Deactivate annotator |
| `Escape` | Interaction mode | Pass to the page (e.g. dismiss its dialog) |
| `S` | Annotator active, no text field focused | Toggle copy-selector pick mode |
| `C` | Annotator active, no text field focused | Copy all annotations as Markdown |
| `⌘Z` / `⇧⌘Z` (Mac), `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` | Annotation mode, no text field, popover, settings or shortcut panel focused | Undo / redo the last edit or annotation |
| `P` / `M` / `G` / `F` / `L` / `B` | Annotation mode, no text field focused | Arm padding / margin / gap / font-size / line-height / border-radius on the selection (same key again disarms) |
| Drag | Property armed | Adjust the nearest side or corner (gap: main axis or drag axis); release adds it to the annotation |
| `Alt`, held | Property armed | Also the opposite side (border-radius: both corners on the nearest side) |
| `Shift`, held | Property armed | All sides, all corners or both gaps |
| `T` | Property armed, page has a scale | Toggle snapping to the project's utility classes or scale variables (stays on) |
| `←` / `→` | Property armed | Nudge the side under the pointer one step (1px, 0.05 or one scale value), saved right away |
| `Backspace` / `Delete` | Property armed | Reset the property on the element (its edits, and its siblings') |
| `Backspace` / `Delete` | Annotator active, no property armed, no text field focused | Clear all (second press within 3 s confirms) |
| `,` | Annotator active, no text field focused | Toggle settings |
| `I` | Annotator active, no text field focused | Toggle interaction / annotation mode |
| `?` | Annotator active, no text field focused | Toggle shortcut reference for all modes |
| `Alt`, held | Annotation mode | Inspect / drag to measure |
| `Alt+Shift`, held | Annotation mode | Inspect text metrics |
| `Alt+Ctrl`, held | Annotation mode | Inspect the box model (padding, margin, flex/grid gaps); combines with `Shift` |
| `↑` / `↓` | Element hovered, annotation or inspect mode | Move the selection (highlight, measurement or box model) to the parent / back toward the hovered element; while a property is armed, its target moves along |
| `Cmd/Ctrl+Enter` | Panel textarea focused | Submit annotation |
| `Tab` | Autocomplete visible | Accept selected suggestion |
| `Tab` | Rem suggestion visible | Accept px→rem replacement |
| `↑` / `↓` | Autocomplete visible | Navigate suggestions |
| `Enter` | Annotation list item focused | Scroll to element |
| `Delete` / `Backspace` | Annotation list item focused | Remove annotation |
| `Delete` / `Backspace` | A change's remove button focused (popover) | Remove that change |

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
