/**
 * Execution flow: runCode, stopCode, clearOutput, clearAll.
 * Depends on state, worker integration, and parseCode from editor.
 */

import { ERROR_MESSAGES, EXECUTION_LIMITS } from '@/core/constants'
import type { BasicVariable } from '@/core/types/state-types'
import { ExecutionError } from '@/features/ide/errors/ExecutionError'
import { resetRuntimePalettes } from '@/shared/data/palette'
import i18n from '@/shared/i18n'
import { logComposable } from '@/shared/logger'

import { formatArrayForDisplay } from './useBasicIdeFormatting'
import { stopAudioPlayback } from './useBasicIdeMessageHandlers'
import { clearScreenBuffer, initializeScreenBuffer } from './useBasicIdeScreenUtils'
import type { BasicIdeState } from './useBasicIdeState'
import type { BasicIdeWorkerIntegration } from './useBasicIdeWorkerIntegration'
import { clearAllCaches } from './useKonvaScreenRenderer'
import { useProgramStore } from './useProgramStore'

/** Parser returns CST or null; used by runCode. */
export type ParseCodeFn = () => Promise<unknown>

export interface BasicIdeExecution {
  runCode: () => Promise<void>
  stopCode: () => void
  clearOutput: () => void
  clearAll: () => void
  cleanup: () => void
}

export interface BasicIdeExecutionOptions {
  /** Called after clearing state so shared display buffer is updated and Screen redraws. */
  clearSharedDisplay?: () => void
  /** Called after clearing state so worker clears DEF SPRITE and DEF MOVE definitions. */
  clearWorkerDisplay?: () => void
}

/**
 * Create run/stop/clear actions. Requires parseCode from editor for runCode.
 */
