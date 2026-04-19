/**
 * useReplMode composable
 *
 * Orchestrates REPL state management: activation lifecycle, command execution,
 * special command handling (RUN/CLS), and command history.
 */

import { computed, type ComputedRef, inject, type InjectionKey, provide, ref } from 'vue'

import type { ExecutionResult } from '@/core/types/execution-types'

/**
 * Adapter interface for worker REPL operations.
 * Abstracts the underlying WebWorkerManager so the composable is testable.
 */
export interface ReplWorkerAdapter {
  replExecute(statement: string): Promise<ExecutionResult>
  replRun(): Promise<ExecutionResult>
  replClear(): Promise<void>
  isReplReady(): boolean
}

export interface ReplModeState {
  /** Whether REPL mode is currently active and accepting input. */
  replActive: ComputedRef<boolean>
  /** Past executed commands (deduplicated consecutive). */
  commandHistory: ReturnType<typeof ref<string[]>>
  /** Current navigation position in command history (-1 = no selection). */
  historyIndex: ReturnType<typeof ref<number>>

  /** Activate REPL (after program ends). Only activates if worker is ready. */
  activateRepl: () => void
  /** Deactivate REPL (when program starts running). */
  deactivateRepl: () => void
  /** Execute a REPL command. Handles RUN/CLS interception and history. */
  executeReplCommand: (statement: string) => Promise<void>
  /** Navigate to a specific history index. Returns the command or undefined. */
  navigateHistory: (index: number) => string | undefined
  /** Re-run the stored program. */
  handleRun: () => Promise<void>
  /** Clear the screen. */
  handleCls: () => Promise<void>
}

/**
 * Create REPL mode state and actions.
 *
 * @param adapter - Worker adapter for REPL operations
 */
export function useReplMode(adapter: ReplWorkerAdapter): ReplModeState {
  const replActive = ref(false)
  const commandHistory = ref<string[]>([])
  const historyIndex = ref(-1)

  function activateRepl(): void {
    replActive.value = adapter.isReplReady()
  }

  function deactivateRepl(): void {
    replActive.value = false
  }

  function addToHistory(command: string): void {
    const trimmed = command.trim()
    if (!trimmed) return

    // Deduplicate consecutive identical commands
    if (commandHistory.value.length > 0 && commandHistory.value[commandHistory.value.length - 1] === trimmed) {
      return
    }

    commandHistory.value = [...commandHistory.value, trimmed]
    // Reset navigation to end of history
    historyIndex.value = commandHistory.value.length - 1
  }

  function navigateHistory(index: number): string | undefined {
    if (index < 0 || index >= commandHistory.value.length) {
      return undefined
    }
    historyIndex.value = index
    return commandHistory.value[index]
  }

  async function executeReplCommand(statement: string): Promise<void> {
    const trimmed = statement.trim()
    if (!trimmed) return

    // Must be active to execute
    if (!replActive.value) return

    const upperCommand = trimmed.toUpperCase()

    if (upperCommand === 'RUN') {
      addToHistory(trimmed)
      deactivateRepl()
      try {
        await adapter.replRun()
      } catch {
        // Error display is handled by message handlers; REPL reactivates regardless
      } finally {
        activateRepl()
      }
      return
    }

    if (upperCommand === 'CLS') {
      addToHistory(trimmed)
      await adapter.replClear()
      return
    }

    // Regular statement execution
    addToHistory(trimmed)
    try {
      await adapter.replExecute(trimmed)
    } catch {
      // Error display is handled by message handlers; REPL reactivates regardless
    } finally {
      // Ensure REPL stays active even on error
      activateRepl()
    }
  }

  async function handleRun(): Promise<void> {
    addToHistory('RUN')
    deactivateRepl()
    try {
      await adapter.replRun()
    } catch {
      // Error display is handled by message handlers; REPL reactivates regardless
    } finally {
      activateRepl()
    }
  }

  async function handleCls(): Promise<void> {
    addToHistory('CLS')
    await adapter.replClear()
  }

  return {
    replActive: computed(() => replActive.value),
    commandHistory,
    historyIndex,
    activateRepl,
    deactivateRepl,
    executeReplCommand,
    navigateHistory,
    handleRun,
    handleCls,
  }
}

// --- Provide / Inject ---

/**
 * REPL context provided by IdePage (via useBasicIdeEnhanced) and consumed by ScreenTab.
 */
export interface ReplContextValue {
  replActive: ComputedRef<boolean>
  commandHistory: ReturnType<typeof ref<string[]>>
  historyIndex: ReturnType<typeof ref<number>>
  navigateHistory: (index: number) => string | undefined
  executeReplCommand: (statement: string) => Promise<void>
}

export const ReplContextKey: InjectionKey<ReplContextValue> = Symbol('ide-repl-context')

/**
 * Provide REPL context. Call from useBasicIdeEnhanced (which runs in IdePage setup).
 */
export function provideReplContext(value: ReplContextValue): void {
  provide(ReplContextKey, value)
}

/**
 * Inject REPL context. Use in ScreenTab and ReplInput.
 */
export function useReplContext(): ReplContextValue {
  const ctx = inject(ReplContextKey)
  if (!ctx) {
    throw new Error(
      'useReplContext() must be used within a component tree that calls provideReplContext (e.g. IdePage)'
    )
  }
  return ctx
}
