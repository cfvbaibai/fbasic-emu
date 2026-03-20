import { beforeEach, describe, expect, it } from 'vitest'

import { createSharedDisplayBuffer } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { BasicInterpreter } from '@/core/BasicInterpreter'
import { EXECUTION_LIMITS } from '@/core/constants'
import { getSampleCode } from '@/core/samples'

import { SharedBufferTestAdapter } from '../adapters/SharedBufferTestAdapter'
import {
  captureDisplaySnapshotV1,
  expectDisplaySnapshotToMatchFixture,
  rowTextFromSnapshot,
  waitForSequenceStable,
} from './displaySnapshotTestUtils'

interface DeterministicCase {
  sampleKey: string
  fixtureName: string
}

const DETERMINISTIC_CASES: DeterministicCase[] = [
  { sampleKey: 'hello', fixtureName: 'hello-complete' },
  { sampleKey: 'basic', fixtureName: 'basic-complete' },
  { sampleKey: 'variables', fixtureName: 'variables-complete' },
  { sampleKey: 'screen', fixtureName: 'screen-complete' },
  { sampleKey: 'screenFill', fixtureName: 'screen-fill-complete' },
  { sampleKey: 'spriteBasic', fixtureName: 'sprite-basic-complete' },
]

describe('Sample Display Snapshot Integration', () => {
  let adapter: SharedBufferTestAdapter
  let accessor: SharedDisplayBufferAccessor
  let sharedBuffer: SharedArrayBuffer

  beforeEach(() => {
    const { buffer } = createSharedDisplayBuffer()
    sharedBuffer = buffer
    adapter = new SharedBufferTestAdapter()
    adapter.setSharedDisplayBuffer(sharedBuffer)
    adapter.configure({ enableDisplayBuffer: true })
    accessor = new SharedDisplayBufferAccessor(sharedBuffer)
  })

  for (const testCase of DETERMINISTIC_CASES) {
    it(`matches fixture for ${testCase.sampleKey} sample`, async () => {
      const code = getSampleCode(testCase.sampleKey)?.code
      if (!code) throw new Error(`Sample code "${testCase.sampleKey}" not found`)

      const interpreter = new BasicInterpreter({
        maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_TEST,
        maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST,
        strictMode: false,
        enableDebugMode: false,
        suppressOkPrompt: true,
        deviceAdapter: adapter,
        sharedDisplayBuffer: sharedBuffer,
        sharedAnimationBuffer: sharedBuffer,
      })

      const result = await interpreter.execute(code)
      expect(result.success).toBe(true)
      expect(result.errors).toEqual([])

      await waitForSequenceStable(accessor, { stablePolls: 2, intervalMs: 10, timeoutMs: 600 })
      const snapshot = captureDisplaySnapshotV1(accessor, {
        sampleKey: testCase.sampleKey,
        checkpoint: 'complete',
      })
      expectDisplaySnapshotToMatchFixture(snapshot, testCase.fixtureName)
    })
  }

  it('captures interactive sample using deterministic input checkpoint', async () => {
    const code = getSampleCode('joystick')?.code
    if (!code) throw new Error('Sample code "joystick" not found')

    // First STRIG read returns 1, so sample exits via line 100 END deterministically.
    adapter.pushStrigState(0, 1)

    const loopInterpreter = new BasicInterpreter({
      maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_TEST,
      maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST,
      strictMode: false,
      enableDebugMode: false,
      suppressOkPrompt: true,
      deviceAdapter: adapter,
      sharedDisplayBuffer: sharedBuffer,
      sharedAnimationBuffer: sharedBuffer,
    })

    const result = await loopInterpreter.execute(code)

    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    await waitForSequenceStable(accessor, { stablePolls: 2, intervalMs: 20, timeoutMs: 1000 })
    const snapshot = captureDisplaySnapshotV1(accessor, {
      sampleKey: 'joystick',
      checkpoint: 'stopped',
    })

    expect(rowTextFromSnapshot(snapshot, 0)).toMatch(/JOYSTICK TEST/)
    expect(snapshot.sequence).toBeGreaterThan(0)
  })
})
