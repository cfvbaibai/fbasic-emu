/**
 * ExpressionEvaluator Comparison & Logical Tests
 *
 * Tests for comparison operators (=, <>, <, >, <=, >=), logical/bitwise
 * operators (NOT, AND, OR, XOR), and int16 truncation behavior.
 */

 

import type { CstNode } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getFirstCstNode } from '@/core/parser/cst-helpers'
import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'
import { ExecutionContext } from '@/core/state/ExecutionContext'

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a minimal ExecutionContext for evaluation tests. */
function createContext(): ExecutionContext {
  const deviceAdapter = new TestDeviceAdapter()
  const ctx = new ExecutionContext({
    maxIterations: 1000,
    maxOutputLines: 100,
    enableDebugMode: false,
    strictMode: false,
    deviceAdapter,
  })
  ctx.deviceAdapter = deviceAdapter
  return ctx
}

/**
 * Parse a LET statement and extract the expression CST node from it.
 * Input: just the expression portion (e.g. "5 + 3", "NOT 0", "A AND B")
 * Wraps it in "10 LET X = <expr>" for valid parsing.
 */
function parseExpression(expr: string): CstNode {
  const code = `10 LET X = ${expr}`
  const result = parseWithChevrotain(code)
  if (!result.success || !result.cst) {
    throw new Error(`Parse failed for expression "${expr}": ${JSON.stringify(result.errors)}`)
  }

  // Navigate CST: program -> statement -> commandList -> command -> singleCommand -> letStatement -> expression
  const statements = result.cst.children.statement
  if (!statements || statements.length === 0) {
    throw new Error('No statements found in parsed CST')
  }
  const statementCst = statements[0] as CstNode
  const commandListCst = getFirstCstNode(statementCst.children.commandList)
  if (!commandListCst) {
    throw new Error('No commandList in statement')
  }
  const commandCst = getFirstCstNode(commandListCst.children.command)
  if (!commandCst) {
    throw new Error('No command in commandList')
  }
  const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
  if (!singleCommandCst) {
    throw new Error('No singleCommand in command')
  }
  const letStmtCst = getFirstCstNode(singleCommandCst.children.letStatement)
  if (!letStmtCst) {
    throw new Error('No letStatement in singleCommand')
  }
  const exprCst = getFirstCstNode(letStmtCst.children.expression)
  if (!exprCst) {
    throw new Error('No expression in letStatement')
  }
  return exprCst
}

/**
 * Evaluate a BASIC expression string and return the result.
 * Creates a fresh context and evaluator each time.
 */
function evaluate(expr: string, context?: ExecutionContext): number | string {
  const ctx = context ?? createContext()
  const evaluator = new ExpressionEvaluator(ctx)
  const exprCst = parseExpression(expr)
  return evaluator.evaluateExpression(exprCst)
}

// ============================================================================
// Tests
// ============================================================================

