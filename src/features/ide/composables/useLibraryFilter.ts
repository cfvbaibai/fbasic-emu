/**
 * useLibraryFilter composable
 *
 * Manages search, sort, and filtering logic for the program library.
 * Encapsulates reactive state for search queries and sort keys, and
 * exposes computed properties for the filtered/sorted program list
 * and display-state flags (empty, no results).
 *
 * Used by MyProgramsLibrary to keep the component focused on
 * presentation and action handling.
 */

import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProgramData } from '@/core/types/program-types'

export type SortKey = 'updatedAt' | 'name'

export interface UseLibraryFilterReturn {
  /** Current search query (reactive, two-way bindable) */
  searchQuery: Ref<string | number>
  /** Current sort key (reactive, two-way bindable) */
  sortKey: Ref<string | number>
  /** Sort options for the GameSelect dropdown */
  sortOptions: ComputedRef<Array<{ label: string; value: SortKey }>>
  /** Programs filtered by search and sorted by sortKey */
  displayedPrograms: ComputedRef<ProgramData[]>
  /** True when filtering yields zero results (search is non-empty) */
  hasNoResults: ComputedRef<boolean>
  /** True when library is initialized but has zero programs (no search active) */
  isEmpty: ComputedRef<boolean>
}

/**
 * Provides filter/sort logic for a program library list.
 *
 * @param programs - Reactive ref holding the full program list
 * @param isInitialized - Reactive ref indicating whether the library has loaded
 * @returns Filter state and computed derived lists
 */
export function useLibraryFilter(
  programs: Ref<readonly ProgramData[]>,
  isInitialized: Ref<boolean>,
): UseLibraryFilterReturn {
  const { t } = useI18n()

  const searchQuery = ref<string | number>('')
  const sortKey = ref<string | number>('updatedAt')

  const sortOptions = computed(() => [
    { label: t('ide.myPrograms.sort.recentlyModified'), value: 'updatedAt' as const },
    { label: t('ide.myPrograms.sort.alphabetical'), value: 'name' as const },
  ])

  const displayedPrograms = computed(() => {
    let result = [...programs.value]

    const query = String(searchQuery.value).trim().toLowerCase()
    if (query) {
      result = result.filter((p) => p.name.toLowerCase().includes(query))
    }

    const sort = sortKey.value as SortKey
    result.sort((a, b) => {
      if (sort === 'updatedAt') {
        return b.updatedAt - a.updatedAt
      }
      return a.name.localeCompare(b.name)
    })

    return result
  })

  const hasNoResults = computed(() => {
    return String(searchQuery.value).trim() !== '' && displayedPrograms.value.length === 0
  })

  const isEmpty = computed(() => {
    return isInitialized.value && programs.value.length === 0 && !String(searchQuery.value).trim()
  })

  return {
    searchQuery,
    sortKey,
    sortOptions,
    displayedPrograms,
    hasNoResults,
    isEmpty,
  }
}
