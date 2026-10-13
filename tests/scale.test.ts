import { describe, expect, test } from 'bun:test';
import { buildScale, classScale, familyOf, isRootSelector, unitlessLeading, parseUtility, stepOnScale, variableFamily, STEP_TRAVEL } from '../src/core/scale.ts';

describe('utility classes', () => {
  test('spacing, type, leading and radius utilities with the property they set', () => {
    expect(parseUtility('px-4', ['padding-inline-start', 'padding-inline-end'])).toEqual({ family: 'spacing', suffix: '4', readAs: 'padding-left' });
    expect(parseUtility('gap-y-2', ['row-gap'])).toEqual({ family: 'spacing', suffix: '2', readAs: 'row-gap' });
    expect(parseUtility('mb-16', ['margin-bottom'])).toEqual({ family: 'spacing', suffix: '16', readAs: 'margin-bottom' });
    expect(parseUtility('text-lg', ['font-size', 'line-height'])).toEqual({ family: 'font-size', suffix: 'lg', readAs: 'font-size' });
    expect(parseUtility('leading-snug', ['line-height'])).toEqual({ family: 'line-height', suffix: 'snug', readAs: 'line-height' });
    expect(parseUtility('rounded-xl', ['border-top-left-radius', 'border-top-right-radius'])?.family).toBe('border-radius');
    expect(parseUtility('rounded', ['border-top-left-radius'])).toEqual({ family: 'border-radius', suffix: '', readAs: 'border-top-left-radius' });
  });

  test('look-alikes that are not scale steps', () => {
    // A color, not a size
    expect(parseUtility('text-red-500', ['color'])).toBeNull();
    expect(parseUtility('text-center', ['text-align'])).toBeNull();
    // Per-side radius and arbitrary values
    expect(parseUtility('rounded-t-lg', ['border-top-left-radius', 'border-top-right-radius'])).toBeNull();
    expect(parseUtility('p-[13px]', ['padding-top'])).toBeNull();
    expect(parseUtility('position-absolute', ['position'])).toBeNull();
    expect(parseUtility('page', ['padding-top'])).toBeNull();
  });

  test('properties map to scale families', () => {
    expect(familyOf('margin')).toBe('spacing');
    expect(familyOf('gap')).toBe('spacing');
    expect(familyOf('font-size')).toBe('font-size');
  });
});

describe('variables', () => {
  test('families by name', () => {
    expect(variableFamily('--space-4')).toBe('spacing');
    expect(variableFamily('--spacing')).toBe('spacing');
    expect(variableFamily('--gap-lg')).toBe('spacing');
    expect(variableFamily('--text-lg')).toBe('font-size');
    expect(variableFamily('--font-size-sm')).toBe('font-size');
    expect(variableFamily('--text-lg--line-height')).toBe('line-height');
    expect(variableFamily('--leading-snug')).toBe('line-height');
    expect(variableFamily('--radius-md')).toBe('border-radius');
    expect(variableFamily('--brand')).toBeNull();
    expect(variableFamily('--text-color')).toBeNull();
  });
});

const scale = buildScale([
  { family: 'spacing', value: 16, ref: { suffix: '4' } },
  { family: 'spacing', value: 4, ref: { suffix: '1' } },
  { family: 'spacing', value: 0, ref: { suffix: '0' } },
  { family: 'spacing', value: 32, ref: { suffix: '8' } },
  // Same value, second name: the first wins
  { family: 'spacing', value: 16, ref: { suffix: 'four' } },
  { family: 'font-size', value: 14, ref: { suffix: 'sm' } },
  { family: 'font-size', value: 18, ref: { suffix: 'lg' } },
  { family: 'line-height', value: 1.375, ref: { suffix: 'snug' } },
  { family: 'line-height', value: 1.5, ref: { suffix: 'normal' } },
  { family: 'border-radius', value: Number.NaN, ref: { suffix: 'broken' } },
]);

