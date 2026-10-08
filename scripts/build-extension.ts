import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const out = join(root, 'dist/extension');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'extension/manifest.json'), 'utf8'));

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'extension'), out, { recursive: true, filter: (src) => !src.endsWith('.svg') });
cpSync(join(root, 'dist/kai.js'), join(out, 'kai.js'));
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ ...manifest, version }, null, 2) + '\n');

console.log(`extension ${version} → dist/extension/`);
