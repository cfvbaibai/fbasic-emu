import { describe, expect,test } from 'vitest'

import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'

describe('REPL-only Commands Parser', () => {
  // REPL-only commands that should parse but produce errors
  const replOnlyCommands = [
    { command: 'LIST', error: 'LIST: Not applicable for IDE version' },
    { command: 'NEW', error: 'NEW: Not applicable for IDE version' },
    { command: 'RUN', error: 'RUN: Not applicable for IDE version - use the Run button instead' },
    { command: 'SAVE', error: 'SAVE: Not applicable for IDE version - use Export instead' },
    { command: 'LOAD', error: 'LOAD: Not applicable for IDE version - use Import instead' },
    { command: 'LOAD?', error: 'LOAD: Not applicable for IDE version - use Import instead' },
    { command: 'KEY', error: 'KEY: Not applicable for IDE version' },
    { command: 'KEYLIST', error: 'KEYLIST: Not applicable for IDE version' },
    { command: 'CONT', error: 'CONT: Not applicable for IDE version' },
    { command: 'SYSTEM', error: 'SYSTEM: Not applicable for IDE version' },
  ]

  // Limited utility commands (INKEY$ is now fully implemented - see separate test below)
  const limitedUtilityCommands = [
    { command: 'POKE &H7000, 255', error: 'POKE: Not applicable for IDE version' },
    { command: 'A = PEEK(&H7000)', error: 'PEEK: Not applicable for IDE version' },
    { command: 'A = FRE(0)', error: 'FRE: Not applicable for IDE version' },
    { command: 'STOP', error: 'STOP: Not applicable for IDE version' },
  ]

  describe.each(replOnlyCommands)('$command', ({ command, error }) => {
    test(`parses ${command} but returns helpful error`, () => {
      const result = parseWithChevrotain(`10 ${command}`)

      // Should parse successfully (CST exists)
      expect(result.cst).toBeDefined()

      // But should return success: false with helpful error
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0]?.message).toBe(error)
    })
  })

  describe.each(limitedUtilityCommands)('$command', ({ command, error }) => {
    test(`parses ${command} but returns helpful error`, () => {
      const result = parseWithChevrotain(`10 ${command}`)

      // Should parse successfully (CST exists)
      expect(result.cst).toBeDefined()

      // But should return success: false with helpful error
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0]?.message).toBe(error)
    })
  })

  test('LIST with line range parses correctly', () => {
    const result = parseWithChevrotain('10 LIST 10-100')

    expect(result.cst).toBeDefined()
    expect(result.success).toBe(false)
    expect(result.errors?.[0]?.message).toBe('LIST: Not applicable for IDE version')
  })

  test('KEY with parameters parses correctly', () => {
    const result = parseWithChevrotain('10 KEY 1, "HELP"')

    expect(result.cst).toBeDefined()
    expect(result.success).toBe(false)
    expect(result.errors?.[0]?.message).toBe('KEY: Not applicable for IDE version')
  })

  test('multiple REPL-only commands all report errors', () => {
    const result = parseWithChevrotain('10 LIST: NEW: RUN')

    expect(result.cst).toBeDefined()
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThanOrEqual(1)
    // First error should be LIST
    expect(result.errors?.[0]?.message).toBe('LIST: Not applicable for IDE version')
  })

  test('valid commands still parse successfully', () => {
    const result = parseWithChevrotain('10 PRINT "HELLO"')

    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    expect(result.errors).toBeUndefined()
  })

  // INKEY$ is now a fully implemented function (GitHub issue #4)
  describe('INKEY$ function (now implemented)', () => {
    test('parses A$ = INKEY$ without parentheses', () => {
      const result = parseWithChevrotain('10 A$ = INKEY$')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    test('parses A$ = INKEY$(0) with parentheses', () => {
      const result = parseWithChevrotain('10 A$ = INKEY$(0)')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    test('parses INKEY$ in IF statement', () => {
      const result = parseWithChevrotain('10 K$ = INKEY$: IF K$ = "" THEN 10')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    test('parses INKEY$ in comparison', () => {
      const result = parseWithChevrotain('10 IF INKEY$ = "A" THEN PRINT "A pressed"')

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
      expect(result.errors).toBeUndefined()
    })
  })
})
