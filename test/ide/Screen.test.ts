// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import Screen from '@/features/ide/components/Screen.vue'

import { LOCAL_STORAGE_SYNC_DELAY_MS } from '../helpers/constants'

// Mock useScreenContext to satisfy Screen.vue's provide/inject dependency
vi.mock('@/features/ide/composables/useScreenContext', () => ({
  useScreenContext: () => ({
    screenBuffer: ref([]),
    cursorX: ref(0),
    cursorY: ref(0),
    bgPalette: ref(1),
    backdropColor: ref(0),
    spritePalette: ref(1),
    cgenMode: ref(0),
    spriteStates: ref([]),
    spriteEnabled: ref(false),
    movementPositionsFromBuffer: ref(new Map()),
    externalFrontSpriteNodes: ref(new Map()),
    externalBackSpriteNodes: ref(new Map()),
    sharedDisplayViews: ref(undefined),
    sharedDisplayBufferAccessor: null,
    sharedAnimationBuffer: ref(undefined),
    sharedJoystickBuffer: ref(undefined),
    setDecodedScreenState: vi.fn(),
    registerCallbacks: {
      registerScheduleRender: vi.fn(),
      registerInvalidateBackgroundBuffer: vi.fn(),
    },
    updateInspectorMoveSlots: vi.fn(),
  }),
}))

// Mock useAnimationWorker — Screen.vue calls this but we don't need animation in tests
vi.mock('@/features/ide/composables/useAnimationWorker', () => ({
  useAnimationWorker: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn(),
  }),
}))

// Mock useScreenAnimationLoopRenderOnly — heavy dependency not needed for this test
vi.mock('@/features/ide/composables/useScreenAnimationLoopRenderOnly', () => ({
  useScreenAnimationLoopRenderOnly: () => vi.fn(),
}))

// Mock canvas background renderer — avoids DOM canvas creation in tests
vi.mock('@/features/ide/composables/useCanvasBackgroundRenderer', () => ({
  preInitializeBackgroundTiles: () => Promise.resolve(),
  renderBackgroundToCanvas: vi.fn(),
  renderBackgroundToCanvasDirty: vi.fn(),
}))

// Mock Konva screen renderer — avoids Konva initialization in tests
vi.mock('@/features/ide/composables/useKonvaScreenRenderer', () => ({
  initializeKonvaLayers: () => ({
    backdropLayer: null,
    spriteBackLayer: null,
    backgroundLayer: null,
    spriteFrontLayer: null,
  }),
  renderAllScreenLayers: vi.fn().mockResolvedValue({
    frontSpriteNodes: new Map(),
    backSpriteNodes: new Map(),
  }),
}))

// Stub vue-konva components to avoid Konva canvas in tests
// v-stage must expose getNode()/getStage() to prevent errors in initializeKonva
const vStageStub = {
  template: '<div class="v-stage-stub"><slot /></div>',
  methods: {
    getNode: vi.fn(() => null),
    getStage: vi.fn(() => null),
  },
}
const vLayerStub = {
  template: '<div class="v-layer-stub"><slot /></div>',
}
const vRectStub = {
  template: '<div class="v-rect-stub" />',
}

// Stub DebugGridOverlay
vi.mock('@/features/ide/components/DebugGridOverlay.vue', () => ({
  default: {
    template: '<div class="debug-grid-overlay-stub" />',
  },
}))

describe.each([
  { className: 'crt-scanlines', label: 'scanline' },
  { className: 'crt-phosphor-glow', label: 'phosphor glow' },
  { className: 'crt-color-bleed', label: 'color bleeding' },
])('Screen - $label filter integration', ({ className }) => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it(`hides ${className} when filterEnabled is false (default)`, () => {
    wrapper = mount(Screen, {
      global: {
        stubs: {
          'v-stage': vStageStub,
          'v-layer': vLayerStub,
          'v-rect': vRectStub,
        },
      },
    })

    expect(wrapper.find('.screen-display').exists()).toEqual(true)
    expect(wrapper.find(`.${className}`).exists()).toEqual(false)
  })

  it(`shows ${className} when filterEnabled is true`, async () => {
    localStorage.setItem('fbasic-screen-filter', 'true')

    wrapper = mount(Screen, {
      global: {
        stubs: {
          'v-stage': vStageStub,
          'v-layer': vLayerStub,
          'v-rect': vRectStub,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, LOCAL_STORAGE_SYNC_DELAY_MS))

    expect(wrapper.find(`.${className}`).exists()).toEqual(true)
  })

  it('hides crt-vignette when filterEnabled is false (default)', () => {
    wrapper = mount(Screen, {
      global: {
        stubs: {
          'v-stage': vStageStub,
          'v-layer': vLayerStub,
          'v-rect': vRectStub,
        },
      },
    })

    expect(wrapper.find('.screen-display').exists()).toEqual(true)
    expect(wrapper.find('.crt-vignette').exists()).toEqual(false)
  })

  it('shows crt-vignette when filterEnabled is true', async () => {
    localStorage.setItem('fbasic-screen-filter', 'true')

    wrapper = mount(Screen, {
      global: {
        stubs: {
          'v-stage': vStageStub,
          'v-layer': vLayerStub,
          'v-rect': vRectStub,
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve, LOCAL_STORAGE_SYNC_DELAY_MS))

    expect(wrapper.find('.crt-vignette').exists()).toEqual(true)
  })
})
