/**
 * IF-THEN Colon Scope Tests
 *
 * Tests for colon-scoped IF execution — when an IF condition is false,
 * subsequent colon-separated statements on the same line should be skipped.
 * This matches real F-BASIC hardware behavior where colons after IF
 * keep subsequent statements within the IF's true branch.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('IfThenExecutor colon-scoped execution', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      suppressOkPrompt: true,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should execute colon-separated statements after THEN-less IF when condition is true', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 PRINT "A": PRINT "B"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(deviceAdapter.getAllOutputs()).toEqual('A\nB\n')
  })

  it('should skip colon-separated statements after THEN-less IF when condition is false', async () => {
    const source = `
10 LET X = 0
20 IF X = 1 PRINT "A": PRINT "B"
30 PRINT "C"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(deviceAdapter.getAllOutputs()).toEqual('C\n')
  })

  it('should scope nested IF across colons — second IF only runs when first is true', async () => {
    const source = `
10 LET X = 1
20 LET Y = 0
30 IF X = 1 PRINT "X1": IF Y = 1 PRINT "BOTH"
40 PRINT "AFTER"
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // X=1 is true -> prints "X1". Y=0 is false -> "BOTH" is scoped under first IF
    // but the second IF's own condition is false so "BOTH" doesn't print.
    expect(deviceAdapter.getAllOutputs()).toEqual('X1\nAFTER\n')
  })

  it('should skip all colon-separated statements when outer IF is false', async () => {
    const source = `
10 LET X = 0
20 LET Y = 1
30 IF X = 1 PRINT "X1": IF Y = 1 PRINT "BOTH"
40 PRINT "AFTER"
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // X=0 is false -> skip everything on line 30 (including nested IF)
    expect(deviceAdapter.getAllOutputs()).toEqual('AFTER\n')
  })

  it('should scope IF-THEN with commandList over colon-separated statements', async () => {
    const source = `
10 LET X = 0
20 IF X = 1 THEN PRINT "A": PRINT "B"
30 PRINT "C"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // X=0 is false -> skip "A" and "B" on line 20
    expect(deviceAdapter.getAllOutputs()).toEqual('C\n')
  })

  it('should NOT scope IF with line number jump over colon statements', async () => {
    const source = `
10 LET X = 0
20 IF X = 1 THEN 50: PRINT "B"
30 PRINT "C"
40 END
50 PRINT "D"
60 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // X=0 is false, but IF-THEN with line number jump does NOT scope
    // So "B" on line 20 still executes independently
    expect(deviceAdapter.getAllOutputs()).toEqual('B\nC\n')
  })

  it('should scope THEN-less IF with BEEP and PRINT across colons', async () => {
    const source = `
10 LET A = 0
20 IF A = 0 BEEP: PRINT "ZERO"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // A=0 is true -> both BEEP and PRINT execute
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('ZERO\n')
  })

  it('should skip THEN-less IF scope when condition is false', async () => {
    const source = `
10 LET A = 1
20 IF A = 0 BEEP: PRINT "ZERO"
30 PRINT "ONE"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    // A=1 is false -> skip BEEP and "ZERO"
    expect(deviceAdapter.getAllOutputs()).toEqual('ONE\n')
  })
})
