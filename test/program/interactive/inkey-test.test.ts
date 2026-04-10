import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('inkey-test program', () => {
  it('reads non-blocking INKEY$ and exits on Q', async () => {
    const tp = TestProgram.fromSample('inkeyTest')

    // INKEY$ (non-blocking) returns the persistent inkeyState.
    // Program loops: check INKEY$, if empty loop, if Q exit, else print+loop.
    // Since inkeyState persists, setting anything other than Q causes infinite loop.
    // Set 'Q' to trigger the exit path immediately.
    tp.setInkeyState('Q')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'INKEY$ TEST')
    tp.expectRowText(1, 'PRESS ANY KEY TO SEE IT')
    tp.expectRowText(2, 'PRESS Q TO QUIT')
    tp.expectRowText(4, 'GOODBYE!')
  })
})
