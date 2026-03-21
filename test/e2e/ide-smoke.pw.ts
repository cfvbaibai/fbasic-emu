import { expect, test } from '@playwright/test'

test('App boots and renders home feature cards', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('.features-grid .game-card')).toHaveCount(3)
  expect(pageErrors, `Unexpected page errors: ${pageErrors.map(err => err.message).join(' | ')}`).toEqual([])
})
