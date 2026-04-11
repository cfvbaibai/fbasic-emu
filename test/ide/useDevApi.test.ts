// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h,ref } from 'vue'

import { useDevApi } from '@/features/ide/composables/useDevApi'

/**
 * Helper: mount a minimal component that calls useDevApi so that
 * onMounted / onUnmounted lifecycle hooks fire correctly.
 */
function mountWithDevApi(options: Parameters<typeof useDevApi>[0]) {
  const testHost = defineComponent({
    setup() {
      useDevApi(options)
      return () => h('div')
    },
  })
  return mount(testHost)
}

describe('useDevApi', () => {
  beforeEach(() => {
    window.__fbasicIDE = undefined
  })

  afterEach(() => {
    window.__fbasicIDE = undefined
  })

  it('exposes __fbasicIDE on window after mount', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    expect(window.__fbasicIDE).toBeDefined()
  })

  it('removes __fbasicIDE on unmount', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()

    const wrapper = mountWithDevApi({
      code,
      runCode,
      stopCode,
      pendingInputRequest,
      respondToInputRequest,
    })
    expect(window.__fbasicIDE).toBeDefined()

    wrapper.unmount()
    expect(window.__fbasicIDE).toBeUndefined()
  })

  it('loadCode sets the code ref value', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    window.__fbasicIDE!.loadCode('10 PRINT "HELLO"')
    expect(code.value).toEqual('10 PRINT "HELLO"')
  })

  it('run delegates to runCode', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    void window.__fbasicIDE!.run()
    expect(runCode).toHaveBeenCalledOnce()
  })

  it('stop delegates to stopCode', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    window.__fbasicIDE!.stop()
    expect(stopCode).toHaveBeenCalledOnce()
  })

  it('respondToInput sends value via respondToInputRequest when request is pending', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref({
      requestId: 'req-42',
      executionId: 'exec-1',
      prompt: '?',
      variableCount: 1,
      isLinput: false,
    })
    const respondToInputRequest = vi.fn()

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    window.__fbasicIDE!.respondToInput('hello')
    expect(respondToInputRequest).toHaveBeenCalledWith('req-42', ['hello'], false)
  })

  it('respondToInput warns and does nothing when no pending request', () => {
    const code = ref('')
    const runCode = vi.fn().mockResolvedValue(undefined)
    const stopCode = vi.fn()
    const pendingInputRequest = ref(null)
    const respondToInputRequest = vi.fn()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mountWithDevApi({ code, runCode, stopCode, pendingInputRequest, respondToInputRequest })

    window.__fbasicIDE!.respondToInput('hello')
    expect(respondToInputRequest).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[__fbasicIDE] respondToInput called but no pending input request',
    )

    warnSpy.mockRestore()
  })
})
