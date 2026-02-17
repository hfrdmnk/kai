import type { Annotation } from '../types.ts';

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
  });

  return lines.join('\n');
};
