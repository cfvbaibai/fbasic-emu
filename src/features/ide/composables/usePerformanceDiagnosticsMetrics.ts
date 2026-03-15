/**
 * Performance diagnostics metrics: FPS, message/render rates, and CPU breakdown.
 * Used by PerformanceDiagnosticsPage; extracted to keep the page under max-lines.
 */

import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export const PERFORMANCE_TEST_SCENARIOS = {
  light: `10 CLS
20 FOR I=1 TO 50
30 PRINT "Test ";I
40 NEXT
50 END`,
  medium: `10 CLS
20 FOR I=1 TO 200
30 PRINT "Test iteration ";I;" with some text"
40 NEXT
50 END`,
  heavy: `10 CLS
20 FOR I=1 TO 500
30 PRINT "Loop ";I;" XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
40 NEXT
50 END`,
  infinite: `10 CLS
20 FOR I=1 TO 100
30 PRINT "Loop ";I
40 NEXT
50 GOTO 20`,
} as const

export type PerformanceScenarioKey = keyof typeof PERFORMANCE_TEST_SCENARIOS

export const RENDER_FPS_OPTIONS = [
  { label: '10 FPS', value: 10 },
  { label: '20 FPS', value: 20 },
  { label: '30 FPS', value: 30 },
  { label: '60 FPS', value: 60 },
]

export interface UsePerformanceDiagnosticsMetricsParams {
  code: Ref<string>
  runCode: () => Promise<void>
  isRunning: Ref<boolean>
  output: Ref<string[]>
  screenBuffer: Ref<unknown>
}

