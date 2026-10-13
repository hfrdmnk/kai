import { describe, expect, test } from 'bun:test';
import {
  adjustPropertyFor, adjustValue, cursorFor, dragAxisOf, dragReadout, dragTravel, editDeclarations, editsInComment,
  formatEditLine, longhandsOfDeclaration, mergeEdits, nameWidth, nearestCorner, nearestSide, pickParts,
  nudgeValue, shorthandValue, shortestEdits, syncEditLines, withChanges, withoutProperty,
} from '../src/core/adjust.ts';
import type { StyleEdit } from '../src/types.ts';

// 200×100 box at (100, 100)
const rect = { left: 100, top: 100, width: 200, height: 100 };
const at = (x: number, y: number, alt = false, shift = false) => ({ rect, x, y, alt, shift });

describe('keys', () => {
  test('map to properties, case-insensitively', () => {
    expect(adjustPropertyFor('p')).toBe('padding');
    expect(adjustPropertyFor('M')).toBe('margin');
    expect(adjustPropertyFor('g')).toBe('gap');
    expect(adjustPropertyFor('f')).toBe('font-size');
    expect(adjustPropertyFor('L')).toBe('line-height');
    expect(adjustPropertyFor('b')).toBe('border-radius');
    expect(adjustPropertyFor('c')).toBeNull();
    expect(adjustPropertyFor('Shift')).toBeNull();
  });
});

describe('picking sides and corners', () => {
  test('nearest side and corner', () => {
    expect(nearestSide(rect, 290, 150)).toBe('right');
    expect(nearestSide(rect, 150, 105)).toBe('top');
    expect(nearestSide(rect, 104, 190)).toBe('left');
    // Outside the box counts too
    expect(nearestSide(rect, 200, 260)).toBe('bottom');
    expect(nearestCorner(rect, 120, 110)).toBe('top-left');
    expect(nearestCorner(rect, 290, 190)).toBe('bottom-right');
  });

  test('sides: nearest, Alt = axis, Shift = all', () => {
    expect(pickParts('padding', at(290, 150))).toEqual({ parts: ['right'], anchor: 'right' });
    expect(pickParts('padding', at(290, 150, true))).toEqual({ parts: ['right', 'left'], anchor: 'right' });
    expect(pickParts('margin', at(150, 105, true))).toEqual({ parts: ['top', 'bottom'], anchor: 'top' });
    expect(pickParts('padding', at(290, 150, false, true)).parts).toEqual(['top', 'right', 'bottom', 'left']);
    // Shift wins over Alt
    expect(pickParts('padding', at(290, 150, true, true)).parts).toHaveLength(4);
  });

  test('corners: nearest by quadrant, Alt = both on the nearest side, Shift = all', () => {
    expect(pickParts('border-radius', at(280, 110))).toEqual({ parts: ['top-right'], anchor: 'top-right' });
    // Nearest side of (280, 110) is the top
    expect(pickParts('border-radius', at(280, 110, true))).toEqual({ parts: ['top-left', 'top-right'], anchor: 'top-right' });
    expect(pickParts('border-radius', at(295, 160, true)).parts).toEqual(['top-right', 'bottom-right']);
    expect(pickParts('border-radius', at(280, 110, false, true)).parts).toHaveLength(4);
  });

  test('gap: flex main axis, grid drag axis, Shift = both', () => {
    expect(pickParts('gap', { ...at(0, 0), flexAxis: 'column' }).parts).toEqual(['column']);
    expect(pickParts('gap', { ...at(0, 0), flexAxis: 'row' }).parts).toEqual(['row']);
    expect(pickParts('gap', { ...at(0, 0), flexAxis: 'row', shift: true }).parts).toEqual(['row', 'column']);
    // Grid: undecided until the drag picks an axis
    expect(pickParts('gap', at(0, 0)).parts).toEqual([]);
    expect(pickParts('gap', { ...at(0, 0), dragAxis: 'x' }).parts).toEqual(['column']);
    expect(pickParts('gap', { ...at(0, 0), dragAxis: 'y' }).parts).toEqual(['row']);
  });

  test('single values ignore modifiers', () => {
    expect(pickParts('font-size', at(0, 0, true, true))).toEqual({ parts: ['value'], anchor: 'value' });
  });

  test('the drag axis is decided after 6px', () => {
    expect(dragAxisOf(3, 4)).toBeNull();
    expect(dragAxisOf(6, 2)).toBe('x');
    expect(dragAxisOf(-2, -7)).toBe('y');
  });
});

