/**
 * Composable for managing sound test results
 */

import { computed, ref, shallowReactive } from 'vue'

import { logComposable } from '@/shared/logger'

import type { TestResult, TestResultRecord } from './soundTestCases'
import { generateReport, SOUND_TEST_CASES } from './soundTestCases'

export function useSoundTestResults() {
  // Test results state - use shallowReactive for the map
  const testResults = shallowReactive(new Map<string, TestResultRecord>())

  // Initialize test results
  for (const tc of SOUND_TEST_CASES) {
    testResults.set(tc.id, {
      testCaseId: tc.id,
      result: 'untested',
      notes: '',
    })
  }

  // Statistics
  const stats = computed(() => {
    let pass = 0
    let fail = 0
    let untested = 0
    for (const result of testResults.values()) {
      if (result.result === 'pass') pass++
      else if (result.result === 'fail') fail++
      else untested++
    }
    return { pass, fail, untested, total: pass + fail + untested }
  })

  // Update test result
  function setResult(testId: string, result: TestResult): void {
    const record = testResults.get(testId)
    if (record) {
      record.result = result
    }
  }

  // Update test notes
  function setNotes(testId: string, notes: string): void {
    const record = testResults.get(testId)
    if (record) {
      record.notes = notes
    }
  }

  // Get result for a test
  function getResult(testId: string): TestResultRecord | undefined {
    return testResults.get(testId)
  }

  // Mark all as pass
  function markAllPass(): void {
    for (const result of testResults.values()) {
      result.result = 'pass'
    }
  }

  // Reset all results
  function resetAll(): void {
    for (const tc of SOUND_TEST_CASES) {
      testResults.set(tc.id, {
        testCaseId: tc.id,
        result: 'untested',
        notes: '',
      })
    }
  }

  // Copy results to clipboard
  const copySuccess = ref(false)

  async function copyResults(): Promise<void> {
    const report = generateReport(testResults)
    try {
      await navigator.clipboard.writeText(report)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch (error) {
      logComposable.error('Failed to copy to clipboard:', error)
    }
  }

  return {
    testResults,
    stats,
    copySuccess,
    setResult,
    setNotes,
    getResult,
    markAllPass,
    resetAll,
    copyResults,
  }
}
