export const isMac = /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

/** Modifier that switches the annotator into pass-through mode while held. */
export const PASS_THROUGH_KEY = isMac ? 'Meta' : 'Control';

/**
 * Single-key shortcuts for the FAB actions, live while the annotator is active and no text
 * field has focus. `keys` are `KeyboardEvent.key` values, `label` is what the tooltip shows.
 * Clear needs two presses like the button: the first arms, the second confirms.
 */
export const SHORTCUTS = {
  pick: { keys: ['S'], label: 'S' },
  copy: { keys: ['M'], label: 'M' },
  clear: { keys: ['Backspace', 'Delete'], label: isMac ? '⌫' : 'Del' },
  settings: { keys: [','], label: ',' },
} as const;

export type ShortcutAction = keyof typeof SHORTCUTS;
