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
          const monacoPrefix = '/node_modules/monaco-editor/esm/vs/'
          const monacoIndex = id.indexOf(monacoPrefix)
          if (monacoIndex >= 0) {
            const monacoPath = id.slice(monacoIndex + monacoPrefix.length)
            const [section, group, subgroup] = monacoPath.split('/')
            if (!section) return undefined

            if (
              monacoPath.startsWith('editor/common/model') ||
              monacoPath.startsWith('editor/common/services') ||
              monacoPath.startsWith('editor/common/languageFeatureRegistry')
            ) {
              return 'monaco-editor-common-model-services'
            }
            if (
              monacoPath.startsWith('editor/browser/editorExtensions') ||
              monacoPath.startsWith('editor/browser/services')
            ) {
              return 'monaco-editor-browser-extensions-services'
            }
            if (
              monacoPath.startsWith('base/browser/ui') ||
              monacoPath.startsWith('base/browser/markdownRenderer')
            ) {
              return 'monaco-base-browser-ui-markdown'
            }
            if (
              monacoPath.startsWith('platform/actions/browser') ||
              monacoPath.startsWith('platform/contextview/browser')
            ) {
              return 'monaco-platform-actions-contextview-browser'
            }

            if (section === 'editor' || section === 'base' || section === 'platform') {
              if (group && subgroup && !subgroup.endsWith('.js')) {
                return `monaco-${section}-${group}-${subgroup}`
              }
              if (group) {
                return `monaco-${section}-${group}`
              }
            }

            return `monaco-${section}`
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
