import { $ } from 'bun';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createBrowser, extensionDir, requireBuild, root, simulateToolbar } from './browser-harness.ts';

// On-demand video evidence of a representative kai flow: activate, hover, open the editor,
// pick a CSS variable from autocomplete, save, and see the marker. Not part of `bun run check`.
//
//   bun run record               simulated injection: headless Chrome, the real background.js
//                                behind the chrome.* shim (no extension loaded), page clip
//   bun run record --extension   the unpacked dist/extension/ in headed Chrome on Xvfb, opened
//                                with real OS clicks on Chrome's Extensions toolbar menu,
//                                whole-window clip including the toolbar
//
// Clips land in .check-artifacts/recordings/ (or $KAI_RECORD_DIR) with a contact sheet.

await requireBuild();
const extensionMode = process.argv.includes('--extension');
const mode = extensionMode ? 'extension' : 'simulated';
const outDir = process.env.KAI_RECORD_DIR ?? join(root, '.check-artifacts/recordings');
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const clip = join(outDir, `kai-${mode}-${stamp}.mp4`);
const sheet = clip.replace(/\.mp4$/, '-sheet.png');

const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch: () => new Response(`<!doctype html><meta charset="utf-8"><title>kai demo</title>
    <style>
      :root { --demo-accent: #2f6fde; --demo-radius: 12px; }
      body { font: 16px/1.5 system-ui, sans-serif; margin: 0; color: #1d1d1f; }
      main { max-width: 640px; margin: 72px auto; padding: 0 24px; }
      .card { border: 1px solid #ddd; border-radius: var(--demo-radius); padding: 24px; }
      #cta { background: #888; color: white; border: 0; border-radius: 8px; padding: 10px 18px; font: inherit; }
    </style>
    <main>
      <h1 id="title">Pricing</h1>
      <div class="card"><p id="copy">Everything you need to ship feedback to your agent.</p><button id="cta">Start free trial</button></div>
    </main>`, { headers: { 'Content-Type': 'text/html' } }),
});
const url = `http://127.0.0.1:${server.port}/`;
// Typed only up to the prefix, so the saved comment proves Tab accepted the suggestion
const prefix = 'Use --demo-ac';

