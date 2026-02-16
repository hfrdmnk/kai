(function() {
	const styles = `
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

  --inv-bg: var(--gray-900);
  --inv-text: var(--white);
  --inv-text-muted: var(--gray-400);

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
  background: var(--inv-bg);
  color: var(--inv-text);
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
  z-index: var(--z-tooltip);
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
  border: 1px solid var(--border-3);
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
  border: 1.5px dashed var(--gray-300);
  background: rgb(0 0 0 / 0.02);
  z-index: var(--z-overlay);
  border-radius: var(--radius-sm);
}

/* ── Autocomplete ────────────────────────────────── */

.kai-autocomplete {
  position: fixed;
  background: var(--bg-3);
  border: 1px solid var(--border-3);
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
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
	const generateSelector = (el) => {
		if (el === document.body) return "body";
		if (el === document.documentElement) return "html";
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
			if (document.querySelectorAll(selector).length === 1) return selector;
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
			current = current.parentElement;
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
	var getKey = () => `ui-annotator:${location.origin}${location.pathname}`;
	var FAB_CORNER_KEY = "ui-annotator:fab-corner";
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
	const getDirectText = (el) => {
		const text = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim()).filter(Boolean).join(" ").trim();
		if (!text) return "";
		return text.slice(0, 40) + (text.length > 40 ? "…" : "");
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
	const toMarkdown = (annotations) => {
		const lines = [
			"# UI Annotations",
			"",
			`**URL:** ${location.href}`,
			`**Exported:** ${(/* @__PURE__ */ new Date()).toISOString()}`,
			`**Viewport:** ${window.innerWidth}×${window.innerHeight}`,
			""
		];
		annotations.forEach((a, i) => {
			lines.push(`## ${i + 1}. \`${a.selector}\``);
			lines.push("");
			lines.push(`**Path:** ${a.path}`);
			lines.push("");
			const styleEntries = Object.entries(a.styles);
			if (styleEntries.length) {
				lines.push("```css");
				for (const [prop, value] of styleEntries) lines.push(`${prop}: ${value};`);
				lines.push("```");
				lines.push("");
			}
			if (a.comment) {
				lines.push(`> ${a.comment.replace(/\n/g, "\n> ")}`);
				lines.push("");
			}
		});
		return lines.join("\n");
	};
	const createOverlay = (shadowRoot) => {
		const overlay = document.createElement("div");
		overlay.className = "kai-overlay";
		overlay.setAttribute("aria-hidden", "true");
		overlay.style.display = "none";
		const tooltip = document.createElement("div");
		tooltip.className = "kai-tooltip";
		tooltip.setAttribute("aria-hidden", "true");
		tooltip.style.display = "none";
		shadowRoot.appendChild(overlay);
		shadowRoot.appendChild(tooltip);
		const describeElement = (el) => {
			let label = el.tagName.toLowerCase();
			if (el.id) label += `#${el.id}`;
			const classes = Array.from(el.classList).filter((c) => !c.startsWith("kai-")).slice(0, 3);
			if (classes.length) label += `.${classes.join(".")}`;
			const textPreview = getDirectText(el);
			if (textPreview) label += `: "${textPreview}"`;
			return label;
		};
		const show = (el) => {
			const rect = el.getBoundingClientRect();
			const gap = 4;
			overlay.style.display = "block";
			overlay.style.top = `${rect.top - gap}px`;
			overlay.style.left = `${rect.left - gap}px`;
			overlay.style.width = `${rect.width + gap * 2}px`;
			overlay.style.height = `${rect.height + gap * 2}px`;
			tooltip.textContent = describeElement(el);
			tooltip.style.display = "block";
			const tw = tooltip.offsetWidth;
			const th = tooltip.offsetHeight;
			const vw = document.documentElement.clientWidth;
			const vh = document.documentElement.clientHeight;
			const pad = 4;
			let left = Math.max(pad, Math.min(rect.left, vw - tw - pad));
			let top;
			if (rect.top > th + pad + 2) top = rect.top - th - 2;
			else if (rect.bottom + th + 6 < vh - pad) top = rect.bottom + 6;
			else top = pad;
			tooltip.style.left = `${left}px`;
			tooltip.style.top = `${top}px`;
		};
		const hide = () => {
			overlay.style.display = "none";
			tooltip.style.display = "none";
		};
		const destroy = () => {
			overlay.remove();
			tooltip.remove();
		};
		return {
			show,
			hide,
			destroy
		};
	};
	var kai_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 4V20M18 6L6.00001 18M20 12L4 12M18 18L6.00001 6.00001\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var trash_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M9 3H15M3 6H21M10 16V11M14 16V11M5 6H19L18.1245 19.133C18.0544 20.1836 17.1818 21 16.1289 21L7.8461 21C6.79171 21 5.91842 20.1814 5.85028 19.1292L5 6Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var copy_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5M11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22Z\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var check_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M3 12L9 18L21 6\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n</svg>\n";
	var help_default = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 20.9642V21V20.5M12 15.465C15 13.9985 18 12.1054 18 8.86587C18 5.62624 15.3137 3 12 3C8.68629 3 6 5.62624 6 8.86587\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>\n";
	const SPRING = "linear(0, 0.008 1.1%, 0.034 2.3%, 0.134 4.9%, 0.264 7.3%, 0.683 14.3%, 0.797 16.5%, 0.89 18.6%, 0.967 20.7%, 1.027 22.8%, 1.073 25%, 1.104 27.3%, 1.123 30.6%, 1.119 34.3%, 1.018 49.5%, 0.988 58.6%, 0.985 65.2%, 1 84.5%, 1)";
	const GLIDE = "linear(0, 0.012 0.9%, 0.05 2%, 0.411 9.2%, 0.517 11.8%, 0.611 14.6%, 0.694 17.7%, 0.765 21.1%, 0.824 24.8%, 0.872 28.9%, 0.91 33.4%, 0.939 38.4%, 0.977 50.9%, 0.994 68.4%, 1)";
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
	var DRAG_THRESHOLD$1 = 5;
	var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
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
		const copyBtn = document.createElement("button");
		copyBtn.className = "kai-fab-action";
		copyBtn.setAttribute("aria-label", "Copy as Markdown");
		setIcon(copyBtn, copy_default);
		const clearBtn = document.createElement("button");
		clearBtn.className = "kai-fab-action";
		clearBtn.setAttribute("aria-label", "Clear all");
		setIcon(clearBtn, trash_default);
		const tooltip = document.createElement("div");
		tooltip.className = "kai-tooltip";
		tooltip.style.display = "none";
		tooltip.style.fontFamily = "var(--font-sans)";
		shadowRoot.appendChild(tooltip);
		const showTooltip = (btn, label) => {
			tooltip.textContent = label;
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
		copyBtn.addEventListener("mouseenter", () => showTooltip(copyBtn, "Copy as Markdown"));
		copyBtn.addEventListener("mouseleave", hideTooltip);
		clearBtn.addEventListener("mouseenter", () => showTooltip(clearBtn, "Clear all"));
		clearBtn.addEventListener("mouseleave", hideTooltip);
		actions.appendChild(copyBtn);
		actions.appendChild(clearBtn);
		shadowRoot.appendChild(fab);
		shadowRoot.appendChild(actions);
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
			fabAnim?.cancel();
			fabAnim = fab.animate([{ transform: "scale(1)" }, { transform: "scale(0.9)" }], {
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
				fabAnim?.cancel();
				fabAnim = fab.animate([{ transform: "scale(0.9)" }, { transform: "scale(1)" }], {
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
			fab.addEventListener("pointerdown", () => {
				fabAnim?.cancel();
				fabAnim = fab.animate([{ transform: "scale(1)" }, { transform: "scale(0.9)" }], {
					duration: 120,
					easing: "ease-out",
					fill: "forwards"
				});
			});
			fab.addEventListener("pointerup", () => {
				fabAnim?.cancel();
				fabAnim = fab.animate([{ transform: "scale(0.9)" }, { transform: "scale(1)" }], {
					duration: 600,
					easing: SPRING
				});
			});
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
				[copyBtn, clearBtn].forEach((btn, i) => {
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
						fill: "both"
					});
					actionAnims.push(anim);
				});
			});
		};
		const animateActionsOut = () => {
			hideTooltip();
			actionAnims.forEach((a) => a.cancel());
			actionAnims = [];
			const tx = isRightCorner() ? "8px" : "-8px";
			const anims = [copyBtn, clearBtn].map((btn, i) => {
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
		const updateActionStates = (count) => {
			const disabled = count === 0;
			copyBtn.disabled = disabled;
			clearBtn.disabled = disabled;
		};
		const destroy = () => {
			fab.remove();
			actions.remove();
			tooltip.remove();
			copyStatus.remove();
		};
		return {
			updateBadge,
			setActive,
			updateActionStates,
			confirmCopy,
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
		body.appendChild(textarea);
		body.appendChild(pathEl);
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
			deleteBtn.className = "kai-btn kai-btn--secondary";
			deleteBtn.textContent = "Delete";
			let deleteArmed = false;
			let deleteTimer = null;
			const resetDelete = () => {
				deleteArmed = false;
				deleteBtn.textContent = "Delete";
				deleteBtn.style.background = "";
				deleteBtn.style.color = "";
				deleteBtn.style.borderColor = "";
				deleteTimer = null;
			};
			deleteBtn.addEventListener("click", () => {
				if (deleteArmed) {
					if (deleteTimer) clearTimeout(deleteTimer);
					opts.onDelete();
				} else {
					deleteArmed = true;
					deleteBtn.textContent = "Sure?";
					deleteBtn.style.background = "var(--color-danger)";
					deleteBtn.style.color = "var(--white)";
					deleteBtn.style.borderColor = "var(--color-danger)";
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
		document.addEventListener("pointerdown", onPointerDown, { capture: true });
		const onResize = () => opts.onClose();
		window.addEventListener("resize", onResize);
		const previousFocus = shadowRoot.activeElement ?? document.activeElement;
		requestAnimationFrame(() => textarea.focus());
		const ac = attachAutocomplete(textarea, shadowRoot, () => opts.element);
		const onKeydown = (e) => {
			if (e.key === "Escape" && !shadowRoot.querySelector(".kai-autocomplete")) opts.onClose();
		};
		popover.addEventListener("keydown", onKeydown);
		const destroy = () => {
			window.removeEventListener("scroll", onScroll, { capture: true });
			document.removeEventListener("pointerdown", onPointerDown, { capture: true });
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
			el.className = isActive ? "kai-marker-stack kai-marker-stack--has-badge" : "kai-marker-stack kai-marker-stack--has-badge kai-marker-stack--inactive";
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
		const reposition = () => {
			const positioned = [];
			for (const annotation of currentAnnotations) {
				const marker = markerMap.get(annotation.id);
				if (!marker) continue;
				const target = document.querySelector(annotation.selector);
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
				stackEl.style.top = `${clamped.top}px`;
				stackEl.style.left = `${clamped.left}px`;
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
					marker.className = isActive ? "kai-marker" : "kai-marker kai-marker--inactive";
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
			for (const marker of markerMap.values()) marker.classList.toggle("kai-marker--inactive", !active);
			for (const stack of stackElements.values()) stack.classList.toggle("kai-marker-stack--inactive", !active);
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
	var isMac = /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
	var KEY_LABELS = {
		alt: isMac ? "⌥" : "Alt",
		shift: isMac ? "⇧" : "Shift"
	};
	var CONTENT = {
		annotate: {
			text: "Click elements to annotate",
			keys: ["alt"],
			hint: "inspect mode"
		},
		measure: {
			text: "Drag to measure",
			keys: ["alt", "shift"],
			hint: "text info"
		}
	};
	var renderContent = (mode, pressedKeys = []) => {
		const frag = document.createDocumentFragment();
		const { text, keys, hint } = CONTENT[mode];
		const span = document.createElement("span");
		span.textContent = text;
		frag.appendChild(span);
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
	var UIAnnotator = class extends HTMLElement {
		shadow;
		annotations = [];
		active = false;
		fabCorner;
		altHeld = false;
		shiftHeld = false;
		dragging = false;
		dragStart = null;
		lastMousePos = {
			x: 0,
			y: 0
		};
		measureRafId = null;
		highlightLocked = false;
		fab;
		overlay;
		inspector;
		markers;
		guideBar;
		activePopover = null;
		activePopoverAnnotationId = null;
		hoveredElement = null;
		handleMouseOver;
		handleMouseOut;
		handleClick;
		handleGlobalKeydown;
		handleKeydown;
		handleKeyup;
		handleWindowBlur;
		handleMouseMove;
		handleMouseDown;
		handleMouseUp;
		constructor() {
			super();
			this.shadow = this.attachShadow({ mode: "closed" });
			const style = document.createElement("style");
			style.textContent = styles;
			this.shadow.appendChild(style);
			this.annotations = loadSession();
			this.fabCorner = loadFabCorner();
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
				onCornerChange: (c) => {
					this.fabCorner = c;
					saveFabCorner(c);
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
			this.handleMouseOver = (e) => {
				if (this.isOwnElement(e)) return;
				const target = e.target;
				this.hoveredElement = target;
				if (!this.altHeld) this.overlay.show(target);
			};
			this.handleMouseOut = () => {
				this.hoveredElement = null;
				if (!this.altHeld) this.overlay.hide();
			};
			this.handleClick = (e) => {
				if (this.isOwnElement(e)) return;
				e.preventDefault();
				e.stopImmediatePropagation();
				if (this.altHeld) return;
				const target = this.hoveredElement;
				if (!target) return;
				this.overlay.hide();
				const existing = this.annotations.find((a) => {
					try {
						return document.querySelector(a.selector) === target;
					} catch {
						return false;
					}
				});
				if (existing) {
					const markerRect = this.markers.getMarkerRect(existing.id);
					this.openEditPopover(existing, markerRect);
				} else {
					const markerRect = this.markers.showPreview(target);
					this.openPopover(target, markerRect);
				}
			};
			this.handleGlobalKeydown = (e) => {
				if (e.key === "A" && e.ctrlKey && e.shiftKey) {
					e.preventDefault();
					this.toggle();
				}
				if (e.key === "Escape" && this.active && !this.activePopover) this.deactivate();
			};
			this.handleKeydown = (e) => {
				if (e.key === "Alt") {
					if (this.altHeld) return;
					this.altHeld = true;
					this.overlay.hide();
					document.body.style.cursor = "crosshair";
					this.guideBar.show("measure", ["alt"]);
					this.scheduleMeasureUpdate();
				}
				if (e.key === "Shift") {
					this.shiftHeld = true;
					if (this.altHeld) this.guideBar.updateKeys(["alt", "shift"]);
					if (this.altHeld && !this.dragging && !this.highlightLocked) this.scheduleMeasureUpdate();
				}
			};
			this.handleKeyup = (e) => {
				if (e.key === "Alt") this.exitMeasureMode();
				if (e.key === "Shift") {
					this.shiftHeld = false;
					if (this.altHeld) this.guideBar.updateKeys(["alt"]);
					if (this.altHeld && !this.dragging && !this.highlightLocked) this.scheduleMeasureUpdate();
				}
			};
			this.handleWindowBlur = () => {
				if (this.altHeld) this.exitMeasureMode();
			};
			this.handleMouseMove = (e) => {
				this.lastMousePos = {
					x: e.clientX,
					y: e.clientY
				};
				if (!this.altHeld) return;
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
		exitMeasureMode() {
			this.altHeld = false;
			this.shiftHeld = false;
			this.dragging = false;
			this.dragStart = null;
			this.highlightLocked = false;
			document.body.style.cursor = "";
			this.inspector.hide();
			if (this.active) this.guideBar.show("annotate");
			if (this.measureRafId !== null) {
				cancelAnimationFrame(this.measureRafId);
				this.measureRafId = null;
			}
			if (this.hoveredElement) this.overlay.show(this.hoveredElement);
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
		connectedCallback() {
			document.addEventListener("keydown", this.handleGlobalKeydown);
		}
		disconnectedCallback() {
			this.deactivate();
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
			document.addEventListener("mouseover", this.handleMouseOver, true);
			document.addEventListener("mouseout", this.handleMouseOut, true);
			document.addEventListener("click", this.handleClick, true);
			document.addEventListener("keydown", this.handleKeydown);
			document.addEventListener("keyup", this.handleKeyup);
			document.addEventListener("mousemove", this.handleMouseMove, true);
			document.addEventListener("mousedown", this.handleMouseDown, true);
			document.addEventListener("mouseup", this.handleMouseUp, true);
			window.addEventListener("blur", this.handleWindowBlur);
		}
		deactivate() {
			this.active = false;
			this.fab.setActive(false);
			this.markers.setActive(false);
			this.guideBar.hide();
			if (this.altHeld) this.exitMeasureMode();
			document.removeEventListener("mouseover", this.handleMouseOver, true);
			document.removeEventListener("mouseout", this.handleMouseOut, true);
			document.removeEventListener("click", this.handleClick, true);
			document.removeEventListener("keydown", this.handleKeydown);
			document.removeEventListener("keyup", this.handleKeyup);
			document.removeEventListener("mousemove", this.handleMouseMove, true);
			document.removeEventListener("mousedown", this.handleMouseDown, true);
			document.removeEventListener("mouseup", this.handleMouseUp, true);
			window.removeEventListener("blur", this.handleWindowBlur);
			this.overlay.hide();
			this.inspector.hide();
			this.hoveredElement = null;
			this.closePopover();
			if (this.measureRafId !== null) {
				cancelAnimationFrame(this.measureRafId);
				this.measureRafId = null;
			}
		}
		isOwnElement(e) {
			return e.composedPath().some((el) => el === this || el === this.shadow);
		}
		openPopover(element, anchorRect) {
			this.closePopover();
			const selector = generateSelector(element);
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
					const annotation = {
						id: crypto.randomUUID(),
						selector,
						path,
						comment,
						styles: computedStyles,
						rect: {
							x: rect.x,
							y: rect.y,
							w: rect.width,
							h: rect.height
						},
						createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
			const target = document.querySelector(annotation.selector);
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
