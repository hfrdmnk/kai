import { styles } from './styles';
import iconKai from './icons/kai.svg?raw';
import iconClose from './icons/close.svg?raw';
import iconTrash from './icons/trash.svg?raw';
import iconCopy from './icons/copy.svg?raw';
import iconCheck from './icons/check.svg?raw';
import iconHelp from './icons/help.svg?raw';
import iconCursor from './icons/cursor.svg?raw';

// ── Helpers ────────────────────────────────────────

const domParser = new DOMParser();

/** Parse an SVG string and return a cloned SVGElement, optionally resized */
const parseSVG = (svg: string, size?: number): SVGElement => {
  const doc = domParser.parseFromString(svg, 'image/svg+xml');
  const el = document.importNode(doc.documentElement, true) as unknown as SVGElement;
  if (size) {
    el.setAttribute('width', String(size));
    el.setAttribute('height', String(size));
  }
  return el;
};

/** Insert a parsed SVG icon into a container */
const setIcon = (container: HTMLElement, svg: string, size?: number) => {
  container.appendChild(parseSVG(svg, size));
};

/** Override styles appended inside each shadow container to neutralise fixed positioning */
const overrideCSS = `
  :host {
    position: relative !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    z-index: auto !important;
  }
  .kai-fab, .kai-fab-actions, .kai-overlay, .kai-tooltip, .kai-popover,
  .kai-marker, .kai-marker-stack, .kai-stack-expanded, .kai-annotation-box,
  .kai-autocomplete, .kai-measure-line, .kai-measure-cross, .kai-measure-tooltip,
  .kai-measure-text-tooltip, .kai-measure-selection, .kai-measure-highlight,
  .kai-guide-bar {
    position: relative !important;
    z-index: auto !important;
  }
`;

/** Render one specimen into both the light and the dark pane of its section */
const mountSpecimen = (name: string, extraCSS: string, build: (shadow: ShadowRoot) => void) => {
  const panes = document.querySelectorAll<HTMLElement>(`[data-mount="${name}"] .pane`);
  for (const pane of panes) {
    const host = document.createElement('div');
    host.setAttribute('data-theme', pane.dataset.theme!);
    pane.querySelector('.specimen-mount')!.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles + overrideCSS + extraCSS;
    shadow.appendChild(style);

    build(shadow);
  }
};

const makeLabel = (text: string): HTMLElement => {
  const el = document.createElement('div');
  el.style.cssText = 'font-size:12px;font-family:var(--font-mono);color:var(--text-tertiary);margin-bottom:10px;margin-top:20px;';
  el.textContent = text;
  return el;
};

const makeRow = (...children: HTMLElement[]): HTMLElement => {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;';
  children.forEach(c => el.appendChild(c));
  return el;
};

const makeSpacer = (h = 24): HTMLElement => {
  const el = document.createElement('div');
  el.style.height = `${h}px`;
  return el;
};

// ── 1. Color Palette ───────────────────────────────

