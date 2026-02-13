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
