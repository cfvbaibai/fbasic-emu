/**
 * Data Service
 *
 * Handles DATA, READ, and RESTORE operations for storing and retrieving data.
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicScalarValue } from '@/core/types/BasicTypes'
import { logCore } from '@/shared/logger'

export class DataService {
  constructor(
    private context: ExecutionContext,
    private evaluator: ExpressionEvaluator
  ) {}

  /**
   * Add data values from a DATA statement (CST version)
   * DATA statements only contain constants:
   * - NumberLiteral: numeric constants
   * - StringLiteral: quoted strings (may contain commas/colons)
   * - Identifier: unquoted strings (treated as string constants, not variables)
   */
  addDataValuesCst(constantCsts: CstNode[]): void {
    for (const constantCst of constantCsts) {
      const value = this.evaluateDataConstant(constantCst)
      this.context.dataValues.push(value)
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`DATA: Added ${constantCsts.length} values`)
    }
  }

  /**
   * Evaluate a DATA constant (NumberLiteral, StringLiteral, or Identifier)
   * Identifiers in DATA are treated as string constants, not variable references
   */
  private evaluateDataConstant(constantCst: CstNode): BasicScalarValue {
    // Check for number literal
    const numberToken = getFirstToken(constantCst.children.NumberLiteral)
    if (numberToken) {
      return parseInt(numberToken.image, 10)
    }

    // Check for hex literal (&H<hex digits>, e.g. &HDD = 221)
    const hexToken = getFirstToken(constantCst.children.HexLiteral)
    if (hexToken) {
      return parseInt(hexToken.image.slice(2), 16)
    }

    // Check for string literal (quoted string)
    const stringToken = getFirstToken(constantCst.children.StringLiteral)
    if (stringToken) {
      // Remove quotes and return the string value
      return stringToken.image.slice(1, -1)
    }

    // Check for identifier (unquoted string constant)
    const identifierToken = getFirstToken(constantCst.children.Identifier)
    if (identifierToken) {
      // In DATA statements, identifiers are treated as string constants, not variables
      return identifierToken.image
    }

    // Should not reach here if parser is correct
    throw new Error('Invalid DATA constant: must be NumberLiteral, StringLiteral, or Identifier')
  }

  /**
   * Add data values from a DATA statement (AST version - deprecated)
   */
  addDataValues(_expressions: unknown[]): void {
    // This method is kept for compatibility but should not be used
    // Use addDataValuesCst instead
    logCore.warn('addDataValues called with AST - use addDataValuesCst instead')
  }

  /**
   * Read the next data value
   */
  readNextDataValue(): BasicScalarValue {
    if (this.context.dataIndex >= this.context.dataValues.length) {
      this.context.addError({
        line: 0,
        message: 'OD ERROR',
        type: ERROR_TYPES.RUNTIME,
      })
      return 0
    }

    const value = this.context.dataValues[this.context.dataIndex]
    this.context.dataIndex++

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`READ: ${value}`)
    }

    return value ?? 0
  }

  /**
   * Restore data pointer to beginning or specific line
   */
  restoreData(lineNumber?: number): void {
    if (lineNumber !== undefined) {
      // Find the first DATA statement at or after the specified line
      const targetIndex = this.findDataStatementIndex(lineNumber)
      if (targetIndex !== -1) {
        this.context.dataIndex = targetIndex
      } else {
        this.context.addError({
          line: 0,
          message: `RESTORE target line ${lineNumber} not found`,
          type: ERROR_TYPES.RUNTIME,
        })
        // Reset to 0 as a safe default so dataIndex is never left stale
        this.context.dataIndex = 0
      }
    } else {
      // Restore to beginning
      this.context.dataIndex = 0
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`RESTORE: Data index set to ${this.context.dataIndex}`)
    }
  }

  /**
   * Get current data index
   */
  getCurrentDataIndex(): number {
    return this.context.dataIndex
  }

  /**
   * Get total number of data values
   */
  getDataValueCount(): number {
    return this.context.dataValues.length
  }

  /**
   * Get all data values
   */
  getAllDataValues(): BasicScalarValue[] {
    return [...this.context.dataValues]
  }

  /**
   * Clear all data values
   */
  clearDataValues(): void {
    this.context.dataValues = []
    this.context.dataIndex = 0
  }

  /**
   * Check if there are more data values to read
   */
  hasMoreData(): boolean {
    return this.context.dataIndex < this.context.dataValues.length
  }

  /**
   * Find the index of the first DATA statement at or after the specified line
   */
  private findDataStatementIndex(lineNumber: number): number {
    // Find the first DATA statement at or after the specified line
    // We need to search through expanded statements to find DATA statements
    let dataIndex = 0

    for (const statement of this.context.statements) {
      const commandCst = statement.command
      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)

      if (singleCommandCst?.children.dataStatement) {
        // Found a DATA statement
        if (statement.lineNumber >= lineNumber) {
          return dataIndex
        }
        // Count data values in this DATA statement
        const dataStmtCst = getFirstCstNode(singleCommandCst.children.dataStatement)
        if (dataStmtCst) {
          const dataConstantListCst = getFirstCstNode(dataStmtCst.children.dataConstantList)
          if (dataConstantListCst) {
            const constants = getCstNodes(dataConstantListCst.children.dataConstant)
            dataIndex += constants.length
          }
        }
      }
    }

    return -1 // Not found
  }

  /**
   * Preprocess all DATA statements to build the data array
   */
  preprocessDataStatements(): void {
    this.context.dataValues = []

    // Process all DATA statements in order
    for (const statement of this.context.statements) {
      const commandCst = statement.command
      const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)

      if (singleCommandCst?.children.dataStatement) {
        const dataStmtCst = getFirstCstNode(singleCommandCst.children.dataStatement)
        if (dataStmtCst) {
          const dataConstantListCst = getFirstCstNode(dataStmtCst.children.dataConstantList)
          if (dataConstantListCst) {
            const constants = getCstNodes(dataConstantListCst.children.dataConstant)
            this.addDataValuesCst(constants)
          }
        }
      }
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`Preprocessed ${this.context.dataValues.length} data values`)
    }
  }
}
