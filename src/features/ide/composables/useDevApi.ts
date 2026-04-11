import { onMounted, onUnmounted,type Ref } from 'vue'

import type { ScreenCell } from '@/core/types/execution-types'
import type { RequestInputMessage } from '@/core/types/worker-messages'

/**
 * Read-only screen API exposed on `window.__fbasicIDE` in all builds
 * (DEV and production) for E2E screen content assertions.
 */
interface FbasicIDEScreenAPI {
  /** Read screen buffer as array of trimmed row strings. */
  getScreenText: () => string[]
}

/**
 * Full DEV-only API that extends the screen API with state-mutating methods.
 * In production builds only the screen API subset is exposed.
 */
type FbasicIDEFullAPI = FbasicIDEScreenAPI & {
  loadCode: (code: string) => void
  run: () => Promise<void>
  stop: () => void
  respondToInput: (value: string) => void
}

/**
 * Global API exposed on `window.__fbasicIDE` for headless test automation.
 *
 * The read-only `getScreenText()` method is available in all builds (DEV and
 * production) so that E2E tests running against production builds can assert
 * screen content. State-mutating methods (`loadCode`, `run`, `stop`,
 * `respondToInput`) are DEV-only and eliminated by Vite tree-shaking in
 * production builds.
 */
export function useDevApi(options: {
  code: Ref<string>
  runCode: () => Promise<void>
  stopCode: () => void
  pendingInputRequest: Ref<RequestInputMessage['data'] | null>
  respondToInputRequest: (requestId: string, values: string[], cancelled: boolean) => void
  screenBuffer: Ref<ScreenCell[][]>
}): void {
  /**
   * Read the current screen buffer and return an array of row strings.
   * Each row is the concatenated characters from the screen buffer cells,
   * trimmed of trailing spaces.
   *
   * Available in all builds (DEV and production) for E2E assertions.
   */
  function getScreenText(): string[] {
    const buffer = options.screenBuffer.value
    return buffer.map(row =>
      (row ?? [])
        .map(cell => cell?.character ?? ' ')
        .join('')
        .trimEnd()
    )
  }

  const screenApi: FbasicIDEScreenAPI = { getScreenText }

  if (import.meta.env.DEV) {
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

    const fullApi: FbasicIDEFullAPI = {
      ...screenApi,
      loadCode,
      run: options.runCode,
      stop: options.stopCode,
      respondToInput,
    }

    onMounted(() => {
      window.__fbasicIDE = fullApi
    })

    onUnmounted(() => {
      window.__fbasicIDE = undefined
    })
  } else {
    // Production: expose only the read-only screen API for E2E tests
    onMounted(() => {
      window.__fbasicIDE = screenApi
    })

    onUnmounted(() => {
      window.__fbasicIDE = undefined
    })
  }
}
