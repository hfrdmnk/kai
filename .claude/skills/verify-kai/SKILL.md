---
name: verify-kai
description: Commands and evidence for verifying a kai change — build, unit tests, agent-browser interaction and hostile-page checks, screenshots, and on-demand video recordings (simulated or with the real unpacked extension). Use before reporting a change to src/, extension/ or scripts/ as working, when a browser check fails, or when adding a regression check.
---

# Verify kai

## The check

```bash
bun run check          # tsc + vite build + extension package, unit tests, browser checks
```

CI (`.github/workflows/ci.yml`) runs the same command on pushes to `main` and on pull
requests. Its pieces, for faster loops:

| Command | Covers |
| --- | --- |
| `bun run build` | Typecheck, `dist/kai.js`, `dist/extension/` |
| `bun run test` | Unit tests in `tests/` (pure `src/core/` logic) |
| `bun scripts/check-interaction.ts` | Event isolation from host capture listeners, editor and autocomplete, Escape layering, interaction mode, settings and help, Tab handling, inspect mode, ↑/↓ walks, box model, drag to adjust, popover keys; a desktop-pointer session plus a touch session |
| `bun scripts/check-hostile.ts` | Real `background.js` toggling kai on a strict-CSP page, a Trusted Types page, an SPA that swaps `<body>`, and a page that deletes unknown elements: styling, annotating, no violations or page errors, and the page left usable when kai is dropped |

Browser checks use the built bundle, so rebuild after editing `src/` or `extension/`. They
need `agent-browser` 0.38.1 (preinstalled in Amp orbs, pinned in CI) and its Chrome
(`agent-browser install`). Output is one `PASS`/`FAIL` line per assertion plus the
agent-browser and Chrome versions; a failure saves a screenshot to `.check-artifacts/`
(uploaded as a CI artifact).

## Seeing the UI

For changes to how kai looks, render each affected state and inspect the screenshots:

```bash
bun run dev   # Vite: index.html is a playground page with kai loaded from source
```

Drive it with agent-browser (`set viewport 1280 800 2` for 2x captures). `components.html`
shows individual parts in both themes. kai's shadow root is closed, so reach its controls
through the accessibility tree: `snapshot -i` refs, `find role button click --name "…"`,
`get box @ref`. To see kai on a real site, load `dist/extension/` unpacked in Chrome.

Compare the result with SPEC.md § Design System and the existing tokens in `src/styles.ts`;
they are the reference, not this skill.

## Accessibility and performance

- `snapshot -i` lists kai's controls with their roles, names and states such as `expanded`;
  a control missing there, or listed without a name, is missing for assistive tech too
- Keyboard-only paths (Tab, shortcuts, Escape layering, focus restore) belong in
  `check-interaction.ts`; extend it rather than checking by hand once
- Light, dark and reduced motion: `set media dark`, `set media light reduced-motion`, then
  capture the affected states. kai follows the color scheme while its theme is System;
  Settings also set the theme and accent directly
- Frame cost over a host page: `profiler start`, move the pointer across elements with
  `mouse move` (inspect mode with Alt held for measurements), `profiler stop <trace.json>`,
  then open the trace in Chrome DevTools or https://ui.perfetto.dev and look for long tasks
  and forced layouts in kai's handlers

## Recording a clip (on demand)

Record when motion, focus or interaction timing matters, or when asked for video. It is not
part of `bun run check` or CI.

```bash
bun run build
bun run record               # simulated injection, headless
bun run record --extension   # real unpacked extension, headed Chrome on Xvfb
```

Both run the same flow on a demo page: activate kai, hover the heading and paragraph, click
the button, type `--` and accept `--demo-accent` with Tab, save with Ctrl+Enter, and see the
marker. Assertions on each step print `PASS`/`FAIL`, and the run writes
`.check-artifacts/recordings/kai-<mode>-<timestamp>.mp4` plus a `-sheet.png` of 20 evenly
spaced frames (`KAI_RECORD_DIR` overrides the folder). Inspect the sheet, and single frames
where it matters (`ffmpeg -ss <s> -i clip.mp4 -frames:v 1 frame.png`), before reporting the clip.

| Mode | What is real | What is not covered |
| --- | --- | --- |
| default | kai.js and `background.js` logic; page clip at 2x via `agent-browser record --cursor` | No extension is loaded: the injection goes through CDP via the `chrome.*` shim, so the toolbar, keyboard command and `activeTab` / `scripting` permissions are not exercised |
| `--extension` | `dist/extension/` loaded unpacked; xdotool clicks kai in Chrome's Extensions toolbar menu, so Chrome grants `activeTab` and runs `background.js`; the clip is the whole window (ffmpeg `x11grab`), toolbar included | The `Ctrl+Shift+A` command (in Chrome for Testing 155 under Xvfb it opened Tab Search or did nothing); a pinned toolbar icon; real Chrome on macOS or Windows |

`--extension` needs `xdotool`, `ffmpeg` and either `DISPLAY` or `Xvfb`
(`sudo apt-get install -y xvfb xdotool` in an orb). The Extensions menu is clicked at window
coordinates measured on Chrome 155; if a Chrome update moves it, the first assertion fails.

## Harness notes

- kai focuses its editor and restores focus in animation frames, and agent-browser can send
  the next command inside the same frame. Wait two frames after a click that opens or closes
  kai UI and before typing (`settle()` in the harness, `nextFrames()` in check-interaction)
- agent-browser's `keydown`/`keyup` don't set modifier flags, which kai reads; the box model
  checks dispatch `KeyboardEvent`s with `altKey`/`ctrlKey`/`shiftKey` instead
- `check-interaction.ts` keeps its own helpers: its main session runs Chrome through a wrapper
  that reports a mouse (`(hover: hover)`), a second session keeps the touch default, pages
  opened with `?open` load a test copy with an open shadow root so the HUD can be read, and
  `KAI_CHROME` overrides the Chrome binary
- `scripts/browser-harness.ts` has the `browser`, `evaluate`, `settle`, `assert` and
  `simulateToolbar` helpers used by `check-hostile.ts` and `record.ts`
- Add a regression as an assertion in the closest existing check, through what a user or host
  page can observe, and make sure it fails without the fix
- `check-hostile.ts` uses `simulateToolbar`: it injects through CDP, which like the
  extension's MAIN-world injection isn't subject to the page CSP, while kai's code still runs
  under it. It doesn't load the extension; `bun run record --extension` does

## Evidence to report

The `bun run check` result with its pass/fail counts, any assertions added and that they
failed before the fix, and for visual changes the inspected screenshots of each state. For a
recording, the clip path, which mode produced it, and what the inspected frames show; say
"simulated injection" unless it came from `--extension`.
