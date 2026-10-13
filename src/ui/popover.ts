import type { StyleEdit } from '../types.ts';
import { attachAutocomplete } from './autocomplete.ts';
import { getDirectText } from '../core/text.ts';
import { describeEdit } from '../core/adjust.ts';
import { createIcon, iconClose } from '../icons.ts';

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
  /** Drag-to-adjust changes, listed below the note, one row each */
  edits?: StyleEdit[];
  /** A row's remove button; the row goes, the page reverts */
  onRemoveEdit?: (property: string) => void;
};

/**
 * The annotation's changes, one line per edit: `padding-right  24px → 32px  pr-8`. Hover or focus
 * shows a remove button at the row's end, over a fade.
 */
const createEditList = (edits: StyleEdit[], onRemove: (property: string) => void, onEmpty: () => void): HTMLElement => {
  const list = document.createElement('ul');
  list.className = 'kai-popover-edits';
  list.setAttribute('aria-label', 'Changes');
  // Focus lands here after a pointer removal, rather than on the next row's button
  list.tabIndex = -1;
  list.addEventListener('pointermove', () => list.removeAttribute('data-settling'));
  for (const edit of edits) {
    const { property, from, to, snap } = describeEdit(edit);
    const row = document.createElement('li');
    row.className = 'kai-popover-edit';
    const text = document.createElement('span');
    text.className = 'kai-popover-edit-text';
    const part = (className: string, value: string) => {
      const el = document.createElement('span');
      el.className = className;
      el.textContent = value;
      text.appendChild(el);
    };
    part('kai-popover-edit-prop', property);
    part('kai-popover-edit-values', `${from} → ${to}`);
    if (snap) part('kai-popover-edit-snap', snap);
    // The full line, for one cut short by the popover's width
    row.title = [property, `${from} → ${to}`, snap].filter(Boolean).join('  ');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'kai-popover-edit-remove';
    remove.setAttribute('aria-label', `Remove ${property} change`);
    remove.appendChild(createIcon(iconClose));
    remove.addEventListener('click', (e) => {
      // Enter, Space or Delete (a click with no pointer detail) keeps the keyboard in the list
      const byKeyboard = e.detail === 0;
      const next = (row.nextElementSibling ?? row.previousElementSibling)?.querySelector('button');
      row.remove();
      onRemove(property);
      if (!list.children.length) {
        list.remove();
        onEmpty();
      } else if (byKeyboard && next) {
        next.focus();
      } else {
        // The next row has moved under the pointer: its button waits for the pointer to move, so a
        // double click removes one change, not two
        list.setAttribute('data-settling', '');
        list.focus({ preventScroll: true });
      }
    });
    // Delete / Backspace on a focused remove button remove that change, like a click
    remove.addEventListener('keydown', (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      e.preventDefault();
      remove.click();
    });
    row.append(text, remove);
    list.appendChild(row);
  }
  return list;
};

const positionPopover = (popover: HTMLElement, targetRect: DOMRect, anchorRect?: DOMRect) => {
  const ref = anchorRect ?? targetRect;
  const gap = anchorRect ? 4 : 8;

  const spaceBelow = document.documentElement.clientHeight - ref.bottom;
  const spaceAbove = ref.top;
  const vh = document.documentElement.clientHeight;
  const below = spaceBelow >= 200 || spaceBelow >= spaceAbove;

  const top = below ? ref.bottom + gap : ref.top - gap;

  requestAnimationFrame(() => {
    const h = popover.getBoundingClientRect().height;
    const raw = below ? top : ref.top - h - gap;
    popover.style.top = `${Math.max(EDGE_GAP, Math.min(raw, vh - h - EDGE_GAP))}px`;
  });

  const left = Math.max(EDGE_GAP, Math.min(ref.left, document.documentElement.clientWidth - POPOVER_WIDTH - EDGE_GAP));

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

  body.appendChild(pathEl);
  body.appendChild(textarea);
  if (opts.edits?.length && opts.onRemoveEdit) {
    body.appendChild(createEditList(opts.edits, opts.onRemoveEdit, () => textarea.focus()));
  }
  body.appendChild(descEl);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'kai-popover-footer';

  const submit = () => {
    const comment = textarea.value.trim();
    // Saving an emptied comment deletes an existing annotation
    if (!comment && !isEdit) return;
    opts.onSubmit(comment);
  };

  if (isEdit && opts.onDelete) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'kai-btn kai-btn--danger';
    deleteBtn.textContent = 'Delete';

    let deleteArmed = false;
    let deleteTimer: ReturnType<typeof setTimeout> | null = null;
    const resetDelete = () => {
      deleteArmed = false;
      deleteBtn.textContent = 'Delete';
      deleteBtn.removeAttribute('data-armed');
      deleteTimer = null;
    };
    deleteBtn.addEventListener('click', () => {
      if (deleteArmed) {
        if (deleteTimer) clearTimeout(deleteTimer);
        opts.onDelete!();
      } else {
        deleteArmed = true;
        deleteBtn.textContent = 'Sure?';
        deleteBtn.setAttribute('data-armed', '');
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

  // Close on click outside. Listens on window so it runs before the
  // annotator's document-level capture handler swallows page pointerdowns.
  const onPointerDown = (e: PointerEvent) => {
    if (e.composedPath().includes(shadowRoot.host)) return;
    opts.onClose();
  };
  window.addEventListener('pointerdown', onPointerDown, { capture: true });

  // Close on resize
  const onResize = () => opts.onClose();
  window.addEventListener('resize', onResize);

  // Store prior focus for restoration
  const previousFocus = shadowRoot.activeElement ?? document.activeElement;

  // Focus textarea
  requestAnimationFrame(() => textarea.focus());

  // Autocomplete
  const ac = attachAutocomplete(textarea, shadowRoot, () => opts.element);

  const handleEscape = () => {
    if (shadowRoot.querySelector('.kai-autocomplete')) ac.close();
    else opts.onClose();
  };

  // Escape to close (if autocomplete not open)
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !shadowRoot.querySelector('.kai-autocomplete')) {
      // Stop here, or the document-level Escape handler sees "no popover" and deactivates the annotator
      e.stopPropagation();
      opts.onClose();
    }
  };
  popover.addEventListener('keydown', onKeydown);

  const destroy = () => {
    window.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('pointerdown', onPointerDown, { capture: true });
    window.removeEventListener('resize', onResize);
    ac.destroy();
    popover.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  };

  return {
    destroy,
    handleEscape,
    /** The note as typed, saved or not */
    draft: () => textarea.value.trim(),
    /** Whether focus is in the popover (its note, a remove button, a footer button) */
    hasFocus: () => popover.contains(shadowRoot.activeElement),
  };
};
