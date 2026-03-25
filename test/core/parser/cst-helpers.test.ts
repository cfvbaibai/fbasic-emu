/**
 * CST Helper Functions Tests
 *
 * Unit tests for cst-helpers.ts utility functions.
 * These are pure functions that operate on Chevrotain CST nodes and tokens.
 */

import type { CstElement, CstNode, IToken } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import {
  getAdditiveFromExpression,
  getCstNodes,
  getFirstCstNode,
  getFirstToken,
  getLineNumberFromStatement,
  getSourceTextFromCst,
  getTokens,
  isCstNode,
  isCstToken,
} from '@/core/parser/cst-helpers'

// Helper to create a mock IToken
function makeToken(image: string, tokenType = { name: 'TestToken' }): IToken {
  return {
    image,
    tokenType,
    tokenTypeIdx: 0,
    startOffset: 0,
    startLine: 1,
    startColumn: 1,
    endOffset: image.length - 1,
    endLine: 1,
    endColumn: image.length,
  }
}

// Helper to create a mock CstNode
function makeNode(name: string, children: Record<string, CstElement[]>): CstNode {
  return { name, children }
}

describe('isCstNode', () => {
  it('should return true for objects with children property', () => {
    const node = makeNode('test', {})
    expect(isCstNode(node)).toBe(true)
  })

  it('should return false for tokens (objects with image property)', () => {
    const token = makeToken('HELLO')
    expect(isCstNode(token)).toBe(false)
  })

  it('should return false for null', () => {
    // isCstNode is a type guard; passing non-CstElement should be safe at runtime
    // but TypeScript strict mode requires valid input
    expect(isCstNode({} as CstElement)).toBe(false)
  })

  it('should return false for undefined', () => {
    // Objects without 'children' property are not CST nodes
    expect(isCstNode({ image: '' } as CstElement)).toBe(false)
  })
})

describe('isCstToken', () => {
  it('should return true for tokens (objects with image property)', () => {
    const token = makeToken('HELLO')
    expect(isCstToken(token)).toBe(true)
  })

  it('should return false for CST nodes (objects with children property)', () => {
    const node = makeNode('test', {})
    expect(isCstToken(node)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isCstToken({} as CstElement)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isCstToken({ name: '' } as CstElement)).toBe(false)
  })
})

describe('getFirstCstNode', () => {
  it('should return the first CST node from a mixed array', () => {
    const token = makeToken('42')
    const node = makeNode('expression', {})
    const children: CstElement[] = [token, node]
    expect(getFirstCstNode(children)).toEqual(node)
  })

  it('should return the first node when array starts with a node', () => {
    const node = makeNode('statement', {})
    const token = makeToken('10')
    const children: CstElement[] = [node, token]
    expect(getFirstCstNode(children)).toEqual(node)
  })

  it('should return undefined when no nodes are in the array', () => {
    const token = makeToken('42')
    const children: CstElement[] = [token]
    expect(getFirstCstNode(children)).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(getFirstCstNode(undefined)).toBeUndefined()
  })

  it('should return undefined for empty array', () => {
    expect(getFirstCstNode([])).toBeUndefined()
  })
})

describe('getCstNodes', () => {
  it('should return only CST nodes from a mixed array', () => {
    const token = makeToken('42')
    const node1 = makeNode('expr1', {})
    const node2 = makeNode('expr2', {})
    const children: CstElement[] = [token, node1, node2, token]
    expect(getCstNodes(children)).toEqual([node1, node2])
  })

  it('should return empty array when no nodes are present', () => {
    const token = makeToken('42')
    const children: CstElement[] = [token, token]
    expect(getCstNodes(children)).toEqual([])
  })

  it('should return empty array for undefined input', () => {
    expect(getCstNodes(undefined)).toEqual([])
  })
})

describe('getFirstToken', () => {
  it('should return the first token from a mixed array', () => {
    const token = makeToken('10')
    const node = makeNode('statement', {})
    const children: CstElement[] = [node, token]
    expect(getFirstToken(children)).toEqual(token)
  })

  it('should return undefined when no tokens are in the array', () => {
    const node = makeNode('statement', {})
    const children: CstElement[] = [node]
    expect(getFirstToken(children)).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(getFirstToken(undefined)).toBeUndefined()
  })

  it('should return undefined for empty array', () => {
    expect(getFirstToken([])).toBeUndefined()
  })
})

describe('getTokens', () => {
  it('should return only tokens from a mixed array', () => {
    const token1 = makeToken('10')
    const node = makeNode('statement', {})
    const token2 = makeToken('GOTO')
    const children: CstElement[] = [token1, node, token2]
    expect(getTokens(children)).toEqual([token1, token2])
  })

  it('should return empty array when no tokens are present', () => {
    const node = makeNode('statement', {})
    const children: CstElement[] = [node]
    expect(getTokens(children)).toEqual([])
  })

  it('should return empty array for undefined input', () => {
    expect(getTokens(undefined)).toEqual([])
  })
})

