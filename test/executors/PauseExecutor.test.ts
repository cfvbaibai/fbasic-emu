import type { CstNode } from 'chevrotain'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TIMING } from '@/core/constants'
import { PauseExecutor } from '@/core/execution/executors/PauseExecutor'

describe('PauseExecutor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('converts PAUSE units to quarter-frame milliseconds', async () => {
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((handler: TimerHandler, _timeout?: number): ReturnType<typeof setTimeout> => {
        if (typeof handler === 'function') {
          handler()
        }
        return 0 as ReturnType<typeof setTimeout>
      })

    const mockContext = {
      addError: vi.fn(),
      addDebugOutput: vi.fn(),
      config: { enableDebugMode: false },
    }
    const mockEvaluator = {
      evaluateExpression: vi.fn().mockReturnValue(4),
    }

    const executor = new PauseExecutor(mockContext as never, mockEvaluator as never)
    await executor.execute({ children: { expression: [{ children: {} } as CstNode] } } as CstNode)

    const expectedMs = (4 * TIMING.FRAME_DURATION_MS) / 4
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), expectedMs)
  })
})
