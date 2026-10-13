import type { AdjustProperty, ScaleRef } from './adjust.ts';

// The project's own scale for T snapping: its utility classes (`px-4`, `text-lg`, `leading-snug`,
// `rounded-xl`, `gap-5`) read from same-origin stylesheets, else `:root` custom properties with
// length values named like a scale (`--space-4`, `--text-lg`, `--radius-md`).

export type ScaleFamily = 'spacing' | 'font-size' | 'line-height' | 'border-radius';
export type ScaleEntry = { value: number; ref: ScaleRef };
/** Entries per family, ascending by value; line-height values are unitless ratios */
export type Scale = Record<ScaleFamily, ScaleEntry[]>;
export type ScaleSource = 'classes' | 'variables' | null;

/** Pointer travel per scale step while snapping */
export const STEP_TRAVEL = 12;

export const familyOf = (prop: AdjustProperty): ScaleFamily =>
  prop === 'padding' || prop === 'margin' || prop === 'gap' ? 'spacing' : prop;

const UTILITY = /^(gap-x|gap-y|gap|px|py|pt|pr|pb|pl|p|mx|my|mt|mr|mb|ml|m|text|leading|rounded)(?:-(.+))?$/;

/** The longhand a utility's value is read from on a probe element */
const READ_AS: Record<string, string> = {
  p: 'padding-left', px: 'padding-left', py: 'padding-top',
  pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left',
  m: 'margin-left', mx: 'margin-left', my: 'margin-top',
  mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left',
  gap: 'column-gap', 'gap-x': 'column-gap', 'gap-y': 'row-gap',
  text: 'font-size', leading: 'line-height', rounded: 'border-top-left-radius',
};

/** Properties a family's rule must declare: `text-red-500` sets a color, not a size */
const DECLARES: Record<ScaleFamily, RegExp> = {
  spacing: /^(padding|margin|gap|row-gap|column-gap)/,
  'font-size': /^font-size$/,
  'line-height': /^line-height$/,
  'border-radius': /radius$/,
};

/** Suffixes naming sides or corners (`rounded-t-lg`): those classes set part of a radius, not a step */
const RADIUS_SIDE = /^(t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee)(-|$)/;

export type UtilityClass = { family: ScaleFamily; suffix: string; readAs: string };

/** A class that sets one step of a scale, given the properties its rule declares */
export const parseUtility = (className: string, declared: string[]): UtilityClass | null => {
  const match = className.match(UTILITY);
  if (!match) return null;
  const [, prefix, suffix = ''] = match;
  // Arbitrary values (`p-[13px]`) and fractions aren't steps
  if (/[[\]/]/.test(suffix)) return null;
  if (prefix === 'rounded' && RADIUS_SIDE.test(suffix)) return null;
  const family: ScaleFamily = prefix === 'text' ? 'font-size'
    : prefix === 'leading' ? 'line-height'
    : prefix === 'rounded' ? 'border-radius'
    : 'spacing';
  if (!declared.some(name => DECLARES[family].test(name))) return null;
  return { family, suffix, readAs: READ_AS[prefix] };
};

/** A custom property's family by its name, if it reads like a scale step */
export const variableFamily = (name: string): ScaleFamily | null => {
  const n = name.replace(/^--/, '');
  if (/radius|rounded/.test(n)) return 'border-radius';
  if (/leading|line-height/.test(n)) return 'line-height';
  if (/colou?r|shadow|weight|family|decoration|transform|align|wrap/.test(n)) return null;
  if (/^(text|font-size|fs)(-|$)/.test(n)) return 'font-size';
  if (/space|spacing|gap|gutter/.test(n)) return 'spacing';
  return null;
};

export const emptyScale = (): Scale => ({ spacing: [], 'font-size': [], 'line-height': [], 'border-radius': [] });

/** One entry per value per family, ascending; the first name seen for a value wins */
export const buildScale = (samples: { family: ScaleFamily; value: number; ref: ScaleRef }[]): Scale => {
  const scale = emptyScale();
  for (const { family, value, ref } of samples) {
    if (!Number.isFinite(value) || value < 0) continue;
    const rounded = +value.toFixed(3);
    if (scale[family].some(e => Math.abs(e.value - rounded) < 0.001)) continue;
    scale[family].push({ value: rounded, ref });
  }
  for (const entries of Object.values(scale)) entries.sort((a, b) => a.value - b.value);
  return scale;
};

