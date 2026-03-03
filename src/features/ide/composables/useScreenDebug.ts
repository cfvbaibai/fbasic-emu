import { inject, type InjectionKey, provide, type Ref, ref } from 'vue'

/**
 * Screen debug settings interface
 */
export interface ScreenDebugControl {
  showGrid: Ref<boolean>
  toggleGrid: () => void
}

/**
 * Injection key for screen debug settings
 */
export const ScreenDebugKey: InjectionKey<ScreenDebugControl> = Symbol('screen-debug')

/**
 * Composable for providing screen debug settings.
 * Should be called in a parent component (e.g., ScreenTab) to provide
 * debug state to child components (e.g., Screen).
 *
 * @returns Object with debug settings and toggle functions
 */
export function provideScreenDebug(): ScreenDebugControl {
  const showGrid = ref(false)

  function toggleGrid(): void {
    showGrid.value = !showGrid.value
  }

  const control: ScreenDebugControl = {
    showGrid,
    toggleGrid,
  }

  provide(ScreenDebugKey, control)

  return control
}

/**
 * Composable for injecting screen debug settings.
 * Should be called in child components that need access to debug state.
 *
 * @returns Object with debug settings and toggle functions, or fallback if not provided
 */
export function useScreenDebug(): ScreenDebugControl {
  const injected = inject(ScreenDebugKey)

  if (!injected) {
    // Fallback: create local state if not provided
    const showGrid = ref(false)

    function toggleGrid(): void {
      showGrid.value = !showGrid.value
    }

    return {
      showGrid,
      toggleGrid,
    }
  }

  return injected
}
