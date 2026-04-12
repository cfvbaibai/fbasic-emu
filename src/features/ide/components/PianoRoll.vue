<script setup lang="ts">
import { ref } from 'vue'

import type { NoteCellKey } from './pianoRollConstants'
import {
  BEAT_INTERVAL,
  createNoteCellKey,
  DEFAULT_STEPS,
  isSharpNote,
  NOTE_NAMES,
} from './pianoRollConstants'

defineOptions({
  name: 'PianoRoll',
})

const props = withDefaults(
  defineProps<{
    /** Set of active note cells, keyed by "noteIndex-stepIndex". */
    modelValue: Set<NoteCellKey>
    /** Number of time step columns. */
    steps?: 16 | 32
  }>(),
  {
    modelValue: () => new Set<NoteCellKey>(),
    steps: DEFAULT_STEPS,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Set<NoteCellKey>]
}>()

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------

/** Whether the user is currently dragging. */
const isDragging = ref(false)

/**
 * The drag mode: 'paint' adds notes, 'erase' removes them.
 * Determined by the state of the first cell clicked.
 */
const dragMode = ref<'paint' | 'erase'>('paint')

// ---------------------------------------------------------------------------
// Cell interaction
// ---------------------------------------------------------------------------

function handleCellMouseDown(noteIndex: number, stepIndex: number): void {
  isDragging.value = true
  const key = createNoteCellKey(noteIndex, stepIndex)
  const isActive = props.modelValue.has(key)
  dragMode.value = isActive ? 'erase' : 'paint'
  toggleCell(noteIndex, stepIndex)
}

function handleCellMouseEnter(noteIndex: number, stepIndex: number): void {
  if (!isDragging.value) return

  const key = createNoteCellKey(noteIndex, stepIndex)
  const nextNotes = new Set(props.modelValue)

  if (dragMode.value === 'paint') {
    nextNotes.add(key)
  } else {
    nextNotes.delete(key)
  }

  emit('update:modelValue', nextNotes)
}

function handleGridMouseUp(): void {
  isDragging.value = false
}

/**
 * Toggles a cell: adds it if inactive, removes it if active.
 */
function toggleCell(noteIndex: number, stepIndex: number): void {
  const key = createNoteCellKey(noteIndex, stepIndex)
  const nextNotes = new Set(props.modelValue)

  if (nextNotes.has(key)) {
    nextNotes.delete(key)
  } else {
    nextNotes.add(key)
  }

  emit('update:modelValue', nextNotes)
}

/**
 * Checks whether a note at the given index is a sharp (black key).
 */
function isBlackKey(noteIndex: number): boolean {
  return isSharpNote(NOTE_NAMES[noteIndex] ?? '')
}

/**
 * Checks whether a step column should have a beat marker.
 */
function isBeatStart(stepIndex: number): boolean {
  return stepIndex % BEAT_INTERVAL === 0
}
</script>

<template>
  <div class="piano-roll">
    <!-- Step number headers -->
    <div class="piano-roll__step-headers">
      <div
        v-for="step in steps"
        :key="step"
        class="piano-roll__step-header"
        :class="{ 'piano-roll__step-header--beat': isBeatStart(step - 1) }"
      >
        {{ step }}
      </div>
    </div>

    <!-- Grid rows -->
    <div
      class="piano-roll__grid"
      @mouseup="handleGridMouseUp"
    >
      <div
        v-for="(noteName, noteIndex) in NOTE_NAMES"
        :key="noteName"
        class="piano-roll__row"
      >
        <!-- Note label -->
        <span
          class="piano-roll__label"
          :class="{
            'piano-roll__label--sharp': isBlackKey(noteIndex),
          }"
        >
          {{ noteName }}
        </span>

        <!-- Step cells -->
        <div
          v-for="stepIndex in steps"
          :key="`${noteIndex}-${stepIndex - 1}`"
          class="piano-roll__cell"
          :class="{
            'piano-roll__cell--active': modelValue.has(
              createNoteCellKey(noteIndex, stepIndex - 1),
            ),
            'piano-roll__cell--black-key': isBlackKey(noteIndex),
            'piano-roll__cell--beat-start': isBeatStart(stepIndex - 1),
          }"
          :data-note-index="noteIndex"
          :data-step-index="stepIndex - 1"
          @mousedown.prevent="handleCellMouseDown(noteIndex, stepIndex - 1)"
          @mouseenter="handleCellMouseEnter(noteIndex, stepIndex - 1)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.piano-roll {
  --piano-roll-cell-size: 20px;
  --piano-roll-label-width: 48px;

  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--base-solid-gray-100, monospace);
  font-size: 11px;
  user-select: none;
}

/* Step headers row */
.piano-roll__step-headers {
  display: grid;
  grid-template-columns: var(--piano-roll-label-width) repeat(
      var(--steps-count, 16),
      var(--piano-roll-cell-size)
    );
  gap: 1px;
  padding-left: var(--piano-roll-label-width);
  margin-left: calc(-1 * var(--piano-roll-label-width));
}

.piano-roll__step-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  color: var(--game-text-tertiary);
  font-size: 9px;
}

.piano-roll__step-header--beat {
  color: var(--game-text-secondary);
  font-weight: bold;
}

/* Grid */
.piano-roll__grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Row (one note across all steps) */
.piano-roll__row {
  display: flex;
  align-items: center;
  gap: 1px;
}

/* Note label */
.piano-roll__label {
  width: var(--piano-roll-label-width);
  flex-shrink: 0;
  text-align: right;
  padding-right: 6px;
  color: var(--game-text-secondary);
  white-space: nowrap;
}

.piano-roll__label--sharp {
  color: var(--game-text-tertiary);
}

/* Cell */
.piano-roll__cell {
  width: var(--piano-roll-cell-size);
  height: var(--piano-roll-cell-size);
  flex-shrink: 0;
  border: 1px solid var(--base-solid-gray-30);
  background-color: var(--base-solid-gray-10);
  cursor: pointer;
  transition: background-color 0.05s;
}

.piano-roll__cell:hover {
  background-color: var(--base-solid-gray-20);
}

/* Black key row background */
.piano-roll__cell--black-key {
  background-color: var(--base-alpha-gray-00-30);
}

/* Beat marker */
.piano-roll__cell--beat-start {
  border-left: 2px solid var(--base-solid-gray-40);
}

/* Active note */
.piano-roll__cell--active {
  background-color: var(--base-solid-primary);
  border-color: var(--base-solid-primary-70);
}

.piano-roll__cell--active:hover {
  background-color: var(--base-solid-primary-80);
}
</style>
