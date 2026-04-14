<script setup lang="ts">
import { GameLayout } from '@/shared/components/ui'

/**
 * MusicComposerPage component - Placeholder page for the visual music composer.
 *
 * Will be fleshed out with PianoRoll, ComposerControls, and playback features
 * in subsequent implementation steps (issues #616-#620).
 */
defineOptions({
  name: 'MusicComposerPage',
})
</script>

<template>
  <GameLayout>
    <div class="music-composer-page">
      <h1>Music Composer</h1>
    </div>
  </GameLayout>
</template>

<style scoped>
.music-composer-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
