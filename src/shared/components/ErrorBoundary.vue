<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

import { logApp } from '@/shared/logger'

/**
 * ErrorBoundary component - Catches errors from child components
 * and displays a fallback UI instead of crashing the entire app.
 *
 * Uses Vue's onErrorCaptured lifecycle hook to intercept errors
 * from child components.
 *
 * @example
 * ```vue
 * <ErrorBoundary>
 *   <Suspense>
 *     <AsyncComponent />
 *   </Suspense>
 * </ErrorBoundary>
 * ```
 */

interface Props {
  /** Optional name for identifying which boundary caught the error */
  name?: string
  /** Whether to show the default fallback UI */
  fallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: 'ErrorBoundary',
  fallback: true,
})

const emit = defineEmits<{
  error: [error: Error, instance: unknown, info: string]
}>()

const hasError = ref(false)
const errorInfo = ref<{ error: Error; info: string } | null>(null)

// Capture errors from child components using Vue lifecycle hook
onErrorCaptured((error: Error, instance: unknown, info: string): boolean => {
  logApp.error(`[${props.name}] Vue error captured:`, error, info)

  hasError.value = true
  errorInfo.value = { error, info }

  // Emit error event for parent handling
  emit('error', error, instance, info)

  // Return false to prevent the error from propagating to parent errorCaptured hooks
  // and from being logged to the console (we already logged it)
  return false
})

const resetError = () => {
  hasError.value = false
  errorInfo.value = null
}

defineExpose({
  resetError,
  hasError,
})
</script>

<template>
  <slot v-if="!hasError" />
  <slot
    v-else-if="$slots.fallback"
    name="fallback"
    :error="errorInfo?.error"
    :info="errorInfo?.info"
    :reset="resetError"
  />
  <div v-else-if="fallback" class="error-boundary-fallback">
    <div class="error-icon">!</div>
    <h2 class="error-title">Something went wrong</h2>
    <p class="error-message">
      {{ errorInfo?.error?.message || 'An unexpected error occurred' }}
    </p>
    <button class="reset-button" type="button" @click="resetError">
      Try Again
    </button>
  </div>
</template>

<style scoped>
.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
  background: var(--base-solid-gray-20);
  border: 2px solid var(--semantic-solid-danger);
  border-radius: 8px;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: var(--semantic-solid-danger);
  background: var(--semantic-alpha-danger-20);
  border-radius: 50%;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--game-text-primary);
  margin: 0 0 0.5rem;
}

.error-message {
  font-size: 0.9rem;
  color: var(--game-text-secondary);
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.reset-button {
  padding: 0.5rem 1.5rem;
  background: var(--base-solid-primary);
  color: var(--base-solid-gray-00);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.reset-button:hover {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.reset-button:active {
  transform: translateY(0);
}
</style>
