import type { StyleEdit } from '../types.ts';
import { remFromPx } from './styles.ts';

// Drag to adjust: arm a property with its key, then press, drag and release anywhere on the page.
// Everything here is pure except the computed-style readers at the bottom.

export type AdjustProperty = 'padding' | 'margin' | 'gap' | 'font-size' | 'line-height' | 'border-radius';
type Kind = 'sides' | 'corners' | 'gap' | 'value';
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
export type GapAxis = 'row' | 'column';
/** What one drag can change: a side, a corner, one of the two gaps, or the single value of F / L */
export type Part = Side | Corner | GapAxis | 'value';
export type Values = Partial<Record<Part, number>>;
export type Change = { from: number; to: number };
type Rect = { left: number; top: number; width: number; height: number };

/** `perUnit` is pointer travel in px per px (per 1 for line-height); `step` the value's resolution */
export const ADJUST: Record<AdjustProperty, { key: string; title: string; kind: Kind; perUnit: number; min: number; step: number }> = {
  padding: { key: 'P', title: 'Padding', kind: 'sides', perUnit: 2, min: 0, step: 1 },
  margin: { key: 'M', title: 'Margin', kind: 'sides', perUnit: 2, min: -Infinity, step: 1 },
  gap: { key: 'G', title: 'Gap', kind: 'gap', perUnit: 2, min: 0, step: 1 },
  'font-size': { key: 'F', title: 'Font size', kind: 'value', perUnit: 4, min: 1, step: 1 },
  // 0.01 per 2px of travel
  'line-height': { key: 'L', title: 'Line height', kind: 'value', perUnit: 200, min: 0.5, step: 0.05 },
  'border-radius': { key: 'B', title: 'Border radius', kind: 'corners', perUnit: 2, min: 0, step: 1 },
};

export const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
export const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const OPPOSITE: Record<Side, Side> = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
/** Travel below this is hand jitter */
const DEAD_ZONE = 3;
/** Travel that decides a grid gap's axis */
const AXIS_THRESHOLD = 6;

export const adjustPropertyFor = (key: string): AdjustProperty | null => {
  if (key.length !== 1) return null;
  const upper = key.toUpperCase();
  return (Object.keys(ADJUST) as AdjustProperty[]).find(p => ADJUST[p].key === upper) ?? null;
};

export const kindOf = (prop: AdjustProperty): Kind => ADJUST[prop].kind;

export const partsOf = (prop: AdjustProperty): Part[] => {
  const kind = kindOf(prop);
  return kind === 'sides' ? SIDES : kind === 'corners' ? CORNERS : kind === 'gap' ? ['row', 'column'] : ['value'];
};

export const longhandOf = (prop: AdjustProperty, part: Part): string =>
  part === 'value' ? prop
    : prop === 'gap' ? `${part}-gap`
    : prop === 'border-radius' ? `border-${part}-radius`
    : `${prop}-${part}`;

const unitless = (prop: AdjustProperty | null) => prop === 'line-height';

// ── Which parts a drag changes ──

export const nearestSide = (r: Rect, x: number, y: number): Side => {
  const distance: Record<Side, number> = {
    top: Math.abs(y - r.top),
    right: Math.abs(x - (r.left + r.width)),
    bottom: Math.abs(y - (r.top + r.height)),
    left: Math.abs(x - r.left),
  };
  return SIDES.reduce((best, s) => distance[s] < distance[best] ? s : best);
};

export const nearestCorner = (r: Rect, x: number, y: number): Corner =>
  `${y < r.top + r.height / 2 ? 'top' : 'bottom'}-${x < r.left + r.width / 2 ? 'left' : 'right'}` as Corner;

export type PickContext = {
  /** The target's border box and the pointer, both at press time */
  rect: Rect;
  x: number;
  y: number;
  alt: boolean;
  shift: boolean;
  /** A flex container's main-axis gap; absent for grid */
  flexAxis?: GapAxis | null;
  /** A grid gap follows the first drag direction */
  dragAxis?: 'x' | 'y' | null;
};

/**
 * Webflow's modifiers. Sides: the nearest one, Alt = it and its opposite, Shift = all four.
 * Corners: the nearest by quadrant, Alt = both on the nearest side, Shift = all four.
 * Gap: a flex container's main axis or a grid's drag axis, Shift = both. `anchor` is the grabbed part.
 */
