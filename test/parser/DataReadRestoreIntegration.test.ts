/**
 * DATA, READ, RESTORE Integration Tests
 *
 * Tests for complete DATA/READ/RESTORE workflows based on spec examples.
 */

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

describe('DATA/READ/RESTORE Integration', () => {
  let interpreter: BasicInterpreter
  let mockDeviceAdapter: BasicDeviceAdapter
  let printOutputMock: MockedFunction<(output: string) => void>

  beforeEach(() => {
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

    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: mockDeviceAdapter,
    })
  })

  describe('Numerical Value Data Reading (Spec Example 1)', () => {
    it('should read numeric data values sequentially', async () => {
      const code = `10 DATA 3, 4, 1, 6, 2, 7, 8, 3, 4, 9
20 FOR I=1 TO 10
30 READ X
40 PRINT X;
50 NEXT
60 END`

      const result = await interpreter.execute(code)

      if (!result.success) {
        console.log('Execution errors:', result.errors)
      }
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Each PRINT X; creates a separate output (semicolon at end doesn't suppress newline in current impl)
      // Verify all 10 values were printed, plus "OK" at the end
      expect(printOutputMock).toHaveBeenCalledTimes(11)
      const outputs = printOutputMock.mock.calls.map(call => call[0])

      // Expected values in order: 3, 4, 1, 6, 2, 7, 8, 3, 4, 9, OK
      // According to spec, positive numbers have a leading space (sign position)
      const expectedValues = [' 3', ' 4', ' 1', ' 6', ' 2', ' 7', ' 8', ' 3', ' 4', ' 9', 'OK\n']
      expect(outputs).toEqual(expectedValues)

      // Verify variable X has the last read value
      expect(result.variables.get('X')?.value).toBe(9)
    })

    it('should read hex literal from DATA as numeric value', async () => {
      const code = `10 DATA &HDD, &H0A
20 READ A, B
30 END`

      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(221) // &HDD = 221
      expect(result.variables.get('B')?.value).toBe(10) // &H0A = 10
    })
  })

  describe('Character Data Reading (Spec Example 2)', () => {
    it('should read unquoted string data values', async () => {
      const code = `10 DATA GOOD, MORNING, EVENING
20 READ A$, B$, C$
30 PRINT A$; " "; B$; "."
40 PRINT A$; " "; C$; "."
50 END`

      const result = await interpreter.execute(code)

      if (!result.success) {
        console.log('Execution errors:', result.errors)
      }
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify variable values were read correctly
      expect(result.variables.get('A$')?.value).toBe('GOOD')
      expect(result.variables.get('B$')?.value).toBe('MORNING')
      expect(result.variables.get('C$')?.value).toBe('EVENING')

      // Verify PRINT outputs
      expect(printOutputMock).toHaveBeenCalledTimes(3)
      const outputs = printOutputMock.mock.calls.map(call => call[0])
      // PRINT A$; " "; B$; "." creates: "GOOD" + " " + "MORNING" + "." = "GOOD MORNING."
      // Semicolon doesn't add spaces - strings print immediately, string literal " " adds a space
      // PRINT doesn't end with semicolon, so adds newline
      expect(outputs[0]).toBe('GOOD MORNING.\n')
      expect(outputs[1]).toBe('GOOD EVENING.\n')
      expect(outputs[2]).toBe('OK\n')
    })
  })

  describe('Array Reading (Spec Example 3)', () => {
    it('should read data into array elements', async () => {
      const code = `10 DATA 9, 1, 8, 3, 4, 8
20 DIM A(5)
30 FOR I=0 TO 5
40 READ A(I)
50 PRINT A(I);
60 NEXT
70 END`

      const result = await interpreter.execute(code)

      if (!result.success) {
        console.log('Execution errors:', result.errors)
      }
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify PRINT outputs (6 values printed, one per iteration, plus "OK")
      // Each PRINT A(I); outputs the array element value
      expect(printOutputMock).toHaveBeenCalledTimes(7)
      const outputs = printOutputMock.mock.calls.map(call => call[0])
      // According to spec, positive numbers have a leading space (sign position)
      // "OK" is a separate call at the end
      const expectedOutputs = [' 9', ' 1', ' 8', ' 3', ' 4', ' 8', 'OK\n']
      expect(outputs).toEqual(expectedOutputs)

      // Verify that array elements were read correctly by checking the printed values
      // The array A should contain: [9, 1, 8, 3, 4, 8] at indices 0-5
    })
  })

  describe('RESTORE Functionality (Spec Example)', () => {
    it('should restore data pointer to specific line', async () => {
      const code = `1000 DATA 23, 43, 55, 65, 42, 9
1010 DATA 12, 56, 34, 68, 53, 2
10 REM * RESTORE *
20 RESTORE 1010
30 FOR I=0 TO 5
40 READ A
50 PRINT A;
60 NEXT
70 PRINT
80 RESTORE 1000
90 FOR I=0 TO 5
100 READ A
110 PRINT A;
120 NEXT
130 END`

      const result = await interpreter.execute(code)

      if (!result.success) {
        console.log('Execution errors:', result.errors)
      }

      // If RESTORE with line number works correctly:
      // First loop should read from line 1010: 12, 56, 34, 68, 53, 2
      // Second loop should read from line 1000: 23, 43, 55, 65, 42, 9
      expect(result.success).toBe(true)

      // Verify PRINT outputs (12 values + 1 empty line + 1 "OK" call)
      expect(printOutputMock).toHaveBeenCalledTimes(14)
      const outputs = printOutputMock.mock.calls.map(call => call[0])

      // First 6 outputs should be from line 1010
      // According to spec, positive numbers have a leading space (sign position)
      // PRINT A; ends with semicolon, so no newline
      const firstSet = outputs.slice(0, 6)
      expect(firstSet).toEqual([' 12', ' 56', ' 34', ' 68', ' 53', ' 2'])

      // 7th output should be empty (PRINT with no arguments) - adds newline
      expect(outputs[6]).toBe('\n')

      // Last 6 outputs should be from line 1000
      // PRINT A; ends with semicolon, so no newline
      // "OK" is a separate call at the end
      const secondSet = outputs.slice(7, 13)
      expect(secondSet).toEqual([' 23', ' 43', ' 55', ' 65', ' 42', ' 9'])
      // Verify the last call is "OK\n"
      expect(outputs[13]).toBe('OK\n')
    })

    it('should restore data pointer to beginning when no line specified', async () => {
      const code = `10 DATA 10, 20, 30
20 READ A, B
30 RESTORE
40 READ C, D
50 PRINT A; B; C; D
60 END`

      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify variable values
      expect(result.variables.get('A')?.value).toBe(10)
      expect(result.variables.get('B')?.value).toBe(20)
      // After RESTORE, C and D should read the same values as A and B
      expect(result.variables.get('C')?.value).toBe(10)
      expect(result.variables.get('D')?.value).toBe(20)

      // Verify PRINT output
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()
      // PRINT A; B; C; D creates: " 10" + " 20" + " 10" + " 20" = " 10 20 10 20"
      // Each positive number has a leading space (sign position), semicolon doesn't add extra spaces
      // PRINT doesn't end with semicolon, so adds newline
      expect(output).toBe(' 10 20 10 20\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'OK\n')
    })
  })

  describe('Quoted Strings with Commas', () => {
    it('should handle quoted strings containing commas', async () => {
      const code = `10 DATA ABC, DE, ", ", F
20 READ A$, B$, C$, D$
30 PRINT A$; B$; C$; D$
40 END`

      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify variable values were read correctly
      expect(result.variables.get('A$')?.value).toBe('ABC')
      expect(result.variables.get('B$')?.value).toBe('DE')
      expect(result.variables.get('C$')?.value).toBe(', ')
      expect(result.variables.get('D$')?.value).toBe('F')

      // Verify PRINT output
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()
      // PRINT A$; B$; C$; D$ creates: "ABC" + "DE" + ", " + "F" = "ABCDE, F"
      // Semicolon doesn't add spaces - strings print immediately after each other
      // PRINT doesn't end with semicolon, so adds newline
      expect(output).toBe('ABCDE, F\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'OK\n')
    })
  })

  describe('OD ERROR Handling', () => {
    it('should report OD ERROR when reading more data than available', async () => {
      const code = `10 DATA 10, 20
20 READ A, B, C
30 PRINT "This should not print"
40 END`

      const result = await interpreter.execute(code)

      expect(result.success).toBe(false)
      const errors = result.errors || []
      expect(errors.length).toBeGreaterThan(0)
      const odError = errors.find(e => e.message === 'OD ERROR')
      expect(odError).toBeDefined()

      // Verify that PRINT statements after the error are not executed
      // printOutputMock should not be called because execution halts on error
      expect(printOutputMock).not.toHaveBeenCalled()
    })
  })

  describe('Multiple DATA Statements', () => {
    it('should read data from multiple DATA statements sequentially', async () => {
      const code = `10 DATA 10, 20
20 DATA 30, 40
30 READ A, B, C, D
40 PRINT A; B; C; D
50 END`

      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify variable values were read correctly from both DATA statements
      expect(result.variables.get('A')?.value).toBe(10)
      expect(result.variables.get('B')?.value).toBe(20)
      expect(result.variables.get('C')?.value).toBe(30)
      expect(result.variables.get('D')?.value).toBe(40)

      // Verify PRINT output
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      const output = printOutputMock.mock.calls[0]?.[0]
      expect(output).toBeDefined()
      // PRINT A; B; C; D creates: " 10" + " 20" + " 30" + " 40" = " 10 20 30 40"
      // Each positive number has a leading space (sign position), semicolon doesn't add extra spaces
      // PRINT doesn't end with semicolon, so adds newline
      expect(output).toBe(' 10 20 30 40\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'OK\n')
    })
  })
})
