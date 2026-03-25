/**
 * VariableService unit tests
 *
 * Covers variable get/set, type handling, array operations, array creation,
 * existence checks, and clearing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { InterpreterConfig } from '@/core/interfaces'
import { VariableService } from '@/core/services/VariableService'
import { ExecutionContext } from '@/core/state/ExecutionContext'
import type { BasicScalarValue } from '@/core/types/BasicTypes'

function createTestContext(): ExecutionContext {
  const config: InterpreterConfig = {
    maxIterations: 1000,
    maxOutputLines: 100,
    enableDebugMode: false,
    strictMode: false,
  }
  return new ExecutionContext(config)
}

function createMockEvaluator() {
  return {
    evaluateExpression: vi.fn(),
  }
}

describe('VariableService', () => {
  let context: ExecutionContext
  let evaluator: ReturnType<typeof createMockEvaluator>
  let service: VariableService

  beforeEach(() => {
    context = createTestContext()
    evaluator = createMockEvaluator()
    service = new VariableService(context, evaluator as never)
  })

  describe('getVariable', () => {
    it('should return undefined for non-existent variable', () => {
      expect(service.getVariable('X')).toBeUndefined()
    })

    it('should return the variable value for existing variable', () => {
      service.setVariable('X', 42)

      expect(service.getVariable('X')).toEqual({ value: 42, type: 'number' })
    })
  })

  describe('setVariable', () => {
    it('should store a numeric variable with type number', () => {
      service.setVariable('X', 42)

      expect(context.variables.get('X')).toEqual({ value: 42, type: 'number' })
    })

    it('should store a string variable with type string', () => {
      service.setVariable('NAME$', 'Hello')

      expect(context.variables.get('NAME$')).toEqual({ value: 'Hello', type: 'string' })
    })

    it('should overwrite an existing variable', () => {
      service.setVariable('X', 10)
      service.setVariable('X', 20)

      expect(context.variables.get('X')).toEqual({ value: 20, type: 'number' })
    })
  })

  describe('setVariableFromExpressionCst', () => {
    it('should evaluate expression and set variable', () => {
      evaluator.evaluateExpression.mockReturnValue(42)
      const cst = { name: 'expression', children: {} }

      service.setVariableFromExpressionCst('X', cst as never)

      expect(evaluator.evaluateExpression).toHaveBeenCalledWith(cst)
      expect(context.variables.get('X')).toEqual({ value: 42, type: 'number' })
    })

    it('should convert boolean true to 1', () => {
      evaluator.evaluateExpression.mockReturnValue(true)
      const cst = { name: 'expression', children: {} }

      service.setVariableFromExpressionCst('X', cst as never)

      expect(context.variables.get('X')).toEqual({ value: 1, type: 'number' })
    })

    it('should convert boolean false to 0', () => {
      evaluator.evaluateExpression.mockReturnValue(false)
      const cst = { name: 'expression', children: {} }

      service.setVariableFromExpressionCst('X', cst as never)

      expect(context.variables.get('X')).toEqual({ value: 0, type: 'number' })
    })

    it('should store string values directly', () => {
      evaluator.evaluateExpression.mockReturnValue('hello')
      const cst = { name: 'expression', children: {} }

      service.setVariableFromExpressionCst('S$', cst as never)

      expect(context.variables.get('S$')).toEqual({ value: 'hello', type: 'string' })
    })
  })

  describe('setArrayElement', () => {
    it('should create array and set element if array does not exist', () => {
      service.setArrayElement('A', [0], 42)

      expect(context.arrays.has('A')).toEqual(true)
      expect((context.arrays.get('A') as BasicScalarValue[])?.[0]).toEqual(42)
    })

    it('should set element in existing array', () => {
      service.setArrayElement('A', [0], 10)
      service.setArrayElement('A', [1], 20)

      expect(context.arrays.get('A')).toEqual([10, 20])
    })

    it('should set nested array elements (2D)', () => {
      service.setArrayElement('M', [0, 0], 1)
      service.setArrayElement('M', [0, 1], 2)
      service.setArrayElement('M', [1, 0], 3)

      const mArray = context.arrays.get('M') as BasicScalarValue[][]
      expect(mArray?.[0]).toEqual([1, 2])
      expect(mArray?.[1]?.[0]).toEqual(3)
    })

    it('should handle string array elements', () => {
      service.setArrayElement('A$', [0], 'hello')

      expect((context.arrays.get('A$') as BasicScalarValue[])?.[0]).toEqual('hello')
    })

    it('should floor index values', () => {
      service.setArrayElement('A', [2.7], 99)

      expect((context.arrays.get('A') as BasicScalarValue[])?.[2]).toEqual(99)
    })
  })

  describe('setArrayElementFromExpressionsCst', () => {
    it('should evaluate index and value expressions then set element', () => {
      const indexCst1 = { name: 'expr1', children: {} }
      const indexCst2 = { name: 'expr2', children: {} }
      const valueCst = { name: 'valueExpr', children: {} }

      evaluator.evaluateExpression
        .mockReturnValueOnce(1) // first index
        .mockReturnValueOnce(2) // second index
        .mockReturnValueOnce(42) // value

      service.setArrayElementFromExpressionsCst('M', [indexCst1, indexCst2] as never, valueCst as never)

      expect((context.arrays.get('M') as BasicScalarValue[][])?.[1]?.[2]).toEqual(42)
    })

    it('should convert boolean values to numbers', () => {
      const indexCst = { name: 'expr1', children: {} }
      const valueCst = { name: 'valueExpr', children: {} }

      evaluator.evaluateExpression
        .mockReturnValueOnce(0) // index
        .mockReturnValueOnce(true) // value (boolean)

      service.setArrayElementFromExpressionsCst('A', [indexCst] as never, valueCst as never)

      expect((context.arrays.get('A') as BasicScalarValue[])?.[0]).toEqual(1)
    })
  })

  describe('getArrayElement', () => {
    it('should return 0 for non-existent array', () => {
      expect(service.getArrayElement('NOEXIST', [0])).toEqual(0)
    })

    it('should return element value for existing 1D array', () => {
      service.setArrayElement('A', [0], 10)
      service.setArrayElement('A', [2], 30)

      expect(service.getArrayElement('A', [0])).toEqual(10)
      expect(service.getArrayElement('A', [2])).toEqual(30)
    })

    it('should return 0 for uninitialized element', () => {
      service.setArrayElement('A', [0], 10)

      expect(service.getArrayElement('A', [5])).toEqual(0)
    })

    it('should navigate nested arrays (2D)', () => {
      service.setArrayElement('M', [1, 2], 99)

      expect(service.getArrayElement('M', [1, 2])).toEqual(99)
    })

    it('should return 0 when navigating through undefined nesting', () => {
      service.setArrayElement('M', [0], 5) // 1D array

      expect(service.getArrayElement('M', [0, 1])).toEqual(0)
    })

    it('should floor index values when reading', () => {
      service.setArrayElement('A', [3], 77)

      expect(service.getArrayElement('A', [3.9])).toEqual(77)
    })
  })

  describe('createArray', () => {
    it('should create 1D numeric array initialized to 0', () => {
      service.createArray('A', [5])

      const arr = context.arrays.get('A')
      expect(arr).toEqual([0, 0, 0, 0, 0, 0]) // size = highestIndex + 1 = 6
    })

    it('should create 1D string array initialized to empty strings', () => {
      service.createArray('A$', [3])

      const arr = context.arrays.get('A$')
      expect(arr).toEqual(['', '', '', '']) // size = highestIndex + 1 = 4
    })

    it('should create 2D numeric array', () => {
      service.createArray('M', [2, 3])

      const arr = context.arrays.get('M')
      expect(arr).toEqual([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ])
    })

    it('should create 2D string array', () => {
      service.createArray('M$', [1, 1])

      const arr = context.arrays.get('M$')
      expect(arr).toEqual([
        ['', ''],
        ['', ''],
      ])
    })

    it('should overwrite existing array', () => {
      service.setArrayElement('A', [0], 99)
      service.createArray('A', [2])

      const arr = context.arrays.get('A')
      expect(arr).toEqual([0, 0, 0])
    })
  })

  describe('hasVariable', () => {
    it('should return false for non-existent variable', () => {
      expect(service.hasVariable('X')).toEqual(false)
    })

    it('should return true for existing variable', () => {
      service.setVariable('X', 42)

      expect(service.hasVariable('X')).toEqual(true)
    })
  })

  describe('hasArray', () => {
    it('should return false for non-existent array', () => {
      expect(service.hasArray('A')).toEqual(false)
    })

    it('should return true for existing array', () => {
      service.createArray('A', [5])

      expect(service.hasArray('A')).toEqual(true)
    })
  })

  describe('getVariableNames', () => {
    it('should return empty array when no variables', () => {
      expect(service.getVariableNames()).toEqual([])
    })

    it('should return all variable names', () => {
      service.setVariable('X', 1)
      service.setVariable('Y', 2)
      service.setVariable('NAME$', 'Test')

      const names = service.getVariableNames().sort()
      expect(names).toEqual(['NAME$', 'X', 'Y'])
    })
  })

  describe('getArrayNames', () => {
    it('should return empty array when no arrays', () => {
      expect(service.getArrayNames()).toEqual([])
    })

    it('should return all array names', () => {
      service.createArray('A', [5])
      service.createArray('B', [3])

      const names = service.getArrayNames().sort()
      expect(names).toEqual(['A', 'B'])
    })
  })

  describe('clearVariables', () => {
    it('should clear all variables', () => {
      service.setVariable('X', 1)
      service.setVariable('Y', 2)

      service.clearVariables()

      expect(context.variables.size).toEqual(0)
      expect(service.hasVariable('X')).toEqual(false)
    })
  })

  describe('clearArrays', () => {
    it('should clear all arrays', () => {
      service.createArray('A', [5])
      service.createArray('B', [3])

      service.clearArrays()

      expect(context.arrays.size).toEqual(0)
      expect(service.hasArray('A')).toEqual(false)
    })
  })
})