export const pickParts = (prop: AdjustProperty, c: PickContext): { parts: Part[]; anchor: Part | null } => {
  const kind = kindOf(prop);
  if (kind === 'value') return { parts: ['value'], anchor: 'value' };
  if (kind === 'gap') {
    if (c.shift) return { parts: ['row', 'column'], anchor: null };
    if (c.flexAxis) return { parts: [c.flexAxis], anchor: null };
    return { parts: c.dragAxis ? [c.dragAxis === 'x' ? 'column' : 'row'] : [], anchor: null };
  }
  if (kind === 'corners') {
    const corner = nearestCorner(c.rect, c.x, c.y);
    if (c.shift) return { parts: CORNERS, anchor: corner };
    if (c.alt) {
      const side = nearestSide(c.rect, c.x, c.y);
      return { parts: CORNERS.filter(k => k.split('-').includes(side)), anchor: corner };
    }
    return { parts: [corner], anchor: corner };
  }
  const side = nearestSide(c.rect, c.x, c.y);
  return { parts: c.shift ? SIDES : c.alt ? [side, OPPOSITE[side]] : [side], anchor: side };
};

export const dragAxisOf = (dx: number, dy: number): 'x' | 'y' | null =>
  Math.hypot(dx, dy) < AXIS_THRESHOLD ? null : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';

/** Signed travel where positive is more: pull a side outward, push a corner toward the middle, → or ↑ for single values */
export const dragTravel = (prop: AdjustProperty, parts: Part[], anchor: Part | null, dx: number, dy: number): number => {
  const kind = kindOf(prop);
  if (kind === 'value') return dx - dy;
  if (kind === 'gap') {
    if (parts.length === 1) return parts[0] === 'column' ? dx : dy;
    return Math.abs(dx) >= Math.abs(dy) ? dx : dy;
  }
  if (!anchor) return 0;
  if (kind === 'corners') return (anchor.endsWith('left') ? dx : -dx) + (anchor.startsWith('top') ? dy : -dy);
  return { top: -dy, right: dx, bottom: dy, left: -dx }[anchor as Side];
};

export const adjustValue = (prop: AdjustProperty, start: number, travel: number): number => {
  if (Math.abs(travel) < DEAD_ZONE) return start;
  const { perUnit, min, step } = ADJUST[prop];
  const raw = Math.max(min, start + travel / perUnit);
  return +(Math.round(raw / step) * step).toFixed(3);
};

// ── Declarations ──

/** padding-inline → padding, row-gap → gap, border-top-left-radius → border-radius */
export const propertyOfDeclaration = (name: string): AdjustProperty | null => {
  if (name.startsWith('padding')) return 'padding';
  if (name.startsWith('margin')) return 'margin';
  if (name === 'gap' || name === 'row-gap' || name === 'column-gap') return 'gap';
  if (name.startsWith('border') && name.endsWith('radius')) return 'border-radius';
  if (name === 'font-size' || name === 'line-height') return name;
  return null;
};

/** The physical longhands a declaration sets: padding → four sides, padding-inline → left and right */
export const longhandsOfDeclaration = (name: string): string[] => {
  const prop = propertyOfDeclaration(name);
  if (!prop) return [name];
  if (name === prop) return partsOf(prop).map(p => longhandOf(prop, p));
  if (name.endsWith('-inline')) return [`${prop}-left`, `${prop}-right`];
  if (name.endsWith('-block')) return [`${prop}-top`, `${prop}-bottom`];
  return [name];
};

const same = (a: Change, b: Change) => Math.abs(a.from - b.from) < 1e-6 && Math.abs(a.to - b.to) < 1e-6;
const changed = (c: Change) => Math.abs(c.from - c.to) >= 1e-6;

/** Groups the given parts into the shortest declarations; parts sharing `from` and `to` merge */
const group = (prop: AdjustProperty, changes: Partial<Record<Part, Change>>): StyleEdit[] => {
  const edit = (property: string, c: Change): StyleEdit => ({ property, from: c.from, to: c.to });
  const all = partsOf(prop);
  const covers = (parts: Part[]) => parts.every(p => changes[p] && same(changes[p]!, changes[parts[0]]!));
  if (covers(all)) return [edit(prop, changes[all[0]]!)];
  const rest = all.filter(p => changes[p]);
  const out: StyleEdit[] = [];
  if (kindOf(prop) === 'sides') {
    for (const [suffix, pair] of [['block', ['top', 'bottom']], ['inline', ['left', 'right']]] as const) {
      if (!covers([...pair])) continue;
      out.push(edit(`${prop}-${suffix}`, changes[pair[0]]!));
      for (const p of pair) rest.splice(rest.indexOf(p), 1);
    }
  }
  for (const p of rest) out.push(edit(longhandOf(prop, p), changes[p]!));
  return out;
};

