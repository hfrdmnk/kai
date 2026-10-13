import type { Annotation } from './types.ts';
import {
  adjustPropertyFor, adjustValue, cursorFor, dragAxisOf, dragTravel, editDeclarations, flexAxisOf, gapContainer,
  kindOf, longhandOf, partsOf, pickParts, readValues, shortestEdits, withChanges,
  type AdjustProperty, type Change, type Part, type Values,
} from './core/adjust.ts';
import type { StylePreview } from './core/edit-styles.ts';
import type { HeldKeys } from './core/held-keys.ts';
import { composedParent, generateSelector, resolveAnnotation, resolveAnnotationMatches } from './core/selector.ts';
import { getComputedStyles } from './core/styles.ts';
import { armedHud, createAdjustLayer, dragHud } from './ui/adjust.ts';
import type { createGuideBar, GuideMode } from './ui/guide-bar.ts';
import type { createOverlay } from './ui/highlight.ts';

/** How long the HUD confirms a saved adjustment */
const SAVED_MS = 1200;

/** A press-drag-release in progress: where it started and the property's values then and now */
type Drag = {
  origin: { x: number; y: number };
  /** The target's border box at press time; the nearest side or corner is picked against it */
  rect: DOMRect;
  start: Values;
  cur: Values;
  /** A grid gap's axis, decided by the first few px of travel */
  axis: 'x' | 'y' | null;
  /** Computed styles before the drag, for an annotation it creates */
  styles: Record<string, string>;
};

/** A property armed on the selection; `parts` are what a drag would change right now */
type Armed = {
  prop: AdjustProperty;
  target: Element;
  /** Everything the annotation's fix would change; the preview and the edits land on them all */
  matches: Element[];
  parts: Part[];
  anchor: Part | null;
  drag: Drag | null;
};

export type AdjustModeDeps = {
  shadowRoot: ShadowRoot;
  guideBar: ReturnType<typeof createGuideBar>;
  overlay: ReturnType<typeof createOverlay>;
  held: () => HeldKeys;
  pointer: () => { x: number; y: number };
  /** The shared selection a property key arms on */
  selection: () => Element | null;
  annotations: () => Annotation[];
  /** Replaces the annotations, saves the session and re-derives kai's styles on the page */
  saveAnnotations: (next: Annotation[]) => void;
  createAnnotation: (element: Element, styles: Record<string, string>) => Annotation;
  /** Re-derives kai's styles from the annotations, a drag's preview on top */
  applyEdits: (preview?: StylePreview) => void;
  baseMode: () => GuideMode;
  isActive: () => boolean;
  /** Called after disarming, so hover can pick up again */
  onDisarm: () => void;
};

/**
 * Drag to adjust: a property key arms on the selection, then a press, drag and release anywhere on
 * the page writes the change into the element's annotation. The annotator routes keys and pointer
 * events here and owns everything else (selection, annotations, persistence).
 */
