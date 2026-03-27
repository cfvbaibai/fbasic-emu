import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ConfirmDialog from '@/shared/components/ui/ConfirmDialog.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'common.confirmDialog.confirm': 'Confirm',
        'common.confirmDialog.cancel': 'Cancel',
      }
      return messages[key] ?? key
    },
  }),
}))

describe('ConfirmDialog', () => {
  let focusSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus')
  })

  it('auto-focuses confirm button when visible changes from false to true', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: false,
        title: 'Test Title',
        message: 'Test message',
      },
      attachTo: document.body,
    })

    // Dialog should not be visible initially
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    // Make dialog visible
    await wrapper.setProps({ visible: true })
    await nextTick()

    // Confirm button should exist
    const confirmBtn = wrapper.find('.confirm-dialog-btn-confirm')
    expect(confirmBtn.exists()).toBe(true)

    // The confirm button's focus() should have been called
    expect(focusSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