describe('ExpressionEvaluator', () => {

  // ==========================================================================
  // Comparison Operators
  // ==========================================================================

  describe('Comparison Operators', () => {
    it('should evaluate equal numbers as -1 (true)', () => {
      expect(evaluate('5 = 5')).toBe(-1)
    })

    it('should evaluate unequal numbers as 0 (false)', () => {
      expect(evaluate('5 = 3')).toBe(0)
    })

    it('should evaluate not-equal for different numbers as -1', () => {
      expect(evaluate('5 <> 3')).toBe(-1)
    })

    it('should evaluate not-equal for same numbers as 0', () => {
      expect(evaluate('5 <> 5')).toBe(0)
    })

    it('should evaluate less-than as -1 when left < right', () => {
      expect(evaluate('3 < 5')).toBe(-1)
    })

    it('should evaluate less-than as 0 when left >= right', () => {
      expect(evaluate('5 < 3')).toBe(0)
    })

    it('should evaluate less-than as 0 when equal', () => {
      expect(evaluate('5 < 5')).toBe(0)
    })

    it('should evaluate greater-than as -1 when left > right', () => {
      expect(evaluate('5 > 3')).toBe(-1)
    })

    it('should evaluate greater-than as 0 when left <= right', () => {
      expect(evaluate('3 > 5')).toBe(0)
    })

    it('should evaluate less-or-equal as -1 when equal', () => {
      expect(evaluate('5 <= 5')).toBe(-1)
    })

    it('should evaluate less-or-equal as -1 when less', () => {
      expect(evaluate('3 <= 5')).toBe(-1)
    })

    it('should evaluate less-or-equal as 0 when greater', () => {
      expect(evaluate('5 <= 3')).toBe(0)
    })

    it('should evaluate greater-or-equal as -1 when equal', () => {
      expect(evaluate('5 >= 5')).toBe(-1)
    })

    it('should evaluate greater-or-equal as -1 when greater', () => {
      expect(evaluate('5 >= 3')).toBe(-1)
    })

    it('should evaluate greater-or-equal as 0 when less', () => {
      expect(evaluate('3 >= 5')).toBe(0)
    })

    it('should compare strings lexicographically for equality', () => {
      expect(evaluate('"abc" = "abc"')).toBe(-1)
    })

    it('should compare strings lexicographically for inequality', () => {
      expect(evaluate('"abc" = "def"')).toBe(0)
    })

    it('should compare strings with less-than', () => {
      expect(evaluate('"abc" < "def"')).toBe(-1)
    })

    it('should compare strings with greater-than', () => {
      expect(evaluate('"def" > "abc"')).toBe(-1)
    })
  })

  // ==========================================================================
  // Logical / Bitwise Operators
  // ==========================================================================

  describe('NOT Operator', () => {
    it('should bitwise-NOT zero to -1', () => {
      expect(evaluate('NOT 0')).toBe(-1)
    })

    it('should bitwise-NOT -1 to 0', () => {
      expect(evaluate('NOT -1')).toBe(0)
    })

    it('should bitwise-NOT 1 to -2', () => {
      // ~1 in 16-bit = 0xFFFE = -2
      expect(evaluate('NOT 1')).toBe(-2)
    })
  })

  describe('AND Operator (Logical)', () => {
    it('should AND -1 and -1 to -1 (true AND true)', () => {
      // -1 & -1 in int16 = -1
      expect(evaluate('-1 AND -1')).toBe(-1)
    })

    it('should AND -1 and 0 to 0 (true AND false)', () => {
      expect(evaluate('-1 AND 0')).toBe(0)
    })

    it('should AND 0 and 0 to 0 (false AND false)', () => {
      expect(evaluate('0 AND 0')).toBe(0)
    })

    it('should AND with comparison results', () => {
      // (5 > 0) AND (10 > 0) = -1 AND -1 = -1
      expect(evaluate('(5 > 0) AND (10 > 0)')).toBe(-1)
    })

    it('should AND with mixed comparison results', () => {
      // (5 > 0) AND (0 > 10) = -1 AND 0 = 0
      expect(evaluate('(5 > 0) AND (0 > 10)')).toBe(0)
    })
  })

  describe('OR Operator (Logical)', () => {
    it('should OR 0 and 0 to 0 (false OR false)', () => {
      expect(evaluate('0 OR 0')).toBe(0)
    })

    it('should OR -1 and 0 to -1 (true OR false)', () => {
      expect(evaluate('-1 OR 0')).toBe(-1)
    })

    it('should OR with comparison results', () => {
      // (0 > 5) OR (10 > 0) = 0 OR -1 = -1
      expect(evaluate('(0 > 5) OR (10 > 0)')).toBe(-1)
    })
  })

  describe('XOR Operator (Logical)', () => {
    it('should XOR -1 and 0 to -1 (true XOR false)', () => {
      expect(evaluate('-1 XOR 0')).toBe(-1)
    })

    it('should XOR -1 and -1 to 0 (true XOR true)', () => {
      expect(evaluate('-1 XOR -1')).toBe(0)
    })

    it('should XOR with comparison results', () => {
      // (5 > 0) XOR (0 > 10) = -1 XOR 0 = -1
      expect(evaluate('(5 > 0) XOR (0 > 10)')).toBe(-1)
    })
  })

  // ==========================================================================
  // Bitwise Operator Layer
  // ==========================================================================

  describe('Bitwise Operators (non-logical context)', () => {
    it('should perform bitwise AND on numbers', () => {
      // 12 AND 10 = 8 (1100 AND 1010 = 1000)
      expect(evaluate('12 AND 10')).toBe(8)
    })

    it('should perform bitwise OR on numbers', () => {
      // 12 OR 10 = 14 (1100 OR 1010 = 1110)
      expect(evaluate('12 OR 10')).toBe(14)
    })

    it('should perform bitwise XOR on numbers', () => {
      // 12 XOR 10 = 6 (1100 XOR 1010 = 0110)
      expect(evaluate('12 XOR 10')).toBe(6)
    })

    it('should perform bitwise NOT on number', () => {
      // NOT 0 = -1 (all bits set in int16)
      expect(evaluate('NOT 0')).toBe(-1)
    })
  })

  // ==========================================================================
  // int16 Truncation
  // ==========================================================================

  describe('int16 Truncation', () => {
    it('should keep values within int16 range for bitwise ops', () => {
      // 32767 AND 32767 = 32767
      expect(evaluate('32767 AND 32767')).toBe(32767)
    })

    it('should mask to 16 bits for NOT', () => {
      // NOT 0 = -1 (all bits set in int16)
      expect(evaluate('NOT 0')).toBe(-1)
    })

    it('should mask to 16 bits for OR', () => {
      // 0xFF00 OR 0x00FF = 0xFFFF = -1 in int16
      expect(evaluate('65280 OR 255')).toBe(-1)
    })
  })

  // ==========================================================================
  // Complex / Edge Cases (comparison & logical)
  // ==========================================================================

  describe('Complex Expressions', () => {
    it('should handle comparison in arithmetic context', () => {
      // (5 > 3) * 10 = -1 * 10 = -10
      expect(evaluate('(5 > 3) * 10')).toBe(-10)
    })

    it('should handle NOT with comparison', () => {
      // NOT (5 > 3) = NOT -1 = 0
      expect(evaluate('NOT (5 > 3)')).toBe(0)
    })

    it('should handle NOT (5 < 3) = NOT 0 = -1', () => {
      expect(evaluate('NOT (5 < 3)')).toBe(-1)
    })

    it('should handle chained logical expression', () => {
      // (5 > 0) AND (10 > 0) AND (15 > 0) = -1 AND -1 AND -1 = -1
      expect(evaluate('(5 > 0) AND (10 > 0) AND (15 > 0)')).toBe(-1)
    })

    it('should handle OR before XOR precedence', () => {
      // (5 > 0) OR (0 > 10) XOR (10 > 0) = (-1 OR 0) XOR -1 = -1 XOR -1 = 0
      expect(evaluate('(5 > 0) OR (0 > 10) XOR (10 > 0)')).toBe(0)
    })
  })
})
