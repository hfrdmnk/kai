# Changelog

## 1.2.0 — 2026-10-13

Drag to adjust spacing, type and radius straight on the page, snapped to the project's own scale, with changes saved apart from your note and previewed on identical siblings. Every change to the annotations can now be undone and redone.

### Added

- Drag to adjust: hover an element, press P (padding), M (margin), G (gap), F (font size), L (line height) or B (border radius), then drag anywhere. The nearest side or corner changes; Alt adds its opposite, Shift takes all. The page previews the change on its identical siblings (same parent, tag and classes, like the cards of a grid), with bands, gutters, line stripes or corner arcs showing what will change and a one-line HUD showing the value
- Release writes the change into the annotation's `edits`, apart from your note; a sibling group shares one change per property. The popover lists the changes under the note, one per line, with a remove button on hover or focus; the Markdown export adds a Changes list. Adjustments persist with the session; deleting the annotation, clearing all or removing a change puts the page back
- T snaps drags and nudges to the project's own scale: its Tailwind-style utility classes, or `:root` variables like `--space-4` when there are none. The change names the class or variable, e.g. `padding-right  24px → 32px  pr-8`
- ←/→ while a property is armed nudge the side under the pointer by one step and save right away; Backspace resets the property on the element and its identical siblings, and removes an annotation left with neither note nor changes. While armed, markers let the pointer through, so the corner under a marker can be dragged too
- Undo / redo (⌘Z / ⇧⌘Z, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y elsewhere) for every change to the annotations: drags, nudges, resets, notes, deletes and clear all. The HUD says what was undone; text fields keep their own undo

### Changed

- Copy as Markdown moves from M to C; M now arms margin
- An annotation is deleted only when its note is empty and it has no changes
- The HUD is always one 32px line
- The box model shows only while Ctrl is held with Alt, like Shift for text metrics, instead of toggling on a Ctrl tap

## 1.1.0 — 2026-10-10

Inspect mode now shows the box model, and ↑/↓ walk to parents in every mode. Interaction mode has a persistent toggle instead of a held key, there's a full shortcut reference, and keyboard use is calmer: focus rings only appear once you press Tab.

### Added

- Box model overlay: tap Ctrl while holding Alt to see padding, hatched margin, flex/grid gaps and in-band values, with an info card in px and rem. It combines with Shift for text metrics
- ↑/↓ walk to the parent or child while annotating, measuring or viewing the box model. The walked element carries across mode switches while the mouse stays still
- Interaction mode toggle (`I` or the button beside kai), replacing held modifiers; page overlays and controls stay intact
- Shortcut reference (`?` or Settings → Keyboard shortcuts) on a blurred backdrop

### Improved

- The HUD lets clicks through and fades to 20% while the pointer is over it
- Focus rings only appear after Tab, and Tab cycles through kai's controls
- Settings: the shortcuts row has no divider and gets a hover background; text uses medium weight instead of bold
- px→rem suggestion: Enter inserts a newline, Tab accepts
- Annotation input stays isolated from the page's keyboard handlers
- Optically centered toolbar icons

## 1.0.0 — 2026-10-08

kai now ships as a Chrome extension and nothing else. Click the toolbar icon or press Ctrl+Shift+A to toggle it on any tab, including pages with a strict CSP or Trusted Types. The bookmarklet and the jsDelivr script tag are gone.

### Added

- Chrome extension: the toolbar click injects kai into the active tab and toggles it, using only `activeTab` and `scripting` (no host-access warning)
- Ctrl+Shift+A extension command toggles kai before it has been injected (physical Ctrl on Mac)
- Toolbar icon shows a `!` badge when kai can't run on a page (`chrome://` pages, injection or startup failures)
- Releases attach `kai-extension.zip` for loading unpacked

### Improved

- kai re-attaches itself if a single-page app removes it, and a second click no longer hits a duplicate element definition
- 16px toolbar icon snapped to the pixel grid
- Install and update steps in the README and landing page match and no longer rely on unzipping over the old folder

### Fixed

- Styles survive a strict `style-src` CSP: the shadow root adopts a constructed stylesheet instead of a `<style>` element
- Icons render on sites that enforce Trusted Types (`require-trusted-types-for 'script'`)

### Removed

- **Breaking:** the bookmarklet. Install the extension instead
- **Breaking:** the jsDelivr script tag and CDN build (`kai.min.js` is no longer built or published)
- kai's own in-page Ctrl+Shift+A listener, replaced by the extension command

## 0.2.1 — 2026-09-14

Annotating elements with Tailwind-style class names (`md:flex`, `data-[state=selected]:bg-ui-3`) no longer throws, so the popover opens on table cells and similar elements.

## 0.2.0 — 2026-09-11

Dark theme, keyboard shortcuts for every action, pass-through and copy-selector modes, and markers that stay on the element you actually clicked.

### Added

- Dark theme with semantic color tokens, plus a settings bubble for theme and accent color
- Pass-through mode: hold Cmd/Ctrl to interact with the page without leaving the annotator
- Copy-selector pick mode via the cursor bubble
- Single-key shortcuts while active: S (copy selector), M (copy Markdown), Backspace/Delete (clear all, second press confirms), comma (settings); listed in the README
- Hidden positional locator per annotation so markers pin to the exact element in repeated lists and shadow roots
- Internal components page for design review, split by theme

### Improved

- Hover targeting reworked; overlays sit on the inverted palette
- FAB idle state uses the inverted palette, badge takes the opposite of the FAB and holds its size and position while the FAB squishes
- Badge is a circle centred on the FAB corner with a concentric scoop, also for two-digit counts
- Markers hide while kai is inactive and spring in on activation
- Grays switched to Tailwind neutral; buttons and popover rounded
- Chrome borders and border tokens removed; only overlay and selection boxes keep theirs

### Fixed

- Bookmarklet works on pages with a strict CSP by fetching the script and inlining it

## 0.1.0 — 2026-02-17

Initial pre-release of kai — a zero-dependency web component for visual UI annotation directly in the browser.

### Added

- `<ui-annotator>` web component with closed Shadow DOM
- Click-to-annotate workflow with CSS selector generation
- Draggable FAB with animated action buttons and badge count
- Hover overlay with element info tooltip and text preview
- Numbered markers on annotated elements with clustered stacking
- Annotation editing via clickable markers and popover UI
- Alt+Shift text inspector mode with visual measurement tool
- Keyboard guide bar showing currently pressed keys
- JSON and Markdown export formatters
- localStorage session persistence
- CSS custom property autocomplete in annotation panel
- Singleton guard to prevent multiple instances
- Automated release workflow via GitHub Actions