describe('travel', () => {
  test('pulling a side outward is more', () => {
    expect(dragTravel('padding', ['right'], 'right', 10, 50)).toBe(10);
    expect(dragTravel('padding', ['left'], 'left', 10, 0)).toBe(-10);
    expect(dragTravel('margin', ['top', 'bottom'], 'top', 0, -8)).toBe(8);
    expect(dragTravel('padding', ['bottom'], 'bottom', 0, 8)).toBe(8);
  });

  test('moving a corner toward the middle is more', () => {
    expect(dragTravel('border-radius', ['top-left'], 'top-left', 5, 5)).toBe(10);
    expect(dragTravel('border-radius', ['bottom-right'], 'bottom-right', 5, 5)).toBe(-10);
  });

  test('single values: right or up is more', () => {
    expect(dragTravel('font-size', ['value'], 'value', 10, 0)).toBe(10);
    expect(dragTravel('line-height', ['value'], 'value', 0, -10)).toBe(10);
  });

  test('gap follows its axis; both gaps follow the dominant direction', () => {
    expect(dragTravel('gap', ['column'], null, 12, 40)).toBe(12);
    expect(dragTravel('gap', ['row'], null, 12, 40)).toBe(40);
    expect(dragTravel('gap', ['row', 'column'], null, -20, 5)).toBe(-20);
  });
});

describe('values', () => {
  test('2px of travel per px of spacing, whole px, travel under 3px ignored', () => {
    expect(adjustValue('padding', 24, 22)).toBe(35);
    expect(adjustValue('padding', 24, 2)).toBe(24);
    expect(adjustValue('padding', 24, -2.9)).toBe(24);
    expect(adjustValue('padding', 24, 3)).toBe(26);
    // Fractional start values round to whole px once moved
    expect(adjustValue('gap', 13.5, 4)).toBe(16);
  });

  test('padding, gap and radius stop at 0; margin goes negative', () => {
    expect(adjustValue('padding', 8, -40)).toBe(0);
    expect(adjustValue('border-radius', 4, -40)).toBe(0);
    expect(adjustValue('margin', 8, -40)).toBe(-12);
  });

  test('font size: 4px of travel per px', () => {
    expect(adjustValue('font-size', 16, 8)).toBe(18);
  });

  test('line height: 0.01 per 2px, rounded to 0.05', () => {
    expect(adjustValue('line-height', 1.5, 20)).toBe(1.6);
    expect(adjustValue('line-height', 1.5, 4)).toBe(1.5);
    expect(adjustValue('line-height', 1.5, 6)).toBe(1.55);
    expect(adjustValue('line-height', 1.55, 12)).toBe(1.6);
    expect(adjustValue('line-height', 1.375, -36)).toBe(1.2);
  });
});

const lh = (entries: [string, number, number][]) =>
  Object.fromEntries(entries.map(([name, from, to]) => [name, { from, to }]));

