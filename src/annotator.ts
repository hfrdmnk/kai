import type { Annotation, FabCorner } from './types.ts';
import { styles } from './styles.ts';
import { generateSelector, generatePath } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { loadSession, saveSession, clearSession, loadFabCorner, saveFabCorner } from './core/session.ts';
import { toMarkdown } from './export/markdown.ts';
import { createOverlay } from './ui/highlight.ts';
import { createFab } from './ui/fab.ts';
import { createPopover } from './ui/popover.ts';
import { createMarkerManager } from './ui/markers.ts';
import { showToast } from './ui/toast.ts';

class UIAnnotator extends HTMLElement {
  private shadow: ShadowRoot;
  private annotations: Annotation[] = [];
  private active = false;
  private fabCorner: FabCorner;

  private fab!: ReturnType<typeof createFab>;
  private overlay!: ReturnType<typeof createOverlay>;
  private markers!: ReturnType<typeof createMarkerManager>;
  private activePopover: ReturnType<typeof createPopover> | null = null;

  private hoveredElement: Element | null = null;

  private handleMouseOver: (e: MouseEvent) => void;
  private handleMouseOut: () => void;
  private handleClick: (e: MouseEvent) => void;
  private handleGlobalKeydown: (e: KeyboardEvent) => void;

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
          showToast(this.shadow, 'Markdown copied to clipboard', this.fabCorner);
        });
      },
      onClearAll: () => {
        this.annotations = [];
        clearSession();
        this.markers.update([]);
        this.fab.updateBadge(0);
        this.closePopover();
      },
      onCornerChange: (c) => {
        this.fabCorner = c;
        saveFabCorner(c);
      },
    });

    this.overlay = createOverlay(this.shadow);
    this.markers = createMarkerManager(this.shadow);

    if (this.annotations.length) {
      this.markers.update(this.annotations);
      this.fab.updateBadge(this.annotations.length);
    }

    // Bind event handlers
    this.handleMouseOver = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      const target = e.target as Element;
      if (target === document.documentElement || target === document.body) return;
      this.hoveredElement = target;
      this.overlay.show(target);
    };

    this.handleMouseOut = () => {
      this.hoveredElement = null;
      this.overlay.hide();
    };

    this.handleClick = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const target = this.hoveredElement;
      if (!target) return;
      this.overlay.hide();
      this.openPopover(target);
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
  }

  connectedCallback() {
    document.addEventListener('keydown', this.handleGlobalKeydown);
  }

  disconnectedCallback() {
    this.deactivate();
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    this.markers.destroy();
    this.overlay.destroy();
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

    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);
  }

  private deactivate() {
    this.active = false;
    this.fab.setActive(false);

    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);

    this.overlay.hide();
    this.hoveredElement = null;
    this.closePopover();
  }

  private isOwnElement(e: MouseEvent): boolean {
    return e.composedPath().some(
      el => el === this || el === this.shadow
    );
  }

  private openPopover(element: Element) {
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
        this.persist();
        this.closePopover();
      },
      onClose: () => this.closePopover(),
    });
  }

  private closePopover() {
    this.activePopover?.destroy();
    this.activePopover = null;
  }

  private persist() {
    saveSession(this.annotations);
    this.markers.update(this.annotations);
    this.fab.updateBadge(this.annotations.length);
  }
}

customElements.define('ui-annotator', UIAnnotator);

if (!document.querySelector('ui-annotator')) {
  document.body.appendChild(document.createElement('ui-annotator'));
}
