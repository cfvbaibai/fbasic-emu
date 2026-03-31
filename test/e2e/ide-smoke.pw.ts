import { expect, test } from '@playwright/test'

test('App boots and renders home hero section', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('.hero-cta')).toBeVisible()
  expect(pageErrors, `Unexpected page errors: ${pageErrors.map(err => err.message).join(' | ')}`).toEqual([])
})

test('IDE boots and key components mount', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error)
  })

  await page.goto('/#/ide')
  await page.waitForLoadState('networkidle')

  await expect(page.getByTestId('monaco-editor-container')).toBeVisible()
  await expect(page.getByTestId('ide-screen-stage')).toBeVisible()
  await expect(page.getByTestId('ide-run-button')).toBeVisible()
  await expect(page.getByTestId('ide-stop-button')).toBeVisible()

  expect(pageErrors, `Unexpected page errors: ${pageErrors.map(err => err.message).join(' | ')}`).toEqual([])
})

test('IDE run button is enabled and clickable', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error)
  })

  await page.goto('/#/ide')
  await page.waitForLoadState('networkidle')

  const runButton = page.getByTestId('ide-run-button')
  await expect(runButton).toBeEnabled()
  await runButton.click()

  // After clicking run, stop button should become enabled
  const stopButton = page.getByTestId('ide-stop-button')
  await expect(stopButton).toBeEnabled({ timeout: 10_000 })

  // Click stop to return to idle state
  await stopButton.click()
  await expect(page.getByTestId('ide-run-button')).toBeEnabled({ timeout: 10_000 })

  expect(pageErrors, `Unexpected page errors: ${pageErrors.map(err => err.message).join(' | ')}`).toEqual([])
})
