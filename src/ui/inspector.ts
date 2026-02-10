import { computeBoxModel, computeDistances, computeTextInfo } from '../core/box-model.ts';
import type { DistanceMeasurement } from '../core/box-model.ts';

const makeDiv = (className: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = className;
  el.style.display = 'none';
  return el;
};

const positionRect = (
  el: HTMLElement,
  top: number,
  left: number,
  width: number,
  height: number,
) => {
  el.style.display = 'block';
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  el.style.width = `${Math.max(0, width)}px`;
  el.style.height = `${Math.max(0, height)}px`;
};

export const createInspector = (shadowRoot: ShadowRoot) => {
  // Content overlay
  const content = makeDiv('kai-inspector-content');

  // Padding overlays (top, right, bottom, left)
  const padTop = makeDiv('kai-inspector-padding kai-inspector-padding--top');
  const padRight = makeDiv('kai-inspector-padding kai-inspector-padding--right');
  const padBottom = makeDiv('kai-inspector-padding kai-inspector-padding--bottom');
  const padLeft = makeDiv('kai-inspector-padding kai-inspector-padding--left');
  const paddings = [padTop, padRight, padBottom, padLeft];

  // Margin overlays (top, right, bottom, left)
  const marTop = makeDiv('kai-inspector-margin');
  const marRight = makeDiv('kai-inspector-margin');
  const marBottom = makeDiv('kai-inspector-margin');
  const marLeft = makeDiv('kai-inspector-margin');
  const margins = [marTop, marRight, marBottom, marLeft];

  // Value labels: 4 padding + 4 margin = 8
  const padLabels = Array.from({ length: 4 }, () => makeDiv('kai-inspector-label'));
  const marLabels = Array.from({ length: 4 }, () => makeDiv('kai-inspector-label'));

  // Distance lines + labels (4 each)
  const distLines = Array.from({ length: 4 }, () => makeDiv('kai-inspector-distance-line'));
  const distLabels = Array.from({ length: 4 }, () => makeDiv('kai-inspector-distance-label'));

  // Text info tooltip
  const textInfo = makeDiv('kai-inspector-text-info');

  // Append all to shadow root
  const allEls = [
    content,
    ...paddings,
    ...margins,
    ...padLabels,
    ...marLabels,
    ...distLines,
    ...distLabels,
    textInfo,
  ];
  for (const el of allEls) shadowRoot.appendChild(el);

  const hideAll = () => {
    for (const el of allEls) el.style.display = 'none';
  };

  const positionLabel = (
    label: HTMLElement,
    top: number,
    left: number,
    width: number,
    height: number,
    value: number,
  ) => {
    if (value === 0) {
      label.style.display = 'none';
      return;
    }
    label.textContent = String(Math.round(value));
    label.style.display = 'block';
    label.style.top = `${top + height / 2}px`;
    label.style.left = `${left + width / 2}px`;
  };

  const show = (el: Element) => {
    const bm = computeBoxModel(el);

    // Content
    positionRect(
      content,
      bm.contentRect.top,
      bm.contentRect.left,
      bm.contentRect.width,
      bm.contentRect.height,
    );

    // Padding: top
    positionRect(
      padTop,
      bm.paddingRect.top,
      bm.paddingRect.left,
      bm.paddingRect.width,
      bm.padding.top,
    );
    // Padding: bottom
    positionRect(
      padBottom,
      bm.contentRect.bottom,
      bm.paddingRect.left,
      bm.paddingRect.width,
      bm.padding.bottom,
    );
    // Padding: left
    positionRect(
      padLeft,
      bm.contentRect.top,
      bm.paddingRect.left,
      bm.padding.left,
      bm.contentRect.height,
    );
    // Padding: right
    positionRect(
      padRight,
      bm.contentRect.top,
      bm.contentRect.right,
      bm.padding.right,
      bm.contentRect.height,
    );

    // Margin: top (full width of margin box)
    positionRect(
      marTop,
      bm.marginRect.top,
      bm.marginRect.left,
      bm.marginRect.width,
      bm.margin.top,
    );
    // Margin: bottom
    positionRect(
      marBottom,
      bm.borderRect.bottom,
      bm.marginRect.left,
      bm.marginRect.width,
      bm.margin.bottom,
    );
    // Margin: left
    positionRect(
      marLeft,
      bm.borderRect.top,
      bm.marginRect.left,
      bm.margin.left,
      bm.borderRect.height,
    );
    // Margin: right
    positionRect(
      marRight,
      bm.borderRect.top,
      bm.borderRect.right,
      bm.margin.right,
      bm.borderRect.height,
    );

    // Padding labels (top, right, bottom, left)
    positionLabel(padLabels[0], bm.paddingRect.top, bm.paddingRect.left, bm.paddingRect.width, bm.padding.top, bm.padding.top);
    positionLabel(padLabels[1], bm.contentRect.top, bm.contentRect.right, bm.padding.right, bm.contentRect.height, bm.padding.right);
    positionLabel(padLabels[2], bm.contentRect.bottom, bm.paddingRect.left, bm.paddingRect.width, bm.padding.bottom, bm.padding.bottom);
    positionLabel(padLabels[3], bm.contentRect.top, bm.paddingRect.left, bm.padding.left, bm.contentRect.height, bm.padding.left);

    // Margin labels (top, right, bottom, left)
    positionLabel(marLabels[0], bm.marginRect.top, bm.marginRect.left, bm.marginRect.width, bm.margin.top, bm.margin.top);
    positionLabel(marLabels[1], bm.borderRect.top, bm.borderRect.right, bm.margin.right, bm.borderRect.height, bm.margin.right);
    positionLabel(marLabels[2], bm.borderRect.bottom, bm.marginRect.left, bm.marginRect.width, bm.margin.bottom, bm.margin.bottom);
    positionLabel(marLabels[3], bm.borderRect.top, bm.marginRect.left, bm.margin.left, bm.borderRect.height, bm.margin.left);

    // Distances
    const distances = computeDistances(el);
    for (let i = 0; i < 4; i++) {
      const line = distLines[i];
      const label = distLabels[i];
      const d: DistanceMeasurement | undefined = distances[i];

      if (!d) {
        line.style.display = 'none';
        label.style.display = 'none';
        continue;
      }

      const isVertical = d.direction === 'top' || d.direction === 'bottom';
      line.className = `kai-inspector-distance-line kai-inspector-distance-line--${isVertical ? 'vertical' : 'horizontal'}`;

      if (isVertical) {
        const minY = Math.min(d.from.y, d.to.y);
        const h = Math.abs(d.to.y - d.from.y);
        line.style.display = 'block';
        line.style.left = `${d.from.x}px`;
        line.style.top = `${minY}px`;
        line.style.width = '1px';
        line.style.height = `${h}px`;
      } else {
        const minX = Math.min(d.from.x, d.to.x);
        const w = Math.abs(d.to.x - d.from.x);
        line.style.display = 'block';
        line.style.left = `${minX}px`;
        line.style.top = `${d.from.y}px`;
        line.style.width = `${w}px`;
        line.style.height = '1px';
      }

      label.textContent = d.label;
      label.style.display = 'block';
      label.style.left = `${d.labelPos.x}px`;
      label.style.top = `${d.labelPos.y}px`;
    }

    // Text info
    const ti = computeTextInfo(el);
    if (ti) {
      textInfo.textContent = `${ti.fontFamily} · ${ti.fontWeight} · ${ti.fontSize} / ${ti.lineHeight}`;
      textInfo.style.display = 'block';
      // Position below the margin box
      textInfo.style.left = `${bm.marginRect.left}px`;
      textInfo.style.top = `${bm.marginRect.bottom + 6}px`;
    } else {
      textInfo.style.display = 'none';
    }
  };

  const hide = () => hideAll();

  const destroy = () => {
    for (const el of allEls) el.remove();
  };

  return { show, hide, destroy };
};
