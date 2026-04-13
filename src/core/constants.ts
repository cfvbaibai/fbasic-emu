/**
 * Constants for the Family Basic Interpreter
 *
 * This module contains all configuration constants, limits, and default values
 * used throughout the interpreter. Centralizing these values improves
 * maintainability and makes configuration changes easier.
 *
 * @author Family Basic IDE Team
 * @version 1.0.0
 */

// Execution limits
export const EXECUTION_LIMITS = {
  // Test environment limits (strict to prevent infinite loops in tests)
  MAX_ITERATIONS_TEST: 10000,
  MAX_OUTPUT_LINES_TEST: 1000,

  // Production environment limits (no iteration limit - user controls via STOP button)
  MAX_ITERATIONS_PRODUCTION: Infinity,
  MAX_OUTPUT_LINES_PRODUCTION: 10000,

  // Legacy limits (for backward compatibility)
  MAX_ITERATIONS: 10000,
  MAX_OUTPUT_LINES: 1000,

  // Other limits (same for both environments)
  MAX_LINE_NUMBER: 99999,
  MAX_VARIABLE_NAME_LENGTH: 255,
  MAX_STRING_LENGTH: 32767,
} as const

// Line number increments (BASIC typically uses 10)
export const LINE_NUMBER_INCREMENT = 10

// Default values
export const DEFAULTS = {
  FOR_LOOP_STEP: 1,
  TAB_SIZE: 2,
  MAX_OUTPUT_LINES: 1000,
  ASYNC_EXECUTION: {
    ENABLED_PRODUCTION: true,
    ENABLED_TEST: false,
    YIELD_INTERVAL: 100, // Yield every 100 iterations in production
    YIELD_DURATION: 1, // Yield for 1ms to allow browser to process events
  },
  WEB_WORKER: {
    ENABLED_PRODUCTION: true,
    ENABLED_TEST: false,
    MESSAGE_TIMEOUT: 30000, // 30 seconds timeout for web worker messages
    EXECUTION_TIMEOUT: 5 * 60 * 1000, // 5 minutes for EXECUTE (long-running games)
  },
} as const

// Error messages (shared between worker and UI layers for type-safe matching)
export const ERROR_MESSAGES = {
  WORKER_TIMEOUT: 'Web worker message timeout',
} as const

// Error types
export const ERROR_TYPES = {
  SYNTAX: 'SYNTAX',
  RUNTIME: 'RUNTIME',
  COMPILATION: 'COMPILATION',
} as const

// Variable types
export const VARIABLE_TYPES = {
  NUMBER: 'number',
  STRING: 'string',
} as const

// Command names
export const COMMANDS = {
  PRINT: 'PRINT',
  LET: 'LET',
  FOR: 'FOR',
  NEXT: 'NEXT',
  IF: 'IF',
  THEN: 'THEN',
  GOTO: 'GOTO',
  END: 'END',
  STEP: 'STEP',
  TO: 'TO',
} as const

// Operators
export const OPERATORS = {
  EQUALS: '=',
  PLUS: '+',
  MINUS: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_EQUAL: '>=',
  LESS_EQUAL: '<=',
  NOT_EQUAL: '<>',
} as const

// String delimiters
export const STRING_DELIMITERS = {
  DOUBLE_QUOTE: '"',
  SINGLE_QUOTE: "'",
} as const

// Output separators
export const OUTPUT_SEPARATORS = {
  SEMICOLON: ';',
  COMMA: ',',
  TAB: '\t',
  NEWLINE: '\n',
} as const

