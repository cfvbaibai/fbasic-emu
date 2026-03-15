/**
 * PALET Statement Executor
 *
 * Handles execution of PALET statements to set color codes for color combinations.
 * Supports both PALET B (background/backdrop) and PALET S (sprites).
 */

import type { CstNode } from 'chevrotain'

import { COLOR_CODES, COLOR_PATTERNS, ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class PaletExecutor {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Execute a PALET statement from CST
   * Sets color codes for color combination n (0-3)
   * Syntax: PALET {B|S} n, C1, C2, C3, C4
   * or: PALETB n, C1, C2, C3, C4 (background, no space)
   * or: PALETS n, C1, C2, C3, C4 (sprites, no space)
   *
   * When target is B and n=0, C1 is the backdrop color.
   * C1, C2, C3, C4 are color codes (0-60).
   */
  execute(paletStmtCst: CstNode, lineNumber?: number): void {
    // Determine target (B or S)
    let target: 'B' | 'S' = 'B'

    // Check if this is PALETB or PALETS (no space form)
    const paletbToken = paletStmtCst.children.Paletb?.[0]
    const paletsToken = paletStmtCst.children.Palets?.[0]
    const paletToken = paletStmtCst.children.Palet?.[0]

    if (paletbToken) {
      // PALETB form (background, no space)
      target = 'B'
    } else if (paletsToken) {
      // PALETS form (sprites, no space)
      target = 'S'
    } else if (paletToken) {
      // PALET B or PALET S form (with space)
      // Get the identifier token (B or S)
      const targetToken = getFirstToken(paletStmtCst.children.target)
      if (targetToken) {
        const targetStr = targetToken.image.toUpperCase()
        if (targetStr === 'B') {
          target = 'B'
        } else if (targetStr === 'S') {
          target = 'S'
        } else {
          this.context.addError({
            line: lineNumber ?? 0,
            message: `PALET: Invalid target, expected B or S, got ${targetStr}`,
            type: ERROR_TYPES.RUNTIME,
          })
          return
        }
      } else {
        this.context.addError({
          line: lineNumber ?? 0,
          message: 'PALET: Missing target (B or S)',
          type: ERROR_TYPES.RUNTIME,
        })
        return
      }
    } else {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'PALET: Invalid statement format',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Get expressions from paletParameterList subrule
    const paletParameterListCst = getFirstCstNode(paletStmtCst.children.paletParameterList)
    if (!paletParameterListCst) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'PALET: Missing parameter list',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const expressions = getCstNodes(paletParameterListCst.children.expression)

    // Validate we have 5 expressions: n, C1, C2, C3, C4
    if (expressions.length < 5) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'PALET: Expected 5 arguments (n, C1, C2, C3, C4)',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const nExprCst = expressions[0]
    const c1ExprCst = expressions[1]
    const c2ExprCst = expressions[2]
    const c3ExprCst = expressions[3]
    const c4ExprCst = expressions[4]

    if (!nExprCst || !c1ExprCst || !c2ExprCst || !c3ExprCst || !c4ExprCst) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: 'PALET: Invalid arguments',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Evaluate all expressions
    let n: number
    let c1: number
    let c2: number
    let c3: number
    let c4: number

    try {
      const nValue = this.evaluator.evaluateExpression(nExprCst)
      const c1Value = this.evaluator.evaluateExpression(c1ExprCst)
      const c2Value = this.evaluator.evaluateExpression(c2ExprCst)
      const c3Value = this.evaluator.evaluateExpression(c3ExprCst)
      const c4Value = this.evaluator.evaluateExpression(c4ExprCst)

      // Convert to numbers
      n = typeof nValue === 'number' ? Math.floor(nValue) : Math.floor(parseFloat(String(nValue)) || 0)

      c1 = typeof c1Value === 'number' ? Math.floor(c1Value) : Math.floor(parseFloat(String(c1Value)) || 0)

      c2 = typeof c2Value === 'number' ? Math.floor(c2Value) : Math.floor(parseFloat(String(c2Value)) || 0)

      c3 = typeof c3Value === 'number' ? Math.floor(c3Value) : Math.floor(parseFloat(String(c3Value)) || 0)

      c4 = typeof c4Value === 'number' ? Math.floor(c4Value) : Math.floor(parseFloat(String(c4Value)) || 0)
    } catch (error) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `PALET: Error evaluating arguments: ${error instanceof Error ? error.message : String(error)}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Validate ranges
    // n: MIN to MAX (color combination number)
    if (n < COLOR_PATTERNS.MIN || n > COLOR_PATTERNS.MAX) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `PALET: Color combination number out of range (${COLOR_PATTERNS.MIN}-${COLOR_PATTERNS.MAX}), got ${n}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // C1, C2, C3, C4: MIN to MAX (color codes)
    if (
      c1 < COLOR_CODES.MIN ||
      c1 > COLOR_CODES.MAX ||
      c2 < COLOR_CODES.MIN ||
      c2 > COLOR_CODES.MAX ||
      c3 < COLOR_CODES.MIN ||
      c3 > COLOR_CODES.MAX ||
      c4 < COLOR_CODES.MIN ||
      c4 > COLOR_CODES.MAX
    ) {
      this.context.addError({
        line: lineNumber ?? 0,
        message: `PALET: Color code out of range (${COLOR_CODES.MIN}-${COLOR_CODES.MAX}), got C1=${c1}, C2=${c2}, C3=${c3}, C4=${c4}`,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Persist PALET color combination for active CGSET palette selection.
    this.context.deviceAdapter?.setPaletteCombination?.(target, n, c1, c2, c3, c4)

    // PALET B with n=0 also sets backdrop color to C1.
    if (target === 'B' && n === 0) {
      this.context.deviceAdapter?.setBackdropColor(c1)
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(
        `PALET ${target}: Set color combination ${n} to C1=${c1}, C2=${c2}, C3=${c3}, C4=${c4}${target === 'B' && n === 0 ? ' (backdrop updated)' : ''}`
      )
    }
  }
}
