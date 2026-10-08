import iconKai from './icons/kai.svg?raw';
import iconClose from './icons/close.svg?raw';
import iconTrash from './icons/trash.svg?raw';
import iconCopy from './icons/copy.svg?raw';
import iconCheck from './icons/check.svg?raw';
import iconHelp from './icons/help.svg?raw';
import iconCursor from './icons/cursor.svg?raw';
import iconSettings from './icons/settings.svg?raw';

export { iconKai, iconClose, iconTrash, iconCopy, iconCheck, iconHelp, iconCursor, iconSettings };

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAG = /<(\w+)((?:\s+[\w:-]+="[^"]*")*)\s*\/?>/g;
const ATTR = /([\w:-]+)="([^"]*)"/g;

/**
 * Trusted Types pages reject DOMParser and innerHTML, so icons are built element by element.
 * Handles the flat <svg><path/>…</svg> shape every file in src/icons/ has.
 */
export const createIcon = (markup: string): SVGSVGElement => {
  let root: SVGSVGElement | undefined;
  for (const [, tag, attrs] of markup.matchAll(TAG)) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [, name, value] of attrs.matchAll(ATTR)) {
      if (name !== 'xmlns') el.setAttribute(name, value);
    }
    if (root) root.appendChild(el);
    else root = el as SVGSVGElement;
  }
  if (!root) throw new Error('kai: icon markup has no elements');
  return root;
};
