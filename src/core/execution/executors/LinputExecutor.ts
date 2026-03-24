/**
 * LINPUT Statement Executor
 *
 * Handles execution of LINPUT statements for line input into a single string variable.
 * Allows commas in input (unlike INPUT); max 31 characters per Family BASIC manual.
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import { getFirstToken, getTokens } from '@/core/parser/cst-helpers'
import type { VariableService } from '@/core/services/VariableService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'

export class LinputExecutor {
  constructor(
    private context: ExecutionContext,
    private variableService: VariableService
  ) {}

  /**
   * Execute LINPUT statement from CST.
   * LINPUT ["prompt"] {; character variable}
   * Requests one line of input and assigns to a single string variable.
   */
  async execute(linputStmtCst: CstNode): Promise<void> {
    const device = this.context.deviceAdapter
    if (!device?.requestInput) {
      this.context.addError({
        line: 0,
        message: 'LINPUT failed: device adapter does not support input requests',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const stringLiteral = getFirstToken(linputStmtCst.children.StringLiteral)
    const prompt = stringLiteral ? stringLiteral.image.slice(1, -1) : '?'

    const identifierTokens = getTokens(linputStmtCst.children.Identifier)
    const varToken = identifierTokens?.[0]
    if (!varToken) {
      this.context.addError({
        line: 0,
        message: 'Invalid LINPUT statement: one string variable required',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const variableName = varToken.image.toUpperCase()
    if (!variableName.endsWith('$')) {
      this.context.addError({
        line: 0,
        message: 'LINPUT requires a string variable (name ending with $)',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    let values: string[]
    try {
      values = await device.requestInput(prompt, { isLinput: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input cancelled'
      this.context.addError({
        line: 0,
        message,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const value = values[0] ?? ''
    this.variableService.setVariable(variableName, value)

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(`LINPUT: ${variableName} = "${value}"`)
    }
  }
}
