/* eslint-disable no-restricted-syntax -- Type assertions required for mock CST/adapter objects in tests */

/**
 * FunctionEvaluator Controller Input Function Tests
 *
 * Unit tests for FunctionEvaluator.ts controller input functions:
 * STICK, STRIG
 *
 * Covers dispatch, argument validation, boundary conditions,
 * and device adapter fallback behavior.
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

describe('FunctionEvaluator - Controller input function dispatch', () => {
  it('should dispatch STICK correctly via context', () => {
    const mockAdapter = {
      getStickState: (_id: number) => 4,
      consumeStrigState: (_id: number) => 0,
      getSpritePosition: (_n: number) => null,
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = STICK(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe(4)
  })

  it('should dispatch STRIG correctly via context', () => {
    const mockAdapter = {
      getStickState: (_id: number) => 0,
      consumeStrigState: (_id: number) => 8,
      getSpritePosition: (_n: number) => null,
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = STRIG(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe(8)
  })
})

describe('FunctionEvaluator - Controller argument validation', () => {
  it('should throw for STICK with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = STICK(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('STICK function requires exactly 1 argument')
  })

  it('should throw for STRIG with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = STRIG(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('STRIG function requires exactly 1 argument')
  })
})

describe('FunctionEvaluator - STICK boundary conditions', () => {
  it('should throw for STICK(-1) (invalid joystickId)', () => {
    expect(() => evalFunction('10 LET X = STICK(-1)')).toThrow('STICK joystickId must be 0 or 1')
  })

  it('should throw for STICK(2) (invalid joystickId)', () => {
    expect(() => evalFunction('10 LET X = STICK(2)')).toThrow('STICK joystickId must be 0 or 1')
  })

  it('should accept STICK(0)', () => {
    const result = evalFunction('10 LET X = STICK(0)')
    expect(typeof result).toBe('number')
  })

  it('should accept STICK(1)', () => {
    const result = evalFunction('10 LET X = STICK(1)')
    expect(typeof result).toBe('number')
  })
})

describe('FunctionEvaluator - STRIG boundary conditions', () => {
  it('should throw for STRIG(-1) (invalid joystickId)', () => {
    expect(() => evalFunction('10 LET X = STRIG(-1)')).toThrow('STRIG joystickId must be 0 or 1')
  })

  it('should throw for STRIG(2) (invalid joystickId)', () => {
    expect(() => evalFunction('10 LET X = STRIG(2)')).toThrow('STRIG joystickId must be 0 or 1')
  })

  it('should accept STRIG(0)', () => {
    const result = evalFunction('10 LET X = STRIG(0)')
    expect(typeof result).toBe('number')
  })

  it('should accept STRIG(1)', () => {
    const result = evalFunction('10 LET X = STRIG(1)')
    expect(typeof result).toBe('number')
  })
})

describe('FunctionEvaluator - Controller adapter fallback', () => {
  it('should return 0 for STICK when no adapter (context returns 0)', () => {
    const result = evalFunction('10 LET X = STICK(0)')
    expect(result).toBe(0)
  })

  it('should return 0 for STRIG when no adapter (context returns 0)', () => {
    const result = evalFunction('10 LET X = STRIG(0)')
    expect(result).toBe(0)
  })
})
