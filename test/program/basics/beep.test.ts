import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('beep program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('beep')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'BEEP DEMO')
    tp.expectRowText(1, 'THREE BEEPS:')
    tp.expectRowText(3, 'COUNTDOWN BEEPS:')
    tp.expectRowText(4, 'GO!')
  })
})
