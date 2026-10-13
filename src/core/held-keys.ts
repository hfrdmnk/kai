/** The modifiers held right now, one record for every mode: inspect reads Shift and Ctrl, an armed property Alt and Shift */
export type HeldKeys = { alt: boolean; shift: boolean; ctrl: boolean };

export const NONE_HELD: HeldKeys = { alt: false, shift: false, ctrl: false };

type ModifierEvent = { type: string; key?: string; altKey: boolean; shiftKey: boolean; ctrlKey: boolean };

const MODIFIER_KEYS: Record<string, keyof HeldKeys> = { Alt: 'alt', Shift: 'shift', Control: 'ctrl' };

/**
 * The held modifiers after an event. A modifier's own keydown / keyup decides it, since synthetic
 * input sends those without flags; every other event reports all three by its flags. With
 * `mouseClears` false, mouse events can turn a modifier on but never off: synthetic mouse events
 * carry no flags, and dropping Alt mid-drag would change what the drag adjusts.
 */
export const nextHeld = (held: HeldKeys, e: ModifierEvent, mouseClears: boolean): HeldKeys => {
  const flags: HeldKeys = { alt: e.altKey, shift: e.shiftKey, ctrl: e.ctrlKey };
  let next: HeldKeys;
  if (e.type.startsWith('key')) {
    next = flags;
    const own = e.key ? MODIFIER_KEYS[e.key] : undefined;
    if (own) next[own] = e.type === 'keydown';
  } else {
    next = mouseClears ? flags : { alt: held.alt || flags.alt, shift: held.shift || flags.shift, ctrl: held.ctrl || flags.ctrl };
  }
  return next.alt === held.alt && next.shift === held.shift && next.ctrl === held.ctrl ? held : next;
};
