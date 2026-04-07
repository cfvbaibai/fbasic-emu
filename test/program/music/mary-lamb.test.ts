import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('mary-lamb program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicMaryHadALittleLamb')

    await tp.run()

    tp.expectSuccess()
    // LOCATE 6,12 positions text on row 12
    tp.expectRowText(12, 'MARY HAD A LITTLE LAMB')
    tp.expectRowText(14, 'SONG COMPLETE!')
  })
})
