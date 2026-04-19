/**
 * Execution Context
 *
 * Holds the state and context needed for BASIC program execution.
 */

import type { AnimationManager } from '@/core/animation/AnimationManager'
import { ERROR_TYPES } from '@/core/constants'
import type { SoundService } from '@/core/execution/sound/SoundService'
import type { ExpandedStatement } from '@/core/execution/statement-expander'
import type { SpriteStateManager } from '@/core/sprite/SpriteStateManager'
import type { BasicArrayValue, BasicScalarValue } from '@/core/types/BasicTypes'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import type { InterpreterConfig } from '@/core/types/execution-types'
import type { BasicError, BasicVariable } from '@/core/types/state-types'
import { logInterpreter } from '@/shared/logger'

export interface LoopState {
  variableName: string
  startValue: number
  endValue: number
  stepValue: number
  currentValue: number
  statementIndex: number // Index in expanded statements list
  shouldExecute?: boolean
}

export class ExecutionContext {
  // Core state
  public variables: Map<string, BasicVariable> = new Map()
  public isRunning = false
  public shouldStop = false
  public externallyStopped = false
  public currentStatementIndex = 0
  public statements: ExpandedStatement[] = [] // Expanded statements (flat list)
  public labelMap: Map<number, number[]> = new Map() // Line number -> statement indices
  public iterationCount = 0
  private currentLineNumber: number = 0 // Current line number being executed

  // Configuration
  public config: InterpreterConfig

  // Control flow
  public loopStack: LoopState[] = []
  public gosubStack: number[] = [] // Stack for GOSUB/RETURN

  // Data management
  public dataValues: BasicScalarValue[] = [] // Storage for DATA values
  public dataIndex = 0 // Current position in DATA
  public arrays: Map<string, BasicArrayValue> = new Map() // Array storage

  // Device integration
  public deviceAdapter?: BasicDeviceAdapter
  public spriteStateManager?: SpriteStateManager
  public animationManager?: AnimationManager
  public soundService?: SoundService

  private errors: BasicError[] = []

  constructor(config: InterpreterConfig) {
    this.config = config
  }

  /**
   * Reset the execution context to initial state
   */
  reset(): void {
    this.variables.clear()
    this.isRunning = false
    this.shouldStop = false
    this.externallyStopped = false
    this.currentStatementIndex = 0
    this.statements = []
    this.labelMap.clear()
    this.iterationCount = 0
    this.loopStack = []
    this.gosubStack = []
    this.dataValues = []
    this.dataIndex = 0
    this.arrays.clear()
    this.currentLineNumber = 0
    this.errors = []

    // Reset sprite and animation managers if they exist
    if (this.spriteStateManager) {
      this.spriteStateManager.clear()
    }
    if (this.animationManager) {
      this.animationManager.reset()
    }
    if (this.soundService) {
      this.soundService.reset()
    }
  }

  /**
   * Clear the screen buffer without resetting variables or control flow.
   * Used for REPL CLS — preserves execution state while clearing visual output.
   */
  clearScreen(): void {
    this.deviceAdapter?.clearScreen()
  }

  /**
   * Clear display-related state only (DEF SPRITE state, DEF MOVE definitions and movement states).
   * Used when IDE Clear button is clicked so worker has no sprite/move definitions.
   */
  clearDisplay(): void {
    if (this.spriteStateManager) {
      this.spriteStateManager.clear()
    }
    if (this.animationManager) {
      this.animationManager.reset()
    }
  }

  /**
   * Add output to the context
   */
  addOutput(value: string): void {
    this.deviceAdapter?.printOutput(value)
  }

  /**
   * Add error to the context
   * Runtime errors are fatal and halt execution immediately
   */
  addError(error: BasicError): void {
    this.deviceAdapter?.errorOutput(error.message)
    this.errors.push(error)

    // Runtime errors are fatal - halt execution immediately
    if (error.type === ERROR_TYPES.RUNTIME) {
      this.shouldStop = true
      this.isRunning = false
    }
  }

  /**
   * Get errors
   */
  getErrors(): BasicError[] {
    return this.errors
  }

  /**
   * Add debug output
   */
  addDebugOutput(message: string): void {
    if (this.config.enableDebugMode) {
      this.deviceAdapter?.debugOutput(message)
    }
  }

  /**
   * Check if execution should continue
   */
  shouldContinue(): boolean {
    return (
      this.isRunning &&
      !this.shouldStop &&
      this.iterationCount < this.config.maxIterations &&
      this.currentStatementIndex < this.statements.length
    )
  }

  /**
   * Increment iteration count and check limits.
   * Only applies count-based limit when maxIterations is finite (test mode).
   * Production mode (maxIterations = Infinity) has no iteration limit.
   */
  incrementIteration(): void {
    this.iterationCount++

    // Only check limit if maxIterations is finite (test mode)
    if (this.config.maxIterations !== Infinity && this.iterationCount >= this.config.maxIterations) {
      this.addError({
        line: 0,
        message: 'Maximum iterations exceeded',
        type: ERROR_TYPES.RUNTIME,
      })
      this.shouldStop = true
    }
  }

  /**
   * Get current statement
   */
  getCurrentStatement(): ExpandedStatement | undefined {
    return this.statements[this.currentStatementIndex]
  }

  /**
   * Move to next statement
   */
  nextStatement(): void {
    this.currentStatementIndex++
  }

  /**
   * Jump to statement by index
   */
  jumpToStatement(index: number): void {
    this.currentStatementIndex = index
  }

  /**
   * Find first statement index by line number (for GOTO/GOSUB)
   */
  findStatementIndexByLine(lineNumber: number): number {
    const indices = this.labelMap.get(lineNumber)
    if (indices && indices.length > 0) {
      const firstIndex = indices[0]
      return firstIndex ?? -1
    }
    return -1
  }

  /**
   * Get the current line number being executed
   */
  getCurrentLineNumber(): number {
    return this.currentLineNumber
  }

  /**
   * Set the current line number being executed
   */
  setCurrentLineNumber(lineNumber: number): void {
    this.currentLineNumber = lineNumber
  }

  /**
   * Get joystick state (cross buttons)
   */
  getStickState(joystickId: number): number {
    // Use device adapter if available, otherwise fall back to cached state
    if (this.deviceAdapter) {
      return this.deviceAdapter.getStickState(joystickId)
    }
    return 0
  }

  /**
   * Get trigger state (action buttons)
   */
  consumeStrigState(joystickId: number): number {
    // Use consumeTriggerState if available
    if (this.deviceAdapter) {
      const consumedValue = this.deviceAdapter.consumeStrigState(joystickId)

      if (consumedValue > 0) {
        logInterpreter.debug(`STRIG event consumed: joystickId=${joystickId}, value=${consumedValue}`)
        return consumedValue
      }
    }
    return 0
  }

  /**
   * Get sprite position (XPOS/YPOS functions)
   */
  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    if (this.deviceAdapter) {
      return this.deviceAdapter.getSpritePosition(actionNumber)
    }
    return null
  }
}
