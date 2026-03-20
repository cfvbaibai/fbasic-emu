export interface CommandPaletteCommand {
  id: string
  title: string
  description?: string
  shortcut?: string
  keywords?: string[]
  enabled?: boolean
  execute: () => void | Promise<void>
}

function fuzzyScore(query: string, text: string): number {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return 0

  const normalizedText = text.toLowerCase()
  let queryIndex = 0
  let lastMatch = -1
  let score = 0

  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i += 1) {
    if (normalizedText[i] !== normalizedQuery[queryIndex]) continue

    score += 1
    if (lastMatch + 1 === i) {
      score += 2
    }
    if (queryIndex === 0 && i === 0) {
      score += 3
    }

    lastMatch = i
    queryIndex += 1
  }

  return queryIndex === normalizedQuery.length ? score : -1
}

export function filterCommandPaletteCommands(
  commands: readonly CommandPaletteCommand[],
  query: string
): CommandPaletteCommand[] {
  const normalizedQuery = query.trim()

  const scored = commands
    .filter(command => command.enabled !== false)
    .map(command => {
      if (!normalizedQuery) {
        return { command, score: 0 }
      }

      const text = [command.title, command.description, ...(command.keywords ?? [])].filter(Boolean).join(' ')
      return { command, score: fuzzyScore(normalizedQuery, text) }
    })
    .filter(item => item.score >= 0)

  return scored
    .sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title))
    .map(item => item.command)
}

const MODIFIER_TOKENS = new Set(['ctrl', 'shift', 'alt', 'meta', 'cmd'])

function normalizeEventKey(key: string): string {
  if (key.length === 1) return key.toUpperCase()
  return key.toUpperCase()
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const tokens = shortcut
    .split('+')
    .map(token => token.trim().toLowerCase())
    .filter(Boolean)

  const requiredCtrl = tokens.includes('ctrl')
  const requiredShift = tokens.includes('shift')
  const requiredAlt = tokens.includes('alt')
  const requiredMeta = tokens.includes('meta') || tokens.includes('cmd')

  if (event.ctrlKey !== requiredCtrl) return false
  if (event.shiftKey !== requiredShift) return false
  if (event.altKey !== requiredAlt) return false
  if (event.metaKey !== requiredMeta) return false

  const keyToken = tokens.find(token => !MODIFIER_TOKENS.has(token))
  if (!keyToken) return false

  return normalizeEventKey(event.key) === normalizeEventKey(keyToken)
}

export function matchesAnyShortcut(event: KeyboardEvent, shortcuts: readonly string[]): boolean {
  return shortcuts.some(shortcut => matchesShortcut(event, shortcut))
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}
