(function() {
	const ACCENTS = {
		red: "oklch(0.649 0.237 26.973)",
		orange: "oklch(0.6927 0.2513 38.8022)",
		yellow: "oklch(0.815 0.167 88.756)",
		green: "oklch(0.748 0.175 153.527)",
		teal: "oklch(0.771 0.132 205.437)",
		blue: "oklch(0.632 0.202 254.088)",
		violet: "oklch(0.56 0.244 275.119)"
	};
	const ACCENT_IDS = Object.keys(ACCENTS);
	const DEFAULT_ACCENT = "orange";
	const isAccentId = (v) => typeof v === "string" && v in ACCENTS;
	const applyAccent = (host, accent) => {
		if (accent === "orange") host.style.removeProperty("--color-accent");
		else host.style.setProperty("--color-accent", ACCENTS[accent]);
	};
	const SPRING = "linear(0, 0.008 1.1%, 0.034 2.3%, 0.134 4.9%, 0.264 7.3%, 0.683 14.3%, 0.797 16.5%, 0.89 18.6%, 0.967 20.7%, 1.027 22.8%, 1.073 25%, 1.104 27.3%, 1.123 30.6%, 1.119 34.3%, 1.018 49.5%, 0.988 58.6%, 0.985 65.2%, 1 84.5%, 1)";
	const GLIDE = "linear(0, 0.012 0.9%, 0.05 2%, 0.411 9.2%, 0.517 11.8%, 0.611 14.6%, 0.694 17.7%, 0.765 21.1%, 0.824 24.8%, 0.872 28.9%, 0.91 33.4%, 0.939 38.4%, 0.977 50.9%, 0.994 68.4%, 1)";
	const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
	const SNAP = "linear(0, 0.007 2%, 0.027 4%, 0.055 6%, 0.091 8%, 0.131 10%, 0.175 12%, 0.243 15%, 0.312 18%, 0.380 21%, 0.466 25%, 0.562 30%, 0.645 35%, 0.715 40%, 0.821 50%, 0.890 60%, 0.949 75%, 1)";
	const styles = `
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

  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);

  --inv-bg-1: var(--gray-900);
  --inv-bg-2: var(--gray-800);
  --inv-bg-3: var(--gray-700);
  --inv-bg-4: var(--gray-600);

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

  --text-primary: var(--white);
  --text-secondary: var(--gray-400);
  --text-tertiary: var(--gray-500);

  --inv-bg-1: var(--white);
  --inv-bg-2: var(--gray-50);
  --inv-bg-3: var(--gray-100);
  --inv-bg-4: var(--gray-200);

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
  border: none;
  background: var(--inv-bg);
  color: var(--inv-text-muted);
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
  color: var(--inv-text);
}

.kai-fab--active,
.kai-fab--active:hover {
  background: var(--color-accent);
  color: var(--white);
}

/* Badge always takes the palette the FAB is not using */
.kai-fab--active .kai-fab-badge {
  background: var(--inv-bg);
  color: var(--inv-text);
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
  min-height: 18px;
  aspect-ratio: 1;
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

/* Badge centred on the corner diagonally opposite the pointy one; transform-origin sits on
   that visual centre so scale animations grow from where the badge actually is */
.kai-fab[data-corner="bottom-right"] .kai-fab-badge { top: 0; right: 0; transform: translate(50%, -50%); transform-origin: 100% 0; }
.kai-fab[data-corner="bottom-left"]  .kai-fab-badge { top: 0; left: 0; transform: translate(-50%, -50%); transform-origin: 0 0; }
.kai-fab[data-corner="top-right"]    .kai-fab-badge { bottom: 0; right: 0; transform: translate(50%, 50%); transform-origin: 100% 100%; }
.kai-fab[data-corner="top-left"]     .kai-fab-badge { bottom: 0; left: 0; transform: translate(-50%, 50%); transform-origin: 0 100%; }

/* Scoop concentric with the circular badge; --kai-scoop is badge radius + 2px, set by updateBadge */
.kai-fab--has-badge[data-corner="bottom-right"] { corner-shape: round scoop round round; border-top-right-radius: var(--kai-scoop, 11px); }
.kai-fab--has-badge[data-corner="bottom-left"]  { corner-shape: scoop round round round; border-top-left-radius: var(--kai-scoop, 11px); }
.kai-fab--has-badge[data-corner="top-right"]    { corner-shape: round round scoop round; border-bottom-right-radius: var(--kai-scoop, 11px); }
.kai-fab--has-badge[data-corner="top-left"]     { corner-shape: round round round scoop; border-bottom-left-radius: var(--kai-scoop, 11px); }

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
  border: none;
  background: var(--bg-2);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-full);
  padding: 4px;
  transition: background 0.15s ease, color 0.15s ease;
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

.kai-tooltip-kbd {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 4px;
  background: var(--gray-700);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  vertical-align: 1px;
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
  --text-primary: var(--inv-text-primary);
  --text-secondary: var(--inv-text-secondary);
  --text-tertiary: var(--inv-text-tertiary);
}

.kai-popover {
  position: fixed;
  width: 320px;
  background: var(--bg-1);
  color: var(--text-primary);
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
  border: none;
  background: var(--bg-2);
  color: var(--text-primary);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  resize: vertical;
  line-height: 1.5;
  border-radius: var(--radius-lg);
}

.kai-popover-textarea:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
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
  border: none;
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
	var SHADOW_SEP = " >>> ";
	const composedParent = (el) => {
		if (el.parentElement) return el.parentElement;
		const root = el.getRootNode();
		return root instanceof ShadowRoot ? root.host : null;
	};
	const composedContains = (ancestor, el) => {
		let current = el;
		while (current) {
			if (current === ancestor) return true;
			current = composedParent(current);
		}
		return false;
	};
	const composedChildren = (el) => [...Array.from(el.shadowRoot?.children ?? []), ...Array.from(el.children)];
	var scopedSelector = (el, root) => {
		if (root === document) {
			if (el === document.body) return "body";
			if (el === document.documentElement) return "html";
		}
		if (el.id) return `#${el.id}`;
		const parts = [];
		let current = el;
		while (current && current !== document.body && parts.length < 4) {
			let segment = current.tagName.toLowerCase();
			if (current.id) {
				parts.unshift(`#${current.id}`);
				break;
			}
			const classes = Array.from(current.classList).filter((c) => !c.startsWith("kai-")).slice(0, 2);
			if (classes.length) segment += `.${classes.join(".")}`;
			const candidate = [...parts];
			candidate.unshift(segment);
			const selector = candidate.join(" > ");
			if (root.querySelectorAll(selector).length === 1) return selector;
			const parent = current.parentElement;
			if (parent) {
				const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
				if (siblings.length > 1) {
					const index = siblings.indexOf(current) + 1;
					segment += `:nth-of-type(${index})`;
				}
			}
			parts.unshift(segment);
			current = current.parentElement;
		}
		return parts.join(" > ");
	};
	const generateSelector = (el) => {
		const root = el.getRootNode();
		if (root instanceof ShadowRoot) return generateSelector(root.host) + SHADOW_SEP + scopedSelector(el, root);
		return scopedSelector(el, document);
	};
	var scopedLocator = (el, root) => {
		const parts = [];
		let current = el;
		while (current && current !== document.body && current !== document.documentElement) {
			const parent = current.parentNode;
			const index = parent ? Array.from(parent.children).indexOf(current) + 1 : 0;
			parts.unshift(index ? `${current.tagName.toLowerCase()}:nth-child(${index})` : current.tagName.toLowerCase());
			current = current.parentElement;
		}
		if (root === document) parts.unshift(current === document.documentElement ? "html" : "body");
		return parts.join(" > ");
	};
	const generateLocator = (el) => {
		const root = el.getRootNode();
		if (root instanceof ShadowRoot) return generateLocator(root.host) + SHADOW_SEP + scopedLocator(el, root);
		return scopedLocator(el, document);
	};
	const resolveSelector = (selector) => {
		let scope = document;
		let el = null;
		for (const part of selector.split(SHADOW_SEP)) {
			el = scope.querySelector(part);
			if (!el) return null;
			if (!el.shadowRoot) return el;
			scope = el.shadowRoot;
		}
		return el;
	};
	const resolveAnnotation = (a) => {
		try {
			if (a.locator) {
				const hit = resolveSelector(a.locator);
				if (hit && hit.tagName.toLowerCase() === a.element) return hit;
			}
			return resolveSelector(a.selector);
		} catch {
			return null;
		}
	};
	const generatePath = (el) => {
		if (el === document.documentElement) return "html";
		if (el === document.body) return "html › body";
		const parts = [];
		let current = el;
		while (current && current !== document.documentElement) {
			let segment = current.tagName.toLowerCase();
			const classes = Array.from(current.classList).filter((c) => !c.startsWith("kai-")).slice(0, 2);
			if (classes.length) segment += `.${classes.join(".")}`;
			parts.unshift(segment);
			current = composedParent(current);
		}
		return parts.join(" › ");
	};
	var TRACKED_PROPERTIES = [
		"font-size",
		"font-weight",
		"font-family",
		"line-height",
		"color",
		"background-color",
		"padding-top",
		"padding-right",
		"padding-bottom",
		"padding-left",
		"margin-top",
		"margin-right",
		"margin-bottom",
		"margin-left",
		"border-radius",
		"width",
		"height",
		"display",
		"position",
		"gap"
	];
	const pxToRem = (value) => {
		const match = value.match(/^(\d+(?:\.\d+)?)px$/);
		if (!match) return null;
		const rem = parseFloat(match[1]) / 16;
		return `${Math.round(rem * 1e3) / 1e3}rem`;
	};
	const getComputedStyles = (el) => {
		const computed = window.getComputedStyle(el);
		const result = {};
		for (const prop of TRACKED_PROPERTIES) {
			const value = computed.getPropertyValue(prop);
			if (!value) continue;
			const rem = pxToRem(value);
			result[prop] = rem ? `${value} (${rem})` : value;
		}
		return result;
	};
	const getDirectText = (el) => {
		const text = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim()).filter(Boolean).join(" ").trim();
		if (!text) return "";
		return text.slice(0, 40) + (text.length > 40 ? "…" : "");
	};
	const getNearbyText = (el) => {
		const texts = [];
		const prev = el.previousElementSibling;
		if (prev) texts.push(prev.textContent?.trim() ?? "");
		texts.push(el.textContent?.trim() ?? "");
		const next = el.nextElementSibling;
		if (next) texts.push(next.textContent?.trim() ?? "");
		const combined = texts.filter(Boolean).join(" ").trim();
		return combined.length > 80 ? combined.slice(0, 80) + "…" : combined;
	};
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
	const PASS_THROUGH_KEY = isMac ? "Meta" : "Control";
	const SHORTCUTS = {
		pick: {
			keys: ["S"],
			label: "S"
		},
		copy: {
			keys: ["M"],
			label: "M"
		},
		clear: {
			keys: ["Backspace", "Delete"],
			label: isMac ? "⌫" : "Del"
		},
		settings: {
			keys: [","],
			label: ","
		}
	};
	var getKey = () => `ui-annotator:${location.origin}${location.pathname}`;
	var FAB_CORNER_KEY = "ui-annotator:fab-corner";
	var THEME_KEY = "ui-annotator:theme";
	var ACCENT_KEY = "ui-annotator:accent";
	const loadSession = () => {
		try {
			const raw = localStorage.getItem(getKey());
			if (!raw) return [];
			return JSON.parse(raw);
		} catch {
			return [];
		}
	};
	const saveSession = (annotations) => {
		try {
			localStorage.setItem(getKey(), JSON.stringify(annotations));
		} catch {}
	};
	const clearSession = () => {
		try {
			localStorage.removeItem(getKey());
		} catch {}
	};
	const loadFabCorner = () => {
		try {
			const raw = localStorage.getItem(FAB_CORNER_KEY);
			if (raw === "top-left" || raw === "top-right" || raw === "bottom-left" || raw === "bottom-right") return raw;
			return "bottom-left";
		} catch {
			return "bottom-left";
		}
	};
	const saveFabCorner = (corner) => {
		try {
			localStorage.setItem(FAB_CORNER_KEY, corner);
		} catch {}
	};
	const loadTheme = () => {
		try {
			const raw = localStorage.getItem(THEME_KEY);
			if (raw === "system" || raw === "light" || raw === "dark") return raw;
			return "system";
		} catch {
			return "system";
		}
	};
	const saveTheme = (theme) => {
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {}
	};
	const loadAccent = () => {
		try {
			const raw = localStorage.getItem(ACCENT_KEY);
			return isAccentId(raw) ? raw : DEFAULT_ACCENT;
		} catch {
			return DEFAULT_ACCENT;
		}
	};
	const saveAccent = (accent) => {
		try {
			localStorage.setItem(ACCENT_KEY, accent);
		} catch {}
	};
	const computeCrosshair = (cx, cy, shadowHost) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const probe = (x, y) => {
			const el = document.elementFromPoint(x, y);
			if (!el) return false;
			if (el === shadowHost) return true;
			return el === document.elementFromPoint(cx, cy) || el === shadowHost;
		};
		const searchBoundary = (axis, direction) => {
			const max = axis === "x" ? direction === 1 ? vw - cx : cx : direction === 1 ? vh - cy : cy;
			if (max <= 0) return 0;
			let lo = 0;
			let hi = max;
			let step = 1;
			while (step < max) {
				const testX = axis === "x" ? cx + direction * step : cx;
				const testY = axis === "y" ? cy + direction * step : cy;
				if (testX < 0 || testX >= vw || testY < 0 || testY >= vh) {
					hi = step;
					break;
				}
				if (!probe(testX, testY)) {
					hi = step;
					lo = step / 2;
					break;
				}
				step *= 2;
			}
			if (hi === max && probe(axis === "x" ? cx + direction * (max - 1) : cx, axis === "y" ? cy + direction * (max - 1) : cy)) return max;
			while (hi - lo > 1) {
				const mid = Math.floor((lo + hi) / 2);
				if (probe(axis === "x" ? cx + direction * mid : cx, axis === "y" ? cy + direction * mid : cy)) lo = mid;
				else hi = mid;
			}
			return lo;
		};
		const distRight = searchBoundary("x", 1);
		const distLeft = searchBoundary("x", -1);
		const distDown = searchBoundary("y", 1);
		const distUp = searchBoundary("y", -1);
		return {
			cx,
			cy,
			left: cx - distLeft,
			right: cx + distRight,
			top: cy - distUp,
			bottom: cy + distDown,
			width: distLeft + distRight,
			height: distUp + distDown
		};
	};
	var rgbToHex = (rgb) => {
		const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (!match) return rgb;
		const r = parseInt(match[1], 10);
		const g = parseInt(match[2], 10);
		const b = parseInt(match[3], 10);
		return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
	};
	const computeTextInspectData = (el) => {
		if (!getDirectText(el)) return null;
		const cs = window.getComputedStyle(el);
		const fontSize = cs.fontSize;
		const fsRem = pxToRem(fontSize);
		const lineHeight = cs.lineHeight;
		const lhRem = pxToRem(lineHeight);
		const letterSpacing = cs.letterSpacing;
		const lsRem = letterSpacing !== "normal" ? pxToRem(letterSpacing) : null;
		return {
			fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
			fontSize: fsRem ? `${fontSize} (${fsRem})` : fontSize,
			fontWeight: cs.fontWeight,
			lineHeight: lhRem ? `${lineHeight} (${lhRem})` : lineHeight,
			color: rgbToHex(cs.color),
			letterSpacing: lsRem ? `${letterSpacing} (${lsRem})` : letterSpacing === "normal" ? "normal" : letterSpacing
		};
	};
	const findLargestEnclosedElement = (selectionRect, shadowHost) => {
		const candidates = /* @__PURE__ */ new Set();
		const hitCounts = /* @__PURE__ */ new Map();
		const step = 20;
		for (let x = selectionRect.left + step / 2; x < selectionRect.right; x += step) for (let y = selectionRect.top + step / 2; y < selectionRect.bottom; y += step) {
			const el = document.elementFromPoint(x, y);
			if (!el || el === shadowHost || el === document.documentElement || el === document.body) continue;
			hitCounts.set(el, (hitCounts.get(el) || 0) + 1);
			let current = el;
			while (current && current !== document.documentElement && current !== document.body) {
				candidates.add(current);
				current = current.parentElement;
			}
		}
		let largest = null;
		let largestArea = 0;
		for (const el of candidates) {
			if (el === shadowHost) continue;
			const rect = el.getBoundingClientRect();
			if (rect.left >= selectionRect.left && rect.top >= selectionRect.top && rect.right <= selectionRect.right && rect.bottom <= selectionRect.bottom) {
				const area = rect.width * rect.height;
				if (area > largestArea) {
					largestArea = area;
					largest = el;
				}
			}
		}
		if (largest) return largest;
		let bestMatch = null;
		let maxHits = 0;
		for (const [el, count] of hitCounts) if (count > maxHits) {
			maxHits = count;
			bestMatch = el;
		}
		return bestMatch;
	};
	var formatHeading = (a) => {
		return `${a.element ?? "element"}${a.classes?.length ? "." + a.classes.join(".") : ""}`;
	};
	const toMarkdown = (annotations) => {
		const url = annotations[0]?.url ?? location.href;
		const lines = [
			`# Page Feedback: ${(() => {
				try {
					return new URL(url).pathname;
				} catch {
					return url;
				}
			})()}`,
			`**URL:** ${url}`,
			`**Viewport:** ${window.innerWidth}×${window.innerHeight}`,
			`**Exported:** ${(/* @__PURE__ */ new Date()).toISOString()}`,
			""
		];
		annotations.forEach((a, i) => {
			lines.push("---");
			lines.push("");
			lines.push(`### ${i + 1}. ${formatHeading(a)}`);
			lines.push("");
			lines.push(`**Selector:** \`${a.selector}\``);
			lines.push(`**Path:** ${a.path}`);
			if (a.classes?.length) lines.push(`**Classes:** ${a.classes.map((c) => "`." + c + "`").join(", ")}`);
			lines.push(`**Bounding box:** x:${Math.round(a.rect.x)}, y:${Math.round(a.rect.y)}, ${Math.round(a.rect.w)}×${Math.round(a.rect.h)}px`);
			if (a.nearbyText) lines.push(`**Nearby text:** "${a.nearbyText}"`);
			lines.push("");
			const styleEntries = Object.entries(a.styles);
			if (styleEntries.length) {
				lines.push("**Computed CSS:**");
				lines.push("```css");
				for (const [prop, value] of styleEntries) lines.push(`${prop}: ${value};`);
				lines.push("```");
				lines.push("");
			}
			const ariaEntries = Object.entries(a.ariaAttributes ?? {});
			if (ariaEntries.length) lines.push(`**Accessibility:** ${ariaEntries.map(([k, v]) => `${k}="${v}"`).join(", ")}`);
			const dataEntries = Object.entries(a.dataAttributes ?? {});
			if (dataEntries.length) lines.push(`**Data attributes:** ${dataEntries.map(([k, v]) => `${k}="${v}"`).join(", ")}`);
			if (ariaEntries.length || dataEntries.length) lines.push("");
			if (a.comment) {
				lines.push(`**Annotation:** ${a.comment}`);
				lines.push("");
			}
		});
		return lines.join("\n");
	};
	var GAP = 4;
	const createOverlay = (shadowRoot) => {
		const boxes = [];
		let current = null;
		const tooltip = document.createElement("div");
		tooltip.className = "kai-tooltip";
		tooltip.setAttribute("aria-hidden", "true");
		tooltip.style.display = "none";
		shadowRoot.appendChild(tooltip);
		const getBox = (i) => {
			while (boxes.length <= i) {
				const box = document.createElement("div");
				box.className = "kai-overlay";
				box.setAttribute("aria-hidden", "true");
				box.style.display = "none";
				shadowRoot.insertBefore(box, tooltip);
				boxes.push(box);
			}
			return boxes[i];
		};
		const describeElement = (el) => {
			let label = el.tagName.toLowerCase();
			if (el.id) label += `#${el.id}`;
			const classes = Array.from(el.classList).filter((c) => !c.startsWith("kai-")).slice(0, 3);
			if (classes.length) label += `.${classes.join(".")}`;
			const textPreview = getDirectText(el);
			if (textPreview) label += `: "${textPreview}"`;
			return label;
		};
		const placeBox = (box, rect) => {
			box.style.display = "block";
			box.style.top = `${rect.top - GAP}px`;
			box.style.left = `${rect.left - GAP}px`;
			box.style.width = `${rect.width + GAP * 2}px`;
			box.style.height = `${rect.height + GAP * 2}px`;
		};
		const show = (el) => {
			current = el;
			const bounding = el.getBoundingClientRect();
			const fragments = Array.from(el.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
			const rects = fragments.length > 1 ? fragments : [bounding];
			rects.forEach((rect, i) => placeBox(getBox(i), rect));
			for (let i = rects.length; i < boxes.length; i++) boxes[i].style.display = "none";
			tooltip.textContent = describeElement(el);
			tooltip.style.display = "block";
			const tw = tooltip.offsetWidth;
			const th = tooltip.offsetHeight;
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight;
			const pad = 4;
			const left = Math.max(pad, Math.min(bounding.left, vw - tw - pad));
			let top;
			if (bounding.top > th + pad + 2) top = bounding.top - th - 2;
			else if (bounding.bottom + th + 6 < vh - pad) top = bounding.bottom + 6;
			else top = pad;
			tooltip.style.left = `${left}px`;
			tooltip.style.top = `${top}px`;
		};
		const hide = () => {
			current = null;
			for (const box of boxes) box.style.display = "none";
			tooltip.style.display = "none";
		};
		const refresh = () => {
			if (!current) return;
			if (!current.isConnected) {
				hide();
				return;
			}
			show(current);
		};
		const destroy = () => {
			for (const box of boxes) box.remove();
			tooltip.remove();
		};
		return {
			show,
			hide,
			refresh,
			destroy
		};
	};
	var kai_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 4V20M18 6L6.00001 18M20 12L4 12M18 18L6.00001 6.00001\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var trash_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9 3H15M3 6H21M10 16V11M14 16V11M5 6H19L18.1245 19.133C18.0544 20.1836 17.1818 21 16.1289 21L7.8461 21C6.79171 21 5.91842 20.1814 5.85028 19.1292L5 6Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var copy_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5M11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var check_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 12L9 18L21 6\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var help_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 20.9642V21V20.5M12 15.465C15 13.9985 18 12.1054 18 8.86587C18 5.62624 15.3137 3 12 3C8.68629 3 6 5.62624 6 8.86587\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>\n";
	var cursor_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9.80282 4.62973L15.8364 6.99069C19.3164 8.35243 21.0564 9.03329 20.9987 10.1133C20.941 11.1934 19.1251 11.6886 15.4933 12.6791C14.412 12.974 13.8713 13.1215 13.4964 13.4963C13.1215 13.8712 12.9741 14.4119 12.6791 15.4933C11.6887 19.125 11.1934 20.9409 10.1134 20.9986C9.03335 21.0563 8.35249 19.3163 6.99075 15.8363L4.62979 9.80276C3.20411 6.15934 2.49127 4.33764 3.41448 3.41442C4.3377 2.49121 6.15941 3.20405 9.80282 4.62973Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var settings_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>\n<path d=\"M20.7906 9.15201C21.5969 10.5418 22 11.2366 22 12C22 12.7634 21.5969 13.4582 20.7906 14.848L18.8669 18.1638C18.0638 19.548 17.6623 20.2402 17.0019 20.6201C16.3416 21 15.5402 21 13.9373 21L10.0627 21C8.45982 21 7.6584 21 6.99807 20.6201C6.33774 20.2402 5.93619 19.548 5.13311 18.1638L3.20942 14.848C2.40314 13.4582 2 12.7634 2 12C2 11.2366 2.40314 10.5418 3.20942 9.152L5.13311 5.83621C5.93619 4.45196 6.33774 3.75984 6.99807 3.37992C7.6584 3 8.45982 3 10.0627 3L13.9373 3C15.5402 3 16.3416 3 17.0019 3.37992C17.6623 3.75984 18.0638 4.45197 18.8669 5.83622L20.7906 9.15201Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>\n</svg>\n";
	var THEMES = [
		"system",
		"light",
		"dark"
	];
	var capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
	var makeRadioGroup = (label, className) => {
		const group = document.createElement("div");
		group.className = className;
		group.setAttribute("role", "radiogroup");
		group.setAttribute("aria-label", label);
		return group;
	};
	var checkOne = (buttons, selected) => {
		for (const [id, btn] of buttons) {
			const on = id === selected;
			btn.setAttribute("aria-checked", String(on));
			btn.tabIndex = on ? 0 : -1;
		}
	};
	var bindArrowKeys = (ids, buttons, select) => {
		for (const [id, btn] of buttons) btn.addEventListener("keydown", (e) => {
			const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
			if (!dir) return;
			e.preventDefault();
			const next = ids[(ids.indexOf(id) + dir + ids.length) % ids.length];
			select(next);
			buttons.get(next).focus();
		});
	};
	const createSettingsPanel = (opts) => {
		const panel = document.createElement("div");
		panel.className = "kai-settings";
		panel.setAttribute("role", "group");
		panel.setAttribute("aria-label", "Settings");
		const header = document.createElement("div");
		header.className = "kai-settings-header";
		const name = document.createElement("span");
		name.className = "kai-settings-name";
		name.textContent = "kai";
		const version = document.createElement("span");
		version.className = "kai-settings-version";
		version.textContent = `v${opts.version}`;
		header.appendChild(name);
		header.appendChild(version);
		const themes = makeRadioGroup("Theme", "kai-settings-themes");
		const themeBtns = /* @__PURE__ */ new Map();
		for (const t of THEMES) {
			const btn = document.createElement("button");
			btn.className = "kai-settings-theme";
			btn.setAttribute("role", "radio");
			btn.textContent = capitalize(t);
			btn.addEventListener("click", () => setTheme(t, true));
			themeBtns.set(t, btn);
			themes.appendChild(btn);
		}
		const accents = makeRadioGroup("Accent color", "kai-settings-accents");
		const accentBtns = /* @__PURE__ */ new Map();
		for (const id of ACCENT_IDS) {
			const btn = document.createElement("button");
			btn.className = "kai-settings-accent";
			btn.setAttribute("role", "radio");
			btn.setAttribute("aria-label", capitalize(id));
			btn.style.setProperty("--swatch", ACCENTS[id]);
			btn.addEventListener("click", () => setAccent(id, true));
			accentBtns.set(id, btn);
			accents.appendChild(btn);
		}
		const setTheme = (theme, emit = false) => {
			checkOne(themeBtns, theme);
			if (emit) opts.onThemeChange(theme);
		};
		const setAccent = (accent, emit = false) => {
			checkOne(accentBtns, accent);
			if (emit) opts.onAccentChange(accent);
		};
		bindArrowKeys(THEMES, themeBtns, (t) => setTheme(t, true));
		bindArrowKeys(ACCENT_IDS, accentBtns, (a) => setAccent(a, true));
		setTheme(opts.theme);
		setAccent(opts.accent);
		panel.appendChild(header);
		panel.appendChild(themes);
		panel.appendChild(accents);
		return {
			el: panel,
			setTheme,
			setAccent
		};
	};
	var parser$1 = new DOMParser();
	var setIcon = (el, svg) => {
		const doc = parser$1.parseFromString(svg, "image/svg+xml");
		el.appendChild(document.importNode(doc.documentElement, true));
	};
	var supportsAnchor = typeof CSS !== "undefined" && CSS.supports("anchor-name: --a");
	var snapToCorner = (x, y) => {
		const midX = window.innerWidth / 2;
		const midY = window.innerHeight / 2;
		const isRight = x >= midX;
		const isBottom = y >= midY;
		if (isBottom && isRight) return "bottom-right";
		if (isBottom && !isRight) return "bottom-left";
		if (!isBottom && isRight) return "top-right";
		return "top-left";
	};
	var positionActions = (actionsEl, fabEl, corner) => {
		const rect = fabEl.getBoundingClientRect();
		const gap = 8;
		if (corner === "top-left" || corner === "top-right") {
			actionsEl.style.top = `${rect.top}px`;
			actionsEl.style.bottom = "auto";
		} else {
			actionsEl.style.top = "auto";
			actionsEl.style.bottom = `${document.documentElement.clientHeight - rect.bottom}px`;
		}
		if (corner === "bottom-right" || corner === "top-right") {
			actionsEl.style.left = "auto";
			actionsEl.style.right = `${document.documentElement.clientWidth - rect.left + gap}px`;
			actionsEl.style.flexDirection = "row-reverse";
			actionsEl.style.transformOrigin = "right center";
		} else {
			actionsEl.style.left = `${rect.right + gap}px`;
			actionsEl.style.right = "auto";
			actionsEl.style.flexDirection = "row";
			actionsEl.style.transformOrigin = "left center";
		}
	};
	var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
	var SETTINGS_WIDTH = 240;
	var SETTINGS_EDGE_GAP = 12;
	var positionSettings = (panelEl, anchorEl, fabEl, corner) => {
		const rect = anchorEl.getBoundingClientRect();
		const fabRect = fabEl.getBoundingClientRect();
		const gap = 8;
		const vw = document.documentElement.clientWidth;
		const vh = document.documentElement.clientHeight;
		const isTop = corner === "top-left" || corner === "top-right";
		if (isTop) {
			panelEl.style.top = `${Math.max(rect.bottom, fabRect.bottom) + gap}px`;
			panelEl.style.bottom = "auto";
		} else {
			panelEl.style.top = "auto";
			panelEl.style.bottom = `${vh - Math.min(rect.top, fabRect.top) + gap}px`;
		}
		const anchorX = rect.left + rect.width / 2;
		const left = clamp(anchorX - SETTINGS_WIDTH / 2, SETTINGS_EDGE_GAP, vw - SETTINGS_WIDTH - SETTINGS_EDGE_GAP);
		panelEl.style.left = `${left}px`;
		panelEl.style.right = "auto";
		panelEl.style.transformOrigin = `${anchorX - left}px ${isTop ? "0" : "100%"}`;
	};
	var SWAP = {
		shrinkMs: 120,
		expandMs: 400,
		blurPx: 4,
		scaleDown: .3
	};
	var animateStateSwap = async (el, icon, accent = "") => {
		const svg = el.querySelector("svg");
		if (svg) await svg.animate([{
			transform: "scale(1)",
			filter: "blur(0)"
		}, {
			transform: `scale(${SWAP.scaleDown})`,
			filter: `blur(${SWAP.blurPx}px)`
		}], {
			duration: SWAP.shrinkMs,
			easing: "ease-in",
			fill: "forwards"
		}).finished;
		el.replaceChildren();
		setIcon(el, icon);
		el.style.background = accent;
		el.style.color = accent ? "var(--white)" : "";
		el.style.borderColor = accent;
		const newSvg = el.querySelector("svg");
		if (newSvg) newSvg.animate([{
			transform: `scale(${SWAP.scaleDown})`,
			filter: `blur(${SWAP.blurPx}px)`
		}, {
			transform: "scale(1)",
			filter: "blur(0)"
		}], {
			duration: SWAP.expandMs,
			easing: SPRING
		});
	};
	var COLLAPSE = {
		expandMs: 600,
		appearDelayMs: 80,
		staggerMs: 60,
		collapseMs: 200,
		shrinkMs: 150
	};
	var DRAG_THRESHOLD$1 = 5;
	var computeDragRadii = (cx, cy) => {
		const nx = clamp(cx / window.innerWidth, 0, 1);
		const ny = clamp(cy / window.innerHeight, 0, 1);
		const wTL = nx * (1 - ny);
		const wTR = (1 - nx) * (1 - ny);
		const wBR = (1 - nx) * ny;
		const wBL = nx * ny;
		const r = (w) => `${22 - 18 * w * w}px`;
		return `${r(wTL)} ${r(wTR)} ${r(wBR)} ${r(wBL)}`;
	};
	const createFab = (shadowRoot, opts) => {
		let corner = opts.initialCorner;
		let active = false;
		let fabAnim = null;
		let badgeHidden = false;
		let actionAnims = [];
		const fab = document.createElement("button");
		fab.className = "kai-fab";
		fab.setAttribute("data-corner", corner);
		fab.setAttribute("aria-label", "Toggle UI annotator");
		fab.setAttribute("aria-pressed", "false");
		fab.setAttribute("aria-expanded", "false");
		setIcon(fab, kai_default);
		const badge = document.createElement("span");
		badge.className = "kai-fab-badge";
		badge.style.display = "none";
		fab.appendChild(badge);
		const actions = document.createElement("div");
		actions.className = "kai-fab-actions";
		actions.style.display = "none";
		const pickBtn = document.createElement("button");
		pickBtn.className = "kai-fab-action";
		pickBtn.setAttribute("aria-label", "Copy selector");
		pickBtn.setAttribute("aria-pressed", "false");
		setIcon(pickBtn, cursor_default);
		const copyBtn = document.createElement("button");
		copyBtn.className = "kai-fab-action";
		copyBtn.setAttribute("aria-label", "Copy as Markdown");
		setIcon(copyBtn, copy_default);
		const clearBtn = document.createElement("button");
		clearBtn.className = "kai-fab-action";
		clearBtn.setAttribute("aria-label", "Clear all");
		setIcon(clearBtn, trash_default);
		const settingsBtn = document.createElement("button");
		settingsBtn.className = "kai-fab-action";
		settingsBtn.setAttribute("aria-label", "Settings");
		settingsBtn.setAttribute("aria-expanded", "false");
		setIcon(settingsBtn, settings_default);
		const tooltip = document.createElement("div");
		tooltip.className = "kai-tooltip";
		tooltip.style.display = "none";
		tooltip.style.fontFamily = "var(--font-sans)";
		shadowRoot.appendChild(tooltip);
		const showTooltip = (btn, label, key) => {
			tooltip.textContent = label;
			if (key) {
				const kbd = document.createElement("span");
				kbd.className = "kai-tooltip-kbd";
				kbd.textContent = key;
				tooltip.appendChild(kbd);
			}
			tooltip.style.display = "";
			const rect = btn.getBoundingClientRect();
			const isTop = corner === "top-left" || corner === "top-right";
			tooltip.style.left = `${rect.left + rect.width / 2}px`;
			tooltip.style.transform = "translateX(-50%)";
			if (isTop) {
				tooltip.style.top = `${rect.bottom + 6}px`;
				tooltip.style.bottom = "auto";
			} else {
				tooltip.style.top = "auto";
				tooltip.style.bottom = `${document.documentElement.clientHeight - rect.top + 6}px`;
			}
		};
		const hideTooltip = () => {
			tooltip.style.display = "none";
		};
		pickBtn.addEventListener("mouseenter", () => showTooltip(pickBtn, "Copy selector", SHORTCUTS.pick.label));
		pickBtn.addEventListener("mouseleave", hideTooltip);
		copyBtn.addEventListener("mouseenter", () => showTooltip(copyBtn, "Copy as Markdown", SHORTCUTS.copy.label));
		copyBtn.addEventListener("mouseleave", hideTooltip);
		clearBtn.addEventListener("mouseenter", () => showTooltip(clearBtn, "Clear all", SHORTCUTS.clear.label));
		clearBtn.addEventListener("mouseleave", hideTooltip);
		settingsBtn.addEventListener("mouseenter", () => {
			if (!settingsOpen) showTooltip(settingsBtn, "Settings", SHORTCUTS.settings.label);
		});
		settingsBtn.addEventListener("mouseleave", hideTooltip);
		const actionBtns = [
			pickBtn,
			copyBtn,
			clearBtn,
			settingsBtn
		];
		for (const btn of actionBtns) actions.appendChild(btn);
		const countBtns = [copyBtn, clearBtn];
		let countVisible = true;
		const visibleActionBtns = () => actionBtns.filter((b) => b.style.display !== "none");
		const panel = createSettingsPanel(opts.settings).el;
		panel.style.display = "none";
		let settingsOpen = false;
		let settingsAnim = null;
		const onOutsideClick = (e) => {
			if (e.composedPath().includes(shadowRoot.host)) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			closeSettings();
		};
		const onInsidePointerDown = (e) => {
			const path = e.composedPath();
			if (path.includes(panel) || path.includes(settingsBtn)) return;
			closeSettings();
		};
		const openSettings = () => {
			if (settingsOpen) return;
			settingsOpen = true;
			hideTooltip();
			settingsBtn.setAttribute("aria-expanded", "true");
			settingsBtn.classList.add("kai-fab-action--armed");
			settingsAnim?.cancel();
			panel.style.display = "flex";
			positionSettings(panel, settingsBtn, fab, corner);
			settingsAnim = panel.animate([{
				transform: "scale(0.9)",
				opacity: 0
			}, {
				transform: "scale(1)",
				opacity: 1
			}], {
				duration: 400,
				easing: SPRING,
				fill: "both"
			});
			window.addEventListener("click", onOutsideClick, { capture: true });
			shadowRoot.addEventListener("pointerdown", onInsidePointerDown);
			window.addEventListener("resize", closeSettings);
			opts.onSettingsToggle(true);
		};
		const closeSettings = () => {
			if (!settingsOpen) return false;
			settingsOpen = false;
			settingsBtn.setAttribute("aria-expanded", "false");
			settingsBtn.classList.remove("kai-fab-action--armed");
			window.removeEventListener("click", onOutsideClick, { capture: true });
			shadowRoot.removeEventListener("pointerdown", onInsidePointerDown);
			window.removeEventListener("resize", closeSettings);
			opts.onSettingsToggle(false);
			settingsAnim?.cancel();
			settingsAnim = panel.animate([{
				transform: "scale(1)",
				opacity: 1
			}, {
				transform: "scale(0.9)",
				opacity: 0
			}], {
				duration: 150,
				easing: "ease-in",
				fill: "forwards"
			});
			const anim = settingsAnim;
			anim.finished.then(() => {
				if (settingsAnim !== anim) return;
				panel.style.display = "none";
				anim.cancel();
				settingsAnim = null;
			}).catch(() => {});
			return true;
		};
		settingsBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (settingsOpen) closeSettings();
			else openSettings();
		});
		shadowRoot.appendChild(fab);
		shadowRoot.appendChild(actions);
		shadowRoot.appendChild(panel);
		const scoopObserver = new ResizeObserver(() => {
			if (badge.offsetWidth) fab.style.setProperty("--kai-scoop", `${badge.offsetWidth / 2 + 2}px`);
		});
		scoopObserver.observe(badge);
		let badgePressAnim = null;
		const pressFab = (from, to, timing) => {
			fabAnim?.cancel();
			fabAnim = fab.animate([{ transform: `scale(${from})` }, { transform: `scale(${to})` }], timing);
			badgePressAnim?.cancel();
			badgePressAnim = null;
			if (badge.style.display === "none" || badgeHidden) return;
			const sx = isRightCorner() ? 1 : -1;
			const sy = corner.startsWith("bottom") ? -1 : 1;
			const half = fab.offsetWidth / 2;
			const drift = (s) => (1 - s) / s * half;
			badgePressAnim = badge.animate([{
				scale: `${1 / from}`,
				translate: `${drift(from) * sx}px ${drift(from) * sy}px`
			}, {
				scale: `${1 / to}`,
				translate: `${drift(to) * sx}px ${drift(to) * sy}px`
			}], timing);
		};
		let dragging = false;
		let pointerDown = false;
		let startX = 0;
		let startY = 0;
		let fabStartX = 0;
		let fabStartY = 0;
		const onPointerDown = (e) => {
			e.preventDefault();
			pointerDown = true;
			dragging = false;
			startX = e.clientX;
			startY = e.clientY;
			const rect = fab.getBoundingClientRect();
			fabStartX = rect.left;
			fabStartY = rect.top;
			fab.setPointerCapture(e.pointerId);
			pressFab(1, .9, {
				duration: 120,
				easing: "ease-out",
				fill: "forwards"
			});
		};
		const onPointerMove = (e) => {
			if (!pointerDown) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (!dragging && dist > DRAG_THRESHOLD$1) {
				dragging = true;
				fabAnim?.cancel();
				fab.style.position = "fixed";
				fab.style.left = `${fabStartX}px`;
				fab.style.top = `${fabStartY}px`;
				fab.style.right = "auto";
				fab.style.bottom = "auto";
				fab.classList.add("kai-fab--dragging");
				badgePressAnim?.cancel();
				badgePressAnim = null;
				if (badge.style.display !== "none" && !badgeHidden) {
					badgeHidden = true;
					badge.animate([{ scale: "1" }, { scale: "0" }], {
						duration: 200,
						easing: "ease-out",
						fill: "forwards"
					});
					fab.classList.remove("kai-fab--has-badge");
				}
				fab.style.borderRadius = computeDragRadii(fabStartX + 22, fabStartY + 22);
				if (active) animateActionsOut();
			}
			if (dragging) {
				const newX = Math.max(0, Math.min(window.innerWidth - 44, fabStartX + dx));
				const newY = Math.max(0, Math.min(window.innerHeight - 44, fabStartY + dy));
				fab.style.left = `${newX}px`;
				fab.style.top = `${newY}px`;
				fab.style.borderRadius = computeDragRadii(newX + 22, newY + 22);
				if (active && actions.style.display !== "none") positionActions(actions, fab, corner);
			}
		};
		const onPointerUp = (e) => {
			if (!pointerDown) return;
			pointerDown = false;
			fab.classList.remove("kai-fab--dragging");
			if (dragging) {
				dragging = false;
				const newCorner = snapToCorner(e.clientX, e.clientY);
				const fromLeft = parseFloat(fab.style.left);
				const fromTop = parseFloat(fab.style.top);
				const fromRadius = fab.style.borderRadius;
				fab.style.left = "";
				fab.style.top = "";
				fab.style.right = "";
				fab.style.bottom = "";
				fab.style.position = "";
				fab.style.borderRadius = "";
				corner = newCorner;
				fab.setAttribute("data-corner", corner);
				opts.onCornerChange(corner);
				const hasBadge = badge.style.display !== "none";
				if (hasBadge) fab.classList.add("kai-fab--has-badge");
				const targetRect = fab.getBoundingClientRect();
				const targetRadius = getComputedStyle(fab).borderRadius;
				if (hasBadge) fab.classList.remove("kai-fab--has-badge");
				const flipDx = fromLeft - targetRect.left;
				const flipDy = fromTop - targetRect.top;
				fabAnim?.cancel();
				fabAnim = fab.animate([{
					transform: `translate(${flipDx}px, ${flipDy}px) scale(0.95)`,
					borderRadius: fromRadius
				}, {
					transform: "translate(0, 0) scale(1)",
					borderRadius: targetRadius
				}], {
					duration: 600,
					easing: SPRING
				});
				if (active) fabAnim.finished.then(() => animateActionsIn()).catch(() => {});
				setTimeout(() => {
					badgeHidden = false;
					if (badge.style.display !== "none") {
						fab.classList.add("kai-fab--has-badge");
						badge.animate([{ scale: "0" }, { scale: "1" }], {
							duration: 400,
							easing: SPRING,
							fill: "forwards"
						});
					}
				}, 200);
			} else {
				opts.onToggle();
				pressFab(.9, 1, {
					duration: 600,
					easing: SPRING
				});
			}
		};
		if (supportsAnchor) {
			fab.addEventListener("pointerdown", onPointerDown);
			fab.addEventListener("pointermove", onPointerMove);
			fab.addEventListener("pointerup", onPointerUp);
		} else {
			fab.addEventListener("pointerdown", () => pressFab(1, .9, {
				duration: 120,
				easing: "ease-out",
				fill: "forwards"
			}));
			fab.addEventListener("pointerup", () => pressFab(.9, 1, {
				duration: 600,
				easing: SPRING
			}));
			fab.addEventListener("click", (e) => {
				e.stopPropagation();
				opts.onToggle();
			});
		}
		const copyStatus = document.createElement("span");
		copyStatus.setAttribute("aria-live", "polite");
		copyStatus.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;";
		shadowRoot.appendChild(copyStatus);
		let copyTimer = null;
		const resetCopy = () => {
			animateStateSwap(copyBtn, copy_default);
			copyTimer = null;
		};
		const confirmCopy = () => {
			if (copyTimer) clearTimeout(copyTimer);
			animateStateSwap(copyBtn, check_default, "var(--color-success)");
			copyStatus.textContent = "Copied";
			copyTimer = setTimeout(() => {
				resetCopy();
				copyStatus.textContent = "";
			}, 2e3);
		};
		copyBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			opts.onCopyMarkdown();
		});
		let pickArmed = false;
		let pickTimer = null;
		const setPickArmed = (armed) => {
			pickArmed = armed;
			pickBtn.classList.toggle("kai-fab-action--armed", armed);
			pickBtn.setAttribute("aria-pressed", String(armed));
		};
		pickBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (pickTimer) return;
			setPickArmed(!pickArmed);
			opts.onPickToggle(pickArmed);
		});
		const confirmPick = () => {
			if (pickTimer) clearTimeout(pickTimer);
			setPickArmed(false);
			animateStateSwap(pickBtn, check_default, "var(--color-success)");
			copyStatus.textContent = "Selector copied";
			pickTimer = setTimeout(() => {
				animateStateSwap(pickBtn, cursor_default);
				copyStatus.textContent = "";
				pickTimer = null;
			}, 2e3);
		};
		let clearArmed = false;
		let clearTimer = null;
		const resetClear = () => {
			clearArmed = false;
			animateStateSwap(clearBtn, trash_default);
			clearTimer = null;
		};
		clearBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (clearArmed) {
				if (clearTimer) clearTimeout(clearTimer);
				resetClear();
				opts.onClearAll();
			} else {
				clearArmed = true;
				animateStateSwap(clearBtn, help_default, "var(--color-danger)");
				clearTimer = setTimeout(resetClear, 3e3);
			}
		});
		const pressAction = (action) => {
			const btn = {
				pick: pickBtn,
				copy: copyBtn,
				clear: clearBtn,
				settings: settingsBtn
			}[action];
			if (btn.disabled) return;
			btn.click();
		};
		const updateBadge = (n) => {
			if (n > 0) {
				badge.textContent = String(n);
				badge.style.display = "flex";
				if (!badgeHidden) fab.classList.add("kai-fab--has-badge");
			} else {
				badge.style.display = "none";
				badgeHidden = false;
				fab.classList.remove("kai-fab--has-badge");
			}
		};
		const isRightCorner = () => corner === "bottom-right" || corner === "top-right";
		const animateActionsIn = () => {
			actionAnims.forEach((a) => a.cancel());
			actionAnims = [];
			actions.style.display = "flex";
			requestAnimationFrame(() => {
				positionActions(actions, fab, corner);
				const tx = isRightCorner() ? "12px" : "-12px";
				visibleActionBtns().forEach((btn, i) => {
					const anim = btn.animate([{
						transform: `translateX(${tx}) scale(0.8)`,
						opacity: 0
					}, {
						transform: "translateX(0) scale(1)",
						opacity: 1
					}], {
						duration: 400,
						easing: SPRING,
						delay: i * 50,
						fill: "backwards"
					});
					actionAnims.push(anim);
				});
			});
		};
		const animateActionsOut = () => {
			hideTooltip();
			closeSettings();
			actionAnims.forEach((a) => a.cancel());
			actionAnims = [];
			const tx = isRightCorner() ? "8px" : "-8px";
			const anims = visibleActionBtns().map((btn, i) => {
				return btn.animate([{
					transform: "translateX(0) scale(1)",
					opacity: 1
				}, {
					transform: `translateX(${tx}) scale(0.8)`,
					opacity: 0
				}], {
					duration: 150,
					easing: "ease-in",
					delay: i * 30,
					fill: "forwards"
				});
			});
			actionAnims = anims;
			Promise.all(anims.map((a) => a.finished)).then(() => {
				actions.style.display = "none";
				anims.forEach((a) => a.cancel());
				actionAnims = [];
			});
		};
		const setActive = (isActive) => {
			active = isActive;
			fab.setAttribute("aria-pressed", String(isActive));
			fab.setAttribute("aria-expanded", String(isActive));
			if (isActive) {
				fab.classList.add("kai-fab--active");
				animateActionsIn();
			} else {
				fab.classList.remove("kai-fab--active");
				animateActionsOut();
			}
		};
		const setCountDisplay = (visible) => {
			for (const b of countBtns) b.style.display = visible ? "" : "none";
		};
		const measureShift = (visible) => {
			const before = settingsBtn.getBoundingClientRect().left;
			setCountDisplay(visible);
			const after = settingsBtn.getBoundingClientRect().left;
			setCountDisplay(!visible);
			return after - before;
		};
		const updateActionStates = (count) => {
			const visible = count > 0;
			if (visible === countVisible) return;
			countVisible = visible;
			for (const b of countBtns) b.disabled = !visible;
			if (!active || actions.style.display === "none") {
				setCountDisplay(visible);
				return;
			}
			const shift = measureShift(visible);
			if (visible) {
				setCountDisplay(true);
				actionAnims.push(settingsBtn.animate([{ transform: `translateX(${-shift}px)` }, { transform: "translateX(0)" }], {
					duration: COLLAPSE.expandMs,
					easing: SPRING
				}));
				countBtns.forEach((btn, i) => {
					actionAnims.push(btn.animate([{
						transform: "scale(0.8)",
						opacity: 0
					}, {
						transform: "scale(1)",
						opacity: 1
					}], {
						duration: COLLAPSE.expandMs,
						easing: SPRING,
						delay: COLLAPSE.appearDelayMs + i * COLLAPSE.staggerMs,
						fill: "backwards"
					}));
				});
				return;
			}
			for (const btn of countBtns) actionAnims.push(btn.animate([{
				transform: "scale(1)",
				opacity: 1
			}, {
				transform: "scale(0.8)",
				opacity: 0
			}], {
				duration: COLLAPSE.shrinkMs,
				easing: EASE_OUT,
				fill: "forwards"
			}));
			const slide = settingsBtn.animate([{ transform: "translateX(0)" }, { transform: `translateX(${shift}px)` }], {
				duration: COLLAPSE.collapseMs,
				easing: SNAP,
				fill: "forwards"
			});
			actionAnims.push(slide);
			slide.finished.catch(() => {}).finally(() => {
				if (countVisible) return;
				setCountDisplay(false);
				for (const btn of countBtns) btn.getAnimations().forEach((a) => a.cancel());
				slide.cancel();
			});
		};
		const destroy = () => {
			closeSettings();
			scoopObserver.disconnect();
			fab.remove();
			actions.remove();
			panel.remove();
			tooltip.remove();
			copyStatus.remove();
		};
		return {
			updateBadge,
			setActive,
			updateActionStates,
			confirmCopy,
			confirmPick,
			setPickArmed,
			closeSettings,
			pressAction,
			destroy
		};
	};
	var isColorValue = (value) => {
		if (/^(#|rgb|hsl|oklch|oklab|lch|lab|color\(|hwb)/.test(value)) return true;
		const el = document.createElement("span");
		el.style.color = value;
		return el.style.color !== "";
	};
	const harvestCSSVars = (el) => {
		const seen = /* @__PURE__ */ new Set();
		const entries = [];
		const computed = getComputedStyle(el);
		for (const sheet of Array.from(document.styleSheets)) {
			let rules;
			try {
				rules = sheet.cssRules;
			} catch {
				continue;
			}
			const walk = (ruleList) => {
				for (const rule of Array.from(ruleList)) if (rule instanceof CSSStyleRule) for (let i = 0; i < rule.style.length; i++) {
					const prop = rule.style[i];
					if (prop.startsWith("--") && !seen.has(prop)) {
						seen.add(prop);
						const resolved = computed.getPropertyValue(prop).trim();
						if (resolved) entries.push({
							name: prop,
							value: resolved,
							isColor: isColorValue(resolved)
						});
					}
				}
				else if ("cssRules" in rule) walk(rule.cssRules);
			};
			walk(rules);
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		return entries;
	};
	const attachAutocomplete = (textarea, shadowRoot, getElement) => {
		let dropdown = null;
		let items = [];
		let activeIndex = -1;
		let mode = null;
		let matchStart = 0;
		let matchEnd = 0;
		const close = () => {
			dropdown?.remove();
			dropdown = null;
			items = [];
			activeIndex = -1;
			mode = null;
			textarea.removeAttribute("aria-activedescendant");
			textarea.setAttribute("aria-expanded", "false");
		};
		const setActive = (index) => {
			if (items[activeIndex]) items[activeIndex].setAttribute("aria-selected", "false");
			activeIndex = index;
			if (items[activeIndex]) {
				items[activeIndex].setAttribute("aria-selected", "true");
				items[activeIndex].scrollIntoView({ block: "nearest" });
				textarea.setAttribute("aria-activedescendant", items[activeIndex].id);
			}
		};
		const accept = () => {
			const item = items[activeIndex];
			if (!item) return;
			const value = item.dataset.value;
			const before = textarea.value.slice(0, matchStart);
			const after = textarea.value.slice(matchEnd);
			textarea.value = before + value + after;
			textarea.selectionStart = textarea.selectionEnd = matchStart + value.length;
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
			close();
		};
		const positionDropdown = () => {
			if (!dropdown) return;
			const rect = textarea.getBoundingClientRect();
			dropdown.style.top = `${rect.bottom + 4}px`;
			dropdown.style.left = `${rect.left}px`;
			dropdown.style.width = `${rect.width}px`;
		};
		const ensureDropdown = () => {
			if (!dropdown) {
				dropdown = document.createElement("div");
				dropdown.className = "kai-autocomplete";
				dropdown.setAttribute("role", "listbox");
				dropdown.id = "kai-ac-list";
				shadowRoot.appendChild(dropdown);
				textarea.setAttribute("aria-expanded", "true");
				textarea.setAttribute("aria-controls", "kai-ac-list");
			}
			dropdown.textContent = "";
			return dropdown;
		};
		const showVars = (filter) => {
			const el = getElement();
			if (!el) return;
			const vars = harvestCSSVars(el);
			const filtered = filter ? vars.filter((v) => v.name.includes(filter)) : vars;
			if (!filtered.length) {
				close();
				return;
			}
			const container = ensureDropdown();
			items = filtered.slice(0, 30).map((v, i) => {
				const item = document.createElement("div");
				item.className = "kai-autocomplete-item";
				item.setAttribute("role", "option");
				item.setAttribute("aria-selected", "false");
				item.id = `kai-ac-${i}`;
				item.dataset.value = v.name;
				if (v.isColor) {
					const swatch = document.createElement("span");
					swatch.className = "kai-autocomplete-swatch";
					swatch.style.background = v.value;
					item.appendChild(swatch);
				}
				const name = document.createElement("span");
				name.className = "kai-autocomplete-item-name";
				name.textContent = v.name;
				item.appendChild(name);
				const val = document.createElement("span");
				val.className = "kai-autocomplete-item-value";
				val.textContent = v.value;
				item.appendChild(val);
				item.addEventListener("pointerdown", (e) => {
					e.preventDefault();
					activeIndex = i;
					accept();
				});
				return item;
			});
			for (const item of items) container.appendChild(item);
			positionDropdown();
			setActive(0);
		};
		const showRem = (pxValue) => {
			const rem = pxToRem(pxValue);
			if (!rem) {
				close();
				return;
			}
			const container = ensureDropdown();
			const item = document.createElement("div");
			item.className = "kai-autocomplete-rem";
			item.setAttribute("role", "option");
			item.setAttribute("aria-selected", "false");
			item.id = "kai-ac-0";
			item.dataset.value = rem;
			item.textContent = `→ ${rem}`;
			item.addEventListener("pointerdown", (e) => {
				e.preventDefault();
				activeIndex = 0;
				accept();
			});
			items = [item];
			container.appendChild(item);
			positionDropdown();
			setActive(0);
		};
		const onInput = () => {
			const pos = textarea.selectionStart;
			const text = textarea.value.slice(0, pos);
			const pxMatch = text.match(/(\d+(?:\.\d+)?px)$/);
			if (pxMatch) {
				mode = "rem";
				matchStart = pos - pxMatch[1].length;
				matchEnd = pos;
				showRem(pxMatch[1]);
				return;
			}
			const varMatch = text.match(/(--[\w-]*)$/);
			if (varMatch) {
				mode = "vars";
				matchStart = pos - varMatch[1].length;
				matchEnd = pos;
				showVars(varMatch[1]);
				return;
			}
			if (mode) close();
		};
		const onKeydown = (e) => {
			if (!dropdown) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActive(Math.min(activeIndex + 1, items.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setActive(Math.max(activeIndex - 1, 0));
			} else if (e.key === "Tab" || e.key === "Enter") {
				if (activeIndex >= 0) {
					e.preventDefault();
					accept();
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				close();
			}
		};
		textarea.addEventListener("input", onInput);
		textarea.addEventListener("keydown", onKeydown);
		textarea.addEventListener("blur", () => setTimeout(close, 150));
		const destroy = () => {
			textarea.removeEventListener("input", onInput);
			textarea.removeEventListener("keydown", onKeydown);
			close();
		};
		return { destroy };
	};
	var POPOVER_WIDTH = 320;
	var EDGE_GAP = 12;
	var positionPopover = (popover, targetRect, anchorRect) => {
		const ref = anchorRect ?? targetRect;
		const gap = anchorRect ? 4 : 8;
		const spaceBelow = document.documentElement.clientHeight - ref.bottom;
		const spaceAbove = ref.top;
		const vh = document.documentElement.clientHeight;
		const below = spaceBelow >= 200 || spaceBelow >= spaceAbove;
		const top = below ? ref.bottom + gap : ref.top - gap;
		requestAnimationFrame(() => {
			const h = popover.getBoundingClientRect().height;
			const raw = below ? top : ref.top - h - gap;
			popover.style.top = `${Math.max(EDGE_GAP, Math.min(raw, vh - h - EDGE_GAP))}px`;
		});
		const left = Math.max(EDGE_GAP, Math.min(ref.left, document.documentElement.clientWidth - POPOVER_WIDTH - EDGE_GAP));
		popover.style.top = `${top}px`;
		popover.style.left = `${left}px`;
	};
	const createPopover = (shadowRoot, opts) => {
		const isEdit = opts.existingComment != null;
		const popover = document.createElement("div");
		popover.className = "kai-popover";
		popover.setAttribute("role", "dialog");
		popover.setAttribute("aria-label", isEdit ? "Edit annotation" : "Annotate element");
		const body = document.createElement("div");
		body.className = "kai-popover-body";
		const pathEl = document.createElement("div");
		pathEl.className = "kai-popover-path";
		opts.path.split(" › ").forEach((seg, i) => {
			if (i > 0) {
				pathEl.appendChild(document.createElement("wbr"));
				pathEl.appendChild(document.createTextNode(" › "));
			}
			seg.split(/(?=[.#])/).forEach((part, j) => {
				if (j > 0) pathEl.appendChild(document.createElement("wbr"));
				pathEl.appendChild(document.createTextNode(part));
			});
		});
		const descEl = document.createElement("div");
		descEl.className = "kai-popover-desc";
		const text = getDirectText(opts.element);
		if (text) descEl.textContent = `"${text}"`;
		else descEl.style.display = "none";
		const textarea = document.createElement("textarea");
		textarea.className = "kai-popover-textarea";
		textarea.placeholder = "What should change?";
		textarea.setAttribute("aria-label", "Annotation comment");
		if (isEdit) textarea.value = opts.existingComment;
		body.appendChild(pathEl);
		body.appendChild(textarea);
		body.appendChild(descEl);
		const footer = document.createElement("div");
		footer.className = "kai-popover-footer";
		const submit = () => {
			const comment = textarea.value.trim();
			if (!comment) return;
			opts.onSubmit(comment);
		};
		if (isEdit && opts.onDelete) {
			const deleteBtn = document.createElement("button");
			deleteBtn.className = "kai-btn kai-btn--danger";
			deleteBtn.textContent = "Delete";
			let deleteArmed = false;
			let deleteTimer = null;
			const resetDelete = () => {
				deleteArmed = false;
				deleteBtn.textContent = "Delete";
				deleteBtn.removeAttribute("data-armed");
				deleteTimer = null;
			};
			deleteBtn.addEventListener("click", () => {
				if (deleteArmed) {
					if (deleteTimer) clearTimeout(deleteTimer);
					opts.onDelete();
				} else {
					deleteArmed = true;
					deleteBtn.textContent = "Sure?";
					deleteBtn.setAttribute("data-armed", "");
					deleteTimer = setTimeout(resetDelete, 3e3);
				}
			});
			const spacer = document.createElement("div");
			spacer.style.flex = "1";
			const cancelBtn = document.createElement("button");
			cancelBtn.className = "kai-btn kai-btn--secondary";
			cancelBtn.textContent = "Cancel";
			cancelBtn.addEventListener("click", opts.onClose);
			const saveBtn = document.createElement("button");
			saveBtn.className = "kai-btn kai-btn--primary";
			saveBtn.textContent = "Save";
			saveBtn.addEventListener("click", submit);
			footer.appendChild(deleteBtn);
			footer.appendChild(spacer);
			footer.appendChild(cancelBtn);
			footer.appendChild(saveBtn);
		} else {
			const cancelBtn = document.createElement("button");
			cancelBtn.className = "kai-btn kai-btn--secondary";
			cancelBtn.textContent = "Cancel";
			cancelBtn.addEventListener("click", opts.onClose);
			const addBtn = document.createElement("button");
			addBtn.className = "kai-btn kai-btn--primary";
			addBtn.textContent = "Add";
			addBtn.addEventListener("click", submit);
			footer.appendChild(cancelBtn);
			footer.appendChild(addBtn);
		}
		textarea.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				submit();
			}
		});
		popover.appendChild(body);
		popover.appendChild(footer);
		shadowRoot.appendChild(popover);
		positionPopover(popover, opts.element.getBoundingClientRect(), opts.anchorRect);
		const onScroll = (e) => {
			if (e.target === shadowRoot.host) return;
			opts.onClose();
		};
		window.addEventListener("scroll", onScroll, {
			capture: true,
			passive: true
		});
		const onPointerDown = (e) => {
			if (e.composedPath().includes(shadowRoot.host)) return;
			opts.onClose();
		};
		window.addEventListener("pointerdown", onPointerDown, { capture: true });
		const onResize = () => opts.onClose();
		window.addEventListener("resize", onResize);
		const previousFocus = shadowRoot.activeElement ?? document.activeElement;
		requestAnimationFrame(() => textarea.focus());
		const ac = attachAutocomplete(textarea, shadowRoot, () => opts.element);
		const onKeydown = (e) => {
			if (e.key === "Escape" && !shadowRoot.querySelector(".kai-autocomplete")) {
				e.stopPropagation();
				opts.onClose();
			}
		};
		popover.addEventListener("keydown", onKeydown);
		const destroy = () => {
			window.removeEventListener("scroll", onScroll, { capture: true });
			window.removeEventListener("pointerdown", onPointerDown, { capture: true });
			window.removeEventListener("resize", onResize);
			ac.destroy();
			popover.remove();
			if (previousFocus instanceof HTMLElement) previousFocus.focus();
		};
		return { destroy };
	};
	var parser = new DOMParser();
	var MARKER_SIZE = 22;
	var MARKER_PAD = 4;
	var MARKER_OFFSET = 8;
	var BADGE_OVERFLOW = 9;
	var clampMarker = (top, left) => ({
		top: Math.max(MARKER_PAD + BADGE_OVERFLOW, Math.min(top, document.documentElement.clientHeight - MARKER_SIZE - MARKER_PAD)),
		left: Math.max(MARKER_PAD, Math.min(left, document.documentElement.clientWidth - MARKER_SIZE - BADGE_OVERFLOW - MARKER_PAD))
	});
	var createMarkerIcon = () => {
		const doc = parser.parseFromString(kai_default, "image/svg+xml");
		const svg = document.importNode(doc.documentElement, true);
		svg.setAttribute("width", "12");
		svg.setAttribute("height", "12");
		svg.setAttribute("stroke-width", "2.5");
		return svg;
	};
	var findClusters = (items) => {
		if (items.length === 0) return [];
		const assigned = new Array(items.length).fill(false);
		const clusters = [];
		for (let i = 0; i < items.length; i++) {
			if (assigned[i]) continue;
			const cluster = [];
			const queue = [i];
			assigned[i] = true;
			while (queue.length > 0) {
				const idx = queue.shift();
				cluster.push(items[idx]);
				for (let j = 0; j < items.length; j++) {
					if (assigned[j]) continue;
					const dx = items[idx].left - items[j].left;
					const dy = items[idx].top - items[j].top;
					if (Math.sqrt(dx * dx + dy * dy) < MARKER_SIZE + BADGE_OVERFLOW) {
						assigned[j] = true;
						queue.push(j);
					}
				}
			}
			clusters.push(cluster);
		}
		return clusters;
	};
	const createMarkerManager = (shadowRoot, onMarkerClick, onMarkerEnter, onMarkerLeave) => {
		const markerMap = /* @__PURE__ */ new Map();
		const boxMap = /* @__PURE__ */ new Map();
		const visibleBoxes = /* @__PURE__ */ new Set();
		let currentAnnotations = [];
		let rafId = 0;
		let previewMarker = null;
		let previewBox = null;
		let previewTarget = null;
		let isActive = false;
		let pendingEntrance = false;
		const stackElements = /* @__PURE__ */ new Map();
		const markerToStack = /* @__PURE__ */ new Map();
		let activeStackMenu = null;
		let activeStackEl = null;
		let stackMenuCleanup = null;
		let menuDismissRafId = null;
		let expandedAnims = [];
		let stackFadeAnim = null;
		let badgeHideAnim = null;
		const closeStackMenu = (animate = false) => {
			if (menuDismissRafId !== null) {
				cancelAnimationFrame(menuDismissRafId);
				menuDismissRafId = null;
			}
			stackMenuCleanup?.();
			stackMenuCleanup = null;
			if (!activeStackMenu) return;
			const closingStackEl = activeStackEl;
			activeStackEl = null;
			if (animate) {
				const el = activeStackMenu;
				activeStackMenu = null;
				const markers = Array.from(el.querySelectorAll(".kai-stack-expanded-marker"));
				expandedAnims.forEach((a) => a.cancel());
				expandedAnims = [];
				const tx = el.style.flexDirection === "row-reverse" ? "8px" : "-8px";
				const anims = markers.map((btn, i) => {
					return btn.animate([{
						transform: "translateX(0) scale(1)",
						opacity: 1
					}, {
						transform: `translateX(${tx}) scale(0.8)`,
						opacity: 0
					}], {
						duration: 150,
						easing: "ease-in",
						delay: i * 30,
						fill: "forwards"
					});
				});
				expandedAnims = anims;
				const tip = el.querySelector(".kai-tooltip");
				if (tip) tip.style.display = "none";
				Promise.all(anims.map((a) => a.finished)).then(() => {
					el.remove();
					anims.forEach((a) => a.cancel());
					expandedAnims = [];
					if (closingStackEl) {
						const badge = closingStackEl.querySelector(".kai-marker-stack-badge");
						if (badge) {
							badgeHideAnim?.cancel();
							badgeHideAnim = badge.animate([{ transform: "translate(50%, -50%) scale(0)" }, { transform: "translate(50%, -50%) scale(1)" }], {
								duration: 400,
								easing: SPRING,
								fill: "forwards"
							});
						}
						closingStackEl.classList.add("kai-marker-stack--has-badge");
						stackFadeAnim?.cancel();
						stackFadeAnim = closingStackEl.animate([{ opacity: .4 }, { opacity: 1 }], {
							duration: 400,
							easing: SPRING,
							fill: "forwards"
						});
					}
				}).catch(() => {
					el.remove();
				});
			} else {
				expandedAnims.forEach((a) => a.cancel());
				expandedAnims = [];
				badgeHideAnim?.cancel();
				badgeHideAnim = null;
				stackFadeAnim?.cancel();
				stackFadeAnim = null;
				if (closingStackEl) closingStackEl.classList.add("kai-marker-stack--has-badge");
				activeStackMenu.remove();
				activeStackMenu = null;
			}
		};
		const openStackExpanded = (stackEl, annotations) => {
			closeStackMenu();
			const container = document.createElement("div");
			container.className = "kai-stack-expanded";
			const tooltip = document.createElement("div");
			tooltip.className = "kai-tooltip";
			tooltip.style.display = "none";
			tooltip.style.fontFamily = "var(--font-sans)";
			const stackRect = stackEl.getBoundingClientRect();
			const vw = document.documentElement.clientWidth;
			const expandRight = vw - stackRect.right >= stackRect.left;
			container.style.flexDirection = expandRight ? "row" : "row-reverse";
			const gap = 6;
			if (expandRight) container.style.left = `${stackRect.right + gap}px`;
			else container.style.right = `${vw - stackRect.left + gap}px`;
			container.style.top = `${stackRect.top}px`;
			const markerBtns = [];
			for (const ann of annotations) {
				const btn = document.createElement("button");
				btn.className = "kai-stack-expanded-marker";
				const icon = createMarkerIcon();
				btn.appendChild(icon);
				btn.addEventListener("click", (e) => {
					e.stopPropagation();
					closeStackMenu(true);
					onMarkerClick(ann, stackEl.getBoundingClientRect());
				});
				btn.addEventListener("mouseenter", () => {
					onMarkerEnter?.(ann.id);
					tooltip.textContent = ann.comment.trim() || ann.path || ann.selector;
					tooltip.style.display = "";
					const btnRect = btn.getBoundingClientRect();
					tooltip.style.left = `${btnRect.left + btnRect.width / 2}px`;
					tooltip.style.transform = "translateX(-50%)";
					tooltip.style.top = `${btnRect.bottom + 6}px`;
					tooltip.style.bottom = "auto";
				});
				btn.addEventListener("mouseleave", () => {
					onMarkerLeave?.(ann.id);
					tooltip.style.display = "none";
				});
				container.appendChild(btn);
				markerBtns.push(btn);
			}
			container.appendChild(tooltip);
			shadowRoot.appendChild(container);
			activeStackMenu = container;
			activeStackEl = stackEl;
			const badge = stackEl.querySelector(".kai-marker-stack-badge");
			if (badge) {
				badgeHideAnim?.cancel();
				badgeHideAnim = badge.animate([{ transform: "translate(50%, -50%) scale(1)" }, { transform: "translate(50%, -50%) scale(0)" }], {
					duration: 200,
					easing: "ease-out",
					fill: "forwards"
				});
			}
			stackEl.classList.remove("kai-marker-stack--has-badge");
			stackFadeAnim?.cancel();
			stackFadeAnim = stackEl.animate([{ opacity: 1 }, { opacity: .4 }], {
				duration: 200,
				easing: "ease-out",
				fill: "forwards"
			});
			expandedAnims.forEach((a) => a.cancel());
			expandedAnims = [];
			requestAnimationFrame(() => {
				const tx = expandRight ? "-12px" : "12px";
				for (let i = 0; i < markerBtns.length; i++) {
					const anim = markerBtns[i].animate([{
						transform: `translateX(${tx}) scale(0.8)`,
						opacity: 0
					}, {
						transform: "translateX(0) scale(1)",
						opacity: 1
					}], {
						duration: 400,
						easing: SPRING,
						delay: i * 50,
						fill: "both"
					});
					expandedAnims.push(anim);
				}
			});
			const onShadowClick = (e) => {
				if (!activeStackMenu) return;
				const target = e.target;
				if (!activeStackMenu.contains(target) && target !== stackEl && !stackEl.contains(target)) closeStackMenu(true);
			};
			const onDocClick = (e) => {
				if (!activeStackMenu) return;
				if (e.target === shadowRoot.host) return;
				closeStackMenu(true);
			};
			const onScroll = () => {
				if (activeStackMenu) closeStackMenu(true);
			};
			const onKeydown = (e) => {
				if (e.key === "Escape") closeStackMenu(true);
			};
			menuDismissRafId = requestAnimationFrame(() => {
				menuDismissRafId = null;
				if (!activeStackMenu) return;
				shadowRoot.addEventListener("click", onShadowClick, true);
				document.addEventListener("click", onDocClick);
				window.addEventListener("scroll", onScroll, true);
				document.addEventListener("keydown", onKeydown);
			});
			stackMenuCleanup = () => {
				shadowRoot.removeEventListener("click", onShadowClick, true);
				document.removeEventListener("click", onDocClick);
				window.removeEventListener("scroll", onScroll, true);
				document.removeEventListener("keydown", onKeydown);
			};
		};
		const ensureStackElement = (key, count) => {
			const existing = stackElements.get(key);
			if (existing) {
				const badge$1 = existing.querySelector(".kai-marker-stack-badge");
				if (badge$1) badge$1.textContent = String(count);
				return existing;
			}
			const el = document.createElement("div");
			el.className = "kai-marker-stack kai-marker-stack--has-badge";
			el.appendChild(createMarkerIcon());
			const badge = document.createElement("span");
			badge.className = "kai-marker-stack-badge";
			badge.textContent = String(count);
			el.appendChild(badge);
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				if (!isActive) return;
				if (activeStackEl === el) {
					closeStackMenu(true);
					return;
				}
				const anns = (el.dataset.annotationIds?.split(",") || []).map((id) => currentAnnotations.find((a) => a.id === id)).filter((a) => !!a);
				if (anns.length === 1) onMarkerClick(anns[0], el.getBoundingClientRect());
				else if (anns.length > 1) openStackExpanded(el, anns);
			});
			el.addEventListener("mouseenter", () => {
				const ids = el.dataset.annotationIds?.split(",") || [];
				for (const id of ids) onMarkerEnter?.(id);
			});
			el.addEventListener("mouseleave", () => {
				const ids = el.dataset.annotationIds?.split(",") || [];
				for (const id of ids) onMarkerLeave?.(id);
			});
			shadowRoot.appendChild(el);
			stackElements.set(key, el);
			return el;
		};
		const hideAll = () => {
			for (const marker of markerMap.values()) marker.style.display = "none";
			for (const stack of stackElements.values()) stack.style.display = "none";
			for (const box of boxMap.values()) box.style.display = "none";
		};
		const animateEntrance = (els) => {
			els.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).forEach((el, i) => {
				el.animate([{ scale: "0" }, { scale: "1" }], {
					duration: 400,
					easing: SPRING,
					delay: i * 30,
					fill: "backwards"
				});
			});
		};
		const reposition = () => {
			if (!isActive) {
				hideAll();
				rafId = requestAnimationFrame(reposition);
				return;
			}
			const positioned = [];
			for (const annotation of currentAnnotations) {
				const marker = markerMap.get(annotation.id);
				if (!marker) continue;
				const target = resolveAnnotation(annotation);
				if (!target) {
					marker.style.display = "none";
					const box$1 = boxMap.get(annotation.id);
					if (box$1) box$1.style.display = "none";
					continue;
				}
				const rect = target.getBoundingClientRect();
				const clamped = clampMarker(rect.top - MARKER_OFFSET, rect.right - MARKER_OFFSET);
				positioned.push({
					annotation,
					marker,
					top: clamped.top,
					left: clamped.left
				});
				const box = boxMap.get(annotation.id);
				if (box) if (!visibleBoxes.has(annotation.id)) box.style.display = "none";
				else {
					const gap = 4;
					box.style.display = "block";
					box.style.top = `${rect.top - gap}px`;
					box.style.left = `${rect.left - gap}px`;
					box.style.width = `${rect.width + gap * 2}px`;
					box.style.height = `${rect.height + gap * 2}px`;
				}
			}
			const clusters = findClusters(positioned);
			const activeStackKeys = /* @__PURE__ */ new Set();
			markerToStack.clear();
			for (const cluster of clusters) if (cluster.length === 1) {
				const { marker, top, left } = cluster[0];
				marker.style.display = "flex";
				marker.style.top = `${top}px`;
				marker.style.left = `${left}px`;
			} else {
				const key = cluster.map((c) => c.annotation.id).sort().join(",");
				activeStackKeys.add(key);
				let avgTop = 0;
				let avgLeft = 0;
				for (const c of cluster) {
					avgTop += c.top;
					avgLeft += c.left;
					c.marker.style.display = "none";
					markerToStack.set(c.annotation.id, key);
				}
				avgTop /= cluster.length;
				avgLeft /= cluster.length;
				const clamped = clampMarker(avgTop, avgLeft);
				const stackEl = ensureStackElement(key, cluster.length);
				stackEl.dataset.annotationIds = key;
				stackEl.style.display = "";
				stackEl.style.top = `${clamped.top}px`;
				stackEl.style.left = `${clamped.left}px`;
			}
			if (pendingEntrance) {
				pendingEntrance = false;
				animateEntrance([...clusters.filter((c) => c.length === 1).map((c) => c[0].marker), ...Array.from(activeStackKeys, (k) => stackElements.get(k))]);
			}
			for (const [key, el] of stackElements) if (!activeStackKeys.has(key)) {
				if (el === activeStackEl) closeStackMenu(false);
				el.remove();
				stackElements.delete(key);
			}
			if (previewTarget && previewMarker && previewBox) {
				const pRect = previewTarget.getBoundingClientRect();
				const pClamped = clampMarker(pRect.top - MARKER_OFFSET, pRect.right - MARKER_OFFSET);
				const gap = 4;
				previewMarker.style.top = `${pClamped.top}px`;
				previewMarker.style.left = `${pClamped.left}px`;
				previewBox.style.top = `${pRect.top - gap}px`;
				previewBox.style.left = `${pRect.left - gap}px`;
				previewBox.style.width = `${pRect.width + gap * 2}px`;
				previewBox.style.height = `${pRect.height + gap * 2}px`;
			}
			rafId = requestAnimationFrame(reposition);
		};
		const update = (annotations) => {
			currentAnnotations = annotations;
			const activeIds = new Set(annotations.map((a) => a.id));
			for (const [id, el] of markerMap) if (!activeIds.has(id)) {
				el.remove();
				markerMap.delete(id);
			}
			for (const [id, el] of boxMap) if (!activeIds.has(id)) {
				el.remove();
				boxMap.delete(id);
			}
			annotations.forEach((annotation) => {
				let marker = markerMap.get(annotation.id);
				if (!marker) {
					marker = document.createElement("div");
					marker.className = "kai-marker";
					marker.setAttribute("role", "button");
					marker.setAttribute("tabindex", "0");
					marker.addEventListener("click", (e) => {
						e.stopPropagation();
						const el = e.currentTarget;
						onMarkerClick(annotation, el.getBoundingClientRect());
					});
					marker.addEventListener("mouseenter", () => onMarkerEnter?.(annotation.id));
					marker.addEventListener("mouseleave", () => onMarkerLeave?.(annotation.id));
					shadowRoot.appendChild(marker);
					markerMap.set(annotation.id, marker);
				}
				if (!marker.querySelector("svg")) marker.appendChild(createMarkerIcon());
				marker.setAttribute("aria-label", `Annotation: ${annotation.comment.slice(0, 50)}`);
				let box = boxMap.get(annotation.id);
				if (!box) {
					box = document.createElement("div");
					box.className = "kai-annotation-box";
					shadowRoot.appendChild(box);
					boxMap.set(annotation.id, box);
				}
			});
		};
		const clearPreview = () => {
			previewMarker?.remove();
			previewBox?.remove();
			previewMarker = null;
			previewBox = null;
			previewTarget = null;
		};
		const showPreview = (element) => {
			clearPreview();
			const rect = element.getBoundingClientRect();
			const gap = 4;
			const box = document.createElement("div");
			box.className = "kai-annotation-box";
			box.style.top = `${rect.top - gap}px`;
			box.style.left = `${rect.left - gap}px`;
			box.style.width = `${rect.width + gap * 2}px`;
			box.style.height = `${rect.height + gap * 2}px`;
			shadowRoot.appendChild(box);
			const marker = document.createElement("div");
			marker.className = "kai-marker";
			marker.appendChild(createMarkerIcon());
			marker.style.pointerEvents = "none";
			const previewClamped = clampMarker(rect.top - MARKER_OFFSET, rect.right - MARKER_OFFSET);
			marker.style.top = `${previewClamped.top}px`;
			marker.style.left = `${previewClamped.left}px`;
			shadowRoot.appendChild(marker);
			previewMarker = marker;
			previewBox = box;
			previewTarget = element;
			return new DOMRect(previewClamped.left, previewClamped.top, MARKER_SIZE, MARKER_SIZE);
		};
		const showBox = (id) => {
			visibleBoxes.add(id);
		};
		const hideBox = (id) => {
			visibleBoxes.delete(id);
		};
		const destroy = () => {
			cancelAnimationFrame(rafId);
			clearPreview();
			closeStackMenu();
			for (const el of markerMap.values()) el.remove();
			markerMap.clear();
			for (const el of boxMap.values()) el.remove();
			boxMap.clear();
			for (const el of stackElements.values()) el.remove();
			stackElements.clear();
			markerToStack.clear();
		};
		rafId = requestAnimationFrame(reposition);
		const setActive = (active) => {
			isActive = active;
			pendingEntrance = active;
			if (!active) closeStackMenu();
		};
		const getMarkerRect = (id) => {
			const stackKey = markerToStack.get(id);
			if (stackKey) {
				const stackEl = stackElements.get(stackKey);
				if (stackEl) return stackEl.getBoundingClientRect();
			}
			return markerMap.get(id)?.getBoundingClientRect();
		};
		return {
			update,
			showPreview,
			clearPreview,
			showBox,
			hideBox,
			setActive,
			destroy,
			getMarkerRect
		};
	};
	var makeDiv = (className) => {
		const el = document.createElement("div");
		el.className = className;
		el.style.display = "none";
		return el;
	};
	const createInspector = (shadowRoot) => {
		const lineV = makeDiv("kai-measure-line kai-measure-line--v");
		const lineH = makeDiv("kai-measure-line kai-measure-line--h");
		const cross = makeDiv("kai-measure-cross");
		const tooltip = makeDiv("kai-measure-tooltip");
		const textTooltip = makeDiv("kai-measure-text-tooltip");
		const selection = makeDiv("kai-measure-selection");
		const highlight = makeDiv("kai-measure-highlight");
		const allEls = [
			lineV,
			lineH,
			cross,
			tooltip,
			textTooltip,
			selection,
			highlight
		];
		for (const el of allEls) shadowRoot.appendChild(el);
		const hideAll = () => {
			for (const el of allEls) el.style.display = "none";
		};
		const showCrosshair = (data) => {
			const { cx, cy, left, right, top, bottom, width, height } = data;
			const vHeight = bottom - top;
			if (vHeight > 0) {
				lineV.style.display = "block";
				lineV.style.left = `${cx}px`;
				lineV.style.top = `${top}px`;
				lineV.style.height = `${vHeight}px`;
			} else lineV.style.display = "none";
			const hWidth = right - left;
			if (hWidth > 0) {
				lineH.style.display = "block";
				lineH.style.left = `${left}px`;
				lineH.style.top = `${cy}px`;
				lineH.style.width = `${hWidth}px`;
			} else lineH.style.display = "none";
			cross.style.display = "block";
			cross.style.left = `${cx}px`;
			cross.style.top = `${cy}px`;
			tooltip.textContent = `${Math.round(width)}×${Math.round(height)} px`;
			tooltip.style.display = "block";
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const offsetX = 12;
			const offsetY = 12;
			const tooltipRight = cx + offsetX + 100 < vw;
			const tooltipBelow = cy + offsetY + 24 < vh;
			tooltip.style.left = tooltipRight ? `${cx + offsetX}px` : "";
			tooltip.style.right = tooltipRight ? "" : `${vw - cx + offsetX}px`;
			tooltip.style.top = tooltipBelow ? `${cy + offsetY}px` : "";
			tooltip.style.bottom = tooltipBelow ? "" : `${vh - cy + offsetY}px`;
			textTooltip.style.display = "none";
			selection.style.display = "none";
			highlight.style.display = "none";
		};
		const showTextInfo = (cx, cy, data) => {
			hideAll();
			textTooltip.textContent = "";
			[
				["Font", data.fontFamily],
				["Size", data.fontSize],
				["Weight", data.fontWeight],
				["Line", data.lineHeight],
				["Color", data.color],
				["Track", data.letterSpacing]
			].forEach(([label, value], i) => {
				if (i > 0) textTooltip.appendChild(document.createTextNode("\n"));
				const span = document.createElement("span");
				span.className = "kai-tt-label";
				span.textContent = label;
				textTooltip.appendChild(span);
				textTooltip.appendChild(document.createTextNode(value));
			});
			textTooltip.style.display = "block";
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const offsetX = 14;
			const offsetY = 14;
			const fitsRight = cx + offsetX + 280 < vw;
			const fitsBelow = cy + offsetY + 120 < vh;
			textTooltip.style.left = fitsRight ? `${cx + offsetX}px` : "";
			textTooltip.style.right = fitsRight ? "" : `${vw - cx + offsetX}px`;
			textTooltip.style.top = fitsBelow ? `${cy + offsetY}px` : "";
			textTooltip.style.bottom = fitsBelow ? "" : `${vh - cy + offsetY}px`;
		};
		const showSelection = (x1, y1, x2, y2) => {
			const left = Math.min(x1, x2);
			const top = Math.min(y1, y2);
			const w = Math.abs(x2 - x1);
			const h = Math.abs(y2 - y1);
			selection.style.display = "block";
			selection.style.left = `${left}px`;
			selection.style.top = `${top}px`;
			selection.style.width = `${w}px`;
			selection.style.height = `${h}px`;
			lineV.style.display = "none";
			lineH.style.display = "none";
			cross.style.display = "none";
			tooltip.style.display = "none";
			textTooltip.style.display = "none";
			highlight.style.display = "none";
		};
		const showHighlight = (rect) => {
			highlight.style.display = "block";
			highlight.style.left = `${rect.left}px`;
			highlight.style.top = `${rect.top}px`;
			highlight.style.width = `${rect.width}px`;
			highlight.style.height = `${rect.height}px`;
			tooltip.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)} px`;
			tooltip.style.display = "block";
			tooltip.style.left = `${rect.left + rect.width / 2}px`;
			tooltip.style.top = `${rect.top + rect.height / 2}px`;
			tooltip.style.right = "";
			tooltip.style.bottom = "";
			tooltip.className = "kai-measure-tooltip kai-measure-tooltip--centered";
			lineV.style.display = "none";
			lineH.style.display = "none";
			cross.style.display = "none";
			textTooltip.style.display = "none";
			selection.style.display = "none";
		};
		const hide = () => {
			hideAll();
			tooltip.className = "kai-measure-tooltip";
		};
		const destroy = () => {
			for (const el of allEls) el.remove();
		};
		return {
			showCrosshair,
			showTextInfo,
			showSelection,
			showHighlight,
			hide,
			destroy
		};
	};
	var KEY_LABELS = {
		alt: isMac ? "⌥" : "Alt",
		shift: isMac ? "⇧" : "Shift",
		meta: isMac ? "⌘" : "Ctrl",
		up: "↑",
		down: "↓",
		esc: "Esc"
	};
	var CONTENT = {
		annotate: {
			text: "Click elements to annotate",
			hints: [
				{
					keys: ["alt"],
					hint: "inspect"
				},
				{
					keys: ["meta"],
					hint: "interact"
				},
				{
					keys: ["up", "down"],
					hint: "parent / child"
				}
			]
		},
		measure: {
			text: "Drag to measure",
			hints: [{
				keys: ["alt", "shift"],
				hint: "text info"
			}]
		},
		interact: {
			text: "Interacting with page",
			hints: [{
				keys: ["meta"],
				hint: "release to annotate"
			}]
		},
		pick: {
			text: "Click an element to copy its selector",
			hints: [{
				keys: ["esc"],
				hint: "cancel"
			}]
		}
	};
	var renderContent = (mode, pressedKeys = []) => {
		const frag = document.createDocumentFragment();
		const { text, hints } = CONTENT[mode];
		const span = document.createElement("span");
		span.textContent = text;
		frag.appendChild(span);
		for (const { keys, hint } of hints) {
			const sep = document.createElement("span");
			sep.className = "kai-guide-bar-sep";
			sep.textContent = "·";
			frag.appendChild(sep);
			for (const k of keys) {
				const kbd = document.createElement("span");
				kbd.className = "kai-guide-bar-kbd";
				kbd.setAttribute("data-key", k);
				if (pressedKeys.includes(k)) kbd.setAttribute("data-pressed", "");
				kbd.textContent = KEY_LABELS[k];
				frag.appendChild(kbd);
			}
			const hintEl = document.createElement("span");
			hintEl.className = "kai-guide-bar-hint";
			hintEl.textContent = hint;
			frag.appendChild(hintEl);
		}
		return frag;
	};
	const createGuideBar = (shadowRoot) => {
		let currentMode = null;
		let barAnim = null;
		let contentAnim = null;
		let widthAnim = null;
		let visible = false;
		const bar = document.createElement("div");
		bar.className = "kai-guide-bar";
		bar.setAttribute("aria-hidden", "true");
		bar.style.display = "none";
		const content = document.createElement("div");
		content.className = "kai-guide-bar-content";
		bar.appendChild(content);
		shadowRoot.appendChild(bar);
		let pressedKeys = [];
		const updateKeys = (pressed) => {
			if (!visible) return;
			pressedKeys = pressed;
			const kbds = content.querySelectorAll(".kai-guide-bar-kbd");
			for (const kbd of kbds) {
				const key = kbd.getAttribute("data-key");
				if (pressed.includes(key)) kbd.setAttribute("data-pressed", "");
				else kbd.removeAttribute("data-pressed");
			}
		};
		const show = (mode, pressed = []) => {
			pressedKeys = pressed;
			if (visible && currentMode === mode) {
				updateKeys(pressed);
				return;
			}
			barAnim?.cancel();
			contentAnim?.cancel();
			widthAnim?.cancel();
			if (!visible) {
				visible = true;
				currentMode = mode;
				bar.style.display = "";
				content.replaceChildren(renderContent(mode, pressedKeys));
				barAnim = bar.animate([{
					transform: "translateX(-50%) scale(0.8) translateY(-8px)",
					opacity: 0
				}, {
					transform: "translateX(-50%) scale(1) translateY(0)",
					opacity: 1
				}], {
					duration: 400,
					easing: SPRING,
					fill: "forwards"
				});
			} else {
				currentMode = mode;
				contentAnim = content.animate([{
					opacity: 1,
					transform: "translateY(0)"
				}, {
					opacity: 0,
					transform: "translateY(-4px)"
				}], {
					duration: 150,
					easing: "ease-out",
					fill: "forwards"
				});
				contentAnim.finished.then(() => {
					const oldWidth = bar.getBoundingClientRect().width;
					content.replaceChildren(renderContent(mode, pressedKeys));
					const newWidth = bar.getBoundingClientRect().width;
					if (oldWidth !== newWidth) {
						widthAnim?.cancel();
						widthAnim = bar.animate([{ width: `${oldWidth}px` }, { width: `${newWidth}px` }], {
							duration: 250,
							easing: GLIDE,
							fill: "forwards"
						});
						widthAnim.finished.then(() => {
							widthAnim?.cancel();
							widthAnim = null;
						}).catch(() => {});
					}
					contentAnim = content.animate([{
						opacity: 0,
						transform: "translateY(4px)"
					}, {
						opacity: 1,
						transform: "translateY(0)"
					}], {
						duration: 200,
						easing: "ease-out",
						fill: "forwards"
					});
				}).catch(() => {});
			}
		};
		const hide = () => {
			if (!visible) return;
			visible = false;
			currentMode = null;
			barAnim?.cancel();
			contentAnim?.cancel();
			widthAnim?.cancel();
			barAnim = bar.animate([{
				transform: "translateX(-50%) scale(1) translateY(0)",
				opacity: 1
			}, {
				transform: "translateX(-50%) scale(0.9) translateY(-6px)",
				opacity: 0
			}], {
				duration: 200,
				easing: "ease-out",
				fill: "forwards"
			});
			barAnim.finished.then(() => {
				if (!visible) bar.style.display = "none";
			}).catch(() => {});
		};
		const destroy = () => {
			barAnim?.cancel();
			contentAnim?.cancel();
			widthAnim?.cancel();
			bar.remove();
		};
		return {
			show,
			hide,
			updateKeys,
			destroy
		};
	};
	var DRAG_THRESHOLD = 5;
	var snapToSvgRoot = (el) => {
		let current = el;
		while (current instanceof SVGElement && current.ownerSVGElement) current = current.ownerSVGElement;
		return current;
	};
	var isPassThroughEvent = (e) => isMac ? e.metaKey : e.ctrlKey;
	var isEditable = (t) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
	var instance = null;
	var UIAnnotator = class extends HTMLElement {
		shadow;
		annotations = [];
		active = false;
		fabCorner;
		theme;
		accent;
		systemDark = window.matchMedia("(prefers-color-scheme: dark)");
		altHeld = false;
		shiftHeld = false;
		passThrough = false;
		pickMode = false;
		settingsOpen = false;
		dragging = false;
		dragStart = null;
		lastMousePos = {
			x: 0,
			y: 0
		};
		hasPointer = false;
		measureRafId = null;
		highlightLocked = false;
		fab;
		overlay;
		inspector;
		markers;
		guideBar;
		activePopover = null;
		activePopoverAnnotationId = null;
		hoverTarget = null;
		selectedElement = null;
		walkedUp = false;
		hoverDirty = false;
		hoverRafId = null;
		domObserver = null;
		handleMouseLeave;
		handleClick;
		handleBlockedPointer;
		handleGlobalKeydown;
		handleKeydown;
		handleKeyup;
		handleWindowBlur;
		handleLayoutChange;
		handleMouseMove;
		handleMouseDown;
		handleMouseUp;
		constructor() {
			super();
			if (instance) {
				console.warn("<ui-annotator> is a singleton — only one instance is allowed per page.");
				return;
			}
			instance = this;
			this.shadow = this.attachShadow({ mode: "closed" });
			const style = document.createElement("style");
			style.textContent = styles;
			this.shadow.appendChild(style);
			this.annotations = loadSession();
			this.fabCorner = loadFabCorner();
			this.theme = loadTheme();
			this.accent = loadAccent();
			this.fab = createFab(this.shadow, {
				initialCorner: this.fabCorner,
				onToggle: () => this.toggle(),
				onCopyMarkdown: () => {
					navigator.clipboard.writeText(toMarkdown(this.annotations)).then(() => {
						this.fab.confirmCopy();
					});
				},
				onClearAll: () => {
					this.annotations = [];
					clearSession();
					this.markers.update([]);
					this.fab.updateBadge(0);
					this.fab.updateActionStates(0);
					this.closePopover();
				},
				onPickToggle: (armed) => {
					this.pickMode = armed;
					if (armed) this.closePopover();
					this.guideBar.show(armed ? "pick" : "annotate");
				},
				onCornerChange: (c) => {
					this.fabCorner = c;
					saveFabCorner(c);
				},
				onSettingsToggle: (open) => {
					this.settingsOpen = open;
					if (open) {
						this.clearHover();
						this.guideBar.hide();
					} else if (this.active) {
						this.guideBar.show(this.pickMode ? "pick" : "annotate");
						this.handleLayoutChange();
					}
				},
				settings: {
					version: "0.2.0",
					theme: this.theme,
					accent: this.accent,
					onThemeChange: (t) => {
						this.theme = t;
						saveTheme(t);
						this.applyTheme();
					},
					onAccentChange: (a) => {
						this.accent = a;
						saveAccent(a);
						applyAccent(this, a);
					}
				}
			});
			this.overlay = createOverlay(this.shadow);
			this.inspector = createInspector(this.shadow);
			this.guideBar = createGuideBar(this.shadow);
			this.markers = createMarkerManager(this.shadow, (annotation, markerRect) => {
				this.openEditPopover(annotation, markerRect);
			}, (id) => this.markers.showBox(id), (id) => {
				if (this.activePopoverAnnotationId !== id) this.markers.hideBox(id);
			});
			if (this.annotations.length) {
				this.markers.update(this.annotations);
				this.fab.updateBadge(this.annotations.length);
			}
			this.fab.updateActionStates(this.annotations.length);
			this.handleMouseLeave = (e) => {
				if (e.relatedTarget) return;
				this.hasPointer = false;
				this.clearHover();
			};
			this.handleLayoutChange = () => {
				this.hoverDirty = true;
				this.scheduleHoverUpdate();
			};
			this.handleClick = (e) => {
				if (this.isOwnElement(e)) return;
				if (this.passThrough || isPassThroughEvent(e)) return;
				e.preventDefault();
				e.stopImmediatePropagation();
				if (this.altHeld) return;
				const target = this.selectedElement ?? this.hitTest(e.clientX, e.clientY);
				if (!target || !target.isConnected) return;
				this.clearHover();
				if (this.pickMode) {
					this.pickMode = false;
					this.fab.setPickArmed(false);
					this.guideBar.show("annotate");
					navigator.clipboard.writeText(generateSelector(target)).then(() => {
						this.fab.confirmPick();
					});
					return;
				}
				const existing = this.annotations.find((a) => resolveAnnotation(a) === target);
				if (existing) {
					const markerRect = this.markers.getMarkerRect(existing.id);
					this.openEditPopover(existing, markerRect);
				} else {
					const markerRect = this.markers.showPreview(target);
					this.openPopover(target, markerRect);
				}
			};
			this.handleBlockedPointer = (e) => {
				if (this.isOwnElement(e)) return;
				if (this.passThrough || isPassThroughEvent(e)) return;
				e.stopImmediatePropagation();
			};
			this.handleGlobalKeydown = (e) => {
				if (e.key === "A" && e.ctrlKey && e.shiftKey) {
					e.preventDefault();
					this.toggle();
				}
				if (e.key === "Escape" && this.active && !this.activePopover) {
					if (this.fab.closeSettings()) return;
					if (this.pickMode) this.disarmPick();
					else this.deactivate();
				}
			};
			this.handleKeydown = (e) => {
				const action = this.shortcutFor(e);
				if (action) {
					e.preventDefault();
					e.stopImmediatePropagation();
					if (action !== "settings") this.fab.closeSettings();
					this.fab.pressAction(action);
					return;
				}
				if (e.key === PASS_THROUGH_KEY) {
					if (this.passThrough || this.altHeld || isEditable(this.shadow.activeElement)) return;
					this.enterPassThrough();
					return;
				}
				if (e.key === "Alt") {
					if (this.altHeld || this.passThrough) return;
					this.altHeld = true;
					this.clearHover();
					document.body.style.cursor = "crosshair";
					this.guideBar.show("measure", ["alt"]);
					this.scheduleMeasureUpdate();
				}
				if (e.key === "Shift") {
					this.shiftHeld = true;
					if (this.altHeld) this.guideBar.updateKeys(["alt", "shift"]);
					if (this.altHeld && !this.dragging && !this.highlightLocked) this.scheduleMeasureUpdate();
				}
				if (e.key === "ArrowUp" || e.key === "ArrowDown") {
					if (!this.altHeld && !this.passThrough) this.guideBar.updateKeys([e.key === "ArrowUp" ? "up" : "down"]);
					this.walkAncestors(e);
				}
			};
			this.handleKeyup = (e) => {
				if (e.key === PASS_THROUGH_KEY && this.passThrough) this.exitPassThrough();
				if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !this.altHeld && !this.passThrough) this.guideBar.updateKeys([]);
				if (e.key === "Alt") this.exitMeasureMode();
				if (e.key === "Shift") {
					this.shiftHeld = false;
					if (this.altHeld) this.guideBar.updateKeys(["alt"]);
					if (this.altHeld && !this.dragging && !this.highlightLocked) this.scheduleMeasureUpdate();
				}
			};
			this.handleWindowBlur = () => {
				if (this.altHeld) this.exitMeasureMode();
				if (this.passThrough) this.exitPassThrough();
			};
			this.handleMouseMove = (e) => {
				this.lastMousePos = {
					x: e.clientX,
					y: e.clientY
				};
				this.hasPointer = true;
				if (!this.altHeld) {
					this.scheduleHoverUpdate();
					return;
				}
				if (this.dragStart && !this.dragging) {
					const dx = e.clientX - this.dragStart.x;
					const dy = e.clientY - this.dragStart.y;
					if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
						this.dragging = true;
						this.highlightLocked = false;
					}
				}
				this.scheduleMeasureUpdate();
			};
			this.handleMouseDown = (e) => {
				if (this.isOwnElement(e)) return;
				if (this.passThrough || isPassThroughEvent(e)) return;
				e.preventDefault();
				e.stopImmediatePropagation();
				if (!this.altHeld) return;
				if (e.button !== 0) return;
				this.dragStart = {
					x: e.clientX,
					y: e.clientY
				};
				this.dragging = false;
				this.highlightLocked = false;
			};
			this.handleMouseUp = (e) => {
				if (this.isOwnElement(e)) return;
				if (this.passThrough || isPassThroughEvent(e)) return;
				e.preventDefault();
				e.stopImmediatePropagation();
				if (!this.altHeld) return;
				if (e.button !== 0) return;
				if (this.dragging && this.dragStart) {
					const x1 = this.dragStart.x;
					const y1 = this.dragStart.y;
					const x2 = e.clientX;
					const y2 = e.clientY;
					const largest = findLargestEnclosedElement(new DOMRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)), this);
					if (largest) {
						this.inspector.showHighlight(largest.getBoundingClientRect());
						this.highlightLocked = true;
					} else this.inspector.hide();
				}
				this.dragStart = null;
				this.dragging = false;
			};
		}
		hitTest(x, y) {
			let el = document.elementFromPoint(x, y);
			if (!el || el === this) return null;
			while (el.shadowRoot) {
				const inner = el.shadowRoot.elementFromPoint(x, y);
				if (!inner || inner === el) break;
				el = inner;
			}
			return snapToSvgRoot(el);
		}
		scheduleHoverUpdate() {
			if (this.hoverRafId !== null) return;
			this.hoverRafId = requestAnimationFrame(() => {
				this.hoverRafId = null;
				this.updateHover();
			});
		}
		updateHover() {
			if (!this.active || this.altHeld || this.passThrough || this.settingsOpen || !this.hasPointer) return;
			const dirty = this.hoverDirty;
			this.hoverDirty = false;
			const hit = this.hitTest(this.lastMousePos.x, this.lastMousePos.y);
			if (!hit) {
				this.clearHover();
				return;
			}
			if (hit === this.hoverTarget && !dirty) return;
			this.hoverTarget = hit;
			if (!(this.walkedUp && this.selectedElement?.isConnected && composedContains(this.selectedElement, hit))) {
				this.selectedElement = hit;
				this.walkedUp = false;
			}
			this.overlay.show(this.selectedElement);
		}
		clearHover() {
			this.hoverTarget = null;
			this.selectedElement = null;
			this.walkedUp = false;
			this.overlay.hide();
		}
		walkAncestors(e) {
			if (this.activePopover || this.altHeld || this.passThrough) return;
			if (!this.selectedElement || !this.hoverTarget || isEditable(e.target)) return;
			e.preventDefault();
			if (e.key === "ArrowUp") {
				const parent = composedParent(this.selectedElement);
				if (!parent || this.selectedElement === document.body) return;
				this.selectedElement = parent;
				this.walkedUp = true;
			} else {
				if (this.selectedElement === this.hoverTarget) return;
				const hover = this.hoverTarget;
				const child = composedChildren(this.selectedElement).find((c) => composedContains(c, hover));
				if (!child) return;
				this.selectedElement = child;
				this.walkedUp = child !== hover;
			}
			this.overlay.show(this.selectedElement);
		}
		enterPassThrough() {
			this.passThrough = true;
			this.clearHover();
			this.guideBar.show("interact", ["meta"]);
		}
		exitPassThrough() {
			this.passThrough = false;
			if (!this.active) return;
			this.guideBar.show(this.pickMode ? "pick" : "annotate");
			this.handleLayoutChange();
		}
		disarmPick() {
			if (!this.pickMode) return;
			this.pickMode = false;
			this.fab.setPickArmed(false);
			if (this.active) this.guideBar.show("annotate");
		}
		exitMeasureMode() {
			this.altHeld = false;
			this.shiftHeld = false;
			this.dragging = false;
			this.dragStart = null;
			this.highlightLocked = false;
			document.body.style.cursor = "";
			this.inspector.hide();
			if (this.active) this.guideBar.show(this.pickMode ? "pick" : "annotate");
			if (this.measureRafId !== null) {
				cancelAnimationFrame(this.measureRafId);
				this.measureRafId = null;
			}
			this.handleLayoutChange();
		}
		scheduleMeasureUpdate() {
			if (this.measureRafId !== null) return;
			this.measureRafId = requestAnimationFrame(() => {
				this.measureRafId = null;
				this.updateMeasure();
			});
		}
		updateMeasure() {
			if (!this.altHeld) return;
			if (this.highlightLocked) return;
			const { x: cx, y: cy } = this.lastMousePos;
			if (this.dragging && this.dragStart) {
				this.inspector.showSelection(this.dragStart.x, this.dragStart.y, cx, cy);
				return;
			}
			if (this.shiftHeld) {
				const el = document.elementFromPoint(cx, cy);
				if (el && el !== this) {
					const textData = computeTextInspectData(el);
					if (textData) {
						this.inspector.showTextInfo(cx, cy, textData);
						return;
					}
				}
				this.inspector.hide();
				return;
			}
			const data = computeCrosshair(cx, cy, this);
			this.inspector.showCrosshair(data);
		}
		applyTheme = () => {
			const resolved = this.theme === "system" ? this.systemDark.matches ? "dark" : "light" : this.theme;
			this.setAttribute("data-theme", resolved);
		};
		connectedCallback() {
			this.applyTheme();
			applyAccent(this, this.accent);
			this.systemDark.addEventListener("change", this.applyTheme);
			document.addEventListener("keydown", this.handleGlobalKeydown);
		}
		disconnectedCallback() {
			if (instance === this) instance = null;
			this.deactivate();
			this.systemDark.removeEventListener("change", this.applyTheme);
			document.removeEventListener("keydown", this.handleGlobalKeydown);
			this.markers.destroy();
			this.overlay.destroy();
			this.inspector.destroy();
			this.guideBar.destroy();
			this.fab.destroy();
		}
		toggle() {
			if (this.active) this.deactivate();
			else this.activate();
		}
		activate() {
			this.active = true;
			this.fab.setActive(true);
			this.markers.setActive(true);
			this.guideBar.show("annotate");
			document.addEventListener("mouseout", this.handleMouseLeave, true);
			document.addEventListener("click", this.handleClick, true);
			document.addEventListener("dblclick", this.handleBlockedPointer, true);
			document.addEventListener("pointerdown", this.handleBlockedPointer, true);
			document.addEventListener("pointerup", this.handleBlockedPointer, true);
			document.addEventListener("keydown", this.handleKeydown, true);
			document.addEventListener("keyup", this.handleKeyup);
			document.addEventListener("mousemove", this.handleMouseMove, true);
			document.addEventListener("mousedown", this.handleMouseDown, true);
			document.addEventListener("mouseup", this.handleMouseUp, true);
			window.addEventListener("scroll", this.handleLayoutChange, {
				capture: true,
				passive: true
			});
			window.addEventListener("resize", this.handleLayoutChange);
			window.addEventListener("blur", this.handleWindowBlur);
			this.domObserver = new MutationObserver(this.handleLayoutChange);
			this.domObserver.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true
			});
		}
		deactivate() {
			this.active = false;
			this.fab.setActive(false);
			this.markers.setActive(false);
			this.guideBar.hide();
			if (this.altHeld) this.exitMeasureMode();
			this.passThrough = false;
			this.disarmPick();
			document.removeEventListener("mouseout", this.handleMouseLeave, true);
			document.removeEventListener("click", this.handleClick, true);
			document.removeEventListener("dblclick", this.handleBlockedPointer, true);
			document.removeEventListener("pointerdown", this.handleBlockedPointer, true);
			document.removeEventListener("pointerup", this.handleBlockedPointer, true);
			document.removeEventListener("keydown", this.handleKeydown, true);
			document.removeEventListener("keyup", this.handleKeyup);
			document.removeEventListener("mousemove", this.handleMouseMove, true);
			document.removeEventListener("mousedown", this.handleMouseDown, true);
			document.removeEventListener("mouseup", this.handleMouseUp, true);
			window.removeEventListener("scroll", this.handleLayoutChange, { capture: true });
			window.removeEventListener("resize", this.handleLayoutChange);
			window.removeEventListener("blur", this.handleWindowBlur);
			this.domObserver?.disconnect();
			this.domObserver = null;
			this.clearHover();
			this.inspector.hide();
			this.closePopover();
			if (this.measureRafId !== null) {
				cancelAnimationFrame(this.measureRafId);
				this.measureRafId = null;
			}
			if (this.hoverRafId !== null) {
				cancelAnimationFrame(this.hoverRafId);
				this.hoverRafId = null;
			}
		}
		shortcutFor(e) {
			if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return null;
			if (isEditable(e.target) || isEditable(this.shadow.activeElement)) return null;
			const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
			for (const action of Object.keys(SHORTCUTS)) if (SHORTCUTS[action].keys.includes(key)) return action;
			return null;
		}
		isOwnElement(e) {
			return e.composedPath().some((el) => el === this || el === this.shadow);
		}
		openPopover(element, anchorRect) {
			this.closePopover();
			const selector = generateSelector(element);
			const locator = generateLocator(element);
			const path = generatePath(element);
			const computedStyles = getComputedStyles(element);
			const rect = element.getBoundingClientRect();
			this.activePopover = createPopover(this.shadow, {
				element,
				selector,
				path,
				styles: computedStyles,
				anchorRect,
				onSubmit: (comment) => {
					const ariaAttrs = {};
					const dataAttrs = {};
					for (const attr of Array.from(element.attributes)) if (attr.name === "role" || attr.name.startsWith("aria-")) ariaAttrs[attr.name] = attr.value;
					else if (attr.name.startsWith("data-")) dataAttrs[attr.name] = attr.value;
					const annotation = {
						id: crypto.randomUUID(),
						selector,
						locator,
						path,
						comment,
						styles: computedStyles,
						rect: {
							x: rect.x,
							y: rect.y,
							w: rect.width,
							h: rect.height
						},
						createdAt: (/* @__PURE__ */ new Date()).toISOString(),
						element: element.tagName.toLowerCase(),
						classes: Array.from(element.classList).filter((c) => !c.startsWith("kai-")),
						nearbyText: getNearbyText(element),
						url: location.href,
						ariaAttributes: ariaAttrs,
						dataAttributes: dataAttrs
					};
					this.annotations.push(annotation);
					this.markers.clearPreview();
					this.persist();
					this.closePopover();
				},
				onClose: () => {
					this.markers.clearPreview();
					this.closePopover();
				}
			});
		}
		openEditPopover(annotation, markerRect) {
			this.closePopover();
			this.activePopoverAnnotationId = annotation.id;
			this.markers.showBox(annotation.id);
			const target = resolveAnnotation(annotation);
			if (!target) return;
			const path = annotation.path;
			const computedStyles = getComputedStyles(target);
			this.activePopover = createPopover(this.shadow, {
				element: target,
				selector: annotation.selector,
				path,
				styles: computedStyles,
				existingComment: annotation.comment,
				anchorRect: markerRect,
				onSubmit: (comment) => {
					annotation.comment = comment;
					this.persist();
					this.closePopover();
				},
				onDelete: () => {
					this.annotations = this.annotations.filter((a) => a.id !== annotation.id);
					this.persist();
					this.closePopover();
				},
				onClose: () => this.closePopover()
			});
		}
		closePopover() {
			if (this.activePopoverAnnotationId) {
				this.markers.hideBox(this.activePopoverAnnotationId);
				this.activePopoverAnnotationId = null;
			}
			this.activePopover?.destroy();
			this.activePopover = null;
		}
		persist() {
			saveSession(this.annotations);
			this.markers.update(this.annotations);
			this.fab.updateBadge(this.annotations.length);
			this.fab.updateActionStates(this.annotations.length);
		}
	};
	customElements.define("ui-annotator", UIAnnotator);
	if (!document.querySelector("ui-annotator")) document.body.appendChild(document.createElement("ui-annotator"));
})();
