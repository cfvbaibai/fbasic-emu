/**
 * COLOR Executor Tests
 *
 * Unit tests for the ColorExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('ColorExecutor', () => {
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

  it('should set color pattern when COLOR is executed', async () => {
    const source = `
10 COLOR 10, 5, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 10, y: 5, pattern: 2 })
  })

  it('should set color pattern to 0', async () => {
    const source = `
10 COLOR 0, 0, 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 0, y: 0, pattern: 0 })
  })

  it('should set color pattern to maximum values (27, 23, 3)', async () => {
    const source = `
10 COLOR 27, 23, 3
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 27, y: 23, pattern: 3 })
  })

  it('should handle COLOR with variable expressions', async () => {
    const source = `
10 LET X = 15
20 LET Y = 10
30 LET P = 1
40 COLOR X, Y, P
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 15, y: 10, pattern: 1 })
  })

  it('should handle COLOR with arithmetic expressions', async () => {
    const source = `
10 COLOR 10 + 5, 3 * 2, 1 + 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 15, y: 6, pattern: 2 })
  })

  it('should handle multiple COLOR statements', async () => {
    const source = `
10 COLOR 5, 5, 0
20 COLOR 10, 10, 1
30 COLOR 15, 15, 2
40 COLOR 20, 20, 3
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(4)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 5, y: 5, pattern: 0 })
    expect(deviceAdapter.colorPatternCalls[1]).toEqual({ x: 10, y: 10, pattern: 1 })
    expect(deviceAdapter.colorPatternCalls[2]).toEqual({ x: 15, y: 15, pattern: 2 })
    expect(deviceAdapter.colorPatternCalls[3]).toEqual({ x: 20, y: 20, pattern: 3 })
  })

  it('should handle COLOR with colon-separated statements', async () => {
    const source = `
10 COLOR 10, 5, 2: COLOR 15, 10, 3
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(2)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 10, y: 5, pattern: 2 })
    expect(deviceAdapter.colorPatternCalls[1]).toEqual({ x: 15, y: 10, pattern: 3 })
  })

  it('should report error when X coordinate is out of range (negative)', async () => {
    const source = `
10 COLOR -1, 5, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/X coordinate out of range \(0-27\)/)
  })

  it('should report error when X coordinate is out of range (too large)', async () => {
    const source = `
10 COLOR 28, 5, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/X coordinate out of range \(0-27\)/)
  })

  it('should report error when Y coordinate is out of range (negative)', async () => {
    const source = `
10 COLOR 10, -1, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Y coordinate out of range \(0-23\)/)
  })

  it('should report error when Y coordinate is out of range (too large)', async () => {
    const source = `
10 COLOR 10, 24, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Y coordinate out of range \(0-23\)/)
  })

  it('should report error when color pattern is out of range (negative)', async () => {
    const source = `
10 COLOR 10, 5, -1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Color pattern number out of range \(0-3\)/)
  })

  it('should report error when color pattern is out of range (too large)', async () => {
    const source = `
10 COLOR 10, 5, 4
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Color pattern number out of range \(0-3\)/)
  })

  it('should handle COLOR with expressions that evaluate to non-integers (floor conversion)', async () => {
    // Note: F-BASIC only supports integer literals, but expressions can evaluate to non-integers
    // This test uses division which might result in non-integer values
    // In practice, F-BASIC uses integer division, so 21/2 = 10 (not 10.5)
    const source = `
10 COLOR 21 / 2, 11 / 2, 5 / 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    // Integer division: 21/2 = 10, 11/2 = 5, 5/2 = 2
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 10, y: 5, pattern: 2 })
  })

  it('should handle COLOR with all valid pattern numbers', async () => {
    const source = `
10 COLOR 5, 5, 0
20 COLOR 10, 10, 1
30 COLOR 15, 15, 2
40 COLOR 20, 20, 3
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPatternCalls).toHaveLength(4)
  })

  it('should work with LOCATE and COLOR together', async () => {
    const source = `
10 LOCATE 10, 5
20 COLOR 10, 5, 2
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 10, y: 5, pattern: 2 })
  })
})
