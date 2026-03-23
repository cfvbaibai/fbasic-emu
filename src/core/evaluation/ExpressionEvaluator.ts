/**
 * Expression Evaluator
 *
 * Evaluates BASIC expressions from CST nodes.
 * Uses Decimal.js for precise integer arithmetic to avoid JavaScript floating point issues.
 */

import type { CstNode } from 'chevrotain'
import Decimal from 'decimal.js'

import { ERROR_TYPES } from '@/core/constants'
import { getCstNodes, getFirstCstNode, getFirstToken, getTokens } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicArrayValue, BasicScalarValue } from '@/core/types/BasicTypes'

import { compareValues } from './ExpressionComparison'
import { FunctionEvaluator } from './FunctionEvaluator'

export class ExpressionEvaluator {
  private functionEvaluator: FunctionEvaluator

  constructor(private context: ExecutionContext) {
    this.functionEvaluator = new FunctionEvaluator(
      context,
      (exprCst: CstNode) => this.evaluateExpression(exprCst),
      context.deviceAdapter
    )
  }

  /** Evaluate a BASIC expression from CST (LogicalExpression). */
  evaluateExpression(exprCst: CstNode): number | string {
    const logicalCst = getFirstCstNode(exprCst.children.logicalExpression)
    if (logicalCst) return this.evaluateLogicalExpression(logicalCst)
    throw new Error('Invalid expression CST')
  }

  // ============================================================================
  // Type Conversion
  // ============================================================================

  private toInt16(x: number): number {
    const truncated = Math.trunc(x)
    const masked = (truncated & 0xffff) >>> 0
    return masked >= 0x8000 ? masked - 0x10000 : masked
  }

