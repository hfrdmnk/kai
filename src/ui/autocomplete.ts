import { harvestCSSVars } from '../core/css-vars.ts';
import { pxToRem } from '../core/styles.ts';

export const attachAutocomplete = (
  textarea: HTMLTextAreaElement,
  shadowRoot: ShadowRoot,
  getElement: () => Element | null,
) => {
  let dropdown: HTMLElement | null = null;
  let items: HTMLElement[] = [];
  let activeIndex = -1;
  let mode: 'vars' | 'rem' | null = null;
  let matchStart = 0;
  let matchEnd = 0;

  const close = () => {
    dropdown?.remove();
    dropdown = null;
    items = [];
    activeIndex = -1;
    mode = null;
    textarea.removeAttribute('aria-activedescendant');
    textarea.setAttribute('aria-expanded', 'false');
  };

  const setActive = (index: number) => {
    if (items[activeIndex]) items[activeIndex].setAttribute('aria-selected', 'false');
    activeIndex = index;
    if (items[activeIndex]) {
      items[activeIndex].setAttribute('aria-selected', 'true');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
      textarea.setAttribute('aria-activedescendant', items[activeIndex].id);
    }
  };

  const accept = () => {
    const item = items[activeIndex];
    if (!item) return;

    const value = item.dataset.value!;
    const before = textarea.value.slice(0, matchStart);
    const after = textarea.value.slice(matchEnd);
    textarea.value = before + value + after;
    textarea.selectionStart = textarea.selectionEnd = matchStart + value.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  };

  const positionDropdown = () => {
    if (!dropdown) return;
    const rect = textarea.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
  };

  const ensureDropdown = (): HTMLElement => {
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'kai-autocomplete';
      dropdown.setAttribute('role', 'listbox');
      dropdown.id = 'kai-ac-list';
      shadowRoot.appendChild(dropdown);
      textarea.setAttribute('aria-expanded', 'true');
      textarea.setAttribute('aria-controls', 'kai-ac-list');
    }
    dropdown.textContent = '';
    return dropdown;
  };

  const showVars = (filter: string) => {
    const el = getElement();
    if (!el) return;

    const vars = harvestCSSVars(el);
    const filtered = filter
      ? vars.filter(v => v.name.includes(filter))
      : vars;

    if (!filtered.length) { close(); return; }

    const container = ensureDropdown();

    items = filtered.slice(0, 30).map((v, i) => {
      const item = document.createElement('div');
      item.className = 'kai-autocomplete-item';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.id = `kai-ac-${i}`;
      item.dataset.value = v.name;

      if (v.isColor) {
        const swatch = document.createElement('span');
        swatch.className = 'kai-autocomplete-swatch';
        swatch.style.background = v.value;
        item.appendChild(swatch);
      }

      const name = document.createElement('span');
      name.className = 'kai-autocomplete-item-name';
      name.textContent = v.name;
      item.appendChild(name);

      const val = document.createElement('span');
      val.className = 'kai-autocomplete-item-value';
      val.textContent = v.value;
      item.appendChild(val);

      item.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        activeIndex = i;
        accept();
      });

      return item;
    });

    for (const item of items) container.appendChild(item);
    positionDropdown();
    setActive(0);
  };

  const showRem = (pxValue: string) => {
    const rem = pxToRem(pxValue);
    if (!rem) { close(); return; }

    const container = ensureDropdown();

    const item = document.createElement('div');
    item.className = 'kai-autocomplete-rem';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.id = 'kai-ac-0';
    item.dataset.value = rem;
    item.textContent = `→ ${rem}`;

    item.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activeIndex = 0;
      accept();
    });

    items = [item];
    container.appendChild(item);
    positionDropdown();
    setActive(0);
  };

  const onInput = () => {
    const pos = textarea.selectionStart;
    const text = textarea.value.slice(0, pos);

    const pxMatch = text.match(/(\d+(?:\.\d+)?px)$/);
    if (pxMatch) {
      mode = 'rem';
      matchStart = pos - pxMatch[1].length;
      matchEnd = pos;
      showRem(pxMatch[1]);
      return;
    }

    const varMatch = text.match(/(--[\w-]*)$/);
    if (varMatch) {
      mode = 'vars';
      matchStart = pos - varMatch[1].length;
      matchEnd = pos;
      showVars(varMatch[1]);
      return;
    }

    if (mode) close();
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (!dropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        accept();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  textarea.addEventListener('input', onInput);
  textarea.addEventListener('keydown', onKeydown);
  textarea.addEventListener('blur', () => setTimeout(close, 150));

  const destroy = () => {
    textarea.removeEventListener('input', onInput);
    textarea.removeEventListener('keydown', onKeydown);
    close();
  };

  return { destroy };
};
