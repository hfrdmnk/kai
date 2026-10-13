import type { Annotation } from '../types.ts';
import { editDeclarations } from './adjust.ts';
import { resolveAnnotationMatches } from './selector.ts';

type Styled = Element & ElementCSSInlineStyle;
type Original = { value: string; priority: string };
export type StylePreview = { elements: Element[]; declarations: Record<string, string> };

/**
 * kai's changes to the page are derived from the annotations' edits. `apply` sets each annotation's
 * edits, as `!important` inline longhands, on every element its selector matches, then puts every
 * other longhand kai touched back to the element's own inline value, captured the first time kai
 * touched it. A drag in progress is layered on top as `preview`.
 */
export const createEditStyles = () => {
  const touched = new Map<Styled, { attribute: string | null; originals: Map<string, Original> }>();

  const apply = (annotations: Annotation[], preview?: StylePreview) => {
    const wanted = new Map<Styled, Record<string, string>>();
    const want = (elements: Element[], declarations: Record<string, string>) => {
      for (const el of elements) {
        if (!('style' in el)) continue;
        wanted.set(el as Styled, { ...wanted.get(el as Styled), ...declarations });
      }
    };
    for (const a of annotations) {
      if (a.edits?.length) want(resolveAnnotationMatches(a), editDeclarations(a.edits));
    }
    if (preview) want(preview.elements, preview.declarations);

    for (const [el, entry] of touched) {
      const declarations = wanted.get(el);
      for (const [name, original] of entry.originals) {
        if (declarations && name in declarations) continue;
        if (original.value) el.style.setProperty(name, original.value, original.priority);
        else el.style.removeProperty(name);
        entry.originals.delete(name);
      }
      if (entry.originals.size) continue;
      // Leave no empty style attribute behind on an element that had none
      if (entry.attribute === null && !el.style.length) el.removeAttribute('style');
      touched.delete(el);
    }

    for (const [el, declarations] of wanted) {
      let entry = touched.get(el);
      if (!entry) {
        entry = { attribute: el.getAttribute('style'), originals: new Map() };
        touched.set(el, entry);
      }
      for (const [name, value] of Object.entries(declarations)) {
        if (!entry.originals.has(name)) {
          entry.originals.set(name, { value: el.style.getPropertyValue(name), priority: el.style.getPropertyPriority(name) });
        }
        // Unchanged values aren't rewritten: each write is a mutation the annotator observes
        if (el.style.getPropertyValue(name) === value && el.style.getPropertyPriority(name) === 'important') continue;
        el.style.setProperty(name, value, 'important');
      }
    }
  };

  return { apply };
};
