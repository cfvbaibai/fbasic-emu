/**
 * ExpressionEvaluator Arithmetic Tests
 *
 * Tests for arithmetic expression evaluation: number/string literals,
 * unary operators, binary arithmetic (add, subtract, multiply, divide, MOD),
 * operator precedence, and parenthesized expressions.
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
})
