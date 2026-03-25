/**
 * Parse with Chevrotain Module Tests
 *
 * Tests for parse-with-chevrotain.ts: the Chevrotain integration layer
 * including line-by-line parsing, comment handling, error handling,
 * and REPL-only command validation.
 */

import { describe, expect, test } from 'vitest'

import { parseWithChevrotain } from '@/core/parser/FBasicChevrotainParser'

describe('parse-with-chevrotain: Basic Parsing', () => {
  test('should parse single line program', () => {
    const result = parseWithChevrotain('10 PRINT "HELLO"')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    expect(result.cst?.name).toEqual('program')
  })

  test('should parse multi-line program', () => {
    const code = `10 PRINT "HELLO"
20 PRINT "WORLD"
30 END`
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(3)
  })

  test('should parse program with empty lines', () => {
    const code = `10 PRINT "A"

20 PRINT "B"`
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(2)
  })

  test('should trim whitespace from lines', () => {
    const code = '  10  PRINT  "HELLO"  '
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })
})

describe('parse-with-chevrotain: REM Comment Handling', () => {
  test('should handle REM comment lines', () => {
    const result = parseWithChevrotain('10 REM this is a comment')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(1)
  })

  test('should register REM line number in CST', () => {
    const result = parseWithChevrotain('10 REM comment')
    expect(result.success).toBe(true)
    const statements = result.cst?.children.statement
    expect(statements).toBeDefined()
    expect(Array.isArray(statements) && statements.length > 0).toBe(true)
    const stmt = statements![0] as { children: Record<string, unknown[]> }
    expect(stmt.children.NumberLiteral).toBeDefined()
    const numberTokens = stmt.children.NumberLiteral as Array<{ image: string }>
    expect(numberTokens.length).toBeGreaterThan(0)
    expect(numberTokens[0]!.image).toEqual('10')
  })

  test('should handle apostrophe comment lines', () => {
    const result = parseWithChevrotain("10 ' this is a comment")
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  test('should handle REM case-insensitively', () => {
    const result = parseWithChevrotain('10 rem comment')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
  })

  test('should handle mixed REM and code lines', () => {
    const code = `10 REM Start of program
20 PRINT "HELLO"
30 REM End of program`
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(true)
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(3)
  })
})

describe('parse-with-chevrotain: Error Handling', () => {
  test('should report syntax errors', () => {
    const result = parseWithChevrotain('10 INVALIDSYNTAX')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })

  test('should include line number in error', () => {
    const code = `10 PRINT "OK"
20 INVALID
30 PRINT "END"`
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]?.line).toEqual(2)
  })

  test('should include column in error', () => {
    const result = parseWithChevrotain('10 PRINT "OK" INVALID')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.[0]?.column).toBeDefined()
  })

  test('should report multiple errors across lines', () => {
    const code = `10 BAD1
20 BAD2
30 BAD3`
    const result = parseWithChevrotain(code)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThanOrEqual(3)
  })
})

describe('parse-with-chevrotain: REPL-Only Command Validation', () => {
  test('should reject LIST command', () => {
    const result = parseWithChevrotain('10 LIST')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined() // CST exists but success is false
    expect(result.errors?.[0]?.message).toEqual('LIST: Not applicable for IDE version')
  })

  test('should reject RUN command', () => {
    const result = parseWithChevrotain('10 RUN')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('RUN: Not applicable for IDE version - use the Run button instead')
  })

  test('should reject NEW command', () => {
    const result = parseWithChevrotain('10 NEW')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('NEW: Not applicable for IDE version')
  })

  test('should reject SAVE command', () => {
    const result = parseWithChevrotain('10 SAVE')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('SAVE: Not applicable for IDE version - use Export instead')
  })

  test('should reject LOAD command', () => {
    const result = parseWithChevrotain('10 LOAD')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('LOAD: Not applicable for IDE version - use Import instead')
  })

  test('should reject POKE statement', () => {
    const result = parseWithChevrotain('10 POKE &H7000, 255')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('POKE: Not applicable for IDE version')
  })

  test('should reject PEEK function', () => {
    const result = parseWithChevrotain('10 A = PEEK(&H7000)')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('PEEK: Not applicable for IDE version')
  })

  test('should reject FRE function', () => {
    const result = parseWithChevrotain('10 A = FRE(0)')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('FRE: Not applicable for IDE version')
  })

  test('should reject STOP statement', () => {
    const result = parseWithChevrotain('10 STOP')
    expect(result.success).toBe(false)
    expect(result.cst).toBeDefined()
    expect(result.errors?.[0]?.message).toEqual('STOP: Not applicable for IDE version')
  })

  test('should not produce duplicate errors for same REPL command', () => {
    const result = parseWithChevrotain('10 LIST: LIST')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    // Should only report the LIST error once (deduplication)
    const listErrors = result.errors!.filter(e => e.message.includes('LIST'))
    expect(listErrors.length).toEqual(1)
  })

  test('should allow INKEY$ function (fully implemented)', () => {
    const result = parseWithChevrotain('10 A$ = INKEY$')
    expect(result.success).toBe(true)
    expect(result.cst).toBeDefined()
    expect(result.errors).toBeUndefined()
  })
})

describe('parse-with-chevrotain: Program CST Structure', () => {
  test('should produce program CST with statement children', () => {
    const result = parseWithChevrotain('10 PRINT "A"\n20 PRINT "B"')
    expect(result.success).toBe(true)
    expect(result.cst?.name).toEqual('program')
    expect(result.cst?.children.statement).toBeDefined()
    expect(Array.isArray(result.cst?.children.statement)).toBe(true)
  })

  test('should handle CRLF line endings', () => {
    const result = parseWithChevrotain('10 PRINT "A"\r\n20 PRINT "B"')
    expect(result.success).toBe(true)
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(2)
  })

  test('should handle LF line endings', () => {
    const result = parseWithChevrotain('10 PRINT "A"\n20 PRINT "B"')
    expect(result.success).toBe(true)
    const statements = result.cst?.children.statement
    expect(Array.isArray(statements) ? statements.length : 0).toEqual(2)
  })
})
