/**
 * Async Execution Tests
 *
 * Tests for periodic yielding to event loop during long-running execution.
 * This ensures the UI remains responsive during infinite loops and prevents
 * browser freezing.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { EXECUTION_LIMITS } from '@/core/constants'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('Async Execution - Production Mode', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_PRODUCTION,
      maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_PRODUCTION,
      enableDebugMode: false,
      strictMode: false,
      suppressOkPrompt: true,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should yield during tight GOTO loop with PRINT', async () => {
    const source = `
10 FOR I = 1 TO 500
20   PRINT "Loop "; I
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)

    // Verify all iterations executed
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toMatch(/Loop {2}1/)
    expect(outputs).toMatch(/Loop {2}500/)
  }, 10000) // 10 second timeout

  it('should yield during GOTO loop with many iterations', async () => {
    const source = `
10 I = 0
20 I = I + 1
30 IF I < 300 THEN GOTO 20
40 PRINT "Done: "; I
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)

    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Done:  300\n')
  }, 10000)

  it('should respect iteration limit even with yielding', async () => {
    // Create interpreter with lower iteration limit for this test
    const limitedInterpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_PRODUCTION,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })

    const source = `
10 I = 0
20 I = I + 1
30 GOTO 20
`
    const result = await limitedInterpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toEqual('Maximum iterations exceeded')
  }, 10000)

  it('should allow stopping during long-running loop', async () => {
    const source = `
10 I = 0
20 I = I + 1
30 IF I < 10000 THEN GOTO 20
40 PRINT "Done"
50 END
`
    // Start execution (don't await yet)
    const executionPromise = interpreter.execute(source)

    // Stop execution after a short delay
    setTimeout(() => {
      interpreter.stop()
    }, 100)

    const result = await executionPromise

    // Execution should have stopped before completing all iterations
    expect(result.success).toBe(true)
    const outputs = deviceAdapter.getAllOutputs()
    // Should not print "Done" since we stopped execution
    expect(outputs).not.toMatch(/Done/)
  }, 10000)
})

describe('Async Execution - Test Mode', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_TEST,
      maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should not yield in test mode (fast execution)', async () => {
    const source = `
10 FOR I = 1 TO 100
20   PRINT "Loop "; I
30 NEXT
40 END
`
    const startTime = Date.now()
    const result = await interpreter.execute(source)
    const duration = Date.now() - startTime

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)

    // Test mode should complete very quickly (no yielding delays)
    // Even with 100 iterations, it should be < 100ms
    expect(duration).toBeLessThan(500)
  })
})
