/**
 * Data Statement Parser Module Tests
 *
 * Tests for parser-statements-data.ts: DATA, READ, RESTORE, and DIM statements.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-statements-data: DIM Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse single-dimension numeric array', async () => {
    const result = await parser.parse('10 DIM A(10)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse two-dimension numeric array', async () => {
    const result = await parser.parse('10 DIM A(10, 10)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse string array', async () => {
    const result = await parser.parse('10 DIM A$(10)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse multiple array declarations', async () => {
    const result = await parser.parse('10 DIM A(10), B(10, 10), C$(5)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DIM with expression dimensions', async () => {
    const result = await parser.parse('10 DIM A(N + 1)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject DIM without parentheses', async () => {
    const result = await parser.parse('10 DIM A')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('parser-statements-data: DATA Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse DATA with numeric values', async () => {
    const result = await parser.parse('10 DATA 10, 20, 30')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DATA with string values', async () => {
    const result = await parser.parse('10 DATA "HELLO", "WORLD"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DATA with unquoted string identifiers', async () => {
    const result = await parser.parse('10 DATA GOOD, MORNING')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DATA with hex values', async () => {
    const result = await parser.parse('10 DATA &H0A, &HFF')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DATA with mixed types', async () => {
    const result = await parser.parse('10 DATA 10, "HELLO", &HFF, GOOD')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse empty DATA statement', async () => {
    const result = await parser.parse('10 DATA')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-data: READ Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse READ with single variable', async () => {
    const result = await parser.parse('10 READ A')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse READ with multiple variables', async () => {
    const result = await parser.parse('10 READ A, B, C')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse READ with string variables', async () => {
    const result = await parser.parse('10 READ A$, B$, C$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse READ with array elements', async () => {
    const result = await parser.parse('10 READ A(0), B$(I)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse READ with mixed variables and arrays', async () => {
    const result = await parser.parse('10 READ A, B$, A(0), C$(I, J)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-data: RESTORE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse RESTORE without line number', async () => {
    const result = await parser.parse('10 RESTORE')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse RESTORE with line number', async () => {
    const result = await parser.parse('10 RESTORE 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-data: Integration', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse DATA READ RESTORE pattern', async () => {
    const code = `10 DATA 1, 2, 3, 4, 5
20 READ A, B, C
30 RESTORE
40 READ D, E`
    const result = await parser.parse(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(4)
  })

  it('should parse DIM with DATA READ pattern', async () => {
    const code = `10 DIM A(5)
20 DATA 10, 20, 30, 40, 50
30 FOR I = 0 TO 4
40 READ A(I)
50 NEXT`
    const result = await parser.parse(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})
