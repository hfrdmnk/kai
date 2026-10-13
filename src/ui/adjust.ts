import {
  ADJUST, CORNERS, SIDES, dragReadout, kindOf, nameWidth, shorthandValue,
  type AdjustProperty, type Part, type Side, type Values,
} from '../core/adjust.ts';
import { computeBoxModel, inset, outset, type Box, type Edges } from '../core/box-model.ts';
import type { AdjustHud, KeyId } from './guide-bar.ts';

/** Distance of a corner's arc outside the element's own curve, and the straight tails past it */
const ARC_OFFSET = 4;
const ARC_TAIL = 6;
/** An empty side that will change still gets a sliver this wide */
const SLIVER = 4;
/** Line stripes drawn at most, for very tall text */
const MAX_LINES = 40;

/** What Alt and Shift do for each kind of property; single values take no modifiers */
const MODIFIER_HINTS: Record<string, [KeyId, string][]> = {
  sides: [['alt', 'axis'], ['shift', 'all']],
  corners: [['alt', 'side'], ['shift', 'all']],
  gap: [['shift', 'both']],
  value: [],
};

/** Armed HUD: `[glyph] Padding 24px · ⌥ axis · ⇧ all`, the glyph and chips following the pointer and modifiers */
export const armedHud = (prop: AdjustProperty, values: Values, parts: Part[], held: { alt: boolean; shift: boolean }): AdjustHud => {
  const kind = kindOf(prop);
  const on = (all: Part[]) => all.map(p => parts.includes(p));
  return {
    kind: 'armed',
    title: ADJUST[prop].title,
    value: shorthandValue(prop, values),
    glyph: kind === 'sides' ? { corners: false, on: on(SIDES) } : kind === 'corners' ? { corners: true, on: on(CORNERS) } : null,
    modifiers: MODIFIER_HINTS[kind].map(([key, hint]) => ({ key, hint, pressed: key === 'alt' ? held.alt : held.shift })),
  };
};

/** Drag HUD: `padding-right  35px  +11px` */
export const dragHud = (prop: AdjustProperty, parts: Part[], anchor: Part | null, start: Values, cur: Values): AdjustHud =>
  ({ kind: 'drag', ...dragReadout(prop, parts, anchor, start, cur), nameWidth: nameWidth(prop) });

export type AdjustLayerState = {
  prop: AdjustProperty;
  target: Element;
  /** The sides, corners or gaps the drag changes, highlighted */
  hot: Part[];
  /** The selector's other matches, which the same fix changes too */
  others: Element[];
};

const place = (el: HTMLElement, box: Box) => {
  el.style.display = 'block';
  el.style.left = `${box.left}px`;
  el.style.top = `${box.top}px`;
  el.style.width = `${box.width}px`;
  el.style.height = `${box.height}px`;
};

const positive = (e: Edges): Edges => ({
  top: Math.max(0, e.top), right: Math.max(0, e.right), bottom: Math.max(0, e.bottom), left: Math.max(0, e.left),
});

/** The band of one side inside `outer`; left and right bands sit between the top and bottom ones */
const sideBand = (outer: Box, widths: Edges, side: Side): Box => {
  const middle = { top: outer.top + widths.top, height: outer.height - widths.top - widths.bottom };
  switch (side) {
    case 'top': return { left: outer.left, top: outer.top, width: outer.width, height: widths.top };
    case 'bottom': return { left: outer.left, top: outer.top + outer.height - widths.bottom, width: outer.width, height: widths.bottom };
    case 'left': return { left: outer.left, ...middle, width: widths.left };
    case 'right': return { left: outer.left + outer.width - widths.right, ...middle, width: widths.right };
  }
};

/** A side band about to change but still empty is drawn as a sliver centered on its edge */
const sliver = (band: Box, side: Side): Box => {
  if (side === 'top' || side === 'bottom') {
    return band.height > 0 ? band : { ...band, top: band.top - SLIVER / 2, height: SLIVER };
  }
  return band.width > 0 ? band : { ...band, left: band.left - SLIVER / 2, width: SLIVER };
};

const px = (cs: CSSStyleDeclaration, name: string) => parseFloat(cs.getPropertyValue(name)) || 0;

/** A corner's radius in px, percentages resolved, capped like the browser's rendering */
const cornerRadius = (cs: CSSStyleDeclaration, corner: string, rect: DOMRect) => {
  const value = cs.getPropertyValue(`border-${corner}-radius`).split(' ')[0];
  const radius = value.endsWith('%') ? parseFloat(value) / 100 * rect.width : parseFloat(value) || 0;
  return Math.min(radius, rect.width / 2, rect.height / 2);
};

/**
 * What an armed property is about to change, drawn like the box model: padding bands, hatched margin
 * bands and gap gutters, line stripes for line-height, and a second rounded border outside each corner
 * for border-radius. The parts the drag changes get an accent outline.
 */
