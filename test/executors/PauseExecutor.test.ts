/**
 * PAUSE Executor Tests
 *
 * Unit tests for the PauseExecutor: PAUSE delays program execution
 * for a specified number of ticks (~12.12ms per unit on web).
 * Reference: F-BASIC Manual
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TIMING } from '@/core/constants'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

/** Calculate expected duration in ms for a given number of PAUSE units */
function expectedDurationMs(pauseUnits: number): number {
  return (pauseUnits * TIMING.FRAME_DURATION_MS) / TIMING.PAUSE_TIMING_DIVISOR
}

describe('PauseExecutor', () => {
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

  // === Basic execution ===

  it('should execute PAUSE with positive value without errors', async () => {
    const source = `
10 PAUSE 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should execute PAUSE 0 without errors', async () => {
    const source = `
10 PAUSE 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // === Timing behavior ===

  it('should delay execution for PAUSE with a positive value', async () => {
    const pauseUnits = 10
    const expectedMs = expectedDurationMs(pauseUnits)

    const source = `
10 PAUSE ${pauseUnits}
20 END
`
    const start = performance.now()
    await interpreter.execute(source)
    const elapsed = performance.now() - start

    // Allow generous tolerance for timer imprecision in test environments
    expect(elapsed).toBeGreaterThanOrEqual(expectedMs * 0.5)
  })

  it('should complete quickly for PAUSE 0 (no delay)', async () => {
    const source = `
10 PAUSE 0
20 END
`
    const start = performance.now()
    await interpreter.execute(source)
    const elapsed = performance.now() - start

    // PAUSE 0 should resolve almost immediately (no setTimeout called)
    expect(elapsed).toBeLessThan(50)
  })

  it('should complete quickly for negative PAUSE values (clamped to 0)', async () => {
    const source = `
10 PAUSE -1
20 END
`
    const start = performance.now()
    const result = await interpreter.execute(source)
    const elapsed = performance.now() - start

    // Negative values are clamped to 0, so no actual delay
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(elapsed).toBeLessThan(50)
  })

  it('should delay proportionally for larger PAUSE values', async () => {
    const source = `
10 PAUSE 60
20 END
`
    const expectedMs = expectedDurationMs(60)

    const start = performance.now()
    await interpreter.execute(source)
    const elapsed = performance.now() - start

    // Should take at least half the expected time
    expect(elapsed).toBeGreaterThanOrEqual(expectedMs * 0.5)
  })

  // === Expression-based PAUSE values ===

  it('should evaluate expression as PAUSE duration', async () => {
    const source = `
10 A = 5
20 PAUSE A
30 END
`
    const expectedMs = expectedDurationMs(5)
    const start = performance.now()
    await interpreter.execute(source)
    const elapsed = performance.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(expectedMs * 0.5)
  })

  it('should evaluate arithmetic expression as PAUSE duration', async () => {
    const source = `
10 PAUSE 2 + 3
20 END
`
    const expectedMs = expectedDurationMs(5)
    const start = performance.now()
    await interpreter.execute(source)
    const elapsed = performance.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(expectedMs * 0.5)
  })

  // === PAUSE in control flow ===

  it('should execute PAUSE inside a FOR loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 PAUSE 1
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should execute PAUSE inside a GOSUB subroutine', async () => {
    const source = `
10 GOSUB 100
20 END
100 PAUSE 1
110 RETURN
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should execute PAUSE combined with other statements on the same line', async () => {
    const source = `
10 PRINT "Before": PAUSE 1: PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.getAllOutputs()).toEqual('Before\nAfter\nOK\n')
  })

  // === Debug mode ===

  it('should output debug info when debug mode is enabled', async () => {
    const debugInterpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: true,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })

    const source = `
10 PAUSE 5
20 END
`
    const result = await debugInterpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    // Debug output should contain PAUSE info (may not be first entry)
    expect(deviceAdapter.debugOutputs.length).toBeGreaterThan(0)
    expect(deviceAdapter.debugOutputs).toEqual(
      expect.arrayContaining([expect.stringMatching(/PAUSE: 5 units/)])
    )
  })

  it('should output debug info with rounded duration in ms', async () => {
    const debugInterpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: true,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })

    const source = `
10 PAUSE 10
20 END
`
    const result = await debugInterpreter.execute(source)

    expect(result.success).toBe(true)
    expect(deviceAdapter.debugOutputs).toEqual(
      expect.arrayContaining([expect.stringMatching(/PAUSE: 10 units \(\d+ms\)/)])
    )
  })

  // === PAUSE not reached after END ===

  it('should not execute PAUSE after END', async () => {
    const source = `
10 PAUSE 1
20 END
30 PAUSE 60
`
    const start = performance.now()
    const result = await interpreter.execute(source)
    const elapsed = performance.now() - start

    expect(result.success).toBe(true)
    // Line 30 should never execute, so total time should be ~PAUSE 1, not PAUSE 61
    expect(elapsed).toBeLessThan(expectedDurationMs(60))
  })
})
