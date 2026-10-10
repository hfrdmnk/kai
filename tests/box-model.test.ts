import { describe, expect, test } from 'bun:test';
import { flexGutters, formatEdges, gridAxis, parseTracks } from '../src/core/box-model.ts';

const edges = (top: number, right: number, bottom: number, left: number) => ({ top, right, bottom, left });
const box = (left: number, top: number, width: number, height: number) => ({ left, top, width, height });

describe('formatEdges', () => {
  test('uses CSS shorthand order with rem equivalents', () => {
    expect(formatEdges(edges(0, 0, 0, 0))).toBe('0');
    expect(formatEdges(edges(16, 16, 16, 16))).toBe('16 (1rem)');
    expect(formatEdges(edges(16, 24, 16, 24))).toBe('16 24 (1rem 1.5rem)');
    expect(formatEdges(edges(8, 24, 16, 24))).toBe('8 24 16 (0.5rem 1.5rem 1rem)');
    expect(formatEdges(edges(8, 24, 16, 4))).toBe('8 24 16 4 (0.5rem 1.5rem 1rem 0.25rem)');
  });

  test('keeps negative values and rounds sub-pixel noise', () => {
    expect(formatEdges(edges(-8, 0, -8, 0))).toBe('-8 0 (-0.5rem 0)');
    expect(formatEdges(edges(0.004, 0, -0.004, 0))).toBe('0');
  });
});

describe('gridAxis', () => {
  // Three 100px tracks, 10px gaps, 400px wide: 80px free
  const axis = (distribution: string) => gridAxis([100, 100, 100], 10, 400, distribution);

  test('start-aligned tracks', () => {
    expect(axis('normal')).toEqual({ start: 0, end: 320, gutters: [100, 210] });
    expect(axis('start')).toEqual(axis('normal'));
  });

  test('end and center shift every gutter', () => {
    expect(axis('end')).toEqual({ start: 80, end: 400, gutters: [180, 290] });
    expect(axis('flex-end')).toEqual(axis('end'));
    expect(axis('safe end')).toEqual(axis('end'));
    expect(axis('center')).toEqual({ start: 40, end: 360, gutters: [140, 250] });
  });

  test('distributed space centers each gutter in the widened gap', () => {
    expect(axis('space-between')).toEqual({ start: 0, end: 400, gutters: [120, 270] });
    expect(axis('space-evenly')).toEqual({ start: 20, end: 380, gutters: [130, 260] });
    // 80 / 3 per track, half of it at each end
    const around = axis('space-around');
    expect(around.start).toBeCloseTo(40 / 3);
    expect(around.gutters[0]).toBeCloseTo(40 / 3 + 100 + 40 / 3);
  });

  test('no gutters for one track, no tracks or no gap', () => {
    expect(gridAxis([400], 16, 400, 'center')).toEqual({ start: 0, end: 400, gutters: [] });
    expect(gridAxis([], 16, 400, 'space-around')).toEqual({ start: 0, end: 400, gutters: [] });
    expect(gridAxis([100, 100], 0, 400, 'normal').gutters).toEqual([]);
  });
});

describe('flexGutters', () => {
  const content = box(0, 0, 400, 100);

  test('row: one gap-wide gutter between neighbours, spanning a single line', () => {
    const items = [box(0, 0, 80, 40), box(96, 0, 80, 40), box(192, 0, 80, 40)];
    expect(flexGutters(items, true, false, 16, 0, content)).toEqual([box(80, 0, 16, 100), box(176, 0, 16, 100)]);
  });

  test('space-between centers the gutter in the wider space', () => {
    expect(flexGutters([box(0, 0, 80, 40), box(320, 0, 80, 40)], true, false, 16, 0, content))
      .toEqual([box(192, 0, 16, 100)]);
  });

  test('column direction swaps axes', () => {
    const items = [box(0, 0, 400, 30), box(0, 42, 400, 30)];
    expect(flexGutters(items, false, false, 12, 0, content)).toEqual([box(0, 30, 400, 12)]);
  });

  test('wrapped rows get per-line column gutters and a row gutter between lines', () => {
    const items = [box(0, 0, 80, 30), box(104, 0, 80, 30), box(0, 42, 80, 30)];
    expect(flexGutters(items, true, true, 24, 12, content)).toEqual([box(80, 0, 24, 30), box(0, 30, 400, 12)]);
  });

  test('nowrap rows stay one line whatever the cross positions', () => {
    // align-self: flex-start next to align-self: flex-end
    const items = [box(0, 0, 80, 10), box(96, 90, 80, 10)];
    expect(flexGutters(items, true, false, 16, 16, content)).toEqual([box(80, 0, 16, 100)]);
  });

  test('zero-height items share their line', () => {
    const items = [box(0, 0, 80, 0), box(96, 0, 80, 0)];
    expect(flexGutters(items, true, true, 16, 16, content)).toEqual([box(80, 0, 16, 100)]);
  });
});

describe('parseTracks', () => {
  test('drops trailing collapsed auto-fit tracks only', () => {
    expect(parseTracks('400px 0px 0px 0px')).toEqual([400]);
    expect(parseTracks('100px 0px 100px 100px')).toEqual([100, 0, 100, 100]);
    expect(parseTracks('[full-start] 100px [content-start] 200px [content-end]')).toEqual([100, 200]);
    expect(parseTracks('none')).toEqual([]);
  });

  test('an empty middle track keeps the gutters on both sides', () => {
    expect(gridAxis(parseTracks('100px 0px 100px 100px'), 10, 400, 'normal').gutters).toEqual([100, 110, 220]);
  });
});
