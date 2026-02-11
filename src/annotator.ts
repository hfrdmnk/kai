import type { Annotation, FabCorner } from './types.ts';
import { styles } from './styles.ts';
import { generateSelector, generatePath } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { loadSession, saveSession, clearSession, loadFabCorner, saveFabCorner } from './core/session.ts';
import { computeCrosshair, computeTextInspectData, findLargestEnclosedElement } from './core/measure.ts';
import { toMarkdown } from './export/markdown.ts';
import { createOverlay } from './ui/highlight.ts';
import { createFab } from './ui/fab.ts';
import { createPopover } from './ui/popover.ts';
import { createMarkerManager } from './ui/markers.ts';
import { createInspector } from './ui/inspector.ts';

const DRAG_THRESHOLD = 5;

class UIAnnotator extends HTMLElement {
  private shadow: ShadowRoot;
  private annotations: Annotation[] = [];
  private active = false;
  private fabCorner: FabCorner;
  private altHeld = false;
  private shiftHeld = false;
  private dragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private measureRafId: number | null = null;
  private highlightLocked = false;

  private fab!: ReturnType<typeof createFab>;
  private overlay!: ReturnType<typeof createOverlay>;
  private inspector!: ReturnType<typeof createInspector>;
  private markers!: ReturnType<typeof createMarkerManager>;
  private activePopover: ReturnType<typeof createPopover> | null = null;
  private activePopoverAnnotationId: string | null = null;

  private hoveredElement: Element | null = null;

  private handleMouseOver: (e: MouseEvent) => void;
  private handleMouseOut: () => void;
  private handleClick: (e: MouseEvent) => void;
  private handleGlobalKeydown: (e: KeyboardEvent) => void;
  private handleKeydown: (e: KeyboardEvent) => void;
  private handleKeyup: (e: KeyboardEvent) => void;
  private handleWindowBlur: () => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleMouseDown: (e: MouseEvent) => void;
  private handleMouseUp: (e: MouseEvent) => void;

  constructor() {
    super();
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
      onCornerChange: (c) => {
        this.fabCorner = c;
        saveFabCorner(c);
      },
    });

    this.overlay = createOverlay(this.shadow);
    this.inspector = createInspector(this.shadow);
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
    this.handleMouseOver = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      const target = e.target as Element;
      if (target === document.documentElement || target === document.body) return;
      this.hoveredElement = target;
      if (!this.altHeld) {
        this.overlay.show(target);
      }
    };

    this.handleMouseOut = () => {
      this.hoveredElement = null;
      if (!this.altHeld) {
        this.overlay.hide();
      }
    };

    this.handleClick = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.altHeld) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const target = this.hoveredElement;
      if (!target) return;
      this.overlay.hide();
      const markerRect = this.markers.showPreview(target);
      this.openPopover(target, markerRect);
    };

    this.handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'A' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.active && !this.activePopover) {
        this.deactivate();
      }
    };

    this.handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (this.altHeld) return;
        this.altHeld = true;
        this.overlay.hide();
        document.body.style.cursor = 'crosshair';
        this.scheduleMeasureUpdate();
      }
      if (e.key === 'Shift') {
        this.shiftHeld = true;
        if (this.altHeld && !this.dragging && !this.highlightLocked) {
          this.scheduleMeasureUpdate();
        }
      }
    };

    this.handleKeyup = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        this.exitMeasureMode();
      }
      if (e.key === 'Shift') {
        this.shiftHeld = false;
        if (this.altHeld && !this.dragging && !this.highlightLocked) {
          this.scheduleMeasureUpdate();
        }
      }
    };

    this.handleWindowBlur = () => {
      if (this.altHeld) {
        this.exitMeasureMode();
      }
    };

    this.handleMouseMove = (e: MouseEvent) => {
      this.lastMousePos = { x: e.clientX, y: e.clientY };

      if (!this.altHeld) return;

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
      if (!this.altHeld) return;
      if (e.button !== 0) return;
      e.preventDefault();
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragging = false;
      this.highlightLocked = false;
    };

    this.handleMouseUp = (e: MouseEvent) => {
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

  private exitMeasureMode() {
    this.altHeld = false;
    this.shiftHeld = false;
    this.dragging = false;
    this.dragStart = null;
    this.highlightLocked = false;
    document.body.style.cursor = '';
    this.inspector.hide();
    if (this.measureRafId !== null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
    if (this.hoveredElement) {
      this.overlay.show(this.hoveredElement);
    }
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
      if (el && el !== this && el !== document.documentElement && el !== document.body) {
        const textData = computeTextInspectData(el);
        if (textData) {
          this.inspector.showTextInfo(cx, cy, textData);
          return;
        }
      }
      // Fall through to crosshair if not hovering text
    }

    const data = computeCrosshair(cx, cy, this);
    this.inspector.showCrosshair(data);
  }

  connectedCallback() {
    document.addEventListener('keydown', this.handleGlobalKeydown);
  }

  disconnectedCallback() {
    this.deactivate();
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    this.markers.destroy();
    this.overlay.destroy();
    this.inspector.destroy();
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

    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('mousedown', this.handleMouseDown, true);
    document.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  private deactivate() {
    this.active = false;
    this.fab.setActive(false);
    this.markers.setActive(false);

    if (this.altHeld) {
      this.exitMeasureMode();
    }

    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('mousedown', this.handleMouseDown, true);
    document.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.overlay.hide();
    this.inspector.hide();
    this.hoveredElement = null;
    this.closePopover();

    if (this.measureRafId !== null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
  }

  private isOwnElement(e: MouseEvent): boolean {
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
        const annotation: Annotation = {
          id: crypto.randomUUID(),
          selector,
          path,
          comment,
          styles: computedStyles,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          createdAt: new Date().toISOString(),
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

    const target = document.querySelector(annotation.selector);
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
