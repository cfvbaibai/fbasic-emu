/**
 * Core Statement Parsing Rules
 *
 * Registers core F-BASIC statement grammar rules on the parser instance.
 * Includes: print, let, for/next, end, pause, play, beep, goto, gosub, return,
 * on, input, linput, swap, clear, and if/then.
 */

import type { CstNode } from 'chevrotain'

import {
  Beep,
  Clear,
  Comma,
  End,
  Equal,
  For,
  Gosub,
  Goto,
  Identifier,
  If,
  Input,
  Let,
  Linput,
  LParen,
  Next,
  NumberLiteral,
  On,
  Pause,
  Play,
  Print,
  Restore,
  Return,
  Semicolon,
  Step,
  StringLiteral,
  Swap,
  Then,
  To,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by core statement rules.
 */
export interface CoreStatementParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE3(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE4(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME2(tokenType: unknown, options?: Record<string, unknown>): unknown
  OPTION(impl: () => void): void
  OPTION2(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
  MANY(impl: () => void): void
  LA(offset: number): { tokenType: unknown }
}

/**
 * Core statement rule declarations needed on the parser class.
 */
export interface CoreStatementRuleDeclarations {
  // Shared sub-rules
  printItem: () => CstNode
  printList: () => CstNode
  lineNumberList: () => CstNode
  swapTarget: () => CstNode
  // Statement rules
  printStatement: () => CstNode
  letStatement: () => CstNode
  forStatement: () => CstNode
  nextStatement: () => CstNode
  endStatement: () => CstNode
  pauseStatement: () => CstNode
  playStatement: () => CstNode
  beepStatement: () => CstNode
  gotoStatement: () => CstNode
  gosubStatement: () => CstNode
  returnStatement: () => CstNode
  onStatement: () => CstNode
  inputStatement: () => CstNode
  linputStatement: () => CstNode
  swapStatement: () => CstNode
  clearStatement: () => CstNode
  ifThenStatement: () => CstNode
  // Expression rules (needed by core statements)
  expression: () => CstNode
  logicalExpression: () => CstNode
  arrayAccess: () => CstNode
  commandList: () => CstNode
}

/**
 * Register all core statement parsing rules on the parser instance.
 * Must be called from the parser constructor after expression rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerCoreStatementRules(
  p: CoreStatementParserInstance & CoreStatementRuleDeclarations
): void {
  // PrintItem = Expression | StringLiteral
  p.printItem = p.RULE('printItem', () => {
    p.OR([
      { ALT: () => p.SUBRULE(p.expression) },
    ])
  })

  // PrintList = PrintItem (Comma|Semicolon PrintItem?)*
  // Allows trailing comma or semicolon (e.g., PRINT X; or PRINT A, B,)
  // Trailing separator is consumed but PrintItem is optional
  p.printList = p.RULE('printList', () => {
    p.SUBRULE(p.printItem)
    p.MANY(() => {
      p.OR([{ ALT: () => p.CONSUME(Comma) }, { ALT: () => p.CONSUME(Semicolon) }])
      // PrintItem is optional - allows trailing separator
      p.OPTION(() => {
        p.SUBRULE2(p.printItem)
      })
    })
  })

  // PRINT PrintList?
  p.printStatement = p.RULE('printStatement', () => {
    p.CONSUME(Print)
    p.OPTION(() => {
      p.SUBRULE(p.printList)
    })
  })

  // LET? Identifier = Expression
  // LET (Identifier | ArrayAccess) = Expression
  // Supports both simple variable assignment and array element assignment
  // Examples: LET X = 5, LET A(0) = 10, LET A$(I, J) = "Hello"
  p.letStatement = p.RULE('letStatement', () => {
    p.OPTION(() => {
      p.CONSUME(Let)
    })
    // Variable or array element (must check ArrayAccess before Identifier)
    p.OR([
      {
        // Array access: Identifier LParen ExpressionList RParen
        GATE: () => p.LA(1).tokenType === Identifier && p.LA(2).tokenType === LParen,
        ALT: () => p.SUBRULE(p.arrayAccess),
      },
      { ALT: () => p.CONSUME(Identifier) },
    ])
    p.CONSUME(Equal)
    p.SUBRULE(p.expression)
  })

  // FOR Identifier = Expression TO Expression (STEP Expression)?
  p.forStatement = p.RULE('forStatement', () => {
    p.CONSUME(For)
    p.CONSUME(Identifier) // Loop variable
    p.CONSUME(Equal)
    p.SUBRULE(p.expression) // Start value
    p.CONSUME(To)
    p.SUBRULE2(p.expression) // End value
    p.OPTION(() => {
      p.CONSUME(Step)
      p.SUBRULE3(p.expression) // Step value (defaults to 1)
    })
  })

  // NEXT (no variable name allowed - Family BASIC spec)
  // According to spec: "You can not add a loop variable name after NEXT. (An error will occur)"
  p.nextStatement = p.RULE('nextStatement', () => {
    p.CONSUME(Next)
    // No identifier allowed - NEXT must be standalone
  })

  // END
  p.endStatement = p.RULE('endStatement', () => {
    p.CONSUME(End)
  })

  // PAUSE Expression
  // Pauses program execution for the specified number of frames (1 frame = ~1/30 second)
  p.pauseStatement = p.RULE('pauseStatement', () => {
    p.CONSUME(Pause)
    p.SUBRULE(p.expression)
  })

  // PLAY StringExpression
  // Plays back music according to the sound specified by the string data
  p.playStatement = p.RULE('playStatement', () => {
    p.CONSUME(Play)
    p.SUBRULE(p.expression) // String expression with music data
  })

  // BEEP
  // Outputs a 'beep' type of sound
  p.beepStatement = p.RULE('beepStatement', () => {
    p.CONSUME(Beep)
  })

  // GOTO NumberLiteral
  // Jumps unconditionally to the specified line number
  p.gotoStatement = p.RULE('gotoStatement', () => {
    p.CONSUME(Goto)
    p.CONSUME(NumberLiteral) // Line number to jump to
  })

  // GOSUB NumberLiteral
  // Calls a subroutine at the specified line number
  // Example: GOSUB 1000
  p.gosubStatement = p.RULE('gosubStatement', () => {
    p.CONSUME(Gosub)
    p.CONSUME(NumberLiteral)
  })

  // RETURN (NumberLiteral)?
  // Returns from a subroutine
  // Example: RETURN or RETURN 100
  p.returnStatement = p.RULE('returnStatement', () => {
    p.CONSUME(Return)
    p.OPTION(() => {
      p.CONSUME(NumberLiteral) // Optional line number
    })
  })

  // LineNumberList = NumberLiteral (Comma NumberLiteral)*
  // List of line numbers for ON statement
  // Example: 100, 200, 300
  p.lineNumberList = p.RULE('lineNumberList', () => {
    p.CONSUME(NumberLiteral)
    p.MANY(() => {
      p.CONSUME(Comma)
      p.CONSUME2(NumberLiteral)
    })
  })

  // ON Expression {GOTO | GOSUB | RETURN | RESTORE} LineNumberList
  // Jumps to line number based on expression value (1 = first, 2 = second, etc.)
  // If value is 0 or exceeds list length, proceeds to next line
  // Example: ON X GOTO 100, 200, 300
  // Example: ON N GOSUB 100, 200, 300, 400, 500, 600
  // Example: ON X RETURN 100, 200, 300
  // Example: ON X RESTORE 100, 200, 300
  p.onStatement = p.RULE('onStatement', () => {
    p.CONSUME(On)
    p.SUBRULE(p.expression)
    // GOTO, GOSUB, RETURN, or RESTORE
    p.OR([
      {
        ALT: () => {
          p.CONSUME(Goto)
          p.SUBRULE(p.lineNumberList)
        },
      },
      {
        ALT: () => {
          p.CONSUME(Gosub)
          p.SUBRULE2(p.lineNumberList)
        },
      },
      {
        ALT: () => {
          p.CONSUME(Return)
          p.SUBRULE3(p.lineNumberList)
        },
      },
      {
        ALT: () => {
          p.CONSUME(Restore)
          p.SUBRULE4(p.lineNumberList)
        },
      },
    ])
  })

  // INPUT ["prompt"] {; variable(, variable, ...)}
  // Inputs numerical or character data from keyboard into variables
  p.inputStatement = p.RULE('inputStatement', () => {
    p.CONSUME(Input)
    p.OPTION(() => {
      p.CONSUME(StringLiteral)
    })
    p.OPTION2(() => {
      p.OR([{ ALT: () => p.CONSUME(Semicolon) }, { ALT: () => p.CONSUME(Comma) }])
    })
    p.CONSUME(Identifier)
    p.MANY(() => {
      p.CONSUME2(Comma)
      p.CONSUME2(Identifier)
    })
  })

  // LINPUT ["prompt"] {; character variable}
  // Inputs a single line (allows commas in input); one string variable only
  p.linputStatement = p.RULE('linputStatement', () => {
    p.CONSUME(Linput)
    p.OPTION(() => {
      p.CONSUME(StringLiteral)
    })
    p.OPTION2(() => {
      p.OR([{ ALT: () => p.CONSUME(Semicolon) }, { ALT: () => p.CONSUME(Comma) }])
    })
    p.CONSUME(Identifier)
  })

  // SWAP variable1, variable2
  // Swaps the contents of two variables (same type: both numeric or both string)
  // Example: SWAP A, B or SWAP A(I), A(J)
  p.swapTarget = p.RULE('swapTarget', () => {
    p.OR([
      {
        GATE: () => p.LA(1).tokenType === Identifier && p.LA(2).tokenType === LParen,
        ALT: () => p.SUBRULE(p.arrayAccess),
      },
      { ALT: () => p.CONSUME(Identifier) },
    ])
  })
  p.swapStatement = p.RULE('swapStatement', () => {
    p.CONSUME(Swap)
    p.SUBRULE(p.swapTarget)
    p.CONSUME(Comma)
    p.SUBRULE2(p.swapTarget)
  })

  // CLEAR (expression)?
  // Clears all variables and arrays; optional address is ignored in emulator (no memory map)
  // Example: CLEAR or CLEAR &H7600
  p.clearStatement = p.RULE('clearStatement', () => {
    p.CONSUME(Clear)
    p.OPTION(() => {
      p.SUBRULE(p.expression)
    })
  })

  // IF LogicalExpression THEN (CommandList | NumberLiteral)
  // IF LogicalExpression GOTO NumberLiteral
  // Executes the commands after THEN or jumps to line number if condition is true
  // Supports colon-separated statements: IF X THEN PRINT A: PRINT B
  // Supports line number jumps: IF X=10 THEN 500 or IF X=10 GOTO 500
  // Supports logical operators: IF X>0 AND Y<10 THEN 100, IF NOT X=0 THEN PRINT X
  p.ifThenStatement = p.RULE('ifThenStatement', () => {
    p.CONSUME(If)
    p.SUBRULE(p.logicalExpression)
    // THEN or GOTO (GOTO can be used without THEN)
    p.OR([
      {
        // IF ... THEN NumberLiteral (line number jump)
        GATE: () => p.LA(1).tokenType === Then && p.LA(2).tokenType === NumberLiteral,
        ALT: () => {
          p.CONSUME(Then)
          p.CONSUME(NumberLiteral)
        },
      },
      {
        // IF ... THEN CommandList (statements)
        GATE: () => p.LA(1).tokenType === Then,
        ALT: () => {
          p.CONSUME2(Then) // Use CONSUME2 for second occurrence
          p.SUBRULE(p.commandList)
        },
      },
      {
        // IF ... GOTO NumberLiteral (GOTO without THEN)
        ALT: () => {
          p.CONSUME(Goto)
          p.CONSUME2(NumberLiteral) // Use CONSUME2 for second occurrence
        },
      },
    ])
  })
}
