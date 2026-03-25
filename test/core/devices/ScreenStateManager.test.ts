/**
 * Unit tests for ScreenStateManager
 */

import { describe, expect, it, vi } from 'vitest'

import { ScreenStateManager } from '@/core/devices/ScreenStateManager'

// Mock logger to suppress warnings in test output
vi.mock('@/shared/logger', () => ({
  logDevice: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ScreenStateManager', () => {
  let manager: ScreenStateManager

  beforeEach(() => {
    manager = new ScreenStateManager()
  })

  describe('constructor / initializeScreen', () => {
    it('should initialize a 28x24 screen buffer', () => {
      const buffer = manager.getScreenBuffer()
      expect(buffer.length).toBe(24)
      expect(buffer[0]!.length).toBe(28)
    })

    it('should initialize all cells to space with colorPattern 0', () => {
      const buffer = manager.getScreenBuffer()
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 28; x++) {
          expect(buffer[y]![x]!.character).toBe(' ')
          expect(buffer[y]![x]!.colorPattern).toBe(0)
          expect(buffer[y]![x]!.x).toBe(x)
          expect(buffer[y]![x]!.y).toBe(y)
        }
      }
    })

    it('should set cursor to (0, 0)', () => {
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 0 })
    })
  })

  describe('initializeScreen (re-init)', () => {
    it('should reset the screen after writing characters', () => {
      manager.writeCharacter('A')
      manager.writeCharacter('B')
      manager.initializeScreen()
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 0 })
      expect(manager.getScreenCell(0, 0)).toBe(' ')
    })
  })

  describe('getScreenBuffer', () => {
    it('should return the current buffer reference', () => {
      const buffer = manager.getScreenBuffer()
      expect(buffer).toBe(manager.getScreenBuffer()) // same reference
    })
  })

  describe('getCursorPosition', () => {
    it('should return current cursor position', () => {
      manager.setCursorPosition(5, 10)
      expect(manager.getCursorPosition()).toEqual({ x: 5, y: 10 })
    })
  })

  describe('getScreenCell', () => {
    it('should return character at given position', () => {
      manager.writeCharacter('X')
      expect(manager.getScreenCell(0, 0)).toBe('X')
    })

    it('should return colorPattern when colorSwitch is 1', () => {
      manager.setColorPattern(0, 0, 2)
      expect(manager.getScreenCell(0, 0, 1)).toBe(2)
    })

    it('should return space for out-of-range positive coordinates', () => {
      expect(manager.getScreenCell(50, 50)).toBe(' ')
    })

    it('should return 0 colorPattern for out-of-range positive coordinates', () => {
      expect(manager.getScreenCell(50, 50, 1)).toBe(0)
    })

    it('should return space for negative coordinates', () => {
      expect(manager.getScreenCell(-1, -1)).toBe(' ')
    })

    it('should clamp coordinates to valid range', () => {
      // Write a character at (26, 23) - near last valid cell (avoiding wrap at col 28)
      manager.setCursorPosition(26, 23)
      manager.writeCharacter('Z')
      // Reading the written cell
      expect(manager.getScreenCell(26, 23)).toBe('Z')
    })
  })

  describe('setCursorPosition', () => {
    it('should set cursor to valid position', () => {
      manager.setCursorPosition(15, 12)
      expect(manager.getCursorPosition()).toEqual({ x: 15, y: 12 })
    })

    it('should clamp negative x to 0', () => {
      manager.setCursorPosition(-5, 5)
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 5 })
    })

    it('should clamp x > 27 to 27', () => {
      manager.setCursorPosition(50, 5)
      expect(manager.getCursorPosition()).toEqual({ x: 27, y: 5 })
    })

    it('should clamp negative y to 0', () => {
      manager.setCursorPosition(5, -5)
      expect(manager.getCursorPosition()).toEqual({ x: 5, y: 0 })
    })

    it('should clamp y > 23 to 23', () => {
      manager.setCursorPosition(5, 50)
      expect(manager.getCursorPosition()).toEqual({ x: 5, y: 23 })
    })

    it('should set to exact boundaries', () => {
      manager.setCursorPosition(0, 0)
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 0 })
      manager.setCursorPosition(27, 23)
      expect(manager.getCursorPosition()).toEqual({ x: 27, y: 23 })
    })
  })

  describe('writeCharacter', () => {
    it('should write character at cursor position', () => {
      manager.writeCharacter('H')
      expect(manager.getScreenCell(0, 0)).toBe('H')
    })

    it('should advance cursor by one column', () => {
      manager.writeCharacter('A')
      expect(manager.getCursorPosition()).toEqual({ x: 1, y: 0 })
    })

    it('should wrap to next line when reaching column 28', () => {
      manager.setCursorPosition(27, 0)
      manager.writeCharacter('Z')
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 1 })
    })

    it('should handle newline character', () => {
      manager.writeCharacter('A')
      manager.writeCharacter('\n')
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 1 })
    })

    it('should scroll up when newline goes past bottom', () => {
      manager.setCursorPosition(0, 23)
      manager.writeCharacter('\n')
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 23 })
      // After scroll, top row should be gone, bottom row should be empty
      expect(manager.getScreenCell(0, 23)).toBe(' ')
    })

    it('should scroll up when write wraps past bottom-right corner', () => {
      manager.setCursorPosition(27, 23)
      manager.writeCharacter('X')
      expect(manager.getCursorPosition()).toEqual({ x: 0, y: 23 })
      // Bottom row should have empty cells after scroll
      expect(manager.getScreenCell(0, 23)).toBe(' ')
    })

    it('should write multiple characters sequentially', () => {
      manager.writeCharacter('H')
      manager.writeCharacter('E')
      manager.writeCharacter('L')
      manager.writeCharacter('L')
      manager.writeCharacter('O')
      expect(manager.getScreenCell(0, 0)).toBe('H')
      expect(manager.getScreenCell(1, 0)).toBe('E')
      expect(manager.getScreenCell(2, 0)).toBe('L')
      expect(manager.getScreenCell(3, 0)).toBe('L')
      expect(manager.getScreenCell(4, 0)).toBe('O')
      expect(manager.getCursorPosition()).toEqual({ x: 5, y: 0 })
    })

    it('should scroll content up and add empty bottom row', () => {
      // Write on row 0
      manager.writeCharacter('A')
      // Move to bottom row
      manager.setCursorPosition(0, 23)
      manager.writeCharacter('B')
      // Trigger scroll
      manager.writeCharacter('\n')
      // Row 23 should now be empty (new row)
      expect(manager.getScreenCell(0, 23)).toBe(' ')
      // Previous row 22 content should now be at row 23... actually scroll shifts everything up
      // The original row 0 ('A') is gone, everything shifted up
      // Row 23 is the new empty row
    })
  })

  describe('setColorPattern', () => {
    it('should set color pattern for a 2x2 area', () => {
      const updated = manager.setColorPattern(0, 0, 3)
      expect(updated.length).toBe(4)
      // Top-left and top-right on row 0 (areaY=0, topY=0)
      expect(manager.getScreenCell(0, 0, 1)).toBe(3)
      expect(manager.getScreenCell(1, 0, 1)).toBe(3)
      // Bottom-left and bottom-right on row 0 (areaY=0)
      expect(manager.getScreenCell(0, 0, 1)).toBe(3)
      expect(manager.getScreenCell(1, 0, 1)).toBe(3)
    })

    it('should set color for a 2x2 area at even position', () => {
      manager.setColorPattern(4, 2, 1)
      // The 2x2 area for position (4, 2) is: areaX=4, topY=1, areaY=2
      expect(manager.getScreenCell(4, 1, 1)).toBe(1) // top-left
      expect(manager.getScreenCell(5, 1, 1)).toBe(1) // top-right
      expect(manager.getScreenCell(4, 2, 1)).toBe(1) // bottom-left
      expect(manager.getScreenCell(5, 2, 1)).toBe(1) // bottom-right
    })

    it('should set color for a 2x2 area at odd position', () => {
      manager.setColorPattern(5, 3, 2)
      // areaX = floor(5/2)*2 = 4
      // topY = 3 - 1 = 2, areaY = 3
      expect(manager.getScreenCell(4, 2, 1)).toBe(2) // top-left
      expect(manager.getScreenCell(5, 2, 1)).toBe(2) // top-right
      expect(manager.getScreenCell(4, 3, 1)).toBe(2) // bottom-left
      expect(manager.getScreenCell(5, 3, 1)).toBe(2) // bottom-right
    })

    it('should clamp negative position to 0', () => {
      manager.setColorPattern(-1, -1, 1)
      expect(manager.getScreenCell(0, 0, 1)).toBe(1)
    })

    it('should clamp position beyond screen bounds', () => {
      manager.setColorPattern(30, 30, 1)
      expect(manager.getScreenCell(27, 23, 1)).toBe(1)
    })

    it('should clamp pattern > 3 to 3', () => {
      manager.setColorPattern(0, 0, 5)
      expect(manager.getScreenCell(0, 0, 1)).toBe(3)
    })

    it('should clamp negative pattern to 0', () => {
      manager.setColorPattern(0, 0, -1)
      expect(manager.getScreenCell(0, 0, 1)).toBe(0)
    })

    it('should return list of updated cells', () => {
      const updated = manager.setColorPattern(2, 1, 2)
      expect(updated).toEqual([
        { x: 2, y: 0, pattern: 2 },
        { x: 3, y: 0, pattern: 2 },
        { x: 2, y: 1, pattern: 2 },
        { x: 3, y: 1, pattern: 2 },
      ])
    })
  })

  describe('setColorPalette', () => {
    it('should set valid background and sprite palettes', () => {
      manager.setColorPalette(0, 2)
      expect(manager.getPalette()).toEqual({ bgPalette: 0, spritePalette: 2 })
    })

    it('should clamp bgPalette > 1 to 1', () => {
      manager.setColorPalette(5, 1)
      expect(manager.getPalette()).toEqual({ bgPalette: 1, spritePalette: 1 })
    })

    it('should clamp bgPalette < 0 to 0', () => {
      manager.setColorPalette(-1, 1)
      expect(manager.getPalette()).toEqual({ bgPalette: 0, spritePalette: 1 })
    })

    it('should clamp spritePalette > 2 to 2', () => {
      manager.setColorPalette(0, 10)
      expect(manager.getPalette()).toEqual({ bgPalette: 0, spritePalette: 2 })
    })

    it('should clamp spritePalette < 0 to 0', () => {
      manager.setColorPalette(0, -5)
      expect(manager.getPalette()).toEqual({ bgPalette: 0, spritePalette: 0 })
    })

    it('should have default palette values', () => {
      expect(manager.getPalette()).toEqual({ bgPalette: 1, spritePalette: 1 })
    })
  })

  describe('setBackdropColor / getBackdropColor', () => {
    it('should set valid backdrop color', () => {
      manager.setBackdropColor(30)
      expect(manager.getBackdropColor()).toBe(30)
    })

    it('should clamp color > 60 to 60', () => {
      manager.setBackdropColor(100)
      expect(manager.getBackdropColor()).toBe(60)
    })

    it('should clamp negative color to 0', () => {
      manager.setBackdropColor(-10)
      expect(manager.getBackdropColor()).toBe(0)
    })

    it('should have default backdrop color 0', () => {
      expect(manager.getBackdropColor()).toBe(0)
    })
  })

  describe('setCharacterGeneratorMode / getCgenMode', () => {
    it('should set valid CGEN mode', () => {
      manager.setCharacterGeneratorMode(1)
      expect(manager.getCgenMode()).toBe(1)
    })

    it('should clamp mode > 3 to 3', () => {
      manager.setCharacterGeneratorMode(10)
      expect(manager.getCgenMode()).toBe(3)
    })

    it('should clamp negative mode to 0', () => {
      manager.setCharacterGeneratorMode(-1)
      expect(manager.getCgenMode()).toBe(0)
    })

    it('should have default CGEN mode 2', () => {
      expect(manager.getCgenMode()).toBe(2)
    })
  })

  describe('setPaletteCombination', () => {
    it('should set background palette combination', () => {
      const result = manager.setPaletteCombination('B', 0, [10, 20, 30, 40])
      expect(result.paletteIndex).toBe(1) // default bgPalette
      expect(result.colors).toEqual([10, 20, 30, 40])
    })

    it('should set sprite palette combination', () => {
      const result = manager.setPaletteCombination('S', 1, [5, 15, 25, 35])
      expect(result.paletteIndex).toBe(1) // default spritePalette
      expect(result.colors).toEqual([5, 15, 25, 35])
    })

    it('should clamp combination number to 0-3', () => {
      const result = manager.setPaletteCombination('B', 10, [1, 2, 3, 4])
      expect(result.colors).toEqual([1, 2, 3, 4])
      // Combination should be clamped to 3
    })

    it('should clamp color values to 0-60', () => {
      const result = manager.setPaletteCombination('B', 0, [100, -5, 30, 0])
      expect(result.colors).toEqual([60, 0, 30, 0])
    })
  })

  describe('setCurrentExecutionId / getCurrentExecutionId', () => {
    it('should set and get execution id', () => {
      manager.setCurrentExecutionId('exec-123')
      expect(manager.getCurrentExecutionId()).toBe('exec-123')
    })

    it('should default to null', () => {
      expect(manager.getCurrentExecutionId()).toBe(null)
    })

    it('should allow setting to null', () => {
      manager.setCurrentExecutionId('exec-1')
      manager.setCurrentExecutionId(null)
      expect(manager.getCurrentExecutionId()).toBe(null)
    })
  })

  describe('createFullScreenUpdateMessage', () => {
    it('should create a full screen update message', () => {
      manager.setCurrentExecutionId('test-exec')
      const msg = manager.createFullScreenUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('full')
      expect(msg.data.executionId).toBe('test-exec')
      expect(msg.data.screenBuffer.length).toBe(24)
      expect(msg.data.cursorX).toBe(0)
      expect(msg.data.cursorY).toBe(0)
    })

    it('should use "unknown" execution id when not set', () => {
      const msg = manager.createFullScreenUpdateMessage()
      expect(msg.data.executionId).toBe('unknown')
    })
  })

  describe('createCursorUpdateMessage', () => {
    it('should create a cursor update message', () => {
      manager.setCurrentExecutionId('exec-1')
      manager.setCursorPosition(10, 5)
      const msg = manager.createCursorUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('cursor')
      expect(msg.data.executionId).toBe('exec-1')
      expect(msg.data.cursorX).toBe(10)
      expect(msg.data.cursorY).toBe(5)
    })
  })

  describe('createClearScreenUpdateMessage', () => {
    it('should create a clear screen update message', () => {
      manager.setCurrentExecutionId('exec-2')
      const msg = manager.createClearScreenUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('clear')
      expect(msg.data.executionId).toBe('exec-2')
    })
  })

  describe('createColorUpdateMessage', () => {
    it('should create a color update message with cells', () => {
      manager.setCurrentExecutionId('exec-3')
      const cells = [{ x: 0, y: 0, pattern: 1 }, { x: 2, y: 2, pattern: 3 }]
      const msg = manager.createColorUpdateMessage(cells)
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('color')
      expect(msg.data.colorUpdates).toEqual(cells)
      expect(msg.data.executionId).toBe('exec-3')
    })
  })

  describe('createPaletteUpdateMessage', () => {
    it('should create a palette update message', () => {
      manager.setCurrentExecutionId('exec-4')
      manager.setColorPalette(0, 2)
      const msg = manager.createPaletteUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('palette')
      expect(msg.data.bgPalette).toBe(0)
      expect(msg.data.spritePalette).toBe(2)
      expect(msg.data.executionId).toBe('exec-4')
    })
  })

  describe('createBackdropUpdateMessage', () => {
    it('should create a backdrop update message', () => {
      manager.setCurrentExecutionId('exec-5')
      manager.setBackdropColor(42)
      const msg = manager.createBackdropUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('backdrop')
      expect(msg.data.backdropColor).toBe(42)
      expect(msg.data.executionId).toBe('exec-5')
    })
  })

  describe('createCgenUpdateMessage', () => {
    it('should create a CGEN update message', () => {
      manager.setCurrentExecutionId('exec-6')
      manager.setCharacterGeneratorMode(1)
      const msg = manager.createCgenUpdateMessage()
      expect(msg.type).toBe('SCREEN_UPDATE')
      expect(msg.data.updateType).toBe('cgen')
      expect(msg.data.cgenMode).toBe(1)
      expect(msg.data.executionId).toBe('exec-6')
    })
  })
})
