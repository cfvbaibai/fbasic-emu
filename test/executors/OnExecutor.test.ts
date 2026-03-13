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
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('First\nOK\n')
    })

    it('should jump to second line when expression is 2', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Second\nOK\n')
    })

    it('should jump to third line when expression is 3', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Third\nOK\n')
    })

    it('should proceed to next line when expression is 0', async () => {
      // Manual: "When the value of the equation is 0 or when it exceeds the
      // specified number of lines, it moves to the next sentence after the
      // ON sentence."
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Next\nOK\n')
    })

    it('should proceed to next line when expression exceeds number of lines', async () => {
      // Manual: "When the value of the equation is 0 or when it exceeds the
      // specified number of lines, it moves to the next sentence after the
      // ON sentence."
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Next\nOK\n')
    })

    it('should handle ON with expression', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Second\nOK\n')
    })

    it('should handle negative expression value', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('Next\nOK\n')
    })

    it('should handle fractional expression value (truncated to integer)', async () => {
      // Use expression that results in fractional value: 5 / 2 = 2.5, truncated to 2
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // 5 / 2 = 2.5 truncated to 2, so should jump to second line
      expect(outputs).toEqual('Second\nOK\n')
    })
  })

  describe('ON ... GOSUB', () => {
    it('should jump to first line when expression is 1', async () => {
      // TODO: Enable when GOSUB/RETURN is fully implemented
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT "After" doesn't end with semicolon, so adds newline
      expect(outputs).toEqual('First\nAfter\nOK\n')
    })

    it('should handle ON-GOSUB matching manual example structure', async () => {
      // From manual page 66 example structure
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Manual example: N=2, so ON N GOSUB calls line 200 which sets X$="HOPE"
      // Then prints: " 2 IS THE SYMBOL OF HOPE."
      // PRINT doesn't end with semicolon, so adds newline
      expect(outputs).toEqual(' 2 IS THE SYMBOL OF HOPE.\nOK\n')
    })
  })

  describe('ON ... RETURN', () => {
    it('should return to first line when expression is 1', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT "After" doesn't end with semicolon, so adds newline
      expect(outputs).toEqual('First\nAfter\nOK\n')
    })

    it('should return to second line when expression is 2', async () => {
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT "After" doesn't end with semicolon, so adds newline
      expect(outputs).toEqual('Second\nAfter\nOK\n')
    })
  })

  describe('ON ... RESTORE', () => {
    it('should restore data pointer to first line when expression is 1', async () => {
      const source = `
10 DATA 10, 20, 30
20 DATA 40, 50, 60
30 DATA 70, 80, 90
40 LET X = 1
50 ON X RESTORE 10, 20, 30
60 READ A, B, C
70 PRINT A, B, C
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should read from line 10: 10, 20, 30
      // Numbers get leading space, comma separator uses tab stops
      // PRINT doesn't end with semicolon, so adds newline
      expect(outputs).toEqual(' 10\t 20\t 30\nOK\n')
    })

    it('should restore data pointer to second line when expression is 2', async () => {
      const source = `
10 DATA 10, 20, 30
20 DATA 40, 50, 60
30 DATA 70, 80, 90
40 LET X = 2
50 ON X RESTORE 10, 20, 30
60 READ A, B, C
70 PRINT A, B, C
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // Should read from line 20: 40, 50, 60
      // Numbers get leading space, comma separator uses tab stops
      expect(outputs).toEqual(' 40\t 50\t 60\nOK\n')
    })

    it('should proceed to next line when expression is 0 or out of range', async () => {
      const source = `
10 DATA 10, 20
20 DATA 30, 40
30 LET X = 0
40 ON X RESTORE 10, 20
50 READ A
60 PRINT A
70 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // Should read from default position (beginning): 10
      const outputs = deviceAdapter.getAllOutputs()
      // Numbers get leading space
      expect(outputs).toEqual(' 10\nOK\n')
    })
  })

  describe('Error Handling', () => {
    it('should return a clear runtime error for non-numeric string expression', async () => {
      const source = `
10 LET X$ = "ABC"
20 ON X$ GOTO 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      const errorMessages = result.errors.map(e => e.message).join(' ')
      expect(errorMessages).toEqual('ON: expression must evaluate to a number')

      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('RUNTIME: ON: expression must evaluate to a number')
    })

    it('should return a clear runtime error for Infinity expression values', async () => {
      const source = `
10 LET X$ = "Infinity"
20 ON X$ GOTO 100, 200
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
200 PRINT "Second"
210 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      const errorMessages = result.errors.map(e => e.message).join(' ')
      expect(errorMessages).toEqual('ON: expression must evaluate to a number')

      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('RUNTIME: ON: expression must evaluate to a number')
    })

    it('should error on ON to non-existent line number', async () => {
      const source = `
10 LET X = 1
20 ON X GOTO 999
30 PRINT "This should not print"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      const errorMessages = result.errors.map(e => e.message).join(' ')
      expect(errorMessages).toEqual('ON: line number 999 not found')

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('RUNTIME: ON: line number 999 not found')
    })

    it('should handle ON with multiple line numbers where one is invalid', async () => {
      const source = `
10 LET X = 2
20 ON X GOTO 100, 999, 300
30 PRINT "This should not print"
40 END
100 PRINT "First"
110 END
300 PRINT "Third"
310 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      const errorMessages = result.errors.map(e => e.message).join(' ')
      expect(errorMessages).toEqual('ON: line number 999 not found')

      // Verify that PRINT statements after the error are not executed
      const outputs = deviceAdapter.getAllOutputs()
      expect(outputs).toEqual('RUNTIME: ON: line number 999 not found')
    })
  })

  describe('Comparison with IF-THEN', () => {
    it('should work like multiple IF-THEN statements', async () => {
      // Manual page 66 shows ON X GOTO 1000,2000,3000,4000,5000
      // is equivalent to:
      // IF X=1 THEN 1000
      // IF X=2 THEN 2000
      // IF X=3 THEN 3000
      // IF X=4 THEN 4000
      // IF X=5 THEN 5000
      const source = `
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
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      const outputs = deviceAdapter.getAllOutputs()
      // PRINT "Three" doesn't end with semicolon, so adds newline
      expect(outputs).toEqual('Three\nOK\n')
    })
  })
})
