/**
 * useIdeGlobalHotkeys composable
 *
 * Manages global keyboard shortcuts for the IDE page.
 * Handles command palette toggle, run/stop/restart, and input mode switching.
 * Registers on mount, unregisters on unmount.
 */

import { onMounted, onUnmounted, type Ref, type ShallowRef } from 'vue'

import { isEditableTarget, matchesAnyShortcut } from './commandPalette'
import type { InputMode } from './useBasicIdeState'

interface IdeGlobalHotkeysDeps {
  commandPaletteOpen: ShallowRef<boolean>
  inputMode: Ref<InputMode>
  runCode: () => Promise<void>
  stopCode: () => void
  openCommandPalette: () => void
}

/**
 * Register global keyboard shortcuts for the IDE.
 *
 * Shortcuts handled:
 * - Ctrl/Cmd+Shift+P: Open command palette
 * - Ctrl/Cmd+Enter: Run code
 * - Ctrl/Cmd+Shift+Enter: Stop code
 * - Ctrl/Cmd+Shift+R: Restart code
 * - F9: Toggle input mode (joystick/keyboard)
 */
export function useIdeGlobalHotkeys(deps: IdeGlobalHotkeysDeps): void {
  function handleGlobalKeydown(e: KeyboardEvent) {
    if (matchesAnyShortcut(e, ['Ctrl+Shift+P', 'Meta+Shift+P'])) {
      e.preventDefault()
      deps.openCommandPalette()
      return
    }

    if (deps.commandPaletteOpen.value || isEditableTarget(e.target)) return

    if (matchesAnyShortcut(e, ['Ctrl+Enter', 'Meta+Enter'])) {
      e.preventDefault()
      void deps.runCode()
      return
    }

    if (matchesAnyShortcut(e, ['Ctrl+Shift+Enter', 'Meta+Shift+Enter'])) {
      e.preventDefault()
      deps.stopCode()
      return
    }

    if (matchesAnyShortcut(e, ['Ctrl+Shift+R', 'Meta+Shift+R'])) {
      e.preventDefault()
      // Stop then restart
      deps.stopCode()
      void deps.runCode()
      return
    }

    // F9: Toggle input mode (joystick/keyboard)
    if (e.key === 'F9') {
      e.preventDefault()
      deps.inputMode.value = deps.inputMode.value === 'joystick' ? 'keyboard' : 'joystick'
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
  })
}
