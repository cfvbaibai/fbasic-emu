<script setup lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { onBeforeUnmount, onDeactivated, onMounted, useTemplateRef, watch } from 'vue'

import { setupLiveErrorChecking, setupMonacoLanguage } from '@/features/ide/integrations/monaco-integration'
import { configureMonacoWorkers } from '@/features/ide/integrations/monaco-workers'

/**
 * MonacoCodeEditor component - Monaco Editor integration for F-BASIC code editing.
 */
defineOptions({
  name: 'MonacoCodeEditor',
})

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const editorContainer = useTemplateRef<HTMLElement>('editorContainer')
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let mutationObserver: MutationObserver | null = null

/**
 * Check if light theme is active
 */
function isLightTheme(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('light-theme')
}

/**
 * Get the appropriate theme name based on current theme
 */
function getThemeName(): string {
  return isLightTheme() ? 'fbasic-theme-light' : 'fbasic-theme'
}

/**
 * Update editor theme based on current theme
 */
function updateTheme(): void {
  if (editor) {
    const themeName = getThemeName()
    monaco.editor.setTheme(themeName)
  }
}

onMounted(() => {
  if (!editorContainer.value) return

  configureMonacoWorkers()

  // Setup Monaco language support (this also sets up themes)
  setupMonacoLanguage()

  // Create Monaco editor with initial theme
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: 'fbasic',
    theme: getThemeName(),
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    cursorStyle: 'line',
    wordWrap: 'on',
    tabSize: 2,
  })

  // Setup live error checking
  if (editor) {
    setupLiveErrorChecking(editor)
  }

  // Listen for content changes
  editor?.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
  })

  // Watch for theme changes by observing the document element's class list
  if (typeof document !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      updateTheme()
    })
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
})

// Watch for external value changes
watch(
  () => props.modelValue,
  newValue => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  }
)

// Cleanup function for editor and mutation observer
const cleanup = () => {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  if (editor) {
    editor.dispose()
    editor = null
  }
}

// Clean up on unmount AND deactivation (keep-alive support)
onBeforeUnmount(cleanup)
onDeactivated(cleanup)
</script>

<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
}

.monaco-editor-container::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    135deg,
    var(--base-alpha-primary-10) 0%,
    transparent 30%,
    transparent 70%,
    var(--base-alpha-primary-10) 100%
  );
  border-radius: 8px;
  opacity: 0;
  z-index: -1;
  pointer-events: none;
  transition: opacity 0.3s ease;
  animation: editor-glow 4s ease-in-out infinite;
  filter: blur(4px);
}

.monaco-editor-container:hover::before {
  opacity: 0.6;
}

@keyframes editor-glow {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }

  50% {
    opacity: 0.3;
    transform: scale(1.01);
  }
}
</style>
