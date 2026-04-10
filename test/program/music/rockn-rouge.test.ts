import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, TestProgram } from '../../integration/TestProgram'

describe('rockn-rouge program', () => {
  // Long program (~450 lines) with many PLAY commands and loop structures
  it('runs successfully without errors', async () => {
    const tp = TestProgram.fromSample('musicRocknRouge')

    await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: 5000 },
    })

    tp.expectSuccess()
  }, 30_000)
})
