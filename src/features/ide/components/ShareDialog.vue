<script setup lang="ts">
/**
 * ShareDialog - Shows a shareable URL for the current program and copies to clipboard.
 */

import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { TIMING } from '@/core/constants'
import type { CompactBg } from '@/core/types/program-types'
import { encodeProgram } from '@/shared/utils/programCodec'

const props = withDefaults(defineProps<{
  visible: boolean
  source: string
  bg?: CompactBg
}>(), {
  bg: undefined,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const urlInputRef = useTemplateRef<HTMLInputElement>('urlInputRef')

// State
const shareUrl = ref('')
const isEncoding = ref(false)
const error = ref('')
const tooLarge = ref(false)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (copiedTimer !== null) {
    clearTimeout(copiedTimer)
  }
})

// Encode the program when dialog opens
watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return

    isEncoding.value = true
    error.value = ''
    tooLarge.value = false
    copied.value = false

    try {
      const result = await encodeProgram(props.source, props.bg)
      shareUrl.value = result.url
      tooLarge.value = result.tooLarge

      // Select the URL text after rendering
      await nextTick()
      urlInputRef.value?.select()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isEncoding.value = false
    }
  },
)

async function handleCopy(): Promise<void> {
  if (!shareUrl.value) return

  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    if (copiedTimer !== null) {
      clearTimeout(copiedTimer)
    }
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = null
    }, TIMING.COPIED_FEEDBACK_MS)
  } catch {
    // Fallback: select the input text so user can manually copy
    urlInputRef.value?.select()
  }
}

function handleClose(): void {
  emit('close')
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (!props.visible) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleClose()
  }
}

const copyLabel = computed(() =>
  copied.value
    ? t('ide.share.copied')
    : t('ide.share.copy'),
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="game-dialog-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="t('ide.share.title')"
      @click="handleOverlayClick"
    >
      <div class="game-dialog">
        <h3 class="game-dialog-title">
          {{ t('ide.share.title') }}
        </h3>

        <div v-if="isEncoding" class="game-dialog-loading">
          {{ t('ide.share.encoding') }}
        </div>

        <div v-else-if="error" class="game-dialog-error">
          {{ t('ide.share.encodeFailed') }}
        </div>

        <template v-else>
          <p class="game-dialog-description">
            {{ t('ide.share.description') }}
          </p>

          <div class="share-dialog-url-container">
            <input
              ref="urlInputRef"
              v-model="shareUrl"
              type="text"
              class="share-dialog-url-input"
              readonly
              data-testid="share-url-input"
            />
          </div>

          <p v-if="tooLarge" class="share-dialog-warning">
            {{ t('ide.share.tooLarge') }}
          </p>

          <div class="game-dialog-actions">
            <button
              class="game-dialog-btn game-dialog-btn-primary"
              data-testid="share-copy-button"
              @click="handleCopy"
            >
              {{ copyLabel }}
            </button>
            <button
              class="game-dialog-btn game-dialog-btn-secondary"
              data-testid="share-close-button"
              @click="handleClose"
            >
              {{ t('ide.share.close') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@import url('@/shared/styles/dialog.css');

/* Share-specific: URL input container */
.share-dialog-url-container {
  margin-bottom: 0.5rem;
}

.share-dialog-url-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--game-text-primary);
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
}

.share-dialog-url-input:focus {
  border-color: var(--base-solid-primary);
  box-shadow: 0 0 0 2px var(--base-alpha-primary-20);
}

/* Share-specific: too-large warning */
.share-dialog-warning {
  margin: 0.5rem 0 0.75rem;
  font-size: 0.8rem;
  color: var(--semantic-solid-warning);
  line-height: 1.4;
}
</style>
