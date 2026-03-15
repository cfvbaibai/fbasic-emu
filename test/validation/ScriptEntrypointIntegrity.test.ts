import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  collectScriptEntrypoints,
  findMissingScriptEntrypoints,
} from '../../scripts/validation/script-entrypoint-integrity'

describe('script entrypoint integrity', () => {
  it('collects ts/js entrypoints from package scripts', () => {
    const scripts = {
      validA: 'tsx scripts/dev/visualize-cst.ts',
      validB: 'node scripts/tools/check.js --strict',
      noFile: 'vite build',
    }

    const entrypoints = collectScriptEntrypoints(scripts)

    expect(entrypoints.map((entry) => entry.entrypoint)).toEqual([
      'scripts/dev/visualize-cst.ts',
      'scripts/tools/check.js',
    ])
  })

  it('reports missing script targets', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'script-entrypoint-'))
    try {
      const existingDir = join(rootDir, 'scripts', 'dev')
      mkdirSync(existingDir, { recursive: true })
      writeFileSync(join(existingDir, 'exists.ts'), 'export {}')

      const scripts = {
        ok: 'tsx scripts/dev/exists.ts',
        broken: 'tsx scripts/dev/missing.ts',
      }

      const missing = findMissingScriptEntrypoints(scripts, rootDir)
      expect(missing).toHaveLength(1)
      expect(missing[0]?.scriptName).toBe('broken')
      expect(missing[0]?.entrypoint).toBe('scripts/dev/missing.ts')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
