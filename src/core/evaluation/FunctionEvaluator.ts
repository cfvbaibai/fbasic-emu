/**
 * Function Evaluator
 *
 * Handles evaluation of all BASIC functions from CST nodes.
 * Separated from ExpressionEvaluator for better code organization.
 */

import type { CstNode } from 'chevrotain'

import type { BasicDeviceAdapter } from '@/core/interfaces'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import { getCharacterByCode } from '@/shared/utils/backgroundLookup'

/**
 * Helper to convert a value to an integer
 * Family Basic only supports integer numerical values
 */
function toNumber(value: number | string | boolean | undefined): number {
  if (typeof value === 'number') {
    // Truncate to integer (toward zero)
    return Math.trunc(value)
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    // Parse as integer (truncate toward zero)
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.trunc(parsed)
  }
  return 0
}

/**
 * Function Evaluator
 *
 * Evaluates all BASIC functions: string functions, arithmetic functions, and controller input functions
 * String functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC, SCR$
 * Arithmetic functions: ABS, SGN, RND, VAL
 * Controller input functions: STICK, STRIG
 * Cursor functions: POS
 */
export class FunctionEvaluator {
  constructor(
    private context: ExecutionContext,
    private evaluateExpression: (exprCst: CstNode) => number | string,
    private deviceAdapter?: BasicDeviceAdapter
  ) {}

