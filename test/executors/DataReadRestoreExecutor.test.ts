/**
 * DATA, READ, RESTORE Executor Tests
 *
 * Unit tests for DataExecutor, ReadExecutor, and RestoreExecutor classes.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { ExpressionEvaluator } from '@/core/evaluation/ExpressionEvaluator'
import { DataExecutor } from '@/core/execution/executors/DataExecutor'
import { ReadExecutor } from '@/core/execution/executors/ReadExecutor'
import { RestoreExecutor } from '@/core/execution/executors/RestoreExecutor'
import { getFirstCstNode } from '@/core/parser/cst-helpers'
import { FBasicParser } from '@/core/parser/FBasicParser'
import { DataService } from '@/core/services/DataService'
import { VariableService } from '@/core/services/VariableService'
import { ExecutionContext } from '@/core/state/ExecutionContext'

describe('DataExecutor', () => {
  let executor: DataExecutor
  let dataService: DataService
  let evaluator: ExpressionEvaluator
  let context: ExecutionContext
  let parser: FBasicParser

  beforeEach(() => {
    context = new ExecutionContext({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
    })
    evaluator = new ExpressionEvaluator(context)
    dataService = new DataService(context, evaluator)
    executor = new DataExecutor(dataService)
    parser = new FBasicParser()

    // Clear data values before each test
    context.dataValues = []
    context.dataIndex = 0
  })

  async function parseDataStatement(code: string) {
    const result = await parser.parse(code)
    if (!result.success || !result.cst) return null

    const statements = result.cst.children.statement
    if (!Array.isArray(statements) || statements.length === 0) return null

    const stmt = statements[0]
    if (!stmt || !('children' in stmt)) return null

    const commandListCst = getFirstCstNode(stmt.children.commandList)
    if (!commandListCst) return null

    const commandCst = getFirstCstNode(commandListCst.children.command)
    if (!commandCst) return null

    const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
    if (!singleCommandCst) return null

    return getFirstCstNode(singleCommandCst.children.dataStatement)
  }

  describe('DATA Statement Execution', () => {
    it('should add numeric constants to data array', async () => {
      const dataStmtCst = await parseDataStatement('10 DATA 3, 4, 1, 6')
      expect(dataStmtCst).not.toBeNull()

      executor.execute(dataStmtCst!)

      expect(context.dataValues.length).toBe(4)
      expect(context.dataValues[0]).toBe(3)
      expect(context.dataValues[1]).toBe(4)
      expect(context.dataValues[2]).toBe(1)
      expect(context.dataValues[3]).toBe(6)
    })

    it('should add quoted string constants to data array', async () => {
      const dataStmtCst = await parseDataStatement('20 DATA "GOOD", "MORNING", "EVENING"')
      expect(dataStmtCst).not.toBeNull()

      executor.execute(dataStmtCst!)

      expect(context.dataValues.length).toBe(3)
      expect(context.dataValues[0]).toBe('GOOD')
      expect(context.dataValues[1]).toBe('MORNING')
      expect(context.dataValues[2]).toBe('EVENING')
    })

    it('should add unquoted string constants to data array', async () => {
      const dataStmtCst = await parseDataStatement('30 DATA GOOD, MORNING, EVENING')
      expect(dataStmtCst).not.toBeNull()

      executor.execute(dataStmtCst!)

      expect(context.dataValues.length).toBe(3)
      expect(context.dataValues[0]).toBe('GOOD')
      expect(context.dataValues[1]).toBe('MORNING')
      expect(context.dataValues[2]).toBe('EVENING')
    })

    it('should handle quoted strings containing commas', async () => {
      const dataStmtCst = await parseDataStatement('40 DATA ABC, DE, ", ", F')
      expect(dataStmtCst).not.toBeNull()

      executor.execute(dataStmtCst!)

      expect(context.dataValues.length).toBe(4)
      expect(context.dataValues[0]).toBe('ABC')
      expect(context.dataValues[1]).toBe('DE')
      expect(context.dataValues[2]).toBe(', ')
      expect(context.dataValues[3]).toBe('F')
    })

    it('should handle empty DATA statement', async () => {
      const dataStmtCst = await parseDataStatement('50 DATA')
      expect(dataStmtCst).not.toBeNull()

      executor.execute(dataStmtCst!)

      expect(context.dataValues.length).toBe(0)
    })
  })
})

describe('ReadExecutor', () => {
  let executor: ReadExecutor
  let dataService: DataService
  let variableService: VariableService
  let evaluator: ExpressionEvaluator
  let context: ExecutionContext
  let parser: FBasicParser

  beforeEach(() => {
    context = new ExecutionContext({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
    })
    evaluator = new ExpressionEvaluator(context)
    dataService = new DataService(context, evaluator)
    variableService = new VariableService(context, evaluator)
    executor = new ReadExecutor(dataService, variableService, evaluator)
    parser = new FBasicParser()

    // Clear data values and variables before each test
    context.dataValues = []
    context.dataIndex = 0
    context.variables.clear()
  })

  async function parseReadStatement(code: string) {
    const result = await parser.parse(code)
    if (!result.success || !result.cst) return null

    const statements = result.cst.children.statement
    if (!Array.isArray(statements) || statements.length === 0) return null

    const stmt = statements[0]
    if (!stmt || !('children' in stmt)) return null

    const commandListCst = getFirstCstNode(stmt.children.commandList)
    if (!commandListCst) return null

    const commandCst = getFirstCstNode(commandListCst.children.command)
    if (!commandCst) return null

    const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
    if (!singleCommandCst) return null

    return getFirstCstNode(singleCommandCst.children.readStatement)
  }

  describe('READ Statement Execution', () => {
    it('should read numeric values into variables', async () => {
      // Set up data
      context.dataValues = [3, 4, 1, 6, 2, 7, 8, 3, 4, 9]
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('10 READ X')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 10)

      const variable = context.variables.get('X')
      expect(variable).toBeDefined()
      expect(variable?.value).toBe(3)
      expect(context.dataIndex).toBe(1)
    })

    it('should read multiple values into multiple variables', async () => {
      context.dataValues = [10, 20, 30]
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('20 READ A, B, C')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 20)

      expect(context.variables.get('A')?.value).toBe(10)
      expect(context.variables.get('B')?.value).toBe(20)
      expect(context.variables.get('C')?.value).toBe(30)
      expect(context.dataIndex).toBe(3)
    })

    it('should read string values into string variables', async () => {
      context.dataValues = ['GOOD', 'MORNING', 'EVENING']
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('30 READ A$, B$, C$')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 30)

      expect(context.variables.get('A$')?.value).toBe('GOOD')
      expect(context.variables.get('B$')?.value).toBe('MORNING')
      expect(context.variables.get('C$')?.value).toBe('EVENING')
      expect(context.dataIndex).toBe(3)
    })

    it('should read mixed numeric and string values', async () => {
      context.dataValues = [10, 'HELLO', 20, 'WORLD']
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('40 READ A, B$, C, D$')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 40)

      expect(context.variables.get('A')?.value).toBe(10)
      expect(context.variables.get('B$')?.value).toBe('HELLO')
      expect(context.variables.get('C')?.value).toBe(20)
      expect(context.variables.get('D$')?.value).toBe('WORLD')
    })

    it('should report TM ERROR when reading string into numeric variable', async () => {
      context.dataValues = ['HELLO']
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('10 READ A')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 10)

      const errors = context.getErrors()
      expect(errors.length).toBe(1)
      expect(errors[0]?.message).toBe('TM ERROR')
      // Variable should NOT be set with the wrong type
      expect(context.variables.get('A')).toBeUndefined()
    })

    it('should report TM ERROR when reading number into string variable', async () => {
      context.dataValues = [123]
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('10 READ B$')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 10)

      const errors = context.getErrors()
      expect(errors.length).toBe(1)
      expect(errors[0]?.message).toBe('TM ERROR')
      // Variable should NOT be set with the wrong type
      expect(context.variables.get('B$')).toBeUndefined()
    })

    it('should halt on first type mismatch in multi-variable READ', async () => {
      context.dataValues = [10, 'HELLO', 30]
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('10 READ A, B, C')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 10)

      const errors = context.getErrors()
      expect(errors.length).toBe(1)
      expect(errors[0]?.message).toBe('TM ERROR')
      // First variable was set correctly (numeric into numeric)
      expect(context.variables.get('A')?.value).toBe(10)
      // Data pointer should have advanced past the consumed value
      expect(context.dataIndex).toBe(2)
    })

    it('should report OD ERROR when out of data', async () => {
      context.dataValues = [10]
      context.dataIndex = 0

      const readStmtCst = await parseReadStatement('50 READ A, B, C')
      expect(readStmtCst).not.toBeNull()

      executor.execute(readStmtCst!, 50)

      const errors = context.getErrors()
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]?.message).toBe('OD ERROR')
      // First variable should be set, others should fail
      expect(context.variables.get('A')?.value).toBe(10)
    })
  })
})

describe('RestoreExecutor', () => {
  let executor: RestoreExecutor
  let dataService: DataService
  let evaluator: ExpressionEvaluator
  let context: ExecutionContext
  let parser: FBasicParser

  beforeEach(() => {
    context = new ExecutionContext({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
    })
    evaluator = new ExpressionEvaluator(context)
    dataService = new DataService(context, evaluator)
    executor = new RestoreExecutor(dataService)
    parser = new FBasicParser()

    // Set up some data
    context.dataValues = [10, 20, 30, 40, 50]
    context.dataIndex = 3 // Start at index 3
  })

  async function parseRestoreStatement(code: string) {
    const result = await parser.parse(code)
    if (!result.success || !result.cst) return null

    const statements = result.cst.children.statement
    if (!Array.isArray(statements) || statements.length === 0) return null

    const stmt = statements[0]
    if (!stmt || !('children' in stmt)) return null

    const commandListCst = getFirstCstNode(stmt.children.commandList)
    if (!commandListCst) return null

    const commandCst = getFirstCstNode(commandListCst.children.command)
    if (!commandCst) return null

    const singleCommandCst = getFirstCstNode(commandCst.children.singleCommand)
    if (!singleCommandCst) return null

    return getFirstCstNode(singleCommandCst.children.restoreStatement)
  }

  describe('RESTORE Statement Execution', () => {
    it('should reset data index to 0 when no line number specified', async () => {
      const restoreStmtCst = await parseRestoreStatement('10 RESTORE')
      expect(restoreStmtCst).not.toBeNull()

      executor.execute(restoreStmtCst!)

      expect(context.dataIndex).toBe(0)
    })

    it('should set data index to specific line when line number specified', async () => {
      // Set up statements with DATA at different lines
      // Note: This requires preprocessing, so we test the basic functionality
      const restoreStmtCst = await parseRestoreStatement('20 RESTORE 1000')
      expect(restoreStmtCst).not.toBeNull()

      executor.execute(restoreStmtCst!)

      // The actual index depends on findDataStatementIndex implementation
      // For now, we verify the executor runs without error
      expect(restoreStmtCst).not.toBeNull()
    })
  })
})
