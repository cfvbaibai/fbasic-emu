/**
 * Next Statement Executor
 *
 * Handles execution of NEXT statements for loop continuation from CST.
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { VariableService } from '@/core/services/VariableService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class NextExecutor {
  constructor(
    private context: ExecutionContext,
    private variableService: VariableService
  ) {}

  /**
   * Execute a NEXT statement from CST
   * Increments the loop variable and checks if loop should continue
   * Returns true if loop should continue, false if loop should exit
   *
   * Note: Family BASIC spec states that NEXT cannot have a variable name
   */
  execute(nextStmtCst: CstNode, lineNumber: number): boolean {
    // Get the current loop from the stack
    // NEXT always refers to the innermost active loop
    if (this.context.loopStack.length === 0) {
      this.context.addError({
        line: lineNumber,
        message: 'NEXT without FOR',
        type: ERROR_TYPES.RUNTIME,
      })
      return false
    }

    const loopState = this.context.loopStack[this.context.loopStack.length - 1]!

    // Read the current variable value to respect any user modifications inside the loop body
    const actualVariable = this.variableService.getVariable(loopState.variableName)
    const currentValue = actualVariable && typeof actualVariable.value === 'number'
      ? actualVariable.value
      : loopState.currentValue

    // Compute next value from the actual current value
    loopState.currentValue = currentValue + loopState.stepValue

    // Update the actual variable
    this.variableService.setVariable(loopState.variableName, loopState.currentValue)

    // Check if loop should continue
    const shouldContinue = this.shouldContinueLoop(loopState.currentValue, loopState.endValue, loopState.stepValue)

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(
        `NEXT: ${loopState.variableName} = ${loopState.currentValue} (shouldContinue: ${shouldContinue})`
      )
    }

    if (shouldContinue) {
      // Jump back to the FOR statement
      this.context.jumpToStatement(loopState.statementIndex)
    } else {
      // Loop is done - pop from stack
      this.context.loopStack.pop()
    }

    return shouldContinue
  }

  /**
   * Determine if loop should continue based on current value, end value, and step
   */
  private shouldContinueLoop(current: number, end: number, step: number): boolean {
    if (step > 0) {
      // Positive step: continue if current <= end
      return current <= end
    } else if (step < 0) {
      // Negative step: continue if current >= end
      return current >= end
    } else {
      // Zero step: should not happen (handled in FOR)
      return false
    }
  }
}
