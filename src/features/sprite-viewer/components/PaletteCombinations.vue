<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GameBlock } from '@/shared/components/ui'
import { BACKGROUND_PALETTES, SPRITE_PALETTES } from '@/shared/data/palette'

import ColorBox from './ColorBox.vue'

/**
 * PaletteCombinations component - Displays sprite and background palette combinations.
 */
defineOptions({
  name: 'PaletteCombinations',
})

const { t } = useI18n()

const getSpritePaletteTitle = (index: number) => {
  return t('spriteViewer.palettes.spritePalette', { index: String(index) })
}

const getBackgroundPaletteTitle = (index: number) => {
  return t('spriteViewer.palettes.backgroundPalette', { index: String(index) })
}
</script>

<template>
  <div class="palette-combinations-wrapper">
    <GameBlock :title="t('spriteViewer.palettes.sprite')">
      <div class="palettes-container palettes-container-sprite">
        <div v-for="(palette, paletteIndex) in SPRITE_PALETTES" :key="`sprite-${paletteIndex}`" class="palette-group">
          <h3 class="palette-group-title">{{ getSpritePaletteTitle(paletteIndex) }}</h3>
          <div class="color-combinations">
            <div
              v-for="(combination, combIndex) in palette"
              :key="`sprite-${paletteIndex}-${combIndex}`"
              class="color-combination"
            >
              <div class="combination-colors">
                <template
                  v-for="(colorCode, colorIndex) in combination"
                  :key="`sprite-${paletteIndex}-${combIndex}-${colorIndex}`"
                >
                  <div v-if="colorIndex > 0" class="combination-color-wrapper">
                    <ColorBox :color-code="colorCode" />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameBlock>

    <GameBlock :title="t('spriteViewer.palettes.background')">
      <div class="palettes-container palettes-container-bg">
        <div v-for="(palette, paletteIndex) in BACKGROUND_PALETTES" :key="`bg-${paletteIndex}`" class="palette-group">
          <h3 class="palette-group-title">{{ getBackgroundPaletteTitle(paletteIndex) }}</h3>
          <div class="color-combinations">
            <div
              v-for="(combination, combIndex) in palette"
              :key="`bg-${paletteIndex}-${combIndex}`"
              class="color-combination"
            >
              <div class="combination-colors">
                <template
                  v-for="(colorCode, colorIndex) in combination"
                  :key="`bg-${paletteIndex}-${combIndex}-${colorIndex}`"
                >
                  <div v-if="colorIndex > 0" class="combination-color-wrapper">
                    <ColorBox :color-code="colorCode" />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameBlock>
  </div>
</template>

<style scoped>
.palette-combinations-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.palettes-container {
  display: grid;
  gap: 1.5rem;
}

.palettes-container-sprite {
  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--sprite-palette-min-width, 300px), 1fr)
  );
}

.palettes-container-bg {
  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--sprite-palette-min-width, 300px), 1fr)
  );
}

.palette-group {
  background: var(--game-surface-bg-inset-gradient);
  padding: var(--sprite-palette-group-padding, 1.5rem);
  border-radius: 8px;
  border: 2px solid var(--game-surface-border);
  box-shadow: var(--game-shadow-inset);
}

.palette-group-title {
  margin: 0 0 1rem;
  color: var(--game-text-primary);
  font-family: var(--game-font-family-heading);
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: none;
}

.color-combinations {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--sprite-combination-min-width, 200px), 1fr)
  );
  gap: 1rem;
}

.color-combination {
  background: var(--game-surface-bg-gradient);
  padding: 1rem;
  border-radius: 6px;
  border: 2px solid var(--game-surface-border);
  box-shadow: none;
  transition: all 0.2s ease;
}

.color-combination:hover {
  border-color: var(--base-solid-primary);
  box-shadow: none;
}

.combination-colors {
  display: flex;
  flex-flow: row nowrap;
  gap: 0.5rem;
  align-items: stretch;
}

.combination-color-wrapper {
  flex: 1;
  min-width: var(--sprite-combination-wrapper-min-width, 50px);
  height: var(--sprite-combination-wrapper-height, 50px);
}
</style>
