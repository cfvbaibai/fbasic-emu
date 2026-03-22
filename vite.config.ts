/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

import { buildNumberPlugin } from './vite-plugin-build-number'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [vue(), buildNumberPlugin()],
  server: {
    host: '127.0.0.1',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Configure Monaco Editor workers
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // NOTE:
          // A prior issue requested splitting Monaco into many chunks to reduce
          // the initial bundle size. However, production builds started
          // throwing "ReferenceError: Cannot access 'z' before initialization"
          // from monaco-base-common-observableInternal, which does not repro in
          // dev server. Rollup warned about circular Monaco chunk graphs, and
          // the error only appears in built preview and GitHub Pages.
          //
          // To keep production stable, we intentionally collapse all Monaco
          // modules into a single "monaco" chunk. This avoids circular chunk
          // ordering/TDZ issues at runtime. If we want to re-split in the
          // future, we should do it with a tested chunk map that does not
          // introduce cycles and verify against built preview + Pages.
          if (id.includes('/node_modules/monaco-editor/esm/vs/')) {
            return 'monaco'
          }
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    pool: 'forks',
    // Vitest 4: poolOptions are now top-level
    singleFork: false,
    maxForks: 4, // Use up to 4 worker processes
    minForks: 2, // Use at least 2 worker processes
    // Enable parallel test execution
    maxConcurrency: 10,
    // Optimize for faster execution
    isolate: true,
  },
})
