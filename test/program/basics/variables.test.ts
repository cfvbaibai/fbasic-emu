import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('variables program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('variables')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'A=')
    tp.expectRowText(0, ' B=')
    tp.expectRowText(1, 'A+B= 35')
    tp.expectRowText(2, 'ABS(-5)= 5')
    tp.expectRowText(3, 'SGN(3)= 1')
    tp.expectRowText(4, 'LEN= 5')
  })
})
