/**
 * Statement Expander Tests
 *
 * Unit tests for statement-expander.ts — expandStatements(), findStatementIndicesByLine(),
 * getFirstStatementIndexByLine(). Handles GOTO/GOSUB statement expansion and label mapping.
 */

import type { CstElement, CstNode, IToken } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import {
  expandStatements,
  findStatementIndicesByLine,
  getFirstStatementIndexByLine,
} from '@/core/execution/statement-expander'

// ---------------------------------------------------------------------------
// Mock helpers — produce valid Chevrotain CstNode / IToken without `as unknown as`
// ---------------------------------------------------------------------------

function makeToken(image: string): IToken {
  return {
    image,
    tokenType: { name: 'NumberLiteral' },
    tokenTypeIdx: 0,
    startOffset: 0,
    startLine: 1,
    startColumn: 1,
    endOffset: image.length - 1,
    endLine: 1,
    endColumn: image.length,
  }
}

function makeNode(name: string, children: Record<string, CstElement[]>): CstNode {
  return { name, children }
}

/** Build a statement CST node: `10 PRINT "Hello"` style */
function makeStatement(lineNumber: number, commands: CstNode[]): CstNode {
  const commandList = makeNode('commandList', {
    command: commands,
  })
  return makeNode('statement', {
    NumberLiteral: [makeToken(String(lineNumber))],
    commandList: [commandList],
  })
}

/** Build a command CST node (e.g. a PRINT command) */
function makeCommand(commandName: string): CstNode {
  return makeNode('command', {
    [commandName]: [makeNode(commandName, {})],
  })
}

// ---------------------------------------------------------------------------
// expandStatements
// ---------------------------------------------------------------------------

describe('expandStatements', () => {
  it('should expand a single statement with one command', () => {
    const stmts = [makeStatement(10, [makeCommand('printStatement')])]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(10)
    expect(result.statements[0]!.statementIndex).toBe(0)
    expect(result.labelMap.get(10)).toEqual([0])
  })

  it('should expand a statement with multiple colon-separated commands', () => {
    const stmts = [makeStatement(20, [
      makeCommand('printStatement'),
      makeCommand('gotoStatement'),
      makeCommand('endStatement'),
    ])]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(3)
    // All three commands share line number 20
    expect(result.statements[0]!.lineNumber).toBe(20)
    expect(result.statements[1]!.lineNumber).toBe(20)
    expect(result.statements[2]!.lineNumber).toBe(20)
    // Sequential indices
    expect(result.statements[0]!.statementIndex).toBe(0)
    expect(result.statements[1]!.statementIndex).toBe(1)
    expect(result.statements[2]!.statementIndex).toBe(2)
    // Label map maps line 20 to all three indices
    expect(result.labelMap.get(20)).toEqual([0, 1, 2])
  })

  it('should expand multiple statements into a flat list with correct indices', () => {
    const stmts = [
      makeStatement(10, [makeCommand('printStatement')]),
      makeStatement(20, [
        makeCommand('letStatement'),
        makeCommand('gotoStatement'),
      ]),
      makeStatement(30, [makeCommand('endStatement')]),
    ]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(4)
    // Line 10 -> index 0
    expect(result.statements[0]!.lineNumber).toBe(10)
    expect(result.statements[0]!.statementIndex).toBe(0)
    // Line 20 -> indices 1, 2
    expect(result.statements[1]!.lineNumber).toBe(20)
    expect(result.statements[1]!.statementIndex).toBe(1)
    expect(result.statements[2]!.lineNumber).toBe(20)
    expect(result.statements[2]!.statementIndex).toBe(2)
    // Line 30 -> index 3
    expect(result.statements[3]!.lineNumber).toBe(30)
    expect(result.statements[3]!.statementIndex).toBe(3)
    // Label maps
    expect(result.labelMap.get(10)).toEqual([0])
    expect(result.labelMap.get(20)).toEqual([1, 2])
    expect(result.labelMap.get(30)).toEqual([3])
  })

  it('should skip statements without a NumberLiteral', () => {
    const noNumber = makeNode('statement', {
      commandList: [makeNode('commandList', { command: [makeCommand('printStatement')] })],
    })
    const valid = makeStatement(10, [makeCommand('printStatement')])

    const result = expandStatements([noNumber, valid])

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(10)
  })

  it('should skip statements with NaN line number token', () => {
    // Use a token that is not a valid integer
    const badToken: IToken = {
      image: 'ABC',
      tokenType: { name: 'NumberLiteral' },
      tokenTypeIdx: 0,
      startOffset: 0,
      startLine: 1,
      startColumn: 1,
      endOffset: 2,
      endLine: 1,
      endColumn: 3,
    }
    const badStmt = makeNode('statement', {
      NumberLiteral: [badToken],
      commandList: [makeNode('commandList', { command: [makeCommand('printStatement')] })],
    })
    const valid = makeStatement(10, [makeCommand('printStatement')])

    const result = expandStatements([badStmt, valid])

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(10)
  })

  it('should skip statements without a commandList', () => {
    const noCommandList = makeNode('statement', {
      NumberLiteral: [makeToken('10')],
    })
    const valid = makeStatement(20, [makeCommand('printStatement')])

    const result = expandStatements([noCommandList, valid])

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(20)
  })

  it('should create a no-op command for statements with empty command list (e.g. REM)', () => {
    // Simulate a REM line — has line number and commandList but zero commands
    const remStmt = makeStatement(100, [])

    const result = expandStatements([remStmt])

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(100)
    expect(result.statements[0]!.statementIndex).toBe(0)
    // No-op command has name 'command' with empty children
    expect(result.statements[0]!.command.name).toBe('command')
    expect(result.statements[0]!.command.children).toEqual({})
    // Label map still registers line 100
    expect(result.labelMap.get(100)).toEqual([0])
  })

  it('should return empty results for empty input array', () => {
    const result = expandStatements([])

    expect(result.statements).toEqual([])
    expect(result.labelMap.size).toBe(0)
  })

  it('should handle large line numbers', () => {
    const stmts = [makeStatement(65535, [makeCommand('endStatement')])]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(65535)
  })

  it('should handle line number zero', () => {
    const stmts = [makeStatement(0, [makeCommand('printStatement')])]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(1)
    expect(result.statements[0]!.lineNumber).toBe(0)
  })

  it('should produce correct indices when a REM line is followed by normal lines', () => {
    const stmts = [
      makeStatement(10, []), // REM — no-op, index 0
      makeStatement(20, [makeCommand('printStatement')]), // index 1
      makeStatement(30, [
        makeCommand('printStatement'),
        makeCommand('gotoStatement'),
      ]), // indices 2, 3
    ]

    const result = expandStatements(stmts)

    expect(result.statements).toHaveLength(4)
    expect(result.labelMap.get(10)).toEqual([0])
    expect(result.labelMap.get(20)).toEqual([1])
    expect(result.labelMap.get(30)).toEqual([2, 3])
  })

  it('should keep command references to the original CST nodes', () => {
    const cmd1 = makeCommand('printStatement')
    const cmd2 = makeCommand('gotoStatement')
    const stmts = [makeStatement(10, [cmd1, cmd2])]

    const result = expandStatements(stmts)

    // The expanded statements reference the same command nodes
    expect(result.statements[0]!.command).toBe(cmd1)
    expect(result.statements[1]!.command).toBe(cmd2)
  })
})

