# kai — agent guide

kai is a zero-dependency UI annotation tool: one `<ui-annotator>` Web Component with a closed
Shadow DOM, injected into any page by an unpacked Chrome extension. [SPEC.md](./SPEC.md) is the
product source of truth; [README.md](./README.md) is for users. Update SPEC.md when behavior
changes, and keep the README shortcut table and the in-app shortcut reference in sync.

This file is the single guidance source for every coding agent. `CLAUDE.md` only imports it.
Project skills live in `.claude/skills/`, which both Claude Code and Amp load.

## Stack

- TypeScript (strict, `target: ES2022`), built by Vite in library mode (rolldown-vite) to one
  readable, unminified IIFE: `dist/kai.js`
- `scripts/build-extension.ts` packages `extension/` plus the bundle into `dist/extension/`
- Bun for installs, scripts and unit tests; no runtime dependencies

## Commands

```bash
bun install          # locked dev dependencies (.agents/setup runs this in orbs)
bun run dev          # Vite dev server: index.html loads kai from source, components.html shows parts
bun run build        # typecheck + bundle + package dist/extension/
bun run test         # unit tests in tests/
bun run test:browser # agent-browser checks against the built dist/extension/ (build first)
bun run check        # build + unit + browser checks; what CI runs on main and pull requests
bun run record       # on demand: video of a kai flow (--extension loads the real unpacked extension)
```

`bun run check` is the definition of green. The browser checks need `agent-browser` (0.38.1,
preinstalled in Amp orbs) and its Chrome; the `verify-kai` skill explains what they cover and
how to gather evidence for UI changes.

## Architecture constraints

- kai runs inside pages it doesn't control. Assume a strict CSP, Trusted Types, pages that
  remove or replace `<body>`, and host libraries with document-level capture listeners
- No HTML parsing sinks in shipped code (`innerHTML`, `insertAdjacentHTML`, `DOMParser`): build
  DOM with `createElement`; SVG icons are raw files in `src/icons/` built by `createIcon`
  (`src/icons.ts`). `src/components-page.ts` is a dev-only page and may parse
- Styles live in `src/styles.ts` and reach the closed shadow root as a constructed, adopted
  stylesheet, which `style-src` can't block. No `<style>` elements, no external CSS or assets
- Host isolation happens in window capture listeners added on activate and removed on
  deactivate. `disconnectedCallback` must leave the page exactly as usable as before kai
- The extension injects into the MAIN world (`extension/background.js`), re-appends the
  element when a page dropped it, and badges `!` on failure. Permissions stay `activeTab` and
  `scripting`
- Vanilla DOM only: no frameworks, no runtime deps, one self-contained bundle

## Code style

- No classes for UI pieces: functions that create and return elements plus small controller
  objects (`src/ui/`). `UIAnnotator` is the one class, because custom elements need it
- Pure logic without DOM rendering goes in `src/core/`, export formatting in `src/export/`
- Prefer `const` and arrow functions; kebab-case file names
- Show `px` values with their `rem` equivalent in the UI
- Comments explain why, briefly; match the surrounding density

## Layout

```
src/
├── annotator.ts       # <ui-annotator>: event isolation, modes, wiring; IIFE entry
├── adjust-mode.ts     # drag-to-adjust controller (SPEC.md § Drag to Adjust)
├── styles.ts          # all Shadow DOM CSS as one string
├── icons.ts, icons/   # raw SVGs + createIcon
├── types.ts, globals.d.ts
├── components-page.ts # dev-only component gallery (components.html)
├── core/              # selector, styles, css-vars, box-model, measure, adjust, scale, edit-styles,
│                      #   history, held-keys, session, easing, accents, platform, text
├── ui/                # fab, popover, autocomplete, markers, highlight, inspector, guide-bar, adjust, settings
└── export/markdown.ts
extension/             # MV3 manifest, background.js, icons (icon.svg is the PNG source)
scripts/               # build-extension, browser-harness, check-interaction, check-hostile, record
tests/                 # bun unit tests
docs/index.html        # landing page
```

## Design system

SPEC.md § Design System, the tokens in `src/styles.ts` and the curves in `src/core/easing.ts`
are the source of truth for how kai looks and moves. Reuse them; changing them is a product
decision recorded in SPEC.md. Keyboard and focus behavior is specified there too, and
`bun run test:browser` checks it by driving kai through its accessible names; the `verify-kai`
skill covers rendering states, reduced motion and performance traces.

## Releases and other outward actions

Commit, push, tag, release or deploy only when the user asks for that specific action. The
`release` skill bumps, tags and pushes; the tag triggers `.github/workflows/release.yml`, which
builds and publishes `kai-extension.zip`. Add user-facing changes to `CHANGELOG.md` under
`## Unreleased`.
