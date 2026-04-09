import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('card program', () => {
  // Two-player memory card matching game using STICK/STRIG for cursor and card flipping.
  // Interactive game loop at line 360-370 — won't terminate without joystick input.
  // Verify the program starts, sets up the card grid, and draws initial screen elements.
  it('initializes and draws the card grid', async () => {
    const tp = TestProgram.fromSample('card', { maxIterations: 50000 })

    await tp.run({
      stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 },
    })

    // "LEFT" and "RIGHT" labels at LOCATE 25,9 and LOCATE 25,12
    // Screen is 28 columns, so "LEFT" at column 25 shows as "LEF" (clipped)
    tp.expectRowText(9, 'LEF')
    tp.expectRowText(12, 'RIG')
  }, 20_000)
})
