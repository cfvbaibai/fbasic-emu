/**
 * TestProgram Unified Helper Tests
 *
 * Tests for the TestProgram class that provides a unified API for
 * running F-BASIC programs in integration tests.
 */

import { describe, expect, it } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'

import { TestProgram } from './TestProgram'

describe('TestProgram', () => {
  describe('fromSample', () => {
    it('throws for unknown sample key', () => {
      expect(() => TestProgram.fromSample('nonexistent')).toThrow(
        'Sample code "nonexistent" not found'
      )
    })

    it('creates instance for known sample key', () => {
      const tp = TestProgram.fromSample('hello')
      expect(tp).toBeInstanceOf(TestProgram)
    })
  })

  describe('fromCode', () => {
    it('creates instance from raw code', () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      expect(tp).toBeInstanceOf(TestProgram)
    })
  })

  describe('run + expectSuccess', () => {
    it('executes simple PRINT program successfully', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HELLO"')
      const result = await tp.run()
      tp.expectSuccess()
      expect(result.executionResult.success).toBe(true)
    })

    it('captures non-null snapshot after execution', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      const result = await tp.run()
      expect(result.snapshot).not.toBeNull()
      expect(result.snapshot!.version).toBe(1)
    })

    it('detects syntax errors', async () => {
      const tp = TestProgram.fromCode('INVALID SYNTAX HERE')
      const result = await tp.run()
      expect(result.executionResult.success).toBe(false)
      expect(result.executionResult.errors.length).toBeGreaterThan(0)
    })

    it('detects runtime errors', async () => {
      const tp = TestProgram.fromCode('10 PRINT 1/0')
      const result = await tp.run()
      expect(result.executionResult.success).toBe(false)
    })
  })

  describe('sample execution', () => {
    it('runs hello sample successfully', async () => {
      const tp = TestProgram.fromSample('hello')
      const result = await tp.run()
      tp.expectSuccess()
      expect(result.snapshot).not.toBeNull()
    })

    it('runs basic sample successfully', async () => {
      const tp = TestProgram.fromSample('basic')
      const result = await tp.run()
      tp.expectSuccess()
      expect(result.snapshot).not.toBeNull()
    })
  })

  describe('expectRowText', () => {
    it('asserts exact row text content', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HELLO WORLD"')
      await tp.run()
      tp.expectRowText(0, 'HELLO WORLD')
    })

    it('supports partial match via string', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HELLO WORLD"')
      await tp.run()
      tp.expectRowText(0, 'HELLO')
    })

    it('supports regex match', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HELLO WORLD"')
      await tp.run()
      tp.expectRowText(0, /HELLO/)
    })

    it('throws if no snapshot available', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      expect(() => tp.expectRowText(0, 'HI')).toThrow(
        'No snapshot available. Call run() first.'
      )
    })
  })

  describe('expectFixture', () => {
    it('matches hello-complete fixture', async () => {
      const tp = TestProgram.fromSample('hello')
      await tp.run()
      tp.expectFixture('hello-complete')
    })

    it('throws if no snapshot available', () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      expect(() => tp.expectFixture('some-fixture')).toThrow(
        'No snapshot available. Call run() first.'
      )
    })
  })

  describe('input seeding', () => {
    it('seeds INPUT response', async () => {
      const tp = TestProgram.fromCode(
        '10 INPUT "NAME";N$\n20 PRINT N$'
      )
      tp.seedInput(['TEST'])
      await tp.run()
      tp.expectSuccess()
      expect(tp.getAdapter().printOutputs.some(o => o.includes('TEST'))).toBe(true)
    })

    it('seeds STRIG state', async () => {
      const code = getJoystickTestCode()
      const tp = TestProgram.fromCode(code)
      // Push STRIG=1 so the sample exits deterministically
      tp.pushStrigState(0, 1)
      await tp.run()
      tp.expectSuccess()
    })

    it('seeds STICK direction', async () => {
      const tp = TestProgram.fromCode(
        '10 S=STICK(0)\n20 PRINT S\n30 END'
      )
      tp.setStickState(0, 1)
      await tp.run()
      tp.expectSuccess()
      expect(tp.getAdapter().printOutputs.some(o => o.includes('1'))).toBe(true)
    })

    it('queues INKEY blocking response', async () => {
      const tp = TestProgram.fromCode(
        '10 K$=INKEY$(1)\n20 PRINT K$\n30 END'
      )
      tp.queueInkey('A')
      await tp.run()
      tp.expectSuccess()
      expect(tp.getAdapter().printOutputs.some(o => o.includes('A'))).toBe(true)
    })
  })

  describe('accessors', () => {
    it('provides adapter via getAdapter', () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      const adapter = tp.getAdapter()
      expect(adapter).toBeDefined()
      expect(typeof adapter.pushStrigState).toBe('function')
    })

    it('provides accessor via getAccessor', () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      const accessor = tp.getAccessor()
      expect(accessor).toBeDefined()
      expect(typeof accessor.readSequence).toBe('function')
    })

    it('returns null lastResult before run', () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      expect(tp.lastResult).toBeNull()
    })

    it('returns populated lastResult after run', async () => {
      const tp = TestProgram.fromCode('10 PRINT "HI"')
      await tp.run()
      expect(tp.lastResult).not.toBeNull()
      expect(tp.lastResult!.executionResult.success).toBe(true)
    })
  })

  describe('getSpriteState bounds validation', () => {
    it('throws RangeError for negative spriteNumber', async () => {
      const tp = TestProgram.fromCode('10 END')
      await tp.run()
      expect(() => tp.getSpriteState(-1)).toThrow(RangeError)
      expect(() => tp.getSpriteState(-1)).toThrow(
        `spriteNumber must be 0-${SCREEN_DIMENSIONS.SPRITE_COUNT - 1}, got -1`
      )
    })

    it('throws RangeError for spriteNumber >= SPRITE_COUNT', async () => {
      const tp = TestProgram.fromCode('10 END')
      await tp.run()
      expect(() => tp.getSpriteState(8)).toThrow(RangeError)
      expect(() => tp.getSpriteState(8)).toThrow(
        `spriteNumber must be 0-${SCREEN_DIMENSIONS.SPRITE_COUNT - 1}, got 8`
      )
    })

    it('accepts spriteNumber at lower bound 0', async () => {
      const tp = TestProgram.fromCode('10 END')
      await tp.run()
      // Should not throw; returns null because no sprite was defined
      expect(tp.getSpriteState(0)).toEqual({ x: 0, y: 0, visible: false })
    })

    it('accepts spriteNumber at upper bound 7', async () => {
      const tp = TestProgram.fromCode('10 END')
      await tp.run()
      expect(tp.getSpriteState(7)).toEqual({ x: 0, y: 0, visible: false })
    })

    it('throws before run() is called', () => {
      const tp = TestProgram.fromCode('10 END')
      expect(() => tp.getSpriteState(0)).toThrow(
        'No interpreter available. Call run() first.'
      )
    })
  })

  describe('options', () => {
    it('respects maxIterations option', async () => {
      const tp = TestProgram.fromCode(
        '10 FOR I=1 TO 999999\n20 NEXT\n30 END'
      )
      const result = await tp.run()
      // With default test limits, this should stop due to max iterations
      // (not infinite loop)
      expect(result.executionResult.success).toBe(false)
    })

    it('respects suppressOkPrompt option', async () => {
      const tp = TestProgram.fromCode('10 END', {
        suppressOkPrompt: true,
      })
      await tp.run()
      tp.expectSuccess()
      // With suppressOkPrompt=true, no "OK" should appear in output
      const hasOk = tp.getAdapter().printOutputs.some(
        o => o.includes('OK')
      )
      expect(hasOk).toBe(false)
    })
  })
})

/**
 * Returns the joystick sample code for STRIG testing.
 * The sample loops reading STRIG(0) and exits when it returns non-zero.
 */
function getJoystickTestCode(): string {
  return `10 CLS
20 PRINT "JOYSTICK TEST"
30 S=STRIG(0)
40 IF S<>0 THEN END
50 GOTO 30
60 END`
}
