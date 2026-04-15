/**
 * Tests for vite.config.runtime
 *
 * Verifies the Vite library build configuration that produces a minimal
 * self-contained JS bundle of the export runtime. The config must:
 * - Target the export runtime entry point
 * - Produce an IIFE format (no ESM — works in a plain <script> tag)
 * - Bundle everything (no externals)
 * - Resolve the @/ alias
 * - Output to dist/runtime
 */

import type { LibraryOptions } from 'vite'
import { describe, expect, it } from 'vitest'

import { createRuntimeConfig } from '../vite.config.runtime'

// ============================================================================
// Tests
// ============================================================================

describe('vite.config.runtime', () => {
  describe('createRuntimeConfig', () => {
    it('exports a function that returns a Vite config object', () => {
      expect(typeof createRuntimeConfig).toBe('function')
    })

    it('returns config with build.lib targeting the export runtime entry point', () => {
      const config = createRuntimeConfig()

      expect(config.build).toBeDefined()
      expect(config.build!.lib).toBeDefined()
      expect(config.build!.lib).not.toBe(false)
      const lib = config.build!.lib as LibraryOptions
      // Normalize path separators for cross-platform compatibility
      const entry = (lib.entry as string).replace(/\\/g, '/')
      expect(entry).toContain('export-runtime/exportRuntime')
    })

    it('configures IIFE output format for plain script tag usage', () => {
      const config = createRuntimeConfig()

      const lib = config.build!.lib as LibraryOptions
      expect(lib.formats).toContain('iife')
    })

    it('does not set external dependencies (bundle must be self-contained)', () => {
      const config = createRuntimeConfig()

      const external = config.build!.rollupOptions?.external
      if (Array.isArray(external)) {
        expect(external).toHaveLength(0)
      } else {
        // undefined is fine — nothing external
        expect(external).toBeUndefined()
      }
    })

    it('resolves the @/ alias to src/', () => {
      const config = createRuntimeConfig()

      expect(config.resolve).toBeDefined()
      expect(config.resolve!.alias).toBeDefined()
      // The alias should map @/ to the src directory
      const alias = config.resolve!.alias as Record<string, string>
      const atAlias = Object.entries(alias).find(([key]) => key === '@')
      expect(atAlias).toBeDefined()
      expect(atAlias![1]).toContain('src')
    })

    it('outputs to dist/runtime directory', () => {
      const config = createRuntimeConfig()

      expect(config.build!.outDir).toContain('runtime')
    })

    it('enables minification for production size', () => {
      const config = createRuntimeConfig()

      expect(config.build!.minify).toBe('esbuild')
    })
  })
})
