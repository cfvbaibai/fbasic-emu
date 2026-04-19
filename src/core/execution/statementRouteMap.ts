/**
 * Statement Route Map
 *
 * Data-driven mapping of CST statement keys to their executor dispatch logic.
 * Each entry defines how a simple statement should be dispatched: whether it
 * is async, whether it passes the line number, and which executor field to use.
 *
 * This separates the "what routes exist" configuration from the "how to route"
 * orchestration logic in StatementRouter, keeping both files focused and under
 * the 500-line limit.
 */

import type { CstNode } from 'chevrotain'

import type { StatementRouter } from './StatementRouter'

/**
 * Dispatch strategy for a simple statement route.
 *
 * - `sync`: Call `executor.execute(cst)` (no lineNumber)
 * - `syncLine`: Call `executor.execute(cst, lineNumber)`
 * - `asyncLine`: Call `await executor.execute(cst, lineNumber)`
 */
type DispatchStrategy = 'sync' | 'syncLine' | 'asyncLine'

/** Minimal interface for executors that can be dispatched by the route map. */
interface DispatchableExecutor {
  execute(cst: CstNode, lineNumber?: number): void | Promise<void>
}

/**
 * Executor field names on StatementRouter that have an `execute` method.
 * Excludes methods like `executeStatement`, `executeComplexStatement`, etc.
 */
type ExecutorField = {
  [K in keyof StatementRouter]: StatementRouter[K] extends DispatchableExecutor ? K : never
}[keyof StatementRouter]

/** A single route entry mapping a CST node key to an executor dispatch. */
export interface StatementRouteEntry {
  /** CST children key (e.g., 'printStatement', 'colorStatement') */
  cstKey: string
  /** Key of the executor field on StatementRouter (e.g., 'printExecutor') */
  executorField: ExecutorField
  /** How to dispatch the statement */
  strategy: DispatchStrategy
}

/**
 * Route entries for statements that follow a simple dispatch pattern.
 *
 * Complex statements (IF-THEN, FOR, NEXT, GOTO, GOSUB, RETURN, ON, END,
 * PAUSE, INPUT, LINPUT, DATA) are handled directly in StatementRouter because
 * they require custom control flow, state checks, or special return values.
 */
export const STATEMENT_ROUTES: readonly StatementRouteEntry[] = [
  // Print and variable assignment (no lineNumber)
  { cstKey: 'printStatement', executorField: 'printExecutor', strategy: 'sync' },
  { cstKey: 'letStatement', executorField: 'letExecutor', strategy: 'sync' },

  // Screen control (no lineNumber)
  { cstKey: 'clsStatement', executorField: 'clsExecutor', strategy: 'sync' },
  { cstKey: 'clearStatement', executorField: 'clearExecutor', strategy: 'sync' },
  { cstKey: 'beepStatement', executorField: 'beepExecutor', strategy: 'sync' },

  // Data management (no lineNumber)
  { cstKey: 'restoreStatement', executorField: 'restoreExecutor', strategy: 'sync' },

  // Array and variable operations (with lineNumber)
  { cstKey: 'dimStatement', executorField: 'dimExecutor', strategy: 'syncLine' },
  { cstKey: 'swapStatement', executorField: 'swapExecutor', strategy: 'syncLine' },
  { cstKey: 'readStatement', executorField: 'readExecutor', strategy: 'syncLine' },

  // Screen positioning (with lineNumber)
  { cstKey: 'locateStatement', executorField: 'locateExecutor', strategy: 'syncLine' },
  { cstKey: 'positionStatement', executorField: 'positionExecutor', strategy: 'syncLine' },

  // Color and palette (with lineNumber)
  { cstKey: 'colorStatement', executorField: 'colorExecutor', strategy: 'syncLine' },
  { cstKey: 'cgsetStatement', executorField: 'cgsetExecutor', strategy: 'syncLine' },
  { cstKey: 'cgenStatement', executorField: 'cgenExecutor', strategy: 'syncLine' },
  { cstKey: 'paletStatement', executorField: 'paletExecutor', strategy: 'syncLine' },

  // Sprite system (with lineNumber)
  { cstKey: 'defSpriteStatement', executorField: 'defSpriteExecutor', strategy: 'syncLine' },
  { cstKey: 'spriteStatement', executorField: 'spriteExecutor', strategy: 'syncLine' },
  { cstKey: 'spriteOnOffStatement', executorField: 'spriteOnOffExecutor', strategy: 'syncLine' },

  // Sprite animation (with lineNumber)
  { cstKey: 'defMoveStatement', executorField: 'defMoveExecutor', strategy: 'syncLine' },
  { cstKey: 'moveStatement', executorField: 'moveExecutor', strategy: 'syncLine' },
  { cstKey: 'cutStatement', executorField: 'cutExecutor', strategy: 'syncLine' },
  { cstKey: 'eraStatement', executorField: 'eraExecutor', strategy: 'syncLine' },

  // Display control (with lineNumber)
  { cstKey: 'viewStatement', executorField: 'viewExecutor', strategy: 'syncLine' },

  // Sound (async, with lineNumber)
  { cstKey: 'playStatement', executorField: 'playExecutor', strategy: 'asyncLine' },
  { cstKey: 'bgplayStatement', executorField: 'bgplayExecutor', strategy: 'asyncLine' },
] as const

/**
 * Build a lookup map from CST key to route entry for O(1) dispatch.
 */
function buildRouteLookup(): ReadonlyMap<string, StatementRouteEntry> {
  const map = new Map<string, StatementRouteEntry>()
  for (const route of STATEMENT_ROUTES) {
    map.set(route.cstKey, route)
  }
  return map
}

const ROUTE_LOOKUP = buildRouteLookup()

/**
 * Attempt to dispatch a simple statement using the route map.
 *
 * @returns `true` if the statement was dispatched, `false` if no route matched
 *   (caller should handle complex or unsupported statements)
 */
export function tryDispatchSimpleStatement(
  router: StatementRouter,
  stmtCst: CstNode,
  lineNumber: number
): boolean | Promise<boolean> {
  for (const cstKey of Object.keys(stmtCst.children)) {
    const route = ROUTE_LOOKUP.get(cstKey)
    if (!route) continue

    const node = stmtCst.children[cstKey]
    const stmtNode = Array.isArray(node) ? node[0] : node
    if (!stmtNode || !('name' in stmtNode)) continue // Skip tokens, only process CstNodes

    const executor = router[route.executorField] as DispatchableExecutor
    if (!executor) continue

    switch (route.strategy) {
      case 'sync':
        void executor.execute(stmtNode)
        return true
      case 'syncLine':
        void executor.execute(stmtNode, lineNumber)
        return true
      case 'asyncLine': {
        const result = executor.execute(stmtNode, lineNumber)
        if (result instanceof Promise) {
          return result.then(() => true)
        }
        return true
      }
    }
  }

  return false
}