// ---------------------------------------------------------------------------
// findStatementIndicesByLine
// ---------------------------------------------------------------------------

describe('findStatementIndicesByLine', () => {
  it('should return indices for an existing line number', () => {
    const labelMap = new Map<number, number[]>([
      [10, [0]],
      [20, [1, 2]],
    ])

    expect(findStatementIndicesByLine(labelMap, 10)).toEqual([0])
    expect(findStatementIndicesByLine(labelMap, 20)).toEqual([1, 2])
  })

  it('should return empty array for a non-existent line number', () => {
    const labelMap = new Map<number, number[]>([
      [10, [0]],
    ])

    expect(findStatementIndicesByLine(labelMap, 999)).toEqual([])
  })

  it('should return empty array for an empty label map', () => {
    const labelMap = new Map<number, number[]>()

    expect(findStatementIndicesByLine(labelMap, 10)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getFirstStatementIndexByLine
// ---------------------------------------------------------------------------

describe('getFirstStatementIndexByLine', () => {
  it('should return the first index for a line with multiple commands', () => {
    const labelMap = new Map<number, number[]>([
      [20, [1, 2, 3]],
    ])

    expect(getFirstStatementIndexByLine(labelMap, 20)).toBe(1)
  })

  it('should return the index for a line with a single command', () => {
    const labelMap = new Map<number, number[]>([
      [10, [0]],
    ])

    expect(getFirstStatementIndexByLine(labelMap, 10)).toBe(0)
  })

  it('should return undefined for a non-existent line number', () => {
    const labelMap = new Map<number, number[]>([
      [10, [0]],
    ])

    expect(getFirstStatementIndexByLine(labelMap, 999)).toBeUndefined()
  })

  it('should return undefined for an empty label map', () => {
    const labelMap = new Map<number, number[]>()

    expect(getFirstStatementIndexByLine(labelMap, 10)).toBeUndefined()
  })

  it('should return undefined when line maps to empty array', () => {
    // Edge case: a line number maps to an empty indices array
    const labelMap = new Map<number, number[]>([
      [10, []],
    ])

    expect(getFirstStatementIndexByLine(labelMap, 10)).toBeUndefined()
  })
})
