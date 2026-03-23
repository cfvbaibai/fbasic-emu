/**
 * Verification test for all sample codes
 * Ensures all sample programs parse correctly with the F-BASIC parser
 */

import { describe, expect,test } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'
import { getAllSampleCodes, getSampleCode, getSampleCodeKeys, SAMPLE_CODES } from '@/core/samples'

describe('Sample Codes Syntax Verification', () => {
  const parser = new FBasicParser()

  test('getAllSampleCodes returns all samples', () => {
    const samples = getAllSampleCodes()
    expect(samples.length).toBeGreaterThan(0)
  })

  test('getSampleCodeKeys returns all keys', () => {
    const keys = getSampleCodeKeys()
    expect(keys.length).toBeGreaterThan(0)
  })

  // Dynamically test all sample codes parse correctly
  const allKeys = Object.keys(SAMPLE_CODES)

  for (const key of allKeys) {
    test(`"${key}" (${SAMPLE_CODES[key]?.category}) parses successfully`, async () => {
      const sample = SAMPLE_CODES[key]
      if (!sample) {
        throw new Error(`Sample ${key} not found`)
      }
      const result = await parser.parse(sample.code)
      expect(result.success).toBe(true)
      expect(result.cst).toBeDefined()
    })
  }
})

describe('New screen function sample codes', () => {
  const newSampleKeys = ['cursorPosition', 'screenRead', 'beep', 'beepInteractive']

  test('all new sample code keys exist', () => {
    const allKeys = getSampleCodeKeys()
    for (const key of newSampleKeys) {
      expect(allKeys).toEqual(expect.arrayContaining([key]))
    }
  })

  for (const key of newSampleKeys) {
    test(`${key} sample has correct metadata`, () => {
      const sample = getSampleCode(key)
      expect(sample).toBeDefined()
      expect(sample?.key).toBeTruthy()
      expect(sample?.code).toBeTruthy()
      expect(sample?.category).toBeTruthy()
    })
  }
})
