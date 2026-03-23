/**
 * BEEP Executor Tests
 *
 * Unit tests for the BeepExecutor: BEEP produces a beep sound.
 * Reference: F-BASIC Manual page 80
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('BeepExecutor', () => {
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

  it('should call beep on device adapter when BEEP is executed', async () => {
    const source = `
10 BEEP
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.beepCalls).toEqual(1)
  })

  it('should call beep multiple times when BEEP is executed in a loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 BEEP
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.beepCalls).toEqual(3)
  })

  it('should call beep when BEEP is combined with other statements on the same line', async () => {
    const source = `
10 PRINT "Hello": BEEP
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.getAllOutputs()).toEqual('Hello\nOK\n')
    expect(deviceAdapter.beepCalls).toEqual(1)
  })

  it('should call beep before program ends via END', async () => {
    const source = `
10 BEEP
20 PRINT "Done"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.getAllOutputs()).toEqual('Done\nOK\n')
    expect(deviceAdapter.beepCalls).toEqual(1)
  })

  it('should not call beep for lines that are not executed (after END)', async () => {
    const source = `
10 BEEP
20 END
30 BEEP
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    // Only the first BEEP should be called; line 30 is never reached
    expect(deviceAdapter.beepCalls).toEqual(1)
  })

  it('should call beep inside a GOSUB subroutine', async () => {
    const source = `
10 GOSUB 100
20 END
100 BEEP
110 RETURN
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.beepCalls).toEqual(1)
  })
})
