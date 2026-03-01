/**
 * Family Basic IDE Demo Program Test
 *
 * Tests for a complete BASIC program demonstrating various features.
 */

import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import type { BasicDeviceAdapter } from '@/core/interfaces'
import { FBasicParser } from '@/core/parser/FBasicParser'
import { getSampleCode } from '@/core/samples/sampleCodes'

describe('Family Basic IDE Demo Program', () => {
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
      suppressOkPrompt: true,
      deviceAdapter: mockDeviceAdapter,
    })
  })

  it('should execute the complete demo program', async () => {
    const code = getSampleCode('basic')?.code
    if (!code) {
      throw new Error('Basic sample code not found')
    }
    const result = await interpreter.execute(code)

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

    // Verify all PRINT statements executed
    // The 'basic' sample code has 2 PRINT statements:
    // Line 10: "Basic F-Basic Program"
    // Line 50: "A + B = "; C (where C = 30)
    expect(printOutputMock).toHaveBeenCalledTimes(2)

    // Verify the output order and content
    const calls = printOutputMock.mock.calls.map(call => call[0])

    // First PRINT statement
    expect(calls[0]).toBe('Basic F-Basic Program\n')

    // Second PRINT statement with semicolon separator
    // PRINT "A + B = "; C where C=30 outputs "A + B =  30"
    // (string has trailing space, number has leading space for sign position)
    // But PRINT doesn't end with semicolon (last item is C, not a semicolon), so adds newline
    expect(calls[1]).toEqual('A + B =  30\n')

    // Verify variable values
    expect(result.variables.get('A')?.value).toBe(10)
    expect(result.variables.get('B')?.value).toBe(20)
    expect(result.variables.get('C')?.value).toBe(30)
  })

  it('should handle the program with semicolon separator in PRINT', async () => {
    // Test that semicolon in PRINT "I="; I works correctly
    const code = `10 FOR I=1 TO 2: PRINT "I="; I: NEXT`

    const result = await interpreter.execute(code)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(printOutputMock).toHaveBeenCalledTimes(2)

    // Verify semicolon concatenation (no space/newline between items)
    // PRINT "I="; I where I=1 outputs "I= 1"
    // (semicolon concatenates immediately, number has leading space for sign position)
    // But PRINT doesn't end with semicolon (last item is I, not a semicolon), so adds newline
    const calls = printOutputMock.mock.calls.map(call => call[0])
    expect(calls[0]).toEqual('I= 1\n')
    expect(calls[1]).toEqual('I= 2\n')
  })

  it('should parse the program correctly', async () => {
    const code = `10 PRINT "Hello World!"
20 PRINT "Family Basic IDE Demo"
30 PRINT "Program completed!"
40 FOR I=1 TO 3: PRINT "I="; I: NEXT
50 END`

    const parser = new FBasicParser()
    const parseResult = await parser.parse(code)

    expect(parseResult.success).toBe(true)
    expect(parseResult.cst).toBeDefined()

    const statements = parseResult.cst?.children.statement
    expect(Array.isArray(statements)).toBe(true)
    expect(statements?.length).toBe(5) // 5 lines
  })
})