describe('shortest declarations', () => {
  test('all four sides equal → shorthand', () => {
    expect(shortestEdits('padding', lh([
      ['padding-top', 8, 16], ['padding-right', 8, 16], ['padding-bottom', 8, 16], ['padding-left', 8, 16],
    ]))).toEqual([{ property: 'padding', from: 8, to: 16 }]);
  });

  test('left + right → inline, top + bottom → block, else single sides', () => {
    expect(shortestEdits('padding', lh([['padding-left', 16, 24], ['padding-right', 16, 24]])))
      .toEqual([{ property: 'padding-inline', from: 16, to: 24 }]);
    expect(shortestEdits('margin', lh([['margin-top', 0, 8], ['margin-bottom', 0, 8], ['margin-left', 4, 6]])))
      .toEqual([{ property: 'margin-block', from: 0, to: 8 }, { property: 'margin-left', from: 4, to: 6 }]);
    // Same target, different starting values: no shared `from`, so single sides
    expect(shortestEdits('padding', lh([['padding-left', 16, 24], ['padding-right', 12, 24]])))
      .toEqual([{ property: 'padding-right', from: 12, to: 24 }, { property: 'padding-left', from: 16, to: 24 }]);
  });

  test('unchanged longhands are left out', () => {
    expect(shortestEdits('padding', lh([['padding-top', 8, 8], ['padding-right', 8, 12]])))
      .toEqual([{ property: 'padding-right', from: 8, to: 12 }]);
    expect(shortestEdits('padding', lh([['padding-top', 8, 8]]))).toEqual([]);
  });

  test('gap and corners', () => {
    expect(shortestEdits('gap', lh([['row-gap', 12, 20], ['column-gap', 12, 20]]))).toEqual([{ property: 'gap', from: 12, to: 20 }]);
    expect(shortestEdits('gap', lh([['column-gap', 12, 20]]))).toEqual([{ property: 'column-gap', from: 12, to: 20 }]);
    expect(shortestEdits('border-radius', lh([
      ['border-top-left-radius', 4, 8], ['border-top-right-radius', 4, 8], ['border-bottom-right-radius', 4, 8], ['border-bottom-left-radius', 4, 8],
    ]))).toEqual([{ property: 'border-radius', from: 4, to: 8 }]);
    expect(shortestEdits('border-radius', lh([['border-top-left-radius', 4, 8], ['border-top-right-radius', 4, 8]])))
      .toEqual([{ property: 'border-top-left-radius', from: 4, to: 8 }, { property: 'border-top-right-radius', from: 4, to: 8 }]);
  });

  test('single values', () => {
    expect(shortestEdits('font-size', lh([['font-size', 16, 18]]))).toEqual([{ property: 'font-size', from: 16, to: 18 }]);
  });

  test('declarations expand back to longhands', () => {
    expect(longhandsOfDeclaration('padding')).toEqual(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);
    expect(longhandsOfDeclaration('margin-inline')).toEqual(['margin-left', 'margin-right']);
    expect(longhandsOfDeclaration('padding-block')).toEqual(['padding-top', 'padding-bottom']);
    expect(longhandsOfDeclaration('gap')).toEqual(['row-gap', 'column-gap']);
    expect(longhandsOfDeclaration('border-radius')).toHaveLength(4);
    expect(longhandsOfDeclaration('border-top-left-radius')).toEqual(['border-top-left-radius']);
    expect(longhandsOfDeclaration('line-height')).toEqual(['line-height']);
  });
});

