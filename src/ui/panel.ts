import { iconClose } from '../icons.ts';
import { attachAutocomplete } from './autocomplete.ts';

const parser = new DOMParser();

const setIcon = (el: HTMLElement, svg: string) => {
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.documentElement;
  el.appendChild(document.importNode(svgEl, true));
};

type PanelOptions = {
  element: Element;
  selector: string;
  path: string;
  styles: Record<string, string>;
  onSubmit: (comment: string) => void;
  onClose: () => void;
};

export const createPanel = (shadowRoot: ShadowRoot, opts: PanelOptions) => {
  const panel = document.createElement('div');
  panel.className = 'kai-panel';

  // Header
  const header = document.createElement('div');
  header.className = 'kai-panel-header';
  const title = document.createElement('h2');
  title.textContent = 'Annotate Element';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'kai-btn kai-btn--icon';
  setIcon(closeBtn, iconClose);
  closeBtn.setAttribute('aria-label', 'Close panel');
  closeBtn.addEventListener('click', opts.onClose);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'kai-panel-body';

  // Selector section
  const selectorSection = document.createElement('div');
  selectorSection.className = 'kai-panel-section';
  const selectorLabel = document.createElement('div');
  selectorLabel.className = 'kai-panel-label';
  selectorLabel.textContent = 'Selector';
  const selectorCode = document.createElement('div');
  selectorCode.className = 'kai-panel-selector';
  selectorCode.textContent = opts.selector;
  selectorSection.appendChild(selectorLabel);
  selectorSection.appendChild(selectorCode);

  // Path section
  const pathSection = document.createElement('div');
  pathSection.className = 'kai-panel-section';
  const pathLabel = document.createElement('div');
  pathLabel.className = 'kai-panel-label';
  pathLabel.textContent = 'Path';
  const pathText = document.createElement('div');
  pathText.className = 'kai-panel-path';
  pathText.textContent = opts.path;
  pathSection.appendChild(pathLabel);
  pathSection.appendChild(pathText);

  // Styles section
  const stylesSection = document.createElement('div');
  stylesSection.className = 'kai-panel-section';
  const stylesLabel = document.createElement('div');
  stylesLabel.className = 'kai-panel-label';
  stylesLabel.textContent = 'Computed Styles';
  const stylesList = document.createElement('ul');
  stylesList.className = 'kai-panel-styles';

  for (const [prop, value] of Object.entries(opts.styles)) {
    const li = document.createElement('li');
    const propSpan = document.createElement('span');
    propSpan.className = 'kai-style-prop';
    propSpan.textContent = `${prop}: `;
    const valueSpan = document.createElement('span');
    valueSpan.className = 'kai-style-value';
    valueSpan.textContent = value;
    li.appendChild(propSpan);
    li.appendChild(valueSpan);
    stylesList.appendChild(li);
  }

  stylesSection.appendChild(stylesLabel);
  stylesSection.appendChild(stylesList);

  body.appendChild(selectorSection);
  body.appendChild(pathSection);
  body.appendChild(stylesSection);

  // Footer with textarea + submit
  const footer = document.createElement('div');
  footer.className = 'kai-panel-footer';

  const textareaLabel = document.createElement('label');
  textareaLabel.className = 'kai-panel-label';
  textareaLabel.textContent = 'Comment';
  textareaLabel.setAttribute('for', 'kai-comment');

  const textarea = document.createElement('textarea');
  textarea.className = 'kai-panel-textarea';
  textarea.id = 'kai-comment';
  textarea.placeholder = 'Describe the issue or suggestion…';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'kai-btn kai-btn--primary';
  submitBtn.textContent = 'Add Annotation';

  const submit = () => {
    const comment = textarea.value.trim();
    if (!comment) return;
    opts.onSubmit(comment);
  };

  submitBtn.addEventListener('click', submit);

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  });

  footer.appendChild(textareaLabel);
  footer.appendChild(textarea);
  footer.appendChild(submitBtn);

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(footer);
  shadowRoot.appendChild(panel);

  // Slide in
  requestAnimationFrame(() => {
    panel.classList.add('kai-panel--open');
    textarea.focus();
  });

  // Autocomplete
  const ac = attachAutocomplete(textarea, shadowRoot, () => opts.element);

  // Escape to close
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !shadowRoot.querySelector('.kai-autocomplete')) {
      opts.onClose();
    }
  };
  panel.addEventListener('keydown', onKeydown);

  const destroy = () => {
    ac.destroy();
    panel.classList.remove('kai-panel--open');
    panel.addEventListener('transitionend', () => panel.remove(), { once: true });
    setTimeout(() => panel.remove(), 300);
  };

  return { destroy };
};
