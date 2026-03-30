/**
 * Tests for useProgramLibrary composable - import/export operations
 *
 * Covers: importFromFile, exportToFile, and validation/round-trip scenarios.
 *
 * Uses fake-indexeddb to simulate IndexedDB in the test environment.
 */

import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProgramExportFile } from '@/core/interfaces'
import { useProgramLibrary } from '@/features/ide/composables/useProgramLibrary'

// ============================================================================
// Mocks
// ============================================================================

// Mock fileIO to avoid triggering real file downloads during tests
vi.mock('@/shared/utils/fileIO', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const original = (await importOriginal()) as {
    isValidProgramFile: (data: unknown) => data is ProgramExportFile
    loadJsonFile: () => Promise<unknown>
    saveJsonFile: (data: object, filename: string) => Promise<void>
  }
  return {
    isValidProgramFile: original.isValidProgramFile,
    loadJsonFile: original.loadJsonFile,
    saveJsonFile: vi.fn().mockResolvedValue(undefined),
  }
})

// ============================================================================
// Helpers
// ============================================================================

/** Create a valid ProgramExportFile for testing */
function createExportFile(overrides: Partial<ProgramExportFile['program']> = {}): ProgramExportFile {
  return {
    format: 'family-basic-program',
    version: 1,
    program: {
      version: 1,
      id: 'original-file-id',
      name: 'Imported Program',
      code: '10 PRINT "HELLO"',
      bg: {
        format: 'sparse1',
        data: '',
        width: 28 as const,
        height: 21 as const,
      },
      createdAt: 1000,
      updatedAt: 2000,
      ...overrides,
    },
  }
}

/** Delete the test database to ensure isolation */
function deleteDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('fbasic-ide')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
  })
}

// ============================================================================
// Test Suite
// ============================================================================

