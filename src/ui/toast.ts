export const showToast = (shadowRoot: ShadowRoot, message: string): void => {
  const el = document.createElement('div');
  el.className = 'kai-toast';
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  shadowRoot.appendChild(el);

  setTimeout(() => {
    el.classList.add('kai-toast--out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2000);
};
