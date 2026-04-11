// @vitest-environment jsdom
/**
 * Tests for useProgramStore composable
 */

import type * as VueUse from '@vueuse/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { ProgramData } from '@/core/types/program-types'
import { createEmptyGrid } from '@/features/bg-editor/composables/useBgGrid'

/** Delay for VueUse's useLocalStorage async sync to flush */
const LOCAL_STORAGE_SYNC_DELAY_MS = 50

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

// Mock useProgramLibrary module
const mockSaveProgram = vi.fn().mockResolvedValue('library-id-123')
const mockImportFromFile = vi.fn().mockResolvedValue('library-import-id')

vi.mock('@/features/ide/composables/useProgramLibrary', () => ({
  useProgramLibrary: () => ({
    programs: { value: [] },
    isLoading: { value: false },
    error: { value: null },
    isInitialized: { value: false },
    listPrograms: vi.fn(),
    getProgram: vi.fn(),
    saveProgram: mockSaveProgram,
    deleteProgram: vi.fn(),
    renameProgram: vi.fn(),
    importFromFile: mockImportFromFile,
    exportToFile: vi.fn(),
    $reset: vi.fn(),
  }),
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

  it('should update name and mark dirty', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    store.setName('Twinkle Star')

    expect(store.programName).toBe('Twinkle Star')
    expect(store.isDirty.value).toBe(true)
  })

  it('should not throw or mutate state when setName is called with null current program', async () => {
    vi.resetModules()

    const controlledRef = ref<ProgramData | null>(null)

    vi.doMock('@vueuse/core', async (importOriginal) => {
      const actual = await importOriginal<typeof VueUse>()
      return {
        ...actual,
        useLocalStorage: vi.fn().mockReturnValue(controlledRef),
      }
    })

    const { useProgramStore } = await import(
      '@/features/ide/composables/useProgramStore'
    )
    const store = useProgramStore()

    // ensureProgram() ran and created a program via newProgram().
    // Reset the controlled ref to null to exercise the guard.
    controlledRef.value = null

    expect(() => store.setName('Test Name')).not.toThrow()
    expect(store.isDirty.value).toBe(false)
    expect(store.programName).toBe('Untitled')

    // Restore the original @vueuse/core module so subsequent tests use real useLocalStorage
    vi.doUnmock('@vueuse/core')
    vi.resetModules()
  })

  it('should persist name change to localStorage', async () => {
    const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
    const store = useProgramStore()

    store.setName('Twinkle Star')

    // Wait for VueUse's useLocalStorage to sync
    await new Promise((resolve) => setTimeout(resolve, LOCAL_STORAGE_SYNC_DELAY_MS))

    const stored = localStorage.getItem('program:current')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!) as ProgramData
    expect(parsed.name).toBe('Twinkle Star')
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
    await new Promise((resolve) => setTimeout(resolve, LOCAL_STORAGE_SYNC_DELAY_MS))

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

  // --------------------------------------------------------------------------
  // Library integration
  // --------------------------------------------------------------------------

  describe('library integration', () => {
    it('should save to library on save()', async () => {
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')
      const store = useProgramStore()

      const testProgram: ProgramData = {
        version: 1,
        id: 'lib-save-test-id',
        name: 'Library Save Test',
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

      await store.save()

      expect(mockSaveProgram).toHaveBeenCalledTimes(1)
      // Verify saveProgram was called with the program data
      const savedData = mockSaveProgram.mock.calls[0]![0] as ProgramData
      expect(savedData.id).toEqual('lib-save-test-id')
      expect(savedData.name).toEqual('Library Save Test')
    })

    it('should import to library on open() with valid file', async () => {
      const { isValidProgramFile, loadJsonFile } = await import('@/shared/utils/fileIO')
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      // Mock valid file load
      const mockFileData = {
        format: 'family-basic-program',
        version: 1,
        program: {
          version: 1,
          id: 'file-id',
          name: 'Opened Program',
          code: '10 PRINT "OPENED"',
          bg: { format: 'sparse1', data: '', width: 28, height: 21 },
          createdAt: 1000,
          updatedAt: 2000,
        },
      }
      vi.mocked(loadJsonFile).mockResolvedValueOnce(mockFileData)
      vi.mocked(isValidProgramFile).mockReturnValueOnce(true)

      const store = useProgramStore()
      const success = await store.open()

      expect(success).toBe(true)
      expect(mockImportFromFile).toHaveBeenCalledTimes(1)
      expect(mockImportFromFile).toHaveBeenCalledWith(mockFileData)
    })

    it('should not import to library when open() is cancelled', async () => {
      const { loadJsonFile } = await import('@/shared/utils/fileIO')
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      // Mock cancelled file picker
      vi.mocked(loadJsonFile).mockResolvedValueOnce(null)

      const store = useProgramStore()
      const success = await store.open()

      expect(success).toBe(false)
      expect(mockImportFromFile).not.toHaveBeenCalled()
    })

    it('should not import to library when file is invalid', async () => {
      const { isValidProgramFile, loadJsonFile } = await import('@/shared/utils/fileIO')
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      // Mock invalid file
      vi.mocked(loadJsonFile).mockResolvedValueOnce({ some: 'data' })
      vi.mocked(isValidProgramFile).mockReturnValueOnce(false)

      const store = useProgramStore()
      const success = await store.open()

      expect(success).toBe(false)
      expect(mockImportFromFile).not.toHaveBeenCalled()
    })
  })
})
