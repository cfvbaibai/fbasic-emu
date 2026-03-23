/**
 * REPL-Only and Limited Utility Command Parsing Rules
 *
 * Registers REPL-only and limited utility grammar rules on the parser instance.
 * These commands are recognized by the parser but produce errors at runtime
 * because they are not applicable in the IDE version.
 *
 * REPL-only: LIST, NEW, RUN, SAVE, LOAD, KEY, KEYLIST, CONT, SYSTEM
 * Limited utility: POKE, PEEK, FRE, INKEY$, STOP
 */

import type { CstNode } from 'chevrotain'

import {
  // Tokens needed by rule bodies
  Comma,
  Cont,
  Fre,
  Inkey,
  Key,
  Keylist,
  // REPL-only commands
  List,
  Load,
  LParen,
  Minus,
  New,
  NumberLiteral,
  Peek,
  // Limited utility commands
  Poke,
  Question,
  RParen,
  Run,
  Save,
  Stop,
  StringLiteral,
  System,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by REPL statement rules.
 */
export interface ReplStatementParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME2(tokenType: unknown, options?: Record<string, unknown>): unknown
  OPTION(impl: () => void): void
  OPTION2(impl: () => void): void
}

/**
 * REPL statement rule declarations needed on the parser class.
 */
export interface ReplStatementRuleDeclarations {
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
  expression: () => CstNode
}

/**
 * Register all REPL-only and limited utility statement parsing rules.
 * Must be called from the parser constructor after expression rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerReplStatementRules(
  p: ReplStatementParserInstance & ReplStatementRuleDeclarations
): void {
  // LIST - Lists program (REPL-only)
  p.listStatement = p.RULE('listStatement', () => {
    p.CONSUME(List)
    // Optional line range: LIST or LIST 10-100
    p.OPTION(() => {
      p.CONSUME(NumberLiteral)
      p.OPTION2(() => {
        p.CONSUME(Minus)
        p.CONSUME2(NumberLiteral)
      })
    })
  })

  // NEW - Erase program (REPL-only)
  p.newStatement = p.RULE('newStatement', () => {
    p.CONSUME(New)
  })

  // RUN - Execute program (REPL-only)
  p.runStatement = p.RULE('runStatement', () => {
    p.CONSUME(Run)
  })

  // SAVE - Save to tape (REPL-only)
  p.saveStatement = p.RULE('saveStatement', () => {
    p.CONSUME(Save)
  })

  // LOAD [?] - Load from tape or verify (REPL-only)
  p.loadStatement = p.RULE('loadStatement', () => {
    p.CONSUME(Load)
    // Optional ? for verify mode
    p.OPTION(() => {
      p.CONSUME(Question)
    })
  })

  // KEY - Define function keys (REPL-only)
  p.keyStatement = p.RULE('keyStatement', () => {
    p.CONSUME(Key)
    // Optional parameters
    p.OPTION(() => {
      p.SUBRULE(p.expression)
      p.OPTION2(() => {
        p.CONSUME(Comma)
        p.CONSUME(StringLiteral)
      })
    })
  })

  // KEYLIST - List function keys (REPL-only)
  p.keylistStatement = p.RULE('keylistStatement', () => {
    p.CONSUME(Keylist)
  })

  // CONT - Continue after STOP (REPL-only)
  p.contStatement = p.RULE('contStatement', () => {
    p.CONSUME(Cont)
  })

  // SYSTEM - Exit to system (REPL-only)
  p.systemStatement = p.RULE('systemStatement', () => {
    p.CONSUME(System)
  })

  // POKE address, value - Write to memory (not applicable in emulator)
  p.pokeStatement = p.RULE('pokeStatement', () => {
    p.CONSUME(Poke)
    p.SUBRULE(p.expression) // address
    p.CONSUME(Comma)
    p.SUBRULE2(p.expression) // value
  })

  // PEEK(address) - Read from memory (returns as function in primary)
  p.peekStatement = p.RULE('peekStatement', () => {
    p.CONSUME(Peek)
    p.CONSUME(LParen)
    p.SUBRULE(p.expression)
    p.CONSUME(RParen)
  })

  // FRE(n) - Free memory (not meaningful in emulator)
  p.freStatement = p.RULE('freStatement', () => {
    p.CONSUME(Fre)
    p.CONSUME(LParen)
    p.SUBRULE(p.expression)
    p.CONSUME(RParen)
  })

  // INKEY$ - Immediate keypress (not applicable for IDE)
  p.inkeyStatement = p.RULE('inkeyStatement', () => {
    p.CONSUME(Inkey)
  })

  // STOP - Pause execution (limited utility)
  p.stopStatement = p.RULE('stopStatement', () => {
    p.CONSUME(Stop)
  })
}
