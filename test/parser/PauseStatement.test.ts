/**
 * PAUSE Statement Tests
 *
 * Tests for the PAUSE statement in Family Basic.
 */

import { beforeEach, describe, expect, it } from 'vitest'

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
    it('should pause for specified duration', async () => {
      const startTime = Date.now()
      const code = '10 PAUSE 3' // 3 units = ~25ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Should have paused for approximately 3 units = ~25ms (allow tolerance)
      expect(endTime - startTime).toBeGreaterThanOrEqual(15)
      expect(endTime - startTime).toBeLessThan(120)
    })

    it('should pause with numeric literal', async () => {
      const startTime = Date.now()
      const code = '10 PAUSE 2' // 2 units = ~17ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // 2 units = ~17ms, allow some tolerance
      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('should pause with expression', async () => {
      const startTime = Date.now()
      const code = '10 PAUSE 1 + 1' // 2 units = ~17ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // 2 units = ~17ms, allow some tolerance
      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('should pause with variable', async () => {
      const startTime = Date.now()
      const code = `10 LET DURATION = 3
20 PAUSE DURATION` // 3 units = ~25ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // 3 units = ~25ms, allow some tolerance
      expect(endTime - startTime).toBeGreaterThanOrEqual(15)
    })

    it('should handle PAUSE 0 (no delay)', async () => {
      const startTime = Date.now()
      const code = '10 PAUSE 0'
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Should complete almost immediately
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should handle negative duration (no delay)', async () => {
      const startTime = Date.now()
      const code = '10 PAUSE -100'
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Negative duration should be clamped to 0
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should handle multiple PAUSE statements', async () => {
      const startTime = Date.now()
      const code = `10 PAUSE 1
20 PAUSE 1
30 PAUSE 1` // 3 units total = ~25ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Should pause for approximately 3 units = ~25ms total
      expect(endTime - startTime).toBeGreaterThanOrEqual(15)
    })

    it('should work with PAUSE in loops', async () => {
      const startTime = Date.now()
      const code = `10 FOR I = 1 TO 3
20   PAUSE 1
30 NEXT` // 3 iterations * 1 unit = 3 units = ~25ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Should pause 3 times for 1 unit each = 3 units = ~25ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(15)
    })

    it('should work with PAUSE on same line as other statements', async () => {
      const startTime = Date.now()
      const code = `10 PRINT "Before": PAUSE 2: PRINT "After"` // 2 units = ~17ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // 2 units = ~17ms, allow some tolerance
      expect(endTime - startTime).toBeGreaterThanOrEqual(10)
    })

    it('should handle PAUSE with string expression (converts to number)', async () => {
      const startTime = Date.now()
      const code = `10 LET DURATION$ = "3"
20 PAUSE DURATION$` // 3 units = ~25ms
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // String "3" should be converted to number 3 units = ~25ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(15)
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
