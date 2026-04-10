import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('inkey-blocking program', () => {
  it('reads blocking INKEY$(0) characters and exits on Q', async () => {
    const tp = TestProgram.fromSample('inkeyBlockingTest')

    // INKEY$(0) uses waitForInkeyBlocking which pops from queue.
    // Program loop: read char -> print char+code -> check Q -> loop or end.
    // Queue: 'H' (first loop), 'Q' (second loop triggers exit)
    tp.queueInkey('H')
    tp.queueInkey('Q')

    await tp.run()

    tp.expectSuccess()
    // Row 0: "=== INKEY$(0) BLOCKING TEST ===" truncated at 28 chars
    tp.expectRowText(0, 'INKEY$(0) BLOCKING')
    tp.expectRowText(1, 'THIS MODE WAITS')
    // Row 3: "Enter character: " + 'H' + " (code " + 72 + ")"
    tp.expectRowText(3, 'ENTER CHARACTER: H')
    // "Done!" printed after Q exit
    tp.expectRowText(7, 'DONE!')
  })
})
