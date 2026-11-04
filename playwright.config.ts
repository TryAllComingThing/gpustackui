import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'tests', testMatch: '**/*.e2e.ts', workers: 1, timeout: 90000,
  use: { channel: 'chromium', baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'zh-CN', timezoneId: 'UTC' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
})
