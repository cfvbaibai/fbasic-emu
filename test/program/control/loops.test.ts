import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('loops program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('loops')

    await tp.run()

    tp.expectSuccess()
    // CLS at line 20 clears screen — all content starts from row 0
    // Count up section
    tp.expectRowText(0, '=== COUNT UP ===')
    tp.expectRowText(1, ' 1 2 3 4 5')
    // STEP 2 section
    tp.expectRowText(2, '=== STEP 2 ===')
    tp.expectRowText(3, ' 0 2 4 6 8 10')
    // Countdown section: PRINT I; " "; adds sign-space + explicit space
    tp.expectRowText(4, '=== COUNTDOWN ===')
    tp.expectRowText(5, ' 3  2  1 GO!')
    // Multiplication table: PRINT I; "x"; J; "="; P; " " → num X num = num space
    tp.expectRowText(6, '=== MULTIPLICATION ===')
    tp.expectRowText(7, ' 1X 1= 1  1X 2= 2  1X 3= 3')
    tp.expectRowText(8, ' 2X 1= 2  2X 2= 4  2X 3= 6')
    tp.expectRowText(9, ' 3X 1= 3  3X 2= 6  3X 3= 9')
    tp.expectRowText(10, '=== DONE ===')
  })
})
