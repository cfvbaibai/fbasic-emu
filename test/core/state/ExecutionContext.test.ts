/**
 * ExecutionContext unit tests
 *
 * Covers construction, reset, control flow (loop/gosub stacks), data management,
 * statement navigation, error handling, line tracking, and iteration limits.
 */

import { describe, expect, it, vi } from 'vitest'

import { ERROR_TYPES } from '@/core/constants'
import type { ExpandedStatement } from '@/core/execution/statement-expander'
import { ExecutionContext } from '@/core/state/ExecutionContext'
import type { InterpreterConfig } from '@/core/types/execution-types'

function createConfig(overrides: Partial<InterpreterConfig> = {}): InterpreterConfig {
  return {
    maxIterations: 1000,
    maxOutputLines: 100,
    enableDebugMode: false,
    strictMode: false,
    ...overrides,
  }
}

function createStatement(lineNumber: number, index: number): ExpandedStatement {
  return {
    command: { name: 'command', children: {} },
    lineNumber,
    statementIndex: index,
  }
}

describe('ExecutionContext', () => {
  describe('constructor', () => {
    it('should initialize with default state values', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.isRunning).toEqual(false)
      expect(ctx.shouldStop).toEqual(false)
      expect(ctx.currentStatementIndex).toEqual(0)
      expect(ctx.statements).toEqual([])
      expect(ctx.labelMap.size).toEqual(0)
      expect(ctx.iterationCount).toEqual(0)
      expect(ctx.loopStack).toEqual([])
      expect(ctx.gosubStack).toEqual([])
      expect(ctx.dataValues).toEqual([])
      expect(ctx.dataIndex).toEqual(0)
      expect(ctx.variables.size).toEqual(0)
      expect(ctx.arrays.size).toEqual(0)
      expect(ctx.getErrors()).toEqual([])
      expect(ctx.getCurrentLineNumber()).toEqual(0)
    })

    it('should store the provided config', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: 500, enableDebugMode: true }))

      expect(ctx.config.maxIterations).toEqual(500)
      expect(ctx.config.enableDebugMode).toEqual(true)
    })
  })

  describe('reset', () => {
    it('should clear all state to initial values', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = true
      ctx.shouldStop = true
      ctx.currentStatementIndex = 5
      ctx.iterationCount = 100
      ctx.variables.set('X', { value: 42, type: 'number' })
      ctx.arrays.set('A', [1, 2, 3])
      ctx.dataValues = [10, 20, 30]
      ctx.dataIndex = 2
      ctx.loopStack.push({ variableName: 'I', startValue: 1, endValue: 10, stepValue: 1, currentValue: 5, statementIndex: 3 })
      ctx.gosubStack.push(10)
      ctx.setCurrentLineNumber(50)
      ctx.addError({ line: 5, message: 'test error', type: ERROR_TYPES.RUNTIME })

      ctx.reset()

      expect(ctx.isRunning).toEqual(false)
      expect(ctx.shouldStop).toEqual(false)
      expect(ctx.currentStatementIndex).toEqual(0)
      expect(ctx.iterationCount).toEqual(0)
      expect(ctx.variables.size).toEqual(0)
      expect(ctx.arrays.size).toEqual(0)
      expect(ctx.dataValues).toEqual([])
      expect(ctx.dataIndex).toEqual(0)
      expect(ctx.loopStack).toEqual([])
      expect(ctx.gosubStack).toEqual([])
      expect(ctx.statements).toEqual([])
      expect(ctx.labelMap.size).toEqual(0)
      expect(ctx.getErrors()).toEqual([])
      expect(ctx.getCurrentLineNumber()).toEqual(0)
    })

    it('should reset spriteStateManager if present', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockSpriteManager = { clear: vi.fn() }
      ctx.spriteStateManager = mockSpriteManager as never

      ctx.reset()

      expect(mockSpriteManager.clear).toHaveBeenCalledTimes(1)
    })

    it('should reset animationManager if present', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAnimManager = { reset: vi.fn() }
      ctx.animationManager = mockAnimManager as never

      ctx.reset()

      expect(mockAnimManager.reset).toHaveBeenCalledTimes(1)
    })

    it('should reset soundService if present', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockSoundService = { reset: vi.fn() }
      ctx.soundService = mockSoundService as never

      ctx.reset()

      expect(mockSoundService.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearDisplay', () => {
    it('should clear sprite and animation state only', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.variables.set('X', { value: 42, type: 'number' })
      ctx.isRunning = true
      ctx.currentStatementIndex = 5

      const mockSpriteManager = { clear: vi.fn() }
      const mockAnimManager = { reset: vi.fn() }
      ctx.spriteStateManager = mockSpriteManager as never
      ctx.animationManager = mockAnimManager as never

      ctx.clearDisplay()

      // Other state is preserved
      expect(ctx.variables.size).toEqual(1)
      expect(ctx.isRunning).toEqual(true)
      expect(ctx.currentStatementIndex).toEqual(5)

      // Display state is cleared
      expect(mockSpriteManager.clear).toHaveBeenCalledTimes(1)
      expect(mockAnimManager.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe('addOutput', () => {
    it('should delegate to deviceAdapter.printOutput', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAdapter = { printOutput: vi.fn() }
      ctx.deviceAdapter = mockAdapter as never

      ctx.addOutput('Hello')

      expect(mockAdapter.printOutput).toHaveBeenCalledWith('Hello')
    })

    it('should not throw if no deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(() => ctx.addOutput('Hello')).not.toThrow()
    })
  })

  describe('addError', () => {
    it('should store the error and delegate to deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAdapter = { errorOutput: vi.fn() }
      ctx.deviceAdapter = mockAdapter as never

      const error = { line: 10, message: 'Out of data', type: ERROR_TYPES.RUNTIME }
      ctx.addError(error)

      expect(ctx.getErrors()).toEqual([error])
      expect(mockAdapter.errorOutput).toHaveBeenCalledWith('Out of data')
    })

    it('should halt execution on RUNTIME errors', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = true

      ctx.addError({ line: 0, message: 'Runtime error', type: ERROR_TYPES.RUNTIME })

      expect(ctx.shouldStop).toEqual(true)
      expect(ctx.isRunning).toEqual(false)
    })

    it('should not halt execution on SYNTAX errors', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = true

      ctx.addError({ line: 0, message: 'Syntax error', type: ERROR_TYPES.SYNTAX })

      expect(ctx.shouldStop).toEqual(false)
      expect(ctx.isRunning).toEqual(true)
    })
  })

  describe('addDebugOutput', () => {
    it('should delegate to deviceAdapter when debug mode is enabled', () => {
      const ctx = new ExecutionContext(createConfig({ enableDebugMode: true }))
      const mockAdapter = { debugOutput: vi.fn() }
      ctx.deviceAdapter = mockAdapter as never

      ctx.addDebugOutput('debug message')

      expect(mockAdapter.debugOutput).toHaveBeenCalledWith('debug message')
    })

    it('should not call deviceAdapter when debug mode is disabled', () => {
      const ctx = new ExecutionContext(createConfig({ enableDebugMode: false }))
      const mockAdapter = { debugOutput: vi.fn() }
      ctx.deviceAdapter = mockAdapter as never

      ctx.addDebugOutput('debug message')

      expect(mockAdapter.debugOutput).not.toHaveBeenCalled()
    })
  })

  describe('shouldContinue', () => {
    it('should return true when all conditions are met', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: 1000 }))
      ctx.isRunning = true
      ctx.statements = [createStatement(10, 0), createStatement(20, 1)]

      expect(ctx.shouldContinue()).toEqual(true)
    })

    it('should return false when not running', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = false

      expect(ctx.shouldContinue()).toEqual(false)
    })

    it('should return false when shouldStop is true', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = true
      ctx.shouldStop = true

      expect(ctx.shouldContinue()).toEqual(false)
    })

    it('should return false when max iterations exceeded', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: 10 }))
      ctx.isRunning = true
      ctx.iterationCount = 10
      ctx.statements = [createStatement(10, 0)]

      expect(ctx.shouldContinue()).toEqual(false)
    })

    it('should return false when all statements executed', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.isRunning = true
      ctx.statements = [createStatement(10, 0)]
      ctx.currentStatementIndex = 1

      expect(ctx.shouldContinue()).toEqual(false)
    })

    it('should not enforce iteration limit when maxIterations is Infinity', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: Infinity }))
      ctx.isRunning = true
      ctx.iterationCount = 999999
      ctx.statements = [createStatement(10, 0)]

      expect(ctx.shouldContinue()).toEqual(true)
    })
  })

  describe('incrementIteration', () => {
    it('should increment iteration count', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: 1000 }))

      ctx.incrementIteration()

      expect(ctx.iterationCount).toEqual(1)
    })

    it('should add error and stop when max iterations reached', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: 3 }))

      ctx.incrementIteration()
      ctx.incrementIteration()
      ctx.incrementIteration()

      expect(ctx.iterationCount).toEqual(3)
      expect(ctx.shouldStop).toEqual(true)
      expect(ctx.getErrors().length).toEqual(1)
      expect(ctx.getErrors()[0]?.message).toEqual('Maximum iterations exceeded')
    })

    it('should not enforce limit when maxIterations is Infinity', () => {
      const ctx = new ExecutionContext(createConfig({ maxIterations: Infinity }))

      for (let i = 0; i < 10000; i++) {
        ctx.incrementIteration()
      }

      expect(ctx.shouldStop).toEqual(false)
      expect(ctx.getErrors().length).toEqual(0)
    })
  })

  describe('statement navigation', () => {
    it('getCurrentStatement should return current statement', () => {
      const ctx = new ExecutionContext(createConfig())
      const stmt = createStatement(10, 0)
      ctx.statements = [stmt, createStatement(20, 1)]

      expect(ctx.getCurrentStatement()).toEqual(stmt)
    })

    it('getCurrentStatement should return undefined when out of bounds', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.getCurrentStatement()).toBeUndefined()
    })

    it('nextStatement should advance index', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.statements = [createStatement(10, 0), createStatement(20, 1)]

      ctx.nextStatement()

      expect(ctx.currentStatementIndex).toEqual(1)
    })

    it('jumpToStatement should set index', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.statements = [createStatement(10, 0), createStatement(20, 1), createStatement(30, 2)]

      ctx.jumpToStatement(2)

      expect(ctx.currentStatementIndex).toEqual(2)
    })
  })

  describe('findStatementIndicesByLine', () => {
    it('should return indices for a mapped line number', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.labelMap.set(10, [0, 1])
      ctx.labelMap.set(20, [2])

      expect(ctx.findStatementIndicesByLine(10)).toEqual([0, 1])
      expect(ctx.findStatementIndicesByLine(20)).toEqual([2])
    })

    it('should return empty array for unmapped line number', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.findStatementIndicesByLine(999)).toEqual([])
    })
  })

  describe('findStatementIndexByLine', () => {
    it('should return first index for a mapped line number', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.labelMap.set(10, [3, 5, 7])

      expect(ctx.findStatementIndexByLine(10)).toEqual(3)
    })

    it('should return -1 for unmapped line number', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.findStatementIndexByLine(999)).toEqual(-1)
    })
  })

  describe('line number tracking', () => {
    it('should get and set current line number', () => {
      const ctx = new ExecutionContext(createConfig())

      ctx.setCurrentLineNumber(42)

      expect(ctx.getCurrentLineNumber()).toEqual(42)
    })
  })

  describe('loop stack (control flow)', () => {
    it('should support push/pop operations on loopStack', () => {
      const ctx = new ExecutionContext(createConfig())
      const loopState = {
        variableName: 'I',
        startValue: 1,
        endValue: 10,
        stepValue: 1,
        currentValue: 1,
        statementIndex: 5,
      }

      ctx.loopStack.push(loopState)

      expect(ctx.loopStack.length).toEqual(1)
      expect(ctx.loopStack[0]).toEqual(loopState)

      const popped = ctx.loopStack.pop()
      expect(popped).toEqual(loopState)
      expect(ctx.loopStack.length).toEqual(0)
    })
  })

  describe('gosub stack (control flow)', () => {
    it('should support push/pop operations on gosubStack', () => {
      const ctx = new ExecutionContext(createConfig())

      ctx.gosubStack.push(10)
      ctx.gosubStack.push(20)

      expect(ctx.gosubStack).toEqual([10, 20])

      expect(ctx.gosubStack.pop()).toEqual(20)
      expect(ctx.gosubStack.pop()).toEqual(10)
      expect(ctx.gosubStack.length).toEqual(0)
    })
  })

  describe('data management', () => {
    it('should store and track data values', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.dataValues = [10, 20, 'hello', 30]

      expect(ctx.dataValues.length).toEqual(4)
      expect(ctx.dataValues[0]).toEqual(10)
      expect(ctx.dataValues[2]).toEqual('hello')
    })

    it('should track data index', () => {
      const ctx = new ExecutionContext(createConfig())
      ctx.dataValues = [10, 20, 30]

      ctx.dataIndex = 0
      expect(ctx.dataIndex).toEqual(0)

      ctx.dataIndex = 2
      expect(ctx.dataIndex).toEqual(2)
    })
  })

  describe('variable management', () => {
    it('should store variables in the map', () => {
      const ctx = new ExecutionContext(createConfig())

      ctx.variables.set('X', { value: 42, type: 'number' })
      ctx.variables.set('NAME$', { value: 'Test', type: 'string' })

      expect(ctx.variables.size).toEqual(2)
      expect(ctx.variables.get('X')).toEqual({ value: 42, type: 'number' })
      expect(ctx.variables.get('NAME$')).toEqual({ value: 'Test', type: 'string' })
    })
  })

  describe('array management', () => {
    it('should store arrays in the map', () => {
      const ctx = new ExecutionContext(createConfig())

      ctx.arrays.set('A', [1, 2, 3])

      expect(ctx.arrays.size).toEqual(1)
      expect(ctx.arrays.get('A')).toEqual([1, 2, 3])
    })
  })

  describe('getStickState', () => {
    it('should delegate to deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAdapter = { getStickState: vi.fn().mockReturnValue(5) }
      ctx.deviceAdapter = mockAdapter as never

      expect(ctx.getStickState(0)).toEqual(5)
      expect(mockAdapter.getStickState).toHaveBeenCalledWith(0)
    })

    it('should return 0 when no deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.getStickState(0)).toEqual(0)
    })
  })

  describe('consumeStrigState', () => {
    it('should delegate to deviceAdapter and return consumed value', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAdapter = { consumeStrigState: vi.fn().mockReturnValue(1) }
      ctx.deviceAdapter = mockAdapter as never

      expect(ctx.consumeStrigState(0)).toEqual(1)
      expect(mockAdapter.consumeStrigState).toHaveBeenCalledWith(0)
    })

    it('should return 0 when no deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.consumeStrigState(0)).toEqual(0)
    })
  })

  describe('getSpritePosition', () => {
    it('should delegate to deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())
      const mockAdapter = { getSpritePosition: vi.fn().mockReturnValue({ x: 100, y: 50 }) }
      ctx.deviceAdapter = mockAdapter as never

      expect(ctx.getSpritePosition(0)).toEqual({ x: 100, y: 50 })
      expect(mockAdapter.getSpritePosition).toHaveBeenCalledWith(0)
    })

    it('should return null when no deviceAdapter', () => {
      const ctx = new ExecutionContext(createConfig())

      expect(ctx.getSpritePosition(0)).toBeNull()
    })
  })
})
