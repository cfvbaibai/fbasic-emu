import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for built-preview smoke tests.
 *
 * Unlike playwright.config.ts (which uses `serve -s dist`), this config
 * uses `vite preview` to serve the production build. This is important
 * because `vite preview` more closely mirrors how GitHub Pages serves
 * the site, including proper handling of the base path.
 *
 * Usage:
 *   pnpm build
 *   pnpm exec playwright test --config=playwright.config.preview.ts
 */
const port = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4318)
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const baseURL = `http://${host}:${port}`

export default defineConfig({
  testDir: './test/e2e',
  testMatch: 'built-preview-smoke.pw.ts',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 90_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm preview:vite',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
