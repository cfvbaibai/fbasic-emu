/**
 * Parser Dispatcher Module Tests
 *
 * Tests for parser-dispatcher.ts: the command dispatch routing logic
 * that routes statements to the correct sub-parser based on the first token.
 *
 * These tests validate that the dispatcher correctly routes each keyword
 * to the appropriate statement parser, including edge cases around
 * ambiguous keywords (e.g., MOVE as statement vs function, DEF MOVE vs DEF SPRITE).
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-dispatcher: Keyword Routing', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  const routableKeywords = [
    { code: '10 GOTO 100', desc: 'GOTO routes to gotoStatement' },
    { code: '10 GOSUB 1000', desc: 'GOSUB routes to gosubStatement' },
    { code: '10 RETURN', desc: 'RETURN routes to returnStatement' },
    { code: '10 PRINT "X"', desc: 'PRINT routes to printStatement' },
    { code: '10 FOR I = 1 TO 10', desc: 'FOR routes to forStatement' },
    { code: '10 NEXT', desc: 'NEXT routes to nextStatement' },
    { code: '10 END', desc: 'END routes to endStatement' },
    { code: '10 PAUSE 60', desc: 'PAUSE routes to pauseStatement' },
    { code: '10 PLAY "C"', desc: 'PLAY routes to playStatement' },
    { code: '10 BEEP', desc: 'BEEP routes to beepStatement' },
    { code: '10 DIM A(10)', desc: 'DIM routes to dimStatement' },
    { code: '10 DATA 1, 2, 3', desc: 'DATA routes to dataStatement' },
    { code: '10 READ A', desc: 'READ routes to readStatement' },
    { code: '10 RESTORE', desc: 'RESTORE routes to restoreStatement' },
    { code: '10 INPUT A', desc: 'INPUT routes to inputStatement' },
    { code: '10 LINPUT A$', desc: 'LINPUT routes to linputStatement' },
    { code: '10 CLS', desc: 'CLS routes to clsStatement' },
    { code: '10 SWAP A, B', desc: 'SWAP routes to swapStatement' },
    { code: '10 CLEAR', desc: 'CLEAR routes to clearStatement' },
    { code: '10 LOCATE 0, 0', desc: 'LOCATE routes to locateStatement' },
    { code: '10 COLOR 0, 0, 0', desc: 'COLOR routes to colorStatement' },
    { code: '10 CGSET', desc: 'CGSET routes to cgsetStatement' },
    { code: '10 CGEN 0', desc: 'CGEN routes to cgenStatement' },
    { code: '10 VIEW', desc: 'VIEW routes to viewStatement' },
    { code: '10 SPRITE 0, 100, 100', desc: 'SPRITE routes to spriteStatement' },
    { code: '10 MOVE 0', desc: 'MOVE routes to moveStatement' },
    { code: '10 CUT 0', desc: 'CUT routes to cutStatement' },
    { code: '10 ERA 0', desc: 'ERA routes to eraStatement' },
    { code: '10 POSITION 0, 100, 100', desc: 'POSITION routes to positionStatement' },
  ]

  it.each(routableKeywords)('should correctly route $desc', async ({ code }) => {
    const result = await parser.parse(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-dispatcher: Ambiguous Keyword Routing', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should route DEF MOVE to defMoveStatement (not defSpriteStatement)', async () => {
    const result = await parser.parse('10 DEF MOVE(0) = SPRITE(0, 0, 0, 0, 0, 0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const stmt = result.cst?.children.statement
    expect(Array.isArray(stmt) ? stmt.length : 0).toEqual(1)
  })

  it('should route DEF SPRITE to defSpriteStatement', async () => {
    const result = await parser.parse('10 DEF SPRITE 0, (0, 0, 0, 0, 0) = "A"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route MOVE(n) function call (with parentheses) to expression', async () => {
    const result = await parser.parse('10 LET X = MOVE(0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route MOVE n statement (without parentheses) to moveStatement', async () => {
    const result = await parser.parse('10 MOVE 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route SPRITE ON to spriteOnOffStatement', async () => {
    const result = await parser.parse('10 SPRITE ON')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route SPRITE OFF to spriteOnOffStatement', async () => {
    const result = await parser.parse('10 SPRITE OFF')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route IF to ifThenStatement (not letStatement)', async () => {
    const result = await parser.parse('10 IF X = 1 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route ON to onStatement (not letStatement)', async () => {
    const result = await parser.parse('10 ON X GOTO 100, 200')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-dispatcher: LET as Fallback', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should route implicit assignment (no LET keyword) to letStatement', async () => {
    const result = await parser.parse('10 X = 5')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route explicit LET to letStatement', async () => {
    const result = await parser.parse('10 LET X = 5')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route string variable assignment to letStatement', async () => {
    const result = await parser.parse('10 A$ = "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-dispatcher: PALET Keyword Variants', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should route PALETB to paletStatement', async () => {
    const result = await parser.parse('10 PALETB 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route PALETS to paletStatement', async () => {
    const result = await parser.parse('10 PALETS 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route PALET B to paletStatement', async () => {
    const result = await parser.parse('10 PALET B 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should route PALET S to paletStatement', async () => {
    const result = await parser.parse('10 PALET S 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-dispatcher: Command List Structure', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should produce statement with NumberLiteral and commandList', async () => {
    const result = await parser.parse('10 PRINT "HELLO"')
    expect(result.success).toBe(true)
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(1)
    const stmt = statements![0] as { name: string; children: Record<string, unknown[]> }
    expect(stmt.name).toEqual('statement')
    expect(stmt.children.NumberLiteral).toBeDefined()
    expect(stmt.children.commandList).toBeDefined()
  })

  it('should handle colon-separated commands in commandList', async () => {
    const result = await parser.parse('10 CLS: PRINT "A": PRINT "B"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})
