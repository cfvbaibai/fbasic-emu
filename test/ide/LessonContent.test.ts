// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import LessonContent from '@/features/ide/components/LessonContent.vue'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.tutorial.tryIt': 'Try It',
      }
      return messages[key] ?? key
    },
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fencedBlock(code: string, lang?: string): string {
  const opener = lang != null ? `\`\`\`${lang}` : '```'
  return `${opener}\n${code}\n\`\`\``
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LessonContent', () => {
  it('renders empty state when no content prop is provided', () => {
    const wrapper = mount(LessonContent, {
      props: { content: '' },
    })

    const root = wrapper.find('[data-testid="lesson-content"]')
    expect(root.exists()).toBe(true)
    expect(root.text()).toEqual('')
    wrapper.unmount()
  })

  it('renders plain markdown text as paragraph', () => {
    const wrapper = mount(LessonContent, {
      props: { content: 'Hello, this is a lesson.' },
    })

    expect(wrapper.text()).toContain('Hello, this is a lesson.')
    wrapper.unmount()
  })

  it('renders markdown headings', () => {
    const content = '# Title\n## Subtitle\n### Subsubtitle'
    const wrapper = mount(LessonContent, {
      props: { content },
    })

    const heading = wrapper.find('h1')
    const subHeading = wrapper.find('h2')
    const subSubHeading = wrapper.find('h3')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toEqual('Title')
    expect(subHeading.exists()).toBe(true)
    expect(subHeading.text()).toEqual('Subtitle')
    expect(subSubHeading.exists()).toBe(true)
    expect(subSubHeading.text()).toEqual('Subsubtitle')
    wrapper.unmount()
  })

  it('renders markdown bold and italic inline', () => {
    const wrapper = mount(LessonContent, {
      props: { content: 'This is **bold** and this is *italic*.' },
    })

    const html = wrapper.html()
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    wrapper.unmount()
  })

  it('renders inline code with code element', () => {
    const wrapper = mount(LessonContent, {
      props: { content: 'Use the `PRINT` command.' },
    })

    const code = wrapper.find('code')
    expect(code.exists()).toBe(true)
    expect(code.text()).toEqual('PRINT')
    wrapper.unmount()
  })

  it('renders fenced code block with pre and code elements', () => {
    const codeContent = '10 PRINT "HELLO"\n20 GOTO 10'
    const markdown = fencedBlock(codeContent, 'basic')
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const pre = wrapper.find('pre')
    const code = wrapper.find('pre code')
    expect(pre.exists()).toBe(true)
    expect(code.exists()).toBe(true)
    expect(code.text()).toEqual(codeContent)
    wrapper.unmount()
  })

  it('renders Try It button for each fenced code block', () => {
    const code1 = '10 PRINT "HELLO"'
    const code2 = '10 CLS'
    const markdown = `${fencedBlock(code1, 'basic')}\n\nSome text\n\n${fencedBlock(code2, 'basic')}`
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const tryButtons = wrapper.findAll('[data-testid="lesson-try-it-button"]')
    expect(tryButtons).toHaveLength(2)
    wrapper.unmount()
  })

  it('emits tryCode event with correct code when Try It button is clicked', async () => {
    const codeContent = '10 PRINT "HELLO"\n20 END'
    const markdown = fencedBlock(codeContent, 'basic')
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const tryButton = wrapper.find('[data-testid="lesson-try-it-button"]')
    await tryButton.trigger('click')

    const emitted = wrapper.emitted<{ code: string[] }>('tryCode')
    expect(emitted).toBeDefined()
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([codeContent])
    wrapper.unmount()
  })

  it('emits tryCode with correct code for the second code block', async () => {
    const code1 = '10 PRINT "FIRST"'
    const code2 = '20 PRINT "SECOND"'
    const markdown = `${fencedBlock(code1, 'basic')}\n\n${fencedBlock(code2, 'basic')}`
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const tryButtons = wrapper.findAll('[data-testid="lesson-try-it-button"]')
    expect(tryButtons[1]).toBeDefined()
    await tryButtons[1]!.trigger('click')

    const emitted = wrapper.emitted<{ code: string[] }>('tryCode')
    expect(emitted).toBeDefined()
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([code2])
    wrapper.unmount()
  })

  it('does not render Try It button for code blocks without content', () => {
    const markdown = '```\n```'
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const tryButtons = wrapper.findAll('[data-testid="lesson-try-it-button"]')
    expect(tryButtons).toHaveLength(0)
    wrapper.unmount()
  })

  it('renders Try It button with i18n label', () => {
    const markdown = fencedBlock('10 PRINT "HI"', 'basic')
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const tryButton = wrapper.find('[data-testid="lesson-try-it-button"]')
    expect(tryButton.text()).toEqual('Try It')
    wrapper.unmount()
  })

  it('renders multiple paragraphs separated by blank lines', () => {
    const markdown = 'First paragraph.\n\nSecond paragraph.'
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const paragraphs = wrapper.findAll('p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]!.text()).toEqual('First paragraph.')
    expect(paragraphs[1]!.text()).toEqual('Second paragraph.')
    wrapper.unmount()
  })

  it('renders code block without language tag as a regular code block', () => {
    const codeContent = '10 PRINT "HELLO"'
    const markdown = fencedBlock(codeContent)
    const wrapper = mount(LessonContent, {
      props: { content: markdown },
    })

    const pre = wrapper.find('pre')
    const code = wrapper.find('pre code')
    expect(pre.exists()).toBe(true)
    expect(code.exists()).toBe(true)
    expect(code.text()).toEqual(codeContent)
    wrapper.unmount()
  })
})
