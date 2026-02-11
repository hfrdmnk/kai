import type { FabCorner } from '../types.ts';
import { iconKai, iconCopy, iconTrash, iconCheck, iconHelp } from '../icons.ts';

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

  // Align actions to top/bottom edge based on corner
  if (corner === 'top-left' || corner === 'top-right') {
    actionsEl.style.top = `${rect.top}px`;
    actionsEl.style.bottom = 'auto';
  } else {
    actionsEl.style.top = 'auto';
    actionsEl.style.bottom = `${window.innerHeight - rect.bottom}px`;
  }

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

const SPRING = 'linear(0, 0.008 1.1%, 0.034 2.3%, 0.134 4.9%, 0.264 7.3%, 0.683 14.3%, 0.797 16.5%, 0.89 18.6%, 0.967 20.7%, 1.027 22.8%, 1.073 25%, 1.104 27.3%, 1.123 30.6%, 1.119 34.3%, 1.018 49.5%, 0.988 58.6%, 0.985 65.2%, 1 84.5%, 1)';

const SWAP = {
  shrinkMs:  120,
  expandMs:  400,
  blurPx:    4,
  scaleDown: 0.3,
};

const animateStateSwap = async (
  el: HTMLElement,
  icon: string,
  accent = '',
) => {
  const svg = el.querySelector('svg');
  if (svg) {
    await svg.animate(
      [
        { transform: 'scale(1)', filter: 'blur(0)' },
        { transform: `scale(${SWAP.scaleDown})`, filter: `blur(${SWAP.blurPx}px)` },
      ],
      { duration: SWAP.shrinkMs, easing: 'ease-in', fill: 'forwards' },
    ).finished;
  }

  el.replaceChildren();
  setIcon(el, icon);
  el.style.background = accent;
  el.style.color = accent ? 'var(--white)' : '';
  el.style.borderColor = accent;

  const newSvg = el.querySelector('svg');
  if (newSvg) {
    newSvg.animate(
      [
        { transform: `scale(${SWAP.scaleDown})`, filter: `blur(${SWAP.blurPx}px)` },
        { transform: 'scale(1)', filter: 'blur(0)' },
      ],
      { duration: SWAP.expandMs, easing: SPRING },
    );
  }
};

const DRAG_THRESHOLD = 5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const computeDragRadii = (cx: number, cy: number): string => {
  const nx = clamp(cx / window.innerWidth, 0, 1);
  const ny = clamp(cy / window.innerHeight, 0, 1);

  const wTL = nx * (1 - ny);
  const wTR = (1 - nx) * (1 - ny);
  const wBR = (1 - nx) * ny;
  const wBL = nx * ny;

  const r = (w: number) => `${22 - 18 * w * w}px`;
  return `${r(wTL)} ${r(wTR)} ${r(wBR)} ${r(wBL)}`;
};

