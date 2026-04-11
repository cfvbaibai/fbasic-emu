/**
 * InputModal Escape Key Dismissal E2E Test
 *
 * Tests that the InputModal can be dismissed by pressing the Escape key.
 * The "input" sample program triggers an INPUT statement which opens the
 * InputModal. Pressing Escape should cancel the input and dismiss the modal.
 *
 * Regression guard for PR #566 (Escape key dismissal support).
 * See issue #568.
 */

import { expect, test } from '@playwright/test'

test.describe('InputModal Escape dismissal', () => {
  test('Escape key dismisses the InputModal', async ({ page }) => {
    // Track uncaught page errors to verify no runtime crashes
    const pageErrors: Error[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    // Navigate to IDE (full mode — e2e=lite disables the runtime)
    await page.goto('/#/ide')
    await page.waitForLoadState('networkidle')

    // Wait for IDE to fully initialize
    await expect(page.getByTestId('ide-screen-stage')).toBeVisible({ timeout: 30_000 })

    // Open sample selector dialog
    await page.getByTestId('ide-sample-selector-button').click()

    // Select the "Basics" category tab to find the input sample
    await page.locator('.category-tab', { hasText: 'Basics' }).click()

    // Click the input sample card to load its code
    await page.locator('.sample-card[data-sample-key="input"]').click()

    // Verify the sample selector closed after selection
    await expect(page.locator('.sample-selector-overlay')).not.toBeVisible()

    // Click the Run button to start program execution
    const runButton = page.getByTestId('ide-run-button')
    await runButton.click()

    // Wait for the InputModal to appear (INPUT statement in the program)
    const inputModal = page.getByTestId('input-modal')
    await expect(inputModal).toBeVisible({ timeout: 10_000 })

    // Press Escape to dismiss the modal
    await page.keyboard.press('Escape')

    // Verify the InputModal is no longer visible
    await expect(inputModal).not.toBeVisible({ timeout: 5_000 })

    // Verify no uncaught page errors occurred
    expect(
      pageErrors,
      `Unexpected page errors: ${pageErrors.map((e) => e.message).join(' | ')}`
    ).toEqual([])
  })
})
