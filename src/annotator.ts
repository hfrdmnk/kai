import type { Annotation, FabCorner } from './types.ts';
import { styles } from './styles.ts';
import { generateSelector, generatePath, resolveSelector, composedParent, composedChildren, composedContains } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { getNearbyText } from './core/text.ts';
import { isMac, PASS_THROUGH_KEY } from './core/platform.ts';
import { loadSession, saveSession, clearSession, loadFabCorner, saveFabCorner, loadTheme } from './core/session.ts';
import { computeCrosshair, computeTextInspectData, findLargestEnclosedElement } from './core/measure.ts';
import { toMarkdown } from './export/markdown.ts';
import { createOverlay } from './ui/highlight.ts';
import { createFab } from './ui/fab.ts';
import { createPopover } from './ui/popover.ts';
import { createMarkerManager } from './ui/markers.ts';
import { createInspector } from './ui/inspector.ts';
import { createGuideBar } from './ui/guide-bar.ts';

const DRAG_THRESHOLD = 5;

/** SVG internals (path, g, use…) are never what a user means to annotate; snap to the root <svg>. */
const snapToSvgRoot = (el: Element): Element => {
  let current = el;
  while (current instanceof SVGElement && current.ownerSVGElement) {
    current = current.ownerSVGElement;
  }
  return current;
};

/** The modifier state on the mouse event is the source of truth; keydown can be missed when focus sits in an iframe or our own UI. */
const isPassThroughEvent = (e: MouseEvent): boolean => isMac ? e.metaKey : e.ctrlKey;

const isEditable = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

let instance: UIAnnotator | null = null;

class UIAnnotator extends HTMLElement {
  private shadow!: ShadowRoot;
  private annotations: Annotation[] = [];
  private active = false;
  private fabCorner!: FabCorner;
  private altHeld = false;
  private shiftHeld = false;
  private passThrough = false;
  private pickMode = false;
  private dragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private hasPointer = false;
  private measureRafId: number | null = null;
  private highlightLocked = false;

  private fab!: ReturnType<typeof createFab>;
  private overlay!: ReturnType<typeof createOverlay>;
  private inspector!: ReturnType<typeof createInspector>;
  private markers!: ReturnType<typeof createMarkerManager>;
  private guideBar!: ReturnType<typeof createGuideBar>;
  private activePopover: ReturnType<typeof createPopover> | null = null;
  private activePopoverAnnotationId: string | null = null;

  // Hover state: hoverTarget is what the hit test found, selectedElement is what
  // the box shows (hoverTarget or one of its ancestors after walking up with ↑).
  private hoverTarget: Element | null = null;
  private selectedElement: Element | null = null;
  private walkedUp = false;
  private hoverDirty = false;
  private hoverRafId: number | null = null;
  private domObserver: MutationObserver | null = null;

  private handleMouseLeave!: (e: MouseEvent) => void;
  private handleClick!: (e: MouseEvent) => void;
  private handleBlockedPointer!: (e: MouseEvent) => void;
  private handleGlobalKeydown!: (e: KeyboardEvent) => void;
  private handleKeydown!: (e: KeyboardEvent) => void;
  private handleKeyup!: (e: KeyboardEvent) => void;
  private handleWindowBlur!: () => void;
  private handleLayoutChange!: () => void;
  private handleMouseMove!: (e: MouseEvent) => void;
  private handleMouseDown!: (e: MouseEvent) => void;
  private handleMouseUp!: (e: MouseEvent) => void;

