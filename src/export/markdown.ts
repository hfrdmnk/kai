import type { Annotation } from '../types.ts';

export const toMarkdown = (annotations: Annotation[]): string => {
  const lines: string[] = [
    '# UI Annotations',
    '',
    `**URL:** ${location.href}`,
    `**Exported:** ${new Date().toISOString()}`,
    `**Viewport:** ${window.innerWidth}×${window.innerHeight}`,
    '',
  ];

  annotations.forEach((a, i) => {
    lines.push(`## ${i + 1}. \`${a.selector}\``);
    lines.push('');
    lines.push(`**Path:** ${a.path}`);
    lines.push('');

    const styleEntries = Object.entries(a.styles);
    if (styleEntries.length) {
      lines.push('```css');
      for (const [prop, value] of styleEntries) {
        lines.push(`${prop}: ${value};`);
      }
      lines.push('```');
      lines.push('');
    }

    if (a.comment) {
      lines.push(`> ${a.comment.replace(/\n/g, '\n> ')}`);
      lines.push('');
    }
  });

  return lines.join('\n');
};
