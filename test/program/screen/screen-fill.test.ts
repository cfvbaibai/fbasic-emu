import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('screen-fill program', () => {
  it('runs successfully and fills screen with line numbers', async () => {
    const tp = TestProgram.fromSample('screenFill')

    await tp.run()

    tp.expectSuccess()
    // Test adapter does not scroll, so rows 0-22 keep LINE 1-23
    // Row 0: "LINE  1" (positive numbers have space padding for sign)
    tp.expectRowText(0, 'LINE  1')
    // Row 1: "LINE  2"
    tp.expectRowText(1, 'LINE  2')
    // Row 22: "LINE  23"
    tp.expectRowText(22, 'LINE  23')
    // Row 23: last written line — "DONE" from PRINT "Done", but " 50" remains
    // from the last FOR iteration's "LINE  50" which is longer than "DONE"
    tp.expectRowText(23, 'DONE')
  })
})
