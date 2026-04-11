import { describe, expect, it } from 'vitest'

import { TestProgram } from '../../integration/TestProgram'

describe('printable-area program', () => {
  it('runs successfully with VIEW, BG overwrite, and sprite definitions', async () => {
    const tp = TestProgram.fromSample('printableArea').withBgData('layerBox')

    await tp.run()

    tp.expectSuccess()

    // The program fills rows 0-23 with CHR$(255) blocks, then VIEW overwrites
    // with BG box frame (CHR$(254) border). Then LOCATE 12,10 positions cursor.
    // 8 sprites are defined at clockwise boundary positions.

    // Verify sprites are defined at boundary positions.
    //   Sprite 0: (0,0), Sprite 1: (124,0), Sprite 2: (248,0)
    //   Sprite 3: (248,116), Sprite 4: (248,232)
    //   Sprite 5: (124,232), Sprite 6: (0,232), Sprite 7: (0,116)
    const BOUNDARY_SPRITES = [
      { index: 0, x: 0, y: 0, label: 'top-left' },
      { index: 1, x: 124, y: 0, label: 'top-center' },
      { index: 2, x: 248, y: 0, label: 'top-right' },
      { index: 3, x: 248, y: 116, label: 'right-upper' },
      { index: 4, x: 248, y: 232, label: 'bottom-right' },
      { index: 5, x: 124, y: 232, label: 'bottom-center' },
      { index: 6, x: 0, y: 232, label: 'bottom-left' },
      { index: 7, x: 0, y: 116, label: 'left-center' },
    ] as const

    BOUNDARY_SPRITES.forEach(({ index, x, y }) => {
      const sprite = tp.getSpriteState(index)
      expect(sprite).not.toBeNull()
      expect(sprite!.x).toEqual(x)
      expect(sprite!.y).toEqual(y)
      expect(sprite!.visible).toBe(true)
    })
  })
})
