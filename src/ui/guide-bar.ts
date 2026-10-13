import { SPRING, GLIDE } from '../core/easing.ts';
import { isMac, INTERACTION_KEY, SHORTCUTS } from '../core/platform.ts';

export type KeyId = 'alt' | 'shift' | 'ctrl' | 'esc' | 't';
export type GuideMode = 'annotate' | 'measure' | 'interact' | 'pick' | 'adjust';

/** Drag to adjust: armed hints, the drag readout, or the confirmation after release; all one 32px line */
export type AdjustHud =
  | {
    kind: 'armed';
    title: string;
    /** Current value, shortened like CSS shorthand */
    value: string;
    /** Sides (top, right, bottom, left) or corners (clockwise from top-left) that will change */
    glyph: { corners: boolean; on: boolean[] } | null;
    modifiers: { key: KeyId; hint: string; pressed: boolean }[];
  }
  | {
    kind: 'drag';
    name: string;
    value: string;
    delta: string;
    /** Name cell width in ch */
    nameWidth: number;
    /** Snapping is on: a cell for the snapped class or token (`note`, empty when off the scale) */
    snap: boolean;
    note: string;
  }
  /** A moment's confirmation: `✓ Annotation 3`, `Reset padding` */
  | { kind: 'notice'; text: string; check: boolean };

const KEY_LABELS: Record<KeyId, string> = {
  alt: isMac ? '⌥' : 'Alt',
  shift: isMac ? '⇧' : 'Shift',
  ctrl: isMac ? '⌃' : 'Ctrl',
  esc: 'Esc',
  t: 'T',
};

type Hint = { keys: KeyId[]; hint: string };

const CONTENT: Record<Exclude<GuideMode, 'adjust'>, { text: string; hints: Hint[] }> = {
  annotate: {
    text: 'Click elements to annotate',
    hints: [{ keys: ['alt'], hint: 'inspect' }],
  },
  measure: {
    text: 'Drag to measure',
    hints: [
      { keys: ['alt', 'shift'], hint: 'text info' },
      { keys: ['alt', 'ctrl'], hint: 'box model' },
    ],
  },
  interact: {
    text: 'Interacting with page',
    hints: [],
  },
  pick: {
    text: 'Click an element to copy its selector',
    hints: [{ keys: ['esc'], hint: 'cancel' }],
  },
};

const span = (className: string, text: string): HTMLSpanElement => {
  const el = document.createElement('span');
  if (className) el.className = className;
  el.textContent = text;
  return el;
};

/** `· ⌥ ⇧ hint`: a separator, the key chips (accent while pressed) and what they do */
const appendHint = (frag: DocumentFragment, keys: KeyId[], hint: string, pressedKeys: KeyId[]) => {
  frag.appendChild(span('kai-guide-bar-sep', '·'));
  for (const k of keys) {
    const kbd = span('kai-guide-bar-kbd', KEY_LABELS[k]);
    kbd.setAttribute('data-key', k);
    if (pressedKeys.includes(k)) kbd.setAttribute('data-pressed', '');
    frag.appendChild(kbd);
  }
  frag.appendChild(span('kai-guide-bar-hint', hint));
};

const renderContent = (mode: Exclude<GuideMode, 'adjust'>, pressedKeys: KeyId[]): DocumentFragment => {
  const frag = document.createDocumentFragment();
  const { text, hints } = CONTENT[mode];
  frag.appendChild(span('', text));
  for (const { keys, hint } of hints) appendHint(frag, keys, hint, pressedKeys);
  return frag;
};

const renderAdjust = (hud: AdjustHud): DocumentFragment => {
  const frag = document.createDocumentFragment();
  if (hud.kind === 'notice') {
    if (hud.check) frag.appendChild(span('kai-guide-bar-check', '✓'));
    frag.appendChild(span('', hud.text));
    return frag;
  }
  if (hud.kind === 'drag') {
    const name = span('kai-guide-bar-name', hud.name);
    name.style.minWidth = `${hud.nameWidth}ch`;
    frag.append(name, span('kai-guide-bar-num', hud.value), span('kai-guide-bar-num kai-guide-bar-delta', hud.delta));
    if (hud.snap) frag.appendChild(span('kai-guide-bar-note', hud.note));
    return frag;
  }
  if (hud.glyph) {
    const glyph = span('kai-guide-bar-glyph', '');
    glyph.toggleAttribute('data-corners', hud.glyph.corners);
    for (const on of hud.glyph.on) {
      const edge = document.createElement('i');
      edge.toggleAttribute('data-on', on);
      glyph.appendChild(edge);
    }
    frag.appendChild(glyph);
  }
  frag.append(span('', hud.title), span('kai-guide-bar-value', hud.value));
  for (const { key, hint, pressed } of hud.modifiers) appendHint(frag, [key], hint, pressed ? [key] : []);
  return frag;
};

