/**
 * INPUT Statement Executor
 *
 * Handles execution of INPUT statements for keyboard input into variables.
 * Supports optional prompt string and multiple variables (comma-separated input).
 */

import type { CstNode } from 'chevrotain'

import { ERROR_TYPES } from '@/core/constants'
import { getFirstToken, getTokens } from '@/core/parser/cst-helpers'
import type { VariableService } from '@/core/services/VariableService'
import type { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicScalarValue } from '@/core/types/BasicTypes'

export class InputExecutor {
  constructor(
    private context: ExecutionContext,
    private variableService: VariableService
  ) {}

  /**
   * Execute INPUT statement from CST.
   * INPUT ["prompt"] {; variable(, variable, ...)}
   * Requests user input, then assigns values to variables (numeric or string).
   */
  async execute(inputStmtCst: CstNode): Promise<void> {
    const device = this.context.deviceAdapter
    if (!device?.requestInput) {
      this.context.addError({
        line: 0,
        message: 'INPUT failed: device adapter does not support input requests',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const stringLiteral = getFirstToken(inputStmtCst.children.StringLiteral)
    const prompt = stringLiteral ? stringLiteral.image.slice(1, -1) : '?'

    const identifierTokens = getTokens(inputStmtCst.children.Identifier)
    if (!identifierTokens || identifierTokens.length === 0) {
      this.context.addError({
        line: 0,
        message: 'Invalid INPUT statement: at least one variable required',
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    const variableNames = identifierTokens.map(t => t.image.toUpperCase())
    const variableCount = variableNames.length

    let values: string[]
    try {
      values = await device.requestInput(prompt, { variableCount })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input cancelled'
      this.context.addError({
        line: 0,
        message,
        type: ERROR_TYPES.RUNTIME,
      })
      return
    }

    // Pad with empty/0 if user entered fewer values
    while (values.length < variableCount) {
      values.push('')
    }

    for (let i = 0; i < variableCount; i++) {
      const name = variableNames[i]
      if (name === undefined) continue
      const raw = values[i] ?? ''
      const isStringVar = name.endsWith('$')
      const value: BasicScalarValue = isStringVar
        ? raw
        : (raw === '' ? 0 : parseFloat(raw) || 0)
      this.variableService.setVariable(name, value)
    }

    if (this.context.config.enableDebugMode) {
      this.context.addDebugOutput(
        `INPUT: ${variableNames.join(', ')} = ${values.slice(0, variableCount).join(', ')}`
      )
    }
  }
}