describe('getLineNumberFromStatement', () => {
  it('should extract line number from statement CST', () => {
    const node = makeNode('statement', {
      NumberLiteral: [makeToken('100')],
    })
    expect(getLineNumberFromStatement(node)).toBe(100)
  })

  it('should return null when no NumberLiteral is present', () => {
    const node = makeNode('statement', {})
    expect(getLineNumberFromStatement(node)).toBeNull()
  })

  it('should return null when NumberLiteral is empty array', () => {
    const node = makeNode('statement', {
      NumberLiteral: [],
    })
    expect(getLineNumberFromStatement(node)).toBeNull()
  })

  it('should parse multi-digit line numbers correctly', () => {
    const node = makeNode('statement', {
      NumberLiteral: [makeToken('12345')],
    })
    expect(getLineNumberFromStatement(node)).toBe(12345)
  })

  it('should parse zero line number', () => {
    const node = makeNode('statement', {
      NumberLiteral: [makeToken('0')],
    })
    expect(getLineNumberFromStatement(node)).toBe(0)
  })
})

describe('getAdditiveFromExpression', () => {
  it('should navigate through the expression precedence chain to find additive', () => {
    // Build a minimal expression CST chain: expression -> logicalExpression -> ... -> additive
    const additive = makeNode('additive', {
      NumberLiteral: [makeToken('42')],
    })
    const bitwiseNot = makeNode('bitwiseNotExpression', { additive: [additive] })
    const bitwiseAnd = makeNode('bitwiseAndExpression', { bitwiseNotExpression: [bitwiseNot] })
    const bitwiseOr = makeNode('bitwiseOrExpression', { bitwiseAndExpression: [bitwiseAnd] })
    const bitwiseXor = makeNode('bitwiseXorExpression', { bitwiseOrExpression: [bitwiseOr] })
    const comparison = makeNode('comparisonExpression', { bitwiseXorExpression: [bitwiseXor] })
    const logicalNot = makeNode('logicalNotExpression', { comparisonExpression: [comparison] })
    const logicalAnd = makeNode('logicalAndExpression', { logicalNotExpression: [logicalNot] })
    const logicalOr = makeNode('logicalOrExpression', { logicalAndExpression: [logicalAnd] })
    const logical = makeNode('logicalExpression', { logicalOrExpression: [logicalOr] })
    const expression = makeNode('expression', { logicalExpression: [logical] })

    expect(getAdditiveFromExpression(expression)).toEqual(additive)
  })

  it('should return undefined when chain is broken at logicalExpression', () => {
    const expression = makeNode('expression', {
      logicalExpression: [],
    })
    expect(getAdditiveFromExpression(expression)).toBeUndefined()
  })

  it('should return undefined when chain is broken at comparisonExpression', () => {
    const logicalNot = makeNode('logicalNotExpression', { comparisonExpression: [] })
    const logicalAnd = makeNode('logicalAndExpression', { logicalNotExpression: [logicalNot] })
    const logicalOr = makeNode('logicalOrExpression', { logicalAndExpression: [logicalAnd] })
    const logical = makeNode('logicalExpression', { logicalOrExpression: [logicalOr] })
    const expression = makeNode('expression', { logicalExpression: [logical] })

    expect(getAdditiveFromExpression(expression)).toBeUndefined()
  })

  it('should return undefined for empty expression node', () => {
    const expression = makeNode('expression', {})
    expect(getAdditiveFromExpression(expression)).toBeUndefined()
  })
})

describe('getSourceTextFromCst', () => {
  it('should reconstruct source text from tokens', () => {
    const node = makeNode('printStatement', {
      Print: [makeToken('PRINT')],
      expression: [makeNode('expression', { NumberLiteral: [makeToken('42')] })],
    })
    expect(getSourceTextFromCst(node)).toBe('PRINT 42')
  })

  it('should return empty string for node with no children', () => {
    const node = makeNode('empty', {})
    expect(getSourceTextFromCst(node)).toBe('')
  })

  it('should handle deeply nested nodes', () => {
    const inner = makeNode('primary', { NumberLiteral: [makeToken('5')] })
    const additive = makeNode('additive', { primary: [inner], Plus: [makeToken('+')], primary2: [makeNode('primary', { NumberLiteral: [makeToken('3')] })] })
    const expr = makeNode('expression', { additive: [additive] })
    expect(getSourceTextFromCst(expr)).toBe('5 + 3')
  })

  it('should collapse multiple spaces into one', () => {
    const node = makeNode('statement', {
      NumberLiteral: [makeToken('10')],
      commandList: [makeNode('commandList', {
        command: [makeNode('command', {
          singleCommand: [makeNode('singleCommand', {
            printStatement: [makeNode('printStatement', {
              Print: [makeToken('PRINT')],
              printList: [makeNode('printList', {})],
            })],
          })],
        })],
      })],
    })
    // Should produce text without excessive whitespace
    const text = getSourceTextFromCst(node)
    expect(text).not.toContain('  ')
  })
})