export const createGuideBar = (shadowRoot: ShadowRoot) => {
  let currentMode: GuideMode | null = null;
  let barAnim: Animation | null = null;
  let contentAnim: Animation | null = null;
  let widthAnim: Animation | null = null;
  let visible = false;
  let adjustHud: AdjustHud | null = null;
  /** A mode's content is replaced halfway through the crossfade */
  let swapping = false;
  /** Widest the bar has been during the current drag */
  let dragWidth = 0;

  const bar = document.createElement('div');
  bar.className = 'kai-guide-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.display = 'none';

  const content = document.createElement('div');
  content.className = 'kai-guide-bar-content';
  bar.appendChild(content);

  shadowRoot.appendChild(bar);

  // Blurs the page and the rest of kai behind the shortcut reference; clicking it closes the panel
  const backdrop = document.createElement('div');
  backdrop.className = 'kai-shortcuts-backdrop';
  backdrop.hidden = true;

  const help = document.createElement('section');
  help.className = 'kai-shortcuts';
  help.hidden = true;
  help.setAttribute('role', 'dialog');
  help.setAttribute('aria-label', 'Keyboard shortcuts');
  const title = document.createElement('h2');
  title.textContent = 'Keyboard shortcuts';
  help.appendChild(title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'kai-shortcuts-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close keyboard shortcuts');
  help.appendChild(close);
  const mod = isMac ? 'Cmd' : 'Ctrl';
  const groups: [string, [string, string][]][] = [
    ['Modes', [
      ['Ctrl + Shift + A', 'Toggle kai (extension)'],
      [INTERACTION_KEY, 'Toggle interaction / annotation'],
      ['?', 'Toggle this panel'],
      ['Alt (hold)', 'Inspect / drag to measure'],
      ['Alt + Shift (hold)', 'Inspect text metrics'],
      ['Alt + Ctrl (hold)', 'Inspect box model (add Shift for text metrics)'],
    ]],
    ['Annotation & selector', [
      ['↑ / ↓', 'Select parent / child, also while inspecting'],
      [SHORTCUTS.pick.label, 'Toggle copy-selector mode'],
      [SHORTCUTS.copy.label, 'Copy annotations as Markdown'],
      [SHORTCUTS.clear.label, 'Clear all (press twice within 3 s)'],
      [SHORTCUTS.settings.label, 'Toggle settings'],
      ['Esc', 'Close panel / settings, cancel pick, or exit kai'],
    ]],
    ['Adjust', [
      ['P / M', 'Arm padding / margin, then drag anywhere'],
      ['G', 'Arm the gap of the nearest flex or grid container'],
      ['F / L', 'Arm font size / line height'],
      ['B', 'Arm border radius'],
      ['Drag', 'Nearest side or corner; release adds it to the annotation'],
      ['Alt + drag', 'That side and its opposite, or both corners on that side'],
      ['Shift + drag', 'All sides, all corners or both gaps'],
      ['T', 'Snap to the project’s scale (stays on; offered when the page has one)'],
      ['← / →', 'Nudge the side under the pointer one step, saved right away'],
      ['Backspace', 'Reset the property on the element'],
      ['Esc', 'Cancel the drag or disarm'],
    ]],
    ['Annotation editor & settings', [
      [`${mod} + Enter`, 'Save annotation'],
      ['Tab / Enter', 'Accept autocomplete suggestion'],
      ['↑ / ↓', 'Navigate autocomplete suggestions'],
      ['Tab', 'Accept px → rem suggestion / move focus'],
      ['Arrow keys', 'Choose theme / accent in settings'],
    ]],
  ];
  for (const [heading, rows] of groups) {
    const h = document.createElement('h3');
    h.textContent = heading;
    help.appendChild(h);
    for (const [key, description] of rows) {
      const row = document.createElement('div');
      row.className = 'kai-shortcuts-row';
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      const label = document.createElement('span');
      label.textContent = description;
      row.append(kbd, label);
      help.appendChild(row);
    }
  }
  const note = document.createElement('p');
  note.textContent = 'I and ? work outside text fields. While typing, use the interaction button or Keyboard shortcuts in settings. In interaction mode, other keys belong to the page.';
  help.appendChild(note);
  shadowRoot.append(backdrop, help);
  let previousFocus: Element | null = null;
  const closeHelp = () => {
    if (help.hidden) return false;
    help.hidden = true;
    backdrop.hidden = true;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    return true;
  };
  const toggleHelp = () => {
    if (closeHelp()) return;
    previousFocus = shadowRoot.activeElement ?? document.activeElement;
    // Last in the tree: the popover and other layers added later share the top z-index
    shadowRoot.append(backdrop, help);
    help.hidden = false;
    backdrop.hidden = false;
    close.focus();
  };
  close.addEventListener('click', closeHelp);
  backdrop.addEventListener('click', closeHelp);

  const updatePointer = (x: number, y: number) => {
    if (!visible) return;
    const rect = bar.getBoundingClientRect();
    bar.toggleAttribute('data-obscured', x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  };

  let pressedKeys: KeyId[] = [];

  /** A crossfade's fade-out fills forwards under its fade-in; ending a crossfade must cancel both */
  const stopContentAnims = () => {
    for (const anim of content.getAnimations()) anim.cancel();
    contentAnim = null;
  };

  const render = (mode: GuideMode) =>
    mode === 'adjust' ? renderAdjust(adjustHud ?? { kind: 'notice', text: '', check: false }) : renderContent(mode, pressedKeys);

  const resetDragWidth = () => {
    dragWidth = 0;
    bar.style.minWidth = '';
  };

  const updateKeys = (pressed: KeyId[]) => {
    if (!visible) return;
    pressedKeys = pressed;
    const kbds = content.querySelectorAll<HTMLElement>('.kai-guide-bar-kbd');
    for (const kbd of kbds) {
      const key = kbd.getAttribute('data-key') as KeyId;
      if (pressed.includes(key)) {
        kbd.setAttribute('data-pressed', '');
      } else {
        kbd.removeAttribute('data-pressed');
      }
    }
  };

  const show = (mode: GuideMode, pressed: KeyId[] = []) => {
    pressedKeys = pressed;

    if (visible && currentMode === mode) {
      updateKeys(pressed);
      return;
    }

    barAnim?.cancel();
    stopContentAnims();
    widthAnim?.cancel();
    swapping = false;

    if (!visible) {
      // First show — appear animation
      visible = true;
      currentMode = mode;
      bar.style.display = '';
      content.replaceChildren(render(mode));

      barAnim = bar.animate(
        [
          { transform: 'translateX(-50%) scale(0.8) translateY(-8px)' },
          { transform: 'translateX(-50%) scale(1) translateY(0)' },
        ],
        { duration: 400, easing: SPRING, fill: 'forwards' },
      );
    } else {
      // Content swap — crossfade
      currentMode = mode;
      swapping = true;

      contentAnim = content.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-4px)' },
        ],
        { duration: 150, easing: 'ease-out', fill: 'forwards' },
      );

      contentAnim.finished.then(() => {
        const oldWidth = bar.getBoundingClientRect().width;

        swapping = false;
        if (mode !== 'adjust') resetDragWidth();
        content.replaceChildren(render(mode));

        const newWidth = bar.getBoundingClientRect().width;

        if (oldWidth !== newWidth) {
          widthAnim?.cancel();
          widthAnim = bar.animate(
            [{ width: `${oldWidth}px` }, { width: `${newWidth}px` }],
            { duration: 250, easing: GLIDE, fill: 'forwards' },
          );
          widthAnim.finished.then(() => {
            widthAnim?.cancel();
            widthAnim = null;
          }).catch(() => {});
        }

        contentAnim = content.animate(
          [
            { opacity: 0, transform: 'translateY(4px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 200, easing: 'ease-out', fill: 'forwards' },
        );
      }).catch(() => {});
    }
  };

  /**
   * Shows drag-to-adjust content. Within the adjust mode it updates in place, without the crossfade:
   * it follows the pointer. During a drag the pill only grows, so it never shrinks back and forth.
   */
  const showAdjust = (hud: AdjustHud) => {
    adjustHud = hud;
    if (!visible || currentMode !== 'adjust') {
      show('adjust');
      return;
    }
    if (hud.kind === 'drag' && (swapping || widthAnim)) {
      // A drag right after arming: end the hints' crossfade now, or its frozen width becomes the drag's minimum.
      // Both halves go: cancelling only the fade-in would bring back the finished fade-out's opacity 0
      stopContentAnims();
      widthAnim?.cancel();
      widthAnim = null;
      swapping = false;
    }
    if (swapping) return;
    content.replaceChildren(renderAdjust(hud));
    if (hud.kind !== 'drag') {
      resetDragWidth();
      return;
    }
    dragWidth = Math.max(dragWidth, bar.getBoundingClientRect().width);
    bar.style.minWidth = `${dragWidth}px`;
  };

  const hide = () => {
    closeHelp();
    bar.removeAttribute('data-obscured');
    resetDragWidth();
    if (!visible) return;
    visible = false;
    currentMode = null;

    barAnim?.cancel();
    stopContentAnims();
    widthAnim?.cancel();
    swapping = false;

    barAnim = bar.animate(
      [
        { transform: 'translateX(-50%) scale(1) translateY(0)',      opacity: 1 },
        { transform: 'translateX(-50%) scale(0.9) translateY(-6px)', opacity: 0 },
      ],
      { duration: 200, easing: 'ease-out', fill: 'forwards' },
    );

    barAnim.finished.then(() => {
      if (!visible) bar.style.display = 'none';
    }).catch(() => {});
  };

  const destroy = () => {
    barAnim?.cancel();
    contentAnim?.cancel();
    widthAnim?.cancel();
    bar.remove();
    backdrop.remove();
    help.remove();
  };

  return { show, showAdjust, hide, updateKeys, updatePointer, toggleHelp, closeHelp, isHelpOpen: () => !help.hidden, mode: () => currentMode, destroy };
};
