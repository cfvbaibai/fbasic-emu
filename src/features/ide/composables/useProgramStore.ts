/**
 * useProgramStore composable
 *
 * Central state management for the Program Management System.
 * Uses singleton pattern with module-level state (same pattern as useBgEditorState).
 * Auto-persists to localStorage using VueUse's useLocalStorage.
 *
 * Integrates with useProgramLibrary so that import/export operations
 * also update the program library in IndexedDB.
 */

import { useLocalStorage } from '@vueuse/core'
import { readonly, ref } from 'vue'

import type { ProgramData, ProgramExportFile } from '@/core/types/program-types'
import { createEmptyGrid } from '@/features/bg-editor/composables/useBgGrid'
import type { BgGridData } from '@/features/bg-editor/types'
import { compressBg, decompressBg } from '@/features/bg-editor/utils/bgCompression'
import { logComposable } from '@/shared/logger'
import { isValidProgramFile, loadJsonFile, saveJsonFile } from '@/shared/utils/fileIO'
import { generateProgramId, generateSessionId } from '@/shared/utils/id'

import { useProgramLibrary } from './useProgramLibrary'

// ============================================================================
// Module-level Singleton State
// ============================================================================

const STORAGE_KEY = 'program:current'

/** Current active program - auto-persisted to localStorage */
const currentProgram = useLocalStorage<ProgramData | null>(STORAGE_KEY, null, {
  deep: true,
  serializer: {
    read: (v: string) => JSON.parse(v),
    write: (v: ProgramData | null) => JSON.stringify(v),
  },
})

/** Whether there are unsaved changes (not persisted) */
const isDirty = ref(false)

/** Whether the store has been initialized */
const isInitialized = ref(false)

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Create a new empty program
 */
function newProgram(): void {
  const now = Date.now()
  currentProgram.value = {
    version: 1,
    id: generateSessionId(),
    name: 'Untitled',
    code: '',
    bg: compressBg(createEmptyGrid()),
    createdAt: now,
    updatedAt: now,
  }
  isDirty.value = false
}

/**
 * Ensure a program exists - restore from localStorage or create new
 */
function ensureProgram(): void {
  if (isInitialized.value) return
  isInitialized.value = true

  // If we have a program from localStorage, use it
  if (currentProgram.value) {
    isDirty.value = false
    return
  }

  // No program found, create new one
  newProgram()
}

/**
 * Load a program into the store
 */
function loadProgram(program: ProgramData): void {
  currentProgram.value = program
  isDirty.value = false
}

/**
 * Update the program's code
 */
function setCode(code: string): void {
  if (!currentProgram.value) return

  currentProgram.value.code = code
  currentProgram.value.updatedAt = Date.now()
  isDirty.value = true
}

/**
 * Update the program's name
 */
function setName(name: string): void {
  if (!currentProgram.value) return

  currentProgram.value.name = name
  currentProgram.value.updatedAt = Date.now()
  isDirty.value = true
}

/**
 * Update the program's BG data
 */
function setBg(bg: BgGridData): void {
  if (!currentProgram.value) return

  currentProgram.value.bg = compressBg(bg)
  currentProgram.value.updatedAt = Date.now()
  isDirty.value = true
}

/**
 * Save the current program to file
 * Persists to localStorage, saves to library, and triggers file download
 */
async function save(): Promise<void> {
  if (!currentProgram.value) return

  // Create export file
  const exportFile: ProgramExportFile = {
    format: 'family-basic-program',
    version: 1,
    program: currentProgram.value,
  }

  // Download file
  await saveJsonFile(exportFile, `${currentProgram.value.name}.fbasic.json`)

  // Save to program library (create or update)
  try {
    const library = useProgramLibrary()
    const programId = await library.saveProgram({
      id: currentProgram.value.id,
      version: currentProgram.value.version,
      name: currentProgram.value.name,
      code: currentProgram.value.code,
      bg: currentProgram.value.bg,
    })
    // Update the current program's id to match the library entry
    if (currentProgram.value.id !== programId) {
      currentProgram.value = {
        ...currentProgram.value,
        id: programId,
      }
    }
  } catch (err) {
    // Library save failure should not block the file export
    logComposable.error('[useProgramStore] Failed to save to library:', err)
  }

  // Mark as saved
  isDirty.value = false
}

/**
 * Save the program with a new name
 * Generates new ID and saves as new file
 */
async function saveAs(name: string): Promise<void> {
  if (!currentProgram.value) return

  const now = Date.now()
  currentProgram.value = {
    ...currentProgram.value,
    id: generateProgramId(),
    name,
    updatedAt: now,
  }

  isDirty.value = false
  await save()
}

/**
 * Open a program from file
 * Loads into the editor and also adds to the program library
 */
async function open(): Promise<boolean> {
  try {
    const data = await loadJsonFile()

    if (!data) {
      // User cancelled
      return false
    }

    if (!isValidProgramFile(data)) {
      logComposable.error('[useProgramStore] Invalid program file format')
      return false
    }

    const exportFile = data
    loadProgram(exportFile.program)

    // Also import to the library (non-blocking - failures are logged but don't affect UX)
    try {
      const library = useProgramLibrary()
      await library.importFromFile(data)
    } catch (err) {
      logComposable.error('[useProgramStore] Failed to import to library:', err)
    }

    return true
  } catch (error) {
    logComposable.error('[useProgramStore] Failed to open program:', error)
    return false
  }
}

/**
 * Get the current BG data (decompressed)
 */
function getBg(): BgGridData {
  if (!currentProgram.value) {
    return createEmptyGrid()
  }
  return decompressBg(currentProgram.value.bg)
}

// ============================================================================
// Composable Export
// ============================================================================

/**
 * Composable for Program state management
 *
 * Provides singleton access to the current program with:
 * - Code and BG data management
 * - Save/Load functionality
 * - Dirty state tracking
 * - Auto-persistence to localStorage (via VueUse)
 */
export function useProgramStore() {
  // Initialize on first use
  ensureProgram()

  return {
    // State (readonly to prevent direct mutation)
    currentProgram: readonly(currentProgram),
    isDirty: readonly(isDirty),

    // Getters
    get programId() {
      return currentProgram.value?.id ?? null
    },
    get programName() {
      return currentProgram.value?.name ?? 'Untitled'
    },
    get code() {
      return currentProgram.value?.code ?? ''
    },
    get bg() {
      return getBg()
    },

    // Actions
    newProgram,
    loadProgram,
    setCode,
    setName,
    setBg,
    save,
    saveAs,
    open,
  }
}
