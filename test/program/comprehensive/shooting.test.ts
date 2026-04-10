import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('shooting program', () => {
  // Gallery shooter with 8 moving sprites (DEF MOVE), STICK(0) for aiming,
  // and STRIG(0) for shooting. Levels 5→1 with score targets per level.
  // Line 110 reads STICK(0) — returns 0 without input, aim doesn't move.
  // Won't terminate without player input — aim stays at initial position.
  // Verify the program starts and displays the score/level HUD.
  it('initializes and shows the score display', async () => {
    const tp = TestProgram.fromSample('shooting')

    await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS },
    })

    // Verify screen shows score from line 30
    tp.expectRowText(0, 'SCORE:')
  }, 60_000)
})
