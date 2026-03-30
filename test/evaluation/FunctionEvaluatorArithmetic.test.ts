/* eslint-disable no-restricted-syntax -- Type assertions required for mock CST/adapter objects in tests */

/**
 * FunctionEvaluator Arithmetic Function Tests
 *
 * Unit tests for FunctionEvaluator.ts arithmetic function dispatch:
 * ABS, SGN, RND, VAL
 *
 * Covers dispatch, argument validation, boundary conditions,
 * and detailed behavior for arithmetic functions.
 */

import type { CstNode } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import { FunctionEvaluator } from '@/core/evaluation/FunctionEvaluator'
import type { BasicDeviceAdapter } from '@/core/interfaces'
import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'
import { ExecutionContext } from '@/core/state/ExecutionContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively walk CST to find the first node with the given rule name. */
function findFirstNodeByName(node: CstNode, name: string): CstNode | undefined {
  if (node.name === name) return node
  for (const childArr of Object.values(node.children)) {
    if (!Array.isArray(childArr)) continue
    for (const child of childArr) {
      if ('children' in child) {
        const found = findFirstNodeByName(child, name)
        if (found) return found
      }
    }
  }
  return undefined
}

function extractFunctionCallCst(source: string): CstNode {
  const result = parseWithChevrotain(source)
  if (!result.success || !result.cst) {
    throw new Error(`Parse failed: ${result.errors?.map(e => e.message).join(', ')}`)
  }
  const fc = findFirstNodeByName(result.cst, 'functionCall')
  if (!fc) {
    throw new Error('No functionCall CST node found in parsed source')
  }
  return fc
}

function createMockContext(deviceAdapter?: BasicDeviceAdapter): ExecutionContext {
  const adapter = deviceAdapter ?? new TestDeviceAdapter()
  const ctx = new ExecutionContext({
    maxIterations: 1000,
    maxOutputLines: 100,
    enableDebugMode: false,
    strictMode: false,
    deviceAdapter: adapter,
  })
  ctx.deviceAdapter = adapter
  return ctx
}

function createMockEvaluateExpression(valuesMap?: Map<string, number | string>) {
  const map = valuesMap ?? new Map()

  return function mockEvaluateExpression(exprCst: CstNode): number | string {
    const children = exprCst.children as Record<string, unknown>

    if (children.NumberLiteral && Array.isArray(children.NumberLiteral) && children.NumberLiteral.length > 0) {
      return parseInt((children.NumberLiteral[0] as { image: string }).image, 10)
    }

    if (children.StringLiteral && Array.isArray(children.StringLiteral) && children.StringLiteral.length > 0) {
      return (children.StringLiteral[0] as { image: string }).image.slice(1, -1)
    }

    if (children.HexLiteral && Array.isArray(children.HexLiteral) && children.HexLiteral.length > 0) {
      return parseInt((children.HexLiteral[0] as { image: string }).image.slice(2), 16)
    }

    if (children.Identifier && Array.isArray(children.Identifier) && children.Identifier.length > 0) {
      const varName = (children.Identifier[0] as { image: string }).image.toUpperCase()
      return map.get(varName) ?? 0
    }

    const result = resolveDeep(exprCst, map)
    return result
  }
}

function resolveDeep(node: CstNode, map: Map<string, number | string>): number | string {
  const children = node.children as Record<string, unknown>

  if (children.Minus && Array.isArray(children.Minus) && children.Minus.length > 0) {
    const inner = findNumericValue(node, map)
    return -inner
  }

  if (children.NumberLiteral && Array.isArray(children.NumberLiteral) && children.NumberLiteral.length > 0) {
    return parseInt((children.NumberLiteral[0] as { image: string }).image, 10)
  }
  if (children.StringLiteral && Array.isArray(children.StringLiteral) && children.StringLiteral.length > 0) {
    return (children.StringLiteral[0] as { image: string }).image.slice(1, -1)
  }
  if (children.HexLiteral && Array.isArray(children.HexLiteral) && children.HexLiteral.length > 0) {
    return parseInt((children.HexLiteral[0] as { image: string }).image.slice(2), 16)
  }
  if (children.Identifier && Array.isArray(children.Identifier) && children.Identifier.length > 0) {
    const varName = (children.Identifier[0] as { image: string }).image.toUpperCase()
    return map.get(varName) ?? 0
  }

  for (const childArr of Object.values(children)) {
    if (!Array.isArray(childArr)) continue
    for (const child of childArr) {
      if ('children' in child) {
        const result = resolveDeep(child as CstNode, map)
        if (result !== 0 && result !== '') return result
      }
    }
  }
  return 0
}

function findNumericValue(node: CstNode, map: Map<string, number | string>): number {
  const children = node.children as Record<string, unknown>
  if (children.NumberLiteral && Array.isArray(children.NumberLiteral) && children.NumberLiteral.length > 0) {
    return parseInt((children.NumberLiteral[0] as { image: string }).image, 10)
  }
  if (children.HexLiteral && Array.isArray(children.HexLiteral) && children.HexLiteral.length > 0) {
    return parseInt((children.HexLiteral[0] as { image: string }).image.slice(2), 16)
  }
  if (children.Identifier && Array.isArray(children.Identifier) && children.Identifier.length > 0) {
    const varName = (children.Identifier[0] as { image: string }).image.toUpperCase()
    const val = map.get(varName)
    if (typeof val === 'number') return val
  }
  for (const childArr of Object.values(children)) {
    if (!Array.isArray(childArr)) continue
    for (const child of childArr) {
      if ('children' in child) {
        const result = findNumericValue(child as CstNode, map)
        if (result !== 0) return result
      }
    }
  }
  return 0
}

