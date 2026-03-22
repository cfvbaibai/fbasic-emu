/**
 * normalizeLocationValue Unit Tests
 *
 * Tests for the parser diagnostic coordinate normalization helper.
 * Ensures robust handling of edge cases from the underlying Chevrotain parser.
 *
 * @see https://github.com/cfvbaibai/fbasic-ide/issues/84
 */

import { describe, expect, it } from 'vitest'

import { normalizeLocationValue } from '@/core/parser/normalizeLocationValue'

describe('normalizeLocationValue', () => {
  describe('fallback for invalid inputs', () => {
    it('should return default fallback for undefined input', () => {
      expect(normalizeLocationValue(undefined)).toEqual(1)
    })

    it('should return default fallback for NaN input', () => {
      expect(normalizeLocationValue(NaN)).toEqual(1)
    })

    it('should return default fallback for Infinity input', () => {
      expect(normalizeLocationValue(Infinity)).toEqual(1)
    })

    it('should return default fallback for -Infinity input', () => {
      expect(normalizeLocationValue(-Infinity)).toEqual(1)
    })
  })

  describe('minimum value enforcement', () => {
    it('should return fallback for zero', () => {
      expect(normalizeLocationValue(0)).toEqual(1)
    })

    it('should return fallback for negative numbers', () => {
      expect(normalizeLocationValue(-1)).toEqual(1)
    })

    it('should return fallback for large negative numbers', () => {
      expect(normalizeLocationValue(-100)).toEqual(1)
    })

    it('should return fallback for decimal values below 1', () => {
      expect(normalizeLocationValue(0.5)).toEqual(1)
    })

    it('should return fallback for 0.9999 boundary value', () => {
      expect(normalizeLocationValue(0.9999)).toEqual(1)
    })
  })

  describe('flooring of decimal values', () => {
    it('should floor positive decimal values', () => {
      expect(normalizeLocationValue(3.7)).toEqual(3)
    })

    it('should floor positive decimal values with small fractional part', () => {
      expect(normalizeLocationValue(3.2)).toEqual(3)
    })

    it('should floor large decimal values', () => {
      expect(normalizeLocationValue(100.9)).toEqual(100)
    })

    it('should handle exact integer as float', () => {
      expect(normalizeLocationValue(5.0)).toEqual(5)
    })
  })

  describe('passthrough of valid positive integers', () => {
    it('should pass through 1', () => {
      expect(normalizeLocationValue(1)).toEqual(1)
    })

    it('should pass through 5', () => {
      expect(normalizeLocationValue(5)).toEqual(5)
    })

    it('should pass through large positive integers', () => {
      expect(normalizeLocationValue(999)).toEqual(999)
    })
  })

  describe('boundary at 1.0', () => {
    it('should return 1 for exactly 1.0', () => {
      expect(normalizeLocationValue(1.0)).toEqual(1)
    })

    it('should return fallback for just below 1.0', () => {
      expect(normalizeLocationValue(0.999999)).toEqual(1)
    })
  })

  describe('custom fallback value', () => {
    it('should return custom fallback for undefined input', () => {
      expect(normalizeLocationValue(undefined, 10)).toEqual(10)
    })

    it('should return custom fallback for NaN input', () => {
      expect(normalizeLocationValue(NaN, 10)).toEqual(10)
    })

    it('should return custom fallback for zero with custom fallback', () => {
      expect(normalizeLocationValue(0, 5)).toEqual(5)
    })

    it('should return custom fallback for negative with custom fallback', () => {
      expect(normalizeLocationValue(-3, 7)).toEqual(7)
    })

    it('should ignore custom fallback when input is valid', () => {
      expect(normalizeLocationValue(5, 10)).toEqual(5)
    })
  })
})
