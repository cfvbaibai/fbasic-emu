/**
 * Vite Configuration: Export Runtime Library Build
 *
 * Produces a minimal self-contained JS bundle of the F-BASIC export runtime
 * (parser + executor + renderer + sound + sprites). This IIFE bundle gets
 * inlined into the exported HTML file for standalone execution.
 *
 * Usage: `pnpm build:runtime`
 *
 * The build:
 * - Targets the export runtime entry point (src/core/export-runtime/exportRuntime.ts)
 * - Produces a single IIFE bundle (no ESM — works in a plain <script> tag)
 * - Bundles everything (no externals — must be self-contained)
 * - Tree-shakes unused code (IDE UI, worker infrastructure, Monaco, etc.)
 * - Minifies with esbuild for production size
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

/**
 * Creates the Vite configuration for the export runtime library build.
 *
 * Exported as a named function for testability — tests verify the
 * config structure (IIFE format, no externals, correct entry point).
 */
export function createRuntimeConfig() {
  return defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      lib: {
        entry: fileURLToPath(
          new URL('./src/core/export-runtime/exportRuntime.ts', import.meta.url),
        ),
        name: 'FBasicRuntime',
        formats: ['iife'],
        fileName: () => 'fbasic-runtime.js',
      },
      outDir: 'dist/runtime',
      minify: 'esbuild',
      rollupOptions: {
        // No externals — the bundle must be fully self-contained
        external: [],
      },
    },
  })
}

export default createRuntimeConfig()
