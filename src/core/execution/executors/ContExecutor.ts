import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class ContExecutor {
  constructor(private context: ExecutionContext) {}

  /**
   * CONT can only run when execution is paused by STOP.
   */
  execute(_contStmtCst: CstNode, lineNumber: number): void {
    if (!this.context.isStopPaused) {
      this.context.addError({
        line: lineNumber,
        message: 'CONT: no paused program to continue',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    this.context.isStopPaused = false

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput('CONT: resuming execution')
    }
  }
}
