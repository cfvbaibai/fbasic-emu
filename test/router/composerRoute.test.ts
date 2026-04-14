// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RouteRecordNormalized } from 'vue-router'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'navigation.appTitle': 'F-BASIC IDE',
})

// Stub vue-i18n for router (needed by i18n module)
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
    locale: ref('en'),
  }),
  createI18n: vi.fn(() => ({})),
}))

describe('Router composer route', () => {
  it('has a /composer route with name Composer', async () => {
    const router = await import('@/router/index')
    const routes = router.default.getRoutes()

    const composerRoute = routes.find(
      (r: RouteRecordNormalized) => r.name === 'Composer',
    )

    expect(composerRoute).toBeDefined()
    expect(composerRoute!.path).toEqual('/composer')
  })

  it('has correct meta for the composer route', async () => {
    const router = await import('@/router/index')
    const routes = router.default.getRoutes()

    const composerRoute = routes.find(
      (r: RouteRecordNormalized) => r.name === 'Composer',
    )

    expect(composerRoute).toBeDefined()
    expect(composerRoute!.meta).toEqual({
      title: 'Composer',
      showInNav: true,
      icon: 'mdi:music-note',
      group: 'tools',
    })
  })
})
