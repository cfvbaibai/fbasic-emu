/**
 * BGPLAY Statement Executor
 *
 * Handles execution of BGPLAY statements for background music/sound playback.
 * Format: BGPLAY string-expression
 * Example: BGPLAY "CRDRE", BGPLAY "C:E:G"
 *
 * Architecture:
 * - Uses SoundService to compile music with per-channel state management
 * - Passes CompiledAudio to device adapter via playSoundBackground (fire-and-forget)
 * - Does NOT await audio completion - execution continues immediately
 * - No PLAY_SOUND_COMPLETE message is expected for BGPLAY
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class BgplayExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Execute a BGPLAY statement from CST
   * Plays music in the background according to string data specification.
   * Does NOT block - execution continues immediately after dispatching audio.
   */
  async execute(bgplayStmtCst: CstNode, lineNumber?: number): Promise<void> {
    // 1. Get expression from CST
    const expressions = getCstNodes(bgplayStmtCst.children.expression)

    if (expressions.length < 1) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'BGPLAY: Expected a string expression',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const musicStringExpr = expressions[0]

    if (!musicStringExpr) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'BGPLAY: Invalid argument',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // 2. Evaluate music string expression
    let musicString: string

    try {
      const value = this.evaluator.evaluateExpression(musicStringExpr)

      // BGPLAY requires a string
      if (typeof value !== 'string') {
        this.context.addError({
          line: lineNumber ?? 0,
          message: `BGPLAY: Expected string, got ${typeof value}`,
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      musicString = value
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `BGPLAY: Error evaluating expression: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // 3. Compile music string to audio using SoundService
    if (!this.context.soundService) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'BGPLAY: Sound service not available',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    let compiledAudio
    try {
      compiledAudio = this.context.soundService.compileMusic(musicString)
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `BGPLAY: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // 4. Dispatch audio to device adapter (fire-and-forget, no await)
    if (this.context.deviceAdapter?.playSoundBackground) {
      this.context.deviceAdapter.playSoundBackground(compiledAudio)
    }

    // 5. Debug output
    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`BGPLAY: "${musicString}"`)
    }
  }
}
