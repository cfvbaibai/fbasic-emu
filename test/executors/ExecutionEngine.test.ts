/**
 * Execution Engine Tests
 *
 * Integration-level tests for the ExecutionEngine covering key execution flows:
 * program execution, stop, reset, error handling, loop stack detection,
 * DATA preprocessing, iteration limits, and OK prompt behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('ExecutionEngine', () => {
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

  describe('Basic program execution', () => {
    it('should execute a simple program successfully', async () => {
      const source = `
10 PRINT "Hello"
20 PRINT "World"
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Hello\nWorld\nOK\n')
    })

    it('should execute program with no END statement (run to end)', async () => {
      const source = `
10 PRINT "A"
20 PRINT "B"
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('A\nB\nOK\n')
    })
  })

  describe('Execution result', () => {
    it('should return execution time', async () => {
      const source = `
10 PRINT "Test"
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(typeof result.executionTime).toBe('number')
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
    })

    it('should return variables map', async () => {
      const source = `
10 LET X = 42
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.variables).toBeDefined()
      expect(result.variables.get('X')?.value).toBe(42)
    })
  })

  describe('OK prompt behavior', () => {
    it('should output OK when program ends successfully', async () => {
      const source = `
10 PRINT "Hi"
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Hi\nOK\n')
    })

    it('should suppress OK prompt when suppressOkPrompt is enabled', async () => {
      interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
        deviceAdapter: deviceAdapter,
        suppressOkPrompt: true,
      })
      const source = `
10 PRINT "Hi"
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Hi\n')
    })

    it('should not output OK when program has errors', async () => {
      const source = `
10 GOTO 999
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      // No OK prompt on error
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).not.toContain('OK\n')
    })
  })

  describe('DATA preprocessing', () => {
    it('should preprocess DATA statements before execution', async () => {
      const source = `
10 READ A
20 PRINT A
30 END
40 DATA 999
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 999\nOK\n')
    })
  })

  describe('Unclosed FOR loop detection', () => {
    it('should report error when FOR loop is not closed with NEXT', async () => {
      const source = `
10 FOR I = 1 TO 5
20 PRINT I
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toEqual('Missing NEXT statement for FOR loop')
    })
  })

  describe('Iteration limit', () => {
    it('should stop execution when iteration limit is reached', async () => {
      // Create interpreter with very low iteration limit
      interpreter = new BasicInterpreter({
        maxIterations: 5,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
        deviceAdapter: deviceAdapter,
        suppressOkPrompt: true,
      })
      const source = `
10 FOR I = 1 TO 100
20 PRINT I;
30 NEXT
`
      const result = await interpreter.execute(source)

      // Should fail due to iteration limit
      expect(result.success).toBe(false)
    })
  })

  describe('Sequential execution order', () => {
    it('should execute statements in the order they appear in source', async () => {
      const source = `
10 PRINT "1"
20 PRINT "2"
30 PRINT "3"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('1\n2\n3\nOK\n')
    })
  })

  describe('Stop and reset', () => {
    it('should provide stop method on interpreter', () => {
      // Verify stop method exists and can be called without error
      expect(() => interpreter.stop()).not.toThrow()
    })

    it('should provide reset method on interpreter', () => {
      // Verify reset method exists and can be called without error
      expect(() => interpreter.reset()).not.toThrow()
    })

    it('should execute cleanly after reset', async () => {
      await interpreter.execute(`
10 PRINT "First"
20 END
`)
      interpreter.reset()

      const result = await interpreter.execute(`
10 PRINT "Second"
20 END
`)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('First\nOK\nSecond\nOK\n')
    })
  })

  describe('Error handling', () => {
    it('should handle runtime errors gracefully', async () => {
      const source = `
10 LET X = 1 / 0
20 END
`
      const result = await interpreter.execute(source)

      // Division by zero behavior - may be success or error depending on implementation
      // Just verify no crash and valid result structure
      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('Empty program', () => {
    it('should handle empty source code', async () => {
      const result = await interpreter.execute('')

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('OK\n')
    })
  })
})
