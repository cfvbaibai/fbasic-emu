import { describe, expect, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('screen program', () => {
  it('runs successfully and shows screen control output', async () => {
    const tp = TestProgram.fromSample('screen')

    await tp.run()

    tp.expectSuccess()
    // Row 0: "SCREEN DEMO" (CLS then PRINT)
    tp.expectRowText(0, 'SCREEN DEMO')
    // Row 5: "ROW 5, COL 10" (LOCATE 10,5)
    tp.expectRowText(5, 'ROW 5, COL 10')
    // Row 7: "ROW 7, COL 10" (LOCATE 10,7)
    tp.expectRowText(7, 'ROW 7, COL 10')
    // Diagonal asterisks at LOCATE 5+I, 10+I for I=0..9
    tp.expectRowText(10, '*')
    // Row 22: "Done!" (LOCATE 0,22)
    tp.expectRowText(22, 'DONE!')
  })

  it('sets backdrop color via CGSET and PALETB (#529 regression)', async () => {
    const tp = TestProgram.fromSample('screen')

    const result = await tp.run()

    tp.expectSuccess()
    expect(result.snapshot).not.toBeNull()
    // After CGSET 0 + PALETB 0, 1, 0, 0, 0: bgPalette=0, backdropColor=1
    expect(result.snapshot!.scalars.bgPalette).toEqual(0)
    expect(result.snapshot!.scalars.backdropColor).toEqual(1)
  })
})
