import { ACCENTS, DEFAULT_ACCENT } from './core/accents.ts';
import { EASE_OUT } from './core/easing.ts';

export const styles = `
:host {
  --white: oklch(100% 0 0);
  --gray-50: oklch(98.5% 0 0);
  --gray-100: oklch(97% 0 0);
  --gray-200: oklch(92.2% 0 0);
  --gray-300: oklch(87% 0 0);
  --gray-400: oklch(70.8% 0 0);
  --gray-500: oklch(55.6% 0 0);
  --gray-600: oklch(43.9% 0 0);
  --gray-700: oklch(37.1% 0 0);
  --gray-800: oklch(26.9% 0 0);
  --gray-900: oklch(20.5% 0 0);
  --gray-950: oklch(14.5% 0 0);

  --color-accent: ${ACCENTS[DEFAULT_ACCENT]};
  --color-accent-hover: oklch(from var(--color-accent) calc(l - 0.052) calc(c - 0.027) h);
  --color-danger: oklch(0.6338 0.2516 24.17);
  --color-success: oklch(72.3% 0.219 149.579);

  --font-sans: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  --ease-out: ${EASE_OUT};

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

  --inv-bg-1: var(--gray-900);
  --inv-bg-2: var(--gray-800);
  --inv-bg-3: var(--gray-700);
  --inv-bg-4: var(--gray-600);

  --inv-border-1: var(--gray-800);
  --inv-border-2: var(--gray-700);
  --inv-border-3: var(--gray-600);
  --inv-border-4: var(--gray-500);

  --inv-text-primary: var(--white);
  --inv-text-secondary: var(--gray-400);
  --inv-text-tertiary: var(--gray-500);

  --inv-bg: var(--inv-bg-1);
  --inv-text: var(--inv-text-primary);
  --inv-text-muted: var(--inv-text-secondary);

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

:host([data-theme="dark"]) {
  --bg-1: var(--gray-900);
  --bg-2: var(--gray-800);
  --bg-3: var(--gray-700);
  --bg-4: var(--gray-600);

  --border-1: var(--gray-800);
  --border-2: var(--gray-700);
  --border-3: var(--gray-600);
  --border-4: var(--gray-500);

  --text-primary: var(--white);
  --text-secondary: var(--gray-400);
  --text-tertiary: var(--gray-500);

  --inv-bg-1: var(--white);
  --inv-bg-2: var(--gray-50);
  --inv-bg-3: var(--gray-100);
  --inv-bg-4: var(--gray-200);

  --inv-border-1: var(--gray-50);
  --inv-border-2: var(--gray-100);
  --inv-border-3: var(--gray-200);
  --inv-border-4: var(--gray-300);

  --inv-text-primary: var(--gray-900);
  --inv-text-secondary: var(--gray-600);
  --inv-text-tertiary: var(--gray-500);

  --shadow-2xs: 0 1px rgb(0 0 0 / 0.15);
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.2);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.35), 0 4px 6px -4px rgb(0 0 0 / 0.35);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.35), 0 8px 10px -6px rgb(0 0 0 / 0.35);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.5);
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
  color: var(--text-secondary);
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
.kai-fab--has-badge[data-corner="top-right"]    { corner-shape: round round scoop round; border-bottom-right-radius: 12px; }
.kai-fab--has-badge[data-corner="top-left"]     { corner-shape: round round round scoop; border-bottom-left-radius: 12px; }

/* ── FAB Actions ─────────────────────────────────── */

.kai-fab-actions {
  position: fixed;
  display: flex;
  gap: 4px;
  z-index: var(--z-fab);
  pointer-events: auto;
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
  pointer-events: none;
}

.kai-fab-action--armed,
.kai-fab-action--armed:hover {
  background: var(--color-accent);
  color: var(--white);
  border-color: var(--color-accent);
}

.kai-fab-action svg {
  width: 16px;
  height: 16px;
}

/* ── Settings ────────────────────────────────────── */

.kai-settings {
  position: fixed;
  width: 240px;
  background: var(--bg-1);
  color: var(--text-primary);
  border: 1px solid var(--border-2);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-xl);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1;
  z-index: var(--z-fab);
  pointer-events: auto;
  will-change: transform, opacity;
}

.kai-settings-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

/* Lowercase-only wordmark; one size up keeps it optically level with the theme labels */
.kai-settings-name {
  font-size: 14px;
  font-weight: 600;
}

.kai-settings-version {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-tertiary);
}

.kai-settings-themes,
.kai-settings-accents {
  display: flex;
  align-items: center;
}

.kai-settings-themes {
  gap: 12px;
}

.kai-settings-theme {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.15s ease;
}

.kai-settings-theme:hover {
  color: var(--text-secondary);
}

.kai-settings-theme[aria-checked="true"] {
  color: var(--text-primary);
}

.kai-settings-accents {
  gap: 8px;
}

.kai-settings-accent {
  width: 16px;
  height: 16px;
  border: none;
  padding: 0;
  border-radius: var(--radius-full);
  background: var(--swatch);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kai-settings-accent:hover {
  transform: scale(1.15);
}

.kai-settings-accent[aria-checked="true"] {
  box-shadow: 0 0 0 2px var(--bg-1), 0 0 0 3.5px var(--swatch);
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
  background: var(--inv-bg);
  color: var(--inv-text);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-sm);
}

/* ── Popover ─────────────────────────────────────── */

/* Overlays sit on the opposite palette of the page theme */
.kai-popover,
.kai-autocomplete,
.kai-settings,
.kai-fab-actions {
  --bg-1: var(--inv-bg-1);
  --bg-2: var(--inv-bg-2);
  --bg-3: var(--inv-bg-3);
  --bg-4: var(--inv-bg-4);
  --border-1: var(--inv-border-1);
  --border-2: var(--inv-border-2);
  --border-3: var(--inv-border-3);
  --border-4: var(--inv-border-4);
  --text-primary: var(--inv-text-primary);
  --text-secondary: var(--inv-text-secondary);
  --text-tertiary: var(--inv-text-tertiary);
}

.kai-popover {
  position: fixed;
  width: 320px;
  background: var(--bg-1);
  color: var(--text-primary);
  border: 1px solid var(--border-2);
  box-shadow: var(--shadow-md);
  z-index: var(--z-tooltip);
  pointer-events: auto;
  font-family: var(--font-sans);
  border-radius: var(--radius-xl);
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
  word-break: normal;
  overflow-wrap: break-word;
}

.kai-popover-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.kai-popover-textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border-2);
  background: var(--bg-2);
  color: var(--text-primary);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  resize: vertical;
  line-height: 1.5;
  border-radius: var(--radius-lg);
  transition: border-color 0.15s ease;
}

.kai-popover-textarea:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  border-color: var(--color-accent);
}

.kai-popover-textarea::placeholder {
  color: var(--text-tertiary);
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
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 160ms var(--ease-out);
  white-space: nowrap;
}

.kai-btn:active {
  transform: scale(0.97);
}

.kai-btn--primary {
  background: var(--color-accent);
  color: var(--white);
  font-weight: 600;
}

.kai-btn--secondary {
  background: var(--bg-3);
  color: var(--text-tertiary);
}

.kai-btn--danger {
  background: hsl(from var(--color-danger) h s l / 12%);
  color: var(--color-danger);
}

.kai-btn--danger[data-armed],
.kai-btn--danger[data-armed]:hover {
  background: var(--color-danger);
  color: var(--white);
}

/* Touch devices fire :hover on tap, which would leave buttons stuck in their hover state */
@media (hover: hover) and (pointer: fine) {
  .kai-btn--primary:hover {
    background: var(--color-accent-hover);
  }

  .kai-btn--secondary:hover {
    background: var(--bg-4);
    color: var(--text-primary);
  }

  .kai-btn--danger:hover {
    background: hsl(from var(--color-danger) h s l / 20%);
  }

  .kai-btn--icon:hover {
    background: var(--bg-3);
    color: var(--text-secondary);
  }
}

.kai-btn--icon {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-tertiary);
}

/* ── Markers ─────────────────────────────────────── */

.kai-marker,
.kai-marker-stack {
  position: fixed;
  width: 22px;
  height: 22px;
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
  z-index: var(--z-host);
  border: 1px solid var(--color-accent);
}

.kai-marker {
  border-radius: 9999px 9999px 9999px var(--radius-sm);
}

.kai-marker-stack {
  border-radius: 11px 11px 11px 0;
}

.kai-marker-stack--has-badge {
  corner-shape: round scoop round round;
  border-top-right-radius: 6px;
}

.kai-marker--inactive,
.kai-marker-stack--inactive {
  background: var(--bg-3);
  border-color: var(--bg-3);
  color: var(--text-tertiary);
  pointer-events: none;
  cursor: default;
}

.kai-marker-stack-badge {
  position: absolute;
  min-width: 14px;
  height: 14px;
  background: var(--white);
  color: var(--color-accent);
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
  border-radius: var(--radius-full);
  top: -2px;
  right: -2px;
  transform: translate(50%, -50%);
}

.kai-marker-stack--inactive .kai-marker-stack-badge {
  background: var(--border-3);
  color: var(--text-tertiary);
}

.kai-stack-expanded {
  position: fixed;
  display: flex;
  gap: 6px;
  z-index: var(--z-tooltip);
  pointer-events: auto;
  align-items: center;
}

.kai-stack-expanded-marker {
  width: 22px;
  height: 22px;
  border-radius: 9999px 9999px 9999px var(--radius-sm);
  background: var(--color-accent);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  will-change: transform, opacity;
  box-shadow: var(--shadow-xs);
}

.kai-stack-expanded-marker svg {
  width: 12px;
  height: 12px;
}

/* ── Annotation Boxes ───────────────────────────── */

.kai-annotation-box {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed hsl(from var(--color-accent) h s l / 50%);
  background: hsl(from var(--color-accent) h s l / 3%);
  z-index: var(--z-overlay);
  border-radius: var(--radius-sm);
}

/* ── Autocomplete ────────────────────────────────── */

.kai-autocomplete {
  position: fixed;
  background: var(--bg-1);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
  max-height: 200px;
  overflow-y: auto;
  z-index: var(--z-tooltip);
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
  color: var(--text-primary);
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
  background: var(--inv-bg);
  color: var(--inv-text);
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
  background: var(--inv-bg);
  color: var(--inv-text);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  white-space: pre;
  max-width: 280px;
  z-index: var(--z-tooltip);
}

.kai-measure-text-tooltip .kai-tt-label {
  display: inline-block;
  width: 6ch;
  text-align: right;
  margin-right: 2ch;
  color: var(--inv-text-muted);
}

.kai-measure-selection {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed var(--color-accent);
  background: hsl(from var(--color-accent) h s l / 5%);
  border-radius: var(--radius-sm);
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

/* ── Guide Bar ──────────────────────────────────── */

.kai-guide-bar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  background: var(--inv-bg);
  color: var(--inv-text);
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-fab);
  pointer-events: none;
  white-space: nowrap;
}

.kai-guide-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kai-guide-bar-sep {
  color: var(--inv-text-muted);
}

.kai-guide-bar-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: var(--gray-700);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  transition: background 0.15s ease;
}

.kai-guide-bar-kbd[data-pressed] {
  background: var(--color-accent);
}

.kai-guide-bar-hint {
  color: var(--inv-text-muted);
}
`;
