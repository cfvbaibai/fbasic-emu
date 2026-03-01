/**
 * SPRITE Statement Executor
 *
 * Handles execution of SPRITE statements to display or hide sprites.
 * Grammar:
 *   SPRITE n, X, Y - Display sprite n at position (X, Y)
 *   SPRITE n       - Hide sprite n
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

// Sprite screen dimensions
const SPRITE_SCREEN = {
  MAX_X: 255,
  MAX_Y: 239,
}

export class SpriteExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Execute a SPRITE statement from CST
   * SPRITE n [, X, Y]
   * n: sprite number (0-7)
   * X: pixel X coordinate (0-255), optional
   * Y: pixel Y coordinate (0-239), optional
   *
   * If X and Y are omitted, sprite is hidden.
   * If X and Y are provided, sprite is displayed at that position.
   */
  execute(spriteStmtCst: CstNode, lineNumber?: number): void {
    try {
      // Extract labeled expressions
      const spriteNumberExpr = getCstNodes(spriteStmtCst.children.spriteNumber)?.[0]
      const xExpr = getCstNodes(spriteStmtCst.children.x)?.[0]
      const yExpr = getCstNodes(spriteStmtCst.children.y)?.[0]

      if (!spriteNumberExpr) {
        this.context.addError({
          line: lineNumber ?? 0,
          message: 'SPRITE: Missing sprite number parameter',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      // Evaluate sprite number
      const spriteNumber = this.evaluateNumber(spriteNumberExpr, 'sprite number', lineNumber)
      if (spriteNumber === null) {
        return // Error already added
      }

      // Validate sprite number range
      if (!this.validateSpriteNumber(spriteNumber, lineNumber)) return

      // Check if this is a hide (SPRITE n) or display (SPRITE n, X, Y) command
      if (!xExpr || !yExpr) {
        // SPRITE n - Hide sprite
        // Optimization: Check if already hidden
        const currentState = this.context.spriteStateManager?.getSpriteState(spriteNumber)
        if (currentState && !currentState.visible) {
          // Already hidden, no need to update or notify
          return
        }

        if (this.context.spriteStateManager) {
          this.context.spriteStateManager.hideSprite(spriteNumber)
        }

        if (this.context.config.enableDebugMode) {
          this.context.addDebugOutput(`SPRITE: Hidden sprite ${spriteNumber}`)
        }
      } else {
        // SPRITE n, X, Y - Display sprite
        const x = this.evaluateNumber(xExpr, 'X coordinate', lineNumber)
        const y = this.evaluateNumber(yExpr, 'Y coordinate', lineNumber)

        if (x === null || y === null) {
          return // Error already added
        }

        // Validate coordinate ranges
        if (!this.validateCoordinate(x, SPRITE_SCREEN.MAX_X, 'X', lineNumber)) return
        if (!this.validateCoordinate(y, SPRITE_SCREEN.MAX_Y, 'Y', lineNumber)) return

        // Optimization: Check if position already matches
        const currentState = this.context.spriteStateManager?.getSpriteState(spriteNumber)
        if (currentState && currentState.visible && currentState.x === x && currentState.y === y) {
          // Already at same position, no need to update or notify
          return
        }

        // Display sprite via sprite state manager
        if (this.context.spriteStateManager) {
          try {
            this.context.spriteStateManager.displaySprite(spriteNumber, x, y)
          } catch (error) {
            this.context.addError({
              line: lineNumber ?? 0,
              message: `SPRITE: ${error instanceof Error ? error.message : String(error)}`,
              type: ERROR_TYPES.RUNTIME,
            })
            return
          }
        }

        if (this.context.config.enableDebugMode) {
          this.context.addDebugOutput(`SPRITE: Displayed sprite ${spriteNumber} at (${x}, ${y})`)
        }
      }

      // Notify main thread of sprite state change
      this.notifySpriteStatesChanged()
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `SPRITE: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
    }
  }

  private evaluateNumber(expr: CstNode, paramName: string, lineNumber?: number): number | null {
    try {
      const value = this.evaluator.evaluateExpression(expr)
      const num = typeof value === 'number' ? Math.floor(value) : Math.floor(parseFloat(String(value)) || 0)
      return num
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `SPRITE: Error evaluating ${paramName}: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return null
    }
  }

  private validateSpriteNumber(num: number, lineNumber?: number): boolean {
    if (num < 0 || num > 7) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `SPRITE: Sprite number out of range (0-7), got ${num}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return false
    }
    return true
  }

  private validateCoordinate(coord: number, max: number, axis: string, lineNumber?: number): boolean {
    if (coord < 0 || coord > max) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `SPRITE: ${axis} coordinate out of range (0-${max}), got ${coord}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return false
    }
    return true
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
