/**
 * Command Dispatcher Parsing Rules
 *
 * Registers the top-level command dispatch rules on the parser instance.
 * The singleCommand rule is the main dispatcher that routes to individual
 * statement parsers based on the first token.
 */

import type { CstNode } from 'chevrotain'

import {
  Beep,
  Bgplay,
  Cgen,
  Cgset,
  Clear,
  Cls,
  // Tokens needed by rule bodies
  Colon,
  Color,
  Cont,
  Cut,
  Data,
  Def,
  Dim,
  End,
  Era,
  For,
  Fre,
  Gosub,
  Goto,
  // Core statement keywords (for GATE conditions)
  If,
  Inkey,
  Input,
  Key,
  Keylist,
  Linput,
  // REPL-only keywords
  List,
  Load,
  Locate,
  LParen,
  Move,
  New,
  Next,
  NumberLiteral,
  Off,
  On,
  Palet,
  Paletb,
  Palets,
  Pause,
  Peek,
  Play,
  // Limited utility keywords
  Poke,
  Position,
  Print,
  Read,
  Restore,
  Return,
  Run,
  Save,
  Sprite,
  Stop,
  Swap,
  System,
  View,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by dispatcher rules.
 */
export interface DispatcherParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  MANY(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
  LA(offset: number): { tokenType: unknown }
}

/**
 * Dispatcher rule declarations needed on the parser class.
 */
export interface DispatcherRuleDeclarations {
  singleCommand: () => CstNode
  command: () => CstNode
  commandList: () => CstNode
  statement: () => CstNode
  // Statement rules dispatched to
  ifThenStatement: () => CstNode
  onStatement: () => CstNode
  gotoStatement: () => CstNode
  gosubStatement: () => CstNode
  returnStatement: () => CstNode
  printStatement: () => CstNode
  forStatement: () => CstNode
  nextStatement: () => CstNode
  endStatement: () => CstNode
  pauseStatement: () => CstNode
  bgplayStatement: () => CstNode
  playStatement: () => CstNode
  beepStatement: () => CstNode
  dimStatement: () => CstNode
  dataStatement: () => CstNode
  readStatement: () => CstNode
  restoreStatement: () => CstNode
  linputStatement: () => CstNode
  inputStatement: () => CstNode
  clsStatement: () => CstNode
  swapStatement: () => CstNode
  clearStatement: () => CstNode
  locateStatement: () => CstNode
  colorStatement: () => CstNode
  cgsetStatement: () => CstNode
  cgenStatement: () => CstNode
  paletStatement: () => CstNode
  viewStatement: () => CstNode
  defMoveStatement: () => CstNode
  defSpriteStatement: () => CstNode
  positionStatement: () => CstNode
  cutStatement: () => CstNode
  eraStatement: () => CstNode
  moveStatement: () => CstNode
  spriteOnOffStatement: () => CstNode
  spriteStatement: () => CstNode
  listStatement: () => CstNode
  newStatement: () => CstNode
  runStatement: () => CstNode
  saveStatement: () => CstNode
  loadStatement: () => CstNode
  keyStatement: () => CstNode
  keylistStatement: () => CstNode
  contStatement: () => CstNode
  systemStatement: () => CstNode
  pokeStatement: () => CstNode
  peekStatement: () => CstNode
  freStatement: () => CstNode
  inkeyStatement: () => CstNode
  stopStatement: () => CstNode
  letStatement: () => CstNode
}

/**
 * Register the command dispatcher rules on the parser instance.
 * Must be called LAST from the parser constructor, after all statement
 * rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerDispatcherRules(
  p: DispatcherParserInstance & DispatcherRuleDeclarations
): void {
  // SingleCommand = IfThenStatement | GotoStatement | LetStatement | PrintStatement | ...
  // Order matters: keyword-based statements (that start with a keyword) should come before letStatement
  // because letStatement can start with just an Identifier (LET is optional)
  // Use GATE conditions to ensure keywords are matched correctly before trying letStatement
  p.singleCommand = p.RULE('singleCommand', () => {
    p.OR([
      {
        GATE: () => p.LA(1).tokenType === If,
        ALT: () => p.SUBRULE(p.ifThenStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === On,
        ALT: () => p.SUBRULE(p.onStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Goto,
        ALT: () => p.SUBRULE(p.gotoStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Gosub,
        ALT: () => p.SUBRULE(p.gosubStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Return,
        ALT: () => p.SUBRULE(p.returnStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Print,
        ALT: () => p.SUBRULE(p.printStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === For,
        ALT: () => p.SUBRULE(p.forStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Next,
        ALT: () => p.SUBRULE(p.nextStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === End,
        ALT: () => p.SUBRULE(p.endStatement),
      },
      // REM statement removed - REM lines are handled at line level before parsing
      // In Family BASIC, REM cannot appear after colons
      {
        GATE: () => p.LA(1).tokenType === Pause,
        ALT: () => p.SUBRULE(p.pauseStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Play,
        ALT: () => p.SUBRULE(p.playStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Bgplay,
        ALT: () => p.SUBRULE(p.bgplayStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Beep,
        ALT: () => p.SUBRULE(p.beepStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Dim,
        ALT: () => p.SUBRULE(p.dimStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Data,
        ALT: () => p.SUBRULE(p.dataStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Read,
        ALT: () => p.SUBRULE(p.readStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Restore,
        ALT: () => p.SUBRULE(p.restoreStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Linput,
        ALT: () => p.SUBRULE(p.linputStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Input,
        ALT: () => p.SUBRULE(p.inputStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Cls,
        ALT: () => p.SUBRULE(p.clsStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Swap,
        ALT: () => p.SUBRULE(p.swapStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Clear,
        ALT: () => p.SUBRULE(p.clearStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Locate,
        ALT: () => p.SUBRULE(p.locateStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Color,
        ALT: () => p.SUBRULE(p.colorStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Cgset,
        ALT: () => p.SUBRULE(p.cgsetStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Cgen,
        ALT: () => p.SUBRULE(p.cgenStatement),
      },
      {
        GATE: () =>
          p.LA(1).tokenType === Paletb || p.LA(1).tokenType === Palets || p.LA(1).tokenType === Palet,
        ALT: () => p.SUBRULE(p.paletStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === View,
        ALT: () => p.SUBRULE(p.viewStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Def && p.LA(2).tokenType === Move,
        ALT: () => p.SUBRULE(p.defMoveStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Def,
        ALT: () => p.SUBRULE(p.defSpriteStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Position,
        ALT: () => p.SUBRULE(p.positionStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Cut,
        ALT: () => p.SUBRULE(p.cutStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Era,
        ALT: () => p.SUBRULE(p.eraStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Move && p.LA(2).tokenType !== LParen,
        ALT: () => p.SUBRULE(p.moveStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Sprite && (p.LA(2).tokenType === On || p.LA(2).tokenType === Off),
        ALT: () => p.SUBRULE(p.spriteOnOffStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Sprite,
        ALT: () => p.SUBRULE(p.spriteStatement),
      },
      // REPL-only commands (parsed but produce error)
      {
        GATE: () => p.LA(1).tokenType === List,
        ALT: () => p.SUBRULE(p.listStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === New,
        ALT: () => p.SUBRULE(p.newStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Run,
        ALT: () => p.SUBRULE(p.runStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Save,
        ALT: () => p.SUBRULE(p.saveStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Load,
        ALT: () => p.SUBRULE(p.loadStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Key,
        ALT: () => p.SUBRULE(p.keyStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Keylist,
        ALT: () => p.SUBRULE(p.keylistStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Cont,
        ALT: () => p.SUBRULE(p.contStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === System,
        ALT: () => p.SUBRULE(p.systemStatement),
      },
      // Limited utility commands (parsed but produce error)
      {
        GATE: () => p.LA(1).tokenType === Poke,
        ALT: () => p.SUBRULE(p.pokeStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Peek,
        ALT: () => p.SUBRULE(p.peekStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Fre,
        ALT: () => p.SUBRULE(p.freStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Inkey,
        ALT: () => p.SUBRULE(p.inkeyStatement),
      },
      {
        GATE: () => p.LA(1).tokenType === Stop,
        ALT: () => p.SUBRULE(p.stopStatement),
      },
      { ALT: () => p.SUBRULE(p.letStatement) }, // Must be last since it can start with Identifier
    ])
  })

  // Command = SingleCommand
  p.command = p.RULE('command', () => {
    p.SUBRULE(p.singleCommand)
  })

  // CommandList = Command (Colon Command)*
  // Allows multiple commands per line separated by colons
  p.commandList = p.RULE('commandList', () => {
    p.SUBRULE(p.command)
    p.MANY(() => {
      p.CONSUME(Colon)
      p.SUBRULE2(p.command)
    })
  })

  // Statement = LineNumber CommandList
  // LineNumber is a NumberLiteral at the start (acts as a label for GOTO/GOSUB)
  // CommandList may contain multiple commands separated by colons
  p.statement = p.RULE('statement', () => {
    p.CONSUME(NumberLiteral) // Line number (label)
    p.SUBRULE(p.commandList)
  })
}
