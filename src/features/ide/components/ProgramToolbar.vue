<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useProgramStore } from '@/features/ide/composables/useProgramStore'
import { ConfirmDialog, GameButton, GameIconButton } from '@/shared/components/ui'
import GameIcon from '@/shared/components/ui/GameIcon.vue'

const props = withDefaults(defineProps<{ isCompact?: boolean }>(), {
  isCompact: false,
})

const { t } = useI18n()
const programStore = useProgramStore(t('common.defaultProgramName'))

// Renaming state
const editingName = ref(false)
const tempName = ref('')
const nameInputEl = useTemplateRef<HTMLInputElement>('nameInputEl')

// Confirm dialog state
const showConfirmDialog = ref(false)
const pendingAction = ref<(() => void) | null>(null)

// File operation state
const isFileOperationPending = ref(false)
const errorMessage = ref('')
let errorTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (errorTimer !== null) {
    clearTimeout(errorTimer)
  }
})

function clearError(): void {
  errorMessage.value = ''
  if (errorTimer !== null) {
    clearTimeout(errorTimer)
    errorTimer = null
  }
}

function showError(message: string): void {
  clearError()
  errorMessage.value = message
  errorTimer = setTimeout(() => {
    errorMessage.value = ''
    errorTimer = null
  }, 5000)
}

function confirmDiscard(action: () => void): void {
  if (!programStore.isDirty.value) {
    action()
    return
  }
  pendingAction.value = action
  showConfirmDialog.value = true
}

function handleConfirmDiscard(): void {
  showConfirmDialog.value = false
  const action = pendingAction.value
  pendingAction.value = null
  action?.()
}

function handleCancelDiscard(): void {
  showConfirmDialog.value = false
  pendingAction.value = null
}

// File operations
function handleNew() {
  const defaultName = t('common.defaultProgramName')
  confirmDiscard(() => programStore.newProgram(defaultName))
}

function handleOpen() {
  confirmDiscard(async () => {
    isFileOperationPending.value = true
    try {
      const success = await programStore.open()
      if (!success) {
        showError(t('ide.toolbar.openFailed'))
      }
    } catch {
      showError(t('ide.toolbar.openFailed'))
    } finally {
      isFileOperationPending.value = false
    }
  })
}

async function handleSave() {
  isFileOperationPending.value = true
  try {
    await programStore.save()
  } catch {
    showError(t('ide.toolbar.saveFailed'))
  } finally {
    isFileOperationPending.value = false
  }
}

