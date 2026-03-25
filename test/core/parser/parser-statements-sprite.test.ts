/**
 * Sprite Statement Parser Module Tests
 *
 * Tests for parser-statements-sprite.ts: sprite and animation statements
 * including DEF SPRITE, SPRITE, SPRITE ON/OFF, DEF MOVE, MOVE, CUT, ERA, POSITION.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'

describe('parser-statements-sprite: DEF SPRITE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse DEF SPRITE with basic parameters', async () => {
    const result = await parser.parse('10 DEF SPRITE 0, (0, 0, 0, 0, 0) = "A"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DEF SPRITE with CHR$ character set', async () => {
    const result = await parser.parse('10 DEF SPRITE 1, (1, 1, 0, 0, 0) = CHR$(&HAA)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DEF SPRITE with variable sprite number', async () => {
    const result = await parser.parse('10 DEF SPRITE N, (0, 0, 0, 0, 0) = "A"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DEF SPRITE with 16x16 size', async () => {
    const result = await parser.parse('10 DEF SPRITE 0, (0, 1, 0, 0, 0) = "AB"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: SPRITE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse SPRITE with position', async () => {
    const result = await parser.parse('10 SPRITE 0, 100, 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SPRITE without position (hide)', async () => {
    const result = await parser.parse('10 SPRITE 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SPRITE with variable coordinates', async () => {
    const result = await parser.parse('10 SPRITE I, X, Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SPRITE with expression coordinates', async () => {
    const result = await parser.parse('10 SPRITE 0, X + 10, Y * 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: SPRITE ON/OFF Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse SPRITE ON', async () => {
    const result = await parser.parse('10 SPRITE ON')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse SPRITE OFF', async () => {
    const result = await parser.parse('10 SPRITE OFF')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: DEF MOVE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse DEF MOVE with all parameters', async () => {
    const result = await parser.parse('10 DEF MOVE(0) = SPRITE(0, 0, 60, 10, 0, 0)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DEF MOVE with variables', async () => {
    const result = await parser.parse('10 DEF MOVE(N) = SPRITE(T, D, S, L, P, C)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse DEF MOVE with expressions', async () => {
    const result = await parser.parse('10 DEF MOVE(0) = SPRITE(1, 2, 3, 4, 5, 6)')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: MOVE Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse MOVE with action number', async () => {
    const result = await parser.parse('10 MOVE 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse MOVE with variable', async () => {
    const result = await parser.parse('10 MOVE N')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: CUT Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse CUT with single action number', async () => {
    const result = await parser.parse('10 CUT 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse CUT with multiple action numbers', async () => {
    const result = await parser.parse('10 CUT 0, 1, 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: ERA Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse ERA with single action number', async () => {
    const result = await parser.parse('10 ERA 0')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse ERA with multiple action numbers', async () => {
    const result = await parser.parse('10 ERA 0, 1, 2')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: POSITION Statement', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse POSITION with coordinates', async () => {
    const result = await parser.parse('10 POSITION 0, 100, 100')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  it('should parse POSITION with variables', async () => {
    const result = await parser.parse('10 POSITION N, X, Y')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parser-statements-sprite: Integration', () => {
  let parser: FBasicParser

  beforeEach(() => {
    parser = new FBasicParser()
  })

  it('should parse sprite program pattern', async () => {
    const code = `10 DEF SPRITE 0, (0, 0, 0, 0, 0) = CHR$(&HAA)
20 SPRITE ON
30 POSITION 0, 100, 100
40 DEF MOVE(0) = SPRITE(0, 0, 60, 10, 0, 0)
50 MOVE 0
60 SPRITE 0, 100, 100
70 CUT 0
80 ERA 0
90 SPRITE OFF`
    const result = await parser.parse(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(9)
  })
})
