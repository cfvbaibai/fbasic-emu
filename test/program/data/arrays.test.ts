import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('arrays program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('arrays')

    await tp.run()

    tp.expectSuccess()
    // PRINT A(1); A(2); A(3) → sign-space padded values concatenated by semicolons
    tp.expectRowText(0, ' 10 20 30')
  })
})