// Pointer and keyboard for the flow. Simulated mode drives the page through CDP; extension
// mode moves the real X pointer and types through xdotool so the toolbar click is real input.
type Input = {
  moveTo: (selector: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  type: (text: string) => Promise<void>;
  press: (key: 'Tab' | 'Save') => Promise<void>;
};
const pause = (ms: number) => Bun.sleep(ms);

let xvfb: ReturnType<typeof Bun.spawn> | undefined;
let ffmpeg: ReturnType<typeof Bun.spawn> | undefined;
if (extensionMode) {
  for (const tool of ['xdotool', 'ffmpeg']) {
    if (!Bun.which(tool)) throw new Error(`--extension needs ${tool} (sudo apt-get install -y xvfb xdotool ffmpeg)`);
  }
  if (!process.env.DISPLAY) {
    if (!Bun.which('Xvfb')) throw new Error('--extension needs a display: set DISPLAY or install Xvfb');
    // A display another X server holds would put Chrome and xdotool on that server's screen
    const display = Array.from({ length: 100 }, (_, i) => 90 + i)
      .find(n => !existsSync(`/tmp/.X${n}-lock`) && !existsSync(`/tmp/.X11-unix/X${n}`));
    if (display === undefined) throw new Error('No free X display between :90 and :189');
    xvfb = Bun.spawn(['Xvfb', `:${display}`, '-screen', '0', '1440x960x24'], { stdout: 'ignore', stderr: 'pipe' });
    for (let i = 0; i < 50 && !existsSync(`/tmp/.X11-unix/X${display}`) && xvfb.exitCode === null; i++) await pause(100);
    if (!existsSync(`/tmp/.X11-unix/X${display}`)) {
      xvfb.kill();
      throw new Error(`Xvfb :${display} did not start: ${(await new Response(xvfb.stderr as ReadableStream).text()).trim()}`);
    }
    process.env.DISPLAY = `:${display}`;
  }
}

const { browser, evaluate, settle, assert, start, finish } = createBrowser(
  extensionMode ? 'rec-extension' : 'rec-simulated',
  extensionMode ? ['--headed', '--extension', extensionDir] : [],
);
const center = async (selector: string) => {
  const box = Object.fromEntries([...(await browser('get', 'box', selector)).matchAll(/(\w+):\s+([\d.]+)/g)].map(([, k, v]) => [k, Number(v)]));
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

let failures = 0;
try {
  await start(url, { viewport: !extensionMode });
  let input: Input;
  let activate: () => Promise<void>;

  if (!extensionMode) {
    const toolbarClick = await simulateToolbar({ browser, evaluate, settle });
    let at = { x: 640, y: 700 };
    const glide = async (to: { x: number; y: number }) => {
      for (let i = 1; i <= 12; i++) {
        await browser('mouse', 'move', String(Math.round(at.x + (to.x - at.x) * i / 12)), String(Math.round(at.y + (to.y - at.y) * i / 12)));
      }
      at = to;
    };
    input = {
      moveTo: async selector => glide(await center(selector)),
      click: async selector => { await glide(await center(selector)); await browser('click', selector); },
      type: async text => { await browser('keyboard', 'type', text); },
      press: async key => { await browser('press', key === 'Save' ? 'Control+Enter' : key); },
    };
    activate = async () => { await toolbarClick(); };
    await browser('record', 'start', clip, '--cursor');
  } else {
    // Content-to-screen mapping for xdotool; the window has no side borders under bare Xvfb
    const [screenX, screenY, outerWidth, outerHeight, innerHeight] = JSON.parse(
      await browser('eval', '[screenX, screenY, outerWidth, outerHeight, innerHeight]')) as number[];
    const top = screenY + outerHeight - innerHeight;
    const xdo = (...args: string[]) => $`xdotool ${args}`.quiet();
    const glide = async (x: number, y: number) => {
      // xdotool jumps; step it so the clip shows the path and kai sees intermediate moves
      const [fx, fy] = (await $`xdotool getmouselocation --shell`.quiet().text()).match(/X=(\d+)\nY=(\d+)/)!.slice(1).map(Number);
      for (let i = 1; i <= 15; i++) {
        await xdo('mousemove', String(Math.round(fx + (x - fx) * i / 15)), String(Math.round(fy + (y - fy) * i / 15)));
        await pause(16);
      }
    };
    const toScreen = async (selector: string) => {
      const c = await center(selector);
      return { x: Math.round(screenX + c.x), y: Math.round(top + c.y) };
    };
    input = {
      moveTo: async selector => { const p = await toScreen(selector); await glide(p.x, p.y); },
      click: async selector => { const p = await toScreen(selector); await glide(p.x, p.y); await xdo('click', '1'); },
      type: async text => { await xdo('type', '--delay', '70', text); },
      press: async key => { await xdo('key', key === 'Save' ? 'ctrl+Return' : 'Tab'); },
    };
    // Chrome 155's Extensions menu: puzzle button left of the profile and menu buttons, kai's
    // row below it. Coordinates are relative to the window; a Chrome update can move them.
    const puzzle = { x: screenX + outerWidth - 113, y: screenY + 62 };
    activate = async () => {
      await xdo('mousemove', String(screenX + outerWidth / 2), String(top + 40));
      await glide(puzzle.x, puzzle.y);
      await xdo('click', '1');
      await pause(700);
      await glide(puzzle.x - 346, puzzle.y + 147);
      await xdo('click', '1');
      await pause(500);
      await settle();
    };
    ffmpeg = Bun.spawn(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'x11grab', '-framerate', '30',
      '-video_size', `${outerWidth}x${outerHeight}`, '-i', `${process.env.DISPLAY}+${screenX},${screenY}`,
      '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', clip], { stdin: 'pipe', stdout: 'ignore', stderr: 'inherit' });
    await pause(800);
  }

  // The flow, paced so each state is visible in the clip
  await pause(600);
  await activate();
  await assert((await browser('snapshot', '-i')).includes('button "Toggle UI annotator" [expanded=true'),
    `${mode}: ${extensionMode ? 'a real click in Chrome\'s Extensions menu injects kai' : 'the simulated toolbar click injects kai'} and opens it active`);
  await pause(800);
  await input.moveTo('#title');
  await pause(700);
  await input.moveTo('#copy');
  await pause(700);
  await input.click('#cta');
  await settle();
  await pause(600);
  await input.type(prefix);
  await pause(900);
  await assert((await browser('snapshot')).includes('option "--demo-accent'), `${mode}: typing -- lists the page's CSS variables`);
  await input.press('Tab');
  await pause(700);
  await input.type(' for this button');
  await pause(600);
  await input.press('Save');
  await settle();
  await pause(1200);
  const saved = JSON.parse(await browser('eval',
    'JSON.parse(localStorage.getItem(`ui-annotator:${location.origin}${location.pathname}`) ?? "[]")')) as { selector: string; comment: string }[];
  await assert(saved.some(a => a.selector === '#cta' && a.comment === 'Use --demo-accent for this button'),
    `${mode}: the annotation is saved for #cta with the accepted variable (${JSON.stringify(saved.map(a => a.comment))})`);
  await assert((await browser('snapshot', '-i')).includes('button "Annotation: '), `${mode}: a numbered marker appears on the element`);
  await input.moveTo('#title');
  await pause(800);
} finally {
  if (ffmpeg) {
    // An exit code before 'q' means ffmpeg stopped early, e.g. a capture area off the screen
    if (ffmpeg.exitCode !== null) console.log(`ffmpeg exited early with code ${ffmpeg.exitCode}`);
    ffmpeg.stdin!.write('q');
    ffmpeg.stdin!.end();
    await ffmpeg.exited;
  } else {
    await browser('record', 'stop').catch(err => console.log(`record stop failed: ${(err as Error).message.trim()}`));
  }
  failures = await finish();
  xvfb?.kill();
  server.stop(true);
}

if (!await Bun.file(clip).exists()) throw new Error(`No clip was recorded at ${clip}`);
const duration = Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${clip}`.nothrow().quiet().text()).trim());
if (!(duration > 1)) throw new Error(`${clip} is not a playable recording (duration ${duration || 'unknown'})`);
// 20 evenly spaced frames on one sheet, to check the whole clip without playing it
await $`ffmpeg -loglevel error -y -i ${clip} -vf fps=${20 / duration},scale=480:-1,tile=4x5:padding=4 -frames:v 1 ${sheet}`.quiet();
console.log(`clip: ${clip}\nsheet: ${sheet}`);
if (failures) throw new Error(`${failures} recording checks failed`);
