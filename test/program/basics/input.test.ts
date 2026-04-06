import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('input program', () => {
  it('runs successfully and produces expected output with seeded input', async () => {
    const tp = TestProgram.fromSample('input')
    tp.seedInput(['WORLD'])
    tp.seedInput(['5'])

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'HELLO WORLD')
    tp.expectRowText(1, 'SQUARE= 25')
  })
})
