const TRACKED_PROPERTIES = [
  'font-size',
  'font-weight',
  'font-family',
  'line-height',
  'color',
  'background-color',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-radius',
  'width',
  'height',
  'display',
  'position',
  'gap',
] as const;

export const remFromPx = (px: number): string => `${Math.round(px / 16 * 1000) / 1000}rem`;

export const pxToRem = (value: string): string | null => {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? remFromPx(parseFloat(match[1])) : null;
};

export const getComputedStyles = (el: Element): Record<string, string> => {
  const computed = window.getComputedStyle(el);
  const result: Record<string, string> = {};

  for (const prop of TRACKED_PROPERTIES) {
    const value = computed.getPropertyValue(prop);
    if (!value) continue;

    const rem = pxToRem(value);
    result[prop] = rem ? `${value} (${rem})` : value;
  }

  return result;
};
