import type { Annotation } from './types.ts';
import {
  ADJUST, adjustPropertyFor, adjustValue, cursorFor, dragAxisOf, dragTravel, editDeclarations, flexAxisOf, gapContainer,
  editsLabel, kindOf, longhandOf, nudgeValue, routeChanges, partsOf, pickParts, propertyOfDeclaration, readValues, shortestEdits, withChanges,
  withoutProperty, type AdjustProperty, type Change, type Part, type ScaleRef, type Values,
} from './core/adjust.ts';
import type { StylePreview } from './core/edit-styles.ts';
import type { HeldKeys } from './core/held-keys.ts';
import { hasSteps, harvestScale, stepOnScale, styleSignature, STEP_TRAVEL, type Scale } from './core/scale.ts';
import { composedParent, generateSelector, resolveAnnotation, resolveAnnotationMatches } from './core/selector.ts';
import type { StyleEdit } from './types.ts';
import { getComputedStyles } from './core/styles.ts';
import { armedHud, createAdjustLayer, dragHud } from './ui/adjust.ts';
import type { createGuideBar, GuideMode } from './ui/guide-bar.ts';
import type { createOverlay } from './ui/highlight.ts';

/** An empty edit list is no list */
const orNone = (edits: StyleEdit[]) => edits.length ? edits : undefined;
/** An annotation stays while it has a note or edits */
const keep = (a: Annotation) => !!a.comment.trim() || !!a.edits?.length;

/** How long the HUD shows a nudge's readout after the last ←/→ before going back to the hints */
const NUDGE_MS = 1500;

type Refs = Partial<Record<Part, ScaleRef>>;

/** A press-drag-release in progress: where it started and the property's values then and now */
type Drag = {
  origin: { x: number; y: number };
  /** The target's border box at press time; the nearest side or corner is picked against it */
  rect: DOMRect;
  start: Values;
  /** The page's own values, without kai's styles: the edit's `from` (a look-alike may show another annotation's edit) */
  own: Values;
  cur: Values;
  /** The scale steps `cur` landed on while snapping */
  refs: Refs;
  /** A grid gap's axis, decided by the first few px of travel */
  axis: 'x' | 'y' | null;
  /** Computed styles before the drag, for an annotation it creates */
  styles: Record<string, string>;
};

/** ←/→ nudges of this arming: the values before the first, and what the HUD's readout shows until it times out */
type Nudges = {
  from: Values;
  shown: { parts: Part[]; anchor: Part | null; refs: Refs } | null;
  timer: ReturnType<typeof setTimeout> | null;
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
  nudges: Nudges | null;
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
  /** The annotator's one mutation path: replaces the annotations, saves, re-derives kai's styles and records an undo step */
  commit: (next: Annotation[], label: string) => void;
  createAnnotation: (element: Element, styles: Record<string, string>) => Annotation;
  /** Re-derives kai's styles from the annotations, a drag's preview on top */
  applyEdits: (preview?: StylePreview) => void;
  /** Reads an element with kai's styles for `longhands` lifted: the page's own values, what an edit's `from` is */
  readOwn: <T>(el: Element, read: () => T, longhands: string[]) => T;
  baseMode: () => GuideMode;
  isActive: () => boolean;
  /** Armed or not, e.g. to let the pointer through markers while armed */
  onArmedChange: (armed: boolean) => void;
  /** Called after disarming, so hover can pick up again */
  onDisarm: () => void;
};

/**
 * Drag to adjust: a property key arms on the selection, then a press, drag and release anywhere on
 * the page writes the change into the element's annotation. ←/→ nudge, Backspace resets, T snaps to
 * the project's scale. The annotator routes keys and pointer events here and owns everything else
 * (selection, annotations, persistence).
 */
