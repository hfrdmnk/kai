import type { AccentId, Theme } from '../types.ts';
import { ACCENTS, ACCENT_IDS } from '../core/accents.ts';

const THEMES: Theme[] = ['system', 'light', 'dark'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type SettingsOptions = {
  version: string;
  theme: Theme;
  accent: AccentId;
  onThemeChange: (theme: Theme) => void;
  onAccentChange: (accent: AccentId) => void;
};

const makeRadioGroup = (label: string, className: string): HTMLElement => {
  const group = document.createElement('div');
  group.className = className;
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', label);
  return group;
};

const checkOne = <T extends string>(buttons: Map<T, HTMLButtonElement>, selected: T) => {
  for (const [id, btn] of buttons) {
    const on = id === selected;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  }
};

/** Arrow keys move the selection inside a radiogroup, matching native radio behaviour. */
const bindArrowKeys = <T extends string>(
  ids: T[],
  buttons: Map<T, HTMLButtonElement>,
  select: (id: T) => void,
) => {
  for (const [id, btn] of buttons) {
    btn.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = ids[(ids.indexOf(id) + dir + ids.length) % ids.length];
      select(next);
      buttons.get(next)!.focus();
    });
  }
};

export const createSettingsPanel = (opts: SettingsOptions) => {
  const panel = document.createElement('div');
  panel.className = 'kai-settings';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Settings');

  const header = document.createElement('div');
  header.className = 'kai-settings-header';

  const name = document.createElement('span');
  name.className = 'kai-settings-name';
  name.textContent = 'kai';

  const version = document.createElement('span');
  version.className = 'kai-settings-version';
  version.textContent = `v${opts.version}`;

  header.appendChild(name);
  header.appendChild(version);

  const themes = makeRadioGroup('Theme', 'kai-settings-themes');
  const themeBtns = new Map<Theme, HTMLButtonElement>();
  for (const t of THEMES) {
    const btn = document.createElement('button');
    btn.className = 'kai-settings-theme';
    btn.setAttribute('role', 'radio');
    btn.textContent = capitalize(t);
    btn.addEventListener('click', () => setTheme(t, true));
    themeBtns.set(t, btn);
    themes.appendChild(btn);
  }

  const accents = makeRadioGroup('Accent color', 'kai-settings-accents');
  const accentBtns = new Map<AccentId, HTMLButtonElement>();
  for (const id of ACCENT_IDS) {
    const btn = document.createElement('button');
    btn.className = 'kai-settings-accent';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', capitalize(id));
    btn.style.setProperty('--swatch', ACCENTS[id]);
    btn.addEventListener('click', () => setAccent(id, true));
    accentBtns.set(id, btn);
    accents.appendChild(btn);
  }

  const setTheme = (theme: Theme, emit = false) => {
    checkOne(themeBtns, theme);
    if (emit) opts.onThemeChange(theme);
  };

  const setAccent = (accent: AccentId, emit = false) => {
    checkOne(accentBtns, accent);
    if (emit) opts.onAccentChange(accent);
  };

  bindArrowKeys(THEMES, themeBtns, (t) => setTheme(t, true));
  bindArrowKeys(ACCENT_IDS, accentBtns, (a) => setAccent(a, true));

  setTheme(opts.theme);
  setAccent(opts.accent);

  panel.appendChild(header);
  panel.appendChild(themes);
  panel.appendChild(accents);

  return { el: panel, setTheme, setAccent };
};
