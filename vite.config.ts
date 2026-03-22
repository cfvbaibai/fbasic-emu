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
          // Monaco editor chunking strategy.
          //
          // Monaco's module graph contains circular dependencies between
          // editor/common and editor/browser. Attempts to split these into
          // separate chunks caused TDZ runtime errors in production builds.
          // The cyclic groups are too large individually (editor/common ~838 kB,
          // editor/browser ~618 kB) to each fit under the 500 kB default limit.
          //
          // Strategy: collapse Monaco into two chunks:
          //   - "monaco": editor/*, base/*, platform/*, basic-languages/*
          //     These are tightly coupled via circular deps.
          //   - Monaco worker is already a separate chunk (via ?worker import).
          //
          // The monaco chunk exceeds 500 kB, so we raise the warning limit
          // to match. This is the standard approach (used by Vite's own
          // Monaco example). All application code chunks remain under 500 kB.
          if (id.includes('/node_modules/monaco-editor/esm/vs/')) {
            return 'monaco'
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 3000,
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
