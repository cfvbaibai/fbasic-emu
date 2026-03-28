/**
 * For Statement Executor
 *
 * Handles execution of FOR statements for loop initialization from CST.
 */

import type { CstNode } from 'chevrotain'

import { DEFAULTS, ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { VariableService } from '@/core/services/VariableService'
import type { LoopState } from '@/core/state/ExecutionContext'

export class ForExecutor {
  constructor(
    private context: ExpressionEvaluator['context'],
    private evaluator: ExpressionEvaluator,
    private variableService: VariableService
  ) {}

  /**
   * Execute a FOR statement from CST
   * Initializes the loop variable and pushes loop state onto the stack
   * If loop is already active (jumped back from NEXT), skip re-initialization
   */
  execute(forStmtCst: CstNode, statementIndex: number, lineNumber: number): void {
    const identifierToken = getFirstToken(forStmtCst.children.Identifier)

    // Get all expressions (start, end, and optionally step)
    const expressions = getCstNodes(forStmtCst.children.expression)
    const startExprCst = expressions[0]
    const endExprCst = expressions[1]

    if (!identifierToken || !startExprCst || !endExprCst) {
      this.context.addError({
        line: lineNumber,
        message: 'Invalid FOR statement: missing variable or expressions',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const varName = identifierToken.image.toUpperCase()

    // Check if we're already in a loop for this variable (jumped back from NEXT)
    const existingLoop = this.context.loopStack.find(
      loop => loop.variableName === varName && loop.statementIndex === statementIndex
    )

    if (existingLoop) {
      // Loop is already active - skip re-initialization
      // This happens when FOR, PRINT, and NEXT are on the same line
      // and NEXT jumps back to re-execute the statement
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(`FOR: ${varName} loop already active, skipping re-initialization`)
      }
      return
    }

    // Evaluate start and end expressions
    const startValue = this.evaluator.evaluateExpression(startExprCst)
    const endValue = this.evaluator.evaluateExpression(endExprCst)

    // Check if values are numbers
    if (typeof startValue !== 'number' || typeof endValue !== 'number') {
      this.context.addError({
        line: lineNumber,
        message: 'FOR loop requires numeric values',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Evaluate step expression (defaults to DEFAULTS.FOR_LOOP_STEP)
    let stepValue: number = DEFAULTS.FOR_LOOP_STEP
    const stepExprCst = expressions[2] // Third expression if present
    if (stepExprCst) {
      const stepValueResult = this.evaluator.evaluateExpression(stepExprCst)
      if (typeof stepValueResult !== 'number') {
        this.context.addError({
          line: lineNumber,
          message: 'FOR STEP requires numeric value',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }
      stepValue = stepValueResult
    }

    // Initialize loop variable with start value
    this.variableService.setVariable(varName, startValue)

    // Determine if the loop should execute at all
    const shouldExecute = this.shouldExecuteLoop(startValue, endValue, stepValue)

    if (!shouldExecute) {
      // Loop condition not met: skip to after the matching NEXT statement
      // Per Family BASIC manual page 65: "When the condition is not met, the loop should not execute."
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `FOR: ${varName} = ${startValue} TO ${endValue} STEP ${stepValue} (shouldExecute: false, skipping to NEXT)`
        )
      }

      // Find the matching NEXT by scanning forward and counting nesting depth
      const nextStatementIndex = this.findMatchingNext(statementIndex)
      if (nextStatementIndex === -1) {
        this.context.addError({
          line: lineNumber,
          message: 'FOR without matching NEXT',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      // Set the loop variable to start value (spec: variable gets the start value even if loop doesn't execute)
      this.variableService.setVariable(varName, startValue)

      // Jump past the NEXT statement (NEXT itself should not execute)
      this.context.jumpToStatement(nextStatementIndex + 1)
      return
    }

    // Create loop state
    // Note: statementIndex is the current statement index where FOR is located
    // When NEXT jumps back, it should jump to the same statement (to re-execute the loop body)
    const loopState: LoopState = {
      variableName: varName,
      startValue,
      endValue,
      stepValue,
      currentValue: startValue,
      statementIndex, // Jump back to the same statement index
      shouldExecute: true,
    }

    // Push loop state onto stack
    this.context.loopStack.push(loopState)

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(
        `FOR: ${varName} = ${startValue} TO ${endValue} STEP ${stepValue} (shouldExecute: true)`
      )
    }
  }

  /**
   * Determine if loop should execute based on start, end, and step values
   */
  private shouldExecuteLoop(start: number, end: number, step: number): boolean {
    if (step > 0) {
      // Positive step: execute if start <= end
      return start <= end
    } else if (step < 0) {
      // Negative step: execute if start >= end
      return start >= end
    } else {
      // Zero step: infinite loop (should be an error, but handle gracefully)
      return false
    }
  }

  /**
   * Find the statement index of the matching NEXT for the FOR at the given index.
   * Handles nested FOR/NEXT pairs by tracking nesting depth.
   * Returns -1 if no matching NEXT is found.
   */
  private findMatchingNext(forStatementIndex: number): number {
    let depth = 0
    for (let i = forStatementIndex; i < this.context.statements.length; i++) {
      const stmt = this.context.statements[i]
      if (!stmt) continue

      const commandCst = stmt.command
      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
      if (!singleCommandCst) continue

      if (singleCommandCst.children.forStatement) {
        depth++
      } else if (singleCommandCst.children.nextStatement) {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }
    return -1
  }
}