export function usePerformanceDiagnosticsMetrics({
  code,
  runCode,
  isRunning,
  output,
  screenBuffer,
}: UsePerformanceDiagnosticsMetricsParams) {
  const fps = ref(0)
  const messagesPerSecond = ref(0)
  const rendersPerSecond = ref(0)
  const workerTime = ref(0)
  const messageHandlingTime = ref(0)
  const renderTime = ref(0)
  const totalTime = ref(0)
  const renderingEnabled = ref<boolean>(true)
  const messageOutputEnabled = ref<boolean>(true)
  const renderFpsTarget = ref<number>(20)

  let startTime = 0
  let messageCount = 0
  let renderCount = 0
  let lastMetricsUpdate = 0
  let metricsInterval: number | null = null
  let fpsRafId: number | null = null
  let workerStartTime = 0
  let lastRenderSampleAt: number | null = null

  const workerTimePercent = computed(() =>
    totalTime.value === 0 ? 0 : Math.round((workerTime.value / totalTime.value) * 100)
  )
  const messageTimePercent = computed(() =>
    totalTime.value === 0 ? 0 : Math.round((messageHandlingTime.value / totalTime.value) * 100)
  )
  const renderTimePercent = computed(() =>
    totalTime.value === 0 ? 0 : Math.round((renderTime.value / totalTime.value) * 100)
  )
  const outputForDisplay = computed(() => (messageOutputEnabled.value ? output.value : []))

  let frameCount = 0
  let lastFpsTime = 0

  function trackFps(now: number): void {
    frameCount++
    if (now - lastFpsTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (now - lastFpsTime))
      frameCount = 0
      lastFpsTime = now
    }
    fpsRafId = requestAnimationFrame(trackFps)
  }

  function updateMetrics(): void {
    const now = performance.now()
    const elapsed = now - lastMetricsUpdate
    if (elapsed >= 1000) {
      messagesPerSecond.value = Math.round((messageCount * 1000) / elapsed)
      rendersPerSecond.value = Math.round((renderCount * 1000) / elapsed)
      messageCount = 0
      renderCount = 0
      lastMetricsUpdate = now
    }
  }

  async function runTest(scenario: PerformanceScenarioKey): Promise<void> {
    workerTime.value = 0
    messageHandlingTime.value = 0
    renderTime.value = 0
    totalTime.value = 0
    messageCount = 0
    renderCount = 0
    messagesPerSecond.value = 0
    rendersPerSecond.value = 0
    startTime = performance.now()
    lastMetricsUpdate = startTime
    code.value = PERFORMANCE_TEST_SCENARIOS[scenario]
    workerStartTime = performance.now()
    lastRenderSampleAt = null
    await runCode()
  }

  function clearMetrics(): void {
    workerTime.value = 0
    messageHandlingTime.value = 0
    renderTime.value = 0
    totalTime.value = 0
    messageCount = 0
    renderCount = 0
    messagesPerSecond.value = 0
    rendersPerSecond.value = 0
    fps.value = 0
    output.value = []
    lastRenderSampleAt = null
  }

  let measurementActive = false
  let renderSequence = 0
  let messageSequence = 0

  watch(
    () => isRunning.value,
    (running, wasRunning) => {
      if (running && !wasRunning) {
        performance.clearMarks()
        performance.clearMeasures()
        measurementActive = true
        workerStartTime = performance.now()
        lastRenderSampleAt = null
      } else if (!running && wasRunning) {
        measurementActive = false
        if (workerStartTime > 0) {
          workerTime.value = Math.round(performance.now() - workerStartTime)
        }
        const renderMeasures = performance
          .getEntriesByType('measure')
          .filter((m) => m.name.startsWith('render-'))
        renderTime.value = Math.round(renderMeasures.reduce((sum, m) => sum + m.duration, 0))
        const messageMeasures = performance
          .getEntriesByType('measure')
          .filter((m) => m.name.startsWith('message-'))
        messageHandlingTime.value = Math.round(
          messageMeasures.reduce((sum, m) => sum + m.duration, 0)
        )
      }
    }
  )

  watch(
    () => screenBuffer.value,
    () => {
      if (measurementActive && renderingEnabled.value) {
        const now = performance.now()
        const targetFps = Number.isFinite(renderFpsTarget.value) && renderFpsTarget.value > 0
          ? renderFpsTarget.value
          : 60
        const minIntervalMs = 1000 / targetFps
        if (lastRenderSampleAt !== null && now - lastRenderSampleAt < minIntervalMs) {
          return
        }
        lastRenderSampleAt = now
        performance.mark(`render-start-${renderSequence}`)
        renderCount++
        requestAnimationFrame(() => {
          performance.mark(`render-end-${renderSequence}`)
          try {
            performance.measure(
              `render-${renderSequence}`,
              `render-start-${renderSequence}`,
              `render-end-${renderSequence}`
            )
          } catch {
            // Ignore if marks don't exist
          }
          renderSequence++
        })
      }
    },
    { deep: true }
  )

  watch(
    () => output.value.length,
    (newLength, oldLength) => {
      const increment = Math.max(0, newLength - (oldLength ?? 0))
      if (measurementActive && increment > 0) {
        performance.mark(`message-start-${messageSequence}`)
        messageCount += increment
        setTimeout(() => {
          performance.mark(`message-end-${messageSequence}`)
          try {
            performance.measure(
              `message-${messageSequence}`,
              `message-start-${messageSequence}`,
              `message-end-${messageSequence}`
            )
          } catch {
            // Ignore if marks don't exist
          }
          messageSequence++
        }, 0)
      }
    }
  )

  onMounted(() => {
    lastFpsTime = performance.now()
    lastMetricsUpdate = lastFpsTime
    fpsRafId = requestAnimationFrame(trackFps)
    metricsInterval = window.setInterval(() => {
      updateMetrics()
      if (isRunning.value) {
        totalTime.value = Math.round(performance.now() - startTime)
      }
    }, 100)
  })

  onBeforeUnmount(() => {
    if (fpsRafId !== null) cancelAnimationFrame(fpsRafId)
    if (metricsInterval !== null) clearInterval(metricsInterval)
  })

  return {
    fps,
    messagesPerSecond,
    rendersPerSecond,
    workerTime,
    messageHandlingTime,
    renderTime,
    totalTime,
    workerTimePercent,
    messageTimePercent,
    renderTimePercent,
    renderingEnabled,
    messageOutputEnabled,
    renderFpsTarget,
    outputForDisplay,
    runTest,
    clearMetrics,
  }
}
