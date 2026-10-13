import { $ } from 'bun';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Shared plumbing for the agent-browser checks. Each check serves its own pages and
// drives the packaged build in dist/extension/, never kai's private UI state.

export const root = join(import.meta.dir, '..');
export const extensionDir = join(root, 'dist/extension');
const artifacts = process.env.KAI_CHECK_ARTIFACTS ?? join(root, '.check-artifacts');

/** Throws unless the file a check drives exists, i.e. the build ran. */
export const requireBuild = async (file = join(extensionDir, 'kai.js')) => {
  if (!await Bun.file(file).exists()) throw new Error(`${file} is missing. Run bun run build first.`);
};
if (!Bun.which('agent-browser')) {
  throw new Error('agent-browser is not on PATH. Install it with `npm i -g agent-browser@0.38.1 && agent-browser install`.');
}

/** `launch` flags (e.g. `--headed`) go on every command, or agent-browser relaunches Chrome. */
export const createBrowser = (name: string, launch: string[] = []) => {
  // Short, unique names keep the daemon's socket path under its limit and runs independent
  const session = `${name}-${process.pid}`;
  let failures = 0;
  let screenshots = 0;

  const browser = async (...args: string[]) => (await $`agent-browser --session ${session} ${launch} ${args}`.quiet()).text().trim();

  /** Evaluates a script of any size in the page through CDP, like the extension's MAIN-world injection. */
  const evaluate = async (source: string): Promise<unknown> => {
    const proc = Bun.spawn(['agent-browser', '--session', session, ...launch, '--json', 'eval', '--stdin'], {
      stdin: new Blob([source]), stdout: 'pipe', stderr: 'pipe',
    });
    const out = JSON.parse(await new Response(proc.stdout).text() || '{}');
    await proc.exited;
    if (!out.success) throw new Error(out.error ?? 'agent-browser eval failed');
    return out.data.result;
  };

  // Kai focuses its editor and restores focus in animation frames. agent-browser can send the
  // next command within the same frame as a click, faster than any person, so wait for them.
  const frames = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))';
  const settle = () => browser('eval', frames);

  const assert = async (condition: boolean, message: string) => {
    console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`);
    if (condition) return;
    failures++;
    mkdirSync(artifacts, { recursive: true });
    const file = join(artifacts, `${name}-${++screenshots}-${message.replace(/\W+/g, '-').slice(0, 60)}.png`);
    await browser('screenshot', file).then(() => console.log(`     screenshot: ${file}`), () => {});
  };

  const start = async (url: string, { viewport = true } = {}) => {
    await browser('open', url);
    if (viewport) await browser('set', 'viewport', '1280', '800', '2');
    const version = (await $`agent-browser --version`.quiet().text()).trim();
    const chrome = await evaluate(`navigator.userAgentData.getHighEntropyValues(['uaFullVersion']).then(v => v.uaFullVersion)`);
    console.log(`# ${name}: ${version}, Chrome ${chrome}`);
  };

  const finish = async () => {
    await browser('close').catch(() => {});
    return failures;
  };

  return { browser, evaluate, frames, settle, assert, start, finish, session };
};

type Driver = Pick<ReturnType<typeof createBrowser>, 'browser' | 'evaluate' | 'settle'>;

/**
 * Loads the real dist/extension/background.js against a small chrome.* shim and returns a
 * toolbar click. executeScript evaluates through CDP which, like the extension's MAIN-world
 * injection, bypasses the page's CSP for the injection while kai's own code runs under it.
 * This is simulated injection: no extension is loaded, so the toolbar button, the keyboard
 * command and activeTab/scripting permissions are not exercised. Call once per process.
 */
export const simulateToolbar = async ({ browser, evaluate, settle }: Driver) => {
  let badge = '';
  let onClicked: ((tab: { id: number; url: string }) => Promise<void>) | undefined;
  Object.assign(globalThis, {
    chrome: {
      action: {
        onClicked: { addListener: (listener: typeof onClicked) => { onClicked = listener; } },
        setBadgeText: async ({ text }: { text: string }) => { badge = text; },
        setTitle: async () => {},
      },
      scripting: {
        executeScript: async ({ world, func, files }: { world: string; func?: () => unknown; files?: string[] }) => {
          if (world !== 'MAIN') throw new Error(`kai must run in the MAIN world, got ${world}`);
          const source = files
            ? (await Promise.all(files.map(file => Bun.file(join(extensionDir, file)).text()))).join('\n')
            : `(${func})()`;
          try {
            return [{ result: await evaluate(source) }];
          } catch (err) {
            // Chrome reports errors thrown in the page as a missing result, not a rejection
            console.log(`     page threw: ${(err as Error).message.split('\n')[0]}`);
            return [{ result: undefined }];
          }
        },
      },
    },
  });
  await import(join(extensionDir, 'background.js'));
  if (!onClicked) throw new Error('background.js registered no action click listener');

  /** Clicks the simulated toolbar icon; true when the extension shows no failure badge. */
  return async () => {
    await onClicked!({ id: 1, url: await browser('get', 'url') });
    await settle();
    return badge === '';
  };
};
