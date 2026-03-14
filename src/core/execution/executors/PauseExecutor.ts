/**
 * Pause Statement Executor
 *
 * Handles execution of PAUSE statements to delay program execution.
 * Uses TIMING.PAUSE_TIMING_DIVISOR for calibrated web feel - see constants.ts.
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES, TIMING } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getFirstCstNode } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class PauseExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Execute a PAUSE statement from CST.
   * Pauses execution for the specified number of PAUSE units (~12.12ms per unit on web).
   */
  async execute(pauseStmtCst: CstNode): Promise<void> {
    const expressionCst = getFirstCstNode(pauseStmtCst.children.expression)

    if (!expressionCst) {
      this.context.addError({
        line: 0,
        message: 'Invalid PAUSE statement: missing expression',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Evaluate the pause duration (in PAUSE units)
    const durationValue = this.evaluator.evaluateExpression(expressionCst)
    // Convert to number (handles both numeric and string values)
    const pauseUnits =
      typeof durationValue === 'number'
        ? Math.max(0, Math.floor(durationValue))
        : Math.max(0, Math.floor(parseFloat(String(durationValue)) || 0))

    // Convert to milliseconds using calibrated divisor (see TIMING.PAUSE_TIMING_DIVISOR)
    const durationMs = (pauseUnits * TIMING.FRAME_DURATION_MS) / TIMING.PAUSE_TIMING_DIVISOR

    if (durationMs > 0) {
      await new Promise(resolve => setTimeout(resolve, durationMs))
    }

    // Add debug output
    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`PAUSE: ${pauseUnits} units (${Math.round(durationMs)}ms)`)
    }
  }
}
