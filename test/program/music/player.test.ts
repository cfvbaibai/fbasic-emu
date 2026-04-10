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

  it.each([
    ['1', 'Twinkle Twinkle'],
    ['2', 'C Major Scale'],
    ['3', 'Chord Progression'],
  ] as const)('plays option %s (%s) then exits', async (option, _name) => {
    const tp = TestProgram.fromSample('musicPlayer')
    tp.seedInput([option])
    tp.seedInput(['4'])

    await tp.run()

    tp.expectSuccess()
    // After song plays, program loops back to menu via GOTO 10 (which CLS)
    // Final screen: menu re-drawn + Goodbye! from selecting exit
    tp.expectRowText(0, '====================')
    tp.expectRowText(1, '   F-BASIC JUKEBOX')
    tp.expectRowText(2, '====================')
    tp.expectRowText(9, 'GOODBYE!')
  })
})
