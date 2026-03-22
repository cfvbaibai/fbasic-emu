import { expect, test } from '@playwright/test'

/**
 * Built-preview smoke test.
 *
 * This test runs against the *production build* served via `vite preview`
 * rather than the dev server. It catches prod-only runtime errors such as
 * Rollup chunk ordering issues, Monaco TDZ violations, and missing assets
 * that do NOT reproduce in dev mode.
 *
 * The test intentionally collects ALL uncaught page errors
 * so that any runtime regression is surfaced immediately.
 */

test.describe('built-preview smoke', () => {
  test('IDE boots without runtime errors on production build', async ({ page }) => {
    const pageErrors: Error[] = []

    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    await page.goto('/#/ide')
    await page.waitForLoadState('networkidle')

    // Verify key IDE UI elements rendered (proves the app booted successfully)
    await expect(page.getByTestId('monaco-editor-container')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByTestId('ide-screen-stage')).toBeVisible()
    await expect(page.getByTestId('ide-run-button')).toBeVisible()

    // Fail on any uncaught runtime errors (TDZ, missing exports, etc.)
    expect(
      pageErrors,
      `Production build has uncaught page errors: ${pageErrors.map((e) => e.message).join(' | ')}`
    ).toEqual([])
  })

  test('Home page boots without runtime errors on production build', async ({ page }) => {
    const pageErrors: Error[] = []

    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.features-grid .game-card')).toHaveCount(3, {
      timeout: 30_000,
    })

    expect(
      pageErrors,
      `Production build has uncaught page errors: ${pageErrors.map((e) => e.message).join(' | ')}`
    ).toEqual([])
  })
})
