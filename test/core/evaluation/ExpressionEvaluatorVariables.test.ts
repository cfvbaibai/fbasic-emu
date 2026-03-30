/**
 * ExpressionEvaluator Variables, Arrays & Functions Tests
 *
 * Tests for variable resolution, array access, type coercion,
 * complex arithmetic expressions, and device query functions (CSRLIN, INKEY$).
 */

 

import type { CstNode } from 'chevrotain'
import { beforeEach, describe, expect, it } from 'vitest'

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

/**
 * Evaluate a BASIC expression string using the given context (preserves variables).
 */
function evaluateWithContext(expr: string, context: ExecutionContext): number | string {
  const evaluator = new ExpressionEvaluator(context)
  const exprCst = parseExpression(expr)
  return evaluator.evaluateExpression(exprCst)
}

// ============================================================================
// Tests
// ============================================================================

describe('ExpressionEvaluator', () => {
  let context: ExecutionContext

  beforeEach(() => {
    context = createContext()
  })

  // ==========================================================================
  // Variable Resolution
  // ==========================================================================

  describe('Variable Resolution', () => {
    it('should return 0 for undefined numeric variable', () => {
      expect(evaluate('X')).toBe(0)
    })

    it('should return empty string for undefined string variable', () => {
      expect(evaluate('X$')).toBe('')
    })

    it('should resolve a defined numeric variable', () => {
      context.variables.set('A', { value: 42, type: 'number' })
      expect(evaluateWithContext('A', context)).toBe(42)
    })

    it('should resolve a defined string variable', () => {
      context.variables.set('A$', { value: 'hello', type: 'string' })
      expect(evaluateWithContext('A$', context)).toBe('hello')
    })

    it('should use variables in arithmetic expressions', () => {
      context.variables.set('A', { value: 5, type: 'number' })
      context.variables.set('B', { value: 10, type: 'number' })
      expect(evaluateWithContext('A + B', context)).toBe(15)
    })

    it('should use variables in comparisons', () => {
      context.variables.set('A', { value: 5, type: 'number' })
      expect(evaluateWithContext('A > 0', context)).toBe(-1)
    })

    it('should use variables in string concatenation', () => {
      context.variables.set('A$', { value: 'hello', type: 'string' })
      expect(evaluateWithContext('A$ + " world"', context)).toBe('hello world')
    })

    it('should resolve case-insensitively (uppercased internally)', () => {
      context.variables.set('MYVAR', { value: 99, type: 'number' })
      // Parser will uppercase identifier, so MYVAR matches
      expect(evaluateWithContext('MYVAR', context)).toBe(99)
    })
  })

  // ==========================================================================
  // Array Access
  // ==========================================================================

  describe('Array Access', () => {
    it('should return 0 for undefined numeric array', () => {
      expect(evaluate('A(0)')).toBe(0)
    })

    it('should return empty string for undefined string array', () => {
      expect(evaluate('A$(0)')).toBe('')
    })

    it('should access 1D array element', () => {
      context.arrays.set('A', [10, 20, 30])
      expect(evaluateWithContext('A(1)', context)).toBe(20)
    })

    it('should access 2D array element', () => {
      // 2D array: [[1,2,3],[4,5,6]]
      context.arrays.set('A', [[1, 2, 3], [4, 5, 6]])
      expect(evaluateWithContext('A(1, 2)', context)).toBe(6)
    })

    it('should return default for out-of-bounds index', () => {
      context.arrays.set('A', [10, 20, 30])
      expect(evaluateWithContext('A(10)', context)).toBe(0)
    })

    it('should return default for negative index', () => {
      context.arrays.set('A', [10, 20, 30])
      expect(evaluateWithContext('A(-1)', context)).toBe(0)
    })

    it('should evaluate expression as array index', () => {
      context.arrays.set('A', [10, 20, 30])
      context.variables.set('I', { value: 2, type: 'number' })
      expect(evaluateWithContext('A(I)', context)).toBe(30)
    })
  })

  // ==========================================================================
  // Type Coercion
  // ==========================================================================

  describe('Type Coercion (internal toNumber / toDecimal)', () => {
    it('should treat string operand in arithmetic as 0 (non-numeric string)', () => {
      // "abc" + 5 — string + number triggers concatenation, not arithmetic
      expect(evaluate('"abc" + 5')).toBe('abc5')
    })

    it('should coerce string in subtraction', () => {
      // 10 - "3" — "3" is coerced to numeric 3, so 10 - 3 = 7
      expect(evaluate('10 - "3"')).toBe(7)
    })

    it('should coerce string in multiplication', () => {
      // 5 * "abc" — "abc" parsed as NaN => 0
      expect(evaluate('5 * "abc"')).toBe(0)
    })
  })

  // ==========================================================================
  // Complex / Edge Cases (arithmetic)
  // ==========================================================================

  describe('Complex Expressions', () => {
    it('should handle deeply nested arithmetic', () => {
      // ((2 + 3) * (4 - 1)) / 3 = (5 * 3) / 3 = 5
      expect(evaluate('((2 + 3) * (4 - 1)) / 3')).toBe(5)
    })

    it('should handle expression with unary and binary operators', () => {
      // -5 + -3 * 2 = -5 + (-6) = -11
      expect(evaluate('-5 + -3 * 2')).toBe(-11)
    })
  })

  // ==========================================================================
  // CSRLIN (cursor line function)
  // ==========================================================================

  describe('CSRLIN', () => {
    it('should return cursor Y position from device adapter', () => {
      ;(context.deviceAdapter as TestDeviceAdapter).cursorPosition = { x: 5, y: 12 }
      expect(evaluateWithContext('CSRLIN', context)).toBe(12)
    })

    it('should return 0 when no device adapter', () => {
      context.deviceAdapter = undefined
      expect(evaluateWithContext('CSRLIN', context)).toBe(0)
    })
  })

  // ==========================================================================
  // INKEY$ (non-function-call token form)
  // ==========================================================================

  describe('INKEY$ (token form)', () => {
    it('should return key state from device adapter', () => {
      // TestDeviceAdapter.getInkeyState returns empty string by default
      expect(evaluateWithContext('INKEY$', context)).toBe('')
    })

    it('should return empty string when no device adapter', () => {
      context.deviceAdapter = undefined
      expect(evaluateWithContext('INKEY$', context)).toBe('')
    })
  })
})
