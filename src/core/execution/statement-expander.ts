/**
 * Statement Expander
 *
 * Expands CST statements into a flat list of individual statements
 * and creates a label map for line numbers.
 */

import type { CstNode } from 'chevrotain'

import { getCstNodes, getFirstCstNode, getFirstToken } from '@/core/parser/cst-helpers'

export interface ExpandedStatement {
  command: CstNode // Single command CST node
  lineNumber: number // Line number label
  statementIndex: number // Index in the expanded list
  /**
   * When this statement is an IF, the index of the last colon-separated
   * statement on the same line that falls within the IF's true branch.
   * The execution engine should skip to `ifScopeEndIndex + 1` when the
   * IF condition is false. Undefined for non-IF statements and IF
   * statements with line number jumps (THEN/GOTO number).
   */
  ifScopeEndIndex?: number
}

/**
 * Create a no-op placeholder CST node for REM/comment lines
 * These lines have no executable commands but need to be registered for GOTO/GOSUB targets
 */
function createNoOpCommand(): CstNode {
  return {
    name: 'command',
    children: {
      // Empty command - will be treated as no-op by the statement router
    },
  }
}

/**
 * Check if a command CST node is an IF-THEN statement with a line number jump
 * (THEN <number> or GOTO <number>). These do NOT scope over colon-separated
 * commands because they jump to another line.
 */
function isIfLineNumberJump(commandCst: CstNode): boolean {
  const singleCommand = getFirstCstNode(commandCst.children.singleCommand)
  if (!singleCommand) return false
  const ifThenStmt = getFirstCstNode(singleCommand.children.ifThenStatement)
  if (!ifThenStmt) return false
  // Line number jump: has NumberLiteral but no commandList
  const hasNumberLiteral = !!getFirstToken(ifThenStmt.children.NumberLiteral)
  const hasCommandList = !!getFirstCstNode(ifThenStmt.children.commandList)
  return hasNumberLiteral && !hasCommandList
}

/**
 * Check if a command CST node is an IF-THEN statement (any variant).
 * Includes THEN-less IF, IF-THEN with commandList, IF-GOTO, and IF-THEN with line number.
 */
function isIfStatement(commandCst: CstNode): boolean {
  const singleCommand = getFirstCstNode(commandCst.children.singleCommand)
  if (!singleCommand) return false
  return !!singleCommand.children.ifThenStatement
}

/**
 * Expand statements from CST into a flat list
 * Each statement contains a single command (colon-separated commands become separate statements)
 *
 * @param statementsCst Array of statement CST nodes from parser
 * @returns Object containing expanded statements and label map
 */
export function expandStatements(statementsCst: CstNode[]): {
  statements: ExpandedStatement[]
  labelMap: Map<number, number[]> // line number -> statement indices
} {
  const expandedStatements: ExpandedStatement[] = []
  const labelMap = new Map<number, number[]>()

  for (const statementCst of statementsCst) {
    // Extract line number from statement
    const lineNumberToken = getFirstToken(statementCst.children.NumberLiteral)
    if (!lineNumberToken) {
      continue // Skip statements without line numbers
    }

    const lineNumber = parseInt(lineNumberToken.image, 10)
    if (isNaN(lineNumber)) {
      continue // Skip invalid line numbers
    }

    // Get commandList from statement
    const commandListCst = getFirstCstNode(statementCst.children.commandList)
    if (!commandListCst) {
      continue // Skip statements without commandList
    }

    // Get all commands from the command list (colon-separated commands)
    const commands = getCstNodes(commandListCst.children.command)

    // Get statement indices for this line number
    const statementIndices: number[] = []

    // Handle empty command list (e.g., REM lines that have no executable code)
    // Still register the line number for GOTO/GOSUB targets
    if (commands.length === 0) {
      const statementIndex = expandedStatements.length
      expandedStatements.push({
        command: createNoOpCommand(),
        lineNumber,
        statementIndex,
      })
      statementIndices.push(statementIndex)
    } else {
      // First pass: identify IF statements and compute their scope end indices.
      // An IF scopes over all subsequent colon-separated commands on the same line,
      // UNLESS it is a line number jump (THEN number / GOTO number).
      const ifScopeMap = new Map<number, number>()
      for (let i = 0; i < commands.length; i++) {
        const commandCst = commands[i]
        if (!commandCst) continue
        if (isIfStatement(commandCst) && !isIfLineNumberJump(commandCst)) {
          // IF scopes from its own position to the last command on this line
          ifScopeMap.set(i, commands.length - 1)
        }
      }

      // Second pass: expand each command into a separate statement
      for (const commandCst of commands) {
        const commandIndex = statementIndices.length
        const statementIndex = expandedStatements.length
        const ifScopeEnd = ifScopeMap.get(commandIndex)
        expandedStatements.push({
          command: commandCst,
          lineNumber,
          statementIndex,
          ifScopeEndIndex: ifScopeEnd !== undefined ? statementIndex + (ifScopeEnd - commandIndex) : undefined,
        })
        statementIndices.push(statementIndex)
      }
    }

    // Map line number to statement indices
    // If multiple commands on the same line, all get the same line number label
    labelMap.set(lineNumber, statementIndices)
  }

  return {
    statements: expandedStatements,
    labelMap,
  }
}

