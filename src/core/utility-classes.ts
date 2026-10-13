// Tailwind-shaped utility class names, to tell them from component classes (`card`, `btn-primary`).
// A readable list, not an exhaustive one: names it doesn't know count as component classes.

/** Utilities that stand alone */
const KEYWORDS = new Set([
  'flex', 'grid', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid', 'hidden', 'contents', 'table', 'flow-root',
  'absolute', 'relative', 'fixed', 'sticky', 'static', 'visible', 'invisible', 'collapse', 'isolate',
  'container', 'truncate', 'sr-only', 'not-sr-only', 'underline', 'overline', 'line-through', 'no-underline',
  'italic', 'not-italic', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'antialiased', 'subpixel-antialiased',
  'grow', 'shrink', 'rounded', 'border', 'shadow', 'ring', 'outline', 'transition', 'transform', 'filter', 'blur',
]);

/** Utility prefixes, followed by `-` and a value: `p-4`, `text-sm`, `space-x-2`, `min-w-0` */
const PREFIXES = [
  // Spacing and sizing
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me',
  'space-x', 'space-y', 'gap', 'gap-x', 'gap-y', 'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'size',
  'inset', 'inset-x', 'inset-y', 'top', 'right', 'bottom', 'left',
  // Type
  'text', 'font', 'leading', 'tracking', 'whitespace', 'break', 'line-clamp', 'decoration', 'list', 'indent', 'align',
  // Colour, borders, effects
  'bg', 'from', 'via', 'to', 'fill', 'stroke', 'border', 'divide', 'rounded', 'ring', 'outline', 'shadow', 'opacity',
  'blur', 'backdrop', 'mix-blend',
  // Layout
  'flex', 'grid', 'items', 'justify', 'content', 'self', 'place', 'order', 'col', 'row', 'basis', 'grow', 'shrink',
  'overflow', 'z', 'object', 'aspect', 'columns', 'float', 'clear', 'box', 'display',
  // Motion and transforms
  'transition', 'duration', 'ease', 'delay', 'animate', 'transform', 'translate', 'translate-x', 'translate-y',
  'scale', 'rotate', 'skew', 'origin',
  // Interaction
  'cursor', 'select', 'pointer-events', 'resize', 'scroll', 'snap', 'touch', 'appearance', 'will-change',
];

/**
 * Whether a class name looks like a Tailwind utility: a variant (`md:px-4`), an arbitrary value
 * (`bg-[#fff]`), an important prefix (`!p-0`), a fraction (`w-1/2`), or a known keyword or prefix
 * followed by `-` (a leading `-` for negatives ignored). `btn-primary` and `flexible` stay components.
 */
export const isUtilityClass = (name: string): boolean => {
  if (/[:[\]/]/.test(name) || name.startsWith('!')) return true;
  const base = name.replace(/^-/, '');
  return KEYWORDS.has(base) || PREFIXES.some(prefix => base.startsWith(`${prefix}-`));
};
