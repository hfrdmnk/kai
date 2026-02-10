import { pxToRem } from './styles.ts';

export type CrosshairData = {
  cx: number;
  cy: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type TextInspectData = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  color: string;
  letterSpacing: string;
};

/**
 * Ray-cast from (cx, cy) in 4 directions using binary search with
 * elementFromPoint to find the nearest visual boundaries.
 */
export const computeCrosshair = (
  cx: number,
  cy: number,
  shadowHost: Element,
): CrosshairData => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const probe = (x: number, y: number): boolean => {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    if (el === shadowHost) return true;
    // Check if it's the same element as at cursor
    const cursorEl = document.elementFromPoint(cx, cy);
    return el === cursorEl || el === shadowHost;
  };

  // Binary search for boundary in a direction
  // Returns the distance from cursor to boundary edge
  const searchBoundary = (
    axis: 'x' | 'y',
    direction: 1 | -1,
  ): number => {
    const max = axis === 'x'
      ? (direction === 1 ? vw - cx : cx)
      : (direction === 1 ? vh - cy : cy);

    if (max <= 0) return 0;

    // Find the first point where we hit a different element
    // Start with exponential search to find upper bound
    let lo = 0;
    let hi = max;
    let step = 1;

    while (step < max) {
      const testX = axis === 'x' ? cx + direction * step : cx;
      const testY = axis === 'y' ? cy + direction * step : cy;

      if (testX < 0 || testX >= vw || testY < 0 || testY >= vh) {
        hi = step;
        break;
      }

      if (!probe(testX, testY)) {
        hi = step;
        lo = step / 2;
        break;
      }
      step *= 2;
    }

    if (hi === max && probe(
      axis === 'x' ? cx + direction * (max - 1) : cx,
      axis === 'y' ? cy + direction * (max - 1) : cy,
    )) {
      // Same element all the way to edge
      return max;
    }

    // Binary search between lo and hi
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      const testX = axis === 'x' ? cx + direction * mid : cx;
      const testY = axis === 'y' ? cy + direction * mid : cy;

      if (probe(testX, testY)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return lo;
  };

  const distRight = searchBoundary('x', 1);
  const distLeft = searchBoundary('x', -1);
  const distDown = searchBoundary('y', 1);
  const distUp = searchBoundary('y', -1);

  return {
    cx,
    cy,
    left: cx - distLeft,
    right: cx + distRight,
    top: cy - distUp,
    bottom: cy + distDown,
    width: distLeft + distRight,
    height: distUp + distDown,
  };
};

const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

export const computeTextInspectData = (el: Element): TextInspectData | null => {
  if (el.children.length > 0) return null;
  const text = el.textContent?.trim();
  if (!text) return null;

  const cs = window.getComputedStyle(el);

  const fontSize = cs.fontSize;
  const fsRem = pxToRem(fontSize);

  const lineHeight = cs.lineHeight;
  const lhRem = pxToRem(lineHeight);

  const letterSpacing = cs.letterSpacing;
  const lsRem = letterSpacing !== 'normal' ? pxToRem(letterSpacing) : null;

  return {
    fontFamily: cs.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
    fontSize: fsRem ? `${fontSize} (${fsRem})` : fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: lhRem ? `${lineHeight} (${lhRem})` : lineHeight,
    color: rgbToHex(cs.color),
    letterSpacing: lsRem ? `${letterSpacing} (${lsRem})` : (letterSpacing === 'normal' ? 'normal' : letterSpacing),
  };
};

export const findLargestEnclosedElement = (
  selectionRect: DOMRect,
  shadowHost: Element,
): Element | null => {
  const candidates = new Set<Element>();
  const step = 20;

  // Sample grid points inside selection rect
  for (let x = selectionRect.left + step / 2; x < selectionRect.right; x += step) {
    for (let y = selectionRect.top + step / 2; y < selectionRect.bottom; y += step) {
      const el = document.elementFromPoint(x, y);
      if (!el || el === shadowHost || el === document.documentElement || el === document.body) continue;

      // Add element and its ancestors
      let current: Element | null = el;
      while (current && current !== document.documentElement && current !== document.body) {
        candidates.add(current);
        current = current.parentElement;
      }
    }
  }

  let largest: Element | null = null;
  let largestArea = 0;

  for (const el of candidates) {
    if (el === shadowHost) continue;
    const rect = el.getBoundingClientRect();

    // Check if fully enclosed by selection
    if (
      rect.left >= selectionRect.left &&
      rect.top >= selectionRect.top &&
      rect.right <= selectionRect.right &&
      rect.bottom <= selectionRect.bottom
    ) {
      const area = rect.width * rect.height;
      if (area > largestArea) {
        largestArea = area;
        largest = el;
      }
    }
  }

  return largest;
};
