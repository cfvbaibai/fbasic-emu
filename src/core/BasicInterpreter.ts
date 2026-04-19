/**
 * Basic BASIC Interpreter Core - Refactored
 *
 * A streamlined interpreter for Family Basic (F-BASIC) that delegates
 * to focused utility classes for better maintainability.
 *
 * @author Family Basic IDE Team
 * @version 3.0.0
 */

import type { CstNode } from 'chevrotain'

import { logInterpreter } from '@/shared/logger'

// Import the FBasicParser
import { AnimationManager } from './animation/AnimationManager'
import { ERROR_TYPES, EXECUTION_LIMITS } from './constants'
// Import refactored components
import { ExecutionContext, ExecutionEngine } from './execution'
import { SoundService } from './execution/sound/SoundService'
import { expandStatements } from './execution/statement-expander'
import type { BasicVariable, ExecutionResult, InterpreterConfig } from './interfaces'
import { getSourceTextFromCst } from './parser/cst-helpers'
import { FBasicParser } from './parser/FBasicParser'
import { SpriteStateManager } from './sprite/SpriteStateManager'

/**
 * Main interpreter class for executing Family Basic programs
 *
 * This refactored version delegates to focused utility classes to keep
 * the main class focused on orchestration rather than implementation.
 */
export class BasicInterpreter {
  private config: InterpreterConfig
  private parser: FBasicParser
  private executionEngine?: ExecutionEngine
  private context?: ExecutionContext
  private lastSource?: string

  constructor(config?: Partial<InterpreterConfig>) {
    logInterpreter.debug('BasicInterpreter constructor called with config:', {
      hasDeviceAdapter: !!config?.deviceAdapter,
      maxIterations: config?.maxIterations,
      maxOutputLines: config?.maxOutputLines,
      enableDebugMode: config?.enableDebugMode,
      strictMode: config?.strictMode,
    })

    this.config = {
      maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_TEST,
      maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST,
      enableDebugMode: false,
      strictMode: false,
      suppressOkPrompt: false, // Default to showing OK (F-BASIC behavior)
      ...config,
    }

    logInterpreter.debug('Final config after merge:', {
      maxIterations: this.config.maxIterations,
      maxOutputLines: this.config.maxOutputLines,
      enableDebugMode: this.config.enableDebugMode,
      strictMode: this.config.strictMode,
    })

    this.parser = new FBasicParser()
  }

