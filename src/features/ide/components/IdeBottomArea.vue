<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import { GameTabPane, GameTabs } from '@/shared/components/ui'

import BufferInspector from './BufferInspector.vue'
import JoystickControl from './JoystickControl.vue'
import StateInspector from './StateInspector.vue'

/**
 * IdeBottomArea - Bottom panel containing Joystick and inspector tabs.
 * Extracted from IdePage to reduce file size.
 */

defineOptions({
  name: 'IdeBottomArea',
})

defineProps<Props>()

interface Props {
  // JoystickControl props
  sendStrigEvent?: (joystickId: number, state: number) => void
  sharedJoystickBuffer?: SharedArrayBuffer

  // StateInspector props
  screenBuffer: ScreenCell[][]
  cursorX: number
  cursorY: number
  bgPalette: number
  spritePalette: number
  backdropColor: number
  cgenMode: number
  spriteStates: SpriteState[]
  spriteEnabled: boolean
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
}

const { t } = useI18n()
const activeTab = ref('state')

// StateInspector ref for animation loop to call updateMoveSlotsData
const stateInspectorRef = useTemplateRef<{ updateMoveSlotsData: () => void }>('stateInspectorRef')

// Expose StateInspector methods for parent (animation loop)
defineExpose({
  updateMoveSlotsData: () => stateInspectorRef.value?.updateMoveSlotsData(),
})
</script>

<template>
  <div class="bottom-area">
    <div class="bottom-left">
      <JoystickControl
        :send-strig-event="sendStrigEvent"
        :shared-joystick-buffer="sharedJoystickBuffer"
      />
    </div>
    <div class="bottom-right">
      <GameTabs v-model="activeTab" type="border-card" class="inspector-tabs">
        <GameTabPane name="state" :label="t('ide.stateInspector.title')">
          <StateInspector
            ref="stateInspectorRef"
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
        </GameTabPane>
        <GameTabPane name="buffer" :label="t('ide.bufferInspector.title')">
          <BufferInspector />
        </GameTabPane>
      </GameTabs>
    </div>
  </div>
</template>

<style scoped>
.bottom-area {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  padding: 0 1rem;
  min-height: 0;
}

.bottom-left {
  flex: 0 1 auto;
  min-width: 0;
}

.bottom-right {
  flex: 1 1 0;
  min-width: 500px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.inspector-tabs {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
</style>
