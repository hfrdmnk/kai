import { $ } from 'bun';

// Requires agent-browser + Chromium. Exercise the packaged bundle, not private UI state.
const bundle = Bun.file(process.env.KAI_BUNDLE ?? new URL('../dist/extension/kai.js', import.meta.url));
if (!await bundle.exists()) throw new Error('Run bun run build first.');
// Test-only copy with an open shadow root, so checks can read the HUD (aria-hidden, invisible to snapshots).
// Pages opened with ?open load it; everything else runs against the real closed build.
const source = await bundle.text();
const openBundle = source.replace(/attachShadow\(\{ mode: "closed" \}\)/, 'attachShadow({ mode: "open" })');
if (openBundle === source) throw new Error('Open-shadow build: attachShadow({ mode: "closed" }) not found in the bundle.');
const js = (body: string | Blob) => new Response(body, { headers: { 'Content-Type': 'text/javascript' } });
const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: req => new URL(req.url).pathname === '/kai.js' ? js(bundle)
    : new URL(req.url).pathname === '/kai-open.js' ? js(openBundle)
    : new Response(`<!doctype html><meta charset="utf-8"><title>Interaction regression</title><style>:root { --proof-color: #336699; } .px-2 { padding-inline: 8px; } .px-4 { padding-inline: 16px; } .px-6 { padding-inline: 24px; } .px-8 { padding-inline: 32px; }</style>
      <main style="padding:80px">
        <section id="parent"><button id="action">Page action</button></section>
        <button id="under-hud" style="position:fixed;top:16px;left:50%;transform:translateX(-50%);height:32px">Behind HUD</button>
        <input id="input" value="Original">
        <a id="link" href="#destination">Same-tab link</a>
        <output id="events">0</output>
        <output id="own-events">0</output>
        <output id="focus-events">0</output>
        <output id="escapes">0</output>
        <output id="clicks">0</output>
        <output id="errors">0</output>
        <div id="box-parent" style="display:flex;gap:12px;padding:8px"><button id="box-child" style="margin:4px;padding:6px 10px">Box child</button><button>Two</button></div>
        <div id="rotated" style="width:40px;height:40px;padding:20px;margin:40px;transform:rotate(45deg);background:#ccc"></div>
        <!-- Siblings with the same tag and classes: the selector pins one (:nth-of-type), an adjustment previews on both -->
        <section class="twin"><p class="t" style="margin:0;padding:4px">Twin A</p><p class="t" style="margin:0;padding:4px">Twin B</p><p style="margin:0;padding:4px">Plain</p></section>
        <!-- Utility classes give the page a spacing scale: 8, 16, 24, 32 (px-2 … px-8) -->
        <button id="snap" class="px-4">Snap me</button>
      </main>
      <!-- Below main, so main's own size (measured by the inspect checks) stays put -->
      <section id="review" style="padding:0 80px 80px">
          <!-- Matching: identical siblings change together; the same classes in another parent don't -->
          <ul id="tpl"><li class="px-2 py-1">One</li><li class="px-2 py-1">Two</li></ul>
          <ul><li class="px-2 py-1" id="lone">Lone</li></ul>
          <div id="cards"><article class="card px-2" id="card-a">Card A</article><article class="card px-2" id="card-b">Card B</article><article class="card px-2" id="card-c">Card C</article></div>
          <div id="gone">Removed mid-drag</div>
          <!-- Padding from a variable through the shorthand: its longhands read empty inline -->
          <div id="shorthand" style="--pad: 20px; padding: var(--pad); background: #eee">Shorthand</div>
      </section>
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
        // Uncaught errors, kai's included (they surface on the page's window)
        let errors = 0;
        window.addEventListener('error', () => { document.querySelector('#errors').textContent = String(++errors); });
        // Clicks that reach the page (kai swallows them in annotation mode)
        let clicks = 0;
        document.addEventListener('click', e => {
          if (e.target.closest?.('main, #review')) document.querySelector('#clicks').textContent = String(++clicks);
        }, true);
        document.addEventListener('focusin', e => {
          if (e.target.id === 'input') document.querySelector('#focus-events').textContent = String(++focuses);
        }, true);
      </script><script src="${new URL(req.url).searchParams.has('open') ? '/kai-open.js' : '/kai.js'}"></script>`, { headers: { 'Content-Type': 'text/html' } }),
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
  // The plain page and closed build, also after checks that used the open build (?open)
  await browser('open', `http://127.0.0.1:${server.port}/`);
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
  // agent-browser's keydown/keyup don't set modifier flags, which kai reads; dispatch browser-shaped events
  const frames = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))';
  const key = (type: string, name: string, mods: Record<string, boolean>) => browser('eval',
    `document.activeElement.dispatchEvent(new KeyboardEvent('${type}', { key: '${name}', bubbles: true, composed: true, cancelable: true, ...${JSON.stringify(mods)} })); ${frames}`);
  // The snapshot splits tooltip lines into separate text pieces
  const overlayText = async () => (await browser('snapshot')).replace(/StaticText "|"|\\n/g, '').replace(/ - /g, ' ').replace(/\s+/g, ' ');
  const pillSize = async () => (await overlayText()).match(/(\d+)×(\d+) px/)?.slice(1).map(Number) ?? [];
  const rectSize = async (selector: string) => JSON.parse(await browser('eval',
    `(r => [r.width, r.height])(document.querySelector('${selector}').getBoundingClientRect())`)) as number[];
  // The crosshair ray-casts to whole pixels
  const near = (a: number[], b: number[]) => a.length === 2 && a.every((v, i) => Math.abs(v - b[i]) <= 2);
  await browser('hover', '#box-child');
  await key('keydown', 'Alt', { altKey: true });
  assert(near(await pillSize(), await rectSize('#box-child')), 'Alt measures the hovered element');
  await key('keydown', 'ArrowUp', { altKey: true });
  assert(near(await pillSize(), await rectSize('#box-parent')), 'ArrowUp while inspecting measures the parent');
  await key('keydown', 'ArrowDown', { altKey: true });
  assert(near(await pillSize(), await rectSize('#box-child')), 'ArrowDown while inspecting goes back to the hovered element');
  await key('keydown', 'Control', { altKey: true, ctrlKey: true });
  const boxRows = await overlayText();
  assert(/Box button#box-child [\d.]+×[\d.]+/.test(boxRows) && boxRows.includes('Margin 4 (0.25rem)')
    && boxRows.includes('Padding 6 10 (0.375rem 0.625rem)'), 'Holding Ctrl shows the box model');
  await key('keydown', 'Shift', { altKey: true, ctrlKey: true, shiftKey: true });
  const merged = await overlayText();
  assert(merged.includes('Font') && merged.includes('Box button#box-child'), 'Shift puts text metrics and box model in one card');
  await key('keyup', 'Shift', { altKey: true, ctrlKey: true });
  await key('keyup', 'Control', { altKey: true });
  const released = await overlayText();
  assert(!released.includes('Box button#box-child') && near(await pillSize(), await rectSize('#box-child')),
    'Releasing Ctrl hides the box model and keeps measuring the selection');
  await key('keydown', 'ArrowUp', { altKey: true });
  await key('keydown', 'Control', { altKey: true, ctrlKey: true });
  const parentRows = await overlayText();
  assert(parentRows.includes('Box div#box-parent') && parentRows.includes('Gap 12 (0.75rem)'), 'A walk made with Alt alone carries into the box model');
  await key('keyup', 'Control', { altKey: true });
  await key('keyup', 'Alt', {});
  await browser('eval', frames);
  await browser('click', '#box-child');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Box parent annotation');
  await browser('press', 'Control+Enter');
  const afterBox = JSON.parse(await browser('eval', 'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")'));
  assert(afterBox.some((a: { selector: string }) => a.selector === '#box-parent'), 'The walked selection carries back into annotate mode');

  await reset();
  await browser('hover', '#box-child');
  await key('keydown', 'Alt', { altKey: true });
  await key('keydown', 'ArrowUp', { altKey: true });
  await key('keyup', 'Alt', {});
  // Still inside the child and the walked parent, but far enough to count as moving on
  const [moveX, moveY] = JSON.parse(await browser('eval',
    `(r => [r.x + r.width / 2 + 10, r.y + r.height / 2])(document.querySelector('#box-child').getBoundingClientRect())`)) as number[];
  await browser('mouse', 'move', String(Math.round(moveX)), String(Math.round(moveY)));
  await browser('eval', frames);
  await browser('mouse', 'down');
  await browser('mouse', 'up');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Moved on');
  await browser('press', 'Control+Enter');
  const afterMove = JSON.parse(await browser('eval', 'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")'));
  assert(afterMove.some((a: { selector: string }) => a.selector === '#box-child') && !afterMove.some((a: { selector: string }) => a.selector === '#box-parent'),
    'A mouse move after a mode switch returns the selection to the innermost element');

  await reset();
  await browser('hover', '#box-child');
  await key('keydown', 'ArrowUp', {});
  await key('keydown', 'Alt', { altKey: true });
  // A fresh walk after the switch is deliberate, so moving to measure keeps it
  await key('keydown', 'ArrowUp', { altKey: true });
  await browser('mouse', 'move', String(Math.round(moveX)), String(Math.round(moveY)));
  await browser('eval', frames);
  assert(near(await pillSize(), await rectSize('main')), 'A walk made after a mode switch survives the next mouse move');
  await key('keyup', 'Alt', {});

  await reset();
  // A rotated square's bounding box looks evenly scaled; its bands would be drawn in the wrong place
  await browser('hover', '#rotated');
  await key('keydown', 'Alt', { altKey: true });
  await key('keydown', 'Control', { altKey: true, ctrlKey: true });
  // The card lists padding 20; an in-band label would be a text piece of its own
  const rotatedRows = await browser('snapshot');
  assert(rotatedRows.includes('div#rotated') && !rotatedRows.includes('StaticText "20"'), 'A rotated element gets only its outline, no in-band values');
  await key('keyup', 'Control', { altKey: true });
  await key('keyup', 'Alt', {});

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

  // ── Drag to adjust ──
  const stored = async () => JSON.parse(await browser('eval', 'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")')) as
    { selector: string; comment: string; edits?: { property: string; from: number; to: number; className?: string }[] }[];
  /** `padding-right:4→14`, `:pr-8` when snapped: an annotation's edits in one string */
  const editText = (a?: { edits?: { property: string; from: number; to: number; className?: string }[] }) =>
    (a?.edits ?? []).map(e => `${e.property}:${e.from}→${e.to}${e.className ? `:${e.className}` : ''}`).join();
  const twinPadding = async () => JSON.parse(await browser('eval', `[...document.querySelectorAll('.twin .t')].map(e => getComputedStyle(e).paddingRight)`)) as string[];
  /** Arms a property on the first twin with the pointer just inside its right edge */
  const armTwin = async (key: string) => {
    await browser('hover', '.twin .t');
    const [x, y] = JSON.parse(await browser('eval',
      `(r => [Math.round(r.right - 3), Math.round(r.top + r.height / 2)])(document.querySelector('.twin .t').getBoundingClientRect())`)) as number[];
    await browser('mouse', 'move', String(x), String(y));
    await browser('eval', frames);
    await browser('press', key);
    await browser('eval', frames);
    return [x, y];
  };
  /** Press, move right by `dx` in two steps, and leave the button down */
  const dragRight = async ([x, y]: number[], dx: number) => {
    await browser('mouse', 'down', 'left');
    await browser('mouse', 'move', String(x + Math.round(dx / 2)), String(y));
    await browser('mouse', 'move', String(x + dx), String(y));
    await browser('eval', frames);
  };

  await reset();
  // kai's HUD and hover tooltip are aria-hidden, so these checks read the page, not the readout
  const twinSides = async () => JSON.parse(await browser('eval',
    `[...document.querySelectorAll('.twin .t')].map(e => (cs => cs.paddingLeft + ' ' + cs.paddingRight)(getComputedStyle(e)))`)) as string[];
  let at = await armTwin('p');
  await browser('keydown', 'Alt');
  await browser('eval', frames);
  assert(!/\d+×\d+ px/.test(await overlayText()), 'Alt while armed does not enter inspect');
  await dragRight(at, 20);
  assert((await twinSides()).join() === '14px 14px,14px 14px', 'Alt drags a side and its opposite, previewed on every match of the selector');
  await browser('keyup', 'Alt');
  await browser('eval', frames);
  assert((await twinSides()).join() === '4px 14px,4px 14px', 'Releasing Alt mid-drag goes back to the grabbed side alone');
  await browser('press', 'Escape');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  assert((await twinSides()).join() === '4px 4px,4px 4px' && !(await stored()).length
    && (await browser('snapshot', '-i')).includes('"Toggle UI annotator" [expanded=true'), 'Escape mid-drag cancels, restores every match and keeps kai active');

  at = await armTwin('p');
  await dragRight(at, 20);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  let saved = await stored();
  assert(saved.length === 1 && saved[0].comment === '' && editText(saved[0]) === 'padding-right:4→14'
    && (await twinPadding()).join() === '14px,14px', 'Release creates an annotation with the edit and an empty note');
  assert(!(await browser('snapshot', '-i')).includes('Annotation comment'), 'Releasing a drag does not open the annotation editor');

  at = await armTwin('p');
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  assert(!(await browser('snapshot', '-i')).includes('Annotation comment') && (await twinPadding()).join() === '14px,14px'
    && editText((await stored())[0]) === editText(saved[0]), 'A press without movement changes nothing and opens no editor');

  at = await armTwin('p');
  await dragRight(at, 10);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && editText(saved[0]) === 'padding-right:4→19', 'A second drag extends the same annotation, keeping the original value');

  await browser('reload');
  await browser('wait', '300');
  assert((await twinPadding()).join() === '19px,19px', 'Edits are re-applied on load');
  await browser('find', 'role', 'button', 'click', '--name', 'Toggle UI annotator');
  await browser('wait', '600');
  await browser('click', '.twin .t');
  await browser('find', 'role', 'button', 'click', '--name', 'Delete');
  await browser('find', 'role', 'button', 'click', '--name', 'Sure?');
  await browser('eval', frames);
  assert((await twinPadding()).join() === '4px,4px' && !(await stored()).length, 'Deleting the annotation reverts its edits');

  at = await armTwin('p');
  await dragRight(at, 20);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  await browser('click', '.twin .t');
  await browser('snapshot', '-i');
  await browser('press', 'Control+a');
  await browser('keyboard', 'type', 'Just a note');
  await browser('press', 'Control+Enter');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && saved[0].comment === 'Just a note' && editText(saved[0]) === 'padding-right:4→14' && (await twinPadding()).join() === '14px,14px',
    'The note saves apart from the edits, which stay');

  await reset();
  // G on a flex item adjusts its container's main-axis gap
  await browser('hover', '#box-child');
  await browser('eval', frames);
  await browser('press', 'g');
  const [gx, gy] = JSON.parse(await browser('eval',
    `(r => [Math.round(r.left + 200), Math.round(r.top + r.height / 2)])(document.querySelector('#box-parent').getBoundingClientRect())`)) as number[];
  await browser('mouse', 'move', String(gx), String(gy));
  await dragRight([gx, gy], 16);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && saved[0].selector === '#box-parent' && editText(saved[0]) === 'column-gap:12→20',
    'G adjusts the nearest flex container\'s main-axis gap');
  await browser('press', 'Backspace');
  await browser('press', 'Backspace');
  await browser('eval', frames);
  assert(await browser('eval', `getComputedStyle(document.querySelector('#box-parent')).columnGap`) === '"12px"', 'Clear all reverts every edit');

  // ── Snapping, nudging and resetting ──
  const snapPadding = async () => await browser('eval', `getComputedStyle(document.querySelector('#snap')).paddingRight`);
  /**
   * Arms padding on #snap from its middle, then moves just inside its right edge: once it has an
   * annotation, the marker covers that corner, and kai's own UI selects nothing. Armed, the target stays.
   */
  const armSnap = async () => {
    await browser('hover', '#snap');
    await browser('eval', frames);
    await browser('press', 'p');
    const [x, y] = JSON.parse(await browser('eval',
      `(r => [Math.round(r.right - 3), Math.round(r.top + r.height / 2)])(document.querySelector('#snap').getBoundingClientRect())`)) as number[];
    await browser('mouse', 'move', String(x), String(y));
    await browser('eval', frames);
    return [x, y];
  };

  await reset();
  at = await armSnap();
  await browser('press', 't');
  // 30px of travel is two 12px steps along 8, 16, 24, 32
  await dragRight(at, 30);
  assert(await snapPadding() === '"32px"', 'T snaps the drag to the page\'s utility-class scale');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && editText(saved[0]) === 'padding-right:16→32:pr-8', 'A snapped edit names its class');

  // Snapping stays on: one ← steps back down the scale, saved without a release
  await armSnap();
  await browser('press', 'ArrowLeft');
  await browser('eval', frames);
  saved = await stored();
  assert(await snapPadding() === '"24px"' && editText(saved[0]) === 'padding-right:16→24:pr-6', 'Snapping is sticky and ← nudges one scale step, saved right away');
  await browser('press', 't');
  await browser('press', 'ArrowRight');
  await browser('press', 'ArrowRight');
  await browser('eval', frames);
  saved = await stored();
  assert(await snapPadding() === '"26px"' && saved.length === 1 && editText(saved[0]) === 'padding-right:16→26',
    'With T off, → nudges 1px at a time into the same annotation');

  // A second annotation, so a stray Clear all would show
  await browser('press', 'Escape');
  await browser('click', '#action');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Keep me');
  await browser('press', 'Control+Enter');
  await armSnap();
  await browser('press', 'Backspace');
  await browser('press', 'Backspace');
  await browser('eval', frames);
  saved = await stored();
  assert(await snapPadding() === '"16px"' && saved.length === 1 && saved[0].comment === 'Keep me',
    'Backspace while armed resets the property instead of clearing all');
  await browser('press', 'Backspace');
  await browser('press', 'Backspace');
  await browser('eval', frames);
  assert(!(await stored()).length, 'Backspace unarmed still clears all on the second press');

  // ── The HUD and undo / redo, on the open-shadow build so the HUD can be read ──
  const resetOpen = async () => {
    await browser('open', `http://127.0.0.1:${server.port}/?open`);
    await browser('eval', 'localStorage.clear()');
    await browser('reload');
    await browser('find', 'role', 'button', 'click', '--name', 'Toggle UI annotator');
    await browser('wait', '600');
  };
  const inShadow = async (expr: string) => JSON.parse(await browser('eval', `(root => ${expr})(document.querySelector('ui-annotator').shadowRoot)`));
  const hudText = async () => await inShadow(`root.querySelector('.kai-guide-bar-content').textContent`) as string;
  const hudVisible = async () => await inShadow(`getComputedStyle(root.querySelector('.kai-guide-bar-content')).opacity`) === '1';
  /** Mode switches crossfade the HUD (150ms out, 200ms in); read it once the new content is in */
  const settle = () => browser('wait', '400');
  const chipPressed = async (key: string) => await inShadow(`!!root.querySelector('.kai-guide-bar-kbd[data-key="${key}"][data-pressed]')`) as boolean;

  await resetOpen();
  at = await armSnap();
  await settle();
  let hud = await hudText();
  assert(hud.includes('Padding') && hud.includes('axis') && hud.includes('snap') && !(await chipPressed('t')),
    'The armed HUD names the property and its modifiers, with the T chip off');
  await browser('press', 't');
  await browser('eval', frames);
  assert(await chipPressed('t'), 'T lights the snap chip');
  await dragRight(at, 30);
  hud = await hudText();
  assert(hud === 'padding-right32px+16pxpr-8' && await hudVisible(), 'The drag row shows the declaration, value, delta and class, and is visible');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  assert((await hudText()).includes('Annotation 1'), 'Release confirms the annotation in the HUD');

  // A nudge right after arming lands mid-crossfade (150ms out, then in); the HUD used to stay blank (opacity 0).
  // Both keys come from one in-page script, so the nudge reliably lands 200ms after arming.
  await browser('wait', '1300');
  await browser('hover', '#snap');
  await browser('eval', frames);
  await browser('eval', `(() => {
    const fire = key => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
    fire('p');
    return new Promise(r => setTimeout(() => { fire('ArrowRight'); r(true); }, 200));
  })()`);
  await browser('eval', frames);
  assert(await hudVisible() && (await hudText()).startsWith('padding-'), 'A nudge during the arming crossfade leaves the HUD visible');
  await browser('press', 'Escape');

  // Undo a drag: the style comes off every match and the edit goes
  await resetOpen();
  await browser('click', '.twin .t');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Twins');
  await browser('press', 'Control+Enter');
  at = await armTwin('p');
  await dragRight(at, 20);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  await browser('press', 'Control+z');
  await browser('eval', frames);
  saved = await stored();
  assert((await twinPadding()).join() === '4px,4px' && saved.length === 1 && saved[0].comment === 'Twins' && !saved[0].edits
    && (await hudText()) === 'Undid padding-right', 'Undo a drag restores every match and the annotation');
  await browser('press', 'Control+Shift+z');
  await browser('eval', frames);
  saved = await stored();
  assert((await twinPadding()).join() === '14px,14px' && saved[0].comment === 'Twins' && editText(saved[0]) === 'padding-right:4→14'
    && (await hudText()) === 'Redid padding-right', 'Redo re-applies the drag');

  // A new edit after undoing drops the redo steps
  await browser('press', 'Control+z');
  at = await armTwin('p');
  await dragRight(at, 10);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  await browser('press', 'Control+y');
  await browser('eval', frames);
  assert((await hudText()) === 'Nothing to redo' && (await twinPadding()).join() === '9px,9px', 'A new edit after undo drops redo');

  // Undo a popover delete brings back the annotation and its edits' styles
  await browser('click', '.twin .t');
  await browser('find', 'role', 'button', 'click', '--name', 'Delete');
  await browser('find', 'role', 'button', 'click', '--name', 'Sure?');
  await browser('eval', frames);
  assert((await twinPadding()).join() === '4px,4px' && !(await stored()).length, 'Popover delete reverts the edits');
  await browser('press', 'Control+z');
  await browser('eval', frames);
  saved = await stored();
  assert((await twinPadding()).join() === '9px,9px' && saved.length === 1 && saved[0].comment.startsWith('Twins')
    && (await hudText()) === 'Undid delete annotation', 'Undo a delete brings back the annotation and its styles');

  // Undo clear all
  await browser('press', 'Backspace');
  await browser('press', 'Backspace');
  await browser('eval', frames);
  assert(!(await stored()).length && (await twinPadding()).join() === '4px,4px', 'Clear all clears');
  await browser('press', 'Control+z');
  await browser('eval', frames);
  assert((await stored()).length === 1 && (await twinPadding()).join() === '9px,9px' && (await hudText()) === 'Undid clear all', 'Undo clear all brings everything back');

  // Ctrl+Z in the comment box is the text field's own undo, not kai's (after the last notice has gone)
  await browser('wait', '1400');
  await browser('click', '.twin .t');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', ' more');
  await browser('press', 'Control+z');
  await browser('eval', frames);
  assert((await stored()).length === 1 && (await twinPadding()).join() === '9px,9px' && !(await hudText()).startsWith('Undid'),
    'Ctrl+Z in the comment textarea leaves kai\'s history alone');
  await browser('press', 'Escape');

  // Nothing left to undo after undoing every step
  await resetOpen();
  await browser('press', 'Control+z');
  await settle();
  assert((await hudText()) === 'Nothing to undo', 'Undo with no history says so');

  // Markers let the pointer through while armed: the annotated corner under the marker can be grabbed
  at = await armSnap();
  await dragRight(at, 20);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  const before = editText((await stored())[0]);
  await browser('hover', '#snap');
  await browser('eval', frames);
  await browser('press', 'p');
  const [mx, my] = await inShadow(`(r => [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)])(root.querySelector('.kai-marker').getBoundingClientRect())`) as number[];
  await browser('mouse', 'move', String(mx), String(my));
  await browser('eval', frames);
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'move', String(mx + 10), String(my - 10));
  await browser('mouse', 'move', String(mx + 20), String(my - 20));
  await browser('eval', frames);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(editText(saved[0]) !== before && !(await browser('snapshot', '-i')).includes('Annotation comment'),
    'While armed, a press on a marker adjusts the element under it instead of opening the editor');

  // ── Review fixes ──
  const px = async (selector: string, property = 'paddingRight') =>
    JSON.parse(await browser('eval', `[...document.querySelectorAll('${selector}')].map(e => getComputedStyle(e).${property}).join()`)) as string;
  /** Arms `key` on an element from its middle, then moves just inside its right edge */
  const armEl = async (selector: string, key = 'p') => {
    await browser('hover', selector);
    await browser('eval', frames);
    await browser('press', key);
    const [x, y] = JSON.parse(await browser('eval',
      `(r => [Math.round(r.right - 3), Math.round(r.top + r.height / 2)])(document.querySelector('${selector}').getBoundingClientRect())`)) as number[];
    await browser('mouse', 'move', String(x), String(y));
    await browser('eval', frames);
    return [x, y];
  };
  const release = async () => {
    await browser('mouse', 'up', 'left');
    await browser('eval', frames);
  };

  // A marker opens the current annotation: note, then a drag, then the marker shows the edit and keeps it on save
  await resetOpen();
  await browser('click', '#card-a');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Card note');
  await browser('press', 'Control+Enter');
  await dragRight(await armEl('#card-a'), 20);
  await release();
  await browser('wait', '1300');
  const markerAt = await inShadow(`(r => [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)])(root.querySelector('.kai-marker').getBoundingClientRect())`) as number[];
  await browser('mouse', 'move', String(markerAt[0]), String(markerAt[1]));
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'up', 'left');
  await browser('snapshot', '-i');
  const opened = await inShadow(`root.querySelector('.kai-popover-textarea').value`) as string;
  const rows = await inShadow(`[...root.querySelectorAll('.kai-popover-edit')].map(r => r.textContent)`) as string[];
  await browser('press', 'Control+End');
  await browser('press', 'Enter');
  await browser('keyboard', 'type', 'Roomier');
  await browser('press', 'Control+Enter');
  await browser('eval', frames);
  saved = await stored();
  assert(opened === 'Card note' && rows.join() === 'padding-right8px → 18px' && saved[0].comment === 'Card note\nRoomier'
    && editText(saved[0]) === 'padding-right:8→18' && await px('#card-a') === '18px', 'A marker opens the current annotation, its change listed; saving keeps it');

  // One edit per sibling group: a drag on card B updates card A's edit; all cards follow
  assert(await px('#card-a, #card-b, #card-c') === '18px,18px,18px', 'Siblings with the same classes follow the edit');
  await browser('wait', '1300');
  await dragRight(await armEl('#card-b'), 10);
  await release();
  saved = await stored();
  assert(saved.length === 1 && editText(saved[0]) === 'padding-right:8→23' && await px('#card-a, #card-b, #card-c') === '23px,23px,23px',
    'Dragging a sibling updates the edit it shows (card A\'s); no competing edit on card B');
  // ← on card B walks the shared edit down, then past the page value onto card B's own annotation
  await armEl('#card-b');
  await browser('eval', `(() => {
    for (let i = 0; i < 16; i++) document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true, cancelable: true }));
    return true;
  })()`);
  await browser('press', 'Escape');
  saved = await stored();
  const cardA = saved.find(a => a.selector.includes('card-a'));
  const cardB = saved.find(a => a.selector.includes('card-b'));
  assert(await px('#card-a, #card-b, #card-c') === '7px,7px,7px' && cardA?.comment === 'Card note\nRoomier' && !cardA.edits && editText(cardB) === 'padding-right:8→7',
    'Nudging a sibling down passes the shared value: card A\'s edit goes at 8, card B\'s own takes over below');

  await resetOpen();
  await dragRight(await armEl('#tpl li'), 20);
  assert(await px('#tpl li') === '18px,18px' && await px('#lone') === '8px',
    'Identical siblings preview together; the same classes in another parent do not');
  await release();

  // An inline shorthand with a variable: the longhands read empty; undo must bring the shorthand back
  await dragRight(await armEl('#shorthand'), 20);
  await release();
  const sides = () => px('#shorthand', 'padding');
  assert(await sides() === '20px 30px 20px 20px', 'A drag on a var() shorthand changes one side and keeps the others');
  await browser('press', 'Control+z');
  await browser('eval', frames);
  assert(await sides() === '20px', 'Undo puts the var() shorthand back on every side');

  // I mid-drag is ignored: the release stays kai's, not a page click
  const clicksBefore = await browser('get', 'text', '#clicks');
  at = await armEl('#lone');
  await dragRight(at, 20);
  await browser('press', 'i');
  await release();
  await settle();
  assert(!(await hudText()).includes('Interacting') && await px('#lone') === '18px' && (await stored()).some(a => a.selector.includes('lone')),
    'I mid-drag is ignored and the drag commits');
  assert(await browser('get', 'text', '#clicks') === clicksBefore, 'The release after I never reaches the page as a click');

  // Nothing to undo while armed: the notice gives way to the armed hints again
  await resetOpen();
  await armEl('#snap');
  await settle();
  await browser('press', 'Control+z');
  await browser('eval', frames);
  const notice = await hudText();
  await browser('wait', '1400');
  assert(notice === 'Nothing to undo' && (await hudText()).startsWith('Padding'), 'After a notice while armed, the armed hints come back');
  await browser('press', 'Escape');

  // A narrow viewport keeps the adjust HUD to one 32px line
  await browser('set', 'viewport', '500', '800', '2');
  await armEl('#snap');
  await settle();
  const [barHeight, glyphWidth] = await inShadow(`[root.querySelector('.kai-guide-bar').getBoundingClientRect().height, root.querySelector('.kai-guide-bar-glyph').getBoundingClientRect().width]`) as number[];
  assert(barHeight === 32 && glyphWidth === 16, 'At 500px wide the armed HUD stays one 32px line with a 16px glyph');
  await browser('press', 'Escape');
  await browser('set', 'viewport', '1280', '800', '2');

  // ── Second review ──
  // A sibling dragged back to the page value takes the group's edit off: every sibling reverts
  await resetOpen();
  await dragRight(await armEl('#card-a'), 20);
  await release();
  await browser('wait', '1300');
  at = await armEl('#card-c');
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'move', String(at[0] - 10), String(at[1]));
  await browser('mouse', 'move', String(at[0] - 20), String(at[1]));
  await release();
  assert(!(await stored()).length && await px('#card-a, #card-b, #card-c') === '8px,8px,8px', 'A sibling back at the page value removes the shared edit');
  await browser('wait', '1300');
  await browser('press', 'Control+z');
  await settle();
  assert(await hudText() === 'Undid padding-right' && await px('#card-a, #card-b, #card-c') === '18px,18px,18px', 'Undo brings the shared edit back');

  // The popover lists an annotation's changes; hover shows a row's remove button
  await resetOpen();
  await dragRight(await armEl('#card-a'), 20);
  await release();
  await browser('wait', '1300');
  // A second change on the same card: the top side, dragged up
  await browser('hover', '#card-a');
  await browser('eval', frames);
  await browser('press', 'p');
  const [tx, ty] = JSON.parse(await browser('eval',
    `(r => [Math.round(r.left + r.width / 2), Math.round(r.top + 2)])(document.querySelector('#card-a').getBoundingClientRect())`)) as number[];
  await browser('mouse', 'move', String(tx), String(ty));
  await browser('eval', frames);
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'move', String(tx), String(ty - 10));
  await browser('mouse', 'move', String(tx), String(ty - 20));
  await release();
  await browser('wait', '1300');
  await browser('click', '#card-a');
  await browser('snapshot', '-i');
  const listRows = await inShadow(`[...root.querySelectorAll('.kai-popover-edit')].map(r => r.textContent)`) as string[];
  // Within a property, edits follow CSS side order
  assert(listRows.join('|') === 'padding-top0px → 10px|padding-right8px → 18px', 'The popover lists each change on its own row');
  const removeAt = async (i: number) => await inShadow(`(r => [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)])(root.querySelectorAll('.kai-popover-edit')[${i}].getBoundingClientRect())`) as number[];
  const removeOpacity = (i: number) => inShadow(`getComputedStyle(root.querySelectorAll('.kai-popover-edit-remove')[${i}]).opacity`);
  assert(await removeOpacity(1) === '0', 'Remove buttons are hidden until a row is hovered');
  const [rx, ry] = await removeAt(1);
  await browser('mouse', 'move', String(rx), String(ry));
  await browser('wait', '250');
  const label = await inShadow(`root.querySelectorAll('.kai-popover-edit-remove')[1].getAttribute('aria-label')`);
  assert(await removeOpacity(1) === '1' && label === 'Remove padding-right change', 'Hovering a row shows its remove button');
  const [bx, by] = await inShadow(`(r => [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)])(root.querySelectorAll('.kai-popover-edit-remove')[1].getBoundingClientRect())`) as number[];
  await browser('mouse', 'move', String(bx), String(by));
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(editText(saved[0]) === 'padding-top:0→10' && await px('#card-a') === '8px'
    && (await inShadow(`root.querySelectorAll('.kai-popover-edit').length`)) === 1, 'Removing a row takes that change off the page and the list');
  await browser('press', 'Escape');
  await browser('press', 'Control+z');
  await settle();
  assert(await hudText() === 'Undid padding-right' && await px('#card-a') === '18px', 'Removing a row is undoable');

  // An empty note keeps an annotation that has changes
  await browser('click', '#card-a');
  await browser('snapshot', '-i');
  await browser('keyboard', 'type', 'Temporary');
  await browser('press', 'Control+Enter');
  await browser('click', '#card-a');
  await browser('snapshot', '-i');
  await browser('press', 'Control+a');
  await browser('press', 'Backspace');
  await browser('press', 'Control+Enter');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && saved[0].comment === '' && editText(saved[0]) === 'padding-top:0→10,padding-right:8→18',
    'Saving an empty note keeps an annotation that still has changes');

  // Markdown export lists the changes
  await browser('eval', `(() => { navigator.clipboard.writeText = text => { window.__copied = text; return Promise.resolve(); }; return true; })()`);
  await browser('press', 'c');
  await browser('eval', frames);
  const markdown = JSON.parse(await browser('eval', 'window.__copied ?? ""')) as string;
  assert(markdown.includes('**Changes:**\n- `padding-top: 0px → 10px` (0.625rem)\n- `padding-right: 8px → 18px` (1.125rem)'), 'Markdown lists the changes');

  // The target leaves the page right before release: the release stays kai's, nothing throws
  await resetOpen();
  at = await armEl('#gone');
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'move', String(at[0] + 10), String(at[1]));
  await browser('eval', frames);
  await browser('eval', `(() => {
    document.querySelector('#gone').remove();
    document.body.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: ${at[0] + 20}, clientY: ${at[1]}, bubbles: true, composed: true }));
    return true;
  })()`);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  assert(await browser('get', 'text', '#errors') === '0' && !(await stored()).length, 'A target removed mid-drag ends the drag without an error');


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
