/**
 * Sprite and Animation Statement Parsing Rules
 *
 * Registers sprite and animation-related grammar rules on the parser instance.
 * Includes: DEF SPRITE, SPRITE, SPRITE ON/OFF, DEF MOVE, MOVE, CUT, ERA, POSITION.
 */

import type { CstNode } from 'chevrotain'

import {
  Comma,
  Cut,
  Def,
  Equal,
  Era,
  LParen,
  Move,
  Off,
  On,
  Position,
  RParen,
  Sprite,
} from './parser-tokens'

/**
 * Type for parser instance methods needed by sprite statement rules.
 */
export interface SpriteStatementParserInstance {
  RULE(name: string, impl: () => void): () => CstNode
  SUBRULE(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE2(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE3(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE4(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE5(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE6(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  SUBRULE7(rule: () => CstNode, options?: Record<string, unknown>): CstNode
  CONSUME(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME2(tokenType: unknown, options?: Record<string, unknown>): unknown
  CONSUME3(tokenType: unknown, options?: Record<string, unknown>): CstNode
  CONSUME4(tokenType: unknown, options?: Record<string, unknown>): CstNode
  CONSUME5(tokenType: unknown, options?: Record<string, unknown>): CstNode
  OPTION(impl: () => void): void
  OR(alts: Array<{ GATE?: () => boolean; ALT: () => void }>): void
}

/**
 * Sprite statement rule declarations needed on the parser class.
 */
export interface SpriteStatementRuleDeclarations {
  defSpriteStatement: () => CstNode
  spriteStatement: () => CstNode
  spriteOnOffStatement: () => CstNode
  defMoveStatement: () => CstNode
  moveStatement: () => CstNode
  cutStatement: () => CstNode
  eraStatement: () => CstNode
  positionStatement: () => CstNode
  expression: () => CstNode
  expressionList: () => CstNode
}

/**
 * Register all sprite and animation statement parsing rules on the parser instance.
 * Must be called from the parser constructor after expression rules are registered.
 *
 * @param p - The parser instance (this)
 */
export function registerSpriteStatementRules(
  p: SpriteStatementParserInstance & SpriteStatementRuleDeclarations
): void {
  // DEF SPRITE n, (A, B, C, D, E) = character set
  // n: sprite number (0-7)
  // A: color combination (0-3)
  // B: size (0=8x8, 1=16x16)
  // C: priority (0=front, 1=behind background)
  // D: horizontal inversion (0=normal, 1=inverted)
  // E: vertical inversion (0=normal, 1=inverted)
  // character set: CHR$(N) codes or string like "@ABC"
  p.defSpriteStatement = p.RULE('defSpriteStatement', () => {
    p.CONSUME(Def)
    p.CONSUME(Sprite)
    p.SUBRULE(p.expression, { LABEL: 'spriteNumber' }) // n
    p.CONSUME(Comma)
    p.CONSUME(LParen)
    p.SUBRULE2(p.expression, { LABEL: 'colorCombination' }) // A
    p.CONSUME2(Comma)
    p.SUBRULE3(p.expression, { LABEL: 'size' }) // B
    p.CONSUME3(Comma)
    p.SUBRULE4(p.expression, { LABEL: 'priority' }) // C
    p.CONSUME4(Comma)
    p.SUBRULE5(p.expression, { LABEL: 'invertX' }) // D
    p.CONSUME5(Comma)
    p.SUBRULE6(p.expression, { LABEL: 'invertY' }) // E
    p.CONSUME(RParen)
    p.CONSUME(Equal)
    // Character set can be a string literal or CHR$ expressions
    // For now, we'll accept a general expression
    p.SUBRULE7(p.expression, { LABEL: 'characterSet' })
  })

  // SPRITE n [, X, Y]
  // n: sprite number (0-7)
  // X, Y: position in pixels (X: 0-255, Y: 0-255, per F-BASIC manual)
  // If X, Y are omitted, sprite n is hidden (removed from display)
  p.spriteStatement = p.RULE('spriteStatement', () => {
    p.CONSUME(Sprite)
    p.SUBRULE(p.expression, { LABEL: 'spriteNumber' }) // n
    // X, Y coordinates are optional - if omitted, sprite is hidden
    p.OPTION(() => {
      p.CONSUME(Comma)
      p.SUBRULE2(p.expression, { LABEL: 'x' }) // X
      p.CONSUME2(Comma)
      p.SUBRULE3(p.expression, { LABEL: 'y' }) // Y
    })
  })

  // SPRITE ON | SPRITE OFF
  // Enable or disable sprite display
  p.spriteOnOffStatement = p.RULE('spriteOnOffStatement', () => {
    p.CONSUME(Sprite)
    p.OR([
      { ALT: () => p.CONSUME(On, { LABEL: 'onOff' }) },
      { ALT: () => p.CONSUME(Off, { LABEL: 'onOff' }) },
    ])
  })

  // DEF MOVE(n) = SPRITE(A, B, C, D, E, F)
  // n: action number (0-7)
  // A: character type (0-15)
  // B: direction (0-8)
  // C: speed (0-255, 0=every 256 frames, 60/C dots per second)
  // D: distance (1-255, total = 2xD dots)
  // E: priority (0=front, 1=behind background)
  // F: color combination (0-3)
  p.defMoveStatement = p.RULE('defMoveStatement', () => {
    p.CONSUME(Def)
    p.CONSUME(Move)
    p.CONSUME(LParen)
    p.SUBRULE(p.expression, { LABEL: 'actionNumber' }) // n
    p.CONSUME(RParen)
    p.CONSUME(Equal)
    p.CONSUME(Sprite)
    p.CONSUME2(LParen)
    p.SUBRULE2(p.expression, { LABEL: 'characterType' }) // A
    p.CONSUME(Comma)
    p.SUBRULE3(p.expression, { LABEL: 'direction' }) // B
    p.CONSUME2(Comma)
    p.SUBRULE4(p.expression, { LABEL: 'speed' }) // C
    p.CONSUME3(Comma)
    p.SUBRULE5(p.expression, { LABEL: 'distance' }) // D
    p.CONSUME4(Comma)
    p.SUBRULE6(p.expression, { LABEL: 'priority' }) // E
    p.CONSUME5(Comma)
    p.SUBRULE7(p.expression, { LABEL: 'colorCombination' }) // F
    p.CONSUME2(RParen)
  })

  // MOVE n
  // n: action number (0-7)
  p.moveStatement = p.RULE('moveStatement', () => {
    p.CONSUME(Move)
    p.SUBRULE(p.expression, { LABEL: 'actionNumber' }) // n
  })

  // CUT n1[, n2, ...]
  // Stop movement, keep sprite visible at current position
  p.cutStatement = p.RULE('cutStatement', () => {
    p.CONSUME(Cut)
    p.SUBRULE(p.expressionList, { LABEL: 'actionNumbers' }) // n1, n2, ...
  })

  // ERA n1[, n2, ...]
  // Erase sprite (stop movement and hide)
  p.eraStatement = p.RULE('eraStatement', () => {
    p.CONSUME(Era)
    p.SUBRULE(p.expressionList, { LABEL: 'actionNumbers' }) // n1, n2, ...
  })

  // POSITION n, X, Y
  // Set initial position for next MOVE command
  p.positionStatement = p.RULE('positionStatement', () => {
    p.CONSUME(Position)
    p.SUBRULE(p.expression, { LABEL: 'actionNumber' }) // n
    p.CONSUME(Comma)
    p.SUBRULE2(p.expression, { LABEL: 'x' }) // X
    p.CONSUME2(Comma)
    p.SUBRULE3(p.expression, { LABEL: 'y' }) // Y
  })
}
