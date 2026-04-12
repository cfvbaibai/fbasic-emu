/**
 * Enhanced Composable for Family Basic IDE functionality.
 *
 * Composes state, screen integration, worker, execution, and editor modules.
 * Single entry point; implementation is split for maintainability (<500 lines per file).
 *
 * @example
 * ```typescript
 * const {
 *   code,
 *   isRunning,
 *   output,
 *   errors,
 *   runCode,
 *   stopCode,
 *   clearOutput,
 *   highlightedCode
 * } = useBasicIde()
 * ```
 */

import { onDeactivated, onUnmounted, watch } from 'vue'

import { useBasicIdeEditor } from './useBasicIdeEditor'
import { useBasicIdeExecution } from './useBasicIdeExecution'
import { cleanupMessageHandlers } from './useBasicIdeMessageHandlers'
import { useBasicIdeScreenIntegration } from './useBasicIdeScreenIntegration'
import { useBasicIdeState } from './useBasicIdeState'
import { useBasicIdeWorkerIntegration } from './useBasicIdeWorkerIntegration'
import { useKeyboardInput } from './useKeyboardInput'
import { useProgramStore } from './useProgramStore'

/**
 * Enhanced composable: reactive state and methods for IDE (AST-based parser, worker, screen).
 */
export function useBasicIde() {
  const state = useBasicIdeState()
  const screen = useBasicIdeScreenIntegration(state)
  const worker = useBasicIdeWorkerIntegration(state, screen)
  const editor = useBasicIdeEditor(state)
  const execution = useBasicIdeExecution(state, worker, editor.parseCode, {
    clearSharedDisplay: () => screen.clearDisplayToSharedBuffer(),
    clearWorkerDisplay: () => worker.sendClearDisplay(),
  })

  // Keyboard input for INKEY$ function
  // Only active when input mode is 'keyboard' and program is running
  useKeyboardInput({
    sharedKeyboardView: () => screen.sharedKeyboardBufferView,
    enabled: () => state.isRunning.value,
    inputMode: state.inputMode,
  })

  // Program store integration
  const programStore = useProgramStore()

  // Sync code from program store to IDE state on mount and when program changes
  watch(
    () => programStore.code,
    (newCode) => {
      if (newCode !== state.code.value) {
        state.code.value = newCode
      }
    },
    { immediate: true }
  )

  // Sync code from IDE state back to program store when user edits
  watch(
    state.code,
    (newCode) => {
      if (newCode !== programStore.code) {
        programStore.setCode(newCode)
      }
    }
  )

  const toggleDebugMode = () => {
    state.debugMode.value = !state.debugMode.value
  }

  watch(
    state.code,
    () => {
      void editor.updateHighlighting()
    },
    { immediate: true }
  )

  // Cleanup on unmount AND deactivation (keep-alive support)
  const cleanup = () => {
    execution.cleanup()
    screen.cleanup()
    worker.cleanupWebWorker()
    cleanupMessageHandlers()
  }
  onUnmounted(cleanup)
  onDeactivated(cleanup)

  return {
    // State
    code: state.code,
    isRunning: state.isRunning,
    output: state.output,
    errors: state.errors,
    variables: state.variables,
    highlightedCode: state.highlightedCode,
    debugOutput: state.debugOutput,
    debugMode: state.debugMode,
    screenBuffer: state.screenBuffer,
    cursorX: state.cursorX,
    cursorY: state.cursorY,
    bgPalette: state.bgPalette,
    backdropColor: state.backdropColor,
    spritePalette: state.spritePalette,
    cgenMode: state.cgenMode,
    spriteStates: state.spriteStates,
    spriteEnabled: state.spriteEnabled,
    // movementStates removed - read from shared buffer instead
    movementPositionsFromBuffer: state.movementPositionsFromBuffer,
    frontSpriteNodes: state.frontSpriteNodes,
    backSpriteNodes: state.backSpriteNodes,
    pendingInputRequest: state.pendingInputRequest,
    respondToInputRequest: worker.respondToInputRequest,

    // Input mode
    inputMode: state.inputMode,

    // Methods
    runCode: execution.runCode,
    stopCode: execution.stopCode,
    clearOutput: execution.clearOutput,
    clearAll: execution.clearAll,
    currentSampleType: state.currentSampleType,
    loadSampleCode: editor.loadSampleCode,
    sampleSelectOptions: editor.sampleSelectOptions,
    updateHighlighting: editor.updateHighlighting,
    validateCode: editor.validateCode,
    getParserCapabilities: editor.getParserCapabilities,
    getHighlighterCapabilities: editor.getHighlighterCapabilities,
    toggleDebugMode,

    // Web worker / screen
    sendStickEvent: worker.sendStickEvent,
    sendStrigEvent: worker.sendStrigEvent,
    sharedDisplayBufferAccessor: screen.sharedDisplayBufferAccessor,
    sharedAnimationBuffer: screen.sharedAnimationBuffer,
    sharedDisplayViews: screen.sharedDisplayViews,
    sharedJoystickBuffer: screen.sharedJoystickBuffer,
    sharedKeyboardBufferView: screen.sharedKeyboardBufferView,
    setDecodedScreenState: screen.setDecodedScreenState,
    registerCallbacks: screen.registerCallbacks,
  }
}
