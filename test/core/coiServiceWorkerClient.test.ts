// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT } from '@/shared/constants/coiServiceWorker'

describe('coi-serviceworker-client', () => {
  const register = vi.fn()
  const addServiceWorkerListener = vi.fn()
  let loadHandler: (() => void | Promise<void>) | undefined

  beforeEach(() => {
    vi.resetModules()
    register.mockReset()
    addServiceWorkerListener.mockReset()
    loadHandler = undefined

    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value: false,
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        controller: null,
        addEventListener: addServiceWorkerListener,
      } satisfies Pick<ServiceWorkerContainer, 'register' | 'controller' | 'addEventListener'>,
    })

    const originalAddEventListener = window.addEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'load') {
        loadHandler = listener as () => void | Promise<void>
        return
      }
      originalAddEventListener(type, listener as EventListener, options)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: undefined,
    })
  })

  it('dispatches a UI warning event when registration fails', async () => {
    register.mockRejectedValueOnce(new Error('registration blocked'))
    const listener = vi.fn()
    window.addEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, listener)

    await import('@/coi-serviceworker-client')
    expect(loadHandler).toBeTypeOf('function')
    await loadHandler?.()

    expect(register).toHaveBeenCalledWith('/coi-serviceworker.js')
    expect(listener).toHaveBeenCalledTimes(1)
    const customEvent = listener.mock.calls[0]?.[0] as CustomEvent<{ errorMessage: string }>
    expect(customEvent.detail.errorMessage).toBe('registration blocked')

    window.removeEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, listener)
  })

  it('does not dispatch warning event when registration succeeds', async () => {
    register.mockResolvedValueOnce({ active: false })
    const listener = vi.fn()
    window.addEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, listener)

    await import('@/coi-serviceworker-client')
    expect(loadHandler).toBeTypeOf('function')
    await loadHandler?.()

    expect(register).toHaveBeenCalledWith('/coi-serviceworker.js')
    expect(listener).not.toHaveBeenCalled()
    expect(addServiceWorkerListener).toHaveBeenCalledWith('controllerchange', expect.any(Function))

    window.removeEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, listener)
  })

  it('skips registration when cross origin isolation is already enabled', async () => {
    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value: true,
    })

    await import('@/coi-serviceworker-client')
    expect(loadHandler).toBeUndefined()

    expect(register).not.toHaveBeenCalled()
    expect(addServiceWorkerListener).not.toHaveBeenCalled()
  })
})
