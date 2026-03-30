<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProgramData } from '@/core/types/program-types'
import { useProgramLibrary } from '@/features/ide/composables/useProgramLibrary'
import { ConfirmDialog, GameButton, GameIconButton, GameInput, GameSelect } from '@/shared/components/ui'

/**
 * MyProgramsLibrary component - List view for saved programs with search/sort.
 *
 * Shows all programs from IndexedDB via useProgramLibrary composable.
 * Supports search by name, sort by recently modified or alphabetical,
 * inline rename, delete with confirmation, and displays an empty state
 * when no programs are saved.
 */

defineOptions({
  name: 'MyProgramsLibrary',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', program: ProgramData): void
}>()

const { t } = useI18n()
const library = useProgramLibrary()

// Search and sort state
const searchQuery = ref<string | number>('')
const sortKey = ref<string | number>('updatedAt')

// Delete confirmation state
const deleteTarget = ref<ProgramData | null>(null)

// Rename inline edit state
const editingId = ref<string | null>(null)
const editingName = ref('')
const renameInputRef = useTemplateRef<HTMLInputElement>('renameInputRef')

// Sort options for the GameSelect dropdown
const sortOptions = computed(() => [
  { label: t('ide.myPrograms.sort.recentlyModified'), value: 'updatedAt' as const },
  { label: t('ide.myPrograms.sort.alphabetical'), value: 'name' as const },
])

// Load programs on mount
onMounted(() => {
  void library.listPrograms()
})

// Filtered and sorted programs
const displayedPrograms = computed(() => {
  let result = [...library.programs.value]

  // Filter by search query
  const query = String(searchQuery.value).trim().toLowerCase()
  if (query) {
    result = result.filter((p) => p.name.toLowerCase().includes(query))
  }

  // Sort
  const sort = sortKey.value as 'updatedAt' | 'name'
  result.sort((a, b) => {
    if (sort === 'updatedAt') {
      return b.updatedAt - a.updatedAt
    }
    return a.name.localeCompare(b.name)
  })

  return result
})

// Whether the "no results" state is from filtering (vs truly empty library)
const hasNoResults = computed(() => {
  return String(searchQuery.value).trim() !== '' && displayedPrograms.value.length === 0
})

const isEmpty = computed(() => {
  return library.isInitialized.value && library.programs.value.length === 0 && !String(searchQuery.value).trim()
})

// Format timestamp to locale string
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

// Program action handlers
function handleSelect(program: ProgramData): void {
  if (editingId.value === program.id) return
  emit('select', program)
}

// --- Delete ---
function handleDeleteClick(program: ProgramData): void {
  deleteTarget.value = program
}

function handleDeleteConfirm(): void {
  if (deleteTarget.value) {
    void library.deleteProgram(deleteTarget.value.id)
  }
  deleteTarget.value = null
}

function handleDeleteCancel(): void {
  deleteTarget.value = null
}

// --- Rename ---
function handleRenameClick(program: ProgramData): void {
  editingId.value = program.id
  editingName.value = program.name
  void nextTick(() => {
    const input = renameInputRef.value
    if (input) {
      // focus/select may not be available in all environments (e.g. JSDOM)
      input.focus?.()
      input.select?.()
    }
  })
}

function handleRenameSubmit(): void {
  const trimmed = editingName.value.trim()
  if (editingId.value && trimmed) {
    void library.renameProgram(editingId.value, trimmed)
  }
  editingId.value = null
  editingName.value = ''
}

function handleRenameCancel(): void {
  editingId.value = null
  editingName.value = ''
}

function handleRenameBlur(): void {
  handleRenameSubmit()
}

function handleRenameKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleRenameSubmit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    handleRenameCancel()
  }
}

function handleClose(): void {
  emit('close')
}
</script>

