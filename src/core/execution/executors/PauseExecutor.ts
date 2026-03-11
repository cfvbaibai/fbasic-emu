/**
 * Pause Statement Executor
 *
 * Handles execution of PAUSE statements to delay program execution.
 * F-BASIC PAUSE timing maps to roughly 8.33ms per PAUSE unit in this runtime,
 * i.e. one quarter of the nominal 30fps frame duration.
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
   * Pauses execution for the specified number of PAUSE units.
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
    const pauseUnits =
      typeof durationValue === 'number'
        ? Math.max(0, Math.floor(durationValue))
        : Math.max(0, Math.floor(parseFloat(String(durationValue)) || 0))

    // 1 PAUSE unit ~= quarter frame (~8.33ms when FRAME_DURATION_MS is 33.33ms)
    const durationMs = (pauseUnits * TIMING.FRAME_DURATION_MS) / 4

    if (durationMs > 0) {
      await new Promise(resolve => setTimeout(resolve, durationMs))
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`PAUSE: ${pauseUnits} units (${Math.round(durationMs)}ms)`)
    }
  }
}
