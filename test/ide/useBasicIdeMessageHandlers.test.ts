import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  handleScreenUpdateMessage,
  type MessageHandlerContext,
} from '@/features/ide/composables/useBasicIdeMessageHandlers'
import { BACKGROUND_PALETTES, SPRITE_PALETTES } from '@/shared/data/palette'

type PaletteSnapshot = number[][][]
type RuntimePalettes = number[][][]

function clonePalettes(source: number[][][]): PaletteSnapshot {
  return source.map((palette) => palette.map((combination) => [...combination]))
}

function restorePalettes(target: RuntimePalettes, snapshot: PaletteSnapshot): void {
  snapshot.forEach((palette, paletteIndex) => {
    palette.forEach((combination, combinationIndex) => {
      target[paletteIndex]![combinationIndex] = [...combination]
    })
  })
}

function createContext(scheduleRender: () => void, invalidateBackgroundBuffer?: () => void): MessageHandlerContext {
  return {
    output: ref([]),
    errors: ref([]),
    debugOutput: ref(''),
    screenBuffer: ref([]),
    cursorX: ref(0),
    cursorY: ref(0),
    bgPalette: ref(1),
    webWorkerManager: {
      pendingMessages: new Map(),
    } as MessageHandlerContext['webWorkerManager'],
    scheduleRender,
    invalidateBackgroundBuffer,
  }
}

describe('useBasicIdeMessageHandlers palette combination updates', () => {
  let bgSnapshot: PaletteSnapshot
  let spriteSnapshot: PaletteSnapshot

  beforeEach(() => {
    bgSnapshot = clonePalettes(BACKGROUND_PALETTES)
    spriteSnapshot = clonePalettes(SPRITE_PALETTES)
  })

  afterEach(() => {
    restorePalettes(BACKGROUND_PALETTES, bgSnapshot)
    restorePalettes(SPRITE_PALETTES, spriteSnapshot)
  })

  it('applies background palette-combination update and schedules render', () => {
    const scheduleRender = vi.fn()
    const context = createContext(scheduleRender)

    handleScreenUpdateMessage(
      {
        type: 'SCREEN_UPDATE',
        id: 'test-bg-palette',
        timestamp: Date.now(),
        data: {
          executionId: 'exec-1',
          updateType: 'palette-combination',
          paletteTarget: 'B',
          paletteIndex: 1,
          paletteCombination: 2,
          paletteColors: [60, 10, 20, 30],
          timestamp: Date.now(),
        },
      } as never,
      context
    )

    expect(BACKGROUND_PALETTES[1][2]).toEqual([60, 10, 20, 30])
    expect(scheduleRender).toHaveBeenCalledTimes(1)
  })

  it('applies sprite palette-combination update and schedules render', () => {
    const scheduleRender = vi.fn()
    const context = createContext(scheduleRender)

    handleScreenUpdateMessage(
      {
        type: 'SCREEN_UPDATE',
        id: 'test-sprite-palette',
        timestamp: Date.now(),
        data: {
          executionId: 'exec-2',
          updateType: 'palette-combination',
          paletteTarget: 'S',
          paletteIndex: 2,
          paletteCombination: 3,
          paletteColors: [1, 2, 3, 4],
          timestamp: Date.now(),
        },
      } as never,
      context
    )

    expect(SPRITE_PALETTES[2][3]).toEqual([1, 2, 3, 4])
    expect(scheduleRender).toHaveBeenCalledTimes(1)
  })

  it('invalidates background buffer on palette-combination update (regression #489)', () => {
    const scheduleRender = vi.fn()
    const invalidateBackgroundBuffer = vi.fn()
    const context = createContext(scheduleRender, invalidateBackgroundBuffer)

    handleScreenUpdateMessage(
      {
        type: 'SCREEN_UPDATE',
        id: 'test-invalidate-bg',
        timestamp: Date.now(),
        data: {
          executionId: 'exec-3',
          updateType: 'palette-combination',
          paletteTarget: 'B',
          paletteIndex: 0,
          paletteCombination: 1,
          paletteColors: [10, 20, 30, 40],
          timestamp: Date.now(),
        },
      } as never,
      context
    )

    expect(invalidateBackgroundBuffer).toHaveBeenCalledTimes(1)
    expect(scheduleRender).toHaveBeenCalledTimes(1)
  })
})
