<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue'

import type { SharedDisplayViews } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type {
  BasicVariable,
  HighlighterInfo,
  ParserInfo,
  RequestInputMessage,
  ScreenCell,
} from '@/core/interfaces'
import type { SpriteState } from '@/core/sprite/types'
import { GameLayout } from '@/shared/components/ui'
import { useContainerWidth } from '@/shared/composables/useContainerWidth'

import CommandPalette from './components/CommandPalette.vue'
import IdeBottomArea from './components/IdeBottomArea.vue'
import IdeEditorPanel from './components/IdeEditorPanel.vue'
import IdeOutputPanel from './components/IdeOutputPanel.vue'
import InputModal from './components/InputModal.vue'
import SampleSelector from './components/SampleSelector.vue'
import {
  type CommandPaletteCommand,
  isEditableTarget,
  matchesAnyShortcut,
} from './composables/commandPalette'
import { useBasicIde as useBasicIdeEnhanced } from './composables/useBasicIdeEnhanced'
import type { InputMode } from './composables/useBasicIdeState'
import { provideScreenContext } from './composables/useScreenContext'

/**
 * IdePage component - The main IDE page for F-BASIC code editing and execution.
 * Provides code editor, runtime output, controls, and joystick interface.
 */
defineOptions({
  name: 'IdePage',
})

const isE2ELite =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === 'lite'

const basicIde = isE2ELite ? null : useBasicIdeEnhanced()

const code = basicIde?.code ?? ref('')
const isRunning = basicIde?.isRunning ?? ref(false)
const output = basicIde?.output ?? ref<string[]>([])
const errors =
  basicIde?.errors ??
  ref<Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>>([])
const variables = basicIde?.variables ?? ref<Record<string, BasicVariable>>({})
const debugOutput = basicIde?.debugOutput ?? ref('')
const debugMode = basicIde?.debugMode ?? ref(false)
const screenBuffer = basicIde?.screenBuffer ?? ref<ScreenCell[][]>([])
const cursorX = basicIde?.cursorX ?? ref(0)
const cursorY = basicIde?.cursorY ?? ref(0)
const bgPalette = basicIde?.bgPalette ?? ref(1)
const backdropColor = basicIde?.backdropColor ?? ref(0)
const spritePalette = basicIde?.spritePalette ?? ref(1)
const cgenMode = basicIde?.cgenMode ?? ref(2)
const spriteStates = basicIde?.spriteStates ?? ref<SpriteState[]>([])
const spriteEnabled = basicIde?.spriteEnabled ?? ref(true)
const movementPositionsFromBuffer =
  basicIde?.movementPositionsFromBuffer ?? ref<Map<number, { x: number; y: number }>>(new Map())
const frontSpriteNodes = basicIde?.frontSpriteNodes ?? ref<Map<number, unknown>>(new Map())
const backSpriteNodes = basicIde?.backSpriteNodes ?? ref<Map<number, unknown>>(new Map())
const inputMode = basicIde?.inputMode ?? ref<InputMode>('joystick')

const runCode =
  basicIde?.runCode ??
  (async () => {
    isRunning.value = true
  })
const stopCode =
  basicIde?.stopCode ??
  (() => {
    isRunning.value = false
  })
const clearOutput =
  basicIde?.clearOutput ??
  (() => {
    output.value = []
    errors.value = []
    variables.value = {}
    debugOutput.value = ''
  })
const loadSampleCode = basicIde?.loadSampleCode ?? (() => false)
const getParserCapabilities =
  basicIde?.getParserCapabilities ??
  (() => ({
    name: 'E2E Lite Parser',
    version: '0.0.0',
    capabilities: [],
    features: [],
    supportedStatements: [],
    supportedFunctions: [],
    supportedOperators: [],
  }))
const getHighlighterCapabilities =
  basicIde?.getHighlighterCapabilities ??
  (() => ({
    name: 'E2E Lite Highlighter',
    version: '0.0.0',
    features: [],
  }))
const toggleDebugMode =
  basicIde?.toggleDebugMode ??
  (() => {
    debugMode.value = !debugMode.value
  })
const debugBuffer = basicIde?.debugBuffer ?? (() => {})
const sendStrigEvent = basicIde?.sendStrigEvent ?? (() => {})
const sharedDisplayBufferAccessor =
  basicIde?.sharedDisplayBufferAccessor ?? ({} as SharedDisplayBufferAccessor)
const sharedAnimationBuffer = basicIde?.sharedAnimationBuffer ?? ({} as SharedArrayBuffer)
const sharedDisplayViews: SharedDisplayViews = basicIde?.sharedDisplayViews ?? {
  buffer: {} as SharedArrayBuffer,
  spriteView: {} as Float64Array,
  charView: {} as Uint8Array,
  patternView: {} as Uint8Array,
  cursorView: {} as Uint8Array,
  sequenceView: {} as Int32Array,
  scalarsView: {} as Uint8Array,
  animationSyncView: {} as Float64Array,
}
const sharedJoystickBuffer = basicIde?.sharedJoystickBuffer ?? ({} as SharedArrayBuffer)
const setDecodedScreenState = basicIde?.setDecodedScreenState ?? (() => {})
const registerScheduleRender = basicIde?.registerScheduleRender ?? (() => {})
const pendingInputRequest = basicIde?.pendingInputRequest ?? ref<RequestInputMessage['data'] | null>(null)
const respondToInputRequest =
  basicIde?.respondToInputRequest ?? ((_requestId: string, _values: string[], _cancelled: boolean) => {})

