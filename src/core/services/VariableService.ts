/**
 * Variable Service
 *
 * Handles variable management including simple variables and arrays.
 */

import type { CstNode } from 'chevrotain'
import Decimal from 'decimal.js'

import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicArrayValue, BasicScalarValue } from '@/core/types/BasicTypes'
import type { BasicVariable } from '@/core/types/state-types'

export class VariableService {
  constructor(
    public context: ExecutionContext,
    public evaluator: ExpressionEvaluator
  ) {}

  /**
   * Get a variable value
   */
  getVariable(name: string): BasicVariable | undefined {
    return this.context.variables.get(name)
  }

  /**
   * Set a simple variable value
   */
  setVariable(name: string, value: BasicScalarValue): void {
    const variable: BasicVariable = {
      value,
      type: typeof value === 'string' ? 'string' : 'number',
    }
    this.context.variables.set(name, variable)
  }

  /**
   * Set a variable from a CST expression node
   */
  setVariableFromExpressionCst(name: string, expressionCst: CstNode): void {
    const value = this.evaluator.evaluateExpression(expressionCst)
    // Convert boolean to number for BASIC compatibility
    const basicValue = typeof value === 'boolean' ? (value ? 1 : 0) : value
    this.setVariable(name, basicValue as BasicScalarValue)
  }

  /**
   * Set an array element
   */
  setArrayElement(name: string, indices: number[], value: BasicScalarValue): void {
    let array = this.context.arrays.get(name)
    if (!array) {
      // Create array if it doesn't exist
      array = []
      this.context.arrays.set(name, array)
    }

    // Navigate to the correct element
    let current: BasicArrayValue = array
    for (let i = 0; i < indices.length - 1; i++) {
      const index = Math.floor(indices[i] ?? 0)
      if (!Array.isArray(current)) {
        current = []
      }
      current[index] ??= [] as BasicScalarValue[]
      current = current[index]
    }

    // Set the final element
    if (Array.isArray(current)) {
      const finalIndex = Math.floor(indices[indices.length - 1] ?? 0)
      current[finalIndex] = value
    }
  }

  /**
   * Set an array element from CST expression nodes
   */
  setArrayElementFromExpressionsCst(
    name: string,
    indexExpressionsCst: CstNode[],
    valueExpressionCst: CstNode
  ): void {
    const indices = indexExpressionsCst.map(exprCst =>
      this.toNumber(this.evaluator.evaluateExpression(exprCst))
    )
    const value = this.evaluator.evaluateExpression(valueExpressionCst)
    // Convert boolean to number for BASIC compatibility
    const basicValue = typeof value === 'boolean' ? (value ? 1 : 0) : value
    this.setArrayElement(name, indices, basicValue as BasicScalarValue)
  }

  /**
   * Get an array element
   */
  getArrayElement(name: string, indices: number[]): BasicScalarValue {
    const array = this.context.arrays.get(name)
    if (!array) return 0

    let value: BasicArrayValue = array
    for (const index of indices) {
      const numIndex = Math.floor(index)
      if (Array.isArray(value)) {
        const element: BasicArrayValue | undefined = value[numIndex]
        if (element !== undefined) {
          value = element
        } else {
          return 0
        }
      } else {
        return 0
      }
    }

    // At this point, value should be a scalar (not an array)
    return typeof value !== 'object' ? value : 0
  }

  /**
   * Create an array with specified dimensions
   * According to Family BASIC spec:
   * - Numerical arrays are initialized to 0
   * - String arrays (name ends with $) are initialized to empty strings
   */
  createArray(name: string, dimensions: number[]): void {
    const isStringArray = name.endsWith('$')
    const defaultValue = isStringArray ? '' : 0
    const array = this.createArrayRecursive(dimensions, 0, defaultValue)
    this.context.arrays.set(name, array)
  }

  /**
   * Recursively create array structure
   * @param dimensions Array of dimension sizes (highest index + 1)
   * @param currentDim Current dimension index
   * @param defaultValue Default value for leaf elements (0 for numeric, '' for string)
   */
  private createArrayRecursive(
    dimensions: number[],
    currentDim: number,
    defaultValue: BasicScalarValue
  ): BasicArrayValue {
    if (currentDim >= dimensions.length) {
      return []
    }

    // Size is highest index + 1 (e.g., DIM A(3) means indices 0,1,2,3 = 4 elements)
    const highestIndex = Math.floor(dimensions[currentDim] ?? 0)
    const size = highestIndex + 1
    const array: BasicArrayValue[] = []

    for (let i = 0; i < size; i++) {
      if (currentDim === dimensions.length - 1) {
        array[i] = defaultValue // Initialize with default value (0 for numeric, '' for string)
      } else {
        array[i] = this.createArrayRecursive(dimensions, currentDim + 1, defaultValue)
      }
    }

    return array
  }

  /**
   * Check if a variable exists
   */
  hasVariable(name: string): boolean {
    return this.context.variables.has(name)
  }

  /**
   * Check if an array exists
   */
  hasArray(name: string): boolean {
    return this.context.arrays.has(name)
  }

  /**
   * Get all variable names
   */
  getVariableNames(): string[] {
    return Array.from(this.context.variables.keys())
  }

  /**
   * Get all array names
   */
  getArrayNames(): string[] {
    return Array.from(this.context.arrays.keys())
  }

  /**
   * Clear all variables
   */
  clearVariables(): void {
    this.context.variables.clear()
  }

  /**
   * Clear all arrays
   */
  clearArrays(): void {
    this.context.arrays.clear()
  }

  /**
   * Convert a value to an integer
   * Family Basic only supports integer numerical values
   * Uses Decimal.js for precise conversion
   */
  private toNumber(value: number | string | boolean): number {
    if (typeof value === 'number') {
      // Truncate to integer (toward zero) using Decimal
      return new Decimal(value).truncated().toNumber()
    }
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'string') {
      // Parse as integer (truncate toward zero) using Decimal
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : new Decimal(parsed).truncated().toNumber()
    }
    return 0
  }
}
