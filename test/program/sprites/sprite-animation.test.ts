import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('sprite-animation program', () => {
  // PAUSE 180 + PAUSE 120 (~4s total) plus sprite movement
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('spriteAnimation')

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS } })

    tp.expectSuccess()
    tp.expectRowText(0, 'THREE SPRITES MOVING...')
    tp.expectRowText(1, 'MOVEMENT STOPPED!')
  }, 20_000)
})
