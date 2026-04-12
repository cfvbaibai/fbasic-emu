/**
 * IF-THEN Colon Scope Program-Level Integration Tests
 *
 * Headless program tests that run complete multi-line F-BASIC programs
 * through the full runtime pipeline (parser -> executor -> screen state),
 * verifying THEN-less IF + colon scoping behavior at the program level.
 *
 * These complement the executor-level unit tests in
 * test/executors/IfThenColonScope.test.ts by exercising the full pipeline
 * with realistic multi-line programs rather than isolated statements.
 *
 * Parent issue: #549
 * This issue: #557
 */

import { describe, expect, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('THEN-less IF colon scoping program integration', () => {
  // ==========================================================================
  // 1. THEN-less IF with PRINT
  // ==========================================================================

  describe('THEN-less IF with PRINT', () => {
    it('prints output when condition is true', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET X = 1',
          '20 IF X = 1 PRINT "YES"',
          '30 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'YES')
    })

    it('prints nothing when condition is false and execution continues on next line', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET X = 0',
          '20 IF X = 1 PRINT "YES"',
          '30 PRINT "NO"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      // "YES" should not appear; only "NO" from line 30
      tp.expectRowText(0, 'NO')
    })
  })

  // ==========================================================================
  // 2. THEN-less IF with BEEP + colon chain
  // ==========================================================================

  describe('THEN-less IF with BEEP and colon chain', () => {
    it('executes BEEP and PRINT when condition is true', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET A = 0',
          '20 IF A = 0 BEEP: PRINT "DONE"',
          '30 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'DONE')
      expect(tp.getAdapter().beepCalls).toEqual(1)
    })

    it('skips BEEP and PRINT when condition is false', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET A = 1',
          '20 IF A = 0 BEEP: PRINT "DONE"',
          '30 PRINT "SKIP"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'SKIP')
      expect(tp.getAdapter().beepCalls).toEqual(0)
    })
  })

  // ==========================================================================
  // 3. Nested IF with colon scoping
  // ==========================================================================

  describe('nested IF with colon scoping', () => {
    it('executes nested IF statements when outer condition is true', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET X = 1',
          '20 LET Y = 1',
          '30 IF X = 1 PRINT "X1": IF Y = 1 PRINT "XY"',
          '40 PRINT "END"',
          '50 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'X1')
      tp.expectRowText(1, 'XY')
      tp.expectRowText(2, 'END')
    })

    it('skips entire colon chain including nested IF when outer condition is false', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET X = 0',
          '20 LET Y = 1',
          '30 IF X = 1 PRINT "X1": IF Y = 1 PRINT "XY"',
          '40 PRINT "END"',
          '50 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      // Outer IF is false -> everything on line 30 is skipped
      tp.expectRowText(0, 'END')
    })

    it('executes outer branch but skips inner IF when inner condition is false', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET X = 1',
          '20 LET Y = 0',
          '30 IF X = 1 PRINT "X1": IF Y = 1 PRINT "XY"',
          '40 PRINT "END"',
          '50 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      // X=1 true -> prints "X1", Y=0 false -> "XY" skipped
      tp.expectRowText(0, 'X1')
      tp.expectRowText(1, 'END')
    })
  })

  // ==========================================================================
  // 4. Multi-statement colon chains within IF branches
  // ==========================================================================

  describe('multi-statement colon chains within IF branches', () => {
    it('executes all colon-separated statements in the true branch', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET N = 5',
          '20 IF N = 5 PRINT "A": PRINT "B": PRINT "C"',
          '30 PRINT "NEXT"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'A')
      tp.expectRowText(1, 'B')
      tp.expectRowText(2, 'C')
      tp.expectRowText(3, 'NEXT')
    })

    it('skips all colon-separated statements when condition is false', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET N = 3',
          '20 IF N = 5 PRINT "A": PRINT "B": PRINT "C"',
          '30 PRINT "NEXT"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      // N=3 != 5 -> entire colon chain on line 20 is skipped
      tp.expectRowText(0, 'NEXT')
    })

    it('handles mixed BEEP and PRINT in multi-statement colon chain', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET N = 1',
          '20 IF N = 1 BEEP: PRINT "ONE": BEEP: PRINT "TWO"',
          '30 PRINT "AFTER"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'ONE')
      tp.expectRowText(1, 'TWO')
      tp.expectRowText(2, 'AFTER')
      expect(tp.getAdapter().beepCalls).toEqual(2)
    })

    it('skips mixed BEEP and PRINT chain when condition is false', async () => {
      const tp = TestProgram.fromCode(
        [
          '10 LET N = 0',
          '20 IF N = 1 BEEP: PRINT "ONE": BEEP: PRINT "TWO"',
          '30 PRINT "AFTER"',
          '40 END',
        ].join('\n'),
      )

      await tp.run()

      tp.expectSuccess()
      tp.expectRowText(0, 'AFTER')
      expect(tp.getAdapter().beepCalls).toEqual(0)
    })
  })
})
