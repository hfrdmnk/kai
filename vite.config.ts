import { defineConfig } from 'vite';

const minify = !!process.env.MINIFY;

export default defineConfig({
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
