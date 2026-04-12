import { computed, type Ref,ref } from 'vue'

interface UseTutorialPanelOptions {
  visible?: Ref<boolean>
  totalLessons?: number
}

interface UseTutorialPanelReturn {
  isVisible: Ref<boolean>
  currentIndex: Ref<number>
  hasPrev: Ref<boolean>
  hasNext: Ref<boolean>
  open: () => void
  close: () => void
  toggle: () => void
  goToNext: () => void
  goToPrev: () => void
}

export function useTutorialPanel(options: UseTutorialPanelOptions = {}): UseTutorialPanelReturn {
  const { visible, totalLessons = 0 } = options

  const internalVisible = ref(false)
  const isVisible = visible ?? internalVisible

  const currentIndex = ref(0)

  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => totalLessons === 0 || currentIndex.value < totalLessons - 1)

  function open(): void {
    if (visible) {
      visible.value = true
    } else {
      internalVisible.value = true
    }
  }

  function close(): void {
    if (visible) {
      visible.value = false
    } else {
      internalVisible.value = false
    }
  }

  function toggle(): void {
    if (isVisible.value) {
      close()
    } else {
      open()
    }
  }

  function goToNext(): void {
    if (hasNext.value) {
      currentIndex.value++
    }
  }

  function goToPrev(): void {
    if (hasPrev.value) {
      currentIndex.value--
    }
  }

  return {
    isVisible,
    currentIndex,
    hasPrev,
    hasNext,
    open,
    close,
    toggle,
    goToNext,
    goToPrev,
  }
}
