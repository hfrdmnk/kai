import { SPRING } from '../core/easing.ts';

type GuideMode = 'annotate' | 'measure';

const CONTENT: Record<GuideMode, { text: string; key: string; hint: string }> = {
  annotate: { text: 'Click elements to annotate', key: '⌥', hint: 'inspect mode' },
  measure:  { text: 'Drag to measure',           key: '⇧', hint: 'text info' },
};

const renderContent = (mode: GuideMode): DocumentFragment => {
  const frag = document.createDocumentFragment();
  const { text, key, hint } = CONTENT[mode];

  const span = document.createElement('span');
  span.textContent = text;
  frag.appendChild(span);

  const sep = document.createElement('span');
  sep.className = 'kai-guide-bar-sep';
  sep.textContent = '·';
  frag.appendChild(sep);

  const kbd = document.createElement('span');
  kbd.className = 'kai-guide-bar-kbd';
  kbd.textContent = key;
  frag.appendChild(kbd);

  const hintEl = document.createElement('span');
  hintEl.className = 'kai-guide-bar-hint';
  hintEl.textContent = hint;
  frag.appendChild(hintEl);

  return frag;
};

export const createGuideBar = (shadowRoot: ShadowRoot) => {
  let currentMode: GuideMode | null = null;
  let barAnim: Animation | null = null;
  let contentAnim: Animation | null = null;
  let visible = false;

  const bar = document.createElement('div');
  bar.className = 'kai-guide-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.display = 'none';

  const content = document.createElement('div');
  content.className = 'kai-guide-bar-content';
  bar.appendChild(content);

  shadowRoot.appendChild(bar);

  const show = (mode: GuideMode) => {
    if (visible && currentMode === mode) return;

    barAnim?.cancel();
    contentAnim?.cancel();

    if (!visible) {
      // First show — appear animation
      visible = true;
      currentMode = mode;
      bar.style.display = '';
      content.replaceChildren(renderContent(mode));

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
        content.replaceChildren(renderContent(mode));

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
    bar.remove();
  };

  return { show, hide, destroy };
};