function buildEvaluator(
  source: string,
  opts?: {
    deviceAdapter?: BasicDeviceAdapter
    expressionValues?: Map<string, number | string>
  }
): { evaluator: FunctionEvaluator; cst: CstNode; context: ExecutionContext } {
  const cst = extractFunctionCallCst(source)
  const context = createMockContext(opts?.deviceAdapter)
  const evaluateExpression = createMockEvaluateExpression(opts?.expressionValues)

  const evaluator = new FunctionEvaluator(
    context,
    evaluateExpression,
    opts?.deviceAdapter
  )

  return { evaluator, cst, context }
}

function evalFunction(source: string, opts?: {
  deviceAdapter?: BasicDeviceAdapter
  expressionValues?: Map<string, number | string>
}): number | string {
  const { evaluator, cst } = buildEvaluator(source, opts)
  return evaluator.evaluateFunctionCall(cst)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FunctionEvaluator - Arithmetic function dispatch', () => {
  it('should dispatch ABS correctly', () => {
    const result = evalFunction('10 LET X = ABS(5)')
    expect(result).toBe(5)
  })

  it('should dispatch SGN correctly', () => {
    const result = evalFunction('10 LET X = SGN(5)')
    expect(result).toBe(1)
  })

  it('should dispatch RND correctly', () => {
    const result = evalFunction('10 LET X = RND(10)')
    expect(typeof result).toBe('number')
    expect(result as number).toBeGreaterThanOrEqual(0)
    expect(result as number).toBeLessThanOrEqual(9)
  })

  it('should dispatch VAL correctly', () => {
    const result = evalFunction('10 LET X = VAL("123")')
    expect(result).toBe(123)
  })
})

describe('FunctionEvaluator - Arithmetic argument validation', () => {
  it('should throw for ABS with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = ABS(5)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('ABS function requires exactly 1 argument')
  })

  it('should throw for SGN with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = SGN(5)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('SGN function requires exactly 1 argument')
  })

  it('should throw for RND with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = RND(5)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('RND function requires exactly 1 argument')
  })

  it('should throw for VAL with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = VAL("5")')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('VAL function requires exactly 1 argument')
  })
})

describe('FunctionEvaluator - Arithmetic function details', () => {
  it('should truncate and return absolute value for ABS', () => {
    const result = evalFunction('10 LET X = ABS(5)')
    expect(result).toBe(5)
  })

  it('should return 1 for SGN of positive', () => {
    const result = evalFunction('10 LET X = SGN(5)')
    expect(result).toBe(1)
  })

  it('should return 0 for SGN of zero', () => {
    const result = evalFunction('10 LET X = SGN(0)')
    expect(result).toBe(0)
  })
})

describe('FunctionEvaluator - RND boundary conditions', () => {
  it('should return 0 for RND(1)', () => {
    const result = evalFunction('10 LET X = RND(1)')
    expect(result).toBe(0)
  })

  it('should throw for RND(0)', () => {
    expect(() => evalFunction('10 LET X = RND(0)')).toThrow('RND argument must be between 1 and 32767')
  })

  it('should throw for RND with negative argument', () => {
    expect(() => evalFunction('10 LET X = RND(-5)')).toThrow('RND argument must be between 1 and 32767, got -5')
  })

  it('should throw for RND(32768)', () => {
    expect(() => evalFunction('10 LET X = RND(32768)')).toThrow('RND argument must be between 1 and 32767')
  })

  it('should accept RND(32767) (max valid)', () => {
    const result = evalFunction('10 LET X = RND(32767)')
    expect(typeof result).toBe('number')
    expect(result as number).toBeGreaterThanOrEqual(0)
    expect(result as number).toBeLessThanOrEqual(32766)
  })
})

describe('FunctionEvaluator - VAL function details', () => {
  it('should parse decimal string', () => {
    const result = evalFunction('10 LET X = VAL("123")')
    expect(result).toBe(123)
  })

  it('should return 0 for empty string', () => {
    const result = evalFunction('10 LET X = VAL("")')
    expect(result).toBe(0)
  })

  it('should return 0 for non-numeric string', () => {
    const result = evalFunction('10 LET X = VAL("ABC")')
    expect(result).toBe(0)
  })

  it('should parse hexadecimal string', () => {
    const result = evalFunction('10 LET X = VAL("&HFF")')
    expect(result).toBe(255)
  })

  it('should clamp to 32767 for large decimal', () => {
    const result = evalFunction('10 LET X = VAL("50000")')
    expect(result).toBe(32767)
  })

  it('should clamp to -32768 for large negative decimal', () => {
    const result = evalFunction('10 LET X = VAL("-50000")')
    expect(result).toBe(-32768)
  })

  it('should clamp hexadecimal to 32767', () => {
    const result = evalFunction('10 LET X = VAL("&HFFFF")')
    expect(result).toBe(32767)
  })

  it('should handle leading + sign', () => {
    const result = evalFunction('10 LET X = VAL("+42")')
    expect(result).toBe(42)
  })

  it('should stop parsing at non-numeric character', () => {
    const result = evalFunction('10 LET X = VAL("123ABC")')
    expect(result).toBe(123)
  })
})
