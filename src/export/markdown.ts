import type { Annotation, StyleEdit } from '../types.ts';
import { describeEdit } from '../core/adjust.ts';

/** `- \`padding-right: 24px → 32px\` (2rem, \`pr-8\`)`: the change in code, then its rem and class or token */
export const formatChanges = (edits: StyleEdit[]): string[] => edits.map(edit => {
  const { property, from, to, rem, snap } = describeEdit(edit);
  const notes = [...(rem ? [rem] : []), ...(snap ? [`\`${snap}\``] : [])];
  return `- \`${property}: ${from} → ${to}\`${notes.length ? ` (${notes.join(', ')})` : ''}`;
});

const formatHeading = (a: Annotation): string => {
  const el = a.element ?? 'element';
  const classes = a.classes?.length ? '.' + a.classes.join('.') : '';
  return `${el}${classes}`;
};

export const toMarkdown = (annotations: Annotation[]): string => {
  const url = annotations[0]?.url ?? location.href;
  const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();

  const lines: string[] = [
    `# Page Feedback: ${pathname}`,
    `**URL:** ${url}`,
    `**Viewport:** ${window.innerWidth}×${window.innerHeight}`,
    `**Exported:** ${new Date().toISOString()}`,
    '',
  ];

  annotations.forEach((a, i) => {
    lines.push('---');
    lines.push('');
    lines.push(`### ${i + 1}. ${formatHeading(a)}`);
    lines.push('');
    lines.push(`**Selector:** \`${a.selector}\``);
    lines.push(`**Path:** ${a.path}`);

    if (a.classes?.length) {
      lines.push(`**Classes:** ${a.classes.map(c => '\`.' + c + '\`').join(', ')}`);
    }

    lines.push(`**Bounding box:** x:${Math.round(a.rect.x)}, y:${Math.round(a.rect.y)}, ${Math.round(a.rect.w)}×${Math.round(a.rect.h)}px`);

    if (a.nearbyText) {
      lines.push(`**Nearby text:** "${a.nearbyText}"`);
    }

    lines.push('');

    const styleEntries = Object.entries(a.styles);
    if (styleEntries.length) {
      lines.push('**Computed CSS:**');
      lines.push('```css');
      for (const [prop, value] of styleEntries) {
        lines.push(`${prop}: ${value};`);
      }
      lines.push('```');
      lines.push('');
    }

    const ariaEntries = Object.entries(a.ariaAttributes ?? {});
    if (ariaEntries.length) {
      lines.push(`**Accessibility:** ${ariaEntries.map(([k, v]) => `${k}="${v}"`).join(', ')}`);
    }

    const dataEntries = Object.entries(a.dataAttributes ?? {});
    if (dataEntries.length) {
      lines.push(`**Data attributes:** ${dataEntries.map(([k, v]) => `${k}="${v}"`).join(', ')}`);
    }

    if (ariaEntries.length || dataEntries.length) {
      lines.push('');
    }

    if (a.comment) {
      lines.push(`**Annotation:** ${a.comment}`);
      lines.push('');
    }

    if (a.edits?.length) {
      lines.push('**Changes:**', ...formatChanges(a.edits), '');
    }
  });

  return lines.join('\n');
};
