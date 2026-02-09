import type { FabCorner } from '../types.ts';
import { iconKai, iconDrag, iconCopy, iconTrash } from '../icons.ts';

const parser = new DOMParser();

const setIcon = (el: HTMLElement, svg: string) => {
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  el.appendChild(document.importNode(doc.documentElement, true));
};

const supportsAnchor = typeof CSS !== 'undefined' &&
  CSS.supports('anchor-name: --a');

type FabOptions = {
  initialCorner: FabCorner;
  onToggle: () => void;
  onCopyMarkdown: () => void;
  onClearAll: () => void;
  onCornerChange: (corner: FabCorner) => void;
};

const snapToCorner = (x: number, y: number): FabCorner => {
  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;
  const isRight = x >= midX;
  const isBottom = y >= midY;
  if (isBottom && isRight) return 'bottom-right';
  if (isBottom && !isRight) return 'bottom-left';
  if (!isBottom && isRight) return 'top-right';
  return 'top-left';
};

const positionActions = (
  actionsEl: HTMLElement,
  fabEl: HTMLElement,
  corner: FabCorner,
) => {
  const rect = fabEl.getBoundingClientRect();
  const gap = 8;

  // Vertically center actions with FAB
  const actionsHeight = 44;
  const top = rect.top + (rect.height - actionsHeight) / 2;
  actionsEl.style.top = `${top}px`;

  if (corner === 'bottom-right' || corner === 'top-right') {
    // Extend left — anchor from right edge
    actionsEl.style.left = 'auto';
    actionsEl.style.right = `${window.innerWidth - rect.left + gap}px`;
    actionsEl.style.flexDirection = 'row-reverse';
    actionsEl.style.transformOrigin = 'right center';
  } else {
    // Extend right
    actionsEl.style.left = `${rect.right + gap}px`;
    actionsEl.style.right = 'auto';
    actionsEl.style.flexDirection = 'row';
    actionsEl.style.transformOrigin = 'left center';
  }
};

export const createFab = (
  shadowRoot: ShadowRoot,
  opts: FabOptions,
) => {
  let corner = opts.initialCorner;
  let active = false;

  // ── FAB container ──
  const fab = document.createElement('div');
  fab.className = 'kai-fab';
  fab.setAttribute('data-corner', corner);
  fab.setAttribute('role', 'toolbar');
  fab.setAttribute('aria-label', 'Annotator controls');

  // Drag handle
  const dragZone = document.createElement('button');
  dragZone.className = 'kai-fab-drag';
  dragZone.setAttribute('aria-label', 'Drag to reposition');
  setIcon(dragZone, iconDrag);

  // Toggle button
  const toggleZone = document.createElement('button');
  toggleZone.className = 'kai-fab-toggle';
  toggleZone.setAttribute('aria-label', 'Toggle UI annotator');
  toggleZone.setAttribute('aria-pressed', 'false');
  toggleZone.setAttribute('aria-expanded', 'false');
  setIcon(toggleZone, iconKai);

  // Badge
  const badge = document.createElement('span');
  badge.className = 'kai-fab-badge';
  badge.style.display = 'none';

  fab.appendChild(dragZone);
  fab.appendChild(toggleZone);
  fab.appendChild(badge);

  // ── Action buttons ──
  const actions = document.createElement('div');
  actions.className = 'kai-fab-actions';
  actions.style.display = 'none';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'kai-fab-action';
  copyBtn.setAttribute('aria-label', 'Copy Markdown');
  setIcon(copyBtn, iconCopy);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'kai-fab-action';
  clearBtn.setAttribute('aria-label', 'Clear all annotations');
  setIcon(clearBtn, iconTrash);

  actions.appendChild(copyBtn);
  actions.appendChild(clearBtn);

  shadowRoot.appendChild(fab);
  shadowRoot.appendChild(actions);

  // ── Toggle ──
  toggleZone.addEventListener('click', (e) => {
    e.stopPropagation();
    opts.onToggle();
  });

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    opts.onCopyMarkdown();
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    opts.onClearAll();
  });

  // ── Drag behavior (progressive enhancement) ──
  if (supportsAnchor) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let fabStartX = 0;
    let fabStartY = 0;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = fab.getBoundingClientRect();
      fabStartX = rect.left;
      fabStartY = rect.top;

      // Switch to absolute positioning for free movement
      fab.style.position = 'fixed';
      fab.style.left = `${fabStartX}px`;
      fab.style.top = `${fabStartY}px`;
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';

      dragZone.style.cursor = 'grabbing';
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 88, fabStartX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 44, fabStartY + dy));
      fab.style.left = `${newX}px`;
      fab.style.top = `${newY}px`;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      dragZone.style.cursor = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      // Snap to nearest corner
      const centerX = e.clientX;
      const centerY = e.clientY;
      const newCorner = snapToCorner(centerX, centerY);

      // Reset inline positioning, let data-corner drive it
      fab.style.left = '';
      fab.style.top = '';
      fab.style.right = '';
      fab.style.bottom = '';
      fab.style.position = '';

      corner = newCorner;
      fab.setAttribute('data-corner', corner);
      opts.onCornerChange(corner);

      if (active) {
        positionActions(actions, fab, corner);
      }
    };

    dragZone.addEventListener('pointerdown', onPointerDown);
  } else {
    // No anchor support — hide drag handle
    dragZone.style.display = 'none';
    fab.style.width = '44px';
  }

  // ── API ──
  const updateBadge = (n: number) => {
    if (n > 0) {
      badge.textContent = String(n);
      badge.style.display = 'flex';
      fab.classList.add('kai-fab--has-badge');
    } else {
      badge.style.display = 'none';
      fab.classList.remove('kai-fab--has-badge');
    }
  };

  const setActive = (isActive: boolean) => {
    active = isActive;
    toggleZone.setAttribute('aria-pressed', String(isActive));
    toggleZone.setAttribute('aria-expanded', String(isActive));
    if (isActive) {
      fab.classList.add('kai-fab--active');
      actions.style.display = 'flex';
      // Position actions next frame after display change
      requestAnimationFrame(() => positionActions(actions, fab, corner));
    } else {
      fab.classList.remove('kai-fab--active');
      actions.style.display = 'none';
    }
  };

  const destroy = () => {
    fab.remove();
    actions.remove();
  };

  return { updateBadge, setActive, destroy };
};
