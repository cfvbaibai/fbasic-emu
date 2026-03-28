/**
 * CLS Statement Executor
 *
 * Clears the **background screen** only.
 *
 * IMPORTANT: CLS does NOT affect sprites. Do NOT add sprite hiding/clearing logic here.
 *
 * The F-BASIC hardware has two separate screen layers:
 *   1. Background screen — text, BG GRAPHIC (cleared by CLS)
 *   2. Sprite screen — animated characters overlaid on top (not affected by CLS)
 *
 * Evidence from the F-BASIC manual (page 71):
 *   "Clears the background screen. BG GRAPHIC copied to the background screen
 *    will disappear at the same time."
 *   No mention of sprites — CLS only touches the background layer.
 *
 * Evidence from the shooting game sample (page 101):
 *   `370 PLAY "01C1G1A1C1D1":CLS:SPRITE OFF`
 *   CLS and SPRITE OFF are separate commands, confirming CLS alone does not
 *   hide or clear sprites. Use SPRITE OFF to hide the sprite layer, or
 *   `SPRITE n` (without coordinates) to hide individual sprites.
 *
 * See also: SPRITE ON/OFF (page 89), CGEN (page 71)
 */

import type { CstNode } from 'chevrotain'

import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class ClsExecutor {
  constructor(private context: ExecutionContext) {}

  /**
   * Execute a CLS statement from CST.
   * Clears the background screen only. Sprites are NOT affected.
   */
  execute(_clsStmtCst: CstNode): void {
    // Clear background screen via device adapter
    // DO NOT add sprite logic here — see file-level comment for rationale
    if (this.context.deviceAdapter) {
      this.context.deviceAdapter.clearScreen()
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput('CLS: Screen cleared')
    }
  }
}
