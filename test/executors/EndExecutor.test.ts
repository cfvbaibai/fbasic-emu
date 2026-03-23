/**
 * END Executor Tests
 *
 * Unit tests for the EndExecutor: END terminates program execution immediately.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('EndExecutor', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should stop program execution when END is reached', async () => {
    const source = `
10 PRINT "Before"
20 END
30 PRINT "After"
40 PRINT "Also after"
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Before\nOK\n')
  })

  it('should output OK prompt after END', async () => {
    const source = `
10 PRINT "Hello"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Hello\nOK\n')
  })

  it('should stop execution immediately even in the middle of a loop', async () => {
    const source = `
10 FOR I = 1 TO 100
20 PRINT I;
30 IF I = 3 THEN END
40 NEXT
50 PRINT "Never reached"
`
    const result = await interpreter.execute(source)

    // END inside a FOR loop leaves an unclosed loop, which triggers an error
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toEqual('Missing NEXT statement for FOR loop')
    const outputs = deviceAdapter.getAllOutputs()
    // I=1,2,3 printed before END; error message for unclosed loop also appears
    expect(outputs).toEqual(' 1 2 3RUNTIME: Missing NEXT statement for FOR loop')
  })

  it('should work when END is on the first line', async () => {
    const source = `
10 END
20 PRINT "Never"
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('OK\n')
  })

  it('should stop execution inside a GOSUB subroutine', async () => {
    const source = `
10 GOSUB 100
20 PRINT "Returned"
30 END
100 PRINT "In sub"
110 END
120 PRINT "Never"
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    // END inside subroutine stops execution; "Returned" is never printed
    // Execution ends successfully so OK prompt is still shown
    expect(outputs).toEqual('In sub\nOK\n')
  })

  it('should suppress OK prompt when suppressOkPrompt is enabled', async () => {
    const source = `
10 PRINT "Test"
20 END
`
    // Re-create interpreter with suppressOkPrompt
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
      suppressOkPrompt: true,
    })
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    // suppressOkPrompt removes OK but PRINT still adds its own newline
    expect(outputs).toEqual('Test\n')
  })

  it('should handle END after GOTO', async () => {
    const source = `
10 GOTO 50
20 PRINT "Skipped"
30 END
40 PRINT "Also skipped"
50 PRINT "Jumped"
60 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Jumped\nOK\n')
  })

  it('should handle END with combined statements on same line', async () => {
    const source = `
10 PRINT "A": PRINT "B": END: PRINT "C"
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    // END stops execution mid-line but engine still outputs OK on success
    expect(outputs).toEqual('A\nB\nOK\n')
  })
})
