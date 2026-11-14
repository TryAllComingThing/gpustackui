import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/production-accessibility',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-production-accessibility', open: 'never' }]],
  use: {
    channel: 'chromium',
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4177',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'UTC',
  },
  webServer: {
    command: 'npm run build:e2e && npm exec -- vite preview --host 127.0.0.1 --port 4177 --strictPort --outDir dist-e2e',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
