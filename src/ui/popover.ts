import { attachAutocomplete } from './autocomplete.ts';
import { getDirectText } from '../core/text.ts';

const POPOVER_WIDTH = 320;
const EDGE_GAP = 12;

type PopoverOptions = {
  element: Element;
  selector: string;
  path: string;
  styles: Record<string, string>;
  onSubmit: (comment: string) => void;
  onClose: () => void;
  existingComment?: string;
  onDelete?: () => void;
  anchorRect?: DOMRect;
};

const positionPopover = (popover: HTMLElement, targetRect: DOMRect, anchorRect?: DOMRect) => {
  const ref = anchorRect ?? targetRect;
  const gap = anchorRect ? 4 : 8;

  const spaceBelow = window.innerHeight - ref.bottom;
  const spaceAbove = ref.top;

  let top: number;
  if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
    top = ref.bottom + gap;
  } else {
    top = ref.top - gap;
    requestAnimationFrame(() => {
      const h = popover.getBoundingClientRect().height;
      popover.style.top = `${ref.top - h - gap}px`;
    });
  }

  let left = ref.left;
  left = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - POPOVER_WIDTH - EDGE_GAP));

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
};

export const createPopover = (
  shadowRoot: ShadowRoot,
  opts: PopoverOptions,
) => {
  const isEdit = opts.existingComment != null;

  const popover = document.createElement('div');
  popover.className = 'kai-popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', isEdit ? 'Edit annotation' : 'Annotate element');

  // Body
  const body = document.createElement('div');
  body.className = 'kai-popover-body';

  // Breadcrumb path
  const pathEl = document.createElement('div');
  pathEl.className = 'kai-popover-path';
  const segments = opts.path.split(' › ');
  segments.forEach((seg, i) => {
    if (i > 0) {
      pathEl.appendChild(document.createElement('wbr'));
      pathEl.appendChild(document.createTextNode(' › '));
    }
    const parts = seg.split(/(?=[.#])/);
    parts.forEach((part, j) => {
      if (j > 0) pathEl.appendChild(document.createElement('wbr'));
      pathEl.appendChild(document.createTextNode(part));
    });
  });

  // Element description
  const descEl = document.createElement('div');
  descEl.className = 'kai-popover-desc';
  const text = getDirectText(opts.element);
  if (text) {
    descEl.textContent = `"${text}"`;
  } else {
    descEl.style.display = 'none';
  }

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'kai-popover-textarea';
  textarea.placeholder = 'What should change?';
  textarea.setAttribute('aria-label', 'Annotation comment');
  if (isEdit) textarea.value = opts.existingComment!;

  body.appendChild(textarea);
  body.appendChild(pathEl);
  body.appendChild(descEl);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'kai-popover-footer';

  const submit = () => {
    const comment = textarea.value.trim();
    if (!comment) return;
    opts.onSubmit(comment);
  };

  if (isEdit && opts.onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'kai-btn kai-btn--secondary';
    deleteBtn.textContent = 'Delete';

    let deleteArmed = false;
    let deleteTimer: ReturnType<typeof setTimeout> | null = null;
    const resetDelete = () => {
      deleteArmed = false;
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.background = '';
      deleteBtn.style.color = '';
      deleteBtn.style.borderColor = '';
      deleteTimer = null;
    };
    deleteBtn.addEventListener('click', () => {
      if (deleteArmed) {
        if (deleteTimer) clearTimeout(deleteTimer);
        opts.onDelete!();
      } else {
        deleteArmed = true;
        deleteBtn.textContent = 'Sure?';
        deleteBtn.style.background = 'var(--color-danger)';
        deleteBtn.style.color = 'var(--white)';
        deleteBtn.style.borderColor = 'var(--color-danger)';
        deleteTimer = setTimeout(resetDelete, 3000);
      }
    });

    const spacer = document.createElement('div');
    spacer.style.flex = '1';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kai-btn kai-btn--secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', opts.onClose);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'kai-btn kai-btn--primary';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', submit);

    footer.appendChild(deleteBtn);
    footer.appendChild(spacer);
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
  } else {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kai-btn kai-btn--secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', opts.onClose);

    const addBtn = document.createElement('button');
    addBtn.className = 'kai-btn kai-btn--primary';
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', submit);

    footer.appendChild(cancelBtn);
    footer.appendChild(addBtn);
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  });

  popover.appendChild(body);
  popover.appendChild(footer);
  shadowRoot.appendChild(popover);

  // Position
  const rect = opts.element.getBoundingClientRect();
  positionPopover(popover, rect, opts.anchorRect);

  // Close on scroll (except internal shadow DOM scrolls like autocomplete/textarea)
  const onScroll = (e: Event) => {
    if (e.target === shadowRoot.host) return;
    opts.onClose();
  };
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // Close on click outside
  const onPointerDown = (e: PointerEvent) => {
    if (e.composedPath().includes(shadowRoot.host)) return;
    opts.onClose();
  };
  document.addEventListener('pointerdown', onPointerDown, { capture: true });

  // Close on resize
  const onResize = () => opts.onClose();
  window.addEventListener('resize', onResize);

  // Store prior focus for restoration
  const previousFocus = shadowRoot.activeElement ?? document.activeElement;

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
    window.removeEventListener('scroll', onScroll, { capture: true });
    document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    window.removeEventListener('resize', onResize);
    ac.destroy();
    popover.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  };

  return { destroy };
};
