/**
 * DATA Executor Tests (Integration via BasicInterpreter)
 *
 * Integration-level tests for the DataExecutor covering end-to-end DATA/READ
 * interactions through the public BasicInterpreter API.
 * Unit-level tests for DataExecutor internals exist in DataReadRestoreExecutor.test.ts.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('DataExecutor (Integration)', () => {
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

  describe('DATA with numeric values', () => {
    it('should store and retrieve numeric values via READ', async () => {
      const source = `
10 DATA 10, 20, 30
20 READ A, B, C
30 PRINT A; B; C
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10 20 30\nOK\n')
    })

    it('should handle hex literal values in DATA', async () => {
      const source = `
10 DATA &HFF, &H10
20 READ A, B
30 PRINT A; B
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 255 16\nOK\n')
    })
  })

  describe('DATA with string values', () => {
    it('should store and retrieve quoted string values via READ', async () => {
      const source = `
10 DATA "HELLO", "WORLD"
20 READ A$, B$
30 PRINT A$; " "; B$
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('HELLO WORLD\nOK\n')
    })

    it('should handle unquoted string constants in DATA', async () => {
      const source = `
10 DATA APPLE, BANANA, CHERRY
20 READ A$, B$, C$
30 PRINT A$; " "; B$; " "; C$
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('APPLE BANANA CHERRY\nOK\n')
    })
  })

  describe('Multiple DATA statements', () => {
    it('should accumulate values from multiple DATA statements', async () => {
      const source = `
10 DATA 1, 2, 3
20 DATA 4, 5, 6
30 READ A, B, C, D, E, F
40 PRINT A; B; C; D; E; F
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 1 2 3 4 5 6\nOK\n')
    })
  })

  describe('DATA with mixed types', () => {
    it('should store and retrieve mixed numeric and string values', async () => {
      const source = `
10 DATA 42, "ANSWER", 7
20 READ N, A$, M
30 PRINT A$; " IS "; N; M
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('ANSWER IS  42 7\nOK\n')
    })
  })

  describe('Empty DATA statement', () => {
    it('should handle empty DATA statement without error', async () => {
      const source = `
10 DATA
20 DATA 1
30 READ A
40 PRINT A
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 1\nOK\n')
    })
  })

  describe('DATA statement ordering', () => {
    it('should process DATA statements in line number order regardless of execution order', async () => {
      const source = `
10 READ A, B, C
20 PRINT A; B; C
30 END
40 DATA 100, 200, 300
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 100 200 300\nOK\n')
    })
  })
})
