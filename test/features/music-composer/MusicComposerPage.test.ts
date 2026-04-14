// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { type Component,defineComponent } from 'vue'

// Stub GameLayout to avoid pulling in GameNavigation and its heavy deps
const gameLayoutStub = defineComponent({
  name: 'GameLayout',
  template: '<div class="game-layout-stub"><slot /></div>',
})

vi.mock('@/shared/components/ui', () => ({
  GameLayout: gameLayoutStub,
}))

// Stub vue-i18n with inline translations
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'musicComposer.title': 'Music Composer',
      }
      return messages[key] ?? key
    },
    locale: ref('en'),
  }),
}))

// Stub vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/composer' }),
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MusicComposerPage', () => {
  it('mounts with component name MusicComposerPage', async () => {
    const { default: pageComponent } = (await import(
      '@/features/music-composer/MusicComposerPage.vue'
    )) as { default: Component }

    const wrapper = mount(pageComponent, {
      global: {
        stubs: {
          GameLayout: gameLayoutStub,
          RouterView: true,
        },
      },
    })

    const vm = wrapper.vm as { $options: { name: string } }
    expect(vm.$options.name).toEqual('MusicComposerPage')
    wrapper.unmount()
  })

  it('renders a heading with translated text "Music Composer"', async () => {
    const { default: pageComponent } = (await import(
      '@/features/music-composer/MusicComposerPage.vue'
    )) as { default: Component }

    const wrapper = mount(pageComponent, {
      global: {
        stubs: {
          GameLayout: gameLayoutStub,
          RouterView: true,
        },
      },
    })

    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toEqual('Music Composer')
    wrapper.unmount()
  })

  it('uses GameLayout as root container', async () => {
    const { default: pageComponent } = (await import(
      '@/features/music-composer/MusicComposerPage.vue'
    )) as { default: Component }

    const wrapper = mount(pageComponent, {
      global: {
        stubs: {
          GameLayout: gameLayoutStub,
          RouterView: true,
        },
      },
    })

    expect(wrapper.find('.game-layout-stub').exists()).toBe(true)
    wrapper.unmount()
  })
})
