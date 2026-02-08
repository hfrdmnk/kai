import type { Annotation } from './types.ts';
import { styles } from './styles.ts';
import { iconKai, iconChevron } from './icons.ts';
import { generateSelector, generatePath } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { loadSession, saveSession, clearSession } from './core/session.ts';
import { toJSON } from './export/json.ts';
import { toMarkdown } from './export/markdown.ts';
import { createOverlay } from './ui/highlight.ts';
import { createPanel } from './ui/panel.ts';
import { createDrawer } from './ui/drawer.ts';
import { createMarkerManager } from './ui/markers.ts';
import { showToast } from './ui/toast.ts';

const parser = new DOMParser();

const setIcon = (el: HTMLElement, svg: string) => {
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  el.appendChild(document.importNode(doc.documentElement, true));
};

class UIAnnotator extends HTMLElement {
  private shadow: ShadowRoot;
  private annotations: Annotation[] = [];
  private active = false;

  private fab!: HTMLButtonElement;
  private fabBadge!: HTMLElement;
  private drawerToggle!: HTMLButtonElement;

  private overlay!: ReturnType<typeof createOverlay>;
  private markers!: ReturnType<typeof createMarkerManager>;
  private panel: ReturnType<typeof createPanel> | null = null;
  private drawer: ReturnType<typeof createDrawer> | null = null;

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

    this.buildFAB();
    this.overlay = createOverlay(this.shadow);
    this.markers = createMarkerManager(this.shadow);

    if (this.annotations.length) {
      this.markers.update(this.annotations);
      this.updateBadge();
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
      this.openPanel(target);
    };

    this.handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'A' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.active && !this.panel) {
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
    this.fab.classList.add('kai-fab--active');

    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);

    this.updateDrawerToggle();
  }

  private deactivate() {
    this.active = false;
    this.fab.classList.remove('kai-fab--active');

    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);

    this.overlay.hide();
    this.hoveredElement = null;
    this.closePanel();
    this.closeDrawer();
    this.drawerToggle.style.display = 'none';
  }

  private isOwnElement(e: MouseEvent): boolean {
    return e.composedPath().some(
      el => el === this || el === this.shadow
    );
  }

  private buildFAB() {
    this.fab = document.createElement('button');
    this.fab.className = 'kai-fab';
    this.fab.setAttribute('aria-label', 'Toggle UI annotator');
    setIcon(this.fab, iconKai);

    this.fabBadge = document.createElement('span');
    this.fabBadge.className = 'kai-fab-badge';
    this.fabBadge.style.display = 'none';
    this.fab.appendChild(this.fabBadge);

    this.fab.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.drawerToggle = document.createElement('button');
    this.drawerToggle.className = 'kai-drawer-toggle';
    this.drawerToggle.setAttribute('aria-label', 'Open annotations drawer');
    setIcon(this.drawerToggle, iconChevron);
    this.drawerToggle.style.display = 'none';

    this.drawerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.drawer) {
        this.closeDrawer();
      } else {
        this.openDrawer();
      }
    });

    this.shadow.appendChild(this.fab);
    this.shadow.appendChild(this.drawerToggle);
  }

  private updateBadge() {
    const count = this.annotations.length;
    if (count > 0) {
      this.fabBadge.textContent = String(count);
      this.fabBadge.style.display = 'flex';
    } else {
      this.fabBadge.style.display = 'none';
    }
  }

  private updateDrawerToggle() {
    this.drawerToggle.style.display =
      this.active && this.annotations.length > 0 ? 'flex' : 'none';
  }

  private openPanel(element: Element) {
    this.closePanel();

    const selector = generateSelector(element);
    const path = generatePath(element);
    const computedStyles = getComputedStyles(element);
    const rect = element.getBoundingClientRect();

    this.panel = createPanel(this.shadow, {
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
        this.closePanel();
      },
      onClose: () => this.closePanel(),
    });
  }

  private closePanel() {
    this.panel?.destroy();
    this.panel = null;
  }

  private openDrawer() {
    this.closeDrawer();

    this.drawer = createDrawer(this.shadow, {
      annotations: this.annotations,
      onSelect: (annotation) => {
        const el = document.querySelector(annotation.selector);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onRemove: (id) => {
        this.annotations = this.annotations.filter(a => a.id !== id);
        this.persist();
        this.drawer?.update(this.annotations);
      },
      onClearAll: () => {
        this.annotations = [];
        clearSession();
        this.markers.update([]);
        this.updateBadge();
        this.updateDrawerToggle();
        this.drawer?.update([]);
      },
      onExportJSON: () => {
        navigator.clipboard.writeText(toJSON(this.annotations)).then(() => {
          showToast(this.shadow, 'JSON copied to clipboard');
        });
      },
      onExportMarkdown: () => {
        navigator.clipboard.writeText(toMarkdown(this.annotations)).then(() => {
          showToast(this.shadow, 'Markdown copied to clipboard');
        });
      },
      onClose: () => this.closeDrawer(),
    });
  }

  private closeDrawer() {
    this.drawer?.destroy();
    this.drawer = null;
  }

  private persist() {
    saveSession(this.annotations);
    this.markers.update(this.annotations);
    this.updateBadge();
    this.updateDrawerToggle();
  }
}

customElements.define('ui-annotator', UIAnnotator);

if (!document.querySelector('ui-annotator')) {
  document.body.appendChild(document.createElement('ui-annotator'));
}
