/**
 * Program management types for the Family Basic Interpreter
 *
 * Program data structures for save/load, export format, and BG compression.
 */

/**
 * Compressed BG grid data format
 * Uses hybrid compression: sparse for <30% fill, RLE for >=30%
 */
export interface CompactBg {
  /** Compression format version */
  format: 'sparse1' | 'rle1'
  /** Compressed data string */
  data: string
  /** Grid width (always 28) */
  width: 28
  /** Grid height (always 21) */
  height: 21
}

/**
 * Program data structure for save/load
 * Contains BASIC source code and associated BG graphic
 */
export interface ProgramData {
  /** Schema version for future migrations (auto-incremented on update) */
  version: number
  /** Unique program identifier (UUID) */
  id: string
  /** User-visible program name */
  name: string
  /** BASIC source code */
  code: string
  /** Compressed BG graphic data */
  bg: CompactBg
  /** Creation timestamp (ms since epoch) */
  createdAt: number
  /** Last update timestamp (ms since epoch) */
  updatedAt: number
}

/**
 * Export file format for saving programs to disk
 */
export interface ProgramExportFile {
  /** File format identifier */
  format: 'family-basic-program'
  /** File format version */
  version: 1
  /** Program data */
  program: ProgramData
}
