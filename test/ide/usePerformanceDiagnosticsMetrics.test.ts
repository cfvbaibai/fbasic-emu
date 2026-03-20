import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

import { usePerformanceDiagnosticsMetrics } from '@/features/ide/composables/usePerformanceDiagnosticsMetrics'

describe('usePerformanceDiagnosticsMetrics', () => {
  type DiagnosticsApi = ReturnType<typeof usePerformanceDiagnosticsMetrics>

  let now = 0

  beforeEach(() => {
    now = 0
    vi.useFakeTimers()
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function mountHarness(): {
    wrapper: ReturnType<typeof mount>
    api: DiagnosticsApi
    isRunning: { value: boolean }
    output: { value: string[] }
  } {
    const code = ref('')
    const isRunning = ref(false)
    const output = ref<string[]>([])
    const screenBuffer = ref({})
    const runCode = vi.fn(async () => {})

    let api: DiagnosticsApi | null = null

    const harnessComponent = defineComponent({
      setup() {
        api = usePerformanceDiagnosticsMetrics({
          code,
          runCode,
          isRunning,
          output,
          screenBuffer,
        })
        return () => null
      },
    })

    const wrapper = mount(harnessComponent)
    if (!api) {
      throw new Error('failed to initialize diagnostics metrics harness')
    }

    return {
      wrapper,
      api,
      isRunning,
      output,
    }
  }

  it('counts single-line output writes once', async () => {
    const { wrapper, api, isRunning, output } = mountHarness()

    isRunning.value = true
    await nextTick()

    output.value.push('one')
    await nextTick()

    now = 1000
    vi.advanceTimersByTime(100)

    expect(api.messagesPerSecond.value).toBe(1)
    wrapper.unmount()
  })

  it('counts batched output writes by batch size', async () => {
    const { wrapper, api, isRunning, output } = mountHarness()

    isRunning.value = true
    await nextTick()

    output.value.push('one', 'two')
    await nextTick()

    now = 1000
    vi.advanceTimersByTime(100)

    expect(api.messagesPerSecond.value).toBe(2)
    wrapper.unmount()
  })
})
