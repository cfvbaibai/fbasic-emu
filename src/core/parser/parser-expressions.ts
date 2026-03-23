/**
 * Expression Parsing Rules
 *
 * Registers all expression-related grammar rules on the parser instance.
 * Expression precedence (low to high):
 *   logicalExpression (XOR) > logicalOrExpression (OR) > logicalAndExpression (AND)
 *   > logicalNotExpression (NOT) > comparisonExpression
 *   > bitwiseXorExpression (XOR) > bitwiseOrExpression (OR) > bitwiseAndExpression (AND)
 *   > bitwiseNotExpression (NOT) > additive (+,-) > modExpression (MOD)
 *   > multiplicative (*,/) > unary (+,-) > primary
 */

import type { CstNode } from 'chevrotain'

import {
  // Arithmetic functions
  Abs,
  // Logical
  And,
  Asc,
  Chr,
  Comma,
  // Cursor position functions
  Csrlin,
  Divide,
  // Comparison
  Equal,
  Fre,
  GreaterThan,
  GreaterThanOrEqual,
  Hex,
  HexLiteral,
  Identifier,
  // Keyboard input function
  Inkey,
  Left,
  // String functions
  Len,
  LessThan,
  LessThanOrEqual,
  LParen,
  Mid,
  Minus,
  Mod,
  // Sprite query function
  Move,
  Multiply,
  Not,
  NotEqual,
  NumberLiteral,
  Or,
  // Limited utility functions
  Peek,
  // Operators
  Plus,
  Pos,
  Right,
  Rnd,
  RParen,
  Scr,
  Sgn,
  // Controller input functions
  Stick,
  Str,
  Strig,
  // Literals
  StringLiteral,
  Val,
  Xor,
  Xpos,
  Ypos,
} from './parser-tokens'

/**
 * Type for the parser instance methods needed by expression rules.
 * Keeps this module decoupled from the concrete parser class.
 */
