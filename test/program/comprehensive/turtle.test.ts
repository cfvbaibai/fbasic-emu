import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('turtle program', () => {
  // Turtle race with RND-based movement.
  // INPUT for player count (line 90) and replay prompt (line 450).
  // Runs FOR K=1 TO 100 loop with sprite movement, then declares winner.
  it('runs successfully with seeded input and shows race results', async () => {
    const tp = TestProgram.fromSample('turtle')
    tp.seedInput(['3'])
    tp.seedInput(['N'])

    await tp.run({
      stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 },
    })

    tp.expectSuccess()
    tp.expectRowText(0, 'TURTLE 1 2 3 4 5')
    tp.expectRowText(10, 'CHANGE')
    tp.expectRowText(12, 'WINNER:')
  }, 20_000)
})
