import { describe, expect, it } from 'vitest'

import { resolveDefaultLogLevel } from '@/shared/logger'

describe('resolveDefaultLogLevel', () => {
  it('defaults to warn when verbose env flag is unset', () => {
    expect(resolveDefaultLogLevel({})).toBe('warn')
  })

  it('uses debug when FBASIC_VERBOSE_LOGS=1', () => {
    expect(resolveDefaultLogLevel({ FBASIC_VERBOSE_LOGS: '1' })).toBe('debug')
  })
})
