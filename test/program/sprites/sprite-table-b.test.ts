import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('sprite-table-b program', () => {
  // Interactive program with STICK/STRIG game loop — push START (T=1) to exit
  it('runs successfully and exits on START button', async () => {
    const tp = TestProgram.fromSample('spriteTableB')
    // T=1 triggers line 450: "IF T=1 THEN 450" to exit the game loop
    tp.pushStrigState(0, 1)

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS } })

    tp.expectSuccess()
    tp.expectRowText(0, '=== SPRITE TABLE B TEST ===')
    tp.expectRowText(1, 'CGEN 3: B ON BG, B ON SPRITE')
    // Screen width is 28 chars — "USING BG CHARACTERS FOR SPRITES" truncates
    tp.expectRowText(2, 'USING BG CHARACTERS FOR SPRI')
    tp.expectRowText(4, 'SPRITE 0: FLAG AT (50,100)')
    tp.expectRowText(5, 'SPRITE 1: APPLE AT (150,100)')
    tp.expectRowText(7, 'USE D-PAD TO MOVE SPRITE 0')
    tp.expectRowText(8, 'PRESS A TO HIDE SPRITE 1')
    tp.expectRowText(9, 'PRESS B TO SHOW SPRITE 1')
    tp.expectRowText(10, 'PRESS START TO END')
    tp.expectRowText(11, 'GOODBYE!')
  }, 20_000)
})
