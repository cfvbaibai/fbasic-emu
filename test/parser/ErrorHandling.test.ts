/**
 * Error Handling Parser Tests
 *
 * Tests for parser error handling and invalid syntax detection.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('Parser Error Handling', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  describe('Missing Line Numbers', () => {
    it('should handle missing line number', async () => {
      const result = await parser.parse('PRINT "Hello"')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('Invalid PRINT Syntax', () => {
    it('should handle invalid PRINT syntax', async () => {
      const result = await parser.parse('10 PRINT')
      // Empty PRINT is valid, so this should succeed
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid LET Syntax', () => {
    it('should handle invalid LET syntax - missing equals', async () => {
      const result = await parser.parse('10 LET X 10')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should handle invalid LET syntax - missing value', async () => {
      const result = await parser.parse('10 LET X =')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('Invalid Expressions', () => {
    it('should handle unmatched parentheses', async () => {
      const result = await parser.parse('10 PRINT (10 + 20')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should normalize parser diagnostics when token column is not finite', async () => {
      const result = await parser.parse('10 PALET B 0, 15, 0, 0')
      expect(result.success).toBe(false)

      const firstError = result.errors?.[0]
      expect(firstError).toBeDefined()
      expect(firstError?.message).not.toContain('NaN')

      const start = firstError?.location?.start
      const end = firstError?.location?.end
      expect(Number.isFinite(start?.line)).toBe(true)
      expect(Number.isFinite(start?.column)).toBe(true)
      expect(Number.isFinite(end?.line)).toBe(true)
      expect(Number.isFinite(end?.column)).toBe(true)
    })
  })
})
