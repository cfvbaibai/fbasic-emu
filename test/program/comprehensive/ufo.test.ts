import { describe, expect, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('ufo program', () => {
  // Space shooter using STICK(0) for gun movement and STRIG(0) for firing.
  // Main loop at line 260 reads STICK(0) — returns 0 without input, gun doesn't move.
  // Line 320: IF STRIG(0)<>0 THEN 340 — returns 0, so loops back to 260.
  // Won't terminate without joystick input.
  // Program uses SPRITE positioning only (no LOCATE/PRINT in game area),
  // so screen buffer has no visible text. Verify it runs without parse errors.
  it('initializes without parse errors', async () => {
    const tp = TestProgram.fromSample('ufo')

    const result = await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS },
    })

    // Verify no parse errors — the program starts executing correctly
    const parseErrors = result.executionResult.errors.filter(
      e => e.type === 'SYNTAX'
    )
    expect(parseErrors).toEqual([])
  }, 30_000)
})
