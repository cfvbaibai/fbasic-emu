/**
 * Expression Parser Module Tests
 *
 * Tests for parser-expressions.ts: expression parsing including
 * arithmetic, string, comparison, logical, bitwise operators,
 * function calls, array access, and operator precedence.
 *
 * These tests validate parsing through the FBasicParser public API,
 * targeting specific expression patterns registered by the expression module.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-expressions: Primary Expressions', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse number literal', async () => {
    const result = await parser.parse('10 LET X = 42')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse string literal', async () => {
    const result = await parser.parse('10 LET A$ = "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse hex literal', async () => {
    const result = await parser.parse('10 LET X = &HFF')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse identifier variable', async () => {
    const result = await parser.parse('10 LET X = Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse parenthesized expression', async () => {
    const result = await parser.parse('10 LET X = (A + B)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Unary Operators', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse unary minus', async () => {
    const result = await parser.parse('10 LET X = -5')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse unary plus', async () => {
    const result = await parser.parse('10 LET X = +5')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should not parse double negative (--5 is not valid F-BASIC)', async () => {
    const result = await parser.parse('10 LET X = --5')
    // F-BASIC lexer treats --5 as subtraction of negative 5,
    // which requires a left operand and fails at the statement level
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('should parse unary minus on variable', async () => {
    const result = await parser.parse('10 LET X = -Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Arithmetic Operators', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse addition', async () => {
    const result = await parser.parse('10 LET X = A + B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse subtraction', async () => {
    const result = await parser.parse('10 LET X = A - B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse multiplication', async () => {
    const result = await parser.parse('10 LET X = A * B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse division', async () => {
    const result = await parser.parse('10 LET X = A / B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse MOD operator', async () => {
    const result = await parser.parse('10 LET X = A MOD B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse complex arithmetic expression', async () => {
    const result = await parser.parse('10 LET X = A + B * C - D / E')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Operator Precedence', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse multiplication before addition (left operand)', async () => {
    const result = await parser.parse('10 LET X = A * B + C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse multiplication before addition (right operand)', async () => {
    const result = await parser.parse('10 LET X = A + B * C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse MOD after multiplication', async () => {
    const result = await parser.parse('10 LET X = A * B MOD C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse addition after MOD', async () => {
    const result = await parser.parse('10 LET X = A MOD B + C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should respect parentheses for precedence override', async () => {
    const result = await parser.parse('10 LET X = (A + B) * C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse deeply nested parenthesized expression', async () => {
    const result = await parser.parse('10 LET X = ((A + B) * (C - D))')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Comparison Operators', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse equal comparison', async () => {
    const result = await parser.parse('10 IF X = Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse not-equal comparison', async () => {
    const result = await parser.parse('10 IF X <> Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse less-than comparison', async () => {
    const result = await parser.parse('10 IF X < Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse greater-than comparison', async () => {
    const result = await parser.parse('10 IF X > Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse less-than-or-equal comparison', async () => {
    const result = await parser.parse('10 IF X <= Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse greater-than-or-equal comparison', async () => {
    const result = await parser.parse('10 IF X >= Y THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse comparison with expressions', async () => {
    const result = await parser.parse('10 IF A + B > C * D THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Logical Operators', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse AND operator', async () => {
    const result = await parser.parse('10 IF X > 0 AND Y > 0 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse OR operator', async () => {
    const result = await parser.parse('10 IF X = 0 OR Y = 0 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse NOT operator', async () => {
    const result = await parser.parse('10 IF NOT X = 0 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse XOR operator', async () => {
    const result = await parser.parse('10 LET X = A XOR B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse NOT AND OR precedence chain', async () => {
    const result = await parser.parse('10 IF NOT A = 0 AND B = 1 OR C = 2 THEN 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse XOR with OR and AND', async () => {
    const result = await parser.parse('10 LET X = A OR B XOR C AND D')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Bitwise Operators', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse bitwise AND', async () => {
    const result = await parser.parse('10 LET X = A AND 1')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse bitwise OR', async () => {
    const result = await parser.parse('10 LET X = A OR 1')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse bitwise NOT', async () => {
    const result = await parser.parse('10 LET X = NOT A')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse bitwise XOR', async () => {
    const result = await parser.parse('10 LET X = A XOR B')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse chained bitwise operations', async () => {
    const result = await parser.parse('10 LET X = (A AND &HF0) OR (B AND &H0F)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Function Calls', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse ABS function', async () => {
    const result = await parser.parse('10 LET X = ABS(-5)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SGN function', async () => {
    const result = await parser.parse('10 LET X = SGN(N)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse RND function', async () => {
    const result = await parser.parse('10 LET X = RND(1)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LEN function', async () => {
    const result = await parser.parse('10 LET X = LEN(A$)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LEFT$ function', async () => {
    const result = await parser.parse('10 LET B$ = LEFT$(A$, 3)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse RIGHT$ function', async () => {
    const result = await parser.parse('10 LET B$ = RIGHT$(A$, 2)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse MID$ function', async () => {
    const result = await parser.parse('10 LET B$ = MID$(A$, 2, 3)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse STR$ function', async () => {
    const result = await parser.parse('10 LET A$ = STR$(42)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse VAL function', async () => {
    const result = await parser.parse('10 LET X = VAL("42")')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CHR$ function', async () => {
    const result = await parser.parse('10 LET A$ = CHR$(65)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ASC function', async () => {
    const result = await parser.parse('10 LET X = ASC("A")')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse HEX$ function', async () => {
    const result = await parser.parse('10 LET A$ = HEX$(255)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse INKEY$ without parentheses', async () => {
    const result = await parser.parse('10 A$ = INKEY$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse INKEY$ with parentheses', async () => {
    const result = await parser.parse('10 A$ = INKEY$(0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse STICK function', async () => {
    const result = await parser.parse('10 LET X = STICK(0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse STRIG function', async () => {
    const result = await parser.parse('10 LET X = STRIG(0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse nested function calls', async () => {
    const result = await parser.parse('10 LET X = LEN(STR$(ABS(N)))')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse function in expression', async () => {
    const result = await parser.parse('10 LET X = ABS(A) + ABS(B)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: Array Access', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse single-dimension array access', async () => {
    const result = await parser.parse('10 LET X = A(5)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse two-dimension array access', async () => {
    const result = await parser.parse('10 LET X = A(2, 3)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse string array access', async () => {
    const result = await parser.parse('10 LET B$ = A$(I)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse array access with expression index', async () => {
    const result = await parser.parse('10 LET X = A(I + 1)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: CSRLIN and POS', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CSRLIN without parentheses', async () => {
    const result = await parser.parse('10 LET Y = CSRLIN')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse POS with parentheses', async () => {
    const result = await parser.parse('10 LET X = POS(0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-expressions: String Concatenation', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse string concatenation with +', async () => {
    const result = await parser.parse('10 LET C$ = A$ + B$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse concatenation of function results', async () => {
    const result = await parser.parse('10 LET C$ = LEFT$(A$, 3) + RIGHT$(B$, 2)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})
