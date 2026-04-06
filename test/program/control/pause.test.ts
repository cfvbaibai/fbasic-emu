import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('pause program', () => {
  // PAUSE uses real setTimeout — total ~11s of delays, needs extended timeout
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('pause')

    // PAUSE 0 blocks waiting for keypress — queue one to unblock
    tp.queueInkey('A')

    await tp.run({ stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 } })

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
    // Wait for keypress section: PAUSE 0 unblocked by queueInkey
    tp.expectRowText(11, '=== WAIT FOR KEYPRESS ===')
    tp.expectRowText(12, 'PAUSE 0 WAITS FOR A KEY...')
    tp.expectRowText(13, 'YOU PRESSED A KEY!')
    // Long pause section: PAUSE 250 (~3s)
    tp.expectRowText(14, '=== LONG PAUSE ===')
    tp.expectRowText(15, 'WAITING 3 SECONDS...')
    tp.expectRowText(16, 'DONE!')
  }, 20_000)
})
