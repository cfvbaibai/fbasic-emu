/**
 * Core interfaces for the Family Basic Interpreter
 *
 * Re-exports all types from domain-specific modules for backward compatibility.
 * New code should import directly from the specific type module.
 */

// State types (variables, errors, statements, loops)
export type {
  BasicError,
  BasicStatement,
  BasicVariable,
  LoopState,
} from '@/core/types/state-types'

// Device adapter interface
export type { BasicDeviceAdapter } from '@/core/types/device-types'

// Execution engine types (config, results, handlers, screen cell)
export type {
  CodeParser,
  CommandHandler,
  ErrorReporter,
  ExecutionResult,
  ExpressionEvaluator,
  HighlighterInfo,
  InterpreterConfig,
  OutputManager,
  ParserInfo,
  ScreenCell,
  SyntaxHighlighter,
} from '@/core/types/execution-types'

// Worker message types
export type {
  AnyServiceWorkerMessage,
  ClearDisplayMessage,
  ErrorMessage,
  ExecuteMessage,
  InitMessage,
  InputValueMessage,
  OutputMessage,
  PingMessage,
  PlaySoundCompleteMessage,
  PlaySoundMessage,
  ProgressMessage,
  ReadyMessage,
  RequestInputMessage,
  ResultMessage,
  ScreenChangedMessage,
  ScreenUpdateMessage,
  ServiceWorkerMessage,
  ServiceWorkerMessageHandler,
  ServiceWorkerMessageType,
  SetBgDataMessage,
  SetSharedAnimationBufferMessage,
  SetSharedJoystickBufferMessage,
  SetSharedKeyboardBufferMessage,
  SpriteStatesMessage,
  StickEventMessage,
  StopMessage,
  StrigEventMessage,
} from '@/core/types/worker-messages'

// Program management types
export type {
  CompactBg,
  ProgramData,
  ProgramExportFile,
} from '@/core/types/program-types'
