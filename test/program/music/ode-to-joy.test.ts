import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('ode-to-joy program', () => {
  it('runs successfully and produces expected output', async () => {
    const tp = TestProgram.fromSample('musicOdeToJoy')

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'ODE TO JOY - BEETHOVEN')
    tp.expectRowText(1, 'SYMPHONY NO.9 - FULL THEME')
    tp.expectRowText(2, '==========================')
    tp.expectRowText(4, 'FIN!')
  })
})
