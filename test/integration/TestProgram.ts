/**
 * Unified Test-Program Helper
 *
 * A single Vitest entry point that combines: load program, seed BG data,
 * schedule inputs, execute, and assert screen state.
 *
 * This ties together the existing test infrastructure into a convenient,
 * composable API for integration tests.
 *
 * ## Usage
 *
 * ```ts
 * const tp = TestProgram.fromSample('hello')
 * const result = await tp.run()
 * expect(result.success).toBe(true)
 * tp.expectFixture('hello-complete')
 * ```
 *
 * ```ts
 * const tp = TestProgram.fromCode('10 PRINT "HI"')
 * tp.seedInput(['42'])                    // queue INPUT responses
 * tp.pushStrigState(0, 1)                 // queue STRIG event
 * const result = await tp.run()
 * tp.expectRowText(0, 'HI')
 * ```
 *
 * ## Future Extensions (pending sub-issues)
 *
 * - #405: `seedBgData()` — BG tile pre-seeding
 * - #406: `scheduleInput()` — timed input injection during execution
 * - #407: screen assertion extensions (cursor, scalars, sprites)
 */

import { expect } from 'vitest'

import { createSharedDisplayBuffer } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { BasicInterpreter } from '@/core/BasicInterpreter'
import { EXECUTION_LIMITS } from '@/core/constants'
import { getSampleCode } from '@/core/samples'

import { SharedBufferTestAdapter } from '../adapters/SharedBufferTestAdapter'
import {
  captureDisplaySnapshotV1,
  type DisplaySnapshotV1,
  expectDisplaySnapshotToMatchFixture,
  rowTextFromSnapshot,
  waitForSequenceStable,
  type WaitForStableOptions,
} from './displaySnapshotTestUtils'

// ============================================================================
// Configuration Types
// ============================================================================

/** Options for creating a TestProgram instance. */
export interface TestProgramOptions {
  /** Maximum interpreter iterations (default: EXECUTION_LIMITS.MAX_ITERATIONS_TEST) */
  maxIterations?: number
  /** Maximum output lines before stopping (default: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST) */
  maxOutputLines?: number
  /** Suppress the "OK" prompt on successful completion (default: true) */
  suppressOkPrompt?: boolean
}

/** Options for the `run()` method. */
export interface RunOptions {
  /** Options for waitForSequenceStable (default: { stablePolls: 3, intervalMs: 20, timeoutMs: 1000 }) */
  stableOptions?: WaitForStableOptions
}

/** The result of `run()`, bundling execution result with captured snapshot. */
export interface TestProgramResult {
  /** Raw interpreter execution result. */
  executionResult: Awaited<ReturnType<BasicInterpreter['execute']>>
  /** Display snapshot captured after execution (null if capture failed). */
  snapshot: DisplaySnapshotV1 | null
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_OPTIONS: Required<TestProgramOptions> = {
  maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_TEST,
  maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_TEST,
  suppressOkPrompt: true,
}

const DEFAULT_STABLE_OPTIONS: WaitForStableOptions = {
  stablePolls: 3,
  intervalMs: 20,
  timeoutMs: 1000,
}

// ============================================================================
// TestProgram Class
// ============================================================================

/**
 * A unified test helper that encapsulates the full lifecycle of running
 * an F-BASIC program in an integration test:
 *
 * 1. Set up shared buffer + adapter
 * 2. Seed inputs (joystick, keyboard, INPUT responses)
 * 3. Execute the program
 * 4. Capture display state for assertions
 */
export class TestProgram {
  private readonly adapter: SharedBufferTestAdapter
  private readonly accessor: SharedDisplayBufferAccessor
  private readonly sharedBuffer: SharedArrayBuffer
  private readonly options: Required<TestProgramOptions>
  private code: string
  private sampleKey: string | null