describe('scale', () => {
  test('sorted, one entry per value, unusable values dropped', () => {
    expect(scale.spacing.map(e => e.value)).toEqual([0, 4, 16, 32]);
    expect(scale.spacing[2].ref).toEqual({ suffix: '4' });
    expect(scale['border-radius']).toEqual([]);
  });

  test('12px of travel per step', () => {
    expect(STEP_TRAVEL).toBe(12);
  });

  test('steps up and down from a value on the scale', () => {
    expect(stepOnScale(scale, 'padding', 16, 1)).toEqual({ value: 32, ref: { suffix: '8' } });
    expect(stepOnScale(scale, 'padding', 16, -2)).toEqual({ value: 0, ref: { suffix: '0' } });
    expect(stepOnScale(scale, 'gap', 16, 0)).toEqual({ value: 16 });
  });

  test('an off-scale start goes to the next value in that direction', () => {
    expect(stepOnScale(scale, 'padding', 10, 1)).toEqual({ value: 16, ref: { suffix: '4' } });
    expect(stepOnScale(scale, 'padding', 10, -1)).toEqual({ value: 4, ref: { suffix: '1' } });
  });

  test('stops at the ends', () => {
    expect(stepOnScale(scale, 'padding', 16, 5)).toEqual({ value: 32, ref: { suffix: '8' } });
    expect(stepOnScale(scale, 'padding', 32, 1)).toEqual({ value: 32 });
    expect(stepOnScale(scale, 'padding', 0, -1)).toEqual({ value: 0 });
  });

  test('margin continues into negatives', () => {
    expect(stepOnScale(scale, 'margin', 0, -1)).toEqual({ value: -4, ref: { suffix: '1' } });
    expect(stepOnScale(scale, 'margin', -4, -2)).toEqual({ value: -32, ref: { suffix: '8' } });
    expect(stepOnScale(scale, 'margin', -4, 1)).toEqual({ value: 0, ref: { suffix: '0' } });
  });

  test('type and leading scales', () => {
    expect(stepOnScale(scale, 'font-size', 16, 1)).toEqual({ value: 18, ref: { suffix: 'lg' } });
    expect(stepOnScale(scale, 'line-height', 1.55, -1)).toEqual({ value: 1.5, ref: { suffix: 'normal' } });
    expect(stepOnScale(scale, 'border-radius', 4, 1)).toEqual({ value: 4 });
  });
});

describe('review fixes', () => {
  test('leading utilities count only with a unitless value', () => {
    const vars: Record<string, string> = { '--leading-snug': '1.375', '--leading-px': '28px', '--spacing': '0.25rem' };
    const lookup = (name: string) => vars[name] ?? '';
    expect(unitlessLeading('1.5', lookup)).toBe(true);
    expect(unitlessLeading('var(--leading-snug)', lookup)).toBe(true);
    expect(unitlessLeading('var(--missing, 1.25)', lookup)).toBe(true);
    expect(unitlessLeading('1.75rem', lookup)).toBe(false);
    expect(unitlessLeading('28px', lookup)).toBe(false);
    expect(unitlessLeading('var(--leading-px)', lookup)).toBe(false);
    expect(unitlessLeading('calc(var(--spacing) * 7)', lookup)).toBe(false);
    // A calc of plain numbers is a ratio too (Tailwind v4's --text-lg--line-height)
    expect(unitlessLeading('calc(1.75 / 1.125)', lookup)).toBe(true);
    expect(unitlessLeading('calc(2rem / 1.125)', lookup)).toBe(false);
  });

  test('variables come from :root-like rules, Tailwind v4 theme layers included', () => {
    expect(isRootSelector(':root')).toBe(true);
    expect(isRootSelector('html')).toBe(true);
    expect(isRootSelector(':root, :host')).toBe(true);
    expect(isRootSelector(':where(:root)')).toBe(true);
    expect(isRootSelector(':where(html)')).toBe(true);
    expect(isRootSelector(':root .card')).toBe(false);
    expect(isRootSelector('body')).toBe(false);
  });

  test('the zero spacing step is added only for projects with spacing utilities', () => {
    const text = { family: 'font-size' as const, value: 14, ref: { suffix: 'sm' } };
    const pad = { family: 'spacing' as const, value: 16, ref: { suffix: '4' } };
    expect(classScale([text]).spacing).toEqual([]);
    expect(classScale([text, pad]).spacing.map(e => e.value)).toEqual([0, 16]);
  });
});
