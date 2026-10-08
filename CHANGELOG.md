# Changelog

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
