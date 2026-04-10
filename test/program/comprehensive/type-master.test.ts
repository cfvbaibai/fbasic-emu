import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('type-master program', () => {
  // Typing game: PAUSE 100 (~1.2s) countdown, then INKEY$ loop for character matching.
  // After timeout with no match, shows score and asks "TRY AGAIN?" with INKEY$(0).
  // Queue 'N' to answer "TRY AGAIN?" → END.
  // Note: PLAY parsing error on "O0A1" (octave 0) is expected — program still runs.
  it('runs through countdown and shows typing prompt', async () => {
    const tp = TestProgram.fromSample('typeMaster')
    // INKEY$(0) at line 26 blocks waiting for key — queue 'N' to exit
    tp.queueInkey('N')

    await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS },
    })

    // Countdown numbers printed at LOCATE 2,5: FOR I=9 TO 0 STEP -1
    tp.expectRowText(5, '9')
    tp.expectRowText(5, '0')
    // "THIS..." prompt at LOCATE 3,10
    tp.expectRowText(10, 'THIS...')
  }, 20_000)
})
