/**
 * REPL Statement Parser Module Tests
 *
 * Tests for parser-statements-repl.ts: REPL-only and limited utility commands
 * including LIST, NEW, RUN, SAVE, LOAD, KEY, KEYLIST, CONT, SYSTEM,
 * POKE, PEEK, FRE, INKEY$, STOP.
 *
 * Note: These commands are parsed by the grammar but produce errors at the
 * Chevrotain integration layer (parse-with-chevrotain.ts) because they are
 * not applicable in the IDE version. We use parseWithChevrotain directly
 * because FBasicParser.parse() does not pass through the CST on errors.
 */

import { describe, expect, test } from 'vitest'

import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'

describe('parser-statements-repl: LIST Statement', () => {
  test('should parse LIST without arguments (produces REPL error)', () => {
    const result = parseWithChevrotain('10 LIST')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LIST: Not applicable for IDE version')
  })

  test('should parse LIST with line range (produces REPL error)', () => {
    const result = parseWithChevrotain('10 LIST 10-100')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LIST: Not applicable for IDE version')
  })

  test('should parse LIST with single line number (produces REPL error)', () => {
    const result = parseWithChevrotain('10 LIST 50')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LIST: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: NEW Statement', () => {
  test('should parse NEW (produces REPL error)', () => {
    const result = parseWithChevrotain('10 NEW')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('NEW: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: RUN Statement', () => {
  test('should parse RUN (produces REPL error)', () => {
    const result = parseWithChevrotain('10 RUN')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('RUN: Not applicable for IDE version - use the Run button instead')
  })
})

describe('parser-statements-repl: SAVE Statement', () => {
  test('should parse SAVE (produces REPL error)', () => {
    const result = parseWithChevrotain('10 SAVE')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('SAVE: Not applicable for IDE version - use Export instead')
  })
})

describe('parser-statements-repl: LOAD Statement', () => {
  test('should parse LOAD (produces REPL error)', () => {
    const result = parseWithChevrotain('10 LOAD')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LOAD: Not applicable for IDE version - use Import instead')
  })

  test('should parse LOAD? with verify flag (produces REPL error)', () => {
    const result = parseWithChevrotain('10 LOAD?')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LOAD: Not applicable for IDE version - use Import instead')
  })
})

describe('parser-statements-repl: KEY Statement', () => {
  test('should parse KEY without parameters (produces REPL error)', () => {
    const result = parseWithChevrotain('10 KEY')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('KEY: Not applicable for IDE version')
  })

  test('should parse KEY with parameters (produces REPL error)', () => {
    const result = parseWithChevrotain('10 KEY 1, "HELP"')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('KEY: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: KEYLIST Statement', () => {
  test('should parse KEYLIST (produces REPL error)', () => {
    const result = parseWithChevrotain('10 KEYLIST')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('KEYLIST: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: CONT Statement', () => {
  test('should parse CONT (produces REPL error)', () => {
    const result = parseWithChevrotain('10 CONT')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('CONT: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: SYSTEM Statement', () => {
  test('should parse SYSTEM (produces REPL error)', () => {
    const result = parseWithChevrotain('10 SYSTEM')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('SYSTEM: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: POKE Statement', () => {
  test('should parse POKE with address and value (produces REPL error)', () => {
    const result = parseWithChevrotain('10 POKE &H7000, 255')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('POKE: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: STOP Statement', () => {
  test('should parse STOP (produces REPL error)', () => {
    const result = parseWithChevrotain('10 STOP')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('STOP: Not applicable for IDE version')
  })
})

describe('parser-statements-repl: Multiple REPL Commands', () => {
  test('should report error for colon-separated REPL commands', () => {
    const result = parseWithChevrotain('10 LIST: NEW: RUN')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThanOrEqual(1)
    expect(result.errors?.[0]?.message).toEqual('LIST: Not applicable for IDE version')
  })
})
