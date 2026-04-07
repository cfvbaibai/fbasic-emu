import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('jingle-bells program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicJingleBells')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'JINGLE BELLS')
    tp.expectRowText(1, '============')
    tp.expectRowText(3, 'MERRY CHRISTMAS!')
  })
})
