/**
 * INKEY$ Blocking Mode E2E Test
 *
 * Tests that the IDE can handle INKEY$(0) blocking mode by simulating
 * keyboard events via Playwright. The inkeyBlockingTest sample blocks
 * at INKEY$(0) waiting for a keypress, then loops until Q is pressed.
 *
 * Prerequisites:
 * - IDE must be in 'keyboard' input mode (not 'joystick')
 * - Program must be running (isRunning = true)
 * - Shared keyboard buffer must be initialized
 */

import { expect, test } from '@playwright/test'

/** Milliseconds to wait for the program to reach INKEY$(0) blocking point. */
const BLOCKING_WAIT_MS = 500

/** Milliseconds between key presses to allow the program to loop back. */
const KEY_PRESS_INTERVAL_MS = 300

/** Maximum time to wait for program completion after sending Q. */
const COMPLETION_TIMEOUT_MS = 5_000

test.describe('INKEY$ blocking mode', () => {
  test('program completes when keyboard sends H then Q', async ({ page }) => {
    // Track uncaught page errors to verify no runtime crashes
    const pageErrors: Error[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    // Navigate to IDE (full mode - not e2e=lite, which disables keyboard input)
    await page.goto('/#/ide')
    await page.waitForLoadState('networkidle')

    // Wait for IDE to fully initialize
    await expect(page.getByTestId('ide-screen-stage')).toBeVisible({ timeout: 30_000 })

    // Switch input mode from joystick (default) to keyboard for INKEY$ support
    await page.getByTestId('ide-keyboard-button').click()

    // Open sample selector dialog
    await page.getByTestId('ide-sample-selector-button').click()

    // Select the "interactive" category tab to find the inkeyBlockingTest sample
    await page.locator('.category-tab', { hasText: 'Interactive' }).click()

    // Click the inkeyBlockingTest sample card to load its code
    await page.locator('.sample-card[data-sample-key="inkeyBlockingTest"]').click()

    // Verify the sample selector closed after selection
    await expect(page.locator('.sample-selector-overlay')).not.toBeVisible()

    // Click the Run button to start program execution
    const runButton = page.getByTestId('ide-run-button')
    const stopButton = page.getByTestId('ide-stop-button')
    await runButton.click()

    // Wait for execution to start (stop button becomes enabled)
    await expect(stopButton).toBeEnabled({ timeout: 10_000 })

    // Wait for the program to reach the INKEY$(0) blocking call
    await page.waitForTimeout(BLOCKING_WAIT_MS)

    // Send 'H' key - program should read it, print "H (code 72)", then loop back
    await page.keyboard.press('H')

    // Wait for the program to loop back to the next INKEY$(0) call
    await page.waitForTimeout(KEY_PRESS_INTERVAL_MS)

    // Send 'Q' key - program should read it, detect Q, print "Done!", and END
    await page.keyboard.press('Q')

    // Wait for program to complete: run button should become enabled again
    await expect(runButton).toBeEnabled({ timeout: COMPLETION_TIMEOUT_MS })

    // Verify no uncaught page errors occurred during execution
    expect(
      pageErrors,
      `Unexpected page errors: ${pageErrors.map((e) => e.message).join(' | ')}`
    ).toEqual([])
  })
})
