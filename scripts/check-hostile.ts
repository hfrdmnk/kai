import { createBrowser, requireBuild, simulateToolbar } from './browser-harness.ts';

// Hostile host pages: strict CSP, Trusted Types, and pages that drop kai's element.
// kai is started by the real dist/extension/background.js through simulateToolbar(), which
// injects through CDP rather than a loaded extension; see browser-harness.ts.

const STRICT_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";
const pages: Record<string, string | undefined> = {
  '/csp': STRICT_CSP,
  '/trusted-types': `${STRICT_CSP}; require-trusted-types-for 'script'; trusted-types 'none'`,
  '/spa': undefined,
  '/cleaner': undefined,
};

// Served as a file so the strict pages may run it. Builds the page with DOM APIs, since
// Trusted Types also blocks innerHTML for the host.
const hostScript = `
window.__violations = [];
addEventListener('securitypolicyviolation', e => __violations.push(e.violatedDirective + ' ' + e.blockedURI + ' ' + e.sourceFile + ':' + e.lineNumber));
let clicks = 0;
let keys = 0;
const el = (tag, props) => Object.assign(document.createElement(tag), props);
const render = () => {
  const main = el('main', { style: 'padding:80px' });
  main.append(
    el('button', { id: 'action', textContent: 'Page action', onclick: () => { main.querySelector('#clicks').textContent = String(++clicks); } }),
    el('input', { id: 'input', value: 'Original' }),
    el('button', { id: 'navigate', textContent: 'Navigate', onclick: navigate }),
    el('output', { id: 'clicks', textContent: String(clicks) }),
    el('output', { id: 'keys', textContent: String(keys) }),
  );
  return main;
};
// Client-side routers that render into a fresh <body> drop everything else on it, kai included
const navigate = () => {
  const body = el('body');
  body.append(render());
  document.body.replaceWith(body);
};
document.addEventListener('keydown', e => {
  if (e.target.id === 'input') document.querySelector('#keys').textContent = String(++keys);
}, true);
document.body.append(render());
if (location.pathname === '/cleaner') {
  // Hydration-style cleanup: anything the app didn't render is removed from <body>
  new MutationObserver(() => {
    for (const node of [...document.body.children]) if (node.localName !== 'main') node.remove();
  }).observe(document.body, { childList: true });
}
`;

await requireBuild();
const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: req => {
    const path = new URL(req.url).pathname;
    if (path === '/host.js') return new Response(hostScript, { headers: { 'Content-Type': 'text/javascript' } });
    if (!(path in pages)) return new Response('Not found', { status: 404 });
    const headers: Record<string, string> = { 'Content-Type': 'text/html' };
    if (pages[path]) headers['Content-Security-Policy'] = pages[path];
    return new Response(`<!doctype html><meta charset="utf-8"><title>Hostile ${path}</title><body><script src="/host.js"></script>`, { headers });
  },
});
const origin = `http://127.0.0.1:${server.port}`;
const { browser, evaluate, settle, assert, start, finish } = createBrowser('hostile');

const toolbarClick = await simulateToolbar({ browser, evaluate, settle });
const snapshot = () => browser('snapshot', '-i');
const kaiActive = async () => (await snapshot()).includes('button "Toggle UI annotator" [expanded=true');
const kaiPresent = async () => (await snapshot()).includes('Toggle UI annotator');
const toggleBox = async () => {
  const ref = (await snapshot()).match(/button "Toggle UI annotator" \[[^\]]*ref=(e\d+)/)?.[1];
  if (!ref) return null;
  const box = await browser('get', 'box', `@${ref}`);
  return Object.fromEntries([...box.matchAll(/(\w+):\s+([\d.]+)/g)].map(([, k, v]) => [k, Number(v)]));
};
const typeIntoHost = async (text: string) => {
  await browser('click', '#input');
  await browser('press', 'End');
  await browser('keyboard', 'type', text);
  return browser('get', 'value', '#input');
};
const savedSelectors = async () => (JSON.parse(await browser('eval',
  'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")')) as { selector: string }[]).map(a => a.selector);
const pageErrors = async () => {
  const errors = JSON.parse(await browser('--json', 'errors')).data.errors as unknown[];
  const violations = JSON.parse(await browser('eval', 'window.__violations ?? []')) as string[];
  return [...errors.map(e => JSON.stringify(e)), ...violations];
};
const openPage = async (path: string) => {
  await browser('open', `${origin}${path}`);
  await browser('eval', 'localStorage.clear()');
  await browser('errors', '--clear');
};
const annotate = async (selector: string, comment: string) => {
  await browser('click', selector);
  await settle();
  await browser('keyboard', 'type', comment);
  await browser('press', 'Control+Enter');
  await settle();
};

