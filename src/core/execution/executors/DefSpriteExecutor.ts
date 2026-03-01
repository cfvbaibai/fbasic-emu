/**
 * DEF SPRITE Statement Executor
 *
 * Handles execution of DEF SPRITE statements to define sprite graphics.
 * Grammar: DEF SPRITE n, (A, B, C, D, E) = character set
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getAdditiveFromExpression, getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import { convertCharacterSetToTiles, stringToCharCodes } from '@/core/sprite/characterSetConverter'
import type { DefSpriteDefinition } from '@/core/sprite/types'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class DefSpriteExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Execute a DEF SPRITE statement from CST
   * DEF SPRITE n, (A, B, C, D, E) = character set
   * n: sprite number (0-7)
   * A: color combination (0-3)
   * B: size (0=8×8, 1=16×16)
   * C: priority (0=front, 1=behind background)
   * D: horizontal inversion (0=normal, 1=inverted)
   * E: vertical inversion (0=normal, 1=inverted)
   * character set: string literal or CHR$ expression
   */
  execute(defSpriteStmtCst: CstNode, lineNumber?: number): void {
    try {
      // Extract labeled expressions
      const spriteNumberExpr = getCstNodes(defSpriteStmtCst.children.spriteNumber)?.[0]
      const colorCombinationExpr = getCstNodes(defSpriteStmtCst.children.colorCombination)?.[0]
      const sizeExpr = getCstNodes(defSpriteStmtCst.children.size)?.[0]
      const priorityExpr = getCstNodes(defSpriteStmtCst.children.priority)?.[0]
      const invertXExpr = getCstNodes(defSpriteStmtCst.children.invertX)?.[0]
      const invertYExpr = getCstNodes(defSpriteStmtCst.children.invertY)?.[0]
      const characterSetExpr = getCstNodes(defSpriteStmtCst.children.characterSet)?.[0]

      if (
        !spriteNumberExpr ||
        !colorCombinationExpr ||
        !sizeExpr ||
        !priorityExpr ||
        !invertXExpr ||
        !invertYExpr ||
        !characterSetExpr
      ) {
        this.context.addError({
          line: lineNumber ?? 0,
          message: 'DEF SPRITE: Missing required parameters',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      // Evaluate parameters
      const spriteNumber = this.evaluateNumber(spriteNumberExpr, 'sprite number', lineNumber)
      const colorCombination = this.evaluateNumber(colorCombinationExpr, 'color combination', lineNumber)
      const size = this.evaluateNumber(sizeExpr, 'size', lineNumber)
      const priority = this.evaluateNumber(priorityExpr, 'priority', lineNumber)
      const invertX = this.evaluateNumber(invertXExpr, 'invertX', lineNumber)
      const invertY = this.evaluateNumber(invertYExpr, 'invertY', lineNumber)

      if (
        spriteNumber === null ||
        colorCombination === null ||
        size === null ||
        priority === null ||
        invertX === null ||
        invertY === null
      ) {
        return // Error already added
      }

      // Validate ranges
      if (!this.validateSpriteNumber(spriteNumber, lineNumber)) return
      if (!this.validateRange(colorCombination, 0, 3, 'color combination', lineNumber)) return
      if (!this.validateRange(size, 0, 1, 'size', lineNumber)) return
      if (!this.validateRange(priority, 0, 1, 'priority', lineNumber)) return
      if (!this.validateRange(invertX, 0, 1, 'invertX', lineNumber)) return
      if (!this.validateRange(invertY, 0, 1, 'invertY', lineNumber)) return

      // Extract character set
      // Can be: string literal, single CHR$(n), or CHR$(n)+CHR$(m)+...
      let characterSet: number[] | string

      // Try to extract CHR$ codes from expression first
      const chrCodes = this.extractChrCodesFromExpression(characterSetExpr)
      if (chrCodes.length > 0) {
        // Found CHR$ expressions: use the extracted codes
        characterSet = chrCodes
      } else {
        // No CHR$ expressions found: evaluate as normal expression
        const characterSetValue = this.evaluator.evaluateExpression(characterSetExpr)

        if (typeof characterSetValue === 'string') {
          // String literal: convert to character codes
          characterSet = stringToCharCodes(characterSetValue)
        } else if (typeof characterSetValue === 'number') {
          // Single number: treat as single character code
          characterSet = [characterSetValue]
        } else {
          this.context.addError({
            line: lineNumber ?? 0,
            message: 'DEF SPRITE: Character set must be a string, number, or CHR$ expression',
            type: ERROR_TYPES.RUNTIME,
          })
          return
        }
      }

      // Convert character set to tiles
      // CGEN mode determines which character table to use:
      // - CGEN 0, 2: Table A for sprites
      // - CGEN 1, 3: Table B for sprites
      const cgenMode = this.context.deviceAdapter?.getCharacterGeneratorMode() ?? 2
      const useTableB = cgenMode === 1 || cgenMode === 3

      let tiles
      try {
        tiles = convertCharacterSetToTiles(characterSet, size as 0 | 1, useTableB)
      } catch (error) {
        this.context.addError({
          line: lineNumber ?? 0,
          message: `DEF SPRITE: ${error instanceof Error ? error.message : String(error)}`,
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }

      // Create sprite definition
      const definition: DefSpriteDefinition = {
        spriteNumber,
        colorCombination,
        size: size as 0 | 1,
        priority: priority as 0 | 1,
        invertX: invertX as 0 | 1,
        invertY: invertY as 0 | 1,
        characterSet,
        tiles,
      }

      // Store definition in sprite state manager
      if (this.context.spriteStateManager) {
        this.context.spriteStateManager.defineSprite(definition)
      }

      if (this.context.config.enableDebugMode) {
        this.context.addDebugOutput(
          `DEF SPRITE: Defined sprite ${spriteNumber} (${size === 0 ? '8×8' : '16×16'}, ` +
            `priority=${priority}, color=${colorCombination})`
        )
      }

      // Notify main thread of sprite state change
      this.notifySpriteStatesChanged()
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `DEF SPRITE: ${error instanceof Error ? error.message : String(error)}`,
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
        message: `DEF SPRITE: Error evaluating ${paramName}: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return null
    }
  }

  private validateSpriteNumber(num: number, lineNumber?: number): boolean {
    if (num < 0 || num > 7) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `DEF SPRITE: Sprite number out of range (0-7), got ${num}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return false
    }
    return true
  }

  private validateRange(num: number, min: number, max: number, paramName: string, lineNumber?: number): boolean {
    if (num < min || num > max) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `DEF SPRITE: ${paramName} out of range (${min}-${max}), got ${num}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return false
    }
    return true
  }

  /**
   * Extract CHR$ codes from expression
   * Handles expressions like: CHR$(0), CHR$(0)+CHR$(1), etc.
   * Returns array of character codes, or empty array if no CHR$ found
   */
  private extractChrCodesFromExpression(exprCst: CstNode): number[] {
    const codes: number[] = []

    // Expression = logicalExpression -> ... -> additive; get additive for CHR$(0)+CHR$(1)+...
    const additiveCst = getAdditiveFromExpression(exprCst)
    if (additiveCst) {
      const modExprs = getCstNodes(additiveCst.children.modExpression)
      for (const modExpr of modExprs) {
        const codesFromMod = this.extractChrCodesFromModExpression(modExpr)
        codes.push(...codesFromMod)
      }
      return codes
    }

    // Fallback: traverse additive's children (modExpression, etc.) if we have additive
    return codes
  }

  private extractChrCodesFromModExpression(modExprCst: CstNode): number[] {
    const codes: number[] = []
    const multExprs = getCstNodes(modExprCst.children.multiplicative)
    for (const multExpr of multExprs) {
      const codesFromMult = this.extractChrCodesFromMultiplicative(multExpr)
      codes.push(...codesFromMult)
    }
    return codes
  }

  private extractChrCodesFromMultiplicative(multExprCst: CstNode): number[] {
    const codes: number[] = []
    const unaryExprs = getCstNodes(multExprCst.children.unary)
    for (const unaryExpr of unaryExprs) {
      const codesFromUnary = this.extractChrCodesFromUnary(unaryExpr)
      codes.push(...codesFromUnary)
    }
    return codes
  }

  private extractChrCodesFromUnary(unaryExprCst: CstNode): number[] {
    const primaryCst = getFirstCstNode(unaryExprCst.children.primary)
    if (primaryCst) {
      return this.extractChrCodesFromPrimary(primaryCst)
    }
    return []
  }

  private extractChrCodesFromPrimary(primaryCst: CstNode): number[] {
    // Check if this is a function call (CHR$)
    const functionCallCst = getFirstCstNode(primaryCst.children.functionCall)
    if (functionCallCst) {
      const chrToken = getFirstToken(functionCallCst.children.Chr)
      if (chrToken) {
        // This is a CHR$ call, extract the argument
        const exprListCst = getFirstCstNode(functionCallCst.children.expressionList)
        if (exprListCst) {
          const expressions = getCstNodes(exprListCst.children.expression)
          if (expressions.length > 0) {
            // Evaluate the argument to get the character code
            const codeValue = this.evaluator.evaluateExpression(expressions[0]!)
            const code =
              typeof codeValue === 'number' ? Math.floor(codeValue) : Math.floor(parseFloat(String(codeValue)) || 0)
            // Clamp to valid range
            if (code >= 0 && code <= 255) {
              return [code]
            }
          }
        }
      }
    }
    return []
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
