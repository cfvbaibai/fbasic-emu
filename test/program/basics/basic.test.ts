import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('basic program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('basic')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'BASIC F-BASIC PROGRAM')
    tp.expectRowText(1, 'A + B =  30')
  })
})
