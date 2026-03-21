/**
 * Shared logging via loglevel
 *
 * Named loggers allow per-area level control. Default level is 'warn' so
 * per-frame / progress logs are quiet. Use the Log Level panel in the IDE
 * or in browser console: log.getLogger('ide-messages').setLevel('debug')
 */

import log from 'loglevel'

export function resolveDefaultLogLevel(
  env: Record<string, string | undefined> | undefined = (globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env
): log.LogLevelDesc {
  return env?.FBASIC_VERBOSE_LOGS === '1' ? 'debug' : 'warn'
}

const defaultLevel: log.LogLevelDesc = resolveDefaultLogLevel()
log.setDefaultLevel(defaultLevel)

/** IDE worker message handling (PROGRESS, ANIMATION_COMMAND, etc.). Use debug for verbose. */
export const logIdeMessages = log.getLogger('ide-messages')
logIdeMessages.setDefaultLevel(defaultLevel)

/** Screen component (render, sprite build, buffer-only). Use debug for first-run trace. */
export const logScreen = log.getLogger('screen')
logScreen.setDefaultLevel(defaultLevel)

/** Web worker lifecycle and message flow (WebWorkerManager, WebWorkerInterpreter, WebWorkerDeviceAdapter). */
export const logWorker = log.getLogger('worker')
logWorker.setDefaultLevel(defaultLevel)

/** Device adapters and screen state (TestDeviceAdapter, ScreenStateManager). */
export const logDevice = log.getLogger('device')
logDevice.setDefaultLevel(defaultLevel)

/** IDE composables (useBasicIde*, useJoystickEvents, useKonva*). */
export const logComposable = log.getLogger('composable')
logComposable.setDefaultLevel(defaultLevel)

/** Interpreter core (BasicInterpreter, ExecutionContext). */
export const logInterpreter = log.getLogger('interpreter')
logInterpreter.setDefaultLevel(defaultLevel)

/** Core utilities (sharedDisplayBuffer, CharacterAnimationBuilder, DataService, MessageHandler, image-analyzer). */
export const logCore = log.getLogger('core')
logCore.setDefaultLevel(defaultLevel)

/** App bootstrap (main.ts). */
export const logApp = log.getLogger('app')
logApp.setDefaultLevel(defaultLevel)

export { log }

// --- Log level UI: registry and helpers ---

/** Level names in order (trace = most verbose, silent = off). */
export const LOG_LEVEL_NAMES = ['trace', 'debug', 'info', 'warn', 'error', 'silent'] as const

export type LogLevelName = (typeof LOG_LEVEL_NAMES)[number]

/** Map loglevel numeric level to name. */
const LEVEL_NUM_TO_NAME: Record<number, LogLevelName> = {
  0: 'trace',
  1: 'debug',
  2: 'info',
  3: 'warn',
  4: 'error',
  5: 'silent',
}

export interface LoggerEntry {
  key: string
  name: string
  description: string
  getLevel: () => number
  setLevel: (level: LogLevelName) => void
}

/** Registry of all named loggers for the Log Level panel. */
export const LOGGER_REGISTRY: LoggerEntry[] = [
  { key: 'ide-messages', name: 'IDE messages', description: 'Worker message flow (OUTPUT, RESULT, SCREEN_UPDATE)', getLevel: () => logIdeMessages.getLevel() as number, setLevel: l => logIdeMessages.setLevel(l) },
  { key: 'screen', name: 'Screen', description: 'Screen render, background, sprite build', getLevel: () => logScreen.getLevel() as number, setLevel: l => logScreen.setLevel(l) },
  { key: 'worker', name: 'Worker', description: 'Web worker lifecycle and device adapter', getLevel: () => logWorker.getLevel() as number, setLevel: l => logWorker.setLevel(l) },
  { key: 'device', name: 'Device', description: 'Device adapters and screen state', getLevel: () => logDevice.getLevel() as number, setLevel: l => logDevice.setLevel(l) },
  { key: 'composable', name: 'Composable', description: 'IDE composables (run, joystick, Konva)', getLevel: () => logComposable.getLevel() as number, setLevel: l => logComposable.setLevel(l) },
  { key: 'interpreter', name: 'Interpreter', description: 'BasicInterpreter, ExecutionContext', getLevel: () => logInterpreter.getLevel() as number, setLevel: l => logInterpreter.setLevel(l) },
  { key: 'core', name: 'Core', description: 'Shared buffer, DataService, MessageHandler', getLevel: () => logCore.getLevel() as number, setLevel: l => logCore.setLevel(l) },
  { key: 'app', name: 'App', description: 'App bootstrap (main.ts)', getLevel: () => logApp.getLevel() as number, setLevel: l => logApp.setLevel(l) },
]

/** Get current level name for a logger by key. */
export function getLogLevelName(key: string): LogLevelName {
  const entry = LOGGER_REGISTRY.find(e => e.key === key)
  if (!entry) return 'warn'
  const num = entry.getLevel()
  return LEVEL_NUM_TO_NAME[num] ?? 'warn'
}

/** Set log level by key and level name. */
export function setLogLevelByName(key: string, level: LogLevelName): void {
  const entry = LOGGER_REGISTRY.find(e => e.key === key)
  if (entry) entry.setLevel(level)
}
