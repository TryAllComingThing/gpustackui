import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir: 'tests/acceptance', workers: 1, timeout: 240000,
 outputDir: 'artifacts/f6/acceptance-results',
 reporter: [['list'], ['html', { outputFolder: 'artifacts/f6/acceptance-report', open: 'never' }], ['json', { outputFile: 'artifacts/f6/acceptance-results.json' }]],
 use: { channel: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'en-US', timezoneId: 'UTC' },
 webServer: [
  { command: 'pnpm build:showcase && pnpm exec vite preview --outDir dist-showcase --host 127.0.0.1 --port 4182 --strictPort', url: 'http://127.0.0.1:4182/showcase/index.html', timeout: 120000 },
  { command: 'pnpm build:consumer && pnpm exec vite preview --config consumer-saas/vite.config.ts --host 127.0.0.1 --port 4183 --strictPort', url: 'http://127.0.0.1:4183', timeout: 120000 },
 ],
})
