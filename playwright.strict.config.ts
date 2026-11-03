import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/strict',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-f4-strict', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4176',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'UTC',
    colorScheme: 'light',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm build:showcase && pnpm exec vite preview --host 127.0.0.1 --port 4176 --strictPort --outDir dist-showcase',
    url: 'http://127.0.0.1:4176/showcase/index.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
