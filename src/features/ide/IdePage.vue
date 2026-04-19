<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { GameLayout } from '@/shared/components/ui'
import { useContainerWidth } from '@/shared/composables/useContainerWidth'

import CommandPalette from './components/CommandPalette.vue'
import IdeBottomArea from './components/IdeBottomArea.vue'
import IdeEditorPanel from './components/IdeEditorPanel.vue'
import IdeOutputPanel from './components/IdeOutputPanel.vue'
import IdeSpriteViewerPanel from './components/IdeSpriteViewerPanel.vue'
import InputModal from './components/InputModal.vue'
import SampleSelector from './components/SampleSelector.vue'
import TutorialPanel from './components/TutorialPanel.vue'
import type { CommandPaletteCommand } from './composables/commandPalette'
import { useIdeCommandPalette } from './composables/useIdeCommandPalette'
import { useIdeGlobalHotkeys } from './composables/useIdeGlobalHotkeys'
import { useIdePageState } from './composables/useIdePageState'
import { useTutorialPanel } from './composables/useTutorialPanel'

/**
 * IdePage component - The main IDE page for F-BASIC code editing and execution.
 * Provides code editor, runtime output, controls, and joystick interface.
 */
defineOptions({
  name: 'IdePage',
})

const { t } = useI18n()
const route = useRoute()

// All IDE state (with E2E Lite fallbacks) + screen context provision
const bottomAreaRef = useTemplateRef<{ updateMoveSlotsData: () => void }>('bottomAreaRef')
const {
  code,
  isRunning,
  output,
  errors,
  variables,
  debugOutput,
  debugMode,
  screenBuffer,
  cursorX,
  cursorY,
  bgPalette,
  backdropColor,
  spritePalette,
  cgenMode,
  spriteStates,
  spriteEnabled,
  inputMode,
  runCode,
  stopCode,
  clearOutput,
  loadSampleCode,
  getParserCapabilities,
  getHighlighterCapabilities,
  toggleDebugMode,
  sendStrigEvent,
  pendingInputRequest,
  respondToInputRequest,
  sharedDisplayBufferAccessor,
  sharedJoystickBuffer,
  sharedKeyboardBufferView,
  isE2ELite,
  parserInfo,
  highlighterInfo,
  shareError,
  handleShareRoute,
} = useIdePageState(bottomAreaRef)

// UI state
const sampleSelectorOpen = shallowRef(false)
const commandPaletteOpen = shallowRef(false)
const editorView = shallowRef<'code' | 'bg'>('code')
const logLevelPanelOpen = shallowRef(false)
const spriteViewerOpen = shallowRef(false)

// Tutorial panel
const tutorialPanel = useTutorialPanel()

// Responsive toolbar - observe editor panel which expands with screen
const editorPanelRef = useTemplateRef<HTMLDivElement>('editorPanelRef')
const isToolbarCompact = useContainerWidth(editorPanelRef, 900)

// Toggle input mode between joystick and keyboard
function toggleInputMode() {
  inputMode.value = inputMode.value === 'joystick' ? 'keyboard' : 'joystick'
}

// Command palette commands
const { commands: commandPaletteCommands } = useIdeCommandPalette({
  isRunning,
  runCode,
  stopCode,
  clearOutput,
  toggleDebugMode,
  toggleInputMode,
  sampleSelectorOpen,
  logLevelPanelOpen,
  editorView,
})

function openCommandPalette() {
  commandPaletteOpen.value = true
}

function closeCommandPalette() {
  commandPaletteOpen.value = false
}

async function handleExecuteCommandFromPalette(command: CommandPaletteCommand) {
  closeCommandPalette()
  await command.execute()
}

// Computed properties for backward compatibility
const canRun = computed(() => !isRunning.value)
const canStop = isRunning

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
  const displayName = t(`ide.samples.items.${sampleType}.name`)
  const hasBg = loadSampleCode(sampleType, displayName)
  sampleSelectorOpen.value = false
  // Switch to code view if sample has no BG data and currently viewing bg-editor
  if (!hasBg && editorView.value === 'bg') {
    editorView.value = 'code'
  }
}

function dismissShareError() {
  shareError.value = ''
}

// Initialize parser info and handle share route
onMounted(() => {
  parserInfo.value = getParserCapabilities()
  highlighterInfo.value = getHighlighterCapabilities()

  // If we arrived via a share link, decode and load the program
  if (route.name === 'Share') {
    void handleShareRoute()
  }
})

// Register global keyboard shortcuts (command palette, run/stop/restart, F9)
useIdeGlobalHotkeys({
  commandPaletteOpen,
  inputMode,
  runCode,
  stopCode,
  openCommandPalette,
})
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
            @open-sample-selector="sampleSelectorOpen = true"
            @open-sprite-viewer="spriteViewerOpen = true"
            @toggle-tutorial-panel="tutorialPanel.toggle()"
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

        <!-- Right Side Panel - Tutorial -->
        <TutorialPanel
          v-if="tutorialPanel.isVisible.value"
          :has-prev="tutorialPanel.hasPrev.value"
          :has-next="tutorialPanel.hasNext.value"
          @close="tutorialPanel.close()"
          @prev="tutorialPanel.goToPrev()"
          @next="tutorialPanel.goToNext()"
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
        :keyboard-view="sharedKeyboardBufferView"
      />

      <!-- INPUT/LINPUT modal overlay -->
      <Teleport v-if="!isE2ELite" to="body">
        <!-- Share error notification -->
        <div v-if="shareError" class="share-error-toast" data-testid="share-error-toast">
          <span class="share-error-text">{{ t('ide.share.loadFailed') }}: {{ shareError }}</span>
          <button
            class="share-error-dismiss"
            @click="dismissShareError"
          >
            &times;
          </button>
        </div>

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

        <!-- Sprite Viewer Side Panel -->
        <IdeSpriteViewerPanel
          v-if="spriteViewerOpen"
          @close="spriteViewerOpen = false"
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

.share-error-toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--game-surface-bg-gradient);
  border: 1px solid var(--semantic-solid-danger);
  border-radius: 8px;
  box-shadow: var(--game-shadow-base);
  max-width: 80vw;
}

.share-error-text {
  font-size: 0.8rem;
  color: var(--semantic-solid-danger);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-error-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--game-text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}
</style>
