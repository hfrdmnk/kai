import { describe, expect, test } from 'bun:test';
import { isUtilityClass } from '../src/core/utility-classes.ts';

describe('utility classes', () => {
  test('Tailwind-shaped names are utilities', () => {
    for (const name of ['p-6', 'px-4', 'md:px-4', 'text-sm', '-mt-2', 'w-1/2', 'bg-[#fff]', 'hover:bg-blue-500', '!p-0',
      'flex', 'hidden', 'items-center', 'rounded-lg', 'rounded', 'shadow', 'sr-only', 'truncate', 'gap-x-2', 'space-y-4',
      'font-medium', 'leading-snug', 'max-w-md', 'inline-flex', 'z-10', 'translate-x-1', 'transition', 'border', 'border-b']) {
      expect([name, isUtilityClass(name)]).toEqual([name, true]);
    }
  });

  test('component names stay components, look-alike prefixes included', () => {
    // `flexible`, `bordered` and `shadowed` start like `flex`, `border` and `shadow` but don't continue with `-`
    for (const name of ['card', 'btn', 'btn-primary', 'nav-link', 'hero', 'eyebrow', 'page', 'row', 'rows', 'title', 'link', 'avatar', 'flexible', 'bordered', 'shadowed']) {
      expect([name, isUtilityClass(name)]).toEqual([name, false]);
    }
  });
});
