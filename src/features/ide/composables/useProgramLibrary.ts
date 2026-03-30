/**
 * useProgramLibrary composable
 *
 * Wraps the IndexedDB persistence layer (ProgramDB) and exposes program
 * library operations as reactive state and methods.
 *
 * Responsible for:
 * - Listing all programs in the library (reactive)
 * - Getting a single program by id
 * - Saving (creating or updating) a program
 * - Deleting a program
 * - Renaming a program
 * - Importing programs from .fbasic.json files
 * - Exporting programs as .fbasic.json files
 *
 * Complementary to useProgramStore which manages the *current* active program
 * in the editor. This composable manages the *library* of saved programs.
 */

import { readonly, ref, shallowRef } from 'vue'

import { ProgramDB, ProgramNotFoundError } from '@/core/persistence/ProgramDB'
import type { ProgramData, ProgramExportFile } from '@/core/types/program-types'
import { logComposable } from '@/shared/logger'
import { isValidProgramFile, saveJsonFile } from '@/shared/utils/fileIO'

// ============================================================================
// Singleton State
// ============================================================================

/** Shared database instance (lazily opened) */
let dbInstance: ProgramDB | null = null

/** Reactive program list */
const programs = shallowRef<ProgramData[]>([])

/** Whether a library operation is in progress */
const isLoading = ref(false)

/** Last error from a library operation (null when no error) */
const error = ref<Error | null>(null)

/** Whether the initial list has been loaded */
const isInitialized = ref(false)

// ============================================================================
// Internal helpers
// ============================================================================

/** Get or create the shared ProgramDB instance */
async function getDb(): Promise<ProgramDB> {
  if (!dbInstance) {
    dbInstance = new ProgramDB()
    await dbInstance.open()
  }
  return dbInstance
}

/** Refresh the reactive programs list from the database */
async function refreshProgramList(): Promise<void> {
  const db = await getDb()
  programs.value = await db.getAll()
}

/** Set error and log it */
function setError(err: unknown, context: string): void {
  const wrapped = err instanceof Error ? err : new Error(String(err))
  error.value = wrapped
  logComposable.error(`[useProgramLibrary] ${context}:`, wrapped)
}

/** Clear error before an operation */
function clearError(): void {
  error.value = null
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Load the program list from IndexedDB.
 * Called automatically on first use, but can be called again to refresh.
 */
async function listPrograms(): Promise<void> {
  clearError()
  isLoading.value = true
  try {
    await refreshProgramList()
    isInitialized.value = true
  } catch (err) {
    setError(err, 'Failed to list programs')
  } finally {
    isLoading.value = false
  }
}

/**
 * Get a single program by id.
 *
 * @returns The program data, or undefined if not found
 */
async function getProgram(id: string): Promise<ProgramData | undefined> {
  clearError()
  try {
    const db = await getDb()
    return await db.getById(id)
  } catch (err) {
    setError(err, `Failed to get program ${id}`)
    return undefined
  }
}

/**
 * Save a program to the library.
 *
 * If the program has an id that already exists in the database, it is updated.
 * Otherwise a new record is created.
 *
 * After saving, the program list is refreshed.
 *
 * @returns The id of the saved program
 */
async function saveProgram(program: Omit<ProgramData, 'id' | 'createdAt' | 'updatedAt'> & Partial<ProgramData>): Promise<string> {
  clearError()
  isLoading.value = true
  try {
    const db = await getDb()

    let id: string
    if (program.id) {
      // Try to update existing program
      try {
        await db.update(program.id, {
          name: program.name,
          code: program.code,
          bg: program.bg,
        })
        id = program.id
      } catch (err) {
        if (err instanceof ProgramNotFoundError) {
          // Program was deleted between listing and save; create new
          id = await db.create(program)
        } else {
          throw err
        }
      }
    } else {
      // New program (no id)
      id = await db.create(program)
    }

    await refreshProgramList()
    return id
  } catch (err) {
    setError(err, 'Failed to save program')
    throw err
  } finally {
    isLoading.value = false
  }
}

/**
 * Delete a program from the library by id.
 *
 * No error is thrown if the program does not exist.
 * After deletion, the program list is refreshed.
 */
async function deleteProgram(id: string): Promise<void> {
  clearError()
  isLoading.value = true
  try {
    const db = await getDb()
    await db.delete(id)
    await refreshProgramList()
  } catch (err) {
    setError(err, `Failed to delete program ${id}`)
  } finally {
    isLoading.value = false
  }
}

/**
 * Rename a program in the library.
 *
 * @throws ProgramNotFoundError if the program does not exist
 */
async function renameProgram(id: string, newName: string): Promise<void> {
  clearError()
  isLoading.value = true
  try {
    const db = await getDb()
    await db.update(id, { name: newName })
    await refreshProgramList()
  } catch (err) {
    setError(err, `Failed to rename program ${id}`)
  } finally {
    isLoading.value = false
  }
}

/**
 * Import a program from a .fbasic.json file into the library.
 *
 * Validates the file format and creates a new library entry with a fresh id.
 * The original id from the file is NOT preserved (to avoid collisions).
 *
 * @param data - Parsed JSON data from a .fbasic.json file
 * @returns The id of the newly created library entry, or null if invalid
 */
async function importFromFile(data: unknown): Promise<string | null> {
  if (!isValidProgramFile(data)) {
    logComposable.error('[useProgramLibrary] Invalid program file format for import')
    return null
  }

  const exportFile = data
  const { name, code, bg } = exportFile.program

  clearError()
  isLoading.value = true
  try {
    const id = await saveProgram({
      version: 1,
      name,
      code,
      bg,
    })
    return id
  } catch (err) {
    setError(err, 'Failed to import program from file')
    return null
  } finally {
    isLoading.value = false
  }
}

/**
 * Export a library program as a .fbasic.json file download.
 *
 * @param id - The library program id to export
 * @throws Error if the program is not found
 */
async function exportToFile(id: string): Promise<void> {
  clearError()
  isLoading.value = true
  try {
    const db = await getDb()
    const program = await db.getById(id)
    if (!program) {
      throw new ProgramNotFoundError(id)
    }

    const exportFile: ProgramExportFile = {
      format: 'family-basic-program',
      version: 1,
      program,
    }

    await saveJsonFile(exportFile, `${program.name}.fbasic.json`)
  } catch (err) {
    setError(err, `Failed to export program ${id}`)
    throw err
  } finally {
    isLoading.value = false
  }
}

/**
 * Close the database connection and reset state.
 * Primarily useful for testing and cleanup.
 */
function $reset(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
  programs.value = []
  isLoading.value = false
  error.value = null
  isInitialized.value = false
}

// ============================================================================
// Composable Export
// ============================================================================

/**
 * Composable for program library management.
 *
 * Wraps ProgramDB with reactive state. Auto-initializes the program list
 * on first call if not already loaded.
 *
 * Usage:
 * ```ts
 * const library = useProgramLibrary()
 * await library.listPrograms()
 * const id = await library.saveProgram({ name: 'My Game', code: '...', bg: ... })
 * ```
 */
export function useProgramLibrary() {
  return {
    // Reactive state (readonly to prevent direct mutation)
    programs: readonly(programs),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isInitialized: readonly(isInitialized),

    // Actions
    listPrograms,
    getProgram,
    saveProgram,
    deleteProgram,
    renameProgram,
    importFromFile,
    exportToFile,

    // Testing / cleanup
    $reset,
  }
}