describe('merging', () => {
  const fontSize: StyleEdit = { property: 'font-size', from: 16, to: 18 };

  test('a new property appends', () => {
    expect(mergeEdits([fontSize], 'padding', lh([['padding-right', 24, 34]])))
      .toEqual([fontSize, { property: 'padding-right', from: 24, to: 34 }]);
  });

  test('editing again keeps the original `from`', () => {
    const edits = mergeEdits([], 'padding', lh([['padding-right', 24, 34]]));
    expect(mergeEdits(edits, 'padding', lh([['padding-right', 34, 40]]))).toEqual([{ property: 'padding-right', from: 24, to: 40 }]);
  });

  test('back to the original removes the edit', () => {
    const edits = mergeEdits([fontSize], 'padding', lh([['padding-right', 24, 34]]));
    expect(mergeEdits(edits, 'padding', lh([['padding-right', 34, 24]]))).toEqual([fontSize]);
    expect(mergeEdits([fontSize], 'font-size', lh([['font-size', 18, 16]]))).toEqual([]);
  });

  test('re-derives the shortest form across drags', () => {
    // Right first, then left to the same value: one padding-inline line
    const right = mergeEdits([], 'padding', lh([['padding-right', 16, 24]]));
    expect(mergeEdits(right, 'padding', lh([['padding-left', 16, 24]]))).toEqual([{ property: 'padding-inline', from: 16, to: 24 }]);
    // A shorthand split by a later single-side drag
    const all = mergeEdits([], 'padding', lh([['padding-top', 8, 16], ['padding-right', 8, 16], ['padding-bottom', 8, 16], ['padding-left', 8, 16]]));
    expect(mergeEdits(all, 'padding', lh([['padding-right', 16, 20]]))).toEqual([
      { property: 'padding-block', from: 8, to: 16 },
      { property: 'padding-right', from: 8, to: 20 },
      { property: 'padding-left', from: 8, to: 16 },
    ]);
  });

  test('keeps the position of the property among other edits', () => {
    const edits: StyleEdit[] = [{ property: 'padding-right', from: 8, to: 12 }, fontSize];
    expect(mergeEdits(edits, 'padding', lh([['padding-right', 12, 14]]))).toEqual([{ property: 'padding-right', from: 8, to: 14 }, fontSize]);
  });
});

describe('comment lines', () => {
  test('px with rem, unitless line height, negatives', () => {
    expect(formatEditLine({ property: 'padding-right', from: 24, to: 34 })).toBe('padding-right: 24px → 34px (2.125rem)');
    expect(formatEditLine({ property: 'line-height', from: 1.55, to: 1.6 })).toBe('line-height: 1.55 → 1.6');
    expect(formatEditLine({ property: 'margin-top', from: 0, to: -8 })).toBe('margin-top: 0px → -8px (-0.5rem)');
    expect(formatEditLine({ property: 'font-size', from: 13.33, to: 16 })).toBe('font-size: 13.33px → 16px (1rem)');
  });

  test('snapped values name the class or token', () => {
    expect(formatEditLine({ property: 'padding-right', from: 24, to: 32, className: 'pr-8' })).toBe('padding-right: 24px → 32px (2rem, pr-8)');
    expect(formatEditLine({ property: 'gap', from: 16, to: 24, token: 'var(--space-6)' })).toBe('gap: 16px → 24px (var(--space-6))');
    expect(formatEditLine({ property: 'line-height', from: 1.5, to: 1.625, className: 'leading-relaxed' })).toBe('line-height: 1.5 → 1.625 (leading-relaxed)');
  });

  test('a new edit appends a line below the user text', () => {
    expect(syncEditLines('Make it breathe', [], [{ property: 'padding-right', from: 24, to: 34 }]))
      .toBe('Make it breathe\npadding-right: 24px → 34px (2.125rem)');
    expect(syncEditLines('', [], [{ property: 'gap', from: 8, to: 12 }])).toBe('gap: 8px → 12px (0.75rem)');
  });

  test('an updated edit replaces its line in place', () => {
    const before = [{ property: 'padding-right', from: 24, to: 34 }];
    const comment = 'padding-right: 24px → 34px (2.125rem)\nand rounder corners';
    expect(syncEditLines(comment, before, [{ property: 'padding-right', from: 24, to: 40 }]))
      .toBe('padding-right: 24px → 40px (2.5rem)\nand rounder corners');
  });

  test('a removed edit drops its line; other lines stay', () => {
    const before = [{ property: 'padding-right', from: 16, to: 24 }];
    const comment = 'Tighter\npadding-right: 16px → 24px (1.5rem)';
    expect(syncEditLines(comment, before, [{ property: 'padding-inline', from: 16, to: 24 }]))
      .toBe('Tighter\npadding-inline: 16px → 24px (1.5rem)');
    expect(syncEditLines(comment, before, [])).toBe('Tighter');
  });

  test('lines match by `property:` at the line start, not a prefix of another property', () => {
    const before = [{ property: 'padding', from: 8, to: 16 }];
    const comment = 'padding-right is fine\npadding: 8px → 16px (1rem)';
    expect(syncEditLines(comment, before, [{ property: 'padding', from: 8, to: 12 }])).toBe('padding-right is fine\npadding: 8px → 12px (0.75rem)');
  });

  test('a comment keeps only the edits whose line is still there', () => {
    const edits = [{ property: 'padding-right', from: 24, to: 34 }, { property: 'font-size', from: 16, to: 18 }];
    expect(editsInComment(edits, 'font-size: 16px → 20px\nnote')).toEqual([edits[1]]);
    expect(editsInComment(edits, '')).toEqual([]);
    expect(editsInComment(edits, '  padding-right: 24px → 34px')).toEqual([edits[0]]);
  });
});

