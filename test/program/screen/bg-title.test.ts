import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('bg-title program', () => {
  it('runs successfully with VIEW and prints title screen text over BG', async () => {
    const tp = TestProgram.fromSample('bgViewTitle').withBgData('titleScreen')

    await tp.run()

    tp.expectSuccess()
    // Row 7: "MY AWESOME GAME" (LOCATE 9,7) — F-BASIC renders as uppercase
    tp.expectRowText(7, 'MY AWESOME GAME')
    // Row 9: "VERSION 1.0" (LOCATE 11,9)
    tp.expectRowText(9, 'VERSION 1.0')
    // Row 14: "PRESS START" (LOCATE 9,14)
    tp.expectRowText(14, 'PRESS START')
  })
})
