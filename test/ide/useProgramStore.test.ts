/**
 * Tests for useProgramStore composable
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProgramData } from '@/core/types/program-types'
import { createEmptyGrid } from '@/features/bg-editor/composables/useBgGrid'

// Mock fileIO module
vi.mock('@/shared/utils/fileIO', () => ({
  saveJsonFile: vi.fn().mockResolvedValue(undefined),
  loadJsonFile: vi.fn().mockResolvedValue(null),
  isValidProgramFile: vi.fn().mockReturnValue(false),
}))

// Mock id module
vi.mock('@/shared/utils/id', () => ({
  generateProgramId: vi.fn().mockReturnValue('test-uuid-1234'),
  generateSessionId: vi.fn().mockReturnValue('sess-test1234'),
}))

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useProgramStore', () => {
  it('should create new program on first use', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    expect(store.currentProgram.value).not.toBeNull()
    expect(store.programName).toBe('Untitled')
    expect(store.code).toBe('')
    expect(store.isDirty.value).toBe(false)
  })

  it('should update code and mark dirty', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    store.setCode('10 PRINT "HELLO"')

    expect(store.code).toBe('10 PRINT "HELLO"')
    expect(store.isDirty.value).toBe(true)
  })

  it('should update BG and mark dirty', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    const grid = createEmptyGrid()
    const row = grid[0]
    if (row) {
      row[0] = { charCode: 65, colorPattern: 1 }
    }

    store.setBg(grid)

    const bg = store.bg
    expect(bg[0]?.[0]?.charCode).toBe(65)
    expect(bg[0]?.[0]?.colorPattern).toBe(1)
    expect(store.isDirty.value).toBe(true)
  })

  it('should load program and clear dirty', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    // First make it dirty
    store.setCode('10 PRINT "OLD"')
    expect(store.isDirty.value).toBe(true)

    // Load new program
    const newProgram: ProgramData = {
      version: 1,
      id: 'loaded-program',
      name: 'Loaded Program',
      code: '20 PRINT "NEW"',
      bg: {
        format: 'sparse1',
        data: '',
        width: 28,
        height: 21,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    store.loadProgram(newProgram)

    expect(store.programId).toBe('loaded-program')
    expect(store.programName).toBe('Loaded Program')
    expect(store.code).toBe('20 PRINT "NEW"')
    expect(store.isDirty.value).toBe(false)
  })

  it('should persist to localStorage on change', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    // Load a fresh program to ensure clean state
    const testProgram: ProgramData = {
      version: 1,
      id: 'persist-test-id',
      name: 'Persist Test',
      code: '',
      bg: {
        format: 'sparse1',
        data: '',
        width: 28,
        height: 21,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    store.loadProgram(testProgram)

    store.setCode('10 PRINT "TEST"')

    // Wait for VueUse's useLocalStorage to sync
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Check localStorage was updated (now stores full program object directly)
    const stored = localStorage.getItem('program:current')
    expect(stored).not.toBeNull()

    // Debug: log what's actually stored
    // console.log('Stored value:', stored)

    const parsed = JSON.parse(stored!) as ProgramData
    expect(parsed.code).toBe('10 PRINT "TEST"')
  })

  it('should restore program from localStorage via loadProgram', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    // Pre-populate localStorage with full program object
    const savedProgram: ProgramData = {
      version: 1,
      id: 'saved-id-123',
      name: 'Saved Program',
      code: '30 PRINT "SAVED"',
      bg: {
        format: 'sparse1',
        data: '',
        width: 28,
        height: 21,
      },
      createdAt: 1000,
      updatedAt: 2000,
    }

    localStorage.setItem('program:current', JSON.stringify(savedProgram))

    // Load the program directly (simulating restoration)
    store.loadProgram(savedProgram)

    expect(store.programId).toBe('saved-id-123')
    expect(store.programName).toBe('Saved Program')
    expect(store.code).toBe('30 PRINT "SAVED"')
  })

  it('should call saveJsonFile on save()', async () => {
    const { saveJsonFile } = await import('@/shared/utils/fileIO')
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    // Load a fresh program to ensure clean state
    const testProgram: ProgramData = {
      version: 1,
      id: 'save-test-id',
      name: 'Save Test',
      code: '',
      bg: {
        format: 'sparse1',
        data: '',
        width: 28,
        height: 21,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    store.loadProgram(testProgram)

    store.setCode('10 PRINT "TEST"')
    await store.save()

    expect(saveJsonFile).toHaveBeenCalled()
    expect(store.isDirty.value).toBe(false)
  })
})