export const createFab = (
  shadowRoot: ShadowRoot,
  opts: FabOptions,
) => {
  let corner = opts.initialCorner;
  let active = false;
  let fabAnim: Animation | null = null;
  let badgeHidden = false;

  let actionAnims: Animation[] = [];

  // ── FAB — single 44×44 button ──
  const fab = document.createElement('button');
  fab.className = 'kai-fab';
  fab.setAttribute('data-corner', corner);
  fab.setAttribute('aria-label', 'Toggle UI annotator');
  fab.setAttribute('aria-pressed', 'false');
  fab.setAttribute('aria-expanded', 'false');
  setIcon(fab, iconKai);

  // Badge
  const badge = document.createElement('span');
  badge.className = 'kai-fab-badge';
  badge.style.display = 'none';

  fab.appendChild(badge);

  // ── Action buttons ──
  const actions = document.createElement('div');
  actions.className = 'kai-fab-actions';
  actions.style.display = 'none';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'kai-fab-action';
  copyBtn.setAttribute('aria-label', 'Copy as Markdown');
  setIcon(copyBtn, iconCopy);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'kai-fab-action';
  clearBtn.setAttribute('aria-label', 'Clear all');
  setIcon(clearBtn, iconTrash);

  // ── Tooltips for action buttons ──
  const tooltip = document.createElement('div');
  tooltip.className = 'kai-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.fontFamily = 'var(--font-sans)';
  shadowRoot.appendChild(tooltip);

  const showTooltip = (btn: HTMLButtonElement, label: string) => {
    tooltip.textContent = label;
    tooltip.style.display = '';
    const rect = btn.getBoundingClientRect();
    const isTop = corner === 'top-left' || corner === 'top-right';
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.transform = 'translateX(-50%)';
    if (isTop) {
      tooltip.style.top = `${rect.bottom + 6}px`;
      tooltip.style.bottom = 'auto';
    } else {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = `${window.innerHeight - rect.top + 6}px`;
    }
  };

  const hideTooltip = () => {
    tooltip.style.display = 'none';
  };

  copyBtn.addEventListener('mouseenter', () => showTooltip(copyBtn, 'Copy as Markdown'));
  copyBtn.addEventListener('mouseleave', hideTooltip);
  clearBtn.addEventListener('mouseenter', () => showTooltip(clearBtn, 'Clear all'));
  clearBtn.addEventListener('mouseleave', hideTooltip);

  actions.appendChild(copyBtn);
  actions.appendChild(clearBtn);

  shadowRoot.appendChild(fab);
  shadowRoot.appendChild(actions);

  // ── Click/drag disambiguation via pointer events ──
  let dragging = false;
  let pointerDown = false;
  let startX = 0;
  let startY = 0;
  let fabStartX = 0;
  let fabStartY = 0;

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    pointerDown = true;
    dragging = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = fab.getBoundingClientRect();
    fabStartX = rect.left;
    fabStartY = rect.top;

    fab.setPointerCapture(e.pointerId);

    fabAnim?.cancel();
    fabAnim = fab.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }],
      { duration: 120, easing: 'ease-out', fill: 'forwards' },
    );
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!dragging && dist > DRAG_THRESHOLD) {
      dragging = true;
      fabAnim?.cancel();
      // Switch to fixed positioning for free movement
      fab.style.position = 'fixed';
      fab.style.left = `${fabStartX}px`;
      fab.style.top = `${fabStartY}px`;
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      fab.classList.add('kai-fab--dragging');

      // Hide badge with scale animation
      if (badge.style.display !== 'none' && !badgeHidden) {
        badgeHidden = true;
        badge.animate(
          [{ scale: '1' }, { scale: '0' }],
          { duration: 200, easing: 'ease-out', fill: 'forwards' },
        );
        fab.classList.remove('kai-fab--has-badge');
      }

      fab.style.borderRadius = computeDragRadii(fabStartX + 22, fabStartY + 22);
    }

    if (dragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 44, fabStartX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 44, fabStartY + dy));
      fab.style.left = `${newX}px`;
      fab.style.top = `${newY}px`;
      fab.style.borderRadius = computeDragRadii(newX + 22, newY + 22);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!pointerDown) return;
    pointerDown = false;
    fab.classList.remove('kai-fab--dragging');

    if (dragging) {
      dragging = false;
      const newCorner = snapToCorner(e.clientX, e.clientY);

      // FLIP: capture current position
      const fromLeft = parseFloat(fab.style.left);
      const fromTop = parseFloat(fab.style.top);
      const fromRadius = fab.style.borderRadius;

      // Clear inline styles — CSS takes over immediately
      fab.style.left = '';
      fab.style.top = '';
      fab.style.right = '';
      fab.style.bottom = '';
      fab.style.position = '';
      fab.style.borderRadius = '';

      corner = newCorner;
      fab.setAttribute('data-corner', corner);
      opts.onCornerChange(corner);

      if (active) {
        positionActions(actions, fab, corner);
      }

      // FLIP: measure CSS target
      // Temporarily apply badge class so scoop corner-shape radius is included in target
      const hasBadge = badge.style.display !== 'none';
      if (hasBadge) fab.classList.add('kai-fab--has-badge');
      const targetRect = fab.getBoundingClientRect();
      const targetRadius = getComputedStyle(fab).borderRadius;
      if (hasBadge) fab.classList.remove('kai-fab--has-badge');
      const flipDx = fromLeft - targetRect.left;
      const flipDy = fromTop - targetRect.top;

      fabAnim?.cancel();
      fabAnim = fab.animate(
        [
          { transform: `translate(${flipDx}px, ${flipDy}px) scale(0.95)`, borderRadius: fromRadius },
          { transform: 'translate(0, 0) scale(1)', borderRadius: targetRadius },
        ],
        { duration: 600, easing: SPRING },
      );
      setTimeout(() => {
        badgeHidden = false;
        if (badge.style.display !== 'none') {
          fab.classList.add('kai-fab--has-badge');
          badge.animate(
            [{ scale: '0' }, { scale: '1' }],
            { duration: 400, easing: SPRING, fill: 'forwards' },
          );
        }
      }, 200);
    } else {
      // Click — toggle
      opts.onToggle();
      fabAnim?.cancel();
      fabAnim = fab.animate(
        [{ transform: 'scale(0.9)' }, { transform: 'scale(1)' }],
        { duration: 600, easing: SPRING },
      );
    }
  };

  if (supportsAnchor) {
    fab.addEventListener('pointerdown', onPointerDown);
    fab.addEventListener('pointermove', onPointerMove);
    fab.addEventListener('pointerup', onPointerUp);
  } else {
    // No anchor support — just handle click + press effect
    fab.addEventListener('pointerdown', () => {
      fabAnim?.cancel();
      fabAnim = fab.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }],
        { duration: 120, easing: 'ease-out', fill: 'forwards' },
      );
    });
    fab.addEventListener('pointerup', () => {
      fabAnim?.cancel();
      fabAnim = fab.animate(
        [{ transform: 'scale(0.9)' }, { transform: 'scale(1)' }],
        { duration: 600, easing: SPRING },
      );
    });
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onToggle();
    });
  }

  // ── Aria-live region for copy confirmation ──
  const copyStatus = document.createElement('span');
  copyStatus.setAttribute('aria-live', 'polite');
  copyStatus.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
  shadowRoot.appendChild(copyStatus);

  let copyTimer: ReturnType<typeof setTimeout> | null = null;
  const resetCopy = () => {
    animateStateSwap(copyBtn, iconCopy);
    copyTimer = null;
  };

  const confirmCopy = () => {
    if (copyTimer) clearTimeout(copyTimer);
    animateStateSwap(copyBtn, iconCheck, 'var(--color-success)');
    copyStatus.textContent = 'Copied';
    copyTimer = setTimeout(() => {
      resetCopy();
      copyStatus.textContent = '';
    }, 2000);
  };

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    opts.onCopyMarkdown();
  });

  let clearArmed = false;
  let clearTimer: ReturnType<typeof setTimeout> | null = null;
  const resetClear = () => {
    clearArmed = false;
    animateStateSwap(clearBtn, iconTrash);
    clearTimer = null;
  };
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (clearArmed) {
      if (clearTimer) clearTimeout(clearTimer);
      resetClear();
      opts.onClearAll();
    } else {
      clearArmed = true;
      animateStateSwap(clearBtn, iconHelp, 'var(--color-danger)');
      clearTimer = setTimeout(resetClear, 3000);
    }
  });

  // ── API ──
  const updateBadge = (n: number) => {
    if (n > 0) {
      badge.textContent = String(n);
      badge.style.display = 'flex';
      if (!badgeHidden) fab.classList.add('kai-fab--has-badge');
    } else {
      badge.style.display = 'none';
      badgeHidden = false;
      fab.classList.remove('kai-fab--has-badge');
    }
  };

  const isRightCorner = () =>
    corner === 'bottom-right' || corner === 'top-right';

  const animateActionsIn = () => {
    actionAnims.forEach(a => a.cancel());
    actionAnims = [];

    actions.style.display = 'flex';
    requestAnimationFrame(() => {
      positionActions(actions, fab, corner);
      const tx = isRightCorner() ? '12px' : '-12px';
      [copyBtn, clearBtn].forEach((btn, i) => {
        const anim = btn.animate(
          [
            { transform: `translateX(${tx}) scale(0.8)`, opacity: 0 },
            { transform: 'translateX(0) scale(1)', opacity: 1 },
          ],
          { duration: 400, easing: SPRING, delay: i * 50, fill: 'both' },
        );
        actionAnims.push(anim);
      });
    });
  };

  const animateActionsOut = () => {
    hideTooltip();
    actionAnims.forEach(a => a.cancel());
    actionAnims = [];

    const tx = isRightCorner() ? '8px' : '-8px';
    const anims = [copyBtn, clearBtn].map((btn, i) => {
      const anim = btn.animate(
        [
          { transform: 'translateX(0) scale(1)', opacity: 1 },
          { transform: `translateX(${tx}) scale(0.8)`, opacity: 0 },
        ],
        { duration: 150, easing: 'ease-in', delay: i * 30, fill: 'forwards' },
      );
      return anim;
    });
    actionAnims = anims;

    Promise.all(anims.map(a => a.finished)).then(() => {
      actions.style.display = 'none';
      anims.forEach(a => a.cancel());
      actionAnims = [];
    });
  };

  const setActive = (isActive: boolean) => {
    active = isActive;
    fab.setAttribute('aria-pressed', String(isActive));
    fab.setAttribute('aria-expanded', String(isActive));
    if (isActive) {
      fab.classList.add('kai-fab--active');
      animateActionsIn();
    } else {
      fab.classList.remove('kai-fab--active');
      animateActionsOut();
    }
  };

  const updateActionStates = (count: number) => {
    const disabled = count === 0;
    copyBtn.disabled = disabled;
    clearBtn.disabled = disabled;
  };

  const destroy = () => {
    fab.remove();
    actions.remove();
    tooltip.remove();
    copyStatus.remove();
  };

  return { updateBadge, setActive, updateActionStates, confirmCopy, destroy };
};
