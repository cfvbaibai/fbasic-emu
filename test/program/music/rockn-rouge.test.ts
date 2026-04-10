import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('rockn-rouge program', () => {
  // Long program (~450 lines) with PLAY commands, IF/GOTO loops, and no PRINT.
  // All screen rows should remain blank since the program produces no text output.
  it('runs successfully with empty screen (no PRINT output)', async () => {
    const tp = TestProgram.fromSample('musicRocknRouge')

    await tp.run({
      stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS },
    })

    tp.expectSuccess()
    // Program has no PRINT statements — screen should stay blank
    tp.expectRowText(0, /^\s*$/)
    tp.expectRowText(1, /^\s*$/)
    tp.expectRowText(23, /^\s*$/)
  }, 30_000)
})