export interface ExpressionParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE3(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE4(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE5(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE6(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE7(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  OPTION(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
  MANY(impl: () => void): void
  LA(offset: number): { tokenType: unknown }
}

/**
 * Expression rule declarations needed on the parser class.
 */
export interface ExpressionRuleDeclarations {
  expressionList: () => CstNode
  functionCall: () => CstNode
  arrayAccess: () => CstNode
  primary: () => CstNode
  unary: () => CstNode
  multiplicative: () => CstNode
  modExpression: () => CstNode
  additive: () => CstNode
  expression: () => CstNode
  bitwiseNotExpression: () => CstNode
  bitwiseAndExpression: () => CstNode
  bitwiseOrExpression: () => CstNode
  bitwiseXorExpression: () => CstNode
  comparisonExpression: () => CstNode
  logicalNotExpression: () => CstNode
  logicalAndExpression: () => CstNode
  logicalOrExpression: () => CstNode
  logicalExpression: () => CstNode
}

/**
 * Register all expression parsing rules on the parser instance.
 * Must be called from the parser constructor after the super() call.
 *
 * @param p - The parser instance (this)
 */
export function registerExpressionRules(p: ExpressionParserInstance & ExpressionRuleDeclarations): void {
  // ExpressionList = Expression (Comma Expression)*
  p.expressionList = p.RULE('expressionList', () => {
    p.SUBRULE(p.expression)
    p.MANY(() => {
      p.CONSUME(Comma)
      p.SUBRULE2(p.expression)
    })
  })

  // FunctionCall = (StringFunction | ArithmeticFunction) LParen ExpressionList? RParen
  // Family BASIC arithmetic functions: ABS, SGN, RND, VAL
  // String functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC, SCR$
  // Cursor functions: POS(n)
  // Keyboard input function: INKEY$ (optional argument)
  p.functionCall = p.RULE('functionCall', () => {
    p.OR([
      // String functions
      { ALT: () => p.CONSUME(Len) },
      { ALT: () => p.CONSUME(Left) },
      { ALT: () => p.CONSUME(Right) },
      { ALT: () => p.CONSUME(Mid) },
      { ALT: () => p.CONSUME(Str) },
      { ALT: () => p.CONSUME(Hex) },
      { ALT: () => p.CONSUME(Chr) },
      { ALT: () => p.CONSUME(Asc) },
      { ALT: () => p.CONSUME(Scr) }, // SCR$(X, Y, Sw) - screen read function
      // Arithmetic functions (Family BASIC only supports these)
      { ALT: () => p.CONSUME(Abs) },
      { ALT: () => p.CONSUME(Sgn) },
      { ALT: () => p.CONSUME(Rnd) },
      { ALT: () => p.CONSUME(Val) },
      // Controller input functions
      { ALT: () => p.CONSUME(Stick) },
      { ALT: () => p.CONSUME(Strig) },
      // Sprite query functions
      { ALT: () => p.CONSUME(Move) }, // MOVE(n) - status query function
      { ALT: () => p.CONSUME(Xpos) },
      { ALT: () => p.CONSUME(Ypos) },
      // Cursor position function
      { ALT: () => p.CONSUME(Pos) }, // POS(n) - cursor column
      // Keyboard input function (fully implemented)
      { ALT: () => p.CONSUME(Inkey) }, // INKEY$ - keyboard input
      // Limited utility functions (not applicable in IDE)
      { ALT: () => p.CONSUME(Peek) },
      { ALT: () => p.CONSUME(Fre) },
    ])
    p.CONSUME(LParen)
    p.OPTION(() => {
      p.SUBRULE(p.expressionList)
    })
    p.CONSUME(RParen)
  })

  // ArrayAccess = Identifier LParen ExpressionList RParen
  // Handles array element access like A(I) or A$(I, J)
  p.arrayAccess = p.RULE('arrayAccess', () => {
    p.CONSUME(Identifier)
    p.CONSUME(LParen)
    p.SUBRULE(p.expressionList)
    p.CONSUME(RParen)
  })

  // Primary = NumberLiteral | HexLiteral | StringLiteral | ArrayAccess
  //         | FunctionCall | Identifier | (LParen Expression RParen)
  p.primary = p.RULE('primary', () => {
    p.OR([
      {
        GATE: () => p.LA(1).tokenType === StringLiteral,
        ALT: () => p.CONSUME(StringLiteral),
      },
      { ALT: () => p.CONSUME(NumberLiteral) },
      { ALT: () => p.CONSUME(HexLiteral) },
      {
        // CSRLIN - cursor line function (no parentheses, returns value directly)
        GATE: () => p.LA(1).tokenType === Csrlin,
        ALT: () => p.CONSUME(Csrlin),
      },
      {
        // INKEY$ without parentheses - consume directly (most common usage)
        // INKEY$(n) with parentheses - handled by functionCall below
        GATE: () => p.LA(1).tokenType === Inkey && p.LA(2).tokenType !== LParen,
        ALT: () => p.CONSUME(Inkey),
      },
      {
        // Function call: String functions, arithmetic functions, controller input functions, and sprite query functions
        // Family BASIC arithmetic functions: ABS, SGN, RND, VAL
        // String functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC, SCR$
        // Controller input functions: STICK, STRIG
        // Sprite query functions: MOVE(n), XPOS(n), YPOS(n)
        // Cursor position function: POS(n)
        // Keyboard input function: INKEY$(n) - only with parentheses here
        // Limited utility functions: PEEK(n), FRE(n)
        GATE: () =>
          p.LA(1).tokenType === Len ||
          p.LA(1).tokenType === Left ||
          p.LA(1).tokenType === Right ||
          p.LA(1).tokenType === Mid ||
          p.LA(1).tokenType === Str ||
          p.LA(1).tokenType === Hex ||
          p.LA(1).tokenType === Chr ||
          p.LA(1).tokenType === Asc ||
          p.LA(1).tokenType === Scr ||
          p.LA(1).tokenType === Abs ||
          p.LA(1).tokenType === Sgn ||
          p.LA(1).tokenType === Rnd ||
          p.LA(1).tokenType === Val ||
          p.LA(1).tokenType === Stick ||
          p.LA(1).tokenType === Strig ||
          (p.LA(1).tokenType === Move && p.LA(2).tokenType === LParen) ||
          (p.LA(1).tokenType === Xpos && p.LA(2).tokenType === LParen) ||
          p.LA(1).tokenType === Ypos ||
          p.LA(1).tokenType === Pos ||
          (p.LA(1).tokenType === Inkey && p.LA(2).tokenType === LParen) ||
          p.LA(1).tokenType === Peek ||
          p.LA(1).tokenType === Fre,
        ALT: () => p.SUBRULE(p.functionCall),
      },
      {
        // Array access: Identifier LParen ExpressionList RParen
        // Must check before plain Identifier to avoid ambiguity
        GATE: () => p.LA(1).tokenType === Identifier && p.LA(2).tokenType === LParen,
        ALT: () => p.SUBRULE(p.arrayAccess),
      },
      { ALT: () => p.CONSUME(Identifier) },
      {
        ALT: () => {
          p.CONSUME(LParen)
          p.SUBRULE(p.expression)
          p.CONSUME(RParen)
        },
      },
    ])
  })

  // Unary = (Plus | Minus)? Primary
  // Handles unary plus and minus operators (e.g., -5, +10, -X)
  p.unary = p.RULE('unary', () => {
    p.OPTION(() => {
      p.OR([{ ALT: () => p.CONSUME(Plus) }, { ALT: () => p.CONSUME(Minus) }])
    })
    p.SUBRULE(p.primary)
  })

  // Multiplicative = Unary ((Multiply | Divide) Unary)*
  // Priority 1: *, /
  p.multiplicative = p.RULE('multiplicative', () => {
    p.SUBRULE(p.unary)
    p.MANY(() => {
      p.OR([{ ALT: () => p.CONSUME(Multiply) }, { ALT: () => p.CONSUME(Divide) }])
      p.SUBRULE2(p.unary)
    })
  })

  // ModExpression = Multiplicative ((MOD) Multiplicative)*
  // Priority 2: MOD (after *, / but before +, -)
  p.modExpression = p.RULE('modExpression', () => {
    p.SUBRULE(p.multiplicative)
    p.MANY(() => {
      p.CONSUME(Mod)
      p.SUBRULE2(p.multiplicative)
    })
  })

  // Additive = ModExpression ((Plus | Minus) ModExpression)*
  // Priority 3: +, -
  p.additive = p.RULE('additive', () => {
    p.SUBRULE(p.modExpression)
    p.MANY(() => {
      p.OR([{ ALT: () => p.CONSUME(Plus) }, { ALT: () => p.CONSUME(Minus) }])
      p.SUBRULE2(p.modExpression)
    })
  })

  // Expression = LogicalExpression (full expression including AND/OR/NOT/XOR in numeric context)
  // Per F-BASIC manual p.52: logical operators are numeric (bitwise) and participate in expression evaluation
  p.expression = p.RULE('expression', () => {
    p.SUBRULE(p.logicalExpression)
  })

  // Bitwise levels (numeric AND/OR/NOT/XOR) - operands are additive only to avoid recursion
  // Order per manual: NOT > AND > OR > XOR; these sit between additive and comparison
  p.bitwiseNotExpression = p.RULE('bitwiseNotExpression', () => {
    p.OPTION(() => p.CONSUME(Not))
    p.SUBRULE(p.additive)
  })

  p.bitwiseAndExpression = p.RULE('bitwiseAndExpression', () => {
    p.SUBRULE(p.bitwiseNotExpression)
    p.MANY(() => {
      p.CONSUME(And)
      p.SUBRULE2(p.bitwiseNotExpression)
    })
  })

  p.bitwiseOrExpression = p.RULE('bitwiseOrExpression', () => {
    p.SUBRULE(p.bitwiseAndExpression)
    p.MANY(() => {
      p.CONSUME(Or)
      p.SUBRULE2(p.bitwiseAndExpression)
    })
  })

  p.bitwiseXorExpression = p.RULE('bitwiseXorExpression', () => {
    p.SUBRULE(p.bitwiseOrExpression)
    p.MANY(() => {
      p.CONSUME(Xor)
      p.SUBRULE2(p.bitwiseOrExpression)
    })
  })

  // ComparisonExpression = BitwiseXorExpression (ComparisonOperator Additive)?
  // Left operand is full bitwise (allows (A AND 1)=1); right operand is additive only so
  // "X > 0 AND X < 10" parses as (X>0) AND (X<10) (relational binds tighter than AND).
  p.comparisonExpression = p.RULE('comparisonExpression', () => {
    p.SUBRULE(p.bitwiseXorExpression)
    p.OPTION(() => {
      p.OR([
        { ALT: () => p.CONSUME(Equal) },
        { ALT: () => p.CONSUME(NotEqual) },
        { ALT: () => p.CONSUME(LessThan) },
        { ALT: () => p.CONSUME(GreaterThan) },
        { ALT: () => p.CONSUME(LessThanOrEqual) },
        { ALT: () => p.CONSUME(GreaterThanOrEqual) },
      ])
      p.SUBRULE2(p.additive)
    })
  })

  // LogicalNotExpression = (NOT)? ComparisonExpression
  // NOT has highest precedence (applies to ComparisonExpression)
  p.logicalNotExpression = p.RULE('logicalNotExpression', () => {
    p.OPTION(() => {
      p.CONSUME(Not)
    })
    p.SUBRULE(p.comparisonExpression)
  })

  // LogicalAndExpression = LogicalNotExpression (AND LogicalNotExpression)*
  // AND has middle precedence (combines LogicalNotExpressions)
  p.logicalAndExpression = p.RULE('logicalAndExpression', () => {
    p.SUBRULE(p.logicalNotExpression)
    p.MANY(() => {
      p.CONSUME(And)
      p.SUBRULE2(p.logicalNotExpression)
    })
  })

  // LogicalOrExpression = LogicalAndExpression (OR LogicalAndExpression)*
  // OR combines LogicalAndExpressions
  p.logicalOrExpression = p.RULE('logicalOrExpression', () => {
    p.SUBRULE(p.logicalAndExpression)
    p.MANY(() => {
      p.CONSUME(Or)
      p.SUBRULE2(p.logicalAndExpression)
    })
  })

  // LogicalExpression = LogicalOrExpression (XOR LogicalOrExpression)*
  // XOR has lowest precedence (combines LogicalOrExpressions)
  // This ensures correct precedence: NOT > AND > OR > XOR
  p.logicalExpression = p.RULE('logicalExpression', () => {
    p.SUBRULE(p.logicalOrExpression)
    p.MANY(() => {
      p.CONSUME(Xor)
      p.SUBRULE2(p.logicalOrExpression)
    })
  })
}
