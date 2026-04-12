<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'
import { GameBlock } from '@/shared/components/ui'

import AnimationSyncSection from './AnimationSyncSection.vue'
import DisplayBufferSection from './DisplayBufferSection.vue'
import JoystickBufferSection from './JoystickBufferSection.vue'
import SpriteSlotsSection from './SpriteSlotsSection.vue'

defineOptions({
  name: 'BufferInspector',
})

const props = defineProps<{
  spriteStates: SpriteState[]
  spriteEnabled: boolean
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
  sharedJoystickBuffer?: SharedArrayBuffer
  tick?: number
}>()

const { t } = useI18n()

const syncCommand = computed(() => props.sharedDisplayBufferAccessor.readSyncCommand())
const ackStatus = computed(() => props.sharedDisplayBufferAccessor.readAck())
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
      <SpriteSlotsSection :sprite-states="spriteStates" :sprite-enabled="spriteEnabled" />
      <AnimationSyncSection :sync-command="syncCommand" :ack-status="ackStatus" />
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
  gap: 0.5rem;
  overflow: hidden;
}
</style>
