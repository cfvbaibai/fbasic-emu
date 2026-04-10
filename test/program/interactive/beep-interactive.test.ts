import { describe, expect, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('beep-interactive program', () => {
  it('triggers BEEP on button A and exits on START', async () => {
    const tp = TestProgram.fromSample('beepInteractive')

    // STRIG(0) is consumed each loop iteration (line 50).
    // Bit 8 = button A (trigger BEEP), bit 1 = START (exit).
    // Push: button A press (8) -> BEEP, then START press (1) -> exit to "Goodbye!"
    tp.pushStrigState(0, 8) // T=8: (8 AND 8)=8 -> BEEP, (8 AND 1)=0 -> no exit
    tp.pushStrigState(0, 1) // T=1: (1 AND 8)=0 -> no BEEP, (1 AND 1)=1 -> exit

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'PRESS A TO BEEP')
    tp.expectRowText(1, 'PRESS START TO EXIT')
    tp.expectRowText(2, 'GOODBYE!')

    // Verify BEEP was triggered at least once
    expect(tp.getAdapter().beepCalls).toBeGreaterThanOrEqual(1)
  })
})
