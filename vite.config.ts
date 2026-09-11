import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const minify = !!process.env.MINIFY;
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __KAI_VERSION__: JSON.stringify(version) },
  // Bookmarklet loads /src/annotator.ts as a module from other origins
  server: { cors: true },
  build: {
    lib: {
      entry: 'src/annotator.ts',
      formats: ['iife'],
      name: 'kai',
      fileName: () => minify ? 'kai.min.js' : 'kai.js',
    },
    emptyOutDir: !minify,
    minify: minify ? 'oxc' : false,
    sourcemap: false,
  },
});