describe('styles from edits', () => {
  test('longhand declarations, later edits winning', () => {
    expect(editDeclarations([
      { property: 'padding-inline', from: 16, to: 24 },
      { property: 'line-height', from: 1.5, to: 1.6 },
      { property: 'padding-left', from: 16, to: 30 },
    ])).toEqual({ 'padding-left': '30px', 'padding-right': '24px', 'line-height': '1.6' });
  });
});

describe('HUD text', () => {
  test('current value shortened like CSS shorthand', () => {
    expect(shorthandValue('padding', { top: 24, right: 24, bottom: 24, left: 24 })).toBe('24px');
    expect(shorthandValue('padding', { top: 16, right: 24, bottom: 16, left: 24 })).toBe('16px 24px');
    expect(shorthandValue('margin', { top: 8, right: 24, bottom: 16, left: 24 })).toBe('8px 24px 16px');
    expect(shorthandValue('margin', { top: 1, right: 2, bottom: 3, left: 4 })).toBe('1px 2px 3px 4px');
    expect(shorthandValue('gap', { row: 12, column: 12 })).toBe('12px');
    expect(shorthandValue('gap', { row: 8, column: 16 })).toBe('8px 16px');
    expect(shorthandValue('border-radius', { 'top-left': 4, 'top-right': 4, 'bottom-right': 0, 'bottom-left': 0 })).toBe('4px 4px 0px 0px');
    expect(shorthandValue('line-height', { value: 1.55 })).toBe('1.55');
  });

  test('drag readout: one declaration, value and signed delta', () => {
    expect(dragReadout('padding', ['right'], 'right', { right: 24 }, { right: 35 }))
      .toEqual({ name: 'padding-right', value: '35px', delta: '+11px', note: '' });
    expect(dragReadout('margin', ['top'], 'top', { top: 4 }, { top: -6 }))
      .toEqual({ name: 'margin-top', value: '-6px', delta: '−10px', note: '' });
    expect(dragReadout('line-height', ['value'], 'value', { value: 1.5 }, { value: 1.6 }))
      .toEqual({ name: 'line-height', value: '1.6', delta: '+0.1', note: '' });
  });

  test('before the pointer moves: what will change, no delta', () => {
    expect(dragReadout('padding', ['left', 'right'], 'left', { left: 16, right: 16 }, { left: 16, right: 16 }))
      .toEqual({ name: 'padding-inline', value: '16px', delta: '', note: '' });
  });

  test('several declarations collapse to one row valued at the grabbed part', () => {
    const start = { top: 8, right: 16, bottom: 8, left: 16 };
    expect(dragReadout('padding', ['top', 'right', 'bottom', 'left'], 'right', start, { top: 12, right: 20, bottom: 12, left: 20 }))
      .toEqual({ name: 'padding', value: '20px', delta: '+4px', note: '' });
    expect(dragReadout('border-radius', ['top-right', 'bottom-right'], 'top-right', { 'top-right': 4, 'bottom-right': 0 }, { 'top-right': 8, 'bottom-right': 4 }))
      .toEqual({ name: 'border-radius (right)', value: '8px', delta: '+4px', note: '' });
    expect(dragReadout('gap', ['row', 'column'], null, { row: 8, column: 16 }, { row: 12, column: 20 }))
      .toEqual({ name: 'gap', value: '12px', delta: '+4px', note: '' });
  });

  test('the name cell fits the longest name a property can produce', () => {
    expect(nameWidth('padding')).toBe('padding-bottom'.length);
    expect(nameWidth('margin')).toBe('margin-bottom'.length);
    expect(nameWidth('gap')).toBe('column-gap'.length);
    expect(nameWidth('border-radius')).toBe('border-bottom-right-radius'.length);
    expect(nameWidth('font-size')).toBe('font-size'.length);
  });
});

