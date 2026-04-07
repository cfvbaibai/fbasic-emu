/**
 * Unit tests for TestDeviceInputScheduler
 *
 * Tests the input timeline scheduling system: frame tracking, event scheduling,
 * one-shot delivery, and the pure extractScheduledEvents function.
 */

import { describe, expect, it, vi } from 'vitest'

import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { ScheduledInputEvent } from '@/core/devices/TestDeviceInputScheduler'
import {
  extractScheduledEvents,
  TestDeviceInputScheduler,
} from '@/core/devices/TestDeviceInputScheduler'

// Mock logger
vi.mock('@/shared/logger', () => ({
  logDevice: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// extractScheduledEvents (pure function)
// ============================================================================

describe('extractScheduledEvents', () => {
  it('should return empty arrays when no events scheduled', () => {
    const result = extractScheduledEvents([], 5)
    expect(result.delivered).toEqual([])
    expect(result.remaining).toEqual([])
  })

  it('should deliver events matching the target frame', () => {
    const events: ScheduledInputEvent[] = [
      { atFrame: 3, stick: { player: 0, direction: 8 } },
      { atFrame: 5, stick: { player: 0, direction: 4 } },
      { atFrame: 3, strig: { player: 0, button: 1 } },
    ]

    const result = extractScheduledEvents(events, 3)

    expect(result.delivered).toEqual([
      { atFrame: 3, stick: { player: 0, direction: 8 } },
      { atFrame: 3, strig: { player: 0, button: 1 } },
    ])
    expect(result.remaining).toEqual([
      { atFrame: 5, stick: { player: 0, direction: 4 } },
    ])
  })

  it('should return all events as remaining when no match', () => {
    const events: ScheduledInputEvent[] = [
      { atFrame: 1, key: 'A' },
      { atFrame: 2, key: 'B' },
    ]

    const result = extractScheduledEvents(events, 99)

    expect(result.delivered).toEqual([])
    expect(result.remaining).toEqual([
      { atFrame: 1, key: 'A' },
      { atFrame: 2, key: 'B' },
    ])
  })

  it('should deliver all events when all match target frame', () => {
    const events: ScheduledInputEvent[] = [
      { atFrame: 0, stick: { player: 0, direction: 8 } },
      { atFrame: 0, key: 'X' },
    ]

    const result = extractScheduledEvents(events, 0)

    expect(result.delivered).toEqual([
      { atFrame: 0, stick: { player: 0, direction: 8 } },
      { atFrame: 0, key: 'X' },
    ])
    expect(result.remaining).toEqual([])
  })

  it('should preserve order of remaining events', () => {
    const events: ScheduledInputEvent[] = [
      { atFrame: 1, key: 'A' },
      { atFrame: 2, key: 'B' },
      { atFrame: 3, key: 'C' },
      { atFrame: 4, key: 'D' },
    ]

    const result = extractScheduledEvents(events, 2)

    expect(result.remaining).toEqual([
      { atFrame: 1, key: 'A' },
      { atFrame: 3, key: 'C' },
      { atFrame: 4, key: 'D' },
    ])
  })

  it('should not mutate the original events array', () => {
    const events: ScheduledInputEvent[] = [
      { atFrame: 1, stick: { player: 0, direction: 8 } },
      { atFrame: 2, stick: { player: 0, direction: 4 } },
    ]

    extractScheduledEvents(events, 1)

    expect(events).toHaveLength(2)
    expect(events[0]!.atFrame).toBe(1)
    expect(events[1]!.atFrame).toBe(2)
  })
})

// ============================================================================
// TestDeviceInputScheduler (standalone, with mock callbacks)
// ============================================================================

describe('TestDeviceInputScheduler', () => {
  function createScheduler() {
    const stickStates: Map<number, number> = new Map()
    const strigBuffer: Map<number, number[]> = new Map()
    let inkeyState = ''

    const scheduler = new TestDeviceInputScheduler({
      setStickState: (player, direction) => stickStates.set(player, direction),
      pushStrigState: (player, button) => {
        if (!strigBuffer.has(player)) strigBuffer.set(player, [])
        strigBuffer.get(player)!.push(button)
      },
      setInkeyState: (key) => { inkeyState = key },
    })

    return {
      scheduler,
      getStick: (player: number) => stickStates.get(player) ?? 0,
      consumeStrig: (player: number) => {
        const buf = strigBuffer.get(player)
        return buf && buf.length > 0 ? buf.shift()! : 0
      },
      getInkey: () => inkeyState,
    }
  }

  it('should start at frame 0', () => {
    const { scheduler } = createScheduler()
    expect(scheduler.getCurrentFrame()).toBe(0)
  })

  it('should advance frame counter by 1', () => {
    const { scheduler } = createScheduler()
    const delivery = scheduler.advanceFrame()
    expect(scheduler.getCurrentFrame()).toBe(1)
    expect(delivery.frame).toBe(1)
    expect(delivery.delivered).toEqual([])
  })

  it('should deliver stick event at scheduled frame', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 3, stick: { player: 0, direction: 8 } })

    scheduler.advanceFrame()
    scheduler.advanceFrame()
    expect(getStick(0)).toBe(0)

    const delivery = scheduler.advanceFrame()
    expect(getStick(0)).toBe(8)
    expect(delivery.delivered).toHaveLength(1)
    expect(delivery.delivered[0]!.stick).toEqual({ player: 0, direction: 8 })
  })

  it('should deliver strig event at scheduled frame', () => {
    const { scheduler, consumeStrig } = createScheduler()
    scheduler.scheduleInput({ atFrame: 2, strig: { player: 0, button: 1 } })

    scheduler.advanceFrame()
    expect(consumeStrig(0)).toBe(0)

    scheduler.advanceFrame()
    expect(consumeStrig(0)).toBe(1)
  })

  it('should deliver key event at scheduled frame', () => {
    const { scheduler, getInkey } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, key: 'A' })

    scheduler.advanceFrame()
    expect(getInkey()).toBe('A')
  })

  it('should deliver multiple events at the same frame', () => {
    const { scheduler, getStick, consumeStrig, getInkey } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 1 } })
    scheduler.scheduleInput({ atFrame: 1, strig: { player: 0, button: 4 } })
    scheduler.scheduleInput({ atFrame: 1, key: 'X' })

    const delivery = scheduler.advanceFrame()
    expect(getStick(0)).toBe(1)
    expect(consumeStrig(0)).toBe(4)
    expect(getInkey()).toBe('X')
    expect(delivery.delivered).toHaveLength(3)
  })

  it('should not redeliver one-shot events', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })

    scheduler.advanceFrame()
    expect(getStick(0)).toBe(8)

    scheduler.advanceFrame()
    expect(getStick(0)).toBe(8) // Value persists (setStickState was called once)
  })

  it('should deliver events at frame 0 via deliverScheduledEvents', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 0, stick: { player: 0, direction: 8 } })

    const delivery = scheduler.deliverScheduledEvents()
    expect(getStick(0)).toBe(8)
    expect(delivery.frame).toBe(0)
    expect(delivery.delivered).toHaveLength(1)
  })

  it('should not deliver frame 0 events on advanceFrame', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 0, stick: { player: 0, direction: 8 } })

    scheduler.advanceFrame()
    expect(scheduler.getCurrentFrame()).toBe(1)
    expect(getStick(0)).toBe(0)
  })

  it('should clear scheduled inputs without delivering', () => {
    const { scheduler, getStick, consumeStrig } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })
    scheduler.scheduleInput({ atFrame: 2, strig: { player: 0, button: 1 } })

    expect(scheduler.getScheduledInputCount()).toBe(2)
    scheduler.clearScheduledInputs()
    expect(scheduler.getScheduledInputCount()).toBe(0)

    scheduler.advanceFrame()
    scheduler.advanceFrame()
    expect(getStick(0)).toBe(0)
    expect(consumeStrig(0)).toBe(0)
  })

  it('should return copy of scheduled inputs', () => {
    const { scheduler } = createScheduler()
    const event = { atFrame: 1, stick: { player: 0, direction: 8 } }
    scheduler.scheduleInput(event)

    const inputs = scheduler.getScheduledInputs()
    expect(inputs).toEqual([event])

    inputs.push({ atFrame: 99, stick: { player: 0, direction: 0 } })
    expect(scheduler.getScheduledInputCount()).toBe(1)
  })

  it('should schedule multiple inputs at once via scheduleInputs', () => {
    const { scheduler, getStick, consumeStrig, getInkey } = createScheduler()
    scheduler.scheduleInputs([
      { atFrame: 1, stick: { player: 0, direction: 1 } },
      { atFrame: 2, strig: { player: 0, button: 1 } },
      { atFrame: 3, key: 'Z' },
    ])

    expect(scheduler.getScheduledInputCount()).toBe(3)

    scheduler.advanceFrame()
    expect(getStick(0)).toBe(1)

    scheduler.advanceFrame()
    expect(consumeStrig(0)).toBe(1)

    scheduler.advanceFrame()
    expect(getInkey()).toBe('Z')
  })

  it('should set frame counter via setCurrentFrame', () => {
    const { scheduler } = createScheduler()
    scheduler.setCurrentFrame(10)
    expect(scheduler.getCurrentFrame()).toBe(10)
  })

  it('should deliver events for frame set via setCurrentFrame', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 5, stick: { player: 0, direction: 8 } })

    scheduler.setCurrentFrame(5)
    const delivery = scheduler.deliverScheduledEvents()
    expect(getStick(0)).toBe(8)
    expect(delivery.delivered).toHaveLength(1)
  })

  it('should record deliveries in delivery log', () => {
    const { scheduler } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })

    scheduler.advanceFrame()
    scheduler.advanceFrame()

    const log = scheduler.getDeliveryLog()
    expect(log).toHaveLength(2)
    expect(log[0]!.frame).toBe(1)
    expect(log[0]!.delivered).toHaveLength(1)
    expect(log[1]!.frame).toBe(2)
    expect(log[1]!.delivered).toHaveLength(0)
  })

  it('should reset all state', () => {
    const { scheduler } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })
    scheduler.advanceFrame()

    scheduler.reset()
    expect(scheduler.getCurrentFrame()).toBe(0)
    expect(scheduler.getScheduledInputCount()).toBe(0)
    expect(scheduler.getDeliveryLog()).toEqual([])
  })

  it('should handle events for different players', () => {
    const { scheduler, getStick } = createScheduler()
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })
    scheduler.scheduleInput({ atFrame: 1, stick: { player: 1, direction: 4 } })

    scheduler.advanceFrame()
    expect(getStick(0)).toBe(8)
    expect(getStick(1)).toBe(4)
  })

  it('should deliver combined stick, strig, and key in single event', () => {
    const { scheduler, getStick, consumeStrig, getInkey } = createScheduler()
    scheduler.scheduleInput({
      atFrame: 1,
      stick: { player: 0, direction: 1 },
      strig: { player: 0, button: 2 },
      key: 'A',
    })

    const delivery = scheduler.advanceFrame()
    expect(getStick(0)).toBe(1)
    expect(consumeStrig(0)).toBe(2)
    expect(getInkey()).toBe('A')
    expect(delivery.delivered).toHaveLength(1)
  })
})

