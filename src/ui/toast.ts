export const showToast = (
  shadowRoot: ShadowRoot,
  message: string,
): void => {
  const el = document.createElement('div');
  el.className = 'kai-toast';
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  // Fixed bottom-center positioning
  el.style.bottom = '24px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%) translateY(8px)';

  shadowRoot.appendChild(el);

  setTimeout(() => {
    el.classList.add('kai-toast--out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2000);
};
