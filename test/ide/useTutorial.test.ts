// @vitest-environment jsdom
/**
 * Tests for useTutorial composable
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useTutorial } from '@/features/ide/composables/useTutorial'

beforeEach(() => {
  localStorage.clear()
})

describe('useTutorial', () => {
  const TOTAL_LESSONS = 5

  function createFresh() {
    return useTutorial({ totalLessons: TOTAL_LESSONS })
  }

  it('initializes with current lesson index at 0', () => {
    const { currentIndex } = createFresh()
    expect(currentIndex.value).toEqual(0)
  })

  it('provides the total lesson count', () => {
    const { totalLessons } = createFresh()
    expect(totalLessons.value).toEqual(TOTAL_LESSONS)
  })

  it('computes hasPrev as false when on first lesson', () => {
    const { hasPrev } = createFresh()
    expect(hasPrev.value).toBe(false)
  })

  it('computes hasPrev as true after navigating forward', () => {
    const { hasPrev, goToNext } = createFresh()
    goToNext()
    expect(hasPrev.value).toBe(true)
  })

  it('computes hasNext as true when not on last lesson', () => {
    const { hasNext } = createFresh()
    expect(hasNext.value).toBe(true)
  })

  it('computes hasNext as false when on last lesson', () => {
    const { hasNext, goTo } = createFresh()
    goTo(TOTAL_LESSONS - 1)
    expect(hasNext.value).toBe(false)
  })

  it('navigates to next lesson', () => {
    const { currentIndex, goToNext } = createFresh()
    goToNext()
    expect(currentIndex.value).toEqual(1)
  })

  it('does not navigate beyond last lesson', () => {
    const { currentIndex, goToNext } = createFresh()
    for (let i = 0; i < TOTAL_LESSONS + 2; i++) {
      goToNext()
    }
    expect(currentIndex.value).toEqual(TOTAL_LESSONS - 1)
  })

  it('navigates to previous lesson', () => {
    const { currentIndex, goToNext, goToPrev } = createFresh()
    goToNext()
    goToNext()
    goToPrev()
    expect(currentIndex.value).toEqual(1)
  })

  it('does not navigate below first lesson', () => {
    const { currentIndex, goToPrev } = createFresh()
    goToPrev()
    expect(currentIndex.value).toEqual(0)
  })

  it('navigates to a specific lesson index', () => {
    const { currentIndex, goTo } = createFresh()
    goTo(3)
    expect(currentIndex.value).toEqual(3)
  })

  it('clamps goTo to valid range (upper bound)', () => {
    const { currentIndex, goTo } = createFresh()
    goTo(100)
    expect(currentIndex.value).toEqual(TOTAL_LESSONS - 1)
  })

  it('clamps goTo to valid range (lower bound)', () => {
    const { currentIndex, goTo } = createFresh()
    goTo(-5)
    expect(currentIndex.value).toEqual(0)
  })

  it('starts with no completed lessons', () => {
    const { completedLessons } = createFresh()
    expect(completedLessons.value).toEqual(new Set<number>())
  })

  it('marks a lesson as completed', () => {
    const { completedLessons, markCompleted } = createFresh()
    markCompleted(0)
    expect(completedLessons.value).toEqual(new Set<number>([0]))
  })

  it('marks multiple lessons as completed', () => {
    const { completedLessons, markCompleted } = createFresh()
    markCompleted(0)
    markCompleted(2)
    markCompleted(4)
    expect(completedLessons.value).toEqual(new Set<number>([0, 2, 4]))
  })

  it('does not duplicate completed lesson entries', () => {
    const { completedLessons, markCompleted } = createFresh()
    markCompleted(1)
    markCompleted(1)
    expect(completedLessons.value).toEqual(new Set<number>([1]))
  })

  it('checks if a specific lesson is completed', () => {
    const { isLessonCompleted, markCompleted } = createFresh()
    expect(isLessonCompleted(0)).toBe(false)
    markCompleted(0)
    expect(isLessonCompleted(0)).toBe(true)
  })

  it('computes progress percentage as 0 when no lessons completed', () => {
    const { progressPercentage } = createFresh()
    expect(progressPercentage.value).toEqual(0)
  })

  it('computes progress percentage based on completed lessons', () => {
    const { progressPercentage, markCompleted } = createFresh()
    markCompleted(0)
    expect(progressPercentage.value).toEqual(20)
    markCompleted(1)
    expect(progressPercentage.value).toEqual(40)
    markCompleted(2)
    expect(progressPercentage.value).toEqual(60)
    markCompleted(3)
    expect(progressPercentage.value).toEqual(80)
    markCompleted(4)
    expect(progressPercentage.value).toEqual(100)
  })

  it('returns 0 progress percentage when totalLessons is 0', () => {
    const { progressPercentage } = useTutorial({ totalLessons: 0 })
    expect(progressPercentage.value).toEqual(0)
  })

  it('persists completed lessons to localStorage', async () => {
    const { markCompleted } = createFresh()
    markCompleted(0)
    await nextTick()
    markCompleted(2)
    await nextTick()

    const stored = localStorage.getItem('tutorial:progress')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed).toEqual([0, 2])
  })

  it('restores completed lessons from localStorage on creation', () => {
    localStorage.setItem('tutorial:progress', JSON.stringify([1, 3]))
    const { completedLessons } = useTutorial({ totalLessons: TOTAL_LESSONS })
    expect(completedLessons.value).toEqual(new Set<number>([1, 3]))
  })

  it('restores current index from localStorage on creation', () => {
    localStorage.setItem('tutorial:progress', JSON.stringify([0, 1]))
    localStorage.setItem('tutorial:current-index', '3')
    const { currentIndex } = useTutorial({ totalLessons: TOTAL_LESSONS })
    expect(currentIndex.value).toEqual(3)
  })

  it('persists current index to localStorage on navigation', async () => {
    const { goTo } = createFresh()
    goTo(2)
    await nextTick()

    const stored = localStorage.getItem('tutorial:current-index')
    expect(stored).toEqual('2')
  })

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('tutorial:progress', 'not-valid-json')
    const { completedLessons, currentIndex } = useTutorial({ totalLessons: TOTAL_LESSONS })
    expect(completedLessons.value).toEqual(new Set<number>())
    expect(currentIndex.value).toEqual(0)
  })

  it('resets all progress', () => {
    const { completedLessons, currentIndex, markCompleted, goTo, reset } = createFresh()
    markCompleted(0)
    markCompleted(1)
    goTo(3)

    reset()

    expect(completedLessons.value).toEqual(new Set<number>())
    expect(currentIndex.value).toEqual(0)
  })

  it('computes completedCount correctly', () => {
    const { completedCount, markCompleted } = createFresh()
    expect(completedCount.value).toEqual(0)
    markCompleted(0)
    expect(completedCount.value).toEqual(1)
    markCompleted(2)
    markCompleted(4)
    expect(completedCount.value).toEqual(3)
  })
})
