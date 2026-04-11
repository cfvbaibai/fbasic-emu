import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('bg-view program', () => {
  it('runs successfully with VIEW and prints text over BG border', async () => {
    const tp = TestProgram.fromSample('bgView').withBgData('bgView')

    await tp.run()

    tp.expectSuccess()
    // Row 8: "BG VIEW DEMO" (LOCATE 8,8) — F-BASIC renders as uppercase
    tp.expectRowText(8, 'BG VIEW DEMO')
    // Row 10: "BG GRAPHICS ARE" (LOCATE 6,10)
    tp.expectRowText(10, 'BG GRAPHICS ARE')
    // Row 11: "SHOWN VIA VIEW." (LOCATE 6,11)
    tp.expectRowText(11, 'SHOWN VIA VIEW.')
    // Row 14: "BORDER DRAWN IN BG" (LOCATE 4,14)
    tp.expectRowText(14, 'BORDER DRAWN IN BG')
    // Row 15: "EDITOR IS VISIBLE!" (LOCATE 4,15)
    tp.expectRowText(15, 'EDITOR IS VISIBLE!')
  })
})
