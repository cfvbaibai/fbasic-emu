/**
 * Sound Test Cases for PLAY Command Verification
 *
 * Each test case verifies a specific feature of the F-BASIC PLAY command.
 * Human testers listen and record results for AI to analyze.
 */

import type { SoundTestCase, TestResultRecord } from './soundTestTypes'
import {
  BASIC_NOTES_TESTS,
  OCTAVES_TESTS,
  SHARP_NOTES_TESTS,
} from './testCasesNotes'
import {
  COMBINED_TESTS,
  DUTY_CYCLE_TESTS,
  ENVELOPE_TESTS,
  MULTI_CHANNEL_TESTS,
  VOLUME_TESTS,
} from './testCasesTimbre'
import {
  LENGTH_CODES_TESTS,
  RESTS_TESTS,
  TEMPO_TESTS,
} from './testCasesTiming'

export type { SoundTestCase,TestResult, TestResultRecord } from './soundTestTypes'

/**
 * All test cases for PLAY command verification
 */
export const SOUND_TEST_CASES: SoundTestCase[] = [
  ...BASIC_NOTES_TESTS,
  ...OCTAVES_TESTS,
  ...TEMPO_TESTS,
  ...LENGTH_CODES_TESTS,
  ...SHARP_NOTES_TESTS,
  ...RESTS_TESTS,
  ...DUTY_CYCLE_TESTS,
  ...ENVELOPE_TESTS,
  ...VOLUME_TESTS,
  ...MULTI_CHANNEL_TESTS,
  ...COMBINED_TESTS,
]

/**
 * Get test cases grouped by category
 */
export function getTestCasesByCategory(): Map<string, SoundTestCase[]> {
  const grouped = new Map<string, SoundTestCase[]>()
  for (const testCase of SOUND_TEST_CASES) {
    const cases = grouped.get(testCase.category) ?? []
    cases.push(testCase)
    grouped.set(testCase.category, cases)
  }
  return grouped
}

/**
 * Generate a summary report from test results
 */
export function generateReport(results: Map<string, TestResultRecord>): string {
  const lines: string[] = []
  lines.push('# PLAY Command Sound Test Results')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')

  const byCategory = getTestCasesByCategory()
  let passCount = 0
  let failCount = 0
  let untestedCount = 0

  for (const [category, cases] of byCategory) {
    lines.push(`## ${category}`)
    lines.push('')

    for (const tc of cases) {
      const result = results.get(tc.id)
      const status = result?.result ?? 'untested'
      const notes = result?.notes?.trim() ?? ''

      if (status === 'pass') passCount++
      else if (status === 'fail') failCount++
      else untestedCount++

      const statusIcon =
        status === 'pass' ? '[PASS]' : status === 'fail' ? '[FAIL]' : '[----]'
      lines.push(`### ${statusIcon} ${tc.name}`)
      lines.push(`- Music String: \`${tc.musicString}\``)
      lines.push(`- Expected: ${tc.expectedBehavior}`)
      lines.push(`- Result: **${status.toUpperCase()}**`)
      if (notes) {
        lines.push(`- Notes: ${notes}`)
      }
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Passed: ${passCount}`)
  lines.push(`- Failed: ${failCount}`)
  lines.push(`- Untested: ${untestedCount}`)
  lines.push(`- Total: ${passCount + failCount + untestedCount}`)

  return lines.join('\n')
}
