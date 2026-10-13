import type { AccentId, Annotation, FabCorner, Theme } from './types.ts';
import { styles } from './styles.ts';
import { generateSelector, generateLocator, generatePath, resolveAnnotation, ownAnnotationOf, composedParent, composedChildren, composedContains } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { getNearbyText } from './core/text.ts';
import { INTERACTION_KEY, SHORTCUTS, isMac, type ShortcutAction } from './core/platform.ts';
import { loadSession, saveSession, clearSession, loadFabCorner, saveFabCorner, loadTheme, saveTheme, loadAccent, saveAccent } from './core/session.ts';
import { applyAccent } from './core/accents.ts';
import { computeCrosshair, computeTextInspectData, findLargestEnclosedElement, type TextInspectData } from './core/measure.ts';
import { computeBoxModel, type BoxModelData } from './core/box-model.ts';
import { withoutEdit } from './core/adjust.ts';
import { createEditStyles, type StylePreview } from './core/edit-styles.ts';
import { nextHeld, NONE_HELD, type HeldKeys } from './core/held-keys.ts';
import { emptyHistory, record, redo, undo, type History } from './core/history.ts';
import { toMarkdown } from './export/markdown.ts';
import { createOverlay } from './ui/highlight.ts';
import { createFab } from './ui/fab.ts';
import { createPopover } from './ui/popover.ts';
import { createMarkerManager } from './ui/markers.ts';
import { createInspector } from './ui/inspector.ts';
import { createGuideBar, type GuideMode, type KeyId } from './ui/guide-bar.ts';
import { createAdjustMode } from './adjust-mode.ts';

const DRAG_THRESHOLD = 5;
/** Pointer travel after a mode switch that counts as moving on rather than hand jitter */
const MODE_SWITCH_SLOP = 4;
const BLOCKED_POINTER_EVENTS = [
  'dblclick', 'auxclick', 'contextmenu', 'dragstart',
  'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout',
  'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
] as const;

/** SVG internals (path, g, use…) are never what a user means to annotate; snap to the root <svg>. */
const snapToSvgRoot = (el: Element): Element => {
  let current = el;
  while (current instanceof SVGElement && current.ownerSVGElement) {
    current = current.ownerSVGElement;
  }
  return current;
};

const isEditable = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

let instance: UIAnnotator | null = null;

class UIAnnotator extends HTMLElement {
  private shadow!: ShadowRoot;
  private annotations: Annotation[] = [];
  private active = false;
  private fabCorner!: FabCorner;
  private theme!: Theme;
  private accent!: AccentId;
  private readonly systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  /** Inspect mode, entered by pressing Alt (unless a property is armed) and left by releasing it */
  private inspecting = false;
  /** Held modifiers for every mode: inspect switches layers on Shift (text metrics) and Ctrl (box model), adjust reads Alt and Shift */
  private held: HeldKeys = NONE_HELD;
  private passThrough = false;
  private pickMode = false;
  private settingsOpen = false;
  private dragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private hasPointer = false;
  private measureRafId: number | null = null;
  private highlightLocked = false;
  /** Box model of the last target; reading a flex container's children every frame is costly */
  private boxCache: { el: Element; rect: DOMRect; data: BoxModelData | null } | null = null;
  private readonly editStyles = createEditStyles();
  /** Undo history of the annotation list for this page load; it survives turning kai off and on */
  private history: History<Annotation[]> = emptyHistory();

  private fab!: ReturnType<typeof createFab>;
  private overlay!: ReturnType<typeof createOverlay>;
  private inspector!: ReturnType<typeof createInspector>;
  private markers!: ReturnType<typeof createMarkerManager>;
  private guideBar!: ReturnType<typeof createGuideBar>;
  private adjustMode!: ReturnType<typeof createAdjustMode>;
  private activePopover: ReturnType<typeof createPopover> | null = null;
  private activePopoverAnnotationId: string | null = null;

  // Selection shared by every mode: hoverTarget is what the hit test found, selectedElement
  // what annotate, inspect and the box model show (hoverTarget or an ancestor walked to with ↑).
  private hoverTarget: Element | null = null;
  private selectedElement: Element | null = null;
  private walkedUp = false;
  /** Pointer position at a mode switch that carried a ↑ walk over; the first real move afterwards drops the walk */
  private modeSwitchAt: { x: number; y: number } | null = null;
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
  private handleWheel!: (e: WheelEvent) => void;
  private handleBeforeInput!: (e: Event) => void;
  private handleHostFocus!: (e: FocusEvent) => void;

