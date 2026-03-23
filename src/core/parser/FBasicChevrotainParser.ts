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
 *
 * This file composes the parser from focused modules:
 * - parser-expressions.ts: Expression precedence rules
 * - parser-statements-core.ts: Core F-BASIC statements
 * - parser-statements-sprite.ts: Sprite and animation commands
 * - parser-statements-repl.ts: REPL-only and limited utility commands
 * - parser-dispatcher.ts: Command dispatcher and top-level rules
 * - parse-with-chevrotain.ts: Standalone parse function and REPL validation
 */

import type { CstNode } from 'chevrotain'
import { CstParser } from 'chevrotain'

import { parseWithChevrotain as parseWithChevrotainImpl } from './parse-with-chevrotain'
import { registerDispatcherRules } from './parser-dispatcher'
import { registerExpressionRules } from './parser-expressions'
import { registerCoreStatementRules } from './parser-statements-core'
import { registerDataStatementRules } from './parser-statements-data'
import { registerScreenStatementRules } from './parser-statements-screen'
import { registerReplStatementRules } from './parser-statements-repl'
import { registerSpriteStatementRules } from './parser-statements-sprite'
import { allTokens } from './parser-tokens'

// ============================================================================
// PARSER CLASS
// ============================================================================

class FBasicChevrotainParser extends CstParser {
  // Expression rules
  declare primary: () => CstNode
  declare unary: () => CstNode
  declare multiplicative: () => CstNode
  declare modExpression: () => CstNode
  declare additive: () => CstNode
  declare expression: () => CstNode
  declare bitwiseNotExpression: () => CstNode
  declare bitwiseAndExpression: () => CstNode
  declare bitwiseOrExpression: () => CstNode
  declare bitwiseXorExpression: () => CstNode
  declare comparisonExpression: () => CstNode
  declare logicalNotExpression: () => CstNode
  declare logicalAndExpression: () => CstNode
  declare logicalOrExpression: () => CstNode
  declare logicalExpression: () => CstNode

  // Expression helper rules
  declare expressionList: () => CstNode
  declare functionCall: () => CstNode
  declare arrayAccess: () => CstNode

  // Core statement rules
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

  // Sprite and animation statement rules
  declare defSpriteStatement: () => CstNode
  declare spriteStatement: () => CstNode
  declare spriteOnOffStatement: () => CstNode
  declare defMoveStatement: () => CstNode
  declare moveStatement: () => CstNode
  declare cutStatement: () => CstNode
  declare eraStatement: () => CstNode
  declare positionStatement: () => CstNode

  // REPL-only and limited utility command rules
  declare listStatement: () => CstNode
  declare newStatement: () => CstNode
  declare runStatement: () => CstNode
  declare saveStatement: () => CstNode
  declare loadStatement: () => CstNode
  declare keyStatement: () => CstNode
  declare keylistStatement: () => CstNode
  declare contStatement: () => CstNode
  declare systemStatement: () => CstNode
  declare pokeStatement: () => CstNode
  declare peekStatement: () => CstNode
  declare freStatement: () => CstNode
  declare inkeyStatement: () => CstNode
  declare stopStatement: () => CstNode

  // Data/array helper rules
  declare arrayDeclaration: () => CstNode
  declare dimensionList: () => CstNode
  declare dataConstant: () => CstNode
  declare dataConstantList: () => CstNode

  // Dispatcher rules
  declare singleCommand: () => CstNode
  declare command: () => CstNode
  declare commandList: () => CstNode
  declare statement: () => CstNode

  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    })

    // Register rules in dependency order (bottom-up)
    // Type assertion needed: module interfaces declare RULE as public,
    // but Chevrotain's EmbeddedActionsParser has it as protected.
    const self = this as never

    // 1. Expression rules (lowest level, no statement dependencies)
    registerExpressionRules(self)

    // 2. Core statement rules (depend on expression rules)
    registerCoreStatementRules(self)

    // 3. Data and array statement rules (depend on expression rules)
    registerDataStatementRules(self)

    // 4. Screen/display statement rules (depend on expression rules)
    registerScreenStatementRules(self)

    // 5. Sprite and animation statement rules (depend on expression rules)
    registerSpriteStatementRules(self)

    // 6. REPL-only and limited utility command rules (depend on expression rules)
    registerReplStatementRules(self)

    // 7. Dispatcher rules (depend on all statement rules) - must be last
    registerDispatcherRules(self)

    this.performSelfAnalysis()
  }
}

// ============================================================================
// PARSER INSTANCE AND EXPORT
// ============================================================================

// Create parser instance
const parserInstance = new FBasicChevrotainParser()

// ============================================================================
// PUBLIC API
// ============================================================================

// Export parse function - wraps the implementation to preserve the original signature
export function parseWithChevrotain(source: string) {
  return parseWithChevrotainImpl(source, parserInstance)
}

// Export for use in CST to AST converter
export { parserInstance }
