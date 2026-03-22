/**
 * Animation Worker Manager Composable
 *
 * Manages the Animation Worker lifecycle from the main thread.
 * Passes shared buffers to Animation Worker during initialization.
 *
 * Note: Animation commands are sent via direct sync (Executor Worker → Animation Worker)
 * through the shared buffer using Atomics, not via postMessage forwarding.
 */

import { type Ref, ref, watch } from 'vue'

import type { AnimationWorkerCommand } from '@/core/workers/AnimationWorker'

const ANIMATION_WORKER_READY_TIMEOUT_MS = 5000

interface AnimationWorkerReadyMessage {
  type: 'READY'
}

function isAnimationWorkerReadyMessage(data: unknown): data is AnimationWorkerReadyMessage {
  return typeof data === 'object' && data !== null && 'type' in data && data.type === 'READY'
}

function toWorkerError(event: Event): Error {
  if (event instanceof ErrorEvent && event.message) {
    return new Error(`Animation Worker error: ${event.message}`)
  }
  return new Error('Animation Worker failed to initialize')
}

export interface UseAnimationWorkerOptions {
  sharedAnimationBuffer: Ref<SharedArrayBuffer | null>
  onReady?: () => void
  onError?: (error: Error) => void
}

/**
 * Composable for managing Animation Worker from main thread
 *
 * @param options - Configuration options
 * @returns Animation worker manager interface
 */
export function useAnimationWorker(options: UseAnimationWorkerOptions) {
  const { sharedAnimationBuffer, onReady, onError } = options

  let worker: Worker | null = null
  const isReady = ref(false)
  const isInitializing = ref(false)
  const initError = ref<Error | null>(null)

  /**
   * Initialize the Animation Worker
   */
  async function initialize(): Promise<void> {
    if (isReady.value) {
      return
    }

    if (isInitializing.value) {
      throw new Error('Animation Worker is already initializing')
    }

    isInitializing.value = true
    initError.value = null

    try {
      // Create Animation Worker
      // Vite will bundle this automatically with the ?worker suffix pattern
      worker = new Worker(
        new URL('../../../core/workers/animation-worker.ts?worker', import.meta.url),
        {
          type: 'module',
        }
      )

      // Wait for explicit READY handshake from worker.
      const activeWorker = worker
      await new Promise<void>((resolve, reject) => {
        if (!activeWorker) {
          reject(new Error('Worker failed to initialize'))
          return
        }

        let settled = false
        const timeout = setTimeout(() => {
          if (settled) return
          settled = true
          cleanup()
          reject(new Error('Animation Worker initialization timeout waiting for READY'))
        }, ANIMATION_WORKER_READY_TIMEOUT_MS)

        const handleError = (event: Event) => {
          if (settled) return
          settled = true
          cleanup()
          reject(toWorkerError(event))
        }

        const handleMessage = (event: MessageEvent<unknown>) => {
          if (!isAnimationWorkerReadyMessage(event.data) || settled) {
            return
          }
          settled = true
          cleanup()
          resolve()
        }

        const cleanup = () => {
          clearTimeout(timeout)
          activeWorker.removeEventListener('error', handleError)
          activeWorker.removeEventListener('message', handleMessage)
        }

        activeWorker.addEventListener('error', handleError)
        activeWorker.addEventListener('message', handleMessage)
      })

      worker.addEventListener('error', event => {
        const error = toWorkerError(event)
        initError.value = error
        onError?.(error)
      })

      // Send shared buffers to animation worker (if available)
      // Buffers might be set after worker initialization, so we watch for changes
      if (sharedAnimationBuffer.value) {
        const setBufferCommand: AnimationWorkerCommand = {
          type: 'SET_SHARED_BUFFER',
          buffer: sharedAnimationBuffer.value,
        }
        worker.postMessage(setBufferCommand)
      }

      isReady.value = true
      onReady?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      initError.value = err
      onError?.(err)
      throw err
    } finally {
      isInitializing.value = false
    }
  }

  // Watch for buffer changes and send to worker when available
  watch(sharedAnimationBuffer, (newBuffer) => {
    if (isReady.value && worker) {
      if (newBuffer) {
        const setBufferCommand: AnimationWorkerCommand = {
          type: 'SET_SHARED_BUFFER',
          buffer: newBuffer,
        }
        worker.postMessage(setBufferCommand)
      }
    }
  })

  /**
   * Terminate the Animation Worker
   */
  function terminate(): void {
    if (worker) {
      worker.terminate()
      worker = null
    }
    isReady.value = false
    isInitializing.value = false
    initError.value = null
  }

  /**
   * Reset the Animation Worker state
   */
  function reset(): void {
    // Animation worker doesn't have a reset command
    // Terminate and re-initialize if needed
  }

  return {
    // State
    isReady,
    isInitializing,
    initError,

    // Methods
    initialize,
    terminate,
    reset,

    // Computed
    worker: () => worker,
  }
}
