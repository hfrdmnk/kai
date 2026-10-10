import { remFromPx } from './styles.ts';
import { composedParent, elementLabel } from './selector.ts';

export type Edges = { top: number; right: number; bottom: number; left: number };
export type Box = { left: number; top: number; width: number; height: number };
export type Row = [label: string, value: string];

export type BoxModelData = {
  /** Border box in viewport coordinates */
  border: Box;
  /** Drawn edge widths in viewport px: scaled by transforms, zero where an edge doesn't render */
  edges: { margin: Edges; border: Edges; scrollbar: Edges; padding: Edges };
  /** CSS values for the in-band labels */
  values: { margin: Edges; padding: Edges };
  /** Flex/grid gutters in viewport coordinates, clipped to the padding box and viewport */
  gaps: Box[];
  rows: Row[];
};

const NONE: Edges = { top: 0, right: 0, bottom: 0, left: 0 };

const readEdges = (cs: CSSStyleDeclaration, prefix: string, suffix = ''): Edges => {
  const read = (side: string) => parseFloat(cs.getPropertyValue(`${prefix}-${side}${suffix}`)) || 0;
  return { top: read('top'), right: read('right'), bottom: read('bottom'), left: read('left') };
};

export const inset = (box: Box, e: Edges): Box => ({
  left: box.left + e.left,
  top: box.top + e.top,
  width: Math.max(0, box.width - e.left - e.right),
  height: Math.max(0, box.height - e.top - e.bottom),
});

export const outset = (box: Box, e: Edges): Box =>
  inset(box, { top: -e.top, right: -e.right, bottom: -e.bottom, left: -e.left });

const scaleEdges = (e: Edges, s: number): Edges =>
  ({ top: e.top * s, right: e.right * s, bottom: e.bottom * s, left: e.left * s });

const intersect = (a: Box, b: Box): Box | null => {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const width = Math.min(a.left + a.width, b.left + b.width) - left;
  const height = Math.min(a.top + a.height, b.top + b.height) - top;
  return width > 0 && height > 0 ? { left, top, width, height } : null;
};

/** Replaced elements keep vertical margins and draw as one box even when `display: inline` */
const REPLACED = new Set(['img', 'svg', 'video', 'audio', 'canvas', 'iframe', 'embed', 'object', 'input', 'select', 'textarea']);

export const round = (n: number) => Math.round(n * 100) / 100;

const withRem = (values: number[]) =>
  `${values.join(' ')} (${values.map(v => v === 0 ? '0' : remFromPx(v)).join(' ')})`;

/** CSS shorthand order: 1–4 values, e.g. `16 24 (1rem 1.5rem)` */
export const formatEdges = (e: Edges): string => {
  const [top, right, bottom, left] = [e.top, e.right, e.bottom, e.left].map(round);
  const values = left !== right ? [top, right, bottom, left]
    : top !== bottom ? [top, right, bottom]
    : top !== right ? [top, right]
    : [top];
  return values.every(v => v === 0) ? values.join(' ') : withRem(values);
};

const formatGap = (row: number, column: number): string =>
  withRem(row === column ? [round(row)] : [round(row), round(column)]);

// ── Gutters ──

/**
 * Track layout along one grid axis, relative to the content edge: where the tracks start
 * and end, and the offset of each gutter. Gutters are `gap` wide and centered in the space
 * between two tracks, which content distribution (`justify-content` / `align-content`) may widen.
 */
export const gridAxis = (tracks: number[], gap: number, size: number, distribution: string) => {
  const n = tracks.length;
  if (n === 0) return { start: 0, end: size, gutters: [] };
  const used = tracks.reduce((a, b) => a + b, 0) + gap * Math.max(0, n - 1);
  const free = Math.max(0, size - used);
  let start = 0;
  let extra = 0;
  if (n > 1 && distribution.includes('space-between')) extra = free / (n - 1);
  else if (distribution.includes('space-around')) { extra = free / n; start = extra / 2; }
  else if (distribution.includes('space-evenly')) { extra = free / (n + 1); start = extra; }
  else if (distribution.includes('center')) start = free / 2;
  else if (/\b(end|flex-end)\b/.test(distribution)) start = free;

  const gutters: number[] = [];
  let pos = start;
  for (let i = 0; i < n - 1; i++) {
    pos += tracks[i];
    if (gap > 0) gutters.push(pos + extra / 2);
    pos += gap + extra;
  }
  return { start, end: pos + tracks[n - 1], gutters };
};

type Span = { start: number; end: number };

/**
 * Gutters between flex items, given their margin boxes. Works in main/cross terms:
 * `mainGap` separates items on a line, `crossGap` separates wrapped lines.
 */
