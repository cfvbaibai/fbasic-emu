type ScreenUpdateBatcherOptions = {
  targetFps?: number
  maxBatchDelayMs?: number
}

const DEFAULT_TARGET_FPS = 60
const DEFAULT_MAX_BATCH_DELAY_MS = 33

/**
 * Batches screen flush requests to align updates with a target frame rate.
 */
export class ScreenUpdateBatcher {
  private pendingScreenUpdate = false
  private screenUpdateTimeout: number | null = null
  private lastScreenUpdateTime = 0
  private readonly frameIntervalMs: number
  private readonly maxBatchDelayMs: number

  constructor(
    private readonly flushCallback: () => void,
    options: ScreenUpdateBatcherOptions = {}
  ) {
    const targetFps = options.targetFps ?? DEFAULT_TARGET_FPS
    this.frameIntervalMs = 1000 / targetFps
    this.maxBatchDelayMs = options.maxBatchDelayMs ?? DEFAULT_MAX_BATCH_DELAY_MS
  }

  schedule(): void {
    this.pendingScreenUpdate = true

    if (this.screenUpdateTimeout !== null) {
      return
    }

    const now = performance.now()
    const timeSinceLastUpdate = now - this.lastScreenUpdateTime

    if (timeSinceLastUpdate >= this.frameIntervalMs) {
      this.flush()
      return
    }

    const delayUntilNextFrame = this.frameIntervalMs - timeSinceLastUpdate
    const delay = Math.min(delayUntilNextFrame, this.maxBatchDelayMs)
    this.screenUpdateTimeout = self.setTimeout(() => {
      this.flush()
    }, delay)
  }

  cancel(): void {
    if (this.screenUpdateTimeout !== null) {
      self.clearTimeout(this.screenUpdateTimeout)
      this.screenUpdateTimeout = null
    }
    this.pendingScreenUpdate = false
  }

  flush(): void {
    this.screenUpdateTimeout = null
    if (!this.pendingScreenUpdate) {
      return
    }
    this.pendingScreenUpdate = false
    this.lastScreenUpdateTime = performance.now()
    this.flushCallback()
  }
}