// UI state
const sampleSelectorOpen = shallowRef(false)
const commandPaletteOpen = shallowRef(false)
const editorView = shallowRef<'code' | 'bg'>('code')
const logLevelPanelOpen = shallowRef(false)

// Responsive toolbar - observe editor panel which expands with screen
const editorPanelRef = useTemplateRef<HTMLDivElement>('editorPanelRef')
const isToolbarCompact = useContainerWidth(editorPanelRef, 900)

// StateInspector ref for animation loop to call updateMoveSlotsData
const bottomAreaRef = useTemplateRef<{ updateMoveSlotsData: () => void }>('bottomAreaRef')

// Provide screen context so ScreenTab/Screen can inject instead of prop drilling
if (!isE2ELite && sharedDisplayViews && sharedDisplayBufferAccessor && sharedAnimationBuffer && sharedJoystickBuffer) {
  provideScreenContext({
    screenBuffer,
    cursorX,
    cursorY,
    bgPalette,
    backdropColor,
    spritePalette,
    cgenMode,
    spriteStates,
    spriteEnabled,
    movementPositionsFromBuffer,
    externalFrontSpriteNodes: frontSpriteNodes,
    externalBackSpriteNodes: backSpriteNodes,
    sharedDisplayViews: ref(sharedDisplayViews),
    sharedDisplayBufferAccessor,
    sharedAnimationBuffer: ref(sharedAnimationBuffer),
    sharedJoystickBuffer: ref(sharedJoystickBuffer),
    setDecodedScreenState,
    registerScheduleRender,
    // Callback for animation loop to update inspector MOVE tab data
    updateInspectorMoveSlots: () => bottomAreaRef.value?.updateMoveSlotsData(),
  })
}

// Input modal response handler
function handleInputResponse(
  requestId: string,
  values: (string | number)[],
  cancelled: boolean,
) {
  respondToInputRequest(requestId, values.map(String), cancelled)
}

// Handle sample selection with view switching
function handleLoadSample(sampleType: string) {
  const hasBg = loadSampleCode(sampleType)
  sampleSelectorOpen.value = false
  // Switch to code view if sample has no BG data and currently viewing bg-editor
  if (!hasBg && editorView.value === 'bg') {
    editorView.value = 'code'
  }
}

function openCommandPalette() {
  commandPaletteOpen.value = true
}

function closeCommandPalette() {
  commandPaletteOpen.value = false
}

async function restartCode() {
  stopCode()
  await runCode()
}

const commandPaletteCommands = computed<CommandPaletteCommand[]>(() => [
  {
    id: 'run.start',
    title: 'Run Program',
    description: 'Execute the current BASIC program.',
    shortcut: 'Ctrl+Enter / Cmd+Enter',
    keywords: ['execute', 'start', 'run'],
    enabled: !isRunning.value,
    execute: () => {
      void runCode()
    },
  },
  {
    id: 'run.stop',
    title: 'Stop Program',
    description: 'Stop the currently running program.',
    shortcut: 'Ctrl+Shift+Enter / Cmd+Shift+Enter',
    keywords: ['halt', 'stop'],
    enabled: isRunning.value,
    execute: stopCode,
  },
  {
    id: 'run.restart',
    title: 'Restart Program',
    description: 'Stop and execute the current program again.',
    shortcut: 'Ctrl+Shift+R / Cmd+Shift+R',
    keywords: ['restart', 'rerun'],
    execute: () => {
      void restartCode()
    },
  },
  {
    id: 'run.clearOutput',
    title: 'Clear Output',
    description: 'Clear output, errors, variables, and screen state.',
    keywords: ['clear', 'output', 'screen'],
    execute: clearOutput,
  },
  {
    id: 'view.openSampleSelector',
    title: 'Load Sample Program',
    description: 'Open the sample selector.',
    keywords: ['sample', 'demo'],
    execute: () => {
      sampleSelectorOpen.value = true
    },
  },
  {
    id: 'view.openLogFilters',
    title: 'Open Output Log Filters',
    description: 'Open runtime output log-level controls.',
    keywords: ['output', 'logs', 'filters'],
    execute: () => {
      logLevelPanelOpen.value = true
    },
  },
  {
    id: 'view.switchToCode',
    title: 'Switch To Code Editor',
    description: 'Show the Monaco code editor panel.',
    keywords: ['code', 'editor'],
    execute: () => {
      editorView.value = 'code'
    },
  },
  {
    id: 'view.switchToBgEditor',
    title: 'Switch To BG Editor',
    description: 'Show the BG editor panel.',
    keywords: ['bg', 'background', 'editor'],
    execute: () => {
      editorView.value = 'bg'
    },
  },
  {
    id: 'input.toggleMode',
    title: 'Toggle Input Mode',
    description: 'Switch between joystick and keyboard input mode.',
    shortcut: 'F9',
    keywords: ['input', 'keyboard', 'joystick'],
    execute: toggleInputMode,
  },
  {
    id: 'debug.toggle',
    title: 'Toggle Debug Mode',
    description: 'Enable or disable runtime debug output.',
    keywords: ['debug'],
    execute: toggleDebugMode,
  },
])

