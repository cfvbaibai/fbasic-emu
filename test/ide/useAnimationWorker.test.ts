import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useAnimationWorker } from '@/features/ide/composables/useAnimationWorker'

type WorkerMessageHandler = (event: MessageEvent<unknown>) => void
type WorkerErrorHandler = (event: Event) => void

class MockWorker {
  static instances: MockWorker[] = []

  readonly postMessage = vi.fn()
  readonly terminate = vi.fn()

  private messageHandlers = new Set<WorkerMessageHandler>()
  private errorHandlers = new Set<WorkerErrorHandler>()

  constructor(_url: URL, _options: WorkerOptions) {
    MockWorker.instances.push(this)
  }

  addEventListener(type: 'message' | 'error', listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') {
      return
    }
    if (type === 'message') {
      this.messageHandlers.add(listener as WorkerMessageHandler)
      return
    }
    this.errorHandlers.add(listener as WorkerErrorHandler)
  }

  removeEventListener(type: 'message' | 'error', listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') {
      return
    }
    if (type === 'message') {
      this.messageHandlers.delete(listener as WorkerMessageHandler)
      return
    }
    this.errorHandlers.delete(listener as WorkerErrorHandler)
  }

  emitMessage(data: unknown): void {
    const event = { data } as MessageEvent<unknown>
    for (const handler of this.messageHandlers) {
      handler(event)
    }
  }

  emitError(message: string): void {
    const event = new ErrorEvent('error', { message })
    for (const handler of this.errorHandlers) {
      handler(event)
    }
  }
}

describe('useAnimationWorker', () => {
  beforeEach(() => {
    MockWorker.instances = []
    vi.stubGlobal('Worker', MockWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves initialize only after READY message', async () => {
    const onReady = vi.fn()
    const sharedAnimationBuffer = ref<SharedArrayBuffer | null>(new SharedArrayBuffer(64))
    const manager = useAnimationWorker({
      sharedAnimationBuffer,
      onReady,
    })

    const initializePromise = manager.initialize()
    await Promise.resolve()

    expect(manager.isInitializing.value).toBe(true)
    expect(manager.isReady.value).toBe(false)
    expect(onReady).not.toHaveBeenCalled()

    const worker = MockWorker.instances[0]
    expect(worker).toBeDefined()
    worker!.emitMessage({ type: 'READY' })
    await initializePromise

    expect(manager.isReady.value).toBe(true)
    expect(manager.isInitializing.value).toBe(false)
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(worker!.postMessage).toHaveBeenCalledWith({
      type: 'SET_SHARED_BUFFER',
      buffer: sharedAnimationBuffer.value,
    })
  })

  it('rejects initialize when worker errors before READY', async () => {
    const onError = vi.fn()
    const manager = useAnimationWorker({
      sharedAnimationBuffer: ref<SharedArrayBuffer | null>(new SharedArrayBuffer(64)),
      onError,
    })

    const initializePromise = manager.initialize()
    const worker = MockWorker.instances[0]
    expect(worker).toBeDefined()
    worker!.emitError('boom')

    await expect(initializePromise).rejects.toThrow('Animation Worker error: boom')
    expect(manager.isReady.value).toBe(false)
    expect(manager.isInitializing.value).toBe(false)
    expect(manager.initError.value?.message).toContain('Animation Worker error: boom')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('sends latest shared buffer after READY even when set during initialization', async () => {
    const sharedAnimationBuffer = ref<SharedArrayBuffer | null>(null)
    const manager = useAnimationWorker({
      sharedAnimationBuffer,
    })

    const initializePromise = manager.initialize()
    const worker = MockWorker.instances[0]
    expect(worker).toBeDefined()

    const nextBuffer = new SharedArrayBuffer(128)
    sharedAnimationBuffer.value = nextBuffer
    await nextTick()
    expect(worker!.postMessage).not.toHaveBeenCalled()

    worker!.emitMessage({ type: 'READY' })
    await initializePromise

    expect(worker!.postMessage).toHaveBeenCalledTimes(1)
    expect(worker!.postMessage).toHaveBeenCalledWith({
      type: 'SET_SHARED_BUFFER',
      buffer: nextBuffer,
    })
  })
})
