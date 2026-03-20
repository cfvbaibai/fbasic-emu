import { describe, expect, it } from 'vitest'

import {
  type CommandPaletteCommand,
  filterCommandPaletteCommands,
  matchesAnyShortcut,
  matchesShortcut,
} from '@/features/ide/composables/commandPalette'

function createCommand(id: string, title: string, options?: Partial<CommandPaletteCommand>): CommandPaletteCommand {
  return {
    id,
    title,
    execute: () => {},
    ...options,
  }
}

describe('commandPalette helpers', () => {
  it('filters commands with fuzzy title matching', () => {
    const commands = [
      createCommand('run.start', 'Run Program'),
      createCommand('run.restart', 'Restart Program'),
      createCommand('view.sample', 'Load Sample Program'),
    ]

    const filtered = filterCommandPaletteCommands(commands, 'rstrt')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('run.restart')
  })

  it('includes keyword matches and skips disabled commands', () => {
    const commands = [
      createCommand('view.logs', 'Open Output Log Filters', { keywords: ['filters', 'logs'] }),
      createCommand('run.stop', 'Stop Program', { enabled: false }),
    ]

    const filtered = filterCommandPaletteCommands(commands, 'log')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('view.logs')
  })

  it('matches exact modifier shortcuts', () => {
    const paletteEvent = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, shiftKey: true })
    expect(matchesShortcut(paletteEvent, 'Ctrl+Shift+P')).toBe(true)
    expect(matchesShortcut(paletteEvent, 'Ctrl+P')).toBe(false)
  })

  it('supports multiple shortcut variants', () => {
    const restartEvent = new KeyboardEvent('keydown', { key: 'F5', metaKey: true, shiftKey: true })
    expect(matchesAnyShortcut(restartEvent, ['Ctrl+Shift+F5', 'Meta+Shift+F5'])).toBe(true)
  })
})