async function handleExecuteCommandFromPalette(command: CommandPaletteCommand) {
  closeCommandPalette()
  await command.execute()
}

// Computed properties for backward compatibility
const canRun = computed(() => !isRunning.value)
const canStop = isRunning

// Parser capabilities for display
const parserInfo = shallowRef<ParserInfo | null>(null)
const highlighterInfo = shallowRef<HighlighterInfo | null>(null)

// Initialize parser info
onMounted(() => {
  parserInfo.value = getParserCapabilities()
  highlighterInfo.value = getHighlighterCapabilities()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Global hotkey handler
function handleGlobalKeydown(e: KeyboardEvent) {
  if (matchesAnyShortcut(e, ['Ctrl+Shift+P', 'Meta+Shift+P'])) {
    e.preventDefault()
    openCommandPalette()
    return
  }

  if (commandPaletteOpen.value || isEditableTarget(e.target)) return

  if (matchesAnyShortcut(e, ['Ctrl+Enter', 'Meta+Enter'])) {
    e.preventDefault()
    void runCode()
    return
  }

  if (matchesAnyShortcut(e, ['Ctrl+Shift+Enter', 'Meta+Shift+Enter'])) {
    e.preventDefault()
    stopCode()
    return
  }

  if (matchesAnyShortcut(e, ['Ctrl+Shift+R', 'Meta+Shift+R'])) {
    e.preventDefault()
    void restartCode()
    return
  }

  // F9: Toggle input mode (joystick/keyboard)
  if (e.key === 'F9') {
    e.preventDefault()
    toggleInputMode()
  }
}

// Toggle input mode between joystick and keyboard
function toggleInputMode() {
  inputMode.value = inputMode.value === 'joystick' ? 'keyboard' : 'joystick'
}
</script>

<template>
  <GameLayout>
    <div class="ide-container">
      <!-- Main IDE Content -->
      <div class="ide-content">
        <!-- Left Panel - Code Editor -->
        <div ref="editorPanelRef" class="editor-panel-outer">
          <IdeEditorPanel
            :code="code"
            :editor-view="editorView"
            :is-toolbar-compact="isToolbarCompact"
            :is-running="isRunning"
            :can-run="canRun"
            :can-stop="canStop"
            :debug-mode="debugMode"
            :input-mode="inputMode"
            @update:code="code = $event"
            @update:editor-view="editorView = $event"
            @update:input-mode="inputMode = $event"
            @run="runCode"
            @stop="stopCode"
            @clear="clearOutput"
            @toggle-debug="toggleDebugMode"
            @debug-buffer="debugBuffer"
            @open-sample-selector="sampleSelectorOpen = true"
          />
        </div>

        <!-- Right Panel - Runtime Output -->
        <IdeOutputPanel
          v-if="!isE2ELite"
          v-model:log-level-panel-open="logLevelPanelOpen"
          :output="output"
          :is-running="isRunning"
          :errors="errors"
          :variables="variables"
          :debug-output="debugOutput"
          :debug-mode="debugMode"
        />
      </div>

      <!-- Bottom area: Joystick (left) + State Inspector (right) -->
      <IdeBottomArea
        v-if="!isE2ELite"
        ref="bottomAreaRef"
        :send-strig-event="sendStrigEvent"
        :shared-joystick-buffer="sharedJoystickBuffer"
        :screen-buffer="screenBuffer"
        :cursor-x="cursorX"
        :cursor-y="cursorY"
        :bg-palette="bgPalette"
        :sprite-palette="spritePalette"
        :backdrop-color="backdropColor"
        :cgen-mode="cgenMode"
        :sprite-states="spriteStates"
        :sprite-enabled="spriteEnabled"
        :shared-display-buffer-accessor="sharedDisplayBufferAccessor"
      />

      <!-- INPUT/LINPUT modal overlay -->
      <Teleport v-if="!isE2ELite" to="body">
        <InputModal
          :pending-request="pendingInputRequest"
          @respond="handleInputResponse"
        />

        <!-- Sample Selector -->
        <SampleSelector
          v-if="sampleSelectorOpen"
          @select="handleLoadSample"
          @close="sampleSelectorOpen = false"
        />

        <CommandPalette
          :open="commandPaletteOpen"
          :commands="commandPaletteCommands"
          @close="closeCommandPalette"
          @execute="handleExecuteCommandFromPalette"
        />
      </Teleport>
    </div>
  </GameLayout>
</template>

<style scoped>
.ide-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
  overflow-x: hidden;
}

.ide-content {
  grid-row: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  gap: 1rem;
  padding: 0 1rem 1rem;
}

.editor-panel-outer {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