mountSpecimen('colors', '', (shadow) => {

  const makeSwatchGroup = (title: string, tokens: [string, string][]) => {
    shadow.appendChild(makeLabel(title));
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;';

    for (const [name, cssVar] of tokens) {
      const item = document.createElement('div');

      const swatch = document.createElement('div');
      swatch.style.cssText = `width:100%;height:48px;border-radius:var(--radius-sm);border:1px solid var(--border-3);background:var(${cssVar});`;
      item.appendChild(swatch);

      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:11px;font-family:var(--font-mono);color:var(--text-tertiary);margin-top:4px;';
      lbl.textContent = name;
      item.appendChild(lbl);

      grid.appendChild(item);
    }
    shadow.appendChild(grid);
  };

  makeSwatchGroup('Gray scale', [
    ['gray-50', '--gray-50'], ['gray-100', '--gray-100'], ['gray-200', '--gray-200'],
    ['gray-300', '--gray-300'], ['gray-400', '--gray-400'], ['gray-500', '--gray-500'],
    ['gray-600', '--gray-600'], ['gray-700', '--gray-700'], ['gray-800', '--gray-800'],
    ['gray-900', '--gray-900'], ['gray-950', '--gray-950'],
  ]);

  makeSwatchGroup('Accent & status', [
    ['accent', '--color-accent'], ['accent-hover', '--color-accent-hover'],
    ['danger', '--color-danger'], ['success', '--color-success'],
  ]);

  makeSwatchGroup('Backgrounds', [
    ['bg-1', '--bg-1'], ['bg-2', '--bg-2'], ['bg-3', '--bg-3'], ['bg-4', '--bg-4'],
  ]);

  makeSwatchGroup('Borders', [
    ['border-1', '--border-1'], ['border-2', '--border-2'], ['border-3', '--border-3'], ['border-4', '--border-4'],
  ]);

  makeSwatchGroup('Text', [
    ['text-primary', '--text-primary'], ['text-secondary', '--text-secondary'], ['text-tertiary', '--text-tertiary'],
  ]);

  makeSwatchGroup('Inverse', [
    ['inv-bg', '--inv-bg'], ['inv-text', '--inv-text'], ['inv-text-muted', '--inv-text-muted'],
  ]);
});

// ── 2. Typography ──────────────────────────────────

mountSpecimen('typography', '', (shadow) => {
  const sizes = [11, 12, 13, 14, 16];

  shadow.appendChild(makeLabel('--font-sans'));
  for (const s of sizes) {
    const el = document.createElement('div');
    el.style.cssText = `font-family:var(--font-sans);font-size:${s}px;color:var(--text-primary);margin-bottom:8px;`;
    el.textContent = `The quick brown fox jumps — ${s}px`;
    shadow.appendChild(el);
  }

  shadow.appendChild(makeSpacer());
  shadow.appendChild(makeLabel('--font-mono'));
  for (const s of sizes) {
    const el = document.createElement('div');
    el.style.cssText = `font-family:var(--font-mono);font-size:${s}px;color:var(--text-primary);margin-bottom:8px;`;
    el.textContent = `The quick brown fox jumps — ${s}px`;
    shadow.appendChild(el);
  }
});

// ── 3. Shadows ─────────────────────────────────────

mountSpecimen('shadows', '', (shadow) => {
  const shadowTokens = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;';

  for (const name of shadowTokens) {
    const box = document.createElement('div');
    box.style.cssText = `width:80px;height:80px;background:var(--bg-1);border-radius:var(--radius-md);box-shadow:var(--shadow-${name});display:flex;align-items:center;justify-content:center;`;

    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:11px;font-family:var(--font-mono);color:var(--text-tertiary);';
    lbl.textContent = name;
    box.appendChild(lbl);

    grid.appendChild(box);
  }

  shadow.appendChild(grid);
});

// ── 4. Icons ───────────────────────────────────────

mountSpecimen('icons', '', (shadow) => {
  const icons: [string, string][] = [
    ['kai', iconKai], ['close', iconClose], ['trash', iconTrash],
    ['copy', iconCopy], ['check', iconCheck], ['help', iconHelp],
    ['cursor', iconCursor],
  ];
  const sizes = [24, 16, 12];

  for (const sz of sizes) {
    shadow.appendChild(makeLabel(`${sz}px`));
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;align-items:center;gap:20px;';

    for (const [name, svg] of icons) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';

      const iconWrap = document.createElement('div');
      iconWrap.style.cssText = `color:var(--text-primary);width:${sz}px;height:${sz}px;`;
      setIcon(iconWrap, svg, sz);
      wrap.appendChild(iconWrap);

      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:10px;font-family:var(--font-mono);color:var(--text-tertiary);';
      lbl.textContent = name;
      wrap.appendChild(lbl);

      r.appendChild(wrap);
    }
    shadow.appendChild(r);
  }
});

// ── 5. Buttons ─────────────────────────────────────