  /**
   * Execute BASIC code
   */
  async execute(code: string): Promise<ExecutionResult> {
    logInterpreter.debug('BasicInterpreter.execute called with code length:', code.length)
    this.lastSource = code
    try {
      // Parse the code
      const parseResult = await this.parser.parse(code)
      if (!parseResult.success) {
        logInterpreter.error('[BasicInterpreter] Parse failed:', parseResult.errors)
        return {
          success: false,
          errors:
            parseResult.errors?.map(error => ({
              line: error.location?.start?.line ?? 0,
              message: error.message,
              type: ERROR_TYPES.SYNTAX,
            })) ?? [],
          variables: new Map(),
          executionTime: 0,
        }
      }

      // Create execution context (or reuse existing one if it has device adapter)
      if (!this.context?.deviceAdapter) {
        logInterpreter.debug('[BasicInterpreter] Creating new context with sharedAnimationBuffer:', {
          hasBuffer: !!this.config.sharedAnimationBuffer,
          byteLength: this.config.sharedAnimationBuffer?.byteLength,
        })
        this.context = new ExecutionContext(this.config)
        // Set device adapter if provided
        if (this.config.deviceAdapter) {
          this.context.deviceAdapter = this.config.deviceAdapter
        }
        // Initialize sprite state manager
        this.context.spriteStateManager = new SpriteStateManager()
        // Initialize animation manager (worker passes shared buffer for isActive / MOVE(n))
        this.context.animationManager = new AnimationManager(this.config.sharedAnimationBuffer)
        // Initialize sound service for per-channel state management
        this.context.soundService = new SoundService()
        // Set device adapter in animation manager for command sending
        if (this.config.deviceAdapter) {
          this.context.animationManager.setDeviceAdapter(this.config.deviceAdapter)
        }
        this.executionEngine = new ExecutionEngine(this.context, this.config.deviceAdapter)
      } else {
        // Update existing ExecutionEngine with current output callback
        this.executionEngine = new ExecutionEngine(this.context, this.config.deviceAdapter)
      }

      // Reset context for new execution but preserve device adapter and cached states
      const preservedDeviceAdapter = this.context.deviceAdapter

      this.context.reset()

      // Extract statement nodes from CST program node and expand them
      if (parseResult.cst?.children.statement) {
        const statementsCst = parseResult.cst.children.statement
        const validStatements = Array.isArray(statementsCst)
          ? statementsCst.filter((s): s is CstNode => 'children' in s)
          : []

        // Expand statements (flatten colon-separated commands) and create label map
        const { statements, labelMap } = expandStatements(validStatements)
        this.context.statements = statements
        this.context.labelMap = labelMap
      } else {
        this.context.statements = []
        this.context.labelMap = new Map()
      }

      // Restore preserved values
      this.context.deviceAdapter = preservedDeviceAdapter

      // Execute the program
      const result = await this.executionEngine.execute()

      return result
    } catch (error) {
      logInterpreter.error('[BasicInterpreter] Execution error:', error)
      const location = this.getExecutionLocation()
      const errMsg = error instanceof Error ? error.message : String(error)
      const stackStr = error instanceof Error ? error.stack : undefined
      return {
        success: false,
        errors: [
          {
            line: location?.lineNumber ?? 0,
            message: errMsg,
            type: ERROR_TYPES.RUNTIME,
            ...(typeof stackStr === 'string' && stackStr.length > 0 && { stack: stackStr }),
            ...(location?.sourceLine && { sourceLine: location.sourceLine }),
          },
        ],
        variables: new Map(),
        arrays: new Map(),
        executionTime: 0,
      }
    }
  }

  /**
   * Reset interpreter state
   */
  reset(): void {
    if (this.executionEngine) {
      this.executionEngine.reset()
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<InterpreterConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    }

    if (this.executionEngine) {
      this.executionEngine.updateConfig(this.config)
    }
  }

