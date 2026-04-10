import { describe, it } from 'vitest'

import { DEFAULT_STABLE_OPTIONS, EXTENDED_STABLE_TIMEOUT_MS, TestProgram } from '../../integration/TestProgram'

describe('cursor-position program', () => {
  // PAUSE 50 per loop iteration × 16 iterations ≈ 16s total, needs extended timeout
  it('runs successfully and shows cursor position output', async () => {
    const tp = TestProgram.fromSample('cursorPosition')

    await tp.run({ stableOptions: { ...DEFAULT_STABLE_OPTIONS, timeoutMs: EXTENDED_STABLE_TIMEOUT_MS } })

    tp.expectSuccess()
    // LOCATE I,I for I=0..15 → diagonal POS/LINE output
    // Row 0: POS= 0 LINE= 0 (positive numbers have space padding)
    tp.expectRowText(0, 'POS=')
    tp.expectRowText(0, 'LINE=')
    // Row 12: POS= 12 LINE= 12 (last row before wrapping)
    tp.expectRowText(12, 'POS= 12 LINE= 12')
    // Row 16: "Done!"
    tp.expectRowText(16, 'DONE!')
  }, 20_000)
})