  /**
   * Evaluate function call: String functions, arithmetic functions, and controller input functions
   * Family BASIC arithmetic functions: ABS, SGN, RND, VAL
   * String functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC
   * Controller input functions: STICK, STRIG
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

    // String functions
    if (lenToken) {
      return this.evaluateLen(args)
    }
    if (leftToken) {
      return this.evaluateLeft(args)
    }
    if (rightToken) {
      return this.evaluateRight(args)
    }
    if (midToken) {
      return this.evaluateMid(args)
    }
    if (strToken) {
      return this.evaluateStr(args)
    }
    if (hexToken) {
      return this.evaluateHex(args)
    }
    if (chrToken) {
      return this.evaluateChr(args)
    }
    if (ascToken) {
      return this.evaluateAsc(args)
    }
    if (scrToken) {
      return this.evaluateScr(args)
    }

    // Arithmetic functions
    if (absToken) {
      return this.evaluateAbs(args)
    }
    if (sgnToken) {
      return this.evaluateSgn(args)
    }
    if (rndToken) {
      return this.evaluateRnd(args)
    }
    if (valToken) {
      return this.evaluateVal(args)
    }

    // Controller input functions
    if (stickToken) {
      return this.evaluateStick(args)
    }
    if (strigToken) {
      return this.evaluateStrig(args)
    }

    // Keyboard input function (INKEY$)
    if (inkeyToken) {
      return this.evaluateInkey(args)
    }

    // Cursor position functions
    if (posToken) {
      return this.evaluatePos(args)
    }

    // Sprite query functions
    if (moveToken) {
      return this.evaluateMove(args)
    }
    if (xposToken) {
      return this.evaluateXpos(args)
    }
    if (yposToken) {
      return this.evaluateYpos(args)
    }

    throw new Error('Unknown function call')
  }

  // ============================================================================
  // String Functions
  // ============================================================================

  /**
   * LEN(string) - returns the length of a string
   */
  private evaluateLen(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('LEN function requires exactly 1 argument')
    }
    const str = String(args[0] ?? '')
    return str.length
  }

  /**
   * LEFT$(string, n) - returns leftmost n characters
   */
  private evaluateLeft(args: Array<number | string>): string {
    if (args.length !== 2) {
      throw new Error('LEFT$ function requires exactly 2 arguments')
    }
    const str = String(args[0] ?? '')
    const n = Math.floor(toNumber(args[1]))
    if (n < 0) {
      return ''
    }
    return str.substring(0, n)
  }

  /**
   * RIGHT$(string, n) - returns rightmost n characters
   */
  private evaluateRight(args: Array<number | string>): string {
    if (args.length !== 2) {
      throw new Error('RIGHT$ function requires exactly 2 arguments')
    }
    const str = String(args[0] ?? '')
    const n = Math.floor(toNumber(args[1]))
    if (n < 0) {
      return ''
    }
    const start = Math.max(0, str.length - n)
    return str.substring(start)
  }

  /**
   * MID$(string, start, length) - returns substring starting at position start with length characters
   */
  private evaluateMid(args: Array<number | string>): string {
    if (args.length !== 3) {
      throw new Error('MID$ function requires exactly 3 arguments')
    }
    const str = String(args[0] ?? '')
    const start = Math.floor(toNumber(args[1]))
    const length = Math.floor(toNumber(args[2]))

    // BASIC uses 1-based indexing
    // If start is <= 0, return empty string (invalid position)
    if (start <= 0 || length <= 0) {
      return ''
    }
    const startIndex = start - 1 // Convert to 0-based
    if (startIndex >= str.length) {
      return ''
    }
    return str.substring(startIndex, startIndex + length)
  }

  /**
   * STR$(x) - converts numerical value to string
   * For positive numbers, inserts a single character space at the beginning
   */
  private evaluateStr(args: Array<number | string>): string {
    if (args.length !== 1) {
      throw new Error('STR$ function requires exactly 1 argument')
    }
    const num = toNumber(args[0] ?? 0)
    // For positive numbers, add leading space
    if (num >= 0) {
      return ` ${String(num)}`
    }
    return String(num)
  }

  /**
   * HEX$(x) - converts numerical value to hexadecimal string
   * Input range: -32768 to +32767
   * Returns hexadecimal digits without &H prefix (uppercase)
   */
  private evaluateHex(args: Array<number | string>): string {
    if (args.length !== 1) {
      throw new Error('HEX$ function requires exactly 1 argument')
    }
    const num = toNumber(args[0] ?? 0)

    // Handle negative numbers: convert to unsigned 16-bit representation
    // For negative numbers, use two's complement representation
    let value: number
    if (num < 0) {
      // Convert to unsigned 16-bit: add 65536 to negative number
      value = num + 65536
    } else {
      value = num
    }

    // Clamp to valid range (0 to 65535)
    if (value < 0) value = 0
    if (value > 65535) value = 65535

    // Convert to hexadecimal string (uppercase, no prefix)
    return value.toString(16).toUpperCase()
  }

  /**
   * CHR$(x) - converts character code to character
   * Input range: 0 to 255
   * Returns single character string
   * Per manual page 83: "Yields a character as a character code from a numerical value"
   * Maps codes to characters using background items data, with fallback to String.fromCharCode
   */
  private evaluateChr(args: Array<number | string>): string {
    if (args.length !== 1) {
      throw new Error('CHR$ function requires exactly 1 argument')
    }
    const num = toNumber(args[0] ?? 0)

    // Clamp to valid range (0 to 255)
    let charCode = Math.trunc(num)
    if (charCode < 0) charCode = 0
    if (charCode > 255) charCode = 255

    // Try to get character from background items mapping first
    // This ensures kana and other non-ASCII characters are properly mapped
    const mappedChar = getCharacterByCode(charCode)
    if (mappedChar !== null) {
      return mappedChar
    }

    // Fallback to String.fromCharCode for codes without background items
    // (e.g., system codes 0-31, or special graphics 184-255)
    return String.fromCharCode(charCode)
  }

  /**
   * ASC(string) - converts first character of string to character code
   * Returns integer from 0 to 255
   * Per manual page 83: "The character code of the first character of the
   * character string becomes the value of this function"
   * "Also, when the character string is a null string, 0 becomes the value
   * of this function"
   */
  private evaluateAsc(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('ASC function requires exactly 1 argument')
    }
    const str = String(args[0] ?? '')

    // If empty string, return 0
    if (str.length === 0) {
      return 0
    }

    // Get character code of first character
    const charCode = str.charCodeAt(0)

    // Clamp to valid range (0 to 255)
    if (charCode < 0) return 0
    if (charCode > 255) return 255

    return charCode
  }

  // ============================================================================
  // Arithmetic Functions
  // ============================================================================

  /**
   * ABS(x) - absolute value
   */
  private evaluateAbs(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('ABS function requires exactly 1 argument')
    }
    const x = toNumber(args[0] ?? 0)
    return Math.abs(Math.trunc(x))
  }

  /**
   * SGN(x) - sign function: -1 if x < 0, 0 if x = 0, 1 if x > 0
   */
  private evaluateSgn(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('SGN function requires exactly 1 argument')
    }
    const x = toNumber(args[0] ?? 0)
    if (x < 0) return -1
    if (x > 0) return 1
    return 0
  }

  /**
   * RND(x) - random number
   * According to Family BASIC spec:
   * - x must be 1 to 32767
   * - Returns random integer from 0 to (x-1)
   * - RND(1) always returns 0
   */
  private evaluateRnd(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('RND function requires exactly 1 argument')
    }
    const x = toNumber(args[0] ?? 0)

    // Validate argument range: 1 to 32767
    if (x < 1 || x > 32767) {
      throw new Error(`RND argument must be between 1 and 32767, got ${x}`)
    }

    // Special case: RND(1) always returns 0
    if (x === 1) {
      return 0
    }

    // Return random integer from 0 to (x-1)
    return Math.trunc(Math.random() * x)
  }

  /**
   * VAL(string) - converts string to numerical value
   * Supports decimal numbers (-32768 to +32767) and hexadecimal (&H0 to &H7FFF)
   * If first character is not +, -, &, or a number, returns 0
   * If non-numeric characters appear (except hex A-F), everything after is ignored
   */
  private evaluateVal(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('VAL function requires exactly 1 argument')
    }
    const str = String(args[0] ?? '').trim()

    if (str.length === 0) {
      return 0
    }

    // Check if first character is valid
    const firstChar = str[0]
    if (!firstChar || (firstChar !== '+' && firstChar !== '-' && firstChar !== '&' && !/[0-9]/.test(firstChar))) {
      return 0
    }

    // Handle hexadecimal: &H followed by hex digits
    if (str.length >= 2 && str[0] === '&' && (str[1] === 'H' || str[1] === 'h')) {
      const hexPart = str.substring(2)
      // Extract valid hex digits (0-9, A-F, a-f)
      let hexDigits = ''
      for (let i = 0; i < hexPart.length; i++) {
        const char = hexPart[i]
        if (!char) break
        if (/[0-9A-Fa-f]/.test(char)) {
          hexDigits += char
        } else {
          break // Stop at first non-hex character
        }
      }
      if (hexDigits.length === 0) {
        return 0
      }
      const hexValue = parseInt(hexDigits, 16)
      // Clamp to &H0 to &H7FFF (0 to 32767)
      if (hexValue > 32767) {
        return 32767
      }
      return hexValue
    }

    // Handle decimal numbers
    // Extract valid number characters (digits, +, -)
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
        // Stop at first non-numeric character (except leading + or -)
        break
      }
    }

    if (!foundDigit || numStr.length === 0) {
      return 0
    }

    const numValue = parseInt(numStr, 10)
    // Clamp to -32768 to +32767
    if (numValue > 32767) {
      return 32767
    }
    if (numValue < -32768) {
      return -32768
    }
    return numValue
  }

  // ============================================================================
  // Controller Input Functions
  // ============================================================================

  /**
   * STICK(joystickId) - returns D-pad input value
   * joystickId: 0 = controller I, 1 = controller II
   * Returns: 0 (nothing), 1 (RIGHT), 2 (LEFT), 4 (DOWN), 8 (UP)
   */
  private evaluateStick(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('STICK function requires exactly 1 argument')
    }
    const joystickId = Math.floor(toNumber(args[0] ?? 0))
    if (joystickId < 0 || joystickId > 1) {
      throw new Error('STICK joystickId must be 0 or 1')
    }
    return this.context.getStickState(joystickId)
  }

  /**
   * STRIG(joystickId) - returns trigger button input value
   * joystickId: 0 = controller I, 1 = controller II
   * Controller I: START (1), SELECT (2), B (4), A (8)
   * Controller II: B (4), A (8)
   * Returns: 0 when nothing is pressed, or the button value when pressed
   */
  private evaluateStrig(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('STRIG function requires exactly 1 argument')
    }
    const joystickId = Math.floor(toNumber(args[0] ?? 0))
    if (joystickId < 0 || joystickId > 1) {
      throw new Error('STRIG joystickId must be 0 or 1')
    }
    return this.context.consumeStrigState(joystickId)
  }

  // ============================================================================
  // Keyboard Input Function (INKEY$)
  // ============================================================================

  /**
   * Evaluate INKEY$(n) - returns character of currently pressed key
   * Per F-BASIC Manual page 87:
   * - When omitting argument: Returns pressed character, or "" if none (non-blocking)
   * - When n=0: Cursor blinks and waits for input (blocking mode)
   *
   * @param args - Optional argument n (0 for blocking mode)
   * @returns Single character string or empty string
   */
  private evaluateInkey(args: Array<number | string>): string {
    // Check if blocking mode is requested (any argument present triggers blocking)
    // Per F-BASIC Manual page 87 and real hardware testing:
    // - INKEY$ (no arg): Non-blocking, returns pressed key or ""
    // - INKEY$(n) (any n): Blocking, waits for key press
    if (args.length >= 1) {
      // Blocking mode - use waitForInkeyBlocking() if available
      if (this.deviceAdapter?.waitForInkeyBlocking) {
        return this.deviceAdapter.waitForInkeyBlocking()
      }
      // Fallback: return current key state (non-blocking behavior)
      if (!this.deviceAdapter) {
        return ''
      }
      return this.deviceAdapter.getInkeyState()
    }

    // Non-blocking mode: return currently pressed key
    if (!this.deviceAdapter) {
      return ''
    }
    return this.deviceAdapter.getInkeyState()
  }

  // ============================================================================
  // Sprite Query Functions
  // ============================================================================

  /**
   * MOVE(n) - returns movement status
   * n: action number (0-7)
   * Returns: -1 if movement is active, 0 if complete or not started
   */
  private evaluateMove(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('MOVE function requires exactly 1 argument')
    }
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`MOVE action number out of range (0-7), got ${actionNumber}`)
    }
    if (!this.context.animationManager) {
      return 0
    }
    return this.context.animationManager.getMovementStatus(actionNumber)
  }

  /**
   * XPOS(n) - returns current X position
   * n: action number (0-7)
   * Returns: X coordinate (0-255) or 0 if no movement/position set
   * 
   * Position is cached in WebWorkerDeviceAdapter, synced from Konva nodes in frontend.
   */
  private evaluateXpos(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('XPOS function requires exactly 1 argument')
    }
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`XPOS action number out of range (0-7), got ${actionNumber}`)
    }
    const position = this.context.getSpritePosition(actionNumber)
    return position?.x ?? 0
  }

  /**
   * YPOS(n) - returns current Y position
   * n: action number (0-7)
   * Returns: Y coordinate (0-255) or 0 if no movement/position set
   *
   * Position is cached in WebWorkerDeviceAdapter, synced from Konva nodes in frontend.
   */
  private evaluateYpos(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('YPOS function requires exactly 1 argument')
    }
    const actionNumber = Math.floor(toNumber(args[0] ?? 0))
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`YPOS action number out of range (0-7), got ${actionNumber}`)
    }
    const position = this.context.getSpritePosition(actionNumber)
    return position?.y ?? 0
  }

  // ============================================================================
  // Cursor Position Functions
  // ============================================================================

  /**
   * POS(n) - returns current cursor column (X position)
   * n: dummy argument (ignored)
   * Returns: X coordinate (0-27)
   * Reference: F-BASIC Manual page 85
   */
  private evaluatePos(args: Array<number | string>): number {
    if (args.length !== 1) {
      throw new Error('POS function requires exactly 1 argument')
    }
    // The argument is a dummy value (typically 0) and is ignored
    if (!this.deviceAdapter) {
      return 0
    }
    const position = this.deviceAdapter.getCursorPosition()
    return position.x
  }

  // ============================================================================
  // Screen Read Function
  // ============================================================================

  /**
   * SCR$(X, Y, Sw) - reads character or color from screen at position
   * X: horizontal column (0-27)
   * Y: vertical row (0-23)
   * Sw: color switch (0 = character, 1 = color pattern), optional, default 0
   * Returns: character string (Sw=0) or color pattern number 0-3 (Sw=1)
   * Reference: F-BASIC Manual page 87
   */
  private evaluateScr(args: Array<number | string>): string | number {
    if (args.length < 2 || args.length > 3) {
      throw new Error('SCR$ function requires 2 or 3 arguments')
    }
    const x = Math.floor(toNumber(args[0] ?? 0))
    const y = Math.floor(toNumber(args[1] ?? 0))
    const colorSwitch = args.length >= 3 ? Math.floor(toNumber(args[2] ?? 0)) : 0

    // Validate ranges
    if (x < 0 || x > 27) {
      throw new Error(`SCR$ X coordinate out of range (0-27), got ${x}`)
    }
    if (y < 0 || y > 23) {
      throw new Error(`SCR$ Y coordinate out of range (0-23), got ${y}`)
    }
    if (colorSwitch !== 0 && colorSwitch !== 1) {
      throw new Error(`SCR$ color switch must be 0 or 1, got ${colorSwitch}`)
    }

    if (!this.deviceAdapter) {
      return colorSwitch === 1 ? 0 : ' '
    }

    return this.deviceAdapter.getScreenCell(x, y, colorSwitch)
  }
}
