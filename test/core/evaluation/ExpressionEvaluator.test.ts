/**
 * ExpressionEvaluator Unit Tests
 *
 * Direct unit tests for ExpressionEvaluator.ts — the central evaluation engine
 * for F-BASIC expressions. Tests parse BASIC expressions into CST, then call
 * ExpressionEvaluator.evaluateExpression() directly, isolating it from the
 * full interpreter pipeline.
 *
 * Test strategy: Parse "10 LET X = <expr>" to get a valid CST, extract the
 * expression node from the LET statement, then evaluate it with a fresh
 * ExpressionEvaluator and ExecutionContext.
 */

/* eslint-disable max-lines -- Comprehensive unit tests for core evaluation engine */

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
  // Number Literals
  // ==========================================================================

  describe('Number Literals', () => {
    it('should evaluate a positive integer literal', () => {
      expect(evaluate('42')).toBe(42)
    })

    it('should evaluate zero', () => {
      expect(evaluate('0')).toBe(0)
    })

    it('should evaluate a large integer', () => {
      expect(evaluate('99999')).toBe(99999)
    })

    it('should evaluate hex literal &HFF', () => {
      expect(evaluate('&HFF')).toBe(255)
    })

    it('should evaluate hex literal &H10', () => {
      expect(evaluate('&H10')).toBe(16)
    })

    it('should evaluate hex literal &H0', () => {
      expect(evaluate('&H0')).toBe(0)
    })

    it('should evaluate hex literal &HDD', () => {
      expect(evaluate('&HDD')).toBe(221)
    })
  })

  // ==========================================================================
  // String Literals
  // ==========================================================================

  describe('String Literals', () => {
    it('should evaluate a string literal', () => {
      expect(evaluate('"hello"')).toBe('hello')
    })

    it('should evaluate an empty string literal', () => {
      expect(evaluate('""')).toBe('')
    })

    it('should evaluate a string with spaces', () => {
      expect(evaluate('"hello world"')).toBe('hello world')
    })
  })

  // ==========================================================================
  // Unary Operators
  // ==========================================================================

  describe('Unary Operators', () => {
    it('should negate a number', () => {
      expect(evaluate('-5')).toBe(-5)
    })

    it('should double-negate a number', () => {
      // F-BASIC parser does not support --5 syntax; use -(-5) instead
      expect(evaluate('-(-5)')).toBe(5)
    })

    it('should negate zero', () => {
      expect(Object.is(evaluate('-0'), -0)).toBe(true)
    })

    it('should apply unary plus (identity)', () => {
      expect(evaluate('+5')).toBe(5)
    })

    it('should negate a parenthesized expression', () => {
      expect(evaluate('-(3 + 2)')).toBe(-5)
    })

    it('should negate a multiplication result', () => {
      expect(evaluate('-(3 * 4)')).toBe(-12)
    })
  })

  // ==========================================================================
  // Arithmetic: Addition
  // ==========================================================================

  describe('Addition', () => {
    it('should add two positive numbers', () => {
      expect(evaluate('5 + 3')).toBe(8)
    })

    it('should add positive and negative', () => {
      expect(evaluate('10 + (-5)')).toBe(5)
    })

    it('should chain multiple additions', () => {
      expect(evaluate('1 + 2 + 3 + 4')).toBe(10)
    })

    it('should add zero', () => {
      expect(evaluate('7 + 0')).toBe(7)
    })

    it('should add two negative numbers', () => {
      expect(evaluate('-3 + (-7)')).toBe(-10)
    })
  })

  // ==========================================================================
  // Arithmetic: Subtraction
  // ==========================================================================

  describe('Subtraction', () => {
    it('should subtract two numbers', () => {
      expect(evaluate('10 - 3')).toBe(7)
    })

    it('should subtract to negative result', () => {
      expect(evaluate('5 - 10')).toBe(-5)
    })

    it('should chain multiple subtractions', () => {
      expect(evaluate('20 - 5 - 3')).toBe(12)
    })

    it('should subtract zero', () => {
      expect(evaluate('7 - 0')).toBe(7)
    })
  })

  // ==========================================================================
  // Arithmetic: Multiplication
  // ==========================================================================

  describe('Multiplication', () => {
    it('should multiply two positive numbers', () => {
      expect(evaluate('5 * 3')).toBe(15)
    })

    it('should multiply by negative', () => {
      expect(evaluate('5 * (-3)')).toBe(-15)
    })

    it('should chain multiple multiplications', () => {
      expect(evaluate('2 * 3 * 4')).toBe(24)
    })

    it('should multiply by zero', () => {
      expect(evaluate('5 * 0')).toBe(0)
    })

    it('should multiply zero by zero', () => {
      expect(evaluate('0 * 0')).toBe(0)
    })
  })

  // ==========================================================================
  // Arithmetic: Division
  // ==========================================================================

  describe('Division', () => {
    it('should divide evenly', () => {
      expect(evaluate('15 / 3')).toBe(5)
    })

    it('should truncate toward zero (integer division)', () => {
      expect(evaluate('7 / 2')).toBe(3)
    })

    it('should chain multiple divisions', () => {
      expect(evaluate('100 / 2 / 5')).toBe(10)
    })

    it('should divide resulting in zero', () => {
      expect(evaluate('3 / 10')).toBe(0)
    })

    it('should handle negative division', () => {
      expect(evaluate('-10 / 2')).toBe(-5)
    })

    it('should report division by zero as error', () => {
      evaluateWithContext('10 / 0', context)
      expect(context.getErrors().length).toBeGreaterThan(0)
      expect(context.getErrors()[0]?.message).toBe('Division by zero')
    })
  })

  // ==========================================================================
  // Arithmetic: MOD
  // ==========================================================================

  describe('MOD Operator', () => {
    it('should compute modulus', () => {
      expect(evaluate('10 MOD 3')).toBe(1)
    })

    it('should return 0 when evenly divisible', () => {
      expect(evaluate('9 MOD 3')).toBe(0)
    })

    it('should return dividend when less than divisor', () => {
      expect(evaluate('2 MOD 5')).toBe(2)
    })

    it('should compute chained MOD', () => {
      // 17 MOD 5 = 2, then 2 MOD 3 = 2
      expect(evaluate('17 MOD 5 MOD 3')).toBe(2)
    })

    it('should report MOD by zero as error', () => {
      evaluateWithContext('10 MOD 0', context)
      expect(context.getErrors().length).toBeGreaterThan(0)
      expect(context.getErrors()[0]?.message).toBe('Division by zero')
    })
  })

  // ==========================================================================
  // Operator Precedence
  // ==========================================================================

  describe('Operator Precedence', () => {
    it('should multiply before addition', () => {
      expect(evaluate('2 + 3 * 4')).toBe(14)
    })

    it('should multiply before subtraction', () => {
      expect(evaluate('10 - 2 * 3')).toBe(4)
    })

    it('should divide before addition', () => {
      expect(evaluate('10 + 8 / 2')).toBe(14)
    })

    it('should divide before subtraction', () => {
      expect(evaluate('20 - 12 / 3')).toBe(16)
    })

    it('should evaluate MOD before addition', () => {
      // 5 + 10 MOD 3 = 5 + 1 = 6
      expect(evaluate('5 + 10 MOD 3')).toBe(6)
    })

    it('should evaluate multiplication before MOD', () => {
      // 2 * 5 MOD 3 = 10 MOD 3 = 1
      expect(evaluate('2 * 5 MOD 3')).toBe(1)
    })

    it('should override precedence with parentheses', () => {
      expect(evaluate('(2 + 3) * 4')).toBe(20)
    })

    it('should handle nested parentheses', () => {
      expect(evaluate('((2 + 3) * 4) / 2')).toBe(10)
    })

    it('should handle parentheses with unary minus', () => {
      expect(evaluate('-(5 + 3)')).toBe(-8)
    })

    it('should handle complex expression with all operators', () => {
      // 2 + 3 * 4 - 10 / 2 = 2 + 12 - 5 = 9
      expect(evaluate('2 + 3 * 4 - 10 / 2')).toBe(9)
    })
  })

  // ==========================================================================
  // String Concatenation
  // ==========================================================================

  describe('String Concatenation', () => {
    it('should concatenate two strings with +', () => {
      expect(evaluate('"hello" + " " + "world"')).toBe('hello world')
    })

    it('should concatenate string with number (coerced to string)', () => {
      expect(evaluate('"num" + 5')).toBe('num5')
    })

    it('should concatenate number with string (coerced to string)', () => {
      expect(evaluate('5 + "abc"')).toBe('5abc')
    })

    it('should concatenate empty string with string', () => {
      expect(evaluate('"" + "test"')).toBe('test')
    })
  })

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
  // Parenthesized Expressions
  // ==========================================================================

  describe('Parenthesized Expressions', () => {
    it('should evaluate simple parenthesized expression', () => {
      expect(evaluate('(5)')).toBe(5)
    })

    it('should evaluate nested parentheses', () => {
      expect(evaluate('((2 + 3))')).toBe(5)
    })

    it('should use parentheses to override precedence', () => {
      expect(evaluate('(2 + 3) * 4')).toBe(20)
    })

    it('should handle multiple parenthesized groups', () => {
      expect(evaluate('(5 + 3) * (2 + 1)')).toBe(24)
    })

    it('should handle deeply nested parentheses', () => {
      expect(evaluate('(((2 + 3)))')).toBe(5)
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
  // Complex / Edge Cases
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
