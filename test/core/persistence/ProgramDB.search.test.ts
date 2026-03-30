/**
 * Tests for ProgramDB - Search operations (searchByName)
 *
 * Uses fake-indexeddb to simulate IndexedDB in the test environment.
 */

import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ProgramDB } from '@/core/persistence/ProgramDB'
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
  // SEARCH
  // --------------------------------------------------------------------------

  describe('searchByName', () => {
    beforeEach(async () => {
      await db.open()
    })

    it('returns empty array when no programs match', async () => {
      await db.create(createTestProgram({ name: 'Hello World' }))
      const results = await db.searchByName('xyz')
      expect(results).toEqual([])
    })

    it('finds programs by exact name match', async () => {
      await db.create(createTestProgram({ name: 'Hello World' }))
      await db.create(createTestProgram({ name: 'Other Program' }))

      const results = await db.searchByName('Hello World')
      expect(results).toHaveLength(1)
      expect(results[0]?.name).toEqual('Hello World')
    })

    it('finds programs by partial name match', async () => {
      await db.create(createTestProgram({ name: 'Space Invaders' }))
      await db.create(createTestProgram({ name: 'Space Defender' }))
      await db.create(createTestProgram({ name: 'Pacman' }))

      const results = await db.searchByName('Space')
      expect(results).toHaveLength(2)
    })

    it('performs case-insensitive search', async () => {
      await db.create(createTestProgram({ name: 'My Game' }))

      const results1 = await db.searchByName('my game')
      const results2 = await db.searchByName('MY GAME')
      const results3 = await db.searchByName('My Game')

      expect(results1).toHaveLength(1)
      expect(results2).toHaveLength(1)
      expect(results3).toHaveLength(1)
    })

    it('returns results sorted by updatedAt descending', async () => {
      const id1 = await db.create(createTestProgram({ name: 'Game Alpha' }))
      await new Promise((r) => { setTimeout(r, 5) })
      const id2 = await db.create(createTestProgram({ name: 'Game Beta' }))

      // Update alpha to make it most recent
      await new Promise((r) => { setTimeout(r, 5) })
      await db.update(id1, { name: 'Game Alpha Updated' })

      const results = await db.searchByName('Game')
      expect(results[0]?.id).toEqual(id1)
      expect(results[1]?.id).toEqual(id2)
    })

    it('returns empty array for empty query', async () => {
      await db.create(createTestProgram({ name: 'Test' }))
      const results = await db.searchByName('')
      // Empty string matches everything
      expect(results).toHaveLength(1)
    })

    // -- Index-based search behavior tests --

    it('uses name index cursor for substring match across many records', async () => {
      // Create many programs to exercise cursor iteration
      for (let i = 0; i < 20; i++) {
        await db.create(createTestProgram({ name: `Program ${i}` }))
      }
      await db.create(createTestProgram({ name: 'Game A' }))
      await db.create(createTestProgram({ name: 'Game B' }))

      const results = await db.searchByName('Game')
      expect(results).toHaveLength(2)
      const names = results.map((r) => r.name)
      expect(names).toContain('Game A')
      expect(names).toContain('Game B')
    })

    it('correctly iterates index cursor when names span different sort ranges', async () => {
      // Names that exercise different parts of the index B-tree
      const names = ['Alpha Game', 'Beta Game', 'Zeta Game', 'Alpha Tool', 'Gamma']
      for (const name of names) {
        await db.create(createTestProgram({ name }))
      }

      const results = await db.searchByName('Game')
      expect(results).toHaveLength(3)
      const matched = results.map((r) => r.name).sort()
      expect(matched).toEqual(['Alpha Game', 'Beta Game', 'Zeta Game'])
    })

    it('handles case-insensitive match across mixed-case names in index', async () => {
      await db.create(createTestProgram({ name: 'SHOOTING game' }))
      await db.create(createTestProgram({ name: 'shooting GAME' }))
      await db.create(createTestProgram({ name: 'Shooting Game' }))
      await db.create(createTestProgram({ name: 'SHOOTING DEMO' }))

      const results = await db.searchByName('shooting')
      expect(results).toHaveLength(4)
    })

    it('preserves full ProgramData fields in index-cursor results', async () => {
      const code = '10 CLS\n20 PRINT "TEST"'
      const bg = { format: 'sparse1' as const, data: '0,0,65,1;', width: 28 as const, height: 21 as const }
      const id = await db.create(createTestProgram({ name: 'Full Record', code, bg }))

      const results = await db.searchByName('Full')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        version: 1,
        id,
        name: 'Full Record',
        code,
        bg,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      })
    })

    it('returns all programs when query is empty string (index scans all)', async () => {
      await db.create(createTestProgram({ name: 'A' }))
      await db.create(createTestProgram({ name: 'B' }))
      await db.create(createTestProgram({ name: 'C' }))

      const results = await db.searchByName('')
      expect(results).toHaveLength(3)
    })

    it('matches substring not just prefix via index cursor', async () => {
      await db.create(createTestProgram({ name: 'My Awesome Game' }))
      await db.create(createTestProgram({ name: 'Game Awesome' }))
      await db.create(createTestProgram({ name: 'Not Related' }))

      // "Awesome" appears as substring in different positions
      const results = await db.searchByName('Awesome')
      expect(results).toHaveLength(2)
    })

    it('handles single-character query with index cursor', async () => {
      await db.create(createTestProgram({ name: 'A' }))
      await db.create(createTestProgram({ name: 'B' }))
      await db.create(createTestProgram({ name: 'BA' }))

      const results = await db.searchByName('A')
      expect(results).toHaveLength(2)
    })
  })
})
