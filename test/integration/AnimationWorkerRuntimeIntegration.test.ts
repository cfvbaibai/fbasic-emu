// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSharedDisplayBuffer,SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { AnimationWorker } from '@/core/workers/AnimationWorker'

describe('AnimationWorker Runtime Integration', () => {
  let worker: AnimationWorker
  let accessor: SharedDisplayBufferAccessor

  beforeEach(() => {
    vi.useFakeTimers()
    const { buffer } = createSharedDisplayBuffer()
    accessor = new SharedDisplayBufferAccessor(buffer)
    worker = new AnimationWorker()
    worker.handleMessage({ type: 'SET_SHARED_BUFFER', buffer })
  })

  afterEach(() => {
    worker.terminate()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  function tick(deltaTime: number): void {
    worker.handleMessage({ type: 'TICK', deltaTime })
  }

  it('processes START_MOVEMENT and updates live sprite state', () => {
    // Simulate DEF MOVE side-effect values already in shared buffer.
    accessor.writeSpriteState(0, 0, 0, false, false, 0, 0, 0, 0, 0, 0, 4, 2)

    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
      startX: 10,
      startY: 20,
      direction: 3,
      speed: 60,
      distance: 10,
      priority: 0,
    })
    tick(16)

    // notifyAck() uses Int32 atomics on the same bytes, so Float64 ack reads are not stable.
    // Verify command processing through state mutations instead.
    expect(accessor.readSpriteIsVisible(0)).toBe(true)
    expect(accessor.readSpriteIsActive(0)).toBe(true)
    expect(accessor.readSpriteCharacterType(0)).toBe(4)
    expect(accessor.readSpriteColorCombination(0)).toBe(2)
    expect(accessor.readSpritePosition(0)?.x ?? 0).toBeGreaterThan(10)
    expect(accessor.readSpriteRemainingDistance(0)).toBeLessThan(20)
  })

  it('processes STOP_MOVEMENT and keeps sprite visible', () => {
    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
      startX: 40,
      startY: 30,
      direction: 5,
      speed: 30,
      distance: 10,
      priority: 0,
    })
    tick(16)

    accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 0)
    tick(16)

    expect(accessor.readSpriteIsActive(0)).toBe(false)
    expect(accessor.readSpriteIsVisible(0)).toBe(true)
  })

  it('processes SET_POSITION and preserves DEF MOVE fields', () => {
    accessor.writeSpriteState(1, 0, 0, false, false, 0, 0, 0, 0, 0, 0, 7, 3)

    accessor.writeSyncCommand(SyncCommandType.SET_POSITION, 1, {
      startX: 123,
      startY: 45,
    })
    tick(16)

    const pos = accessor.readSpritePosition(1)
    expect(pos).toEqual({ x: 123, y: 45 })
    expect(accessor.readSpriteCharacterType(1)).toBe(7)
    expect(accessor.readSpriteColorCombination(1)).toBe(3)
  })

  it('processes ERASE_MOVEMENT and clears slot', () => {
    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 2, {
      startX: 80,
      startY: 90,
      direction: 1,
      speed: 30,
      distance: 10,
      priority: 1,
    })
    tick(16)

    accessor.writeSyncCommand(SyncCommandType.ERASE_MOVEMENT, 2)
    tick(16)

    expect(accessor.readSpriteIsActive(2)).toBe(false)
    expect(accessor.readSpriteIsVisible(2)).toBe(false)
    expect(accessor.readSpriteCharacterType(2)).toBe(-1)
    expect(accessor.readSpritePosition(2)).toEqual({ x: 0, y: 0 })
  })

  it('processes CLEAR_ALL_MOVEMENTS across all slots', () => {
    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
      startX: 10,
      startY: 10,
      direction: 3,
      speed: 10,
      distance: 10,
      priority: 0,
    })
    tick(16)
    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 1, {
      startX: 20,
      startY: 20,
      direction: 5,
      speed: 10,
      distance: 10,
      priority: 1,
    })
    tick(16)

    accessor.writeSyncCommand(SyncCommandType.CLEAR_ALL_MOVEMENTS, 0)
    tick(16)

    for (let i = 0; i < 8; i++) {
      expect(accessor.readSpriteIsActive(i)).toBe(false)
      expect(accessor.readSpriteIsVisible(i)).toBe(false)
      expect(accessor.readSpriteCharacterType(i)).toBe(-1)
      expect(accessor.readSpritePosition(i)).toEqual({ x: 0, y: 0 })
    }
    expect(worker.getAllMovementStates()).toEqual([])
  })

  it('completes movement and wraps at screen boundaries', () => {
    accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 3, {
      startX: 1,
      startY: 5,
      direction: 7, // left
      speed: 1, // fast
      distance: 1, // totalDistance=2
      priority: 0,
    })
    tick(16)
    tick(100) // enough to complete movement

    const pos = accessor.readSpritePosition(3)
    expect(accessor.readSpriteIsActive(3)).toBe(false)
    expect(accessor.readSpriteIsVisible(3)).toBe(true)
    expect(accessor.readSpriteRemainingDistance(3)).toBe(0)
    expect((pos?.x ?? 0) > 250 || (pos?.x ?? 0) < 5).toBe(true)
  })
})
