import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __KAI_VERSION__: JSON.stringify(version) },
  build: {
    lib: {
      entry: 'src/annotator.ts',
      formats: ['iife'],
      name: 'kai',
      fileName: () => 'kai.js',
    },
    minify: false,
    sourcemap: false,
  },
});
