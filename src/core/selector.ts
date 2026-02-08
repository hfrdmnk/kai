export const generateSelector = (el: Element): string => {
  if (el.id) {
    return `#${el.id}`;
  }

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body && parts.length < 4) {
    let segment = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${current.id}`);
      break;
    }

    const classes = Array.from(current.classList)
      .filter(c => !c.startsWith('kai-'))
      .slice(0, 2);
    if (classes.length) {
      segment += `.${classes.join('.')}`;
    }

    const candidate = [...parts];
    candidate.unshift(segment);
    const selector = candidate.join(' > ');
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        c => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        segment += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(segment);
    current = current.parentElement;
  }

  return parts.join(' > ');
};

export const generatePath = (el: Element): string => {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    let segment = current.tagName.toLowerCase();
    const classes = Array.from(current.classList)
      .filter(c => !c.startsWith('kai-'))
      .slice(0, 2);
    if (classes.length) {
      segment += `.${classes.join('.')}`;
    }
    parts.unshift(segment);
    current = current.parentElement;
  }

  return parts.join(' › ');
};
