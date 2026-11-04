import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/strict',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-strict', open: 'never' }]],
  use: {
    channel: 'chromium',
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4176',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'UTC',
    colorScheme: 'light',
  },
  webServer: {
    command: 'npm run build:showcase && npm exec -- vite preview --host 127.0.0.1 --port 4176 --strictPort --outDir dist-showcase',
    url: 'http://127.0.0.1:4176/showcase/index.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
