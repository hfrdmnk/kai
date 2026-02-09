import type { FabCorner } from '../types.ts';

export const showToast = (
  shadowRoot: ShadowRoot,
  message: string,
  corner: FabCorner = 'bottom-right',
): void => {
  const el = document.createElement('div');
  el.className = 'kai-toast';
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  // Position based on FAB corner
  if (corner.includes('bottom')) {
    el.style.bottom = '80px';
  } else {
    el.style.top = '80px';
  }
  if (corner.includes('right')) {
    el.style.right = '24px';
  } else {
    el.style.left = '24px';
  }

  shadowRoot.appendChild(el);

  setTimeout(() => {
    el.classList.add('kai-toast--out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2000);
};