  private toDecimal(value: number | string | boolean | undefined): Decimal {
    if (typeof value === 'number') return new Decimal(value)
    if (typeof value === 'boolean') return new Decimal(value ? 1 : 0)
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? new Decimal(0) : new Decimal(parsed)
    }
    return new Decimal(0)
  }

  private toNumber(value: number | string | boolean | undefined): number {
    if (typeof value === 'number') return Math.trunc(value)
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : Math.trunc(parsed)
    }
    return 0
  }

  // ============================================================================
  // Logical Expression Chain (AND/OR/NOT/XOR - bitwise semantics)
  // ============================================================================

  /** LogicalExpression: LogicalOrExpression (XOR LogicalOrExpression)* */
  evaluateLogicalExpression(logicalCst: CstNode): number | string {
    const orExprs = getCstNodes(logicalCst.children.logicalOrExpression)
    if (orExprs.length === 0) throw new Error('Invalid logical expression')
    let result = this.evaluateLogicalOrExpression(orExprs[0]!)
    const xorTokens = getTokens(logicalCst.children.Xor)
    for (let i = 0; i < xorTokens.length && i + 1 < orExprs.length; i++) {
      const right = this.evaluateLogicalOrExpression(orExprs[i + 1]!)
      result = this.toInt16(this.toInt16(this.toNumber(result)) ^ this.toInt16(this.toNumber(right)))
    }
    return result
  }

  /** LogicalOr: LogicalAndExpression (OR LogicalAndExpression)* */
  private evaluateLogicalOrExpression(cst: CstNode): number | string {
    const andExprs = getCstNodes(cst.children.logicalAndExpression)
    if (andExprs.length === 0) throw new Error('Invalid logical OR expression')
    let result = this.evaluateLogicalAndExpression(andExprs[0]!)
    const orTokens = getTokens(cst.children.Or)
    for (let i = 0; i < orTokens.length && i + 1 < andExprs.length; i++) {
      const right = this.evaluateLogicalAndExpression(andExprs[i + 1]!)
      result = this.toInt16(this.toInt16(this.toNumber(result)) | this.toInt16(this.toNumber(right)))
    }
    return result
  }

  /** LogicalAnd: LogicalNotExpression (AND LogicalNotExpression)* */
  private evaluateLogicalAndExpression(cst: CstNode): number | string {
    const notExprs = getCstNodes(cst.children.logicalNotExpression)
    if (notExprs.length === 0) throw new Error('Invalid logical AND expression')
    let result = this.evaluateLogicalNotExpression(notExprs[0]!)
    const andTokens = getTokens(cst.children.And)
    for (let i = 0; i < andTokens.length && i + 1 < notExprs.length; i++) {
      const right = this.evaluateLogicalNotExpression(notExprs[i + 1]!)
      result = this.toInt16(this.toInt16(this.toNumber(result)) & this.toInt16(this.toNumber(right)))
    }
    return result
  }

  /** LogicalNot: (NOT)? ComparisonExpression */
  private evaluateLogicalNotExpression(cst: CstNode): number | string {
    const comparisonCst = getFirstCstNode(cst.children.comparisonExpression)
    if (!comparisonCst) throw new Error('Invalid logical NOT expression')
    let result: number | string = this.evaluateComparisonExpression(comparisonCst)
    if (getTokens(cst.children.Not).length > 0) {
      result = this.toInt16(~this.toInt16(this.toNumber(result)))
    }
    return result
  }

  // ============================================================================
  // Comparison Expression
  // ============================================================================

  /** ComparisonExpression: BitwiseXorExpression (operator? additive)? */
  evaluateComparisonExpression(comparisonCst: CstNode): number | string {
    const bitwiseCst = getFirstCstNode(comparisonCst.children.bitwiseXorExpression)
    if (!bitwiseCst) throw new Error('Invalid comparison expression')
    const leftValue = this.evaluateBitwiseXorExpression(bitwiseCst)
    const additiveCst = getFirstCstNode(comparisonCst.children.additive)
    if (!additiveCst) return leftValue

    const rightValue = this.evaluateAdditive(additiveCst)
    const tokens = {
      equal: getFirstToken(comparisonCst.children.Equal),
      notEqual: getFirstToken(comparisonCst.children.NotEqual),
      lessThan: getFirstToken(comparisonCst.children.LessThan),
      greaterThan: getFirstToken(comparisonCst.children.GreaterThan),
      lessThanOrEqual: getFirstToken(comparisonCst.children.LessThanOrEqual),
      greaterThanOrEqual: getFirstToken(comparisonCst.children.GreaterThanOrEqual),
    }

    let operator: '=' | '<>' | '<' | '>' | '<=' | '>=' | null = null
    if (tokens.equal) operator = '='
    else if (tokens.notEqual) operator = '<>'
    else if (tokens.lessThan) operator = '<'
    else if (tokens.greaterThan) operator = '>'
    else if (tokens.lessThanOrEqual) operator = '<='
    else if (tokens.greaterThanOrEqual) operator = '>='
    if (!operator) throw new Error('Invalid comparison expression: missing operator')

    return compareValues(leftValue, rightValue, operator)
  }

  // ============================================================================
  // Bitwise Expression Chain (used as comparison operands)
  // ============================================================================

  evaluateBitwiseXorExpression(cst: CstNode): number | string {
    const orExprs = getCstNodes(cst.children.bitwiseOrExpression)
    if (orExprs.length === 0) throw new Error('Invalid bitwise XOR expression')
    let result = this.evaluateBitwiseOrExpression(orExprs[0]!)
    for (let i = 0; i < getTokens(cst.children.Xor).length && i + 1 < orExprs.length; i++) {
      result = this.toInt16(this.toNumber(result) ^ this.toNumber(this.evaluateBitwiseOrExpression(orExprs[i + 1]!)))
    }
    return result
  }

  private evaluateBitwiseOrExpression(cst: CstNode): number | string {
    const andExprs = getCstNodes(cst.children.bitwiseAndExpression)
    if (andExprs.length === 0) throw new Error('Invalid bitwise OR expression')
    let result = this.evaluateBitwiseAndExpression(andExprs[0]!)
    for (let i = 0; i < getTokens(cst.children.Or).length && i + 1 < andExprs.length; i++) {
      result = this.toInt16(this.toNumber(result) | this.toNumber(this.evaluateBitwiseAndExpression(andExprs[i + 1]!)))
    }
    return result
  }

  private evaluateBitwiseAndExpression(cst: CstNode): number | string {
    const notExprs = getCstNodes(cst.children.bitwiseNotExpression)
    if (notExprs.length === 0) throw new Error('Invalid bitwise AND expression')
    let result = this.evaluateBitwiseNotExpression(notExprs[0]!)
    for (let i = 0; i < getTokens(cst.children.And).length && i + 1 < notExprs.length; i++) {
      result = this.toInt16(this.toNumber(result) & this.toNumber(this.evaluateBitwiseNotExpression(notExprs[i + 1]!)))
    }
    return result
  }

  private evaluateBitwiseNotExpression(cst: CstNode): number | string {
    const additiveCst = getFirstCstNode(cst.children.additive)
    if (!additiveCst) throw new Error('Invalid bitwise NOT expression')
    let result = this.evaluateAdditive(additiveCst)
    if (getTokens(cst.children.Not).length > 0) {
      result = this.toInt16(~this.toInt16(this.toNumber(result)))
    }
    return result
  }

  // ============================================================================
  // Arithmetic Expression Chain
  // ============================================================================

  /** Additive: ModExpression ((Plus | Minus) ModExpression)* */
  private evaluateAdditive(cst: CstNode): number | string {
    const modNodes = getCstNodes(cst.children.modExpression)
    if (modNodes.length === 0) throw new Error('Invalid additive expression')
    let result = this.evaluateModExpression(modNodes[0]!)
    const plusTokens = getTokens(cst.children.Plus)
    const minusTokens = getTokens(cst.children.Minus)
    let tokenIndex = 0
    for (let i = 1; i < modNodes.length; i++) {
      const op = tokenIndex < plusTokens.length ? '+' : '-'
      const operandValue = this.evaluateModExpression(modNodes[i]!)
      if (op === '+') {
        if (typeof result === 'string' || typeof operandValue === 'string') {
          result = String(result) + String(operandValue)
        } else {
          result = this.toDecimal(result).plus(this.toDecimal(operandValue)).truncated().toNumber()
        }
      } else {
        result = this.toDecimal(result).minus(this.toDecimal(operandValue)).truncated().toNumber()
      }
      tokenIndex++
      if (tokenIndex >= plusTokens.length + minusTokens.length) break
    }
    return result
  }

  /** MOD: Multiplicative ((MOD) Multiplicative)* */
  private evaluateModExpression(cst: CstNode): number | string {
    const nodes = getCstNodes(cst.children.multiplicative)
    if (nodes.length === 0) throw new Error('Invalid MOD expression')
    let result = this.evaluateMultiplicative(nodes[0]!)
    for (let i = 0; i < getTokens(cst.children.Mod).length && i + 1 < nodes.length; i++) {
      const operandValue = this.evaluateMultiplicative(nodes[i + 1]!)
      if (typeof result === 'string' || typeof operandValue === 'string') {
        throw new Error('MOD operator requires numeric operands')
      }
      const divisor = this.toDecimal(operandValue)
      if (divisor.isZero()) {
        this.context.addError({ line: this.context.getCurrentLineNumber(), message: 'Division by zero', type: ERROR_TYPES.RUNTIME })
        result = 0
      } else {
        result = this.toDecimal(result).mod(divisor).truncated().toNumber()
      }
    }
    return result
  }

  /** Multiplicative: Unary ((Multiply | Divide) Unary)* */
  private evaluateMultiplicative(cst: CstNode): number | string {
    const unaryNodes = getCstNodes(cst.children.unary)
    if (unaryNodes.length === 0) throw new Error('Invalid multiplicative expression')
    let result = this.evaluateUnary(unaryNodes[0]!)
    const multiplyTokens = getTokens(cst.children.Multiply)
    const divideTokens = getTokens(cst.children.Divide)
    let tokenIndex = 0
    for (let i = 1; i < unaryNodes.length; i++) {
      const op = tokenIndex < multiplyTokens.length ? '*' : '/'
      const operandValue = this.evaluateUnary(unaryNodes[i]!)
      if (op === '*') {
        result = this.toDecimal(result).times(this.toDecimal(operandValue)).truncated().toNumber()
      } else {
        const divisor = this.toDecimal(operandValue)
        if (divisor.isZero()) {
          this.context.addError({ line: this.context.getCurrentLineNumber(), message: 'Division by zero', type: ERROR_TYPES.RUNTIME })
          result = 0
        } else {
          result = this.toDecimal(result).dividedBy(divisor).truncated().toNumber()
        }
      }
      tokenIndex++
      if (tokenIndex >= multiplyTokens.length + divideTokens.length) break
    }
    return typeof result === 'string' ? result : this.toNumber(result)
  }

  /** Unary: (Plus | Minus)? Primary */
  private evaluateUnary(cst: CstNode): number | string {
    const primaryCst = getFirstCstNode(cst.children.primary)
    if (!primaryCst) throw new Error('Invalid unary expression: missing primary')
    const primaryValue = this.evaluatePrimary(primaryCst)
    if (getTokens(cst.children.Minus).length > 0) {
      return this.toDecimal(primaryValue).negated().truncated().toNumber()
    }
    return primaryValue
  }

  // ============================================================================
  // Primary Expression
  // ============================================================================

  /** Primary: NumberLiteral | StringLiteral | ArrayAccess | FunctionCall | Identifier | (Expr) */
  private evaluatePrimary(cst: CstNode): number | string {
    const arrayAccessCst = getFirstCstNode(cst.children.arrayAccess)
    if (arrayAccessCst) return this.evaluateArrayAccess(arrayAccessCst)

    const functionCallCst = getFirstCstNode(cst.children.functionCall)
    if (functionCallCst) return this.functionEvaluator.evaluateFunctionCall(functionCallCst)

    const csrlinToken = getFirstToken(cst.children.Csrlin)
    if (csrlinToken) return this.evaluateCsrlin()

    const inkeyToken = getFirstToken(cst.children.Inkey)
    if (inkeyToken) return this.evaluateInkey()

    // Parenthesized expression (only when not a function call or array access)
    if (cst.children.LParen && !functionCallCst && !arrayAccessCst) {
      const exprCst = getFirstCstNode(cst.children.expression)
      if (exprCst) return this.evaluateExpression(exprCst)
      throw new Error('Invalid parenthesized expression')
    }

    const numberToken = getFirstToken(cst.children.NumberLiteral)
    if (numberToken) return parseInt(numberToken.image, 10)

    const hexToken = getFirstToken(cst.children.HexLiteral)
    if (hexToken) return parseInt(hexToken.image.slice(2), 16)

    const stringToken = getFirstToken(cst.children.StringLiteral)
    if (stringToken) return stringToken.image.slice(1, -1)

    const identifierToken = getFirstToken(cst.children.Identifier)
    if (identifierToken) {
      const varName = identifierToken.image.toUpperCase()
      const variable = this.context.variables.get(varName)
      if (variable) return variable.value
      return varName.endsWith('$') ? '' : 0
    }

    throw new Error('Invalid primary expression')
  }

  /** ArrayAccess: Identifier LParen ExpressionList RParen */
  private evaluateArrayAccess(cst: CstNode): number | string {
    const identifierToken = getFirstToken(cst.children.Identifier)
    if (!identifierToken) throw new Error('Invalid array access: missing array name')
    const arrayName = identifierToken.image.toUpperCase()
    const expressionListCst = getFirstCstNode(cst.children.expressionList)
    if (!expressionListCst) throw new Error('Invalid array access: missing indices')

    const expressions = getCstNodes(expressionListCst.children.expression)
    const indices: number[] = []
    for (const exprCst of expressions) {
      const indexValue = this.evaluateExpression(exprCst)
      if (typeof indexValue !== 'number') throw new Error(`Invalid array index: expected number, got ${typeof indexValue}`)
      indices.push(Math.floor(indexValue))
    }

    const array = this.context.arrays.get(arrayName)
    if (!array) return arrayName.endsWith('$') ? '' : 0

    let value: BasicScalarValue | BasicArrayValue = array
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i]
      if (index === undefined) throw new Error(`Invalid array index at dimension ${i}`)
      if (typeof value !== 'object' || !Array.isArray(value)) throw new Error(`Array access error: dimension ${i} is not an array`)
      if (index < 0 || index >= value.length) return arrayName.endsWith('$') ? '' : 0
      value = value[index] as BasicScalarValue | BasicArrayValue
    }

    return typeof value === 'object' && Array.isArray(value)
      ? arrayName.endsWith('$') ? '' : 0
      : (value as BasicScalarValue)
  }

  // ============================================================================
  // Built-in Token Evaluators
  // ============================================================================

  /** CSRLIN - returns current cursor line (Y position, 0-23) */
  private evaluateCsrlin(): number {
    if (!this.context.deviceAdapter) return 0
    return this.context.deviceAdapter.getCursorPosition().y
  }

  /** INKEY$ - returns currently pressed key character (non-blocking) */
  private evaluateInkey(): string {
    if (!this.context.deviceAdapter) return ''
    return this.context.deviceAdapter.getInkeyState()
  }
}
