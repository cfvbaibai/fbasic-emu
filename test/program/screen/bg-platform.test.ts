import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('bg-platform program', () => {
  it('runs successfully with VIEW and prints level text over BG platform', async () => {
    const tp = TestProgram.fromSample('bgViewPlatform').withBgData('platformGame')

    await tp.run()

    tp.expectSuccess()
    // Row 4: "LEVEL 1" at column 3 (LOCATE 3,4) — F-BASIC renders as uppercase
    tp.expectRowText(4, 'LEVEL 1')
    // Row 4: "X3" at column 20 (LOCATE 20,4)
    tp.expectRowText(4, 'X3')
  })
})