describe('cursor', () => {
  test('resize along the active sides, crosshair otherwise', () => {
    expect(cursorFor('padding', ['left', 'right'])).toBe('ew-resize');
    expect(cursorFor('margin', ['top'])).toBe('ns-resize');
    expect(cursorFor('padding', ['top', 'right', 'bottom', 'left'])).toBe('move');
    expect(cursorFor('gap', ['column'])).toBe('ew-resize');
    expect(cursorFor('gap', [])).toBe('crosshair');
    expect(cursorFor('font-size', ['value'])).toBe('crosshair');
    expect(cursorFor('border-radius', ['top-left'])).toBe('crosshair');
  });

  test('while dragging a single value or corner', () => {
    expect(cursorFor('font-size', ['value'], true)).toBe('ew-resize');
    expect(cursorFor('border-radius', ['top-left'], true)).toBe('move');
  });
});

describe('snapped values through merges', () => {
  test('the declaration names the class after its own prefix and the scale suffix', () => {
    expect(shortestEdits('padding', {
      'padding-left': { from: 16, to: 32, ref: { suffix: '8' } },
      'padding-right': { from: 16, to: 32, ref: { suffix: '8' } },
    })).toEqual([{ property: 'padding-inline', from: 16, to: 32, className: 'px-8' }]);
    expect(shortestEdits('margin', { 'margin-top': { from: 0, to: -8, ref: { suffix: '2' } } }))
      .toEqual([{ property: 'margin-top', from: 0, to: -8, className: '-mt-2' }]);
    expect(shortestEdits('border-radius', { 'border-top-left-radius': { from: 4, to: 8, ref: { suffix: 'lg' } } }))
      .toEqual([{ property: 'border-top-left-radius', from: 4, to: 8, className: 'rounded-tl-lg' }]);
    expect(shortestEdits('gap', { 'row-gap': { from: 8, to: 24, ref: { token: 'var(--space-6)' } } }))
      .toEqual([{ property: 'row-gap', from: 8, to: 24, token: 'var(--space-6)' }]);
  });

  test('longhands snapped differently do not share a declaration', () => {
    expect(shortestEdits('padding', {
      'padding-left': { from: 16, to: 32, ref: { suffix: '8' } },
      'padding-right': { from: 16, to: 32 },
    })).toEqual([{ property: 'padding-right', from: 16, to: 32 }, { property: 'padding-left', from: 16, to: 32, className: 'pl-8' }]);
  });

  test('merging keeps the class of untouched longhands, renamed for their new declaration', () => {
    const edits = [{ property: 'padding-inline', from: 16, to: 32, className: 'px-8' }];
    expect(mergeEdits(edits, 'padding', { 'padding-right': { from: 32, to: 40 } })).toEqual([
      { property: 'padding-right', from: 16, to: 40 },
      { property: 'padding-left', from: 16, to: 32, className: 'pl-8' },
    ]);
  });

  test('a snapped change replaces a free one, and the other way round', () => {
    const free = [{ property: 'font-size', from: 16, to: 17 }];
    expect(mergeEdits(free, 'font-size', { 'font-size': { from: 17, to: 18, ref: { suffix: 'lg' } } }))
      .toEqual([{ property: 'font-size', from: 16, to: 18, className: 'text-lg' }]);
    const snapped = [{ property: 'line-height', from: 1.5, to: 1.625, className: 'leading-relaxed' }];
    expect(mergeEdits(snapped, 'line-height', { 'line-height': { from: 1.625, to: 1.65 } }))
      .toEqual([{ property: 'line-height', from: 1.5, to: 1.65 }]);
  });

  test('tokens survive a merge untouched', () => {
    const edits = [{ property: 'gap', from: 8, to: 24, token: 'var(--space-6)' }];
    expect(mergeEdits(edits, 'gap', { 'row-gap': { from: 24, to: 30 } })).toEqual([
      { property: 'row-gap', from: 8, to: 30 },
      { property: 'column-gap', from: 8, to: 24, token: 'var(--space-6)' },
    ]);
  });
});

