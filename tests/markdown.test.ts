import { describe, expect, test } from 'bun:test';
import { formatChanges, formatSiblings } from '../src/export/markdown.ts';

describe('Markdown changes', () => {
  test('one bullet per edit: the change in code, then rem and the class or token', () => {
    expect(formatChanges([
      { property: 'padding-right', from: 24, to: 32, className: 'pr-8' },
      { property: 'gap', from: 16, to: 24, token: 'var(--space-6)' },
      { property: 'margin-top', from: 0, to: -8 },
      { property: 'line-height', from: 1.5, to: 1.625, className: 'leading-relaxed' },
      { property: 'line-height', from: 1.5, to: 1.6 },
    ])).toEqual([
      '- `padding-right: 24px → 32px` (2rem, `pr-8`)',
      '- `gap: 16px → 24px` (1.5rem, `var(--space-6)`)',
      '- `margin-top: 0px → -8px` (-0.5rem)',
      '- `line-height: 1.5 → 1.625` (`leading-relaxed`)',
      '- `line-height: 1.5 → 1.6`',
    ]);
  });
});

describe('Markdown siblings', () => {
  test('a shared edit says which siblings it applies to', () => {
    expect(formatSiblings(3, 'article.card.px-2', '#cards'))
      .toBe('Applies to all 3 identical siblings (`article.card.px-2` under `#cards`)');
  });
});
