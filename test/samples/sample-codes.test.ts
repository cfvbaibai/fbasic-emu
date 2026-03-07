import { describe, expect, it } from 'vitest'

import { FBasicParser } from '@/core/parser/FBasicParser'
import { getAllSampleCodes } from '@/core/samples'

describe('Sample Code Parser Tests', () => {
  const parser = new FBasicParser()

  it('should parse all sample codes without errors', async () => {
    const samples = getAllSampleCodes()

    for (const sample of samples) {
      const result = await parser.parse(sample.code)
      const errors = result.errors ?? []
      if (errors.length > 0) {
        console.log(`\n=== ${sample.name} (${sample.category}) ===`)
        errors.forEach(e => console.log(`  Line ${e.location?.start?.line ?? '?'}: ${e.message}`))
      }
      expect(errors, `${sample.name} should have no errors`).toHaveLength(0)
    }
  })
})