export const flexGutters = (
  items: Box[],
  horizontal: boolean,
  wraps: boolean,
  mainGap: number,
  crossGap: number,
  content: Box,
): Box[] => {
  // Map to a row-oriented frame so one algorithm covers both directions
  const toFrame = (b: Box): Box => horizontal ? b : { left: b.top, top: b.left, width: b.height, height: b.width };
  const frame = toFrame(content);
  const sorted = items.map(toFrame).sort((a, b) => a.top - b.top);

  const lines: { items: Box[]; cross: Span }[] = [];
  for (const item of sorted) {
    const line = lines[lines.length - 1];
    // Items differing in cross position (align-self, zero height) still share a nowrap line
    if (line && (!wraps || item.top < line.cross.end - 0.5 || item.top <= line.cross.start + 0.5)) {
      line.items.push(item);
      line.cross.end = Math.max(line.cross.end, item.top + item.height);
    } else {
      lines.push({ items: [item], cross: { start: item.top, end: item.top + item.height } });
    }
  }

  const out: Box[] = [];
  const single = lines.length === 1;
  if (mainGap > 0) {
    for (const line of lines) {
      // A single-line container's line spans its whole cross size
      const cross = single ? { start: frame.top, end: frame.top + frame.height } : line.cross;
      const row = [...line.items].sort((a, b) => a.left - b.left);
      for (let i = 0; i < row.length - 1; i++) {
        const end = row[i].left + row[i].width;
        const space = row[i + 1].left - end;
        if (space < mainGap - 0.5) continue;
        out.push({ left: end + (space - mainGap) / 2, top: cross.start, width: mainGap, height: cross.end - cross.start });
      }
    }
  }
  if (crossGap > 0) {
    for (let i = 0; i < lines.length - 1; i++) {
      const space = lines[i + 1].cross.start - lines[i].cross.end;
      if (space < crossGap - 0.5) continue;
      out.push({ left: frame.left, top: lines[i].cross.end + (space - crossGap) / 2, width: frame.width, height: crossGap });
    }
  }
  return out.map(toFrame);
};

/** The nodes a box lays out: its open shadow tree's, or a slot's assigned (else fallback) nodes */
const layoutNodes = (el: Element): Node[] => {
  if (el instanceof HTMLSlotElement) {
    const assigned = el.assignedNodes({ flatten: true });
    return assigned.length ? assigned : [...el.childNodes];
  }
  return [...(el.shadowRoot ?? el).childNodes];
};

/**
 * Margin boxes of a flex container's items, looking through `display: contents` (slots
 * included). Text runs count too: they become anonymous items, e.g. a label between two icons.
 */
const flexItems = (el: Element, scale: number): Box[] => layoutNodes(el).flatMap(node => {
  if (node instanceof Text) {
    if (!node.data.trim()) return [];
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    return rect.width || rect.height ? [rect] : [];
  }
  if (!(node instanceof Element)) return [];
  const cs = getComputedStyle(node);
  if (cs.display === 'contents') return flexItems(node, scale);
  if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') return [];
  // Unslotted light DOM (e.g. under a closed shadow root) isn't rendered
  if (!node.getClientRects().length) return [];
  return [outset(node.getBoundingClientRect(), scaleEdges(readEdges(cs, 'margin'), scale))];
});

/**
 * Track sizes in px. Trailing 0px tracks are dropped: that's where auto-placement leaves the empty
 * tracks `auto-fit` collapses, gutters included. Other empty tracks keep their gutters.
 */
export const parseTracks = (value: string): number[] => {
  if (value === 'none' || value.includes('subgrid')) return [];
  const tracks = value.replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).map(parseFloat).filter(Number.isFinite);
  while (tracks.length && tracks[tracks.length - 1] === 0) tracks.pop();
  return tracks;
};

/** Gutters in viewport px; `content` is the content box, gaps and `scale` already applied by the caller */
const computeGaps = (el: Element, cs: CSSStyleDeclaration, content: Box, rowGap: number, columnGap: number, scale: number): Box[] => {
  if (cs.display.includes('flex')) {
    const horizontal = cs.flexDirection.startsWith('row');
    const items = flexItems(el, scale);
    return flexGutters(items, horizontal, cs.flexWrap !== 'nowrap', horizontal ? columnGap : rowGap, horizontal ? rowGap : columnGap, content);
  }

  // Grid: the resolved template lists every track (implicit ones included) in px
  const rtl = cs.direction === 'rtl';
  // gridAxis measures from the inline-start edge, so physical left/right depend on direction
  const justify = cs.justifyContent
    .replace(/\bright\b/, rtl ? 'start' : 'end')
    .replace(/\bleft\b/, rtl ? 'end' : 'start');
  const tracks = (value: string) => parseTracks(value).map(t => t * scale);
  const x = gridAxis(tracks(cs.gridTemplateColumns), columnGap, content.width, justify);
  const y = gridAxis(tracks(cs.gridTemplateRows), rowGap, content.height, cs.alignContent);
  const originX = content.left - el.scrollLeft * scale;
  const originY = content.top - el.scrollTop * scale;
  // Columns run right to left in RTL
  const left = (offset: number, width: number) => rtl ? originX + content.width - offset - width : originX + offset;
  return [
    ...x.gutters.map(gx => ({ left: left(gx, columnGap), top: originY + y.start, width: columnGap, height: y.end - y.start })),
    ...y.gutters.map(gy => ({ left: left(x.start, x.end - x.start), top: originY + gy, width: x.end - x.start, height: rowGap })),
  ];
};

