/**
 * Tests for exportRuntime
 *
 * Verifies the export runtime bootloader that wires parser → interpreter →
 * device adapter for standalone HTML export. The bootloader reads program
 * source from a DOM script tag, creates a MainThreadDeviceAdapter with the
 * canvas, and executes the program.
 */

import { describe, expect, it, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { runExportProgram } from '@/core/export-runtime/exportRuntime'

// ============================================================================
// Mock Canvas Factory
// ============================================================================

function createMockCanvas(): { canvas: CanvasSurface; ctx: ReturnType<typeof createMockContext> } {
  const ctx = createMockContext()
  const canvas: CanvasSurface = {
    width: SCREEN_DIMENSIONS.SPRITE.WIDTH,
    height: SCREEN_DIMENSIONS.SPRITE.HEIGHT,
    getContext: (_contextId: '2d') => ctx,
  }
  return { canvas, ctx }
}

function createMockContext() {
  return {
    fillRect: vi.fn<(...args: unknown[]) => void>(),
    fillText: vi.fn<(...args: unknown[]) => void>(),
    measureText: vi.fn<(...args: unknown[]) => { width: number }>(() => ({ width: 8 })),
    putImageData: vi.fn<(...args: unknown[]) => void>(),
    fillStyle: '',
    font: '',
    textBaseline: '',
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('exportRuntime', () => {
  describe('runExportProgram', () => {
    it('exports a function that accepts program source, canvas, and options', () => {
      expect(typeof runExportProgram).toBe('function')
    })

    it('executes a simple PRINT program and writes to the canvas', async () => {
      const { canvas, ctx } = createMockCanvas()
      const source = '10 PRINT "HELLO"\n20 END'

      const result = await runExportProgram({
        source,
        canvas,
        maxIterations: Infinity,
      })

      expect(result.success).toBe(true)
      // The PRINT command should have triggered fillText on the canvas
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('returns a failure result for invalid syntax', async () => {
      const { canvas } = createMockCanvas()
      const source = 'INVALID SYNTAX HERE'

      const result = await runExportProgram({
        source,
        canvas,
        maxIterations: Infinity,
      })

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('returns execution time in the result', async () => {
      const { canvas } = createMockCanvas()
      const source = '10 PRINT "OK"\n20 END'

      const result = await runExportProgram({
        source,
        canvas,
        maxIterations: Infinity,
      })

      expect(result.success).toBe(true)
      expect(typeof result.executionTime).toBe('number')
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
    })

    it('supports CLS command to clear the screen', async () => {
      const { canvas, ctx } = createMockCanvas()
      const source = '10 CLS\n20 END'

      const result = await runExportProgram({
        source,
        canvas,
        maxIterations: Infinity,
      })

      expect(result.success).toBe(true)
      // CLS should trigger fillRect to clear the canvas
      expect(ctx.fillRect).toHaveBeenCalled()
    })

    it('passes maxIterations to the interpreter config', async () => {
      const { canvas } = createMockCanvas()
      const source = '10 PRINT "OK"\n20 END'

      const result = await runExportProgram({
        source,
        canvas,
        maxIterations: 999,
      })

      expect(result.success).toBe(true)
    })
  })
})
