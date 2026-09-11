export const isMac = /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

/** Modifier that switches the annotator into pass-through mode while held. */
export const PASS_THROUGH_KEY = isMac ? 'Meta' : 'Control';
