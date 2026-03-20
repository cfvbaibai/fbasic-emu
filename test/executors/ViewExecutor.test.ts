/**
 * VIEW Executor Tests
 *
 * Unit tests for the ViewExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('ViewExecutor', () => {
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

  it('should call copyBgGraphicToBackground when VIEW is executed', async () => {
    const source = `
10 VIEW
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(1)
  })

  it('should handle VIEW multiple times', async () => {
    const source = `
10 VIEW
20 VIEW
30 VIEW
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(3)
  })

  it('should handle VIEW on same line as other commands', async () => {
    const source = `
10 PRINT "Before": VIEW: PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(1)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toMatch(/Before/)
    expect(outputs).toMatch(/After/)
  })

  it('should handle VIEW in a loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 VIEW
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(3)
  })

  it('should handle VIEW with conditional execution', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 THEN VIEW
30 PRINT "Done"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(1)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toMatch(/Done/)
  })

  it('should handle VIEW after CLS', async () => {
    const source = `
10 CLS
20 VIEW
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
    expect(deviceAdapter.copyBgGraphicToBackgroundCalls).toBe(1)
  })
})
