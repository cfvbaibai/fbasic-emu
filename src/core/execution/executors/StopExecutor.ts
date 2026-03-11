import type { CstNode } from 'chevrotain'

import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class StopExecutor {
  constructor(private context: ExecutionContext) {}

  /**
   * Pause execution and preserve state for later CONT.
   */
  execute(_stopStmtCst: CstNode): void {
    // Continue should resume from the next statement after STOP.
    this.context.nextStatement()
    this.context.isStopPaused = true
    this.context.shouldStop = true
    this.context.isRunning = false

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput('STOP: execution paused')
    }
  }
}
