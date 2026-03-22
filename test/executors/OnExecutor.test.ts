/**
 * ON Statement Executor Tests
 *
 * Unit tests for the OnExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('OnExecutor', () => {
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

  describe('ON ... GOTO', () => {
    it('should jump to first line when expression is 1', async () => {
      const result = await interpreter.execute(`
10 LET X = 1
20 ON X GOTO 100, 200, 300
30 PRINT "Skipped"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('First\nOK\n')
    })

    it('should jump to second line when expression is 2', async () => {
      const result = await interpreter.execute(`
10 LET X = 2
20 ON X GOTO 100, 200, 300
30 PRINT "Skipped"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Second\nOK\n')
    })

    it('should jump to third line when expression is 3', async () => {
      const result = await interpreter.execute(`
10 LET X = 3
20 ON X GOTO 100, 200, 300
30 PRINT "Skipped"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Third\nOK\n')
    })

    it('should proceed to next line when expression is 0', async () => {
      // Manual: value of 0 or exceeding line count falls through to next statement
      const result = await interpreter.execute(`
10 LET X = 0
20 ON X GOTO 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should proceed to next line when expression exceeds number of lines', async () => {
      // Manual: value of 0 or exceeding line count falls through to next statement
      const result = await interpreter.execute(`
10 LET X = 5
20 ON X GOTO 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should handle ON with expression', async () => {
      const result = await interpreter.execute(`
10 LET X = 1
20 ON X + 1 GOTO 100, 200, 300
30 PRINT "Skipped"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Second\nOK\n')
    })

    it('should handle negative expression value', async () => {
      const result = await interpreter.execute(`
10 LET X = -1
20 ON X GOTO 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should handle fractional expression value (truncated to integer)', async () => {
      // 5 / 2 = 2.5 truncated to 2, so should jump to second line
      const result = await interpreter.execute(`
10 LET X = 5
20 ON X / 2 GOTO 100, 200, 300
30 PRINT "Skipped"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Second\nOK\n')
    })
  })

  describe('ON ... GOSUB', () => {
    it('should jump to first line when expression is 1', async () => {
      const result = await interpreter.execute(`
10 LET N = 1
20 ON N GOSUB 100, 200, 300
30 PRINT "After"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
300 PRINT "Third"
310 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('First\nAfter\nOK\n')
    })

    it('should proceed to next line when expression is 0', async () => {
      const result = await interpreter.execute(`
10 LET N = 0
20 ON N GOSUB 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
300 PRINT "Third"
310 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should proceed to next line when expression exceeds number of lines', async () => {
      const result = await interpreter.execute(`
10 LET N = 4
20 ON N GOSUB 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
300 PRINT "Third"
310 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should handle negative expression value', async () => {
      const result = await interpreter.execute(`
10 LET N = -1
20 ON N GOSUB 100, 200, 300
30 PRINT "Next"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
300 PRINT "Third"
310 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Next\nOK\n')
    })

    it('should return a clear runtime error for NaN selector value', async () => {
      // parseFloat("NaN") returns NaN, and Number.isFinite(NaN) is false
      const result = await interpreter.execute(`
10 LET N$ = "NaN"
20 ON N$ GOSUB 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual(
        'ON: expression must evaluate to a number'
      )
      expect(deviceAdapter.getAllOutputs()).toEqual(
        'RUNTIME: ON: expression must evaluate to a number'
      )
    })

    it('should return a clear runtime error for Infinity selector value', async () => {
      const result = await interpreter.execute(`
10 LET N$ = "Infinity"
20 ON N$ GOSUB 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual(
        'ON: expression must evaluate to a number'
      )
      expect(deviceAdapter.getAllOutputs()).toEqual(
        'RUNTIME: ON: expression must evaluate to a number'
      )
    })

    it('should return to the statement after each ON GOSUB across repeated invocations', async () => {
      const result = await interpreter.execute(`
10 LET N = 1
20 ON N GOSUB 100, 200
30 LET N = 2
40 ON N GOSUB 100, 200
50 PRINT "After"
60 END
100 PRINT "First"
110 RETURN
200 PRINT "Second"
210 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('First\nSecond\nAfter\nOK\n')
    })

    it('should handle ON-GOSUB matching manual example structure', async () => {
      // From manual page 66: N=2 calls line 200 which sets X$="HOPE"
      const result = await interpreter.execute(`
10 REM * ON-GOSUB *
20 LET N = 2
30 ON N GOSUB 100,200,300,400,500,600
40 IF N<1 OR N>6 THEN 20
50 PRINT N; " IS THE SYMBOL OF ";X$;"."
60 END
100 X$="ETERNITY": RETURN
200 X$="HOPE": RETURN
300 X$="WOMAN": RETURN
400 X$="MAN": RETURN
500 X$="PERFECTION": RETURN
600 X$="WEDDING": RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 2 IS THE SYMBOL OF HOPE.\nOK\n')
    })
  })

  describe('ON ... RETURN', () => {
    it('should return to first line when expression is 1', async () => {
      const result = await interpreter.execute(`
10 GOSUB 100
20 PRINT "After"
30 END
100 LET X = 1
110 ON X RETURN 200, 300, 400
120 PRINT "Never"
200 PRINT "First"
210 RETURN
300 PRINT "Second"
310 RETURN
400 PRINT "Third"
410 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('First\nAfter\nOK\n')
    })

    it('should return to second line when expression is 2', async () => {
      const result = await interpreter.execute(`
10 GOSUB 100
20 PRINT "After"
30 END
100 LET X = 2
110 ON X RETURN 200, 300, 400
120 PRINT "Never"
200 PRINT "First"
210 RETURN
300 PRINT "Second"
310 RETURN
400 PRINT "Third"
410 RETURN
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Second\nAfter\nOK\n')
    })
  })

  describe('ON ... RESTORE', () => {
    it('should restore data pointer to first line when expression is 1', async () => {
      // Should read from line 10: 10, 20, 30
      const result = await interpreter.execute(`
10 DATA 10, 20, 30
20 DATA 40, 50, 60
30 DATA 70, 80, 90
40 LET X = 1
50 ON X RESTORE 10, 20, 30
60 READ A, B, C
70 PRINT A, B, C
80 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 10\t 20\t 30\nOK\n')
    })

    it('should restore data pointer to second line when expression is 2', async () => {
      // Should read from line 20: 40, 50, 60
      const result = await interpreter.execute(`
10 DATA 10, 20, 30
20 DATA 40, 50, 60
30 DATA 70, 80, 90
40 LET X = 2
50 ON X RESTORE 10, 20, 30
60 READ A, B, C
70 PRINT A, B, C
80 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 40\t 50\t 60\nOK\n')
    })

    it('should proceed to next line when expression is 0 or out of range', async () => {
      // Should read from default position (beginning): 10
      const result = await interpreter.execute(`
10 DATA 10, 20
20 DATA 30, 40
30 LET X = 0
40 ON X RESTORE 10, 20
50 READ A
60 PRINT A
70 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 10\nOK\n')
    })
  })

  describe('Error Handling', () => {
    it('should return a clear runtime error for non-numeric string expression', async () => {
      const result = await interpreter.execute(`
10 LET X$ = "ABC"
20 ON X$ GOTO 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual(
        'ON: expression must evaluate to a number'
      )
      expect(deviceAdapter.getAllOutputs()).toEqual(
        'RUNTIME: ON: expression must evaluate to a number'
      )
    })

    it('should return a clear runtime error for Infinity expression values', async () => {
      const result = await interpreter.execute(`
10 LET X$ = "Infinity"
20 ON X$ GOTO 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual(
        'ON: expression must evaluate to a number'
      )
      expect(deviceAdapter.getAllOutputs()).toEqual(
        'RUNTIME: ON: expression must evaluate to a number'
      )
    })

    it('should error on ON to non-existent line number', async () => {
      const result = await interpreter.execute(`
10 LET X = 1
20 ON X GOTO 999
30 PRINT "This should not print"
40 END
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual('ON: line number 999 not found')
      expect(deviceAdapter.getAllOutputs()).toEqual('RUNTIME: ON: line number 999 not found')
    })

    it('should handle ON with multiple line numbers where one is invalid', async () => {
      const result = await interpreter.execute(`
10 LET X = 2
20 ON X GOTO 100, 999, 300
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
300 PRINT "Third"
310 END
`)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.map(e => e.message).join(' ')).toEqual('ON: line number 999 not found')
      expect(deviceAdapter.getAllOutputs()).toEqual('RUNTIME: ON: line number 999 not found')
    })
  })

  describe('Comparison with IF-THEN', () => {
    it('should work like multiple IF-THEN statements', async () => {
      // Manual page 66: ON X GOTO is equivalent to multiple IF X=N THEN statements
      const result = await interpreter.execute(`
10 LET X = 3
20 ON X GOTO 100, 200, 300, 400, 500
30 PRINT "Skipped"
40 END
100 PRINT "One"
110 END
200 PRINT "Two"
210 END
300 PRINT "Three"
310 END
400 PRINT "Four"
410 END
500 PRINT "Five"
510 END
`)
      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.getAllOutputs()).toEqual('Three\nOK\n')
    })
  })
})
