// Utility class names (Tailwind, Bootstrap), to tell them from component classes (`card`,
// `btn-primary`, `list-group-item`). A readable list, not an exhaustive one: names it doesn't
// recognise count as component classes.

/** Utilities that stand alone */
const KEYWORDS = new Set([
  'flex', 'grid', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid', 'hidden', 'contents', 'table', 'flow-root',
  'absolute', 'relative', 'fixed', 'sticky', 'static', 'visible', 'invisible', 'collapse', 'isolate',
  'container', 'truncate', 'sr-only', 'not-sr-only', 'visually-hidden', 'underline', 'overline', 'line-through', 'no-underline',
  'italic', 'not-italic', 'uppercase', 'lowercase', 'capitalize', 'normal-case', 'antialiased', 'subpixel-antialiased',
  'grow', 'shrink', 'rounded', 'border', 'shadow', 'ring', 'outline', 'transition', 'transform', 'filter', 'blur',
  'group', 'peer', 'prose', 'grayscale', 'invert', 'sepia', 'divide-x', 'divide-y',
  'tabular-nums', 'proportional-nums', 'lining-nums', 'oldstyle-nums', 'ordinal', 'slashed-zero', 'diagonal-fractions',
]);

/** Utility prefixes, followed by `-` and a value (`p-4`, `border-t-2`, `d-md-none`) */
const PREFIXES = [
  // Spacing and sizing
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me',
  'space', 'gap', 'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'size', 'vw', 'vh', 'min-vw', 'min-vh',
  'inset', 'top', 'right', 'bottom', 'left', 'start', 'end',
  // Type
  'text', 'font', 'fw', 'fs', 'lh', 'leading', 'tracking', 'whitespace', 'break', 'line-clamp', 'decoration',
  'underline-offset', 'list', 'indent', 'align',
  // Colour, borders, effects
  'bg', 'from', 'via', 'to', 'fill', 'stroke', 'border', 'divide', 'rounded', 'ring', 'outline', 'shadow', 'drop-shadow',
  'opacity', 'blur', 'backdrop', 'mix-blend',
  // Layout
  'd', 'flex', 'grid', 'items', 'justify', 'content', 'self', 'place', 'order', 'col', 'row', 'basis', 'grow', 'shrink',
  'overflow', 'z', 'object', 'aspect', 'columns', 'float', 'clear', 'box', 'table', 'position',
  // Motion and transforms
  'transition', 'duration', 'ease', 'delay', 'animate', 'translate', 'scale', 'rotate', 'skew', 'origin',
  // Interaction
  'cursor', 'select', 'pointer-events', 'resize', 'scroll', 'snap', 'touch', 'appearance', 'will-change',
];

/** Words a utility's value can be: sizes, keywords, alignments, sides, Bootstrap's theme colours */
const VALUE_WORDS = new Set([
  'px', 'auto', 'full', 'screen', 'min', 'max', 'fit', 'none', 'base', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl',
  'tight', 'tighter', 'snug', 'normal', 'relaxed', 'loose', 'wide', 'wider', 'widest',
  'thin', 'extralight', 'light', 'lighter', 'medium', 'semibold', 'bold', 'bolder', 'extrabold', 'black',
  'start', 'end', 'center', 'between', 'around', 'evenly', 'stretch', 'baseline', 'left', 'right', 'top', 'bottom',
  'middle', 'justify', 'wrap', 'nowrap', 'reverse', 'row', 'col', 'column', 'dense', 'span', 'first', 'last',
  'x', 'y', 't', 'r', 'b', 'l', 's', 'e', 'tl', 'tr', 'br', 'bl', 'ss', 'se', 'es', 'ee', 'inner', 'inset',
  'hidden', 'visible', 'scroll', 'clip', 'contain', 'cover', 'fill', 'repeat', 'fixed', 'local',
  'block', 'inline', 'flex', 'grid', 'table', 'contents', 'relative', 'absolute', 'sticky', 'static',
  'solid', 'dashed', 'dotted', 'double', 'collapse', 'separate', 'square', 'video', 'pill', 'circle',
  'sans', 'serif', 'mono', 'italic', 'words', 'keep', 'pre', 'balance', 'pretty', 'ellipsis', 'truncate', 'unstyled',
  'disc', 'decimal', 'inside', 'outside', 'pointer', 'default', 'move', 'text', 'all', 'grow', 'shrink', 'initial',
  'inherit', 'current', 'transparent', 'white', 'primary', 'secondary', 'success', 'danger', 'warning', 'info',
  'dark', 'muted', 'body', 'emphasis',
]);

/** Tailwind's palette; a shade (`-500`) follows as its own, numeric segment */
const COLOURS = /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)$/;

/** The last segment of a utility: a number (`4`, `0.5`, `500`), `2xl`, or a known word or colour */
const isValue = (segment: string) =>
  /^\d+(\.\d+)?$/.test(segment) || /^\d+xl$/.test(segment) || VALUE_WORDS.has(segment) || COLOURS.test(segment);

/**
 * Whether a class name looks like a utility: a variant (`md:px-4`), an arbitrary value (`bg-[#fff]`),
 * an important prefix (`!p-0`), a fraction (`w-1/2`), a standalone keyword (`flex`, `group`), or a
 * known prefix whose last segment is a value (`p-6`, `d-md-none`, `decoration-blue-500`), a leading
 * `-` for negatives aside. `btn-primary`, `list-group-item` and `p-card` stay components.
 */
export const isUtilityClass = (name: string): boolean => {
  if (/[:[\]/]/.test(name) || name.startsWith('!')) return true;
  const base = name.replace(/^-/, '');
  if (KEYWORDS.has(base)) return true;
  return PREFIXES.some(prefix => base.startsWith(`${prefix}-`) && isValue(base.slice(prefix.length + 1).split('-').pop()!));
};
