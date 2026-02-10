import { pxToRem } from './styles.ts';

export type BoxModelRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type BoxModelData = {
  content: BoxModelRect;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  contentRect: BoxModelRect;
  paddingRect: BoxModelRect;
  borderRect: BoxModelRect;
  marginRect: BoxModelRect;
};

export type DistanceMeasurement = {
  direction: 'top' | 'right' | 'bottom' | 'left';
  px: number;
  label: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  labelPos: { x: number; y: number };
};

export type TextInfo = {
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  fontFamily: string;
};

const parsePx = (value: string): number => parseFloat(value) || 0;

export const computeBoxModel = (el: Element): BoxModelData => {
  const cs = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  const padding = {
    top: parsePx(cs.paddingTop),
    right: parsePx(cs.paddingRight),
    bottom: parsePx(cs.paddingBottom),
    left: parsePx(cs.paddingLeft),
  };

  const margin = {
    top: parsePx(cs.marginTop),
    right: parsePx(cs.marginRight),
    bottom: parsePx(cs.marginBottom),
    left: parsePx(cs.marginLeft),
  };

  const border = {
    top: parsePx(cs.borderTopWidth),
    right: parsePx(cs.borderRightWidth),
    bottom: parsePx(cs.borderBottomWidth),
    left: parsePx(cs.borderLeftWidth),
  };

  // Border box = getBoundingClientRect
  const borderRect: BoxModelRect = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };

  // Padding box = border box inset by border widths
  const paddingRect: BoxModelRect = {
    top: rect.top + border.top,
    left: rect.left + border.left,
    right: rect.right - border.right,
    bottom: rect.bottom - border.bottom,
    width: rect.width - border.left - border.right,
    height: rect.height - border.top - border.bottom,
  };

  // Content box = padding box inset by padding
  const contentRect: BoxModelRect = {
    top: paddingRect.top + padding.top,
    left: paddingRect.left + padding.left,
    right: paddingRect.right - padding.right,
    bottom: paddingRect.bottom - padding.bottom,
    width: paddingRect.width - padding.left - padding.right,
    height: paddingRect.height - padding.top - padding.bottom,
  };

  // Margin box = border box expanded by margins
  const marginRect: BoxModelRect = {
    top: rect.top - margin.top,
    left: rect.left - margin.left,
    right: rect.right + margin.right,
    bottom: rect.bottom + margin.bottom,
    width: rect.width + margin.left + margin.right,
    height: rect.height + margin.top + margin.bottom,
  };

  return {
    content: contentRect,
    padding,
    margin,
    border,
    contentRect,
    paddingRect,
    borderRect,
    marginRect,
  };
};

const formatLabel = (px: number): string => {
  const rem = pxToRem(`${px}px`);
  return rem ? `${Math.round(px)} (${rem})` : `${Math.round(px)}`;
};

const rangesOverlap = (
  aMin: number, aMax: number,
  bMin: number, bMax: number,
): boolean => aMin < bMax && bMin < aMax;

