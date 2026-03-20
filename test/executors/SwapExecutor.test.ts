/**
 * SWAP Executor Tests
 *
 * Unit tests for the SwapExecutor: SWAP variable1, variable2.
 * Types must match (numeric with numeric, string with string).
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('SwapExecutor', () => {
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

  it('should swap two simple numeric variables', async () => {
    const source = `
10 LET A = 10
20 LET B = 20
30 SWAP A, B
40 PRINT A, B
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual(' 20\t 10\nOK\n')
  })

  it('should swap two simple string variables', async () => {
    const source = `
10 LET A$ = "HELLO"
20 LET B$ = "WORLD"
30 SWAP A$, B$
40 PRINT A$, B$
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('WORLD\tHELLO\nOK\n')
  })

  it('should swap array elements (manual p.67 sample)', async () => {
    const source = `
10 REM * SWAP *
20 DIM A(10)
30 FOR I=1 TO 10
40 READ A(I)
50 PRINT A(I);
60 NEXT
70 FOR I=1 TO 10
80 FOR J=1 TO 10
90 IF A(I)<A(J) THEN SWAP A(I), A(J)
100 NEXT
110 NEXT
120 PRINT
130 FOR I=1 TO 10
140 PRINT A(I);
150 NEXT
160 DATA 2,3,5,1,7,4,8,9,6,0
170 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    // First line: 2 3 5 1 7 4 8 9 6 0 (unsorted)
    // Second line: 0 1 2 3 4 5 6 7 8 9 (sorted)
    // The last PRINT A(I); doesn't add newline before END prints "OK"
    expect(outputs).toEqual(' 2 3 5 1 7 4 8 9 6 0\n 0 1 2 3 4 5 6 7 8 9OK\n')
  })

  it('should swap simple var with array element', async () => {
    const source = `
10 DIM X(1)
20 LET X(0) = 100
30 LET Y = 200
40 SWAP X(0), Y
50 PRINT X(0), Y
60 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual(' 200\t 100\nOK\n')
  })

  it('should report type mismatch for numeric and string', async () => {
    const source = `
10 LET A = 5
20 LET B$ = "X"
30 SWAP A, B$
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message ?? '').toMatch(/type mismatch/)
  })

  it('should handle SWAP on same line as other commands', async () => {
    const source = `
10 LET A = 1
20 LET B = 2
30 SWAP A, B: PRINT A, B
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual(' 2\t 1\nOK\n')
  })

  it('should swap uninitialized numeric vars (0 and 0)', async () => {
    const source = `
10 SWAP X, Y
20 PRINT X, Y
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual(' 0\t 0\nOK\n')
  })

  it('should swap uninitialized string vars (empty)', async () => {
    const source = `
10 SWAP A$, B$
20 PRINT A$; B$
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    const outputs = deviceAdapter.getAllOutputs()
    // Both A$ and B$ are empty; PRINT A$; B$ outputs nothing (implementation may or may not add newline)
    // But END prints "OK\n"
    expect(outputs === 'OK\n' || outputs === '\nOK\n').toBe(true)
  })
})
