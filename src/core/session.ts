import type { Annotation } from '../types.ts';

const getKey = (): string =>
  `ui-annotator:${location.origin}${location.pathname}`;

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
