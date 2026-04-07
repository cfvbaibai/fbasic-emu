import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('player program', () => {
  it('exits immediately when selecting option 4', async () => {
    const tp = TestProgram.fromSample('musicPlayer')
    tp.seedInput(['4'])

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, '====================')
    tp.expectRowText(1, '   F-BASIC JUKEBOX')
    tp.expectRowText(2, '====================')
    tp.expectRowText(4, '1. TWINKLE TWINKLE')
    tp.expectRowText(5, '2. SCALE DEMO')
    tp.expectRowText(6, '3. CHORD DEMO')
    tp.expectRowText(7, '4. EXIT')
    tp.expectRowText(9, 'GOODBYE!')
  })
})
