import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { ERROR_MESSAGES } from '@/core/constants'
import { useBasicIdeExecution } from '@/features/ide/composables/useBasicIdeExecution'
import type { BasicIdeState } from '@/features/ide/composables/useBasicIdeState'
import type { BasicIdeWorkerIntegration } from '@/features/ide/composables/useBasicIdeWorkerIntegration'
import {
  BACKGROUND_PALETTES,
  ORIGINAL_BACKGROUND_PALETTES,
  ORIGINAL_SPRITE_PALETTES,
  resetRuntimePalettes,
  setRuntimePaletteCombination,
  SPRITE_PALETTES,
} from '@/shared/data/palette'
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
  /** Deep-clone palette arrays (mutable or deeply-readonly) for snapshot comparison. */
  function clonePalettes(palettes: Iterable<Iterable<readonly number[]>>): number[][][] {
    return [...palettes].map(p => [...p].map(c => [...c]))
  }

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

  describe('palette data reset (issue #435)', () => {
    let savedBg: number[][][]
    let savedSprite: number[][][]

    beforeEach(() => {
      savedBg = clonePalettes(ORIGINAL_BACKGROUND_PALETTES)
      savedSprite = clonePalettes(ORIGINAL_SPRITE_PALETTES)
    })

    afterEach(() => {
      // Restore palettes to prevent cross-test contamination
      resetRuntimePalettes()
    })

    describe('clearOutput resets runtime palettes', () => {
      it('should restore BACKGROUND_PALETTES when clearOutput is called', () => {
        const state = createState()
        const worker = createWorker()
        const parseCode = vi.fn().mockResolvedValue({})
        const { clearOutput } = useBasicIdeExecution(state, worker, parseCode)

        // Simulate a previous program mutating palettes (e.g. PALETB command)
        setRuntimePaletteCombination('B', 0, 0, [0x01, 0x02, 0x03, 0x04])
        setRuntimePaletteCombination('B', 1, 2, [0x10, 0x20, 0x30, 0x40])
        expect(BACKGROUND_PALETTES[0][0]).toEqual([0x01, 0x02, 0x03, 0x04])

        clearOutput()

        expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(savedBg)
      })

      it('should restore SPRITE_PALETTES when clearOutput is called', () => {
        const state = createState()
        const worker = createWorker()
        const parseCode = vi.fn().mockResolvedValue({})
        const { clearOutput } = useBasicIdeExecution(state, worker, parseCode)

        setRuntimePaletteCombination('S', 0, 0, [0x21, 0x22, 0x23, 0x24])
        setRuntimePaletteCombination('S', 2, 3, [0x3C, 0x3C, 0x3C, 0x3C])
        expect(SPRITE_PALETTES[0][0]).toEqual([0x21, 0x22, 0x23, 0x24])

        clearOutput()

        expect(clonePalettes(SPRITE_PALETTES)).toEqual(savedSprite)
      })

      it('should restore all palettes after extensive mutations', () => {
        const state = createState()
        const worker = createWorker()
        const parseCode = vi.fn().mockResolvedValue({})
        const { clearOutput } = useBasicIdeExecution(state, worker, parseCode)

        // Simulate heavy palette mutations from a complex program
        setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])
        setRuntimePaletteCombination('B', 0, 1, [0x21, 0x22, 0x23, 0x24])
        setRuntimePaletteCombination('B', 1, 0, [5, 5, 5, 5])
        setRuntimePaletteCombination('S', 0, 0, [0x30, 0x31, 0x32, 0x33])
        setRuntimePaletteCombination('S', 2, 3, [0x3C, 0x3C, 0x3C, 0x3C])

        clearOutput()

        expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(savedBg)
        expect(clonePalettes(SPRITE_PALETTES)).toEqual(savedSprite)
      })
    })

    describe('runCode resets runtime palettes', () => {
      it('should restore BACKGROUND_PALETTES when runCode is called', async () => {
        const state = createState()
        const worker = createWorker({
          sendMessageToWorker: vi.fn().mockResolvedValue({
            errors: [],
            variables: {},
          }),
        })
        const parseCode = vi.fn().mockResolvedValue({})
        const { runCode } = useBasicIdeExecution(state, worker, parseCode)

        // Simulate a previous program mutating palettes (e.g. PALETB command)
        setRuntimePaletteCombination('B', 0, 0, [0x01, 0x02, 0x03, 0x04])
        setRuntimePaletteCombination('B', 1, 2, [0x10, 0x20, 0x30, 0x40])
        expect(BACKGROUND_PALETTES[0][0]).toEqual([0x01, 0x02, 0x03, 0x04])

        await runCode()

        expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(savedBg)
      })

      it('should restore SPRITE_PALETTES when runCode is called', async () => {
        const state = createState()
        const worker = createWorker({
          sendMessageToWorker: vi.fn().mockResolvedValue({
            errors: [],
            variables: {},
          }),
        })
        const parseCode = vi.fn().mockResolvedValue({})
        const { runCode } = useBasicIdeExecution(state, worker, parseCode)

        setRuntimePaletteCombination('S', 0, 0, [0x21, 0x22, 0x23, 0x24])
        setRuntimePaletteCombination('S', 2, 3, [0x3C, 0x3C, 0x3C, 0x3C])
        expect(SPRITE_PALETTES[0][0]).toEqual([0x21, 0x22, 0x23, 0x24])

        await runCode()

        expect(clonePalettes(SPRITE_PALETTES)).toEqual(savedSprite)
      })

      it('should restore all palettes when runCode is called after extensive mutations', async () => {
        const state = createState()
        const worker = createWorker({
          sendMessageToWorker: vi.fn().mockResolvedValue({
            errors: [],
            variables: {},
          }),
        })
        const parseCode = vi.fn().mockResolvedValue({})
        const { runCode } = useBasicIdeExecution(state, worker, parseCode)

        // Simulate heavy palette mutations from a complex program
        setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])
        setRuntimePaletteCombination('B', 0, 1, [0x21, 0x22, 0x23, 0x24])
        setRuntimePaletteCombination('B', 1, 0, [5, 5, 5, 5])
        setRuntimePaletteCombination('S', 0, 0, [0x30, 0x31, 0x32, 0x33])
        setRuntimePaletteCombination('S', 2, 3, [0x3C, 0x3C, 0x3C, 0x3C])

        await runCode()

        expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(savedBg)
        expect(clonePalettes(SPRITE_PALETTES)).toEqual(savedSprite)
      })
    })
  })

  /** Palette reactive refs that should be reset by clearOutput/runCode. */
  const PALETTE_REFS = [
    { key: 'bgPalette', nonDefault: 0, expected: 1, label: 'bgPalette' },
    { key: 'cgenMode', nonDefault: 0, expected: 2, label: 'cgenMode' },
    { key: 'backdropColor', nonDefault: 1, expected: 0, label: 'backdropColor' },
    { key: 'spritePalette', nonDefault: 2, expected: 1, label: 'spritePalette' },
  ] as const

  describe('clearOutput resets palette reactive state (issue #444)', () => {
    it.each(PALETTE_REFS)(
      'should reset $label to default when clearOutput is called',
      ({ key, nonDefault, expected }) => {
        const state = createState()
        state[key].value = nonDefault
        const worker = createWorker()
        const parseCode = vi.fn().mockResolvedValue({})
        const { clearOutput } = useBasicIdeExecution(state, worker, parseCode)

        clearOutput()

        expect(state[key].value).toEqual(expected)
      },
    )
  })

  describe('runCode resets palette reactive state (issue #435)', () => {
    it.each(PALETTE_REFS)(
      'should reset $label to default when runCode is called',
      async ({ key, nonDefault, expected }) => {
        const state = createState()
        state[key].value = nonDefault
        const worker = createWorker({
          sendMessageToWorker: vi.fn().mockResolvedValue({
            errors: [],
            variables: {},
          }),
        })
        const parseCode = vi.fn().mockResolvedValue({})
        const { runCode } = useBasicIdeExecution(state, worker, parseCode)

        await runCode()

        expect(state[key].value).toEqual(expected)
      },
    )
  })
})
