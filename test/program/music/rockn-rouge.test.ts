import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('rockn-rouge program', () => {
  // Long program (~450 lines) with many PLAY commands and loop structures
  it('runs successfully without errors', async () => {
    const tp = TestProgram.fromSample('musicRocknRouge')

    await tp.run({
      stableOptions: { stablePolls: 3, intervalMs: 20, timeoutMs: 5000 },
    })

    tp.expectSuccess()
  }, 30_000)
})
