import type { Annotation } from '../types.ts';
import { iconClose, iconTrash, iconCopy } from '../icons.ts';

const parser = new DOMParser();

const setIcon = (el: HTMLElement, svg: string) => {
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  el.appendChild(document.importNode(doc.documentElement, true));
};

type DrawerOptions = {
  annotations: Annotation[];
  onSelect: (annotation: Annotation) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onClose: () => void;
};

export const createDrawer = (shadowRoot: ShadowRoot, opts: DrawerOptions) => {
  const drawer = document.createElement('div');
  drawer.className = 'kai-drawer';

  // Header
  const header = document.createElement('div');
  header.className = 'kai-drawer-header';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = 'Annotations';
  const countSpan = document.createElement('span');
  countSpan.className = 'kai-drawer-count';
  title.appendChild(countSpan);
  titleWrap.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'kai-drawer-actions';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'kai-btn kai-btn--icon kai-btn--danger';
  setIcon(clearBtn, iconTrash);
  clearBtn.setAttribute('aria-label', 'Clear all annotations');
  clearBtn.addEventListener('click', opts.onClearAll);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'kai-btn kai-btn--icon';
  setIcon(closeBtn, iconClose);
  closeBtn.setAttribute('aria-label', 'Close drawer');
  closeBtn.addEventListener('click', opts.onClose);

  actions.appendChild(clearBtn);
  actions.appendChild(closeBtn);
  header.appendChild(titleWrap);
  header.appendChild(actions);

  // List
  const list = document.createElement('ul');
  list.className = 'kai-drawer-list';

  // Footer
  const footer = document.createElement('div');
  footer.className = 'kai-drawer-footer';

  const jsonBtn = document.createElement('button');
  jsonBtn.className = 'kai-btn kai-btn--secondary';
  setIcon(jsonBtn, iconCopy);
  jsonBtn.appendChild(document.createTextNode(' Copy JSON'));
  jsonBtn.addEventListener('click', opts.onExportJSON);

  const mdBtn = document.createElement('button');
  mdBtn.className = 'kai-btn kai-btn--secondary';
  setIcon(mdBtn, iconCopy);
  mdBtn.appendChild(document.createTextNode(' Copy MD'));
  mdBtn.addEventListener('click', opts.onExportMarkdown);

  footer.appendChild(jsonBtn);
  footer.appendChild(mdBtn);

  drawer.appendChild(header);
  drawer.appendChild(list);
  drawer.appendChild(footer);
  shadowRoot.appendChild(drawer);

  requestAnimationFrame(() => drawer.classList.add('kai-drawer--open'));

  const renderList = (annotations: Annotation[]) => {
    countSpan.textContent = `(${annotations.length})`;
    list.textContent = '';

    annotations.forEach((a, i) => {
      const item = document.createElement('li');
      item.className = 'kai-drawer-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      const number = document.createElement('span');
      number.className = 'kai-drawer-item-number';
      number.textContent = String(i + 1);

      const body = document.createElement('div');
      body.className = 'kai-drawer-item-body';

      const selector = document.createElement('div');
      selector.className = 'kai-drawer-item-selector';
      selector.textContent = a.selector;

      const comment = document.createElement('div');
      comment.className = 'kai-drawer-item-comment';
      comment.textContent = a.comment;

      body.appendChild(selector);
      body.appendChild(comment);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'kai-btn kai-btn--icon kai-btn--danger kai-drawer-item-delete';
      setIcon(deleteBtn, iconTrash);
      deleteBtn.setAttribute('aria-label', `Remove annotation ${i + 1}`);
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onRemove(a.id);
      });

      item.appendChild(number);
      item.appendChild(body);
      item.appendChild(deleteBtn);

      item.addEventListener('click', () => opts.onSelect(a));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          opts.onSelect(a);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          opts.onRemove(a.id);
        }
      });

      list.appendChild(item);
    });
  };

  renderList(opts.annotations);

  const update = (annotations: Annotation[]) => renderList(annotations);

  const destroy = () => {
    drawer.classList.remove('kai-drawer--open');
    drawer.addEventListener('transitionend', () => drawer.remove(), { once: true });
    setTimeout(() => drawer.remove(), 300);
  };

  return { update, destroy };
};
