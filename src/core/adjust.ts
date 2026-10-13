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
/** A value on the project's scale: a utility class's suffix (`8` of `pr-8`, `''` of bare `rounded`) or a CSS variable */
export type ScaleRef = { suffix: string } | { token: string };
/** One longhand's change; `ref` when it was snapped to the scale */
export type Change = { from: number; to: number; ref?: ScaleRef };
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

/** The side whose edge (the segment, not its infinite line) is closest to the point */
export const nearestSide = (r: Rect, x: number, y: number): Side => {
  const right = r.left + r.width;
  const bottom = r.top + r.height;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const cx = clamp(x, r.left, right);
  const cy = clamp(y, r.top, bottom);
  const distance: Record<Side, number> = {
    top: Math.hypot(x - cx, y - r.top),
    right: Math.hypot(x - right, y - cy),
    bottom: Math.hypot(x - cx, y - bottom),
    left: Math.hypot(x - r.left, y - cy),
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

/** One ←/→ step without a scale: to the next whole px (0.05 of line height) in that direction */
export const nudgeValue = (prop: AdjustProperty, start: number, dir: 1 | -1): number => {
  const { min, step } = ADJUST[prop];
  const steps = start / step;
  const next = dir > 0 ? Math.floor(steps + 1e-6) + 1 : Math.ceil(steps - 1e-6) - 1;
  return +Math.max(min, next * step).toFixed(3);
};

export const adjustValue = (prop: AdjustProperty, start: number, travel: number): number => {
  if (Math.abs(travel) < DEAD_ZONE) return start;
  const { perUnit, min, step } = ADJUST[prop];
  const raw = Math.max(min, start + travel / perUnit);
  return +(Math.round(raw / step) * step).toFixed(3);
};

// ── Declarations ──

/** Utility class prefix per declaration, Tailwind's naming: `pr-8`, `px-4`, `gap-y-2`, `rounded-tl-lg` */
const CLASS_PREFIX: Record<string, string> = {
  padding: 'p', 'padding-inline': 'px', 'padding-block': 'py',
  'padding-top': 'pt', 'padding-right': 'pr', 'padding-bottom': 'pb', 'padding-left': 'pl',
  margin: 'm', 'margin-inline': 'mx', 'margin-block': 'my',
  'margin-top': 'mt', 'margin-right': 'mr', 'margin-bottom': 'mb', 'margin-left': 'ml',
  gap: 'gap', 'column-gap': 'gap-x', 'row-gap': 'gap-y',
  'font-size': 'text', 'line-height': 'leading',
  'border-radius': 'rounded',
  'border-top-left-radius': 'rounded-tl', 'border-top-right-radius': 'rounded-tr',
  'border-bottom-right-radius': 'rounded-br', 'border-bottom-left-radius': 'rounded-bl',
};

/** The class a declaration gets for a scale step: the declaration's own prefix, `-` for negative margins */
export const utilityClass = (declaration: string, value: number, suffix: string): string =>
  `${value < 0 ? '-' : ''}${CLASS_PREFIX[declaration]}${suffix ? `-${suffix}` : ''}`;

/** Back from an edit's class or token to its scale step, so a merge can rename it for another declaration */
const refOfEdit = (e: StyleEdit): ScaleRef | undefined => {
  if (e.token) return { token: e.token };
  if (!e.className) return undefined;
  const name = e.className.replace(/^-/, '');
  const prefix = CLASS_PREFIX[e.property];
  if (name === prefix) return { suffix: '' };
  return name.startsWith(`${prefix}-`) ? { suffix: name.slice(prefix.length + 1) } : undefined;
};

const refKey = (r?: ScaleRef) => !r ? '' : 'token' in r ? `token:${r.token}` : `class:${r.suffix}`;
const sameRef = (a?: ScaleRef, b?: ScaleRef) => refKey(a) === refKey(b);

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

const same = (a: Change, b: Change) => Math.abs(a.from - b.from) < 1e-6 && Math.abs(a.to - b.to) < 1e-6 && sameRef(a.ref, b.ref);
const changed = (c: Change) => Math.abs(c.from - c.to) >= 1e-6;

/** Groups the given parts into the shortest declarations; parts sharing `from` and `to` merge */
const group = (prop: AdjustProperty, changes: Partial<Record<Part, Change>>): StyleEdit[] => {
  const edit = (property: string, c: Change): StyleEdit => {
    const e: StyleEdit = { property, from: c.from, to: c.to };
    if (c.ref && 'token' in c.ref) e.token = c.ref.token;
    else if (c.ref) e.className = utilityClass(property, c.to, c.ref.suffix);
    return e;
  };
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

/** The longhands behind a property's edits, each with its original `from` and its scale step */
const editLonghands = (edits: StyleEdit[], prop: AdjustProperty): Record<string, Change> => {
  const out: Record<string, Change> = {};
  for (const e of edits) {
    if (propertyOfDeclaration(e.property) !== prop) continue;
    const ref = refOfEdit(e);
    for (const name of longhandsOfDeclaration(e.property)) out[name] = ref ? { from: e.from, to: e.to, ref } : { from: e.from, to: e.to };
  }
  return out;
};

/**
 * Folds a drag's longhand changes into an annotation's edits. Longhands already edited keep their
 * original `from`; one back at its original value drops out. A changed longhand takes the change's
 * scale step (or none); the others keep theirs, renamed for whatever declaration they end up in.
 * The property's edits are re-derived in their shortest form, where the property's first edit was.
 */
export const mergeEdits = (edits: StyleEdit[], prop: AdjustProperty, changes: Record<string, Change>): StyleEdit[] => {
  const existing = editLonghands(edits, prop);
  const merged = { ...existing };
  for (const [name, c] of Object.entries(changes)) merged[name] = { ...c, from: existing[name]?.from ?? c.from };
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

/**
 * The property of a line kai wrote: `padding-right: 24px → 34px (2.125rem)`, `line-height: 1.5 → 1.6`.
 * Only lines in that format belong to an edit; `font-size: should match the heading` is the user's.
 */
const EDIT_LINE = /^\s*([a-z-]+):\s*-?[\d.]+(?:px)?\s*→\s*-?[\d.]+(?:px)?(?:\s*\((?:[^()]|\([^()]*\))*\))?/;
const lineProperty = (line: string): string | null => line.match(EDIT_LINE)?.[1] ?? null;
/** What the user wrote after kai's part of a line (`… (1rem) check mobile`); kept when kai rewrites it */
const lineNote = (line: string): string => line.slice(line.match(EDIT_LINE)?.[0].length ?? line.length);

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
    else lines[i] = formatEditLine(e) + lineNote(lines[i]);
  }
  return lines.join('\n');
};

/** Edits whose line the user kept in the comment; deleting a line drops its edit */
export const editsInComment = (edits: StyleEdit[], comment: string): StyleEdit[] => {
  const names = new Set(comment.split('\n').map(lineProperty));
  return edits.filter(e => names.has(e.property));
};

/** An annotation's comment and edits after a drag or nudge: the changes merged in, their lines rewritten */
export const withChanges = (a: { comment: string; edits?: StyleEdit[] }, prop: AdjustProperty, changes: Record<string, Change>) => {
  const before = a.edits ?? [];
  const edits = mergeEdits(before, prop, changes);
  return { comment: syncEditLines(a.comment, before, edits), edits: edits.length ? edits : undefined };
};

/**
 * The declarations whose edits differ between two lists (added, changed or removed), sorted: what
 * an undo step is called. Empty when nothing changed, which is then no step at all.
 */
export const editsLabel = (before: StyleEdit[], after: StyleEdit[]): string => {
  const key = (e: StyleEdit) => JSON.stringify([e.from, e.to, e.className ?? '', e.token ?? '']);
  const was = new Map(before.map(e => [e.property, key(e)]));
  const now = new Map(after.map(e => [e.property, key(e)]));
  const names = new Set([...was.keys(), ...now.keys()].filter(name => was.get(name) !== now.get(name)));
  return [...names].sort().join(', ');
};

/** An annotation's comment and edits without a property's edits and their lines (Backspace while armed) */
export const withoutProperty = (a: { comment: string; edits?: StyleEdit[] }, prop: AdjustProperty) => {
  const before = a.edits ?? [];
  const edits = before.filter(e => propertyOfDeclaration(e.property) !== prop);
  return { comment: syncEditLines(a.comment, before, edits), edits: edits.length ? edits : undefined };
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
 * One HUD row for a drag or nudge: the declaration's name, the new value and the signed delta at the
 * grabbed part, and `note`, the grabbed declaration's class or token when it snapped to the scale.
 * Several declarations at once collapse to the shorthand's name (`border-radius (right)` for a corner
 * pair). Before the pointer moves it names what will change and has no delta.
 */
export const dragReadout = (
  prop: AdjustProperty, parts: Part[], anchor: Part | null, start: Values, cur: Values,
  refs: Partial<Record<Part, ScaleRef>> = {},
) => {
  const lead = anchor ?? parts[0];
  const changes: Partial<Record<Part, Change>> = {};
  for (const p of parts) changes[p] = { from: start[p] ?? 0, to: cur[p] ?? 0, ref: refs[p] };
  const moved = parts.filter(p => changed(changes[p]!));
  const decls = group(prop, moved.length ? Object.fromEntries(moved.map(p => [p, changes[p]])) : changes);
  let name: string = prop;
  if (decls.length === 1) name = decls[0].property;
  else if (kindOf(prop) === 'corners' && parts.length === 2) {
    name = `${prop} (${SIDES.find(s => parts.every(p => p.split('-').includes(s)))})`;
  }
  const leadDecl = decls.find(d => lead && longhandsOfDeclaration(d.property).includes(longhandOf(prop, lead))) ?? decls[0];
  const from = start[lead] ?? 0;
  const to = cur[lead] ?? 0;
  const d = to - from;
  const delta = Math.abs(d) < 1e-6 ? '' : `${d > 0 ? '+' : '−'}${formatValue(prop, Math.abs(d))}`;
  return { name, value: formatValue(prop, to), delta, note: leadDecl?.className ?? leadDecl?.token ?? '' };
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

/**
 * Corner radii in px as drawn, by the CSS rule: when the radii on a side add up to more than its
 * length, all of them shrink by the same factor (the smallest side length / sum). Each value is
 * `horizontal [vertical]`, `%` of the width or height; what's returned is the horizontal component,
 * so an elliptical corner reads as its horizontal radius.
 */
export const cornerRadii = (values: Record<Corner, string>, width: number, height: number): Record<Corner, number> => {
  const parse = (value: string) => {
    const [h = '0', v = h] = value.trim().split(/\s+/);
    const px = (part: string, size: number) => part.endsWith('%') ? parseFloat(part) / 100 * size : parseFloat(part) || 0;
    return { h: px(h, width), v: px(v, height) };
  };
  const r = Object.fromEntries(CORNERS.map(c => [c, parse(values[c])])) as Record<Corner, { h: number; v: number }>;
  const fit = (length: number, a: number, b: number) => a + b > length ? length / (a + b) : 1;
  const f = Math.min(
    fit(width, r['top-left'].h, r['top-right'].h),
    fit(width, r['bottom-left'].h, r['bottom-right'].h),
    fit(height, r['top-left'].v, r['bottom-left'].v),
    fit(height, r['top-right'].v, r['bottom-right'].v),
  );
  return Object.fromEntries(CORNERS.map(c => [c, r[c].h * f])) as Record<Corner, number>;
};

/** An element's layout box (border box, untransformed); a transform would inflate its bounding rect */
const layoutSize = (el: Element) => el instanceof HTMLElement
  ? { width: el.offsetWidth, height: el.offsetHeight }
  : el.getBoundingClientRect();

/** A computed gap in px: `%` of the content box along its axis, `normal` is 0 */
export const gapPx = (value: string, size: number): number =>
  value.trim().endsWith('%') ? parseFloat(value) / 100 * size : parseFloat(value) || 0;

/** The property's current values on an element, in px (line-height as a ratio of the font size) */
export const readValues = (el: Element, prop: AdjustProperty): Values => {
  const cs = getComputedStyle(el);
  const px = (name: string) => parseFloat(cs.getPropertyValue(name)) || 0;
  if (prop === 'line-height') {
    const fontSize = parseFloat(cs.fontSize) || 16;
    const lineHeight = cs.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(cs.lineHeight);
    return { value: Math.round(lineHeight / fontSize * 1000) / 1000 };
  }
  if (prop === 'border-radius') {
    const { width, height } = layoutSize(el);
    return cornerRadii(Object.fromEntries(CORNERS.map(c => [c, cs.getPropertyValue(longhandOf(prop, c))])) as Record<Corner, string>, width, height);
  }
  if (prop === 'gap') {
    const { width, height } = layoutSize(el);
    const content = {
      width: width - px('border-left-width') - px('border-right-width') - px('padding-left') - px('padding-right'),
      height: height - px('border-top-width') - px('border-bottom-width') - px('padding-top') - px('padding-bottom'),
    };
    return { row: gapPx(cs.rowGap, content.height), column: gapPx(cs.columnGap, content.width) };
  }
  return Object.fromEntries(partsOf(prop).map(p => [p, px(longhandOf(prop, p))]));
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
