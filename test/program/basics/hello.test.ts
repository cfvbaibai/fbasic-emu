import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('hello program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('hello')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'FAMILY BASIC V3')
    tp.expectRowText(1, '==============')
    tp.expectRowText(2, 'HELLO, WORLD')
  })
})
