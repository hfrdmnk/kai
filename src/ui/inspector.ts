import type { CrosshairData, TextInspectData } from '../core/measure.ts';

const makeDiv = (className: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.className = className;
  el.style.display = 'none';
  return el;
};

export const createInspector = (shadowRoot: ShadowRoot) => {
  const lineV = makeDiv('kai-measure-line kai-measure-line--v');
  const lineH = makeDiv('kai-measure-line kai-measure-line--h');
  const cross = makeDiv('kai-measure-cross');
  const tooltip = makeDiv('kai-measure-tooltip');
  const textTooltip = makeDiv('kai-measure-text-tooltip');
  const selection = makeDiv('kai-measure-selection');
  const highlight = makeDiv('kai-measure-highlight');

  const allEls = [lineV, lineH, cross, tooltip, textTooltip, selection, highlight];
  for (const el of allEls) shadowRoot.appendChild(el);

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

  const showTextInfo = (cx: number, cy: number, data: TextInspectData) => {
    // Hide crosshair elements
    lineV.style.display = 'none';
    lineH.style.display = 'none';
    cross.style.display = 'none';
    tooltip.style.display = 'none';
    selection.style.display = 'none';
    highlight.style.display = 'none';

    const lines = [
      `Font   ${data.fontFamily}`,
      `Size   ${data.fontSize}`,
      `Weight ${data.fontWeight}`,
      `Line   ${data.lineHeight}`,
      `Color  ${data.color}`,
      `Track  ${data.letterSpacing}`,
    ];
    textTooltip.textContent = lines.join('\n');
    textTooltip.style.display = 'block';

    // Position near cursor, flipping near edges
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const offsetX = 14;
    const offsetY = 14;

    const fitsRight = cx + offsetX + 280 < vw;
    const fitsBelow = cy + offsetY + 120 < vh;

    textTooltip.style.left = fitsRight ? `${cx + offsetX}px` : '';
    textTooltip.style.right = fitsRight ? '' : `${vw - cx + offsetX}px`;
    textTooltip.style.top = fitsBelow ? `${cy + offsetY}px` : '';
    textTooltip.style.bottom = fitsBelow ? '' : `${vh - cy + offsetY}px`;
  };

  const showSelection = (x1: number, y1: number, x2: number, y2: number) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    selection.style.display = 'block';
    selection.style.left = `${left}px`;
    selection.style.top = `${top}px`;
    selection.style.width = `${w}px`;
    selection.style.height = `${h}px`;

    // Hide everything else during drag
    lineV.style.display = 'none';
    lineH.style.display = 'none';
    cross.style.display = 'none';
    tooltip.style.display = 'none';
    textTooltip.style.display = 'none';
    highlight.style.display = 'none';
  };

  const showHighlight = (rect: DOMRect) => {
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
    lineV.style.display = 'none';
    lineH.style.display = 'none';
    cross.style.display = 'none';
    textTooltip.style.display = 'none';
    selection.style.display = 'none';
  };

  const hide = () => {
    hideAll();
    tooltip.className = 'kai-measure-tooltip';
  };

  const destroy = () => {
    for (const el of allEls) el.remove();
  };

  return { showCrosshair, showTextInfo, showSelection, showHighlight, hide, destroy };
};
