import { describe, expect, test } from 'bun:test';
import { ownAnnotationOf, ownerIndexes } from '../src/core/selector.ts';

const edit = [{ property: 'padding-right', from: 8, to: 18 }];

describe("an element's own annotation", () => {
  test('the last annotation with edits owns its element, else the last one', () => {
    const a = (edits?: unknown[]) => ({ edits });
    // el: [0 edits, 1 note only] → 0; other: [2 note, 4 note] → 4; 3 unresolved
    expect([...ownerIndexes([a(edit), a(), a(), a(edit), a()], ['el', 'el', 'other', null, 'other'])].sort()).toEqual([0, 4]);
    // Two with edits: the later one
    expect([...ownerIndexes([a(edit), a(edit)], ['el', 'el'])]).toEqual([1]);
    expect([...ownerIndexes([], [])]).toEqual([]);
  });

  test('ownAnnotationOf agrees: what is painted is what opens', () => {
    const el = { id: 'el' };
    const annotations = [{ id: 'A', to: el, edits: edit }, { id: 'B', to: el, edits: undefined }];
    const resolve = (x: { to: object }) => x.to as Element;
    expect(ownAnnotationOf(annotations, el as unknown as Element, resolve)?.id).toBe('A');
    expect(ownAnnotationOf([annotations[1]], el as unknown as Element, resolve)?.id).toBe('B');
    expect(ownAnnotationOf(annotations, {} as Element, resolve)).toBeUndefined();
  });
});
