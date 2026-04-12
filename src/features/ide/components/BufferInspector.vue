<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import type { SpriteState } from '@/core/sprite/types'
import { GameBlock } from '@/shared/components/ui'

import DisplayBufferSection from './DisplayBufferSection.vue'
import JoystickBufferSection from './JoystickBufferSection.vue'
import KeyboardBufferSection from './KeyboardBufferSection.vue'
import SpriteSlotsSection from './SpriteSlotsSection.vue'
import type { ScreenBufferReader } from './types'

defineOptions({
  name: 'BufferInspector',
})

defineProps<{
  spriteStates: SpriteState[]
  spriteEnabled: boolean
  sharedDisplayBufferAccessor: ScreenBufferReader
  sharedJoystickBuffer?: SharedArrayBuffer
  tick?: number
  keyboardView: KeyboardBufferView
}>()

const { t } = useI18n()
</script>

<template>
  <GameBlock
    :title="t('ide.bufferInspector.title')"
    title-icon="mdi:memory"
    :hide-header="true"
    class="buffer-inspector"
  >
    <div class="buffer-inspector-content">
      <DisplayBufferSection :shared-display-buffer-accessor="sharedDisplayBufferAccessor" />
      <JoystickBufferSection
        :shared-joystick-buffer="sharedJoystickBuffer"
        :tick="tick"
      />
      <KeyboardBufferSection :keyboard-view="keyboardView" />
      <SpriteSlotsSection :sprite-states="spriteStates" :sprite-enabled="spriteEnabled" />
    </div>
  </GameBlock>
</template>

<style scoped>
.buffer-inspector {
  height: 100%;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.buffer-inspector :deep(.game-block-content) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.buffer-inspector-content {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
