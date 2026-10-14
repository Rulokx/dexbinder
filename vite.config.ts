import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { pwaPlugin } from './build/pwa';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pwaPlugin({ template: here('./build/service-worker.js'), publicDir: here('./public') }),
  ],
  // Relative base so the build works at any path, e.g. https://<user>.github.io/dexbinder/
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
  },
});
