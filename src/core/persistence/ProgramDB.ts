/**
 * ProgramDB - IndexedDB persistence layer for F-BASIC programs
 *
 * Provides CRUD operations for storing and retrieving ProgramData records.
 * Uses IndexedDB for local persistence with an index on the `name` field
 * for case-insensitive search/filter.
 *
 * Schema versioning: uses IDBDatabase versioning to handle future migrations.
 */

import type { ProgramData } from '@/core/interfaces'

/** Database and store configuration */
const DB_NAME = 'fbasic-ide'
const DB_VERSION = 1
const STORE_NAME = 'programs'

// ============================================================================
// Error types
// ============================================================================

/** Error thrown when a database operation fails */
export class ProgramDBError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ProgramDBError'
  }
}

/** Error thrown when a program is not found */
export class ProgramNotFoundError extends ProgramDBError {
  constructor(
    public readonly programId: string,
  ) {
    super(`Program not found: ${programId}`)
    this.name = 'ProgramNotFoundError'
  }
}

// ============================================================================
// Database connection management
// ============================================================================

/**
 * Open (or create) the IndexedDB database.
 * Creates the `programs` object store with a `name` index on first run.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new ProgramDBError('Failed to open database', request.error))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (_event: IDBVersionChangeEvent) => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // Index on `name` for search/filter queries (case-insensitive handled in code)
        store.createIndex('name', 'name', { unique: false })
      }
    }
  })
}

// ============================================================================
// Generic store operation helper
// ============================================================================

/**
 * Execute a readwrite transaction on the programs store.
 * Returns the IDBObjectStore for the callback to use.
 * Commits automatically when the transaction completes.
 */
function withReadWriteStore<T>(
  db: IDBDatabase,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = operation(store)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new ProgramDBError('Transaction failed', request.error))
    }

    tx.oncomplete = () => {
      // Transaction completed; result already resolved via request.onsuccess
    }

    tx.onerror = () => {
      reject(new ProgramDBError('Transaction error', tx.error))
    }
  })
}

/**
 * Execute a readonly transaction on the programs store.
 */
function withReadonlyStore<T>(
  db: IDBDatabase,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = operation(store)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new ProgramDBError('Read operation failed', request.error))
    }
  })
}

// ============================================================================
// Public API
// ============================================================================

/**
 * ProgramDB - IndexedDB persistence layer for program records.
 *
 * Usage:
 *   const db = new ProgramDB()
 *   await db.open()
 *   const id = await db.create(program)
 *   const program = await db.getById(id)
 *   await db.close()
 */
export class ProgramDB {
  private db: IDBDatabase | null = null

  /** Whether the database connection is open */
  get isOpen(): boolean {
    return this.db !== null
  }

  /**
   * Open the database connection.
   * Creates the database and object store if they don't exist.
   * Must be called before any CRUD operation.
   */
  async open(): Promise<void> {
    if (this.db) {
      return
    }
    this.db = await openDatabase()
  }

  /**
   * Close the database connection.
   * Safe to call multiple times.
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * Ensure the database is open, throw if not.
   */
  private requireOpen(): IDBDatabase {
    if (!this.db) {
      throw new ProgramDBError('Database is not open. Call open() first.')
    }
    return this.db
  }

  // --- CREATE ---

  /**
   * Create a new program record.
   * The `id`, `createdAt`, and `updatedAt` fields are set automatically
   * if not already provided on the ProgramData object.
   *
   * @param program - Program data to store (id is auto-generated if missing)
   * @returns The id of the created program
   */
  async create(program: Omit<ProgramData, 'id' | 'createdAt' | 'updatedAt'> & Partial<ProgramData>): Promise<string> {
    const db = this.requireOpen()
    const now = Date.now()
    const id = program.id ?? crypto.randomUUID()
    const record: ProgramData = {
      version: 1,
      id,
      name: program.name,
      code: program.code,
      bg: program.bg,
      createdAt: program.createdAt ?? now,
      updatedAt: program.updatedAt ?? now,
    }

    await withReadWriteStore(db, (store) => store.add(record))
    return id
  }

  // --- READ ---

  /**
   * Get a program by its id.
   * @returns The program data, or undefined if not found
   */
  async getById(id: string): Promise<ProgramData | undefined> {
    const db = this.requireOpen()
    const result = await withReadonlyStore<ProgramData | undefined>(db, (store) => store.get(id))
    return result ?? undefined
  }

  /**
   * Get a program by its id, throwing if not found.
   * @returns The program data
   * @throws ProgramNotFoundError if the program does not exist
   */
  async getByIdOrThrow(id: string): Promise<ProgramData> {
    const program = await this.getById(id)
    if (!program) {
      throw new ProgramNotFoundError(id)
    }
    return program
  }

  /**
   * Get all programs, sorted by updatedAt descending (most recently modified first).
   */
  async getAll(): Promise<ProgramData[]> {
    const db = this.requireOpen()
    const results = await withReadonlyStore<ProgramData[]>(db, (store) => store.getAll())
    // Sort by updatedAt descending (most recent first)
    return results.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  // --- UPDATE ---

  /**
   * Update an existing program record.
   * Only the provided fields are updated; unspecified fields remain unchanged.
   * The `updatedAt` timestamp is automatically set to the current time.
   *
   * @param id - Program id to update
   * @param updates - Partial program data with fields to update
   * @throws ProgramNotFoundError if the program does not exist
   */
  async update(id: string, updates: Partial<Pick<ProgramData, 'name' | 'code' | 'bg'>>): Promise<void> {
    const db = this.requireOpen()
    const existing = await this.getByIdOrThrow(id)

    const updated: ProgramData = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    }

    await withReadWriteStore(db, (store) => store.put(updated))
  }

  // --- DELETE ---

  /**
   * Delete a program by its id.
   * No error is thrown if the program does not exist.
   *
   * @param id - Program id to delete
   */
  async delete(id: string): Promise<void> {
    const db = this.requireOpen()
    await withReadWriteStore(db, (store) => store.delete(id))
  }

  // --- SEARCH ---

  /**
   * Search programs by name (case-insensitive substring match).
   * Results are sorted by updatedAt descending.
   *
   * @param query - Search query to match against program names
   * @returns Matching programs
   */
  async searchByName(query: string): Promise<ProgramData[]> {
    const all = await this.getAll()
    const lowerQuery = query.toLowerCase()
    return all.filter((p) => p.name.toLowerCase().includes(lowerQuery))
  }

  // --- COUNT ---

  /**
   * Get the total number of stored programs.
   */
  async count(): Promise<number> {
    const db = this.requireOpen()
    return withReadonlyStore<number>(db, (store) => store.count())
  }

  // --- CLEAR ---

  /**
   * Delete all programs from the store.
   * Use with caution.
   */
  async clear(): Promise<void> {
    const db = this.requireOpen()
    await withReadWriteStore(db, (store) => store.clear())
  }
}
