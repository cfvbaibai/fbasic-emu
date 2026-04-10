import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('bgplay-demo program', () => {
  // BGPLAY + PAUSE 30 in part 1, then CLS and interactive game loop with STRIG exit.
  // Part 2 clears Part 1 output, so screen shows game loop + "Goodbye!"
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicBgplayDemo')
    // Queue START button press (bit 0) to exit the Part 2 game loop
    tp.pushStrigState(0, 1)

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS } })

    tp.expectSuccess()
    // After Part 2 CLS, screen shows game loop header
    tp.expectRowText(0, '=== GAME LOOP + BGPLAY ===')
    // Text truncated to 28-char screen width
    tp.expectRowText(1, 'SPRITE MOVES WHILE MUSIC PLA')
    tp.expectRowText(2, 'PRESS A = SOUND EFFECT')
    tp.expectRowText(3, 'PRESS START = EXIT')
    tp.expectRowText(8, 'GOODBYE!')
  }, 20_000)
})
