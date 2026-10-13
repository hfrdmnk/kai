import { describe, expect, test } from 'bun:test';
import { ownAnnotationOf, ownerIndexes } from '../src/core/selector.ts';

describe("an element's own annotation", () => {
  test('the last annotation resolving to an element owns it (what is painted)', () => {
    expect([...ownerIndexes(['a', 'b', 'a', null, 'c', 'b'])].sort()).toEqual([2, 4, 5]);
    expect([...ownerIndexes([])]).toEqual([]);
  });

  test('ownAnnotationOf picks the same one', () => {
    const el = { id: 'el' };
    const other = { id: 'other' };
    const annotations = [{ id: '1', to: el }, { id: '2', to: other }, { id: '3', to: el }];
    const resolve = (a: { to: object }) => a.to as Element;
    expect(ownAnnotationOf(annotations, el as unknown as Element, resolve)?.id).toBe('3');
    expect(ownAnnotationOf(annotations, {} as Element, resolve)).toBeUndefined();
  });
});
