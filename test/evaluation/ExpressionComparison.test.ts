/**
 * Expression Comparison Unit Tests
 *
 * Direct tests for compareValues() and isNumericString() helpers.
 * Integration tests for mixed-type comparisons are in RelationalOperators.test.ts.
 */

import { describe, expect, it } from 'vitest'

import { compareValues, isNumericString } from '@/core/evaluation/ExpressionComparison'

describe('isNumericString', () => {
  it('should return true for positive integer strings', () => {
    expect(isNumericString('42')).toBe(true)
    expect(isNumericString('0')).toBe(true)
    expect(isNumericString('100')).toBe(true)
  })

  it('should return true for negative integer strings', () => {
    expect(isNumericString('-1')).toBe(true)
    expect(isNumericString('-42')).toBe(true)
  })

  it('should return true for decimal strings', () => {
    expect(isNumericString('3.14')).toBe(true)
    expect(isNumericString('0.5')).toBe(true)
    expect(isNumericString('-3.14')).toBe(true)
    expect(isNumericString('-0.5')).toBe(true)
    expect(isNumericString('10.0')).toBe(true)
  })

  it('should return false for non-numeric strings', () => {
    expect(isNumericString('hello')).toBe(false)
    expect(isNumericString('')).toBe(false)
    expect(isNumericString('abc123')).toBe(false)
    expect(isNumericString('12abc')).toBe(false)
  })

  it('should return false for numbers', () => {
    expect(isNumericString(42)).toBe(false)
    expect(isNumericString(0)).toBe(false)
    expect(isNumericString(-1)).toBe(false)
  })

  it('should return false for strings with leading/trailing whitespace', () => {
    expect(isNumericString(' 42')).toBe(false)
    expect(isNumericString('42 ')).toBe(false)
    expect(isNumericString(' 42 ')).toBe(false)
  })

  it('should return false for strings with multiple decimal points', () => {
    expect(isNumericString('1.2.3')).toBe(false)
  })

  it('should return false for strings with only a decimal point', () => {
    expect(isNumericString('.5')).toBe(false)
    expect(isNumericString('-.5')).toBe(false)
    expect(isNumericString('.')).toBe(false)
  })
})

describe('compareValues', () => {
  describe('number vs number', () => {
    it('should compare equal numbers', () => {
      expect(compareValues(5, 5, '=')).toBe(-1)
      expect(compareValues(5, 5, '<>')).toBe(0)
    })

    it('should compare unequal numbers', () => {
      expect(compareValues(3, 5, '=')).toBe(0)
      expect(compareValues(3, 5, '<>')).toBe(-1)
      expect(compareValues(3, 5, '<')).toBe(-1)
      expect(compareValues(5, 3, '>')).toBe(-1)
    })
  })

  describe('string vs string', () => {
    it('should compare strings lexicographically', () => {
      expect(compareValues('abc', 'abc', '=')).toBe(-1)
      expect(compareValues('abc', 'def', '<')).toBe(-1)
      expect(compareValues('def', 'abc', '>')).toBe(-1)
    })
  })

  describe('numeric string vs number', () => {
    it('should compare integer string with number numerically', () => {
      expect(compareValues('42', 42, '=')).toBe(-1)
      expect(compareValues('42', 99, '<')).toBe(-1)
      expect(compareValues('42', 10, '>')).toBe(-1)
    })

    it('should compare decimal string with number numerically', () => {
      expect(compareValues('3.14', 3, '>')).toBe(-1)
      expect(compareValues('3.14', 4, '<')).toBe(-1)
      expect(compareValues('3.14', 3.14, '=')).toBe(-1)
    })

    it('should compare negative string with number', () => {
      expect(compareValues('-5', 0, '<')).toBe(-1)
      expect(compareValues('-3.14', -3, '<')).toBe(-1)
    })

    it('should compare number with numeric string (reversed operands)', () => {
      expect(compareValues(42, '42', '=')).toBe(-1)
      expect(compareValues(10, '42', '<')).toBe(-1)
      expect(compareValues(99, '42', '>')).toBe(-1)
    })

    it('should detect lexicographic-vs-numeric ordering mismatch', () => {
      // Lexicographically "10" < "5" (because '1' < '5'), but numerically 10 > 5
      expect(compareValues('10', 5, '>')).toBe(-1)
      // Lexicographically "9" > "10" (because '9' > '1'), but numerically 9 < 10
      expect(compareValues('9', 10, '<')).toBe(-1)
    })
  })

  describe('non-numeric string vs number', () => {
    it('should fall back to lexicographic comparison', () => {
      // "hello" vs String(0) = "hello" vs "0"
      expect(compareValues('hello', 0, '<>')).toBe(-1)
      expect(compareValues('hello', 0, '=')).toBe(0)
    })
  })
})
