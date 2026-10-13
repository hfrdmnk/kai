import { getDirectText } from '../core/text.ts';
import { elementLabel } from '../core/selector.ts';

const GAP = 4;

type ShowOptions = {
  /** > 1 adds `×N` to the tooltip: the selector matches that many elements, all changed by an adjustment */
  matches?: number;
  /** Hug the element with a thin outline and its own radius, leaving the space around it to drag-to-adjust drawings */
  exact?: boolean;
  /** Leave the tooltip out, e.g. mid-drag, when the HUD already says what's changing */
  tooltip?: boolean;
};

export const createOverlay = (shadowRoot: ShadowRoot) => {
  const boxes: HTMLElement[] = [];
  let current: Element | null = null;
  let currentOptions: ShowOptions = {};

  const tooltip = document.createElement('div');
  tooltip.className = 'kai-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.style.display = 'none';
  shadowRoot.appendChild(tooltip);

  const getBox = (i: number): HTMLElement => {
    while (boxes.length <= i) {
      const box = document.createElement('div');
      box.className = 'kai-overlay';
      box.setAttribute('aria-hidden', 'true');
      box.style.display = 'none';
      shadowRoot.insertBefore(box, tooltip);
      boxes.push(box);
    }
    return boxes[i];
  };

  const describeElement = (el: Element): string => {
    let label = elementLabel(el);
    const textPreview = getDirectText(el);
    if (textPreview) {
      label += `: "${textPreview}"`;
    }
    return label;
  };

  const placeBox = (box: HTMLElement, rect: DOMRect, gap: number) => {
    box.style.display = 'block';
    box.style.top = `${rect.top - gap}px`;
    box.style.left = `${rect.left - gap}px`;
    box.style.width = `${rect.width + gap * 2}px`;
    box.style.height = `${rect.height + gap * 2}px`;
  };

  const show = (el: Element, options: ShowOptions = {}) => {
    current = el;
    currentOptions = options;
    const { matches = 1, exact = false, tooltip: withTooltip = true } = options;
    const bounding = el.getBoundingClientRect();

    // Inline elements wrapping across lines get one box per line fragment
    const fragments = Array.from(el.getClientRects()).filter(r => r.width > 0 && r.height > 0);
    const rects = fragments.length > 1 ? fragments : [bounding];

    const radius = exact ? getComputedStyle(el).borderRadius : '';
    rects.forEach((rect, i) => {
      const box = getBox(i);
      placeBox(box, rect, exact ? 0 : GAP);
      box.toggleAttribute('data-exact', exact);
      box.style.borderRadius = radius;
    });
    for (let i = rects.length; i < boxes.length; i++) {
      boxes[i].style.display = 'none';
    }

    if (!withTooltip) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.textContent = describeElement(el);
    if (matches > 1) {
      const count = document.createElement('span');
      count.className = 'kai-tooltip-count';
      count.textContent = ` ×${matches}`;
      tooltip.appendChild(count);
    }
    tooltip.style.display = 'block';

    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const pad = 4;

    const left = Math.max(pad, Math.min(bounding.left, vw - tw - pad));

    let top: number;
    if (bounding.top > th + pad + 2) {
      top = bounding.top - th - 2;
    } else if (bounding.bottom + th + 6 < vh - pad) {
      top = bounding.bottom + 6;
    } else {
      top = pad;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hide = () => {
    current = null;
    for (const box of boxes) box.style.display = 'none';
    tooltip.style.display = 'none';
  };

  /** Re-measure the currently shown element, e.g. after scroll or layout changes. */
  const refresh = () => {
    if (!current) return;
    if (!current.isConnected) {
      hide();
      return;
    }
    show(current, currentOptions);
  };

  const destroy = () => {
    for (const box of boxes) box.remove();
    tooltip.remove();
  };

  return { show, hide, refresh, destroy };
};
