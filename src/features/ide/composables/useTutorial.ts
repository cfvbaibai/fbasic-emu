/**
 * useTutorial composable
 *
 * Manages tutorial lesson state: current lesson index, navigation,
 * completion tracking per lesson, and overall progress percentage.
 * Persists progress to localStorage.
 *
 * Separate from useTutorialPanel.ts which handles panel visibility/toggle.
 * This composable provides the data layer that TutorialPanel.vue consumes.
 */

import type { ComputedRef, Ref } from 'vue'
import { computed, ref, watch } from 'vue'

// ============================================================================
// Constants
// ============================================================================

const COMPLETION_STORAGE_KEY = 'tutorial:progress'
const INDEX_STORAGE_KEY = 'tutorial:current-index'

// ============================================================================
// Types
// ============================================================================

interface UseTutorialOptions {
  totalLessons: number
}

interface UseTutorialReturn {
  currentIndex: Ref<number>
  totalLessons: ComputedRef<number>
  hasPrev: ComputedRef<boolean>
  hasNext: ComputedRef<boolean>
  completedLessons: Ref<Set<number>>
  completedCount: ComputedRef<number>
  progressPercentage: ComputedRef<number>
  goToNext: () => void
  goToPrev: () => void
  goTo: (index: number) => void
  markCompleted: (index: number) => void
  isLessonCompleted: (index: number) => boolean
  reset: () => void
}

// ============================================================================
// Persistence Helpers
// ============================================================================

function loadCompletedFromStorage(): Set<number> {
  try {
    const raw = localStorage.getItem(COMPLETION_STORAGE_KEY)
    if (raw === null) return new Set<number>()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<number>()
    return new Set<number>(parsed.filter((v): v is number => typeof v === 'number'))
  } catch {
    return new Set<number>()
  }
}

function loadIndexFromStorage(): number {
  try {
    const raw = localStorage.getItem(INDEX_STORAGE_KEY)
    if (raw === null) return 0
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'number') return 0
    return parsed
  } catch {
    return 0
  }
}

function saveCompletedToStorage(completed: Set<number>): void {
  localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify([...completed]))
}

function saveIndexToStorage(index: number): void {
  localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(index))
}

// ============================================================================
// Composable
// ============================================================================

/**
 * Composable for tutorial lesson state management.
 *
 * Provides reactive lesson navigation, completion tracking,
 * and progress percentage with localStorage persistence.
 */
export function useTutorial(options: UseTutorialOptions): UseTutorialReturn {
  const { totalLessons } = options

  const currentIndex = ref(loadIndexFromStorage())
  const completedLessons = ref(loadCompletedFromStorage())

  const resolvedTotal = computed(() => totalLessons)

  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < resolvedTotal.value - 1)

  const completedCount = computed(() => completedLessons.value.size)

  const progressPercentage = computed(() => {
    if (resolvedTotal.value === 0) return 0
    return Math.round((completedCount.value / resolvedTotal.value) * 100)
  })

  function clampIndex(index: number): number {
    return Math.max(0, Math.min(index, resolvedTotal.value - 1))
  }

  function goToNext(): void {
    if (hasNext.value) {
      currentIndex.value++
    }
  }

  function goToPrev(): void {
    if (hasPrev.value) {
      currentIndex.value--
    }
  }

  function goTo(index: number): void {
    currentIndex.value = clampIndex(index)
  }

  function markCompleted(index: number): void {
    const updated = new Set(completedLessons.value)
    updated.add(index)
    completedLessons.value = updated
  }

  function isLessonCompleted(index: number): boolean {
    return completedLessons.value.has(index)
  }

  function reset(): void {
    currentIndex.value = 0
    completedLessons.value = new Set<number>()
  }

  // Persist on changes
  watch(currentIndex, (val) => {
    saveIndexToStorage(val)
  })

  watch(completedLessons, (val) => {
    saveCompletedToStorage(val)
  })

  return {
    currentIndex,
    totalLessons: resolvedTotal,
    hasPrev,
    hasNext,
    completedLessons,
    completedCount,
    progressPercentage,
    goToNext,
    goToPrev,
    goTo,
    markCompleted,
    isLessonCompleted,
    reset,
  }
}
