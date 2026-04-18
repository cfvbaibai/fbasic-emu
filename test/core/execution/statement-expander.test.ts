/**
 * Statement Expander Tests
 *
 * Unit tests for statement-expander.ts — expandStatements().
 * Handles GOTO/GOSUB statement expansion and label mapping.
 */

import type { CstElement, CstNode, IToken } from 'chevrotain'
import { describe, expect, it } from 'vitest'

import {
  expandStatements,
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

/**
 * Build an IF-THEN command CST node.
 * Mirrors the parser structure: command -> singleCommand -> ifThenStatement.
 * The optional `hasCommandList` flag controls whether the IF has a THEN clause
 * with a commandList (true = THEN with statements, false = THEN-less IF).
 */
function makeIfCommand(options: {
  hasCommandList?: boolean
  hasLineNumber?: boolean
} = {}): CstNode {
  const ifThenChildren: Record<string, CstElement[]> = {
    logicalExpression: [makeNode('logicalExpression', {})],
  }
  if (options.hasLineNumber) {
    ifThenChildren.NumberLiteral = [makeToken('100')]
  } else if (options.hasCommandList) {
    ifThenChildren.commandList = [makeNode('commandList', { command: [] })]
  }
  // THEN-less IF has no Then token and no Goto token — only the bare commandList
  // When hasCommandList is false and hasLineNumber is false, it's THEN-less
  // with no inner commandList (the bare command after condition)

  return makeNode('command', {
    singleCommand: [makeNode('singleCommand', {
      ifThenStatement: [makeNode('ifThenStatement', ifThenChildren)],
    })],
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

  // ---------------------------------------------------------------------------
  // IF scope tracking (colon-scoped IF execution)
  // ---------------------------------------------------------------------------

  describe('IF scope tracking', () => {
    it('should set ifScopeEndIndex on IF statement when followed by colon-separated commands', () => {
      // `10 IF X=1 PRINT "A": PRINT "B"`
      // IF is index 0, PRINT "B" is index 1 — IF scope ends at index 1
      const stmts = [makeStatement(10, [
        makeIfCommand(),
        makeCommand('printStatement'),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(2)
      // The IF statement should have ifScopeEndIndex pointing to the last statement in its scope
      expect(result.statements[0]!.ifScopeEndIndex).toBe(1)
    })

    it('should set ifScopeEndIndex to own index when IF is last command on line', () => {
      // `10 IF X=1 PRINT "A"` — no colon-separated follow-ups
      const stmts = [makeStatement(10, [makeIfCommand()])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(1)
      // IF with no following commands: scope ends at its own index
      expect(result.statements[0]!.ifScopeEndIndex).toBe(0)
    })

    it('should set ifScopeEndIndex spanning multiple colon-separated commands', () => {
      // `10 IF X=1 PRINT "A": PRINT "B": PRINT "C"`
      // IF is index 0, PRINT "B" is 1, PRINT "C" is 2 — scope ends at 2
      const stmts = [makeStatement(10, [
        makeIfCommand(),
        makeCommand('printStatement'),
        makeCommand('printStatement'),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(3)
      expect(result.statements[0]!.ifScopeEndIndex).toBe(2)
    })

    it('should set ifScopeEndIndex for nested IF (IF followed by another IF)', () => {
      // `10 IF X=1 PRINT "A": IF Y=1 PRINT "B"`
      // First IF is index 0, second IF is index 1 — first IF scope ends at 1
      const stmts = [makeStatement(10, [
        makeIfCommand(),
        makeIfCommand(),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(2)
      // First IF scopes over the second IF
      expect(result.statements[0]!.ifScopeEndIndex).toBe(1)
      // Second IF has no following commands, so scope ends at its own index
      expect(result.statements[1]!.ifScopeEndIndex).toBe(1)
    })

    it('should not set ifScopeEndIndex on non-IF statements', () => {
      // `10 PRINT "A": PRINT "B"`
      const stmts = [makeStatement(10, [
        makeCommand('printStatement'),
        makeCommand('printStatement'),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(2)
      expect(result.statements[0]!.ifScopeEndIndex).toBeUndefined()
      expect(result.statements[1]!.ifScopeEndIndex).toBeUndefined()
    })

    it('should not set ifScopeEndIndex for IF with line number jump (THEN/GOTO)', () => {
      // `10 IF X=1 THEN 100: PRINT "A"`
      // IF with line number jump — does NOT scope over following colon commands
      const stmts = [makeStatement(10, [
        makeIfCommand({ hasLineNumber: true }),
        makeCommand('printStatement'),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(2)
      // IF with line number jump has no colon scope
      expect(result.statements[0]!.ifScopeEndIndex).toBeUndefined()
      expect(result.statements[1]!.ifScopeEndIndex).toBeUndefined()
    })

    it('should set ifScopeEndIndex for IF-THEN with commandList', () => {
      // `10 IF X=1 THEN PRINT "A": PRINT "B"`
      // IF-THEN with commandList — scope over following colon commands
      const stmts = [makeStatement(10, [
        makeIfCommand({ hasCommandList: true }),
        makeCommand('printStatement'),
      ])]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(2)
      // IF-THEN with commandList scopes over following colon commands
      expect(result.statements[0]!.ifScopeEndIndex).toBe(1)
    })

    it('should scope IF over commands across multiple lines', () => {
      // Line 10: PRINT "A"
      // Line 20: IF X=1 PRINT "B": PRINT "C"
      // Line 30: PRINT "D"
      // IF scope on line 20 should NOT span to line 30
      const stmts = [
        makeStatement(10, [makeCommand('printStatement')]),
        makeStatement(20, [makeIfCommand(), makeCommand('printStatement')]),
        makeStatement(30, [makeCommand('printStatement')]),
      ]

      const result = expandStatements(stmts)

      expect(result.statements).toHaveLength(4)
      // Line 10 PRINT: no IF scope
      expect(result.statements[0]!.ifScopeEndIndex).toBeUndefined()
      // Line 20 IF: scope ends at index 2 (PRINT "C" on same line)
      expect(result.statements[1]!.ifScopeEndIndex).toBe(2)
      // Line 20 PRINT "C": no IF scope
      expect(result.statements[2]!.ifScopeEndIndex).toBeUndefined()
      // Line 30 PRINT "D": no IF scope
      expect(result.statements[3]!.ifScopeEndIndex).toBeUndefined()
    })
  })
})
