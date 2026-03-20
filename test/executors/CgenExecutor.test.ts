/**
 * CGEN Executor Tests
 *
 * Unit tests for the CgenExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('CgenExecutor', () => {
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

  it('should set character generator mode when CGEN is executed with mode 0', async () => {
    const source = `
10 CGEN 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(0)
    expect(deviceAdapter.currentCgenMode).toBe(0)
  })

  it('should set character generator mode when CGEN is executed with mode 1', async () => {
    const source = `
10 CGEN 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(1)
    expect(deviceAdapter.currentCgenMode).toBe(1)
  })

  it('should set character generator mode when CGEN is executed with mode 2 (default)', async () => {
    const source = `
10 CGEN 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(2)
    expect(deviceAdapter.currentCgenMode).toBe(2)
  })

  it('should set character generator mode when CGEN is executed with mode 3', async () => {
    const source = `
10 CGEN 3
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(3)
    expect(deviceAdapter.currentCgenMode).toBe(3)
  })

  it('should handle CGEN with variable expressions', async () => {
    const source = `
10 LET M = 2
20 CGEN M
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(2)
  })

  it('should handle CGEN with arithmetic expressions', async () => {
    const source = `
10 CGEN 1 + 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(2)
  })

  it('should handle multiple CGEN statements', async () => {
    const source = `
10 CGEN 0
20 CGEN 1
30 CGEN 2
40 CGEN 3
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(4)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(0)
    expect(deviceAdapter.cgenModeCalls[1]).toBe(1)
    expect(deviceAdapter.cgenModeCalls[2]).toBe(2)
    expect(deviceAdapter.cgenModeCalls[3]).toBe(3)
    // Last call should be the current mode
    expect(deviceAdapter.currentCgenMode).toBe(3)
  })

  it('should handle CGEN with colon-separated statements', async () => {
    const source = `
10 CGEN 0: CGEN 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(2)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(0)
    expect(deviceAdapter.cgenModeCalls[1]).toBe(1)
  })

  it('should report error when CGEN mode is out of range (negative)', async () => {
    const source = `
10 CGEN -1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toMatch(/CGEN: Mode out of range \(0-3\)/)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(0)
  })

  it('should report error when CGEN mode is out of range (too high)', async () => {
    const source = `
10 CGEN 4
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toMatch(/CGEN: Mode out of range \(0-3\)/)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(0)
  })

  it('should report error when CGEN mode is out of range (very high)', async () => {
    const source = `
10 CGEN 100
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toMatch(/CGEN: Mode out of range \(0-3\)/)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(0)
  })

  it('should floor decimal values for CGEN mode', async () => {
    const source = `
10 CGEN 5 / 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(2)
  })

  it('should handle CGEN with PRINT integration', async () => {
    const source = `
10 CGEN 0
20 PRINT "HELLO"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.cgenModeCalls).toHaveLength(1)
    expect(deviceAdapter.cgenModeCalls[0]).toBe(0)
    expect(deviceAdapter.printOutputs).toEqual(expect.arrayContaining(['HELLO\n']))
  })
})
