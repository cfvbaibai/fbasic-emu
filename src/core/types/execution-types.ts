/**
 * Execution engine types for the Family Basic Interpreter
 *
 * Interpreter configuration, execution results, command/expression handler
 * contracts, and parser/highlighter info interfaces.
 */

import type { SpriteState } from '@/core/sprite/types'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicArrayValue } from '@/core/types/BasicTypes'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import type { BasicError, BasicStatement, BasicVariable } from '@/core/types/state-types'

/**
 * Configuration for the BASIC interpreter
 */
export interface InterpreterConfig {
  maxIterations: number
  maxOutputLines: number
  enableDebugMode: boolean
  strictMode: boolean
  deviceAdapter?: BasicDeviceAdapter
  /** Shared animation state buffer (positions + isActive). Used by worker for XPOS/YPOS and MOVE(n). */
  sharedAnimationBuffer?: SharedArrayBuffer
  /** Shared display state buffer (screen + sprites + cursor + scalars). Used for integration testing. */
  sharedDisplayBuffer?: SharedArrayBuffer
  /** Suppress "OK" prompt when program ends successfully (default: false for F-BASIC compatibility) */
  suppressOkPrompt?: boolean
}

/**
 * Result of code execution
 */
export interface ExecutionResult {
  success: boolean
  errors: BasicError[]
  variables: Map<string, BasicVariable>
  arrays?: Map<string, BasicArrayValue> // Arrays declared/used during execution
  executionTime: number
  spriteStates?: SpriteState[] // Sprite states from DEF SPRITE and SPRITE commands
  spriteEnabled?: boolean // Whether sprite display is enabled (SPRITE ON/OFF)
  // movementStates removed - read from shared buffer instead
}

/**
 * Interface for command handlers
 */
export interface CommandHandler {
  execute(_statement: BasicStatement, _context: ExecutionContext): Promise<void>
  validate(_statement: BasicStatement): BasicError[]
}

/**
 * Interface for expression evaluators
 */
export interface ExpressionEvaluator {
  evaluate(_expression: string, _context: ExecutionContext): number | string
  validate(_expression: string): BasicError[]
}

/**
 * Interface for code parsers
 */
export interface CodeParser {
  parse(_code: string): BasicStatement[]
  validate(_statements: BasicStatement[]): BasicError[]
}

/**
 * Interface for syntax highlighters
 */
export interface SyntaxHighlighter {
  highlight(_code: string): string
  getKeywords(): Array<{ word: string; type: string; color: string }>
}

/**
 * Interface for parser information
 */
export interface ParserInfo {
  name: string
  version: string
  capabilities: string[]
  features: string[]
  /**
   * Interpreter-facing statement surface exposed to IDE capabilities.
   * Keep aligned with routed/executable command support.
   */
  supportedStatements: string[]
  /**
   * Function call surface exposed to IDE capabilities.
   * Keep aligned with FunctionEvaluator support.
   */
  supportedFunctions: string[]
  supportedOperators: string[]
}

/**
 * Interface for syntax highlighter information
 */
export interface HighlighterInfo {
  name: string
  version: string
  features: string[]
}

/**
 * Interface for error reporters
 */
export interface ErrorReporter {
  report(_error: BasicError): void
  getErrors(): BasicError[]
  clearErrors(): void
}

/**
 * Interface for output managers
 */
export interface OutputManager {
  write(_text: string): void
  writeln(_text?: string): void
  getOutput(): string
  clear(): void
}

/**
 * Screen cell interface for screen buffer
 */
export interface ScreenCell {
  character: string
  colorPattern: number
  x: number
  y: number
}
