/**
 * F-Basic Parser Implementation
 *
 * This module provides the main parser interface for F-Basic programs.
 * It uses Chevrotain parser to create CST (Concrete Syntax Tree) from F-Basic source code.
 */

import type { CstNode } from 'chevrotain'

import type { ParserInfo } from '@/core/interfaces'

import { parseWithChevrotain } from './FBasicChevrotainParser'
import { normalizeLocationValue } from './normalizeLocationValue'

/**
 * Parser error interface
 */
export interface ParserError {
  message: string
  location?: {
    start: { offset: number; line: number; column: number }
    end: { offset: number; line: number; column: number }
  }
  expected?: string[]
  found?: string
}

/**
 * Parser result interface
 */
export interface ParseResult {
  success: boolean
  cst?: CstNode // Changed from ast to cst
  errors?: ParserError[]
}

/**
 * F-Basic Parser Class
 *
 * Provides methods for parsing F-Basic source code into CST (Concrete Syntax Tree)
 * and handling parsing errors.
 */
export class FBasicParser {
  constructor() {
    // Chevrotain parser is initialized statically, no async initialization needed
  }

  /**
   * Parse F-Basic source code into a CST
   *
   * @param source - The F-Basic source code to parse
   * @returns Parse result with CST or errors
   */
  async parse(source: string): Promise<ParseResult> {
    try {
      const parseResult = parseWithChevrotain(source)

      if (!parseResult.success) {
        // Include error details for debugging
        const errorMessages = parseResult.errors?.map(e => e.message).join('; ') ?? 'Unknown parse error'
        return {
          success: false,
          errors: parseResult.errors?.map(err => {
            const line = normalizeLocationValue(err.line)
            const column = normalizeLocationValue(err.column)
            const length = normalizeLocationValue(err.length)

            return {
              message: `${err.message} (line ${line}, col ${column})`,
              location: {
                start: {
                  offset: 0,
                  line,
                  column,
                },
                end: {
                  offset: 0,
                  line,
                  column: column + length,
                },
              },
            }
          }) ?? [
            {
              message: errorMessages,
              location: {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 },
              },
            },
          ],
        }
      }

      if (!parseResult.cst) {
        throw new Error('Parser succeeded but no CST returned')
      }

      // Return CST directly (no conversion to AST)
      return {
        success: true,
        cst: parseResult.cst,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Parse error'
      return {
        success: false,
        errors: [
          {
            message: errorMessage,
            location: {
              start: { offset: 0, line: 1, column: 1 },
              end: { offset: 0, line: 1, column: 1 },
            },
          },
        ],
      }
    }
  }

  /**
   * Parse a single statement
   *
   * @param statementText - The statement text to parse
   * @returns Parsed statement CST or null
   */
  async parseStatement(statementText: string): Promise<CstNode | null> {
    const result = await this.parse(statementText)
    if (result.success && result.cst?.children.statement) {
      const statements = result.cst.children.statement
      if (Array.isArray(statements) && statements.length > 0) {
        const firstStmt = statements[0]
        if (firstStmt && 'children' in firstStmt) {
          return firstStmt
        }
      }
    }
    return null
  }

  /**
   * Get parser version and capabilities
   *
   * Scope note:
   * - supportedStatements/supportedFunctions represent the current IDE interpreter execution surface.
   * - They intentionally track StatementRouter + FunctionEvaluator support (not every reserved keyword token).
   */
  getParserInfo(): ParserInfo {
    return {
      name: 'F-Basic Parser (Chevrotain)',
      version: '2.0.0',
      capabilities: [
        'Complete F-Basic syntax support',
        'TypeScript-native parser (Chevrotain)',
        'No build step required',
        'Excellent error recovery',
        'Precise error locations',
        '280+ keywords including gaming APIs',
        'Sprite and animation commands',
        'Character generator commands',
        'Sound and music commands',
        'Input handling commands',
        'Tile-based graphics commands',
        'Collision detection commands',
        'Advanced graphics commands',
        'System commands',
      ],
      features: ['ast-parsing', 'error-reporting', 'multi-statement', 'chevrotain', 'no-build-step'],
      supportedStatements: [
        'BEEP',
        'BGPLAY',
        'CGEN',
        'CGSET',
        'CLEAR',
        'CLS',
        'COLOR',
        'CUT',
        'DATA',
        'DEF MOVE',
        'DEF SPRITE',
        'DIM',
        'END',
        'ERA',
        'FOR',
        'GOSUB',
        'GOTO',
        'IF...THEN',
        'INPUT',
        'LET',
        'LINPUT',
        'LOCATE',
        'MOVE',
        'NEXT',
        'ON...GOTO/GOSUB',
        'PALET',
        'PAUSE',
        'PLAY',
        'POSITION',
        'PRINT',
        'READ',
        'REM',
        'RESTORE',
        'RETURN',
        'SPRITE',
        'SPRITE ON/OFF',
        'SWAP',
        'VIEW',
      ],
      supportedFunctions: [
        'ABS',
        'ASC',
        'CHR$',
        'HEX$',
        'INKEY$',
        'LEFT$',
        'LEN',
        'MID$',
        'MOVE',
        'POS',
        'RIGHT$',
        'RND',
        'SCR$',
        'SGN',
        'STICK',
        'STR$',
        'STRIG',
        'VAL',
        'XPOS',
        'YPOS',
      ],
      supportedOperators: ['+', '-', '*', '/', '^', 'MOD', '=', '<>', '<', '>', '<=', '>=', 'AND', 'OR', 'NOT'],
    }
  }
}

/**
 * Create a new F-Basic parser instance
 */
export function createParser(): FBasicParser {
  return new FBasicParser()
}

/**
 * Parse F-Basic source code (convenience function)
 */
export async function parseFBasic(source: string): Promise<ParseResult> {
  const parser = createParser()
  return await parser.parse(source)
}
