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

  --color-cold: oklch(0.7856 0.147881 224.2696);
  --color-warm: oklch(0.6759 0.21747 38.8022);

  --font-sans: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

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
  outline: 2px solid var(--color-cold);
  outline-offset: 2px;
}

/* ── FAB ─────────────────────────────────────────── */

.kai-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--gray-900);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-fab);
  pointer-events: auto;
  transition: background 0.15s ease, transform 0.15s ease;
  font-family: var(--font-sans);
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}

.kai-fab:hover {
  background: var(--gray-800);
  transform: scale(1.05);
}

.kai-fab.kai-fab--active {
  background: var(--color-cold);
}

.kai-fab.kai-fab--active:hover {
  background: var(--color-cold);
  filter: brightness(1.1);
}

.kai-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--color-warm);
  color: white;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.kai-drawer-toggle {
  position: fixed;
  bottom: 76px;
  right: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--gray-200);
  background: white;
  color: var(--gray-700);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-fab);
  pointer-events: auto;
  transition: background 0.15s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}

.kai-drawer-toggle:hover {
  background: var(--gray-50);
}

/* ── Overlay ─────────────────────────────────────── */

.kai-overlay {
  position: fixed;
  pointer-events: none;
  border: 2px solid var(--color-cold);
  background: oklch(0.7856 0.147881 224.2696 / 8%);
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
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  z-index: var(--z-tooltip);
}

/* ── Panel ───────────────────────────────────────── */

.kai-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: white;
  border-left: 1px solid var(--gray-200);
  z-index: var(--z-host);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
  transform: translateX(100%);
  transition: transform 0.2s ease;
  overflow: hidden;
}

.kai-panel.kai-panel--open {
  transform: translateX(0);
}

.kai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.kai-panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.kai-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.kai-panel-section {
  margin-bottom: 20px;
}

.kai-panel-section:last-child {
  margin-bottom: 0;
}

.kai-panel-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.kai-panel-selector {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--gray-800);
  background: var(--gray-50);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.kai-panel-path {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--gray-500);
  word-break: break-all;
  line-height: 1.5;
}

.kai-panel-styles {
  list-style: none;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.8;
}

.kai-panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.kai-panel-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--gray-900);
  resize: vertical;
  line-height: 1.5;
  background: white;
  transition: border-color 0.15s ease;
}

.kai-panel-textarea:focus {
  outline: none;
  border-color: var(--color-cold);
}

.kai-panel-textarea::placeholder {
  color: var(--gray-400);
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
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.kai-btn--primary {
  background: var(--gray-900);
  color: white;
  min-height: 44px;
  width: 100%;
}

.kai-btn--primary:hover {
  background: var(--gray-800);
}

.kai-btn--secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

.kai-btn--secondary:hover {
  background: var(--gray-200);
}

.kai-btn--ghost {
  background: transparent;
  color: var(--gray-600);
  padding: 0;
  min-height: 0;
}

.kai-btn--ghost:hover {
  color: var(--gray-900);
}

.kai-btn--icon {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--gray-500);
}

.kai-btn--icon:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.kai-btn--danger:hover {
  background: oklch(0.6759 0.21747 38.8022 / 12%);
  color: var(--color-warm);
}

/* ── Drawer ──────────────────────────────────────── */

.kai-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 340px;
  height: 100vh;
  background: white;
  border-right: 1px solid var(--gray-200);
  z-index: var(--z-host);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
  transform: translateX(-100%);
  transition: transform 0.2s ease;
}

.kai-drawer.kai-drawer--open {
  transform: translateX(0);
}

.kai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.kai-drawer-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.kai-drawer-count {
  font-size: 12px;
  color: var(--gray-400);
  font-weight: 400;
  margin-left: 6px;
}

.kai-drawer-actions {
  display: flex;
  gap: 4px;
}

.kai-drawer-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
}

.kai-drawer-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: background 0.1s ease;
}

.kai-drawer-item:hover {
  background: var(--gray-50);
}

.kai-drawer-item:focus-visible {
  outline-offset: -2px;
}

.kai-drawer-item-number {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-warm);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.kai-drawer-item-body {
  flex: 1;
  min-width: 0;
}

.kai-drawer-item-selector {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--gray-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kai-drawer-item-comment {
  font-size: 12px;
  color: var(--gray-400);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kai-drawer-item-delete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s ease;
}

.kai-drawer-item:hover .kai-drawer-item-delete,
.kai-drawer-item:focus-within .kai-drawer-item-delete {
  opacity: 1;
}

.kai-drawer-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.kai-drawer-footer .kai-btn {
  flex: 1;
}

/* ── Markers ─────────────────────────────────────── */

.kai-marker {
  position: fixed;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-warm);
  color: white;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: var(--z-overlay);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

/* ── Autocomplete ────────────────────────────────── */

.kai-autocomplete {
  position: fixed;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
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
  color: var(--gray-800);
}

.kai-autocomplete-item-value {
  color: var(--gray-400);
  font-size: 11px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kai-autocomplete-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid var(--gray-200);
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
  bottom: 80px;
  right: 24px;
  background: var(--gray-900);
  color: white;
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  z-index: var(--z-fab);
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px);
  animation: kai-toast-in 0.15s ease forwards;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}

.kai-toast--out {
  animation: kai-toast-out 0.15s ease forwards;
}

@keyframes kai-toast-in {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes kai-toast-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(8px); }
}

/* ── Syntax highlighting ─────────────────────────── */

.kai-style-prop {
  color: var(--gray-500);
}

.kai-style-value {
  color: var(--gray-900);
}
`;
