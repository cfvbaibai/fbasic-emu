/**
 * useIdeCommandPalette composable
 *
 * Defines the command palette commands available in the IDE,
 * including run/stop controls, view switching, and debug toggles.
 */

import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CommandPaletteCommand } from './commandPalette'

interface IdeCommandPaletteDeps {
  isRunning: Readonly<Ref<boolean>>
  runCode: () => Promise<void>
  stopCode: () => void
  clearOutput: () => void
  toggleDebugMode: () => void
  toggleInputMode: () => void
  sampleSelectorOpen: Ref<boolean>
  logLevelPanelOpen: Ref<boolean>
  editorView: Ref<string>
}

/**
 * Create command palette commands for the IDE.
 */
export function useIdeCommandPalette(deps: IdeCommandPaletteDeps) {
  const { t } = useI18n()

  async function restartCode(): Promise<void> {
    deps.stopCode()
    await deps.runCode()
  }

  const commands = computed<CommandPaletteCommand[]>(() => [
    {
      id: 'run.start',
      title: t('ide.commandPalette.commands.runStart.title'),
      description: t('ide.commandPalette.commands.runStart.description'),
      shortcut: 'Ctrl+Enter / Cmd+Enter',
      keywords: ['execute', 'start', 'run'],
      enabled: !deps.isRunning.value,
      execute: () => {
        void deps.runCode()
      },
    },
    {
      id: 'run.stop',
      title: t('ide.commandPalette.commands.runStop.title'),
      description: t('ide.commandPalette.commands.runStop.description'),
      shortcut: 'Ctrl+Shift+Enter / Cmd+Shift+Enter',
      keywords: ['halt', 'stop'],
      enabled: deps.isRunning.value,
      execute: deps.stopCode,
    },
    {
      id: 'run.restart',
      title: t('ide.commandPalette.commands.runRestart.title'),
      description: t('ide.commandPalette.commands.runRestart.description'),
      shortcut: 'Ctrl+Shift+R / Cmd+Shift+R',
      keywords: ['restart', 'rerun'],
      execute: () => {
        void restartCode()
      },
    },
    {
      id: 'run.clearOutput',
      title: t('ide.commandPalette.commands.runClearOutput.title'),
      description: t('ide.commandPalette.commands.runClearOutput.description'),
      keywords: ['clear', 'output', 'screen'],
      execute: deps.clearOutput,
    },
    {
      id: 'view.openSampleSelector',
      title: t('ide.commandPalette.commands.viewOpenSampleSelector.title'),
      description: t('ide.commandPalette.commands.viewOpenSampleSelector.description'),
      keywords: ['sample', 'demo'],
      execute: () => {
        deps.sampleSelectorOpen.value = true
      },
    },
    {
      id: 'view.openLogFilters',
      title: t('ide.commandPalette.commands.viewOpenLogFilters.title'),
      description: t('ide.commandPalette.commands.viewOpenLogFilters.description'),
      keywords: ['output', 'logs', 'filters'],
      execute: () => {
        deps.logLevelPanelOpen.value = true
      },
    },
    {
      id: 'view.switchToCode',
      title: t('ide.commandPalette.commands.viewSwitchToCode.title'),
      description: t('ide.commandPalette.commands.viewSwitchToCode.description'),
      keywords: ['code', 'editor'],
      execute: () => {
        deps.editorView.value = 'code'
      },
    },
    {
      id: 'view.switchToBgEditor',
      title: t('ide.commandPalette.commands.viewSwitchToBgEditor.title'),
      description: t('ide.commandPalette.commands.viewSwitchToBgEditor.description'),
      keywords: ['bg', 'background', 'editor'],
      execute: () => {
        deps.editorView.value = 'bg'
      },
    },
    {
      id: 'input.toggleMode',
      title: t('ide.commandPalette.commands.inputToggleMode.title'),
      description: t('ide.commandPalette.commands.inputToggleMode.description'),
      shortcut: 'F9',
      keywords: ['input', 'keyboard', 'joystick'],
      execute: deps.toggleInputMode,
    },
    {
      id: 'debug.toggle',
      title: t('ide.commandPalette.commands.debugToggle.title'),
      description: t('ide.commandPalette.commands.debugToggle.description'),
      keywords: ['debug'],
      execute: deps.toggleDebugMode,
    },
  ])

  return { commands }
}
