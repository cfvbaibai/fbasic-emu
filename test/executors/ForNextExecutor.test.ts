/**
 * FOR/NEXT Executor Tests
 *
 * Unit tests for the ForExecutor and NextExecutor classes execution behavior.
 * Based on Family BASIC manual page 65.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('FOR/NEXT Executor', () => {
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

  describe('Basic FOR-NEXT Loop', () => {
    it('should execute basic FOR-NEXT loop', async () => {
      const source = `
10 FOR I = 1 TO 5
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3 4 5')
    })

    it('should execute loop with default STEP 1', async () => {
      const source = `
10 FOR I = 1 TO 3
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3')
    })

    it('should execute loop with explicit STEP 1', async () => {
      const source = `
10 FOR I = 1 TO 3 STEP 1
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3')
    })

    it('should execute loop starting at 0', async () => {
      const source = `
10 FOR I = 0 TO 2
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 0 1 2')
    })
  })

  describe('FOR-NEXT with STEP', () => {
    it('should execute loop with positive STEP', async () => {
      // From page-65.md example (1)
      const source = `
10 FOR I = 0 TO 10 STEP 2
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 0 2 4 6 8 10')
    })

    it('should execute loop with negative STEP', async () => {
      const source = `
10 FOR I = 10 TO 1 STEP -1
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 10 9 8 7 6 5 4 3 2 1')
    })

    it('should execute loop with STEP > 1', async () => {
      const source = `
10 FOR I = 1 TO 10 STEP 3
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 4 7 10')
    })
  })

  describe('Loop Execution Conditions', () => {
    it('should not execute loop body when start > end with positive step', async () => {
      // Per Family BASIC manual page 65: "When the condition is not met, the loop should not execute."
      const source = `
10 FOR I = 10 TO 1
20 PRINT I;
30 NEXT
40 PRINT "Done"
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Loop should not execute at all; only "Done" should print
      expect(outputs).toEqual('Done\n')
    })

    it('should not execute loop body when start < end with negative step', async () => {
      // Per Family BASIC manual page 65: "When the condition is not met, the loop should not execute."
      const source = `
10 FOR I = 1 TO 10 STEP -1
20 PRINT I;
30 NEXT
40 PRINT "Done"
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Loop should not execute at all; only "Done" should print
      expect(outputs).toEqual('Done\n')
    })

    it('should execute loop exactly once when start equals end', async () => {
      const source = `
10 FOR I = 5 TO 5
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should execute once and print 5
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 5')
    })
  })

  describe('Nested FOR-NEXT Loops', () => {
    it('should execute nested FOR-NEXT loops', async () => {
      const source = `
10 FOR I = 1 TO 2
20 FOR J = 1 TO 2
30 PRINT I; J;
40 NEXT
50 NEXT
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT I; J; ends with semicolon, so all outputs are on same line
      // Positive numbers always get a space BEFORE them
      // Semicolon does not add space - only the leading space before each number
      // Nested loops: I=1,J=1; I=1,J=2; I=2,J=1; I=2,J=2
      expect(outputs).toEqual(' 1 1 1 2 2 1 2 2')
    })

    it('should execute triple nested loops matching manual example', async () => {
      // From page-65.md example (2) structure
      const source = `
10 FOR I = 1 TO 2
20 FOR J = 1 TO I
30 FOR K = 1 TO J
40 PRINT "X";
50 NEXT
60 NEXT
70 NEXT
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT "X"; ends with semicolon, so all X's are on same line
      // I=1: J=1: K=1 -> X (1 time)
      // I=2: J=1: K=1 -> X (1 time), J=2: K=1,2 -> XX (2 times)
      // Total: XXXX
      expect(outputs).toEqual('XXXX')
    })
  })

  describe('FOR with Expressions', () => {
    it('should execute loop with expression in start value', async () => {
      const source = `
10 LET X = 1
20 FOR I = X TO 3
30 PRINT I;
40 NEXT
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3')
    })

    it('should execute loop with expression in end value', async () => {
      const source = `
10 LET X = 5
20 FOR I = 1 TO X
30 PRINT I;
40 NEXT
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3 4 5')
    })

    it('should execute loop with expression in STEP', async () => {
      const source = `
10 LET X = 2
20 FOR I = 1 TO 5 STEP X
30 PRINT I;
40 NEXT
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 3 5')
    })

    it('should execute loop with arithmetic expressions', async () => {
      const source = `
10 FOR I = 1 + 1 TO 5 + 1 STEP 1 + 1
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 2 4 6')
    })
  })

  describe('Loop Variable State', () => {
    it('should set loop variable to start value initially', async () => {
      const source = `
10 FOR I = 5 TO 7
20 PRINT I;
30 NEXT
40 PRINT I;
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Both PRINT statements end with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 5 6 7 8')
    })

    it('should preserve loop variable value after loop ends', async () => {
      const source = `
10 FOR I = 1 TO 3
20 NEXT
30 PRINT I;
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // After loop ends, I should be 4 (3 + 1)
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 4')
    })

    it('should set loop variable to start value when loop does not execute', async () => {
      const source = `
10 FOR I = 10 TO 1
20 PRINT I;
30 NEXT
40 PRINT I;
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Loop does not execute; I retains start value 10
      // PRINT I; ends with semicolon, so output is just " 10"
      expect(outputs).toEqual(' 10')
    })

    it('should respect user modification of loop variable inside body', async () => {
      const source = `
10 FOR I = 1 TO 10
20 I = 100
30 PRINT I;
40 NEXT
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // User sets I = 100; NEXT reads 100, adds step 1 -> 101
      // 101 > end value 10, so loop exits after first iteration
      // PRINT I; prints the user-set value 100
      expect(outputs).toEqual(' 100')
    })
  })

  describe('Error Cases', () => {
    it('should error on NEXT without FOR', async () => {
      const source = `
10 NEXT
20 PRINT "This should not print"
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      const errorMessages = result.errors.map(e => e.message).join(' ')
      expect(errorMessages).toEqual('NEXT without FOR')

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('RUNTIME: NEXT without FOR')
    })

    it('should error on FOR with non-numeric start value', async () => {
      const source = `
10 FOR I = "A" TO 5
20 NEXT
30 PRINT "This should not print"
40 END
`
      const result = await interpreter.execute(source)

      // This should either error or be handled gracefully
      // The exact behavior depends on implementation
      expect(result.errors.length).toBeGreaterThan(0)

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      // Error message format depends on implementation, but should not contain PRINT output
      // Should only contain error message, not the PRINT output
      expect(outputs).not.toEqual('This should not print')
      // Output should start with "RUNTIME:" for runtime errors
      expect(outputs.startsWith('RUNTIME:')).toBe(true)
    })

    it('should error on FOR with non-numeric end value', async () => {
      const source = `
10 FOR I = 1 TO "B"
20 NEXT
30 PRINT "This should not print"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.errors.length).toBeGreaterThan(0)

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      // Should only contain error message, not the PRINT output
      expect(outputs).not.toEqual('This should not print')
      // Output should start with "RUNTIME:" for runtime errors
      expect(outputs.startsWith('RUNTIME:')).toBe(true)
    })

    it('should error on FOR with non-numeric STEP value', async () => {
      const source = `
10 FOR I = 1 TO 5 STEP "C"
20 NEXT
30 PRINT "This should not print"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.errors.length).toBeGreaterThan(0)

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      // Should only contain error message, not the PRINT output
      expect(outputs).not.toEqual('This should not print')
      // Output should start with "RUNTIME:" for runtime errors
      expect(outputs.startsWith('RUNTIME:')).toBe(true)
    })
  })

  describe('Colon-Separated Statements', () => {
    it('should execute FOR-NEXT loop on same line', async () => {
      const source = `
10 FOR I=1 TO 3: PRINT I;: NEXT
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 3')
    })

    it('should execute FOR with other statements on same line', async () => {
      const source = `
10 LET X=5: FOR I=1 TO 2: PRINT I;: NEXT: PRINT X
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT I; ends with semicolon, so PRINT X continues on same line
      // But PRINT X doesn't end with semicolon, so adds newline at end
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1 2 5\n')
    })
  })

  describe('Edge Cases', () => {
    it('should handle loop with very large step', async () => {
      const source = `
10 FOR I = 1 TO 10 STEP 100
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should only execute once with value 1
      // Numbers always get a space BEFORE them
      expect(outputs).toEqual(' 1')
    })

    it('should handle loop with negative step going to negative values', async () => {
      const source = `
10 FOR I = 5 TO -5 STEP -2
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT ends with semicolon, so all outputs are on same line
      // Positive numbers get a space BEFORE them (sign position)
      // Negative numbers do NOT get a leading space (minus sign occupies sign position)
      // Verified on real Famicom: PRINT -5 outputs "-5" (no leading space)
      expect(outputs).toEqual(' 5 3 1-1-3-5')
    })
  })
})
