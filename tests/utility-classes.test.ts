import { describe, expect, test } from 'bun:test';
import { isUtilityClass } from '../src/core/utility-classes.ts';

const UTILITIES = [
  // Tailwind
  'p-6', 'px-4', 'md:px-4', 'text-sm', '-mt-2', 'w-1/2', 'bg-[#fff]', 'hover:bg-blue-500', '!p-0', 'flex', 'hidden',
  'items-center', 'rounded-lg', 'rounded', 'shadow', 'sr-only', 'not-sr-only', 'truncate', 'gap-x-2', 'space-y-4', 'space-x-4',
  'font-medium', 'leading-snug', 'max-w-md', 'inline-flex', 'z-10', 'translate-x-1', 'transition', 'border', 'border-b',
  'group', 'peer', 'prose', 'tabular-nums', 'drop-shadow-md', 'underline-offset-4', 'table-auto', 'table-fixed',
  'start-0', 'end-0', 'grayscale', 'invert', 'sepia', 'blur-sm', 'backdrop-blur-md', 'divide-y', 'divide-x-2',
  'ring-offset-2', 'line-clamp-3', 'columns-3', 'decoration-2', 'decoration-blue-500', 'text-gray-500', 'bg-white',
  // Bootstrap
  'd-flex', 'd-none', 'd-md-block', 'fw-bold', 'fs-4', 'lh-sm', 'text-muted', 'text-primary', 'bg-light', 'mt-3', 'mb-0',
  'ms-auto', 'me-2', 'mx-auto', 'py-5', 'ps-0', 'gap-3', 'rounded-3', 'rounded-pill', 'shadow-sm', 'w-25', 'w-100', 'h-100',
  'align-items-center', 'justify-content-between', 'flex-column', 'flex-wrap', 'order-1', 'order-last', 'position-relative',
];

const COMPONENTS = [
  'card', 'btn', 'btn-primary', 'nav-link', 'hero', 'eyebrow', 'page', 'row', 'rows', 'title', 'link', 'avatar',
  // Start like a utility prefix but don't end in a value
  'flexible', 'bordered', 'shadowed', 'list-group-item', 'content-wrapper', 'top-bar', 'order-summary', 'p-card',
  'text-input', 'grid-item', 'flex-container', 'bg-hero', 'shadow-card',
];

describe('utility classes', () => {
  test('Tailwind and Bootstrap utilities', () => {
    for (const name of UTILITIES) expect([name, isUtilityClass(name)]).toEqual([name, true]);
  });

  test('component names stay components, including ones that start like a utility prefix', () => {
    for (const name of COMPONENTS) expect([name, isUtilityClass(name)]).toEqual([name, false]);
  });
});
