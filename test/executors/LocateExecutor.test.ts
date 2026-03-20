/**
 * LOCATE Executor Tests
 *
 * Unit tests for the LocateExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('LocateExecutor', () => {
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

  it('should set cursor position when LOCATE is executed', async () => {
    const source = `
10 LOCATE 10, 5
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })

  it('should set cursor position to (0, 0)', async () => {
    const source = `
10 LOCATE 0, 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 0, y: 0 })
  })

  it('should set cursor position to maximum values (27, 23)', async () => {
    const source = `
10 LOCATE 27, 23
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 27, y: 23 })
  })

  it('should handle LOCATE with variable expressions', async () => {
    const source = `
10 LET X = 15
20 LET Y = 10
30 LOCATE X, Y
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 15, y: 10 })
  })

  it('should handle LOCATE with arithmetic expressions', async () => {
    const source = `
10 LOCATE 10 + 5, 3 * 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 15, y: 6 })
  })

  it('should handle LOCATE with division that results in integer', async () => {
    // F-BASIC only supports integer arithmetic
    const source = `
10 LOCATE 20 / 2, 10 / 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })

  it('should error when X coordinate is out of range (negative)', async () => {
    const source = `
10 LOCATE -1, 10
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/X coordinate out of range/)
  })

  it('should error when X coordinate is out of range (too large)', async () => {
    const source = `
10 LOCATE 28, 10
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/X coordinate out of range/)
  })

  it('should error when Y coordinate is out of range (negative)', async () => {
    const source = `
10 LOCATE 10, -1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Y coordinate out of range/)
  })

  it('should error when Y coordinate is out of range (too large)', async () => {
    const source = `
10 LOCATE 10, 24
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Y coordinate out of range/)
  })

  it('should handle LOCATE on same line as other commands', async () => {
    const source = `
10 PRINT "Before": LOCATE 10, 5: PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })

  it('should handle multiple LOCATE commands', async () => {
    const source = `
10 LOCATE 5, 5
20 LOCATE 10, 10
30 LOCATE 15, 15
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 15, y: 15 })
  })

  it('should work with PRINT after LOCATE', async () => {
    const source = `
10 LOCATE 10, 5
20 PRINT "Hello"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    // LOCATE sets the cursor position, and PRINT should use it
    // The cursor position remains at (10, 5) as set by LOCATE
    // (PRINT manages its own internal cursor, but LOCATE sets the initial position)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })

  it('should handle LOCATE in a loop', async () => {
    const source = `
10 FOR I = 0 TO 5
20 LOCATE I, I
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 5, y: 5 })
  })

  it('should handle LOCATE with conditional execution', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 THEN LOCATE 10, 5
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })

  it('should handle LOCATE with function calls', async () => {
    const source = `
10 LOCATE ABS(10), ABS(5)
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cursorPosition).toEqual({ x: 10, y: 5 })
  })
})
