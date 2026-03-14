/**
 * ON Statement Executor
 *
 * Handles execution of ON statements from CST.
 * Jumps to line number based on expression value (1 = first, 2 = second, etc.)
 * Supports ON ... GOTO and ON ... GOSUB
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getFirstCstNode, getFirstToken, getTokens } from '@/core/parser/cst-helpers'
import type { DataService } from '@/core/services/DataService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class OnExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator,
    private dataService?: DataService
  ) {}

  /**
   * Execute an ON statement from CST
   * ON expression {GOTO | GOSUB} line number(, line number, ...)
   *
   * If expression value is 1, jumps to first line number
   * If expression value is 2, jumps to second line number
   * If expression value is 0 or exceeds the number of line numbers, proceeds to next line
   */
  execute(onStmtCst: CstNode, lineNumber: number): void {
    // Evaluate the expression
    const expressionCst = getFirstCstNode(onStmtCst.children.expression)
    if (!expressionCst) {
      this.context.addError({
        line: lineNumber,
        message: 'ON: missing expression',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    let expressionValue: number | string
    try {
      expressionValue = this.evaluator.evaluateExpression(expressionCst)
    } catch (error) {
      this.context.addError({
        line: lineNumber,
        message: `ON: failed to evaluate expression: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Convert to integer (Family BASIC uses integer values)
    // If it's a string, try to convert it
    const numericValue = typeof expressionValue === 'string' ? parseFloat(expressionValue) : Number(expressionValue)

    if (!Number.isFinite(numericValue)) {
      this.context.addError({
        line: lineNumber,
        message: 'ON: expression must evaluate to a number',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const index = Math.floor(numericValue)

    // If index is 0 or negative, or exceeds the number of line numbers, proceed to next line
    if (index < 1) {
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(`ON: expression value ${index} is less than 1, proceeding to next line`)
      }
      return // Proceed to next line
    }

    // Get the line number list
    const lineNumberListCst = getFirstCstNode(onStmtCst.children.lineNumberList)
    if (!lineNumberListCst) {
      this.context.addError({
        line: lineNumber,
        message: 'ON: missing line number list',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Get all line number tokens
    const lineNumberTokens = getTokens(lineNumberListCst.children.NumberLiteral)
    if (!lineNumberTokens || lineNumberTokens.length === 0) {
      this.context.addError({
        line: lineNumber,
        message: 'ON: no line numbers specified',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // If index exceeds the number of line numbers, proceed to next line
    if (index > lineNumberTokens.length) {
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `ON: expression value ${index} exceeds number of line numbers (${lineNumberTokens.length}), proceeding to next line`
        )
      }
      return // Proceed to next line
    }

    // Get the target line number (index is 1-based)
    const targetLineNumberToken = lineNumberTokens[index - 1]
    if (!targetLineNumberToken) {
      this.context.addError({
        line: lineNumber,
        message: `ON: invalid line number at index ${index}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const targetLineNumber = parseInt(targetLineNumberToken.image, 10)
    if (isNaN(targetLineNumber)) {
      this.context.addError({
        line: lineNumber,
        message: `ON: invalid line number: ${targetLineNumberToken.image}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Find the statement index for the target line number
    const targetStatementIndex = this.context.findStatementIndexByLine(targetLineNumber)
    if (targetStatementIndex === -1) {
      this.context.addError({
        line: lineNumber,
        message: `ON: line number ${targetLineNumber} not found`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Check which keyword is used: GOTO, GOSUB, RETURN, or RESTORE
    const gotoToken = getFirstToken(onStmtCst.children.Goto)
    const gosubToken = getFirstToken(onStmtCst.children.Gosub)
    const returnToken = getFirstToken(onStmtCst.children.Return)
    const restoreToken = getFirstToken(onStmtCst.children.Restore)

    if (gosubToken) {
      // ON ... GOSUB: push return address to stack
      // Return address is the statement index after the current ON statement
      const returnStatementIndex = this.context.currentStatementIndex + 1
      this.context.gosubStack.push(returnStatementIndex)

      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `ON-GOSUB: jumping to line ${targetLineNumber} (statement index ${targetStatementIndex}), return address: ${returnStatementIndex}`
        )
      }

      // Jump to the target statement
      this.context.jumpToStatement(targetStatementIndex)
    } else if (gotoToken) {
      // ON ... GOTO: simple jump
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `ON-GOTO: jumping to line ${targetLineNumber} (statement index ${targetStatementIndex})`
        )
      }

      // Jump to the target statement
      this.context.jumpToStatement(targetStatementIndex)
    } else if (returnToken) {
      // ON ... RETURN: return to the specified line number
      // Similar to RETURN with line number, but selected from list based on expression
      // RETURN with line number doesn't require GOSUB - it just jumps to that line
      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `ON-RETURN: returning to line ${targetLineNumber} (statement index ${targetStatementIndex})`
        )
      }

      // Jump to the target statement
      this.context.jumpToStatement(targetStatementIndex)
    } else if (restoreToken) {
      // ON ... RESTORE: restore data pointer to the specified line number
      if (!this.dataService) {
        this.context.addError({
          line: lineNumber,
          message: 'ON-RESTORE: DataService not available',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(`ON-RESTORE: restoring data pointer to line ${targetLineNumber}`)
      }

      // Restore data pointer to the target line number
      this.dataService.restoreData(targetLineNumber)
      // RESTORE doesn't jump, it just restores the data pointer, so we proceed to next line
    } else {
      this.context.addError({
        line: lineNumber,
        message: 'ON: missing GOTO, GOSUB, RETURN, or RESTORE keyword',
        type: ERROR_TYPES.RUNTIME,
      })
    }
  }
}
