/**
 * Animation Worker Entry Point
 *
 * This worker manages sprite animation state as the SINGLE WRITER to the shared animation buffer.
 * Main thread becomes read-only for rendering.
 *
 * Communication:
 * - Main Thread → This Worker: postMessage (SET_SHARED_BUFFER initialization only)
 * - Executor Worker → This Worker: Direct sync via shared buffer (no message passing)
 * - This Worker → Main Thread: Writes sprite positions to shared buffer for rendering
 */

import { AnimationWorker } from './AnimationWorker'

const worker = new AnimationWorker()

// Listen for messages from Main Thread (initialization only)
// Animation commands come via shared buffer sync, not postMessage
self.onmessage = (event: MessageEvent) => {
  worker.handleMessage(event.data)
}

// Explicit startup handshake so main thread can gate readiness.
self.postMessage({ type: 'READY' })

// Export for type checking (no runtime effect in workers)
export {}