export const computeDistances = (el: Element): DistanceMeasurement[] => {
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);

  const margin = {
    top: parsePx(cs.marginTop),
    right: parsePx(cs.marginRight),
    bottom: parsePx(cs.marginBottom),
    left: parsePx(cs.marginLeft),
  };

  // Element's margin box
  const mBox = {
    top: rect.top - margin.top,
    left: rect.left - margin.left,
    right: rect.right + margin.right,
    bottom: rect.bottom + margin.bottom,
  };

  // Parent's content box
  const parent = el.parentElement;
  if (!parent) return [];

  const pRect = parent.getBoundingClientRect();
  const pCs = window.getComputedStyle(parent);
  const pPadding = {
    top: parsePx(pCs.paddingTop),
    right: parsePx(pCs.paddingRight),
    bottom: parsePx(pCs.paddingBottom),
    left: parsePx(pCs.paddingLeft),
  };
  const pBorder = {
    top: parsePx(pCs.borderTopWidth),
    right: parsePx(pCs.borderRightWidth),
    bottom: parsePx(pCs.borderBottomWidth),
    left: parsePx(pCs.borderLeftWidth),
  };

  const pContent = {
    top: pRect.top + pBorder.top + pPadding.top,
    left: pRect.left + pBorder.left + pPadding.left,
    right: pRect.right - pBorder.right - pPadding.right,
    bottom: pRect.bottom - pBorder.bottom - pPadding.bottom,
  };

  // Collect sibling margin boxes
  const siblings: { top: number; left: number; right: number; bottom: number }[] = [];
  for (const sibling of parent.children) {
    if (sibling === el) continue;
    const sRect = sibling.getBoundingClientRect();
    const sCs = window.getComputedStyle(sibling);
    const sM = {
      top: parsePx(sCs.marginTop),
      right: parsePx(sCs.marginRight),
      bottom: parsePx(sCs.marginBottom),
      left: parsePx(sCs.marginLeft),
    };
    siblings.push({
      top: sRect.top - sM.top,
      left: sRect.left - sM.left,
      right: sRect.right + sM.right,
      bottom: sRect.bottom + sM.bottom,
    });
  }

  const measurements: DistanceMeasurement[] = [];
  const centerX = (mBox.left + mBox.right) / 2;
  const centerY = (mBox.top + mBox.bottom) / 2;

  // Top distance
  let topEdge = pContent.top;
  for (const s of siblings) {
    if (!rangesOverlap(mBox.left, mBox.right, s.left, s.right)) continue;
    if (s.bottom <= mBox.top && s.bottom > topEdge) topEdge = s.bottom;
  }
  const topDist = mBox.top - topEdge;
  if (topDist > 0) {
    measurements.push({
      direction: 'top',
      px: topDist,
      label: formatLabel(topDist),
      from: { x: centerX, y: topEdge },
      to: { x: centerX, y: mBox.top },
      labelPos: { x: centerX, y: (topEdge + mBox.top) / 2 },
    });
  }

  // Bottom distance
  let bottomEdge = pContent.bottom;
  for (const s of siblings) {
    if (!rangesOverlap(mBox.left, mBox.right, s.left, s.right)) continue;
    if (s.top >= mBox.bottom && s.top < bottomEdge) bottomEdge = s.top;
  }
  const bottomDist = bottomEdge - mBox.bottom;
  if (bottomDist > 0) {
    measurements.push({
      direction: 'bottom',
      px: bottomDist,
      label: formatLabel(bottomDist),
      from: { x: centerX, y: mBox.bottom },
      to: { x: centerX, y: bottomEdge },
      labelPos: { x: centerX, y: (mBox.bottom + bottomEdge) / 2 },
    });
  }

  // Left distance
  let leftEdge = pContent.left;
  for (const s of siblings) {
    if (!rangesOverlap(mBox.top, mBox.bottom, s.top, s.bottom)) continue;
    if (s.right <= mBox.left && s.right > leftEdge) leftEdge = s.right;
  }
  const leftDist = mBox.left - leftEdge;
  if (leftDist > 0) {
    measurements.push({
      direction: 'left',
      px: leftDist,
      label: formatLabel(leftDist),
      from: { x: leftEdge, y: centerY },
      to: { x: mBox.left, y: centerY },
      labelPos: { x: (leftEdge + mBox.left) / 2, y: centerY },
    });
  }

  // Right distance
  let rightEdge = pContent.right;
  for (const s of siblings) {
    if (!rangesOverlap(mBox.top, mBox.bottom, s.top, s.bottom)) continue;
    if (s.left >= mBox.right && s.left < rightEdge) rightEdge = s.left;
  }
  const rightDist = rightEdge - mBox.right;
  if (rightDist > 0) {
    measurements.push({
      direction: 'right',
      px: rightDist,
      label: formatLabel(rightDist),
      from: { x: mBox.right, y: centerY },
      to: { x: rightEdge, y: centerY },
      labelPos: { x: (mBox.right + rightEdge) / 2, y: centerY },
    });
  }

  return measurements;
};

export const computeTextInfo = (el: Element): TextInfo | null => {
  // Only return text info for elements with no child elements (text-only)
  if (el.children.length > 0) return null;
  const text = el.textContent?.trim();
  if (!text) return null;

  const cs = window.getComputedStyle(el);
  const fontSize = cs.fontSize;
  const lineHeight = cs.lineHeight;
  const fontWeight = cs.fontWeight;
  const fontFamily = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '');

  const fsRem = pxToRem(fontSize);
  const lhRem = pxToRem(lineHeight);

  return {
    fontSize: fsRem ? `${fontSize} (${fsRem})` : fontSize,
    lineHeight: lhRem ? `${lineHeight} (${lhRem})` : lineHeight,
    fontWeight,
    fontFamily,
  };
};
