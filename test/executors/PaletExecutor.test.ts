/**
 * PALET Executor Tests
 *
 * Unit tests for the PaletExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'

describe('PaletExecutor', () => {
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

  describe('PALET B (backdrop color)', () => {
    it('should set backdrop color when PALET B 0 is executed', async () => {
      const source = `
10 PALET B 0, 15, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(15)
      expect(deviceAdapter.currentBackdropColor).toBe(15)
    })

    it('should set backdrop color using PALETB form (no space)', async () => {
      const source = `
10 PALETB 0, 30, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(30)
      expect(deviceAdapter.currentBackdropColor).toBe(30)
    })

    it('should set backdrop color with maximum valid color code', async () => {
      const source = `
10 PALET B 0, 60, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(60)
    })

    it('should set backdrop color with minimum valid color code', async () => {
      const source = `
10 PALET B 0, 0, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(0)
    })

    it('should set backdrop color with variable expressions', async () => {
      const source = `
10 LET C = 25
20 PALET B 0, C, 0, 0, 0
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(25)
    })

    it('should not set backdrop color when n is not 0', async () => {
      const source = `
10 PALET B 1, 15, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // When n != 0, backdrop color should not be set (only palette colors would be set)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(0)
      expect(deviceAdapter.paletteCombinationCalls).toHaveLength(1)
      expect(deviceAdapter.paletteCombinationCalls[0]).toMatchObject({
        target: 'B',
        paletteIndex: 1,
        combination: 1,
        colors: [15, 0, 0, 0],
      })
    })

    it('should handle multiple PALET B commands', async () => {
      const source = `
10 PALET B 0, 10, 0, 0, 0
20 PALET B 0, 20, 0, 0, 0
30 PALET B 0, 30, 0, 0, 0
40 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(3)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(10)
      expect(deviceAdapter.backdropColorCalls[1]).toBe(20)
      expect(deviceAdapter.backdropColorCalls[2]).toBe(30)
      expect(deviceAdapter.currentBackdropColor).toBe(30)
    })
  })

  describe('PALET S (sprites)', () => {
    it('should parse PALET S statement without errors', async () => {
      const source = `
10 PALET S 0, 15, 20, 25, 30
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      // PALET S doesn't set backdrop color, so no backdrop color calls
      expect(deviceAdapter.backdropColorCalls).toHaveLength(0)
      expect(deviceAdapter.paletteCombinationCalls).toHaveLength(1)
      expect(deviceAdapter.paletteCombinationCalls[0]).toMatchObject({
        target: 'S',
        paletteIndex: 1,
        combination: 0,
        colors: [15, 20, 25, 30],
      })
    })

    it('should parse PALETS statement (no space) without errors', async () => {
      const source = `
10 PALETS 1, 10, 20, 30, 40
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(0)
    })
  })

  describe('Error handling', () => {
    it('should report error for invalid target', async () => {
      const source = `
10 PALET X 0, 15, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toMatch(/PALET/)
    })

    it('should report error for missing arguments', async () => {
      const source = `
10 PALET B 0, 15, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      // Parser error for missing comma/argument
      expect(result.errors[0]?.message).toBeDefined()
    })

    it('should report error for color combination number out of range', async () => {
      const source = `
10 PALET B 4, 15, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toMatch(/Color combination number out of range/)
    })

    it('should report error for color code out of range', async () => {
      const source = `
10 PALET B 0, 61, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toMatch(/Color code out of range/)
    })

    it('should report error for negative color code', async () => {
      const source = `
10 PALET B 0, -1, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toMatch(/Color code out of range/)
    })
  })

  describe('Expression evaluation', () => {
    it('should handle arithmetic expressions in color codes', async () => {
      const source = `
10 PALET B 0, 10+5, 0, 0, 0
20 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(15)
    })

    it('should handle variable expressions in all parameters', async () => {
      const source = `
10 LET N = 0
20 LET C1 = 20
30 LET C2 = 10
40 LET C3 = 5
50 LET C4 = 0
60 PALET B N, C1, C2, C3, C4
70 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.backdropColorCalls).toHaveLength(1)
      expect(deviceAdapter.backdropColorCalls[0]).toBe(20)
    })

    it('should apply palette combination to currently selected sprite palette from CGSET', async () => {
      const source = `
10 CGSET 1, 2
20 PALET S 2, 9, 10, 11, 12
30 END
`
      const result = await interpreter.execute(source)

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(deviceAdapter.paletteCombinationCalls).toHaveLength(1)
      expect(deviceAdapter.paletteCombinationCalls[0]).toMatchObject({
        target: 'S',
        paletteIndex: 2,
        combination: 2,
        colors: [9, 10, 11, 12],
      })
      expect(deviceAdapter.runtimeSpritePalettes[2]?.[2]).toEqual([9, 10, 11, 12])
    })
  })
})