  private constructor(code: string, options: TestProgramOptions, sampleKey: string | null) {
    this.code = code
    this.sampleKey = sampleKey
    this.options = { ...DEFAULT_OPTIONS, ...options }

    // Create shared buffer infrastructure
    const { buffer } = createSharedDisplayBuffer()
    this.sharedBuffer = buffer

    // Set up adapter with display buffer sync
    this.adapter = new SharedBufferTestAdapter()
    this.adapter.setSharedDisplayBuffer(this.sharedBuffer)
    this.adapter.configure({ enableDisplayBuffer: true })

    // Create accessor for reading buffer state
    this.accessor = new SharedDisplayBufferAccessor(this.sharedBuffer)
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create a TestProgram from a built-in sample key.
   *
   * @param key - Sample key (e.g. 'hello', 'basic', 'spriteBasic')
   * @param options - Optional configuration overrides
   * @throws Error if the sample key is not found
   */
  static fromSample(key: string, options: TestProgramOptions = {}): TestProgram {
    const sample = getSampleCode(key)
    if (!sample) {
      throw new Error(`Sample code "${key}" not found`)
    }
    return new TestProgram(sample.code, options, key)
  }

  /**
   * Create a TestProgram from raw F-BASIC source code.
   *
   * @param code - F-BASIC source code to execute
   * @param options - Optional configuration overrides
   */
  static fromCode(code: string, options: TestProgramOptions = {}): TestProgram {
    return new TestProgram(code, options, null)
  }

  // ==========================================================================
  // Input Seeding (before run)
  // ==========================================================================

  /**
   * Queue responses for INPUT/LINPUT statements.
   * Each call to requestInput pops the next entry from this queue.
   *
   * @param values - Array of string responses (one per INPUT prompt)
   */
  seedInput(values: string[]): this {
    this.adapter.inputResponseQueue.push(values)
    return this
  }

  /**
   * Push a STRIG (trigger button) event for a joystick.
   *
   * @param joystickId - Joystick number (0 or 1)
   * @param state - Button state value
   */
  pushStrigState(joystickId: number, state: number): this {
    this.adapter.pushStrigState(joystickId, state)
    return this
  }

  /**
   * Set STICK (directional pad) state for a joystick.
   *
   * @param joystickId - Joystick number (0 or 1)
   * @param state - Direction bitmask
   */
  setStickState(joystickId: number, state: number): this {
    this.adapter.setStickState(joystickId, state)
    return this
  }

  /**
   * Queue a key response for waitForInkey (blocking INKEY$).
   *
   * @param key - Single character to return
   */
  queueInkey(key: string): this {
    this.adapter.waitForInkeyQueue.push(key)
    return this
  }

  /**
   * Set the current keyboard state for non-blocking INKEY$.
   *
   * @param keyChar - Character to report as pressed
   */
  setInkeyState(keyChar: string): this {
    this.adapter.setInkeyStateForTest(keyChar)
    return this
  }

  // ==========================================================================
  // Execution
  // ==========================================================================

  /**
   * Execute the F-BASIC program and capture the display snapshot.
   *
   * After execution, waits for the shared buffer sequence to stabilize
   * before capturing the display state.
   *
   * @param runOptions - Optional run-time options (stable wait tuning)
   * @returns Execution result with captured snapshot
   */
  async run(runOptions: RunOptions = {}): Promise<TestProgramResult> {
    const interpreter = new BasicInterpreter({
      maxIterations: this.options.maxIterations,
      maxOutputLines: this.options.maxOutputLines,
      strictMode: false,
      enableDebugMode: false,
      suppressOkPrompt: this.options.suppressOkPrompt,
      deviceAdapter: this.adapter,
      sharedDisplayBuffer: this.sharedBuffer,
      sharedAnimationBuffer: this.sharedBuffer,
    })

    const executionResult = await interpreter.execute(this.code)

    let snapshot: DisplaySnapshotV1 | null = null
    try {
      await waitForSequenceStable(this.accessor, runOptions.stableOptions ?? DEFAULT_STABLE_OPTIONS)
      snapshot = captureDisplaySnapshotV1(this.accessor, {
        sampleKey: this.sampleKey ?? '__custom__',
        checkpoint: 'complete',
      })
    } catch {
      // Snapshot capture is best-effort; tests can check for null
    }

    const result: TestProgramResult = { executionResult, snapshot }
    this._lastResult = result
    return result
  }

  // ==========================================================================
  // Screen Assertions
  // ==========================================================================

  /**
   * Assert that the captured display snapshot matches a fixture file.
   *
   * @param fixtureName - Name of the fixture file (without .json extension)
   * @throws AssertionError if snapshot is null or does not match fixture
   */
  expectFixture(fixtureName: string): void {
    if (!this.lastResult?.snapshot) {
      throw new Error('No snapshot available. Call run() first.')
    }
    expectDisplaySnapshotToMatchFixture(this.lastResult.snapshot, fixtureName)
  }

  /**
   * Assert text content of a specific row in the display snapshot.
   *
   * @param row - Row index (0-based)
   * @param expected - Expected text (partial match via RegExp or exact match)
   */
  expectRowText(row: number, expected: string | RegExp): void {
    if (!this.lastResult?.snapshot) {
      throw new Error('No snapshot available. Call run() first.')
    }
    const text = rowTextFromSnapshot(this.lastResult.snapshot, row)
    if (expected instanceof RegExp) {
      expect(text).toMatch(expected)
    } else {
      expect(text).toContain(expected)
    }
  }

  /**
   * Assert that execution completed successfully with no errors.
   */
  expectSuccess(): void {
    if (!this.lastResult) {
      throw new Error('No result available. Call run() first.')
    }
    expect(this.lastResult.executionResult.success).toBe(true)
    expect(this.lastResult.executionResult.errors).toEqual([])
  }

  // ==========================================================================
  // Accessors (for advanced assertions)
  // ==========================================================================

  /**
   * Get the raw adapter for advanced assertions (print outputs, joystick state, etc.).
   */
  getAdapter(): SharedBufferTestAdapter {
    return this.adapter
  }

  /**
   * Get the shared display buffer accessor for low-level buffer inspection.
   */
  getAccessor(): SharedDisplayBufferAccessor {
    return this.accessor
  }

  /**
   * Get the result from the last run() call.
   */
  get lastResult(): TestProgramResult | null {
    return this._lastResult
  }

  private _lastResult: TestProgramResult | null = null
}
