/**
 * Pause Demo Program Tests
 *
 * Tests for the complete Pause Demo program that demonstrates
 * PAUSE command usage with countdown and timing delays.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { FBasicParser } from '@/core/parser/FBasicParser'
import { getSampleCode } from '@/core/samples'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

describe('Pause Demo Program', () => {
  let interpreter: BasicInterpreter
  let mockDeviceAdapter: BasicDeviceAdapter
  let printOutputMock: ReturnType<typeof vi.fn<(output: string) => void>>

  beforeEach(() => {
    printOutputMock = vi.fn<(output: string) => void>()
    mockDeviceAdapter = {
      getJoystickCount: () => 2,
      getStickState: () => 0,
      setStickState: () => {},
      pushStrigState: () => {},
      consumeStrigState: () => 0,
      getSpritePosition: () => null,
      getInkeyState: () => '',
      printOutput: printOutputMock,
      debugOutput: () => {},
      errorOutput: () => {},
      clearScreen: () => {},
      setCursorPosition: () => {},
      getCursorPosition: () => ({ x: 0, y: 0 }),
      getScreenCell: () => ' ',
      setColorPattern: () => {},
      setColorPalette: () => {},
      setBackdropColor: () => {},
      setCharacterGeneratorMode: () => {},
      getCharacterGeneratorMode: () => 2,
    }

    interpreter = new BasicInterpreter({
      maxIterations: 10000,
      maxOutputLines: 1000,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: mockDeviceAdapter,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function executeWithCapturedTimeouts(code: string): Promise<{
    durations: number[]
    result: Awaited<ReturnType<BasicInterpreter['execute']>>
  }> {
    const durations: number[] = []

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback: TimerHandler, delay?: number) => {
      durations.push(typeof delay === 'number' ? delay : 0)
      if (typeof callback === 'function') {
        callback()
      }
      return {} as ReturnType<typeof setTimeout>
    })

    const result = await interpreter.execute(code)
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)

    return {
      result,
      durations: durations.filter((duration) => duration > 1),
    }
  }

  function getPrintedLines(): string[] {
    return printOutputMock.mock.calls
      .map(call => call[0].trim().replace(/\s+/g, ' '))
      .filter(call => call.length > 0)
  }

  const pauseDemoCode = getSampleCode('pause')?.code
  if (!pauseDemoCode) {
    throw new Error('Pause demo code not found')
  }

  describe('Parser Tests', () => {
    it('should parse the complete pause demo program', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()

      // Verify all statements are parsed
      const statements = result.cst?.children.statement
      expect(Array.isArray(statements)).toBe(true)
      // Current pause.bas has 33 lines (10-330)
      expect(statements?.length).toBe(33)
    })

    it('should parse PAUSE statements correctly', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should parse FOR loop with negative STEP', async () => {
      const parser = new FBasicParser()
      const result = await parser.parse(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
    })
  })

  describe('Execution Tests', () => {
    it('should execute the complete pause demo program', async () => {
      const { durations } = await executeWithCapturedTimeouts(pauseDemoCode)

      // Current pause.bas has:
      // 5x PAUSE 80 + 1x PAUSE 50 + 5x PAUSE 30 + 1x PAUSE 50 + 1x PAUSE 50 + 1x PAUSE 250 = 14 pauses
      // PAUSE 0 has durationMs = 0 so it is filtered out (> 1 check)
      expect(durations).toHaveLength(14)

      // PAUSE 80: (80 * 33.33) / 2.75 = 969.45ms each (5 of these)
      expect(durations.filter((d) => Math.abs(d - 969.45) < 1)).toHaveLength(5)

      // PAUSE 50: (50 * 33.33) / 2.75 = 606.06ms each (3 of these)
      expect(durations.filter((d) => Math.abs(d - 606.06) < 1)).toHaveLength(3)

      // PAUSE 30: (30 * 33.33) / 2.75 = 363.63ms each (5 of these)
      expect(durations.filter((d) => Math.abs(d - 363.63) < 1)).toHaveLength(5)

      // PAUSE 250: (250 * 33.33) / 2.75 = 3030.30ms (1 of these)
      expect(durations.some((d) => Math.abs(d - 3030.30) < 1)).toBe(true)
    })

    it('should produce correct output sequence', async () => {
      await executeWithCapturedTimeouts(pauseDemoCode)

      const calls = getPrintedLines()

      // Verify section headers
      expect(calls[0]).toBe('=== COUNTDOWN ===')
      expect(calls[1]).toBe('Countdown: 5')
      expect(calls[2]).toBe('Countdown: 4')
      expect(calls[3]).toBe('Countdown: 3')
      expect(calls[4]).toBe('Countdown: 2')
      expect(calls[5]).toBe('Countdown: 1')
      expect(calls[6]).toBe('Blast off!')

      // Short pause section
      expect(calls[7]).toBe('=== SHORT PAUSE ===')
      expect(calls[8]).toBe('Quick dots...')
      expect(calls[9]).toBe('.')
      expect(calls[10]).toBe('.')
      expect(calls[11]).toBe('.')
      expect(calls[12]).toBe('.')
      expect(calls[13]).toBe('.')

      // Wait for keypress section
      expect(calls[14]).toBe('=== WAIT FOR KEYPRESS ===')
      expect(calls[15]).toBe('PAUSE 0 waits for a key...')
      expect(calls[16]).toBe('You pressed a key!')

      // Long pause section
      expect(calls[17]).toBe('=== LONG PAUSE ===')
      expect(calls[18]).toBe('Waiting 3 seconds...')
      expect(calls[19]).toBe('Done!')

      // OK prompt after successful execution
      expect(calls[calls.length - 1]).toBe('OK')
    })

    it('should execute FOR loop with negative STEP correctly', async () => {
      const { result } = await executeWithCapturedTimeouts(pauseDemoCode)

      // The current pause.bas has two FOR I loops:
      // 1. FOR I = 5 TO 1 STEP -1 (countdown) - exits when I becomes 0
      // 2. FOR I = 1 TO 5 (short pause dots) - exits when I becomes 6
      // After both loops complete, I = 6 (from the second loop)
      const iValue = result.variables.get('I')?.value
      expect(iValue).toBe(6)
    })

    it('should include PAUSE delays in execution', async () => {
      const codeWithShortDelays = `10 PRINT "Start"
20 PAUSE 10
30 PRINT "Middle"
40 PAUSE 20
50 PRINT "End"
60 END`

      const { durations } = await executeWithCapturedTimeouts(codeWithShortDelays)
      expect(durations).toEqual([
        expect.closeTo(121.21, 1),
        expect.closeTo(242.42, 1),
      ])

      const calls = getPrintedLines()
      expect(calls[0]).toBe('Start')
      expect(calls[1]).toBe('Middle')
      expect(calls[2]).toBe('End')
      expect(calls[3]).toBe('OK')
    })

    it('should handle PAUSE with expressions', async () => {
      const code = `10 LET DURATION = 50
20 PRINT "Pausing..."
30 PAUSE DURATION
40 PRINT "Done"
50 END`

      const { durations } = await executeWithCapturedTimeouts(code)
      expect(durations).toEqual([expect.closeTo(606.06, 1)])

      const calls = getPrintedLines()
      expect(calls[0]).toBe('Pausing...')
      expect(calls[1]).toBe('Done')
      expect(calls[2]).toBe('OK')
    })

    it('should handle multiple PAUSE statements in sequence', async () => {
      const code = `10 PRINT "First pause"
20 PAUSE 10
30 PRINT "Second pause"
40 PAUSE 10
50 PRINT "Third pause"
60 PAUSE 10
70 PRINT "Done"
80 END`

      const { durations } = await executeWithCapturedTimeouts(code)
      expect(durations).toHaveLength(3)
      expect(durations.every((duration) => Math.abs(duration - 121.21) < 1)).toBe(true)

      const calls = getPrintedLines()
      expect(calls).toHaveLength(5)
      expect(calls[4]).toBe('OK')
    })

    it('should handle PAUSE in FOR loop correctly', async () => {
      const code = `10 FOR J = 1 TO 3
20   PRINT "Loop "; J
30   PAUSE 10
40 NEXT
50 PRINT "Loop complete"
60 END`

      const { durations } = await executeWithCapturedTimeouts(code)
      expect(durations).toHaveLength(3)
      expect(durations.every((duration) => Math.abs(duration - 121.21) < 1)).toBe(true)

      // Verify outputs: 3 loop prints + 1 final print + final OK.
      const calls = getPrintedLines()
      expect(calls).toHaveLength(5)
      expect(calls[0]).toEqual('Loop 1')
      expect(calls[1]).toEqual('Loop 2')
      expect(calls[2]).toEqual('Loop 3')
      expect(calls[3]).toBe('Loop complete')
      expect(calls[4]).toBe('OK')
    })

    it('should handle END statement correctly', async () => {
      await executeWithCapturedTimeouts(pauseDemoCode)

      // Program should complete without errors
      // END statement should stop execution
    })
  })

  describe('Edge Cases', () => {
    it('should handle PAUSE 0 (no delay)', async () => {
      const code = `10 PRINT "Before"
20 PAUSE 0
30 PRINT "After"
40 END`

      const { durations } = await executeWithCapturedTimeouts(code)
      expect(durations).toHaveLength(0)

      const calls = getPrintedLines()
      expect(calls).toHaveLength(3)
      expect(calls[2]).toBe('OK')
    })

    it('should handle PAUSE with negative value (no delay)', async () => {
      const code = `10 PRINT "Before"
20 PAUSE -100
30 PRINT "After"
40 END`

      const { durations } = await executeWithCapturedTimeouts(code)
      expect(durations).toHaveLength(0)

      const calls = getPrintedLines()
      expect(calls).toHaveLength(3)
      expect(calls[2]).toBe('OK')
    })
  })
})
