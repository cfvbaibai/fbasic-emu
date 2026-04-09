import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('route66 program', () => {
  // Driving game with STICK/STRIG controls and sprite-based cars.
  // Main loop at line 200 reads STICK(0) for steering, STRIG for speed.
  // Won't terminate without player input — cars don't move with V=0.
  // Verify the program starts and draws the HUD (score, level, cars remaining).
  it('initializes and draws the driving HUD', async () => {
    const tp = TestProgram.fromSample('route66', { maxIterations: 50000 })

    await tp.run({
      stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 },
    })

    // Verify screen shows HUD elements from GOSUB 500 display routine
    tp.expectRowText(0, 'HIGH SCORE')
    tp.expectRowText(1, 'LEVEL')
    tp.expectRowText(2, 'SCORE')
    tp.expectRowText(3, 'CARS')
  }, 20_000)
})
