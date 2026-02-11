export const styles = `
:host {
  --white: oklch(100% 0 0);
  --gray-50: oklch(98.5% 0.002 247.839);
  --gray-100: oklch(96.7% 0.003 264.542);
  --gray-200: oklch(92.8% 0.006 264.531);
  --gray-300: oklch(87.2% 0.01 258.338);
  --gray-400: oklch(70.7% 0.022 261.325);
  --gray-500: oklch(55.1% 0.027 264.364);
  --gray-600: oklch(44.6% 0.03 256.802);
  --gray-700: oklch(37.3% 0.034 259.733);
  --gray-800: oklch(27.8% 0.033 256.848);
  --gray-900: oklch(21% 0.034 264.665);
  --gray-950: oklch(13% 0.028 261.692);

  --color-accent: oklch(0.6927 0.2513 38.8022);
  --color-accent-hover: oklch(0.6405 0.2241 38.8022);
  --color-danger: oklch(0.6338 0.2516 24.17);
  --color-success: oklch(72.3% 0.219 149.579);

  --font-sans: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-full: 9999px;

  --bg-1: var(--white);
  --bg-2: var(--gray-50);
  --bg-3: var(--gray-100);
  --bg-4: var(--gray-200);

  --border-1: var(--gray-50);
  --border-2: var(--gray-100);
  --border-3: var(--gray-200);
  --border-4: var(--gray-300);

  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);

  --z-overlay: 2147483643;
  --z-tooltip: 2147483647;
  --z-host: 2147483645;
  --z-fab: 2147483646;

  --shadow-2xs: 0 1px rgb(0 0 0 / 0.05);
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  --inset-shadow-2xs: inset 0 1px rgb(0 0 0 / 0.05);
  --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / 0.05);
  --inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / 0.05);

  --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / 0.05);
  --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.15);
  --drop-shadow-md: 0 3px 3px rgb(0 0 0 / 0.12);
  --drop-shadow-lg: 0 4px 4px rgb(0 0 0 / 0.15);
  --drop-shadow-xl: 0 9px 7px rgb(0 0 0 / 0.1);
  --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / 0.15);

  position: fixed;
  width: 0;
  height: 0;
  overflow: visible;
  z-index: var(--z-host);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ── FAB ─────────────────────────────────────────── */

.kai-fab {
  position: fixed;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-1);
  background: var(--bg-1);
  color: var(--gray-700);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-fab);
  pointer-events: auto;
  font-family: var(--font-sans);
  padding: 0;
  cursor: grab;
  user-select: none;
  transition: color 0.15s ease, background 0.15s ease;
  box-shadow: var(--shadow-sm);
}

.kai-fab:hover {
  color: var(--text-primary);
}

.kai-fab--active,
.kai-fab--active:hover {
  background: var(--color-accent);
  color: var(--white);
  border-color: var(--color-accent);
}

.kai-fab--active .kai-fab-badge {
  background: var(--white);
  color: var(--color-accent);
}

.kai-fab--dragging {
  cursor: grabbing;
}

.kai-fab svg {
  width: 24px;
  height: 24px;
}

.kai-fab[data-corner="bottom-right"] { bottom: 24px; right: 24px; border-radius: 22px 22px 22px 4px; }
.kai-fab[data-corner="bottom-left"] { bottom: 24px; left: 24px; border-radius: 22px 22px 4px 22px; }
.kai-fab[data-corner="top-right"] { top: 24px; right: 24px; border-radius: 4px 22px 22px 22px; }
.kai-fab[data-corner="top-left"] { top: 24px; left: 24px; border-radius: 22px 4px 22px 22px; }

.kai-fab-badge {
  position: absolute;
  min-width: 18px;
  height: 18px;
  background: var(--color-accent);
  color: var(--white);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  border-radius: var(--radius-full);
}

/* Badge position per corner — diagonally opposite the pointy corner */
.kai-fab[data-corner="bottom-right"] .kai-fab-badge { top: -2px; right: -2px; transform: translate(50%, -50%); }
.kai-fab[data-corner="bottom-left"]  .kai-fab-badge { top: -2px; left: -2px; transform: translate(-50%, -50%); }
.kai-fab[data-corner="top-right"]    .kai-fab-badge { bottom: -2px; right: -2px; transform: translate(50%, 50%); }
.kai-fab[data-corner="top-left"]     .kai-fab-badge { bottom: -2px; left: -2px; transform: translate(-50%, 50%); }

/* Corner-shape scoop follows badge (diagonally opposite pointy corner) */
.kai-fab--has-badge[data-corner="bottom-right"] { corner-shape: round scoop round round; border-top-right-radius: 12px; }
.kai-fab--has-badge[data-corner="bottom-left"]  { corner-shape: scoop round round round; border-top-left-radius: 12px; }
.kai-fab--has-badge[data-corner="top-right"]    { corner-shape: round round round scoop; border-bottom-right-radius: 12px; }
.kai-fab--has-badge[data-corner="top-left"]     { corner-shape: round round scoop round; border-bottom-left-radius: 12px; }

/* ── FAB Actions ─────────────────────────────────── */

.kai-fab-actions {
  position: fixed;
  display: flex;
  gap: 4px;
  z-index: var(--z-fab);
  pointer-events: auto;
}

.kai-fab--dragging ~ .kai-fab-actions {
  opacity: 0;
  pointer-events: none;
}

.kai-fab-action {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-2);
  background: var(--bg-2);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-full);
  padding: 4px;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  will-change: transform, opacity;
  box-shadow: var(--shadow-xs);
}

.kai-fab-action:hover {
  background: var(--bg-3);
  color: var(--text-primary);
}

.kai-fab-action:disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.kai-fab-action svg {
  width: 16px;
  height: 16px;
}

/* ── Overlay ─────────────────────────────────────── */

.kai-overlay {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed var(--color-accent);
  background: hsl(from var(--color-accent) h s l / 5%);
  border-radius: var(--radius-sm);
  z-index: var(--z-overlay);
  transition: all 0.08s ease;
}

/* ── Tooltip ─────────────────────────────────────── */

.kai-tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--gray-900);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-sm);
}

/* ── Popover ─────────────────────────────────────── */

.kai-popover {
  position: fixed;
  width: 320px;
  background: var(--bg-1);
  color: var(--text-primary);
  border: 1px solid var(--border-2);
  box-shadow: var(--shadow-md);
  z-index: var(--z-host);
  pointer-events: auto;
  font-family: var(--font-sans);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kai-popover-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kai-popover-path {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  word-break: break-all;
}

.kai-popover-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kai-popover-textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border-2);
  background: var(--bg-2);
  color: var(--gray-900);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  resize: vertical;
  line-height: 1.5;
  border-radius: var(--radius-sm);
  transition: border-color 0.15s ease;
}

.kai-popover-textarea:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  border-color: var(--color-accent);
}

.kai-popover-textarea::placeholder {
  color: var(--gray-400);
}

.kai-popover-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 16px 16px;
}

/* ── Buttons ─────────────────────────────────────── */

.kai-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.kai-btn--primary {
  background: var(--color-accent);
  color: var(--white);
  font-weight: 600;
}

.kai-btn--primary:hover {
  background: var(--color-accent-hover);
}

.kai-btn--secondary {
  background: var(--bg-3);
  color: var(--text-tertiary);
  border: 1px solid var(--border-3);
  padding: 0 14px;
  min-height: 36px;
}

.kai-btn--secondary:hover {
  background: var(--bg-4);
  color: var(--text-primary);
}

.kai-btn--icon {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
}

.kai-btn--icon:hover {
  background: var(--bg-3);
  color: var(--gray-700);
}

/* ── Markers ─────────────────────────────────────── */

.kai-marker {
  position: fixed;
  width: 22px;
  height: 22px;
  border-radius: 9999px 9999px 9999px var(--radius-sm);
  background: var(--color-accent);
  color: var(--white);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  z-index: var(--z-tooltip);
  border: none;
}

.kai-marker--inactive {
  background: var(--bg-3);
  border: 1.5px solid var(--border-3);
  color: var(--text-tertiary);
  pointer-events: none;
  cursor: default;
}

/* ── Annotation Boxes ───────────────────────────── */

.kai-annotation-box {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed var(--gray-300);
  background: rgb(0 0 0 / 0.02);
  z-index: var(--z-overlay);
  border-radius: var(--radius-sm);
}

/* ── Autocomplete ────────────────────────────────── */

.kai-autocomplete {
  position: fixed;
  background: var(--bg-1);
  border: 1px solid var(--border-1);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-sm);
  max-height: 200px;
  overflow-y: auto;
  z-index: var(--z-fab);
  pointer-events: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  min-width: 200px;
}

.kai-autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.08s ease;
  color: var(--text-primary);
}

.kai-autocomplete-item:hover,
.kai-autocomplete-item[aria-selected="true"] {
  background: var(--bg-2);
}

.kai-autocomplete-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gray-700);
}

.kai-autocomplete-item-value {
  color: var(--text-tertiary);
  font-size: 12px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kai-autocomplete-swatch {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-2);
  flex-shrink: 0;
}

.kai-autocomplete-rem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: var(--text-secondary);
}

.kai-autocomplete-rem:hover,
.kai-autocomplete-rem[aria-selected="true"] {
  background: var(--bg-2);
}

/* ── Syntax highlighting ─────────────────────────── */

.kai-style-prop {
  color: var(--text-tertiary);
}

.kai-style-value {
  color: var(--gray-200);
}

/* ── Measurement tool (Alt-inspect mode) ─────────── */

.kai-measure-line {
  position: fixed;
  pointer-events: none;
  background: var(--color-accent);
  z-index: var(--z-tooltip);
}

.kai-measure-line--v {
  width: 1px;
}

.kai-measure-line--v::before,
.kai-measure-line--v::after {
  content: '';
  position: absolute;
  left: -3px;
  width: 7px;
  height: 1px;
  background: var(--color-accent);
}

.kai-measure-line--v::before { top: 0; }
.kai-measure-line--v::after { bottom: 0; }

.kai-measure-line--h {
  height: 1px;
}

.kai-measure-line--h::before,
.kai-measure-line--h::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 1px;
  height: 7px;
  background: var(--color-accent);
}

.kai-measure-line--h::before { left: 0; }
.kai-measure-line--h::after { right: 0; }

.kai-measure-cross {
  position: fixed;
  pointer-events: none;
  width: 0;
  height: 0;
  z-index: var(--z-tooltip);
}

.kai-measure-cross::before,
.kai-measure-cross::after {
  content: '';
  position: absolute;
  background: var(--color-accent);
}

.kai-measure-cross::before {
  width: 11px;
  height: 1px;
  top: 0;
  left: -5px;
}

.kai-measure-cross::after {
  width: 1px;
  height: 11px;
  top: -5px;
  left: 0;
}

.kai-measure-tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--gray-900);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  z-index: var(--z-tooltip);
}

.kai-measure-tooltip--centered {
  transform: translate(-50%, -50%);
}

.kai-measure-text-tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--gray-900);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  white-space: pre;
  max-width: 280px;
  z-index: var(--z-tooltip);
}

.kai-measure-selection {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed var(--color-accent);
  background: hsl(from var(--color-accent) h s l / 5%);
  z-index: var(--z-overlay);
}

.kai-measure-highlight {
  position: fixed;
  pointer-events: none;
  border: 2px solid var(--color-accent);
  background: hsl(from var(--color-accent) h s l / 8%);
  border-radius: var(--radius-sm);
  z-index: var(--z-overlay);
}
`;