  constructor() {
    super();

    if (instance) {
      console.warn('<ui-annotator> is a singleton — only one instance is allowed per page.');
      return;
    }
    instance = this;

    this.shadow = this.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = styles;
    this.shadow.appendChild(style);

    this.annotations = loadSession();
    this.fabCorner = loadFabCorner();

    this.fab = createFab(this.shadow, {
      initialCorner: this.fabCorner,
      onToggle: () => this.toggle(),
      onCopyMarkdown: () => {
        navigator.clipboard.writeText(toMarkdown(this.annotations)).then(() => {
          this.fab.confirmCopy();
        });
      },
      onClearAll: () => {
        this.annotations = [];
        clearSession();
        this.markers.update([]);
        this.fab.updateBadge(0);
        this.fab.updateActionStates(0);
        this.closePopover();
      },
      onPickToggle: (armed) => {
        this.pickMode = armed;
        if (armed) this.closePopover();
        this.guideBar.show(armed ? 'pick' : 'annotate');
      },
      onCornerChange: (c) => {
        this.fabCorner = c;
        saveFabCorner(c);
      },
    });

    this.overlay = createOverlay(this.shadow);
    this.inspector = createInspector(this.shadow);
    this.guideBar = createGuideBar(this.shadow);
    this.markers = createMarkerManager(
      this.shadow,
      (annotation, markerRect) => {
        this.openEditPopover(annotation, markerRect);
      },
      (id) => this.markers.showBox(id),
      (id) => {
        if (this.activePopoverAnnotationId !== id) {
          this.markers.hideBox(id);
        }
      },
    );

    if (this.annotations.length) {
      this.markers.update(this.annotations);
      this.fab.updateBadge(this.annotations.length);
    }
    this.fab.updateActionStates(this.annotations.length);

    // Bind event handlers
    this.handleMouseLeave = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      this.hasPointer = false;
      this.clearHover();
    };

    this.handleLayoutChange = () => {
      this.hoverDirty = true;
      this.scheduleHoverUpdate();
    };

    this.handleClick = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough || isPassThroughEvent(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (this.altHeld) return;

      const target = this.selectedElement ?? this.hitTest(e.clientX, e.clientY);
      if (!target || !target.isConnected) return;
      this.clearHover();

      if (this.pickMode) {
        this.pickMode = false;
        this.fab.setPickArmed(false);
        this.guideBar.show('annotate');
        navigator.clipboard.writeText(generateSelector(target)).then(() => {
          this.fab.confirmPick();
        });
        return;
      }

      const existing = this.annotations.find(a => {
        try { return resolveSelector(a.selector) === target; }
        catch { return false; }
      });

      if (existing) {
        const markerRect = this.markers.getMarkerRect(existing.id);
        this.openEditPopover(existing, markerRect);
      } else {
        const markerRect = this.markers.showPreview(target);
        this.openPopover(target, markerRect);
      }
    };