export const createAdjustLayer = (shadowRoot: ShadowRoot) => {
  const pools = new Map<string, HTMLDivElement[]>();
  let used = new Map<string, number>();

  /** The next div of a kind; layers are reused across frames and hidden when unused */
  const next = (className: string): HTMLDivElement => {
    const pool = pools.get(className) ?? [];
    pools.set(className, pool);
    const i = used.get(className) ?? 0;
    used.set(className, i + 1);
    if (!pool[i]) {
      const el = document.createElement('div');
      el.className = className;
      el.setAttribute('aria-hidden', 'true');
      shadowRoot.appendChild(el);
      pool[i] = el;
    }
    const el = pool[i];
    el.removeAttribute('style');
    return el;
  };

  const band = (kind: string, box: Box, hot: boolean) => {
    if (box.width <= 0 || box.height <= 0) return;
    const el = next('kai-adjust-band');
    el.setAttribute('data-kind', kind);
    el.toggleAttribute('data-hot', hot);
    place(el, box);
  };

  const drawSides = (prop: 'padding' | 'margin', target: Element, hot: Set<Part>) => {
    const data = computeBoxModel(target);
    if (!data) return;
    const { edges, border } = data;
    let outer: Box;
    let widths: Edges;
    if (prop === 'padding') {
      outer = inset(inset(border, edges.border), edges.scrollbar);
      widths = edges.padding;
    } else {
      // Negative margins pull the element out rather than leaving space; they're drawn as 0
      widths = positive(edges.margin);
      outer = outset(border, widths);
    }
    for (const side of SIDES) {
      let box = sideBand(outer, widths, side);
      // Margin bands beside the element span its height, not the corners of the margin box
      if (prop === 'margin' && (side === 'left' || side === 'right')) box = { ...box, top: border.top, height: border.height };
      band(prop, hot.has(side) ? sliver(box, side) : box, hot.has(side));
    }
  };

  const drawGaps = (target: Element, hot: Set<Part>) => {
    for (const gutter of computeBoxModel(target)?.gaps ?? []) band('gap', gutter, hot.has(gutter.axis));
  };

  /** Every other line box of the content area, so the line height reads as stripes */
  const drawLines = (target: Element) => {
    const cs = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    const fontSize = px(cs, 'font-size');
    const lineHeight = cs.lineHeight === 'normal' ? fontSize * 1.2 : px(cs, 'line-height');
    if (lineHeight <= 0) return;
    const top = rect.top + px(cs, 'border-top-width') + px(cs, 'padding-top');
    const left = rect.left + px(cs, 'border-left-width') + px(cs, 'padding-left');
    const width = rect.right - px(cs, 'border-right-width') - px(cs, 'padding-right') - left;
    const height = rect.bottom - px(cs, 'border-bottom-width') - px(cs, 'padding-bottom') - top;
    const lines = Math.min(MAX_LINES, Math.max(1, Math.round(height / lineHeight)));
    for (let i = 0; i < lines; i += 2) band('line', { left, top: top + i * lineHeight, width, height: lineHeight }, false);
  };

  /** A rounded border `ARC_OFFSET` outside each changing corner's curve, with short straight tails */
  const drawArcs = (target: Element, hot: Set<Part>) => {
    const cs = getComputedStyle(target);
    const rect = target.getBoundingClientRect();
    for (const corner of CORNERS) {
      if (!hot.has(corner)) continue;
      const radius = cornerRadius(cs, corner, rect);
      const size = radius + ARC_OFFSET + ARC_TAIL;
      const [vertical, horizontal] = corner.split('-');
      const el = next('kai-adjust-arc');
      place(el, {
        left: horizontal === 'left' ? rect.left - ARC_OFFSET : rect.right + ARC_OFFSET - size,
        top: vertical === 'top' ? rect.top - ARC_OFFSET : rect.bottom + ARC_OFFSET - size,
        width: size,
        height: size,
      });
      el.style.setProperty(`border-${vertical}-width`, '1.5px');
      el.style.setProperty(`border-${horizontal}-width`, '1.5px');
      el.style.setProperty(`border-${corner}-radius`, `${radius + ARC_OFFSET}px`);
    }
  };

  const drawGhosts = (others: Element[]) => {
    for (const other of others) {
      if (!other.isConnected) continue;
      const el = next('kai-adjust-ghost');
      place(el, other.getBoundingClientRect());
      el.style.borderRadius = getComputedStyle(other).borderRadius;
    }
  };

  const finish = () => {
    for (const [className, pool] of pools) {
      for (const el of pool.slice(used.get(className) ?? 0)) el.style.display = 'none';
    }
  };

  const show = ({ prop, target, hot, others }: AdjustLayerState) => {
    used = new Map();
    if (target.isConnected) {
      const parts = new Set(hot);
      const kind = kindOf(prop);
      if (prop === 'padding' || prop === 'margin') drawSides(prop, target, parts);
      else if (kind === 'gap') drawGaps(target, parts);
      else if (kind === 'corners') drawArcs(target, parts);
      else if (prop === 'line-height') drawLines(target);
      drawGhosts(others);
    }
    finish();
  };

  const hide = () => {
    used = new Map();
    finish();
  };

  const destroy = () => {
    for (const pool of pools.values()) for (const el of pool) el.remove();
    pools.clear();
  };

  return { show, hide, destroy };
};
