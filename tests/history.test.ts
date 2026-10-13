import { describe, expect, test } from 'bun:test';
import { emptyHistory, record, redo, undo, HISTORY_LIMIT } from '../src/core/history.ts';

const step = (label: string, before: number, after: number) => ({ label, before, after });

describe('history', () => {
  test('undo returns the last step, redo the one just undone', () => {
    let h = record(record(emptyHistory<number>(), step('a', 0, 1)), step('b', 1, 2));
    const u = undo(h);
    expect(u.step).toEqual(step('b', 1, 2));
    h = u.history;
    expect(undo(h).step).toEqual(step('a', 0, 1));
    const r = redo(h);
    expect(r.step).toEqual(step('b', 1, 2));
    expect(r.history.past.map(s => s.label)).toEqual(['a', 'b']);
    expect(r.history.future).toEqual([]);
  });

  test('nothing to undo or redo leaves the history as is', () => {
    const h = emptyHistory<number>();
    expect(undo(h)).toEqual({ history: h, step: null });
    expect(redo(h)).toEqual({ history: h, step: null });
  });

  test('a new step after undoing drops the redo steps', () => {
    let h = record(record(emptyHistory<number>(), step('a', 0, 1)), step('b', 1, 2));
    h = undo(h).history;
    h = record(h, step('c', 1, 3));
    expect(h.future).toEqual([]);
    expect(redo(h).step).toBeNull();
    expect(h.past.map(s => s.label)).toEqual(['a', 'c']);
  });

  test('keeps the most recent steps only', () => {
    let h = emptyHistory<number>();
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) h = record(h, step(String(i), i, i + 1));
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0].label).toBe('5');
  });

  test('records never mutate an earlier history', () => {
    const h = record(emptyHistory<number>(), step('a', 0, 1));
    record(h, step('b', 1, 2));
    undo(h);
    expect(h.past).toHaveLength(1);
  });
});
