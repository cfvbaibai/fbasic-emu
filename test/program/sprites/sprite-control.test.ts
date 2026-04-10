import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('sprite-control program', () => {
  // 8 directions × (PAUSE 150 + PAUSE 120) = ~36s of pauses, very long program.
  // Screen is 24 rows tall (ROWS=24), so all 17 printed lines (8 directions × 2
  // lines each + final message) fit without scrolling.
  it('runs successfully and tests all 8 directions', async () => {
    const tp = TestProgram.fromSample('spriteControl')

    await tp.run({ stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 10000 } })

    tp.expectSuccess()

    // Verify all 8 direction labels on even rows (0, 2, 4, ..., 14)
    tp.expectRowText(0, 'DIRECTION 1: UP')
    tp.expectRowText(2, 'DIRECTION 2: UP-RIGHT')
    tp.expectRowText(4, 'DIRECTION 3: RIGHT')
    tp.expectRowText(6, 'DIRECTION 4: DOWN-RIGHT')
    tp.expectRowText(8, 'DIRECTION 5: DOWN')
    tp.expectRowText(10, 'DIRECTION 6: DOWN-LEFT')
    tp.expectRowText(12, 'DIRECTION 7: LEFT')
    tp.expectRowText(14, 'DIRECTION 8: UP-LEFT')

    // Verify coordinate output on odd rows (1, 3, 5, ..., 15)
    tp.expectRowText(1, 'X=')
    tp.expectRowText(3, 'X=')
    tp.expectRowText(5, 'X=')
    tp.expectRowText(7, 'X=')
    tp.expectRowText(9, 'X=')
    tp.expectRowText(11, 'X=')
    tp.expectRowText(13, 'X=')
    tp.expectRowText(15, 'X=')

    // Verify final completion message
    tp.expectRowText(16, 'ALL 8 DIRECTIONS DONE!')
  }, 60_000)
})
