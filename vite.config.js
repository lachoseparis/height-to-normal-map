import { defineConfig } from 'vite'

export default defineConfig({
  root: 'lib',
  build: {
    outDir: '../files',
    emptyOutDir: true
  }
});