/** A property's steps; margin continues into the negatives of the spacing scale */
const stepsFor = (scale: Scale, prop: AdjustProperty): ScaleEntry[] => {
  const entries = scale[familyOf(prop)];
  if (prop !== 'margin') return entries;
  const negatives = entries.filter(e => e.value > 0).map(e => ({ value: -e.value, ref: e.ref })).reverse();
  return [...negatives, ...entries];
};

export const hasSteps = (scale: Scale, prop: AdjustProperty): boolean => scale[familyOf(prop)].length > 0;

/**
 * `steps` along the scale from `from`. An off-scale start goes to the next value in that direction;
 * past the ends, and at 0 steps, the value stays put (no class: it hasn't snapped).
 */
export const stepOnScale = (scale: Scale, prop: AdjustProperty, from: number, steps: number): { value: number; ref?: ScaleRef } => {
  if (!steps) return { value: from };
  const entries = stepsFor(scale, prop);
  const ahead = steps > 0
    ? entries.filter(e => e.value > from + 1e-6)
    : entries.filter(e => e.value < from - 1e-6).reverse();
  if (!ahead.length) return { value: from };
  const entry = ahead[Math.min(Math.abs(steps), ahead.length) - 1];
  return { value: entry.value, ref: entry.ref };
};

// ── Reading the page ──

/** Style rules of every readable sheet, through @layer / @media / @supports; cross-origin sheets throw and are skipped */
const styleRules = (): CSSStyleRule[] => {
  const collect = (rules: CSSRuleList): CSSStyleRule[] => Array.from(rules).flatMap(rule =>
    rule instanceof CSSStyleRule ? [rule]
      : 'cssRules' in rule ? collect((rule as CSSGroupingRule).cssRules)
      : []);
  return [...Array.from(document.styleSheets), ...document.adoptedStyleSheets].flatMap(sheet => {
    try {
      return collect(sheet.cssRules);
    } catch {
      return [];
    }
  });
};

/** `.px-4`, `.px-2\.5`: a rule for exactly one class */
const SINGLE_CLASS = /^\.((?:\\.|[\w-])+)$/;
/** Lengths and plain numbers, as scale variables hold them */
const LENGTH = /^(calc\(.*\)|-?[\d.]+(px|rem|em)?)$/;

/** px from a computed length; line-height as a ratio of the probe's font size */
const readProbe = (probe: HTMLElement, property: string): number => {
  const cs = getComputedStyle(probe);
  if (property === 'line-height') return cs.lineHeight === 'normal' ? NaN : parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
  return parseFloat(cs.getPropertyValue(property));
};

/** The page's scale. Probes values with a hidden element, so `calc(var(--spacing) * 4)` resolves too */
export const harvestScale = (): { scale: Scale; source: ScaleSource } => {
  const rules = styleRules();
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  try {
    const classes = rules.flatMap(rule => {
      const name = rule.selectorText.match(SINGLE_CLASS)?.[1]?.replace(/\\(.)/g, '$1');
      const utility = name ? parseUtility(name, Array.from(rule.style)) : null;
      if (!name || !utility) return [];
      probe.className = name;
      return [{ family: utility.family, value: readProbe(probe, utility.readAs), ref: { suffix: utility.suffix } }];
    });
    probe.className = '';
    // Tailwind's `-0` steps exist even when the project uses none
    if (classes.length) return { scale: buildScale([{ family: 'spacing', value: 0, ref: { suffix: '0' } }, ...classes]), source: 'classes' };

    const variables = rules.filter(rule => /^(:root|html)$/.test(rule.selectorText)).flatMap(rule =>
      Array.from(rule.style).flatMap(name => {
        const family = name.startsWith('--') ? variableFamily(name) : null;
        if (!family || !LENGTH.test(rule.style.getPropertyValue(name).trim())) return [];
        const property = family === 'spacing' ? 'padding-left' : family === 'border-radius' ? 'border-top-left-radius' : family;
        probe.style.setProperty(property, `var(${name})`);
        const value = readProbe(probe, property);
        probe.style.removeProperty(property);
        return [{ family, value, ref: { token: `var(${name})` } }];
      }));
    return variables.length ? { scale: buildScale(variables), source: 'variables' } : { scale: emptyScale(), source: null };
  } finally {
    probe.remove();
  }
};
