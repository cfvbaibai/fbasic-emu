import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('sprite-basic program', () => {
  // PAUSE 150 + PAUSE 100 (~3s total) plus sprite placement and movement
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('spriteBasic')

    await tp.run({ stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 } })

    tp.expectSuccess()
    tp.expectRowText(0, 'SPRITE PLACED AT (120,100)')
    tp.expectRowText(1, 'NOW MOVING RIGHT...')
    tp.expectRowText(2, 'STOPPED AT X=')
    tp.expectRowText(3, 'SPRITE ERASED. DONE!')
  }, 20_000)
})
