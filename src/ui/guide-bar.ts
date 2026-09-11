import { SPRING, GLIDE } from '../core/easing.ts';
import { isMac } from '../core/platform.ts';

export type KeyId = 'alt' | 'shift' | 'meta' | 'up' | 'down' | 'esc';
export type GuideMode = 'annotate' | 'measure' | 'interact' | 'pick';

const KEY_LABELS: Record<KeyId, string> = {
  alt: isMac ? '⌥' : 'Alt',
  shift: isMac ? '⇧' : 'Shift',
  meta: isMac ? '⌘' : 'Ctrl',
  up: '↑',
  down: '↓',
  esc: 'Esc',
};

type Hint = { keys: KeyId[]; hint: string };

const CONTENT: Record<GuideMode, { text: string; hints: Hint[] }> = {
  annotate: {
    text: 'Click elements to annotate',
    hints: [
      { keys: ['alt'],    hint: 'inspect' },
      { keys: ['meta'],   hint: 'interact' },
      { keys: ['up', 'down'], hint: 'parent / child' },
    ],
  },
  measure: {
    text: 'Drag to measure',
    hints: [{ keys: ['alt', 'shift'], hint: 'text info' }],
  },
  interact: {
    text: 'Interacting with page',
    hints: [{ keys: ['meta'], hint: 'release to annotate' }],
  },
  pick: {
    text: 'Click an element to copy its selector',
    hints: [{ keys: ['esc'], hint: 'cancel' }],
  },
};

const renderContent = (mode: GuideMode, pressedKeys: KeyId[] = []): DocumentFragment => {
  const frag = document.createDocumentFragment();
  const { text, hints } = CONTENT[mode];

  const span = document.createElement('span');
  span.textContent = text;
  frag.appendChild(span);

  for (const { keys, hint } of hints) {
    const sep = document.createElement('span');
    sep.className = 'kai-guide-bar-sep';
    sep.textContent = '·';
    frag.appendChild(sep);

    for (const k of keys) {
      const kbd = document.createElement('span');
      kbd.className = 'kai-guide-bar-kbd';
      kbd.setAttribute('data-key', k);
      if (pressedKeys.includes(k)) kbd.setAttribute('data-pressed', '');
      kbd.textContent = KEY_LABELS[k];
      frag.appendChild(kbd);
    }

    const hintEl = document.createElement('span');
    hintEl.className = 'kai-guide-bar-hint';
    hintEl.textContent = hint;
    frag.appendChild(hintEl);
  }

  return frag;
};

export const createGuideBar = (shadowRoot: ShadowRoot) => {
  let currentMode: GuideMode | null = null;
  let barAnim: Animation | null = null;
  let contentAnim: Animation | null = null;
  let widthAnim: Animation | null = null;
  let visible = false;

  const bar = document.createElement('div');
  bar.className = 'kai-guide-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.display = 'none';

  const content = document.createElement('div');
  content.className = 'kai-guide-bar-content';
  bar.appendChild(content);

  shadowRoot.appendChild(bar);

  let pressedKeys: KeyId[] = [];

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
    contentAnim?.cancel();
    widthAnim?.cancel();

    if (!visible) {
      // First show — appear animation
      visible = true;
      currentMode = mode;
      bar.style.display = '';
      content.replaceChildren(renderContent(mode, pressedKeys));

      barAnim = bar.animate(
        [
          { transform: 'translateX(-50%) scale(0.8) translateY(-8px)', opacity: 0 },
          { transform: 'translateX(-50%) scale(1) translateY(0)',      opacity: 1 },
        ],
        { duration: 400, easing: SPRING, fill: 'forwards' },
      );
    } else {
      // Content swap — crossfade
      currentMode = mode;

      contentAnim = content.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-4px)' },
        ],
        { duration: 150, easing: 'ease-out', fill: 'forwards' },
      );

      contentAnim.finished.then(() => {
        const oldWidth = bar.getBoundingClientRect().width;

        content.replaceChildren(renderContent(mode, pressedKeys));

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

  const hide = () => {
    if (!visible) return;
    visible = false;
    currentMode = null;

    barAnim?.cancel();
    contentAnim?.cancel();
    widthAnim?.cancel();

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
  };

  return { show, hide, updateKeys, destroy };
};
