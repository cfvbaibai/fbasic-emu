/**
 * Shared mock Worker infrastructure for WebWorkerManager tests.
 */

export interface MockWorkerLike {
  onerror: ((error: ErrorEvent) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onmessageerror: ((error: MessageEvent) => void) | null
  terminated: boolean
  postedMessages: unknown[]
  postMessage(message: unknown): void
  terminate(): void
}

/**
 * Create a mock worker class that satisfies both Worker and MockWorkerLike interfaces.
 */
export function createMockWorkerClass(): { new (...args: never[]): MockWorkerLike } {
  return class {
    onerror = null
    onmessage = null
    onmessageerror = null
    terminated = false
    postedMessages: unknown[] = []

    postMessage(message: unknown): void {
      this.postedMessages.push(message)
    }

    terminate(): void {
      this.terminated = true
    }
  }
}
