/**
 * Statement Router Tests
 *
 * Integration tests for the StatementRouter verifying that statements are
 * correctly dispatched to their appropriate executors. Each test constructs
 * F-BASIC source code, executes it via BasicInterpreter (which uses the
 * StatementRouter internally), and verifies the executor behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('StatementRouter', () => {
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

  describe('Statement dispatch to PRINT executor', () => {
    it('should route PRINT statement to PrintExecutor', async () => {
      const source = `
10 PRINT "Hello"
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Hello\nOK\n')
    })
  })

  describe('Statement dispatch to LET executor', () => {
    it('should route LET statement to LetExecutor', async () => {
      const source = `
10 LET X = 42
20 PRINT X
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 42\nOK\n')
    })
  })

  describe('Statement dispatch to GOTO executor', () => {
    it('should route GOTO statement to GotoExecutor', async () => {
      const source = `
10 GOTO 30
20 PRINT "Skipped"
30 PRINT "Reached"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Reached\nOK\n')
    })
  })

  describe('Statement dispatch to GOSUB/RETURN executor', () => {
    it('should route GOSUB to GosubExecutor and RETURN to ReturnExecutor', async () => {
      const source = `
10 GOSUB 100
20 PRINT "Back"
30 END
100 PRINT "Sub"
110 RETURN
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Sub\nBack\nOK\n')
    })
  })

  describe('Statement dispatch to FOR/NEXT executor', () => {
    it('should route FOR and NEXT to their executors', async () => {
      const source = `
10 FOR I = 1 TO 3
20 PRINT I;
30 NEXT
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      // PRINT with semicolon keeps output on same line; OK follows on next line
      expect(deviceAdapter.getAllOutputs()).toEqual(' 1 2 3OK\n')
    })
  })

  describe('Statement dispatch to IF-THEN executor', () => {
    it('should route IF-THEN to IfThenExecutor and execute true branch', async () => {
      const source = `
10 LET X = 5
20 IF X = 5 THEN PRINT "Yes"
30 PRINT "End"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Yes\nEnd\nOK\n')
    })

    it('should route IF-THEN and skip false branch', async () => {
      const source = `
10 LET X = 3
20 IF X = 5 THEN PRINT "Yes"
30 PRINT "End"
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('End\nOK\n')
    })

    it('should route IF-THEN with line number jump', async () => {
      const source = `
10 LET X = 1
20 IF X = 1 THEN 50
30 PRINT "No"
40 END
50 PRINT "Jumped"
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Jumped\nOK\n')
    })
  })

  describe('Statement dispatch to BEEP executor', () => {
    it('should route BEEP to BeepExecutor', async () => {
      const source = `
10 BEEP
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.beepCalls).toEqual(1)
    })
  })

  describe('Statement dispatch to END executor', () => {
    it('should route END to EndExecutor and stop execution', async () => {
      const source = `
10 PRINT "Before"
20 END
30 PRINT "Never"
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('Before\nOK\n')
    })
  })

  describe('Statement dispatch to CLS executor', () => {
    it('should route CLS to ClsExecutor', async () => {
      const source = `
10 CLS
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.clearScreenCalls).toEqual(1)
    })
  })

  describe('Statement dispatch to CLEAR executor', () => {
    it('should route CLEAR to ClearExecutor', async () => {
      const source = `
10 LET X = 99
20 CLEAR
30 PRINT X
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 0\nOK\n')
    })
  })

  describe('Statement dispatch to DIM executor', () => {
    it('should route DIM to DimExecutor', async () => {
      const source = `
10 DIM A(5)
20 LET A(3) = 77
30 PRINT A(3)
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 77\nOK\n')
    })
  })

  describe('Statement dispatch to SWAP executor', () => {
    it('should route SWAP to SwapExecutor', async () => {
      const source = `
10 LET A = 1
20 LET B = 2
30 SWAP A, B
40 PRINT A; B
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 2 1\nOK\n')
    })
  })

  describe('Statement dispatch to DATA executor (no-op during execution)', () => {
    it('should handle DATA as no-op during execution', async () => {
      const source = `
10 DATA 1, 2, 3
20 PRINT "After data"
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual('After data\nOK\n')
    })
  })

  describe('Statement dispatch to LOCATE executor', () => {
    it('should route LOCATE to LocateExecutor', async () => {
      const source = `
10 LOCATE 5, 10
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Multiple statement dispatches on same line', () => {
    it('should dispatch colon-separated statements to their respective executors', async () => {
      const source = `
10 LET A = 10: LET B = 20: PRINT A + B
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.getAllOutputs()).toEqual(' 30\nOK\n')
    })
  })
})