export const createAdjustMode = (deps: AdjustModeDeps) => {
  const { guideBar, overlay } = deps;
  const layer = createAdjustLayer(deps.shadowRoot);
  let armed: Armed | null = null;
  /** T: snap drags and nudges to the project's scale. Sticky until toggled off */
  let snapOn = false;
  /** Read when arming, again whenever the page's stylesheets have changed since */
  let scale: Scale | null = null;
  let scaleSignature = '';
  /** The click that follows an adjustment's press and release is not an annotation click */
  let suppressClick = false;
  let rafId: number | null = null;

  const scaleOf = () => scale ??= harvestScale().scale;
  const canSnap = (prop: AdjustProperty) => hasSteps(scaleOf(), prop);
  const snapping = (prop: AdjustProperty) => snapOn && canSnap(prop);

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

  /** A confirmation for a moment; display only, hover and keys work right away */
  const showNotice = (text: string, check = false) => guideBar.notify(text, check, () => {
    if (armed) update();
    else guideBar.show(deps.baseMode());
  });

  /** Drops the scale when the page's stylesheets changed, so the next use reads it again */
  const checkScale = () => {
    const signature = styleSignature();
    if (signature !== scaleSignature) scale = null;
    scaleSignature = signature;
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      update();
    });
  };

  /**
   * Longhands that differ between what was on screen (`start`) and `cur`, with the scale step each
   * landed on. `from` is the page's own value when given, else `start`.
   */
  const changesBetween = (prop: AdjustProperty, start: Values, cur: Values, refs: Refs, own: Values = start): Record<string, Change> => {
    const changes: Record<string, Change> = {};
    for (const part of partsOf(prop)) {
      const to = cur[part] ?? 0;
      if ((start[part] ?? 0) === to) continue;
      const from = own[part] ?? start[part] ?? 0;
      changes[longhandOf(prop, part)] = refs[part] ? { from, to, ref: refs[part] } : { from, to };
    }
    return changes;
  };

  /** Annotations of the target's siblings whose fix covers the target too (it's one of their matches) */
  const siblingAnnotations = (target: Element) =>
    deps.annotations().filter(a => resolveAnnotation(a) !== target && resolveAnnotationMatches(a).includes(target));

  /**
   * Writes changes into annotations and saves, one edit per sibling group per longhand (see
   * `routeChanges`): a longhand a sibling's annotation already edits updates that edit, the rest go to
   * the target's own annotation, created when there's none. Returns the 1-based number of the
   * annotation the change went to and whether it's new; null when the edits come out the same (a
   * look-alike dragged back to its own value): no change and no undo step.
   */
  const save = (target: Element, prop: AdjustProperty, changes: Record<string, Change>, styles: Record<string, string>) => {
    const list = deps.annotations();
    const own = annotationFor(target);
    const siblings = siblingAnnotations(target);
    const routed = routeChanges(changes, own?.edits, siblings.map(a => a.edits));
    const updates = new Map<Annotation, Annotation>();
    const update = (a: Annotation, part: Record<string, Change>) => {
      if (Object.keys(part).length) updates.set(a, { ...a, edits: orNone(withChanges(a.edits, prop, part)) });
    };
    siblings.forEach((a, i) => update(a, routed.siblings[i]));
    const base = own ?? deps.createAnnotation(target, styles);
    update(base, routed.own);
    const names = [...updates].flatMap(([a, b]) => editsLabel(a.edits ?? [], b.edits ?? []).split(', ').filter(Boolean));
    const label = [...new Set(names)].sort().join(', ');
    if (!label) return null;
    let next = list.map(a => updates.get(a) ?? a);
    if (!own && updates.has(base)) next = [...next, updates.get(base)!];
    // An annotation goes only when it has neither a note nor edits
    const touched = new Set(updates.values());
    next = next.filter(a => !touched.has(a) || keep(a));
    deps.commit(next, label);
    const landed = updates.get(base) ?? updates.values().next().value!;
    return { number: next.indexOf(landed) + 1, created: !own && landed === updates.get(base) };
  };

  /** The page's own values of the armed property, kai's styles for it lifted */
  const ownValues = (target: Element, prop: AdjustProperty) =>
    deps.readOwn(target, () => readValues(target, prop), partsOf(prop).map(p => longhandOf(prop, p)));

  /** Picks what the pointer and modifiers would change; mid-drag, previews the new values on every match */
  const update = () => {
    if (!armed) return;
    const { prop, target, drag, nudges } = armed;
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
      const snap = snapping(prop);
      drag.cur = { ...drag.start };
      drag.refs = {};
      for (const part of armed.parts) {
        const start = drag.start[part] ?? 0;
        if (!snap) {
          drag.cur[part] = adjustValue(prop, start, travel);
          continue;
        }
        const step = stepOnScale(scaleOf(), prop, start, Math.trunc(travel / STEP_TRAVEL));
        drag.cur[part] = step.value;
        if (step.ref) drag.refs[part] = step.ref;
      }
      const changes = changesBetween(prop, drag.start, drag.cur, drag.refs);
      deps.applyEdits({ elements: armed.matches, declarations: editDeclarations(shortestEdits(prop, changes)) });
      guideBar.showAdjust(dragHud(prop, armed.parts, armed.anchor, drag.start, drag.cur, drag.refs, snap));
    } else {
      Object.assign(armed, pickParts(prop, { rect: target.getBoundingClientRect(), x, y, ...held, flexAxis }));
      const values = readValues(target, prop);
      // A notice (Nothing to undo) stays its moment; the hints come back after it
      if (!guideBar.noticeShowing()) {
        guideBar.showAdjust(nudges?.shown
          ? dragHud(prop, nudges.shown.parts, nudges.shown.anchor, nudges.from, values, nudges.shown.refs, snapping(prop))
          : armedHud(prop, values, armed.parts, held, { available: canSnap(prop), on: snapOn }));
      }
    }
    setCursor(cursorFor(prop, armed.parts, !!drag));
    overlay.show(target, { matches: armed.matches.length, exact: true, tooltip: !drag });
    layer.show({ prop, target, hot: armed.parts, others: armed.matches.filter(m => m !== target) });
  };

  const endNudges = () => {
    if (armed?.nudges?.timer) clearTimeout(armed.nudges.timer);
    if (armed) armed.nudges = null;
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
    endNudges();
    checkScale();
    guideBar.clearNotice();
    const wasArmed = !!armed;
    armed = { prop, target, matches: matchesOf(target), parts: [], anchor: null, drag: null, nudges: null };
    if (!wasArmed) deps.onArmedChange(true);
    update();
  };

  /** Back to hovering; a drag in progress is cancelled and its preview taken off the page */
  const disarm = (showHud = true) => {
    if (!armed) return;
    const dragging = !!armed.drag;
    endNudges();
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
    deps.onArmedChange(false);
    deps.onDisarm();
  };

  /** ↑ / ↓ while armed move the target with the selection; G keeps to flex and grid containers */
  const retarget = (selected: Element) => {
    if (!armed || armed.drag) return;
    endNudges();
    armed.target = armed.prop === 'gap' ? gapContainer(selected, composedParent) ?? armed.target : selected;
    armed.matches = matchesOf(armed.target);
    update();
  };

  const beginDrag = (e: MouseEvent) => {
    const a = armed!;
    endNudges();
    const start = readValues(a.target, a.prop);
    a.matches = matchesOf(a.target);
    a.drag = {
      origin: { x: e.clientX, y: e.clientY },
      rect: a.target.getBoundingClientRect(),
      start,
      own: ownValues(a.target, a.prop),
      cur: { ...start },
      refs: {},
      axis: null,
      styles: getComputedStyles(a.target),
    };
    update();
  };

  /** Release: the drag's changes go into the target's annotation, which it creates when there's none */
  const commitDrag = () => {
    const { prop, target, drag } = armed!;
    const changes = changesBetween(prop, drag!.start, drag!.cur, drag!.refs, drag!.own);
    disarm(false);
    if (!Object.keys(changes).length) {
      guideBar.show(deps.baseMode());
      return;
    }
    const saved = save(target, prop, changes, drag!.styles);
    if (!saved?.number) guideBar.show(deps.baseMode());
    else showNotice(saved.created ? `Annotation ${saved.number}` : `Added to annotation ${saved.number}`, true);
  };

  /**
   * ←/→: one step (1px, 0.05, or one scale step while snapping) on the sides under the pointer, saved
   * right away. The HUD shows the drag readout, its delta counted from before this arming's first
   * nudge, and goes back to the hints after the last one.
   */
  const nudge = (dir: 1 | -1) => {
    const a = armed!;
    const { prop, target } = a;
    const start = readValues(target, prop);
    const { x, y } = deps.pointer();
    const { alt, shift } = deps.held();
    // A grid gap has no drag to pick its axis: ←/→ means the column gap
    const { parts, anchor } = pickParts(prop, { rect: target.getBoundingClientRect(), x, y, alt, shift, flexAxis: flexAxisOf(target), dragAxis: 'x' });
    const snap = snapping(prop);
    const cur = { ...start };
    const refs: Refs = {};
    for (const part of parts) {
      if (!snap) {
        cur[part] = nudgeValue(prop, start[part] ?? 0, dir);
        continue;
      }
      const step = stepOnScale(scaleOf(), prop, start[part] ?? 0, dir);
      cur[part] = step.value;
      if (step.ref) refs[part] = step.ref;
    }
    const changes = changesBetween(prop, start, cur, refs, ownValues(target, prop));
    if (!Object.keys(changes).length || !save(target, prop, changes, getComputedStyles(target))) return;
    guideBar.clearNotice();
    // The save replaced the annotations; the target and its matches are the same elements
    if (a.nudges?.timer) clearTimeout(a.nudges.timer);
    a.nudges = {
      from: a.nudges?.from ?? start,
      shown: { parts, anchor, refs },
      timer: setTimeout(() => {
        if (armed !== a || !a.nudges) return;
        a.nudges.shown = null;
        a.nudges.timer = null;
        update();
      }, NUDGE_MS),
    };
    update();
  };

  /** Backspace while armed: the property's edits and their lines come off the element's annotation */
  /**
   * Backspace while armed: the property comes off what the element shows, its own annotation's edits
   * and the edits of sibling annotations that cover it (one edit per group: the whole group goes back)
   */
  const resetProperty = () => {
    const { prop, target } = armed!;
    const name = ADJUST[prop].title.toLowerCase();
    const own = annotationFor(target);
    const affected = [...(own ? [own] : []), ...siblingAnnotations(target)]
      .filter(a => a.edits?.some(e => propertyOfDeclaration(e.property) === prop));
    disarm(false);
    if (!affected.length) {
      showNotice(`No ${name} changes to reset`);
      return;
    }
    const next = deps.annotations()
      .map(a => affected.includes(a) ? { ...a, edits: orNone(withoutProperty(a.edits, prop)) } : a)
      .filter(a => !affected.some(b => b.id === a.id) || keep(a));
    deps.commit(next, `reset ${name}`);
    showNotice(`Reset ${name}`);
  };

  const toggleSnap = () => {
    if (!armed || !canSnap(armed.prop)) return false;
    snapOn = !snapOn;
    guideBar.clearNotice();
    // Back to the hints, which show the chip; later nudges still count from this arming's first
    if (armed.nudges?.timer) clearTimeout(armed.nudges.timer);
    if (armed.nudges) armed.nudges = { ...armed.nudges, shown: null, timer: null };
    update();
    return true;
  };

  /**
   * Keys that mean something here, routed before kai's single-key shortcuts. Property keys arm when
   * `canArm` (plain annotation mode, no text field or panel focused). While armed: Escape disarms (a
   * drag is cancelled), Backspace / Delete reset, ←/→ nudge, T toggles snapping. Returns whether the
   * key was used.
   */
  const handleKeydown = (e: KeyboardEvent, canArm: boolean): boolean => {
    if (armed) {
      if (e.key === 'Escape') {
        disarm();
        return true;
      }
      if (!e.metaKey && !e.ctrlKey) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (!e.repeat && !armed.drag) resetProperty();
          return true;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          if (!armed.drag) nudge(e.key === 'ArrowRight' ? 1 : -1);
          return true;
        }
        if (!e.altKey && !e.repeat && e.key.toUpperCase() === 'T' && toggleSnap()) return true;
      }
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
    // The last frame may be behind the release: bring the drag to where it ended first
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    update();
    // The update can disarm (the target left the page); the release is still ours
    if (armed?.drag) commitDrag();
    return true;
  };

  /** A press while armed adjusts (or changes nothing); its click never opens the annotation popover */
  const consumeClick = (): boolean => {
    const consumed = suppressClick || !!armed;
    suppressClick = false;
    return consumed;
  };

  /** kai turned off: disarm and read the scale afresh next time */
  const deactivate = () => {
    disarm();
    scale = null;
  };

  const destroy = () => {
    deactivate();
    if (rafId !== null) cancelAnimationFrame(rafId);
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
    deactivate,
    destroy,
  };
};
