import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('bg-items program', () => {
  it('runs successfully and prints character ranges', async () => {
    const tp = TestProgram.fromSample('bgItems')

    await tp.run()

    tp.expectSuccess()
    // Row 0: CHR$(0-27) — control/special characters
    // Row 1: CHR$(28-31) — remaining chars from first range
    // Row 3: CHR$(33-47) — punctuation/symbols: !"#$%&'()*+,-./
    tp.expectRowText(3, '!')
    tp.expectRowText(3, '/')
    // Row 5: CHR$(48-57) — digits: 0123456789
    tp.expectRowText(5, '0123456789')
    // Row 7: CHR$(65-90) — uppercase letters: ABCDEFGHIJKLMNOPQRSTUVWXYZ
    tp.expectRowText(7, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    // Row 9: CHR$(91-95) — brackets: [\]^_
    tp.expectRowText(9, '[')
    // Row 11+: CHR$(96-175) — lowercase and extended characters
    tp.expectRowText(11, '`')
  })
})
