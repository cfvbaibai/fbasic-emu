import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('conditionals program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('conditionals')

    await tp.run()

    tp.expectSuccess()
    // Header
    tp.expectRowText(0, '=== COMPARISONS ===')
    // I=1: matches =, <, <>, <=
    tp.expectRowText(1, 'ONE')
    tp.expectRowText(2, ' 1 < 3')
    tp.expectRowText(3, ' 1 <> 3')
    tp.expectRowText(4, ' 1 <= 2')
    // I=2: matches <, <>, <=
    tp.expectRowText(5, ' 2 < 3')
    tp.expectRowText(6, ' 2 <> 3')
    tp.expectRowText(7, ' 2 <= 2')
    // I=3: no comparisons match
    // I=4: matches >, <>, >=
    tp.expectRowText(8, ' 4 > 3')
    tp.expectRowText(9, ' 4 <> 3')
    tp.expectRowText(10, ' 4 >= 4')
    // I=5: matches >, <>, >=
    tp.expectRowText(11, ' 5 > 3')
    tp.expectRowText(12, ' 5 <> 3')
    tp.expectRowText(13, ' 5 >= 4')
    // Logic section
    tp.expectRowText(14, '=== LOGIC ===')
    tp.expectRowText(15, 'X IN RANGE')
    tp.expectRowText(16, 'X >= 5')
    tp.expectRowText(17, '=== DONE ===')
  })
})
