import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  timeout: 90_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-e2e', open: 'never' }]],
  use: {
    channel: 'chromium',
    baseURL: 'http://127.0.0.1:4183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    timezoneId: 'UTC',
  },
  webServer: {
    command: 'npm run build:e2e && npm exec -- vite preview --host 127.0.0.1 --port 4183 --strictPort --outDir dist-e2e',
    url: 'http://127.0.0.1:4183',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
