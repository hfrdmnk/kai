/** Separator between a shadow host's selector and the selector scoped to its shadow tree. */
const SHADOW_SEP = ' >>> ';

/** Parent in the flat tree: crosses from a shadow tree's top-level element to its host. */
export const composedParent = (el: Element): Element | null => {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
};

/** Whether `ancestor` contains `el`, crossing open shadow boundaries. */
export const composedContains = (ancestor: Element, el: Element): boolean => {
  let current: Element | null = el;
  while (current) {
    if (current === ancestor) return true;
    current = composedParent(current);
  }
  return false;
};

/** Light DOM children plus the top-level children of an open shadow root. */
export const composedChildren = (el: Element): Element[] => [
  ...Array.from(el.shadowRoot?.children ?? []),
  ...Array.from(el.children),
];

const scopedSelector = (el: Element, root: Document | ShadowRoot): string => {
  if (root === document) {
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
  }
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
    if (root.querySelectorAll(selector).length === 1) {
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

export const generateSelector = (el: Element): string => {
  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    return generateSelector(root.host) + SHADOW_SEP + scopedSelector(el, root);
  }
  return scopedSelector(el, document);
};

/** Inverse of generateSelector: follows each `>>>` hop into the host's open shadow root. */
export const resolveSelector = (selector: string): Element | null => {
  let scope: Document | ShadowRoot = document;
  let el: Element | null = null;
  for (const part of selector.split(SHADOW_SEP)) {
    el = scope.querySelector(part);
    if (!el) return null;
    if (!el.shadowRoot) return el;
    scope = el.shadowRoot;
  }
  return el;
};

export const generatePath = (el: Element): string => {
  if (el === document.documentElement) return 'html';
  if (el === document.body) return 'html › body';
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
    current = composedParent(current);
  }

  return parts.join(' › ');
};