// ============================================================================
// Integration: scheduling through TestDeviceAdapter.inputScheduler
// ============================================================================

describe('TestDeviceAdapter scheduling integration', () => {
  function createAdapter(): TestDeviceAdapter {
    return new TestDeviceAdapter()
  }

  it('should start at frame 0', () => {
    const adapter = createAdapter()
    expect(adapter.inputScheduler.getCurrentFrame()).toBe(0)
  })

  it('should deliver stick event through adapter.inputScheduler', () => {
    const adapter = createAdapter()
    adapter.inputScheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })
    adapter.inputScheduler.advanceFrame()
    expect(adapter.getStickState(0)).toBe(8)
  })

  it('should deliver strig event through adapter.inputScheduler', () => {
    const adapter = createAdapter()
    adapter.inputScheduler.scheduleInput({ atFrame: 1, strig: { player: 0, button: 1 } })
    adapter.inputScheduler.advanceFrame()
    expect(adapter.consumeStrigState(0)).toBe(1)
  })

  it('should deliver key event through adapter.inputScheduler', () => {
    const adapter = createAdapter()
    adapter.inputScheduler.scheduleInput({ atFrame: 1, key: 'A' })
    adapter.inputScheduler.advanceFrame()
    expect(adapter.getInkeyState()).toBe('A')
  })

  it('should reset scheduling state on adapter reset()', () => {
    const adapter = createAdapter()
    adapter.inputScheduler.scheduleInput({ atFrame: 1, stick: { player: 0, direction: 8 } })
    adapter.inputScheduler.advanceFrame()

    adapter.reset()
    expect(adapter.inputScheduler.getCurrentFrame()).toBe(0)
    expect(adapter.inputScheduler.getScheduledInputCount()).toBe(0)
    expect(adapter.inputScheduler.getDeliveryLog()).toEqual([])
  })
})
