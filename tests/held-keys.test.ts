import { describe, expect, test } from 'bun:test';
import { nextHeld, NONE_HELD } from '../src/core/held-keys.ts';

const key = (type: string, k: string, flags: Partial<Record<'altKey' | 'shiftKey' | 'ctrlKey', boolean>> = {}) =>
  ({ type, key: k, altKey: false, shiftKey: false, ctrlKey: false, ...flags });
const mouse = (flags: Partial<Record<'altKey' | 'shiftKey' | 'ctrlKey', boolean>> = {}) =>
  ({ type: 'mousemove', altKey: false, shiftKey: false, ctrlKey: false, ...flags });

describe('held keys', () => {
  test("a modifier's own key event decides it, flags or not (synthetic input sends none)", () => {
    expect(nextHeld(NONE_HELD, key('keydown', 'Alt'), true)).toEqual({ alt: true, shift: false, ctrl: false });
    expect(nextHeld({ ...NONE_HELD, shift: true }, key('keyup', 'Shift', { shiftKey: true }), true).shift).toBe(false);
    expect(nextHeld(NONE_HELD, key('keydown', 'Control'), true).ctrl).toBe(true);
  });

  test('other key events report every modifier by their flags', () => {
    expect(nextHeld(NONE_HELD, key('keydown', 'ArrowUp', { altKey: true, ctrlKey: true }), true)).toEqual({ alt: true, shift: false, ctrl: true });
    expect(nextHeld({ alt: true, shift: true, ctrl: true }, key('keyup', 'p'), true)).toEqual(NONE_HELD);
  });

  test('mouse events report flags; without `mouseClears` they only turn modifiers on', () => {
    const held = { alt: true, shift: false, ctrl: false };
    expect(nextHeld(held, mouse({ shiftKey: true }), true)).toEqual({ alt: false, shift: true, ctrl: false });
    expect(nextHeld(held, mouse({ shiftKey: true }), false)).toEqual({ alt: true, shift: true, ctrl: false });
    expect(nextHeld(held, mouse(), false)).toBe(held);
  });

  test('an unchanged state is returned as is', () => {
    const held = { alt: false, shift: true, ctrl: false };
    expect(nextHeld(held, key('keydown', 'a', { shiftKey: true }), true)).toBe(held);
  });
});
