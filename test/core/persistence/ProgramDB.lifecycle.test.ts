/**
 * Tests for ProgramDB - Database lifecycle (open, close, count, clear, edge cases)
 *
 * Uses fake-indexeddb to simulate IndexedDB in the test environment.
 */

import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  ProgramDB,
  ProgramDBError,
} from '@/core/persistence/ProgramDB'
import type { ProgramData } from '@/core/types/program-types'

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

describe('ProgramDB', () => {
  let db: ProgramDB

  beforeEach(async () => {
    await deleteDatabase()
    db = new ProgramDB()
  })

  afterEach(async () => {
    db.close()
    await deleteDatabase()
  })

  // --------------------------------------------------------------------------
  // Database lifecycle
  // --------------------------------------------------------------------------

  describe('open / close', () => {
    it('starts with isOpen false', () => {
      expect(db.isOpen).toBe(false)
    })

    it('opens the database successfully', async () => {
      await db.open()
      expect(db.isOpen).toBe(true)
    })

    it('is idempotent (calling open twice does not throw)', async () => {
      await db.open()
      await db.open()
      expect(db.isOpen).toBe(true)
    })

    it('closes the database', async () => {
      await db.open()
      db.close()
      expect(db.isOpen).toBe(false)
    })

    it('close is idempotent (calling close twice does not throw)', async () => {
      await db.open()
      db.close()
      db.close()
      expect(db.isOpen).toBe(false)
    })

    it('throws ProgramDBError when CRUD is called before open', async () => {
      const program = createTestProgram()
      await expect(db.create(program)).rejects.toThrow(ProgramDBError)
    })
  })

  // --------------------------------------------------------------------------
  // COUNT
  // --------------------------------------------------------------------------

  describe('count', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('returns 0 for empty store', async () => {
      expect(await db.count()).toEqual(0)
    })

    it('returns the correct count after creates', async () => {
      await db.create(createTestProgram())
      await db.create(createTestProgram())
      await db.create(createTestProgram())

      expect(await db.count()).toEqual(3)
    })

    it('decrements after delete', async () => {
      const id = await db.create(createTestProgram())
      await db.create(createTestProgram())

      await db.delete(id)
      expect(await db.count()).toEqual(1)
    })
  })

  // --------------------------------------------------------------------------
  // CLEAR
  // --------------------------------------------------------------------------

  describe('clear', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('removes all programs', async () => {
      await db.create(createTestProgram({ name: 'A' }))
      await db.create(createTestProgram({ name: 'B' }))

      await db.clear()

      expect(await db.count()).toEqual(0)
      expect(await db.getAll()).toEqual([])
    })

    it('is safe to call on empty store', async () => {
      await expect(db.clear()).resolves.toBeUndefined()
      expect(await db.count()).toEqual(0)
    })
  })

  // --------------------------------------------------------------------------
  // Integration / edge cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('handles programs with empty code', async () => {
      const id = await db.create(createTestProgram({ code: '' }))
      const program = await db.getByIdOrThrow(id)
      expect(program.code).toEqual('')
    })

    it('handles programs with empty name', async () => {
      const id = await db.create(createTestProgram({ name: '' }))
      const program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('')
    })

    it('handles programs with large code', async () => {
      const largeCode = '10 PRINT "HELLO"\n'.repeat(1000)
      const id = await db.create(createTestProgram({ code: largeCode }))
      const program = await db.getByIdOrThrow(id)
      expect(program.code).toEqual(largeCode)
    })

    it('handles special characters in name', async () => {
      const specialName = 'Test "quotes" & <tags> 日本語'
      const id = await db.create(createTestProgram({ name: specialName }))
      const program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual(specialName)
    })

    it('handles programs with rle1 bg format', async () => {
      const rleBg = { format: 'rle1' as const, data: 'rle-compressed-data', width: 28 as const, height: 21 as const }
      const id = await db.create(createTestProgram({ bg: rleBg }))
      const program = await db.getByIdOrThrow(id)
      expect(program.bg.format).toEqual('rle1')
    })

    it('create then read then update then read round-trip', async () => {
      // Create
      const id = await db.create(createTestProgram({
        name: 'Round Trip',
        code: '10 PRINT "V1"',
      }))

      // Read
      let program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('Round Trip')
      expect(program.code).toEqual('10 PRINT "V1"')

      // Update
      await db.update(id, { name: 'Round Trip V2', code: '10 PRINT "V2"' })

      // Read again
      program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('Round Trip V2')
      expect(program.code).toEqual('10 PRINT "V2"')
    })

    it('survives closing and reopening the database', async () => {
      const id = await db.create(createTestProgram({ name: 'Persistent' }))
      db.close()

      // Reopen
      const db2 = new ProgramDB()
      await db2.open()

      const program = await db2.getById(id)
      expect(program?.name).toEqual('Persistent')

      db2.close()
    })
  })
})
