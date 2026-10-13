import type { Annotation } from '../types.ts';
import { editDeclarations } from './adjust.ts';
import { resolveAnnotationMatches } from './selector.ts';

type Styled = Element & ElementCSSInlineStyle;
type Original = { value: string; priority: string };
type Entry = {
  /** The element's style attribute before kai touched it: none means kai removes an empty one it leaves */
  attribute: string | null;
  /** Each longhand kai set, with the element's own inline value before */
  originals: Map<string, Original>;
  /**
   * Inline shorthands that held a longhand's value: with `padding: var(--pad)` the longhands read
   * empty, and removing one leaves the others empty too. Restoring puts the shorthand back.
   */
  shorthands: Map<string, Original>;
};
export type StylePreview = { elements: Element[]; declarations: Record<string, string> };

/** The inline shorthand each adjustable longhand can hide in */
const shorthandOf = (longhand: string): string | null =>
  longhand.startsWith('padding-') ? 'padding'
    : longhand.startsWith('margin-') ? 'margin'
    : longhand === 'row-gap' || longhand === 'column-gap' ? 'gap'
    : longhand.endsWith('-radius') ? 'border-radius'
    : longhand === 'font-size' || longhand === 'line-height' ? 'font'
    : null;

/**
 * kai's changes to the page are derived from the annotations' edits. `apply` sets each annotation's
 * edits, as `!important` inline longhands, on every element its fix changes, then puts every other
 * longhand kai touched back to the element's own inline value, captured the first time kai touched
 * it. On each element its own annotation wins; look-alike annotations fill in only the longhands it
 * doesn't set (the later look-alike winning among them), and a drag in progress is layered on top.
 */
export const createEditStyles = () => {
  const touched = new Map<Styled, Entry>();

  /** Puts `names` back to the element's own values: shorthands first, so explicit longhands win over them */
  const putBack = (el: Styled, entry: Entry, names: string[]) => {
    const shorthands = new Set<string>();
    for (const name of names) {
      const shorthand = shorthandOf(name);
      if (!entry.originals.get(name)?.value && shorthand && entry.shorthands.has(shorthand)) shorthands.add(shorthand);
    }
    for (const shorthand of shorthands) {
      const { value, priority } = entry.shorthands.get(shorthand)!;
      el.style.setProperty(shorthand, value, priority);
    }
    for (const name of names) {
      const original = entry.originals.get(name)!;
      if (original.value) el.style.setProperty(name, original.value, original.priority);
      else if (!shorthands.has(shorthandOf(name) ?? '')) el.style.removeProperty(name);
    }
  };

  const capture = (el: Styled, entry: Entry, name: string) => {
    const value = el.style.getPropertyValue(name);
    entry.originals.set(name, { value, priority: el.style.getPropertyPriority(name) });
    const shorthand = shorthandOf(name);
    // Only intact before kai sets the first longhand it covers
    if (!value && shorthand && !entry.shorthands.has(shorthand) && el.style.getPropertyValue(shorthand)) {
      entry.shorthands.set(shorthand, { value: el.style.getPropertyValue(shorthand), priority: el.style.getPropertyPriority(shorthand) });
    }
  };

  const apply = (annotations: Annotation[], preview?: StylePreview) => {
    const own = new Map<Styled, Record<string, string>>();
    const borrowed = new Map<Styled, Record<string, string>>();
    const add = (to: Map<Styled, Record<string, string>>, el: Element, declarations: Record<string, string>) => {
      if ('style' in el) to.set(el as Styled, { ...to.get(el as Styled), ...declarations });
    };
    for (const a of annotations) {
      if (!a.edits?.length) continue;
      const declarations = editDeclarations(a.edits);
      // The annotated element comes first
      resolveAnnotationMatches(a).forEach((el, i) => add(i === 0 ? own : borrowed, el, declarations));
    }
    const wanted = new Map<Styled, Record<string, string>>();
    for (const el of new Set([...borrowed.keys(), ...own.keys()])) wanted.set(el, { ...borrowed.get(el), ...own.get(el) });
    if (preview) for (const el of preview.elements) add(wanted, el, preview.declarations);

    for (const [el, entry] of touched) {
      const declarations = wanted.get(el);
      const unwanted = [...entry.originals.keys()].filter(name => !declarations || !(name in declarations));
      putBack(el, entry, unwanted);
      for (const name of unwanted) entry.originals.delete(name);
      for (const shorthand of entry.shorthands.keys()) {
        if (![...entry.originals.keys()].some(name => shorthandOf(name) === shorthand)) entry.shorthands.delete(shorthand);
      }
      if (entry.originals.size) continue;
      // Leave no empty style attribute behind on an element that had none
      if (entry.attribute === null && !el.style.length) el.removeAttribute('style');
      touched.delete(el);
    }

    for (const [el, declarations] of wanted) {
      let entry = touched.get(el);
      if (!entry) {
        entry = { attribute: el.getAttribute('style'), originals: new Map(), shorthands: new Map() };
        touched.set(el, entry);
      }
      for (const [name, value] of Object.entries(declarations)) {
        if (!entry.originals.has(name)) capture(el, entry, name);
        // Unchanged values aren't rewritten: each write is a mutation the annotator observes.
        // A shorthand put back above has reset this longhand, so it reads differently and is rewritten.
        if (el.style.getPropertyValue(name) === value && el.style.getPropertyPriority(name) === 'important') continue;
        el.style.setProperty(name, value, 'important');
      }
    }
  };

  /**
   * Reads an element the way the page styles it, with kai's `longhands` lifted for the moment: what a
   * new edit's `from` is. A look-alike already showing another annotation's edit would read kai's
   * value. Only the adjusted property's longhands are lifted, so a line-height still reads against
   * kai's font size.
   */
  const readOwn = <T>(el: Element, read: () => T, longhands: string[]): T => {
    const entry = touched.get(el as Styled);
    const names = longhands.filter(name => entry?.originals.has(name));
    if (!entry || !names.length) return read();
    const styled = el as Styled;
    // A shorthand put back resets its other longhands too; all of kai's go back on afterwards
    const kai = [...entry.originals.keys()].map(name => [name, styled.style.getPropertyValue(name), styled.style.getPropertyPriority(name)] as const);
    putBack(styled, entry, names);
    try {
      return read();
    } finally {
      for (const [name, value, priority] of kai) styled.style.setProperty(name, value, priority);
    }
  };

  return { apply, readOwn };
};