describe('annotation updates', () => {
  test('a drag merges its edit and rewrites the line', () => {
    const a = { comment: 'Roomier\npadding-right: 24px → 34px (2.125rem)', edits: [{ property: 'padding-right', from: 24, to: 34 }] };
    expect(withChanges(a, 'padding', { 'padding-right': { from: 34, to: 40 } })).toEqual({
      comment: 'Roomier\npadding-right: 24px → 40px (2.5rem)',
      edits: [{ property: 'padding-right', from: 24, to: 40 }],
    });
    expect(a.edits[0].to).toBe(34);
  });

  test('back to the original leaves no edits', () => {
    expect(withChanges({ comment: 'font-size: 16px → 18px (1.125rem)', edits: [{ property: 'font-size', from: 16, to: 18 }] },
      'font-size', { 'font-size': { from: 18, to: 16 } })).toEqual({ comment: '', edits: undefined });
  });
});

describe('nudge', () => {
  test('one whole px, or 0.05 of line height, in either direction', () => {
    expect(nudgeValue('padding', 24, 1)).toBe(25);
    expect(nudgeValue('padding', 24, -1)).toBe(23);
    expect(nudgeValue('line-height', 1.5, 1)).toBe(1.55);
    expect(nudgeValue('line-height', 1.5, -1)).toBe(1.45);
  });

  test('a fractional start goes to the next whole step', () => {
    expect(nudgeValue('font-size', 13.5, 1)).toBe(14);
    expect(nudgeValue('font-size', 13.5, -1)).toBe(13);
    expect(nudgeValue('line-height', 1.375, 1)).toBe(1.4);
  });

  test('respects the minimum', () => {
    expect(nudgeValue('padding', 0, -1)).toBe(0);
    expect(nudgeValue('margin', 0, -1)).toBe(-1);
  });
});

describe('reset', () => {
  test("drops one property's edits and lines, keeping the rest", () => {
    const a = {
      comment: 'Tighter\npadding-inline: 16px → 24px (1.5rem)\nfont-size: 16px → 18px (1.125rem)',
      edits: [{ property: 'padding-inline', from: 16, to: 24 }, { property: 'font-size', from: 16, to: 18 }],
    };
    expect(withoutProperty(a, 'padding')).toEqual({
      comment: 'Tighter\nfont-size: 16px → 18px (1.125rem)',
      edits: [{ property: 'font-size', from: 16, to: 18 }],
    });
    expect(withoutProperty({ comment: 'gap: 8px → 12px (0.75rem)', edits: [{ property: 'gap', from: 8, to: 12 }] }, 'gap'))
      .toEqual({ comment: '', edits: undefined });
  });
});

describe('snapped readout', () => {
  test('names the class or token of the grabbed declaration', () => {
    expect(dragReadout('padding', ['right'], 'right', { right: 24 }, { right: 32 }, { right: { suffix: '8' } }))
      .toEqual({ name: 'padding-right', value: '32px', delta: '+8px', note: 'pr-8' });
    expect(dragReadout('gap', ['row', 'column'], null, { row: 8, column: 8 }, { row: 24, column: 24 }, { row: { token: 'var(--space-6)' }, column: { token: 'var(--space-6)' } }))
      .toEqual({ name: 'gap', value: '24px', delta: '+16px', note: 'var(--space-6)' });
    expect(dragReadout('padding', ['right'], 'right', { right: 24 }, { right: 25 }).note).toBe('');
  });
});
