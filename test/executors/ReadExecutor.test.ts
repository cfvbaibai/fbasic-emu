/**
 * READ Executor Tests (Integration via BasicInterpreter)
 *
 * Integration-level tests for the ReadExecutor covering end-to-end READ behavior
 * through the public BasicInterpreter API, including error cases.
 * Unit-level tests for ReadExecutor internals exist in DataReadRestoreExecutor.test.ts.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('ReadExecutor (Integration)', () => {
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

  describe('READ into scalar variables', () => {
    it('should read a single value into a numeric variable', async () => {
      const source = `
10 DATA 42
20 READ X
30 PRINT X
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 42\nOK\n')
    })

    it('should read values into multiple variables in one READ statement', async () => {
      const source = `
10 DATA 10, 20, 30
20 READ A, B, C
30 PRINT A + B + C
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 60\nOK\n')
    })

    it('should read string values into string variables', async () => {
      const source = `
10 DATA "GOOD", "MORNING"
20 READ A$, B$
30 PRINT A$; " "; B$
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('GOOD MORNING\nOK\n')
    })
  })

  describe('READ into array elements', () => {
    it('should read values into array elements', async () => {
      const source = `
10 DATA 10, 20, 30
20 DIM X(2)
30 READ X(0), X(1), X(2)
40 PRINT X(0); X(1); X(2)
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10 20 30\nOK\n')
    })

    it('should read values into string array elements', async () => {
      const source = `
10 DATA "A", "B"
20 DIM X$(1)
30 READ X$(0), X$(1)
40 PRINT X$(0); X$(1)
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('AB\nOK\n')
    })
  })

  describe('Sequential READ calls', () => {
    it('should advance data pointer across multiple READ statements', async () => {
      const source = `
10 DATA 1, 2, 3, 4, 5
20 READ A
30 READ B
40 READ C
50 PRINT A; B; C
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 1 2 3\nOK\n')
    })
  })

  describe('READ with RESTORE', () => {
    it('should reset data pointer with RESTORE', async () => {
      const source = `
10 DATA 1, 2, 3
20 READ A, B, C
30 RESTORE
40 READ X, Y, Z
50 PRINT A; B; C; X; Y; Z
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 1 2 3 1 2 3\nOK\n')
    })
  })

  describe('OD ERROR (out of data)', () => {
    it('should report OD ERROR when reading past end of data', async () => {
      const source = `
10 DATA 1
20 READ A, B, C
30 PRINT A
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toEqual('OD ERROR')
    })
  })

  describe('READ in a loop', () => {
    it('should read data values inside a FOR loop', async () => {
      const source = `
10 DATA 10, 20, 30, 40, 50
20 DIM X(4)
30 FOR I = 0 TO 4
40 READ X(I)
50 NEXT
60 PRINT X(0); X(1); X(2); X(3); X(4)
70 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10 20 30 40 50\nOK\n')
    })
  })
})
