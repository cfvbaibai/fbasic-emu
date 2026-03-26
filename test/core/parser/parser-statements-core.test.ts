/**
 * Core Statement Parser Module Tests
 *
 * Tests for parser-statements-core.ts: core F-BASIC statements
 * including GOTO, GOSUB, RETURN, FOR/NEXT, IF/THEN, ON, INPUT, LINPUT,
 * SWAP, CLEAR, PAUSE, PLAY, BEEP, PRINT, LET, END.
 *
 * These tests validate parsing through the FBasicParser public API,
 * targeting specific statements registered by the core statements module.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { getFirstCstNode } from '@/core/parser/cst-helpers'
import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-statements-core: GOTO Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse GOTO with line number', async () => {
    const result = await parser.parse('10 GOTO 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(1)
  })

  it('should parse GOTO with expression line number', async () => {
    const result = await parser.parse('10 GOTO 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject GOTO without line number', async () => {
    const result = await parser.parse('10 GOTO')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('parser-statements-core: GOSUB Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse GOSUB with line number', async () => {
    const result = await parser.parse('10 GOSUB 1000')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject GOSUB without line number', async () => {
    const result = await parser.parse('10 GOSUB')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('parser-statements-core: RETURN Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse RETURN without line number', async () => {
    const result = await parser.parse('100 RETURN')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse RETURN with line number', async () => {
    const result = await parser.parse('100 RETURN 50')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: END Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse END statement', async () => {
    const result = await parser.parse('100 END')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse END with other statements on same line', async () => {
    const result = await parser.parse('10 PRINT "DONE": END')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: PAUSE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse PAUSE with number literal', async () => {
    const result = await parser.parse('10 PAUSE 60')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PAUSE with variable expression', async () => {
    const result = await parser.parse('10 PAUSE N')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PAUSE with arithmetic expression', async () => {
    const result = await parser.parse('10 PAUSE 30 * 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: PLAY Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse PLAY with string literal', async () => {
    const result = await parser.parse('10 PLAY "CDEFG"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PLAY with variable', async () => {
    const result = await parser.parse('10 PLAY M$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PLAY with string concatenation', async () => {
    const result = await parser.parse('10 PLAY "C" + "D"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: BGPLAY Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse BGPLAY with string literal', async () => {
    const result = await parser.parse('10 BGPLAY "CDEFG"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse BGPLAY with variable', async () => {
    const result = await parser.parse('10 BGPLAY M$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse BGPLAY with string concatenation', async () => {
    const result = await parser.parse('10 BGPLAY "C" + "D"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject BGPLAY without argument', async () => {
    const result = await parser.parse('10 BGPLAY')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('should distinguish BGPLAY from PLAY', async () => {
    const bgplayResult = await parser.parse('10 BGPLAY "C"')
    const playResult = await parser.parse('10 PLAY "C"')
    expect(bgplayResult.success).toBe(true)
    expect(playResult.success).toBe(true)
    // Verify they produce different CST node names
    // CST path: statement -> commandList -> command -> singleCommand -> bgplayStatement/playStatement
    const bgplayCmdList = getFirstCstNode(bgplayResult.cst?.children?.statement)
    const playCmdList = getFirstCstNode(playResult.cst?.children?.statement)
    const bgplayCmd = getFirstCstNode(bgplayCmdList?.children?.commandList)
    const playCmd = getFirstCstNode(playCmdList?.children?.commandList)
    const bgplaySingle = getFirstCstNode(bgplayCmd?.children?.command)
    const playSingle = getFirstCstNode(playCmd?.children?.command)
    const bgplayLeaf = getFirstCstNode(bgplaySingle?.children?.singleCommand)
    const playLeaf = getFirstCstNode(playSingle?.children?.singleCommand)
    expect(getFirstCstNode(bgplayLeaf?.children?.bgplayStatement)).toBeDefined()
    expect(getFirstCstNode(playLeaf?.children?.playStatement)).toBeDefined()
    // Cross-check: BGPLAY should NOT produce playStatement and vice versa
    expect(getFirstCstNode(bgplayLeaf?.children?.playStatement)).toBeUndefined()
    expect(getFirstCstNode(playLeaf?.children?.bgplayStatement)).toBeUndefined()
  })
})

describe('parser-statements-core: BEEP Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse BEEP statement', async () => {
    const result = await parser.parse('10 BEEP')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: SWAP Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse SWAP with simple variables', async () => {
    const result = await parser.parse('10 SWAP A, B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SWAP with string variables', async () => {
    const result = await parser.parse('10 SWAP A$, B$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SWAP with array elements', async () => {
    const result = await parser.parse('10 SWAP A(1), A(2)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject SWAP without comma', async () => {
    const result = await parser.parse('10 SWAP A B')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('parser-statements-core: CLEAR Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CLEAR without arguments', async () => {
    const result = await parser.parse('10 CLEAR')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CLEAR with hex address', async () => {
    const result = await parser.parse('10 CLEAR &H7600')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CLEAR with decimal address', async () => {
    const result = await parser.parse('10 CLEAR 30208')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: ON Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse ON GOTO with multiple targets', async () => {
    const result = await parser.parse('10 ON X GOTO 100, 200, 300')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ON GOSUB with multiple targets', async () => {
    const result = await parser.parse('10 ON N GOSUB 1000, 2000, 3000')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ON RETURN with line numbers', async () => {
    const result = await parser.parse('10 ON X RETURN 100, 200, 300')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ON RESTORE with line numbers', async () => {
    const result = await parser.parse('10 ON X RESTORE 100, 200, 300')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ON with expression index', async () => {
    const result = await parser.parse('10 ON I + 1 GOTO 100, 200')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: INPUT Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse INPUT with single variable', async () => {
    const result = await parser.parse('10 INPUT A')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse INPUT with prompt and variable', async () => {
    const result = await parser.parse('10 INPUT "NAME"; A$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse INPUT with multiple variables', async () => {
    const result = await parser.parse('10 INPUT A, B, C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse INPUT with prompt and multiple variables', async () => {
    const result = await parser.parse('10 INPUT "X,Y"; X, Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: LINPUT Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse LINPUT with variable', async () => {
    const result = await parser.parse('10 LINPUT A$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LINPUT with prompt and variable', async () => {
    const result = await parser.parse('10 LINPUT "PROMPT"; A$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LINPUT with comma separator', async () => {
    const result = await parser.parse('10 LINPUT "ENTER", A$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: IF/THEN Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse IF THEN with line number jump', async () => {
    const result = await parser.parse('10 IF X = 10 THEN 500')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF THEN with command', async () => {
    const result = await parser.parse('10 IF X = 10 THEN PRINT X')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF GOTO with line number', async () => {
    const result = await parser.parse('10 IF X = 10 GOTO 500')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with AND operator', async () => {
    const result = await parser.parse('10 IF X > 0 AND Y < 10 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with OR operator', async () => {
    const result = await parser.parse('10 IF A = 1 OR B = 2 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with NOT operator', async () => {
    const result = await parser.parse('10 IF NOT X = 0 THEN PRINT X')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with colon-separated THEN statements', async () => {
    const result = await parser.parse('10 IF X THEN PRINT A: PRINT B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with comparison operators', async () => {
    const result = await parser.parse('10 IF X <> 0 THEN PRINT X')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with <= operator', async () => {
    const result = await parser.parse('10 IF I <= 10 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF with >= operator', async () => {
    const result = await parser.parse('10 IF I >= 0 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: LET Statement (assignment)', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse LET with explicit keyword', async () => {
    const result = await parser.parse('10 LET X = 10')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse implicit LET (assignment without keyword)', async () => {
    const result = await parser.parse('10 X = 10')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LET with array element assignment', async () => {
    const result = await parser.parse('10 LET A(0) = 10')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse implicit array element assignment', async () => {
    const result = await parser.parse('10 A$(I) = "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse string variable assignment', async () => {
    const result = await parser.parse('10 A$ = "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LET with hex literal', async () => {
    const result = await parser.parse('10 LET Z = &HDD')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: PRINT Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse PRINT with no arguments', async () => {
    const result = await parser.parse('10 PRINT')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with string literal', async () => {
    const result = await parser.parse('10 PRINT "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with comma-separated items', async () => {
    const result = await parser.parse('10 PRINT A, B, C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with semicolon-separated items', async () => {
    const result = await parser.parse('10 PRINT A; B; C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with trailing semicolon', async () => {
    const result = await parser.parse('10 PRINT A;')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with trailing comma', async () => {
    const result = await parser.parse('10 PRINT A,')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with function call', async () => {
    const result = await parser.parse('10 PRINT LEN(A$)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PRINT with expression', async () => {
    const result = await parser.parse('10 PRINT X + Y * 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: FOR/NEXT Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse basic FOR NEXT loop', async () => {
    const code = `10 FOR I = 1 TO 10
20 PRINT I
30 NEXT`
    const result = await parser.parse(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(3)
  })

  it('should parse FOR with STEP clause', async () => {
    const result = await parser.parse('10 FOR I = 1 TO 10 STEP 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse FOR with negative STEP', async () => {
    const result = await parser.parse('10 FOR I = 10 TO 1 STEP -1')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject NEXT with variable name', async () => {
    const result = await parser.parse('10 NEXT I')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('should parse FOR with expression bounds', async () => {
    const result = await parser.parse('10 FOR I = 1 + 1 TO 10 - 2 STEP 2 * 1')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-core: Colon-Separated Commands', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse multiple statements separated by colons', async () => {
    const result = await parser.parse('10 LET X = 1: LET Y = 2: PRINT X, Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse GOTO in colon-separated chain', async () => {
    const result = await parser.parse('10 LET X = 1: GOTO 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse FOR NEXT on same line with colons', async () => {
    const result = await parser.parse('10 FOR I = 1 TO 5: PRINT I: NEXT')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse IF THEN with colon chain', async () => {
    const result = await parser.parse('10 IF X > 0 THEN LET Y = X: PRINT Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})
