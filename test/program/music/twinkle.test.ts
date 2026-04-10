import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('twinkle program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicTwinkle')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'TWINKLE TWINKLE LITTLE STAR')
    tp.expectRowText(1, '===========================')
    // RegExp: PRINT "Verse ";V concatenates string + number (with sign-char space),
    // producing variable-width spacing like "VERSE  2" — use \s+ to be resilient.
    tp.expectRowText(3, /VERSE\s+2/)
    tp.expectRowText(5, 'SONG COMPLETE!')
  })
})