const partOfLonghand = (prop: AdjustProperty, longhand: string): Part | undefined =>
  partsOf(prop).find(p => longhandOf(prop, p) === longhand);

/**
 * Shortest declarations for changed longhands: all four sides equal → `padding`, left and right →
 * `padding-inline`, top and bottom → `padding-block`, else single sides. Likewise `gap` and `border-radius`.
 */
export const shortestEdits = (prop: AdjustProperty, longhands: Record<string, Change>): StyleEdit[] => {
  const changes: Partial<Record<Part, Change>> = {};
  for (const [name, c] of Object.entries(longhands)) {
    const part = partOfLonghand(prop, name);
    if (part && changed(c)) changes[part] = c;
  }
  return group(prop, changes);
};

/** The longhands behind a property's edits, each with its original `from` */
const editLonghands = (edits: StyleEdit[], prop: AdjustProperty): Record<string, Change> => {
  const out: Record<string, Change> = {};
  for (const e of edits) {
    if (propertyOfDeclaration(e.property) !== prop) continue;
    for (const name of longhandsOfDeclaration(e.property)) out[name] = { from: e.from, to: e.to };
  }
  return out;
};

/**
 * Folds a drag's longhand changes into an annotation's edits. Longhands already edited keep their
 * original `from`; one back at its original value drops out. The property's edits are re-derived
 * in their shortest form, where the property's first edit was.
 */
export const mergeEdits = (edits: StyleEdit[], prop: AdjustProperty, changes: Record<string, Change>): StyleEdit[] => {
  const existing = editLonghands(edits, prop);
  const merged = { ...existing };
  for (const [name, c] of Object.entries(changes)) merged[name] = { from: existing[name]?.from ?? c.from, to: c.to };
  const at = edits.findIndex(e => propertyOfDeclaration(e.property) === prop);
  const others = edits.filter(e => propertyOfDeclaration(e.property) !== prop);
  others.splice(at === -1 ? others.length : at, 0, ...shortestEdits(prop, merged));
  return others;
};

/** CSS value for a longhand: whole px, line-height unitless */
const cssValue = (prop: AdjustProperty | null, v: number) =>
  unitless(prop) ? String(+v.toFixed(3)) : `${+v.toFixed(2)}px`;

/** Inline declarations for a list of edits, later edits winning */
export const editDeclarations = (edits: StyleEdit[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const e of edits) {
    for (const name of longhandsOfDeclaration(e.property)) out[name] = cssValue(propertyOfDeclaration(e.property), e.to);
  }
  return out;
};

// ── Comment lines ──

/** `padding-right: 24px → 34px (2.125rem)`, `line-height: 1.55 → 1.6`; snapped: `(2rem, pr-8)` or `(var(--space-6))` */
export const formatEditLine = (e: StyleEdit): string => {
  const prop = propertyOfDeclaration(e.property);
  const notes = e.token ? [e.token] : [...(unitless(prop) ? [] : [remFromPx(e.to)]), ...(e.className ? [e.className] : [])];
  return `${e.property}: ${cssValue(prop, e.from)} → ${cssValue(prop, e.to)}${notes.length ? ` (${notes.join(', ')})` : ''}`;
};

/** The property a comment line starts with (`padding-right: …`), if any */
const lineProperty = (line: string): string | null => line.trimStart().match(/^([a-z-]+)\s*:/)?.[1] ?? null;

/**
 * Brings an annotation's comment in line with its edits: a changed edit replaces its line (matched by
 * `property:` at the line start), a new one appends, a removed one drops its line. User text stays.
 */
export const syncEditLines = (comment: string, before: StyleEdit[], after: StyleEdit[]): string => {
  const kept = new Set(after.map(e => e.property));
  const lines = (comment ? comment.split('\n') : []).filter(line => {
    const name = lineProperty(line);
    return !name || kept.has(name) || !before.some(e => e.property === name);
  });
  for (const e of after) {
    const prev = before.find(b => b.property === e.property);
    if (prev && same(prev, e) && prev.className === e.className && prev.token === e.token) continue;
    const i = lines.findIndex(line => lineProperty(line) === e.property);
    if (i === -1) lines.push(formatEditLine(e));
    else lines[i] = formatEditLine(e);
  }
  return lines.join('\n');
};

/** Edits whose line the user kept in the comment; deleting a line drops its edit */
export const editsInComment = (edits: StyleEdit[], comment: string): StyleEdit[] => {
  const names = new Set(comment.split('\n').map(lineProperty));
  return edits.filter(e => names.has(e.property));
};

// ── HUD text ──

const formatValue = (prop: AdjustProperty, v: number) => cssValue(prop, v);

