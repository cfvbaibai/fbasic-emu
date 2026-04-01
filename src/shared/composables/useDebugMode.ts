/**
 * Debug Mode Composable
 *
 * Provides a reactive debug mode toggle backed by localStorage and URL param.
 * When debug mode is active, dev/test pages are shown in navigation.
 */

import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

const DEBUG_STORAGE_KEY = 'fbasic-debug-mode'

/**
 * Check if debug mode is enabled via URL parameter
 */
function isDebugUrlParam(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('debug') === 'true'
}

/**
 * Composable for managing debug mode state.
 *
 * Debug mode can be enabled via:
 * - localStorage key `fbasic-debug-mode` set to `true`
 * - URL parameter `?debug=true`
 *
 * The state is persisted to localStorage so it survives page reloads.
 */
export function useDebugMode() {
  const isEnabled = useLocalStorage<boolean>(DEBUG_STORAGE_KEY, isDebugUrlParam(), {
    serializer: {
      read: (value: string): boolean => value === 'true',
      write: (value: boolean): string => String(value),
    },
  })

  // Also enable if URL param is present (takes precedence on first load)
  if (typeof window !== 'undefined' && isDebugUrlParam()) {
    isEnabled.value = true
  }

  const isDebugEnabled = computed(() => isEnabled.value)

  const toggleDebugMode = () => {
    isEnabled.value = !isEnabled.value
  }

  return {
    isDebugEnabled,
    toggleDebugMode,
  }
}
