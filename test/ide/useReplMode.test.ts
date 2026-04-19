/**
 * Unit tests for useReplMode composable.
 */

import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import type { ExecutionResult } from '@/core/types/execution-types'
import { type ReplWorkerAdapter,useReplMode } from '@/features/ide/composables/useReplMode'

type MockedReplWorkerAdapter = {
  [K in keyof ReplWorkerAdapter]: Mock<ReplWorkerAdapter[K]>
}

function createMockAdapter(): MockedReplWorkerAdapter {
  return {
    replExecute: vi.fn(),
    replRun: vi.fn(),
    replClear: vi.fn(),
    isReplReady: vi.fn(),
  }
}

function createSuccessfulResult(): ExecutionResult {
  return {
    success: true,
    errors: [],
    variables: new Map(),
    executionTime: 1,
  }
}

describe('useReplMode', () => {
  describe('initial state', () => {
    it('starts with replActive as false', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(false)

      const { replActive } = useReplMode(adapter)

      expect(replActive.value).toBe(false)
    })

    it('starts with empty command history', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(false)

      const { commandHistory } = useReplMode(adapter)

      expect(commandHistory.value).toEqual([])
    })

    it('starts with historyIndex at -1', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(false)

      const { historyIndex } = useReplMode(adapter)

      expect(historyIndex.value).toBe(-1)
    })
  })

  describe('activateRepl / deactivateRepl', () => {
    it('activateRepl sets replActive to true when worker is ready', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { replActive, activateRepl } = useReplMode(adapter)

      activateRepl()
      expect(replActive.value).toBe(true)
    })

    it('activateRepl sets replActive to false when worker is not ready', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(false)

      const { replActive, activateRepl } = useReplMode(adapter)

      activateRepl()
      expect(replActive.value).toBe(false)
    })

    it('deactivateRepl sets replActive to false', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { replActive, activateRepl, deactivateRepl } = useReplMode(adapter)

      activateRepl()
      expect(replActive.value).toBe(true)

      deactivateRepl()
      expect(replActive.value).toBe(false)
    })
  })

  describe('executeReplCommand', () => {
    it('ignores empty strings', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { activateRepl, executeReplCommand } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('')
      await executeReplCommand('   ')

      expect(adapter.replExecute).not.toHaveBeenCalled()
      expect(adapter.replRun).not.toHaveBeenCalled()
      expect(adapter.replClear).not.toHaveBeenCalled()
    })

    it('does not add empty/whitespace commands to history', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('')
      await executeReplCommand('   ')

      expect(commandHistory.value).toEqual([])
    })

    it('intercepts RUN command and calls adapter.replRun', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replRun.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('RUN')

      expect(adapter.replRun).toHaveBeenCalledOnce()
      expect(adapter.replExecute).not.toHaveBeenCalled()
    })

    it('deactivates REPL during RUN and reactivates after completion', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replRun.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, replActive } = useReplMode(adapter)
      activateRepl()

      const runPromise = executeReplCommand('RUN')

      // During execution, REPL should be deactivated
      expect(replActive.value).toBe(false)

      await runPromise

      // After completion, REPL should be reactivated
      expect(replActive.value).toBe(true)
    })

    it('intercepts CLS command (case-insensitive) and calls adapter.replClear', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replClear.mockResolvedValue(undefined)

      const { activateRepl, executeReplCommand } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('CLS')

      expect(adapter.replClear).toHaveBeenCalledOnce()
      expect(adapter.replExecute).not.toHaveBeenCalled()
    })

    it('keeps REPL active during CLS', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replClear.mockResolvedValue(undefined)

      const { activateRepl, executeReplCommand, replActive } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('CLS')

      expect(replActive.value).toBe(true)
    })

    it('sends non-special commands to adapter.replExecute', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "Hello"')

      expect(adapter.replExecute).toHaveBeenCalledOnce()
      expect(adapter.replExecute).toHaveBeenCalledWith('PRINT "Hello"')
    })

    it('adds executed commands to history', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "Hello"')
      await executeReplCommand('CLS')
      await executeReplCommand('RUN')

      expect(commandHistory.value).toEqual([
        'PRINT "Hello"',
        'CLS',
        'RUN',
      ])
    })

    it('deduplicates consecutive identical commands', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "A"')
      await executeReplCommand('PRINT "A"')
      await executeReplCommand('PRINT "A"')

      expect(commandHistory.value).toEqual(['PRINT "A"'])
    })

    it('allows non-consecutive duplicates', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "A"')
      await executeReplCommand('PRINT "B"')
      await executeReplCommand('PRINT "A"')

      expect(commandHistory.value).toEqual([
        'PRINT "A"',
        'PRINT "B"',
        'PRINT "A"',
      ])
    })

    it('adds REM comments to history silently', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('REM this is a comment')

      expect(adapter.replExecute).toHaveBeenCalledOnce()
      expect(commandHistory.value).toEqual(['REM this is a comment'])
    })

    it('does nothing when REPL is not active', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { executeReplCommand } = useReplMode(adapter)

      await executeReplCommand('PRINT "Hello"')

      expect(adapter.replExecute).not.toHaveBeenCalled()
    })

    it('reactivates REPL after successful statement execution', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, replActive } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "Hello"')

      expect(replActive.value).toBe(true)
    })

    it('reactivates REPL after execution error', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockRejectedValue(new Error('syntax error'))

      const { activateRepl, executeReplCommand, replActive } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('INVALID')

      expect(replActive.value).toBe(true)
    })

    it('adds command to history even if execution fails', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockRejectedValue(new Error('syntax error'))

      const { activateRepl, executeReplCommand, commandHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('INVALID')

      expect(commandHistory.value).toEqual(['INVALID'])
    })

    it('reactivates REPL after RUN error', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replRun.mockRejectedValue(new Error('division by zero'))

      const { activateRepl, executeReplCommand, replActive } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('RUN')

      expect(replActive.value).toBe(true)
    })
  })

  describe('command history navigation', () => {
    it('navigateHistory returns the correct command for index 0', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replExecute.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, executeReplCommand, navigateHistory } = useReplMode(adapter)
      activateRepl()

      await executeReplCommand('PRINT "First"')
      await executeReplCommand('PRINT "Second"')

      expect(navigateHistory(0)).toBe('PRINT "First"')
      expect(navigateHistory(1)).toBe('PRINT "Second"')
    })

    it('navigateHistory returns undefined for out-of-range index', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { navigateHistory } = useReplMode(adapter)

      expect(navigateHistory(-1)).toBeUndefined()
      expect(navigateHistory(0)).toBeUndefined()
      expect(navigateHistory(999)).toBeUndefined()
    })

    it('navigateHistory returns undefined when history is empty', () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)

      const { navigateHistory } = useReplMode(adapter)

      expect(navigateHistory(0)).toBeUndefined()
    })
  })

  describe('handleRun', () => {
    it('calls adapter.replRun', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replRun.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, handleRun } = useReplMode(adapter)
      activateRepl()

      await handleRun()

      expect(adapter.replRun).toHaveBeenCalledOnce()
    })

    it('adds RUN to command history', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replRun.mockResolvedValue(createSuccessfulResult())

      const { activateRepl, handleRun, commandHistory } = useReplMode(adapter)
      activateRepl()

      await handleRun()

      expect(commandHistory.value).toEqual(['RUN'])
    })
  })

  describe('handleCls', () => {
    it('calls adapter.replClear', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replClear.mockResolvedValue(undefined)

      const { activateRepl, handleCls } = useReplMode(adapter)
      activateRepl()

      await handleCls()

      expect(adapter.replClear).toHaveBeenCalledOnce()
    })

    it('adds CLS to command history', async () => {
      const adapter = createMockAdapter()
      adapter.isReplReady.mockReturnValue(true)
      adapter.replClear.mockResolvedValue(undefined)

      const { activateRepl, handleCls, commandHistory } = useReplMode(adapter)
      activateRepl()

      await handleCls()

      expect(commandHistory.value).toEqual(['CLS'])
    })
  })
})
