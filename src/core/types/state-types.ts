/**
 * Core state types for the Family Basic Interpreter
 *
 * Variable, error, statement, and loop state interfaces.
 */

import type { ERROR_TYPES, VARIABLE_TYPES } from '@/core/constants'

/**
 * Represents a BASIC variable with its value and type
 */
export interface BasicVariable {
  value: number | string
  type: (typeof VARIABLE_TYPES)[keyof typeof VARIABLE_TYPES]
}

/**
 * Represents a BASIC error with line number, message, and type
 */
export interface BasicError {
  line: number
  message: string
  type: (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES]
  /** Machine-readable error code for behavior-specific handling (e.g. worker fallback). */
  code?: 'UNSUPPORTED_FEATURE'
  /** Stack trace for runtime errors (worker or interpreter catch). */
  stack?: string
  /** Source line text at the failing statement. */
  sourceLine?: string
}

/**
 * Represents a parsed BASIC statement
 */
export interface BasicStatement {
  lineNumber: number
  command: string
  args: string[]
}

/**
 * Represents the state of a FOR loop
 */
export interface LoopState {
  variable: string
  start: number
  end: number
  step: number
  forLine: number
  bodyStartLine: number
  nextLine: number
}
