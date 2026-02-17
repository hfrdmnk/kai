import { defineConfig } from 'vite';

const minify = !!process.env.MINIFY;

export default defineConfig({
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
