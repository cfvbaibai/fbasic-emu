/**
 * Screen and Display Statement Parsing Rules
 *
 * Registers screen/display-related grammar rules on the parser instance.
 * Includes: LOCATE, COLOR, CGSET, CGEN, PALET, VIEW.
 */

import type { CstNode } from 'chevrotain'

import {
  Cgen,
  Cgset,
  Cls,
  Color,
  Comma,
  Identifier,
  Locate,
  Palet,
  Paletb,
  Palets,
  View,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by screen statement rules.
 */
export interface ScreenStatementParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE3(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE4(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE5(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME2(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME3(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME4(tokenType: unknown, options?: Record<string, unknown>): unknown
  OPTION(impl: () => void): void
  OPTION2(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
}

/**
 * Screen statement rule declarations needed on the parser class.
 */
export interface ScreenStatementRuleDeclarations {
  clsStatement: () => CstNode
  locateStatement: () => CstNode
  colorStatement: () => CstNode
  cgsetStatement: () => CstNode
  cgenStatement: () => CstNode
  paletParameterList: () => CstNode
  paletStatement: () => CstNode
  viewStatement: () => CstNode
  // Expression rules (needed by screen statements)
  expression: () => CstNode
}

/**
 * Register screen/display statement parsing rules on the parser instance.
 * Must be called from the parser constructor after expression rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerScreenStatementRules(
  p: ScreenStatementParserInstance & ScreenStatementRuleDeclarations
): void {
  // CLS - Clears the background screen
  p.clsStatement = p.RULE('clsStatement', () => {
    p.CONSUME(Cls)
  })

  // LOCATE
  // Moves cursor to specified position
  // Example: LOCATE X, Y
  // X: Horizontal column (0 to 27)
  // Y: Vertical line (0 to 23)
  p.locateStatement = p.RULE('locateStatement', () => {
    p.CONSUME(Locate)
    p.SUBRULE(p.expression) // X coordinate
    p.CONSUME(Comma)
    p.SUBRULE2(p.expression) // Y coordinate
  })

  // COLOR X, Y, n
  // Sets color pattern for a 2x2 character area containing position (X, Y)
  p.colorStatement = p.RULE('colorStatement', () => {
    p.CONSUME(Color)
    p.SUBRULE(p.expression) // X coordinate
    p.CONSUME(Comma)
    p.SUBRULE2(p.expression) // Y coordinate
    p.CONSUME2(Comma)
    p.SUBRULE3(p.expression) // Color pattern number (0-3)
  })

  // CGSET [m][,n]
  // Sets color palette for background (m: 0-1) and sprites (n: 0-2)
  // Both parameters are optional (default: m=1, n=1)
  p.cgsetStatement = p.RULE('cgsetStatement', () => {
    p.CONSUME(Cgset)
    // First parameter (m) is optional
    p.OPTION(() => {
      p.SUBRULE(p.expression) // Background palette code (0-1)
      // Second parameter (n) is optional if first is present
      p.OPTION2(() => {
        p.CONSUME(Comma)
        p.SUBRULE2(p.expression) // Sprite palette code (0-2)
      })
    })
  })

  // CGEN n
  // Sets character generator mode (n: 0-3)
  // 0: A on BG, A on sprite
  // 1: A on BG, B on sprite
  // 2: B on BG, A on sprite (default)
  // 3: B on BG, B on sprite
  p.cgenStatement = p.RULE('cgenStatement', () => {
    p.CONSUME(Cgen)
    p.SUBRULE(p.expression) // Character generator mode (0-3)
  })

  // PALET parameter list: n, C1, C2, C3, C4
  // Common parameter parsing for all PALET forms
  p.paletParameterList = p.RULE('paletParameterList', () => {
    p.SUBRULE(p.expression) // n (color combination number 0-3)
    p.CONSUME(Comma)
    p.SUBRULE2(p.expression) // C1
    p.CONSUME2(Comma)
    p.SUBRULE3(p.expression) // C2
    p.CONSUME3(Comma)
    p.SUBRULE4(p.expression) // C3
    p.CONSUME4(Comma)
    p.SUBRULE5(p.expression) // C4
  })

  // PALET {B|S} n, C1, C2, C3, C4
  // or PALETB n, C1, C2, C3, C4 (for background, no space)
  // or PALETS n, C1, C2, C3, C4 (for sprites, no space)
  // Sets color codes for color combination n (0-3)
  // C1, C2, C3, C4 are color codes (0-60)
  // When n=0 and target is B, C1 is the backdrop color
  p.paletStatement = p.RULE('paletStatement', () => {
    // Handle both forms: PALETB/PALETS (no space) or PALET B/S (with space)
    p.OR([
      {
        // PALETB n, C1, C2, C3, C4 (background, no space)
        ALT: () => {
          p.CONSUME(Paletb)
          p.SUBRULE(p.paletParameterList)
        },
      },
      {
        // PALETS n, C1, C2, C3, C4 (sprites, no space)
        ALT: () => {
          p.CONSUME(Palets)
          p.SUBRULE2(p.paletParameterList)
        },
      },
      {
        // PALET B n, C1, C2, C3, C4 (background, with space)
        ALT: () => {
          p.CONSUME(Palet)
          // B or S identifier (must be uppercase B or S)
          p.CONSUME(Identifier, { LABEL: 'target' }) // B or S
          p.SUBRULE3(p.paletParameterList)
        },
      },
    ])
  })

  // VIEW - Copies BG GRAPHIC to Background Screen
  // Per F-BASIC Manual page 36: "Upon executing the VIEW command,
  // the BG GRAPHIC Screen will be copied to the Background Screen."
  p.viewStatement = p.RULE('viewStatement', () => {
    p.CONSUME(View)
  })
}
