/**
 * PAUSE Statement Tests
 *
 * Tests for the PAUSE statement in Family Basic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { FBasicParser } from '@/core/parser/FBasicParser'

describe('PAUSE Statement', () => {
  let interpreter: BasicInterpreter

  beforeEach(() => {
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Parser Tests', () => {
    it('should parse PAUSE statement with numeric literal', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse('10 PAUSE 1000')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
    })

    it('should parse PAUSE statement with expression', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse('10 PAUSE 500 + 500')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
    })

    it('should parse PAUSE statement with variable', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse(`10 LET X = 200
20 PAUSE X`)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
    })
  })

  describe('Execution Tests', () => {
    async function executeWithCapturedTimeouts(code: string): Promise<number[]> {
      const durations: number[] = []

      vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback: TimerHandler, delay?: number) => {
        durations.push(typeof delay === 'number' ? delay : 0)
        if (typeof callback === 'function') {
          callback()
        }
        return {} as ReturnType<typeof setTimeout>
      })

      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      return durations.filter((duration) => duration > 1)
    }

    it('should pause for specified duration', async () => {
      const durations = await executeWithCapturedTimeouts('10 PAUSE 3')
      expect(durations).toContainEqual(expect.closeTo(36.36, 1))
    })

    it('should pause with numeric literal', async () => {
      const durations = await executeWithCapturedTimeouts('10 PAUSE 2')
      expect(durations).toContainEqual(expect.closeTo(24.24, 1))
    })

    it('should pause with expression', async () => {
      const durations = await executeWithCapturedTimeouts('10 PAUSE 1 + 1')
      expect(durations).toContainEqual(expect.closeTo(24.24, 1))
    })

    it('should pause with variable', async () => {
      const durations = await executeWithCapturedTimeouts(`10 LET DURATION = 3
20 PAUSE DURATION`)
      expect(durations).toContainEqual(expect.closeTo(36.36, 1))
    })

    it('should handle PAUSE 0 (no delay)', async () => {
      const durations = await executeWithCapturedTimeouts('10 PAUSE 0')
      expect(durations).toHaveLength(0)
    })

    it('should handle negative duration (no delay)', async () => {
      const durations = await executeWithCapturedTimeouts('10 PAUSE -100')
      expect(durations).toHaveLength(0)
    })

    it('should handle multiple PAUSE statements', async () => {
      const durations = await executeWithCapturedTimeouts(`10 PAUSE 1
20 PAUSE 1
30 PAUSE 1`)
      expect(durations).toHaveLength(3)
      expect(durations.every((duration) => Math.abs(duration - 12.12) < 0.5)).toBe(true)
    })

    it('should work with PAUSE in loops', async () => {
      const durations = await executeWithCapturedTimeouts(`10 FOR I = 1 TO 3
20   PAUSE 1
30 NEXT`)
      expect(durations).toHaveLength(3)
      expect(durations.every((duration) => Math.abs(duration - 12.12) < 0.5)).toBe(true)
    })

    it('should work with PAUSE on same line as other statements', async () => {
      const durations = await executeWithCapturedTimeouts(`10 PRINT "Before": PAUSE 2: PRINT "After"`)
      expect(durations).toContainEqual(expect.closeTo(24.24, 1))
    })

    it('should handle PAUSE with string expression (converts to number)', async () => {
      const durations = await executeWithCapturedTimeouts(`10 LET DURATION$ = "3"
20 PAUSE DURATION$`)
      expect(durations).toContainEqual(expect.closeTo(36.36, 1))
    })

    it('should reject floating point literals', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse('10 PAUSE 50.7')

      // Floating point literals should be rejected by the parser
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })
})
