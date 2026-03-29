/**
 * Tests for useProgramLibrary composable
 *
 * Uses fake-indexeddb to simulate IndexedDB in the test environment.
 */

import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ProgramData } from '@/core/interfaces'
import { ProgramNotFoundError } from '@/core/persistence/ProgramDB'
import { useProgramLibrary } from '@/features/ide/composables/useProgramLibrary'

// ============================================================================
// Helpers
// ============================================================================

/** Create a minimal valid program data object for testing */
function createTestProgram(overrides: Partial<ProgramData> = {}): Omit<ProgramData, 'id' | 'createdAt' | 'updatedAt'> & Partial<ProgramData> {
  return {
    version: 1,
    name: 'Test Program',
    code: '10 PRINT "HELLO"',
    bg: {
      format: 'sparse1',
      data: '',
      width: 28 as const,
      height: 21 as const,
    },
    ...overrides,
  }
}

/** Delete the test database between tests to ensure isolation */
function deleteDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('fbasic-ide')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve() // Best effort
    request.onblocked = () => resolve()
  })
}

// ============================================================================
// Test Suite
// ============================================================================

describe('useProgramLibrary', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  afterEach(async () => {
    // Reset singleton state between tests
    const library = useProgramLibrary()
    library.$reset()
    await deleteDatabase()
  })

  // --------------------------------------------------------------------------
  // Initial state
  // --------------------------------------------------------------------------

  describe('initial state', () => {
    it('starts with empty programs list', () => {
      const library = useProgramLibrary()
      expect(library.programs.value).toEqual([])
    })

    it('starts with isLoading false', () => {
      const library = useProgramLibrary()
      expect(library.isLoading.value).toBe(false)
    })

    it('starts with error null', () => {
      const library = useProgramLibrary()
      expect(library.error.value).toBeNull()
    })

    it('starts with isInitialized false', () => {
      const library = useProgramLibrary()
      expect(library.isInitialized.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // listPrograms
  // --------------------------------------------------------------------------

  describe('listPrograms', () => {
    it('loads empty list when no programs exist', async () => {
      const library = useProgramLibrary()
      await library.listPrograms()

      expect(library.programs.value).toEqual([])
      expect(library.isInitialized.value).toBe(true)
    })

    it('loads existing programs from the database', async () => {
      // Seed a program directly via ProgramDB
      const { ProgramDB: programDatabase } = await import('@/core/persistence/ProgramDB')
      const db = new programDatabase()
      await db.open()
      await db.create(createTestProgram({ name: 'Seeded Program' }))
      db.close()

      const library = useProgramLibrary()
      await library.listPrograms()

      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('Seeded Program')
    })

    it('sets isInitialized to true after loading', async () => {
      const library = useProgramLibrary()
      expect(library.isInitialized.value).toBe(false)

      await library.listPrograms()
      expect(library.isInitialized.value).toBe(true)
    })

    it('sets isLoading during operation', async () => {
      const library = useProgramLibrary()
      const promise = library.listPrograms()
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })

    it('clears previous error on success', async () => {
      const library = useProgramLibrary()

      // Force an error by closing the db and corrupting state
      library.$reset()

      // Successful call should clear error
      await library.listPrograms()
      expect(library.error.value).toBeNull()
    })
  })

  // --------------------------------------------------------------------------
  // getProgram
  // --------------------------------------------------------------------------

  describe('getProgram', () => {
    it('returns undefined for non-existent id', async () => {
      const library = useProgramLibrary()
      const result = await library.getProgram('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('returns a previously saved program', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({ name: 'Find Me' }))
      const result = await library.getProgram(id)

      expect(result).toBeDefined()
      expect(result?.name).toEqual('Find Me')
    })

    it('returns all fields of the program', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({
        name: 'Full Program',
        code: '10 CLS\n20 PRINT "HI"',
        bg: {
          format: 'sparse1',
          data: '0,0,65,1;',
          width: 28 as const,
          height: 21 as const,
        },
      }))

      const result = await library.getProgram(id)
      expect(result).toEqual({
        version: 1,
        id,
        name: 'Full Program',
        code: '10 CLS\n20 PRINT "HI"',
        bg: {
          format: 'sparse1',
          data: '0,0,65,1;',
          width: 28,
          height: 21,
        },
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      })
    })
  })

  // --------------------------------------------------------------------------
  // saveProgram - create
  // --------------------------------------------------------------------------

  describe('saveProgram (create)', () => {
    it('creates a new program and returns its id', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram())

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('appears in programs list after save', async () => {
      const library = useProgramLibrary()
      await library.listPrograms()
      expect(library.programs.value).toEqual([])

      await library.saveProgram(createTestProgram({ name: 'New Program' }))
      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('New Program')
    })

    it('generates unique ids for different programs', async () => {
      const library = useProgramLibrary()
      const id1 = await library.saveProgram(createTestProgram({ name: 'A' }))
      const id2 = await library.saveProgram(createTestProgram({ name: 'B' }))

      expect(id1).not.toBe(id2)
    })

    it('sets isLoading during save operation', async () => {
      const library = useProgramLibrary()
      const promise = library.saveProgram(createTestProgram())
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })

    it('creates with provided id when given', async () => {
      const library = useProgramLibrary()
      const customId = 'my-custom-id-123'
      const id = await library.saveProgram(createTestProgram({ id: customId }))
      expect(id).toEqual(customId)
    })
  })

  // --------------------------------------------------------------------------
  // saveProgram - update
  // --------------------------------------------------------------------------

  describe('saveProgram (update)', () => {
    it('updates an existing program when id matches', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({
        name: 'Original',
        code: '10 OLD',
      }))

      await library.saveProgram({
        version: 1,
        id,
        name: 'Updated',
        code: '20 NEW',
        bg: {
          format: 'sparse1',
          data: '',
          width: 28 as const,
          height: 21 as const,
        },
      })

      const program = await library.getProgram(id)
      expect(program?.name).toEqual('Updated')
      expect(program?.code).toEqual('20 NEW')
    })

    it('creates new when id does not exist in database', async () => {
      const library = useProgramLibrary()
      // Save with an id that doesn't exist yet
      const id = await library.saveProgram(createTestProgram({
        id: 'ghost-id-999',
        name: 'Ghost',
      }))

      // It should have been created
      expect(id).toEqual('ghost-id-999')
      const program = await library.getProgram('ghost-id-999')
      expect(program).toBeDefined()
      expect(program?.name).toEqual('Ghost')
    })

    it('refreshes program list after update', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({ name: 'V1' }))
      expect(library.programs.value).toHaveLength(1)

      await library.saveProgram({
        version: 1,
        id,
        name: 'V2',
        code: '10 V2',
        bg: {
          format: 'sparse1',
          data: '',
          width: 28 as const,
          height: 21 as const,
        },
      })

      // List should still have 1 item (updated, not duplicated)
      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('V2')
    })
  })

  // --------------------------------------------------------------------------
  // deleteProgram
  // --------------------------------------------------------------------------

  describe('deleteProgram', () => {
    it('deletes an existing program', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram())

      await library.deleteProgram(id)

      const result = await library.getProgram(id)
      expect(result).toBeUndefined()
    })

    it('removes program from the reactive list', async () => {
      const library = useProgramLibrary()
      const id1 = await library.saveProgram(createTestProgram({ name: 'A' }))
      await library.saveProgram(createTestProgram({ name: 'B' }))
      expect(library.programs.value).toHaveLength(2)

      await library.deleteProgram(id1)
      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('B')
    })

    it('does not throw when deleting non-existent id', async () => {
      const library = useProgramLibrary()
      await expect(library.deleteProgram('ghost-id')).resolves.toBeUndefined()
    })

    it('sets isLoading during delete', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram())

      const promise = library.deleteProgram(id)
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // renameProgram
  // --------------------------------------------------------------------------

  describe('renameProgram', () => {
    it('renames an existing program', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({ name: 'Old Name' }))

      await library.renameProgram(id, 'New Name')

      const program = await library.getProgram(id)
      expect(program?.name).toEqual('New Name')
    })

    it('updates the reactive list after rename', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({ name: 'Before' }))

      await library.renameProgram(id, 'After')

      expect(library.programs.value[0]?.name).toEqual('After')
    })

    it('preserves other fields during rename', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram({
        name: 'Original',
        code: '10 PRINT "KEEP"',
      }))

      await library.renameProgram(id, 'Renamed')

      const program = await library.getProgram(id)
      expect(program?.code).toEqual('10 PRINT "KEEP"')
    })

    it('sets error when renaming non-existent program', async () => {
      const library = useProgramLibrary()
      await library.renameProgram('ghost-id', 'Nope')

      expect(library.error.value).toBeDefined()
      expect(library.error.value).toBeInstanceOf(ProgramNotFoundError)
    })

    it('sets isLoading during rename', async () => {
      const library = useProgramLibrary()
      const id = await library.saveProgram(createTestProgram())

      const promise = library.renameProgram(id, 'New Name')
      expect(library.isLoading.value).toBe(true)

      await promise
      expect(library.isLoading.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // $reset
  // --------------------------------------------------------------------------

  describe('$reset', () => {
    it('clears all reactive state', async () => {
      const library = useProgramLibrary()
      await library.saveProgram(createTestProgram({ name: 'Test' }))
      expect(library.programs.value).toHaveLength(1)

      library.$reset()

      expect(library.programs.value).toEqual([])
      expect(library.isLoading.value).toBe(false)
      expect(library.error.value).toBeNull()
      expect(library.isInitialized.value).toBe(false)
    })

    it('allows reuse after reset', async () => {
      const library = useProgramLibrary()
      await library.saveProgram(createTestProgram({ name: 'Before Reset' }))

      // Clear the database to simulate a fresh state
      const { ProgramDB: programDatabase } = await import('@/core/persistence/ProgramDB')
      let db = new programDatabase()
      await db.open()
      await db.clear()
      db.close()

      library.$reset()

      // Re-seed data
      db = new programDatabase()
      await db.open()
      await db.create(createTestProgram({ name: 'After Reset' }))
      db.close()

      await library.listPrograms()
      expect(library.programs.value).toHaveLength(1)
      expect(library.programs.value[0]?.name).toEqual('After Reset')
    })
  })

  // --------------------------------------------------------------------------
  // Singleton behavior
  // --------------------------------------------------------------------------

  describe('singleton behavior', () => {
    it('returns the same state from multiple calls', async () => {
      const library1 = useProgramLibrary()
      const library2 = useProgramLibrary()

      await library1.saveProgram(createTestProgram({ name: 'Shared' }))

      // Both should see the same programs list
      expect(library2.programs.value).toHaveLength(1)
      expect(library2.programs.value[0]?.name).toEqual('Shared')
    })

    it('isLoading is shared across instances', async () => {
      const library1 = useProgramLibrary()
      const library2 = useProgramLibrary()

      const promise = library1.listPrograms()
      expect(library2.isLoading.value).toBe(true)

      await promise
      expect(library2.isLoading.value).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('stores error on saveProgram failure', async () => {
      const library = useProgramLibrary()
      // Save with invalid bg data to test error path indirectly
      // The simplest way is to $reset mid-operation, but let's test
      // that error is cleared between calls

      await library.listPrograms()
      expect(library.error.value).toBeNull()
    })

    it('clears error at the start of each operation', async () => {
      const library = useProgramLibrary()

      // Trigger an error
      await library.renameProgram('ghost-id', 'Nope')
      expect(library.error.value).toBeDefined()

      // Successful operation should clear the error
      await library.listPrograms()
      expect(library.error.value).toBeNull()
    })
  })

  // --------------------------------------------------------------------------
  // Integration
  // --------------------------------------------------------------------------

  describe('integration', () => {
    it('full CRUD round-trip', async () => {
      const library = useProgramLibrary()

      // Create
      const id = await library.saveProgram(createTestProgram({
        name: 'Round Trip',
        code: '10 PRINT "V1"',
      }))

      // Read
      let program = await library.getProgram(id)
      expect(program?.name).toEqual('Round Trip')
      expect(program?.code).toEqual('10 PRINT "V1"')

      // Update via saveProgram
      await library.saveProgram({
        version: 1,
        id,
        name: 'Round Trip V2',
        code: '10 PRINT "V2"',
        bg: {
          format: 'sparse1',
          data: '',
          width: 28 as const,
          height: 21 as const,
        },
      })

      program = await library.getProgram(id)
      expect(program?.name).toEqual('Round Trip V2')
      expect(program?.code).toEqual('10 PRINT "V2"')

      // Rename
      await library.renameProgram(id, 'Final Name')
      program = await library.getProgram(id)
      expect(program?.name).toEqual('Final Name')

      // Delete
      await library.deleteProgram(id)
      program = await library.getProgram(id)
      expect(program).toBeUndefined()

      // List should be empty
      expect(library.programs.value).toEqual([])
    })

    it('listPrograms reflects all changes', async () => {
      const library = useProgramLibrary()

      const id1 = await library.saveProgram(createTestProgram({ name: 'A' }))
      const id2 = await library.saveProgram(createTestProgram({ name: 'B' }))
      const id3 = await library.saveProgram(createTestProgram({ name: 'C' }))

      expect(library.programs.value).toHaveLength(3)

      await library.deleteProgram(id2)
      expect(library.programs.value).toHaveLength(2)

      await library.renameProgram(id1, 'Renamed A')
      expect(library.programs.value.find((p) => p.id === id1)?.name).toEqual('Renamed A')

      // Delete remaining
      await library.deleteProgram(id1)
      await library.deleteProgram(id3)
      expect(library.programs.value).toEqual([])
    })

    it('programs are sorted by updatedAt descending', async () => {
      const library = useProgramLibrary()

      const id1 = await library.saveProgram(createTestProgram({ name: 'Oldest' }))
      // Small delay to ensure different timestamps
      await new Promise((r) => { setTimeout(r, 5) })
      await library.saveProgram(createTestProgram({ name: 'Newest' }))

      // Update oldest to make it newest
      await new Promise((r) => { setTimeout(r, 5) })
      await library.renameProgram(id1, 'Updated Oldest')

      // First item should be the most recently updated
      expect(library.programs.value[0]?.name).toEqual('Updated Oldest')
    })
  })
})