// Renaming
function startRename() {
  tempName.value = programStore.programName
  editingName.value = true
  nextTick(() => {
    // Focus the native input element inside GameInput
    const input = nameInputEl.value
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function finishRename() {
  const newName = tempName.value.trim()
  if (newName && newName !== programStore.programName) {
    // Use setCode to trigger dirty state - name change is handled separately
    // For now, we just update the name directly in localStorage
    const program = programStore.currentProgram.value
    if (program) {
      // Create updated program with new name
      const updatedProgram = {
        ...program,
        name: newName,
        updatedAt: Date.now(),
      }
      programStore.loadProgram(updatedProgram)
    }
  }
  editingName.value = false
}

function cancelRename() {
  editingName.value = false
}

function handleNameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishRename()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelRename()
  }
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Only handle if not in an input field
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault()
        handleNew()
        break
      case 'o':
        e.preventDefault()
        handleOpen()
        break
      case 's':
        e.preventDefault()
        handleSave()
        break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="program-toolbar">
    <!-- File operations -->
    <div class="file-buttons">
      <template v-if="props.isCompact">
        <GameIconButton
          type="default"
          icon="mdi:file-plus"
          size="small"
          :disabled="isFileOperationPending"
          :title="`${t('ide.toolbar.new')} (Ctrl+N)`"
          data-testid="ide-new-button"
          @click="handleNew"
        />
        <GameIconButton
          type="default"
          icon="mdi:import"
          size="small"
          :loading="isFileOperationPending"
          :title="`${t('ide.toolbar.import')} (Ctrl+O)`"
          data-testid="ide-open-button"
          @click="handleOpen"
        />
        <GameIconButton
          type="primary"
          icon="mdi:export"
          size="small"
          :loading="isFileOperationPending"
          :title="`${t('ide.toolbar.export')} (Ctrl+S)`"
          data-testid="ide-save-button"
          @click="handleSave"
        />
      </template>
      <template v-else>
        <GameButton
          type="default"
          icon="mdi:file-plus"
          size="small"
          :disabled="isFileOperationPending"
          data-testid="ide-new-button"
          @click="handleNew"
        >
          {{ t('ide.toolbar.new') }}
        </GameButton>
        <GameButton
          type="default"
          icon="mdi:import"
          size="small"
          :loading="isFileOperationPending"
          data-testid="ide-open-button"
          @click="handleOpen"
        >
          {{ t('ide.toolbar.import') }}
        </GameButton>
        <GameButton
          type="primary"
          icon="mdi:export"
          size="small"
          :loading="isFileOperationPending"
          data-testid="ide-save-button"
          @click="handleSave"
        >
          {{ t('ide.toolbar.export') }}
        </GameButton>
      </template>
    </div>

    <!-- Error message -->
    <Transition name="error-fade">
      <span v-if="errorMessage" class="error-message" @click="clearError">
        {{ errorMessage }}
      </span>
    </Transition>

    <!-- Program name -->
    <div class="program-name-container">
      <template v-if="editingName">
        <input
          ref="nameInputEl"
          v-model="tempName"
          type="text"
          class="program-name-input"
          :placeholder="t('ide.toolbar.programNamePlaceholder')"
          @blur="finishRename"
          @keydown="handleNameKeydown"
        />
      </template>
      <template v-else>
        <div
          class="program-name-editable"
          :title="programStore.programName"
          @click="startRename"
        >
          <span class="program-name-text">
            {{ programStore.programName }}
          </span>
          <GameIcon icon="mdi:pencil" class="edit-icon" :size="14" />
        </div>
      </template>

      <!-- Dirty indicator -->
      <span v-if="programStore.isDirty.value" class="dirty-indicator" :title="t('ide.toolbar.unsavedChanges')">
        ●
      </span>
    </div>

    <!-- Confirm dialog for unsaved changes -->
    <ConfirmDialog
      :visible="showConfirmDialog"
      :message="t('ide.toolbar.discardConfirm')"
      @confirm="handleConfirmDiscard"
      @cancel="handleCancelDiscard"
    />
  </div>
</template>

<style scoped>
.program-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: 0.75rem;
  border-right: 1px solid var(--game-surface-border);
}

.file-buttons {
  display: flex;
  gap: 0.375rem;
}

/* Override GameButton min-width for toolbar buttons */
.file-buttons :deep(.game-button) {
  min-width: auto;
  padding: 0.375rem 0.625rem;
  font-size: 0.8rem;
}

.program-name-container {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: 0.25rem;
}

.program-name-editable {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.program-name-editable:hover {
  background: var(--game-surface-bg-start);
}

.edit-icon {
  opacity: 0;
  transition: opacity 0.15s ease;
  color: var(--game-text-secondary);
}

.program-name-editable:hover .edit-icon {
  opacity: 1;
}

.program-name-text {
  color: var(--game-text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.program-name-input {
  width: 160px;
  padding: 0.375rem 0.5rem;
  font-size: 0.9375rem;
  color: var(--game-text-primary);
  background: var(--game-surface-bg-start);
  border: 1px solid var(--base-solid-primary);
  border-radius: 4px;
  outline: none;
}

.program-name-input:focus {
  border-color: var(--base-solid-primary);
  box-shadow: 0 0 0 2px var(--base-alpha-primary-20);
}

.dirty-indicator {
  color: var(--base-solid-primary-90);
  font-size: 0.75rem;
  line-height: 1;
}

.error-message {
  color: var(--semantic-solid-danger);
  font-size: 0.75rem;
  cursor: pointer;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
}
</style>
