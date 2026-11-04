import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/accessibility',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-accessibility', open: 'never' }]],
  use: { channel: 'chromium', ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4175' },
  webServer: {
    command: 'npm run build:showcase && npm exec -- vite preview --host 127.0.0.1 --port 4175 --strictPort --outDir dist-showcase',
    url: 'http://127.0.0.1:4175/showcase/index.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
