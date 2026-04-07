import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('loop-demo program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicLoopDemo')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'MUSIC LOOP DEMO')
    tp.expectRowText(1, '===============')
    tp.expectRowText(2, 'ASCENDING SCALE 3X:')
    tp.expectRowText(3, 'DESCENDING SCALE 3X:')
    tp.expectRowText(4, 'PATTERN REPEAT 4X:')
    tp.expectRowText(6, 'COMPLETE!')
  })
})
