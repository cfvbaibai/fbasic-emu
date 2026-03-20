/**
 * INPUT Executor Tests
 *
 * Unit tests for the InputExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('InputExecutor', () => {
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

  it('should assign single numeric value from INPUT to variable', async () => {
    deviceAdapter.inputResponseQueue.push(['42'])
    const source = `
10 INPUT A
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.variables.get('A')).toEqual({ value: 42, type: 'number' })
  })

  it('should assign single string value from INPUT to string variable', async () => {
    deviceAdapter.inputResponseQueue.push(['hello'])
    const source = `
10 INPUT A$
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.variables.get('A$')).toEqual({ value: 'hello', type: 'string' })
  })

  it('should assign multiple comma-separated values from INPUT', async () => {
    deviceAdapter.inputResponseQueue.push(['10', '20', 'foo'])
    const source = `
10 INPUT A, B, C$
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.variables.get('A')).toEqual({ value: 10, type: 'number' })
    expect(result.variables.get('B')).toEqual({ value: 20, type: 'number' })
    expect(result.variables.get('C$')).toEqual({ value: 'foo', type: 'string' })
  })

  it('should use default prompt ? when no string given', async () => {
    deviceAdapter.inputResponseQueue.push(['7'])
    const source = `
10 INPUT X
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(true)
    expect(result.variables.get('X')).toEqual({ value: 7, type: 'number' })
  })

  it('should treat empty input as 0 for numeric variable', async () => {
    deviceAdapter.inputResponseQueue.push([''])
    const source = `
10 INPUT N
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(true)
    expect(result.variables.get('N')).toEqual({ value: 0, type: 'number' })
  })

  it('should treat empty input as empty string for string variable', async () => {
    deviceAdapter.inputResponseQueue.push([''])
    const source = `
10 INPUT S$
20 END
`
    const result = await interpreter.execute(source)
    expect(result.success).toBe(true)
    expect(result.variables.get('S$')).toEqual({ value: '', type: 'string' })
  })

  it('should add error when device has no requestInput', async () => {
    const adapterWithoutInput = new TestDeviceAdapter()
    adapterWithoutInput.requestInput = undefined
    const interp = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: adapterWithoutInput,
    })
    adapterWithoutInput.inputResponseQueue.push(['1'])
    const source = `
10 INPUT A
20 END
`
    const result = await interp.execute(source)
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/not supported/)
  })
})
