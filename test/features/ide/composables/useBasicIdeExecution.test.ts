import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { ERROR_MESSAGES } from '@/core/constants'
import { useBasicIdeExecution } from '@/features/ide/composables/useBasicIdeExecution'
import type { BasicIdeState } from '@/features/ide/composables/useBasicIdeState'
import type { BasicIdeWorkerIntegration } from '@/features/ide/composables/useBasicIdeWorkerIntegration'
import i18n from '@/shared/i18n'

function createState(): BasicIdeState {
  return {
    isRunning: ref(false),
    output: ref([]),
    errors: ref([]),
    variables: ref({}),
    debugOutput: ref(''),
    code: ref(''),
    currentSampleType: ref<string | null>(null),
    highlightedCode: ref(''),
    debugMode: ref(false),
    screenBuffer: ref([]),
    cursorX: ref(0),
    cursorY: ref(0),
    bgPalette: ref(0),
    backdropColor: ref(0),
    spritePalette: ref(0),
    cgenMode: ref(0),
    spriteStates: ref([]),
    spriteEnabled: ref(false),
    movementPositionsFromBuffer: ref(new Map()),
    frontSpriteNodes: ref(new Map()),
    backSpriteNodes: ref(new Map()),
    spriteActionQueues: ref(new Map()),
    pendingInputRequest: ref(null),
    inputMode: ref<'joystick' | 'keyboard'>('joystick'),
  }
}

function createWorker(overrides?: Partial<BasicIdeWorkerIntegration>): BasicIdeWorkerIntegration {
  return {
    webWorkerManager: {
      worker: null,
      messageId: 0,
      pendingMessages: new Map(),
    },
    initializeWebWorker: vi.fn().mockResolvedValue(undefined),
    checkWebWorkerHealth: vi.fn().mockResolvedValue(true),
    restartWebWorker: vi.fn().mockResolvedValue(undefined),
    sendMessageToWorker: vi.fn().mockRejectedValue(new Error('not implemented')),
    sendBgData: vi.fn(),
    sendClearDisplay: vi.fn(),
    sendStickEvent: vi.fn(),
    sendStrigEvent: vi.fn(),
    respondToInputRequest: vi.fn(),
    cleanupWebWorker: vi.fn(),
    ...overrides,
  }
}

describe('useBasicIdeExecution', () => {
  describe('timeout error message', () => {
    it('maps "Web worker message timeout" to user-friendly i18n message', async () => {
      const state = createState()
      const worker = createWorker({
        sendMessageToWorker: vi.fn().mockRejectedValue(new Error(ERROR_MESSAGES.WORKER_TIMEOUT)),
      })
      const parseCode = vi.fn().mockResolvedValue({})

      const { runCode } = useBasicIdeExecution(state, worker, parseCode)

      await runCode()

      expect(state.errors.value).toHaveLength(1)
      expect(state.errors.value[0]!.message).toEqual(
        i18n.global.t('ide.errors.executionTimeout')
      )
      expect(state.errors.value[0]!.line).toEqual(0)
      expect(state.errors.value[0]!.type).toEqual('runtime')
    })

    it('preserves non-timeout error messages unchanged', async () => {
      const state = createState()
      const worker = createWorker({
        sendMessageToWorker: vi.fn().mockRejectedValue(new Error('Some other error')),
      })
      const parseCode = vi.fn().mockResolvedValue({})

      const { runCode } = useBasicIdeExecution(state, worker, parseCode)

      await runCode()

      expect(state.errors.value).toHaveLength(1)
      expect(state.errors.value[0]!.message).toEqual('Some other error')
    })

    it('handles non-Error throws in timeout path', async () => {
      const state = createState()
      const worker = createWorker({
        sendMessageToWorker: vi.fn().mockRejectedValue('string error'),
      })
      const parseCode = vi.fn().mockResolvedValue({})

      const { runCode } = useBasicIdeExecution(state, worker, parseCode)

      await runCode()

      expect(state.errors.value).toHaveLength(1)
      expect(state.errors.value[0]!.message).toEqual('Execution error')
    })
  })

  describe('normal execution', () => {
    it('does not set errors on successful execution', async () => {
      const state = createState()
      const worker = createWorker({
        sendMessageToWorker: vi.fn().mockResolvedValue({
          errors: [],
          variables: {},
        }),
      })
      const parseCode = vi.fn().mockResolvedValue({})

      const { runCode } = useBasicIdeExecution(state, worker, parseCode)

      await runCode()

      expect(state.errors.value).toEqual([])
      expect(state.isRunning.value).toEqual(false)
    })

    it('resets isRunning to false after timeout error', async () => {
      const state = createState()
      const worker = createWorker({
        sendMessageToWorker: vi.fn().mockRejectedValue(new Error(ERROR_MESSAGES.WORKER_TIMEOUT)),
      })
      const parseCode = vi.fn().mockResolvedValue({})

      const { runCode } = useBasicIdeExecution(state, worker, parseCode)

      await runCode()

      expect(state.isRunning.value).toEqual(false)
    })
  })
})