/** Current values shortened like CSS shorthand: `24px`, `16px 24px`, … */
export const shorthandValue = (prop: AdjustProperty, values: Values): string => {
  const v = partsOf(prop).map(p => values[p] ?? 0);
  // Drop each trailing value its counterpart implies: left = right, bottom = top, right = top
  const implied = [0, 0, 0, 1];
  while (v.length > 1 && v[v.length - 1] === v[implied[v.length - 1]]) v.pop();
  return v.map(x => formatValue(prop, x)).join(' ');
};

/**
 * One HUD row for a drag: the declaration's name, the new value and the signed delta at the grabbed part.
 * Several declarations at once collapse to the shorthand's name (`border-radius (right)` for a corner pair).
 * Before the pointer moves it names what will change and has no delta.
 */
export const dragReadout = (prop: AdjustProperty, parts: Part[], anchor: Part | null, start: Values, cur: Values) => {
  const lead = anchor ?? parts[0];
  const changes: Partial<Record<Part, Change>> = {};
  for (const p of parts) changes[p] = { from: start[p] ?? 0, to: cur[p] ?? 0 };
  const moved = parts.filter(p => changed(changes[p]!));
  const decls = group(prop, moved.length ? Object.fromEntries(moved.map(p => [p, changes[p]])) : changes);
  let name: string = prop;
  if (decls.length === 1) name = decls[0].property;
  else if (kindOf(prop) === 'corners' && parts.length === 2) {
    name = `${prop} (${SIDES.find(s => parts.every(p => p.split('-').includes(s)))})`;
  }
  const from = start[lead] ?? 0;
  const to = cur[lead] ?? 0;
  const d = to - from;
  const delta = Math.abs(d) < 1e-6 ? '' : `${d > 0 ? '+' : '−'}${formatValue(prop, Math.abs(d))}`;
  return { name, value: formatValue(prop, to), delta };
};

/** Characters in the longest name a property's readout can show, so the cell never resizes mid-drag */
export const nameWidth = (prop: AdjustProperty): number => {
  const kind = kindOf(prop);
  const names = kind === 'value' ? [prop]
    : kind === 'gap' ? ['gap', 'row-gap', 'column-gap']
    : kind === 'corners' ? [prop, ...CORNERS.map(c => longhandOf(prop, c)), ...SIDES.map(s => `${prop} (${s})`)]
    : [prop, `${prop}-inline`, `${prop}-block`, ...SIDES.map(s => longhandOf(prop, s))];
  return Math.max(...names.map(n => n.length));
};

const HORIZONTAL = new Set<Part>(['left', 'right', 'column']);
const VERTICAL = new Set<Part>(['top', 'bottom', 'row']);

/** Resize cursors along the sides or gaps that will change; crosshair while armed otherwise */
export const cursorFor = (prop: AdjustProperty, parts: Part[], dragging = false): string => {
  const kind = kindOf(prop);
  if ((kind === 'sides' || kind === 'gap') && parts.length) {
    return parts.every(p => HORIZONTAL.has(p)) ? 'ew-resize' : parts.every(p => VERTICAL.has(p)) ? 'ns-resize' : 'move';
  }
  if (!dragging) return 'crosshair';
  return kind === 'value' ? 'ew-resize' : 'move';
};

// ── Reading the page ──

/** The property's current values on an element, in px (line-height as a ratio of the font size) */
export const readValues = (el: Element, prop: AdjustProperty): Values => {
  const cs = getComputedStyle(el);
  if (prop === 'line-height') {
    const fontSize = parseFloat(cs.fontSize) || 16;
    const lineHeight = cs.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(cs.lineHeight);
    return { value: Math.round(lineHeight / fontSize * 1000) / 1000 };
  }
  return Object.fromEntries(partsOf(prop).map(p => [p, parseFloat(cs.getPropertyValue(longhandOf(prop, p))) || 0]));
};

const isContainer = (el: Element) => /flex|grid/.test(getComputedStyle(el).display);

/** G adjusts the selection when it's a flex or grid container, else its closest ancestor that is one */
export const gapContainer = (el: Element, parentOf: (el: Element) => Element | null): Element | null => {
  for (let node: Element | null = el; node && node !== document.documentElement; node = parentOf(node)) {
    if (isContainer(node)) return node;
  }
  return null;
};

/** A flex container's main-axis gap; null for grid, whose gap follows the drag */
export const flexAxisOf = (el: Element): GapAxis | null => {
  const cs = getComputedStyle(el);
  if (!cs.display.includes('flex')) return null;
  return cs.flexDirection.startsWith('column') ? 'row' : 'column';
};
