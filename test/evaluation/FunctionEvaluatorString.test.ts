/**
 * FunctionEvaluator String Function Tests
 *
 * Unit tests for FunctionEvaluator.ts string function dispatch:
 * CHR$, ASC, LEN, LEFT$, RIGHT$, MID$, STR$, HEX$
 *
 * Approach: Parse F-BASIC source via parseWithChevrotain, extract the
 * functionCall CST node, and invoke FunctionEvaluator.evaluateFunctionCall
 * directly to test dispatch and error paths.
 */

import type { CstNode } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import { FunctionEvaluator } from '@/core/evaluation/FunctionEvaluator'
import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'
import { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

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

/**
 * Navigate the CST tree produced by `parseWithChevrotain` and return the
 * first `functionCall` CST node found in the parsed program.
 */
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

/**
 * Create an ExecutionContext for tests, optionally with a custom device adapter.
 */
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

/**
 * A mock evaluateExpression callback that can resolve numeric literals,
 * string literals, hex literals, identifiers, and unary minus expressions.
 */
function createMockEvaluateExpression(valuesMap?: Map<string, number | string>) {
  const map = valuesMap ?? new Map()

  return function mockEvaluateExpression(exprCst: CstNode): number | string {
    const children = exprCst.children as Record<string, unknown>

    // NumberLiteral at expression level
    if (children.NumberLiteral && Array.isArray(children.NumberLiteral) && children.NumberLiteral.length > 0) {
      return parseInt((children.NumberLiteral[0] as { image: string }).image, 10)
    }

    // StringLiteral at expression level
    if (children.StringLiteral && Array.isArray(children.StringLiteral) && children.StringLiteral.length > 0) {
      return (children.StringLiteral[0] as { image: string }).image.slice(1, -1)
    }

    // HexLiteral at expression level
    if (children.HexLiteral && Array.isArray(children.HexLiteral) && children.HexLiteral.length > 0) {
      return parseInt((children.HexLiteral[0] as { image: string }).image.slice(2), 16)
    }

    // Identifier at expression level
    if (children.Identifier && Array.isArray(children.Identifier) && children.Identifier.length > 0) {
      const varName = (children.Identifier[0] as { image: string }).image.toUpperCase()
      return map.get(varName) ?? 0
    }

    // Unary minus: dig into expression > logicalExpression > ... > unary > Minus > primary
    // Instead of deep walking, we use a general recursive approach.
    const result = resolveDeep(exprCst, map)
    return result
  }
}

/** Recursively resolve a CST expression, handling unary minus. */
function resolveDeep(node: CstNode, map: Map<string, number | string>): number | string {
  const children = node.children as Record<string, unknown>

  // Check for Minus token (unary negation) -- walk to find a numeric value and negate it
  if (children.Minus && Array.isArray(children.Minus) && children.Minus.length > 0) {
    // Find the first numeric value in sub-nodes and negate it
    const inner = findNumericValue(node, map)
    return -inner
  }

  // Direct token matches
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

  // Recurse into child CST nodes
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

/** Find the first numeric value within a CST subtree (for unary minus). */
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

/**
 * Build a FunctionEvaluator from source code that contains exactly one
 * function call expression.
 */
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

/**
 * Convenience: evaluate a function call from a source string.
 * Returns the result or throws the error.
 */
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

describe('FunctionEvaluator - String function dispatch', () => {
  it('should dispatch CHR$ correctly', () => {
    const result = evalFunction('10 LET X = CHR$(65)')
    expect(result).toBe('A')
  })

  it('should dispatch ASC correctly', () => {
    const result = evalFunction('10 LET X = ASC("A")')
    expect(result).toBe(65)
  })

  it('should dispatch LEN correctly', () => {
    const result = evalFunction('10 LET X = LEN("Hello")')
    expect(result).toBe(5)
  })

  it('should dispatch LEFT$ correctly', () => {
    const result = evalFunction('10 LET X = LEFT$("Hello", 3)')
    expect(result).toBe('Hel')
  })

  it('should dispatch RIGHT$ correctly', () => {
    const result = evalFunction('10 LET X = RIGHT$("Hello", 2)')
    expect(result).toBe('lo')
  })

  it('should dispatch MID$ correctly', () => {
    const result = evalFunction('10 LET X = MID$("Hello", 2, 3)')
    expect(result).toBe('ell')
  })

  it('should dispatch STR$ correctly', () => {
    const result = evalFunction('10 LET X = STR$(42)')
    expect(result).toBe(' 42')
  })

  it('should dispatch HEX$ correctly', () => {
    const result = evalFunction('10 LET X = HEX$(255)')
    expect(result).toBe('FF')
  })
})
