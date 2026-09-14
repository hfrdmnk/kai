import { getDirectText } from '../core/text.ts';

const GAP = 4;

export const createOverlay = (shadowRoot: ShadowRoot) => {
  const boxes: HTMLElement[] = [];
  let current: Element | null = null;

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
    let label = el.tagName.toLowerCase();
    if (el.id) label += `#${el.id}`;
    const classes = Array.from(el.classList).filter(c => !c.startsWith('kai-')).slice(0, 3);
    if (classes.length) label += `.${classes.join('.')}`;

    const textPreview = getDirectText(el);
    if (textPreview) {
      label += `: "${textPreview}"`;
    }
    return label;
  };

  const placeBox = (box: HTMLElement, rect: DOMRect) => {
    box.style.display = 'block';
    box.style.top = `${rect.top - GAP}px`;
    box.style.left = `${rect.left - GAP}px`;
    box.style.width = `${rect.width + GAP * 2}px`;
    box.style.height = `${rect.height + GAP * 2}px`;
  };

  const show = (el: Element) => {
    current = el;
    const bounding = el.getBoundingClientRect();

    // Inline elements wrapping across lines get one box per line fragment
    const fragments = Array.from(el.getClientRects()).filter(r => r.width > 0 && r.height > 0);
    const rects = fragments.length > 1 ? fragments : [bounding];

    rects.forEach((rect, i) => placeBox(getBox(i), rect));
    for (let i = rects.length; i < boxes.length; i++) {
      boxes[i].style.display = 'none';
    }

    tooltip.textContent = describeElement(el);
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
    show(current);
  };

  const destroy = () => {
    for (const box of boxes) box.remove();
    tooltip.remove();
  };

  return { show, hide, refresh, destroy };
};
