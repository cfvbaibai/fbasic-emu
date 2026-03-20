/**
 * Pause Demo Program Tests
 *
 * Tests for the complete Pause Demo program that demonstrates
 * PAUSE command usage with countdown and timing delays.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/interfaces'
import { FBasicParser } from '@/core/parser/FBasicParser'
import { getSampleCode } from '@/core/samples'

// Skip by default - this test takes a long time due to PAUSE delays
// To run manually:
//   - Remove .skip() temporarily, OR
//   - Set RUN_PAUSE_DEMO_TESTS=true pnpm test:run -- test/parser/PauseDemo.test.ts
const shouldRunPauseDemoTests = process.env.RUN_PAUSE_DEMO_TESTS === 'true'

describe.skipIf(!shouldRunPauseDemoTests)('Pause Demo Program', () => {
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
      expect(statements?.length).toBe(10) // 10 lines (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)
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
      const result = await interpreter.execute(pauseDemoCode)

      // Check for errors first
      if (!result.success || result.errors.length > 0) {
        console.log('Execution errors:', result.errors)
        console.log('Print calls:', printOutputMock.mock.calls.length)
        console.log(
          'Print outputs:',
          printOutputMock.mock.calls.map(c => c[0])
        )
      }

      // Program should execute successfully
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should produce correct output sequence', async () => {
      const result = await interpreter.execute(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify all PRINT statements executed
      // Line 10: "PAUSE Command Demo"
      // Line 20: "Starting countdown..."
      // Line 40: "Countdown: "; I (5 times: 5, 4, 3, 2, 1)
      // Line 70: "Blast off!"
      // Line 90: "Mission complete!"
      // Total: 2 + 5 + 1 + 1 = 9 PRINT calls
      expect(printOutputMock).toHaveBeenCalledTimes(9)

      // Verify the output order and content
      const calls = printOutputMock.mock.calls.map(call => call[0])

      // First two PRINT statements
      expect(calls[0]).toBe('PAUSE Command Demo')
      expect(calls[1]).toBe('Starting countdown...')

      // Countdown outputs (I=5, 4, 3, 2, 1)
      // PRINT "Countdown:"; I outputs "Countdown: 5" etc. (semicolon concatenates, number gets leading space)
      expect(calls[2]).toEqual('Countdown: 5')
      expect(calls[3]).toEqual('Countdown: 4')
      expect(calls[4]).toEqual('Countdown: 3')
      expect(calls[5]).toEqual('Countdown: 2')
      expect(calls[6]).toEqual('Countdown: 1')

      // Final outputs
      expect(calls[7]).toBe('Blast off!')
      expect(calls[8]).toBe('Mission complete!')
    })

    it('should execute FOR loop with negative STEP correctly', async () => {
      const result = await interpreter.execute(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // After loop completion, I should be 0 (1 - 1 = 0, but loop exits when I < 1)
      // Actually, in Family Basic, after NEXT when I becomes 0, the loop exits
      // So I should be 0 after the loop
      const iValue = result.variables.get('I')?.value
      expect(iValue).toBe(0) // After loop: I = 1, then NEXT decrements to 0, loop exits
    })

    it('should include PAUSE delays in execution', async () => {
      // Use shorter delays for faster test execution
      const codeWithShortDelays = `10 PRINT "Start"
20 PAUSE 10
30 PRINT "Middle"
40 PAUSE 20
50 PRINT "End"
60 END`

      const startTime = Date.now()
      const result = await interpreter.execute(codeWithShortDelays)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify execution took at least the pause duration
      // (10ms + 20ms = 30ms minimum, but allow some margin)
      expect(endTime - startTime).toBeGreaterThanOrEqual(25)

      // Verify outputs
      expect(printOutputMock).toHaveBeenCalledTimes(3)
      const calls = printOutputMock.mock.calls.map(call => call[0])
      expect(calls[0]).toBe('Start')
      expect(calls[1]).toBe('Middle')
      expect(calls[2]).toBe('End')
    })

    it('should handle PAUSE with expressions', async () => {
      const code = `10 LET DURATION = 50
20 PRINT "Pausing..."
30 PAUSE DURATION
40 PRINT "Done"
50 END`

      const startTime = Date.now()
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify execution took at least the pause duration
      expect(endTime - startTime).toBeGreaterThanOrEqual(45)

      // Verify outputs
      expect(printOutputMock).toHaveBeenCalledTimes(2)
      const calls = printOutputMock.mock.calls.map(call => call[0])
      expect(calls[0]).toBe('Pausing...')
      expect(calls[1]).toBe('Done')
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

      const startTime = Date.now()
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify execution took at least the total pause duration
      expect(endTime - startTime).toBeGreaterThanOrEqual(25)

      // Verify all outputs
      expect(printOutputMock).toHaveBeenCalledTimes(4)
    })

    it('should handle PAUSE in FOR loop correctly', async () => {
      // Test that PAUSE works correctly inside a loop
      const code = `10 FOR J = 1 TO 3
20   PRINT "Loop "; J
30   PAUSE 10
40 NEXT J
50 PRINT "Loop complete"
60 END`

      const startTime = Date.now()
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Verify execution took at least the total pause duration (3 * 10ms = 30ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(25)

      // Verify outputs: 3 loop prints + 1 final print = 4 total
      expect(printOutputMock).toHaveBeenCalledTimes(4)

      const calls = printOutputMock.mock.calls.map(call => call[0])
      // PRINT "Loop"; I outputs "Loop 1" etc. (semicolon concatenates, number gets leading space)
      expect(calls[0]).toEqual('Loop 1')
      expect(calls[1]).toEqual('Loop 2')
      expect(calls[2]).toEqual('Loop 3')
      expect(calls[3]).toBe('Loop complete')
    })

    it('should handle END statement correctly', async () => {
      const result = await interpreter.execute(pauseDemoCode)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

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

      const startTime = Date.now()
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // PAUSE 0 should not cause significant delay
      expect(endTime - startTime).toBeLessThan(50)

      expect(printOutputMock).toHaveBeenCalledTimes(2)
    })

    it('should handle PAUSE with negative value (no delay)', async () => {
      const code = `10 PRINT "Before"
20 PAUSE -100
30 PRINT "After"
40 END`

      const startTime = Date.now()
      const result = await interpreter.execute(code)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)

      // Negative PAUSE should not cause delay
      expect(endTime - startTime).toBeLessThan(50)

      expect(printOutputMock).toHaveBeenCalledTimes(2)
    })
  })
})