<template>
  <div class="my-programs-overlay" @click.self="handleClose">
    <div class="my-programs-panel">
      <!-- Header -->
      <div class="my-programs-header">
        <h2 class="my-programs-title">{{ t('ide.myPrograms.title') }}</h2>
        <button class="my-programs-close" :aria-label="t('ide.myPrograms.closeAriaLabel')" @click="handleClose">
          <span class="mdi mdi-close"></span>
        </button>
      </div>

      <!-- Toolbar: search + sort -->
      <div class="my-programs-toolbar">
        <GameInput
          v-model="searchQuery"
          type="search"
          :placeholder="t('ide.myPrograms.searchPlaceholder')"
          clearable
          size="small"
          class="my-programs-search"
        />
        <GameSelect
          v-model="sortKey"
          :options="sortOptions"
          size="small"
          class="my-programs-sort"
        />
      </div>

      <!-- Content area -->
      <div class="my-programs-content">
        <!-- Loading state -->
        <div v-if="library.isLoading.value" class="my-programs-state">
          <span class="mdi mdi-loading mdi-spin my-programs-state-icon"></span>
          <p class="my-programs-state-text">{{ t('ide.myPrograms.loading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="library.error.value" class="my-programs-state">
          <span class="mdi mdi-alert-circle-outline my-programs-state-icon error"></span>
          <p class="my-programs-state-text">{{ t('ide.myPrograms.errorState') }}</p>
        </div>

        <!-- Empty state: no programs saved -->
        <div v-else-if="isEmpty" class="my-programs-state">
          <span class="mdi mdi-folder-open-outline my-programs-state-icon"></span>
          <p class="my-programs-state-text">{{ t('ide.myPrograms.emptyState') }}</p>
        </div>

        <!-- Empty state: no search results -->
        <div v-else-if="hasNoResults" class="my-programs-state">
          <span class="mdi mdi-magnify my-programs-state-icon"></span>
          <p class="my-programs-state-text">{{ t('ide.myPrograms.noResults') }}</p>
        </div>

        <!-- Program list -->
        <ul v-else class="my-programs-list">
          <li
            v-for="program in displayedPrograms"
            :key="program.id"
            class="my-programs-item"
          >
            <!-- Inline rename mode -->
            <template v-if="editingId === program.id">
              <input
                ref="renameInputRef"
                v-model="editingName"
                type="text"
                class="my-programs-item-rename-input"
                :maxlength="100"
                @keydown="handleRenameKeydown"
                @blur="handleRenameBlur"
              />
            </template>
            <!-- Normal display mode -->
            <template v-else>
              <button
                type="button"
                class="my-programs-item-button"
                @click="handleSelect(program)"
              >
                <span class="my-programs-item-name">{{ program.name }}</span>
                <span class="my-programs-item-date">{{ formatDate(program.updatedAt) }}</span>
              </button>
            </template>
            <GameIconButton
              type="default"
              icon="mdi:pencil-outline"
              size="small"
              :title="t('ide.myPrograms.renameAriaLabel')"
              class="my-programs-item-action"
              @click="handleRenameClick(program)"
            />
            <GameIconButton
              type="danger"
              icon="mdi:delete-outline"
              size="small"
              :title="t('ide.myPrograms.deleteAriaLabel')"
              class="my-programs-item-action"
              @click="handleDeleteClick(program)"
            />
          </li>
        </ul>
      </div>

      <!-- Delete confirmation dialog -->
      <ConfirmDialog
        :visible="deleteTarget !== null"
        :title="t('ide.myPrograms.deleteConfirmTitle')"
        :message="t('ide.myPrograms.deleteConfirmMessage', { name: deleteTarget?.name ?? '' })"
        :confirm-label="t('ide.myPrograms.deleteConfirmLabel')"
        @confirm="handleDeleteConfirm"
        @cancel="handleDeleteCancel"
      />

      <!-- Footer -->
      <div class="my-programs-footer">
        <span class="my-programs-count">
          {{ t('ide.myPrograms.programCount', { count: displayedPrograms.length }, displayedPrograms.length) }}
        </span>
        <GameButton type="default" size="small" @click="handleClose">
          {{ t('common.buttons.cancel') }}
        </GameButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-programs-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--base-alpha-gray-00-60);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.my-programs-panel {
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--game-shadow-hover);
}

/* Header */
.my-programs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--game-surface-border);
}

.my-programs-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--game-text-primary);
}

.my-programs-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--game-text-secondary);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.my-programs-close:hover {
  background: var(--game-surface-border);
  color: var(--game-text-primary);
}

/* Toolbar */
.my-programs-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--game-surface-border);
}

.my-programs-search {
  flex: 1;
}

.my-programs-sort {
  width: auto;
  min-width: 160px;
}

/* Content area */
.my-programs-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* State display (empty, loading, error) */
.my-programs-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--game-text-secondary);
}

.my-programs-state-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.my-programs-state-icon.error {
  color: var(--semantic-solid-danger);
  opacity: 0.7;
}

.my-programs-state-text {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.7;
}

/* Program list */
.my-programs-list {
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}

.my-programs-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.75rem;
}

.my-programs-item:hover {
  background: var(--base-alpha-primary-10);
}

.my-programs-item-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.5rem;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font-size: inherit;
  min-width: 0;
}

.my-programs-item-name {
  color: var(--game-text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-programs-item-date {
  color: var(--game-text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.my-programs-item-rename-input {
  flex: 1;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--base-solid-primary);
  border-radius: 4px;
  background: var(--game-surface-bg-start);
  color: var(--game-text-primary);
  font-size: 0.9rem;
  outline: none;
  min-width: 0;
}

.my-programs-item-rename-input:focus {
  box-shadow: 0 0 0 2px var(--base-alpha-primary-30);
}

.my-programs-item-action {
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.my-programs-item:hover .my-programs-item-action {
  opacity: 1;
}

/* Footer */
.my-programs-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--game-surface-border);
}

.my-programs-count {
  color: var(--game-text-secondary);
  font-size: 0.8rem;
}
</style>
