/**
 * Integration tests for colon-separated statement execution
 */

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

describe('Colon-Separated Statement Execution', () => {
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

  describe('Multiple LET statements on one line', () => {
    it('should execute multiple LET statements sequentially', async () => {
      const code = '10 LET A=5: LET B=10: LET C=15'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(result.variables.get('B')?.value).toBe(10)
      expect(result.variables.get('C')?.value).toBe(15)
    })

    it('should execute LET statements without keyword', async () => {
      const code = '10 A=5: B=10: C=15'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(result.variables.get('B')?.value).toBe(10)
      expect(result.variables.get('C')?.value).toBe(15)
    })
  })

  describe('Multiple PRINT statements on one line', () => {
    it('should execute multiple PRINT statements sequentially', async () => {
      const code = '10 PRINT "Hello": PRINT "World"'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(printOutputMock).toHaveBeenCalledTimes(3)
      expect(printOutputMock).toHaveBeenNthCalledWith(1, 'Hello\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'World\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(3, 'OK\n')
    })

    it('should execute PRINT with empty statements', async () => {
      const code = '10 PRINT: PRINT "Hello": PRINT'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(printOutputMock).toHaveBeenCalledTimes(4)
      expect(printOutputMock).toHaveBeenNthCalledWith(1, '\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'Hello\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(3, '\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(4, 'OK\n')
    })
  })

  describe('Mixed LET and PRINT statements', () => {
    it('should execute LET then PRINT on the same line', async () => {
      const code = '10 LET A=5: PRINT A'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      // Numbers always have a leading space (sign position) regardless of separator
      expect(printOutputMock).toHaveBeenNthCalledWith(1, ' 5\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'OK\n')
    })

    it('should execute multiple mixed statements', async () => {
      const code = '10 LET A=5: PRINT A: LET B=10: PRINT B'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(result.variables.get('B')?.value).toBe(10)
      expect(printOutputMock).toHaveBeenCalledTimes(3)
      // Numbers always have a leading space (sign position) regardless of separator
      expect(printOutputMock).toHaveBeenNthCalledWith(1, ' 5\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, ' 10\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(3, 'OK\n')
    })

    it('should use variables set earlier in the same line', async () => {
      const code = '10 LET X=10: LET Y=X+5: PRINT Y'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('X')?.value).toBe(10)
      expect(result.variables.get('Y')?.value).toBe(15)
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      // Numbers always have a leading space (sign position) regardless of separator
      expect(printOutputMock).toHaveBeenNthCalledWith(1, ' 15\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'OK\n')
    })
  })

  describe('Multi-line programs with colons', () => {
    it('should execute multiple lines with colon-separated statements', async () => {
      const code = `10 LET A=5: PRINT A
20 LET B=10: PRINT B`
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(result.variables.get('B')?.value).toBe(10)
      expect(printOutputMock).toHaveBeenCalledTimes(3)
      expect(printOutputMock).toHaveBeenNthCalledWith(1, ' 5\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, ' 10\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(3, 'OK\n')
    })

    it('should handle mixed lines with and without colons', async () => {
      const code = `10 LET A=5: PRINT A
20 PRINT "Single statement"
30 LET B=10: PRINT B: LET C=15`
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.variables.get('A')?.value).toBe(5)
      expect(result.variables.get('B')?.value).toBe(10)
      expect(result.variables.get('C')?.value).toBe(15)
      expect(printOutputMock).toHaveBeenCalledTimes(4) // Line 10: 1 PRINT, Line 20: 1 PRINT, Line 30: 1 PRINT, plus OK
      expect(printOutputMock).toHaveBeenNthCalledWith(1, ' 5\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(2, 'Single statement\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(3, ' 10\n')
      expect(printOutputMock).toHaveBeenNthCalledWith(4, 'OK\n')
    })
  })
})