    // Libraries like Radix and React Aria act on pointerdown, not click, so
    // those have to be swallowed too. No preventDefault: that would suppress
    // the compat mouse events our own handlers rely on.
    this.handleBlockedPointer = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough || isPassThroughEvent(e)) return;
      e.stopImmediatePropagation();
    };

    this.handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'A' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.active && !this.activePopover) {
        if (this.pickMode) {
          this.disarmPick();
        } else {
          this.deactivate();
        }
      }
    };

    this.handleKeydown = (e: KeyboardEvent) => {
      if (e.key === PASS_THROUGH_KEY) {
        // Cmd+Enter in the popover textarea must not flip modes
        if (this.passThrough || this.altHeld || isEditable(this.shadow.activeElement)) return;
        this.enterPassThrough();
        return;
      }
      if (e.key === 'Alt') {
        if (this.altHeld || this.passThrough) return;
        this.altHeld = true;
        this.clearHover();
        document.body.style.cursor = 'crosshair';
        this.guideBar.show('measure', ['alt']);
        this.scheduleMeasureUpdate();
      }
      if (e.key === 'Shift') {
        this.shiftHeld = true;
        if (this.altHeld) this.guideBar.updateKeys(['alt', 'shift']);
        if (this.altHeld && !this.dragging && !this.highlightLocked) {
          this.scheduleMeasureUpdate();
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (!this.altHeld && !this.passThrough) {
          this.guideBar.updateKeys([e.key === 'ArrowUp' ? 'up' : 'down']);
        }
        this.walkAncestors(e);
      }
    };

    this.handleKeyup = (e: KeyboardEvent) => {
      if (e.key === PASS_THROUGH_KEY && this.passThrough) {
        this.exitPassThrough();
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !this.altHeld && !this.passThrough) {
        this.guideBar.updateKeys([]);
      }
      if (e.key === 'Alt') {
        this.exitMeasureMode();
      }
      if (e.key === 'Shift') {
        this.shiftHeld = false;
        if (this.altHeld) this.guideBar.updateKeys(['alt']);
        if (this.altHeld && !this.dragging && !this.highlightLocked) {
          this.scheduleMeasureUpdate();
        }
      }
    };

    this.handleWindowBlur = () => {
      if (this.altHeld) {
        this.exitMeasureMode();
      }
      if (this.passThrough) {
        this.exitPassThrough();
      }
    };

    this.handleMouseMove = (e: MouseEvent) => {
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.hasPointer = true;

      if (!this.altHeld) {
        this.scheduleHoverUpdate();
        return;
      }

      if (this.dragStart && !this.dragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          this.dragging = true;
          this.highlightLocked = false;
        }
      }

      this.scheduleMeasureUpdate();
    };

    this.handleMouseDown = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough || isPassThroughEvent(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!this.altHeld) return;
      if (e.button !== 0) return;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragging = false;
      this.highlightLocked = false;
    };

    this.handleMouseUp = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough || isPassThroughEvent(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!this.altHeld) return;
      if (e.button !== 0) return;

      if (this.dragging && this.dragStart) {
        const x1 = this.dragStart.x;
        const y1 = this.dragStart.y;
        const x2 = e.clientX;
        const y2 = e.clientY;

        const selectionRect = new DOMRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1),
        );

        const largest = findLargestEnclosedElement(selectionRect, this);
        if (largest) {
          this.inspector.showHighlight(largest.getBoundingClientRect());
          this.highlightLocked = true;
        } else {
          this.inspector.hide();
        }
      }

      this.dragStart = null;
      this.dragging = false;
    };
  }

  // ── Hover / hit testing ──

  private hitTest(x: number, y: number): Element | null {
    let el = document.elementFromPoint(x, y);
    if (!el || el === this) return null;
    // Descend through open shadow roots to the element actually under the pointer
    while (el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return snapToSvgRoot(el);
  }

  private scheduleHoverUpdate() {
    if (this.hoverRafId !== null) return;
    this.hoverRafId = requestAnimationFrame(() => {
      this.hoverRafId = null;
      this.updateHover();
    });
  }

  private updateHover() {
    if (!this.active || this.altHeld || this.passThrough || !this.hasPointer) return;

    const dirty = this.hoverDirty;
    this.hoverDirty = false;

    const hit = this.hitTest(this.lastMousePos.x, this.lastMousePos.y);
    if (!hit) {
      this.clearHover();
      return;
    }
    if (hit === this.hoverTarget && !dirty) return;
    this.hoverTarget = hit;

    const keepWalked = this.walkedUp
      && this.selectedElement?.isConnected
      && composedContains(this.selectedElement, hit);
    if (!keepWalked) {
      this.selectedElement = hit;
      this.walkedUp = false;
    }
    this.overlay.show(this.selectedElement!);
  }

  private clearHover() {
    this.hoverTarget = null;
    this.selectedElement = null;
    this.walkedUp = false;
    this.overlay.hide();
  }

  private walkAncestors(e: KeyboardEvent) {
    if (this.activePopover || this.altHeld || this.passThrough) return;
    if (!this.selectedElement || !this.hoverTarget || isEditable(e.target)) return;

    // A box is showing, so the arrows belong to us even at the ends of the chain
    e.preventDefault();

    if (e.key === 'ArrowUp') {
      const parent = composedParent(this.selectedElement);
      if (!parent || this.selectedElement === document.body) return;
      this.selectedElement = parent;
      this.walkedUp = true;
    } else {
      if (this.selectedElement === this.hoverTarget) return;
      const hover = this.hoverTarget;
      const child = composedChildren(this.selectedElement).find(c => composedContains(c, hover));
      if (!child) return;
      this.selectedElement = child;
      this.walkedUp = child !== hover;
    }
    this.overlay.show(this.selectedElement);
  }

  // ── Modes ──

  private enterPassThrough() {
    this.passThrough = true;
    this.clearHover();
    this.guideBar.show('interact', ['meta']);
  }

  private exitPassThrough() {
    this.passThrough = false;
    if (!this.active) return;
    this.guideBar.show(this.pickMode ? 'pick' : 'annotate');
    this.handleLayoutChange();
  }

  private disarmPick() {
    if (!this.pickMode) return;
    this.pickMode = false;
    this.fab.setPickArmed(false);
    if (this.active) this.guideBar.show('annotate');
  }

  private exitMeasureMode() {
    this.altHeld = false;
    this.shiftHeld = false;
    this.dragging = false;
    this.dragStart = null;
    this.highlightLocked = false;
    document.body.style.cursor = '';
    this.inspector.hide();
    if (this.active) this.guideBar.show(this.pickMode ? 'pick' : 'annotate');
    if (this.measureRafId !== null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
    this.handleLayoutChange();
  }

  private scheduleMeasureUpdate() {
    if (this.measureRafId !== null) return;
    this.measureRafId = requestAnimationFrame(() => {
      this.measureRafId = null;
      this.updateMeasure();
    });
  }

  private updateMeasure() {
    if (!this.altHeld) return;

    if (this.highlightLocked) return;

    const { x: cx, y: cy } = this.lastMousePos;

    if (this.dragging && this.dragStart) {
      this.inspector.showSelection(this.dragStart.x, this.dragStart.y, cx, cy);
      return;
    }

    if (this.shiftHeld) {
      const el = document.elementFromPoint(cx, cy);
      if (el && el !== this) {
        const textData = computeTextInspectData(el);
        if (textData) {
          this.inspector.showTextInfo(cx, cy, textData);
          return;
        }
      }
      this.inspector.hide();
      return;
    }

    const data = computeCrosshair(cx, cy, this);
    this.inspector.showCrosshair(data);
  }

  connectedCallback() {
    // Attributes may not be set in the constructor of an element made via createElement
    this.setAttribute('data-theme', loadTheme());
    document.addEventListener('keydown', this.handleGlobalKeydown);
  }

  disconnectedCallback() {
    if (instance === this) instance = null;
    this.deactivate();
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    this.markers.destroy();
    this.overlay.destroy();
    this.inspector.destroy();
    this.guideBar.destroy();
    this.fab.destroy();
  }

  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  private activate() {
    this.active = true;
    this.fab.setActive(true);
    this.markers.setActive(true);
    this.guideBar.show('annotate');

    document.addEventListener('mouseout', this.handleMouseLeave, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('dblclick', this.handleBlockedPointer, true);
    document.addEventListener('pointerdown', this.handleBlockedPointer, true);
    document.addEventListener('pointerup', this.handleBlockedPointer, true);
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('mousedown', this.handleMouseDown, true);
    document.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('scroll', this.handleLayoutChange, { capture: true, passive: true });
    window.addEventListener('resize', this.handleLayoutChange);
    window.addEventListener('blur', this.handleWindowBlur);

    this.domObserver = new MutationObserver(this.handleLayoutChange);
    this.domObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
  }

  private deactivate() {
    this.active = false;
    this.fab.setActive(false);
    this.markers.setActive(false);
    this.guideBar.hide();

    if (this.altHeld) {
      this.exitMeasureMode();
    }
    this.passThrough = false;
    this.disarmPick();

    document.removeEventListener('mouseout', this.handleMouseLeave, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('dblclick', this.handleBlockedPointer, true);
    document.removeEventListener('pointerdown', this.handleBlockedPointer, true);
    document.removeEventListener('pointerup', this.handleBlockedPointer, true);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('mousedown', this.handleMouseDown, true);
    document.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('scroll', this.handleLayoutChange, { capture: true });
    window.removeEventListener('resize', this.handleLayoutChange);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.domObserver?.disconnect();
    this.domObserver = null;

    this.clearHover();
    this.inspector.hide();
    this.closePopover();

    if (this.measureRafId !== null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
    if (this.hoverRafId !== null) {
      cancelAnimationFrame(this.hoverRafId);
      this.hoverRafId = null;
    }
  }

  private isOwnElement(e: Event): boolean {
    return e.composedPath().some(
      el => el === this || el === this.shadow
    );
  }

  private openPopover(element: Element, anchorRect?: DOMRect) {
    this.closePopover();

    const selector = generateSelector(element);
    const path = generatePath(element);
    const computedStyles = getComputedStyles(element);
    const rect = element.getBoundingClientRect();

    this.activePopover = createPopover(this.shadow, {
      element,
      selector,
      path,
      styles: computedStyles,
      anchorRect,
      onSubmit: (comment) => {
        const ariaAttrs: Record<string, string> = {};
        const dataAttrs: Record<string, string> = {};
        for (const attr of Array.from(element.attributes)) {
          if (attr.name === 'role' || attr.name.startsWith('aria-')) {
            ariaAttrs[attr.name] = attr.value;
          } else if (attr.name.startsWith('data-')) {
            dataAttrs[attr.name] = attr.value;
          }
        }

        const annotation: Annotation = {
          id: crypto.randomUUID(),
          selector,
          path,
          comment,
          styles: computedStyles,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          createdAt: new Date().toISOString(),
          element: element.tagName.toLowerCase(),
          classes: Array.from(element.classList).filter(c => !c.startsWith('kai-')),
          nearbyText: getNearbyText(element),
          url: location.href,
          ariaAttributes: ariaAttrs,
          dataAttributes: dataAttrs,
        };
        this.annotations.push(annotation);
        this.markers.clearPreview();
        this.persist();
        this.closePopover();
      },
      onClose: () => {
        this.markers.clearPreview();
        this.closePopover();
      },
    });
  }

  private openEditPopover(annotation: Annotation, markerRect?: DOMRect) {
    this.closePopover();
    this.activePopoverAnnotationId = annotation.id;
    this.markers.showBox(annotation.id);

    const target = resolveSelector(annotation.selector);
    if (!target) return;

    const path = annotation.path;
    const computedStyles = getComputedStyles(target);

    this.activePopover = createPopover(this.shadow, {
      element: target,
      selector: annotation.selector,
      path,
      styles: computedStyles,
      existingComment: annotation.comment,
      anchorRect: markerRect,
      onSubmit: (comment) => {
        annotation.comment = comment;
        this.persist();
        this.closePopover();
      },
      onDelete: () => {
        this.annotations = this.annotations.filter(a => a.id !== annotation.id);
        this.persist();
        this.closePopover();
      },
      onClose: () => this.closePopover(),
    });
  }

  private closePopover() {
    if (this.activePopoverAnnotationId) {
      this.markers.hideBox(this.activePopoverAnnotationId);
      this.activePopoverAnnotationId = null;
    }
    this.activePopover?.destroy();
    this.activePopover = null;
  }

  private persist() {
    saveSession(this.annotations);
    this.markers.update(this.annotations);
    this.fab.updateBadge(this.annotations.length);
    this.fab.updateActionStates(this.annotations.length);
  }
}

customElements.define('ui-annotator', UIAnnotator);

if (!document.querySelector('ui-annotator')) {
  document.body.appendChild(document.createElement('ui-annotator'));
}
