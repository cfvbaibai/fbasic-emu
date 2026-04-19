/**
 * Factory for creating a ReplWorkerAdapter from the existing composable-layer
 * WebWorkerManager (plain object) and execution state.
 */

import { ref } from 'vue'

import type { ExecutionResult } from '@/core/types/execution-types'
import type { ReplExecuteMessage, ReplRunMessage } from '@/core/types/worker-messages'
import { logComposable } from '@/shared/logger'

import type { WebWorkerManager } from './useBasicIdeWebWorkerUtils'
import { sendMessageToWorker } from './useBasicIdeWebWorkerUtils'
import type { ReplWorkerAdapter } from './useReplMode'

/**
 * Create a ReplWorkerAdapter that uses the composable-layer WebWorkerManager
 * and tracks REPL readiness based on execution lifecycle.
 *
 * @param webWorkerManager - Plain WebWorkerManager object from useBasicIdeWorkerIntegration
 * @returns Adapter + `markReplReady()` callback to call after program execution completes
 */
export function createReplWorkerAdapter(webWorkerManager: WebWorkerManager): {
  adapter: ReplWorkerAdapter
  markReplReady: () => void
  markReplNotReady: () => void
} {
  const replReady = ref(false)

  const adapter: ReplWorkerAdapter = {
    replExecute(statement: string): Promise<ExecutionResult> {
      const message: ReplExecuteMessage = {
        type: 'REPL_EXECUTE',
        id: `repl-exec-${Date.now()}`,
        timestamp: Date.now(),
        data: { statement },
      }
      logComposable.debug('[ReplWorkerAdapter] Sending REPL_EXECUTE:', statement)
      return sendMessageToWorker(message, webWorkerManager)
    },

    replRun(): Promise<ExecutionResult> {
      const message: ReplRunMessage = {
        type: 'REPL_RUN',
        id: `repl-run-${Date.now()}`,
        timestamp: Date.now(),
        data: {},
      }
      logComposable.debug('[ReplWorkerAdapter] Sending REPL_RUN')
      return sendMessageToWorker(message, webWorkerManager)
    },

    async replClear(): Promise<void> {
      if (!webWorkerManager.worker) {
        logComposable.warn('[ReplWorkerAdapter] Cannot CLS: worker not initialized')
        return
      }
      webWorkerManager.worker.postMessage({
        type: 'REPL_CLEAR',
        id: `repl-clear-${Date.now()}`,
        timestamp: Date.now(),
        data: {},
      })
      logComposable.debug('[ReplWorkerAdapter] Sent REPL_CLEAR')
    },

    isReplReady(): boolean {
      return replReady.value
    },
  }

  function markReplReady(): void {
    replReady.value = true
  }

  function markReplNotReady(): void {
    replReady.value = false
  }

  return { adapter, markReplReady, markReplNotReady }
}
