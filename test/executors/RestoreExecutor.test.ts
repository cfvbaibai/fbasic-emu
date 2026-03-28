/**
 * RESTORE Executor Tests
 *
 * Unit tests for the RestoreExecutor class execution behavior.
 * Tests RESTORE functionality matching the FamilyBasicManual specification.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('RestoreExecutor', () => {
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

  describe('RESTORE without line number', () => {
    it('should reset data pointer to beginning', async () => {
      // From manual page 69: RESTORE resets pointer to beginning
      const source = `
10 DATA 10, 20, 30
20 DATA 40, 50, 60
30 READ A, B, C
40 READ D, E
50 RESTORE
60 READ F, G
70 PRINT A, B, C, D, E, F, G
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should read: 10, 20, 30, 40, 50, then after RESTORE: 10, 20
      // Comma separator uses tabs, numbers have leading spaces
      expect(outputs).toEqual(' 10\t 20\t 30\t 40\t 50\t 10\t 20\nOK\n')
    })

    it('should allow reading same DATA multiple times', async () => {
      const source = `
10 DATA 1, 2, 3
20 READ A, B
30 RESTORE
40 READ C, D
50 RESTORE
60 READ E, F
70 PRINT A, B, C, D, E, F
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // All should read 1, 2 (three times)
      expect(outputs).toEqual(' 1\t 2\t 1\t 2\t 1\t 2\nOK\n')
    })
  })

  describe('RESTORE with line number', () => {
    it('should restore data pointer to specific line', async () => {
      // From manual page 69 example
      const source = `
10 REM * RESTORE *
20 RESTORE 1010
30 FOR I=0 TO 5
40 READ A
50 PRINT A;
60 NEXT
70 PRINT
80 RESTORE 1000
90 FOR I=0 TO 5
100 READ A
110 PRINT A;
120 NEXT
130 END
1000 DATA 23,43,55,65,42,9
1010 DATA 12,56,34,68,53,2
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // First loop should read from line 1010: 12, 56, 34, 68, 53, 2
      // Second loop should read from line 1000: 23, 43, 55, 65, 42, 9
      // Semicolon separator concatenates on same line, then PRINT adds newline
      // But the second line's PRINT A; doesn't add newline before END prints "OK"
      expect(outputs).toEqual(' 12 56 34 68 53 2\n 23 43 55 65 42 9OK\n')
    })

    it('should restore to first DATA statement when line number is before any DATA', async () => {
      const source = `
10 RESTORE 100
20 READ A, B, C
30 PRINT A, B, C
40 END
100 DATA 10, 20, 30
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10\t 20\t 30\nOK\n')
    })

    it('should restore to specific DATA line in sequence', async () => {
      const source = `
10 DATA 1, 2
20 DATA 3, 4
30 DATA 5, 6
40 RESTORE 20
50 READ A, B
60 PRINT A, B
70 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should read from line 20: 3, 4
      expect(outputs).toEqual(' 3\t 4\nOK\n')
    })
  })

  describe('RESTORE with READ integration', () => {
    it('should allow multiple RESTORE calls', async () => {
      const source = `
10 DATA 10, 20
20 DATA 30, 40
30 READ A
40 RESTORE 20
50 READ B
60 RESTORE 10
70 READ C
80 PRINT A, B, C
90 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // A=10, B=30, C=10
      expect(outputs).toEqual(' 10\t 30\t 10\nOK\n')
    })

    it('should work with string DATA', async () => {
      const source = `
10 DATA "HELLO", "WORLD"
20 DATA "FOO", "BAR"
30 RESTORE 20
40 READ A$, B$
50 PRINT A$, B$
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('FOO\tBAR\nOK\n')
    })

    it('should work with mixed numeric and string DATA', async () => {
      const source = `
10 DATA 10, "TEN", 20, "TWENTY"
20 RESTORE 10
30 READ A, A$, B, B$
40 PRINT A, A$, B, B$
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10\tTEN\t 20\tTWENTY\nOK\n')
    })
  })

  describe('RESTORE edge cases', () => {
    it('should handle RESTORE to non-existent line number', async () => {
      const source = `
10 DATA 10, 20
20 RESTORE 999
30 READ A
40 END
`
      const result = await interpreter.execute(source)

      // Should produce a runtime error and halt execution
      expect(result).toBeDefined()
      expect(result.errors.length).toBeGreaterThanOrEqual(1)
      expect(result.errors[0]?.message).toEqual('RESTORE target line 999 not found')
    })

    it('should handle RESTORE before any DATA statements', async () => {
      // DATA statements are processed first, so RESTORE should work
      const source = `
100 DATA 10
10 RESTORE
20 READ A
30 PRINT A
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual(' 10\nOK\n')
    })
  })

  describe('RESTORE in loops', () => {
    it('should work with RESTORE inside FOR loop', async () => {
      const source = `
10 DATA 1, 2, 3
20 FOR I=1 TO 3
30 RESTORE
40 READ A
50 PRINT A;
60 NEXT
70 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should print 1 three times (each loop restores and reads first value)
      // Semicolon separator concatenates on same line, no newline before END prints "OK"
      expect(outputs).toEqual(' 1 1 1OK\n')
    })

    it('should work with RESTORE to different lines in loop', async () => {
      // RESTORE only accepts literal line numbers, not expressions
      // So we'll use IF-THEN to select different RESTORE statements
      const source = `
10 DATA 10, 20
20 DATA 30, 40
30 FOR I=1 TO 2
40 IF I=1 THEN RESTORE 10
50 IF I=2 THEN RESTORE 20
60 READ A
70 PRINT A;
80 NEXT
90 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // First iteration: RESTORE 10, reads 10
      // Second iteration: RESTORE 20, reads 30
      // Semicolon separator concatenates on same line, no newline before END prints "OK"
      expect(outputs).toEqual(' 10 30OK\n')
    })
  })
})
