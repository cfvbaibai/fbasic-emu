import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('three-channel program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicThreeChannel')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'THREE-CHANNEL HARMONY DEMO')
    tp.expectRowText(1, '==========================')
    tp.expectRowText(2, 'PLAYING C MAJOR CHORD...')
    tp.expectRowText(3, 'PLAYING F MAJOR CHORD...')
    tp.expectRowText(4, 'PLAYING G MAJOR CHORD...')
    tp.expectRowText(5, 'PLAYING C MAJOR CHORD...')
    tp.expectRowText(7, 'COMPLETE!')
  })
})
