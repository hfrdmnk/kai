import type { Annotation, FabCorner, Theme } from '../types.ts';

const getKey = (): string =>
  `ui-annotator:${location.origin}${location.pathname}`;

const FAB_CORNER_KEY = 'ui-annotator:fab-corner';
const THEME_KEY = 'ui-annotator:theme';

export const loadSession = (): Annotation[] => {
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return [];
    return JSON.parse(raw) as Annotation[];
  } catch {
    return [];
  }
};

export const saveSession = (annotations: Annotation[]): void => {
  try {
    localStorage.setItem(getKey(), JSON.stringify(annotations));
  } catch {
    // storage full or unavailable
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(getKey());
  } catch {
    // unavailable
  }
};

export const loadFabCorner = (): FabCorner => {
  try {
    const raw = localStorage.getItem(FAB_CORNER_KEY);
    if (raw === 'top-left' || raw === 'top-right' || raw === 'bottom-left' || raw === 'bottom-right') {
      return raw;
    }
    return 'bottom-left';
  } catch {
    return 'bottom-left';
  }
};

export const saveFabCorner = (corner: FabCorner): void => {
  try {
    localStorage.setItem(FAB_CORNER_KEY, corner);
  } catch {
    // unavailable
  }
};

export const loadTheme = (): Theme => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
    return 'dark';
  } catch {
    return 'dark';
  }
};

export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // unavailable
  }
};
