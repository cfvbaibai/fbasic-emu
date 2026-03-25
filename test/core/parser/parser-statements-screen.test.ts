/**
 * Screen Statement Parser Module Tests
 *
 * Tests for parser-statements-screen.ts: screen/display statements
 * including CLS, LOCATE, COLOR, CGSET, CGEN, PALET, VIEW.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-statements-screen: CLS Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CLS statement', async () => {
    const result = await parser.parse('10 CLS')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CLS with other statements', async () => {
    const result = await parser.parse('10 CLS: PRINT "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-screen: LOCATE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse LOCATE with coordinates', async () => {
    const result = await parser.parse('10 LOCATE 10, 5')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LOCATE with variables', async () => {
    const result = await parser.parse('10 LOCATE X, Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse LOCATE with expression coordinates', async () => {
    const result = await parser.parse('10 LOCATE X + 1, Y * 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject LOCATE without comma', async () => {
    const result = await parser.parse('10 LOCATE 10')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('parser-statements-screen: COLOR Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse COLOR with three arguments', async () => {
    const result = await parser.parse('10 COLOR 10, 5, 3')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse COLOR with variables', async () => {
    const result = await parser.parse('10 COLOR X, Y, N')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse COLOR with zero arguments', async () => {
    const result = await parser.parse('10 COLOR 0, 0, 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-screen: CGSET Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CGSET without arguments', async () => {
    const result = await parser.parse('10 CGSET')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CGSET with one argument', async () => {
    const result = await parser.parse('10 CGSET 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CGSET with two arguments', async () => {
    const result = await parser.parse('10 CGSET 0, 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-screen: CGEN Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CGEN with argument', async () => {
    const result = await parser.parse('10 CGEN 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CGEN with expression', async () => {
    const result = await parser.parse('10 CGEN M')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CGEN modes 0-3', async () => {
    for (const mode of [0, 1, 2, 3]) {
      const result = await parser.parse(`10 CGEN ${mode}`)
      expect(result.success).toBe(true)
    }
  })
})

describe('parser-statements-screen: PALET Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse PALETB with parameters', async () => {
    const result = await parser.parse('10 PALETB 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PALETS with parameters', async () => {
    const result = await parser.parse('10 PALETS 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PALET B with parameters', async () => {
    const result = await parser.parse('10 PALET B 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse PALET S with parameters', async () => {
    const result = await parser.parse('10 PALET S 0, 1, 2, 3, 4')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-screen: VIEW Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse VIEW statement', async () => {
    const result = await parser.parse('10 VIEW')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should reject VIEW with arguments', async () => {
    const result = await parser.parse('10 VIEW 100')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})