describe('useProgramLibrary import/export', () => {
  beforeEach(async () => {
    useProgramLibrary().$reset()
    await deleteDatabase()
  })

  afterEach(async () => {
    useProgramLibrary().$reset()
    await deleteDatabase()
  })

  // --------------------------------------------------------------------------
  // importFromFile
  // --------------------------------------------------------------------------

  describe('importFromFile', () => {
    it('imports a valid .fbasic.json file and returns new id', async () => {
      const library = useProgramLibrary()
      const exportFile = createExportFile()

      const id = await library.importFromFile(exportFile)

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id!.length).toBeGreaterThan(0)
    })

    it('creates a new id (not the original file id)', async () => {
      const library = useProgramLibrary()
      const exportFile = createExportFile({ id: 'original-file-id' })

      const id = await library.importFromFile(exportFile)

      expect(id).toBeDefined()
      expect(id).not.toEqual('original-file-id')
    })

    it('preserves program content from the file', async () => {
      const library = useProgramLibrary()
      const exportFile = createExportFile({
        name: 'My Game',
        code: '10 PRINT "WORLD"',
      })

      const id = await library.importFromFile(exportFile)
      const program = await library.getProgram(id!)

      expect(program).toBeDefined()
      expect(program!.name).toEqual('My Game')
      expect(program!.code).toEqual('10 PRINT "WORLD"')
    })

    it('adds imported program to the programs list', async () => {
      const library = useProgramLibrary()
      const exportFile = createExportFile({ name: 'Imported' })

      await library.importFromFile(exportFile)

      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('Imported')
    })

    it('returns null for invalid data (missing format)', async () => {
      const library = useProgramLibrary()

      const id = await library.importFromFile({ version: 1, program: {} })

      expect(id).toBeNull()
    })

    it('returns null for invalid data (null)', async () => {
      const library = useProgramLibrary()

      const id = await library.importFromFile(null)

      expect(id).toBeNull()
    })

    it('returns null for invalid data (wrong format field)', async () => {
      const library = useProgramLibrary()

      const id = await library.importFromFile({
        format: 'other-format',
        version: 1,
        program: { name: 'Test', code: '' },
      })

      expect(id).toBeNull()
    })

    it('returns null for non-object data', async () => {
      const library = useProgramLibrary()

      const id = await library.importFromFile('not an object')

      expect(id).toBeNull()
    })

    it('sets isLoading during import', async () => {
      const library = useProgramLibrary()
      const exportFile = createExportFile()

      const promise = library.importFromFile(exportFile)
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // exportToFile
  // --------------------------------------------------------------------------

  describe('exportToFile', () => {
    it('exports a saved program as .fbasic.json file', async () => {
      const { saveJsonFile } = await import('@/shared/utils/fileIO')
      const library = useProgramLibrary()

      const id = await library.saveProgram({
        version: 1,
        name: 'Export Test',
        code: '10 PRINT "EXPORT"',
        bg: {
          format: 'sparse1',
          data: '',
          width: 28 as const,
          height: 21 as const,
        },
      })

      await library.exportToFile(id)

      expect(saveJsonFile).toHaveBeenCalledTimes(1)
      const callArgs = (saveJsonFile as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(callArgs[1]).toEqual('Export Test.fbasic.json')
    })

    it('exports correct ProgramExportFile structure', async () => {
      const { saveJsonFile } = await import('@/shared/utils/fileIO')
      const library = useProgramLibrary()

      const id = await library.saveProgram({
        version: 1,
        name: 'Structure Test',
        code: '20 PRINT "STRUCT"',
        bg: {
          format: 'sparse1',
          data: '0,0,65,1;',
          width: 28 as const,
          height: 21 as const,
        },
      })

      await library.exportToFile(id)

      const savedData = (saveJsonFile as ReturnType<typeof vi.fn>).mock.calls[0]![0] as ProgramExportFile
      expect(savedData.format).toEqual('family-basic-program')
      expect(savedData.version).toEqual(1)
      expect(savedData.program.name).toEqual('Structure Test')
      expect(savedData.program.code).toEqual('20 PRINT "STRUCT"')
      expect(savedData.program.bg.data).toEqual('0,0,65,1;')
      expect(savedData.program.id).toEqual(id)
    })

    it('throws ProgramNotFoundError for non-existent id', async () => {
      const library = useProgramLibrary()

      await expect(library.exportToFile('ghost-id')).rejects.toThrow()
      expect(library.error.value).toBeDefined()
    })

    it('sets isLoading during export', async () => {
      const library = useProgramLibrary()

      const id = await library.saveProgram({
        version: 1,
        name: 'Loading Test',
        code: '10 TEST',
        bg: {
          format: 'sparse1',
          data: '',
          width: 28 as const,
          height: 21 as const,
        },
      })

      const promise = library.exportToFile(id)
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Round-trip
  // --------------------------------------------------------------------------

  describe('import-export round-trip', () => {
    it('program can be imported then exported with same content', async () => {
      const { saveJsonFile } = await import('@/shared/utils/fileIO')
      const library = useProgramLibrary()

      const originalFile = createExportFile({
        name: 'Round Trip',
        code: '30 PRINT "ROUND TRIP"',
        bg: {
          format: 'sparse1',
          data: '1,1,66,2;',
          width: 28 as const,
          height: 21 as const,
        },
      })

      // Import
      const importedId = await library.importFromFile(originalFile)
      expect(importedId).toBeDefined()

      // Export
      await library.exportToFile(importedId!)

      // Verify exported content matches original program data
      const exported = (saveJsonFile as ReturnType<typeof vi.fn>).mock.calls[0]![0] as ProgramExportFile
      expect(exported.program.name).toEqual('Round Trip')
      expect(exported.program.code).toEqual('30 PRINT "ROUND TRIP"')
      expect(exported.program.bg.data).toEqual('1,1,66,2;')
      // The id should be the new library id, not the original file id
      expect(exported.program.id).toEqual(importedId)
      expect(exported.program.id).not.toEqual('original-file-id')
    })
  })
})
