<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getSampleCodeKeys, SAMPLE_CODES } from '@/core/samples'
import { hasSampleBgData } from '@/core/samples/sampleBgData'
import { GameButton } from '@/shared/components/ui'

/**
 * SampleSelector component - Category tabs + sample grid for better UX
 */

defineOptions({
  name: 'SampleSelector',
})

const emit = defineEmits<{
  (e: 'select', key: string): void
  (e: 'close'): void
}>()

const { t } = useI18n()

// Get all sample keys
const allSampleKeys = getSampleCodeKeys()

// Categories - group samples by category
const categories = computed(() => {
  const cats = new Map<string, Array<{ key: string; name: string; description: string; hasBg: boolean }>>()
  for (const key of allSampleKeys) {
    const sample = SAMPLE_CODES[key]
    if (sample) {
      if (!cats.has(sample.category)) {
        cats.set(sample.category, [])
      }
      // Check if sample has BG data (either via bgKey or direct BG data)
      const hasBg = sample.bgKey ? hasSampleBgData(sample.bgKey) : false
      cats.get(sample.category)!.push({
        key,
        name: sample.name,
        description: sample.description,
        hasBg,
      })
    }
  }
  return cats
})

const categoryList = computed(() => Array.from(categories.value.keys()))

const selectedCategory = ref<string>('basics')

const samplesInCategory = computed(() => categories.value.get(selectedCategory.value) ?? [])

// Category display names
const categoryNames: Record<string, string> = {
  basics: 'Basics',
  control: 'Control Flow',
  data: 'Data & Arrays',
  screen: 'Screen',
  sprites: 'Sprites',
  interactive: 'Interactive',
  comprehensive: 'Full Demo',
  music: 'Music',
}

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
  basics: 'var(--game-color-primary)',
  control: 'var(--game-color-secondary)',
  data: 'var(--game-color-accent)',
  screen: 'var(--game-color-success)',
  sprites: 'var(--game-color-warning)',
  interactive: 'var(--game-color-danger)',
  comprehensive: 'var(--game-color-info)',
  music: 'var(--game-color-primary)',
}
</script>

<template>
  <div class="sample-selector-overlay" @click.self="emit('close')">
    <div class="sample-selector-panel">
      <!-- Header -->
      <div class="sample-selector-header">
        <h2 class="sample-selector-title">{{ t('ide.samples.title', 'Load Sample') }}</h2>
        <button class="sample-selector-close" @click="emit('close')">
          <span class="mdi mdi-close"></span>
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button
          v-for="cat in categoryList"
          :key="cat"
          :class="['category-tab', { active: selectedCategory === cat }]"
          :style="selectedCategory === cat ? { borderColor: categoryColors[cat] } : {}"
          @click="selectedCategory = cat"
        >
          {{ categoryNames[cat] || cat }}
        </button>
      </div>

      <!-- Sample Grid -->
      <div class="sample-grid">
        <div
          v-for="sample in samplesInCategory"
          :key="sample.key"
          class="sample-card"
          @click="emit('select', sample.key)"
        >
          <div class="sample-card-header">
            <h3 class="sample-card-name">
              {{ sample.name }}
              <span v-if="sample.hasBg" class="bg-indicator" title="Includes BG data">BG</span>
            </h3>
            <span
              class="sample-card-tag"
              :style="{ backgroundColor: categoryColors[selectedCategory] }"
            >
              {{ categoryNames[selectedCategory] || selectedCategory }}
            </span>
          </div>
          <p class="sample-card-desc">{{ sample.description }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sample-selector-footer">
        <GameButton type="default" size="small" @click="emit('close')">
          {{ t('common.buttons.cancel', 'Cancel') }}
        </GameButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sample-selector-overlay {
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

.sample-selector-panel {
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--game-shadow-hover);
}

.sample-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--game-surface-border);
}

.sample-selector-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--game-text-primary);
}

.sample-selector-close {
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

.sample-selector-close:hover {
  background: var(--game-surface-border);
  color: var(--game-text-primary);
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem 0.5rem;
  flex-wrap: wrap;
}

.category-tab {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  color: var(--game-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.category-tab:hover {
  background: var(--game-surface-border);
  color: var(--game-text-primary);
}

.category-tab.active {
  background: var(--game-surface-bg-gradient);
  color: var(--game-text-primary);
}

/* Sample Grid */
.sample-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  min-height: 0;
}

.sample-card {
  cursor: pointer;
  padding: 0.75rem;
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 12px;
  transition: all 0.15s ease;
  box-shadow: var(--game-shadow-base);
}

.sample-card:hover {
  border-color: var(--game-surface-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--game-shadow-hover);
}

.sample-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sample-card-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--game-text-primary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.bg-indicator {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.125rem 0.25rem;
  background: var(--base-solid-primary);
  color: var(--game-text-contrast);
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sample-card-tag {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--base-solid-gray-100);
  white-space: nowrap;
}

.sample-card-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--game-text-secondary);
  line-height: 1.4;
}

/* Footer */
.sample-selector-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--game-surface-border);
  display: flex;
  justify-content: flex-end;
}
</style>
