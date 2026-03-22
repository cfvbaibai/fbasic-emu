import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import App from '@/App.vue'
import { COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT } from '@/shared/constants/coiServiceWorker'
import { reloadPage } from '@/shared/utils/reloadPage'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('en'),
  }),
}))

vi.mock('@/shared/composables/useSkin', () => ({
  useSkin: () => ({
    currentSkin: ref('default'),
  }),
}))

vi.mock('@/shared/utils/reloadPage', () => ({
  reloadPage: vi.fn(),
}))

describe('App', () => {
  const originalCrossOriginIsolated = window.crossOriginIsolated

  const setCrossOriginIsolated = (value: boolean) => {
    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value,
    })
  }

  afterEach(() => {
    setCrossOriginIsolated(originalCrossOriginIsolated)
    window.history.replaceState({}, '', '/')
    vi.restoreAllMocks()
  })

  it('shows warning banner on mount when cross-origin isolation is missing', async () => {
    setCrossOriginIsolated(false)

    const wrapper = mount(App)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not show warning banner on mount when cross-origin isolation is available', () => {
    setCrossOriginIsolated(true)

    const wrapper = mount(App)

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not show warning banner in e2e lite mode', async () => {
    setCrossOriginIsolated(false)
    window.history.replaceState({}, '', '/?e2e=lite')

    const wrapper = mount(App)

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(false)

    window.dispatchEvent(
      new CustomEvent(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, {
        detail: { errorMessage: 'registration blocked' },
      })
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows warning banner when coi registration failure event is received', async () => {
    setCrossOriginIsolated(true)
    const wrapper = mount(App)

    window.dispatchEvent(
      new CustomEvent(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, {
        detail: { errorMessage: 'registration blocked' },
      })
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('dismisses warning banner when dismiss button is clicked', async () => {
    const wrapper = mount(App)

    window.dispatchEvent(
      new CustomEvent(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, {
        detail: { errorMessage: 'registration blocked' },
      })
    )
    await wrapper.vm.$nextTick()

    const dismissButton = wrapper
      .findAll('button')
      .find(button => button.text().trim() === 'Dismiss')
    expect(dismissButton).toBeTruthy()

    await dismissButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.coi-warning-banner').exists()).toBe(false)
    wrapper.unmount()
  })

  it('reloads page when reload button is clicked', async () => {
    const wrapper = mount(App)

    window.dispatchEvent(
      new CustomEvent(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, {
        detail: { errorMessage: 'registration blocked' },
      })
    )
    await wrapper.vm.$nextTick()

    const reloadButton = wrapper
      .findAll('button')
      .find(button => button.text().trim() === 'Reload')
    expect(reloadButton).toBeTruthy()

    await reloadButton!.trigger('click')

    expect(reloadPage).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
