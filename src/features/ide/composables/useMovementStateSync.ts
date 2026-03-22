/**
 * Movement state synchronization composable
 * Reads movement states from shared buffer (DEF MOVE definitions are stored there)
 */

import type { Ref } from 'vue'
import { computed,ref, watch } from 'vue'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { MovementState } from '@/core/sprite/types'

export interface UseMovementStateSyncOptions {
  sharedDisplayBufferAccessor: Ref<SharedDisplayBufferAccessor | null>
  onSync?: () => void
}

/**
 * Read movement states from shared buffer and sync to local mutable copy
 *
 * All animation state (position, isActive, currentFrameIndex, etc.) is tracked by
 * Animation Worker in shared buffer. Main thread only needs definition (for rendering).
 *
 * The onSync callback is triggered when the number of defined movements changes
 * (e.g., when DEF MOVE is executed).
 */
export function useMovementStateSync(options: UseMovementStateSyncOptions) {
  const { sharedDisplayBufferAccessor, onSync } = options

  // Local mutable copy of movement states for animation updates
  const localMovementStates = ref<MovementState[]>([])

  // Computed to read movement states from shared buffer
  const movementStatesFromBuffer = computed(() => {
    if (!sharedDisplayBufferAccessor.value) return []
    return sharedDisplayBufferAccessor.value.readAllMovementStates()
  })

  // Watch for changes in the number of defined movements from buffer
  // This triggers when DEF MOVE is executed (a new slot gets characterType >= 0)
  watch(
    movementStatesFromBuffer,
    (newStates) => {
      if (newStates.length === 0) {
        localMovementStates.value = []
        return
      }

      // Deep clone movement states to make them mutable
      localMovementStates.value = newStates.map(m => ({
        actionNumber: m.actionNumber,
        definition: { ...m.definition },
        isActive: false, // Will be synced from buffer by animation loop
      }))

      // Trigger callback after sync
      if (onSync) {
        onSync()
      }
    },
    { immediate: true, deep: true }
  )

  return {
    localMovementStates,
  }
}
