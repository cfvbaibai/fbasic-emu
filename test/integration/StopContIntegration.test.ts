import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { EXECUTION_LIMITS } from '@/core/constants'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('STOP/CONT Integration', () => {
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
      deviceAdapter,
    })
  })

  it('pauses at STOP and resumes from next statement with CONT', async () => {
    const source = `
10 A=1
20 PRINT "BEFORE"
30 STOP
40 A=A+1
50 PRINT "AFTER ";A
60 END
`

    const pauseResult = await interpreter.execute(source)
    expect(pauseResult.success).toBe(true)
    expect(pauseResult.errors).toHaveLength(0)
    expect(deviceAdapter.getAllOutputs()).toContain('BEFORE\n')
    expect(deviceAdapter.getAllOutputs()).not.toContain('AFTER')
    expect(interpreter.getVariables().get('A')?.value).toBe(1)

    const resumeResult = await interpreter.execute('10 CONT')
    expect(resumeResult.success).toBe(true)
    expect(resumeResult.errors).toHaveLength(0)
    expect(interpreter.getVariables().get('A')?.value).toBe(2)
    expect(deviceAdapter.getAllOutputs()).toContain('AFTER  2\n')
  })

  it('returns an error for CONT without a paused STOP state', async () => {
    const result = await interpreter.execute('10 CONT')

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toBe('CONT: no paused program to continue')
  })
})
