/**
 * LINPUT Executor Tests
 *
 * Unit tests for the LinputExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { BasicDeviceAdapter } from '@/core/interfaces'

describe('LinputExecutor', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter,
    })
  })

  it('should assign line input to string variable', async () => {
    deviceAdapter.inputResponseQueue.push(['hello, world'])
    const source = `
10 LINPUT A$
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.variables.get('A$')).toEqual({ value: 'hello, world', type: 'string' })
  })

  it('should allow commas in LINPUT value', async () => {
    deviceAdapter.inputResponseQueue.push(['a, b, c'])
    const source = `
10 LINPUT S$
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(true)
    expect(result.variables.get('S$')).toEqual({ value: 'a, b, c', type: 'string' })
  })

  it('should use default prompt when no string given', async () => {
    deviceAdapter.inputResponseQueue.push(['test'])
    const source = `
10 LINPUT X$
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(true)
    expect(result.variables.get('X$')).toEqual({ value: 'test', type: 'string' })
  })

  it('should add error when LINPUT used with numeric variable', async () => {
    deviceAdapter.inputResponseQueue.push(['x'])
    const source = `
10 LINPUT A
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/string variable/)
  })

  it('should add error when device has no requestInput', async () => {
    const adapterWithoutInput = new TestDeviceAdapter()
    ;(adapterWithoutInput as BasicDeviceAdapter).requestInput = undefined
    const interp = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: adapterWithoutInput,
    })
    adapterWithoutInput.inputResponseQueue.push(['x'])
    const source = `
10 LINPUT A$
20 END
`
    const result = await interp.execute(source)
    expect(result.success).toBe(false)
    expect(result.errors[0]?.message).toMatch(/not supported/)
  })
})
