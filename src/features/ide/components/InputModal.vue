<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { RequestInputMessage } from '@/core/types/worker-messages'
import { GameButton, GameInput } from '@/shared/components/ui'

const props = defineProps<{
  pendingRequest: RequestInputMessage['data'] | null
}>()

const emit = defineEmits<{
  respond: [requestId: string, values: (string | number)[], cancelled: boolean]
}>()

const { t } = useI18n()
const inputValue = ref<string | number>('')
const formRef = useTemplateRef<HTMLFormElement>('formRef')

function focusInput(): void {
  formRef.value?.querySelector<HTMLInputElement>('input')?.focus()
}

const submit = () => {
  const req = props.pendingRequest
  if (!req) return
  const raw = String(inputValue.value)
  const values = req.isLinput ? [raw] : raw.split(',').map(s => s.trim())
  emit('respond', req.requestId, values, false)
  inputValue.value = ''
}

const cancel = () => {
  const req = props.pendingRequest
  if (!req) return
  emit('respond', req.requestId, [], true)
  inputValue.value = ''
}

watch(
  () => props.pendingRequest,
  (request) => {
    inputValue.value = ''
    if (request) {
      void nextTick(() => focusInput())
    }
  },
)
</script>

<template>
  <div
    v-if="pendingRequest"
    class="input-modal-overlay"
    data-testid="input-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="input-modal-prompt"
    @keydown.escape="cancel"
  >
    <div class="input-modal">
      <p id="input-modal-prompt" class="input-modal-prompt">
        {{ pendingRequest.prompt }}
      </p>
      <form ref="formRef" class="input-modal-form" @submit.prevent="submit">
        <GameInput
          v-model="inputValue"
          type="text"
          data-testid="input-modal-field"
          :placeholder="
            pendingRequest.isLinput
              ? t('ide.inputModal.linputPlaceholder')
              : t('ide.inputModal.inputPlaceholder')
          "
          class="input-modal-field"
        />
        <div class="input-modal-actions">
          <GameButton type="primary" size="medium" data-testid="input-modal-submit" @click="submit">
            {{ t('ide.input.submit') }}
          </GameButton>
          <GameButton type="default" size="medium" @click="cancel">
            {{ t('ide.input.cancel') }}
          </GameButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.input-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-dialog-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--base-alpha-gray-00-60);
}

.input-modal {
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: var(--game-shadow-base);
}

.input-modal-prompt {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--game-text-primary);
}

.input-modal-field {
  width: 100%;
  margin-bottom: 1rem;
}

.input-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
