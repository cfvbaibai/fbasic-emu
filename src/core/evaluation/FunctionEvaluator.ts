/**
 * Function Evaluator
 *
 * Handles evaluation of all BASIC functions from CST nodes.
 * String function implementations are in StringFunctions.ts.
 */

import type { CstNode } from 'chevrotain'

import type { BasicDeviceAdapter } from '@/core/interfaces'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

import { toNumber } from './StringFunctions'
import {
  evaluateAsc, evaluateChr, evaluateHex,
  evaluateLeft, evaluateLen, evaluateMid,
  evaluateRight, evaluateStr,
} from './StringFunctions'

/**
 * Function Evaluator
 *
 * Evaluates all BASIC functions: string functions, arithmetic functions,
 * controller input functions, sprite query functions, and cursor functions.
 */
export class FunctionEvaluator {
  constructor(
    private context: ExecutionContext,
    private evaluateExpression: (exprCst: CstNode) => number | string,
    private deviceAdapter?: BasicDeviceAdapter
  ) {}

  /**
   * Evaluate function call: dispatches to the appropriate function implementation.
   */
  evaluateFunctionCall(cst: CstNode): number | string {
    // Get function name tokens
    const lenToken = getFirstToken(cst.children.Len)
    const leftToken = getFirstToken(cst.children.Left)
    const rightToken = getFirstToken(cst.children.Right)
    const midToken = getFirstToken(cst.children.Mid)
    const strToken = getFirstToken(cst.children.Str)
    const hexToken = getFirstToken(cst.children.Hex)
    const chrToken = getFirstToken(cst.children.Chr)
    const ascToken = getFirstToken(cst.children.Asc)
    const scrToken = getFirstToken(cst.children.Scr)
    const absToken = getFirstToken(cst.children.Abs)
    const sgnToken = getFirstToken(cst.children.Sgn)
    const rndToken = getFirstToken(cst.children.Rnd)
    const valToken = getFirstToken(cst.children.Val)
    const stickToken = getFirstToken(cst.children.Stick)
    const strigToken = getFirstToken(cst.children.Strig)
    const inkeyToken = getFirstToken(cst.children.Inkey)
    const moveToken = getFirstToken(cst.children.Move)
    const xposToken = getFirstToken(cst.children.Xpos)
    const yposToken = getFirstToken(cst.children.Ypos)
    const posToken = getFirstToken(cst.children.Pos)

    // Get arguments
    const expressionListCst = getFirstCstNode(cst.children.expressionList)
    const args: Array<number | string> = []
    if (expressionListCst) {
      const expressions = getCstNodes(expressionListCst.children.expression)
      for (const exprCst of expressions) {
        args.push(this.evaluateExpression(exprCst))
      }
    }

    // String functions (delegated to StringFunctions.ts)
    if (lenToken) return evaluateLen(args)
    if (leftToken) return evaluateLeft(args)
    if (rightToken) return evaluateRight(args)
    if (midToken) return evaluateMid(args)
    if (strToken) return evaluateStr(args)
    if (hexToken) return evaluateHex(args)
    if (chrToken) return evaluateChr(args)
    if (ascToken) return evaluateAsc(args)
    if (scrToken) return this.evaluateScr(args)

    // Arithmetic functions
    if (absToken) return this.evaluateAbs(args)
    if (sgnToken) return this.evaluateSgn(args)
    if (rndToken) return this.evaluateRnd(args)
    if (valToken) return this.evaluateVal(args)

    // Controller input functions
    if (stickToken) return this.evaluateStick(args)
    if (strigToken) return this.evaluateStrig(args)

    // Keyboard input function (INKEY$)
    if (inkeyToken) return this.evaluateInkey(args)

    // Cursor position function
    if (posToken) return this.evaluatePos(args)

    // Sprite query functions
    if (moveToken) return this.evaluateMove(args)
    if (xposToken) return this.evaluateXpos(args)
    if (yposToken) return this.evaluateYpos(args)

    throw new Error('Unknown function call')
  }

  // ============================================================================
  // Arithmetic Functions
  // ============================================================================

  /** ABS(x) - absolute value */
  private evaluateAbs(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('ABS function requires exactly 1 argument')
    return Math.abs(Math.trunc(toNumber(args[0] ?? 0)))
  }

  /** SGN(x) - sign function: -1, 0, or 1 */
  private evaluateSgn(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('SGN function requires exactly 1 argument')
    const x = toNumber(args[0] ?? 0)
    if (x < 0) return -1
    if (x > 0) return 1
    return 0
  }

  /** RND(x) - random number. x must be 1-32767. Returns 0 to (x-1). RND(1) = 0. */
  private evaluateRnd(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('RND function requires exactly 1 argument')
    const x = toNumber(args[0] ?? 0)
    if (x < 1 || x > 32767) {
      throw new Error(`RND argument must be between 1 and 32767, got ${x}`)
    }
    if (x === 1) return 0
    return Math.trunc(Math.random() * x)
  }

