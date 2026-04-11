/**
 * Parse with Chevrotain
 *
 * Standalone functions for parsing F-BASIC source code using the Chevrotain parser.
 * Contains the main parseWithChevrotain function and REPL-only command validation.
 */

import type { CstNode, ILexingError, IRecognitionException, IToken } from 'chevrotain'

import { lexer } from './parser-tokens'

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

    // Extract line number from NumberLiteral token in statement nodes
    let currentLineNumber = lineNumber
    if (cstNode.name === 'statement' && cstNode.children.NumberLiteral?.[0]) {
      const token = cstNode.children.NumberLiteral[0] as IToken
      const parsed = parseInt(token.image, 10)
      if (!isNaN(parsed)) {
        currentLineNumber = parsed
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
              traverse(child, currentLineNumber)
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

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

/**
 * Parser instance interface - only the methods we need from the Chevrotain parser.
 */
interface ChevrotainParserInstance {
  input: IToken[]
  statement: () => CstNode
  errors: IRecognitionException[]
}

/**
 * Parse F-BASIC source code using the Chevrotain parser.
 *
 * Uses line-by-line parsing approach: split code by line breaks,
 * parse each line independently, then combine results.
 *
 * @param source - The F-BASIC source code to parse
 * @param parserInstance - The Chevrotain parser instance to use
 * @returns Parse result with CST or errors
 */
export function parseWithChevrotain(
  source: string,
  parserInstance: ChevrotainParserInstance
): {
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
              column: err.column ?? 1,
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
                column: token?.startColumn ?? 1,
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
            column: err.column ?? 1,
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
