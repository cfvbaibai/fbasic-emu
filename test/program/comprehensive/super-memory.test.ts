import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('super-memory program', () => {
  // Simon-like memory game: shows a growing sequence of colors, player repeats via INKEY$.
  // Complex interaction with RND, PAUSE, and multiple INKEY$ waits.
  // The game plays one round showing a pattern, then waits for player input at "YOU" prompt.
  // With default iterations, hits max iterations in the INKEY$ input loop.
  it('initializes and draws the memory game board', async () => {
    const tp = TestProgram.fromSample('superMemory')

    await tp.run({
      stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 },
    })

    // Verify the game board was drawn — "YOU" prompt appears at line 230
    tp.expectRowText(10, 'YOU')
  }, 60_000)
})
