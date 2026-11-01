import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/accessibility',
  timeout: 30000,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4175' },
  webServer: {
    command: 'pnpm build:showcase && pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort --outDir dist-showcase',
    url: 'http://127.0.0.1:4175/showcase/index.html',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
