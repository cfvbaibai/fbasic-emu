/* eslint-disable no-restricted-syntax -- Type assertions required for mock CST/adapter objects in tests */

/**
 * FunctionEvaluator Sprite/Screen/Keyboard Function Tests
 *
 * Unit tests for FunctionEvaluator.ts sprite, screen, and keyboard functions:
 * MOVE, XPOS, YPOS, POS, SCR$, INKEY$
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

describe('FunctionEvaluator - Sprite query function dispatch', () => {
  it('should dispatch MOVE correctly', () => {
    const result = evalFunction('10 LET X = MOVE(0)')
    expect(result).toBe(0)
  })

  it('should dispatch XPOS correctly via context', () => {
    const mockAdapter = {
      getStickState: (_id: number) => 0,
      consumeStrigState: (_id: number) => 0,
      getSpritePosition: (_n: number) => ({ x: 150, y: 80 }),
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = XPOS(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe(150)
  })

  it('should dispatch YPOS correctly via context', () => {
    const mockAdapter = {
      getStickState: (_id: number) => 0,
      consumeStrigState: (_id: number) => 0,
      getSpritePosition: (_n: number) => ({ x: 100, y: 120 }),
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = YPOS(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe(120)
  })
})

describe('FunctionEvaluator - Cursor and screen function dispatch', () => {
  it('should dispatch POS correctly', () => {
    const mockAdapter = {
      getCursorPosition: () => ({ x: 5, y: 10 }),
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = POS(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe(5)
  })

  it('should dispatch SCR$ correctly (character mode)', () => {
    const mockAdapter = {
      getScreenCell: (_x: number, _y: number, _sw?: number) => 'A',
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = SCR$(0, 5)', { deviceAdapter: mockAdapter })
    expect(result).toBe('A')
  })
})

describe('FunctionEvaluator - INKEY$ function dispatch', () => {
  it('should dispatch INKEY$(0) correctly (blocking)', () => {
    const mockAdapter = {
      getInkeyState: () => 'X',
      waitForInkeyBlocking: () => 'X',
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = INKEY$(0)', { deviceAdapter: mockAdapter })
    expect(result).toBe('X')
  })

  it('should dispatch INKEY$(1) correctly (non-blocking)', () => {
    const mockAdapter = {
      getInkeyState: () => 'B',
    } as unknown as BasicDeviceAdapter

    const result = evalFunction('10 LET X = INKEY$(1)', { deviceAdapter: mockAdapter })
    expect(result).toBe('B')
  })
})

describe('FunctionEvaluator - Sprite/screen argument validation', () => {
  it('should throw for MOVE with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = MOVE(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('MOVE function requires exactly 1 argument')
  })

  it('should throw for XPOS with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = XPOS(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('XPOS function requires exactly 1 argument')
  })

  it('should throw for YPOS with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = YPOS(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('YPOS function requires exactly 1 argument')
  })

  it('should throw for POS with no arguments', () => {
    const { evaluator, cst } = buildEvaluator('10 LET X = POS(0)')
    const modifiedCst = {
      ...cst,
      children: { ...cst.children, expressionList: undefined },
    } as unknown as CstNode
    expect(() => evaluator.evaluateFunctionCall(modifiedCst)).toThrow('POS function requires exactly 1 argument')
  })

  it('should throw for SCR$ with 1 argument (requires 2 or 3)', () => {
    const { evaluator } = buildEvaluator('10 LET X = SCR$(0, 5)')
    // Build a minimal fake CST with only 1 expression in expressionList
    expect(() => evaluator.evaluateFunctionCall({
      name: 'functionCall',
      children: {
        Scr: [{ image: 'SCR$', startOffset: 0, endOffset: 3, tokenTypeIdx: 1 }],
        LParen: [{ image: '(', startOffset: 4, endOffset: 4, tokenTypeIdx: 2 }],
        RParen: [{ image: ')', startOffset: 6, endOffset: 6, tokenTypeIdx: 3 }],
        expressionList: [{
          name: 'expressionList',
          children: {
            expression: [{
              name: 'expression',
              children: {
                logicalExpression: [{
                  name: 'logicalExpression',
                  children: {
                    logicalOrExpression: [{
                      name: 'logicalOrExpression',
                      children: {
                        logicalAndExpression: [{
                          name: 'logicalAndExpression',
                          children: {
                            logicalNotExpression: [{
                              name: 'logicalNotExpression',
                              children: {
                                comparisonExpression: [{
                                  name: 'comparisonExpression',
                                  children: {
                                    bitwiseXorExpression: [{
                                      name: 'bitwiseXorExpression',
                                      children: {
                                        bitwiseOrExpression: [{
                                          name: 'bitwiseOrExpression',
                                          children: {
                                            bitwiseAndExpression: [{
                                              name: 'bitwiseAndExpression',
                                              children: {
                                                bitwiseNotExpression: [{
                                                  name: 'bitwiseNotExpression',
                                                  children: {
                                                    additive: [{
                                                      name: 'additive',
                                                      children: {
                                                        modExpression: [{
                                                          name: 'modExpression',
                                                          children: {
                                                            multiplicative: [{
                                                              name: 'multiplicative',
                                                              children: {
                                                                unary: [{
                                                                  name: 'unary',
                                                                  children: {
                                                                    primary: [{
                                                                      name: 'primary',
                                                                      children: {
                                                                        NumberLiteral: [{ image: '0', startOffset: 5, endOffset: 5, tokenTypeIdx: 4 }],
                                                                      },
                                                                    }],
                                                                  },
                                                                }],
                                                              },
                                                            }],
                                                          },
                                                        }],
                                                      },
                                                    }],
                                                  },
                                                }],
                                              },
                                            }],
                                          },
                                        }],
                                      },
                                    }],
                                  },
                                }],
                              },
                            }],
                          },
                        }],
                      },
                    }],
                  },
                }],
              },
            }],
          },
        }],
      },
    } as unknown as CstNode)).toThrow('SCR$ function requires 2 or 3 arguments')
  })
})

describe('FunctionEvaluator - MOVE boundary conditions', () => {
  it('should throw for MOVE(8) (out of range)', () => {
    expect(() => evalFunction('10 LET X = MOVE(8)')).toThrow('MOVE action number out of range (0-7), got 8')
  })

  it('should throw for MOVE(-1) (out of range)', () => {
    expect(() => evalFunction('10 LET X = MOVE(-1)')).toThrow('MOVE action number out of range (0-7), got -1')
  })

  it('should accept MOVE(7) (max valid)', () => {
    const result = evalFunction('10 LET X = MOVE(7)')
    expect(result).toBe(0) // No animation manager, returns 0
  })

  it('should accept MOVE(0) (min valid)', () => {
    const result = evalFunction('10 LET X = MOVE(0)')
    expect(result).toBe(0)
  })
})

describe('FunctionEvaluator - XPOS/YPOS boundary conditions', () => {
  it('should throw for XPOS(8) (out of range)', () => {
    expect(() => evalFunction('10 LET X = XPOS(8)')).toThrow('XPOS action number out of range (0-7), got 8')
  })

  it('should throw for YPOS(-1) (out of range)', () => {
    expect(() => evalFunction('10 LET X = YPOS(-1)')).toThrow('YPOS action number out of range (0-7), got -1')
  })

  it('should accept XPOS(7) (max valid)', () => {
    const result = evalFunction('10 LET X = XPOS(7)')
    expect(typeof result).toBe('number')
  })

  it('should accept YPOS(0) (min valid)', () => {
    const result = evalFunction('10 LET X = YPOS(0)')
    expect(typeof result).toBe('number')
  })

  it('should return 0 for XPOS when no device adapter and no position set', () => {
    const result = evalFunction('10 LET X = XPOS(0)')
    expect(result).toBe(0)
  })

  it('should return 0 for YPOS when no device adapter and no position set', () => {
    const result = evalFunction('10 LET X = YPOS(0)')
    expect(result).toBe(0)
  })
})

describe('FunctionEvaluator - SCR$ boundary conditions', () => {
  it('should throw for SCR$ with X out of range (negative)', () => {
    expect(() => evalFunction('10 LET X = SCR$(-1, 5)')).toThrow('SCR$ X coordinate out of range (0-27)')
  })

  it('should throw for SCR$ with X out of range (> 27)', () => {
    expect(() => evalFunction('10 LET X = SCR$(28, 5)')).toThrow('SCR$ X coordinate out of range (0-27)')
  })

  it('should throw for SCR$ with Y out of range (negative)', () => {
    expect(() => evalFunction('10 LET X = SCR$(0, -1)')).toThrow('SCR$ Y coordinate out of range (0-23)')
  })

  it('should throw for SCR$ with Y out of range (> 23)', () => {
    expect(() => evalFunction('10 LET X = SCR$(0, 24)')).toThrow('SCR$ Y coordinate out of range (0-23)')
  })

  it('should accept SCR$(27, 23) (max valid coordinates)', () => {
    const mockAdapter = {
      getScreenCell: () => ' ',
    } as unknown as BasicDeviceAdapter
    const result = evalFunction('10 LET X = SCR$(27, 23)', { deviceAdapter: mockAdapter })
    expect(result).toBe(' ')
  })

  it('should throw for SCR$ with invalid color switch', () => {
    expect(() => evalFunction('10 LET X = SCR$(0, 0, 2)')).toThrow('SCR$ color switch must be 0 or 1')
  })

  it('should return space character when no device adapter (character mode)', () => {
    const result = evalFunction('10 LET X = SCR$(0, 0)')
    expect(result).toBe(' ')
  })

  it('should return 0 when no device adapter (color mode)', () => {
    const result = evalFunction('10 LET X = SCR$(0, 0, 1)')
    expect(result).toBe(0)
  })
})

describe('FunctionEvaluator - Sprite/screen adapter fallback', () => {
  it('should return 0 for POS when no device adapter', () => {
    const result = evalFunction('10 LET X = POS(0)')
    expect(result).toBe(0)
  })

  it('should return empty string for INKEY$ when no device adapter', () => {
    const result = evalFunction('10 LET X = INKEY$(1)')
    expect(result).toBe('')
  })
})