  /**
   * VAL(string) - converts string to numerical value.
   * Supports decimal (-32768 to +32767) and hexadecimal (&H0 to &H7FFF).
   */
  private evaluateVal(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('VAL function requires exactly 1 argument')
    const str = String(args[0] ?? '').trim()
    if (str.length === 0) return 0

    const firstChar = str[0]
    if (!firstChar || (firstChar !== '+' && firstChar !== '-' && firstChar !== '&' && !/[0-9]/.test(firstChar))) {
      return 0
    }

    // Handle hexadecimal: &H followed by hex digits
    if (str.length >= 2 && str[0] === '&' && (str[1] === 'H' || str[1] === 'h')) {
      let hexDigits = ''
      for (let i = 0; i < str.substring(2).length; i++) {
        const char = str.substring(2)[i]
        if (!char) break
        if (/[0-9A-Fa-f]/.test(char)) {
          hexDigits += char
        } else {
          break
        }
      }
      if (hexDigits.length === 0) return 0
      const hexValue = parseInt(hexDigits, 16)
      return hexValue > 32767 ? 32767 : hexValue
    }

    // Handle decimal numbers
    let numStr = ''
    let foundDigit = false
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      if (!char) break
      if (/[0-9]/.test(char)) {
        numStr += char
        foundDigit = true
      } else if ((char === '+' || char === '-') && numStr.length === 0) {
        numStr += char
      } else {
        break
      }
    }

    if (!foundDigit || numStr.length === 0) return 0
    const numValue = parseInt(numStr, 10)
    if (numValue > 32767) return 32767
    if (numValue < -32768) return -32768
    return numValue
  }

  // ============================================================================
  // Controller Input Functions
  // ============================================================================

  /** STICK(joystickId) - returns D-pad input value (0, 1, 2, 4, or 8) */
  private evaluateStick(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('STICK function requires exactly 1 argument')
    const joystickId = Math.floor(toNumber(args[0] ?? 0))
    if (joystickId < 0 || joystickId > 1) throw new Error('STICK joystickId must be 0 or 1')
    return this.context.getStickState(joystickId)
  }

  /** STRIG(joystickId) - returns trigger button input value */
  private evaluateStrig(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('STRIG function requires exactly 1 argument')
    const joystickId = Math.floor(toNumber(args[0] ?? 0))
    if (joystickId < 0 || joystickId > 1) throw new Error('STRIG joystickId must be 0 or 1')
    return this.context.consumeStrigState(joystickId)
  }

  // ============================================================================
  // Keyboard Input Function (INKEY$)
  // ============================================================================

  /** INKEY$(n) - returns character of currently pressed key. n=0 is blocking mode. */
  private evaluateInkey(args: Array<number | string>): string {
    if (args.length >= 1) {
      // Blocking mode
      if (this.deviceAdapter?.waitForInkeyBlocking) {
        return this.deviceAdapter.waitForInkeyBlocking()
      }
      if (!this.deviceAdapter) return ''
      return this.deviceAdapter.getInkeyState()
    }
    // Non-blocking mode
    if (!this.deviceAdapter) return ''
    return this.deviceAdapter.getInkeyState()
  }

  // ============================================================================
  // Sprite Query Functions
  // ============================================================================

  /** MOVE(n) - returns -1 if movement active, 0 if complete/not started */
  private evaluateMove(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('MOVE function requires exactly 1 argument')
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`MOVE action number out of range (0-7), got ${actionNumber}`)
    }
    if (!this.context.animationManager) return 0
    return this.context.animationManager.getMovementStatus(actionNumber)
  }

  /** XPOS(n) - returns current X position of sprite n */
  private evaluateXpos(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('XPOS function requires exactly 1 argument')
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`XPOS action number out of range (0-7), got ${actionNumber}`)
    }
    return this.context.getSpritePosition(actionNumber)?.x ?? 0
  }

  /** YPOS(n) - returns current Y position of sprite n */
  private evaluateYpos(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('YPOS function requires exactly 1 argument')
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`YPOS action number out of range (0-7), got ${actionNumber}`)
    }
    return this.context.getSpritePosition(actionNumber)?.y ?? 0
  }

  // ============================================================================
  // Cursor Position Functions
  // ============================================================================

  /** POS(n) - returns current cursor column (X position). n is a dummy argument. */
  private evaluatePos(args: Array<number | string>): number {
    if (args.length !== 1) throw new Error('POS function requires exactly 1 argument')
    if (!this.deviceAdapter) return 0
    return this.deviceAdapter.getCursorPosition().x
  }

  // ============================================================================
  // Screen Read Function
  // ============================================================================

  /**
   * SCR$(X, Y, Sw) - reads character or color from screen at position.
   * Sw: 0=character, 1=color pattern (default 0)
   */
  private evaluateScr(args: Array<number | string>): string | number {
    if (args.length < 2 || args.length > 3) {
      throw new Error('SCR$ function requires 2 or 3 arguments')
    }
    const x = Math.floor(toNumber(args[0] ?? 0))
    const y = Math.floor(toNumber(args[1] ?? 0))
    const colorSwitch = args.length >= 3 ? Math.floor(toNumber(args[2] ?? 0)) : 0

    if (x < 0 || x > 27) throw new Error(`SCR$ X coordinate out of range (0-27), got ${x}`)
    if (y < 0 || y > 23) throw new Error(`SCR$ Y coordinate out of range (0-23), got ${y}`)
    if (colorSwitch !== 0 && colorSwitch !== 1) {
      throw new Error(`SCR$ color switch must be 0 or 1, got ${colorSwitch}`)
    }
    if (!this.deviceAdapter) return colorSwitch === 1 ? 0 : ' '
    return this.deviceAdapter.getScreenCell(x, y, colorSwitch)
  }
}
