import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('pause program', () => {
  // PAUSE uses real setTimeout — total ~11s of delays, needs extended timeout
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('pause')

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS } })

    tp.expectSuccess()
    // CLS at line 30 clears screen
    // Countdown section: 5-1 with PAUSE 80 each
    tp.expectRowText(0, '=== COUNTDOWN ===')
    tp.expectRowText(1, 'COUNTDOWN:  5')
    tp.expectRowText(2, 'COUNTDOWN:  4')
    tp.expectRowText(3, 'COUNTDOWN:  3')
    tp.expectRowText(4, 'COUNTDOWN:  2')
    tp.expectRowText(5, 'COUNTDOWN:  1')
    tp.expectRowText(6, 'BLAST OFF!')
    // Row 7 is blank (PRINT "")
    // Short pause section: dots with PAUSE 30
    tp.expectRowText(8, '=== SHORT PAUSE ===')
    tp.expectRowText(9, 'QUICK DOTS...')
    tp.expectRowText(10, '.....')
    // Long pause section: PAUSE 250 (~3s)
    tp.expectRowText(11, '=== LONG PAUSE ===')
    tp.expectRowText(12, 'WAITING 3 SECONDS...')
    tp.expectRowText(13, 'DONE!')
  }, 20_000)
})
