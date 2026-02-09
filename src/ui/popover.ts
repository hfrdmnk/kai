import { attachAutocomplete } from './autocomplete.ts';

const POPOVER_WIDTH = 320;
const EDGE_GAP = 12;

type PopoverOptions = {
  element: Element;
  selector: string;
  path: string;
  styles: Record<string, string>;
  onSubmit: (comment: string) => void;
  onClose: () => void;
};

const describeElement = (el: Element): string => {
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim().slice(0, 40) || '';
  return text ? `${tag}: "${text}${el.textContent!.trim().length > 40 ? '…' : ''}"` : tag;
};

const positionPopover = (popover: HTMLElement, targetRect: DOMRect) => {
  const spaceBelow = window.innerHeight - targetRect.bottom;
  const spaceAbove = targetRect.top;

  let top: number;
  if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
    // Place below
    top = targetRect.bottom + 8;
  } else {
    // Place above
    top = targetRect.top - 8;
    // We'll measure after appending, but estimate for now
    requestAnimationFrame(() => {
      const h = popover.getBoundingClientRect().height;
      popover.style.top = `${targetRect.top - h - 8}px`;
    });
  }

  // Horizontal: left-aligned with element, clamped to viewport
  let left = targetRect.left;
  left = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - POPOVER_WIDTH - EDGE_GAP));

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
};

export const createPopover = (
  shadowRoot: ShadowRoot,
  opts: PopoverOptions,
) => {
  const popover = document.createElement('div');
  popover.className = 'kai-popover';

  // Body
  const body = document.createElement('div');
  body.className = 'kai-popover-body';

  // Breadcrumb path
  const pathEl = document.createElement('div');
  pathEl.className = 'kai-popover-path';
  pathEl.textContent = opts.path;

  // Element description
  const descEl = document.createElement('div');
  descEl.className = 'kai-popover-desc';
  descEl.textContent = describeElement(opts.element);

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'kai-popover-textarea';
  textarea.placeholder = 'What should change?';

  body.appendChild(pathEl);
  body.appendChild(descEl);
  body.appendChild(textarea);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'kai-popover-footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'kai-btn kai-btn--ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', opts.onClose);

  const addBtn = document.createElement('button');
  addBtn.className = 'kai-btn kai-btn--primary';
  addBtn.textContent = 'Add';

  const submit = () => {
    const comment = textarea.value.trim();
    if (!comment) return;
    opts.onSubmit(comment);
  };

  addBtn.addEventListener('click', submit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  });

  footer.appendChild(cancelBtn);
  footer.appendChild(addBtn);

  popover.appendChild(body);
  popover.appendChild(footer);
  shadowRoot.appendChild(popover);

  // Position
  const rect = opts.element.getBoundingClientRect();
  positionPopover(popover, rect);

  // Focus textarea
  requestAnimationFrame(() => textarea.focus());

  // Autocomplete
  const ac = attachAutocomplete(textarea, shadowRoot, () => opts.element);

  // Escape to close (if autocomplete not open)
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !shadowRoot.querySelector('.kai-autocomplete')) {
      opts.onClose();
    }
  };
  popover.addEventListener('keydown', onKeydown);

  const destroy = () => {
    ac.destroy();
    popover.remove();
  };

  return { destroy };
};