mountSpecimen('buttons', '', (shadow) => {

  shadow.appendChild(makeLabel('Primary'));
  const primary = document.createElement('button');
  primary.className = 'kai-btn kai-btn--primary';
  primary.textContent = 'Add';

  const primaryHover = document.createElement('button');
  primaryHover.className = 'kai-btn kai-btn--primary';
  primaryHover.textContent = 'Add (hover)';
  primaryHover.style.background = 'var(--color-accent-hover)';

  shadow.appendChild(makeRow(primary, primaryHover));

  shadow.appendChild(makeLabel('Secondary'));
  const secondary = document.createElement('button');
  secondary.className = 'kai-btn kai-btn--secondary';
  secondary.textContent = 'Cancel';

  const secondaryHover = document.createElement('button');
  secondaryHover.className = 'kai-btn kai-btn--secondary';
  secondaryHover.textContent = 'Cancel (hover)';
  secondaryHover.style.background = 'var(--bg-4)';
  secondaryHover.style.color = 'var(--text-primary)';

  shadow.appendChild(makeRow(secondary, secondaryHover));

  shadow.appendChild(makeLabel('Icon button'));
  const iconBtn = document.createElement('button');
  iconBtn.className = 'kai-btn kai-btn--icon';
  setIcon(iconBtn, iconTrash, 16);

  const iconBtnHover = document.createElement('button');
  iconBtnHover.className = 'kai-btn kai-btn--icon';
  setIcon(iconBtnHover, iconTrash, 16);
  iconBtnHover.style.background = 'var(--bg-3)';
  iconBtnHover.style.color = 'var(--text-secondary)';

  shadow.appendChild(makeRow(iconBtn, iconBtnHover));

  shadow.appendChild(makeLabel('Delete confirmation'));
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'kai-btn kai-btn--danger';
  deleteBtn.textContent = 'Delete';

  const deleteSure = document.createElement('button');
  deleteSure.className = 'kai-btn kai-btn--danger';
  deleteSure.setAttribute('data-armed', '');
  deleteSure.textContent = 'Sure?';

  shadow.appendChild(makeRow(deleteBtn, deleteSure));
});

// ── 6. FAB ─────────────────────────────────────────

mountSpecimen('fab', `
    .kai-fab { position: relative !important; display: inline-flex !important; }
    .kai-fab[data-corner] { top: auto !important; bottom: auto !important; left: auto !important; right: auto !important; }
  `, (shadow) => {

  const corners: string[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

  shadow.appendChild(makeLabel('Corner variants'));
  const cornerRow = document.createElement('div');
  cornerRow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;';

  for (const corner of corners) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

    const fab = document.createElement('button');
    fab.className = 'kai-fab';
    fab.setAttribute('data-corner', corner);
    setIcon(fab, iconKai, 24);

    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:10px;font-family:var(--font-mono);color:var(--text-tertiary);';
    lbl.textContent = corner;

    wrap.appendChild(fab);
    wrap.appendChild(lbl);
    cornerRow.appendChild(wrap);
  }
  shadow.appendChild(cornerRow);

  shadow.appendChild(makeLabel('Active state'));
  const activeRow = document.createElement('div');
  activeRow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;';

  for (const corner of corners) {
    const fab = document.createElement('button');
    fab.className = 'kai-fab kai-fab--active';
    fab.setAttribute('data-corner', corner);
    setIcon(fab, iconKai, 24);
    activeRow.appendChild(fab);
  }
  shadow.appendChild(activeRow);

  shadow.appendChild(makeLabel('With badge'));
  const badgeRow = document.createElement('div');
  badgeRow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;';

  for (const corner of corners) {
    const fab = document.createElement('button');
    fab.className = 'kai-fab kai-fab--has-badge';
    fab.setAttribute('data-corner', corner);
    setIcon(fab, iconKai, 24);
    const badge = document.createElement('span');
    badge.className = 'kai-fab-badge';
    badge.textContent = '3';
    badge.style.display = 'flex';
    fab.appendChild(badge);
    badgeRow.appendChild(fab);
  }
  shadow.appendChild(badgeRow);

  shadow.appendChild(makeLabel('With badge — active'));
  const badgeActiveRow = document.createElement('div');
  badgeActiveRow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;';

  for (const corner of corners) {
    const fab = document.createElement('button');
    fab.className = 'kai-fab kai-fab--active kai-fab--has-badge';
    fab.setAttribute('data-corner', corner);
    setIcon(fab, iconKai, 24);
    const badge = document.createElement('span');
    badge.className = 'kai-fab-badge';
    badge.textContent = '3';
    badge.style.display = 'flex';
    fab.appendChild(badge);
    badgeActiveRow.appendChild(fab);
  }
  shadow.appendChild(badgeActiveRow);
});