/** Whether the element or an ancestor is rotated or skewed; a rotated square's bounding box still looks evenly scaled */
const rotated = (el: Element): boolean => {
  for (let node: Element | null = el; node; node = composedParent(node)) {
    const cs = getComputedStyle(node);
    // The individual `rotate` property isn't part of the computed `transform`
    if (cs.rotate !== 'none' && parseFloat(cs.rotate.split(' ').pop()!) !== 0) return true;
    if (cs.transform === 'none') continue;
    const m = new DOMMatrix(cs.transform);
    if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) return true;
  }
  return false;
};

/**
 * Viewport px per CSS px, from the bounding box against the untransformed layout size.
 * `null` for rotated, skewed or unevenly scaled boxes, whose edges can't be drawn as bands.
 */
const scaleOf = (el: Element, bounds: DOMRect): number | null => {
  if (!(el instanceof HTMLElement) || !el.offsetWidth || !el.offsetHeight) return 1;
  if (rotated(el)) return null;
  // offsetWidth/Height are rounded to whole px
  if (Math.abs(bounds.width - el.offsetWidth) <= 1 && Math.abs(bounds.height - el.offsetHeight) <= 1) return 1;
  const sx = bounds.width / el.offsetWidth;
  const sy = bounds.height / el.offsetHeight;
  return Math.abs(sx - sy) <= 0.05 * Math.max(sx, sy) ? (sx + sy) / 2 : null;
};

/** Classic (space-taking) scrollbars sit between the border and the padding */
const scrollbarOf = (el: Element, cs: CSSStyleDeclaration, border: Edges): Edges => {
  // The root's and body's scrollbars belong to the viewport
  if (!(el instanceof HTMLElement) || el === document.documentElement || el === document.body) return NONE;
  const vertical = /auto|scroll/.test(cs.overflowY)
    ? Math.max(0, Math.round(el.offsetWidth - el.clientWidth - border.left - border.right)) : 0;
  const horizontal = /auto|scroll/.test(cs.overflowX)
    ? Math.max(0, Math.round(el.offsetHeight - el.clientHeight - border.top - border.bottom)) : 0;
  const rtl = cs.direction === 'rtl';
  return { top: 0, right: rtl ? 0 : vertical, bottom: horizontal, left: rtl ? vertical : 0 };
};

export const computeBoxModel = (el: Element): BoxModelData | null => {
  const rects = el.getClientRects();
  if (rects.length === 0) return null;
  const cs = getComputedStyle(el);
  const bounds = el.getBoundingClientRect();

  const inline = cs.display === 'inline' && !REPLACED.has(el.localName);
  const margin = readEdges(cs, 'margin');
  const borderWidth = readEdges(cs, 'border', '-width');
  const padding = readEdges(cs, 'padding');
  // Vertical margins don't apply to non-replaced inline boxes
  if (inline) margin.top = margin.bottom = 0;

  const rows: Row[] = [
    ['Box', `${elementLabel(el)} ${round(bounds.width)}×${round(bounds.height)}`],
    ['Margin', formatEdges(margin)],
  ];
  if (Object.values(borderWidth).some(v => v > 0)) rows.push(['Border', formatEdges(borderWidth)]);
  rows.push(['Padding', formatEdges(padding)]);
  const container = /flex|grid/.test(cs.display);
  const rowGap = container ? parseFloat(cs.rowGap) || 0 : 0;
  const columnGap = container ? parseFloat(cs.columnGap) || 0 : 0;
  if (rowGap > 0 || columnGap > 0) rows.push(['Gap', formatGap(rowGap, columnGap)]);

  // A wrapped inline box is drawn on its first line
  const border: Box = inline ? rects[0] : bounds;
  const values = { margin, padding };
  const scale = scaleOf(el, bounds);
  if (scale === null) {
    return { border, edges: { margin: NONE, border: NONE, scrollbar: NONE, padding: NONE }, values, gaps: [], rows };
  }

  const edges = {
    margin: scaleEdges(margin, scale),
    border: scaleEdges(borderWidth, scale),
    scrollbar: scaleEdges(scrollbarOf(el, cs, borderWidth), scale),
    padding: scaleEdges(padding, scale),
  };
  // ...whose end side has no edges
  if (inline && rects.length > 1) {
    const endSide = cs.direction === 'rtl' ? 'left' : 'right';
    edges.margin[endSide] = edges.border[endSide] = edges.padding[endSide] = 0;
  }

  let gaps: Box[] = [];
  if (rowGap > 0 || columnGap > 0) {
    const paddingBox = inset(inset(border, edges.border), edges.scrollbar);
    const visible = intersect(paddingBox, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
    gaps = visible
      ? computeGaps(el, cs, inset(paddingBox, edges.padding), rowGap * scale, columnGap * scale, scale)
        .flatMap(gap => intersect(gap, visible) ?? [])
      : [];
  }

  return { border, edges, values, gaps, rows };
};
