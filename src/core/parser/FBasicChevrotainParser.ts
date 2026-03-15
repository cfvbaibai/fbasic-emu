/**
 * F-BASIC Chevrotain Parser
 *
 * Complete Chevrotain-based parser implementation for F-BASIC language.
 * This replaces the Peggy.js parser with a TypeScript-native solution.
 *
 * Uses line-by-line parsing approach: split code by line breaks,
 * parse each line independently, then combine results.
 *
 * Note: Parsing is line-based (BASIC syntax requires line numbers),
 * but execution is statement-based (statements are expanded into a flat list).
 */

import { CstParser } from 'chevrotain'
import type { CstNode, ILexingError, IRecognitionException, IToken } from 'chevrotain'
import {
  // Keywords
  Let,
  Print,
  For,
  To,
  Step,
  Next,
  End,
  Pause,
  Play,
  If,
  Then,
  Goto,
  Gosub,
  Return,
  On,
  Off,
  Dim,
  Data,
  Read,
  Restore,
  Input,
  Linput,
  Cls,
  Swap,
  Clear,
  Locate,
  Color,
  Cgset,
  Cgen,
  Palet,
  Paletb,
  Palets,
  View,
  Def,
  Sprite,
  Move,
  Cut,
  Era,
  Position,
  // REPL-only commands
  List,
  New,
  Run,
  Save,
  Load,
  Key,
  Keylist,
  Cont,
  System,
  // Limited utility commands
  Poke,
  Peek,
  Fre,
  Inkey,
  Stop,
  // String functions
  Len,
  Left,
  Right,
  Mid,
  Str,
  Hex,
  Chr,
  Asc,
  // Arithmetic functions
  Abs,
  Sgn,
  Rnd,
  Val,
  // Controller input functions
  Stick,
  Strig,
  Xpos,
  Ypos,
  // Cursor position functions
  Csrlin,
  Pos,
  // Screen read function
  Scr,
  // BEEP statement
  Beep,
  // Logical operators
  And,
  Or,
  Xor,
  Not,
  // Comparison operators
  GreaterThan,
  LessThan,
  NotEqual,
  GreaterThanOrEqual,
  LessThanOrEqual,
  // Operators
  Equal,
  Plus,
  Minus,
  Multiply,
  Divide,
  Mod,
  // Punctuation
  Comma,
  Semicolon,
  Colon,
  LParen,
  RParen,
  Question,
  // Literals
  StringLiteral,
  HexLiteral,
  NumberLiteral,
  Identifier,
  // Lexer
  lexer,
  allTokens,
} from './parser-tokens'

// ============================================================================
// PARSER CLASS
// ============================================================================

