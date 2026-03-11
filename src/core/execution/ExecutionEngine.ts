/**
 * Execution Engine
 *
 * Main execution engine that orchestrates BASIC program execution.
 */

import { DEFAULTS, ERROR_TYPES } from '@/core/constants'
import { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import type { BasicDeviceAdapter, ExecutionResult } from '@/core/interfaces'
import { DataService } from '@/core/services/DataService'
import { VariableService } from '@/core/services/VariableService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

import { StatementRouter } from './StatementRouter'

export class ExecutionEngine {
  private context: ExecutionContext
  private evaluator: ExpressionEvaluator
  private variableService: VariableService
  private dataService: DataService
  private statementRouter: StatementRouter
  private shouldYieldToEventLoop: boolean
  private yieldInterval: number

  constructor(context: ExecutionContext, _deviceAdapter?: BasicDeviceAdapter) {
    this.context = context

    // Initialize services
    this.evaluator = new ExpressionEvaluator(this.context)
    this.variableService = new VariableService(this.context, this.evaluator)
    this.dataService = new DataService(this.context, this.evaluator)
    this.statementRouter = new StatementRouter(this.context, this.evaluator, this.variableService, this.dataService)

    // Determine if we should yield to event loop (production mode only)
    // In test mode, we don't yield to keep tests fast and deterministic
    const isTestMode = this.context.config.maxIterations <= 10000
    this.shouldYieldToEventLoop = isTestMode
      ? DEFAULTS.ASYNC_EXECUTION.ENABLED_TEST
      : DEFAULTS.ASYNC_EXECUTION.ENABLED_PRODUCTION
    this.yieldInterval = DEFAULTS.ASYNC_EXECUTION.YIELD_INTERVAL
  }

  /**
   * Preprocess statements (statements are already expanded)
   */
  private preprocessStatements(): void {
    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`Preprocessed ${this.context.statements.length} expanded statements`)
      for (let i = 0; i < this.context.statements.length; i++) {
        const stmt = this.context.statements[i]
        if (stmt) {
          this.context.addDebugOutput(`Statement ${i}: Line ${stmt.lineNumber}`)
        }
      }
      this.context.addDebugOutput(`Label map: ${this.context.labelMap.size} line numbers`)
    }
  }

  /**
   * Execute the BASIC program
   */
  async execute(): Promise<ExecutionResult> {
    return this.runExecutionLoop(true)
  }

  /**
   * Continue execution after STOP pause without resetting statements/data.
   */
  async continueExecution(): Promise<ExecutionResult> {
    return this.runExecutionLoop(false)
  }

  private async runExecutionLoop(preprocess: boolean): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      if (preprocess) {
        // Preprocess DATA statements
        this.dataService.preprocessDataStatements()

        // Preprocess statements
        this.preprocessStatements()
      }

      // Start execution
      this.context.isRunning = true
      this.context.shouldStop = false

      // Main execution loop
      while (this.context.shouldContinue()) {
        const expandedStatement = this.context.getCurrentStatement()
        if (!expandedStatement) break

        // Set current line number for error reporting
        this.context.setCurrentLineNumber(expandedStatement.lineNumber)

        // Track the statement index before execution
        const statementIndexBefore = this.context.currentStatementIndex

        if (this.context.config.enableDebugMode) {
          this.context.addDebugOutput(
            `Executing statement ${statementIndexBefore}: Line ${expandedStatement.lineNumber}`
          )
        }

        // Execute the statement
        await this.statementRouter.executeStatement(expandedStatement)

        // Check if a runtime error occurred (execution should have been halted)
        if (!this.context.isRunning) {
          break
        }

        // Only move to next statement if the index wasn't modified by the statement
        if (this.context.currentStatementIndex === statementIndexBefore) {
          this.context.nextStatement()
          if (this.context.config.enableDebugMode) {
            this.context.addDebugOutput(`Moved to next statement: ${this.context.currentStatementIndex}`)
          }
        } else {
          if (this.context.config.enableDebugMode) {
            this.context.addDebugOutput(`Statement index modified to: ${this.context.currentStatementIndex}`)
          }
        }

        // Increment iteration count
        this.context.incrementIteration()

        // Yield to event loop periodically to keep UI responsive during long-running loops
        // This allows the browser to process events (input, stop button, screen updates)
        if (this.shouldYieldToEventLoop && this.context.iterationCount % this.yieldInterval === 0) {
          await new Promise<void>(resolve => setTimeout(resolve, DEFAULTS.ASYNC_EXECUTION.YIELD_DURATION))
        }
      }

      // Execution completed
      this.context.isRunning = false

      // STOP pauses execution and preserves state for CONT.
      if (this.context.isStopPaused) {
        return {
          success: this.context.getErrors().length === 0,
          errors: this.context.getErrors(),
          variables: this.context.variables,
          arrays: this.context.arrays,
          executionTime: Date.now() - startTime,
          spriteStates: this.context.spriteStateManager?.getAllSpriteStates(),
          spriteEnabled: this.context.spriteStateManager?.isSpriteEnabled(),
        }
      }

      // Check for unclosed FOR loops
      if (this.context.loopStack.length > 0) {
        this.context.addError({
          line: 0,
          message: 'Missing NEXT statement for FOR loop',
          type: ERROR_TYPES.RUNTIME,
        })
      }

      // Emit "OK" to screen when program ends successfully (F-BASIC prompt behavior)
      // Can be suppressed for testing via suppressOkPrompt config option
      if (this.context.getErrors().length === 0 && !this.context.config.suppressOkPrompt) {
        this.context.addOutput('OK\n')
      }

      return {
        success: this.context.getErrors().length === 0,
        errors: this.context.getErrors(),
        variables: this.context.variables,
        arrays: this.context.arrays,
        executionTime: Date.now() - startTime,
        spriteStates: this.context.spriteStateManager?.getAllSpriteStates(),
        spriteEnabled: this.context.spriteStateManager?.isSpriteEnabled(),
      }
    } catch (error) {
      this.context.isRunning = false
      this.context.addError({
        line: 0,
        message: `Execution error: ${error}`,
        type: ERROR_TYPES.RUNTIME,
      })

      return {
        success: false,
        errors: this.context.getErrors(),
        variables: this.context.variables,
        arrays: this.context.arrays,
        executionTime: Date.now() - startTime,
        spriteStates: this.context.spriteStateManager?.getAllSpriteStates(),
        spriteEnabled: this.context.spriteStateManager?.isSpriteEnabled(),
      }
    }
  }

  /**
   * Stop execution
   */
  stop(): void {
    this.context.shouldStop = true
    this.context.isRunning = false
  }

  /**
   * Reset execution state
   */
  reset(): void {
    this.context.reset()
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<typeof this.context.config>): void {
    this.context.config = {
      ...this.context.config,
      ...newConfig,
    }
  }
}
