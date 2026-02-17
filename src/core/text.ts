/** Extract a truncated preview of an element's direct text content (ignoring child elements). */
export const getDirectText = (el: Element): string => {
  const text = Array.from(el.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!text) return '';
  const preview = text.slice(0, 40);
  return preview + (text.length > 40 ? '…' : '');
};

/** Capture visible text from the element and its immediate siblings. */
export const getNearbyText = (el: Element): string => {
  const texts: string[] = [];
  const prev = el.previousElementSibling;
  if (prev) texts.push(prev.textContent?.trim() ?? '');
  texts.push(el.textContent?.trim() ?? '');
  const next = el.nextElementSibling;
  if (next) texts.push(next.textContent?.trim() ?? '');
  const combined = texts.filter(Boolean).join(' ').trim();
  return combined.length > 80 ? combined.slice(0, 80) + '…' : combined;
};
