import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('sprite-control program', () => {
  // 8 directions x (PAUSE 150 + PAUSE 120) = ~36s of pauses, very long program.
  // Screen scrolls — 8 directions x 2 rows each = 16 printed lines fills the
  // entire 16-row screen, so only the last few direction outputs remain visible.
  it('runs successfully and tests all 8 directions', async () => {
    const tp = TestProgram.fromSample('spriteControl')

    await tp.run({ stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 10000 } })

    tp.expectSuccess()
    // Early directions scroll off — verify the screen contains direction data
    // by checking the last visible rows show X/Y position output from direction 8
    tp.expectRowText(14, 'DIRECTION 8: UP-LEFT')
    tp.expectRowText(15, 'X=')
  }, 60_000)
})
