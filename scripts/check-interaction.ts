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
        <div id="box-parent" style="display:flex;gap:12px;padding:8px"><button id="box-child" style="margin:4px;padding:6px 10px">Box child</button><button>Two</button></div>
        <div id="rotated" style="width:40px;height:40px;padding:20px;margin:40px;transform:rotate(45deg);background:#ccc"></div>
        <!-- No ids: the generated selector matches both twins, so an adjustment changes both -->
        <section><div class="twin"><div class="row"><div class="body"><p class="t" style="margin:0;padding:4px">Twin A</p></div></div></div></section>
        <section><div class="twin"><div class="row"><div class="body"><p class="t" style="margin:0;padding:4px">Twin B</p></div></div></div></section>
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
    { selector: string; comment: string; edits?: { property: string; from: number; to: number }[] }[];
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
  assert(saved.length === 1 && saved[0].comment === 'padding-right: 4px → 14px (0.875rem)'
    && saved[0].edits?.length === 1 && saved[0].edits[0].property === 'padding-right' && saved[0].edits[0].from === 4 && saved[0].edits[0].to === 14
    && (await twinPadding()).join() === '14px,14px', 'Release creates an annotation with the edit and its comment line');
  assert(!(await browser('snapshot', '-i')).includes('Annotation comment'), 'Releasing a drag does not open the annotation editor');

  at = await armTwin('p');
  await browser('mouse', 'down', 'left');
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  assert(!(await browser('snapshot', '-i')).includes('Annotation comment') && (await twinPadding()).join() === '14px,14px'
    && (await stored())[0].comment === saved[0].comment, 'A press without movement changes nothing and opens no editor');

  at = await armTwin('p');
  await dragRight(at, 10);
  await browser('mouse', 'up', 'left');
  await browser('eval', frames);
  saved = await stored();
  assert(saved.length === 1 && saved[0].comment === 'padding-right: 4px → 19px (1.188rem)', 'A second drag extends the same annotation, keeping the original value');

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
  assert(saved.length === 1 && saved[0].comment === 'Just a note' && !saved[0].edits && (await twinPadding()).join() === '4px,4px',
    'Removing an edit\'s line from the comment drops the edit and its style');

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
  assert(saved.length === 1 && saved[0].selector === '#box-parent' && saved[0].comment === 'column-gap: 12px → 20px (1.25rem)',
    'G adjusts the nearest flex container\'s main-axis gap');
  await browser('press', 'Backspace');
  await browser('press', 'Backspace');
  await browser('eval', frames);
  assert(await browser('eval', `getComputedStyle(document.querySelector('#box-parent')).columnGap`) === '"12px"', 'Clear all reverts every edit');

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
