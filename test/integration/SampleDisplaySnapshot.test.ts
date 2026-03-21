import { beforeEach, describe, expect, it } from 'vitest'

import { createSharedDisplayBuffer } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { BasicInterpreter } from '@/core/BasicInterpreter'
import { EXECUTION_LIMITS } from '@/core/constants'
import { getSampleCode, getSampleCodeKeys } from '@/core/samples'

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

type SnapshotCoverageOptOuts = Record<string, string>

const DETERMINISTIC_CASES: DeterministicCase[] = [
  { sampleKey: 'hello', fixtureName: 'hello-complete' },
  { sampleKey: 'basic', fixtureName: 'basic-complete' },
  { sampleKey: 'variables', fixtureName: 'variables-complete' },
  { sampleKey: 'screen', fixtureName: 'screen-complete' },
  { sampleKey: 'screenFill', fixtureName: 'screen-fill-complete' },
  { sampleKey: 'spriteBasic', fixtureName: 'sprite-basic-complete' },
]

// Coverage policy: every sample must be either fixture-covered or intentionally opted out.
const SNAPSHOT_COVERAGE_OPT_OUTS: SnapshotCoverageOptOuts = {
  input: 'Requires user input; non-deterministic completion flow',
  beep: 'Audio-only sample; display fixture adds limited value',
  pause: 'Timing-sensitive countdown; deterministic checkpoint not yet defined',
  loops: 'Console-output focused; display fixture not a useful signal',
  conditionals: 'Console-output focused; display fixture not a useful signal',
  subroutines: 'Console-output focused; display fixture not a useful signal',
  dataRead: 'Console-output focused; display fixture not a useful signal',
  arrays: 'Console-output focused; display fixture not a useful signal',
  allChars: 'Large matrix snapshot baseline not yet curated',
  bgItems: 'High-surface BG tile fixture baseline not yet curated',
  bgView: 'BG fixture baseline pending',
  bgViewTitle: 'BG fixture baseline pending',
  bgViewPlatform: 'BG fixture baseline pending',
  cursorPosition: 'Cursor movement timing/checkpoint policy pending',
  screenRead: 'Depends on runtime screen reads; checkpoint policy pending',
  printableArea: 'BG layer interaction baseline pending',
  spriteAnimation: 'Animation timeline sample; stable checkpoint policy pending',
  spriteControl: 'Interactive-style control flow; deterministic checkpoint pending',
  spriteTableB: 'Sprite/BG asset-heavy baseline pending',
  spriteInteractive: 'Interactive joystick input required',
  joystick: 'Covered by deterministic input checkpoint assertion test',
  inkeyTest: 'Keyboard input required',
  inkeyBlockingTest: 'Blocking keyboard input required',
  beepInteractive: 'Interactive key/button input required',
  shooting: 'Game loop sample; deterministic checkpoint policy pending',
  knight: 'Game loop sample; deterministic checkpoint policy pending',
  superMemory: 'Game loop sample; deterministic checkpoint policy pending',
  ufo: 'Game loop sample; deterministic checkpoint policy pending',
  route66: 'Game loop sample; deterministic checkpoint policy pending',
  typeMaster: 'Interactive typing sample',
  turtle: 'Game loop sample; deterministic checkpoint policy pending',
  card: 'Game loop sample; deterministic checkpoint policy pending',
  scrSample: 'Game loop sample; deterministic checkpoint policy pending',
  musicPlayDemo: 'Audio-focused sample; display state not primary output',
  musicTwinkle: 'Audio-focused sample; display state not primary output',
  musicOdeToJoy: 'Audio-focused sample; display state not primary output',
  musicMaryHadALittleLamb: 'Audio-focused sample; display state not primary output',
  musicHappyBirthday: 'Audio-focused sample; display state not primary output',
  musicJingleBells: 'Audio-focused sample; display state not primary output',
  musicScale: 'Audio-focused sample; display state not primary output',
  musicArpeggio: 'Audio-focused sample; display state not primary output',
  musicThreeChannel: 'Audio-focused sample; display state not primary output',
  musicPlayer: 'Interactive menu sample; user selection required',
  musicLoopDemo: 'Audio-focused looping sample; deterministic stop checkpoint pending',
  musicFurElise2Ch: 'Audio-focused sample; display state not primary output',
  musicRocknRouge: 'Audio-focused sample; display state not primary output',
}

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

  it('requires snapshot coverage policy for every sample key', () => {
    const fixtureCoveredKeys = new Set(DETERMINISTIC_CASES.map(testCase => testCase.sampleKey))
    const coveredByPolicy = new Set([...fixtureCoveredKeys, ...Object.keys(SNAPSHOT_COVERAGE_OPT_OUTS)])
    const sampleKeys = getSampleCodeKeys()
    const missing = sampleKeys.filter(sampleKey => !coveredByPolicy.has(sampleKey))
    expect(missing).toEqual([])
  })
})
