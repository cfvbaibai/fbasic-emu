/**
 * Test Device Input Scheduler
 *
 * Manages scheduling and delivery of input events at specific frame boundaries.
 * Used by TestDeviceAdapter to provide timeline-based input simulation.
 *
 * Events are one-shot: once delivered at the target frame, they are removed.
 * Multiple events can be scheduled at the same frame.
 *
 * This module owns the scheduling data model and delivery orchestration.
 * The actual I/O mutations (setStickState, pushStrigState, setInkeyState)
 * are provided via callbacks, keeping this module decoupled from the adapter.
 */

import { logDevice } from '@/shared/logger'

// ============================================================================
// Types
// ============================================================================

/**
 * A single scheduled input event.
 *
 * Events are one-shot: once delivered at the target frame, they are removed.
 * Schedule multiple events at the same frame to combine stick, strig, and key.
 */
export interface ScheduledInputEvent {
  /** The frame number at which this input should be delivered. */
  atFrame: number
  /** STICK direction to set (e.g. 1=right, 2=left, 4=down, 8=up). */
  stick?: { player: number; direction: number }
  /** STRIG button to push (e.g. 1, 2, 4, 8 for A/B/Select/Start). */
  strig?: { player: number; button: number }
  /** Key character to set for INKEY$. */
  key?: string
}

/**
 * Result of delivering scheduled events at a frame boundary.
 * Used by tests to verify which events were delivered.
 */
export interface ScheduledInputDelivery {
  frame: number
  delivered: ScheduledInputEvent[]
}

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Extract and remove all scheduled events targeting the given frame.
 *
 * This is a pure function operating on the event list. It returns the
 * events that match the target frame and the remaining events (minus
 * those delivered).
 *
 * @param events - The current list of scheduled events
 * @param targetFrame - The frame number to deliver events for
 * @returns An object with the delivered events and the remaining events
 */
export function extractScheduledEvents(
  events: ScheduledInputEvent[],
  targetFrame: number
): { delivered: ScheduledInputEvent[]; remaining: ScheduledInputEvent[] } {
  const delivered: ScheduledInputEvent[] = []
  const remaining: ScheduledInputEvent[] = []

  for (const event of events) {
    if (event.atFrame === targetFrame) {
      delivered.push(event)
    } else {
      remaining.push(event)
    }
  }

  return { delivered, remaining }
}

// ============================================================================
// Callbacks Interface
// ============================================================================

/**
 * Callbacks for applying delivered input events to the device adapter.
 * Decouples the scheduler from the adapter's specific implementation.
 */
export interface InputDeliveryCallbacks {
  setStickState: (player: number, direction: number) => void
  pushStrigState: (player: number, button: number) => void
  setInkeyState: (keyChar: string) => void
}

// ============================================================================
// Scheduler Class
// ============================================================================

/**
 * Manages input event scheduling and frame-based delivery.
 *
 * Tracks a frame counter and a list of scheduled events. When the frame
 * is advanced, events matching the new frame are delivered via callbacks.
 */
export class TestDeviceInputScheduler {
  private currentFrame = 0
  private scheduledInputs: ScheduledInputEvent[] = []
  private readonly deliveryLog: ScheduledInputDelivery[] = []
  private readonly callbacks: InputDeliveryCallbacks

  constructor(callbacks: InputDeliveryCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Get the current frame counter value.
   */
  getCurrentFrame(): number {
    return this.currentFrame
  }

  /**
   * Set the frame counter to a specific value.
   * Does NOT deliver events for the target frame.
   */
  setCurrentFrame(frame: number): void {
    this.currentFrame = frame
    logDevice.debug('Frame counter set to:', frame)
  }

  /**
   * Schedule an input event to be delivered at a specific frame.
   */
  scheduleInput(event: ScheduledInputEvent): void {
    this.scheduledInputs.push(event)
    logDevice.debug('Input scheduled:', {
      atFrame: event.atFrame,
      stick: event.stick,
      strig: event.strig,
      key: event.key,
    })
  }

  /**
   * Schedule multiple input events at once.
   */
  scheduleInputs(events: ScheduledInputEvent[]): void {
    for (const event of events) {
      this.scheduleInput(event)
    }
  }

  /**
   * Advance the frame counter by 1 and deliver any scheduled input events
   * for the new frame.
   *
   * This is the primary hook for the test harness to drive frame-based
   * input delivery. Call this at each PAUSE boundary or frame tick.
   */
  advanceFrame(): ScheduledInputDelivery {
    this.currentFrame++
    return this.deliverScheduledEvents()
  }

  /**
   * Deliver any scheduled input events for the current frame.
   *
   * For each delivered event:
   * - stick: calls setStickState(player, direction)
   * - strig: calls pushStrigState(player, button)
   * - key: calls setInkeyState(key)
   *
   * Delivered events are removed from the schedule (one-shot).
   * The delivery is recorded in the delivery log for test assertions.
   */
  deliverScheduledEvents(): ScheduledInputDelivery {
    const { delivered, remaining } = extractScheduledEvents(
      this.scheduledInputs,
      this.currentFrame
    )
    this.scheduledInputs = remaining

    for (const event of delivered) {
      if (event.stick) {
        this.callbacks.setStickState(event.stick.player, event.stick.direction)
      }
      if (event.strig) {
        this.callbacks.pushStrigState(event.strig.player, event.strig.button)
      }
      if (event.key) {
        this.callbacks.setInkeyState(event.key)
      }
    }

    const delivery: ScheduledInputDelivery = {
      frame: this.currentFrame,
      delivered,
    }
    this.deliveryLog.push(delivery)

    if (delivered.length > 0) {
      logDevice.debug(
        'Scheduled inputs delivered at frame', this.currentFrame,
        ':', delivered.length, 'events'
      )
    }

    return delivery
  }

  /**
   * Clear all scheduled input events without delivering them.
   */
  clearScheduledInputs(): void {
    this.scheduledInputs = []
    logDevice.debug('All scheduled inputs cleared')
  }

  /**
   * Get the number of pending scheduled input events.
   */
  getScheduledInputCount(): number {
    return this.scheduledInputs.length
  }

  /**
   * Get a copy of all pending scheduled input events.
   */
  getScheduledInputs(): ScheduledInputEvent[] {
    return [...this.scheduledInputs]
  }

  /**
   * Get the delivery log (all past deliveries).
   */
  getDeliveryLog(): ScheduledInputDelivery[] {
    return [...this.deliveryLog]
  }

  /**
   * Reset all scheduler state: frame counter, scheduled events, and delivery log.
   */
  reset(): void {
    this.currentFrame = 0
    this.scheduledInputs = []
    this.deliveryLog.length = 0
  }
}