let failures = 0;
try {
  await start(`${origin}/csp`);

  for (const page of ['/csp', '/trusted-types']) {
    await openPage(page);
    await assert(await toolbarClick() && await kaiActive(), `${page}: the toolbar click injects kai and opens it active`);
    const box = await toggleBox();
    // Unstyled, the toggle would be an inline button sized by its icon at the end of <body>
    await assert(box?.width === 44 && box?.height === 44 && box.y > 600, `${page}: kai's toolbar is styled (44×44 FAB in the bottom corner, got ${JSON.stringify(box)})`);
    await annotate('#action', `Annotated under ${page}`);
    await assert((await savedSelectors()).includes('#action'), `${page}: annotating a page element works`);
    // A page input can keep focus while kai opens; typing and pasting into it stay blocked
    await browser('focus', '#input');
    await browser('keyboard', 'type', 'Z');
    await browser('keyboard', 'inserttext', 'paste');
    await assert(await browser('get', 'value', '#input') === 'Original' && await browser('get', 'text', '#keys') === '0',
      `${page}: annotation mode blocks typing into a focused page input`);
    await assert(await browser('get', 'text', '#clicks') === '0', `${page}: annotation clicks never reach the page`);
    await assert(await toolbarClick() && !await kaiActive(), `${page}: a second toolbar click deactivates kai`);
    await assert(await typeIntoHost(' typed') === 'Original typed', `${page}: the page is usable again after deactivating`);
    const errors = await pageErrors();
    await assert(errors.length === 0, `${page}: no CSP or Trusted Types violations and no page errors${errors.length ? `: ${errors.join('; ')}` : ''}`);
  }

  await openPage('/spa');
  await assert(await toolbarClick() && await kaiActive(), '/spa: the toolbar click opens kai');
  await browser('press', 'i');
  await browser('click', '#navigate');
  await settle();
  await assert(!await kaiPresent(), '/spa: a <body> swap drops kai');
  await assert(await typeIntoHost(' routed') === 'Original routed' && Number(await browser('get', 'text', '#keys')) > 0,
    '/spa: the dropped kai leaves no keyboard blockers behind');
  await browser('click', '#action');
  await assert(await browser('get', 'text', '#clicks') === '1', '/spa: the dropped kai leaves no click blockers behind');
  await assert(await toolbarClick() && await kaiActive(), '/spa: the next toolbar click re-appends kai, already active');
  await annotate('#action', 'After navigation');
  await assert((await savedSelectors()).includes('#action'), '/spa: the re-appended kai annotates');

  // Dropped while the editor is open: its window listeners must go with it
  await browser('click', '#input');
  await settle();
  await browser('eval', `document.querySelector('ui-annotator').remove()`);
  await settle();
  await assert(await typeIntoHost(' gone') === 'Original routed gone', '/spa: removing kai with its editor open unfreezes typing');
  await browser('click', '#action');
  await assert(await browser('get', 'text', '#clicks') === '2', '/spa: removing kai with its editor open unfreezes clicks');
  const spaErrors = await pageErrors();
  await assert(spaErrors.length === 0, `/spa: no page errors${spaErrors.length ? `: ${spaErrors.join('; ')}` : ''}`);

  await openPage('/cleaner');
  await toolbarClick();
  await assert(!await kaiPresent(), '/cleaner: the page removes kai as soon as it is appended');
  await assert(await typeIntoHost(' kept') === 'Original kept', '/cleaner: the removed kai leaves the page usable');
  await browser('click', '#action');
  await assert(await browser('get', 'text', '#clicks') === '1', '/cleaner: page clicks still work');
  await toolbarClick();
  await assert(await typeIntoHost('!') === 'Original kept!', '/cleaner: repeated toolbar clicks never freeze the page');
  const cleanerErrors = await pageErrors();
  await assert(cleanerErrors.length === 0, `/cleaner: no page errors${cleanerErrors.length ? `: ${cleanerErrors.join('; ')}` : ''}`);
} finally {
  failures = await finish();
  server.stop(true);
}
if (failures) throw new Error(`${failures} hostile-page checks failed`);
