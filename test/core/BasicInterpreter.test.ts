/**
 * BasicInterpreter unit tests
 *
 * Covers REPL support: executeSingleStatement, getContext,
 * persistent interpreter state, and last-source storage for RUN.
 */

import { describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('BasicInterpreter', () => {
  describe('getContext', () => {
    it('should return undefined before any execution', () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      expect(interpreter.getContext()).toBeUndefined()
    })

    it('should return ExecutionContext after execute()', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await interpreter.execute('10 LET X = 5\n20 END')

      const ctx = interpreter.getContext()
      expect(ctx).toBeDefined()
      expect(ctx!.variables.get('X')).toEqual({ value: 5, type: 'number' })
    })
  })

  describe('executeSingleStatement', () => {
    it('should execute a PRINT statement and produce output', async () => {
      const deviceAdapter = new TestDeviceAdapter()
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
        deviceAdapter,
      })

      const result = await interpreter.executeSingleStatement('PRINT "hello"')

      expect(result.success).toEqual(true)
      expect(result.errors).toEqual([])
      expect(deviceAdapter.getAllOutputs()).toContain('hello')
    })

    it('should execute a LET statement and update variables', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      const result = await interpreter.executeSingleStatement('LET X = 42')

      expect(result.success).toEqual(true)
      expect(result.errors).toEqual([])
      expect(interpreter.getContext()?.variables.get('X')).toEqual({
        value: 42,
        type: 'number',
      })
    })

    it('should preserve variables across multiple single-statement executions', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await interpreter.executeSingleStatement('LET X = 10')
      await interpreter.executeSingleStatement('LET Y = 20')
      await interpreter.executeSingleStatement('LET Z = X + Y')

      const vars = interpreter.getContext()?.variables
      expect(vars?.get('X')).toEqual({ value: 10, type: 'number' })
      expect(vars?.get('Y')).toEqual({ value: 20, type: 'number' })
      expect(vars?.get('Z')).toEqual({ value: 30, type: 'number' })
    })

    it('should return syntax errors for invalid statements', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      const result = await interpreter.executeSingleStatement('INVALIDSYNTAX')

      expect(result.success).toEqual(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should share context infrastructure with prior execute() calls', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      // Run a full program first
      await interpreter.execute('10 LET A = 100\n20 END')

      // Then execute a single REPL statement — reuses the same context object
      // Variables from the completed program are preserved (reset happens before execution)
      const result = await interpreter.executeSingleStatement('LET B = A + 1')

      expect(result.success).toEqual(true)
      const vars = interpreter.getContext()?.variables
      expect(vars?.get('A')).toEqual({ value: 100, type: 'number' })
      expect(vars?.get('B')).toEqual({ value: 101, type: 'number' })
    })
  })

  describe('persistent interpreter state', () => {
    it('should preserve context after program execution completes', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await interpreter.execute('10 LET X = 99\n20 END')

      // Context should still exist after execution
      const ctx = interpreter.getContext()
      expect(ctx).toBeDefined()
      expect(ctx!.variables.get('X')).toEqual({ value: 99, type: 'number' })
    })

    it('should reuse context across multiple execute() calls', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      // First execution sets variables
      await interpreter.execute('10 LET A = 1\n20 LET B = 2\n30 END')

      // Second execution should reset variables (full program re-run)
      await interpreter.execute('10 LET C = 3\n20 END')

      const ctx = interpreter.getContext()
      const vars = ctx!.variables
      // A and B are gone because execute() resets context
      expect(vars.get('A')).toBeUndefined()
      expect(vars.get('B')).toBeUndefined()
      expect(vars.get('C')).toEqual({ value: 3, type: 'number' })
    })
  })

  describe('getLastSource / runStoredProgram', () => {
    it('should store the last executed source code', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await interpreter.execute('10 PRINT "first"\n20 END')
      expect(interpreter.getLastSource()).toEqual('10 PRINT "first"\n20 END')

      await interpreter.execute('10 PRINT "second"\n20 END')
      expect(interpreter.getLastSource()).toEqual('10 PRINT "second"\n20 END')
    })

    it('should return undefined when no program has been executed', () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      expect(interpreter.getLastSource()).toBeUndefined()
    })

    it('should not store source from executeSingleStatement', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await interpreter.executeSingleStatement('PRINT "repl"')

      expect(interpreter.getLastSource()).toBeUndefined()
    })

    it('should re-execute the stored program via runStoredProgram()', async () => {
      const deviceAdapter = new TestDeviceAdapter()
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
        deviceAdapter,
      })

      await interpreter.execute('10 LET X = 0\n20 LET X = X + 1\n30 PRINT X\n40 END')
      deviceAdapter.clearOutputs()

      // Modify variable between runs
      const result = await interpreter.runStoredProgram()

      expect(result.success).toEqual(true)
      // X should be reset and re-computed
      expect(interpreter.getContext()?.variables.get('X')).toEqual({
        value: 1,
        type: 'number',
      })
    })

    it('should throw when runStoredProgram() is called with no stored source', async () => {
      const interpreter = new BasicInterpreter({
        maxIterations: 1000,
        maxOutputLines: 100,
      })

      await expect(interpreter.runStoredProgram()).rejects.toThrow('No program source stored')
    })
  })
})