export const createAdjustMode = (deps: AdjustModeDeps) => {
  const { guideBar, overlay } = deps;
  const layer = createAdjustLayer(deps.shadowRoot);
  let armed: Armed | null = null;
  /** The click that follows an adjustment's press and release is not an annotation click */
  let suppressClick = false;
  let rafId: number | null = null;
  let savedTimer: ReturnType<typeof setTimeout> | null = null;

  const annotationFor = (el: Element) => deps.annotations().find(a => resolveAnnotation(a) === el);

  /** What the agent's fix changes: the target and its look-alikes */
  const matchesOf = (target: Element): Element[] => {
    const matches = resolveAnnotationMatches(annotationFor(target) ?? { selector: generateSelector(target), element: target.tagName.toLowerCase() });
    return matches.includes(target) ? matches : [target, ...matches];
  };

  /** Inspect sets the cursor the same way; every write is a mutation the annotator observes */
  const setCursor = (cursor: string) => {
    if (document.body.style.cursor !== cursor) document.body.style.cursor = cursor;
  };

  const clearSaved = () => {
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = null;
  };

  /** `✓ Annotation 3` for a moment; display only, hover and keys work right away */
  const showSaved = (text: string) => {
    clearSaved();
    guideBar.showAdjust({ kind: 'saved', text });
    savedTimer = setTimeout(() => {
      savedTimer = null;
      if (deps.isActive() && !armed && guideBar.mode() === 'adjust') guideBar.show(deps.baseMode());
    }, SAVED_MS);
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      update();
    });
  };

  /** Longhands the drag has changed so far, from their values at press time */
  const dragChanges = (): Record<string, Change> => {
    const { prop, drag } = armed!;
    const changes: Record<string, Change> = {};
    for (const part of partsOf(prop)) {
      const from = drag!.start[part] ?? 0;
      const to = drag!.cur[part] ?? 0;
      if (from !== to) changes[longhandOf(prop, part)] = { from, to };
    }
    return changes;
  };

  /** Picks what the pointer and modifiers would change; mid-drag, previews the new values on every match */
  const update = () => {
    if (!armed) return;
    const { prop, target, drag } = armed;
    if (!target.isConnected) {
      disarm();
      return;
    }
    const { alt, shift } = deps.held();
    const held = { alt, shift };
    const flexAxis = flexAxisOf(target);
    const { x, y } = deps.pointer();
    if (drag) {
      const dx = x - drag.origin.x;
      const dy = y - drag.origin.y;
      if (kindOf(prop) === 'gap' && !drag.axis) drag.axis = dragAxisOf(dx, dy);
      // The side or corner is the one nearest the press, not the pointer now
      Object.assign(armed, pickParts(prop, { rect: drag.rect, x: drag.origin.x, y: drag.origin.y, ...held, flexAxis, dragAxis: drag.axis }));
      const travel = dragTravel(prop, armed.parts, armed.anchor, dx, dy);
      drag.cur = { ...drag.start };
      for (const part of armed.parts) drag.cur[part] = adjustValue(prop, drag.start[part] ?? 0, travel);
      deps.applyEdits({ elements: armed.matches, declarations: editDeclarations(shortestEdits(prop, dragChanges())) });
      guideBar.showAdjust(dragHud(prop, armed.parts, armed.anchor, drag.start, drag.cur));
    } else {
      Object.assign(armed, pickParts(prop, { rect: target.getBoundingClientRect(), x, y, ...held, flexAxis }));
      guideBar.showAdjust(armedHud(prop, readValues(target, prop), armed.parts, held));
    }
    setCursor(cursorFor(prop, armed.parts, !!drag));
    overlay.show(target, { matches: armed.matches.length, exact: true, tooltip: !drag });
    layer.show({ prop, target, hot: armed.parts, others: armed.matches.filter(m => m !== target) });
  };

  /** Arms a property on the selection; its key again disarms, another property key switches */
  const arm = (prop: AdjustProperty) => {
    if (armed?.drag) return;
    if (armed?.prop === prop) {
      disarm();
      return;
    }
    const selected = deps.selection() ?? armed?.target;
    if (!selected?.isConnected) return;
    const target = prop === 'gap' ? gapContainer(selected, composedParent) : selected;
    if (!target) return;
    clearSaved();
    armed = { prop, target, matches: matchesOf(target), parts: [], anchor: null, drag: null };
    update();
  };

  /** Back to hovering; a drag in progress is cancelled and its preview taken off the page */
  const disarm = (showHud = true) => {
    if (!armed) return;
    const dragging = !!armed.drag;
    armed = null;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (dragging) deps.applyEdits();
    layer.hide();
    setCursor('');
    const selected = deps.selection();
    if (selected) overlay.show(selected);
    else overlay.hide();
    if (showHud && deps.isActive()) guideBar.show(deps.baseMode());
    deps.onDisarm();
  };

  /** ↑ / ↓ while armed move the target with the selection; G keeps to flex and grid containers */
  const retarget = (selected: Element) => {
    if (!armed || armed.drag) return;
    armed.target = armed.prop === 'gap' ? gapContainer(selected, composedParent) ?? armed.target : selected;
    armed.matches = matchesOf(armed.target);
    update();
  };

  const beginDrag = (e: MouseEvent) => {
    const a = armed!;
    const start = readValues(a.target, a.prop);
    a.matches = matchesOf(a.target);
    a.drag = {
      origin: { x: e.clientX, y: e.clientY },
      rect: a.target.getBoundingClientRect(),
      start,
      cur: { ...start },
      axis: null,
      styles: getComputedStyles(a.target),
    };
    update();
  };

  /** Release: the drag's changes go into the target's annotation, which it creates when there's none */
  const commitDrag = () => {
    const { prop, target, drag } = armed!;
    const changes = dragChanges();
    disarm(false);
    if (!Object.keys(changes).length) {
      guideBar.show(deps.baseMode());
      return;
    }
    const list = deps.annotations();
    const existing = annotationFor(target);
    const base = existing ?? deps.createAnnotation(target, drag!.styles);
    const updated: Annotation = { ...base, ...withChanges(base, prop, changes) };
    let next = existing ? list.map(a => a === existing ? updated : a) : [...list, updated];
    // Dragged back to where it started, with nothing else said
    if (!updated.comment.trim()) next = next.filter(a => a !== updated);
    deps.saveAnnotations(next);
    const index = next.indexOf(updated);
    if (index === -1) guideBar.show(deps.baseMode());
    else showSaved(existing ? `Added to annotation ${index + 1}` : `Annotation ${index + 1}`);
  };

  /**
   * Keys that mean something here, routed before kai's single-key shortcuts. Property keys arm when
   * `canArm` (plain annotation mode, no text field or panel focused); Escape disarms.
   * Returns whether the key was used.
   */
  const handleKeydown = (e: KeyboardEvent, canArm: boolean): boolean => {
    if (e.key === 'Escape' && armed) {
      disarm();
      return true;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return false;
    const prop = adjustPropertyFor(e.key);
    if (!prop || (!armed && !canArm)) return false;
    arm(prop);
    return true;
  };

  /** A press while armed starts a drag; returns whether the press was ours */
  const pointerDown = (e: MouseEvent): boolean => {
    // Reset here too: a release outside the window fires no click to consume it
    suppressClick = !!armed;
    if (!armed) return false;
    if (e.button === 0 && !armed.drag) beginDrag(e);
    return true;
  };

  /** A drag ends wherever it's released, over kai's own controls too; returns whether it was ours */
  const pointerUp = (e: MouseEvent): boolean => {
    if (!armed?.drag || e.button !== 0) return false;
    commitDrag();
    return true;
  };

  /** A press while armed adjusts (or changes nothing); its click never opens the annotation popover */
  const consumeClick = (): boolean => {
    const consumed = suppressClick || !!armed;
    suppressClick = false;
    return consumed;
  };

  const destroy = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    clearSaved();
    layer.destroy();
  };

  return {
    isArmed: () => !!armed,
    isDragging: () => !!armed?.drag,
    handleKeydown,
    pointerDown,
    pointerUp,
    consumeClick,
    /** Pointer moves, modifier changes and layout changes all redraw on the next frame */
    refresh: () => {
      if (armed) schedule();
    },
    retarget,
    disarm,
    clearSaved,
    destroy,
  };
};
