import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('dataRead program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('dataRead')

    await tp.run()

    tp.expectSuccess()
    // Each PRINT N on a separate line — sign-space padded
    tp.expectRowText(0, ' 10')
    tp.expectRowText(1, ' 20')
    tp.expectRowText(2, ' 30')
  })
})