  /**
   * Stop execution and cleanup resources
   */
  stop(): void {
    if (this.executionEngine) {
      this.executionEngine.stop()
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): InterpreterConfig {
    return { ...this.config }
  }

  /**
   * Check if interpreter is currently running
   */
  isRunning(): boolean {
    return this.context?.isRunning ?? false
  }

  /**
   * Get current variables
   */
  getVariables(): Map<string, BasicVariable> {
    return this.context?.variables ?? new Map()
  }

  /**
   * Get all sprite states
   */
  getSpriteStates() {
    return this.context?.spriteStateManager?.getAllSpriteStates() ?? []
  }

  /**
   * Check if sprite display is enabled
   */
  isSpriteEnabled(): boolean {
    return this.context?.spriteStateManager?.isSpriteEnabled() ?? false
  }

  /**
   * Get all movement states
   */
  getMovementStates() {
    return this.context?.animationManager?.getAllMovementStates() ?? []
  }

  /**
   * Get AnimationManager instance for updating stored positions from frontend
   */
  getAnimationManager() {
    return this.context?.animationManager ?? null
  }

  /**
   * Clear display-related state (DEF SPRITE, DEF MOVE definitions and movement states).
   * Called when IDE Clear button is clicked so worker has no sprite/move definitions.
   */
  clearDisplay(): void {
    this.context?.clearDisplay?.()
  }

  /**
   * Get current execution location for error reporting (BASIC line number and source text).
   * Returns null if context or current statement is not available.
   */
  getExecutionLocation(): { lineNumber: number; statementIndex: number; sourceLine?: string } | null {
    if (!this.context) return null
    const lineNumber = this.context.getCurrentLineNumber()
    const statement = this.context.getCurrentStatement()
    if (!statement) return { lineNumber, statementIndex: this.context.currentStatementIndex }
    let sourceLine: string | undefined
    try {
      sourceLine = getSourceTextFromCst(statement.command)
    } catch {
      sourceLine = undefined
    }
    return {
      lineNumber,
      statementIndex: statement.statementIndex,
      sourceLine: sourceLine ?? undefined,
    }
  }

  /**
   * Get the current execution context, if one has been initialized.
   * Returns undefined before any execute() or executeSingleStatement() call.
   */
  getContext(): ExecutionContext | undefined {
    return this.context
  }

  /**
   * Get the source code from the most recent execute() call.
   * Returns undefined if no program has been executed yet, or if only
   * executeSingleStatement() has been used.
   */
  getLastSource(): string | undefined {
    return this.lastSource
  }

  /**
   * Execute a single BASIC statement without line numbers (REPL mode).
   *
   * A synthetic line number is prepended for parsing. The execution context
   * is preserved between calls so variables persist across REPL statements.
   *
   * @param statementText - A single BASIC command (e.g., "PRINT 42" or "LET X = 5")
   * @returns Execution result with success/errors
   */
  async executeSingleStatement(statementText: string): Promise<ExecutionResult> {
    logInterpreter.debug('BasicInterpreter.executeSingleStatement called:', statementText)

    // Prepend synthetic line number for the parser (requires line numbers)
    const syntheticSource = `1 ${statementText}`

    // Parse the synthetic source
    const parseResult = await this.parser.parse(syntheticSource)
    if (!parseResult.success) {
      return {
        success: false,
        errors:
          parseResult.errors?.map(error => ({
            line: error.location?.start?.line ?? 0,
            message: error.message,
            type: ERROR_TYPES.SYNTAX,
          })) ?? [],
        variables: new Map(),
        executionTime: 0,
      }
    }

    // Ensure context is initialized (reuse existing if available)
    this.ensureContextInitialized()

    // Extract and expand statements from the CST
    const statementsCst = parseResult.cst?.children.statement
    const validStatements = Array.isArray(statementsCst)
      ? statementsCst.filter((s): s is CstNode => 'children' in s)
      : []

    if (validStatements.length === 0) {
      return {
        success: true,
        errors: [],
        variables: new Map(),
        executionTime: 0,
      }
    }

    const { statements, labelMap } = expandStatements(validStatements)
    this.context!.statements = statements
    this.context!.labelMap = labelMap
    this.context!.currentStatementIndex = 0
    this.context!.shouldStop = false
    this.context!.iterationCount = 0

    // Execute the single statement
    this.executionEngine = new ExecutionEngine(this.context!, this.config.deviceAdapter)
    const result = await this.executionEngine.execute()

    return result
  }

  /**
   * Re-execute the last program source that was passed to execute().
   * Creates a fresh interpreter state (reset variables, etc.) like a full RUN command.
   *
   * @throws Error if no program source has been stored
   */
  async runStoredProgram(): Promise<ExecutionResult> {
    if (this.lastSource === undefined) {
      throw new Error('No program source stored')
    }
    return this.execute(this.lastSource)
  }

  /**
   * Initialize the execution context if it does not already exist.
   * Reuses the existing context if one was created by a prior execute() call.
   */
  private ensureContextInitialized(): void {
    if (!this.context) {
      this.context = new ExecutionContext(this.config)
      if (this.config.deviceAdapter) {
        this.context.deviceAdapter = this.config.deviceAdapter
      }
      this.context.spriteStateManager = new SpriteStateManager()
      this.context.animationManager = new AnimationManager(this.config.sharedAnimationBuffer)
      this.context.soundService = new SoundService()
      if (this.config.deviceAdapter) {
        this.context.animationManager.setDeviceAdapter(this.config.deviceAdapter)
      }
    }
  }
}
