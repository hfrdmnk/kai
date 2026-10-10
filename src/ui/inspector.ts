import type { CrosshairData, TextInspectData } from '../core/measure.ts';
import { inset, outset, round, type Box, type BoxModelData, type Edges, type Row } from '../core/box-model.ts';

const makeDiv = (className: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = className;
  el.style.display = 'none';
  return el;
};

const place = (el: HTMLElement, box: Box) => {
  el.style.display = 'block';
  el.style.left = `${box.left}px`;
  el.style.top = `${box.top}px`;
  el.style.width = `${box.width}px`;
  el.style.height = `${box.height}px`;
};

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const positive = (e: Edges): Edges => ({
  top: Math.max(0, e.top), right: Math.max(0, e.right), bottom: Math.max(0, e.bottom), left: Math.max(0, e.left),
});
const edgeLengths = (e: Edges) => `${e.top}px ${e.right}px ${e.bottom}px ${e.left}px`;
/** Bands narrower than this get their value in the tooltip only */
const MIN_LABEL_BAND = 16;

/** Leaves a blank line between sections */
const SPACER: Row = ['', ''];

const fillRows = (el: HTMLElement, rows: Row[]) => {
  el.textContent = '';
  rows.forEach(([label, value], i) => {
    if (i > 0) el.appendChild(document.createTextNode('\n'));
    if (!label) return;
    const span = document.createElement('span');
    span.className = 'kai-tt-label';
    span.textContent = label;
    el.append(span, value);
  });
};

