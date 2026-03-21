import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useScreenAnimationLoopRenderOnly } from '@/features/ide/composables/useScreenAnimationLoopRenderOnly'

const { updateAnimatedSpritesMock } = vi.hoisted(() => ({
  updateAnimatedSpritesMock: vi.fn(async () => {}),
}))

vi.mock('@/features/ide/composables/useKonvaScreenRenderer', () => ({
  updateAnimatedSprites: updateAnimatedSpritesMock,
}))

type AccessorStub = {
  readSpriteCharacterType: (actionNumber: number) => number
  readSpriteIsVisible: (actionNumber: number) => boolean
  readSpritePriority: (actionNumber: number) => number
  readSpritePosition: (actionNumber: number) => { x: number; y: number } | null
}

function createIdleAccessor(): AccessorStub {
  return {
    readSpriteCharacterType: () => -1,
    readSpriteIsVisible: () => false,
    readSpritePriority: () => 0,
    readSpritePosition: () => null,
  }
}

function createMovementAccessor(isVisibleRef: { value: boolean }): AccessorStub {
  return {
    readSpriteCharacterType: (actionNumber: number) => (actionNumber === 0 ? 2 : -1),
    readSpriteIsVisible: (actionNumber: number) => actionNumber === 0 && isVisibleRef.value,
    readSpritePriority: () => 0,
    readSpritePosition: (actionNumber: number) => (actionNumber === 0 ? { x: 4, y: 7 } : null),
  }
}

describe('useScreenAnimationLoopRenderOnly', () => {
  const rafCallbacks = new Map<number, FrameRequestCallback>()
  let nextRafId = 1

  beforeEach(() => {
    rafCallbacks.clear()
    nextRafId = 1
    updateAnimatedSpritesMock.mockClear()
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const id = nextRafId++
      rafCallbacks.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      rafCallbacks.delete(id)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function runNextFrame(atMs = performance.now()): Promise<void> {
    const next = rafCallbacks.entries().next()
    if (next.done) {
      throw new Error('No queued requestAnimationFrame callback')
    }

    const [id, callback] = next.value
    rafCallbacks.delete(id)
    await Promise.resolve(callback(atMs))
  }

  it('skips animation updates on idle frames', async () => {
    const stop = useScreenAnimationLoopRenderOnly({
      layers: ref({
        spriteFrontLayer: null,
        spriteBackLayer: null,
      }),
      frontSpriteNodes: ref(new Map()),
      backSpriteNodes: ref(new Map()),
      spritePalette: ref(1),
      sharedDisplayBufferAccessor: createIdleAccessor() as never,
      getPendingStaticRender: () => false,
    })

    await runNextFrame()

    expect(updateAnimatedSpritesMock).not.toHaveBeenCalled()
    stop()
  })

  it('resumes animation updates when movement becomes visible', async () => {
    const isVisible = { value: false }
    const onRenderNeeded = vi.fn()
    const stop = useScreenAnimationLoopRenderOnly({
      layers: ref({
        spriteFrontLayer: null,
        spriteBackLayer: null,
      }),
      frontSpriteNodes: ref(new Map()),
      backSpriteNodes: ref(new Map()),
      spritePalette: ref(1),
      sharedDisplayBufferAccessor: createMovementAccessor(isVisible) as never,
      getPendingStaticRender: () => false,
      onRenderNeeded,
    })

    await runNextFrame()
    expect(updateAnimatedSpritesMock).not.toHaveBeenCalled()

    isVisible.value = true
    await runNextFrame()

    expect(onRenderNeeded).toHaveBeenCalledTimes(1)
    expect(updateAnimatedSpritesMock).toHaveBeenCalledTimes(1)
    stop()
  })

  it('throttles inspector MOVE updates to around 15fps under continuous movement', async () => {
    let x = 0
    const updateInspectorMoveSlots = vi.fn()
    const spriteNode = {
      x: vi.fn(),
      y: vi.fn(),
      destroy: vi.fn(),
    }
    const accessor: AccessorStub = {
      readSpriteCharacterType: (actionNumber: number) => (actionNumber === 0 ? 2 : -1),
      readSpriteIsVisible: (actionNumber: number) => actionNumber === 0,
      readSpritePriority: () => 0,
      readSpritePosition: (actionNumber: number) => {
        if (actionNumber !== 0) return null
        x += 1
        return { x, y: 7 }
      },
    }

    const stop = useScreenAnimationLoopRenderOnly({
      layers: ref({
        spriteFrontLayer: null,
        spriteBackLayer: null,
      }),
      frontSpriteNodes: ref(new Map([[0, spriteNode]])),
      backSpriteNodes: ref(new Map()),
      spritePalette: ref(1),
      sharedDisplayBufferAccessor: accessor as never,
      getPendingStaticRender: () => false,
      updateInspectorMoveSlots,
    })

    for (let frame = 0; frame < 8; frame += 1) {
      await runNextFrame(frame * 16)
    }

    expect(updateInspectorMoveSlots).toHaveBeenCalledTimes(2)
    stop()
  })
})
