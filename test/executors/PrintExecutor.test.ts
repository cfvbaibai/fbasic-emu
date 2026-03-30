/**
 * Print Executor Tests
 *
 * Unit tests for the PrintExecutor class.
 */

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { PrintExecutor } from '@/core/execution/executors/PrintExecutor'
import { FBasicParser } from '@/core/parser/FBasicParser'
import { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

import { parsePrintStatement } from '../test-helpers'

describe('PrintExecutor', () => {
  let executor: PrintExecutor
  let evaluator: ExpressionEvaluator
  let context: ExecutionContext
  let mockDeviceAdapter: BasicDeviceAdapter
  let printOutputMock: MockedFunction<(output: string) => void>

  beforeEach(() => {
    // Create mock device adapter to capture output
    printOutputMock = vi.fn()
    mockDeviceAdapter = {
      getJoystickCount: vi.fn(() => 0),
      getStickState: vi.fn(() => 0),
      setStickState: vi.fn(),
      pushStrigState: vi.fn(),
      consumeStrigState: vi.fn(() => 0),
      getSpritePosition: vi.fn(() => null),
      getInkeyState: vi.fn(() => ''),
      printOutput: printOutputMock,
      debugOutput: vi.fn(),
      errorOutput: vi.fn(),
      clearScreen: vi.fn(),
      setCursorPosition: vi.fn(),
      getCursorPosition: vi.fn(() => ({ x: 0, y: 0 })),
      getScreenCell: vi.fn(() => ' '),
      setColorPattern: vi.fn(),
      setColorPalette: vi.fn(),
      setBackdropColor: vi.fn(),
      setCharacterGeneratorMode: vi.fn(),
      getCharacterGeneratorMode: vi.fn(() => 2),
    }

    context = new ExecutionContext({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: mockDeviceAdapter,
    })
    // Ensure deviceAdapter is set on context
    context.deviceAdapter = mockDeviceAdapter
    evaluator = new ExpressionEvaluator(context)
    executor = new PrintExecutor(context, evaluator)
  })

  describe('Empty PRINT Statement', () => {
    it('should execute empty PRINT statement', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      // Empty PRINT should call printOutput with newline
      expect(printOutputMock).toHaveBeenCalledWith('\n')
    })
  })

  describe('PRINT with String Literals', () => {
    it('should execute PRINT statement with single string literal', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "Hello World"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledWith('Hello World\n')
    })

    it('should execute PRINT statement with multiple string literals', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", "B", "C"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: A at 0, B at 8, C at 16 (tab characters)
      // Does not end with comma, so should have newline
      expect(output).toEqual('A\tB\tC\n')
    })
  })

  describe('PRINT with Numbers', () => {
    it('should execute PRINT statement with number literal', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 42')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 42\n')
    })

    it('should reject floating point number literals', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse('10 PRINT 3.14')

      // Floating point literals should be rejected by the parser
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('PRINT with Variables', () => {
    it('should execute PRINT statement with variable', async () => {
      // Set up variable
      context.variables.set('X', { value: 100, type: 'number' })

      const printStmtCst = await parsePrintStatement('10 PRINT X')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 100\n')
    })

    it('should execute PRINT statement with string variable', async () => {
      // Set up variable
      context.variables.set('MSG', { value: 'Test Message', type: 'string' })

      const printStmtCst = await parsePrintStatement('10 PRINT MSG')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toEqual('Test Message\n')
    })
  })

  describe('PRINT with Expressions', () => {
    it('should execute PRINT statement with addition expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 10 + 20')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 30\n')
    })

    it('should execute PRINT statement with subtraction expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 50 - 20')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 30\n')
    })

    it('should execute PRINT statement with multiplication expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 5 * 6')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 30\n')
    })

    it('should execute PRINT statement with division expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 20 / 4')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 5\n')
    })

    it('should execute PRINT statement with complex expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT (10 + 20) * 2')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      expect(output).toEqual(' 60\n')
    })
  })

  describe('PRINT with Mixed Items', () => {
    it('should execute PRINT statement with string and number', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "Value:", 42')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: "Value:" at 0, 42 at 8 (tab character)
      // Numbers always get a space BEFORE them
      expect(output).toEqual('Value:\t 42\n')
    })

    it('should execute PRINT statement with string and expression', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "Result:", 10 + 20')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalled()
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: "Result:" at 0, 30 at 8 (tab character)
      // Numbers always get a space BEFORE them
      expect(output).toEqual('Result:\t 30\n')
    })
  })

  describe('PRINT with Comma Separator', () => {
    it('should handle comma separator with strings - tabbed columns', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", "B", "C"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: A at 0, B at 8, C at 16 (tab characters)
      // Does not end with comma, so should have newline
      expect(output).toEqual('A\tB\tC\n')
    })

    it('should handle comma separator with numbers - tabbed columns', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 1, 2, 3')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them, comma separator uses tabs
      expect(output).toEqual(' 1\t 2\t 3\n')
    })

    it('should handle comma separator with mixed types', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", 1, "B", 2')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: A at 0, 1 at 8, B at 16, 2 at 24 (tab characters)
      // Numbers always get a space BEFORE them
      expect(output).toEqual('A\t 1\tB\t 2\n')
    })

    it('should handle trailing comma separator', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", "B",')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Comma separator: A at 0, B at 8 (tab character)
      expect(output).toEqual('A\tB')
    })
  })

  describe('PRINT with Semicolon Separator', () => {
    it('should handle semicolon separator with strings - no space', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A"; "B"; "C"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()

      // Semicolon separator should print immediately (no space between strings)
      expect(output).toBe('ABC\n')
    })

    it('should handle semicolon separator with numbers - space between numbers', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 1; 2; 3')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()

      // Numbers always get a space BEFORE them (even the first one)
      expect(output).toBe(' 1 2 3\n')
    })

    it('should handle semicolon separator with string and number - no space', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A"; 1')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()

      // Numbers always get a space BEFORE them
      // Does not end with semicolon (semicolon is between items), so should have newline
      expect(output).toBe('A 1\n')
    })

    it('should handle semicolon separator with number and string - no space', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT 1; "A"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()

      // Numbers always get a space BEFORE them, strings follow immediately after numbers
      // Does not end with semicolon (semicolon is between items), so should have newline
      expect(output).toBe(' 1A\n')
    })

    it('should handle semicolon separator with mixed types', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A"; 1; "B"; 2')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // Numbers always get a space BEFORE them
      // "A"; 1 -> "A 1" (space before number)
      // 1; "B" -> " 1B" (space before 1, B follows immediately)
      // "B"; 2 -> "B 2" (space before number)
      // So: A 1B 2
      // Does not end with semicolon (semicolons are between items), so should have newline
      expect(output).toEqual('A 1B 2\n')
    })

    it('should handle trailing semicolon separator', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A"; "B";')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()
      expect(output).toBe('AB')
    })

    it('should handle semicolon with expression result', async () => {
      context.variables.set('X', { value: 10, type: 'number' })
      const printStmtCst = await parsePrintStatement('10 PRINT "X="; X')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()
      // Numbers always get a space BEFORE them
      // Does not end with semicolon (semicolon is between items), so should have newline
      expect(output).toBe('X= 10\n')
    })
  })

  describe('PRINT with Empty String', () => {
    it('should print a newline for PRINT "" (empty string)', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT ""')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // PRINT "" should print just a newline (blank line)
      expect(output).toEqual('\n')
    })

    it('should print a newline for PRINT "" after content with semicolon', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A"; ""')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // "A"; "" -> "A" followed by empty string, then newline
      expect(output).toEqual('A\n')
    })
  })

  describe('PRINT with Mixed Separators', () => {
    it('should handle comma and semicolon together', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", "B"; "C"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // A and B separated by comma (tab), B and C separated by semicolon (no space)
      // A at 0, B at 8, C immediately after B
      // Does not end with semicolon (semicolon is between items), so should have newline
      expect(output).toEqual('A\tBC\n')
    })

    it('should handle multiple commas and semicolons', async () => {
      const printStmtCst = await parsePrintStatement('10 PRINT "A", "B"; "C", "D"; "E"')
      expect(printStmtCst).not.toBeNull()

      executor.execute(printStmtCst!)

      expect(printOutputMock).toHaveBeenCalledTimes(1)
      const output = printOutputMock.mock.calls[0]?.[0]
      // A at 0 (comma/tab), B at 8 (semicolon), C immediately after B
      // (comma/tab), D at 16 (semicolon), E immediately after D
      // Does not end with semicolon (semicolons are between items), so should
      // have newline
      expect(output).toEqual('A\tBC\tDE\n')
    })
  })
})
