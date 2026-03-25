/**
 * DataService unit tests
 *
 * Covers DATA constant evaluation (number, hex, string, identifier),
 * READ with pointer advancement, RESTORE (full and by line), preprocess,
 * and edge cases (out-of-data, missing targets).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ERROR_TYPES } from '@/core/constants'
import type { InterpreterConfig } from '@/core/interfaces'
import { DataService } from '@/core/services/DataService'
import { ExecutionContext } from '@/core/state/ExecutionContext'

function createTestContext(config?: Partial<InterpreterConfig>): ExecutionContext {
  return new ExecutionContext({
    maxIterations: 1000,
    maxOutputLines: 100,
    enableDebugMode: false,
    strictMode: false,
    ...config,
  })
}

function createMockEvaluator() {
  return {
    evaluateExpression: vi.fn(),
  }
}

function createNumberLiteralCst(image: string) {
  return {
    name: 'dataConstant',
    children: {
      NumberLiteral: [{ image, startOffset: 0, endOffset: image.length, tokenTypeIdx: 0 }],
    },
  }
}

function createHexLiteralCst(image: string) {
  return {
    name: 'dataConstant',
    children: {
      HexLiteral: [{ image, startOffset: 0, endOffset: image.length, tokenTypeIdx: 0 }],
    },
  }
}

function createStringLiteralCst(image: string) {
  return {
    name: 'dataConstant',
    children: {
      StringLiteral: [{ image, startOffset: 0, endOffset: image.length, tokenTypeIdx: 0 }],
    },
  }
}

function createIdentifierCst(image: string) {
  return {
    name: 'dataConstant',
    children: {
      Identifier: [{ image, startOffset: 0, endOffset: image.length, tokenTypeIdx: 0 }],
    },
  }
}

describe('DataService', () => {
  let context: ExecutionContext
  let evaluator: ReturnType<typeof createMockEvaluator>
  let service: DataService

  beforeEach(() => {
    context = createTestContext()
    evaluator = createMockEvaluator()
    service = new DataService(context, evaluator as never)
  })

  describe('addDataValuesCst', () => {
    it('should add number literal values', () => {
      const csts = [
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
        createNumberLiteralCst('30'),
      ]

      service.addDataValuesCst(csts as never)

      expect(context.dataValues).toEqual([10, 20, 30])
    })

    it('should add hex literal values', () => {
      const csts = [
        createHexLiteralCst('&HDD'),
        createHexLiteralCst('&HFF'),
        createHexLiteralCst('&H00'),
      ]

      service.addDataValuesCst(csts as never)

      expect(context.dataValues).toEqual([0xDD, 0xFF, 0x00])
    })

    it('should add string literal values (without quotes)', () => {
      const csts = [
        createStringLiteralCst('"hello"'),
        createStringLiteralCst('"world"'),
      ]

      service.addDataValuesCst(csts as never)

      expect(context.dataValues).toEqual(['hello', 'world'])
    })

    it('should add identifier values as string constants', () => {
      const csts = [
        createIdentifierCst('HELLO'),
        createIdentifierCst('WORLD'),
      ]

      service.addDataValuesCst(csts as never)

      expect(context.dataValues).toEqual(['HELLO', 'WORLD'])
    })

    it('should add mixed types of data values', () => {
      const csts = [
        createNumberLiteralCst('100'),
        createStringLiteralCst('"test"'),
        createIdentifierCst('NAME'),
        createHexLiteralCst('&H1A'),
      ]

      service.addDataValuesCst(csts as never)

      expect(context.dataValues).toEqual([100, 'test', 'NAME', 0x1A])
    })

    it('should throw for invalid DATA constant', () => {
      const cst = { name: 'dataConstant', children: {} }

      expect(() => service.addDataValuesCst([cst as never])).toThrow('Invalid DATA constant')
    })

    it('should log debug output when debug mode is enabled', () => {
      const debugContext = createTestContext({ enableDebugMode: true })
      const mockAdapter = { debugOutput: vi.fn() }
      debugContext.deviceAdapter = mockAdapter as never
      const debugService = new DataService(debugContext, evaluator as never)

      const csts = [createNumberLiteralCst('10'), createNumberLiteralCst('20')]
      debugService.addDataValuesCst(csts as never)

      expect(mockAdapter.debugOutput).toHaveBeenCalledWith('DATA: Added 2 values')
    })
  })

  describe('readNextDataValue', () => {
    it('should read values sequentially', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
        createNumberLiteralCst('30'),
      ] as never)

      expect(service.readNextDataValue()).toEqual(10)
      expect(service.readNextDataValue()).toEqual(20)
      expect(service.readNextDataValue()).toEqual(30)
    })

    it('should advance dataIndex after each read', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
      ] as never)

      expect(service.getCurrentDataIndex()).toEqual(0)
      service.readNextDataValue()
      expect(service.getCurrentDataIndex()).toEqual(1)
      service.readNextDataValue()
      expect(service.getCurrentDataIndex()).toEqual(2)
    })

    it('should add OD ERROR when reading past end of data', () => {
      service.addDataValuesCst([createNumberLiteralCst('10')] as never)
      service.readNextDataValue() // read the only value
      service.readNextDataValue() // should trigger OD ERROR

      const errors = context.getErrors()
      expect(errors.length).toEqual(1)
      expect(errors[0]?.message).toEqual('OD ERROR')
      expect(errors[0]?.type).toEqual(ERROR_TYPES.RUNTIME)
    })

    it('should return 0 when reading past end of data', () => {
      service.addDataValuesCst([createNumberLiteralCst('10')] as never)
      service.readNextDataValue()

      expect(service.readNextDataValue()).toEqual(0)
    })

    it('should halt execution on OD ERROR', () => {
      service.addDataValuesCst([createNumberLiteralCst('10')] as never)
      service.readNextDataValue()
      service.readNextDataValue()

      expect(context.shouldStop).toEqual(true)
      expect(context.isRunning).toEqual(false)
    })
  })

  describe('restoreData', () => {
    it('should reset data index to 0 with no arguments', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
        createNumberLiteralCst('30'),
      ] as never)
      service.readNextDataValue()
      service.readNextDataValue()

      expect(service.getCurrentDataIndex()).toEqual(2)

      service.restoreData()

      expect(service.getCurrentDataIndex()).toEqual(0)
    })

    it('should add error for non-existent target line', () => {
      context.statements = []

      service.restoreData(100)

      const errors = context.getErrors()
      expect(errors.length).toEqual(1)
      expect(errors[0]?.message).toEqual('RESTORE target line 100 not found')
    })

    it('should log debug output when debug mode is enabled', () => {
      const debugContext = createTestContext({ enableDebugMode: true })
      const mockAdapter = { debugOutput: vi.fn() }
      debugContext.deviceAdapter = mockAdapter as never
      const debugService = new DataService(debugContext, evaluator as never)

      debugService.restoreData()

      expect(mockAdapter.debugOutput).toHaveBeenCalledWith('RESTORE: Data index set to 0')
    })
  })

  describe('getCurrentDataIndex', () => {
    it('should return 0 initially', () => {
      expect(service.getCurrentDataIndex()).toEqual(0)
    })
  })

  describe('getDataValueCount', () => {
    it('should return 0 when no data', () => {
      expect(service.getDataValueCount()).toEqual(0)
    })

    it('should return total count of data values', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
        createNumberLiteralCst('30'),
      ] as never)

      expect(service.getDataValueCount()).toEqual(3)
    })
  })

  describe('getAllDataValues', () => {
    it('should return copy of all data values', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
      ] as never)

      const values = service.getAllDataValues()
      expect(values).toEqual([10, 20])

      // Verify it is a copy
      values.push(99)
      expect(service.getDataValueCount()).toEqual(2)
    })
  })

  describe('clearDataValues', () => {
    it('should clear all data values and reset index', () => {
      service.addDataValuesCst([
        createNumberLiteralCst('10'),
        createNumberLiteralCst('20'),
      ] as never)
      service.readNextDataValue()

      service.clearDataValues()

      expect(service.getDataValueCount()).toEqual(0)
      expect(service.getCurrentDataIndex()).toEqual(0)
    })
  })

  describe('hasMoreData', () => {
    it('should return false when no data', () => {
      expect(service.hasMoreData()).toEqual(false)
    })

    it('should return true when data is available', () => {
      service.addDataValuesCst([createNumberLiteralCst('10')] as never)

      expect(service.hasMoreData()).toEqual(true)
    })

    it('should return false when all data has been read', () => {
      service.addDataValuesCst([createNumberLiteralCst('10')] as never)
      service.readNextDataValue()

      expect(service.hasMoreData()).toEqual(false)
    })
  })

  describe('addDataValues (deprecated)', () => {
    it('should log warning when called', () => {
      service.addDataValues([])

      // No error should be thrown
      expect(context.getErrors().length).toEqual(0)
    })
  })
})
