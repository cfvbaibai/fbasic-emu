import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('subroutines program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('subroutines')

    await tp.run()

    tp.expectSuccess()
    // CLS at line 30 clears screen
    tp.expectRowText(0, '=== SQUARE CALCULATOR ===')
    // Row 1 is blank (PRINT "")
    tp.expectRowText(2, ' 1 SQUARED =  1')
    tp.expectRowText(3, ' 2 SQUARED =  4')
    tp.expectRowText(4, ' 3 SQUARED =  9')
    tp.expectRowText(5, ' 4 SQUARED =  16')
    tp.expectRowText(6, ' 5 SQUARED =  25')
    // Row 7 is blank (PRINT "")
    tp.expectRowText(8, '=== DIVIDERS ===')
    tp.expectRowText(9, 'DIVIDERS OF 12:')
    // Divisors of 12: 1,2,3,4,6,12 — PRINT D; " "; gives sign-space + explicit space
    tp.expectRowText(10, ' 1  2  3  4  6  12')
  })
})
