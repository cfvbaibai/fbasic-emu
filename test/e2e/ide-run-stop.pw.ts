import { expect, test } from '@playwright/test'

test('ide run/stop buttons toggle state', async ({ page }) => {
  await page.goto('/ide?e2e=lite')

  const runButton = page.getByTestId('ide-run-button')
  const stopButton = page.getByTestId('ide-stop-button')

  await expect(runButton).toBeVisible({ timeout: 30_000 })
  await expect(runButton).toBeEnabled()
  await expect(stopButton).toBeDisabled()

  await runButton.click()
  await expect(stopButton).toBeEnabled()
  await expect(runButton).toBeDisabled()

  await stopButton.click()
  await expect(runButton).toBeEnabled()
})