  constructor() {
    super();

    if (instance) {
      console.warn('<ui-annotator> is a singleton — only one instance is allowed per page.');
      return;
    }
    instance = this;

    this.shadow = this.attachShadow({ mode: 'closed' });
    // Kai controls are not outside clicks or keyboard commands for the host app.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu', 'keyup']) {
      this.shadow.addEventListener(type, e => e.stopPropagation());
    }
    this.shadow.addEventListener('keydown', e => {
      this.handleGlobalKeydown(e as KeyboardEvent);
      if (!this.passThrough || (e as KeyboardEvent).key !== 'Escape') e.stopPropagation();
    });

    // A <style> element is blocked by the page's style-src CSP; a constructed sheet is not
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    this.shadow.adoptedStyleSheets = [sheet];

    this.annotations = loadSession();
    this.fabCorner = loadFabCorner();
    this.theme = loadTheme();
    this.accent = loadAccent();

    this.fab = createFab(this.shadow, {
      initialCorner: this.fabCorner,
      onToggle: () => this.toggle(),
      onCopyMarkdown: () => {
        navigator.clipboard.writeText(toMarkdown(this.annotations)).then(() => {
          this.fab.confirmCopy();
        });
      },
      onClearAll: () => {
        this.adjustMode.disarm();
        this.closePopover();
        if (this.annotations.length) this.commit([], 'clear all');
      },
      onPickToggle: (armed) => {
        this.adjustMode.disarm();
        this.pickMode = armed;
        if (this.passThrough) this.exitPassThrough();
        if (armed) this.closePopover();
        this.guideBar.show(armed ? 'pick' : 'annotate');
      },
      onInteractionToggle: () => this.toggleInteraction(),
      onHelpToggle: () => {
        this.adjustMode.disarm();
        this.fab.closeSettings();
        this.clearHover();
        this.inspector.hide();
        this.guideBar.toggleHelp();
      },
      onCornerChange: (c) => {
        this.fabCorner = c;
        saveFabCorner(c);
      },
      onSettingsToggle: (open) => {
        this.settingsOpen = open;
        if (open) {
          this.adjustMode.disarm();
          this.clearHover();
          this.guideBar.hide();
        } else if (this.active) {
          this.guideBar.show(this.passThrough ? 'interact' : this.pickMode ? 'pick' : 'annotate');
          this.handleLayoutChange();
        }
      },
      settings: {
        version: __KAI_VERSION__,
        theme: this.theme,
        accent: this.accent,
        onThemeChange: (t) => {
          this.theme = t;
          saveTheme(t);
          this.applyTheme();
        },
        onAccentChange: (a) => {
          this.accent = a;
          saveAccent(a);
          applyAccent(this, a);
        },
      },
    });

