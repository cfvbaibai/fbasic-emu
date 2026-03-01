/**
 * Tests for CSRLIN, POS, SCR$, BEEP functions/statement
 */

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/interfaces'

describe('CSRLIN, POS, SCR$, BEEP Functions', () => {
  let interpreter: BasicInterpreter
  let mockDeviceAdapter: BasicDeviceAdapter
  let printOutputMock: MockedFunction<(output: string) => void>
  let beepMock: MockedFunction<() => void>

  beforeEach(() => {
    printOutputMock = vi.fn()
    beepMock = vi.fn()
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
      getCursorPosition: vi.fn(() => ({ x: 5, y: 10 })),
      getScreenCell: vi.fn((x: number, y: number) => {
        // Return a character based on position for testing
        if (x === 0 && y === 5) return 'A'
        if (x === 1 && y === 5) return 'B'
        return ' '
      }),
      setColorPattern: vi.fn(),
      setColorPalette: vi.fn(),
      setBackdropColor: vi.fn(),
      setCharacterGeneratorMode: vi.fn(),
      getCharacterGeneratorMode: vi.fn(() => 2),
      beep: beepMock,
    }

    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      suppressOkPrompt: true,
      deviceAdapter: mockDeviceAdapter,
    })
  })

  describe('CSRLIN function', () => {
    it('should return cursor line position', async () => {
      const code = '10 PRINT CSRLIN'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      // STR$ adds leading space for positive numbers
      expect(printOutputMock).toHaveBeenCalledWith(' 10\n')
    })
  })

  describe('POS function', () => {
    it('should return cursor column position', async () => {
      const code = '10 PRINT POS(0)'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(printOutputMock).toHaveBeenCalledWith(' 5\n')
    })

    it('should ignore dummy argument', async () => {
      const code = '10 X = POS(123)'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.variables.get('X')?.value).toBe(5)
    })
  })

  describe('SCR$ function', () => {
    it('should return character at position', async () => {
      const code = '10 A$ = SCR$(0, 5)'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(result.variables.get('A$')?.value).toBe('A')
    })

    it('should return color pattern with color switch', async () => {
      const code = '10 C$ = SCR$(0, 5, 1)'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(mockDeviceAdapter.getScreenCell).toHaveBeenCalledWith(0, 5, 1)
    })
  })

  describe('BEEP statement', () => {
    it('should call beep method', async () => {
      const code = '10 BEEP'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(beepMock).toHaveBeenCalledTimes(1)
    })

    it('should work in IF-THEN', async () => {
      const code = '10 IF 1 THEN BEEP'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      expect(beepMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Combined usage', () => {
    it('should work with POS and CSRLIN together', async () => {
      const code = '10 PRINT POS(0); ","; CSRLIN'
      const result = await interpreter.execute(code)

      expect(result.success).toBe(true)
      // POS(0) returns 5 with leading space, "," is literal, CSRLIN returns 10 with leading space
      expect(printOutputMock).toHaveBeenCalledWith(' 5, 10\n')
    })
  })
})