class FBasicChevrotainParser extends CstParser {
  // Declare rule methods for TypeScript
  declare primary: () => CstNode
  declare unary: () => CstNode
  declare multiplicative: () => CstNode
  declare modExpression: () => CstNode
  declare additive: () => CstNode
  declare expression: () => CstNode
  declare printItem: () => CstNode
  declare printList: () => CstNode
  declare printStatement: () => CstNode
  declare letStatement: () => CstNode
  declare forStatement: () => CstNode
  declare nextStatement: () => CstNode
  declare endStatement: () => CstNode
  declare pauseStatement: () => CstNode
  declare playStatement: () => CstNode
  declare beepStatement: () => CstNode
  declare bitwiseNotExpression: () => CstNode
  declare bitwiseAndExpression: () => CstNode
  declare bitwiseOrExpression: () => CstNode
  declare bitwiseXorExpression: () => CstNode
  declare comparisonExpression: () => CstNode
  declare logicalNotExpression: () => CstNode
  declare logicalAndExpression: () => CstNode
  declare logicalOrExpression: () => CstNode
  declare logicalExpression: () => CstNode
  declare ifThenStatement: () => CstNode
  declare gotoStatement: () => CstNode
  declare gosubStatement: () => CstNode
  declare returnStatement: () => CstNode
  declare onStatement: () => CstNode
  declare lineNumberList: () => CstNode
  declare dimStatement: () => CstNode
  declare dataStatement: () => CstNode
  declare readStatement: () => CstNode
  declare restoreStatement: () => CstNode
  declare inputStatement: () => CstNode
  declare linputStatement: () => CstNode
  declare clsStatement: () => CstNode
  declare swapStatement: () => CstNode
  declare swapTarget: () => CstNode
  declare clearStatement: () => CstNode
  declare locateStatement: () => CstNode
  declare colorStatement: () => CstNode
  declare cgsetStatement: () => CstNode
  declare cgenStatement: () => CstNode
  declare paletStatement: () => CstNode
  declare paletParameterList: () => CstNode
  declare viewStatement: () => CstNode
  declare defSpriteStatement: () => CstNode
  declare spriteStatement: () => CstNode
  declare spriteOnOffStatement: () => CstNode
  declare defMoveStatement: () => CstNode
  declare moveStatement: () => CstNode
  declare cutStatement: () => CstNode
  declare eraStatement: () => CstNode
  declare positionStatement: () => CstNode
  // REPL-only command rules
  declare listStatement: () => CstNode
  declare newStatement: () => CstNode
  declare runStatement: () => CstNode
  declare saveStatement: () => CstNode
  declare loadStatement: () => CstNode
  declare keyStatement: () => CstNode
  declare keylistStatement: () => CstNode
  declare contStatement: () => CstNode
  declare systemStatement: () => CstNode
  // Limited utility command rules
  declare pokeStatement: () => CstNode
  declare peekStatement: () => CstNode
  declare freStatement: () => CstNode
  declare inkeyStatement: () => CstNode
  declare stopStatement: () => CstNode
  declare arrayDeclaration: () => CstNode
  declare dimensionList: () => CstNode
  declare expressionList: () => CstNode
  declare dataConstant: () => CstNode
  declare dataConstantList: () => CstNode
  declare functionCall: () => CstNode
  declare arrayAccess: () => CstNode
  declare singleCommand: () => CstNode
  declare command: () => CstNode
  declare commandList: () => CstNode
  declare statement: () => CstNode

  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    })

    // Define rules in dependency order (bottom-up)

    // ExpressionList = Expression (Comma Expression)*
    this.expressionList = this.RULE('expressionList', () => {
      this.SUBRULE(this.expression)
      this.MANY(() => {
        this.CONSUME(Comma)
        this.SUBRULE2(this.expression)
      })
    })

    // FunctionCall = (StringFunction | ArithmeticFunction) LParen ExpressionList? RParen
    // Family BASIC arithmetic functions: ABS, SGN, RND, VAL
    // String functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC, SCR$
    // Cursor functions: POS(n)
    // Keyboard input function: INKEY$ (optional argument)
    this.functionCall = this.RULE('functionCall', () => {
      this.OR([
        // String functions
        { ALT: () => this.CONSUME(Len) },
        { ALT: () => this.CONSUME(Left) },
        { ALT: () => this.CONSUME(Right) },
        { ALT: () => this.CONSUME(Mid) },
        { ALT: () => this.CONSUME(Str) },
        { ALT: () => this.CONSUME(Hex) },
        { ALT: () => this.CONSUME(Chr) },
        { ALT: () => this.CONSUME(Asc) },
        { ALT: () => this.CONSUME(Scr) }, // SCR$(X, Y, Sw) - screen read function
        // Arithmetic functions (Family BASIC only supports these)
        { ALT: () => this.CONSUME(Abs) },
        { ALT: () => this.CONSUME(Sgn) },
        { ALT: () => this.CONSUME(Rnd) },
        { ALT: () => this.CONSUME(Val) },
        // Controller input functions
        { ALT: () => this.CONSUME(Stick) },
        { ALT: () => this.CONSUME(Strig) },
        // Sprite query functions
        { ALT: () => this.CONSUME(Move) }, // MOVE(n) - status query function
        { ALT: () => this.CONSUME(Xpos) },
        { ALT: () => this.CONSUME(Ypos) },
        // Cursor position function
        { ALT: () => this.CONSUME(Pos) }, // POS(n) - cursor column
        // Keyboard input function (fully implemented)
        { ALT: () => this.CONSUME(Inkey) }, // INKEY$ - keyboard input
        // Limited utility functions (not applicable in IDE)
        { ALT: () => this.CONSUME(Peek) },
        { ALT: () => this.CONSUME(Fre) },
      ])
      this.CONSUME(LParen)
      this.OPTION(() => {
        this.SUBRULE(this.expressionList)
      })
      this.CONSUME(RParen)
    })

    // ArrayAccess = Identifier LParen ExpressionList RParen
    // Handles array element access like A(I) or A$(I, J)
    this.arrayAccess = this.RULE('arrayAccess', () => {
      this.CONSUME(Identifier)
      this.CONSUME(LParen)
      this.SUBRULE(this.expressionList)
      this.CONSUME(RParen)
    })

    // Primary = NumberLiteral | HexLiteral | StringLiteral | ArrayAccess | FunctionCall | Identifier | (LParen Expression RParen)
    this.primary = this.RULE('primary', () => {
      this.OR([
        {
          GATE: () => this.LA(1).tokenType === StringLiteral,
          ALT: () => this.CONSUME(StringLiteral),
        },
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(HexLiteral) },
        {
          // CSRLIN - cursor line function (no parentheses, returns value directly)
          GATE: () => this.LA(1).tokenType === Csrlin,
          ALT: () => this.CONSUME(Csrlin),
        },
        {
          // INKEY$ without parentheses - consume directly (most common usage)
          // INKEY$(n) with parentheses - handled by functionCall below
          GATE: () => this.LA(1).tokenType === Inkey && this.LA(2).tokenType !== LParen,
          ALT: () => this.CONSUME(Inkey),
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
            this.LA(1).tokenType === Len ||
            this.LA(1).tokenType === Left ||
            this.LA(1).tokenType === Right ||
            this.LA(1).tokenType === Mid ||
            this.LA(1).tokenType === Str ||
            this.LA(1).tokenType === Hex ||
            this.LA(1).tokenType === Chr ||
            this.LA(1).tokenType === Asc ||
            this.LA(1).tokenType === Scr ||
            this.LA(1).tokenType === Abs ||
            this.LA(1).tokenType === Sgn ||
            this.LA(1).tokenType === Rnd ||
            this.LA(1).tokenType === Val ||
            this.LA(1).tokenType === Stick ||
            this.LA(1).tokenType === Strig ||
            (this.LA(1).tokenType === Move && this.LA(2).tokenType === LParen) ||
            this.LA(1).tokenType === Xpos ||
            this.LA(1).tokenType === Ypos ||
            this.LA(1).tokenType === Pos ||
            (this.LA(1).tokenType === Inkey && this.LA(2).tokenType === LParen) ||
            this.LA(1).tokenType === Peek ||
            this.LA(1).tokenType === Fre,
          ALT: () => this.SUBRULE(this.functionCall),
        },
        {
          // Array access: Identifier LParen ExpressionList RParen
          // Must check before plain Identifier to avoid ambiguity
          GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LParen,
          ALT: () => this.SUBRULE(this.arrayAccess),
        },
        { ALT: () => this.CONSUME(Identifier) },
        {
          ALT: () => {
            this.CONSUME(LParen)
            this.SUBRULE(this.expression)
            this.CONSUME(RParen)
          },
        },
      ])
    })

    // Unary = (Plus | Minus)? Primary
    // Handles unary plus and minus operators (e.g., -5, +10, -X)
    this.unary = this.RULE('unary', () => {
      this.OPTION(() => {
        this.OR([{ ALT: () => this.CONSUME(Plus) }, { ALT: () => this.CONSUME(Minus) }])
      })
      this.SUBRULE(this.primary)
    })

    // Multiplicative = Unary ((Multiply | Divide) Unary)*
    // Priority 1: *, /
    this.multiplicative = this.RULE('multiplicative', () => {
      this.SUBRULE(this.unary)
      this.MANY(() => {
        this.OR([{ ALT: () => this.CONSUME(Multiply) }, { ALT: () => this.CONSUME(Divide) }])
        this.SUBRULE2(this.unary)
      })
    })

    // ModExpression = Multiplicative ((MOD) Multiplicative)*
    // Priority 2: MOD (after *, / but before +, -)
    this.modExpression = this.RULE('modExpression', () => {
      this.SUBRULE(this.multiplicative)
      this.MANY(() => {
        this.CONSUME(Mod)
        this.SUBRULE2(this.multiplicative)
      })
    })

    // Additive = ModExpression ((Plus | Minus) ModExpression)*
    // Priority 3: +, -
    this.additive = this.RULE('additive', () => {
      this.SUBRULE(this.modExpression)
      this.MANY(() => {
        this.OR([{ ALT: () => this.CONSUME(Plus) }, { ALT: () => this.CONSUME(Minus) }])
        this.SUBRULE2(this.modExpression)
      })
    })

    // Expression = LogicalExpression (full expression including AND/OR/NOT/XOR in numeric context)
    // Per F-BASIC manual p.52: logical operators are numeric (bitwise) and participate in expression evaluation
    this.expression = this.RULE('expression', () => {
      this.SUBRULE(this.logicalExpression)
    })

    // Bitwise levels (numeric AND/OR/NOT/XOR) - operands are additive only to avoid recursion
    // Order per manual: NOT > AND > OR > XOR; these sit between additive and comparison
    this.bitwiseNotExpression = this.RULE('bitwiseNotExpression', () => {
      this.OPTION(() => this.CONSUME(Not))
      this.SUBRULE(this.additive)
    })

    this.bitwiseAndExpression = this.RULE('bitwiseAndExpression', () => {
      this.SUBRULE(this.bitwiseNotExpression)
      this.MANY(() => {
        this.CONSUME(And)
        this.SUBRULE2(this.bitwiseNotExpression)
      })
    })

    this.bitwiseOrExpression = this.RULE('bitwiseOrExpression', () => {
      this.SUBRULE(this.bitwiseAndExpression)
      this.MANY(() => {
        this.CONSUME(Or)
        this.SUBRULE2(this.bitwiseAndExpression)
      })
    })

    this.bitwiseXorExpression = this.RULE('bitwiseXorExpression', () => {
      this.SUBRULE(this.bitwiseOrExpression)
      this.MANY(() => {
        this.CONSUME(Xor)
        this.SUBRULE2(this.bitwiseOrExpression)
      })
    })

    // ComparisonExpression = BitwiseXorExpression (ComparisonOperator Additive)?
    // Left operand is full bitwise (allows (A AND 1)=1); right operand is additive only so
    // "X > 0 AND X < 10" parses as (X>0) AND (X<10) (relational binds tighter than AND).
    this.comparisonExpression = this.RULE('comparisonExpression', () => {
      this.SUBRULE(this.bitwiseXorExpression)
      this.OPTION(() => {
        this.OR([
          { ALT: () => this.CONSUME(Equal) },
          { ALT: () => this.CONSUME(NotEqual) },
          { ALT: () => this.CONSUME(LessThan) },
          { ALT: () => this.CONSUME(GreaterThan) },
          { ALT: () => this.CONSUME(LessThanOrEqual) },
          { ALT: () => this.CONSUME(GreaterThanOrEqual) },
        ])
        this.SUBRULE2(this.additive)
      })
    })

    // LogicalNotExpression = (NOT)? ComparisonExpression
    // NOT has highest precedence (applies to ComparisonExpression)
    this.logicalNotExpression = this.RULE('logicalNotExpression', () => {
      this.OPTION(() => {
        this.CONSUME(Not)
      })
      this.SUBRULE(this.comparisonExpression)
    })

    // LogicalAndExpression = LogicalNotExpression (AND LogicalNotExpression)*
    // AND has middle precedence (combines LogicalNotExpressions)
    this.logicalAndExpression = this.RULE('logicalAndExpression', () => {
      this.SUBRULE(this.logicalNotExpression)
      this.MANY(() => {
        this.CONSUME(And)
        this.SUBRULE2(this.logicalNotExpression)
      })
    })

    // LogicalOrExpression = LogicalAndExpression (OR LogicalAndExpression)*
    // OR combines LogicalAndExpressions
    this.logicalOrExpression = this.RULE('logicalOrExpression', () => {
      this.SUBRULE(this.logicalAndExpression)
      this.MANY(() => {
        this.CONSUME(Or)
        this.SUBRULE2(this.logicalAndExpression)
      })
    })

    // LogicalExpression = LogicalOrExpression (XOR LogicalOrExpression)*
    // XOR has lowest precedence (combines LogicalOrExpressions)
    // This ensures correct precedence: NOT > AND > OR > XOR
    this.logicalExpression = this.RULE('logicalExpression', () => {
      this.SUBRULE(this.logicalOrExpression)
      this.MANY(() => {
        this.CONSUME(Xor)
        this.SUBRULE2(this.logicalOrExpression)
      })
    })

    // PrintItem = Expression | StringLiteral
    this.printItem = this.RULE('printItem', () => {
      this.OR([
        {
          GATE: () => this.LA(1).tokenType === StringLiteral,
          ALT: () => this.CONSUME(StringLiteral),
        },
        { ALT: () => this.SUBRULE(this.expression) },
      ])
    })

    // PrintList = PrintItem (Comma|Semicolon PrintItem?)*
    // Allows trailing comma or semicolon (e.g., PRINT X; or PRINT A, B,)
    // Trailing separator is consumed but PrintItem is optional
    this.printList = this.RULE('printList', () => {
      this.SUBRULE(this.printItem)
      this.MANY(() => {
        this.OR([{ ALT: () => this.CONSUME(Comma) }, { ALT: () => this.CONSUME(Semicolon) }])
        // PrintItem is optional - allows trailing separator
        this.OPTION(() => {
          this.SUBRULE2(this.printItem)
        })
      })
    })

    // PRINT PrintList?
    this.printStatement = this.RULE('printStatement', () => {
      this.CONSUME(Print)
      this.OPTION(() => {
        this.SUBRULE(this.printList)
      })
    })

    // LET? Identifier = Expression
    // LET (Identifier | ArrayAccess) = Expression
    // Supports both simple variable assignment and array element assignment
    // Examples: LET X = 5, LET A(0) = 10, LET A$(I, J) = "Hello"
    this.letStatement = this.RULE('letStatement', () => {
      this.OPTION(() => {
        this.CONSUME(Let)
      })
      // Variable or array element (must check ArrayAccess before Identifier)
      this.OR([
        {
          // Array access: Identifier LParen ExpressionList RParen
          GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LParen,
          ALT: () => this.SUBRULE(this.arrayAccess),
        },
        { ALT: () => this.CONSUME(Identifier) },
      ])
      this.CONSUME(Equal)
      this.SUBRULE(this.expression)
    })

    // FOR Identifier = Expression TO Expression (STEP Expression)?
    this.forStatement = this.RULE('forStatement', () => {
      this.CONSUME(For)
      this.CONSUME(Identifier) // Loop variable
      this.CONSUME(Equal)
      this.SUBRULE(this.expression) // Start value
      this.CONSUME(To)
      this.SUBRULE2(this.expression) // End value
      this.OPTION(() => {
        this.CONSUME(Step)
        this.SUBRULE3(this.expression) // Step value (defaults to 1)
      })
    })

    // NEXT (no variable name allowed - Family BASIC spec)
    // According to spec: "You can not add a loop variable name after NEXT. (An error will occur)"
    this.nextStatement = this.RULE('nextStatement', () => {
      this.CONSUME(Next)
      // No identifier allowed - NEXT must be standalone
    })

    // END
    this.endStatement = this.RULE('endStatement', () => {
      this.CONSUME(End)
    })

    // PAUSE Expression
    // Pauses program execution for the specified number of frames (1 frame = ~1/30 second)
    this.pauseStatement = this.RULE('pauseStatement', () => {
      this.CONSUME(Pause)
      this.SUBRULE(this.expression)
    })

    // PLAY StringExpression
    // Plays back music according to the sound specified by the string data
    this.playStatement = this.RULE('playStatement', () => {
      this.CONSUME(Play)
      this.SUBRULE(this.expression) // String expression with music data
    })

    // BEEP
    // Outputs a 'beep' type of sound
    this.beepStatement = this.RULE('beepStatement', () => {
      this.CONSUME(Beep)
    })

    // GOTO NumberLiteral
    // Jumps unconditionally to the specified line number
    this.gotoStatement = this.RULE('gotoStatement', () => {
      this.CONSUME(Goto)
      this.CONSUME(NumberLiteral) // Line number to jump to
    })

    // GOSUB NumberLiteral
    // Calls a subroutine at the specified line number
    // Example: GOSUB 1000
    this.gosubStatement = this.RULE('gosubStatement', () => {
      this.CONSUME(Gosub)
      this.CONSUME(NumberLiteral)
    })

    // RETURN (NumberLiteral)?
    // Returns from a subroutine
    // Example: RETURN or RETURN 100
    this.returnStatement = this.RULE('returnStatement', () => {
      this.CONSUME(Return)
      this.OPTION(() => {
        this.CONSUME(NumberLiteral) // Optional line number
      })
    })

    // LineNumberList = NumberLiteral (Comma NumberLiteral)*
    // List of line numbers for ON statement
    // Example: 100, 200, 300
    this.lineNumberList = this.RULE('lineNumberList', () => {
      this.CONSUME(NumberLiteral)
      this.MANY(() => {
        this.CONSUME(Comma)
        this.CONSUME2(NumberLiteral)
      })
    })

    // ON Expression {GOTO | GOSUB | RETURN | RESTORE} LineNumberList
    // Jumps to line number based on expression value (1 = first, 2 = second, etc.)
    // If value is 0 or exceeds list length, proceeds to next line
    // Example: ON X GOTO 100, 200, 300
    // Example: ON N GOSUB 100, 200, 300, 400, 500, 600
    // Example: ON X RETURN 100, 200, 300
    // Example: ON X RESTORE 100, 200, 300
    this.onStatement = this.RULE('onStatement', () => {
      this.CONSUME(On)
      this.SUBRULE(this.expression)
      // GOTO, GOSUB, RETURN, or RESTORE
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Goto)
            this.SUBRULE(this.lineNumberList)
          },
        },
        {
          ALT: () => {
            this.CONSUME(Gosub)
            this.SUBRULE2(this.lineNumberList)
          },
        },
        {
          ALT: () => {
            this.CONSUME(Return)
            this.SUBRULE3(this.lineNumberList)
          },
        },
        {
          ALT: () => {
            this.CONSUME(Restore)
            this.SUBRULE4(this.lineNumberList)
          },
        },
      ])
    })

    // DimensionList = Expression (Comma Expression)?
    // For 1D array: (m1)
    // For 2D array: (m1, m2)
    this.dimensionList = this.RULE('dimensionList', () => {
      this.SUBRULE(this.expression) // First dimension
      this.OPTION(() => {
        this.CONSUME(Comma)
        this.SUBRULE2(this.expression) // Second dimension (optional)
      })
    })

    // ArrayDeclaration = Identifier LParen DimensionList RParen
    // Examples: A(3), B(3,3), A$(3), B$(3,3)
    this.arrayDeclaration = this.RULE('arrayDeclaration', () => {
      this.CONSUME(Identifier) // Array name (can include $ for string arrays)
      this.CONSUME(LParen)
      this.SUBRULE(this.dimensionList)
      this.CONSUME(RParen)
    })

    // DIM ArrayDeclaration (Comma ArrayDeclaration)*
    // Declares one or more arrays
    // Example: DIM A(3), B(3,3), A$(3), B$(3,3)
    this.dimStatement = this.RULE('dimStatement', () => {
      this.CONSUME(Dim)
      this.SUBRULE(this.arrayDeclaration)
      this.MANY(() => {
        this.CONSUME(Comma)
        this.SUBRULE2(this.arrayDeclaration)
      })
    })

    // DataConstant = NumberLiteral | HexLiteral | StringLiteral | Identifier
    // DATA statements only accept constants (not expressions/variables)
    // Identifiers in DATA are treated as string constants (unquoted strings)
    // Example: DATA 10, &H0A, GOOD, "Hello, World"
    this.dataConstant = this.RULE('dataConstant', () => {
      this.OR([
        { ALT: () => this.CONSUME(NumberLiteral) },
        { ALT: () => this.CONSUME(HexLiteral) },
        {
          GATE: () => this.LA(1).tokenType === StringLiteral,
          ALT: () => this.CONSUME(StringLiteral),
        },
        { ALT: () => this.CONSUME(Identifier) }, // Unquoted string constant
      ])
    })

    // DataConstantList = DataConstant (Comma DataConstant)*
    // List of constants for DATA statement (optional - empty DATA is allowed)
    this.dataConstantList = this.RULE('dataConstantList', () => {
      this.OPTION(() => {
        this.SUBRULE(this.dataConstant)
        this.MANY(() => {
          this.CONSUME(Comma)
          this.SUBRULE2(this.dataConstant)
        })
      })
    })

    // DATA DataConstantList
    // Stores data values that can be read by READ
    // Only accepts constants: NumberLiteral, StringLiteral (quoted), Identifier (unquoted string)
    // Example: DATA 10, 20, GOOD, MORNING, "Hello, World"
    // Empty DATA statement is allowed: DATA
    this.dataStatement = this.RULE('dataStatement', () => {
      this.CONSUME(Data)
      this.SUBRULE(this.dataConstantList)
    })

    // READ (Identifier | ArrayAccess) (Comma (Identifier | ArrayAccess))*
    // Reads data values from DATA statements into variables or array elements
    // Example: READ A, B, C$, D$, A(I), B$(I, J)
    this.readStatement = this.RULE('readStatement', () => {
      this.CONSUME(Read)
      // First variable: Identifier or ArrayAccess
      this.OR([
        {
          // Array access: Identifier LParen ExpressionList RParen
          GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LParen,
          ALT: () => this.SUBRULE(this.arrayAccess),
        },
        { ALT: () => this.CONSUME(Identifier) },
      ])
      // Additional variables
      this.MANY(() => {
        this.CONSUME(Comma)
        this.OR2([
          {
            // Array access: Identifier LParen ExpressionList RParen
            GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LParen,
            ALT: () => this.SUBRULE2(this.arrayAccess),
          },
          { ALT: () => this.CONSUME2(Identifier) },
        ])
      })
    })

    // RESTORE (NumberLiteral)?
    // Restores data pointer to beginning or specific line
    // Example: RESTORE or RESTORE 100
    this.restoreStatement = this.RULE('restoreStatement', () => {
      this.CONSUME(Restore)
      this.OPTION(() => {
        this.CONSUME(NumberLiteral) // Optional line number
      })
    })

    // INPUT ["prompt"] {; variable(, variable, ...)}
    // Inputs numerical or character data from keyboard into variables
    this.inputStatement = this.RULE('inputStatement', () => {
      this.CONSUME(Input)
      this.OPTION(() => {
        this.CONSUME(StringLiteral)
      })
      this.OPTION2(() => {
        this.OR([{ ALT: () => this.CONSUME(Semicolon) }, { ALT: () => this.CONSUME(Comma) }])
      })
      this.CONSUME(Identifier)
      this.MANY(() => {
        this.CONSUME2(Comma)
        this.CONSUME2(Identifier)
      })
    })

    // LINPUT ["prompt"] {; character variable}
    // Inputs a single line (allows commas in input); one string variable only
    this.linputStatement = this.RULE('linputStatement', () => {
      this.CONSUME(Linput)
      this.OPTION(() => {
        this.CONSUME(StringLiteral)
      })
      this.OPTION2(() => {
        this.OR([{ ALT: () => this.CONSUME(Semicolon) }, { ALT: () => this.CONSUME(Comma) }])
      })
      this.CONSUME(Identifier)
    })

    // CLS - Clears the background screen
    this.clsStatement = this.RULE('clsStatement', () => {
      this.CONSUME(Cls)
    })

    // SWAP variable1, variable2
    // Swaps the contents of two variables (same type: both numeric or both string)
    // Example: SWAP A, B or SWAP A(I), A(J)
    this.swapTarget = this.RULE('swapTarget', () => {
      this.OR([
        {
          GATE: () => this.LA(1).tokenType === Identifier && this.LA(2).tokenType === LParen,
          ALT: () => this.SUBRULE(this.arrayAccess),
        },
        { ALT: () => this.CONSUME(Identifier) },
      ])
    })
    this.swapStatement = this.RULE('swapStatement', () => {
      this.CONSUME(Swap)
      this.SUBRULE(this.swapTarget)
      this.CONSUME(Comma)
      this.SUBRULE2(this.swapTarget)
    })

    // CLEAR (expression)?
    // Clears all variables and arrays; optional address is ignored in emulator (no memory map)
    // Example: CLEAR or CLEAR &H7600
    this.clearStatement = this.RULE('clearStatement', () => {
      this.CONSUME(Clear)
      this.OPTION(() => {
        this.SUBRULE(this.expression)
      })
    })

    // LOCATE
    // Moves cursor to specified position
    // Example: LOCATE X, Y
    // X: Horizontal column (0 to 27)
    // Y: Vertical line (0 to 23)
    this.locateStatement = this.RULE('locateStatement', () => {
      this.CONSUME(Locate)
      this.SUBRULE(this.expression) // X coordinate
      this.CONSUME(Comma)
      this.SUBRULE2(this.expression) // Y coordinate
    })

    // COLOR X, Y, n
    // Sets color pattern for a 2×2 character area containing position (X, Y)
    this.colorStatement = this.RULE('colorStatement', () => {
      this.CONSUME(Color)
      this.SUBRULE(this.expression) // X coordinate
      this.CONSUME(Comma)
      this.SUBRULE2(this.expression) // Y coordinate
      this.CONSUME2(Comma)
      this.SUBRULE3(this.expression) // Color pattern number (0-3)
    })

    // CGSET [m][,n]
    // Sets color palette for background (m: 0-1) and sprites (n: 0-2)
    // Both parameters are optional (default: m=1, n=1)
    this.cgsetStatement = this.RULE('cgsetStatement', () => {
      this.CONSUME(Cgset)
      // First parameter (m) is optional
      this.OPTION(() => {
        this.SUBRULE(this.expression) // Background palette code (0-1)
        // Second parameter (n) is optional if first is present
        this.OPTION2(() => {
          this.CONSUME(Comma)
          this.SUBRULE2(this.expression) // Sprite palette code (0-2)
        })
      })
    })

    // CGEN n
    // Sets character generator mode (n: 0-3)
    // 0: A on BG, A on sprite
    // 1: A on BG, B on sprite
    // 2: B on BG, A on sprite (default)
    // 3: B on BG, B on sprite
    this.cgenStatement = this.RULE('cgenStatement', () => {
      this.CONSUME(Cgen)
      this.SUBRULE(this.expression) // Character generator mode (0-3)
    })

    // PALET parameter list: n, C1, C2, C3, C4
    // Common parameter parsing for all PALET forms
    this.paletParameterList = this.RULE('paletParameterList', () => {
      this.SUBRULE(this.expression) // n (color combination number 0-3)
      this.CONSUME(Comma)
      this.SUBRULE2(this.expression) // C1
      this.CONSUME2(Comma)
      this.SUBRULE3(this.expression) // C2
      this.CONSUME3(Comma)
      this.SUBRULE4(this.expression) // C3
      this.CONSUME4(Comma)
      this.SUBRULE5(this.expression) // C4
    })

    // PALET {B|S} n, C1, C2, C3, C4
    // or PALETB n, C1, C2, C3, C4 (for background, no space)
    // or PALETS n, C1, C2, C3, C4 (for sprites, no space)
    // Sets color codes for color combination n (0-3)
    // C1, C2, C3, C4 are color codes (0-60)
    // When n=0 and target is B, C1 is the backdrop color
    this.paletStatement = this.RULE('paletStatement', () => {
      // Handle both forms: PALETB/PALETS (no space) or PALET B/S (with space)
      this.OR([
        {
          // PALETB n, C1, C2, C3, C4 (background, no space)
          ALT: () => {
            this.CONSUME(Paletb)
            this.SUBRULE(this.paletParameterList)
          },
        },
        {
          // PALETS n, C1, C2, C3, C4 (sprites, no space)
          ALT: () => {
            this.CONSUME(Palets)
            this.SUBRULE2(this.paletParameterList)
          },
        },
        {
          // PALET B n, C1, C2, C3, C4 (background, with space)
          ALT: () => {
            this.CONSUME(Palet)
            // B or S identifier (must be uppercase B or S)
            this.CONSUME(Identifier, { LABEL: 'target' }) // B or S
            this.SUBRULE3(this.paletParameterList)
          },
        },
      ])
    })

    // VIEW - Copies BG GRAPHIC to Background Screen
    // Per F-BASIC Manual page 36: "Upon executing the VIEW command,
    // the BG GRAPHIC Screen will be copied to the Background Screen."
    this.viewStatement = this.RULE('viewStatement', () => {
      this.CONSUME(View)
    })

    // DEF SPRITE n, (A, B, C, D, E) = character set
    // n: sprite number (0-7)
    // A: color combination (0-3)
    // B: size (0=8×8, 1=16×16)
    // C: priority (0=front, 1=behind background)
    // D: horizontal inversion (0=normal, 1=inverted)
    // E: vertical inversion (0=normal, 1=inverted)
    // character set: CHR$(N) codes or string like "@ABC"
    this.defSpriteStatement = this.RULE('defSpriteStatement', () => {
      this.CONSUME(Def)
      this.CONSUME(Sprite)
      this.SUBRULE(this.expression, { LABEL: 'spriteNumber' }) // n
      this.CONSUME(Comma)
      this.CONSUME(LParen)
      this.SUBRULE2(this.expression, { LABEL: 'colorCombination' }) // A
      this.CONSUME2(Comma)
      this.SUBRULE3(this.expression, { LABEL: 'size' }) // B
      this.CONSUME3(Comma)
      this.SUBRULE4(this.expression, { LABEL: 'priority' }) // C
      this.CONSUME4(Comma)
      this.SUBRULE5(this.expression, { LABEL: 'invertX' }) // D
      this.CONSUME5(Comma)
      this.SUBRULE6(this.expression, { LABEL: 'invertY' }) // E
      this.CONSUME(RParen)
      this.CONSUME(Equal)
      // Character set can be a string literal or CHR$ expressions
      // For now, we'll accept a general expression
      this.SUBRULE7(this.expression, { LABEL: 'characterSet' })
    })

    // SPRITE n [, X, Y]
    // n: sprite number (0-7)
    // X, Y: position in pixels (X: 0-255, Y: 0-255, per F-BASIC manual)
    // If X, Y are omitted, sprite n is hidden (removed from display)
    this.spriteStatement = this.RULE('spriteStatement', () => {
      this.CONSUME(Sprite)
      this.SUBRULE(this.expression, { LABEL: 'spriteNumber' }) // n
      // X, Y coordinates are optional - if omitted, sprite is hidden
      this.OPTION(() => {
        this.CONSUME(Comma)
        this.SUBRULE2(this.expression, { LABEL: 'x' }) // X
        this.CONSUME2(Comma)
        this.SUBRULE3(this.expression, { LABEL: 'y' }) // Y
      })
    })

    // SPRITE ON | SPRITE OFF
    // Enable or disable sprite display
    this.spriteOnOffStatement = this.RULE('spriteOnOffStatement', () => {
      this.CONSUME(Sprite)
      this.OR([
        { ALT: () => this.CONSUME(On, { LABEL: 'onOff' }) },
        { ALT: () => this.CONSUME(Off, { LABEL: 'onOff' }) },
      ])
    })

    // DEF MOVE(n) = SPRITE(A, B, C, D, E, F)
    // n: action number (0-7)
    // A: character type (0-15)
    // B: direction (0-8)
    // C: speed (0-255, 0=every 256 frames, 60/C dots per second)
    // D: distance (1-255, total = 2×D dots)
    // E: priority (0=front, 1=behind background)
    // F: color combination (0-3)
    this.defMoveStatement = this.RULE('defMoveStatement', () => {
      this.CONSUME(Def)
      this.CONSUME(Move)
      this.CONSUME(LParen)
      this.SUBRULE(this.expression, { LABEL: 'actionNumber' }) // n
      this.CONSUME(RParen)
      this.CONSUME(Equal)
      this.CONSUME(Sprite)
      this.CONSUME2(LParen)
      this.SUBRULE2(this.expression, { LABEL: 'characterType' }) // A
      this.CONSUME(Comma)
      this.SUBRULE3(this.expression, { LABEL: 'direction' }) // B
      this.CONSUME2(Comma)
      this.SUBRULE4(this.expression, { LABEL: 'speed' }) // C
      this.CONSUME3(Comma)
      this.SUBRULE5(this.expression, { LABEL: 'distance' }) // D
      this.CONSUME4(Comma)
      this.SUBRULE6(this.expression, { LABEL: 'priority' }) // E
      this.CONSUME5(Comma)
      this.SUBRULE7(this.expression, { LABEL: 'colorCombination' }) // F
      this.CONSUME2(RParen)
    })

    // MOVE n
    // n: action number (0-7)
    this.moveStatement = this.RULE('moveStatement', () => {
      this.CONSUME(Move)
      this.SUBRULE(this.expression, { LABEL: 'actionNumber' }) // n
    })

    // CUT n1[, n2, ...]
    // Stop movement, keep sprite visible at current position
    this.cutStatement = this.RULE('cutStatement', () => {
      this.CONSUME(Cut)
      this.SUBRULE(this.expressionList, { LABEL: 'actionNumbers' }) // n1, n2, ...
    })

    // ERA n1[, n2, ...]
    // Erase sprite (stop movement and hide)
    this.eraStatement = this.RULE('eraStatement', () => {
      this.CONSUME(Era)
      this.SUBRULE(this.expressionList, { LABEL: 'actionNumbers' }) // n1, n2, ...
    })

    // POSITION n, X, Y
    // Set initial position for next MOVE command
    this.positionStatement = this.RULE('positionStatement', () => {
      this.CONSUME(Position)
      this.SUBRULE(this.expression, { LABEL: 'actionNumber' }) // n
      this.CONSUME(Comma)
      this.SUBRULE2(this.expression, { LABEL: 'x' }) // X
      this.CONSUME2(Comma)
      this.SUBRULE3(this.expression, { LABEL: 'y' }) // Y
    })

    // ============================================================================
    // REPL-ONLY COMMANDS - Parse but report error
    // These commands are recognized but not applicable for IDE version
    // ============================================================================

    // LIST - Lists program (REPL-only)
    this.listStatement = this.RULE('listStatement', () => {
      this.CONSUME(List)
      // Optional line range: LIST or LIST 10-100
      this.OPTION(() => {
        this.CONSUME(NumberLiteral)
        this.OPTION2(() => {
          this.CONSUME(Minus)
          this.CONSUME2(NumberLiteral)
        })
      })
    })

    // NEW - Erase program (REPL-only)
    this.newStatement = this.RULE('newStatement', () => {
      this.CONSUME(New)
    })

    // RUN - Execute program (REPL-only)
    this.runStatement = this.RULE('runStatement', () => {
      this.CONSUME(Run)
    })

    // SAVE - Save to tape (REPL-only)
    this.saveStatement = this.RULE('saveStatement', () => {
      this.CONSUME(Save)
    })

    // LOAD [?] - Load from tape or verify (REPL-only)
    this.loadStatement = this.RULE('loadStatement', () => {
      this.CONSUME(Load)
      // Optional ? for verify mode
      this.OPTION(() => {
        this.CONSUME(Question)
      })
    })

    // KEY - Define function keys (REPL-only)
    this.keyStatement = this.RULE('keyStatement', () => {
      this.CONSUME(Key)
      // Optional parameters
      this.OPTION(() => {
        this.SUBRULE(this.expression)
        this.OPTION2(() => {
          this.CONSUME(Comma)
          this.CONSUME(StringLiteral)
        })
      })
    })

    // KEYLIST - List function keys (REPL-only)
    this.keylistStatement = this.RULE('keylistStatement', () => {
      this.CONSUME(Keylist)
    })

    // CONT - Continue after STOP (REPL-only)
    this.contStatement = this.RULE('contStatement', () => {
      this.CONSUME(Cont)
    })

    // SYSTEM - Exit to system (REPL-only)
    this.systemStatement = this.RULE('systemStatement', () => {
      this.CONSUME(System)
    })

    // ============================================================================
    // LIMITED UTILITY COMMANDS - Parse but report error
    // These commands have limited applicability in IDE version
    // ============================================================================

    // POKE address, value - Write to memory (not applicable in emulator)
    this.pokeStatement = this.RULE('pokeStatement', () => {
      this.CONSUME(Poke)
      this.SUBRULE(this.expression) // address
      this.CONSUME(Comma)
      this.SUBRULE2(this.expression) // value
    })

    // PEEK(address) - Read from memory (returns as function in primary)
    this.peekStatement = this.RULE('peekStatement', () => {
      this.CONSUME(Peek)
      this.CONSUME(LParen)
      this.SUBRULE(this.expression)
      this.CONSUME(RParen)
    })

    // FRE(n) - Free memory (not meaningful in emulator)
    this.freStatement = this.RULE('freStatement', () => {
      this.CONSUME(Fre)
      this.CONSUME(LParen)
      this.SUBRULE(this.expression)
      this.CONSUME(RParen)
    })

    // INKEY$ - Immediate keypress (not applicable for IDE)
    this.inkeyStatement = this.RULE('inkeyStatement', () => {
      this.CONSUME(Inkey)
    })

    // STOP - Pause execution (limited utility)
    this.stopStatement = this.RULE('stopStatement', () => {
      this.CONSUME(Stop)
    })

    // IF LogicalExpression THEN (CommandList | NumberLiteral)
    // IF LogicalExpression GOTO NumberLiteral
    // Executes the commands after THEN or jumps to line number if condition is true
    // Supports colon-separated statements: IF X THEN PRINT A: PRINT B
    // Supports line number jumps: IF X=10 THEN 500 or IF X=10 GOTO 500
    // Supports logical operators: IF X>0 AND Y<10 THEN 100, IF NOT X=0 THEN PRINT X
    this.ifThenStatement = this.RULE('ifThenStatement', () => {
      this.CONSUME(If)
      this.SUBRULE(this.logicalExpression)
      // THEN or GOTO (GOTO can be used without THEN)
      this.OR([
        {
          // IF ... THEN NumberLiteral (line number jump)
          GATE: () => this.LA(1).tokenType === Then && this.LA(2).tokenType === NumberLiteral,
          ALT: () => {
            this.CONSUME(Then)
            this.CONSUME(NumberLiteral)
          },
        },
        {
          // IF ... THEN CommandList (statements)
          GATE: () => this.LA(1).tokenType === Then,
          ALT: () => {
            this.CONSUME2(Then) // Use CONSUME2 for second occurrence
            this.SUBRULE(this.commandList)
          },
        },
        {
          // IF ... GOTO NumberLiteral (GOTO without THEN)
          ALT: () => {
            this.CONSUME(Goto)
            this.CONSUME2(NumberLiteral) // Use CONSUME2 for second occurrence
          },
        },
      ])
    })

    // SingleCommand = IfThenStatement | GotoStatement | LetStatement | PrintStatement | ForStatement | NextStatement | EndStatement | PauseStatement
    // Order matters: keyword-based statements (that start with a keyword) should come before letStatement
    // because letStatement can start with just an Identifier (LET is optional)
    // Use GATE conditions to ensure keywords are matched correctly before trying letStatement
    this.singleCommand = this.RULE('singleCommand', () => {
      this.OR([
        {
          GATE: () => this.LA(1).tokenType === If,
          ALT: () => this.SUBRULE(this.ifThenStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === On,
          ALT: () => this.SUBRULE(this.onStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Goto,
          ALT: () => this.SUBRULE(this.gotoStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Gosub,
          ALT: () => this.SUBRULE(this.gosubStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Return,
          ALT: () => this.SUBRULE(this.returnStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Print,
          ALT: () => this.SUBRULE(this.printStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === For,
          ALT: () => this.SUBRULE(this.forStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Next,
          ALT: () => this.SUBRULE(this.nextStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === End,
          ALT: () => this.SUBRULE(this.endStatement),
        },
        // REM statement removed - REM lines are handled at line level before parsing
        // In Family BASIC, REM cannot appear after colons
        {
          GATE: () => this.LA(1).tokenType === Pause,
          ALT: () => this.SUBRULE(this.pauseStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Play,
          ALT: () => this.SUBRULE(this.playStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Beep,
          ALT: () => this.SUBRULE(this.beepStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Dim,
          ALT: () => this.SUBRULE(this.dimStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Data,
          ALT: () => this.SUBRULE(this.dataStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Read,
          ALT: () => this.SUBRULE(this.readStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Restore,
          ALT: () => this.SUBRULE(this.restoreStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Linput,
          ALT: () => this.SUBRULE(this.linputStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Input,
          ALT: () => this.SUBRULE(this.inputStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Cls,
          ALT: () => this.SUBRULE(this.clsStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Swap,
          ALT: () => this.SUBRULE(this.swapStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Clear,
          ALT: () => this.SUBRULE(this.clearStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Locate,
          ALT: () => this.SUBRULE(this.locateStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Color,
          ALT: () => this.SUBRULE(this.colorStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Cgset,
          ALT: () => this.SUBRULE(this.cgsetStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Cgen,
          ALT: () => this.SUBRULE(this.cgenStatement),
        },
        {
          GATE: () =>
            this.LA(1).tokenType === Paletb || this.LA(1).tokenType === Palets || this.LA(1).tokenType === Palet,
          ALT: () => this.SUBRULE(this.paletStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === View,
          ALT: () => this.SUBRULE(this.viewStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Def && this.LA(2).tokenType === Move,
          ALT: () => this.SUBRULE(this.defMoveStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Def,
          ALT: () => this.SUBRULE(this.defSpriteStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Position,
          ALT: () => this.SUBRULE(this.positionStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Cut,
          ALT: () => this.SUBRULE(this.cutStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Era,
          ALT: () => this.SUBRULE(this.eraStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Move && this.LA(2).tokenType !== LParen,
          ALT: () => this.SUBRULE(this.moveStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Sprite && (this.LA(2).tokenType === On || this.LA(2).tokenType === Off),
          ALT: () => this.SUBRULE(this.spriteOnOffStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Sprite,
          ALT: () => this.SUBRULE(this.spriteStatement),
        },
        // REPL-only commands (parsed but produce error)
        {
          GATE: () => this.LA(1).tokenType === List,
          ALT: () => this.SUBRULE(this.listStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === New,
          ALT: () => this.SUBRULE(this.newStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Run,
          ALT: () => this.SUBRULE(this.runStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Save,
          ALT: () => this.SUBRULE(this.saveStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Load,
          ALT: () => this.SUBRULE(this.loadStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Key,
          ALT: () => this.SUBRULE(this.keyStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Keylist,
          ALT: () => this.SUBRULE(this.keylistStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Cont,
          ALT: () => this.SUBRULE(this.contStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === System,
          ALT: () => this.SUBRULE(this.systemStatement),
        },
        // Limited utility commands (parsed but produce error)
        {
          GATE: () => this.LA(1).tokenType === Poke,
          ALT: () => this.SUBRULE(this.pokeStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Peek,
          ALT: () => this.SUBRULE(this.peekStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Fre,
          ALT: () => this.SUBRULE(this.freStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Inkey,
          ALT: () => this.SUBRULE(this.inkeyStatement),
        },
        {
          GATE: () => this.LA(1).tokenType === Stop,
          ALT: () => this.SUBRULE(this.stopStatement),
        },
        { ALT: () => this.SUBRULE(this.letStatement) }, // Must be last since it can start with Identifier
      ])
    })

    // Command = SingleCommand
    this.command = this.RULE('command', () => {
      this.SUBRULE(this.singleCommand)
    })

    // CommandList = Command (Colon Command)*
    // Allows multiple commands per line separated by colons
    this.commandList = this.RULE('commandList', () => {
      this.SUBRULE(this.command)
      this.MANY(() => {
        this.CONSUME(Colon)
        this.SUBRULE2(this.command)
      })
    })

    // Statement = LineNumber CommandList
    // LineNumber is a NumberLiteral at the start (acts as a label for GOTO/GOSUB)
    // CommandList may contain multiple commands separated by colons
    this.statement = this.RULE('statement', () => {
      this.CONSUME(NumberLiteral) // Line number (label)
      this.SUBRULE(this.commandList)
    })

    this.performSelfAnalysis()
  }
}

// ============================================================================
// PARSER INSTANCE AND EXPORT
// ============================================================================

// Create parser instance
const parserInstance = new FBasicChevrotainParser()

// ============================================================================
// REPL-ONLY COMMAND VALIDATION
// ============================================================================

/**
 * Map of REPL-only command names to their error messages
 */
const REPL_ONLY_COMMANDS: Record<string, string> = {
  listStatement: 'LIST: Not applicable for IDE version',
  newStatement: 'NEW: Not applicable for IDE version',
  runStatement: 'RUN: Not applicable for IDE version - use the Run button instead',
  saveStatement: 'SAVE: Not applicable for IDE version - use Export instead',
  loadStatement: 'LOAD: Not applicable for IDE version - use Import instead',
  keyStatement: 'KEY: Not applicable for IDE version',
  keylistStatement: 'KEYLIST: Not applicable for IDE version',
  contStatement: 'CONT: Not applicable for IDE version',
  systemStatement: 'SYSTEM: Not applicable for IDE version',
  pokeStatement: 'POKE: Not applicable for IDE version',
  stopStatement: 'STOP: Not applicable for IDE version',
}

/**
 * Map of REPL-only function token types to their error messages
 * These are functions used in expressions (not statements)
 */
const REPL_ONLY_FUNCTIONS: Record<string, string> = {
  Peek: 'PEEK: Not applicable for IDE version',
  Fre: 'FRE: Not applicable for IDE version',
  // INKEY$ is now fully implemented - removed from REPL-only list
}

/**
 * Check CST for REPL-only commands and functions, return error messages
 */
function checkReplOnlyCommands(cst: CstNode): Array<{ message: string; line?: number; column?: number }> {
  const errors: Array<{ message: string; line?: number; column?: number }> = []
  const seenErrors = new Set<string>() // Avoid duplicate errors

  function traverse(node: CstNode | unknown, lineNumber?: number) {
    if (!node || typeof node !== 'object') return

    // Check if this is a CST node
    const cstNode = node as CstNode
    if (!('name' in cstNode) || !cstNode.children) {
      return
    }

    let currentLineNumber = lineNumber
    if (cstNode.name === 'statement') {
      const lineToken = cstNode.children.NumberLiteral?.[0]
      if (lineToken && typeof lineToken === 'object' && 'image' in lineToken) {
        const parsedLine = Number.parseInt(String(lineToken.image), 10)
        if (Number.isFinite(parsedLine)) {
          currentLineNumber = parsedLine
        }
      }
    }

    // Check if this node is a REPL-only statement
    const errorMsg = REPL_ONLY_COMMANDS[cstNode.name]
    if (errorMsg && !seenErrors.has(errorMsg)) {
      seenErrors.add(errorMsg)
      errors.push({
        message: errorMsg,
        line: currentLineNumber,
        column: 1,
      })
    }

    // Check for REPL-only functions in functionCall nodes
    if (cstNode.name === 'functionCall' && cstNode.children) {
      for (const key of Object.keys(cstNode.children)) {
        const childArray = cstNode.children[key]
        if (Array.isArray(childArray)) {
          for (const child of childArray) {
            if (child && typeof child === 'object' && 'tokenType' in child) {
              const token = child as { tokenType: { name: string } }
              const funcError = REPL_ONLY_FUNCTIONS[token.tokenType?.name]
              if (funcError && !seenErrors.has(funcError)) {
                seenErrors.add(funcError)
                errors.push({
                  message: funcError,
                  line: currentLineNumber,
                  column: 1,
                })
              }
            }
          }
        }
      }
    }

    // Traverse children recursively
    for (const key of Object.keys(cstNode.children)) {
      const childArray = cstNode.children[key]
      if (Array.isArray(childArray)) {
        for (const child of childArray) {
          if (child && typeof child === 'object') {
            if ('name' in child) {
              // It's a CST node - recurse
              traverse(child as CstNode, currentLineNumber)
            }
            // Token objects don't need recursion
          }
        }
      }
    }
  }

  traverse(cst)
  return errors
}

// Export parse function
export function parseWithChevrotain(source: string): {
  success: boolean
  cst?: CstNode
  errors?: Array<{
    message: string
    line?: number
    column?: number
    length?: number
    location?: { start: { line?: number; column?: number } }
  }>
} {
  // Split source code by line breaks
  const lines = source.split(/\r?\n/)
  const allErrors: Array<{
    message: string
    line?: number
    column?: number
    length?: number
    location?: { start: { line?: number; column?: number } }
  }> = []
  const statements: CstNode[] = []

  // Parse each line independently
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]?.trim()
    if (!line) {
      continue
    }

    // Check if line is a comment line: REM or apostrophe (') per F-BASIC manual p.67
    // Format: <lineNumber> REM <comment text>  OR  <lineNumber> ' <comment text>
    // Abbreviation for REM is ' (apostrophe); "You can use (apostrophe) instead of REM."
    // IMPORTANT: REM lines must still register their line numbers for GOTO/GOSUB targets
    const remMatch = line.match(/^\s*(\d+)\s+REM\b/i)
    const apostropheCommentMatch = line.match(/^\s*(\d+)\s+'/)
    if (remMatch || apostropheCommentMatch) {
      // Comment line - create a placeholder CST node to register the line number
      const lineNumber = remMatch?.[1] ?? apostropheCommentMatch?.[1]
      if (!lineNumber) continue // Should never happen, but satisfies TypeScript

      const placeholderCst: CstNode = {
        name: 'statement',
        children: {
          NumberLiteral: [
            {
              image: lineNumber,
              startOffset: 0,
              startLine: lineIndex + 1,
              startColumn: 1,
              endOffset: lineNumber.length - 1,
              endLine: lineIndex + 1,
              endColumn: lineNumber.length,
              tokenTypeIdx: 0,
            } as IToken,
          ],
          commandList: [
            {
              name: 'commandList',
              children: {
                command: [], // Empty command list - REM is a no-op
              },
            } as CstNode,
          ],
        },
      }
      statements.push(placeholderCst)
      continue
    }

    // Tokenize the line
    const lexResult = lexer.tokenize(line)

    // Check for lexing errors
    if (lexResult.errors.length > 0) {
      allErrors.push(
        ...lexResult.errors.map((err: ILexingError) => ({
          message: err.message || 'Lexical error',
          line: lineIndex + 1,
          column: err.column,
          length: err.length,
          location: {
            start: {
              line: lineIndex + 1,
              column: err.column || 1,
            },
          },
        }))
      )
      continue
    }

    // Parse the line
    parserInstance.input = lexResult.tokens
    const cst = parserInstance.statement()

    // Clear errors before checking (they accumulate)
    const parseErrors = [...parserInstance.errors]
    parserInstance.errors = []

    // Check for parsing errors
    if (parseErrors.length > 0) {
      allErrors.push(
        ...parseErrors.map((err: IRecognitionException) => {
          const token = err.token
          return {
            message: err.message || 'Syntax error',
            line: lineIndex + 1,
            column: token?.startColumn,
            length: token?.endOffset ? token.endOffset - token.startOffset : 1,
            location: {
              start: {
                line: lineIndex + 1,
                column: token?.startColumn || 1,
              },
            },
          }
        })
      )
      continue
    }

    // Successfully parsed - add to statements
    if (cst) {
      statements.push(cst)
    }
  }

  // If there were any errors, return failure
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors,
    }
  }

  // Combine all statements into a program CST
  const programCst: CstNode = {
    name: 'program',
    children: {
      statement: statements,
    },
  }

  // Check for REPL-only commands and add errors if found
  const replErrors = checkReplOnlyCommands(programCst)
  if (replErrors.length > 0) {
    return {
      success: false,
      cst: programCst,
      errors: replErrors.map(err => ({
        message: err.message,
        line: err.line,
        column: err.column,
        location: {
          start: {
            line: err.line,
            column: err.column || 1,
          },
        },
      })),
    }
  }

  return {
    success: true,
    cst: programCst,
  }
}

// Export for use in CST to AST converter
export { parserInstance }