    this.overlay = createOverlay(this.shadow);
    this.inspector = createInspector(this.shadow);
    this.guideBar = createGuideBar(this.shadow);
    this.adjustMode = createAdjustMode({
      shadowRoot: this.shadow,
      guideBar: this.guideBar,
      overlay: this.overlay,
      held: () => this.held,
      pointer: () => this.lastMousePos,
      selection: () => this.selectedElement,
      annotations: () => this.annotations,
      commit: (next, label) => this.commit(next, label),
      createAnnotation: (element, styles) => this.createAnnotation(element, '', styles),
      applyEdits: (preview) => this.applyEdits(preview),
      readOwn: (el, read, longhands) => this.editStyles.readOwn(el, read, longhands),
      baseMode: () => this.baseMode(),
      isActive: () => this.active,
      onArmedChange: (armed) => this.markers.setPassive(armed),
      onDisarm: () => {
        this.hoverDirty = true;
        if (this.active) this.scheduleHoverUpdate();
      },
    });
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
      // Saved adjustments are part of the session
      this.applyEdits();
    }
    this.fab.updateActionStates(this.annotations.length);

    // Bind event handlers
    this.handleMouseLeave = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      this.hasPointer = false;
      // An armed property keeps its target while the pointer is outside the window
      if (!this.adjustMode.isArmed()) this.clearHover();
      this.guideBar.updatePointer(-1, -1);
    };

    this.handleLayoutChange = () => {
      // Host modals may hide their siblings, but kai remains a separate set of controls.
      if (this.getAttribute('aria-hidden') === 'true') this.removeAttribute('aria-hidden');
      this.hoverDirty = true;
      this.boxCache = null;
      this.scheduleHoverUpdate();
      if (this.inspecting) this.scheduleMeasureUpdate();
      this.adjustMode.refresh();
    };

    this.handleClick = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // A press while armed adjusts (or changes nothing); it never opens the annotation popover
      if (this.adjustMode.consumeClick()) return;
      if (this.fab.closeSettings()) return;
      if (this.inspecting) return;

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

      // The element's own annotation: the last one resolving to it, whose edits are painted
      const existing = ownAnnotationOf(this.annotations, target, resolveAnnotation);

      if (existing) {
        const markerRect = this.markers.getMarkerRect(existing.id);
        this.openEditPopover(existing, markerRect);
      } else {
        const markerRect = this.markers.showPreview(target);
        this.openPopover(target, markerRect);
      }
    };

    // Keep compatibility mouse events for measurement drags; mousedown below
    // prevents native focus. Window capture also precedes Radix's document listeners.
    this.handleBlockedPointer = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough) return;
      if (['contextmenu', 'auxclick', 'dblclick', 'dragstart'].includes(e.type)) e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type === 'pointerdown') this.closePopover();
      if (e.type === 'mouseout') this.handleMouseLeave(e);
    };

    this.handleBeforeInput = (e: Event) => {
      if (this.isOwnElement(e)) {
        e.stopImmediatePropagation();
        return;
      }
      if (this.passThrough) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    this.handleHostFocus = (e: FocusEvent) => {
      // Host modal focus traps must not pull focus out of kai's closed shadow root.
      if (this.isOwnElement(e) || (e.type === 'focusout' && e.relatedTarget === this) || !this.passThrough) e.stopImmediatePropagation();
    };

    this.handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.active && !this.activePopover) {
        if (this.fab.closeSettings()) return;
        if (this.passThrough) return;
        if (this.pickMode) {
          this.disarmPick();
        } else {
          this.deactivate();
        }
      }
    };

    this.handleKeydown = (e: KeyboardEvent) => {
      this.trackHeld(e);
      if (e.key === 'Escape' && (this.guideBar.closeHelp() || this.fab.closeSettings())) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const editable = e.composedPath().some(isEditable) || isEditable(this.shadow.activeElement);
      // In the popover, I and ? belong to it like every other key (I would close it and lose a typed note)
      const inPopover = this.isOwnElement(e) && !!this.activePopover?.hasFocus();
      if (!e.repeat && !e.metaKey && !e.ctrlKey && !editable && !inPopover
        // Mid-drag, I would let the release through to the page as a click
        && (e.key === '?' || (!e.altKey && e.key.toUpperCase() === INTERACTION_KEY && !this.adjustMode.isDragging()))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.hideFocusRing();
        if (e.key === '?') {
          this.adjustMode.disarm();
          this.fab.closeSettings();
          this.clearHover();
          this.inspector.hide();
          this.guideBar.toggleHelp();
        } else this.toggleInteraction();
        return;
      }
      const own = this.isOwnElement(e);
      if (this.passThrough) {
        // Escape still dismisses page overlays after using the interaction button.
        if (own && e.key !== 'Escape') this.forwardKeyEvent(e);
        return;
      }
      // Undo / redo in annotation mode; text fields and kai's panels keep their own (native) undo
      const historyAction = this.historyKey(e);
      if (historyAction && !this.activePopover && !this.settingsOpen && !this.guideBar.isHelpOpen()
        && !e.composedPath().some(isEditable) && !isEditable(this.shadow.activeElement)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.hideFocusRing();
        this.stepHistory(historyAction);
        return;
      }
      // Focus in the popover (a remove button, a footer button): the keys are its, not kai's shortcuts.
      // Escape and Tab keep their handling below
      if (own && this.activePopover?.hasFocus() && e.key !== 'Escape' && e.key !== 'Tab') {
        this.forwardKeyEvent(e);
        return;
      }
      // An armed property's keys come first: they change meaning while armed
      if (this.adjustMode.handleKeydown(e, this.canArm(e))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.hideFocusRing();
        return;
      }
      const action = this.shortcutFor(e);
      if (action) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.hideFocusRing();
        if (action !== 'settings') this.fab.closeSettings();
        this.fab.pressAction(action);
        return;
      }
      if (e.key === 'Escape') {
        if (this.activePopover) this.activePopover.handleEscape();
        else this.handleGlobalKeydown(e);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === 'Tab' && !own) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.fab.focusToolbar(e.shiftKey);
        return;
      }
      if (e.key === 'Tab') {
        // kai's controls see it first (e.g. Tab accepts an autocomplete suggestion)
        this.forwardKeyEvent(e);
        if (!e.defaultPrevented) this.wrapFocus(e);
        return;
      }
      if (own && (editable || this.settingsOpen || this.activePopover || this.guideBar.isHelpOpen())) {
        this.forwardKeyEvent(e);
        return;
      }
      // While a property is armed, Alt picks the opposite side instead of inspecting
      if (e.key === 'Alt' && !this.inspecting && !this.adjustMode.isArmed()) {
        this.inspecting = true;
        this.markModeSwitch();
        // The selection carries over; inspect mode draws it its own way
        this.overlay.hide();
        document.body.style.cursor = 'crosshair';
        this.guideBar.show('measure', this.measureKeys());
        this.scheduleMeasureUpdate();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        this.walkAncestors(e);
      }
      if (own) {
        if (['Alt', 'Shift', 'Control', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        this.forwardKeyEvent(e);
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    this.handleKeyup = (e: KeyboardEvent) => {
      this.trackHeld(e);
      if (e.key === 'Alt' && this.inspecting) {
        this.exitMeasureMode();
      }
      if (this.isOwnElement(e)) this.forwardKeyEvent(e);
      else if (!this.passThrough) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    this.handleWindowBlur = () => {
      if (this.inspecting) {
        this.exitMeasureMode();
      }
      this.adjustMode.disarm();
      this.held = NONE_HELD;
    };

    this.handleMouseMove = (e: MouseEvent) => {
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      if (this.modeSwitchAt && Math.hypot(e.clientX - this.modeSwitchAt.x, e.clientY - this.modeSwitchAt.y) >= MODE_SWITCH_SLOP) {
        this.modeSwitchAt = null;
        this.walkedUp = false;
        this.hoverDirty = true;
      }
      this.hasPointer = true;
      // The drag readout stays readable when the pointer passes under the HUD
      if (this.adjustMode.isDragging()) this.guideBar.updatePointer(-1, -1);
      else this.guideBar.updatePointer(e.clientX, e.clientY);
      if (!this.isOwnElement(e) && !this.passThrough) e.stopImmediatePropagation();

      if (this.adjustMode.isArmed()) {
        this.trackHeld(e);
        this.adjustMode.refresh();
        return;
      }

      if (!this.inspecting) {
        this.scheduleHoverUpdate();
        return;
      }
      // Catches modifier changes whose key events went elsewhere
      this.trackHeld(e);

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

    // Ctrl+wheel is browser zoom, which the site would keep after kai closes
    this.handleWheel = (e: WheelEvent) => {
      if (this.inspecting && e.ctrlKey) e.preventDefault();
    };

    this.handleMouseDown = (e: MouseEvent) => {
      if (this.isOwnElement(e)) return;
      if (this.passThrough) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      if (this.adjustMode.pointerDown(e)) return;
      if (!this.inspecting) return;
      if (e.button !== 0) return;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragging = false;
      this.highlightLocked = false;
    };

    this.handleMouseUp = (e: MouseEvent) => {
      // A drag ends wherever it's released, over kai's own controls too, at the release's position
      if (this.adjustMode.isDragging()) this.lastMousePos = { x: e.clientX, y: e.clientY };
      if (this.adjustMode.pointerUp(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (this.isOwnElement(e)) return;
      if (this.passThrough) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!this.inspecting) return;
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
    // An armed property locks the selection; ↑ / ↓ still walk it
    if (!this.active || this.inspecting || this.adjustMode.isArmed() || this.passThrough || this.settingsOpen || this.guideBar.isHelpOpen() || !this.hasPointer) return;

    const dirty = this.hoverDirty;
    this.hoverDirty = false;

    const hit = this.hitTest(this.lastMousePos.x, this.lastMousePos.y);
    if (!hit) {
      this.clearHover();
      return;
    }
    if (hit === this.hoverTarget && !dirty) return;
    this.overlay.show(this.retarget(hit));
  }

  /** Points the selection at a new hit, keeping an ancestor walked up to with ↑ while it still contains the hit */
  private retarget(hit: Element): Element {
    this.hoverTarget = hit;
    const keepWalked = this.walkedUp
      && this.selectedElement?.isConnected
      && composedContains(this.selectedElement, hit);
    if (!keepWalked || !this.selectedElement) {
      this.selectedElement = hit;
      this.walkedUp = false;
      this.modeSwitchAt = null;
    }
    return this.selectedElement;
  }

  private clearHover() {
    this.hoverTarget = null;
    this.selectedElement = null;
    this.walkedUp = false;
    this.modeSwitchAt = null;
    this.overlay.hide();
  }

  /**
   * The page is frozen, so Tab cycles through kai's controls instead of leaving for the page or
   * browser UI. The shortcut panel is modal and keeps focus to itself.
   */
  private wrapFocus(e: KeyboardEvent) {
    const scope = (this.guideBar.isHelpOpen() && this.shadow.querySelector('.kai-shortcuts')) || this.shadow;
    const focusable = [...scope.querySelectorAll<HTMLElement>('button, textarea, input, [tabindex]')]
      .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && el.checkVisibility({ visibilityProperty: true }));
    if (!focusable.length) return;
    const i = focusable.indexOf(this.shadow.activeElement as HTMLElement);
    if (i !== -1 && i !== (e.shiftKey ? 0 : focusable.length - 1)) return;
    e.preventDefault();
    focusable[e.shiftKey ? focusable.length - 1 : 0].focus();
  }

  private walkAncestors(e: KeyboardEvent) {
    if (this.activePopover || this.passThrough || this.adjustMode.isDragging()) return;
    if (!this.selectedElement || !this.hoverTarget || isEditable(e.target)) return;

    // A box is showing, so the arrows belong to us even at the ends of the chain
    e.preventDefault();
    // A walk made in the current mode is deliberate; only one carried across a switch is temporary
    this.modeSwitchAt = null;

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
    if (this.inspecting) this.scheduleMeasureUpdate();
    else if (this.adjustMode.isArmed()) this.adjustMode.retarget(this.selectedElement);
    else this.overlay.show(this.selectedElement);
  }

  // ── Modes ──

  private toggleInteraction() {
    this.guideBar.closeHelp();
    this.fab.closeSettings();
    if (this.passThrough) this.exitPassThrough();
    else this.enterPassThrough();
  }

  private enterPassThrough() {
    if (this.inspecting) this.exitMeasureMode();
    this.adjustMode.disarm();
    this.closePopover();
    this.passThrough = true;
    this.fab.setInteractionActive(true);
    this.clearHover();
    this.guideBar.show('interact');
  }

  private exitPassThrough() {
    this.passThrough = false;
    this.fab.setInteractionActive(false);
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
    this.inspecting = false;
    this.markModeSwitch();
    this.dragging = false;
    this.dragStart = null;
    this.highlightLocked = false;
    document.body.style.cursor = '';
    this.inspector.hide();
    this.boxCache = null;
    if (this.active) this.guideBar.show(this.pickMode ? 'pick' : 'annotate');
    if (this.measureRafId !== null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
    this.handleLayoutChange();
  }

  private boxModelOf(el: Element): BoxModelData | null {
    // A moved or resized box (transitions, shadow-DOM scrolling) isn't reported by layout events
    const rect = el.getBoundingClientRect();
    const cached = this.boxCache;
    if (cached?.el === el && cached.rect.x === rect.x && cached.rect.y === rect.y
      && cached.rect.width === rect.width && cached.rect.height === rect.height) return cached.data;
    this.boxCache = { el, rect, data: computeBoxModel(el) };
    return this.boxCache.data;
  }

  /**
   * Keeps `held` current from key and mouse events. Shift (text metrics) and Ctrl (box model) switch
   * inspect modes; an armed property reads Alt and Shift, and there mouse events can only add a
   * modifier (see `nextHeld`).
   */
  private trackHeld(e: KeyboardEvent | MouseEvent) {
    const next = nextHeld(this.held, e, !this.adjustMode.isArmed());
    if (next === this.held) return;
    const switchesInspect = next.shift !== this.held.shift || next.ctrl !== this.held.ctrl;
    this.held = next;
    this.adjustMode.refresh();
    if (!this.inspecting || !switchesInspect) return;
    this.markModeSwitch();
    this.refreshMeasure();
  }

  /**
   * The walked selection survives a mode switch while the pointer stays still (the user is
   * still looking at that element); `handleMouseMove` drops it on the first real move.
   */
  private markModeSwitch() {
    if (this.walkedUp) this.modeSwitchAt = { ...this.lastMousePos };
  }

  private refreshMeasure() {
    this.guideBar.updateKeys(this.measureKeys());
    if (!this.dragging && !this.highlightLocked) this.scheduleMeasureUpdate();
  }

  private measureKeys(): KeyId[] {
    const keys: KeyId[] = ['alt'];
    if (this.held.shift) keys.push('shift');
    if (this.held.ctrl) keys.push('ctrl');
    return keys;
  }

  /** Whether the viewport point shows `el` or a descendant; kai's own UI is see-through */
  private pointShows(el: Element, x: number, y: number): boolean {
    if (document.elementFromPoint(x, y) === this) return true;
    const hit = this.hitTest(x, y);
    return !!hit && composedContains(el, hit);
  }

  private scheduleMeasureUpdate() {
    if (this.measureRafId !== null) return;
    this.measureRafId = requestAnimationFrame(() => {
      this.measureRafId = null;
      this.updateMeasure();
    });
  }

  private updateMeasure() {
    if (!this.inspecting || this.guideBar.isHelpOpen()) return;

    if (this.highlightLocked) return;

    const { x: cx, y: cy } = this.lastMousePos;

    if (this.dragging && this.dragStart) {
      this.inspector.showSelection(this.dragStart.x, this.dragStart.y, cx, cy);
      return;
    }

    const hit = this.hitTest(cx, cy);
    const target = hit ? this.retarget(hit) : null;
    if (!target) {
      this.inspector.hide();
      return;
    }
    // Box model layer (Ctrl), drawn under the crosshair or text metrics
    const box = this.held.ctrl ? this.boxModelOf(target) : null;

    let textData: TextInspectData | null = null;
    if (this.held.shift) {
      textData = computeTextInspectData(target);
      if (textData) this.inspector.showTextInfo(cx, cy, textData, box?.rows);
      else this.inspector.hide();
    } else {
      this.inspector.showCrosshair(computeCrosshair(cx, cy, (x, y) => this.pointShows(target, x, y)));
    }
    // Once walked up, outline what's measured; the box model already draws it
    this.inspector.showTarget(this.walkedUp && !box ? target.getBoundingClientRect() : null);
    // With text metrics showing, the box rows already sit in that card
    if (box) this.inspector.showBoxModel(box, !textData);
    else this.inspector.hideBoxModel();
  }

  /**
   * Focus rings appear once the user tabs and go away on pointer use or a kai shortcut,
   * which moves focus itself (e.g. `,` focuses the theme radio).
   */
  private handleFocusModality = (e: Event) => {
    if (e.type === 'pointerdown') this.hideFocusRing();
    else if ((e as KeyboardEvent).key === 'Tab') this.setAttribute('data-focus-ring', '');
  };

  private hideFocusRing() {
    this.removeAttribute('data-focus-ring');
  }

  private applyTheme = () => {
    const resolved = this.theme === 'system'
      ? (this.systemDark.matches ? 'dark' : 'light')
      : this.theme;
    this.setAttribute('data-theme', resolved);
  };

  connectedCallback() {
    // Attributes may not be set in the constructor of an element made via createElement
    this.applyTheme();
    applyAccent(this, this.accent);
    this.systemDark.addEventListener('change', this.applyTheme);
    document.addEventListener('keydown', this.handleGlobalKeydown);
    // Capture, ahead of the annotator's blockers, so Tab and clicks register even when swallowed
    window.addEventListener('keydown', this.handleFocusModality, true);
    window.addEventListener('pointerdown', this.handleFocusModality, true);
  }

  disconnectedCallback() {
    if (instance === this) instance = null;
    this.deactivate();
    this.systemDark.removeEventListener('change', this.applyTheme);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    window.removeEventListener('keydown', this.handleFocusModality, true);
    window.removeEventListener('pointerdown', this.handleFocusModality, true);
    this.markers.destroy();
    this.overlay.destroy();
    this.inspector.destroy();
    this.guideBar.destroy();
    this.adjustMode.destroy();
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
    // Elements may have appeared since the session loaded
    this.applyEdits();
    this.fab.setActive(true);
    this.markers.setActive(true);
    this.guideBar.show('annotate');

    document.addEventListener('mouseout', this.handleMouseLeave, true);
    window.addEventListener('click', this.handleClick, true);
    for (const type of BLOCKED_POINTER_EVENTS) window.addEventListener(type, this.handleBlockedPointer, true);
    window.addEventListener('keydown', this.handleKeydown, true);
    window.addEventListener('keyup', this.handleKeyup, true);
    window.addEventListener('beforeinput', this.handleBeforeInput, true);
    window.addEventListener('focusin', this.handleHostFocus, true);
    window.addEventListener('focusout', this.handleHostFocus, true);
    window.addEventListener('mousemove', this.handleMouseMove, true);
    window.addEventListener('mousedown', this.handleMouseDown, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('wheel', this.handleWheel, { capture: true, passive: false });
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

    if (this.inspecting) {
      this.exitMeasureMode();
    }
    this.adjustMode.deactivate();
    this.passThrough = false;
    this.fab.setInteractionActive(false);
    this.disarmPick();

    document.removeEventListener('mouseout', this.handleMouseLeave, true);
    window.removeEventListener('click', this.handleClick, true);
    for (const type of BLOCKED_POINTER_EVENTS) window.removeEventListener(type, this.handleBlockedPointer, true);
    window.removeEventListener('keydown', this.handleKeydown, true);
    window.removeEventListener('keyup', this.handleKeyup, true);
    window.removeEventListener('beforeinput', this.handleBeforeInput, true);
    window.removeEventListener('focusin', this.handleHostFocus, true);
    window.removeEventListener('focusout', this.handleHostFocus, true);
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('mousedown', this.handleMouseDown, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('wheel', this.handleWheel, { capture: true });
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

  private applyEdits(preview?: StylePreview) {
    this.editStyles.apply(this.annotations, preview);
  }

  /** Property keys arm in plain annotation mode, outside text fields and kai's panels */
  private canArm(e: KeyboardEvent): boolean {
    return !this.inspecting && !this.pickMode && !this.activePopover && !this.settingsOpen && !this.guideBar.isHelpOpen()
      && !e.composedPath().some(isEditable) && !isEditable(this.shadow.activeElement);
  }

  private baseMode(): GuideMode {
    return this.passThrough ? 'interact' : this.pickMode ? 'pick' : 'annotate';
  }

  /** Runs in the capture phase so the host page's own single-key shortcuts never see the keystroke. */
  private shortcutFor(e: KeyboardEvent): ShortcutAction | null {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return null;
    if (e.composedPath().some(isEditable) || isEditable(this.shadow.activeElement)) return null;
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    for (const action of Object.keys(SHORTCUTS) as ShortcutAction[]) {
      if ((SHORTCUTS[action].keys as readonly string[]).includes(key)) return action;
    }
    return null;
  }

  private isOwnElement(e: Event): boolean {
    return e.composedPath().some(
      el => el === this || el === this.shadow
    );
  }

  private forwardKeyEvent(e: KeyboardEvent) {
    // Stop before host capture; deliver a local copy to kai's controls without
    // crossing the shadow boundary. Native editing/navigation still uses the original.
    e.stopImmediatePropagation();
    const local = new KeyboardEvent(e.type, {
      key: e.key, code: e.code, location: e.location,
      altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey,
      repeat: e.repeat, isComposing: e.isComposing,
      bubbles: true, cancelable: true, composed: false,
    });
    if (!(this.shadow.activeElement ?? this.shadow).dispatchEvent(local)) e.preventDefault();
  }

  private openPopover(element: Element, anchorRect?: DOMRect) {
    this.adjustMode.disarm();
    this.closePopover();

    const selector = generateSelector(element);
    const path = generatePath(element);
    const computedStyles = getComputedStyles(element);

    this.activePopover = createPopover(this.shadow, {
      element,
      selector,
      path,
      styles: computedStyles,
      anchorRect,
      onSubmit: (comment) => {
        this.markers.clearPreview();
        this.commit([...this.annotations, this.createAnnotation(element, comment, computedStyles)], 'note');
        this.closePopover();
      },
      onClose: () => {
        this.markers.clearPreview();
        this.closePopover();
      },
    });
  }

  private createAnnotation(element: Element, comment: string, styles: Record<string, string>): Annotation {
    const ariaAttrs: Record<string, string> = {};
    const dataAttrs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      if (attr.name === 'role' || attr.name.startsWith('aria-')) {
        ariaAttrs[attr.name] = attr.value;
      } else if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }
    const rect = element.getBoundingClientRect();

    return {
      id: crypto.randomUUID(),
      selector: generateSelector(element),
      locator: generateLocator(element),
      path: generatePath(element),
      comment,
      styles,
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      createdAt: new Date().toISOString(),
      element: element.tagName.toLowerCase(),
      classes: Array.from(element.classList).filter(c => !c.startsWith('kai-')),
      nearbyText: getNearbyText(element),
      url: location.href,
      ariaAttributes: ariaAttrs,
      dataAttributes: dataAttrs,
    };
  }

  private openEditPopover(annotation: Annotation, markerRect?: DOMRect) {
    this.adjustMode.disarm();
    this.closePopover();
    this.activePopoverAnnotationId = annotation.id;
    this.markers.showBox(annotation.id);

    const target = resolveAnnotation(annotation);
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
      edits: annotation.edits,
      onRemoveEdit: (property) => {
        const current = this.annotations.find(a => a.id === annotation.id);
        if (!current) return;
        const edits = withoutEdit(current.edits, property);
        // The last change of an annotation without a note takes the annotation with it, unless a note
        // is being typed: that draft becomes the note in the same step
        const draft = this.activePopover?.draft() ?? '';
        const comment = !current.comment.trim() && !edits.length && draft ? draft : current.comment;
        const updated: Annotation = { ...current, comment, edits: edits.length ? edits : undefined };
        const gone = !updated.comment.trim() && !updated.edits;
        this.commit(gone ? this.annotations.filter(a => a.id !== current.id) : this.annotations.map(a => a.id === current.id ? updated : a), property);
        if (gone) this.closePopover();
      },
      onSubmit: (comment) => {
        // The list may have moved on since the popover opened; save onto the current annotation
        const current = this.annotations.find(a => a.id === annotation.id) ?? annotation;
        // Saving an unchanged note isn't a step to undo. An empty note keeps an annotation that still has
        // changes; without changes the annotation goes
        if (comment !== current.comment) {
          if (comment || current.edits?.length) this.commit(this.annotations.map(a => a.id === current.id ? { ...current, comment } : a), 'note');
          else this.commit(this.annotations.filter(a => a.id !== current.id), 'delete annotation');
        }
        this.closePopover();
      },
      onDelete: () => {
        this.commit(this.annotations.filter(a => a.id !== annotation.id), 'delete annotation');
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

  /**
   * The one way the annotation list changes (notes, edits, deletes, drags, nudges, resets, clear all):
   * shows the new list and records an undo step labelled for the HUD.
   */
  private commit(next: Annotation[], label: string) {
    // An unchanged list is no step; every step has a name for the HUD
    if (JSON.stringify(next) === JSON.stringify(this.annotations)) return;
    this.history = record(this.history, { label: label || 'change', before: this.annotations, after: next });
    this.showAnnotations(next);
  }

  /** Sets the list and brings everything in line: the session, kai's styles on the page, markers and the FAB */
  private showAnnotations(next: Annotation[]) {
    this.annotations = next;
    this.applyEdits();
    if (next.length) saveSession(next);
    else clearSession();
    this.markers.update(next);
    this.fab.updateBadge(next.length);
    this.fab.updateActionStates(next.length);
  }

  /** ⌘Z / ⇧⌘Z on a Mac; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y elsewhere */
  private historyKey(e: KeyboardEvent): 'undo' | 'redo' | null {
    if (e.altKey || (isMac ? !e.metaKey || e.ctrlKey : !e.ctrlKey || e.metaKey)) return null;
    const key = e.key.toLowerCase();
    if (key === 'z') return e.shiftKey ? 'redo' : 'undo';
    return key === 'y' && !isMac ? 'redo' : null;
  }

  /**
   * Restores the list before (undo) or after (redo) a step without recording one. Disarms and closes
   * the popover first; mid-drag it does nothing.
   */
  private stepHistory(action: 'undo' | 'redo') {
    if (this.adjustMode.isDragging()) return;
    const { history, step } = action === 'undo' ? undo(this.history) : redo(this.history);
    if (!step) {
      this.notify(`Nothing to ${action}`);
      return;
    }
    this.history = history;
    this.adjustMode.disarm(false);
    this.closePopover();
    this.showAnnotations(action === 'undo' ? step.before : step.after);
    this.notify(`${action === 'undo' ? 'Undid' : 'Redid'} ${step.label}`);
  }

  /** A notice, then back to the armed hints if a property is still armed, else to the mode's */
  private notify(text: string) {
    this.guideBar.notify(text, false, () => {
      if (this.adjustMode.isArmed()) this.adjustMode.refresh();
      else this.guideBar.show(this.baseMode());
    });
  }
}

customElements.define('ui-annotator', UIAnnotator);

if (!document.querySelector('ui-annotator')) {
  document.body.appendChild(document.createElement('ui-annotator'));
}
