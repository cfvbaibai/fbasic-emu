// @vitest-environment jsdom
/**
 * Tests for useShareRoute composable
 *
 * Covers: decode-then-redirect logic, ProgramDecodeError handling,
 * generic error handling, and shareError ref updates.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { SharePayload } from '@/shared/utils/programCodec'
import { ProgramDecodeError } from '@/shared/utils/programCodec'

// ============================================================================
// Mocks
// ============================================================================

const { mockRouteReplace, mockRouteParams, mockDecodeProgram } = vi.hoisted(
  () => ({
    mockRouteReplace: vi.fn().mockResolvedValue(undefined),
    mockRouteParams: { data: undefined as string | undefined },
    mockDecodeProgram: vi.fn<(data: string) => Promise<SharePayload>>(),
  }),
)

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteParams,
  }),
  useRouter: () => ({
    replace: mockRouteReplace,
  }),
}))

vi.mock('@/shared/utils/programCodec', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const actual = (await importOriginal()) as {
    ProgramDecodeError: typeof ProgramDecodeError
    decodeProgram: (encoded: string) => Promise<SharePayload>
  }
  return {
    ...actual,
    // Use the mock by default; individual tests override as needed
    decodeProgram: (...args: Parameters<typeof actual.decodeProgram>) =>
      mockDecodeProgram(...args),
  }
})

// ============================================================================
// Helpers
// ============================================================================

/** Create the IDE state stub with a code ref */
function createIdeState(initialCode = '') {
  return { code: ref(initialCode) }
}

// ============================================================================
// Tests
// ============================================================================

describe('useShareRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteParams.data = undefined
  })

  // ==========================================================================
  // No share data — early return
  // ==========================================================================

  describe('when no share data is present', () => {
    it('does nothing when route.params.data is undefined', async () => {
      mockRouteParams.data = undefined

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(state.code.value).toBe('')
      expect(shareError.value).toBe('')
      expect(mockRouteReplace).not.toHaveBeenCalled()
      expect(mockDecodeProgram).not.toHaveBeenCalled()
    })

    it('does nothing when route.params.data is empty string', async () => {
      mockRouteParams.data = ''

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(state.code.value).toBe('')
      expect(shareError.value).toBe('')
      expect(mockRouteReplace).not.toHaveBeenCalled()
      expect(mockDecodeProgram).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Successful decode — sets code and redirects
  // ==========================================================================

  describe('when share data decodes successfully', () => {
    beforeEach(() => {
      // By default, mock decodeProgram to return a valid payload
      mockDecodeProgram.mockResolvedValue({ c: '10 PRINT "HELLO WORLD"' })
    })

    it('loads decoded code into state.code and redirects to Ide route', async () => {
      mockRouteParams.data = 'some-encoded-data'
      mockDecodeProgram.mockResolvedValue({ c: '10 PRINT "HELLO WORLD"' })

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(state.code.value).toEqual('10 PRINT "HELLO WORLD"')
      expect(shareError.value).toBe('')
      expect(mockDecodeProgram).toHaveBeenCalledWith('some-encoded-data')
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })

    it('preserves empty source code after decode', async () => {
      mockRouteParams.data = 'encoded-empty'
      mockDecodeProgram.mockResolvedValue({ c: '' })

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState('old code')
      const { handleShareRoute } = useShareRoute(state)

      await handleShareRoute()

      expect(state.code.value).toBe('')
    })

    it('replaces existing code with decoded program', async () => {
      mockRouteParams.data = 'encoded-goto'
      mockDecodeProgram.mockResolvedValue({ c: '20 GOTO 20' })

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState('10 PRINT "OLD"')
      const { handleShareRoute } = useShareRoute(state)

      await handleShareRoute()

      expect(state.code.value).toEqual('20 GOTO 20')
    })
  })

  // ==========================================================================
  // Error handling — ProgramDecodeError
  // ==========================================================================

  describe('when decodeProgram throws ProgramDecodeError', () => {
    it('sets shareError to the error message and redirects to Ide route', async () => {
      mockRouteParams.data = 'invalid-data'
      mockDecodeProgram.mockRejectedValue(
        new ProgramDecodeError('Invalid program data: not valid base64'),
      )

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe('Invalid program data: not valid base64')
      expect(state.code.value).toBe('')
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })

    it('sets shareError for missing source code in payload', async () => {
      mockRouteParams.data = 'no-source'
      mockDecodeProgram.mockRejectedValue(
        new ProgramDecodeError('Invalid program data: missing source code'),
      )

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe(
        'Invalid program data: missing source code',
      )
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })

    it('sets shareError for decompression failure', async () => {
      mockRouteParams.data = 'truncated'
      mockDecodeProgram.mockRejectedValue(
        new ProgramDecodeError('Invalid program data: decompression failed'),
      )

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe(
        'Invalid program data: decompression failed',
      )
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })
  })

  // ==========================================================================
  // Error handling — generic (non-ProgramDecodeError)
  // ==========================================================================

  describe('when an unexpected error occurs', () => {
    it('sets shareError to String(err) for non-ProgramDecodeError', async () => {
      mockRouteParams.data = 'anything'
      mockDecodeProgram.mockRejectedValue(new TypeError('Unexpected type'))

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe('TypeError: Unexpected type')
      expect(state.code.value).toBe('')
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })

    it('sets shareError for generic Error instances', async () => {
      mockRouteParams.data = 'generic-error'
      mockDecodeProgram.mockRejectedValue(new Error('Network failure'))

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe('Error: Network failure')
      expect(mockRouteReplace).toHaveBeenCalledWith({ name: 'Ide' })
    })
  })

  // ==========================================================================
  // shareError ref lifecycle
  // ==========================================================================

  describe('shareError ref behavior', () => {
    it('returns shareError as empty string on initialization', async () => {
      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { shareError } = useShareRoute(state)

      expect(shareError.value).toBe('')
    })

    it('keeps shareError empty on successful decode', async () => {
      mockRouteParams.data = 'valid-data'
      mockDecodeProgram.mockResolvedValue({ c: '10 PRINT "OK"' })

      const { useShareRoute } = await import(
        '@/features/ide/composables/useShareRoute'
      )
      const state = createIdeState()
      const { handleShareRoute, shareError } = useShareRoute(state)

      await handleShareRoute()

      expect(shareError.value).toBe('')
    })
  })
})
