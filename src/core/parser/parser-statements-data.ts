/**
 * Data and Array Statement Parsing Rules
 *
 * Registers data and array grammar rules on the parser instance.
 * Includes: DIM, DATA, READ, RESTORE.
 */

import type { CstNode } from 'chevrotain'

import {
  Comma,
  Data,
  Dim,
  HexLiteral,
  Identifier,
  LParen,
  NumberLiteral,
  Read,
  Restore,
  RParen,
  StringLiteral,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by data statement rules.
 */
export interface DataStatementParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME2(tokenType: unknown, options?: Record<string, unknown>): unknown
  OPTION(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
  OR2(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
  MANY(impl: () => void): void
  LA(offset: number): { tokenType: unknown }
}

/**
 * Data statement rule declarations needed on the parser class.
 */
export interface DataStatementRuleDeclarations {
  dimensionList: () => CstNode
  arrayDeclaration: () => CstNode
  dimStatement: () => CstNode
  dataConstant: () => CstNode
  dataConstantList: () => CstNode
  dataStatement: () => CstNode
  readStatement: () => CstNode
  restoreStatement: () => CstNode
  // Expression rules (needed by data statements)
  expression: () => CstNode
  expressionList: () => CstNode
  arrayAccess: () => CstNode
}

/**
 * Register data and array statement parsing rules on the parser instance.
 * Must be called from the parser constructor after expression rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerDataStatementRules(
  p: DataStatementParserInstance & DataStatementRuleDeclarations
): void {
  // DimensionList = Expression (Comma Expression)?
  // For 1D array: (m1)
  // For 2D array: (m1, m2)
  p.dimensionList = p.RULE('dimensionList', () => {
    p.SUBRULE(p.expression) // First dimension
    p.OPTION(() => {
      p.CONSUME(Comma)
      p.SUBRULE2(p.expression) // Second dimension (optional)
    })
  })

  // ArrayDeclaration = Identifier LParen DimensionList RParen
  // Examples: A(3), B(3,3), A$(3), B$(3,3)
  p.arrayDeclaration = p.RULE('arrayDeclaration', () => {
    p.CONSUME(Identifier) // Array name (can include $ for string arrays)
    p.CONSUME(LParen)
    p.SUBRULE(p.dimensionList)
    p.CONSUME(RParen)
  })

  // DIM ArrayDeclaration (Comma ArrayDeclaration)*
  // Declares one or more arrays
  // Example: DIM A(3), B(3,3), A$(3), B$(3,3)
  p.dimStatement = p.RULE('dimStatement', () => {
    p.CONSUME(Dim)
    p.SUBRULE(p.arrayDeclaration)
    p.MANY(() => {
      p.CONSUME(Comma)
      p.SUBRULE2(p.arrayDeclaration)
    })
  })

  // DataConstant = NumberLiteral | HexLiteral | StringLiteral | Identifier
  // DATA statements only accept constants (not expressions/variables)
  // Identifiers in DATA are treated as string constants (unquoted strings)
  // Example: DATA 10, &H0A, GOOD, "Hello, World"
  p.dataConstant = p.RULE('dataConstant', () => {
    p.OR([
      { ALT: () => p.CONSUME(NumberLiteral) },
      { ALT: () => p.CONSUME(HexLiteral) },
      {
        GATE: () => p.LA(1).tokenType === StringLiteral,
        ALT: () => p.CONSUME(StringLiteral),
      },
      { ALT: () => p.CONSUME(Identifier) }, // Unquoted string constant
    ])
  })

  // DataConstantList = DataConstant (Comma DataConstant)*
  // List of constants for DATA statement (optional - empty DATA is allowed)
  p.dataConstantList = p.RULE('dataConstantList', () => {
    p.OPTION(() => {
      p.SUBRULE(p.dataConstant)
      p.MANY(() => {
        p.CONSUME(Comma)
        p.SUBRULE2(p.dataConstant)
      })
    })
  })

  // DATA DataConstantList
  // Stores data values that can be read by READ
  // Only accepts constants: NumberLiteral, StringLiteral (quoted), Identifier (unquoted string)
  // Example: DATA 10, 20, GOOD, MORNING, "Hello, World"
  // Empty DATA statement is allowed: DATA
  p.dataStatement = p.RULE('dataStatement', () => {
    p.CONSUME(Data)
    p.SUBRULE(p.dataConstantList)
  })

  // READ (Identifier | ArrayAccess) (Comma (Identifier | ArrayAccess))*
  // Reads data values from DATA statements into variables or array elements
  // Example: READ A, B, C$, D$, A(I), B$(I, J)
  p.readStatement = p.RULE('readStatement', () => {
    p.CONSUME(Read)
    // First variable: Identifier or ArrayAccess
    p.OR([
      {
        // Array access: Identifier LParen ExpressionList RParen
        GATE: () => p.LA(1).tokenType === Identifier && p.LA(2).tokenType === LParen,
        ALT: () => p.SUBRULE(p.arrayAccess),
      },
      { ALT: () => p.CONSUME(Identifier) },
    ])
    // Additional variables
    p.MANY(() => {
      p.CONSUME(Comma)
      p.OR2([
        {
          // Array access: Identifier LParen ExpressionList RParen
          GATE: () => p.LA(1).tokenType === Identifier && p.LA(2).tokenType === LParen,
          ALT: () => p.SUBRULE2(p.arrayAccess),
        },
        { ALT: () => p.CONSUME2(Identifier) },
      ])
    })
  })

  // RESTORE (NumberLiteral)?
  // Restores data pointer to beginning or specific line
  // Example: RESTORE or RESTORE 100
  p.restoreStatement = p.RULE('restoreStatement', () => {
    p.CONSUME(Restore)
    p.OPTION(() => {
      p.CONSUME(NumberLiteral) // Optional line number
    })
  })
}
