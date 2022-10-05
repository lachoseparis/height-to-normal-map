import { defineConfig } from 'vite';

export default defineConfig({
  root: 'lib',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
