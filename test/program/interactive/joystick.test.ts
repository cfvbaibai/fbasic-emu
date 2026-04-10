import { describe, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('joystick program', () => {
  it('reads joystick direction and exits on button press', async () => {
    const tp = TestProgram.fromSample('joystick')

    // STICK(0) reads persistent state; STRIG(0) consumes from buffer.
    // Set stick direction to 1 (right), then push STRIG values:
    //  0 = idle (loop continues), 1 = exit button
    tp.setStickState(0, 1) // direction: right
    tp.pushStrigState(0, 0) // first iteration: no button press
    tp.pushStrigState(0, 0) // second iteration: still idle
    tp.pushStrigState(0, 1) // third iteration: exit

    await tp.run()

    tp.expectSuccess()
    tp.expectRowText(0, 'JOYSTICK TEST')
    // When direction changes from L1=0 to S=1, line 80 prints " 1"
    tp.expectRowText(1, ' 1')
  })
})
