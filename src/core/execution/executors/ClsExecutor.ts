/**
 * CLS Statement Executor
 *
 * Handles execution of CLS statements to clear the screen and hide all sprites.
 */

import type { CstNode } from 'chevrotain'

import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class ClsExecutor {
  constructor(private context: ExecutionContext) {}

  /**
   * Execute a CLS statement from CST
   * Clears the background screen and hides all sprites
   */
  execute(_clsStmtCst: CstNode): void {
    // Clear screen via device adapter
    if (this.context.deviceAdapter) {
      this.context.deviceAdapter.clearScreen()
    }

    // Hide all sprites (visible = false) but preserve definitions
    if (this.context.spriteStateManager) {
      this.context.spriteStateManager.hideAllSprites()
    }

    // Notify main thread of sprite state change
    this.notifySpriteStatesChanged()

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput('CLS: Screen cleared')
    }
  }

  /**
   * Notify main thread that sprite states have changed
   */
  private notifySpriteStatesChanged(): void {
    if (this.context.spriteStateManager && this.context.deviceAdapter?.sendSpriteStates) {
      this.context.deviceAdapter.sendSpriteStates(
        this.context.spriteStateManager.getAllSpriteStates(),
        this.context.spriteStateManager.isSpriteEnabled()
      )
    }
  }
}