// ── 7. FAB Actions ─────────────────────────────────

mountSpecimen('fab-actions', `
    .kai-fab-actions { position: relative !important; display: inline-flex !important; }
  `, (shadow) => {

  shadow.appendChild(makeLabel('Default'));
  const actions = document.createElement('div');
  actions.className = 'kai-fab-actions';
  actions.style.display = 'flex';

  const pickBtn = document.createElement('button');
  pickBtn.className = 'kai-fab-action';
  setIcon(pickBtn, iconCursor, 16);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'kai-fab-action';
  setIcon(copyBtn, iconCopy, 16);

  const trashBtn = document.createElement('button');
  trashBtn.className = 'kai-fab-action';
  setIcon(trashBtn, iconTrash, 16);

  actions.appendChild(pickBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(trashBtn);
  shadow.appendChild(actions);

  shadow.appendChild(makeLabel('Pick armed'));
  const actionsArmed = document.createElement('div');
  actionsArmed.className = 'kai-fab-actions';
  actionsArmed.style.display = 'flex';

  const pickArmed = document.createElement('button');
  pickArmed.className = 'kai-fab-action kai-fab-action--armed';
  setIcon(pickArmed, iconCursor, 16);

  actionsArmed.appendChild(pickArmed);
  shadow.appendChild(actionsArmed);

  shadow.appendChild(makeLabel('Hover state'));
  const actionsHover = document.createElement('div');
  actionsHover.className = 'kai-fab-actions';
  actionsHover.style.display = 'flex';

  const copyHover = document.createElement('button');
  copyHover.className = 'kai-fab-action';
  setIcon(copyHover, iconCopy, 16);
  copyHover.style.background = 'var(--bg-3)';
  copyHover.style.color = 'var(--text-primary)';

  const trashHover = document.createElement('button');
  trashHover.className = 'kai-fab-action';
  setIcon(trashHover, iconTrash, 16);

  actionsHover.appendChild(copyHover);
  actionsHover.appendChild(trashHover);
  shadow.appendChild(actionsHover);

  shadow.appendChild(makeLabel('Disabled'));
  const actionsDisabled = document.createElement('div');
  actionsDisabled.className = 'kai-fab-actions';
  actionsDisabled.style.display = 'flex';

  const copyDisabled = document.createElement('button');
  copyDisabled.className = 'kai-fab-action';
  setIcon(copyDisabled, iconCopy, 16);
  copyDisabled.disabled = true;

  const trashDisabled = document.createElement('button');
  trashDisabled.className = 'kai-fab-action';
  setIcon(trashDisabled, iconTrash, 16);
  trashDisabled.disabled = true;

  actionsDisabled.appendChild(copyDisabled);
  actionsDisabled.appendChild(trashDisabled);
  shadow.appendChild(actionsDisabled);
});

// ── 8. Tooltip ─────────────────────────────────────

mountSpecimen('tooltip', '', (shadow) => {

  const tip = document.createElement('div');
  tip.className = 'kai-tooltip';
  tip.style.display = 'inline-block';
  tip.textContent = 'div.container.active';
  shadow.appendChild(tip);
});

// ── 9. Overlay ─────────────────────────────────────

mountSpecimen('overlay', '', (shadow) => {

  const overlay = document.createElement('div');
  overlay.className = 'kai-overlay';
  overlay.style.display = 'block';
  overlay.style.width = '240px';
  overlay.style.height = '80px';
  shadow.appendChild(overlay);
});

// ── 10. Popover ────────────────────────────────────

mountSpecimen('popover', `
    .kai-popover { position: relative !important; display: flex !important; }
  `, (shadow) => {

  const makePopover = (mode: 'create' | 'edit' | 'delete-confirm') => {
    const popover = document.createElement('div');
    popover.className = 'kai-popover';
    popover.style.display = 'flex';

    const body = document.createElement('div');
    body.className = 'kai-popover-body';

    const path = document.createElement('div');
    path.className = 'kai-popover-path';
    path.textContent = 'body › main.content › div.card › h2.title';
    body.appendChild(path);

    const textarea = document.createElement('textarea');
    textarea.className = 'kai-popover-textarea';
    textarea.placeholder = 'What should change?';
    if (mode === 'edit' || mode === 'delete-confirm') {
      textarea.value = 'Increase font-size to 16px and use --font-mono';
    }
    body.appendChild(textarea);

    popover.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'kai-popover-footer';

    if (mode === 'create') {
      const cancel = document.createElement('button');
      cancel.className = 'kai-btn kai-btn--secondary';
      cancel.textContent = 'Cancel';
      footer.appendChild(cancel);

      const add = document.createElement('button');
      add.className = 'kai-btn kai-btn--primary';
      add.textContent = 'Add';
      footer.appendChild(add);
    } else {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'kai-btn kai-btn--danger';
      if (mode === 'delete-confirm') {
        deleteBtn.textContent = 'Sure?';
        deleteBtn.setAttribute('data-armed', '');
      } else {
        deleteBtn.textContent = 'Delete';
      }
      footer.appendChild(deleteBtn);

      const spacerEl = document.createElement('div');
      spacerEl.style.flex = '1';
      footer.appendChild(spacerEl);

      const cancel = document.createElement('button');
      cancel.className = 'kai-btn kai-btn--secondary';
      cancel.textContent = 'Cancel';
      footer.appendChild(cancel);

      const save = document.createElement('button');
      save.className = 'kai-btn kai-btn--primary';
      save.textContent = 'Save';
      footer.appendChild(save);
    }

    popover.appendChild(footer);
    return popover;
  };

  shadow.appendChild(makeLabel('Create mode'));
  shadow.appendChild(makePopover('create'));

  shadow.appendChild(makeLabel('Edit mode'));
  shadow.appendChild(makePopover('edit'));

  shadow.appendChild(makeLabel('Delete confirmation'));
  shadow.appendChild(makePopover('delete-confirm'));
});

// ── 11. Markers ────────────────────────────────────

mountSpecimen('markers', `
    .kai-marker, .kai-marker-stack { position: relative !important; display: inline-flex !important; }
  `, (shadow) => {

  const addMarkerIcon = (el: HTMLElement) => {
    const svg = parseSVG(iconKai, 12);
    svg.setAttribute('stroke-width', '2.5');
    el.appendChild(svg);
  };

  shadow.appendChild(makeLabel('Single — active'));
  const active = document.createElement('div');
  active.className = 'kai-marker';
  addMarkerIcon(active);
  shadow.appendChild(active);

  shadow.appendChild(makeLabel('Single — inactive'));
  const inactive = document.createElement('div');
  inactive.className = 'kai-marker kai-marker--inactive';
  addMarkerIcon(inactive);
  shadow.appendChild(inactive);

  shadow.appendChild(makeLabel('Stack — active with badge'));
  const stackActive = document.createElement('div');
  stackActive.className = 'kai-marker-stack kai-marker-stack--has-badge';
  addMarkerIcon(stackActive);
  const badge = document.createElement('span');
  badge.className = 'kai-marker-stack-badge';
  badge.textContent = '3';
  stackActive.appendChild(badge);
  shadow.appendChild(stackActive);

  shadow.appendChild(makeLabel('Stack — inactive with badge'));
  const stackInactive = document.createElement('div');
  stackInactive.className = 'kai-marker-stack kai-marker-stack--has-badge kai-marker-stack--inactive';
  addMarkerIcon(stackInactive);
  const badge2 = document.createElement('span');
  badge2.className = 'kai-marker-stack-badge';
  badge2.textContent = '3';
  stackInactive.appendChild(badge2);
  shadow.appendChild(stackInactive);
});

// ── 12. Stack Expanded ─────────────────────────────

mountSpecimen('stack-expanded', `
    .kai-stack-expanded { position: relative !important; display: inline-flex !important; }
  `, (shadow) => {

  const container = document.createElement('div');
  container.className = 'kai-stack-expanded';
  container.style.display = 'flex';

  for (let i = 0; i < 3; i++) {
    const btn = document.createElement('button');
    btn.className = 'kai-stack-expanded-marker';
    const svg = parseSVG(iconKai, 12);
    svg.setAttribute('stroke-width', '2.5');
    btn.appendChild(svg);
    container.appendChild(btn);
  }

  shadow.appendChild(container);
});

// ── 13. Annotation Box ─────────────────────────────

mountSpecimen('annotation-box', '', (shadow) => {

  const box = document.createElement('div');
  box.className = 'kai-annotation-box';
  box.style.display = 'block';
  box.style.width = '240px';
  box.style.height = '80px';
  shadow.appendChild(box);
});

// ── 14. Autocomplete ───────────────────────────────

mountSpecimen('autocomplete', `
    .kai-autocomplete { position: relative !important; display: block !important; }
  `, (shadow) => {

  shadow.appendChild(makeLabel('CSS variable items'));
  const dropdown = document.createElement('div');
  dropdown.className = 'kai-autocomplete';
  dropdown.style.display = 'block';

  const vars: [string, string, string | null][] = [
    ['--color-accent', 'oklch(0.69 0.25 38.8)', 'oklch(0.69 0.25 38.8)'],
    ['--color-danger', 'oklch(0.63 0.25 24.2)', 'oklch(0.63 0.25 24.2)'],
    ['--gray-200', 'oklch(92.2% 0 0)', 'oklch(92.2% 0 0)'],
    ['--font-sans', '-apple-system, …', null],
  ];

  for (const [name, value, color] of vars) {
    const item = document.createElement('div');
    item.className = 'kai-autocomplete-item';

    if (color) {
      const swatch = document.createElement('span');
      swatch.className = 'kai-autocomplete-swatch';
      swatch.style.background = color;
      item.appendChild(swatch);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'kai-autocomplete-item-name';
    nameEl.textContent = name;
    item.appendChild(nameEl);

    const valEl = document.createElement('span');
    valEl.className = 'kai-autocomplete-item-value';
    valEl.textContent = value;
    item.appendChild(valEl);

    dropdown.appendChild(item);
  }
  shadow.appendChild(dropdown);

  shadow.appendChild(makeLabel('px → rem conversion'));
  const remDropdown = document.createElement('div');
  remDropdown.className = 'kai-autocomplete';
  remDropdown.style.display = 'block';

  const remItem = document.createElement('div');
  remItem.className = 'kai-autocomplete-rem';
  remItem.textContent = '→ 1rem';
  remDropdown.appendChild(remItem);
  shadow.appendChild(remDropdown);
});

// ── 15. Measurement Tools ──────────────────────────

mountSpecimen('measure', `
    .kai-measure-line, .kai-measure-cross, .kai-measure-tooltip,
    .kai-measure-text-tooltip, .kai-measure-selection, .kai-measure-highlight {
      position: relative !important;
    }
  `, (shadow) => {

  // Crosshair demo
  shadow.appendChild(makeLabel('Crosshair lines'));
  const crosshairWrap = document.createElement('div');
  crosshairWrap.style.cssText = 'position:relative;width:300px;height:200px;background:var(--bg-2);border-radius:var(--radius-md);overflow:hidden;';

  const lineV = document.createElement('div');
  lineV.className = 'kai-measure-line kai-measure-line--v';
  lineV.style.cssText = 'display:block;position:absolute !important;left:150px;top:0;height:200px;';
  crosshairWrap.appendChild(lineV);

  const lineH = document.createElement('div');
  lineH.className = 'kai-measure-line kai-measure-line--h';
  lineH.style.cssText = 'display:block;position:absolute !important;left:0;top:100px;width:300px;';
  crosshairWrap.appendChild(lineH);

  const cross = document.createElement('div');
  cross.className = 'kai-measure-cross';
  cross.style.cssText = 'display:block;position:absolute !important;left:150px;top:100px;';
  crosshairWrap.appendChild(cross);

  shadow.appendChild(crosshairWrap);

  // Measurement tooltip
  shadow.appendChild(makeLabel('Measurement tooltip'));
  const mTooltip = document.createElement('div');
  mTooltip.className = 'kai-measure-tooltip';
  mTooltip.style.display = 'inline-block';
  mTooltip.textContent = '320×48 px';
  shadow.appendChild(mTooltip);

  // Text inspection tooltip
  shadow.appendChild(makeLabel('Text inspection tooltip'));
  const textTip = document.createElement('div');
  textTip.className = 'kai-measure-text-tooltip';
  textTip.style.cssText = 'display:block;max-width:280px;';

  const entries: [string, string][] = [
    ['Font', '-apple-system'],
    ['Size', '16px (1rem)'],
    ['Weight', '600'],
    ['Line', '24px (1.5)'],
    ['Color', 'oklch(21% 0.03 264)'],
    ['Track', 'normal'],
  ];
  entries.forEach(([lbl, val], i) => {
    if (i > 0) textTip.appendChild(document.createTextNode('\n'));
    const span = document.createElement('span');
    span.className = 'kai-tt-label';
    span.textContent = lbl;
    textTip.appendChild(span);
    textTip.appendChild(document.createTextNode(val));
  });
  shadow.appendChild(textTip);

  // Selection box
  shadow.appendChild(makeLabel('Selection box (drag area)'));
  const sel = document.createElement('div');
  sel.className = 'kai-measure-selection';
  sel.style.cssText = 'display:block;width:200px;height:60px;';
  shadow.appendChild(sel);

  // Highlight box
  shadow.appendChild(makeLabel('Highlight box'));
  const hl = document.createElement('div');
  hl.className = 'kai-measure-highlight';
  hl.style.cssText = 'display:block;width:200px;height:60px;';
  shadow.appendChild(hl);
});

// ── 16. Guide Bar ──────────────────────────────────

mountSpecimen('guide-bar', `
    .kai-guide-bar {
      position: relative !important;
      top: auto !important;
      left: auto !important;
      transform: none !important;
      display: inline-flex !important;
    }
  `, (shadow) => {

  const makeGuideBar = (text: string, keys: [string, boolean][], hint: string) => {
    const bar = document.createElement('div');
    bar.className = 'kai-guide-bar';
    bar.style.display = 'inline-flex';

    const content = document.createElement('div');
    content.className = 'kai-guide-bar-content';

    const span = document.createElement('span');
    span.textContent = text;
    content.appendChild(span);

    const sep = document.createElement('span');
    sep.className = 'kai-guide-bar-sep';
    sep.textContent = '·';
    content.appendChild(sep);

    for (const [keyLabel, pressed] of keys) {
      const kbd = document.createElement('span');
      kbd.className = 'kai-guide-bar-kbd';
      if (pressed) kbd.setAttribute('data-pressed', '');
      kbd.textContent = keyLabel;
      content.appendChild(kbd);
    }

    const hintEl = document.createElement('span');
    hintEl.className = 'kai-guide-bar-hint';
    hintEl.textContent = hint;
    content.appendChild(hintEl);

    bar.appendChild(content);
    return bar;
  };

  shadow.appendChild(makeLabel('Annotate mode'));
  shadow.appendChild(makeGuideBar('Click elements to annotate', [['⌥', false]], 'inspect mode'));

  shadow.appendChild(makeSpacer(16));
  shadow.appendChild(makeLabel('Measure mode'));
  shadow.appendChild(makeGuideBar('Drag to measure', [['⌥', false], ['⇧', false]], 'text info'));

  shadow.appendChild(makeSpacer(16));
  shadow.appendChild(makeLabel('With pressed key'));
  shadow.appendChild(makeGuideBar('Click elements to annotate', [['⌥', true]], 'inspect mode'));
});
