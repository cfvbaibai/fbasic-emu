import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useTutorialPanel } from '@/features/ide/composables/useTutorialPanel'

describe('useTutorialPanel', () => {
  it('starts with panel closed by default', () => {
    const { isVisible } = useTutorialPanel()
    expect(isVisible.value).toBe(false)
  })

  it('opens the panel when open is called', () => {
    const { isVisible, open } = useTutorialPanel()
    open()
    expect(isVisible.value).toBe(true)
  })

  it('closes the panel when close is called', () => {
    const { isVisible, open, close } = useTutorialPanel()
    open()
    expect(isVisible.value).toBe(true)
    close()
    expect(isVisible.value).toBe(false)
  })

  it('toggles the panel visibility', () => {
    const { isVisible, toggle } = useTutorialPanel()
    expect(isVisible.value).toBe(false)
    toggle()
    expect(isVisible.value).toBe(true)
    toggle()
    expect(isVisible.value).toBe(false)
  })

  it('accepts external visibility ref', () => {
    const externalVisible = ref(true)
    const { isVisible } = useTutorialPanel({ visible: externalVisible })
    expect(isVisible.value).toBe(true)
    externalVisible.value = false
    expect(isVisible.value).toBe(false)
  })

  it('tracks current lesson index starting at 0', () => {
    const { currentIndex } = useTutorialPanel()
    expect(currentIndex.value).toEqual(0)
  })

  it('navigates to next lesson', () => {
    const { currentIndex, goToNext } = useTutorialPanel()
    goToNext()
    expect(currentIndex.value).toEqual(1)
  })

  it('navigates to previous lesson', () => {
    const { currentIndex, goToNext, goToPrev } = useTutorialPanel()
    goToNext()
    goToNext()
    expect(currentIndex.value).toEqual(2)
    goToPrev()
    expect(currentIndex.value).toEqual(1)
  })

  it('does not navigate below 0', () => {
    const { currentIndex, goToPrev } = useTutorialPanel()
    goToPrev()
    expect(currentIndex.value).toEqual(0)
  })

  it('computes hasPrev correctly', () => {
    const { hasPrev, goToNext, goToPrev } = useTutorialPanel()
    expect(hasPrev.value).toBe(false)
    goToNext()
    expect(hasPrev.value).toBe(true)
    goToPrev()
    expect(hasPrev.value).toBe(false)
  })

  it('computes hasNext correctly based on totalLessons', () => {
    const { hasNext, currentIndex, goToNext } = useTutorialPanel({ totalLessons: 3 })
    expect(hasNext.value).toBe(true)
    goToNext()
    expect(hasNext.value).toBe(true)
    goToNext()
    expect(hasNext.value).toBe(false)
  })

  it('does not navigate beyond totalLessons', () => {
    const { currentIndex, goToNext } = useTutorialPanel({ totalLessons: 2 })
    goToNext()
    expect(currentIndex.value).toEqual(1)
    goToNext()
    expect(currentIndex.value).toEqual(1)
  })
})
