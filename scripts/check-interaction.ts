import { $ } from 'bun';

// Requires agent-browser + Chromium. Exercise the packaged bundle, not private UI state.
const bundle = Bun.file(process.env.KAI_BUNDLE ?? new URL('../dist/extension/kai.js', import.meta.url));
if (!await bundle.exists()) throw new Error('Run bun run build first.');
const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: req => new URL(req.url).pathname === '/kai.js'
    ? new Response(bundle, { headers: { 'Content-Type': 'text/javascript' } })
    : new Response(`<!doctype html><meta charset="utf-8"><title>Interaction regression</title><style>:root { --proof-color: #336699; }</style>
      <main style="padding:80px">
        <section id="parent"><button id="action">Page action</button></section>
        <button id="under-hud" style="position:fixed;top:16px;left:50%;transform:translateX(-50%);height:32px">Behind HUD</button>
        <input id="input" value="Original">
        <a id="link" href="#destination">Same-tab link</a>
        <output id="events">0</output>
        <output id="own-events">0</output>
        <output id="focus-events">0</output>
        <output id="escapes">0</output>
      </main>
      <script>
        let events = 0;
        let ownEvents = 0;
        let focuses = 0;
        let escapes = 0;
        // Registered before kai, like a host library's document-level capture handlers.
        for (const type of ['pointerdown', 'mouseover', 'mousemove', 'keydown', 'keyup', 'beforeinput']) {
          document.addEventListener(type, e => {
            if (['keydown', 'keyup', 'beforeinput'].includes(e.type) && e.target.localName === 'ui-annotator') {
              document.querySelector('#own-events').textContent = String(++ownEvents);
            }
            if (e.type === 'keydown' && e.key === 'Escape') document.querySelector('#escapes').textContent = String(++escapes);
            if (e.key === 'Escape' || e.target.closest?.('main')) document.querySelector('#events').textContent = String(++events);
          }, true);
        }
        document.addEventListener('focusin', e => {
          if (e.target.id === 'input') document.querySelector('#focus-events').textContent = String(++focuses);
        }, true);
      </script><script src="/kai.js"></script>`, { headers: { 'Content-Type': 'text/html' } }),
});
const session = `kai-check-${process.pid}`;
const browser = async (...args: string[]) => {
  const result = await $`agent-browser --session ${session} ${args}`.quiet();
  return result.text().trim();
};
let failures = 0;
const assert = (condition: boolean, message: string) => {
  if (!condition) failures++;
  console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`);
};
const reset = async () => {
  await browser('eval', 'localStorage.clear()');
  await browser('reload');
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle UI annotator');
  // Let the toolbar's entrance finish before coordinate-based button clicks.
  await browser('wait', '600');
};
try {
  await browser('open', `http://127.0.0.1:${server.port}`);
  await browser('set', 'viewport', '1280', '800', '2');
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle UI annotator');
  await browser('wait', '600');
  await browser('click', '#action');
  assert(await browser('get', 'text', '#events') === '0', 'Annotation clicks do not reach pre-existing document capture listeners');
  const annotation = await browser('snapshot', '-i');
  assert(annotation.includes('Annotation comment'), 'Annotation click opens the editor');
  await browser('keyboard', 'type', 'Regression annotation');
  await browser('press', 'Control+Enter');
  assert((await browser('snapshot', '-i')).includes('Annotation: Regression annotation'), 'Kai editor saves the annotation');
  assert(await browser('get', 'text', '#events') === '0', 'Kai editor keystrokes stay isolated from the host');
  assert(await browser('get', 'text', '#own-events') === '0', 'Host capture listeners receive no kai keyboard or beforeinput events');
  await browser('click', '#under-hud');
  assert((await browser('snapshot', '-i')).includes('Annotation comment'), 'HUD passes clicks through to the element underneath');
  await browser('keyboard', 'type', '--');
  assert((await browser('snapshot')).includes('--proof-color'), 'Annotation autocomplete still opens');
  await browser('press', 'Escape');
  const afterAutocomplete = await browser('snapshot');
  assert(afterAutocomplete.includes('Annotation comment') && !afterAutocomplete.includes('--proof-color'), 'First Escape closes autocomplete without closing the editor');
  await browser('press', 'Escape');
  assert(await browser('get', 'text', '#events') === '0', 'Annotation Escape does not reach the host capture listener');

  // A host input can retain focus when kai is toggled by the extension.
  await browser('focus', '#input');
  await browser('keyboard', 'type', 'Z');
  await browser('keyboard', 'inserttext', 'paste');
  assert(await browser('get', 'value', '#input') === 'Original', 'Annotation mode blocks typing and beforeinput in an already-focused host input');
  assert(await browser('get', 'text', '#events') === '0', 'Blocked host keyboard/input events never reach document listeners');

  await browser('find', 'role', 'button', 'click', '--name', 'Toggle interaction mode');
  await browser('click', '#input');
  await browser('press', 'End');
  await browser('keyboard', 'type', ' I?');
  assert(await browser('get', 'value', '#input') === 'Original I?', 'Interaction mode allows typing, including I and ? in text fields');
  assert(Number(await browser('get', 'text', '#events')) > 0, 'Interaction events reach the host listeners');
  await browser('click', '#link');
  assert((await browser('get', 'url')).endsWith('#destination'), 'Ordinary links navigate in the same tab');
  const tabs = JSON.parse(await browser('tab', 'list', '--json'));
  assert(tabs.data.tabs.length === 1, 'Interaction does not open an extra tab');

  await browser('press', 'i');
  await browser('find', 'role', 'button', 'click', '--name', 'Settings');
  await browser('find', 'role', 'button', 'click', '--name', 'Keyboard shortcuts', '--exact');
  const settingsHelp = await browser('snapshot');
  assert(settingsHelp.includes('Close keyboard shortcuts') && settingsHelp.includes('button "Settings" [expanded=false'), 'Settings shortcut link opens help and closes settings');
  await browser('press', 'Escape');
  await browser('press', '?');
  const help = await browser('snapshot');
  assert(help.includes('Keyboard shortcuts') && help.includes('Annotation editor & settings'), '? opens shortcuts for every mode');
  await browser('press', 'Escape');
  assert(!(await browser('snapshot')).includes('Close keyboard shortcuts'), 'Escape closes help without deactivating kai');
  await browser('press', 'i');
  await browser('press', 'Escape');
  assert((await browser('snapshot', '-i')).includes('Toggle interaction mode'), 'Page Escape in interaction mode does not deactivate kai');
  assert(await browser('get', 'text', '#escapes') === '1', 'Interaction Escape reaches the host exactly once');
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle UI annotator');
  await browser('click', '#input');
  await browser('press', 'End');
  await browser('keyboard', 'type', ' off');
  assert(await browser('get', 'value', '#input') === 'Original I? off', 'Deactivation removes the event blockers');

  await reset();
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle interaction mode');
  await browser('click', '#input');
  assert(await browser('get', 'text', '#focus-events') === '1', 'Interaction delivers focusin when moving from kai to a page input');

  await reset();
  await browser('find', 'role', 'button', 'click', '--name', 'Settings');
  await browser('click', '#action');
  const outsideSettings = await browser('snapshot', '-i');
  assert(outsideSettings.includes('button "Settings" [expanded=false') && !outsideSettings.includes('Annotation comment'), 'Outside click dismisses settings without annotating');

  await reset();
  await browser('press', 's');
  await browser('find', 'role', 'button', 'click', '--name', 'Settings');
  await browser('click', '#action');
  await browser('wait', '350');
  assert(!(await browser('snapshot')).includes('Selector copied'), 'Outside settings click does not complete a selector pick');

  await reset();
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle interaction mode');
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle interaction mode');
  await browser('hover', '#action');
  await browser('keydown', 'Alt');
  await browser('wait', '300');
  assert(/\d+×\d+ px/.test(await browser('snapshot')), 'Alt inspection works with toolbar focus');
  await browser('keyup', 'Alt');
  await browser('hover', '#action');
  await browser('eval', 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
  await browser('press', 'ArrowUp');
  await browser('click', '#action');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Parent annotation');
  await browser('press', 'Control+Enter');
  const selected = JSON.parse(await browser('eval', 'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")'));
  assert(selected.some((a: { selector: string }) => a.selector === '#parent'), 'Ancestor selection works with toolbar focus');

  await reset();
  await browser('focus', '#action');
  await browser('press', ',');
  await browser('press', 'ArrowRight');
  await browser('press', 'Tab');
  await browser('press', 'ArrowRight');
  await browser('press', 'Tab');
  await browser('press', 'Enter');
  const keyboardHelp = await browser('snapshot', '-i');
  assert(await browser('eval', 'localStorage.getItem("ui-annotator:theme")') === '"light"'
    && await browser('eval', 'localStorage.getItem("ui-annotator:accent")') === '"yellow"'
    && keyboardHelp.includes('Close keyboard shortcuts'), 'Keyboard-only settings can change theme/accent and open help');

  await reset();
  await browser('focus', '#input');
  await browser('press', 'Tab');
  await browser('press', 'Enter');
  await browser('click', '#input');
  await browser('press', 'End');
  await browser('keyboard', 'type', ' keyboard');
  assert(await browser('get', 'value', '#input') === 'Original keyboard', 'Tab from a frozen page input reaches the interaction control');
  if (failures) throw new Error(`${failures} browser regression checks failed`);
} finally {
  await browser('close');
  server.stop(true);
}
