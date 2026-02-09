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
    tooltip.style.left = `${rect.left}px`;

    const tooltipAbove = rect.top > 30;
    if (tooltipAbove) {
      tooltip.style.top = `${rect.top - 26}px`;
    } else {
      tooltip.style.top = `${rect.bottom + 6}px`;
    }
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
