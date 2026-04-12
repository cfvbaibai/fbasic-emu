// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { useScreenFilter } from '@/features/ide/composables/useScreenFilter'

describe('useScreenFilter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('default state', () => {
    it('returns filterEnabled as false by default', () => {
      const { filterEnabled } = useScreenFilter()

      expect(filterEnabled.value).toEqual(false)
    })
  })

  describe('toggleFilter', () => {
    it('toggles filterEnabled from false to true', () => {
      const { filterEnabled, toggleFilter } = useScreenFilter()

      toggleFilter()

      expect(filterEnabled.value).toEqual(true)
    })

    it('toggles filterEnabled from true back to false', () => {
      const { filterEnabled, toggleFilter } = useScreenFilter()

      toggleFilter()
      expect(filterEnabled.value).toEqual(true)

      toggleFilter()

      expect(filterEnabled.value).toEqual(false)
    })
  })

  describe('setFilterEnabled', () => {
    it('sets filterEnabled to true', () => {
      const { filterEnabled, setFilterEnabled } = useScreenFilter()

      setFilterEnabled(true)

      expect(filterEnabled.value).toEqual(true)
    })

    it('sets filterEnabled to false', () => {
      const { filterEnabled, setFilterEnabled } = useScreenFilter()

      setFilterEnabled(true)
      setFilterEnabled(false)

      expect(filterEnabled.value).toEqual(false)
    })
  })

  describe('localStorage persistence', () => {
    it('persists enabled state to localStorage', async () => {
      const { setFilterEnabled } = useScreenFilter()

      setFilterEnabled(true)

      // VueUse's useLocalStorage writes to localStorage via watch (flush: post)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorage.getItem('fbasic-screen-filter')).toEqual('true')
    })

    it('persists disabled state to localStorage', async () => {
      const { setFilterEnabled } = useScreenFilter()

      setFilterEnabled(false)

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorage.getItem('fbasic-screen-filter')).toEqual('false')
    })

    it('restores enabled state from localStorage on subsequent calls', async () => {
      // First call: enable the filter
      const { setFilterEnabled } = useScreenFilter()
      setFilterEnabled(true)

      // Wait for localStorage sync
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Second call: should restore from localStorage (same module-level ref)
      const { filterEnabled } = useScreenFilter()

      expect(filterEnabled.value).toEqual(true)
    })

    it('restores disabled state from localStorage on subsequent calls', () => {
      // Pre-populate localStorage with false
      localStorage.setItem('fbasic-screen-filter', 'false')

      const { filterEnabled } = useScreenFilter()

      expect(filterEnabled.value).toEqual(false)
    })
  })

  describe('return type', () => {
    it('returns reactive filterEnabled, toggleFilter, and setFilterEnabled', () => {
      const result = useScreenFilter()

      expect(result).toHaveProperty('filterEnabled')
      expect(result).toHaveProperty('toggleFilter')
      expect(result).toHaveProperty('setFilterEnabled')
      expect(typeof result.toggleFilter).toEqual('function')
      expect(typeof result.setFilterEnabled).toEqual('function')
    })
  })

  describe('prefersReducedMotion', () => {
    it('returns prefersReducedMotion as a boolean ref', () => {
      const { prefersReducedMotion } = useScreenFilter()

      expect(prefersReducedMotion).toBeDefined()
      expect(typeof prefersReducedMotion.value).toEqual('boolean')
    })

    it('returns false when prefers-reduced-motion is not set', () => {
      // Default jsdom environment has no prefers-reduced-motion
      const { prefersReducedMotion } = useScreenFilter()

      expect(prefersReducedMotion.value).toEqual(false)
    })
  })
})
