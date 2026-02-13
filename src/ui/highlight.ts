export const createOverlay = (shadowRoot: ShadowRoot) => {
  const overlay = document.createElement('div');
  overlay.className = 'kai-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';

  const tooltip = document.createElement('div');
  tooltip.className = 'kai-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.style.display = 'none';

  shadowRoot.appendChild(overlay);
  shadowRoot.appendChild(tooltip);

  const describeElement = (el: Element): string => {
    let label = el.tagName.toLowerCase();
    if (el.id) label += `#${el.id}`;
    const classes = Array.from(el.classList).filter(c => !c.startsWith('kai-')).slice(0, 3);
    if (classes.length) label += `.${classes.join('.')}`;

    const fullText = el.textContent?.trim() ?? '';
    if (fullText) {
      const preview = fullText.slice(0, 40);
      const ellipsis = fullText.length > 40 ? '…' : '';
      label += `: "${preview}${ellipsis}"`;
    }
    return label;
  };

  const show = (el: Element) => {
    const rect = el.getBoundingClientRect();

    const gap = 4;
    overlay.style.display = 'block';
    overlay.style.top = `${rect.top - gap}px`;
    overlay.style.left = `${rect.left - gap}px`;
    overlay.style.width = `${rect.width + gap * 2}px`;
    overlay.style.height = `${rect.height + gap * 2}px`;

    tooltip.textContent = describeElement(el);
    tooltip.style.display = 'block';

    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 4;

    let left = Math.max(pad, Math.min(rect.left, vw - tw - pad));

    let top: number;
    if (rect.top > th + pad + 2) {
      top = rect.top - th - 2;
    } else if (rect.bottom + th + 6 < vh - pad) {
      top = rect.bottom + 6;
    } else {
      top = pad;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hide = () => {
    overlay.style.display = 'none';
    tooltip.style.display = 'none';
  };

  const destroy = () => {
    overlay.remove();
    tooltip.remove();
  };

  return { show, hide, destroy };
};
