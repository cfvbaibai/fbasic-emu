import { describe, expect, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('scr-sample program', () => {
  // Sprite-based shooting gallery using DEF MOVE, POSITION, MOVE for automated sprites
  // and STICK(0)/STRIG(0) for player aim and shooting.
  // Complex game with sprite pathfinding and SCR$ collision detection.
  // Won't terminate without STICK input — STICK(0) returns 0, no movement.
  // Program uses SPRITE positioning only (no LOCATE/PRINT in game area),
  // so screen buffer has no visible text. Verify it runs without parse errors.
  it('initializes without parse errors', async () => {
    const tp = TestProgram.fromSample('scrSample')

    const result = await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS },
    })

    // Verify no parse errors — the program starts executing correctly
    const parseErrors = result.executionResult.errors.filter(
      e => e.type === 'SYNTAX'
    )
    expect(parseErrors).toEqual([])
  }, 20_000)
})
