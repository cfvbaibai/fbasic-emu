/**
 * useBufferInspector composable
 *
 * Centralizes polling, change detection, and freeze/pause for the
 * Buffer Inspector panel. Polls shared buffers at ~4 Hz (250ms)
 * and only when the browser tab is visible.
 *
 * Step 7 of 8 for #531.
 * @see {@link https://github.com/cfvbaibai/fbasic-ide/issues/609}
 */

import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { computed, onScopeDispose, ref, shallowRef } from 'vue'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SyncCommand } from '@/core/animation/sharedDisplayBufferTypes'
import { getInkeyState, type KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import type { SpriteState } from '@/core/sprite/types'
import { logComposable } from '@/shared/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for the useBufferInspector composable. */
export interface UseBufferInspectorOptions {
  /** Accessor for the shared display buffer (screen, sprites, sync). */
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
  /** Keyboard buffer view for reading INKEY$ state. */
  keyboardView: KeyboardBufferView
  /** Current sprite states from IDE state. */
  spriteStates: SpriteState[]
  /** Whether sprites are enabled. */
  spriteEnabled: boolean
  /** Shared joystick buffer (optional). */
  sharedJoystickBuffer?: SharedArrayBuffer
  /** Polling interval in milliseconds (default: 250ms = ~4 Hz). */
  pollingIntervalMs?: number
}

/** Screen cell data read from the display buffer (plain data, no reactivity). */
interface InspectorScreenCell {
  character: string
  colorPattern: number
}

/** Keyboard data snapshot from the keyboard buffer. */
interface InspectorKeyboardData {
  keyChar: string
  modifiers: number
}

/** Return type of useBufferInspector. */
export interface UseBufferInspectorReturn {
  /** Screen character/pattern data from last poll. Empty array before first poll. */
  screenData: ShallowRef<InspectorScreenCell[][]>
  /** Sync command from last poll. null = no pending command. */
  syncCommand: ComputedRef<SyncCommand | null>
  /** Acknowledgment status from last poll. */
  ackStatus: Ref<number>
  /** Keyboard data from last poll. null before first poll. */
  keyboardData: ShallowRef<InspectorKeyboardData | null>
  /** Current sprite states (pass-through from options). */
  spriteStates: ComputedRef<SpriteState[]>
  /** Whether sprites are enabled (pass-through from options). */
  spriteEnabled: ComputedRef<boolean>
  /** Set of "x,y" keys for cells that changed since last poll. */
  changedCells: ShallowRef<Set<string>>
  /** Whether the inspector is frozen (snapshot mode). */
  isFrozen: Ref<boolean>
  /** Number of polls executed since startPolling was called. */
  pollCount: Ref<number>
  /** Freeze the inspector: stop polling and preserve current snapshot. */
  freeze: () => void
  /** Unfreeze the inspector: allow polling to resume (must call startPolling). */
  unfreeze: () => void
  /** Start the polling loop. No-op if already polling. */
  startPolling: () => void
  /** Stop the polling loop. */
  stopPolling: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_POLLING_INTERVAL_MS = 250

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Composable for the Buffer Inspector panel.
 *
 * Polls shared buffers at ~4 Hz, detects changes since last poll,
 * and supports freeze/pause for snapshot inspection.
 */
export function useBufferInspector(options: UseBufferInspectorOptions): UseBufferInspectorReturn {
  const {
    sharedDisplayBufferAccessor,
    keyboardView,
    spriteStates: spriteStatesInput,
    spriteEnabled: spriteEnabledInput,
    pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  } = options

  // ---------------------------------------------------------------------------
  // Reactive state
  // ---------------------------------------------------------------------------

  const screenData = shallowRef<InspectorScreenCell[][]>([])
  const ackStatus = ref<number>(0)
  const keyboardData = shallowRef<InspectorKeyboardData | null>(null)
  const changedCells = shallowRef<Set<string>>(new Set())
  const isFrozen = ref(false)
  const pollCount = ref(0)

  // Pass-through computed for sprite state (may change externally)
  const spriteStates = computed(() => spriteStatesInput)
  const spriteEnabled = computed(() => spriteEnabledInput)

  // Sync command computed (reads from accessor each time it's accessed)
  const syncCommand = computed<SyncCommand | null>(() => {
    return sharedDisplayBufferAccessor.readSyncCommand()
  })

  // ---------------------------------------------------------------------------
  // Previous poll snapshot (non-reactive, for change detection)
  // ---------------------------------------------------------------------------

  let previousChars: Map<string, number> = new Map()
  let previousPatterns: Map<string, number> = new Map()

  // ---------------------------------------------------------------------------
  // Polling internals
  // ---------------------------------------------------------------------------

  let intervalId: ReturnType<typeof setInterval> | null = null
  let isPollingActive = false

  /** Build a key for cell change tracking. */
  function cellKey(x: number, y: number): string {
    return `${x},${y}`
  }

  /** Perform a single poll: read all buffers and detect changes. */
  function poll(): void {
    if (isFrozen.value) return

    const buffer = sharedDisplayBufferAccessor.readScreenBuffer()
    const newScreenData: InspectorScreenCell[][] = []
    const changes = new Set<string>()

    for (let y = 0; y < buffer.length; y++) {
      const row = buffer[y] ?? []
      const newRow: InspectorScreenCell[] = []
      for (let x = 0; x < row.length; x++) {
        const cell = row[x] ?? { character: ' ', colorPattern: 0, x, y }
        newRow.push({ character: cell.character, colorPattern: cell.colorPattern })

        const key = cellKey(x, y)
        const charCode = cell.character.charCodeAt(0)
        const prevChar = previousChars.get(key)
        const prevPattern = previousPatterns.get(key)

        if (prevChar === undefined || prevPattern === undefined) {
          // First poll: no previous data, no change detection
          previousChars.set(key, charCode)
          previousPatterns.set(key, cell.colorPattern)
        } else {
          if (charCode !== prevChar || cell.colorPattern !== prevPattern) {
            changes.add(key)
          }
          previousChars.set(key, charCode)
          previousPatterns.set(key, cell.colorPattern)
        }
      }
      newScreenData.push(newRow)
    }

    screenData.value = newScreenData
    changedCells.value = changes
    ackStatus.value = sharedDisplayBufferAccessor.readAck()
    keyboardData.value = getInkeyState(keyboardView)
    pollCount.value++
  }

  /** Start the polling loop. */
  function startPolling(): void {
    if (isPollingActive) return
    isPollingActive = true

    // Immediate first poll
    poll()

    intervalId = setInterval(() => {
      // Respect tab visibility (re-check each tick in case of race)
      if (document.visibilityState !== 'visible') return
      poll()
    }, pollingIntervalMs)

    logComposable.debug(`[useBufferInspector] Started polling at ${pollingIntervalMs}ms interval`)
  }

  /** Stop the polling loop. */
  function stopPolling(): void {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPollingActive = false
    logComposable.debug('[useBufferInspector] Stopped polling')
  }

  /** Freeze: stop polling and preserve current state. */
  function freeze(): void {
    isFrozen.value = true
    stopPolling()
    logComposable.debug('[useBufferInspector] Frozen')
  }

  /** Unfreeze: allow polling to resume (caller must call startPolling). */
  function unfreeze(): void {
    isFrozen.value = false
    logComposable.debug('[useBufferInspector] Unfrozen (call startPolling to resume)')
  }

  // ---------------------------------------------------------------------------
  // Tab visibility handler
  // ---------------------------------------------------------------------------

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // When tab becomes visible, perform an immediate poll
      if (isPollingActive && !isFrozen.value) {
        poll()
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  onScopeDispose(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    previousChars.clear()
    previousPatterns.clear()
  })

  return {
    screenData,
    syncCommand,
    ackStatus,
    keyboardData,
    spriteStates,
    spriteEnabled,
    changedCells,
    isFrozen,
    pollCount,
    freeze,
    unfreeze,
    startPolling,
    stopPolling,
  }
}
