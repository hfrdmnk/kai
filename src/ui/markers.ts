import type { Annotation } from '../types.ts';
import { iconKai } from '../icons.ts';
import { SPRING } from '../core/easing.ts';

const parser = new DOMParser();

const MARKER_SIZE = 22;
const MARKER_PAD = 4;
const MARKER_OFFSET = 8;
const BADGE_OVERFLOW = 9;

const clampMarker = (top: number, left: number): { top: number; left: number } => ({
  top: Math.max(MARKER_PAD + BADGE_OVERFLOW, Math.min(top, document.documentElement.clientHeight - MARKER_SIZE - MARKER_PAD)),
  left: Math.max(MARKER_PAD, Math.min(left, document.documentElement.clientWidth - MARKER_SIZE - BADGE_OVERFLOW - MARKER_PAD)),
});

const createMarkerIcon = (): SVGElement => {
  const doc = parser.parseFromString(iconKai, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGElement;
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('stroke-width', '2.5');
  return svg;
};

type PositionedMarker = {
  annotation: Annotation;
  marker: HTMLElement;
  top: number;
  left: number;
};

/** BFS-based clustering: group markers within MARKER_SIZE euclidean distance */
const findClusters = (items: PositionedMarker[]): PositionedMarker[][] => {
  if (items.length === 0) return [];

  const assigned = new Array<boolean>(items.length).fill(false);
  const clusters: PositionedMarker[][] = [];

  for (let i = 0; i < items.length; i++) {
    if (assigned[i]) continue;

    const cluster: PositionedMarker[] = [];
    const queue = [i];
    assigned[i] = true;

    while (queue.length > 0) {
      const idx = queue.shift()!;
      cluster.push(items[idx]);

      for (let j = 0; j < items.length; j++) {
        if (assigned[j]) continue;
        const dx = items[idx].left - items[j].left;
        const dy = items[idx].top - items[j].top;
        if (Math.sqrt(dx * dx + dy * dy) < MARKER_SIZE + BADGE_OVERFLOW) {
          assigned[j] = true;
          queue.push(j);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
};

export const createMarkerManager = (
  shadowRoot: ShadowRoot,
  onMarkerClick: (annotation: Annotation, markerRect: DOMRect) => void,
  onMarkerEnter?: (annotationId: string) => void,
  onMarkerLeave?: (annotationId: string) => void,
) => {
  const markerMap = new Map<string, HTMLElement>();
  const boxMap = new Map<string, HTMLElement>();
  const visibleBoxes = new Set<string>();
  let currentAnnotations: Annotation[] = [];
  let rafId = 0;

  let previewMarker: HTMLElement | null = null;
  let previewBox: HTMLElement | null = null;
  let previewTarget: Element | null = null;
  let isActive = false;

  // Stack state
  const stackElements = new Map<string, HTMLElement>();
  const markerToStack = new Map<string, string>();
  let activeStackMenu: HTMLElement | null = null;
  let activeStackEl: HTMLElement | null = null;
  let stackMenuCleanup: (() => void) | null = null;
  let menuDismissRafId: number | null = null;

  let expandedAnims: Animation[] = [];
  let stackFadeAnim: Animation | null = null;
  let badgeHideAnim: Animation | null = null;

  const closeStackMenu = (animate = false) => {
    if (menuDismissRafId !== null) {
      cancelAnimationFrame(menuDismissRafId);
      menuDismissRafId = null;
    }
    stackMenuCleanup?.();
    stackMenuCleanup = null;

    if (!activeStackMenu) return;

    const closingStackEl = activeStackEl;
    activeStackEl = null;

    if (animate) {
      const el = activeStackMenu;
      activeStackMenu = null;
      const markers = Array.from(el.querySelectorAll('.kai-stack-expanded-marker')) as HTMLElement[];
      expandedAnims.forEach(a => a.cancel());
      expandedAnims = [];

      const isReversed = el.style.flexDirection === 'row-reverse';
      const tx = isReversed ? '8px' : '-8px';

      const anims = markers.map((btn, i) => {
        const anim = btn.animate(
          [
            { transform: 'translateX(0) scale(1)', opacity: 1 },
            { transform: `translateX(${tx}) scale(0.8)`, opacity: 0 },
          ],
          { duration: 150, easing: 'ease-in', delay: i * 30, fill: 'forwards' },
        );
        return anim;
      });
      expandedAnims = anims;

      // Remove tooltip
      const tip = el.querySelector('.kai-tooltip') as HTMLElement | null;
      if (tip) tip.style.display = 'none';

      Promise.all(anims.map(a => a.finished)).then(() => {
        el.remove();
        anims.forEach(a => a.cancel());
        expandedAnims = [];

        // Restore badge + stack opacity
        if (closingStackEl) {
          const badge = closingStackEl.querySelector('.kai-marker-stack-badge') as HTMLElement | null;
          if (badge) {
            badgeHideAnim?.cancel();
            badgeHideAnim = badge.animate(
              [{ transform: 'translate(50%, -50%) scale(0)' }, { transform: 'translate(50%, -50%) scale(1)' }],
              { duration: 400, easing: SPRING, fill: 'forwards' },
            );
          }
          closingStackEl.classList.add('kai-marker-stack--has-badge');

          stackFadeAnim?.cancel();
          stackFadeAnim = closingStackEl.animate(
            [{ opacity: 0.4 }, { opacity: 1 }],
            { duration: 400, easing: SPRING, fill: 'forwards' },
          );
        }
      }).catch(() => {
        el.remove();
      });
    } else {
      expandedAnims.forEach(a => a.cancel());
      expandedAnims = [];
      badgeHideAnim?.cancel();
      badgeHideAnim = null;
      stackFadeAnim?.cancel();
      stackFadeAnim = null;
      if (closingStackEl) closingStackEl.classList.add('kai-marker-stack--has-badge');
      activeStackMenu.remove();
      activeStackMenu = null;
    }
  };

  const openStackExpanded = (stackEl: HTMLElement, annotations: Annotation[]) => {
    closeStackMenu();

    const container = document.createElement('div');
    container.className = 'kai-stack-expanded';

    // Tooltip element (shared, repositioned on hover)
    const tooltip = document.createElement('div');
    tooltip.className = 'kai-tooltip';
    tooltip.style.display = 'none';
    tooltip.style.fontFamily = 'var(--font-sans)';

    // Direction: expand toward side with more room
    const stackRect = stackEl.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const spaceRight = vw - stackRect.right;
    const spaceLeft = stackRect.left;
    const expandRight = spaceRight >= spaceLeft;

    container.style.flexDirection = expandRight ? 'row' : 'row-reverse';

    // Position container next to stack marker
    const gap = 6;
    if (expandRight) {
      container.style.left = `${stackRect.right + gap}px`;
    } else {
      container.style.right = `${vw - stackRect.left + gap}px`;
    }
    container.style.top = `${stackRect.top}px`;

    const markerBtns: HTMLElement[] = [];

    for (const ann of annotations) {
      const btn = document.createElement('button');
      btn.className = 'kai-stack-expanded-marker';

      const icon = createMarkerIcon();
      btn.appendChild(icon);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeStackMenu(true);
        onMarkerClick(ann, stackEl.getBoundingClientRect());
      });

      btn.addEventListener('mouseenter', () => {
        onMarkerEnter?.(ann.id);
        const label = ann.comment.trim() || ann.path || ann.selector;
        tooltip.textContent = label;
        tooltip.style.display = '';
        const btnRect = btn.getBoundingClientRect();
        tooltip.style.left = `${btnRect.left + btnRect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        // Show tooltip below
        tooltip.style.top = `${btnRect.bottom + 6}px`;
        tooltip.style.bottom = 'auto';
      });

      btn.addEventListener('mouseleave', () => {
        onMarkerLeave?.(ann.id);
        tooltip.style.display = 'none';
      });

      container.appendChild(btn);
      markerBtns.push(btn);
    }

    container.appendChild(tooltip);
    shadowRoot.appendChild(container);
    activeStackMenu = container;
    activeStackEl = stackEl;

    // Animate badge hide + stack fade
    const badge = stackEl.querySelector('.kai-marker-stack-badge') as HTMLElement | null;
    if (badge) {
      badgeHideAnim?.cancel();
      badgeHideAnim = badge.animate(
        [{ transform: 'translate(50%, -50%) scale(1)' }, { transform: 'translate(50%, -50%) scale(0)' }],
        { duration: 200, easing: 'ease-out', fill: 'forwards' },
      );
    }
    stackEl.classList.remove('kai-marker-stack--has-badge');

    stackFadeAnim?.cancel();
    stackFadeAnim = stackEl.animate(
      [{ opacity: 1 }, { opacity: 0.4 }],
      { duration: 200, easing: 'ease-out', fill: 'forwards' },
    );

    // Animate in
    expandedAnims.forEach(a => a.cancel());
    expandedAnims = [];

    requestAnimationFrame(() => {
      const tx = expandRight ? '-12px' : '12px';
      for (let i = 0; i < markerBtns.length; i++) {
        const anim = markerBtns[i].animate(
          [
            { transform: `translateX(${tx}) scale(0.8)`, opacity: 0 },
            { transform: 'translateX(0) scale(1)', opacity: 1 },
          ],
          { duration: 400, easing: SPRING, delay: i * 50, fill: 'both' },
        );
        expandedAnims.push(anim);
      }
    });

    // Dismiss listeners (deferred one frame)
    const onShadowClick = (e: Event) => {
      if (!activeStackMenu) return;
      const target = e.target as Node;
      if (!activeStackMenu.contains(target) && target !== stackEl && !stackEl.contains(target)) {
        closeStackMenu(true);
      }
    };

    const onDocClick = (e: Event) => {
      if (!activeStackMenu) return;
      if (e.target === shadowRoot.host) return;
      closeStackMenu(true);
    };

    const onScroll = () => { if (activeStackMenu) closeStackMenu(true); };
    const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeStackMenu(true); };

    menuDismissRafId = requestAnimationFrame(() => {
      menuDismissRafId = null;
      if (!activeStackMenu) return;
      shadowRoot.addEventListener('click', onShadowClick, true);
      document.addEventListener('click', onDocClick);
      window.addEventListener('scroll', onScroll, true);
      document.addEventListener('keydown', onKeydown);
    });

    stackMenuCleanup = () => {
      shadowRoot.removeEventListener('click', onShadowClick, true);
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKeydown);
    };
  };

  const ensureStackElement = (key: string, count: number): HTMLElement => {
    const existing = stackElements.get(key);
    if (existing) {
      const badge = existing.querySelector('.kai-marker-stack-badge') as HTMLElement;
      if (badge) badge.textContent = String(count);
      return existing;
    }

    const el = document.createElement('div');
    el.className = isActive
      ? 'kai-marker-stack kai-marker-stack--has-badge'
      : 'kai-marker-stack kai-marker-stack--has-badge kai-marker-stack--inactive';
    el.appendChild(createMarkerIcon());

    const badge = document.createElement('span');
    badge.className = 'kai-marker-stack-badge';
    badge.textContent = String(count);
    el.appendChild(badge);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isActive) return;
      if (activeStackEl === el) {
        closeStackMenu(true);
        return;
      }
      const ids = el.dataset.annotationIds?.split(',') || [];
      const anns = ids
        .map(id => currentAnnotations.find(a => a.id === id))
        .filter((a): a is Annotation => !!a);
      if (anns.length === 1) {
        onMarkerClick(anns[0], el.getBoundingClientRect());
      } else if (anns.length > 1) {
        openStackExpanded(el, anns);
      }
    });

    el.addEventListener('mouseenter', () => {
      const ids = el.dataset.annotationIds?.split(',') || [];
      for (const id of ids) onMarkerEnter?.(id);
    });

    el.addEventListener('mouseleave', () => {
      const ids = el.dataset.annotationIds?.split(',') || [];
      for (const id of ids) onMarkerLeave?.(id);
    });

    shadowRoot.appendChild(el);
    stackElements.set(key, el);
    return el;
  };

  const reposition = () => {
    // Phase 1: compute clamped positions, update annotation boxes
    const positioned: PositionedMarker[] = [];

    for (const annotation of currentAnnotations) {
      const marker = markerMap.get(annotation.id);
      if (!marker) continue;

      const target = document.querySelector(annotation.selector);
      if (!target) {
        marker.style.display = 'none';
        const box = boxMap.get(annotation.id);
        if (box) box.style.display = 'none';
        continue;
      }

      const rect = target.getBoundingClientRect();
      const clamped = clampMarker(rect.top - MARKER_OFFSET, rect.right - MARKER_OFFSET);
      positioned.push({ annotation, marker, top: clamped.top, left: clamped.left });

      const box = boxMap.get(annotation.id);
      if (box) {
        if (!visibleBoxes.has(annotation.id)) {
          box.style.display = 'none';
        } else {
          const gap = 4;
          box.style.display = 'block';
          box.style.top = `${rect.top - gap}px`;
          box.style.left = `${rect.left - gap}px`;
          box.style.width = `${rect.width + gap * 2}px`;
          box.style.height = `${rect.height + gap * 2}px`;
        }
      }
    }

    // Phase 2: cluster detection
    const clusters = findClusters(positioned);
    const activeStackKeys = new Set<string>();
    markerToStack.clear();

    for (const cluster of clusters) {
      if (cluster.length === 1) {
        const { marker, top, left } = cluster[0];
        marker.style.display = 'flex';
        marker.style.top = `${top}px`;
        marker.style.left = `${left}px`;
      } else {
        const ids = cluster.map(c => c.annotation.id).sort();
        const key = ids.join(',');
        activeStackKeys.add(key);

        let avgTop = 0;
        let avgLeft = 0;
        for (const c of cluster) {
          avgTop += c.top;
          avgLeft += c.left;
          c.marker.style.display = 'none';
          markerToStack.set(c.annotation.id, key);
        }
        avgTop /= cluster.length;
        avgLeft /= cluster.length;

        const clamped = clampMarker(avgTop, avgLeft);

        const stackEl = ensureStackElement(key, cluster.length);
        stackEl.dataset.annotationIds = key;
        stackEl.style.top = `${clamped.top}px`;
        stackEl.style.left = `${clamped.left}px`;
      }
    }

    // Phase 3: remove stale stack elements
    for (const [key, el] of stackElements) {
      if (!activeStackKeys.has(key)) {
        if (el === activeStackEl) closeStackMenu(false);
        el.remove();
        stackElements.delete(key);
      }
    }

    // Phase 4: preview marker/box
    if (previewTarget && previewMarker && previewBox) {
      const pRect = previewTarget.getBoundingClientRect();
      const pClamped = clampMarker(pRect.top - MARKER_OFFSET, pRect.right - MARKER_OFFSET);
      const gap = 4;
      previewMarker.style.top = `${pClamped.top}px`;
      previewMarker.style.left = `${pClamped.left}px`;
      previewBox.style.top = `${pRect.top - gap}px`;
      previewBox.style.left = `${pRect.left - gap}px`;
      previewBox.style.width = `${pRect.width + gap * 2}px`;
      previewBox.style.height = `${pRect.height + gap * 2}px`;
    }

    rafId = requestAnimationFrame(reposition);
  };

  const update = (annotations: Annotation[]) => {
    currentAnnotations = annotations;

    const activeIds = new Set(annotations.map(a => a.id));

    // Cleanup stale markers and boxes
    for (const [id, el] of markerMap) {
      if (!activeIds.has(id)) {
        el.remove();
        markerMap.delete(id);
      }
    }
    for (const [id, el] of boxMap) {
      if (!activeIds.has(id)) {
        el.remove();
        boxMap.delete(id);
      }
    }

    annotations.forEach((annotation) => {
      // Marker
      let marker = markerMap.get(annotation.id);
      if (!marker) {
        marker = document.createElement('div');
        marker.className = isActive ? 'kai-marker' : 'kai-marker kai-marker--inactive';
        marker.setAttribute('role', 'button');
        marker.setAttribute('tabindex', '0');
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const el = e.currentTarget as HTMLElement;
          onMarkerClick(annotation, el.getBoundingClientRect());
        });
        marker.addEventListener('mouseenter', () => onMarkerEnter?.(annotation.id));
        marker.addEventListener('mouseleave', () => onMarkerLeave?.(annotation.id));
        shadowRoot.appendChild(marker);
        markerMap.set(annotation.id, marker);
      }
      if (!marker.querySelector('svg')) marker.appendChild(createMarkerIcon());
      marker.setAttribute('aria-label', `Annotation: ${annotation.comment.slice(0, 50)}`);

      // Box
      let box = boxMap.get(annotation.id);
      if (!box) {
        box = document.createElement('div');
        box.className = 'kai-annotation-box';
        shadowRoot.appendChild(box);
        boxMap.set(annotation.id, box);
      }
    });
  };

  const clearPreview = () => {
    previewMarker?.remove();
    previewBox?.remove();
    previewMarker = null;
    previewBox = null;
    previewTarget = null;
  };

  const showPreview = (element: Element): DOMRect => {
    clearPreview();

    const rect = element.getBoundingClientRect();
    const gap = 4;

    const box = document.createElement('div');
    box.className = 'kai-annotation-box';
    box.style.top = `${rect.top - gap}px`;
    box.style.left = `${rect.left - gap}px`;
    box.style.width = `${rect.width + gap * 2}px`;
    box.style.height = `${rect.height + gap * 2}px`;
    shadowRoot.appendChild(box);

    const marker = document.createElement('div');
    marker.className = 'kai-marker';
    marker.appendChild(createMarkerIcon());
    marker.style.pointerEvents = 'none';
    const previewClamped = clampMarker(rect.top - MARKER_OFFSET, rect.right - MARKER_OFFSET);
    marker.style.top = `${previewClamped.top}px`;
    marker.style.left = `${previewClamped.left}px`;
    shadowRoot.appendChild(marker);

    previewMarker = marker;
    previewBox = box;
    previewTarget = element;

    return new DOMRect(previewClamped.left, previewClamped.top, MARKER_SIZE, MARKER_SIZE);
  };

  const showBox = (id: string) => {
    visibleBoxes.add(id);
  };

  const hideBox = (id: string) => {
    visibleBoxes.delete(id);
  };

  const destroy = () => {
    cancelAnimationFrame(rafId);
    clearPreview();
    closeStackMenu();
    for (const el of markerMap.values()) el.remove();
    markerMap.clear();
    for (const el of boxMap.values()) el.remove();
    boxMap.clear();
    for (const el of stackElements.values()) el.remove();
    stackElements.clear();
    markerToStack.clear();
  };

  rafId = requestAnimationFrame(reposition);

  const setActive = (active: boolean) => {
    isActive = active;
    for (const marker of markerMap.values()) {
      marker.classList.toggle('kai-marker--inactive', !active);
    }
    for (const stack of stackElements.values()) {
      stack.classList.toggle('kai-marker-stack--inactive', !active);
    }
    if (!active) closeStackMenu();
  };

  const getMarkerRect = (id: string): DOMRect | undefined => {
    const stackKey = markerToStack.get(id);
    if (stackKey) {
      const stackEl = stackElements.get(stackKey);
      if (stackEl) return stackEl.getBoundingClientRect();
    }
    return markerMap.get(id)?.getBoundingClientRect();
  };

  return { update, showPreview, clearPreview, showBox, hideBox, setActive, destroy, getMarkerRect };
};
