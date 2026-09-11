import type { AccentId } from '../types.ts';

export const ACCENTS: Record<AccentId, string> = {
  red: 'oklch(0.649 0.237 26.973)',
  orange: 'oklch(0.6927 0.2513 38.8022)',
  yellow: 'oklch(0.815 0.167 88.756)',
  green: 'oklch(0.748 0.175 153.527)',
  teal: 'oklch(0.771 0.132 205.437)',
  blue: 'oklch(0.632 0.202 254.088)',
  violet: 'oklch(0.56 0.244 275.119)',
};

export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];

export const DEFAULT_ACCENT: AccentId = 'orange';

export const isAccentId = (v: unknown): v is AccentId =>
  typeof v === 'string' && v in ACCENTS;

/** The default accent lives in the stylesheet; anything else overrides it on the host. */
export const applyAccent = (host: HTMLElement, accent: AccentId): void => {
  if (accent === DEFAULT_ACCENT) {
    host.style.removeProperty('--color-accent');
  } else {
    host.style.setProperty('--color-accent', ACCENTS[accent]);
  }
};
