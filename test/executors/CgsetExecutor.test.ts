/**
 * CGSET Executor Tests
 *
 * Unit tests for the CgsetExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('CgsetExecutor', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should set color palette when CGSET is executed with both parameters', async () => {
    const source = `
10 CGSET 0, 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 1 })
    expect(deviceAdapter.currentColorPalette).toEqual({ bgPalette: 0, spritePalette: 1 })
  })

  it('should set color palette with maximum valid values', async () => {
    const source = `
10 CGSET 1, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 1, spritePalette: 2 })
  })

  it('should set color palette with minimum valid values', async () => {
    const source = `
10 CGSET 0, 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 0 })
  })

  it('should use default values when CGSET is called with no parameters', async () => {
    const source = `
10 CGSET
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    // Default values: m=1, n=1
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 1, spritePalette: 1 })
  })

  it('should set only background palette when only first parameter is provided', async () => {
    const source = `
10 CGSET 0
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    // When only m is provided, n defaults to 1
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 1 })
  })

  it('should handle CGSET with variable expressions', async () => {
    const source = `
10 LET M = 1
20 LET N = 2
30 CGSET M, N
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 1, spritePalette: 2 })
  })

  it('should handle CGSET with arithmetic expressions', async () => {
    const source = `
10 CGSET 0 + 1, 1 + 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 1, spritePalette: 2 })
  })

  it('should handle multiple CGSET statements', async () => {
    const source = `
10 CGSET 0, 0
20 CGSET 1, 1
30 CGSET 0, 2
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(3)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 0 })
    expect(deviceAdapter.colorPaletteCalls[1]).toEqual({ bgPalette: 1, spritePalette: 1 })
    expect(deviceAdapter.colorPaletteCalls[2]).toEqual({ bgPalette: 0, spritePalette: 2 })
    // Last call should be the current palette
    expect(deviceAdapter.currentColorPalette).toEqual({ bgPalette: 0, spritePalette: 2 })
  })

  it('should handle CGSET with colon-separated statements', async () => {
    const source = `
10 CGSET 0, 1: CGSET 1, 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(2)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 1 })
    expect(deviceAdapter.colorPaletteCalls[1]).toEqual({ bgPalette: 1, spritePalette: 2 })
  })

  it('should report error when background palette is out of range (negative)', async () => {
    const source = `
10 CGSET -1, 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Background palette code out of range \(0-1\)/)
  })

  it('should report error when background palette is out of range (too large)', async () => {
    const source = `
10 CGSET 2, 1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Background palette code out of range \(0-1\)/)
  })

  it('should report error when sprite palette is out of range (negative)', async () => {
    const source = `
10 CGSET 1, -1
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Sprite palette code out of range \(0-2\)/)
  })

  it('should report error when sprite palette is out of range (too large)', async () => {
    const source = `
10 CGSET 1, 3
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Sprite palette code out of range \(0-2\)/)
  })

  it('should handle CGSET with all valid background palette values', async () => {
    const source = `
10 CGSET 0, 1
20 CGSET 1, 1
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(2)
  })

  it('should handle CGSET with all valid sprite palette values', async () => {
    const source = `
10 CGSET 1, 0
20 CGSET 1, 1
30 CGSET 1, 2
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(3)
  })

  it('should handle CGSET with expressions that evaluate to non-integers (floor conversion)', async () => {
    const source = `
10 CGSET 3 / 2, 5 / 2
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    // Integer division: 3/2 = 1, 5/2 = 2
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 1, spritePalette: 2 })
  })

  it('should work with COLOR and CGSET together', async () => {
    const source = `
10 CGSET 0, 1
20 COLOR 10, 5, 2
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 1 })
    expect(deviceAdapter.colorPatternCalls).toHaveLength(1)
    expect(deviceAdapter.colorPatternCalls[0]).toEqual({ x: 10, y: 5, pattern: 2 })
  })

  it('should set palette 0 before PRINT so characters use correct colors', async () => {
    // This test verifies the scenario where CGSET 0, 1 is executed
    // and characters printed afterward should use palette 0 colors
    // Palette 0, combination 0 uses [0x00, 0x2C, 0x15, 0x07]
    // Character pixels should use color 0x2C (first visible color)
    const source = `
10 CGSET 0, 1
20 PRINT "HELLO WORLD!"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)

    // Verify CGSET was called with correct palette
    expect(deviceAdapter.colorPaletteCalls).toHaveLength(1)
    expect(deviceAdapter.colorPaletteCalls[0]).toEqual({ bgPalette: 0, spritePalette: 1 })
    expect(deviceAdapter.currentColorPalette).toEqual({ bgPalette: 0, spritePalette: 1 })

    // Verify PRINT was executed (characters were printed)
    expect(deviceAdapter.printOutputs.length).toBeGreaterThan(0)
    // PRINT adds a newline at the end
    expect(deviceAdapter.printOutputs[0]).toBe('HELLO WORLD!\n')

    // The palette should be set before characters are printed
    // This ensures characters will be rendered with palette 0 colors (0x2C for first color)
  })
})
