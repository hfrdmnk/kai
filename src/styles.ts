export const styles = `
:host {
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

  --font-sans: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --z-overlay: 2147483643;
  --z-tooltip: 2147483644;
  --z-host: 2147483645;
  --z-fab: 2147483646;

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
  border: 1px solid var(--gray-100);
  background: white;
  color: var(--gray-700);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-fab);
  pointer-events: auto;
  font-family: var(--font-sans);
  border-radius: 0.5rem;
  padding: 0;
  cursor: grab;
  user-select: none;
  transition: color 0.15s ease, background 0.15s ease;
}

.kai-fab:hover {
  color: var(--gray-900);
}

.kai-fab--active,
.kai-fab--active:hover {
  background: var(--color-accent);
  color: hsl(0, 0%, 100%);
}

.kai-fab--dragging {
  cursor: grabbing;
}

.kai-fab svg {
  width: 24px;
  height: 24px;
}

.kai-fab[data-corner="bottom-right"] { bottom: 24px; right: 24px; }
.kai-fab[data-corner="bottom-left"] { bottom: 24px; left: 24px; }
.kai-fab[data-corner="top-right"] { top: 24px; right: 24px; }
.kai-fab[data-corner="top-left"] { top: 24px; left: 24px; }

.kai-fab-badge {
  position: absolute;
  min-width: 18px;
  height: 18px;
  background: var(--color-accent);
  color: hsl(0, 0%, 100%);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  border-radius: 9999px;
}

/* Badge position per corner — centered on the inward corner point, 2px outward gap */
.kai-fab[data-corner="bottom-right"] .kai-fab-badge { top: -2px; left: -2px; transform: translate(-50%, -50%); }
.kai-fab[data-corner="bottom-left"]  .kai-fab-badge { top: -2px; right: -2px; transform: translate(50%, -50%); }
.kai-fab[data-corner="top-right"]    .kai-fab-badge { bottom: -2px; left: -2px; transform: translate(-50%, 50%); }
.kai-fab[data-corner="top-left"]     .kai-fab-badge { bottom: -2px; right: -2px; transform: translate(50%, 50%); }

/* Scoop progressive enhancement — only the badge corner is scooped */
.kai-fab--has-badge[data-corner="bottom-right"] {
  corner-shape: scoop round round round;
  border-top-left-radius: 12px;
}
.kai-fab--has-badge[data-corner="bottom-left"] {
  corner-shape: round scoop round round;
  border-top-right-radius: 12px;
}
.kai-fab--has-badge[data-corner="top-right"] {
  corner-shape: round round round scoop;
  border-bottom-left-radius: 12px;
}
.kai-fab--has-badge[data-corner="top-left"] {
  corner-shape: round round scoop round;
  border-bottom-right-radius: 12px;
}

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
  border: 1px solid var(--gray-100);
  background: white;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 4px;
  transition: background 0.15s ease, color 0.15s ease;
  will-change: transform, opacity;
}

.kai-fab-action:hover {
  background: var(--gray-50);
  color: var(--gray-900);
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
  border-radius: 0.25rem;
  z-index: var(--z-overlay);
  transition: all 0.08s ease;
}

/* ── Tooltip ─────────────────────────────────────── */

.kai-tooltip {
  position: fixed;
  pointer-events: none;
  background: var(--gray-900);
  color: white;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 0.25rem;
  white-space: nowrap;
  z-index: var(--z-tooltip);
}

/* ── Popover ─────────────────────────────────────── */

.kai-popover {
  position: fixed;
  width: 320px;
  background: hsl(0, 0%, 100%);
  color: var(--gray-900);
  border: 1px solid var(--gray-100);
  z-index: var(--z-host);
  pointer-events: auto;
  font-family: var(--font-sans);
  border-radius: 0.5rem;
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
  color: var(--gray-500);
  line-height: 1.5;
  word-break: break-all;
}

.kai-popover-desc {
  font-size: 12px;
  color: var(--gray-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kai-popover-textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--gray-100);
  background: var(--gray-50);
  color: var(--gray-900);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  resize: vertical;
  line-height: 1.5;
  border-radius: 0.25rem;
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
  border-radius: 0.25rem;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.kai-btn--primary {
  background: var(--color-accent);
  color: hsl(0, 0%, 100%);
  font-weight: 600;
}

.kai-btn--primary:hover {
  background: var(--color-accent-hover);
}

.kai-btn--ghost {
  background: var(--gray-100);
  color: var(--gray-500);
  padding: 0 8px;
  min-height: 36px;
}

.kai-btn--ghost:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.kai-btn--icon {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--gray-500);
}

.kai-btn--icon:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* ── Markers ─────────────────────────────────────── */

.kai-marker {
  position: fixed;
  width: 22px;
  height: 22px;
  border-radius: 9999px 9999px 9999px 4px;
  background: var(--color-accent);
  color: hsl(0, 0%, 100%);
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

/* ── Annotation Boxes ───────────────────────────── */

.kai-annotation-box {
  position: fixed;
  pointer-events: none;
  border: 1.5px dashed var(--color-accent);
  background:  hsl(from var(--color-accent) h s l / 10%);
  z-index: var(--z-overlay);
  border-radius: 0.25rem;
}

/* ── Autocomplete ────────────────────────────────── */

.kai-autocomplete {
  position: fixed;
  background: white;
  border: 1px solid var(--gray-100);
  border-radius: 0.25rem;
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
  color: var(--gray-900);
}

.kai-autocomplete-item:hover,
.kai-autocomplete-item[aria-selected="true"] {
  background: var(--gray-50);
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
  color: var(--gray-500);
  font-size: 12px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kai-autocomplete-swatch {
  width: 12px;
  height: 12px;
  border-radius: 0.25rem;
  border: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.kai-autocomplete-rem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: var(--gray-600);
}

.kai-autocomplete-rem:hover,
.kai-autocomplete-rem[aria-selected="true"] {
  background: var(--gray-50);
}

/* ── Toast ───────────────────────────────────────── */

.kai-toast {
  position: fixed;
  background: white;
  color: hsl(0, 0%, 100%);
  background: var(--color-accent);
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 0.5rem;
  z-index: var(--z-fab);
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
  animation: kai-toast-in 0.15s ease forwards;
}

.kai-toast--out {
  animation: kai-toast-out 0.15s ease forwards;
}

@keyframes kai-toast-in {
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes kai-toast-out {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(8px); }
}

/* ── Syntax highlighting ─────────────────────────── */

.kai-style-prop {
  color: var(--gray-500);
}

.kai-style-value {
  color: var(--gray-200);
}
`;
