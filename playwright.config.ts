import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4317)
const host = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.pw.ts',
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
    command: 'pnpm preview:spa',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