export const createInspector = (shadowRoot: ShadowRoot) => {
  const lineV = makeDiv('kai-measure-line kai-measure-line--v');
  const lineH = makeDiv('kai-measure-line kai-measure-line--h');
  const cross = makeDiv('kai-measure-cross');
  const tooltip = makeDiv('kai-measure-tooltip');
  const textTooltip = makeDiv('kai-measure-text-tooltip');
  const selection = makeDiv('kai-measure-selection');
  const highlight = makeDiv('kai-measure-highlight');
  const target = makeDiv('kai-measure-target');

  const allEls = [lineV, lineH, cross, tooltip, textTooltip, selection, highlight, target];

  // Box model layer: drawn under the crosshair, independent of the other modes
  const boxMargin = makeDiv('kai-box kai-box-margin');
  const boxPadding = makeDiv('kai-box kai-box-padding');
  const boxContent = makeDiv('kai-box kai-box-content');
  const boxTooltip = makeDiv('kai-measure-text-tooltip');
  const gapPool: HTMLDivElement[] = [];
  const labelPool: HTMLDivElement[] = [];
  const boxEls = [boxMargin, boxPadding, boxContent];

  for (const el of [...boxEls, ...allEls, boxTooltip]) shadowRoot.appendChild(el);

  const pooled = (pool: HTMLDivElement[], i: number, className: string) => {
    if (!pool[i]) {
      pool[i] = makeDiv(className);
      // Keep the pool under the crosshair and tooltips
      shadowRoot.insertBefore(pool[i], boxContent);
    }
    return pool[i];
  };

  const boxLayer = () => [...boxEls, boxTooltip, ...gapPool, ...labelPool];

  const hideBoxModel = () => {
    for (const el of boxLayer()) el.style.display = 'none';
  };

  const hideAll = () => {
    for (const el of allEls) el.style.display = 'none';
  };

  const showCrosshair = (data: CrosshairData) => {
    const { cx, cy, left, right, top, bottom, width, height } = data;

    // Vertical line (top to bottom)
    const vHeight = bottom - top;
    if (vHeight > 0) {
      lineV.style.display = 'block';
      lineV.style.left = `${cx}px`;
      lineV.style.top = `${top}px`;
      lineV.style.height = `${vHeight}px`;
    } else {
      lineV.style.display = 'none';
    }

    // Horizontal line (left to right)
    const hWidth = right - left;
    if (hWidth > 0) {
      lineH.style.display = 'block';
      lineH.style.left = `${left}px`;
      lineH.style.top = `${cy}px`;
      lineH.style.width = `${hWidth}px`;
    } else {
      lineH.style.display = 'none';
    }

    // Cross at cursor
    cross.style.display = 'block';
    cross.style.left = `${cx}px`;
    cross.style.top = `${cy}px`;

    // Tooltip with dimensions
    tooltip.textContent = `${Math.round(width)}×${Math.round(height)} px`;
    tooltip.style.display = 'block';

    // Position tooltip near cursor, flipping near edges
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offsetX = 12;
    const offsetY = 12;

    const tooltipRight = cx + offsetX + 100 < vw;
    const tooltipBelow = cy + offsetY + 24 < vh;

    tooltip.style.left = tooltipRight ? `${cx + offsetX}px` : '';
    tooltip.style.right = tooltipRight ? '' : `${vw - cx + offsetX}px`;
    tooltip.style.top = tooltipBelow ? `${cy + offsetY}px` : '';
    tooltip.style.bottom = tooltipBelow ? '' : `${vh - cy + offsetY}px`;

    // Hide non-crosshair elements
    textTooltip.style.display = 'none';
    selection.style.display = 'none';
    highlight.style.display = 'none';
  };

  /** `extraRows` (the box model's, when both layers are on) share the card so the two don't collide */
  const showTextInfo = (cx: number, cy: number, data: TextInspectData, extraRows: Row[] = []) => {
    hideAll();
    fillRows(textTooltip, [
      ['Font', data.fontFamily],
      ['Size', data.fontSize],
      ['Weight', data.fontWeight],
      ['Line', data.lineHeight],
      ['Color', data.color],
      ['Track', data.letterSpacing],
      ...(extraRows.length ? [SPACER, ...extraRows] : []),
    ]);
    textTooltip.style.display = 'block';

    // Position near cursor, flipping near edges
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offsetX = 14;
    const offsetY = 14;
    const { width, height } = textTooltip.getBoundingClientRect();

    const fitsRight = cx + offsetX + width < vw;
    const fitsBelow = cy + offsetY + height < vh;

    textTooltip.style.left = fitsRight ? `${cx + offsetX}px` : '';
    textTooltip.style.right = fitsRight ? '' : `${vw - cx + offsetX}px`;
    textTooltip.style.top = fitsBelow ? `${cy + offsetY}px` : '';
    textTooltip.style.bottom = fitsBelow ? '' : `${vh - cy + offsetY}px`;
  };

  const showBoxModel = (data: BoxModelData, withTooltip = true) => {
    const { edges, values } = data;
    const margin = positive(edges.margin);
    const band = { ...edges.padding };
    // Border and scrollbar are drawn as part of the padding band, the border edge marked by an outline
    for (const side of SIDES) band[side] += edges.border[side] + edges.scrollbar[side];
    const marginBox = outset(data.border, margin);
    const contentBox = inset(data.border, band);

    place(boxMargin, marginBox);
    boxMargin.style.padding = edgeLengths(margin);
    place(boxPadding, data.border);
    boxPadding.style.borderWidth = edgeLengths(band);
    place(boxContent, contentBox);

    data.gaps.forEach((gap, i) => place(pooled(gapPool, i, 'kai-box kai-box-gap'), gap));
    for (const el of gapPool.slice(data.gaps.length)) el.style.display = 'none';

    // Values inside bands wide enough to hold them
    let labels = 0;
    const label = (value: number, band: number, x: number, y: number) => {
      if (band < MIN_LABEL_BAND) return;
      const el = pooled(labelPool, labels++, 'kai-box-label');
      el.textContent = String(round(value));
      el.style.display = 'block';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };
    const bands = (outer: Box, widths: Edges, values: Edges) => {
      const cx = outer.left + outer.width / 2;
      const cy = outer.top + outer.height / 2;
      label(values.top, widths.top, cx, outer.top + widths.top / 2);
      label(values.bottom, widths.bottom, cx, outer.top + outer.height - widths.bottom / 2);
      label(values.left, widths.left, outer.left + widths.left / 2, cy);
      label(values.right, widths.right, outer.left + outer.width - widths.right / 2, cy);
    };
    bands(marginBox, margin, values.margin);
    bands(inset(inset(data.border, edges.border), edges.scrollbar), edges.padding, values.padding);
    for (const el of labelPool.slice(labels)) el.style.display = 'none';

    if (!withTooltip) {
      boxTooltip.style.display = 'none';
      return;
    }
    fillRows(boxTooltip, data.rows);
    boxTooltip.style.display = 'block';
    // The card's Box row carries the size, and the crosshair pill would sit under it on small elements
    tooltip.style.display = 'none';
    // Below the margin box, else above it, else pinned inside the viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { width, height } = boxTooltip.getBoundingClientRect();
    const below = marginBox.top + marginBox.height + 8;
    const above = marginBox.top - 8 - height;
    const top = below + height <= vh - 8 ? below : above >= 8 ? above : vh - 8 - height;
    boxTooltip.style.left = `${Math.min(Math.max(8, marginBox.left), vw - 8 - width)}px`;
    boxTooltip.style.top = `${Math.max(8, top)}px`;
  };

  /** Outlines the measured element when it isn't the one under the cursor; `null` hides it */
  const showTarget = (rect: DOMRect | null) => {
    if (rect) place(target, rect);
    else target.style.display = 'none';
  };

  const showSelection = (x1: number, y1: number, x2: number, y2: number) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    hideBoxModel();
    selection.style.display = 'block';
    selection.style.left = `${left}px`;
    selection.style.top = `${top}px`;
    selection.style.width = `${w}px`;
    selection.style.height = `${h}px`;

    // Hide everything else during drag
    target.style.display = 'none';
    lineV.style.display = 'none';
    lineH.style.display = 'none';
    cross.style.display = 'none';
    tooltip.style.display = 'none';
    textTooltip.style.display = 'none';
    highlight.style.display = 'none';
  };

  const showHighlight = (rect: DOMRect) => {
    hideBoxModel();
    highlight.style.display = 'block';
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    // Show dimensions centered in highlight
    tooltip.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)} px`;
    tooltip.style.display = 'block';
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top + rect.height / 2}px`;
    tooltip.style.right = '';
    tooltip.style.bottom = '';
    tooltip.className = 'kai-measure-tooltip kai-measure-tooltip--centered';

    // Hide everything else
    target.style.display = 'none';
    lineV.style.display = 'none';
    lineH.style.display = 'none';
    cross.style.display = 'none';
    textTooltip.style.display = 'none';
    selection.style.display = 'none';
  };

  const hide = () => {
    hideAll();
    hideBoxModel();
    tooltip.className = 'kai-measure-tooltip';
  };

  const destroy = () => {
    for (const el of [...allEls, ...boxLayer()]) el.remove();
  };

  return { showCrosshair, showTextInfo, showBoxModel, hideBoxModel, showTarget, showSelection, showHighlight, hide, destroy };
};
