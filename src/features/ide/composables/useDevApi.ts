import { onMounted, onUnmounted,type Ref } from 'vue'

import type { RequestInputMessage } from '@/core/types/worker-messages'

/**
 * DEV-only global API exposed on `window.__fbasicIDE` for headless test
 * code injection. This avoids clipboard hacks when automating the IDE
 * in browser-based E2E tests.
 *
 * In production builds `import.meta.env.DEV` is `false`, so the
 * composable body is completely eliminated by Vite tree-shaking.
 */
export function useDevApi(options: {
  code: Ref<string>
  runCode: () => Promise<void>
  stopCode: () => void
  pendingInputRequest: Ref<RequestInputMessage['data'] | null>
  respondToInputRequest: (requestId: string, values: string[], cancelled: boolean) => void
}): void {
  if (!import.meta.env.DEV) {
    return
  }

  function loadCode(code: string): void {
    options.code.value = code
  }

  function respondToInput(value: string): void {
    const request = options.pendingInputRequest.value
    if (!request) {
      console.warn('[__fbasicIDE] respondToInput called but no pending input request')
      return
    }
    options.respondToInputRequest(request.requestId, [value], false)
  }

  const api = {
    loadCode,
    run: options.runCode,
    stop: options.stopCode,
    respondToInput,
  }

  onMounted(() => {
    window.__fbasicIDE = api
  })

  onUnmounted(() => {
    window.__fbasicIDE = undefined
  })
}
