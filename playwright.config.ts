import { defineConfig, devices } from '@playwright/test'

const SERVE_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4317)
const VITE_PREVIEW_PORT = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4318)
const HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'serve',
      testMatch: '**/ide-*.pw.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://${HOST}:${SERVE_PORT}`,
      },
    },
    {
      name: 'vite-preview',
      testMatch: '**/built-preview-smoke.pw.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://${HOST}:${VITE_PREVIEW_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm preview:spa',
      url: `http://${HOST}:${SERVE_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm preview:vite',
      url: `http://${HOST}:${VITE_PREVIEW_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
