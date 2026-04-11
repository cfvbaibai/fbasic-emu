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
    const sprite0 = tp.getSpriteState(0)
    expect(sprite0).not.toBeNull()
    expect(sprite0!.x).toEqual(0)
    expect(sprite0!.y).toEqual(0)
    expect(sprite0!.visible).toBe(true)

    const sprite1 = tp.getSpriteState(1)
    expect(sprite1).not.toBeNull()
    expect(sprite1!.x).toEqual(124)
    expect(sprite1!.y).toEqual(0)
    expect(sprite1!.visible).toBe(true)

    const sprite2 = tp.getSpriteState(2)
    expect(sprite2).not.toBeNull()
    expect(sprite2!.x).toEqual(248)
    expect(sprite2!.y).toEqual(0)
    expect(sprite2!.visible).toBe(true)

    const sprite3 = tp.getSpriteState(3)
    expect(sprite3).not.toBeNull()
    expect(sprite3!.x).toEqual(248)
    expect(sprite3!.y).toEqual(116)
    expect(sprite3!.visible).toBe(true)

    const sprite4 = tp.getSpriteState(4)
    expect(sprite4).not.toBeNull()
    expect(sprite4!.x).toEqual(248)
    expect(sprite4!.y).toEqual(232)
    expect(sprite4!.visible).toBe(true)

    const sprite5 = tp.getSpriteState(5)
    expect(sprite5).not.toBeNull()
    expect(sprite5!.x).toEqual(124)
    expect(sprite5!.y).toEqual(232)
    expect(sprite5!.visible).toBe(true)

    const sprite6 = tp.getSpriteState(6)
    expect(sprite6).not.toBeNull()
    expect(sprite6!.x).toEqual(0)
    expect(sprite6!.y).toEqual(232)
    expect(sprite6!.visible).toBe(true)

    const sprite7 = tp.getSpriteState(7)
    expect(sprite7).not.toBeNull()
    expect(sprite7!.x).toEqual(0)
    expect(sprite7!.y).toEqual(116)
    expect(sprite7!.visible).toBe(true)
  })
})
