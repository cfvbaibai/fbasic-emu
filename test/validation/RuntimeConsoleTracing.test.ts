import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const RUNTIME_TRACE_FILES = [
  'src/core/animation/AnimationManager.ts',
  'src/core/workers/WebWorkerInterpreter.ts',
  'src/core/workers/AnimationWorker.ts',
  'src/features/ide/composables/useAnimationWorker.ts',
  'src/features/ide/composables/useKonvaScreenRenderer.ts',
] as const

describe('Runtime tracing policy', () => {
  test.each(RUNTIME_TRACE_FILES)('%s has no raw console.log tracing', (relativePath) => {
    const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8')
    expect(source).not.toMatch(/\bconsole\.log\s*\(/)
  })
})
