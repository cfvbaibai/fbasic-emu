import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('happy-birthday program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicHappyBirthday')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'HAPPY BIRTHDAY TO YOU!')
    tp.expectRowText(1, '=======================')
    tp.expectRowText(3, 'MAKE A WISH!')
  })
})
