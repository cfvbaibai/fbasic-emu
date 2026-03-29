/**
 * Tests for ProgramDB - CRUD operations (create, read, update, delete)
 *
 * Uses fake-indexeddb to simulate IndexedDB in the test environment.
 */

import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ProgramData } from '@/core/interfaces'
import {
  ProgramDB,
  ProgramNotFoundError,
} from '@/core/persistence/ProgramDB'

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
  // CREATE
  // --------------------------------------------------------------------------

  describe('create', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('creates a program and returns its id', async () => {
      const id = await db.create(createTestProgram())
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('generates unique ids for each program', async () => {
      const id1 = await db.create(createTestProgram({ name: 'Program 1' }))
      const id2 = await db.create(createTestProgram({ name: 'Program 2' }))
      expect(id1).not.toBe(id2)
    })

    it('uses provided id if given', async () => {
      const customId = 'my-custom-id-123'
      const id = await db.create(createTestProgram({ id: customId }))
      expect(id).toEqual(customId)
    })

    it('sets createdAt and updatedAt automatically', async () => {
      const before = Date.now()
      const id = await db.create(createTestProgram())
      const after = Date.now()

      const program = await db.getById(id)
      expect(program?.createdAt).toBeGreaterThanOrEqual(before)
      expect(program?.createdAt).toBeLessThanOrEqual(after)
      expect(program?.updatedAt).toBeGreaterThanOrEqual(before)
      expect(program?.updatedAt).toBeLessThanOrEqual(after)
    })

    it('preserves provided createdAt and updatedAt', async () => {
      const fixedTime = 1000000
      const id = await db.create(createTestProgram({
        createdAt: fixedTime,
        updatedAt: fixedTime,
      }))

      const program = await db.getById(id)
      expect(program?.createdAt).toEqual(fixedTime)
      expect(program?.updatedAt).toEqual(fixedTime)
    })

    it('stores all ProgramData fields correctly', async () => {
      const program = createTestProgram({
        name: 'My Game',
        code: '10 CLS\n20 PRINT "GAME"',
        bg: {
          format: 'sparse1',
          data: '0,0,65,1;',
          width: 28,
          height: 21,
        },
      })

      const id = await db.create(program)
      const stored = await db.getByIdOrThrow(id)

      expect(stored).toEqual({
        version: 1,
        id,
        name: 'My Game',
        code: '10 CLS\n20 PRINT "GAME"',
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
  // READ
  // --------------------------------------------------------------------------

  describe('getById', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('returns undefined for non-existent id', async () => {
      const result = await db.getById('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('retrieves a previously created program', async () => {
      const id = await db.create(createTestProgram({ name: 'Find Me' }))
      const program = await db.getById(id)
      expect(program?.name).toEqual('Find Me')
    })
  })

  describe('getByIdOrThrow', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('returns the program when found', async () => {
      const id = await db.create(createTestProgram({ name: 'Exists' }))
      const program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('Exists')
    })

    it('throws ProgramNotFoundError when not found', async () => {
      await expect(db.getByIdOrThrow('ghost-id')).rejects.toThrow(ProgramNotFoundError)
    })

    it('includes the program id in the error', async () => {
      try {
        await db.getByIdOrThrow('ghost-id')
      } catch (error) {
        expect(error).toBeInstanceOf(ProgramNotFoundError)
        const notFound = error as ProgramNotFoundError
        expect(notFound.programId).toEqual('ghost-id')
      }
    })
  })

  describe('getAll', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('returns empty array when no programs exist', async () => {
      const programs = await db.getAll()
      expect(programs).toEqual([])
    })

    it('returns all created programs', async () => {
      await db.create(createTestProgram({ name: 'A' }))
      await db.create(createTestProgram({ name: 'B' }))
      await db.create(createTestProgram({ name: 'C' }))

      const programs = await db.getAll()
      expect(programs).toHaveLength(3)
    })

    it('sorts by updatedAt descending (most recent first)', async () => {
      const id1 = await db.create(createTestProgram({ name: 'Oldest' }))
      // Small delay to ensure different timestamps
      await new Promise((r) => { setTimeout(r, 5) })
      const id2 = await db.create(createTestProgram({ name: 'Newest' }))

      // Small delay to ensure update timestamp is after create
      await new Promise((r) => { setTimeout(r, 5) })
      // Update the oldest to make it newest
      await db.update(id1, { name: 'Updated Oldest' })

      const programs = await db.getAll()
      expect(programs[0]?.id).toEqual(id1)
      expect(programs[1]?.id).toEqual(id2)
    })
  })

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  describe('update', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('updates the name of a program', async () => {
      const id = await db.create(createTestProgram({ name: 'Original' }))
      await db.update(id, { name: 'Updated' })

      const program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('Updated')
    })

    it('updates the code of a program', async () => {
      const id = await db.create(createTestProgram())
      await db.update(id, { code: '10 REM UPDATED' })

      const program = await db.getByIdOrThrow(id)
      expect(program.code).toEqual('10 REM UPDATED')
    })

    it('updates the bg of a program', async () => {
      const id = await db.create(createTestProgram())
      const newBg = { format: 'rle1' as const, data: 'compressed', width: 28 as const, height: 21 as const }
      await db.update(id, { bg: newBg })

      const program = await db.getByIdOrThrow(id)
      expect(program.bg).toEqual(newBg)
    })

    it('updates multiple fields at once', async () => {
      const id = await db.create(createTestProgram({ name: 'Old', code: '10 OLD' }))
      await db.update(id, { name: 'New', code: '20 NEW' })

      const program = await db.getByIdOrThrow(id)
      expect(program.name).toEqual('New')
      expect(program.code).toEqual('20 NEW')
    })

    it('bumps updatedAt timestamp', async () => {
      const id = await db.create(createTestProgram())
      const original = await db.getByIdOrThrow(id)
      const originalUpdatedAt = original.updatedAt

      // Small delay to ensure different timestamp
      await new Promise((r) => { setTimeout(r, 5) })
      await db.update(id, { name: 'Updated' })

      const updated = await db.getByIdOrThrow(id)
      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt)
    })

    it('preserves unmodified fields', async () => {
      const id = await db.create(createTestProgram({ name: 'Keep Name', code: '10 KEEP' }))
      const original = await db.getByIdOrThrow(id)

      await db.update(id, { code: '20 NEW CODE' })

      const updated = await db.getByIdOrThrow(id)
      expect(updated.name).toEqual('Keep Name') // Unchanged
      expect(updated.code).toEqual('20 NEW CODE') // Changed
      expect(updated.createdAt).toEqual(original.createdAt) // Preserved
      expect(updated.id).toEqual(original.id) // Preserved
    })

    it('throws ProgramNotFoundError for non-existent program', async () => {
      await expect(db.update('ghost-id', { name: 'Nope' })).rejects.toThrow(ProgramNotFoundError)
    })
  })

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  describe('delete', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('deletes an existing program', async () => {
      const id = await db.create(createTestProgram())
      await db.delete(id)

      const result = await db.getById(id)
      expect(result).toBeUndefined()
    })

    it('does not throw when deleting a non-existent program', async () => {
      // Should resolve without error
      await expect(db.delete('ghost-id')).resolves.toBeUndefined()
    })

    it('removes the program from getAll results', async () => {
      const id1 = await db.create(createTestProgram({ name: 'A' }))
      const id2 = await db.create(createTestProgram({ name: 'B' }))

      await db.delete(id1)
      const programs = await db.getAll()
      expect(programs).toHaveLength(1)
      expect(programs[0]?.id).toEqual(id2)
    })
  })
})