// Regular expressions
export const REGEX_PATTERNS = {
  LINE_NUMBER: /^(\d+)/,
  VARIABLE_NAME: /^[A-Za-z][A-Za-z0-9$]*$/,
  STRING_LITERAL: /^["'].*["']$/,
  NUMBER_LITERAL: /^-?\d+(\.\d+)?$/,
  OPERATOR: /[+\-*/()]/,
} as const

// Whitespace characters
export const WHITESPACE = {
  SPACE: ' ',
  TAB: '\t',
  NEWLINE: '\n',
} as const

// Common separators
export const SEPARATORS = {
  COMMA: ',',
  SEMICOLON: ';',
} as const

// Timing constants
export const TIMING = {
  FRAME_RATE: 30, // Family BASIC frame rate (frames per second)
  FRAME_DURATION_MS: 1000 / 30, // Duration of one frame in milliseconds (~33.33ms)

  /**
   * PAUSE timing divisor - DO NOT MODIFY
   *
   * Real F-BASIC hardware uses ~8.33ms per PAUSE unit (divisor 4).
   * However, web timing feels different from hardware, so we use divisor 2.75
   * (~12.12ms per unit) to match the real F-BASIC experience on web.
   *
   * This value was empirically determined and should NOT be changed.
   * See: https://github.com/cfvbaibai/fbasic-ide/issues/25
   *
   * History:
   * - divisor 4 (8.33ms): accurate to hardware, but feels too fast on web
   * - divisor 2.75 (12.12ms): calibrated for web feel - DO NOT CHANGE
   */
  PAUSE_TIMING_DIVISOR: 2.75,

  // Screen rendering intervals (for performance optimization)
  SCREEN_RENDER_INTERVAL_MS: 50, // Min interval between screen renders during rapid updates (20 FPS)

  // STICK repeat interval (typematic-style control for joystick direction reads)
  // This prevents programs from registering continuous direction when held
  STICK_REPEAT_INTERVAL_MS: 120, // ~8 reads per second when direction held

  // UI feedback durations
  COPIED_FEEDBACK_MS: 2000, // Duration of "Copied!" feedback state in share dialog
} as const

// Sound constants
/** Number of independent audio channels in F-BASIC. */
export const CHANNEL_COUNT = 3

/**
 * Returns true if the given index is a valid channel index (0 to CHANNEL_COUNT - 1).
 *
 * Shared by the composer UI (useComposer) and the execution layer (SoundService).
 */
export function isValidChannelIndex(index: number): boolean {
  return !Number.isNaN(index) && index >= 0 && index < CHANNEL_COUNT
}

// Screen dimensions and coordinate limits
export const SCREEN_DIMENSIONS = {
  BACKGROUND: {
    MAX_X: 27, // Maximum X coordinate (0-27, 28 columns)
    MAX_Y: 23, // Maximum Y coordinate (0-23, 24 lines)
    COLUMNS: 28, // Total columns
    LINES: 24, // Total lines
  },
  BACKDROP: {
    MAX_X: 31, // Maximum X coordinate (0-31, 32 columns)
    MAX_Y: 29, // Maximum Y coordinate (0-29, 30 lines)
    COLUMNS: 32, // Total columns
    LINES: 30, // Total lines
  },
  BG_GRAPHIC: {
    MAX_X: 27, // Maximum X coordinate (0-27, 28 columns)
    MAX_Y: 20, // Maximum Y coordinate (0-20, 21 lines)
    COLUMNS: 28, // Total columns
    LINES: 21, // Total lines
  },
  SPRITE: {
    MAX_X: 255, // Maximum X coordinate (0-255, 256 dots)
    MAX_Y: 239, // Maximum Y coordinate (0-239, 240 dots)
    WIDTH: 256, // Total width in dots
    HEIGHT: 240, // Total height in dots
    /** Screen center (256×240). When POSITION not set, sprite is placed so its center is here. */
    DEFAULT_X: 128,
    DEFAULT_Y: 120,
  },
  /** Number of sprite slots (0 to SPRITE_COUNT-1). Hardware limit for F-BASIC. */
  SPRITE_COUNT: 8,
} as const

// Palette default values (used by ScreenStateManager, IDE composables, and IdePage)
export const PALETTE_DEFAULTS = {
  /** Default background palette index (0-1) */
  BG_PALETTE: 1,
  /** Default sprite palette index (0-2) */
  SPRITE_PALETTE: 1,
  /** Default backdrop color code (0-60, 0 = black) */
  BACKDROP_COLOR: 0,
  /** Default character-generator mode (0-3): B on BG, A on sprite */
  CGEN_MODE: 2,
} as const

/**
 * Maps each PALETTE_DEFAULTS key to the camelCase property name used on
 * state objects (ScreenStateManager fields, Vue reactive refs, etc.).
 *
 * When a new field is added to PALETTE_DEFAULTS, add a corresponding entry
 * here -- all call sites of resetPaletteState() will automatically pick it up.
 */
export const PALETTE_STATE_KEY_MAP = {
  BG_PALETTE: 'bgPalette',
  SPRITE_PALETTE: 'spritePalette',
  BACKDROP_COLOR: 'backdropColor',
  CGEN_MODE: 'cgenMode',
} as const satisfies Record<keyof typeof PALETTE_DEFAULTS, string>

/**
 * Typed key array for PALETTE_DEFAULTS.
 * Used by resetPaletteState() to iterate with full type information,
 * avoiding the need for Object.keys() + type assertion.
 */
const PALETTE_DEFAULTS_KEYS = Object.keys(PALETTE_DEFAULTS) as (keyof typeof PALETTE_DEFAULTS)[]

/** Writable palette state with camelCase property names. */
export type PaletteStateValues = {
  [K in (typeof PALETTE_STATE_KEY_MAP)[keyof typeof PALETTE_STATE_KEY_MAP]]: number
}

/**
 * Reset palette-related state fields to their default values.
 *
 * Iterates over all PALETTE_DEFAULTS entries and assigns each to the target
 * object using PALETTE_STATE_KEY_MAP to translate SCREAMING_CASE keys to the
 * camelCase property names used by state objects. This ensures that adding
 * a new field to PALETTE_DEFAULTS (and PALETTE_STATE_KEY_MAP) automatically
 * resets it at every call site -- no per-site updates needed.
 *
 * Accepts a target object with writable number properties matching PaletteStateValues.
 * For Vue reactive refs, wrap with a getter/setter adapter via createPaletteRefTarget().
 */
export function resetPaletteState(target: PaletteStateValues): void {
  for (const key of PALETTE_DEFAULTS_KEYS) {
    target[PALETTE_STATE_KEY_MAP[key]] = PALETTE_DEFAULTS[key]
  }
}

/**
 * Create a palette state target backed by Vue reactive refs.
 * Returns an object that proxies property reads/writes through .value,
 * compatible with resetPaletteState().
 */
export function createPaletteRefTarget(
  refs: { [K in keyof PaletteStateValues]: { value: number } },
): PaletteStateValues {
  const target = {} as PaletteStateValues
  for (const key of Object.keys(refs) as (keyof PaletteStateValues)[]) {
    Object.defineProperty(target, key, {
      get: () => refs[key].value,
      set: (value: number) => {
        refs[key].value = value
      },
      enumerable: true,
    })
  }
  return target
}

// Color patterns and codes
export const COLOR_PATTERNS = {
  MIN: 0, // Minimum color pattern number
  MAX: 3, // Maximum color pattern number (0-3)
} as const

export const COLOR_CODES = {
  MIN: 0, // Minimum color code
  MAX: 60, // Maximum color code (0-60)
} as const

// PRINT statement tab stops (8-character blocks)
export const PRINT_TAB_STOPS = {
  BLOCK_1_END: 8, // End of block 1 (columns 0-7)
  BLOCK_2_END: 16, // End of block 2 (columns 8-15)
  BLOCK_3_END: 24, // End of block 3 (columns 16-23)
  BLOCK_4_END: 28, // End of block 4 (columns 24-27)
} as const

// Colors for syntax highlighting
export const SYNTAX_COLORS = {
  COMMAND: '#0066cc',
  OPERATOR: '#cc6600',
  STRING: '#009900',
  LINE_NUMBER: '#666666',
  VARIABLE: '#9900cc',
} as const
