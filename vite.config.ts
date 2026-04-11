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
    include: ['test/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    pool: 'threads',
    maxWorkers: 4, // Vitest 4: unified worker config for threads pool
    // Enable parallel test execution
    maxConcurrency: 10,
    // Optimize for faster execution
    isolate: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        // === Non-code files ===
        // F-BASIC sample programs — data files, not testable TypeScript
        'src/core/samples/programs/**',
        // i18n locale JSON files — static translations
        'src/shared/i18n/locales/**',
        // Type declaration files
        '**/*.d.ts',
        // Styles and fonts
        'src/shared/styles/**',

        // === Type/interface-only files — no runtime logic ===
        'src/core/types/**',
        'src/core/interfaces.ts',
        'src/core/interfaces/**',
        'src/core/animation/BufferTypes.ts',
        'src/core/animation/sharedDisplayBufferTypes.ts',
        'src/core/evaluation/interfaces.ts',
        'src/core/sprite/types.ts',
        'src/shared/types/**',
        'src/shared/data/types.ts',
        'src/shared/i18n/types.ts',
        'src/core/sound/types.ts',

        // === Barrel index files — just re-exports ===
        'src/core/devices/index.ts',
        'src/core/execution/index.ts',
        'src/core/sound/index.ts',
        'src/shared/data/bg/index.ts',

        // === Worker entry points — require Worker runtime context ===
        'src/core/workers/animation-worker.ts',
        'src/core/workers/WebWorkerInterpreter.ts',

        // === App entry points — bootstrap, not unit-testable ===
        'src/main.ts',
        'src/App.vue',
        'src/buildInfo.ts',
        'src/router/**',

        // === UI component library — pure presentational, owned by Playwright E2E ===
        // (per testing-strategy.md: Playwright E2E Owns UI chrome)
        'src/shared/components/ui/**',
        'src/shared/components/GameNavigation.vue',
        'src/shared/components/ErrorBoundary.vue',
        'src/shared/components/LoadingBanner.vue',

        // === Browser-only device adapter ===
        // Requires SharedArrayBuffer, AudioContext, Worker APIs
        'src/core/devices/WebWorkerDeviceAdapter.ts',

        // === IDE feature — browser-only composables and integrations ===
        // Tightly coupled to Web APIs (Canvas, Audio, Web Workers, Monaco)
        'src/features/ide/composables/**',
        'src/features/ide/integrations/**',
        'src/features/ide/IdePage.vue',
        'src/features/ide/components/Screen.vue',
        'src/features/ide/components/ScreenTab.vue',
        'src/features/ide/components/DebugGridOverlay.vue',
        'src/features/ide/components/ActivePaletteDisplay.vue',
        'src/features/ide/components/Dpad.vue',
        'src/features/ide/components/JoystickStatusTable.vue',
        'src/features/ide/components/JoystickKeybindingPanel.vue',
        'src/features/ide/components/ManualActionButton.vue',
        'src/features/ide/components/LoadingPanel.vue',
        'src/features/ide/components/ProgramToolbar.vue',
        'src/features/ide/components/CommandPalette.vue',
        'src/features/ide/components/IdeBottomArea.vue',
        'src/features/ide/components/IdeOutputPanel.vue',
        'src/features/ide/components/IdeSpriteViewerPanel.vue',
        'src/features/ide/components/MonacoCodeEditor.vue',
        'src/features/ide/components/CodeEditor.vue',
        'src/features/ide/errors/**',

        // === BG editor — canvas-based, owned by Playwright E2E ===
        'src/features/bg-editor/**',

        // === Sprite viewer — canvas-based UI tool, owned by Playwright E2E ===
        'src/features/sprite-viewer/**',

        // === Monaco editor — third-party integration, owned by Playwright E2E ===
        'src/features/monaco-editor/**',

        // === Feature pages — page-level routing, owned by Playwright E2E ===
        'src/features/home/**',
        'src/features/konva-test/**',
        'src/features/sound-test/**',
        'src/features/testing/**',
        'src/features/diagnostics/**',
        'src/features/error/**',

        // === Shared browser-only composables ===
        'src/shared/composables/**',
        'src/shared/components/composables/**',

        // === Browser-only or E2E-owned utility files ===
        'src/shared/utils/fileIO.ts',
        'src/shared/utils/reloadPage.ts',
        'src/shared/utils/colorClassification.ts',
      ],
    },
  },
})
