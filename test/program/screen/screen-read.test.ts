import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('screen-read program', () => {
  it('runs successfully and reads screen characters', async () => {
    const tp = TestProgram.fromSample('screenRead')

    await tp.run()

    tp.expectSuccess()
    // Row 5: "FAMILY BASIC" (printed at LOCATE 0,5)
    tp.expectRowText(5, 'FAMILY BASIC')
    // Row 6: "============"
    tp.expectRowText(6, '============')
    // Row 10: "Reading chars..." (LOCATE 0,10)
    tp.expectRowText(10, 'READING CHARS...')
    // Row 14: "Reading color..." (LOCATE 0,14)
    tp.expectRowText(14, 'READING COLOR...')
    // Row 15: "CHAR: " — SCR$() reads character from screen position
    tp.expectRowText(15, 'CHAR:')
    // Row 16: "COLOR: " — SCR$() with color flag
    tp.expectRowText(16, 'COLOR:')
    // Row 18: "Done!"
    tp.expectRowText(18, 'DONE!')
  })
})
