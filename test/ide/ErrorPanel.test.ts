// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import ErrorPanel from '@/features/ide/components/ErrorPanel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        'ide.output.errorLine': 'Line {line}',
        'ide.errorPanel.sourceLabel': 'At:',
        'ide.errorPanel.stackTrace': 'Stack trace',
      }
      let text = messages[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
  }),
}))

const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span class="game-icon-stub" :data-icon="icon" :data-size="size" />',
})

function createError(overrides: Partial<{
  line: number
  message: string
  type: string
  stack?: string
  sourceLine?: string
}> = {}) {
  return {
    line: 10,
    message: 'Syntax error',
    type: 'ParseError',
    ...overrides,
  }
}

describe('ErrorPanel', () => {
  it('renders nothing when errors is undefined', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: undefined },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders nothing when errors array is empty', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders error panel with single error', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError()] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-panel').exists()).toBe(true)
    expect(wrapper.findAll('.error-block').length).toEqual(1)
    expect(wrapper.find('.error-type').text()).toEqual('ParseError:')
    expect(wrapper.find('.error-message').text()).toEqual('Syntax error')
    wrapper.unmount()
  })

  it('renders multiple errors', () => {
    const wrapper = mount(ErrorPanel, {
      props: {
        errors: [
          createError({ type: 'ParseError', message: 'Bad syntax' }),
          createError({ type: 'RuntimeError', message: 'Division by zero' }),
        ],
      },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.findAll('.error-block').length).toEqual(2)
    wrapper.unmount()
  })

  it('shows line number when line is greater than 0', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError({ line: 42 })] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    const lineSpan = wrapper.find('.error-line-number')
    expect(lineSpan.exists()).toBe(true)
    expect(lineSpan.text()).toEqual('(Line 42)')
    wrapper.unmount()
  })

  it('hides line number when line is 0', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError({ line: 0 })] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-line-number').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hides line number when line is negative', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError({ line: -1 })] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-line-number').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows source line when provided', () => {
    const wrapper = mount(ErrorPanel, {
      props: {
        errors: [createError({
          sourceLine: '10 PRINT "Hello"',
        })],
      },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    const sourceDiv = wrapper.find('.error-source-line')
    expect(sourceDiv.exists()).toBe(true)
    expect(sourceDiv.find('code').text()).toEqual('10 PRINT "Hello"')
    expect(sourceDiv.find('.error-source-label').text()).toEqual('At:')
    wrapper.unmount()
  })

  it('hides source line section when sourceLine is not provided', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError({ sourceLine: undefined })] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('.error-source-line').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows stack trace in collapsible details when provided', () => {
    const wrapper = mount(ErrorPanel, {
      props: {
        errors: [createError({
          stack: 'at line 10\nat line 5',
        })],
      },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    const details = wrapper.find('details.error-stack-details')
    expect(details.exists()).toBe(true)
    expect(details.find('summary').text()).toEqual('Stack trace')
    expect(details.find('pre.error-stack').text()).toEqual('at line 10\nat line 5')
    wrapper.unmount()
  })

  it('hides stack trace section when stack is not provided', () => {
    const wrapper = mount(ErrorPanel, {
      props: { errors: [createError({ stack: undefined })] },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    expect(wrapper.find('details.error-stack-details').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders GameIcon for each error', () => {
    const wrapper = mount(ErrorPanel, {
      props: {
        errors: [
          createError({ type: 'Error1' }),
          createError({ type: 'Error2' }),
        ],
      },
      global: { stubs: { GameIcon: gameIconStub } },
    })

    const icons = wrapper.findAll('.game-icon-stub')
    expect(icons.length).toEqual(2)
    wrapper.unmount()
  })
})