export function useBasicIdeExecution(
  state: BasicIdeState,
  worker: BasicIdeWorkerIntegration,
  parseCode: ParseCodeFn,
  options?: BasicIdeExecutionOptions
): BasicIdeExecution {
  const runCode = async () => {
    if (state.isRunning.value) return

    state.isRunning.value = true
    state.output.value = []
    state.errors.value = []
    state.variables.value = {}
    state.debugOutput.value = ''

    // Reset palette state so mutations from the previous program do not
    // persist into this run (issue #435). Module-level color arrays:
    resetRuntimePalettes()
    // Reactive state (bgPalette, cgenMode, etc.) — the worker does not send
    // initial palette values at the start of execution, so we must reset here.
    state.bgPalette.value = 1
    state.spritePalette.value = 1
    state.backdropColor.value = 0
    state.cgenMode.value = 2

    try {
      await worker.initializeWebWorker()

      const isHealthy = await worker.checkWebWorkerHealth()
      if (!isHealthy) {
        logComposable.debug('Web worker unhealthy, restarting...')
        await worker.restartWebWorker()
      }

      const cst = await parseCode()
      if (!cst) {
        state.isRunning.value = false
        return
      }

      clearScreenBuffer(state.screenBuffer, state.cursorX, state.cursorY)
      // Clear sprite image cache to prevent stale images from previous runs
      clearAllCaches()
      // movementStates no longer needed - read from shared buffer instead
      state.movementPositionsFromBuffer.value = new Map()

      // Send BG data from program store to worker for VIEW command
      const programStore = useProgramStore()
      const bgGridData = programStore.bg
      worker.sendBgData(bgGridData)
      logComposable.debug('[IDE] Sent BG grid data to worker for VIEW command')

      const result = await worker.sendMessageToWorker({
        type: 'EXECUTE',
        id: `execute-${Date.now()}`,
        timestamp: Date.now(),
        data: {
          code: state.code.value,
          config: {
            maxIterations: EXECUTION_LIMITS.MAX_ITERATIONS_PRODUCTION,
            maxOutputLines: EXECUTION_LIMITS.MAX_OUTPUT_LINES_PRODUCTION,
            enableDebugMode: state.debugMode.value,
            strictMode: true,
          },
        },
      })

      if (result?.errors && result.errors.length > 0) {
        state.errors.value = result.errors
        logComposable.error('[IDE] Run finished with errors:', result.errors[0]?.message, result.errors)
      }

      if (result?.variables) {
        const vars: Record<string, BasicVariable> =
          result.variables instanceof Map ? Object.fromEntries(result.variables) : result.variables

        if (result.arrays) {
          const arrays = result.arrays instanceof Map ? result.arrays : new Map(Object.entries(result.arrays))
          for (const [arrayName, arrayValue] of arrays.entries()) {
            const formatted = formatArrayForDisplay(arrayValue)
            vars[arrayName] = {
              value: formatted,
              type: arrayName.endsWith('$') ? 'string' : 'number',
            }
          }
        }

        state.variables.value = vars
      }

      if (result?.spriteStates) {
        state.spriteStates.value = result.spriteStates
      }
      if (result?.spriteEnabled !== undefined) {
        state.spriteEnabled.value = result.spriteEnabled
      }

      // movementStates no longer received in RESULT - read from shared buffer instead
    } catch (error) {
      logComposable.error('Execution error:', error)
      if (error instanceof ExecutionError) {
        state.errors.value = [
          {
            line: error.lineNumber ?? 0,
            message: error.message,
            type: 'runtime',
            ...(error.stackTrace && { stack: error.stackTrace }),
            ...(error.sourceLine && { sourceLine: error.sourceLine }),
          },
        ]
      } else {
        const rawMessage = error instanceof Error ? error.message : 'Execution error'
        const message =
          rawMessage === ERROR_MESSAGES.WORKER_TIMEOUT
            ? i18n.global.t('ide.errors.executionTimeout')
            : rawMessage
        state.errors.value = [
          {
            line: 0,
            message,
            type: 'runtime',
          },
        ]
      }
    } finally {
      state.isRunning.value = false
    }
  }

  const stopCode = () => {
    state.isRunning.value = false
    if (worker.webWorkerManager.worker) {
      worker.webWorkerManager.worker.postMessage({
        type: 'STOP',
        id: `stop-${Date.now()}`,
        timestamp: Date.now(),
        data: {},
      })
    }
  }

  const clearOutput = () => {
    // Stop any playing audio (uses shared audio player from message handlers)
    stopAudioPlayback()

    // Reset module-level palette arrays so mutated PALETB/PALETS state from
    // the previous program does not persist into the next run (issue #435).
    resetRuntimePalettes()

    state.output.value = []
    state.errors.value = []
    state.variables.value = {}
    state.debugOutput.value = ''
    state.screenBuffer.value = initializeScreenBuffer()
    state.cursorX.value = 0
    state.cursorY.value = 0
    // Reset BG/screen state to defaults so stale palettes, backdrop, and cgen do not persist
    state.bgPalette.value = 1
    state.spritePalette.value = 1
    state.backdropColor.value = 0
    state.cgenMode.value = 2
    // Clear BG items (above), SPRITEs (DEF SPRITE + display)
    state.spriteStates.value = []
    // Do NOT clear spriteEnabled - SPRITE ON/OFF state should persist (Clear only clears display)
    // movementStates no longer tracked locally - read from shared buffer instead
    state.movementPositionsFromBuffer.value = new Map()
    state.frontSpriteNodes.value = new Map()
    state.backSpriteNodes.value = new Map()
    state.spriteActionQueues.value = new Map()
    // Flush cleared state to shared buffer and bump sequence so Screen re-decodes and redraws BG + sprites
    options?.clearSharedDisplay?.()
    // Clear worker DEF SPRITE and DEF MOVE definitions so next Run starts with no definitions
    options?.clearWorkerDisplay?.()
  }

  const clearAll = () => {
    state.code.value = ''
    clearOutput()
    state.highlightedCode.value = ''
  }

  const cleanup = () => {
    // Audio player cleanup is handled by cleanupMessageHandlers() from useBasicIdeMessageHandlers
  }

  return {
    runCode,
    stopCode,
    clearOutput,
    clearAll,
    cleanup,
  }
}
