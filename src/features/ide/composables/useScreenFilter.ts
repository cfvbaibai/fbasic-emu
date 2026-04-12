/**
 * useScreenFilter composable
 *
 * Manages CRT/NTSC visual filter toggle state for the screen display.
 * Step 1 of the CRT filter feature (#534).
 *
 * Uses VueUse's useLocalStorage for persistence across sessions.
 * Designed to be extensible for Steps 2-5 (scanline, phosphor glow,
 * curvature, vignette layers).
 */

import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

const FILTER_STORAGE_KEY = 'fbasic-screen-filter'

/**
 * Composable for managing the screen CRT filter state.
 *
 * Provides a reactive `filterEnabled` boolean that persists to localStorage.
 * Future steps will add individual layer toggles (scanline, phosphor, etc.)
 * on top of this master toggle.
 */
export function useScreenFilter() {
  const isEnabled = useLocalStorage<boolean>(FILTER_STORAGE_KEY, false, {
    serializer: {
      read: (value: string): boolean => value === 'true',
      write: (value: boolean): string => String(value),
    },
  })

  const filterEnabled = computed(() => isEnabled.value)

  function toggleFilter(): void {
    isEnabled.value = !isEnabled.value
  }

  function setFilterEnabled(enabled: boolean): void {
    isEnabled.value = enabled
  }

  return {
    filterEnabled,
    toggleFilter,
    setFilterEnabled,
  }
}
