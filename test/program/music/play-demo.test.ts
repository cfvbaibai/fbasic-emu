import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, TestProgram } from '../../integration/TestProgram'

describe('play-demo program', () => {
  // PLAY + PAUSE 30 sections — total ~3s of PAUSE delays
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicPlayDemo')

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: 5000 } })

    tp.expectSuccess()
    tp.expectRowText(0, '=== PLAY DEMO ===')
    tp.expectRowText(2, 'QUARTER NOTES:')
    tp.expectRowText(3, 'EIGHTH NOTES:')
    tp.expectRowText(4, 'HALF NOTES:')
    tp.expectRowText(5, 'CHORD:')
    tp.expectRowText(7, 'DONE!')
  }, 20_000)
})
