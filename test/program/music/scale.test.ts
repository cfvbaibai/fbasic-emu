import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('scale program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicScale')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'C MAJOR SCALE')
    tp.expectRowText(1, '=============')
    tp.expectRowText(2, 'ASCENDING...')
    tp.expectRowText(3, 'DESCENDING...')
    tp.expectRowText(5, 'COMPLETE!')
  })
})
