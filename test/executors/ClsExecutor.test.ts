/**
 * CLS Executor Tests
 *
 * Unit tests for the ClsExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('ClsExecutor', () => {
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

  it('should clear screen when CLS is executed', async () => {
    const source = `
10 PRINT "Hello"
20 CLS
30 PRINT "World"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
  })

  it('should clear screen multiple times', async () => {
    const source = `
10 PRINT "First"
20 CLS
30 PRINT "Second"
40 CLS
50 PRINT "Third"
60 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(2)
  })

  it('should handle CLS on same line as other commands', async () => {
    const source = `
10 PRINT "Before": CLS: PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
    const outputs = deviceAdapter.getAllOutputs()
    // CLS clears the screen, so "Before" should be cleared
    // Only "After" should remain
    expect(outputs).toEqual('After\nOK\n')
  })

  it('should handle CLS at start of program', async () => {
    const source = `
10 CLS
20 PRINT "Hello"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Hello\nOK\n')
  })

  it('should handle CLS at end of program', async () => {
    const source = `
10 PRINT "Hello"
20 PRINT "World"
30 CLS
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
  })

  it('should handle CLS in a loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 PRINT I
30 CLS
40 NEXT
50 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(3)
  })

  it('should handle CLS with conditional execution', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 THEN CLS
30 PRINT "Done"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.clearScreenCalls).toBe(1)
    const outputs = deviceAdapter.getAllOutputs()
    expect(outputs).toEqual('Done\nOK\n')
  })

  describe('sprite hiding', () => {
    it('should hide all sprites when CLS is executed', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 SPRITE 0,100,50
30 CLS
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.clearScreenCalls).toBe(1)

      // Sprite 0 should be hidden after CLS
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.visible).toBe(false)
    })

    it('should preserve sprite definitions after CLS', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 SPRITE 0,100,50
30 CLS
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)

      // Sprite definition should still be present after CLS
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.definition).not.toBeNull()
    })

    it('should preserve sprite positions after CLS', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 SPRITE 0,100,50
30 CLS
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)

      // Sprite position should still be present after CLS
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.x).toBe(100)
      expect(spriteStates[0]?.y).toBe(50)
    })

    it('should hide multiple visible sprites', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 DEF SPRITE 3,(0,0,0,0,0)=CHR$(241)
30 DEF SPRITE 7,(0,0,0,0,0)=CHR$(242)
40 SPRITE 0,10,20
50 SPRITE 3,50,60
60 SPRITE 7,100,110
70 CLS
80 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)

      // All sprites should be hidden after CLS
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.visible).toBe(false)
      expect(spriteStates[3]?.visible).toBe(false)
      expect(spriteStates[7]?.visible).toBe(false)
    })

    it('should hide sprites in a loop', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 FOR I = 1 TO 3
30 SPRITE 0,I*10,I*10
40 CLS
50 NEXT
60 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.clearScreenCalls).toBe(3)

      // Sprite should be hidden after final CLS
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.visible).toBe(false)
    })

    it('should handle CLS when no sprites are defined', async () => {
      const source = `
10 CLS
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(deviceAdapter.clearScreenCalls).toBe(1)

      // All sprite states should remain hidden (default)
      const spriteStates = interpreter.getSpriteStates()
      for (const state of spriteStates) {
        expect(state.visible).toBe(false)
      }
    })

    it('should allow re-displaying sprites after CLS', async () => {
      const source = `
10 DEF SPRITE 0,(0,0,0,0,0)=CHR$(240)
20 SPRITE 0,100,50
30 CLS
40 SPRITE 0,200,75
50 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)

      // Sprite should be visible again after re-display
      const spriteStates = interpreter.getSpriteStates()
      expect(spriteStates[0]?.visible).toBe(true)
      expect(spriteStates[0]?.x).toBe(200)
      expect(spriteStates[0]?.y).toBe(75)
    })
  })
})
