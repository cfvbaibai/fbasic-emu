import { describe, expect, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('sprite-interactive program', () => {
  it('processes sprite setup and joystick movement', async () => {
    // sprite-interactive runs an infinite loop (IF T=1 THEN 190 -> GOTO 80).
    // Use reduced maxIterations so the test finishes quickly.
    const tp = TestProgram.fromSample('spriteInteractive', {
      maxIterations: 500,
    })

    // Set stick to direction 1 (right) so PX increments by 2 each movement cycle.
    // STRIG is consumed each loop iteration; push enough zeros for idle iterations.
    tp.setStickState(0, 1) // direction: right
    for (let i = 0; i < 50; i++) {
      tp.pushStrigState(0, 0) // idle: no button press
    }

    const result = await tp.run()

    // Program runs until max iterations — expect the iteration error
    expect(result.executionResult.success).toBe(false)
    expect(result.executionResult.errors[0]?.message).toContain('Maximum iterations exceeded')

    // CLS was called at program start (line 10)
    expect(tp.getAdapter().getClearScreenCallCount()).toBeGreaterThanOrEqual(1)
  })
})
