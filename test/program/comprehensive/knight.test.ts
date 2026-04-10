import { describe, expect, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('knight program', () => {
  // Two-player knight's tour game using STICK/STRIG for piece placement.
  // Interactive game loop starting at line 260 — GOSUB 440 reads STICK/STRIG.
  // Won't terminate without joystick input (line 460 loops while S+T=0).
  // The program uses sprites only — no LOCATE/PRINT output until a move is made.
  // Verify it runs without parse errors.
  it('initializes without parse errors', async () => {
    const tp = TestProgram.fromSample('knight', { maxIterations: 50000 })

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
