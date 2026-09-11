import type { AccentId, FabCorner, Theme } from '../types.ts';
import { iconKai, iconCopy, iconTrash, iconCheck, iconHelp, iconCursor, iconSettings } from '../icons.ts';
import { SPRING, SNAP, EASE_OUT } from '../core/easing.ts';
import { SHORTCUTS, type ShortcutAction } from '../core/platform.ts';
import { createSettingsPanel } from './settings.ts';

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
  onPickToggle: (armed: boolean) => void;
  onCornerChange: (corner: FabCorner) => void;
  onSettingsToggle: (open: boolean) => void;
  settings: {
    version: string;
    theme: Theme;
    accent: AccentId;
    onThemeChange: (theme: Theme) => void;
    onAccentChange: (accent: AccentId) => void;
  };
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
    actionsEl.style.bottom = `${document.documentElement.clientHeight - rect.bottom}px`;
  }

  if (corner === 'bottom-right' || corner === 'top-right') {
    // Extend left — anchor from right edge
    actionsEl.style.left = 'auto';
    actionsEl.style.right = `${document.documentElement.clientWidth - rect.left + gap}px`;
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

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const SETTINGS_WIDTH = 240;
const SETTINGS_EDGE_GAP = 12;

/** Centered on the settings button and clear of the taller FAB, opening away from the screen edge the FAB sits on. */
const positionSettings = (
  panelEl: HTMLElement,
  anchorEl: HTMLElement,
  fabEl: HTMLElement,
  corner: FabCorner,
) => {
  const rect = anchorEl.getBoundingClientRect();
  const fabRect = fabEl.getBoundingClientRect();
  const gap = 8;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const isTop = corner === 'top-left' || corner === 'top-right';

  if (isTop) {
    panelEl.style.top = `${Math.max(rect.bottom, fabRect.bottom) + gap}px`;
    panelEl.style.bottom = 'auto';
  } else {
    panelEl.style.top = 'auto';
    panelEl.style.bottom = `${vh - Math.min(rect.top, fabRect.top) + gap}px`;
  }

  const anchorX = rect.left + rect.width / 2;
  const left = clamp(anchorX - SETTINGS_WIDTH / 2, SETTINGS_EDGE_GAP, vw - SETTINGS_WIDTH - SETTINGS_EDGE_GAP);
  panelEl.style.left = `${left}px`;
  panelEl.style.right = 'auto';
  panelEl.style.transformOrigin = `${anchorX - left}px ${isTop ? '0' : '100%'}`;
};

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

/* The bouncy spring lands within its first quarter, so the expand needs the same 600ms the corner snap uses to read at all. */
const COLLAPSE = {
  expandMs:      600,
  appearDelayMs: 80,
  staggerMs:     60,
  collapseMs:    200,
  shrinkMs:      150,
};

const DRAG_THRESHOLD = 5;

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

  const pickBtn = document.createElement('button');
  pickBtn.className = 'kai-fab-action';
  pickBtn.setAttribute('aria-label', 'Copy selector');
  pickBtn.setAttribute('aria-pressed', 'false');
  setIcon(pickBtn, iconCursor);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'kai-fab-action';
  copyBtn.setAttribute('aria-label', 'Copy as Markdown');
  setIcon(copyBtn, iconCopy);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'kai-fab-action';
  clearBtn.setAttribute('aria-label', 'Clear all');
  setIcon(clearBtn, iconTrash);

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'kai-fab-action';
  settingsBtn.setAttribute('aria-label', 'Settings');
  settingsBtn.setAttribute('aria-expanded', 'false');
  setIcon(settingsBtn, iconSettings);

  // ── Tooltips for action buttons ──
  const tooltip = document.createElement('div');
  tooltip.className = 'kai-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.fontFamily = 'var(--font-sans)';
  shadowRoot.appendChild(tooltip);

  const showTooltip = (btn: HTMLButtonElement, label: string, key?: string) => {
    tooltip.textContent = label;
    if (key) {
      const kbd = document.createElement('span');
      kbd.className = 'kai-tooltip-kbd';
      kbd.textContent = key;
      tooltip.appendChild(kbd);
    }
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
      tooltip.style.bottom = `${document.documentElement.clientHeight - rect.top + 6}px`;
    }
  };

  const hideTooltip = () => {
    tooltip.style.display = 'none';
  };

  pickBtn.addEventListener('mouseenter', () => showTooltip(pickBtn, 'Copy selector', SHORTCUTS.pick.label));
  pickBtn.addEventListener('mouseleave', hideTooltip);
  copyBtn.addEventListener('mouseenter', () => showTooltip(copyBtn, 'Copy as Markdown', SHORTCUTS.copy.label));
  copyBtn.addEventListener('mouseleave', hideTooltip);
  clearBtn.addEventListener('mouseenter', () => showTooltip(clearBtn, 'Clear all', SHORTCUTS.clear.label));
  clearBtn.addEventListener('mouseleave', hideTooltip);
  settingsBtn.addEventListener('mouseenter', () => { if (!settingsOpen) showTooltip(settingsBtn, 'Settings', SHORTCUTS.settings.label); });
  settingsBtn.addEventListener('mouseleave', hideTooltip);

  const actionBtns = [pickBtn, copyBtn, clearBtn, settingsBtn];
  for (const btn of actionBtns) actions.appendChild(btn);

  // Copy and clear only exist once there is something to copy or clear
  const countBtns = [copyBtn, clearBtn];
  let countVisible = true;
  const visibleActionBtns = () => actionBtns.filter(b => b.style.display !== 'none');

  // ── Settings panel ──
  const settings = createSettingsPanel(opts.settings);
  const panel = settings.el;
  panel.style.display = 'none';
  let settingsOpen = false;
  let settingsAnim: Animation | null = null;

  // A window listener only sees the closed shadow root's host in composedPath,
  // so page clicks are caught on window and clicks on other kai UI inside the root.
  // The dismissing click is swallowed so it never becomes an annotation.
  const onOutsideClick = (e: MouseEvent) => {
    if (e.composedPath().includes(shadowRoot.host)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeSettings();
  };
  const onInsidePointerDown = (e: Event) => {
    const path = e.composedPath();
    if (path.includes(panel) || path.includes(settingsBtn)) return;
    closeSettings();
  };

  const openSettings = () => {
    if (settingsOpen) return;
    settingsOpen = true;
    hideTooltip();
    settingsBtn.setAttribute('aria-expanded', 'true');
    settingsBtn.classList.add('kai-fab-action--armed');
    settingsAnim?.cancel();
    panel.style.display = 'flex';
    positionSettings(panel, settingsBtn, fab, corner);
    settingsAnim = panel.animate(
      [
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 400, easing: SPRING, fill: 'both' },
    );
    window.addEventListener('click', onOutsideClick, { capture: true });
    shadowRoot.addEventListener('pointerdown', onInsidePointerDown);
    window.addEventListener('resize', closeSettings);
    opts.onSettingsToggle(true);
  };

  const closeSettings = (): boolean => {
    if (!settingsOpen) return false;
    settingsOpen = false;
    settingsBtn.setAttribute('aria-expanded', 'false');
    settingsBtn.classList.remove('kai-fab-action--armed');
    window.removeEventListener('click', onOutsideClick, { capture: true });
    shadowRoot.removeEventListener('pointerdown', onInsidePointerDown);
    window.removeEventListener('resize', closeSettings);
    opts.onSettingsToggle(false);
    settingsAnim?.cancel();
    settingsAnim = panel.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.9)', opacity: 0 },
      ],
      { duration: 150, easing: 'ease-in', fill: 'forwards' },
    );
    const anim = settingsAnim;
    anim.finished.then(() => {
      if (settingsAnim !== anim) return;
      panel.style.display = 'none';
      anim.cancel();
      settingsAnim = null;
    }).catch(() => {});
    return true;
  };

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (settingsOpen) closeSettings();
    else openSettings();
  });

  shadowRoot.appendChild(fab);
  shadowRoot.appendChild(actions);
  shadowRoot.appendChild(panel);

  // The scoop must match the circular badge, whose size follows its digit count. Observed
  // rather than measured in updateBadge because the host is not connected yet on first call.
  const scoopObserver = new ResizeObserver(() => {
    if (badge.offsetWidth) fab.style.setProperty('--kai-scoop', `${badge.offsetWidth / 2 + 2}px`);
  });
  scoopObserver.observe(badge);

  /**
   * Squishes the FAB while the badge keeps its screen size and position: the badge is a
   * child, so it gets the inverse scale plus a translate that undoes its drift toward the
   * FAB centre. Geometry: badge centre sits on the FAB corner, half the FAB size from centre.
   */
  let badgePressAnim: Animation | null = null;
  const pressFab = (from: number, to: number, timing: KeyframeAnimationOptions) => {
    fabAnim?.cancel();
    fabAnim = fab.animate(
      [{ transform: `scale(${from})` }, { transform: `scale(${to})` }],
      timing,
    );
    badgePressAnim?.cancel();
    badgePressAnim = null;
    if (badge.style.display === 'none' || badgeHidden) return;
    const sx = isRightCorner() ? 1 : -1;
    const sy = corner.startsWith('bottom') ? -1 : 1;
    const half = fab.offsetWidth / 2;
    const drift = (s: number) => ((1 - s) / s) * half;
    badgePressAnim = badge.animate(
      [
        { scale: `${1 / from}`, translate: `${drift(from) * sx}px ${drift(from) * sy}px` },
        { scale: `${1 / to}`, translate: `${drift(to) * sx}px ${drift(to) * sy}px` },
      ],
      timing,
    );
  };

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
    pressFab(1, 0.9, { duration: 120, easing: 'ease-out', fill: 'forwards' });
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

      // Hide badge with scale animation; the held press counter-transform must not outlive it
      badgePressAnim?.cancel();
      badgePressAnim = null;
      if (badge.style.display !== 'none' && !badgeHidden) {
        badgeHidden = true;
        badge.animate(
          [{ scale: '1' }, { scale: '0' }],
          { duration: 200, easing: 'ease-out', fill: 'forwards' },
        );
        fab.classList.remove('kai-fab--has-badge');
      }

      fab.style.borderRadius = computeDragRadii(fabStartX + 22, fabStartY + 22);

      if (active) {
        animateActionsOut();
      }
    }

    if (dragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 44, fabStartX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 44, fabStartY + dy));
      fab.style.left = `${newX}px`;
      fab.style.top = `${newY}px`;
      fab.style.borderRadius = computeDragRadii(newX + 22, newY + 22);

      if (active && actions.style.display !== 'none') {
        positionActions(actions, fab, corner);
      }
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

      if (active) {
        fabAnim!.finished.then(() => animateActionsIn()).catch(() => {});
      }

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
      pressFab(0.9, 1, { duration: 600, easing: SPRING });
    }
  };

  if (supportsAnchor) {
    fab.addEventListener('pointerdown', onPointerDown);
    fab.addEventListener('pointermove', onPointerMove);
    fab.addEventListener('pointerup', onPointerUp);
  } else {
    // No anchor support — just handle click + press effect
    fab.addEventListener('pointerdown', () => pressFab(1, 0.9, { duration: 120, easing: 'ease-out', fill: 'forwards' }));
    fab.addEventListener('pointerup', () => pressFab(0.9, 1, { duration: 600, easing: SPRING }));
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

  let pickArmed = false;
  let pickTimer: ReturnType<typeof setTimeout> | null = null;

  const setPickArmed = (armed: boolean) => {
    pickArmed = armed;
    pickBtn.classList.toggle('kai-fab-action--armed', armed);
    pickBtn.setAttribute('aria-pressed', String(armed));
  };

  pickBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pickTimer) return;
    setPickArmed(!pickArmed);
    opts.onPickToggle(pickArmed);
  });

  const confirmPick = () => {
    if (pickTimer) clearTimeout(pickTimer);
    setPickArmed(false);
    animateStateSwap(pickBtn, iconCheck, 'var(--color-success)');
    copyStatus.textContent = 'Selector copied';
    pickTimer = setTimeout(() => {
      animateStateSwap(pickBtn, iconCursor);
      copyStatus.textContent = '';
      pickTimer = null;
    }, 2000);
  };

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
  /** Keyboard path to an action button; runs the same click handler, so disabled and armed states are respected. */
  const pressAction = (action: ShortcutAction) => {
    const btn = { pick: pickBtn, copy: copyBtn, clear: clearBtn, settings: settingsBtn }[action];
    if (btn.disabled) return;
    btn.click();
  };

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
      visibleActionBtns().forEach((btn, i) => {
        const anim = btn.animate(
          [
            { transform: `translateX(${tx}) scale(0.8)`, opacity: 0 },
            { transform: 'translateX(0) scale(1)', opacity: 1 },
          ],
          { duration: 400, easing: SPRING, delay: i * 50, fill: 'backwards' },
        );
        actionAnims.push(anim);
      });
    });
  };

  const animateActionsOut = () => {
    hideTooltip();
    closeSettings();
    actionAnims.forEach(a => a.cancel());
    actionAnims = [];

    const tx = isRightCorner() ? '8px' : '-8px';
    const anims = visibleActionBtns().map((btn, i) => {
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

  const setCountDisplay = (visible: boolean) => {
    for (const b of countBtns) b.style.display = visible ? '' : 'none';
  };

  /** Settings button offset between the row with and without the count buttons. */
  const measureShift = (visible: boolean): number => {
    const before = settingsBtn.getBoundingClientRect().left;
    setCountDisplay(visible);
    const after = settingsBtn.getBoundingClientRect().left;
    setCountDisplay(!visible);
    return after - before;
  };

  const updateActionStates = (count: number) => {
    const visible = count > 0;
    if (visible === countVisible) return;
    countVisible = visible;
    for (const b of countBtns) b.disabled = !visible;

    if (!active || actions.style.display === 'none') {
      setCountDisplay(visible);
      return;
    }

    const shift = measureShift(visible);

    if (visible) {
      // FLIP: buttons take their space at once, settings slides in from where it was
      setCountDisplay(true);
      actionAnims.push(settingsBtn.animate(
        [{ transform: `translateX(${-shift}px)` }, { transform: 'translateX(0)' }],
        { duration: COLLAPSE.expandMs, easing: SPRING },
      ));
      countBtns.forEach((btn, i) => {
        actionAnims.push(btn.animate(
          [{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: COLLAPSE.expandMs, easing: SPRING, delay: COLLAPSE.appearDelayMs + i * COLLAPSE.staggerMs, fill: 'backwards' },
        ));
      });
      return;
    }

    // Buttons keep their space while they shrink and settings slides over them;
    // the space is released only once the slide has landed.
    for (const btn of countBtns) {
      actionAnims.push(btn.animate(
        [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.8)', opacity: 0 }],
        { duration: COLLAPSE.shrinkMs, easing: EASE_OUT, fill: 'forwards' },
      ));
    }
    // No overshoot here: the target sits flush against the pick button
    const slide = settingsBtn.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${shift}px)` }],
      { duration: COLLAPSE.collapseMs, easing: SNAP, fill: 'forwards' },
    );
    actionAnims.push(slide);
    slide.finished.catch(() => {}).finally(() => {
      if (countVisible) return;
      setCountDisplay(false);
      for (const btn of countBtns) btn.getAnimations().forEach(a => a.cancel());
      slide.cancel();
    });
  };

  const destroy = () => {
    closeSettings();
    scoopObserver.disconnect();
    fab.remove();
    actions.remove();
    panel.remove();
    tooltip.remove();
    copyStatus.remove();
  };

  return { updateBadge, setActive, updateActionStates, confirmCopy, confirmPick, setPickArmed, closeSettings, pressAction, destroy };
};
